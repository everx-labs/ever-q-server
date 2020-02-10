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
}

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

function getManagementAccessKey(_x10, _x11, _x12) {
  return _getManagementAccessKey.apply(this, arguments);
} // Mutation


function _getManagementAccessKey() {
  _getManagementAccessKey = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee7(_parent, args, context) {
    return _regenerator["default"].wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            return _context7.abrupt("return", context.auth.getManagementAccessKey());

          case 1:
          case "end":
            return _context7.stop();
        }
      }
    }, _callee7);
  }));
  return _getManagementAccessKey.apply(this, arguments);
}

function postRequestsUsingRest(_x13, _x14) {
  return _postRequestsUsingRest.apply(this, arguments);
}

function _postRequestsUsingRest() {
  _postRequestsUsingRest = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee8(requests, context) {
    var config, url, response, message;
    return _regenerator["default"].wrap(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            config = context.config.requests;
            url = "".concat((0, _config.ensureProtocol)(config.server, 'http'), "/topics/").concat(config.topic);
            _context8.next = 4;
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
            response = _context8.sent;

            if (!(response.status !== 200)) {
              _context8.next = 12;
              break;
            }

            _context8.t0 = "Post requests failed: ";
            _context8.next = 9;
            return response.text();

          case 9:
            _context8.t1 = _context8.sent;
            message = _context8.t0.concat.call(_context8.t0, _context8.t1);
            throw new Error(message);

          case 12:
          case "end":
            return _context8.stop();
        }
      }
    }, _callee8);
  }));
  return _postRequestsUsingRest.apply(this, arguments);
}

function postRequestsUsingKafka(_x15, _x16, _x17) {
  return _postRequestsUsingKafka.apply(this, arguments);
}

function _postRequestsUsingKafka() {
  _postRequestsUsingKafka = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee12(requests, context, span) {
    var ensureShared, config, producer, messages;
    return _regenerator["default"].wrap(function _callee12$(_context12) {
      while (1) {
        switch (_context12.prev = _context12.next) {
          case 0:
            ensureShared =
            /*#__PURE__*/
            function () {
              var _ref6 = (0, _asyncToGenerator2["default"])(
              /*#__PURE__*/
              _regenerator["default"].mark(function _callee9(name, createValue) {
                var value;
                return _regenerator["default"].wrap(function _callee9$(_context9) {
                  while (1) {
                    switch (_context9.prev = _context9.next) {
                      case 0:
                        if (!context.shared.has(name)) {
                          _context9.next = 2;
                          break;
                        }

                        return _context9.abrupt("return", context.shared.get(name));

                      case 2:
                        _context9.next = 4;
                        return createValue();

                      case 4:
                        value = _context9.sent;
                        context.shared.set(name, value);
                        return _context9.abrupt("return", value);

                      case 7:
                      case "end":
                        return _context9.stop();
                    }
                  }
                }, _callee9);
              }));

              return function ensureShared(_x27, _x28) {
                return _ref6.apply(this, arguments);
              };
            }();

            config = context.config.requests;
            _context12.next = 4;
            return ensureShared('producer',
            /*#__PURE__*/
            (0, _asyncToGenerator2["default"])(
            /*#__PURE__*/
            _regenerator["default"].mark(function _callee11() {
              var kafka, newProducer;
              return _regenerator["default"].wrap(function _callee11$(_context11) {
                while (1) {
                  switch (_context11.prev = _context11.next) {
                    case 0:
                      _context11.next = 2;
                      return ensureShared('kafka',
                      /*#__PURE__*/
                      (0, _asyncToGenerator2["default"])(
                      /*#__PURE__*/
                      _regenerator["default"].mark(function _callee10() {
                        return _regenerator["default"].wrap(function _callee10$(_context10) {
                          while (1) {
                            switch (_context10.prev = _context10.next) {
                              case 0:
                                return _context10.abrupt("return", new _kafkajs.Kafka({
                                  clientId: 'q-server',
                                  brokers: [config.server]
                                }));

                              case 1:
                              case "end":
                                return _context10.stop();
                            }
                          }
                        }, _callee10);
                      })));

                    case 2:
                      kafka = _context11.sent;
                      newProducer = kafka.producer();
                      _context11.next = 6;
                      return newProducer.connect();

                    case 6:
                      return _context11.abrupt("return", newProducer);

                    case 7:
                    case "end":
                      return _context11.stop();
                  }
                }
              }, _callee11);
            })));

          case 4:
            producer = _context12.sent;
            messages = requests.map(function (request) {
              var keyBuffer = Buffer.from(request.id, 'base64');
              var traceBuffer = Buffer.from([]);
              context.db.tracer.inject(span, _opentracing.FORMAT_BINARY, traceBuffer);
              return {
                key: Buffer.concat([keyBuffer, traceBuffer]),
                value: Buffer.from(request.body, 'base64')
              };
            });
            _context12.next = 8;
            return producer.send({
              topic: config.topic,
              messages: messages
            });

          case 8:
          case "end":
            return _context12.stop();
        }
      }
    }, _callee12);
  }));
  return _postRequestsUsingKafka.apply(this, arguments);
}

