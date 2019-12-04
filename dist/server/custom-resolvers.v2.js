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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9jdXN0b20tcmVzb2x2ZXJzLnYyLmpzIl0sIm5hbWVzIjpbImlzT2JqZWN0IiwidGVzdCIsIm92ZXJyaWRlT2JqZWN0Iiwib3JpZ2luYWwiLCJvdmVycmlkZXMiLCJPYmplY3QiLCJlbnRyaWVzIiwiZm9yRWFjaCIsIm5hbWUiLCJvdmVycmlkZVZhbHVlIiwiaW5mbyIsInBrZyIsIkpTT04iLCJwYXJzZSIsImZzIiwicmVhZEZpbGVTeW5jIiwicGF0aCIsInJlc29sdmUiLCJfX2Rpcm5hbWUiLCJ2ZXJzaW9uIiwiZ2V0QWNjb3VudHNDb3VudCIsIl9wYXJlbnQiLCJfYXJncyIsImNvbnRleHQiLCJkYiIsImZldGNoUXVlcnkiLCJyZXN1bHQiLCJjb3VudHMiLCJsZW5ndGgiLCJnZXRUcmFuc2FjdGlvbnNDb3VudCIsImdldEFjY291bnRzVG90YWxCYWxhbmNlIiwicGFydHMiLCJCaWdJbnQiLCJocyIsImxzIiwidG9TdHJpbmciLCJwb3N0UmVxdWVzdHNVc2luZ1Jlc3QiLCJyZXF1ZXN0cyIsImNvbmZpZyIsInVybCIsInNlcnZlciIsInRvcGljIiwibWV0aG9kIiwibW9kZSIsImNhY2hlIiwiY3JlZGVudGlhbHMiLCJoZWFkZXJzIiwicmVkaXJlY3QiLCJyZWZlcnJlciIsImJvZHkiLCJzdHJpbmdpZnkiLCJyZWNvcmRzIiwibWFwIiwicmVxdWVzdCIsImtleSIsImlkIiwidmFsdWUiLCJyZXNwb25zZSIsInN0YXR1cyIsInRleHQiLCJtZXNzYWdlIiwiRXJyb3IiLCJwb3N0UmVxdWVzdHNVc2luZ0thZmthIiwiZW5zdXJlU2hhcmVkIiwiY3JlYXRlVmFsdWUiLCJzaGFyZWQiLCJoYXMiLCJnZXQiLCJzZXQiLCJLYWZrYSIsImNsaWVudElkIiwiYnJva2VycyIsImthZmthIiwibmV3UHJvZHVjZXIiLCJwcm9kdWNlciIsImNvbm5lY3QiLCJzZW5kIiwibWVzc2FnZXMiLCJwb3N0UmVxdWVzdHMiLCJfIiwiYXJncyIsImNvbnNvbGUiLCJsb2ciLCJ4IiwiY3VzdG9tUmVzb2x2ZXJzIiwiUXVlcnkiLCJNdXRhdGlvbiIsImF0dGFjaEN1c3RvbVJlc29sdmVycyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFQTs7QUFDQTs7QUFDQTs7QUFFQTs7QUFDQTs7QUFDQTs7QUFFQSxTQUFTQSxRQUFULENBQWtCQyxJQUFsQixFQUFzQztBQUNsQyxTQUFPLHlCQUFPQSxJQUFQLE1BQWdCLFFBQWhCLElBQTRCQSxJQUFJLEtBQUssSUFBNUM7QUFDSDs7QUFFRCxTQUFTQyxjQUFULENBQXdCQyxRQUF4QixFQUF1Q0MsU0FBdkMsRUFBdUQ7QUFDbkRDLEVBQUFBLE1BQU0sQ0FBQ0MsT0FBUCxDQUFlRixTQUFmLEVBQTBCRyxPQUExQixDQUFrQyxnQkFBMkI7QUFBQTtBQUFBLFFBQXpCQyxJQUF5QjtBQUFBLFFBQW5CQyxhQUFtQjs7QUFDekQsUUFBS0QsSUFBSSxJQUFJTCxRQUFULElBQXNCSCxRQUFRLENBQUNTLGFBQUQsQ0FBOUIsSUFBaURULFFBQVEsQ0FBQ0csUUFBUSxDQUFDSyxJQUFELENBQVQsQ0FBN0QsRUFBK0U7QUFDM0VOLE1BQUFBLGNBQWMsQ0FBQ0MsUUFBUSxDQUFDSyxJQUFELENBQVQsRUFBaUJDLGFBQWpCLENBQWQ7QUFDSCxLQUZELE1BRU87QUFDSE4sTUFBQUEsUUFBUSxDQUFDSyxJQUFELENBQVIsR0FBaUJDLGFBQWpCO0FBQ0g7QUFDSixHQU5EO0FBT0g7O0FBaUJEO0FBRUEsU0FBU0MsSUFBVCxHQUFzQjtBQUNsQixNQUFNQyxHQUFHLEdBQUdDLElBQUksQ0FBQ0MsS0FBTCxDQUFZQyxlQUFHQyxZQUFILENBQWdCQyxpQkFBS0MsT0FBTCxDQUFhQyxTQUFiLEVBQXdCLElBQXhCLEVBQThCLElBQTlCLEVBQW9DLGNBQXBDLENBQWhCLENBQVosQ0FBWjtBQUNBLFNBQU87QUFDSEMsSUFBQUEsT0FBTyxFQUFFUixHQUFHLENBQUNRO0FBRFYsR0FBUDtBQUdIOztTQUVjQyxnQjs7Ozs7OzsrQkFBZixpQkFBZ0ND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QUFBO0FBQUE7O0FBQUEsa0JBTVlkLE9BQU8sQ0FBQ2UsTUFBUixDQUFlRCxRQUFmLENBQXdCTSxJQUF4QixLQUFpQyxNQU43QztBQUFBO0FBQUE7QUFBQTs7QUFBQTtBQUFBLG1CQU9rQlAscUJBQXFCLENBQUNDLFFBQUQsRUFBV2QsT0FBWCxDQVB2Qzs7QUFBQTtBQUFBO0FBQUE7O0FBQUE7QUFBQTtBQUFBLG1CQVNrQnVDLHNCQUFzQixDQUFDekIsUUFBRCxFQUFXZCxPQUFYLENBVHhDOztBQUFBO0FBQUE7QUFBQTs7QUFBQTtBQUFBO0FBQUE7QUFZUTBELFlBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLGlDQUFaO0FBWlI7O0FBQUE7QUFBQSw4Q0FlVzdDLFFBQVEsQ0FBQ2UsR0FBVCxDQUFhLFVBQUErQixDQUFDO0FBQUEscUJBQUlBLENBQUMsQ0FBQzVCLEVBQU47QUFBQSxhQUFkLENBZlg7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRzs7OztBQWtCQSxJQUFNNkIsZUFBZSxHQUFHO0FBQ3BCQyxFQUFBQSxLQUFLLEVBQUU7QUFDSDNFLElBQUFBLElBQUksRUFBSkEsSUFERztBQUVIVSxJQUFBQSxnQkFBZ0IsRUFBaEJBLGdCQUZHO0FBR0hTLElBQUFBLG9CQUFvQixFQUFwQkEsb0JBSEc7QUFJSEMsSUFBQUEsdUJBQXVCLEVBQXZCQTtBQUpHLEdBRGE7QUFPcEJ3RCxFQUFBQSxRQUFRLEVBQUU7QUFDTlIsSUFBQUEsWUFBWSxFQUFaQTtBQURNO0FBUFUsQ0FBeEI7O0FBWU8sU0FBU1MscUJBQVQsQ0FBK0JwRixRQUEvQixFQUFtRDtBQUN0REQsRUFBQUEsY0FBYyxDQUFDQyxRQUFELEVBQVdpRixlQUFYLENBQWQ7QUFDQSxTQUFPakYsUUFBUDtBQUNIIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQGZsb3dcblxuaW1wb3J0IGZzIGZyb20gXCJmc1wiO1xuaW1wb3J0IHsgS2Fma2EsIFByb2R1Y2VyIH0gZnJvbSBcImthZmthanNcIjtcbmltcG9ydCBBcmFuZ28gZnJvbSBcIi4vYXJhbmdvXCI7XG5pbXBvcnQgdHlwZSB7IFFDb25maWcgfSBmcm9tIFwiLi9jb25maWdcIjtcbmltcG9ydCB7IGVuc3VyZVByb3RvY29sIH0gZnJvbSBcIi4vY29uZmlnXCI7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBmZXRjaCBmcm9tICdub2RlLWZldGNoJztcblxuZnVuY3Rpb24gaXNPYmplY3QodGVzdDogYW55KTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHR5cGVvZiB0ZXN0ID09PSAnb2JqZWN0JyAmJiB0ZXN0ICE9PSBudWxsO1xufVxuXG5mdW5jdGlvbiBvdmVycmlkZU9iamVjdChvcmlnaW5hbDogYW55LCBvdmVycmlkZXM6IGFueSkge1xuICAgIE9iamVjdC5lbnRyaWVzKG92ZXJyaWRlcykuZm9yRWFjaCgoW25hbWUsIG92ZXJyaWRlVmFsdWVdKSA9PiB7XG4gICAgICAgIGlmICgobmFtZSBpbiBvcmlnaW5hbCkgJiYgaXNPYmplY3Qob3ZlcnJpZGVWYWx1ZSkgJiYgaXNPYmplY3Qob3JpZ2luYWxbbmFtZV0pKSB7XG4gICAgICAgICAgICBvdmVycmlkZU9iamVjdChvcmlnaW5hbFtuYW1lXSwgb3ZlcnJpZGVWYWx1ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBvcmlnaW5hbFtuYW1lXSA9IG92ZXJyaWRlVmFsdWU7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxudHlwZSBJbmZvID0ge1xuICAgIHZlcnNpb246IHN0cmluZyxcbn1cblxudHlwZSBSZXF1ZXN0ID0ge1xuICAgIGlkOiBzdHJpbmcsXG4gICAgYm9keTogc3RyaW5nLFxufVxuXG50eXBlIENvbnRleHQgPSB7XG4gICAgZGI6IEFyYW5nbyxcbiAgICBjb25maWc6IFFDb25maWcsXG4gICAgc2hhcmVkOiBNYXA8c3RyaW5nLCBhbnk+LFxufVxuXG4vLyBRdWVyeVxuXG5mdW5jdGlvbiBpbmZvKCk6IEluZm8ge1xuICAgIGNvbnN0IHBrZyA9IEpTT04ucGFyc2UoKGZzLnJlYWRGaWxlU3luYyhwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi4nLCAnLi4nLCAncGFja2FnZS5qc29uJykpOiBhbnkpKTtcbiAgICByZXR1cm4ge1xuICAgICAgICB2ZXJzaW9uOiBwa2cudmVyc2lvbixcbiAgICB9O1xufVxuXG5hc3luYyBmdW5jdGlvbiBnZXRBY2NvdW50c0NvdW50KF9wYXJlbnQsIF9hcmdzLCBjb250ZXh0OiBDb250ZXh0KTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBjb25zdCByZXN1bHQ6IGFueSA9IGF3YWl0IGNvbnRleHQuZGIuZmV0Y2hRdWVyeShgUkVUVVJOIExFTkdUSChhY2NvdW50cylgLCB7fSk7XG4gICAgY29uc3QgY291bnRzID0gKHJlc3VsdDogbnVtYmVyW10pO1xuICAgIHJldHVybiBjb3VudHMubGVuZ3RoID4gMCA/IGNvdW50c1swXSA6IDA7XG59XG5cblxuYXN5bmMgZnVuY3Rpb24gZ2V0VHJhbnNhY3Rpb25zQ291bnQoX3BhcmVudCwgX2FyZ3MsIGNvbnRleHQ6IENvbnRleHQpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGNvbnN0IHJlc3VsdDogYW55ID0gYXdhaXQgY29udGV4dC5kYi5mZXRjaFF1ZXJ5KGBSRVRVUk4gTEVOR1RIKHRyYW5zYWN0aW9ucylgLCB7fSk7XG4gICAgY29uc3QgY291bnRzID0gKHJlc3VsdDogbnVtYmVyW10pO1xuICAgIHJldHVybiBjb3VudHMubGVuZ3RoID4gMCA/IGNvdW50c1swXSA6IDA7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGdldEFjY291bnRzVG90YWxCYWxhbmNlKF9wYXJlbnQsIF9hcmdzLCBjb250ZXh0OiBDb250ZXh0KTogUHJvbWlzZTxTdHJpbmc+IHtcbiAgICAvKlxuICAgINGC0LDQvCDQvdCw0LTQviDQsiDQsNGA0LDQvdCz0LUg0LfQsNGB0YPQvNC80LjRgNC+0LLQsNGC0Ywg0LLRgdC1INCx0LDQu9Cw0L3RgdGLXG4gICAgQmVjYXVzZSBhcmFuZ28gY2FuIG5vdCBzdW0gQmlnSW50cyB3ZSBuZWVkIHRvIHN1bSBzZXBhcmF0ZWx5OlxuICAgIGhzID0gU1VNIG9mIGhpZ2ggYml0cyAoZnJvbSAyNC1iaXQgYW5kIGhpZ2hlcilcbiAgICBscyA9IFNVTSBvZiBsb3dlciAyNCBiaXRzXG4gICAgQW5kIHRoZSB0b3RhbCByZXN1bHQgaXMgKGhzIDw8IDI0KSArIGxzXG4gICAgICovXG5cbiAgICBjb25zdCByZXN1bHQ6IGFueSA9IGF3YWl0IGNvbnRleHQuZGIuZmV0Y2hRdWVyeShgXG4gICAgICAgIExFVCBkID0gMTY3NzcyMTZcbiAgICAgICAgRk9SIGEgaW4gYWNjb3VudHNcbiAgICAgICAgTEVUIGIgPSBUT19OVU1CRVIoQ09OQ0FUKFwiMHhcIiwgU1VCU1RSSU5HKGEuYmFsYW5jZSwgMikpKVxuICAgICAgICBDT0xMRUNUIEFHR1JFR0FURVxuICAgICAgICAgICAgaHMgPSBTVU0oRkxPT1IoYiAvIGQpKSxcbiAgICAgICAgICAgIGxzID0gU1VNKGIgJSAoZCAtIDEpKVxuICAgICAgICBSRVRVUk4geyBocywgbHMgfVxuICAgIGAsIHt9KTtcbiAgICBjb25zdCBwYXJ0cyA9IChyZXN1bHQ6IHtoczpudW1iZXIsIGxzOiBudW1iZXJ9W10pWzBdO1xuICAgIHJldHVybiAoQmlnSW50KHBhcnRzLmhzKSAqIEJpZ0ludCgweDEwMDAwMDApICsgQmlnSW50KHBhcnRzLmxzKSkudG9TdHJpbmcoKTtcbn1cblxuXG4vLyBNdXRhdGlvblxuXG5hc3luYyBmdW5jdGlvbiBwb3N0UmVxdWVzdHNVc2luZ1Jlc3QocmVxdWVzdHM6IFJlcXVlc3RbXSwgY29udGV4dDogQ29udGV4dCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGNvbmZpZyA9IGNvbnRleHQuY29uZmlnLnJlcXVlc3RzO1xuICAgIGNvbnN0IHVybCA9IGAke2Vuc3VyZVByb3RvY29sKGNvbmZpZy5zZXJ2ZXIsICdodHRwJyl9L3RvcGljcy8ke2NvbmZpZy50b3BpY31gO1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godXJsLCB7XG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBtb2RlOiAnY29ycycsXG4gICAgICAgIGNhY2hlOiAnbm8tY2FjaGUnLFxuICAgICAgICBjcmVkZW50aWFsczogJ3NhbWUtb3JpZ2luJyxcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgfSxcbiAgICAgICAgcmVkaXJlY3Q6ICdmb2xsb3cnLFxuICAgICAgICByZWZlcnJlcjogJ25vLXJlZmVycmVyJyxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgcmVjb3JkczogcmVxdWVzdHMubWFwKChyZXF1ZXN0KSA9PiAoe1xuICAgICAgICAgICAgICAgIGtleTogcmVxdWVzdC5pZCxcbiAgICAgICAgICAgICAgICB2YWx1ZTogcmVxdWVzdC5ib2R5LFxuICAgICAgICAgICAgfSkpLFxuICAgICAgICB9KSxcbiAgICB9KTtcbiAgICBpZiAocmVzcG9uc2Uuc3RhdHVzICE9PSAyMDApIHtcbiAgICAgICAgY29uc3QgbWVzc2FnZSA9IGBQb3N0IHJlcXVlc3RzIGZhaWxlZDogJHthd2FpdCByZXNwb25zZS50ZXh0KCl9YDtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1lc3NhZ2UpO1xuICAgIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gcG9zdFJlcXVlc3RzVXNpbmdLYWZrYShyZXF1ZXN0czogUmVxdWVzdFtdLCBjb250ZXh0OiBDb250ZXh0KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZW5zdXJlU2hhcmVkID0gYXN5bmMgKG5hbWUsIGNyZWF0ZVZhbHVlOiAoKSA9PiBQcm9taXNlPGFueT4pID0+IHtcbiAgICAgICAgaWYgKGNvbnRleHQuc2hhcmVkLmhhcyhuYW1lKSkge1xuICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQuc2hhcmVkLmdldChuYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB2YWx1ZSA9IGF3YWl0IGNyZWF0ZVZhbHVlKCk7XG4gICAgICAgIGNvbnRleHQuc2hhcmVkLnNldChuYW1lLCB2YWx1ZSk7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9O1xuXG4gICAgY29uc3QgY29uZmlnID0gY29udGV4dC5jb25maWcucmVxdWVzdHM7XG4gICAgY29uc3QgcHJvZHVjZXI6IFByb2R1Y2VyID0gYXdhaXQgZW5zdXJlU2hhcmVkKCdwcm9kdWNlcicsIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3Qga2Fma2E6IEthZmthID0gYXdhaXQgZW5zdXJlU2hhcmVkKCdrYWZrYScsIGFzeW5jICgpID0+IG5ldyBLYWZrYSh7XG4gICAgICAgICAgICBjbGllbnRJZDogJ3Etc2VydmVyJyxcbiAgICAgICAgICAgIGJyb2tlcnM6IFtjb25maWcuc2VydmVyXVxuICAgICAgICB9KSk7XG4gICAgICAgIGNvbnN0IG5ld1Byb2R1Y2VyID0ga2Fma2EucHJvZHVjZXIoKTtcbiAgICAgICAgYXdhaXQgbmV3UHJvZHVjZXIuY29ubmVjdCgpO1xuICAgICAgICByZXR1cm4gbmV3UHJvZHVjZXI7XG5cbiAgICB9KTtcbiAgICBhd2FpdCBwcm9kdWNlci5zZW5kKHtcbiAgICAgICAgdG9waWM6IGNvbmZpZy50b3BpYyxcbiAgICAgICAgbWVzc2FnZXM6IHJlcXVlc3RzLm1hcCgocmVxdWVzdCkgPT4gKHtcbiAgICAgICAgICAgIGtleTogcmVxdWVzdC5pZCxcbiAgICAgICAgICAgIHZhbHVlOiByZXF1ZXN0LmJvZHksXG4gICAgICAgIH0pKSxcbiAgICB9KTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gcG9zdFJlcXVlc3RzKF8sIGFyZ3M6IHsgcmVxdWVzdHM6IFJlcXVlc3RbXSB9LCBjb250ZXh0OiBDb250ZXh0KTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGNvbnN0IHJlcXVlc3RzOiA/KFJlcXVlc3RbXSkgPSBhcmdzLnJlcXVlc3RzO1xuICAgIGlmICghcmVxdWVzdHMpIHtcbiAgICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBpZiAoY29udGV4dC5jb25maWcucmVxdWVzdHMubW9kZSA9PT0gJ3Jlc3QnKSB7XG4gICAgICAgICAgICBhd2FpdCBwb3N0UmVxdWVzdHNVc2luZ1Jlc3QocmVxdWVzdHMsIGNvbnRleHQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYXdhaXQgcG9zdFJlcXVlc3RzVXNpbmdLYWZrYShyZXF1ZXN0cywgY29udGV4dCk7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmxvZygnW1EgU2VydmVyXSBwb3N0IHJlcXVlc3QgZmFpbGVkXScsIGVycm9yKTtcbiAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICAgIHJldHVybiByZXF1ZXN0cy5tYXAoeCA9PiB4LmlkKTtcbn1cblxuY29uc3QgY3VzdG9tUmVzb2x2ZXJzID0ge1xuICAgIFF1ZXJ5OiB7XG4gICAgICAgIGluZm8sXG4gICAgICAgIGdldEFjY291bnRzQ291bnQsXG4gICAgICAgIGdldFRyYW5zYWN0aW9uc0NvdW50LFxuICAgICAgICBnZXRBY2NvdW50c1RvdGFsQmFsYW5jZSxcbiAgICB9LFxuICAgIE11dGF0aW9uOiB7XG4gICAgICAgIHBvc3RSZXF1ZXN0cyxcbiAgICB9LFxufTtcblxuZXhwb3J0IGZ1bmN0aW9uIGF0dGFjaEN1c3RvbVJlc29sdmVycyhvcmlnaW5hbDogYW55KTogYW55IHtcbiAgICBvdmVycmlkZU9iamVjdChvcmlnaW5hbCwgY3VzdG9tUmVzb2x2ZXJzKTtcbiAgICByZXR1cm4gb3JpZ2luYWw7XG59XG4iXX0=