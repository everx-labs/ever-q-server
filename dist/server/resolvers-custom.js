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

var _arango = _interopRequireDefault(require("./arango"));

var _config = require("./config");

var _path = _interopRequireDefault(require("path"));

var _nodeFetch = _interopRequireDefault(require("node-fetch"));

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
  _regenerator["default"].mark(function _callee(_parent, args, context) {
    var span, result, counts;
    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return context.db.tracer.startSpanLog(context, "resolvers-custom.js:getAccountCount", "new getAccountCount query", args);

          case 2:
            span = _context.sent;
            _context.prev = 3;
            _context.next = 6;
            return context.db.fetchQuery("RETURN LENGTH(accounts)", {}, span);

          case 6:
            result = _context.sent;
            counts = result;
            return _context.abrupt("return", counts.length > 0 ? counts[0] : 0);

          case 9:
            _context.prev = 9;
            _context.next = 12;
            return span.finish();

          case 12:
            return _context.finish(9);

          case 13:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[3,, 9, 13]]);
  }));
  return _getAccountsCount.apply(this, arguments);
}

function getTransactionsCount(_x4, _x5, _x6) {
  return _getTransactionsCount.apply(this, arguments);
}

function _getTransactionsCount() {
  _getTransactionsCount = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee2(_parent, args, context) {
    var span, result, counts;
    return _regenerator["default"].wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return context.db.tracer.startSpanLog(context, "resolvers-custom.js:getTransactionsCount", "new getTransactionsCount query", args);

          case 2:
            span = _context2.sent;
            _context2.prev = 3;
            _context2.next = 6;
            return context.db.fetchQuery("RETURN LENGTH(transactions)", {}, span);

          case 6:
            result = _context2.sent;
            counts = result;
            return _context2.abrupt("return", counts.length > 0 ? counts[0] : 0);

          case 9:
            _context2.prev = 9;
            _context2.next = 12;
            return span.finish();

          case 12:
            return _context2.finish(9);

          case 13:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, null, [[3,, 9, 13]]);
  }));
  return _getTransactionsCount.apply(this, arguments);
}

function getAccountsTotalBalance(_x7, _x8, _x9) {
  return _getAccountsTotalBalance.apply(this, arguments);
} // Mutation


function _getAccountsTotalBalance() {
  _getAccountsTotalBalance = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee3(_parent, args, context) {
    var span, result, parts;
    return _regenerator["default"].wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.next = 2;
            return context.db.tracer.startSpanLog(context, "resolvers-custom.js:getAccountTotalBalance", "new getAccountTotalBalance query", args);

          case 2:
            span = _context3.sent;
            _context3.prev = 3;
            _context3.next = 6;
            return context.db.fetchQuery("\n        LET d = 16777216\n        FOR a in accounts\n        LET b = TO_NUMBER(CONCAT(\"0x\", SUBSTRING(a.balance, 2)))\n        COLLECT AGGREGATE\n            hs = SUM(FLOOR(b / d)),\n            ls = SUM(b % (d - 1))\n        RETURN { hs, ls }\n    ", {}, span);

          case 6:
            result = _context3.sent;
            parts = result[0]; //$FlowFixMe

            return _context3.abrupt("return", (BigInt(parts.hs) * BigInt(0x1000000) + BigInt(parts.ls)).toString());

          case 9:
            _context3.prev = 9;
            _context3.next = 12;
            return span.finish();

          case 12:
            return _context3.finish(9);

          case 13:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, null, [[3,, 9, 13]]);
  }));
  return _getAccountsTotalBalance.apply(this, arguments);
}

function postRequestsUsingRest(_x10, _x11, _x12) {
  return _postRequestsUsingRest.apply(this, arguments);
}

function _postRequestsUsingRest() {
  _postRequestsUsingRest = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee4(requests, context, rootSpan) {
    var span, config, url, response, message;
    return _regenerator["default"].wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.next = 2;
            return context.db.tracer.startSpan(rootSpan, "resolvers-custom.js:postRequestsUsingRest");

          case 2:
            span = _context4.sent;
            config = context.config.requests;
            url = "".concat((0, _config.ensureProtocol)(config.server, 'http'), "/topics/").concat(config.topic);
            _context4.next = 7;
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

          case 7:
            response = _context4.sent;

            if (!(response.status !== 200)) {
              _context4.next = 19;
              break;
            }

            _context4.t0 = "Post requests failed: ";
            _context4.next = 12;
            return response.text();

          case 12:
            _context4.t1 = _context4.sent;
            message = _context4.t0.concat.call(_context4.t0, _context4.t1);
            _context4.next = 16;
            return span.log({
              event: 'post request to rest failed ',
              value: message
            });

          case 16:
            _context4.next = 18;
            return span.finish();

          case 18:
            throw new Error(message);

          case 19:
            _context4.next = 21;
            return span.finish();

          case 21:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4);
  }));
  return _postRequestsUsingRest.apply(this, arguments);
}

function postRequestsUsingKafka(_x13, _x14, _x15) {
  return _postRequestsUsingKafka.apply(this, arguments);
}