function postRequests(_x18, _x19, _x20) {
  return _postRequests.apply(this, arguments);
}

function _postRequests() {
  _postRequests = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee14(_, args, context) {
    var requests, tracer;
    return _regenerator["default"].wrap(function _callee14$(_context14) {
      while (1) {
        switch (_context14.prev = _context14.next) {
          case 0:
            requests = args.requests;

            if (requests) {
              _context14.next = 3;
              break;
            }

            return _context14.abrupt("return", []);

          case 3:
            tracer = context.db.tracer;
            return _context14.abrupt("return", _tracer.QTracer.trace(tracer, "postRequests",
            /*#__PURE__*/
            function () {
              var _ref9 = (0, _asyncToGenerator2["default"])(
              /*#__PURE__*/
              _regenerator["default"].mark(function _callee13(span) {
                return _regenerator["default"].wrap(function _callee13$(_context13) {
                  while (1) {
                    switch (_context13.prev = _context13.next) {
                      case 0:
                        span.setTag('params', requests);
                        _context13.next = 3;
                        return context.auth.requireGrantedAccess(context.accessKey || args.accessKey);

                      case 3:
                        _context13.prev = 3;

                        if (!(context.config.requests.mode === 'rest')) {
                          _context13.next = 9;
                          break;
                        }

                        _context13.next = 7;
                        return postRequestsUsingRest(requests, context);

                      case 7:
                        _context13.next = 11;
                        break;

                      case 9:
                        _context13.next = 11;
                        return postRequestsUsingKafka(requests, context, span);

                      case 11:
                        context.db.log.debug('postRequests', 'POSTED', args, context.remoteAddress);
                        _context13.next = 18;
                        break;

                      case 14:
                        _context13.prev = 14;
                        _context13.t0 = _context13["catch"](3);
                        context.db.log.debug('postRequests', 'FAILED', args, context.remoteAddress);
                        throw _context13.t0;

                      case 18:
                        return _context13.abrupt("return", requests.map(function (x) {
                          return x.id;
                        }));

                      case 19:
                      case "end":
                        return _context13.stop();
                    }
                  }
                }, _callee13, null, [[3, 14]]);
              }));

              return function (_x29) {
                return _ref9.apply(this, arguments);
              };
            }(), context.parentSpan));

          case 5:
          case "end":
            return _context14.stop();
        }
      }
    }, _callee14);
  }));
  return _postRequests.apply(this, arguments);
}

function registerAccessKeys(_x21, _x22, _x23) {
  return _registerAccessKeys.apply(this, arguments);
}

function _registerAccessKeys() {
  _registerAccessKeys = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee15(_, args, context) {
    return _regenerator["default"].wrap(function _callee15$(_context15) {
      while (1) {
        switch (_context15.prev = _context15.next) {
          case 0:
            return _context15.abrupt("return", context.auth.registerAccessKeys(args.account || '', args.keys || [], args.signedManagementAccessKey || ''));

          case 1:
          case "end":
            return _context15.stop();
        }
      }
    }, _callee15);
  }));
  return _registerAccessKeys.apply(this, arguments);
}

function revokeAccessKeys(_x24, _x25, _x26) {
  return _revokeAccessKeys.apply(this, arguments);
}

function _revokeAccessKeys() {
  _revokeAccessKeys = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee16(_, args, context) {
    return _regenerator["default"].wrap(function _callee16$(_context16) {
      while (1) {
        switch (_context16.prev = _context16.next) {
          case 0:
            return _context16.abrupt("return", context.auth.revokeAccessKeys(args.account || '', args.keys || [], args.signedManagementAccessKey || ''));

          case 1:
          case "end":
            return _context16.stop();
        }
      }
    }, _callee16);
  }));
  return _revokeAccessKeys.apply(this, arguments);
}

