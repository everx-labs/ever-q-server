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
  _regenerator["default"].mark(function _callee(_parent, _args, context) {
    var result, counts;
    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return context.db.fetchQuery("RETURN LENGTH(accounts)", {});

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
  }));
  return _getAccountsCount.apply(this, arguments);
}

function getTransactionsCount(_x4, _x5, _x6) {
  return _getTransactionsCount.apply(this, arguments);
}

function _getTransactionsCount() {
  _getTransactionsCount = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee2(_parent, _args, context) {
    var result, counts;
    return _regenerator["default"].wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return context.db.fetchQuery("RETURN LENGTH(transactions)", {});

          case 2:
            result = _context2.sent;
            counts = result;
            return _context2.abrupt("return", counts.length > 0 ? counts[0] : 0);

          case 5:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));
  return _getTransactionsCount.apply(this, arguments);
}

function getAccountsTotalBalance(_x7, _x8, _x9) {
  return _getAccountsTotalBalance.apply(this, arguments);
} // Mutation


function _getAccountsTotalBalance() {
  _getAccountsTotalBalance = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee3(_parent, _args, context) {
    var result, parts;
    return _regenerator["default"].wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.next = 2;
            return context.db.fetchQuery("\n        LET d = 16777216\n        FOR a in accounts\n        LET b = TO_NUMBER(CONCAT(\"0x\", SUBSTRING(a.balance, 2)))\n        COLLECT AGGREGATE\n            hs = SUM(FLOOR(b / d)),\n            ls = SUM(b % (d - 1))\n        RETURN { hs, ls }\n    ", {});

          case 2:
            result = _context3.sent;
            parts = result[0]; //$FlowFixMe

            return _context3.abrupt("return", (BigInt(parts.hs) * BigInt(0x1000000) + BigInt(parts.ls)).toString());

          case 5:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3);
  }));
  return _getAccountsTotalBalance.apply(this, arguments);
}

function postRequestsUsingRest(_x10, _x11) {
  return _postRequestsUsingRest.apply(this, arguments);
}

function _postRequestsUsingRest() {
  _postRequestsUsingRest = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee4(requests, context) {
    var config, url, response, message;
    return _regenerator["default"].wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            config = context.config.requests;
            url = "".concat((0, _config.ensureProtocol)(config.server, 'http'), "/topics/").concat(config.topic);
            _context4.next = 4;
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
            response = _context4.sent;

            if (!(response.status !== 200)) {
              _context4.next = 12;
              break;
            }

            _context4.t0 = "Post requests failed: ";
            _context4.next = 9;
            return response.text();

          case 9:
            _context4.t1 = _context4.sent;
            message = _context4.t0.concat.call(_context4.t0, _context4.t1);
            throw new Error(message);

          case 12:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4);
  }));
  return _postRequestsUsingRest.apply(this, arguments);
}

function postRequestsUsingKafka(_x12, _x13) {
  return _postRequestsUsingKafka.apply(this, arguments);
}

function _postRequestsUsingKafka() {
  _postRequestsUsingKafka = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee8(requests, context) {
    var ensureShared, config, producer;
    return _regenerator["default"].wrap(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
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

              return function ensureShared(_x17, _x18) {
                return _ref3.apply(this, arguments);
              };
            }();

            config = context.config.requests;
            _context8.next = 4;
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

          case 4:
            producer = _context8.sent;
            _context8.next = 7;
            return producer.send({
              topic: config.topic,
              messages: requests.map(function (request) {
                return {
                  key: request.id,
                  value: request.body
                };
              })
            });

          case 7:
          case "end":
            return _context8.stop();
        }
      }
    }, _callee8);
  }));
  return _postRequestsUsingKafka.apply(this, arguments);
}

function postRequests(_x14, _x15, _x16) {
  return _postRequests.apply(this, arguments);
}

