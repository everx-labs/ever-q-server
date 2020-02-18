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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9yZXNvbHZlcnMtY3VzdG9tLmpzIl0sIm5hbWVzIjpbImlzT2JqZWN0IiwidGVzdCIsIm92ZXJyaWRlT2JqZWN0Iiwib3JpZ2luYWwiLCJvdmVycmlkZXMiLCJPYmplY3QiLCJlbnRyaWVzIiwiZm9yRWFjaCIsIm5hbWUiLCJvdmVycmlkZVZhbHVlIiwiaW5mbyIsInBrZyIsIkpTT04iLCJwYXJzZSIsImZzIiwicmVhZEZpbGVTeW5jIiwicGF0aCIsInJlc29sdmUiLCJfX2Rpcm5hbWUiLCJ2ZXJzaW9uIiwiZ2V0QWNjb3VudHNDb3VudCIsIl9wYXJlbnQiLCJhcmdzIiwiY29udGV4dCIsInRyYWNlciIsImRiIiwiUVRyYWNlciIsInRyYWNlIiwiYXV0aCIsInJlcXVpcmVHcmFudGVkQWNjZXNzIiwiYWNjZXNzS2V5IiwicXVlcnkiLCJyZXN1bHQiLCJjb3VudHMiLCJsZW5ndGgiLCJnZXRQYXJlbnRTcGFuIiwiZ2V0VHJhbnNhY3Rpb25zQ291bnQiLCJnZXRBY2NvdW50c1RvdGFsQmFsYW5jZSIsInBhcnRzIiwiQmlnSW50IiwiaHMiLCJscyIsInRvU3RyaW5nIiwiZ2V0TWFuYWdlbWVudEFjY2Vzc0tleSIsInBvc3RSZXF1ZXN0c1VzaW5nUmVzdCIsInJlcXVlc3RzIiwiY29uZmlnIiwidXJsIiwic2VydmVyIiwidG9waWMiLCJtZXRob2QiLCJtb2RlIiwiY2FjaGUiLCJjcmVkZW50aWFscyIsImhlYWRlcnMiLCJyZWRpcmVjdCIsInJlZmVycmVyIiwiYm9keSIsInN0cmluZ2lmeSIsInJlY29yZHMiLCJtYXAiLCJyZXF1ZXN0Iiwia2V5IiwiaWQiLCJ2YWx1ZSIsInJlc3BvbnNlIiwic3RhdHVzIiwidGV4dCIsIm1lc3NhZ2UiLCJFcnJvciIsInBvc3RSZXF1ZXN0c1VzaW5nS2Fma2EiLCJzcGFuIiwiZW5zdXJlU2hhcmVkIiwiY3JlYXRlVmFsdWUiLCJzaGFyZWQiLCJoYXMiLCJnZXQiLCJzZXQiLCJLYWZrYSIsImNsaWVudElkIiwiYnJva2VycyIsImthZmthIiwibmV3UHJvZHVjZXIiLCJwcm9kdWNlciIsImNvbm5lY3QiLCJtZXNzYWdlcyIsImtleUJ1ZmZlciIsIkJ1ZmZlciIsImZyb20iLCJ0cmFjZUJ1ZmZlciIsImluamVjdCIsIkZPUk1BVF9CSU5BUlkiLCJjb25jYXQiLCJzZW5kIiwicG9zdFJlcXVlc3RzIiwiXyIsInNldFRhZyIsImxvZyIsImRlYnVnIiwicmVtb3RlQWRkcmVzcyIsIngiLCJwYXJlbnRTcGFuIiwicmVnaXN0ZXJBY2Nlc3NLZXlzIiwiYWNjb3VudCIsImtleXMiLCJzaWduZWRNYW5hZ2VtZW50QWNjZXNzS2V5IiwicmV2b2tlQWNjZXNzS2V5cyIsInJlc29sdmVyc0N1c3RvbSIsIlF1ZXJ5IiwiTXV0YXRpb24iLCJhdHRhY2hDdXN0b21SZXNvbHZlcnMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBRUE7O0FBQ0E7O0FBQ0E7O0FBRUE7O0FBRUEsU0FBU0EsUUFBVCxDQUFrQkMsSUFBbEIsRUFBc0M7QUFDbEMsU0FBTyx5QkFBT0EsSUFBUCxNQUFnQixRQUFoQixJQUE0QkEsSUFBSSxLQUFLLElBQTVDO0FBQ0g7O0FBRUQsU0FBU0MsY0FBVCxDQUF3QkMsUUFBeEIsRUFBdUNDLFNBQXZDLEVBQXVEO0FBQ25EQyxFQUFBQSxNQUFNLENBQUNDLE9BQVAsQ0FBZUYsU0FBZixFQUEwQkcsT0FBMUIsQ0FBa0MsZ0JBQTJCO0FBQUE7QUFBQSxRQUF6QkMsSUFBeUI7QUFBQSxRQUFuQkMsYUFBbUI7O0FBQ3pELFFBQUtELElBQUksSUFBSUwsUUFBVCxJQUFzQkgsUUFBUSxDQUFDUyxhQUFELENBQTlCLElBQWlEVCxRQUFRLENBQUNHLFFBQVEsQ0FBQ0ssSUFBRCxDQUFULENBQTdELEVBQStFO0FBQzNFTixNQUFBQSxjQUFjLENBQUNDLFFBQVEsQ0FBQ0ssSUFBRCxDQUFULEVBQWlCQyxhQUFqQixDQUFkO0FBQ0gsS0FGRCxNQUVPO0FBQ0hOLE1BQUFB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LElBQUFBLElBQUksRUFBSkEsSUFERztBQUVIVSxJQUFBQSxnQkFBZ0IsRUFBaEJBLGdCQUZHO0FBR0hnQixJQUFBQSxvQkFBb0IsRUFBcEJBLG9CQUhHO0FBSUhDLElBQUFBLHVCQUF1QixFQUF2QkEsdUJBSkc7QUFLSE0sSUFBQUEsc0JBQXNCLEVBQXRCQTtBQUxHLEdBRGE7QUFRcEJrRSxFQUFBQSxRQUFRLEVBQUU7QUFDTmYsSUFBQUEsWUFBWSxFQUFaQSxZQURNO0FBRU5RLElBQUFBLGtCQUFrQixFQUFsQkEsa0JBRk07QUFHTkksSUFBQUEsZ0JBQWdCLEVBQWhCQTtBQUhNO0FBUlUsQ0FBeEI7O0FBZU8sU0FBU0kscUJBQVQsQ0FBK0IzRyxRQUEvQixFQUFtRDtBQUN0REQsRUFBQUEsY0FBYyxDQUFDQyxRQUFELEVBQVd3RyxlQUFYLENBQWQ7QUFDQSxTQUFPeEcsUUFBUDtBQUNIIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQGZsb3dcblxuaW1wb3J0IGZzIGZyb20gXCJmc1wiO1xuaW1wb3J0IHsgS2Fma2EsIFByb2R1Y2VyIH0gZnJvbSBcImthZmthanNcIjtcbmltcG9ydCB7IFNwYW4sIEZPUk1BVF9CSU5BUlkgfSBmcm9tICdvcGVudHJhY2luZyc7XG5pbXBvcnQgQXJhbmdvIGZyb20gXCIuL2FyYW5nb1wiO1xuaW1wb3J0IHR5cGUgeyBHcmFwaFFMUmVxdWVzdENvbnRleHQgfSBmcm9tIFwiLi9hcmFuZ28tY29sbGVjdGlvblwiO1xuaW1wb3J0IHsgZW5zdXJlUHJvdG9jb2wgfSBmcm9tIFwiLi9jb25maWdcIjtcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IGZldGNoIGZyb20gJ25vZGUtZmV0Y2gnO1xuaW1wb3J0IHR5cGUgeyBBY2Nlc3NLZXkgfSBmcm9tIFwiLi9hdXRoXCI7XG5pbXBvcnQgeyBRVHJhY2VyIH0gZnJvbSBcIi4vdHJhY2VyXCI7XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KHRlc3Q6IGFueSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0eXBlb2YgdGVzdCA9PT0gJ29iamVjdCcgJiYgdGVzdCAhPT0gbnVsbDtcbn1cblxuZnVuY3Rpb24gb3ZlcnJpZGVPYmplY3Qob3JpZ2luYWw6IGFueSwgb3ZlcnJpZGVzOiBhbnkpIHtcbiAgICBPYmplY3QuZW50cmllcyhvdmVycmlkZXMpLmZvckVhY2goKFtuYW1lLCBvdmVycmlkZVZhbHVlXSkgPT4ge1xuICAgICAgICBpZiAoKG5hbWUgaW4gb3JpZ2luYWwpICYmIGlzT2JqZWN0KG92ZXJyaWRlVmFsdWUpICYmIGlzT2JqZWN0KG9yaWdpbmFsW25hbWVdKSkge1xuICAgICAgICAgICAgb3ZlcnJpZGVPYmplY3Qob3JpZ2luYWxbbmFtZV0sIG92ZXJyaWRlVmFsdWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb3JpZ2luYWxbbmFtZV0gPSBvdmVycmlkZVZhbHVlO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbnR5cGUgSW5mbyA9IHtcbiAgICB2ZXJzaW9uOiBzdHJpbmcsXG59XG5cbnR5cGUgUmVxdWVzdCA9IHtcbiAgICBpZDogc3RyaW5nLFxuICAgIGJvZHk6IHN0cmluZyxcbn1cblxudHlwZSBHcmFwaFFMUmVxdWVzdENvbnRleHRFeCA9IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCAmIHtcbiAgICBkYjogQXJhbmdvLFxufVxuXG4vLyBRdWVyeVxuXG5mdW5jdGlvbiBpbmZvKCk6IEluZm8ge1xuICAgIGNvbnN0IHBrZyA9IEpTT04ucGFyc2UoKGZzLnJlYWRGaWxlU3luYyhwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi4nLCAnLi4nLCAncGFja2FnZS5qc29uJykpOiBhbnkpKTtcbiAgICByZXR1cm4ge1xuICAgICAgICB2ZXJzaW9uOiBwa2cudmVyc2lvbixcbiAgICB9O1xufVxuXG5hc3luYyBmdW5jdGlvbiBnZXRBY2NvdW50c0NvdW50KF9wYXJlbnQsIGFyZ3MsIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dEV4KTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBjb25zdCB0cmFjZXIgPSBjb250ZXh0LmRiLnRyYWNlcjtcbiAgICByZXR1cm4gUVRyYWNlci50cmFjZSh0cmFjZXIsICdnZXRBY2NvdW50c0NvdW50JywgYXN5bmMgKCkgPT4ge1xuICAgICAgICBhd2FpdCBjb250ZXh0LmF1dGgucmVxdWlyZUdyYW50ZWRBY2Nlc3MoY29udGV4dC5hY2Nlc3NLZXkgfHwgYXJncy5hY2Nlc3NLZXkpO1xuICAgICAgICBjb25zdCByZXN1bHQ6IGFueSA9IGF3YWl0IGNvbnRleHQuZGIucXVlcnkoYFJFVFVSTiBMRU5HVEgoYWNjb3VudHMpYCwge30pO1xuICAgICAgICBjb25zdCBjb3VudHMgPSAocmVzdWx0OiBudW1iZXJbXSk7XG4gICAgICAgIHJldHVybiBjb3VudHMubGVuZ3RoID4gMCA/IGNvdW50c1swXSA6IDA7XG4gICAgfSwgUVRyYWNlci5nZXRQYXJlbnRTcGFuKHRyYWNlciwgY29udGV4dCkpXG59XG5cbmFzeW5jIGZ1bmN0aW9uIGdldFRyYW5zYWN0aW9uc0NvdW50KF9wYXJlbnQsIGFyZ3MsIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dEV4KTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBjb25zdCB0cmFjZXIgPSBjb250ZXh0LmRiLnRyYWNlcjtcbiAgICByZXR1cm4gUVRyYWNlci50cmFjZSh0cmFjZXIsICdnZXRUcmFuc2FjdGlvbnNDb3VudCcsIGFzeW5jICgpID0+IHtcbiAgICAgICAgYXdhaXQgY29udGV4dC5hdXRoLnJlcXVpcmVHcmFudGVkQWNjZXNzKGNvbnRleHQuYWNjZXNzS2V5IHx8IGFyZ3MuYWNjZXNzS2V5KTtcbiAgICAgICAgY29uc3QgcmVzdWx0OiBhbnkgPSBhd2FpdCBjb250ZXh0LmRiLnF1ZXJ5KGBSRVRVUk4gTEVOR1RIKHRyYW5zYWN0aW9ucylgLCB7fSk7XG4gICAgICAgIGNvbnN0IGNvdW50cyA9IChyZXN1bHQ6IG51bWJlcltdKTtcbiAgICAgICAgcmV0dXJuIGNvdW50cy5sZW5ndGggPiAwID8gY291bnRzWzBdIDogMDtcbiAgICB9LCBRVHJhY2VyLmdldFBhcmVudFNwYW4odHJhY2VyLCBjb250ZXh0KSlcbn1cblxuYXN5bmMgZnVuY3Rpb24gZ2V0QWNjb3VudHNUb3RhbEJhbGFuY2UoX3BhcmVudCwgYXJncywgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0RXgpOiBQcm9taXNlPFN0cmluZz4ge1xuICAgIGNvbnN0IHRyYWNlciA9IGNvbnRleHQuZGIudHJhY2VyO1xuICAgIHJldHVybiBRVHJhY2VyLnRyYWNlKHRyYWNlciwgJ2dldEFjY291bnRzVG90YWxCYWxhbmNlJywgYXN5bmMgKCkgPT4ge1xuICAgICAgICBhd2FpdCBjb250ZXh0LmF1dGgucmVxdWlyZUdyYW50ZWRBY2Nlc3MoY29udGV4dC5hY2Nlc3NLZXkgfHwgYXJncy5hY2Nlc3NLZXkpO1xuICAgICAgICAvKlxuICAgICAgICBCZWNhdXNlIGFyYW5nbyBjYW4gbm90IHN1bSBCaWdJbnQncyB3ZSBuZWVkIHRvIHN1bSBzZXBhcmF0ZWx5OlxuICAgICAgICBocyA9IFNVTSBvZiBoaWdoIGJpdHMgKGZyb20gMjQtYml0IGFuZCBoaWdoZXIpXG4gICAgICAgIGxzID0gU1VNIG9mIGxvd2VyIDI0IGJpdHNcbiAgICAgICAgQW5kIHRoZSB0b3RhbCByZXN1bHQgaXMgKGhzIDw8IDI0KSArIGxzXG4gICAgICAgICAqL1xuICAgICAgICBjb25zdCByZXN1bHQ6IGFueSA9IGF3YWl0IGNvbnRleHQuZGIucXVlcnkoYFxuICAgICAgICAgICAgTEVUIGQgPSAxNjc3NzIxNlxuICAgICAgICAgICAgRk9SIGEgaW4gYWNjb3VudHNcbiAgICAgICAgICAgIExFVCBiID0gVE9fTlVNQkVSKENPTkNBVChcIjB4XCIsIFNVQlNUUklORyhhLmJhbGFuY2UsIDIpKSlcbiAgICAgICAgICAgIENPTExFQ1QgQUdHUkVHQVRFXG4gICAgICAgICAgICAgICAgaHMgPSBTVU0oRkxPT1IoYiAvIGQpKSxcbiAgICAgICAgICAgICAgICBscyA9IFNVTShiICUgKGQgLSAxKSlcbiAgICAgICAgICAgIFJFVFVSTiB7IGhzLCBscyB9XG4gICAgICAgIGAsIHt9KTtcbiAgICAgICAgY29uc3QgcGFydHMgPSAocmVzdWx0OiB7IGhzOiBudW1iZXIsIGxzOiBudW1iZXIgfVtdKVswXTtcbiAgICAgICAgLy8kRmxvd0ZpeE1lXG4gICAgICAgIHJldHVybiAoQmlnSW50KHBhcnRzLmhzKSAqIEJpZ0ludCgweDEwMDAwMDApICsgQmlnSW50KHBhcnRzLmxzKSkudG9TdHJpbmcoKTtcbiAgICB9LCBRVHJhY2VyLmdldFBhcmVudFNwYW4odHJhY2VyLCBjb250ZXh0KSlcbn1cblxuYXN5bmMgZnVuY3Rpb24gZ2V0TWFuYWdlbWVudEFjY2Vzc0tleShfcGFyZW50LCBhcmdzLCBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHRFeCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgcmV0dXJuIGNvbnRleHQuYXV0aC5nZXRNYW5hZ2VtZW50QWNjZXNzS2V5KCk7XG59XG5cbi8vIE11dGF0aW9uXG5cbmFzeW5jIGZ1bmN0aW9uIHBvc3RSZXF1ZXN0c1VzaW5nUmVzdChyZXF1ZXN0czogUmVxdWVzdFtdLCBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHRFeCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGNvbmZpZyA9IGNvbnRleHQuY29uZmlnLnJlcXVlc3RzO1xuICAgIGNvbnN0IHVybCA9IGAke2Vuc3VyZVByb3RvY29sKGNvbmZpZy5zZXJ2ZXIsICdodHRwJyl9L3RvcGljcy8ke2NvbmZpZy50b3BpY31gO1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godXJsLCB7XG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBtb2RlOiAnY29ycycsXG4gICAgICAgIGNhY2hlOiAnbm8tY2FjaGUnLFxuICAgICAgICBjcmVkZW50aWFsczogJ3NhbWUtb3JpZ2luJyxcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgfSxcbiAgICAgICAgcmVkaXJlY3Q6ICdmb2xsb3cnLFxuICAgICAgICByZWZlcnJlcjogJ25vLXJlZmVycmVyJyxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgcmVjb3JkczogcmVxdWVzdHMubWFwKChyZXF1ZXN0KSA9PiAoe1xuICAgICAgICAgICAgICAgIGtleTogcmVxdWVzdC5pZCxcbiAgICAgICAgICAgICAgICB2YWx1ZTogcmVxdWVzdC5ib2R5LFxuICAgICAgICAgICAgfSkpLFxuICAgICAgICB9KSxcbiAgICB9KTtcbiAgICBpZiAocmVzcG9uc2Uuc3RhdHVzICE9PSAyMDApIHtcbiAgICAgICAgY29uc3QgbWVzc2FnZSA9IGBQb3N0IHJlcXVlc3RzIGZhaWxlZDogJHthd2FpdCByZXNwb25zZS50ZXh0KCl9YDtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1lc3NhZ2UpO1xuICAgIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gcG9zdFJlcXVlc3RzVXNpbmdLYWZrYShyZXF1ZXN0czogUmVxdWVzdFtdLCBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHRFeCwgc3BhbjogU3Bhbik6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGVuc3VyZVNoYXJlZCA9IGFzeW5jIChuYW1lLCBjcmVhdGVWYWx1ZTogKCkgPT4gUHJvbWlzZTxhbnk+KSA9PiB7XG4gICAgICAgIGlmIChjb250ZXh0LnNoYXJlZC5oYXMobmFtZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBjb250ZXh0LnNoYXJlZC5nZXQobmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdmFsdWUgPSBhd2FpdCBjcmVhdGVWYWx1ZSgpO1xuICAgICAgICBjb250ZXh0LnNoYXJlZC5zZXQobmFtZSwgdmFsdWUpO1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfTtcblxuICAgIGNvbnN0IGNvbmZpZyA9IGNvbnRleHQuY29uZmlnLnJlcXVlc3RzO1xuICAgIGNvbnN0IHByb2R1Y2VyOiBQcm9kdWNlciA9IGF3YWl0IGVuc3VyZVNoYXJlZCgncHJvZHVjZXInLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGthZmthOiBLYWZrYSA9IGF3YWl0IGVuc3VyZVNoYXJlZCgna2Fma2EnLCBhc3luYyAoKSA9PiBuZXcgS2Fma2Eoe1xuICAgICAgICAgICAgY2xpZW50SWQ6ICdxLXNlcnZlcicsXG4gICAgICAgICAgICBicm9rZXJzOiBbY29uZmlnLnNlcnZlcl1cbiAgICAgICAgfSkpO1xuICAgICAgICBjb25zdCBuZXdQcm9kdWNlciA9IGthZmthLnByb2R1Y2VyKCk7XG4gICAgICAgIGF3YWl0IG5ld1Byb2R1Y2VyLmNvbm5lY3QoKTtcbiAgICAgICAgcmV0dXJuIG5ld1Byb2R1Y2VyO1xuXG4gICAgfSk7XG4gICAgY29uc3QgbWVzc2FnZXMgPSByZXF1ZXN0cy5tYXAoKHJlcXVlc3QpID0+IHtcbiAgICAgICAgY29uc3Qga2V5QnVmZmVyID0gQnVmZmVyLmZyb20ocmVxdWVzdC5pZCwgJ2Jhc2U2NCcpO1xuICAgICAgICBjb25zdCB0cmFjZUJ1ZmZlciA9IEJ1ZmZlci5mcm9tKFtdKTtcbiAgICAgICAgY29udGV4dC5kYi50cmFjZXIuaW5qZWN0KHNwYW4sIEZPUk1BVF9CSU5BUlksIHRyYWNlQnVmZmVyKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGtleTogQnVmZmVyLmNvbmNhdChba2V5QnVmZmVyLCB0cmFjZUJ1ZmZlcl0pLFxuICAgICAgICAgICAgdmFsdWU6IEJ1ZmZlci5mcm9tKHJlcXVlc3QuYm9keSwgJ2Jhc2U2NCcpLFxuICAgICAgICB9O1xuICAgIH0pO1xuICAgIGF3YWl0IHByb2R1Y2VyLnNlbmQoe1xuICAgICAgICB0b3BpYzogY29uZmlnLnRvcGljLFxuICAgICAgICBtZXNzYWdlcyxcbiAgICB9KTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gcG9zdFJlcXVlc3RzKF8sIGFyZ3M6IHsgcmVxdWVzdHM6IFJlcXVlc3RbXSwgYWNjZXNzS2V5Pzogc3RyaW5nIH0sIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dEV4KTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGNvbnN0IHJlcXVlc3RzOiA/KFJlcXVlc3RbXSkgPSBhcmdzLnJlcXVlc3RzO1xuICAgIGlmICghcmVxdWVzdHMpIHtcbiAgICAgICAgcmV0dXJuIFtdO1xuICAgIH1cblxuICAgIGNvbnN0IHRyYWNlciA9IGNvbnRleHQuZGIudHJhY2VyO1xuICAgIHJldHVybiBRVHJhY2VyLnRyYWNlKHRyYWNlciwgXCJwb3N0UmVxdWVzdHNcIiwgYXN5bmMgKHNwYW46IFNwYW4pID0+IHtcbiAgICAgICAgc3Bhbi5zZXRUYWcoJ3BhcmFtcycsIHJlcXVlc3RzKTtcbiAgICAgICAgYXdhaXQgY29udGV4dC5hdXRoLnJlcXVpcmVHcmFudGVkQWNjZXNzKGNvbnRleHQuYWNjZXNzS2V5IHx8IGFyZ3MuYWNjZXNzS2V5KTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmIChjb250ZXh0LmNvbmZpZy5yZXF1ZXN0cy5tb2RlID09PSAncmVzdCcpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBwb3N0UmVxdWVzdHNVc2luZ1Jlc3QocmVxdWVzdHMsIGNvbnRleHQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBwb3N0UmVxdWVzdHNVc2luZ0thZmthKHJlcXVlc3RzLCBjb250ZXh0LCBzcGFuKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnRleHQuZGIubG9nLmRlYnVnKCdwb3N0UmVxdWVzdHMnLCAnUE9TVEVEJywgYXJncywgY29udGV4dC5yZW1vdGVBZGRyZXNzKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnRleHQuZGIubG9nLmRlYnVnKCdwb3N0UmVxdWVzdHMnLCAnRkFJTEVEJywgYXJncywgY29udGV4dC5yZW1vdGVBZGRyZXNzKTtcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXF1ZXN0cy5tYXAoeCA9PiB4LmlkKTtcbiAgICB9LCBjb250ZXh0LnBhcmVudFNwYW4pO1xufVxuXG50eXBlIE1hbmFnZW1lbnRBcmdzID0ge1xuICAgIGFjY291bnQ/OiBzdHJpbmcsXG4gICAgc2lnbmVkTWFuYWdlbWVudEFjY2Vzc0tleT86IHN0cmluZyxcbn1cblxudHlwZSBSZWdpc3RlckFjY2Vzc0tleXNBcmdzID0gTWFuYWdlbWVudEFyZ3MgJiB7XG4gICAga2V5czogQWNjZXNzS2V5W10sXG59XG5cbnR5cGUgUmV2b2tlQWNjZXNzS2V5c0FyZ3MgPSBNYW5hZ2VtZW50QXJncyAmIHtcbiAgICBrZXlzOiBzdHJpbmdbXSxcbn1cblxuYXN5bmMgZnVuY3Rpb24gcmVnaXN0ZXJBY2Nlc3NLZXlzKFxuICAgIF8sXG4gICAgYXJnczogUmVnaXN0ZXJBY2Nlc3NLZXlzQXJncyxcbiAgICBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHRFeCxcbik6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgcmV0dXJuIGNvbnRleHQuYXV0aC5yZWdpc3RlckFjY2Vzc0tleXMoXG4gICAgICAgIGFyZ3MuYWNjb3VudCB8fCAnJyxcbiAgICAgICAgYXJncy5rZXlzIHx8IFtdLFxuICAgICAgICBhcmdzLnNpZ25lZE1hbmFnZW1lbnRBY2Nlc3NLZXkgfHwgJycpO1xufVxuXG5hc3luYyBmdW5jdGlvbiByZXZva2VBY2Nlc3NLZXlzKFxuICAgIF8sXG4gICAgYXJnczogUmV2b2tlQWNjZXNzS2V5c0FyZ3MsXG4gICAgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0RXgsXG4pOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIHJldHVybiBjb250ZXh0LmF1dGgucmV2b2tlQWNjZXNzS2V5cyhcbiAgICAgICAgYXJncy5hY2NvdW50IHx8ICcnLFxuICAgICAgICBhcmdzLmtleXMgfHwgW10sXG4gICAgICAgIGFyZ3Muc2lnbmVkTWFuYWdlbWVudEFjY2Vzc0tleSB8fCAnJyk7XG59XG5cbmNvbnN0IHJlc29sdmVyc0N1c3RvbSA9IHtcbiAgICBRdWVyeToge1xuICAgICAgICBpbmZvLFxuICAgICAgICBnZXRBY2NvdW50c0NvdW50LFxuICAgICAgICBnZXRUcmFuc2FjdGlvbnNDb3VudCxcbiAgICAgICAgZ2V0QWNjb3VudHNUb3RhbEJhbGFuY2UsXG4gICAgICAgIGdldE1hbmFnZW1lbnRBY2Nlc3NLZXksXG4gICAgfSxcbiAgICBNdXRhdGlvbjoge1xuICAgICAgICBwb3N0UmVxdWVzdHMsXG4gICAgICAgIHJlZ2lzdGVyQWNjZXNzS2V5cyxcbiAgICAgICAgcmV2b2tlQWNjZXNzS2V5cyxcbiAgICB9LFxufTtcblxuZXhwb3J0IGZ1bmN0aW9uIGF0dGFjaEN1c3RvbVJlc29sdmVycyhvcmlnaW5hbDogYW55KTogYW55IHtcbiAgICBvdmVycmlkZU9iamVjdChvcmlnaW5hbCwgcmVzb2x2ZXJzQ3VzdG9tKTtcbiAgICByZXR1cm4gb3JpZ2luYWw7XG59XG4iXX0=