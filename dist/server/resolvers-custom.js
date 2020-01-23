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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9yZXNvbHZlcnMtY3VzdG9tLmpzIl0sIm5hbWVzIjpbImlzT2JqZWN0IiwidGVzdCIsIm92ZXJyaWRlT2JqZWN0Iiwib3JpZ2luYWwiLCJvdmVycmlkZXMiLCJPYmplY3QiLCJlbnRyaWVzIiwiZm9yRWFjaCIsIm5hbWUiLCJvdmVycmlkZVZhbHVlIiwiaW5mbyIsInBrZyIsIkpTT04iLCJwYXJzZSIsImZzIiwicmVhZEZpbGVTeW5jIiwicGF0aCIsInJlc29sdmUiLCJfX2Rpcm5hbWUiLCJ2ZXJzaW9uIiwiZ2V0QWNjb3VudHNDb3VudCIsIl9wYXJlbnQiLCJhcmdzIiwiY29udGV4dCIsImRiIiwidHJhY2VyIiwic3RhcnRTcGFuTG9nIiwic3BhbiIsImZldGNoUXVlcnkiLCJyZXN1bHQiLCJjb3VudHMiLCJsZW5ndGgiLCJmaW5pc2giLCJnZXRUcmFuc2FjdGlvbnNDb3VudCIsImdldEFjY291bnRzVG90YWxCYWxhbmNlIiwicGFydHMiLCJCaWdJbnQiLCJocyIsImxzIiwidG9TdHJpbmciLCJwb3N0UmVxdWVzdHNVc2luZ1Jlc3QiLCJyZXF1ZXN0cyIsInJvb3RTcGFuIiwic3RhcnRTcGFuIiwiY29uZmlnIiwidXJsIiwic2VydmVyIiwidG9waWMiLCJtZXRob2QiLCJtb2RlIiwiY2FjaGUiLCJjcmVkZW50aWFscyIsImhlYWRlcnMiLCJyZWRpcmVjdCIsInJlZmVycmVyIiwiYm9keSIsInN0cmluZ2lmeSIsInJlY29yZHMiLCJtYXAiLCJyZXF1ZXN0Iiwia2V5IiwiaWQiLCJ2YWx1ZSIsInJlc3BvbnNlIiwic3RhdHVzIiwidGV4dCIsIm1lc3NhZ2UiLCJsb2ciLCJldmVudCIsIkVycm9yIiwicG9zdFJlcXVlc3RzVXNpbmdLYWZrYSIsImVuc3VyZVNoYXJlZCIsImNyZWF0ZVZhbHVlIiwic2hhcmVkIiwiaGFzIiwiZ2V0Iiwic2V0IiwiS2Fma2EiLCJjbGllbnRJZCIsImJyb2tlcnMiLCJrYWZrYSIsIm5ld1Byb2R1Y2VyIiwicHJvZHVjZXIiLCJjb25uZWN0IiwiY29uc29sZSIsIm1lc3NhZ2VzIiwiQnVmZmVyIiwiZnJvbSIsInNlbmQiLCJwb3N0UmVxdWVzdHMiLCJfIiwieCIsInJlc29sdmVyc0N1c3RvbSIsIlF1ZXJ5IiwiTXV0YXRpb24iLCJhdHRhY2hDdXN0b21SZXNvbHZlcnMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUE7O0FBQ0E7O0FBQ0E7O0FBRUE7O0FBQ0E7O0FBQ0E7O0FBRUEsU0FBU0EsUUFBVCxDQUFrQkMsSUFBbEIsRUFBc0M7QUFDbEMsU0FBTyx5QkFBT0EsSUFBUCxNQUFnQixRQUFoQixJQUE0QkEsSUFBSSxLQUFLLElBQTVDO0FBQ0g7O0FBRUQsU0FBU0MsY0FBVCxDQUF3QkMsUUFBeEIsRUFBdUNDLFNBQXZDLEVBQXVEO0FBQ25EQyxFQUFBQSxNQUFNLENBQUNDLE9BQVAsQ0FBZUYsU0FBZixFQUEwQkcsT0FBMUIsQ0FBa0MsZ0JBQTJCO0FBQUE7QUFBQSxRQUF6QkMsSUFBeUI7QUFBQSxRQUFuQkMsYUFBbUI7O0FBQ3pELFFBQUtELElBQUksSUFBSUwsUUFBVCxJQUFzQkgsUUFBUSxDQUFDUyxhQUFELENBQTlCLElBQWlEVCxRQUFRLENBQUNHLFFBQVEsQ0FBQ0ssSUFBRCxDQUFULENBQTdELEVBQStFO0FBQzNFTixNQUFBQSxjQUFjLENBQUNDLFFBQVEsQ0FBQ0ssSUFBRCxDQUFULEVBQWlCQyxhQUFqQixDQUFkO0FBQ0gsS0FGRCxNQUVPO0FBQ0hOLE1BQUFBLFFBQVEsQ0FBQ0ssSUFBRCxDQUFSLEdBQWlCQyxhQUFqQjtBQUNIO0FBQ0osR0FORDtBQU9IOztBQWlCRDtBQUVBLFNBQVNDLElBQVQsR0FBc0I7QUFDbEIsTUFBTUMsR0FBRyxHQUFHQyxJQUFJLENBQUNDLEtBQUwsQ0FBWUMsZUFBR0MsWUFBSCxDQUFnQkMsaUJBQUtDLE9BQUwsQ0FBYUMsU0FBYixFQUF3QixJQUF4QixFQUE4QixJQUE5QixFQUFvQyxjQUFwQyxDQUFoQixDQUFaLENBQVo7QUFDQSxTQUFPO0FB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QUFZLEVBQVpBO0FBRE07QUFQVSxDQUF4Qjs7QUFZTyxTQUFTTSxxQkFBVCxDQUErQjVGLFFBQS9CLEVBQW1EO0FBQ3RERCxFQUFBQSxjQUFjLENBQUNDLFFBQUQsRUFBV3lGLGVBQVgsQ0FBZDtBQUNBLFNBQU96RixRQUFQO0FBQ0giLCJzb3VyY2VzQ29udGVudCI6WyIvLyBAZmxvd1xuXG5pbXBvcnQgZnMgZnJvbSBcImZzXCI7XG5pbXBvcnQgeyBLYWZrYSwgUHJvZHVjZXIgfSBmcm9tIFwia2Fma2Fqc1wiO1xuaW1wb3J0IEFyYW5nbyBmcm9tIFwiLi9hcmFuZ29cIjtcbmltcG9ydCB0eXBlIHsgUUNvbmZpZyB9IGZyb20gXCIuL2NvbmZpZ1wiO1xuaW1wb3J0IHsgZW5zdXJlUHJvdG9jb2wgfSBmcm9tIFwiLi9jb25maWdcIjtcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IGZldGNoIGZyb20gJ25vZGUtZmV0Y2gnO1xuXG5mdW5jdGlvbiBpc09iamVjdCh0ZXN0OiBhbnkpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdHlwZW9mIHRlc3QgPT09ICdvYmplY3QnICYmIHRlc3QgIT09IG51bGw7XG59XG5cbmZ1bmN0aW9uIG92ZXJyaWRlT2JqZWN0KG9yaWdpbmFsOiBhbnksIG92ZXJyaWRlczogYW55KSB7XG4gICAgT2JqZWN0LmVudHJpZXMob3ZlcnJpZGVzKS5mb3JFYWNoKChbbmFtZSwgb3ZlcnJpZGVWYWx1ZV0pID0+IHtcbiAgICAgICAgaWYgKChuYW1lIGluIG9yaWdpbmFsKSAmJiBpc09iamVjdChvdmVycmlkZVZhbHVlKSAmJiBpc09iamVjdChvcmlnaW5hbFtuYW1lXSkpIHtcbiAgICAgICAgICAgIG92ZXJyaWRlT2JqZWN0KG9yaWdpbmFsW25hbWVdLCBvdmVycmlkZVZhbHVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG9yaWdpbmFsW25hbWVdID0gb3ZlcnJpZGVWYWx1ZTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG50eXBlIEluZm8gPSB7XG4gICAgdmVyc2lvbjogc3RyaW5nLFxufVxuXG50eXBlIFJlcXVlc3QgPSB7XG4gICAgaWQ6IHN0cmluZyxcbiAgICBib2R5OiBzdHJpbmcsXG59XG5cbnR5cGUgQ29udGV4dCA9IHtcbiAgICBkYjogQXJhbmdvLFxuICAgIGNvbmZpZzogUUNvbmZpZyxcbiAgICBzaGFyZWQ6IE1hcDxzdHJpbmcsIGFueT4sXG59XG5cbi8vIFF1ZXJ5XG5cbmZ1bmN0aW9uIGluZm8oKTogSW5mbyB7XG4gICAgY29uc3QgcGtnID0gSlNPTi5wYXJzZSgoZnMucmVhZEZpbGVTeW5jKHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuLicsICcuLicsICdwYWNrYWdlLmpzb24nKSk6IGFueSkpO1xuICAgIHJldHVybiB7XG4gICAgICAgIHZlcnNpb246IHBrZy52ZXJzaW9uLFxuICAgIH07XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGdldEFjY291bnRzQ291bnQoX3BhcmVudCwgYXJncywgY29udGV4dDogQ29udGV4dCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgY29uc3Qgc3BhbiA9IGF3YWl0IGNvbnRleHQuZGIudHJhY2VyLnN0YXJ0U3BhbkxvZyhcbiAgICAgICAgY29udGV4dCxcbiAgICAgICAgXCJyZXNvbHZlcnMtY3VzdG9tLmpzOmdldEFjY291bnRDb3VudFwiLFxuICAgICAgICBcIm5ldyBnZXRBY2NvdW50Q291bnQgcXVlcnlcIixcbiAgICAgICAgYXJncyk7XG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcmVzdWx0OiBhbnkgPSBhd2FpdCBjb250ZXh0LmRiLmZldGNoUXVlcnkoYFJFVFVSTiBMRU5HVEgoYWNjb3VudHMpYCwge30sIHNwYW4pO1xuICAgICAgICBjb25zdCBjb3VudHMgPSAocmVzdWx0OiBudW1iZXJbXSk7XG4gICAgICAgIHJldHVybiBjb3VudHMubGVuZ3RoID4gMCA/IGNvdW50c1swXSA6IDA7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgICAgYXdhaXQgc3Bhbi5maW5pc2goKTtcbiAgICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGdldFRyYW5zYWN0aW9uc0NvdW50KF9wYXJlbnQsIGFyZ3MsIGNvbnRleHQ6IENvbnRleHQpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGNvbnN0IHNwYW4gPSBhd2FpdCBjb250ZXh0LmRiLnRyYWNlci5zdGFydFNwYW5Mb2coXG4gICAgICAgIGNvbnRleHQsXG4gICAgICAgIFwicmVzb2x2ZXJzLWN1c3RvbS5qczpnZXRUcmFuc2FjdGlvbnNDb3VudFwiLFxuICAgICAgICBcIm5ldyBnZXRUcmFuc2FjdGlvbnNDb3VudCBxdWVyeVwiLFxuICAgICAgICBhcmdzKTtcbiAgICB0cnkge1xuICAgICAgICBjb25zdCByZXN1bHQ6IGFueSA9IGF3YWl0IGNvbnRleHQuZGIuZmV0Y2hRdWVyeShgUkVUVVJOIExFTkdUSCh0cmFuc2FjdGlvbnMpYCwge30sIHNwYW4pO1xuICAgICAgICBjb25zdCBjb3VudHMgPSAocmVzdWx0OiBudW1iZXJbXSk7XG4gICAgICAgIHJldHVybiBjb3VudHMubGVuZ3RoID4gMCA/IGNvdW50c1swXSA6IDA7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgICAgYXdhaXQgc3Bhbi5maW5pc2goKTtcbiAgICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGdldEFjY291bnRzVG90YWxCYWxhbmNlKF9wYXJlbnQsIGFyZ3MsIGNvbnRleHQ6IENvbnRleHQpOiBQcm9taXNlPFN0cmluZz4ge1xuICAgIC8qXG4gICAgQmVjYXVzZSBhcmFuZ28gY2FuIG5vdCBzdW0gQmlnSW50cyB3ZSBuZWVkIHRvIHN1bSBzZXBhcmF0ZWx5OlxuICAgIGhzID0gU1VNIG9mIGhpZ2ggYml0cyAoZnJvbSAyNC1iaXQgYW5kIGhpZ2hlcilcbiAgICBscyA9IFNVTSBvZiBsb3dlciAyNCBiaXRzXG4gICAgQW5kIHRoZSB0b3RhbCByZXN1bHQgaXMgKGhzIDw8IDI0KSArIGxzXG4gICAgICovXG4gICAgY29uc3Qgc3BhbiA9IGF3YWl0IGNvbnRleHQuZGIudHJhY2VyLnN0YXJ0U3BhbkxvZyhcbiAgICAgICAgY29udGV4dCxcbiAgICAgICAgXCJyZXNvbHZlcnMtY3VzdG9tLmpzOmdldEFjY291bnRUb3RhbEJhbGFuY2VcIixcbiAgICAgICAgXCJuZXcgZ2V0QWNjb3VudFRvdGFsQmFsYW5jZSBxdWVyeVwiLFxuICAgICAgICBhcmdzKTtcbiAgICB0cnkge1xuICAgICAgICBjb25zdCByZXN1bHQ6IGFueSA9IGF3YWl0IGNvbnRleHQuZGIuZmV0Y2hRdWVyeShgXG4gICAgICAgIExFVCBkID0gMTY3NzcyMTZcbiAgICAgICAgRk9SIGEgaW4gYWNjb3VudHNcbiAgICAgICAgTEVUIGIgPSBUT19OVU1CRVIoQ09OQ0FUKFwiMHhcIiwgU1VCU1RSSU5HKGEuYmFsYW5jZSwgMikpKVxuICAgICAgICBDT0xMRUNUIEFHR1JFR0FURVxuICAgICAgICAgICAgaHMgPSBTVU0oRkxPT1IoYiAvIGQpKSxcbiAgICAgICAgICAgIGxzID0gU1VNKGIgJSAoZCAtIDEpKVxuICAgICAgICBSRVRVUk4geyBocywgbHMgfVxuICAgIGAsIHt9LCBzcGFuKTtcbiAgICAgICAgY29uc3QgcGFydHMgPSAocmVzdWx0OiB7IGhzOiBudW1iZXIsIGxzOiBudW1iZXIgfVtdKVswXTtcbiAgICAgICAgLy8kRmxvd0ZpeE1lXG4gICAgICAgIHJldHVybiAoQmlnSW50KHBhcnRzLmhzKSAqIEJpZ0ludCgweDEwMDAwMDApICsgQmlnSW50KHBhcnRzLmxzKSkudG9TdHJpbmcoKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgICBhd2FpdCBzcGFuLmZpbmlzaCgpO1xuICAgIH1cbn1cblxuLy8gTXV0YXRpb25cblxuYXN5bmMgZnVuY3Rpb24gcG9zdFJlcXVlc3RzVXNpbmdSZXN0KHJlcXVlc3RzOiBSZXF1ZXN0W10sIGNvbnRleHQ6IENvbnRleHQsIHJvb3RTcGFuOiBhbnkpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBzcGFuID0gYXdhaXQgY29udGV4dC5kYi50cmFjZXIuc3RhcnRTcGFuKHJvb3RTcGFuLCBcInJlc29sdmVycy1jdXN0b20uanM6cG9zdFJlcXVlc3RzVXNpbmdSZXN0XCIpO1xuICAgIGNvbnN0IGNvbmZpZyA9IGNvbnRleHQuY29uZmlnLnJlcXVlc3RzO1xuICAgIGNvbnN0IHVybCA9IGAke2Vuc3VyZVByb3RvY29sKGNvbmZpZy5zZXJ2ZXIsICdodHRwJyl9L3RvcGljcy8ke2NvbmZpZy50b3BpY31gO1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godXJsLCB7XG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBtb2RlOiAnY29ycycsXG4gICAgICAgIGNhY2hlOiAnbm8tY2FjaGUnLFxuICAgICAgICBjcmVkZW50aWFsczogJ3NhbWUtb3JpZ2luJyxcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgfSxcbiAgICAgICAgcmVkaXJlY3Q6ICdmb2xsb3cnLFxuICAgICAgICByZWZlcnJlcjogJ25vLXJlZmVycmVyJyxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgcmVjb3JkczogcmVxdWVzdHMubWFwKChyZXF1ZXN0KSA9PiAoe1xuICAgICAgICAgICAgICAgIGtleTogcmVxdWVzdC5pZCxcbiAgICAgICAgICAgICAgICB2YWx1ZTogcmVxdWVzdC5ib2R5LFxuICAgICAgICAgICAgfSkpLFxuICAgICAgICB9KSxcbiAgICB9KTtcbiAgICBpZiAocmVzcG9uc2Uuc3RhdHVzICE9PSAyMDApIHtcbiAgICAgICAgY29uc3QgbWVzc2FnZSA9IGBQb3N0IHJlcXVlc3RzIGZhaWxlZDogJHthd2FpdCByZXNwb25zZS50ZXh0KCl9YDtcbiAgICAgICAgYXdhaXQgc3Bhbi5sb2coe1xuICAgICAgICAgICAgZXZlbnQ6ICdwb3N0IHJlcXVlc3QgdG8gcmVzdCBmYWlsZWQgJyxcbiAgICAgICAgICAgIHZhbHVlOiBtZXNzYWdlXG4gICAgICAgIH0pO1xuICAgICAgICBhd2FpdCBzcGFuLmZpbmlzaCgpO1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IobWVzc2FnZSk7XG4gICAgfVxuICAgIGF3YWl0IHNwYW4uZmluaXNoKCk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHBvc3RSZXF1ZXN0c1VzaW5nS2Fma2EocmVxdWVzdHM6IFJlcXVlc3RbXSwgY29udGV4dDogQ29udGV4dCwgcm9vdFNwYW46IGFueSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHNwYW4gPSBhd2FpdCBjb250ZXh0LmRiLnRyYWNlci5zdGFydFNwYW4ocm9vdFNwYW4sIFwicmVzb2x2ZXJzLWN1c3RvbS5qczpwb3N0UmVxdWVzdFVzaW5nS2Fma2FcIik7XG4gICAgY29uc3QgZW5zdXJlU2hhcmVkID0gYXN5bmMgKG5hbWUsIGNyZWF0ZVZhbHVlOiAoKSA9PiBQcm9taXNlPGFueT4pID0+IHtcbiAgICAgICAgaWYgKGNvbnRleHQuc2hhcmVkLmhhcyhuYW1lKSkge1xuICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQuc2hhcmVkLmdldChuYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB2YWx1ZSA9IGF3YWl0IGNyZWF0ZVZhbHVlKCk7XG4gICAgICAgIGNvbnRleHQuc2hhcmVkLnNldChuYW1lLCB2YWx1ZSk7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9O1xuXG4gICAgY29uc3QgY29uZmlnID0gY29udGV4dC5jb25maWcucmVxdWVzdHM7XG4gICAgY29uc3QgcHJvZHVjZXI6IFByb2R1Y2VyID0gYXdhaXQgZW5zdXJlU2hhcmVkKCdwcm9kdWNlcicsIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3Qga2Fma2E6IEthZmthID0gYXdhaXQgZW5zdXJlU2hhcmVkKCdrYWZrYScsIGFzeW5jICgpID0+IG5ldyBLYWZrYSh7XG4gICAgICAgICAgICBjbGllbnRJZDogJ3Etc2VydmVyJyxcbiAgICAgICAgICAgIGJyb2tlcnM6IFtjb25maWcuc2VydmVyXVxuICAgICAgICB9KSk7XG4gICAgICAgIGNvbnN0IG5ld1Byb2R1Y2VyID0ga2Fma2EucHJvZHVjZXIoKTtcbiAgICAgICAgYXdhaXQgbmV3UHJvZHVjZXIuY29ubmVjdCgpO1xuICAgICAgICByZXR1cm4gbmV3UHJvZHVjZXI7XG5cbiAgICB9KTtcbiAgICBjb25zb2xlLmxvZygnW3Bvc3RSZXF1ZXN0c10nLCByZXF1ZXN0cyk7XG4gICAgYXdhaXQgc3Bhbi5sb2coe1xuICAgICAgICBldmVudDogJ3Bvc3QgcmVxdWVzdHMgdG8ga2Fma2EnLFxuICAgICAgICB2YWx1ZTogcmVxdWVzdHNcbiAgICB9KTtcbiAgICBjb25zdCBtZXNzYWdlcyA9IHJlcXVlc3RzLm1hcCgocmVxdWVzdCkgPT4gKHtcbiAgICAgICAga2V5OiBCdWZmZXIuZnJvbShyZXF1ZXN0LmlkLCAnYmFzZTY0JyksXG4gICAgICAgIHZhbHVlOiBCdWZmZXIuZnJvbShyZXF1ZXN0LmJvZHksICdiYXNlNjQnKSxcbiAgICB9KSk7XG4gICAgYXdhaXQgcHJvZHVjZXIuc2VuZCh7XG4gICAgICAgIHRvcGljOiBjb25maWcudG9waWMsXG4gICAgICAgIG1lc3NhZ2VzLFxuICAgIH0pO1xuICAgIGF3YWl0IHNwYW4ubG9nKHtcbiAgICAgICAgZXZlbnQ6ICdtZXNzYWdlcyBzZW5kZWQgdG8ga2Fma2EnLFxuICAgICAgICB2YWx1ZTogbWVzc2FnZXNcbiAgICB9KTtcbiAgICBhd2FpdCBzcGFuLmZpbmlzaCgpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBwb3N0UmVxdWVzdHMoXywgYXJnczogeyByZXF1ZXN0czogUmVxdWVzdFtdIH0sIGNvbnRleHQ6IENvbnRleHQpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgY29uc3Qgc3BhbiA9IGF3YWl0IGNvbnRleHQuZGIudHJhY2VyLnN0YXJ0U3BhbkxvZyhcbiAgICAgICAgY29udGV4dCxcbiAgICAgICAgXCJyZXNvbHZlcnMtY3VzdG9tLmpzOnBvc3RSZXF1ZXN0c1wiLFxuICAgICAgICBcIm5ldyBwb3N0IHJlcXVlc3RcIixcbiAgICAgICAgYXJncyk7XG4gICAgY29uc3QgcmVxdWVzdHM6ID8oUmVxdWVzdFtdKSA9IGFyZ3MucmVxdWVzdHM7XG4gICAgaWYgKCFyZXF1ZXN0cykge1xuICAgICAgICBhd2FpdCBzcGFuLmZpbmlzaCgpO1xuICAgICAgICByZXR1cm4gW107XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIGlmIChjb250ZXh0LmNvbmZpZy5yZXF1ZXN0cy5tb2RlID09PSAncmVzdCcpIHtcbiAgICAgICAgICAgIGF3YWl0IHBvc3RSZXF1ZXN0c1VzaW5nUmVzdChyZXF1ZXN0cywgY29udGV4dCwgc3Bhbik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhd2FpdCBwb3N0UmVxdWVzdHNVc2luZ0thZmthKHJlcXVlc3RzLCBjb250ZXh0LCBzcGFuKTtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdbUSBTZXJ2ZXJdIHBvc3QgcmVxdWVzdCBmYWlsZWRdJywgZXJyb3IpO1xuICAgICAgICBhd2FpdCBzcGFuLmxvZyh7XG4gICAgICAgICAgICBldmVudDogJ3Bvc3QgcmVxdWVzdCBmYWlsZWQnLFxuICAgICAgICAgICAgdmFsdWU6IGVycm9yXG4gICAgICAgIH0pO1xuICAgICAgICBhd2FpdCBzcGFuLmZpbmlzaCgpO1xuICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gICAgYXdhaXQgc3Bhbi5maW5pc2goKTtcbiAgICByZXR1cm4gcmVxdWVzdHMubWFwKHggPT4geC5pZCk7XG59XG5cbmNvbnN0IHJlc29sdmVyc0N1c3RvbSA9IHtcbiAgICBRdWVyeToge1xuICAgICAgICBpbmZvLFxuICAgICAgICBnZXRBY2NvdW50c0NvdW50LFxuICAgICAgICBnZXRUcmFuc2FjdGlvbnNDb3VudCxcbiAgICAgICAgZ2V0QWNjb3VudHNUb3RhbEJhbGFuY2UsXG4gICAgfSxcbiAgICBNdXRhdGlvbjoge1xuICAgICAgICBwb3N0UmVxdWVzdHMsXG4gICAgfSxcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBhdHRhY2hDdXN0b21SZXNvbHZlcnMob3JpZ2luYWw6IGFueSk6IGFueSB7XG4gICAgb3ZlcnJpZGVPYmplY3Qob3JpZ2luYWwsIHJlc29sdmVyc0N1c3RvbSk7XG4gICAgcmV0dXJuIG9yaWdpbmFsO1xufVxuIl19