function _postRequestsUsingKafka() {
  _postRequestsUsingKafka = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee8(requests, context, rootSpan) {
    var span, ensureShared, config, producer, messages;
    return _regenerator["default"].wrap(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            _context8.next = 2;
            return context.db.tracer.startSpan(rootSpan, "resolvers-custom.js:postRequestUsingKafka");

          case 2:
            span = _context8.sent;

            ensureShared =
            /*#__PURE__*/
            function () {
              var _ref3 = (0, _asyncToGenerator2["default"])(
              /*#__PURE__*/
              _regenerator["default"].mark(function _callee5(name, createValue) {
                var value;
                return _regenerator["default"].wrap(function _callee5$(_context5) {
                  while (1) {
                    switch (_context5.prev = _context5.next) {
                      case 0:
                        if (!context.shared.has(name)) {
                          _context5.next = 2;
                          break;
                        }

                        return _context5.abrupt("return", context.shared.get(name));

                      case 2:
                        _context5.next = 4;
                        return createValue();

                      case 4:
                        value = _context5.sent;
                        context.shared.set(name, value);
                        return _context5.abrupt("return", value);

                      case 7:
                      case "end":
                        return _context5.stop();
                    }
                  }
                }, _callee5);
              }));

              return function ensureShared(_x19, _x20) {
                return _ref3.apply(this, arguments);
              };
            }();

            config = context.config.requests;
            _context8.next = 7;
            return ensureShared('producer',
            /*#__PURE__*/
            (0, _asyncToGenerator2["default"])(
            /*#__PURE__*/
            _regenerator["default"].mark(function _callee7() {
              var kafka, newProducer;
              return _regenerator["default"].wrap(function _callee7$(_context7) {
                while (1) {
                  switch (_context7.prev = _context7.next) {
                    case 0:
                      _context7.next = 2;
                      return ensureShared('kafka',
                      /*#__PURE__*/
                      (0, _asyncToGenerator2["default"])(
                      /*#__PURE__*/
                      _regenerator["default"].mark(function _callee6() {
                        return _regenerator["default"].wrap(function _callee6$(_context6) {
                          while (1) {
                            switch (_context6.prev = _context6.next) {
                              case 0:
                                return _context6.abrupt("return", new _kafkajs.Kafka({
                                  clientId: 'q-server',
                                  brokers: [config.server]
                                }));

                              case 1:
                              case "end":
                                return _context6.stop();
                            }
                          }
                        }, _callee6);
                      })));

                    case 2:
                      kafka = _context7.sent;
                      newProducer = kafka.producer();
                      _context7.next = 6;
                      return newProducer.connect();

                    case 6:
                      return _context7.abrupt("return", newProducer);

                    case 7:
                    case "end":
                      return _context7.stop();
                  }
                }
              }, _callee7);
            })));

          case 7:
            producer = _context8.sent;
            console.log('[postRequests]', requests);
            _context8.next = 11;
            return span.log({
              event: 'post requests to kafka',
              value: requests
            });

          case 11:
            messages = requests.map(function (request) {
              return {
                key: Buffer.from(request.id, 'base64'),
                value: Buffer.from(request.body, 'base64')
              };
            });
            _context8.next = 14;
            return producer.send({
              topic: config.topic,
              messages: messages
            });

          case 14:
            _context8.next = 16;
            return span.log({
              event: 'messages sended to kafka',
              value: messages
            });

          case 16:
            _context8.next = 18;
            return span.finish();

          case 18:
          case "end":
            return _context8.stop();
        }
      }
    }, _callee8);
  }));
  return _postRequestsUsingKafka.apply(this, arguments);
}

function postRequests(_x16, _x17, _x18) {
  return _postRequests.apply(this, arguments);
}

function _postRequests() {
  _postRequests = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee9(_, args, context) {
    var span, requests;
    return _regenerator["default"].wrap(function _callee9$(_context9) {
      while (1) {
        switch (_context9.prev = _context9.next) {
          case 0:
            _context9.next = 2;
            return context.db.tracer.startSpanLog(context, "resolvers-custom.js:postRequests", "new post request", args);

          case 2:
            span = _context9.sent;
            requests = args.requests;

            if (requests) {
              _context9.next = 8;
              break;
            }

            _context9.next = 7;
            return span.finish();

          case 7:
            return _context9.abrupt("return", []);

          case 8:
            _context9.prev = 8;

            if (!(context.config.requests.mode === 'rest')) {
              _context9.next = 14;
              break;
            }

            _context9.next = 12;
            return postRequestsUsingRest(requests, context, span);

          case 12:
            _context9.next = 16;
            break;

          case 14:
            _context9.next = 16;
            return postRequestsUsingKafka(requests, context, span);

          case 16:
            _context9.next = 26;
            break;

          case 18:
            _context9.prev = 18;
            _context9.t0 = _context9["catch"](8);
            console.log('[Q Server] post request failed]', _context9.t0);
            _context9.next = 23;
            return span.log({
              event: 'post request failed',
              value: _context9.t0
            });

          case 23:
            _context9.next = 25;
            return span.finish();

          case 25:
            throw _context9.t0;

          case 26:
            _context9.next = 28;
            return span.finish();

          case 28:
            return _context9.abrupt("return", requests.map(function (x) {
              return x.id;
            }));

          case 29:
          case "end":
            return _context9.stop();
        }
      }
    }, _callee9, null, [[8, 18]]);
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