function _postRequests() {
  _postRequests = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee9(_, args, context) {
    var requests;
    return _regenerator["default"].wrap(function _callee9$(_context9) {
      while (1) {
        switch (_context9.prev = _context9.next) {
          case 0:
            requests = args.requests;

            if (requests) {
              _context9.next = 3;
              break;
            }

            return _context9.abrupt("return", []);

          case 3:
            _context9.prev = 3;

            if (!(context.config.requests.mode === 'rest')) {
              _context9.next = 9;
              break;
            }

            _context9.next = 7;
            return postRequestsUsingRest(requests, context);

          case 7:
            _context9.next = 11;
            break;

          case 9:
            _context9.next = 11;
            return postRequestsUsingKafka(requests, context);

          case 11:
            _context9.next = 17;
            break;

          case 13:
            _context9.prev = 13;
            _context9.t0 = _context9["catch"](3);
            console.log('[Q Server] post request failed]', _context9.t0);
            throw _context9.t0;

          case 17:
            return _context9.abrupt("return", requests.map(function (x) {
              return x.id;
            }));

          case 18:
          case "end":
            return _context9.stop();
        }
      }
    }, _callee9, null, [[3, 13]]);
  }));
  return _postRequests.apply(this, arguments);
}

var customResolvers = {
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
  overrideObject(original, customResolvers);
  return original;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9jdXN0b20tcmVzb2x2ZXJzLnYyLmpzIl0sIm5hbWVzIjpbImlzT2JqZWN0IiwidGVzdCIsIm92ZXJyaWRlT2JqZWN0Iiwib3JpZ2luYWwiLCJvdmVycmlkZXMiLCJPYmplY3QiLCJlbnRyaWVzIiwiZm9yRWFjaCIsIm5hbWUiLCJvdmVycmlkZVZhbHVlIiwiaW5mbyIsInBrZyIsIkpTT04iLCJwYXJzZSIsImZzIiwicmVhZEZpbGVTeW5jIiwicGF0aCIsInJlc29sdmUiLCJfX2Rpcm5hbWUiLCJ2ZXJzaW9uIiwiZ2V0QWNjb3VudHNDb3VudCIsIl9wYXJlbnQiLCJfYXJncyIsImNvbnRleHQiLCJkYiIsImZldGNoUXVlcnkiLCJyZXN1bHQiLCJjb3VudHMiLCJsZW5ndGgiLCJnZXRUcmFuc2FjdGlvbnNDb3VudCIsImdldEFjY291bnRzVG90YWxCYWxhbmNlIiwicGFydHMiLCJCaWdJbnQiLCJocyIsImxzIiwidG9TdHJpbmciLCJwb3N0UmVxdWVzdHNVc2luZ1Jlc3QiLCJyZXF1ZXN0cyIsImNvbmZpZyIsInVybCIsInNlcnZlciIsInRvcGljIiwibWV0aG9kIiwibW9kZSIsImNhY2hlIiwiY3JlZGVudGlhbHMiLCJoZWFkZXJzIiwicmVkaXJlY3QiLCJyZWZlcnJlciIsImJvZHkiLCJzdHJpbmdpZnkiLCJyZWNvcmRzIiwibWFwIiwicmVxdWVzdCIsImtleSIsImlkIiwidmFsdWUiLCJyZXNwb25zZSIsInN0YXR1cyIsInRleHQiLCJtZXNzYWdlIiwiRXJyb3IiLCJwb3N0UmVxdWVzdHNVc2luZ0thZmthIiwiZW5zdXJlU2hhcmVkIiwiY3JlYXRlVmFsdWUiLCJzaGFyZWQiLCJoYXMiLCJnZXQiLCJzZXQiLCJLYWZrYSIsImNsaWVudElkIiwiYnJva2VycyIsImthZmthIiwibmV3UHJvZHVjZXIiLCJwcm9kdWNlciIsImNvbm5lY3QiLCJzZW5kIiwibWVzc2FnZXMiLCJwb3N0UmVxdWVzdHMiLCJfIiwiYXJncyIsImNvbnNvbGUiLCJsb2ciLCJ4IiwiY3VzdG9tUmVzb2x2ZXJzIiwiUXVlcnkiLCJNdXRhdGlvbiIsImF0dGFjaEN1c3RvbVJlc29sdmVycyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFQTs7QUFDQTs7QUFDQTs7QUFFQTs7QUFDQTs7QUFDQTs7QUFFQSxTQUFTQSxRQUFULENBQWtCQyxJQUFsQixFQUFzQztBQUNsQyxTQUFPLHlCQUFPQSxJQUFQLE1BQWdCLFFBQWhCLElBQTRCQSxJQUFJLEtBQUssSUFBNUM7QUFDSDs7QUFFRCxTQUFTQyxjQUFULENBQXdCQyxRQUF4QixFQUF1Q0MsU0FBdkMsRUFBdUQ7QUFDbkRDLEVBQUFBLE1BQU0sQ0FBQ0MsT0FBUCxDQUFlRixTQUFmLEVBQTBCRyxPQUExQixDQUFrQyxnQkFBMkI7QUFBQTtBQUFBLFFBQXpCQyxJQUF5QjtBQUFBLFFBQW5CQyxhQUFtQjs7QUFDekQsUUFBS0QsSUFBSSxJQUFJTCxRQUFULElBQXNCSCxRQUFRLENBQUNTLGFBQUQsQ0FBOUIsSUFBaURULFFBQVEsQ0FBQ0csUUFBUSxDQUFDSyxJQUFELENBQVQsQ0FBN0QsRUFBK0U7QUFDM0VOLE1BQUFBLGNBQWMsQ0FBQ0MsUUFBUSxDQUFDSyxJQUFELENBQVQsRUFBaUJDLGFBQWpCLENBQWQ7QUFDSCxLQUZELE1BRU87QUFDSE4sTUFBQUEsUUFBUSxDQUFDSyxJQUFELENBQVIsR0FBaUJDLGFBQWpCO0FBQ0g7QUFDSixHQU5EO0FBT0g7O0FBaUJEO0FBRUEsU0FBU0MsSUFBVCxHQUFzQjtBQUNsQixNQUFNQyxHQUFHLEdBQUdDLElBQUksQ0FBQ0MsS0FBTCxDQUFZQyxlQUFHQyxZQUFILENBQWdCQyxpQkFBS0MsT0FBTCxDQUFhQyxTQUFiLEVBQXdCLElBQXhCLEVBQThCLElBQTlCLEVBQW9DLGNBQXBDLENBQWhCLENBQVosQ0FBWjtBQUNBLFNBQU87QUFDSEMsSUFBQUEsT0FBTyxFQUFFUixHQUFHLENBQUNRO0FBRFYsR0FBUDtBQUdIOztTQUVjQyxnQjs7Ozs7OzsrQkFBZixpQkFBZ0ND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LEVBSGY7O0FBQUE7QUFBQTs7QUFBQSxrQkFNWWQsT0FBTyxDQUFDZSxNQUFSLENBQWVELFFBQWYsQ0FBd0JNLElBQXhCLEtBQWlDLE1BTjdDO0FBQUE7QUFBQTtBQUFBOztBQUFBO0FBQUEsbUJBT2tCUCxxQkFBcUIsQ0FBQ0MsUUFBRCxFQUFXZCxPQUFYLENBUHZDOztBQUFBO0FBQUE7QUFBQTs7QUFBQTtBQUFBO0FBQUEsbUJBU2tCdUMsc0JBQXNCLENBQUN6QixRQUFELEVBQVdkLE9BQVgsQ0FUeEM7O0FBQUE7QUFBQTtBQUFBOztBQUFBO0FBQUE7QUFBQTtBQVlRMEQsWUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVksaUNBQVo7QUFaUjs7QUFBQTtBQUFBLDhDQWVXN0MsUUFBUSxDQUFDZSxHQUFULENBQWEsVUFBQStCLENBQUM7QUFBQSxxQkFBSUEsQ0FBQyxDQUFDNUIsRUFBTjtBQUFBLGFBQWQsQ0FmWDs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxHOzs7O0FBa0JBLElBQU02QixlQUFlLEdBQUc7QUFDcEJDLEVBQUFBLEtBQUssRUFBRTtBQUNIM0UsSUFBQUEsSUFBSSxFQUFKQSxJQURHO0FBRUhVLElBQUFBLGdCQUFnQixFQUFoQkEsZ0JBRkc7QUFHSFMsSUFBQUEsb0JBQW9CLEVBQXBCQSxvQkFIRztBQUlIQyxJQUFBQSx1QkFBdUIsRUFBdkJBO0FBSkcsR0FEYTtBQU9wQndELEVBQUFBLFFBQVEsRUFBRTtBQUNOUixJQUFBQSxZQUFZLEVBQVpBO0FBRE07QUFQVSxDQUF4Qjs7QUFZTyxTQUFTUyxxQkFBVCxDQUErQnBGLFFBQS9CLEVBQW1EO0FBQ3RERCxFQUFBQSxjQUFjLENBQUNDLFFBQUQsRUFBV2lGLGVBQVgsQ0FBZDtBQUNBLFNBQU9qRixRQUFQO0FBQ0giLCJzb3VyY2VzQ29udGVudCI6WyIvLyBAZmxvd1xuXG5pbXBvcnQgZnMgZnJvbSBcImZzXCI7XG5pbXBvcnQgeyBLYWZrYSwgUHJvZHVjZXIgfSBmcm9tIFwia2Fma2Fqc1wiO1xuaW1wb3J0IEFyYW5nbyBmcm9tIFwiLi9hcmFuZ29cIjtcbmltcG9ydCB0eXBlIHsgUUNvbmZpZyB9IGZyb20gXCIuL2NvbmZpZ1wiO1xuaW1wb3J0IHsgZW5zdXJlUHJvdG9jb2wgfSBmcm9tIFwiLi9jb25maWdcIjtcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IGZldGNoIGZyb20gJ25vZGUtZmV0Y2gnO1xuXG5mdW5jdGlvbiBpc09iamVjdCh0ZXN0OiBhbnkpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdHlwZW9mIHRlc3QgPT09ICdvYmplY3QnICYmIHRlc3QgIT09IG51bGw7XG59XG5cbmZ1bmN0aW9uIG92ZXJyaWRlT2JqZWN0KG9yaWdpbmFsOiBhbnksIG92ZXJyaWRlczogYW55KSB7XG4gICAgT2JqZWN0LmVudHJpZXMob3ZlcnJpZGVzKS5mb3JFYWNoKChbbmFtZSwgb3ZlcnJpZGVWYWx1ZV0pID0+IHtcbiAgICAgICAgaWYgKChuYW1lIGluIG9yaWdpbmFsKSAmJiBpc09iamVjdChvdmVycmlkZVZhbHVlKSAmJiBpc09iamVjdChvcmlnaW5hbFtuYW1lXSkpIHtcbiAgICAgICAgICAgIG92ZXJyaWRlT2JqZWN0KG9yaWdpbmFsW25hbWVdLCBvdmVycmlkZVZhbHVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG9yaWdpbmFsW25hbWVdID0gb3ZlcnJpZGVWYWx1ZTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG50eXBlIEluZm8gPSB7XG4gICAgdmVyc2lvbjogc3RyaW5nLFxufVxuXG50eXBlIFJlcXVlc3QgPSB7XG4gICAgaWQ6IHN0cmluZyxcbiAgICBib2R5OiBzdHJpbmcsXG59XG5cbnR5cGUgQ29udGV4dCA9IHtcbiAgICBkYjogQXJhbmdvLFxuICAgIGNvbmZpZzogUUNvbmZpZyxcbiAgICBzaGFyZWQ6IE1hcDxzdHJpbmcsIGFueT4sXG59XG5cbi8vIFF1ZXJ5XG5cbmZ1bmN0aW9uIGluZm8oKTogSW5mbyB7XG4gICAgY29uc3QgcGtnID0gSlNPTi5wYXJzZSgoZnMucmVhZEZpbGVTeW5jKHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuLicsICcuLicsICdwYWNrYWdlLmpzb24nKSk6IGFueSkpO1xuICAgIHJldHVybiB7XG4gICAgICAgIHZlcnNpb246IHBrZy52ZXJzaW9uLFxuICAgIH07XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGdldEFjY291bnRzQ291bnQoX3BhcmVudCwgX2FyZ3MsIGNvbnRleHQ6IENvbnRleHQpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGNvbnN0IHJlc3VsdDogYW55ID0gYXdhaXQgY29udGV4dC5kYi5mZXRjaFF1ZXJ5KGBSRVRVUk4gTEVOR1RIKGFjY291bnRzKWAsIHt9KTtcbiAgICBjb25zdCBjb3VudHMgPSAocmVzdWx0OiBudW1iZXJbXSk7XG4gICAgcmV0dXJuIGNvdW50cy5sZW5ndGggPiAwID8gY291bnRzWzBdIDogMDtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZ2V0VHJhbnNhY3Rpb25zQ291bnQoX3BhcmVudCwgX2FyZ3MsIGNvbnRleHQ6IENvbnRleHQpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGNvbnN0IHJlc3VsdDogYW55ID0gYXdhaXQgY29udGV4dC5kYi5mZXRjaFF1ZXJ5KGBSRVRVUk4gTEVOR1RIKHRyYW5zYWN0aW9ucylgLCB7fSk7XG4gICAgY29uc3QgY291bnRzID0gKHJlc3VsdDogbnVtYmVyW10pO1xuICAgIHJldHVybiBjb3VudHMubGVuZ3RoID4gMCA/IGNvdW50c1swXSA6IDA7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGdldEFjY291bnRzVG90YWxCYWxhbmNlKF9wYXJlbnQsIF9hcmdzLCBjb250ZXh0OiBDb250ZXh0KTogUHJvbWlzZTxTdHJpbmc+IHtcbiAgICAvKlxuICAgIEJlY2F1c2UgYXJhbmdvIGNhbiBub3Qgc3VtIEJpZ0ludHMgd2UgbmVlZCB0byBzdW0gc2VwYXJhdGVseTpcbiAgICBocyA9IFNVTSBvZiBoaWdoIGJpdHMgKGZyb20gMjQtYml0IGFuZCBoaWdoZXIpXG4gICAgbHMgPSBTVU0gb2YgbG93ZXIgMjQgYml0c1xuICAgIEFuZCB0aGUgdG90YWwgcmVzdWx0IGlzIChocyA8PCAyNCkgKyBsc1xuICAgICAqL1xuXG4gICAgY29uc3QgcmVzdWx0OiBhbnkgPSBhd2FpdCBjb250ZXh0LmRiLmZldGNoUXVlcnkoYFxuICAgICAgICBMRVQgZCA9IDE2Nzc3MjE2XG4gICAgICAgIEZPUiBhIGluIGFjY291bnRzXG4gICAgICAgIExFVCBiID0gVE9fTlVNQkVSKENPTkNBVChcIjB4XCIsIFNVQlNUUklORyhhLmJhbGFuY2UsIDIpKSlcbiAgICAgICAgQ09MTEVDVCBBR0dSRUdBVEVcbiAgICAgICAgICAgIGhzID0gU1VNKEZMT09SKGIgLyBkKSksXG4gICAgICAgICAgICBscyA9IFNVTShiICUgKGQgLSAxKSlcbiAgICAgICAgUkVUVVJOIHsgaHMsIGxzIH1cbiAgICBgLCB7fSk7XG4gICAgY29uc3QgcGFydHMgPSAocmVzdWx0OiB7aHM6bnVtYmVyLCBsczogbnVtYmVyfVtdKVswXTtcbiAgICAvLyRGbG93Rml4TWVcbiAgICByZXR1cm4gKEJpZ0ludChwYXJ0cy5ocykgKiBCaWdJbnQoMHgxMDAwMDAwKSArIEJpZ0ludChwYXJ0cy5scykpLnRvU3RyaW5nKCk7XG59XG5cbi8vIE11dGF0aW9uXG5cbmFzeW5jIGZ1bmN0aW9uIHBvc3RSZXF1ZXN0c1VzaW5nUmVzdChyZXF1ZXN0czogUmVxdWVzdFtdLCBjb250ZXh0OiBDb250ZXh0KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgY29uZmlnID0gY29udGV4dC5jb25maWcucmVxdWVzdHM7XG4gICAgY29uc3QgdXJsID0gYCR7ZW5zdXJlUHJvdG9jb2woY29uZmlnLnNlcnZlciwgJ2h0dHAnKX0vdG9waWNzLyR7Y29uZmlnLnRvcGljfWA7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCh1cmwsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIG1vZGU6ICdjb3JzJyxcbiAgICAgICAgY2FjaGU6ICduby1jYWNoZScsXG4gICAgICAgIGNyZWRlbnRpYWxzOiAnc2FtZS1vcmlnaW4nLFxuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICB9LFxuICAgICAgICByZWRpcmVjdDogJ2ZvbGxvdycsXG4gICAgICAgIHJlZmVycmVyOiAnbm8tcmVmZXJyZXInLFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICByZWNvcmRzOiByZXF1ZXN0cy5tYXAoKHJlcXVlc3QpID0+ICh7XG4gICAgICAgICAgICAgICAga2V5OiByZXF1ZXN0LmlkLFxuICAgICAgICAgICAgICAgIHZhbHVlOiByZXF1ZXN0LmJvZHksXG4gICAgICAgICAgICB9KSksXG4gICAgICAgIH0pLFxuICAgIH0pO1xuICAgIGlmIChyZXNwb25zZS5zdGF0dXMgIT09IDIwMCkge1xuICAgICAgICBjb25zdCBtZXNzYWdlID0gYFBvc3QgcmVxdWVzdHMgZmFpbGVkOiAke2F3YWl0IHJlc3BvbnNlLnRleHQoKX1gO1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IobWVzc2FnZSk7XG4gICAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBwb3N0UmVxdWVzdHNVc2luZ0thZmthKHJlcXVlc3RzOiBSZXF1ZXN0W10sIGNvbnRleHQ6IENvbnRleHQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBlbnN1cmVTaGFyZWQgPSBhc3luYyAobmFtZSwgY3JlYXRlVmFsdWU6ICgpID0+IFByb21pc2U8YW55PikgPT4ge1xuICAgICAgICBpZiAoY29udGV4dC5zaGFyZWQuaGFzKG5hbWUpKSB7XG4gICAgICAgICAgICByZXR1cm4gY29udGV4dC5zaGFyZWQuZ2V0KG5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHZhbHVlID0gYXdhaXQgY3JlYXRlVmFsdWUoKTtcbiAgICAgICAgY29udGV4dC5zaGFyZWQuc2V0KG5hbWUsIHZhbHVlKTtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH07XG5cbiAgICBjb25zdCBjb25maWcgPSBjb250ZXh0LmNvbmZpZy5yZXF1ZXN0cztcbiAgICBjb25zdCBwcm9kdWNlcjogUHJvZHVjZXIgPSBhd2FpdCBlbnN1cmVTaGFyZWQoJ3Byb2R1Y2VyJywgYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBrYWZrYTogS2Fma2EgPSBhd2FpdCBlbnN1cmVTaGFyZWQoJ2thZmthJywgYXN5bmMgKCkgPT4gbmV3IEthZmthKHtcbiAgICAgICAgICAgIGNsaWVudElkOiAncS1zZXJ2ZXInLFxuICAgICAgICAgICAgYnJva2VyczogW2NvbmZpZy5zZXJ2ZXJdXG4gICAgICAgIH0pKTtcbiAgICAgICAgY29uc3QgbmV3UHJvZHVjZXIgPSBrYWZrYS5wcm9kdWNlcigpO1xuICAgICAgICBhd2FpdCBuZXdQcm9kdWNlci5jb25uZWN0KCk7XG4gICAgICAgIHJldHVybiBuZXdQcm9kdWNlcjtcblxuICAgIH0pO1xuICAgIGF3YWl0IHByb2R1Y2VyLnNlbmQoe1xuICAgICAgICB0b3BpYzogY29uZmlnLnRvcGljLFxuICAgICAgICBtZXNzYWdlczogcmVxdWVzdHMubWFwKChyZXF1ZXN0KSA9PiAoe1xuICAgICAgICAgICAga2V5OiByZXF1ZXN0LmlkLFxuICAgICAgICAgICAgdmFsdWU6IHJlcXVlc3QuYm9keSxcbiAgICAgICAgfSkpLFxuICAgIH0pO1xufVxuXG5hc3luYyBmdW5jdGlvbiBwb3N0UmVxdWVzdHMoXywgYXJnczogeyByZXF1ZXN0czogUmVxdWVzdFtdIH0sIGNvbnRleHQ6IENvbnRleHQpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgY29uc3QgcmVxdWVzdHM6ID8oUmVxdWVzdFtdKSA9IGFyZ3MucmVxdWVzdHM7XG4gICAgaWYgKCFyZXF1ZXN0cykge1xuICAgICAgICByZXR1cm4gW107XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIGlmIChjb250ZXh0LmNvbmZpZy5yZXF1ZXN0cy5tb2RlID09PSAncmVzdCcpIHtcbiAgICAgICAgICAgIGF3YWl0IHBvc3RSZXF1ZXN0c1VzaW5nUmVzdChyZXF1ZXN0cywgY29udGV4dCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhd2FpdCBwb3N0UmVxdWVzdHNVc2luZ0thZmthKHJlcXVlc3RzLCBjb250ZXh0KTtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdbUSBTZXJ2ZXJdIHBvc3QgcmVxdWVzdCBmYWlsZWRdJywgZXJyb3IpO1xuICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gICAgcmV0dXJuIHJlcXVlc3RzLm1hcCh4ID0+IHguaWQpO1xufVxuXG5jb25zdCBjdXN0b21SZXNvbHZlcnMgPSB7XG4gICAgUXVlcnk6IHtcbiAgICAgICAgaW5mbyxcbiAgICAgICAgZ2V0QWNjb3VudHNDb3VudCxcbiAgICAgICAgZ2V0VHJhbnNhY3Rpb25zQ291bnQsXG4gICAgICAgIGdldEFjY291bnRzVG90YWxCYWxhbmNlLFxuICAgIH0sXG4gICAgTXV0YXRpb246IHtcbiAgICAgICAgcG9zdFJlcXVlc3RzLFxuICAgIH0sXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gYXR0YWNoQ3VzdG9tUmVzb2x2ZXJzKG9yaWdpbmFsOiBhbnkpOiBhbnkge1xuICAgIG92ZXJyaWRlT2JqZWN0KG9yaWdpbmFsLCBjdXN0b21SZXNvbHZlcnMpO1xuICAgIHJldHVybiBvcmlnaW5hbDtcbn1cbiJdfQ==