var resolversCustom = {
  Query: {
    info: info,
    getAccountsCount: getAccountsCount,
    getTransactionsCount: getTransactionsCount,
    getAccountsTotalBalance: getAccountsTotalBalance,
    getManagementAccessKey: getManagementAccessKey
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9yZXNvbHZlcnMtY3VzdG9tLmpzIl0sIm5hbWVzIjpbImlzT2JqZWN0IiwidGVzdCIsIm92ZXJyaWRlT2JqZWN0Iiwib3JpZ2luYWwiLCJvdmVycmlkZXMiLCJPYmplY3QiLCJlbnRyaWVzIiwiZm9yRWFjaCIsIm5hbWUiLCJvdmVycmlkZVZhbHVlIiwiaW5mbyIsInBrZyIsIkpTT04iLCJwYXJzZSIsImZzIiwicmVhZEZpbGVTeW5jIiwicGF0aCIsInJlc29sdmUiLCJfX2Rpcm5hbWUiLCJ2ZXJzaW9uIiwiZ2V0QWNjb3VudHNDb3VudCIsIl9wYXJlbnQiLCJhcmdzIiwiY29udGV4dCIsInRyYWNlciIsImRiIiwiUVRyYWNlciIsInRyYWNlIiwiYXV0aCIsInJlcXVpcmVHcmFudGVkQWNjZXNzIiwiYWNjZXNzS2V5IiwicXVlcnkiLCJyZXN1bHQiLCJjb3VudHMiLCJsZW5ndGgiLCJnZXRQYXJlbnRTcGFuIiwiZ2V0VHJhbnNhY3Rpb25zQ291bnQiLCJnZXRBY2NvdW50c1RvdGFsQmFsYW5jZSIsInBhcnRzIiwiQmlnSW50IiwiaHMiLCJscyIsInRvU3RyaW5nIiwiZ2V0TWFuYWdlbWVudEFjY2Vzc0tleSIsInBvc3RSZXF1ZXN0c1VzaW5nUmVzdCIsInJlcXVlc3RzIiwiY29uZmlnIiwidXJsIiwic2VydmVyIiwidG9waWMiLCJtZXRob2QiLCJtb2RlIiwiY2FjaGUiLCJjcmVkZW50aWFscyIsImhlYWRlcnMiLCJyZWRpcmVjdCIsInJlZmVycmVyIiwiYm9keSIsInN0cmluZ2lmeSIsInJlY29yZHMiLCJtYXAiLCJyZXF1ZXN0Iiwia2V5IiwiaWQiLCJ2YWx1ZSIsInJlc3BvbnNlIiwic3RhdHVzIiwidGV4dCIsIm1lc3NhZ2UiLCJFcnJvciIsInBvc3RSZXF1ZXN0c1VzaW5nS2Fma2EiLCJzcGFuIiwiZW5zdXJlU2hhcmVkIiwiY3JlYXRlVmFsdWUiLCJzaGFyZWQiLCJoYXMiLCJnZXQiLCJzZXQiLCJLYWZrYSIsImNsaWVudElkIiwiYnJva2VycyIsImthZmthIiwibmV3UHJvZHVjZXIiLCJwcm9kdWNlciIsImNvbm5lY3QiLCJtZXNzYWdlcyIsImtleUJ1ZmZlciIsIkJ1ZmZlciIsImZyb20iLCJ0cmFjZUJ1ZmZlciIsImluamVjdCIsIkZPUk1BVF9CSU5BUlkiLCJjb25jYXQiLCJzZW5kIiwicG9zdFJlcXVlc3RzIiwiXyIsInNldFRhZyIsImxvZyIsImRlYnVnIiwicmVtb3RlQWRkcmVzcyIsIngiLCJwYXJlbnRTcGFuIiwicmVnaXN0ZXJBY2Nlc3NLZXlzIiwiYWNjb3VudCIsImtleXMiLCJzaWduZWRNYW5hZ2VtZW50QWNjZXNzS2V5IiwicmV2b2tlQWNjZXNzS2V5cyIsInJlc29sdmVyc0N1c3RvbSIsIlF1ZXJ5IiwiTXV0YXRpb24iLCJhdHRhY2hDdXN0b21SZXNvbHZlcnMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBRUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBRUEsU0FBU0EsUUFBVCxDQUFrQkMsSUFBbEIsRUFBc0M7QUFDbEMsU0FBTyx5QkFBT0EsSUFBUCxNQUFnQixRQUFoQixJQUE0QkEsSUFBSSxLQUFLLElBQTVDO0FBQ0g7O0FBRUQsU0FBU0MsY0FBVCxDQUF3QkMsUUFBeEIsRUFBdUNDLFNBQXZDLEVBQXVEO0FBQ25EQyxFQUFBQSxNQUFNLENBQUNDLE9BQVAsQ0FBZUYsU0FBZixFQUEwQkcsT0FBMUIsQ0FBa0MsZ0JBQTJCO0FBQUE7QUFBQSxRQUF6QkMsSUFBeUI7QUFBQSxRQUFuQkMsYUFBbUI7O0FBQ3pELFFBQUtELElBQUksSUFBSUwsUUFBVCxJQUFzQkgsUUFBUSxDQUFDUyxhQUFELENBQTlCLElBQWlEVCxRQUFRLENBQUNHLFFBQVEsQ0FBQ0ssSUFBRCxDQUFULENBQTdELEVBQStFO0FBQzNFTixNQUFBQSxjQUFjLENBQUNDLFFBQVEsQ0FBQ0ssSUFBRCxDQUFULEVBQWlCQyxhQUFqQixDQUFkO0FBQ0gsS0FGRCxNQUVPO0FBQ0hOLE1BQUFB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LEVBQUU7QUFDSGxHLElBQUFBLElBQUksRUFBSkEsSUFERztBQUVIVSxJQUFBQSxnQkFBZ0IsRUFBaEJBLGdCQUZHO0FBR0hnQixJQUFBQSxvQkFBb0IsRUFBcEJBLG9CQUhHO0FBSUhDLElBQUFBLHVCQUF1QixFQUF2QkEsdUJBSkc7QUFLSE0sSUFBQUEsc0JBQXNCLEVBQXRCQTtBQUxHLEdBRGE7QUFRcEJrRSxFQUFBQSxRQUFRLEVBQUU7QUFDTmYsSUFBQUEsWUFBWSxFQUFaQSxZQURNO0FBRU5RLElBQUFBLGtCQUFrQixFQUFsQkEsa0JBRk07QUFHTkksSUFBQUEsZ0JBQWdCLEVBQWhCQTtBQUhNO0FBUlUsQ0FBeEI7O0FBZU8sU0FBU0kscUJBQVQsQ0FBK0IzRyxRQUEvQixFQUFtRDtBQUN0REQsRUFBQUEsY0FBYyxDQUFDQyxRQUFELEVBQVd3RyxlQUFYLENBQWQ7QUFDQSxTQUFPeEcsUUFBUDtBQUNIIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQGZsb3dcblxuaW1wb3J0IGZzIGZyb20gXCJmc1wiO1xuaW1wb3J0IHsgS2Fma2EsIFByb2R1Y2VyIH0gZnJvbSBcImthZmthanNcIjtcbmltcG9ydCB7IFNwYW4sIEZPUk1BVF9CSU5BUlkgfSBmcm9tICdvcGVudHJhY2luZyc7XG5pbXBvcnQgQXJhbmdvIGZyb20gXCIuL2FyYW5nb1wiO1xuaW1wb3J0IHR5cGUgeyBHcmFwaFFMUmVxdWVzdENvbnRleHQgfSBmcm9tIFwiLi9hcmFuZ28tY29sbGVjdGlvblwiO1xuaW1wb3J0IHsgZW5zdXJlUHJvdG9jb2wgfSBmcm9tIFwiLi9jb25maWdcIjtcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IGZldGNoIGZyb20gJ25vZGUtZmV0Y2gnO1xuaW1wb3J0IHsgUVRyYWNlciB9IGZyb20gXCIuL3RyYWNlclwiO1xuXG5mdW5jdGlvbiBpc09iamVjdCh0ZXN0OiBhbnkpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdHlwZW9mIHRlc3QgPT09ICdvYmplY3QnICYmIHRlc3QgIT09IG51bGw7XG59XG5cbmZ1bmN0aW9uIG92ZXJyaWRlT2JqZWN0KG9yaWdpbmFsOiBhbnksIG92ZXJyaWRlczogYW55KSB7XG4gICAgT2JqZWN0LmVudHJpZXMob3ZlcnJpZGVzKS5mb3JFYWNoKChbbmFtZSwgb3ZlcnJpZGVWYWx1ZV0pID0+IHtcbiAgICAgICAgaWYgKChuYW1lIGluIG9yaWdpbmFsKSAmJiBpc09iamVjdChvdmVycmlkZVZhbHVlKSAmJiBpc09iamVjdChvcmlnaW5hbFtuYW1lXSkpIHtcbiAgICAgICAgICAgIG92ZXJyaWRlT2JqZWN0KG9yaWdpbmFsW25hbWVdLCBvdmVycmlkZVZhbHVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG9yaWdpbmFsW25hbWVdID0gb3ZlcnJpZGVWYWx1ZTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG50eXBlIEluZm8gPSB7XG4gICAgdmVyc2lvbjogc3RyaW5nLFxufVxuXG50eXBlIFJlcXVlc3QgPSB7XG4gICAgaWQ6IHN0cmluZyxcbiAgICBib2R5OiBzdHJpbmcsXG59XG5cbnR5cGUgR3JhcGhRTFJlcXVlc3RDb250ZXh0RXggPSBHcmFwaFFMUmVxdWVzdENvbnRleHQgJiB7XG4gICAgZGI6IEFyYW5nbyxcbn1cblxuLy8gUXVlcnlcblxuZnVuY3Rpb24gaW5mbygpOiBJbmZvIHtcbiAgICBjb25zdCBwa2cgPSBKU09OLnBhcnNlKChmcy5yZWFkRmlsZVN5bmMocGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4uJywgJy4uJywgJ3BhY2thZ2UuanNvbicpKTogYW55KSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdmVyc2lvbjogcGtnLnZlcnNpb24sXG4gICAgfTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZ2V0QWNjb3VudHNDb3VudChfcGFyZW50LCBhcmdzLCBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHRFeCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgY29uc3QgdHJhY2VyID0gY29udGV4dC5kYi50cmFjZXI7XG4gICAgcmV0dXJuIFFUcmFjZXIudHJhY2UodHJhY2VyLCAnZ2V0QWNjb3VudHNDb3VudCcsIGFzeW5jICgpID0+IHtcbiAgICAgICAgYXdhaXQgY29udGV4dC5hdXRoLnJlcXVpcmVHcmFudGVkQWNjZXNzKGNvbnRleHQuYWNjZXNzS2V5IHx8IGFyZ3MuYWNjZXNzS2V5KTtcbiAgICAgICAgY29uc3QgcmVzdWx0OiBhbnkgPSBhd2FpdCBjb250ZXh0LmRiLnF1ZXJ5KGBSRVRVUk4gTEVOR1RIKGFjY291bnRzKWAsIHt9KTtcbiAgICAgICAgY29uc3QgY291bnRzID0gKHJlc3VsdDogbnVtYmVyW10pO1xuICAgICAgICByZXR1cm4gY291bnRzLmxlbmd0aCA+IDAgPyBjb3VudHNbMF0gOiAwO1xuICAgIH0sIFFUcmFjZXIuZ2V0UGFyZW50U3Bhbih0cmFjZXIsIGNvbnRleHQpKVxufVxuXG5hc3luYyBmdW5jdGlvbiBnZXRUcmFuc2FjdGlvbnNDb3VudChfcGFyZW50LCBhcmdzLCBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHRFeCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgY29uc3QgdHJhY2VyID0gY29udGV4dC5kYi50cmFjZXI7XG4gICAgcmV0dXJuIFFUcmFjZXIudHJhY2UodHJhY2VyLCAnZ2V0VHJhbnNhY3Rpb25zQ291bnQnLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGF3YWl0IGNvbnRleHQuYXV0aC5yZXF1aXJlR3JhbnRlZEFjY2Vzcyhjb250ZXh0LmFjY2Vzc0tleSB8fCBhcmdzLmFjY2Vzc0tleSk7XG4gICAgICAgIGNvbnN0IHJlc3VsdDogYW55ID0gYXdhaXQgY29udGV4dC5kYi5xdWVyeShgUkVUVVJOIExFTkdUSCh0cmFuc2FjdGlvbnMpYCwge30pO1xuICAgICAgICBjb25zdCBjb3VudHMgPSAocmVzdWx0OiBudW1iZXJbXSk7XG4gICAgICAgIHJldHVybiBjb3VudHMubGVuZ3RoID4gMCA/IGNvdW50c1swXSA6IDA7XG4gICAgfSwgUVRyYWNlci5nZXRQYXJlbnRTcGFuKHRyYWNlciwgY29udGV4dCkpXG59XG5cbmFzeW5jIGZ1bmN0aW9uIGdldEFjY291bnRzVG90YWxCYWxhbmNlKF9wYXJlbnQsIGFyZ3MsIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dEV4KTogUHJvbWlzZTxTdHJpbmc+IHtcbiAgICBjb25zdCB0cmFjZXIgPSBjb250ZXh0LmRiLnRyYWNlcjtcbiAgICByZXR1cm4gUVRyYWNlci50cmFjZSh0cmFjZXIsICdnZXRBY2NvdW50c1RvdGFsQmFsYW5jZScsIGFzeW5jICgpID0+IHtcbiAgICAgICAgYXdhaXQgY29udGV4dC5hdXRoLnJlcXVpcmVHcmFudGVkQWNjZXNzKGNvbnRleHQuYWNjZXNzS2V5IHx8IGFyZ3MuYWNjZXNzS2V5KTtcbiAgICAgICAgLypcbiAgICAgICAgQmVjYXVzZSBhcmFuZ28gY2FuIG5vdCBzdW0gQmlnSW50J3Mgd2UgbmVlZCB0byBzdW0gc2VwYXJhdGVseTpcbiAgICAgICAgaHMgPSBTVU0gb2YgaGlnaCBiaXRzIChmcm9tIDI0LWJpdCBhbmQgaGlnaGVyKVxuICAgICAgICBscyA9IFNVTSBvZiBsb3dlciAyNCBiaXRzXG4gICAgICAgIEFuZCB0aGUgdG90YWwgcmVzdWx0IGlzIChocyA8PCAyNCkgKyBsc1xuICAgICAgICAgKi9cbiAgICAgICAgY29uc3QgcmVzdWx0OiBhbnkgPSBhd2FpdCBjb250ZXh0LmRiLnF1ZXJ5KGBcbiAgICAgICAgICAgIExFVCBkID0gMTY3NzcyMTZcbiAgICAgICAgICAgIEZPUiBhIGluIGFjY291bnRzXG4gICAgICAgICAgICBMRVQgYiA9IFRPX05VTUJFUihDT05DQVQoXCIweFwiLCBTVUJTVFJJTkcoYS5iYWxhbmNlLCAyKSkpXG4gICAgICAgICAgICBDT0xMRUNUIEFHR1JFR0FURVxuICAgICAgICAgICAgICAgIGhzID0gU1VNKEZMT09SKGIgLyBkKSksXG4gICAgICAgICAgICAgICAgbHMgPSBTVU0oYiAlIChkIC0gMSkpXG4gICAgICAgICAgICBSRVRVUk4geyBocywgbHMgfVxuICAgICAgICBgLCB7fSk7XG4gICAgICAgIGNvbnN0IHBhcnRzID0gKHJlc3VsdDogeyBoczogbnVtYmVyLCBsczogbnVtYmVyIH1bXSlbMF07XG4gICAgICAgIC8vJEZsb3dGaXhNZVxuICAgICAgICByZXR1cm4gKEJpZ0ludChwYXJ0cy5ocykgKiBCaWdJbnQoMHgxMDAwMDAwKSArIEJpZ0ludChwYXJ0cy5scykpLnRvU3RyaW5nKCk7XG4gICAgfSwgUVRyYWNlci5nZXRQYXJlbnRTcGFuKHRyYWNlciwgY29udGV4dCkpXG59XG5cbmFzeW5jIGZ1bmN0aW9uIGdldE1hbmFnZW1lbnRBY2Nlc3NLZXkoX3BhcmVudCwgYXJncywgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0RXgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHJldHVybiBjb250ZXh0LmF1dGguZ2V0TWFuYWdlbWVudEFjY2Vzc0tleSgpO1xufVxuXG4vLyBNdXRhdGlvblxuXG5hc3luYyBmdW5jdGlvbiBwb3N0UmVxdWVzdHNVc2luZ1Jlc3QocmVxdWVzdHM6IFJlcXVlc3RbXSwgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0RXgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBjb25maWcgPSBjb250ZXh0LmNvbmZpZy5yZXF1ZXN0cztcbiAgICBjb25zdCB1cmwgPSBgJHtlbnN1cmVQcm90b2NvbChjb25maWcuc2VydmVyLCAnaHR0cCcpfS90b3BpY3MvJHtjb25maWcudG9waWN9YDtcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKHVybCwge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgbW9kZTogJ2NvcnMnLFxuICAgICAgICBjYWNoZTogJ25vLWNhY2hlJyxcbiAgICAgICAgY3JlZGVudGlhbHM6ICdzYW1lLW9yaWdpbicsXG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgIH0sXG4gICAgICAgIHJlZGlyZWN0OiAnZm9sbG93JyxcbiAgICAgICAgcmVmZXJyZXI6ICduby1yZWZlcnJlcicsXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgIHJlY29yZHM6IHJlcXVlc3RzLm1hcCgocmVxdWVzdCkgPT4gKHtcbiAgICAgICAgICAgICAgICBrZXk6IHJlcXVlc3QuaWQsXG4gICAgICAgICAgICAgICAgdmFsdWU6IHJlcXVlc3QuYm9keSxcbiAgICAgICAgICAgIH0pKSxcbiAgICAgICAgfSksXG4gICAgfSk7XG4gICAgaWYgKHJlc3BvbnNlLnN0YXR1cyAhPT0gMjAwKSB7XG4gICAgICAgIGNvbnN0IG1lc3NhZ2UgPSBgUG9zdCByZXF1ZXN0cyBmYWlsZWQ6ICR7YXdhaXQgcmVzcG9uc2UudGV4dCgpfWA7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihtZXNzYWdlKTtcbiAgICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHBvc3RSZXF1ZXN0c1VzaW5nS2Fma2EocmVxdWVzdHM6IFJlcXVlc3RbXSwgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0RXgsIHNwYW46IFNwYW4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBlbnN1cmVTaGFyZWQgPSBhc3luYyAobmFtZSwgY3JlYXRlVmFsdWU6ICgpID0+IFByb21pc2U8YW55PikgPT4ge1xuICAgICAgICBpZiAoY29udGV4dC5zaGFyZWQuaGFzKG5hbWUpKSB7XG4gICAgICAgICAgICByZXR1cm4gY29udGV4dC5zaGFyZWQuZ2V0KG5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHZhbHVlID0gYXdhaXQgY3JlYXRlVmFsdWUoKTtcbiAgICAgICAgY29udGV4dC5zaGFyZWQuc2V0KG5hbWUsIHZhbHVlKTtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH07XG5cbiAgICBjb25zdCBjb25maWcgPSBjb250ZXh0LmNvbmZpZy5yZXF1ZXN0cztcbiAgICBjb25zdCBwcm9kdWNlcjogUHJvZHVjZXIgPSBhd2FpdCBlbnN1cmVTaGFyZWQoJ3Byb2R1Y2VyJywgYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBrYWZrYTogS2Fma2EgPSBhd2FpdCBlbnN1cmVTaGFyZWQoJ2thZmthJywgYXN5bmMgKCkgPT4gbmV3IEthZmthKHtcbiAgICAgICAgICAgIGNsaWVudElkOiAncS1zZXJ2ZXInLFxuICAgICAgICAgICAgYnJva2VyczogW2NvbmZpZy5zZXJ2ZXJdXG4gICAgICAgIH0pKTtcbiAgICAgICAgY29uc3QgbmV3UHJvZHVjZXIgPSBrYWZrYS5wcm9kdWNlcigpO1xuICAgICAgICBhd2FpdCBuZXdQcm9kdWNlci5jb25uZWN0KCk7XG4gICAgICAgIHJldHVybiBuZXdQcm9kdWNlcjtcblxuICAgIH0pO1xuICAgIGNvbnN0IG1lc3NhZ2VzID0gcmVxdWVzdHMubWFwKChyZXF1ZXN0KSA9PiB7XG4gICAgICAgIGNvbnN0IGtleUJ1ZmZlciA9IEJ1ZmZlci5mcm9tKHJlcXVlc3QuaWQsICdiYXNlNjQnKTtcbiAgICAgICAgY29uc3QgdHJhY2VCdWZmZXIgPSBCdWZmZXIuZnJvbShbXSk7XG4gICAgICAgIGNvbnRleHQuZGIudHJhY2VyLmluamVjdChzcGFuLCBGT1JNQVRfQklOQVJZLCB0cmFjZUJ1ZmZlcik7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBrZXk6IEJ1ZmZlci5jb25jYXQoW2tleUJ1ZmZlciwgdHJhY2VCdWZmZXJdKSxcbiAgICAgICAgICAgIHZhbHVlOiBCdWZmZXIuZnJvbShyZXF1ZXN0LmJvZHksICdiYXNlNjQnKSxcbiAgICAgICAgfTtcbiAgICB9KTtcbiAgICBhd2FpdCBwcm9kdWNlci5zZW5kKHtcbiAgICAgICAgdG9waWM6IGNvbmZpZy50b3BpYyxcbiAgICAgICAgbWVzc2FnZXMsXG4gICAgfSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHBvc3RSZXF1ZXN0cyhfLCBhcmdzOiB7IHJlcXVlc3RzOiBSZXF1ZXN0W10sIGFjY2Vzc0tleT86IHN0cmluZyB9LCBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHRFeCk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICBjb25zdCByZXF1ZXN0czogPyhSZXF1ZXN0W10pID0gYXJncy5yZXF1ZXN0cztcbiAgICBpZiAoIXJlcXVlc3RzKSB7XG4gICAgICAgIHJldHVybiBbXTtcbiAgICB9XG5cbiAgICBjb25zdCB0cmFjZXIgPSBjb250ZXh0LmRiLnRyYWNlcjtcbiAgICByZXR1cm4gUVRyYWNlci50cmFjZSh0cmFjZXIsIFwicG9zdFJlcXVlc3RzXCIsIGFzeW5jIChzcGFuOiBTcGFuKSA9PiB7XG4gICAgICAgIHNwYW4uc2V0VGFnKCdwYXJhbXMnLCByZXF1ZXN0cyk7XG4gICAgICAgIGF3YWl0IGNvbnRleHQuYXV0aC5yZXF1aXJlR3JhbnRlZEFjY2Vzcyhjb250ZXh0LmFjY2Vzc0tleSB8fCBhcmdzLmFjY2Vzc0tleSk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAoY29udGV4dC5jb25maWcucmVxdWVzdHMubW9kZSA9PT0gJ3Jlc3QnKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgcG9zdFJlcXVlc3RzVXNpbmdSZXN0KHJlcXVlc3RzLCBjb250ZXh0KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgcG9zdFJlcXVlc3RzVXNpbmdLYWZrYShyZXF1ZXN0cywgY29udGV4dCwgc3Bhbik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb250ZXh0LmRiLmxvZy5kZWJ1ZygncG9zdFJlcXVlc3RzJywgJ1BPU1RFRCcsIGFyZ3MsIGNvbnRleHQucmVtb3RlQWRkcmVzcyk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb250ZXh0LmRiLmxvZy5kZWJ1ZygncG9zdFJlcXVlc3RzJywgJ0ZBSUxFRCcsIGFyZ3MsIGNvbnRleHQucmVtb3RlQWRkcmVzcyk7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVxdWVzdHMubWFwKHggPT4geC5pZCk7XG4gICAgfSwgY29udGV4dC5wYXJlbnRTcGFuKTtcbn1cblxudHlwZSBSZWdpc3RyYXRpb25BcmdzID0ge1xuICAgIGFjY291bnQ/OiBzdHJpbmcsXG4gICAga2V5cz86IHN0cmluZ1tdLFxuICAgIHNpZ25lZE1hbmFnZW1lbnRBY2Nlc3NLZXk/OiBzdHJpbmcsXG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJlZ2lzdGVyQWNjZXNzS2V5cyhfLCBhcmdzOiBSZWdpc3RyYXRpb25BcmdzLCBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHRFeCwpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIHJldHVybiBjb250ZXh0LmF1dGgucmVnaXN0ZXJBY2Nlc3NLZXlzKFxuICAgICAgICBhcmdzLmFjY291bnQgfHwgJycsXG4gICAgICAgIGFyZ3Mua2V5cyB8fCBbXSxcbiAgICAgICAgYXJncy5zaWduZWRNYW5hZ2VtZW50QWNjZXNzS2V5IHx8ICcnKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gcmV2b2tlQWNjZXNzS2V5cyhfLCBhcmdzOiBSZWdpc3RyYXRpb25BcmdzLCBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHRFeCwpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIHJldHVybiBjb250ZXh0LmF1dGgucmV2b2tlQWNjZXNzS2V5cyhcbiAgICAgICAgYXJncy5hY2NvdW50IHx8ICcnLFxuICAgICAgICBhcmdzLmtleXMgfHwgW10sXG4gICAgICAgIGFyZ3Muc2lnbmVkTWFuYWdlbWVudEFjY2Vzc0tleSB8fCAnJyk7XG59XG5cbmNvbnN0IHJlc29sdmVyc0N1c3RvbSA9IHtcbiAgICBRdWVyeToge1xuICAgICAgICBpbmZvLFxuICAgICAgICBnZXRBY2NvdW50c0NvdW50LFxuICAgICAgICBnZXRUcmFuc2FjdGlvbnNDb3VudCxcbiAgICAgICAgZ2V0QWNjb3VudHNUb3RhbEJhbGFuY2UsXG4gICAgICAgIGdldE1hbmFnZW1lbnRBY2Nlc3NLZXksXG4gICAgfSxcbiAgICBNdXRhdGlvbjoge1xuICAgICAgICBwb3N0UmVxdWVzdHMsXG4gICAgICAgIHJlZ2lzdGVyQWNjZXNzS2V5cyxcbiAgICAgICAgcmV2b2tlQWNjZXNzS2V5cyxcbiAgICB9LFxufTtcblxuZXhwb3J0IGZ1bmN0aW9uIGF0dGFjaEN1c3RvbVJlc29sdmVycyhvcmlnaW5hbDogYW55KTogYW55IHtcbiAgICBvdmVycmlkZU9iamVjdChvcmlnaW5hbCwgcmVzb2x2ZXJzQ3VzdG9tKTtcbiAgICByZXR1cm4gb3JpZ2luYWw7XG59XG4iXX0=