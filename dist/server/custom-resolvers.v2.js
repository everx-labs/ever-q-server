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
            parts = result[0];
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9jdXN0b20tcmVzb2x2ZXJzLnYyLmpzIl0sIm5hbWVzIjpbImlzT2JqZWN0IiwidGVzdCIsIm92ZXJyaWRlT2JqZWN0Iiwib3JpZ2luYWwiLCJvdmVycmlkZXMiLCJPYmplY3QiLCJlbnRyaWVzIiwiZm9yRWFjaCIsIm5hbWUiLCJvdmVycmlkZVZhbHVlIiwiaW5mbyIsInBrZyIsIkpTT04iLCJwYXJzZSIsImZzIiwicmVhZEZpbGVTeW5jIiwicGF0aCIsInJlc29sdmUiLCJfX2Rpcm5hbWUiLCJ2ZXJzaW9uIiwiZ2V0QWNjb3VudHNDb3VudCIsIl9wYXJlbnQiLCJfYXJncyIsImNvbnRleHQiLCJkYiIsImZldGNoUXVlcnkiLCJyZXN1bHQiLCJjb3VudHMiLCJsZW5ndGgiLCJnZXRUcmFuc2FjdGlvbnNDb3VudCIsImdldEFjY291bnRzVG90YWxCYWxhbmNlIiwicGFydHMiLCJCaWdJbnQiLCJocyIsImxzIiwidG9TdHJpbmciLCJwb3N0UmVxdWVzdHNVc2luZ1Jlc3QiLCJyZXF1ZXN0cyIsImNvbmZpZyIsInVybCIsInNlcnZlciIsInRvcGljIiwibWV0aG9kIiwibW9kZSIsImNhY2hlIiwiY3JlZGVudGlhbHMiLCJoZWFkZXJzIiwicmVkaXJlY3QiLCJyZWZlcnJlciIsImJvZHkiLCJzdHJpbmdpZnkiLCJyZWNvcmRzIiwibWFwIiwicmVxdWVzdCIsImtleSIsImlkIiwidmFsdWUiLCJyZXNwb25zZSIsInN0YXR1cyIsInRleHQiLCJtZXNzYWdlIiwiRXJyb3IiLCJwb3N0UmVxdWVzdHNVc2luZ0thZmthIiwiZW5zdXJlU2hhcmVkIiwiY3JlYXRlVmFsdWUiLCJzaGFyZWQiLCJoYXMiLCJnZXQiLCJzZXQiLCJLYWZrYSIsImNsaWVudElkIiwiYnJva2VycyIsImthZmthIiwibmV3UHJvZHVjZXIiLCJwcm9kdWNlciIsImNvbm5lY3QiLCJzZW5kIiwibWVzc2FnZXMiLCJwb3N0UmVxdWVzdHMiLCJfIiwiYXJncyIsImNvbnNvbGUiLCJsb2ciLCJ4IiwiY3VzdG9tUmVzb2x2ZXJzIiwiUXVlcnkiLCJNdXRhdGlvbiIsImF0dGFjaEN1c3RvbVJlc29sdmVycyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFQTs7QUFDQTs7QUFDQTs7QUFFQTs7QUFDQTs7QUFDQTs7QUFFQSxTQUFTQSxRQUFULENBQWtCQyxJQUFsQixFQUFzQztBQUNsQyxTQUFPLHlCQUFPQSxJQUFQLE1BQWdCLFFBQWhCLElBQTRCQSxJQUFJLEtBQUssSUFBNUM7QUFDSDs7QUFFRCxTQUFTQyxjQUFULENBQXdCQyxRQUF4QixFQUF1Q0MsU0FBdkMsRUFBdUQ7QUFDbkRDLEVBQUFBLE1BQU0sQ0FBQ0MsT0FBUCxDQUFlRixTQUFmLEVBQTBCRyxPQUExQixDQUFrQyxnQkFBMkI7QUFBQTtBQUFBLFFBQXpCQyxJQUF5QjtBQUFBLFFBQW5CQyxhQUFtQjs7QUFDekQsUUFBS0QsSUFBSSxJQUFJTCxRQUFULElBQXNCSCxRQUFRLENBQUNTLGFBQUQsQ0FBOUIsSUFBaURULFFBQVEsQ0FBQ0csUUFBUSxDQUFDSyxJQUFELENBQVQsQ0FBN0QsRUFBK0U7QUFDM0VOLE1BQUFBLGNBQWMsQ0FBQ0MsUUFBUSxDQUFDSyxJQUFELENBQVQsRUFBaUJDLGFBQWpCLENBQWQ7QUFDSCxLQUZELE1BRU87QUFDSE4sTUFBQUEsUUFBUSxDQUFDSyxJQUFELENBQVIsR0FBaUJDLGFBQWpCO0FBQ0g7QUFDSixHQU5EO0FBT0g7O0FBaUJEO0FBRUEsU0FBU0MsSUFBVCxHQUFzQjtBQUNsQixNQUFNQyxHQUFHLEdBQUdDLElBQUksQ0FBQ0MsS0FBTCxDQUFZQyxlQUFHQyxZQUFILENBQWdCQyxpQkFBS0MsT0FBTCxDQUFhQyxTQUFiLEVBQXdCLElBQXhCLEVBQThCLElBQTlCLEVBQW9DLGNBQXBDLENBQWhCLENBQVosQ0FBWjtBQUNBLFNBQU87QUFDSEMsSUFBQUEsT0FBTyxFQUFFUixHQUFHLENBQUNRO0FBRFYsR0FBUDtBQUdIOztTQUVjQyxnQjs7Ozs7OzsrQkFBZixpQkFBZ0NDLE9BQWhDLEVBQXlDQyxLQUF6QyxFQUFnREMsT0FBaEQ7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxtQkFDOEJBLE9BQU8sQ0FBQ0MsRUFBUixDQUFXQyxVQUFYLDRCQUFpRCxFQUFqRCxDQUQ5Qjs7QUFBQTtBQUNVQyxZQUFBQSxNQURWO0FBRVVDLFlBQUFBLE1BRlYsR0FFb0JELE1BRnBCO0FBQUEsNkNBR1dDLE1BQU0sQ0FBQ0MsTUFBUCxHQUFnQixDQUFoQixHQUFvQkQsTUFBTSxDQUFDLENBQUQsQ0FBMUIsR0FBZ0MsQ0FIM0M7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRzs7OztTQU9lRSxvQjs7Ozs7OzsrQkFBZixrQkFBb0NSLE9BQXBDLEVBQTZDQyxLQUE3QyxFQUFvREMsT0FBcEQ7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxtQkFDOEJBLE9BQU8sQ0FBQ0MsRUFBUixDQUFXQyxVQUFYLGdDQUFxRCxFQUFyRCxDQUQ5Qjs7QUFBQTtBQUNVQyxZQUFBQSxNQURWO0FBRVVDLFlBQUFBLE1BRlYsR0FFb0JELE1BRnBCO0FBQUEsOENBR1dDLE1BQU0sQ0FBQ0MsTUFBUCxHQUFnQixDQUFoQixHQUFvQkQsTUFBTSxDQUFDLENBQUQsQ0FBMUIsR0FBZ0MsQ0FIM0M7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRzs7OztTQU1lRyx1Qjs7RUFlZjs7Ozs7OytCQWZBLGtCQUF1Q1QsT0FBdkMsRUFBZ0RDLEtBQWhELEVBQXVEQyxPQUF2RDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLG1CQUM4QkEsT0FBTyxDQUFDQyxFQUFSLENBQVdDLFVBQVgsa1FBUXZCLEVBUnVCLENBRDlCOztBQUFBO0FBQ1VDLFlBQUFBLE1BRFY7QUFVVUssWUFBQUEsS0FWVixHQVVtQkwsTUFBRCxDQUFvQyxDQUFwQyxDQVZsQjtBQUFBLDhDQVdXLENBQUNNLE1BQU0sQ0FBQ0QsS0FBSyxDQUFDRSxFQUFQLENBQU4sR0FBbUJELE1BQU0sQ0FBQyxTQUFELENBQXpCLEdBQXVDQSxNQUFNLENBQUNELEtBQUssQ0FBQ0csRUFBUCxDQUE5QyxFQUEwREMsUUFBMUQsRUFYWDs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxHOzs7O1NBaUJlQyxxQjs7Ozs7OzsrQkFBZixrQkFBcUNDLFFBQXJDLEVBQTBEZCxPQUExRDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFDVWUsWUFBQUEsTUFEVixHQUNtQmYsT0FBTyxDQUFDZSxNQUFSLENBQWVELFFBRGxDO0FBRVVFLFlBQUFBLEdBRlYsYUFFbUIsNEJBQWVELE1BQU0sQ0FBQ0UsTUFBdEIsRUFBOEIsTUFBOUIsQ0FGbkIscUJBRW1FRixNQUFNLENBQUNHLEtBRjFFO0FBQUE7QUFBQSxtQkFHMkIsMkJBQU1GLEdBQU4sRUFBVztBQUM5QkcsY0FBQUEsTUFBTSxFQUFFLE1BRHNCO0FBRTlCQyxjQUFBQSxJQUFJLEVBQUUsTUFGd0I7QUFHOUJDLGNBQUFBLEtBQUssRUFBRSxVQUh1QjtBQUk5QkMsY0FBQUEsV0FBVyxFQUFFLGFBSmlCO0FBSzlCQyxjQUFBQSxPQUFPLEVBQUU7QUFDTCxnQ0FBZ0I7QUFEWCxlQUxxQjtBQVE5QkMsY0FBQUEsUUFBUSxFQUFFLFFBUm9CO0FBUzlCQyxjQUFBQSxRQUFRLEVBQUUsYUFUb0I7QUFVOUJDLGNBQUFBLElBQUksRUFBRXJDLElBQUksQ0FBQ3NDLFNBQUwsQ0FBZTtBQUNqQkMsZ0JBQUFBLE9BQU8sRUFBRWQsUUFBUSxDQUFDZSxHQUFULENBQWEsVUFBQ0MsT0FBRDtBQUFBLHlCQUFjO0FBQ2hDQyxvQkFBQUEsR0FBRyxFQUFFRCxPQUFPLENBQUNFLEVBRG1CO0FBRWhDQyxvQkFBQUEsS0FBSyxFQUFFSCxPQUFPLENBQUNKO0FBRmlCLG1CQUFkO0FBQUEsaUJBQWI7QUFEUSxlQUFmO0FBVndCLGFBQVgsQ0FIM0I7O0FBQUE7QUFHVVEsWUFBQUEsUUFIVjs7QUFBQSxrQkFvQlFBLFFBQVEsQ0FBQ0MsTUFBVCxLQUFvQixHQXBCNUI7QUFBQTtBQUFBO0FBQUE7O0FBQUE7QUFBQTtBQUFBLG1CQXFCdURELFFBQVEsQ0FBQ0UsSUFBVCxFQXJCdkQ7O0FBQUE7QUFBQTtBQXFCY0MsWUFBQUEsT0FyQmQ7QUFBQSxrQkFzQmMsSUFBSUMsS0FBSixDQUFVRCxPQUFWLENBdEJkOztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEc7Ozs7U0EwQmVFLHNCOzs7Ozs7OytCQUFmLGtCQUFzQ3pCLFFBQXRDLEVBQTJEZCxPQUEzRDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFDVXdDLFlBQUFBLFlBRFY7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLDJDQUN5QixrQkFBT3ZELElBQVAsRUFBYXdELFdBQWI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsNkJBQ2J6QyxPQUFPLENBQUMwQyxNQUFSLENBQWVDLEdBQWYsQ0FBbUIxRCxJQUFuQixDQURhO0FBQUE7QUFBQTtBQUFBOztBQUFBLDBEQUVOZSxPQUFPLENBQUMwQyxNQUFSLENBQWVFLEdBQWYsQ0FBbUIzRCxJQUFuQixDQUZNOztBQUFBO0FBQUE7QUFBQSwrQkFJR3dELFdBQVcsRUFKZDs7QUFBQTtBQUlYUix3QkFBQUEsS0FKVztBQUtqQmpDLHdCQUFBQSxPQUFPLENBQUMwQyxNQUFSLENBQWVHLEdBQWYsQ0FBbUI1RCxJQUFuQixFQUF5QmdELEtBQXpCO0FBTGlCLDBEQU1WQSxLQU5VOztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLGVBRHpCOztBQUFBLDhCQUNVTyxZQURWO0FBQUE7QUFBQTtBQUFBOztBQVVVekIsWUFBQUEsTUFWVixHQVVtQmYsT0FBTyxDQUFDZSxNQUFSLENBQWVELFFBVmxDO0FBQUE7QUFBQSxtQkFXcUMwQixZQUFZLENBQUMsVUFBRDtBQUFBO0FBQUE7QUFBQTtBQUFBLHlDQUFhO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsNkJBQzNCQSxZQUFZLENBQUMsT0FBRDtBQUFBO0FBQUE7QUFBQTtBQUFBLG1EQUFVO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxrRUFBWSxJQUFJTSxjQUFKLENBQVU7QUFDbkVDLGtDQUFBQSxRQUFRLEVBQUUsVUFEeUQ7QUFFbkVDLGtDQUFBQSxPQUFPLEVBQUUsQ0FBQ2pDLE1BQU0sQ0FBQ0UsTUFBUjtBQUYwRCxpQ0FBVixDQUFaOztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLHVCQUFWLEdBRGU7O0FBQUE7QUFDaERnQyxzQkFBQUEsS0FEZ0Q7QUFLaERDLHNCQUFBQSxXQUxnRCxHQUtsQ0QsS0FBSyxDQUFDRSxRQUFOLEVBTGtDO0FBQUE7QUFBQSw2QkFNaERELFdBQVcsQ0FBQ0UsT0FBWixFQU5nRDs7QUFBQTtBQUFBLHdEQU8vQ0YsV0FQK0M7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsYUFBYixHQVhqRDs7QUFBQTtBQVdVQyxZQUFBQSxRQVhWO0FBQUE7QUFBQSxtQkFxQlVBLFFBQVEsQ0FBQ0UsSUFBVCxDQUFjO0FBQ2hCbkMsY0FBQUEsS0FBSyxFQUFFSCxNQUFNLENBQUNHLEtBREU7QUFFaEJvQyxjQUFBQSxRQUFRLEVBQUV4QyxRQUFRLENBQUNlLEdBQVQsQ0FBYSxVQUFDQyxPQUFEO0FBQUEsdUJBQWM7QUFDakNDLGtCQUFBQSxHQUFHLEVBQUVELE9BQU8sQ0FBQ0UsRUFEb0I7QUFFakNDLGtCQUFBQSxLQUFLLEVBQUVILE9BQU8sQ0FBQ0o7QUFGa0IsaUJBQWQ7QUFBQSxlQUFiO0FBRk0sYUFBZCxDQXJCVjs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxHOzs7O1NBOEJlNkIsWTs7Ozs7OzsrQkFBZixrQkFBNEJDLENBQTVCLEVBQStCQyxJQUEvQixFQUE4RHpELE9BQTlEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUNVYyxZQUFBQSxRQURWLEdBQ21DMkMsSUFBSSxDQUFDM0MsUUFEeEM7O0FBQUEsZ0JBRVNBLFFBRlQ7QUFBQTtBQUFBO0FBQUE7O0FBQUEsOENBR2UsRUFIZjs7QUFBQTtBQUFBOztBQUFBLGtCQU1ZZCxPQUFPLENBQUNlLE1BQVIsQ0FBZUQsUUFBZixDQUF3Qk0sSUFBeEIsS0FBaUMsTUFON0M7QUFBQTtBQUFBO0FBQUE7O0FBQUE7QUFBQSxtQkFPa0JQLHFCQUFxQixDQUFDQyxRQUFELEVBQVdkLE9BQVgsQ0FQdkM7O0FBQUE7QUFBQTtBQUFBOztBQUFBO0FBQUE7QUFBQSxtQkFTa0J1QyxzQkFBc0IsQ0FBQ3pCLFFBQUQsRUFBV2QsT0FBWCxDQVR4Qzs7QUFBQTtBQUFBO0FBQUE7O0FBQUE7QUFBQTtBQUFBO0FBWVEwRCxZQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSxpQ0FBWjtBQVpSOztBQUFBO0FBQUEsOENBZVc3QyxRQUFRLENBQUNlLEdBQVQsQ0FBYSxVQUFBK0IsQ0FBQztBQUFBLHFCQUFJQSxDQUFDLENBQUM1QixFQUFOO0FBQUEsYUFBZCxDQWZYOztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEc7Ozs7QUFrQkEsSUFBTTZCLGVBQWUsR0FBRztBQUNwQkMsRUFBQUEsS0FBSyxFQUFFO0FBQ0gzRSxJQUFBQSxJQUFJLEVBQUpBLElBREc7QUFFSFUsSUFBQUEsZ0JBQWdCLEVBQWhCQSxnQkFGRztBQUdIUyxJQUFBQSxvQkFBb0IsRUFBcEJBLG9CQUhHO0FBSUhDLElBQUFBLHVCQUF1QixFQUF2QkE7QUFKRyxHQURhO0FBT3BCd0QsRUFBQUEsUUFBUSxFQUFFO0FBQ05SLElBQUFBLFlBQVksRUFBWkE7QUFETTtBQVBVLENBQXhCOztBQVlPLFNBQVNTLHFCQUFULENBQStCcEYsUUFBL0IsRUFBbUQ7QUFDdERELEVBQUFBLGNBQWMsQ0FBQ0MsUUFBRCxFQUFXaUYsZUFBWCxDQUFkO0FBQ0EsU0FBT2pGLFFBQVA7QUFDSCIsInNvdXJjZXNDb250ZW50IjpbIi8vIEBmbG93XG5cbmltcG9ydCBmcyBmcm9tIFwiZnNcIjtcbmltcG9ydCB7IEthZmthLCBQcm9kdWNlciB9IGZyb20gXCJrYWZrYWpzXCI7XG5pbXBvcnQgQXJhbmdvIGZyb20gXCIuL2FyYW5nb1wiO1xuaW1wb3J0IHR5cGUgeyBRQ29uZmlnIH0gZnJvbSBcIi4vY29uZmlnXCI7XG5pbXBvcnQgeyBlbnN1cmVQcm90b2NvbCB9IGZyb20gXCIuL2NvbmZpZ1wiO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgZmV0Y2ggZnJvbSAnbm9kZS1mZXRjaCc7XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KHRlc3Q6IGFueSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0eXBlb2YgdGVzdCA9PT0gJ29iamVjdCcgJiYgdGVzdCAhPT0gbnVsbDtcbn1cblxuZnVuY3Rpb24gb3ZlcnJpZGVPYmplY3Qob3JpZ2luYWw6IGFueSwgb3ZlcnJpZGVzOiBhbnkpIHtcbiAgICBPYmplY3QuZW50cmllcyhvdmVycmlkZXMpLmZvckVhY2goKFtuYW1lLCBvdmVycmlkZVZhbHVlXSkgPT4ge1xuICAgICAgICBpZiAoKG5hbWUgaW4gb3JpZ2luYWwpICYmIGlzT2JqZWN0KG92ZXJyaWRlVmFsdWUpICYmIGlzT2JqZWN0KG9yaWdpbmFsW25hbWVdKSkge1xuICAgICAgICAgICAgb3ZlcnJpZGVPYmplY3Qob3JpZ2luYWxbbmFtZV0sIG92ZXJyaWRlVmFsdWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb3JpZ2luYWxbbmFtZV0gPSBvdmVycmlkZVZhbHVlO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbnR5cGUgSW5mbyA9IHtcbiAgICB2ZXJzaW9uOiBzdHJpbmcsXG59XG5cbnR5cGUgUmVxdWVzdCA9IHtcbiAgICBpZDogc3RyaW5nLFxuICAgIGJvZHk6IHN0cmluZyxcbn1cblxudHlwZSBDb250ZXh0ID0ge1xuICAgIGRiOiBBcmFuZ28sXG4gICAgY29uZmlnOiBRQ29uZmlnLFxuICAgIHNoYXJlZDogTWFwPHN0cmluZywgYW55Pixcbn1cblxuLy8gUXVlcnlcblxuZnVuY3Rpb24gaW5mbygpOiBJbmZvIHtcbiAgICBjb25zdCBwa2cgPSBKU09OLnBhcnNlKChmcy5yZWFkRmlsZVN5bmMocGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4uJywgJy4uJywgJ3BhY2thZ2UuanNvbicpKTogYW55KSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdmVyc2lvbjogcGtnLnZlcnNpb24sXG4gICAgfTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZ2V0QWNjb3VudHNDb3VudChfcGFyZW50LCBfYXJncywgY29udGV4dDogQ29udGV4dCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgY29uc3QgcmVzdWx0OiBhbnkgPSBhd2FpdCBjb250ZXh0LmRiLmZldGNoUXVlcnkoYFJFVFVSTiBMRU5HVEgoYWNjb3VudHMpYCwge30pO1xuICAgIGNvbnN0IGNvdW50cyA9IChyZXN1bHQ6IG51bWJlcltdKTtcbiAgICByZXR1cm4gY291bnRzLmxlbmd0aCA+IDAgPyBjb3VudHNbMF0gOiAwO1xufVxuXG5cbmFzeW5jIGZ1bmN0aW9uIGdldFRyYW5zYWN0aW9uc0NvdW50KF9wYXJlbnQsIF9hcmdzLCBjb250ZXh0OiBDb250ZXh0KTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBjb25zdCByZXN1bHQ6IGFueSA9IGF3YWl0IGNvbnRleHQuZGIuZmV0Y2hRdWVyeShgUkVUVVJOIExFTkdUSCh0cmFuc2FjdGlvbnMpYCwge30pO1xuICAgIGNvbnN0IGNvdW50cyA9IChyZXN1bHQ6IG51bWJlcltdKTtcbiAgICByZXR1cm4gY291bnRzLmxlbmd0aCA+IDAgPyBjb3VudHNbMF0gOiAwO1xufVxuXG5hc3luYyBmdW5jdGlvbiBnZXRBY2NvdW50c1RvdGFsQmFsYW5jZShfcGFyZW50LCBfYXJncywgY29udGV4dDogQ29udGV4dCk6IFByb21pc2U8U3RyaW5nPiB7XG4gICAgY29uc3QgcmVzdWx0OiBhbnkgPSBhd2FpdCBjb250ZXh0LmRiLmZldGNoUXVlcnkoYFxuICAgICAgICBMRVQgZCA9IDE2Nzc3MjE2XG4gICAgICAgIEZPUiBhIGluIGFjY291bnRzXG4gICAgICAgIExFVCBiID0gVE9fTlVNQkVSKENPTkNBVChcIjB4XCIsIFNVQlNUUklORyhhLmJhbGFuY2UsIDIpKSlcbiAgICAgICAgQ09MTEVDVCBBR0dSRUdBVEVcbiAgICAgICAgICAgIGhzID0gU1VNKEZMT09SKGIgLyBkKSksXG4gICAgICAgICAgICBscyA9IFNVTShiICUgKGQgLSAxKSlcbiAgICAgICAgUkVUVVJOIHsgaHMsIGxzIH1cbiAgICBgLCB7fSk7XG4gICAgY29uc3QgcGFydHMgPSAocmVzdWx0OiB7aHM6bnVtYmVyLCBsczogbnVtYmVyfVtdKVswXTtcbiAgICByZXR1cm4gKEJpZ0ludChwYXJ0cy5ocykgKiBCaWdJbnQoMHgxMDAwMDAwKSArIEJpZ0ludChwYXJ0cy5scykpLnRvU3RyaW5nKCk7XG59XG5cblxuLy8gTXV0YXRpb25cblxuYXN5bmMgZnVuY3Rpb24gcG9zdFJlcXVlc3RzVXNpbmdSZXN0KHJlcXVlc3RzOiBSZXF1ZXN0W10sIGNvbnRleHQ6IENvbnRleHQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBjb25maWcgPSBjb250ZXh0LmNvbmZpZy5yZXF1ZXN0cztcbiAgICBjb25zdCB1cmwgPSBgJHtlbnN1cmVQcm90b2NvbChjb25maWcuc2VydmVyLCAnaHR0cCcpfS90b3BpY3MvJHtjb25maWcudG9waWN9YDtcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKHVybCwge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgbW9kZTogJ2NvcnMnLFxuICAgICAgICBjYWNoZTogJ25vLWNhY2hlJyxcbiAgICAgICAgY3JlZGVudGlhbHM6ICdzYW1lLW9yaWdpbicsXG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgIH0sXG4gICAgICAgIHJlZGlyZWN0OiAnZm9sbG93JyxcbiAgICAgICAgcmVmZXJyZXI6ICduby1yZWZlcnJlcicsXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgIHJlY29yZHM6IHJlcXVlc3RzLm1hcCgocmVxdWVzdCkgPT4gKHtcbiAgICAgICAgICAgICAgICBrZXk6IHJlcXVlc3QuaWQsXG4gICAgICAgICAgICAgICAgdmFsdWU6IHJlcXVlc3QuYm9keSxcbiAgICAgICAgICAgIH0pKSxcbiAgICAgICAgfSksXG4gICAgfSk7XG4gICAgaWYgKHJlc3BvbnNlLnN0YXR1cyAhPT0gMjAwKSB7XG4gICAgICAgIGNvbnN0IG1lc3NhZ2UgPSBgUG9zdCByZXF1ZXN0cyBmYWlsZWQ6ICR7YXdhaXQgcmVzcG9uc2UudGV4dCgpfWA7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihtZXNzYWdlKTtcbiAgICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHBvc3RSZXF1ZXN0c1VzaW5nS2Fma2EocmVxdWVzdHM6IFJlcXVlc3RbXSwgY29udGV4dDogQ29udGV4dCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGVuc3VyZVNoYXJlZCA9IGFzeW5jIChuYW1lLCBjcmVhdGVWYWx1ZTogKCkgPT4gUHJvbWlzZTxhbnk+KSA9PiB7XG4gICAgICAgIGlmIChjb250ZXh0LnNoYXJlZC5oYXMobmFtZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBjb250ZXh0LnNoYXJlZC5nZXQobmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdmFsdWUgPSBhd2FpdCBjcmVhdGVWYWx1ZSgpO1xuICAgICAgICBjb250ZXh0LnNoYXJlZC5zZXQobmFtZSwgdmFsdWUpO1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfTtcblxuICAgIGNvbnN0IGNvbmZpZyA9IGNvbnRleHQuY29uZmlnLnJlcXVlc3RzO1xuICAgIGNvbnN0IHByb2R1Y2VyOiBQcm9kdWNlciA9IGF3YWl0IGVuc3VyZVNoYXJlZCgncHJvZHVjZXInLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGthZmthOiBLYWZrYSA9IGF3YWl0IGVuc3VyZVNoYXJlZCgna2Fma2EnLCBhc3luYyAoKSA9PiBuZXcgS2Fma2Eoe1xuICAgICAgICAgICAgY2xpZW50SWQ6ICdxLXNlcnZlcicsXG4gICAgICAgICAgICBicm9rZXJzOiBbY29uZmlnLnNlcnZlcl1cbiAgICAgICAgfSkpO1xuICAgICAgICBjb25zdCBuZXdQcm9kdWNlciA9IGthZmthLnByb2R1Y2VyKCk7XG4gICAgICAgIGF3YWl0IG5ld1Byb2R1Y2VyLmNvbm5lY3QoKTtcbiAgICAgICAgcmV0dXJuIG5ld1Byb2R1Y2VyO1xuXG4gICAgfSk7XG4gICAgYXdhaXQgcHJvZHVjZXIuc2VuZCh7XG4gICAgICAgIHRvcGljOiBjb25maWcudG9waWMsXG4gICAgICAgIG1lc3NhZ2VzOiByZXF1ZXN0cy5tYXAoKHJlcXVlc3QpID0+ICh7XG4gICAgICAgICAgICBrZXk6IHJlcXVlc3QuaWQsXG4gICAgICAgICAgICB2YWx1ZTogcmVxdWVzdC5ib2R5LFxuICAgICAgICB9KSksXG4gICAgfSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHBvc3RSZXF1ZXN0cyhfLCBhcmdzOiB7IHJlcXVlc3RzOiBSZXF1ZXN0W10gfSwgY29udGV4dDogQ29udGV4dCk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICBjb25zdCByZXF1ZXN0czogPyhSZXF1ZXN0W10pID0gYXJncy5yZXF1ZXN0cztcbiAgICBpZiAoIXJlcXVlc3RzKSB7XG4gICAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKGNvbnRleHQuY29uZmlnLnJlcXVlc3RzLm1vZGUgPT09ICdyZXN0Jykge1xuICAgICAgICAgICAgYXdhaXQgcG9zdFJlcXVlc3RzVXNpbmdSZXN0KHJlcXVlc3RzLCBjb250ZXh0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGF3YWl0IHBvc3RSZXF1ZXN0c1VzaW5nS2Fma2EocmVxdWVzdHMsIGNvbnRleHQpO1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ1tRIFNlcnZlcl0gcG9zdCByZXF1ZXN0IGZhaWxlZF0nLCBlcnJvcik7XG4gICAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgICByZXR1cm4gcmVxdWVzdHMubWFwKHggPT4geC5pZCk7XG59XG5cbmNvbnN0IGN1c3RvbVJlc29sdmVycyA9IHtcbiAgICBRdWVyeToge1xuICAgICAgICBpbmZvLFxuICAgICAgICBnZXRBY2NvdW50c0NvdW50LFxuICAgICAgICBnZXRUcmFuc2FjdGlvbnNDb3VudCxcbiAgICAgICAgZ2V0QWNjb3VudHNUb3RhbEJhbGFuY2UsXG4gICAgfSxcbiAgICBNdXRhdGlvbjoge1xuICAgICAgICBwb3N0UmVxdWVzdHMsXG4gICAgfSxcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBhdHRhY2hDdXN0b21SZXNvbHZlcnMob3JpZ2luYWw6IGFueSk6IGFueSB7XG4gICAgb3ZlcnJpZGVPYmplY3Qob3JpZ2luYWwsIGN1c3RvbVJlc29sdmVycyk7XG4gICAgcmV0dXJuIG9yaWdpbmFsO1xufVxuIl19