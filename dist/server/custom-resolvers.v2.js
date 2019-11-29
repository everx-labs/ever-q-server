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

function getAccountTransactionSummaries(_x4, _x5, _x6) {
  return _getAccountTransactionSummaries.apply(this, arguments);
} // Mutation


function _getAccountTransactionSummaries() {
  _getAccountTransactionSummaries = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee2(_parent, args, context) {
    var result;
    return _regenerator["default"].wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return context.db.fetchQuery("\n        FOR t IN transactions\n        FILTER (t.account_addr == @accountId || m.src == @accountId) && t.lt > @afterLt\n            FOR msg_id IN APPEND([t.in_msg], t.out_msgs)\n            LET m = DOCUMENT(\"messages\", msg_id)\n            LET b = DOCUMENT(\"blocks\", t.block_id})\n            FILTER (m.msg_type == 0) && (m.value > \"0\") && b.seq_no\n        SORT t.gen_utime DESC\n        LIMIT @limit\n        RETURN \n            \"id\": t._key,\n            \"time\": t.gen_utime,\n            \"amount\": m.value,\n            \"from\": m.src,\n            \"to\": m.dst,\n            \"block\": b.seq_no\n    ", {
              accountId: args.accountId,
              afterLt: args.afterLt || "0",
              limit: Math.max(50, Number(args.limit || 50))
            });

          case 2:
            result = _context2.sent;
            return _context2.abrupt("return", result);

          case 4:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));
  return _getAccountTransactionSummaries.apply(this, arguments);
}

function postRequestsUsingRest(_x7, _x8) {
  return _postRequestsUsingRest.apply(this, arguments);
}

function _postRequestsUsingRest() {
  _postRequestsUsingRest = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee3(requests, context) {
    var config, url, response, message;
    return _regenerator["default"].wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            config = context.config.requests;
            url = "".concat((0, _config.ensureProtocol)(config.server, 'http'), "/topics/").concat(config.topic);
            console.log('>>>', 'POST REQUESTS');
            _context3.next = 5;
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

          case 5:
            response = _context3.sent;

            if (!(response.status !== 200)) {
              _context3.next = 13;
              break;
            }

            _context3.t0 = "Post requests failed: ";
            _context3.next = 10;
            return response.text();

          case 10:
            _context3.t1 = _context3.sent;
            message = _context3.t0.concat.call(_context3.t0, _context3.t1);
            throw new Error(message);

          case 13:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3);
  }));
  return _postRequestsUsingRest.apply(this, arguments);
}

function postRequestsUsingKafka(_x9, _x10) {
  return _postRequestsUsingKafka.apply(this, arguments);
}

function _postRequestsUsingKafka() {
  _postRequestsUsingKafka = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee7(requests, context) {
    var ensureShared, config, producer;
    return _regenerator["default"].wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            ensureShared =
            /*#__PURE__*/
            function () {
              var _ref3 = (0, _asyncToGenerator2["default"])(
              /*#__PURE__*/
              _regenerator["default"].mark(function _callee4(name, createValue) {
                var value;
                return _regenerator["default"].wrap(function _callee4$(_context4) {
                  while (1) {
                    switch (_context4.prev = _context4.next) {
                      case 0:
                        if (!context.shared.has(name)) {
                          _context4.next = 2;
                          break;
                        }

                        return _context4.abrupt("return", context.shared.get(name));

                      case 2:
                        _context4.next = 4;
                        return createValue();

                      case 4:
                        value = _context4.sent;
                        context.shared.set(name, value);
                        return _context4.abrupt("return", value);

                      case 7:
                      case "end":
                        return _context4.stop();
                    }
                  }
                }, _callee4);
              }));

              return function ensureShared(_x14, _x15) {
                return _ref3.apply(this, arguments);
              };
            }();

            config = context.config.requests;
            _context7.next = 4;
            return ensureShared('producer',
            /*#__PURE__*/
            (0, _asyncToGenerator2["default"])(
            /*#__PURE__*/
            _regenerator["default"].mark(function _callee6() {
              var kafka, newProducer;
              return _regenerator["default"].wrap(function _callee6$(_context6) {
                while (1) {
                  switch (_context6.prev = _context6.next) {
                    case 0:
                      _context6.next = 2;
                      return ensureShared('kafka',
                      /*#__PURE__*/
                      (0, _asyncToGenerator2["default"])(
                      /*#__PURE__*/
                      _regenerator["default"].mark(function _callee5() {
                        return _regenerator["default"].wrap(function _callee5$(_context5) {
                          while (1) {
                            switch (_context5.prev = _context5.next) {
                              case 0:
                                return _context5.abrupt("return", new _kafkajs.Kafka({
                                  clientId: 'q-server',
                                  brokers: [config.server]
                                }));

                              case 1:
                              case "end":
                                return _context5.stop();
                            }
                          }
                        }, _callee5);
                      })));

                    case 2:
                      kafka = _context6.sent;
                      newProducer = kafka.producer();
                      _context6.next = 6;
                      return newProducer.connect();

                    case 6:
                      return _context6.abrupt("return", newProducer);

                    case 7:
                    case "end":
                      return _context6.stop();
                  }
                }
              }, _callee6);
            })));

          case 4:
            producer = _context7.sent;
            _context7.next = 7;
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
            return _context7.stop();
        }
      }
    }, _callee7);
  }));
  return _postRequestsUsingKafka.apply(this, arguments);
}

function postRequests(_x11, _x12, _x13) {
  return _postRequests.apply(this, arguments);
}

function _postRequests() {
  _postRequests = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee8(_, args, context) {
    var requests;
    return _regenerator["default"].wrap(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            requests = args.requests;

            if (requests) {
              _context8.next = 3;
              break;
            }

            return _context8.abrupt("return", []);

          case 3:
            _context8.prev = 3;

            if (!(context.config.requests.mode === 'rest')) {
              _context8.next = 9;
              break;
            }

            _context8.next = 7;
            return postRequestsUsingRest(requests, context);

          case 7:
            _context8.next = 11;
            break;

          case 9:
            _context8.next = 11;
            return postRequestsUsingKafka(requests, context);

          case 11:
            _context8.next = 17;
            break;

          case 13:
            _context8.prev = 13;
            _context8.t0 = _context8["catch"](3);
            console.log('[Q Server] post request failed]', _context8.t0);
            throw _context8.t0;

          case 17:
            return _context8.abrupt("return", requests.map(function (x) {
              return x.id;
            }));

          case 18:
          case "end":
            return _context8.stop();
        }
      }
    }, _callee8, null, [[3, 13]]);
  }));
  return _postRequests.apply(this, arguments);
}

var customResolvers = {
  Query: {
    info: info,
    getAccountsCount: getAccountsCount,
    getAccountTransactionSummaries: getAccountTransactionSummaries
  },
  Mutation: {
    postRequests: postRequests
  }
};

function attachCustomResolvers(original) {
  overrideObject(original, customResolvers);
  return original;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9jdXN0b20tcmVzb2x2ZXJzLnYyLmpzIl0sIm5hbWVzIjpbImlzT2JqZWN0IiwidGVzdCIsIm92ZXJyaWRlT2JqZWN0Iiwib3JpZ2luYWwiLCJvdmVycmlkZXMiLCJPYmplY3QiLCJlbnRyaWVzIiwiZm9yRWFjaCIsIm5hbWUiLCJvdmVycmlkZVZhbHVlIiwiaW5mbyIsInBrZyIsIkpTT04iLCJwYXJzZSIsImZzIiwicmVhZEZpbGVTeW5jIiwicGF0aCIsInJlc29sdmUiLCJfX2Rpcm5hbWUiLCJ2ZXJzaW9uIiwiZ2V0QWNjb3VudHNDb3VudCIsIl9wYXJlbnQiLCJfYXJncyIsImNvbnRleHQiLCJkYiIsImZldGNoUXVlcnkiLCJyZXN1bHQiLCJjb3VudHMiLCJsZW5ndGgiLCJnZXRBY2NvdW50VHJhbnNhY3Rpb25TdW1tYXJpZXMiLCJhcmdzIiwiYWNjb3VudElkIiwiYWZ0ZXJMdCIsImxpbWl0IiwiTWF0aCIsIm1heCIsIk51bWJlciIsInBvc3RSZXF1ZXN0c1VzaW5nUmVzdCIsInJlcXVlc3RzIiwiY29uZmlnIiwidXJsIiwic2VydmVyIiwidG9waWMiLCJjb25zb2xlIiwibG9nIiwibWV0aG9kIiwibW9kZSIsImNhY2hlIiwiY3JlZGVudGlhbHMiLCJoZWFkZXJzIiwicmVkaXJlY3QiLCJyZWZlcnJlciIsImJvZHkiLCJzdHJpbmdpZnkiLCJyZWNvcmRzIiwibWFwIiwicmVxdWVzdCIsImtleSIsImlkIiwidmFsdWUiLCJyZXNwb25zZSIsInN0YXR1cyIsInRleHQiLCJtZXNzYWdlIiwiRXJyb3IiLCJwb3N0UmVxdWVzdHNVc2luZ0thZmthIiwiZW5zdXJlU2hhcmVkIiwiY3JlYXRlVmFsdWUiLCJzaGFyZWQiLCJoYXMiLCJnZXQiLCJzZXQiLCJLYWZrYSIsImNsaWVudElkIiwiYnJva2VycyIsImthZmthIiwibmV3UHJvZHVjZXIiLCJwcm9kdWNlciIsImNvbm5lY3QiLCJzZW5kIiwibWVzc2FnZXMiLCJwb3N0UmVxdWVzdHMiLCJfIiwieCIsImN1c3RvbVJlc29sdmVycyIsIlF1ZXJ5IiwiTXV0YXRpb24iLCJhdHRhY2hDdXN0b21SZXNvbHZlcnMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUE7O0FBQ0E7O0FBQ0E7O0FBRUE7O0FBQ0E7O0FBQ0E7O0FBRUEsU0FBU0EsUUFBVCxDQUFrQkMsSUFBbEIsRUFBc0M7QUFDbEMsU0FBTyx5QkFBT0EsSUFBUCxNQUFnQixRQUFoQixJQUE0QkEsSUFBSSxLQUFLLElBQTVDO0FBQ0g7O0FBRUQsU0FBU0MsY0FBVCxDQUF3QkMsUUFBeEIsRUFBdUNDLFNBQXZDLEVBQXVEO0FBQ25EQyxFQUFBQSxNQUFNLENBQUNDLE9BQVAsQ0FBZUYsU0FBZixFQUEwQkcsT0FBMUIsQ0FBa0MsZ0JBQTJCO0FBQUE7QUFBQSxRQUF6QkMsSUFBeUI7QUFBQSxRQUFuQkMsYUFBbUI7O0FBQ3pELFFBQUtELElBQUksSUFBSUwsUUFBVCxJQUFzQkgsUUFBUSxDQUFDUyxhQUFELENBQTlCLElBQWlEVCxRQUFRLENBQUNHLFFBQVEsQ0FBQ0ssSUFBRCxDQUFULENBQTdELEVBQStFO0FBQzNFTixNQUFBQSxjQUFjLENBQUNDLFFBQVEsQ0FBQ0ssSUFBRCxDQUFULEVBQWlCQyxhQUFqQixDQUFkO0FBQ0gsS0FGRCxNQUVPO0FBQ0hOLE1BQUFBLFFBQVEsQ0FBQ0ssSUFBRCxDQUFSLEdBQWlCQyxhQUFqQjtBQUNIO0FBQ0osR0FORDtBQU9IOztBQTRCRCxTQUFTQyxJQUFULEdBQXNCO0FBQ2xCLE1BQU1DLEdBQUcsR0FBR0MsSUFBSSxDQUFDQyxLQUFMLENBQVlDLGVBQUdDLFlBQUgsQ0FBZ0JDLGlCQUFLQyxPQUFMLENBQWFDLFNBQWIsRUFBd0IsSUFBeEIsRUFBOEIsSUFBOUIsRUFBb0MsY0FBcEMsQ0FBaEIsQ0FBWixDQUFaO0FBQ0EsU0FBTztBQUNIQyxJQUFBQSxPQUFPLEVBQUVSLEdBQUcsQ0FBQ1E7QUFEVixHQUFQO0FBR0g7O1NBRWNDLGdCOzs7Ozs7OytCQUFmLGlCQUFnQ0MsT0FBaEMs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QUFZUW9CLFlBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLGlDQUFaO0FBWlI7O0FBQUE7QUFBQSw4Q0FlV04sUUFBUSxDQUFDaUIsR0FBVCxDQUFhLFVBQUE0QixDQUFDO0FBQUEscUJBQUlBLENBQUMsQ0FBQ3pCLEVBQU47QUFBQSxhQUFkLENBZlg7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRzs7OztBQWtCQSxJQUFNMEIsZUFBZSxHQUFHO0FBQ3BCQyxFQUFBQSxLQUFLLEVBQUU7QUFDSDNFLElBQUFBLElBQUksRUFBSkEsSUFERztBQUVIVSxJQUFBQSxnQkFBZ0IsRUFBaEJBLGdCQUZHO0FBR0hTLElBQUFBLDhCQUE4QixFQUE5QkE7QUFIRyxHQURhO0FBTXBCeUQsRUFBQUEsUUFBUSxFQUFFO0FBQ05MLElBQUFBLFlBQVksRUFBWkE7QUFETTtBQU5VLENBQXhCOztBQVdPLFNBQVNNLHFCQUFULENBQStCcEYsUUFBL0IsRUFBbUQ7QUFDdERELEVBQUFBLGNBQWMsQ0FBQ0MsUUFBRCxFQUFXaUYsZUFBWCxDQUFkO0FBQ0EsU0FBT2pGLFFBQVA7QUFDSCIsInNvdXJjZXNDb250ZW50IjpbIi8vIEBmbG93XG5cbmltcG9ydCBmcyBmcm9tIFwiZnNcIjtcbmltcG9ydCB7IEthZmthLCBQcm9kdWNlciB9IGZyb20gXCJrYWZrYWpzXCI7XG5pbXBvcnQgQXJhbmdvIGZyb20gXCIuL2FyYW5nb1wiO1xuaW1wb3J0IHR5cGUgeyBRQ29uZmlnIH0gZnJvbSBcIi4vY29uZmlnXCI7XG5pbXBvcnQgeyBlbnN1cmVQcm90b2NvbCB9IGZyb20gXCIuL2NvbmZpZ1wiO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgZmV0Y2ggZnJvbSAnbm9kZS1mZXRjaCc7XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KHRlc3Q6IGFueSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0eXBlb2YgdGVzdCA9PT0gJ29iamVjdCcgJiYgdGVzdCAhPT0gbnVsbDtcbn1cblxuZnVuY3Rpb24gb3ZlcnJpZGVPYmplY3Qob3JpZ2luYWw6IGFueSwgb3ZlcnJpZGVzOiBhbnkpIHtcbiAgICBPYmplY3QuZW50cmllcyhvdmVycmlkZXMpLmZvckVhY2goKFtuYW1lLCBvdmVycmlkZVZhbHVlXSkgPT4ge1xuICAgICAgICBpZiAoKG5hbWUgaW4gb3JpZ2luYWwpICYmIGlzT2JqZWN0KG92ZXJyaWRlVmFsdWUpICYmIGlzT2JqZWN0KG9yaWdpbmFsW25hbWVdKSkge1xuICAgICAgICAgICAgb3ZlcnJpZGVPYmplY3Qob3JpZ2luYWxbbmFtZV0sIG92ZXJyaWRlVmFsdWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb3JpZ2luYWxbbmFtZV0gPSBvdmVycmlkZVZhbHVlO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbnR5cGUgSW5mbyA9IHtcbiAgICB2ZXJzaW9uOiBzdHJpbmcsXG59XG5cbnR5cGUgUmVxdWVzdCA9IHtcbiAgICBpZDogc3RyaW5nLFxuICAgIGJvZHk6IHN0cmluZyxcbn1cblxudHlwZSBDb250ZXh0ID0ge1xuICAgIGRiOiBBcmFuZ28sXG4gICAgY29uZmlnOiBRQ29uZmlnLFxuICAgIHNoYXJlZDogTWFwPHN0cmluZywgYW55Pixcbn1cblxuLy8gUXVlcnlcblxudHlwZSBBY2NvdW50VHJhbnNhY3Rpb25TdW1tYXJ5ID0ge1xuICAgIGlkOiBzdHJpbmcsXG4gICAgdGltZTogbnVtYmVyLFxuICAgIGFtb3VudDogc3RyaW5nLFxuICAgIGZyb206IHN0cmluZyxcbiAgICB0bzogc3RyaW5nLFxuICAgIGJsb2NrOiBzdHJpbmcsXG59XG5cbmZ1bmN0aW9uIGluZm8oKTogSW5mbyB7XG4gICAgY29uc3QgcGtnID0gSlNPTi5wYXJzZSgoZnMucmVhZEZpbGVTeW5jKHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuLicsICcuLicsICdwYWNrYWdlLmpzb24nKSk6IGFueSkpO1xuICAgIHJldHVybiB7XG4gICAgICAgIHZlcnNpb246IHBrZy52ZXJzaW9uLFxuICAgIH07XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGdldEFjY291bnRzQ291bnQoX3BhcmVudCwgX2FyZ3MsIGNvbnRleHQ6IENvbnRleHQpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGNvbnN0IHJlc3VsdDogYW55ID0gYXdhaXQgY29udGV4dC5kYi5mZXRjaFF1ZXJ5KGBSRVRVUk4gTEVOR1RIKGFjY291bnRzKWAsIHt9KTtcbiAgICBjb25zdCBjb3VudHMgPSAocmVzdWx0OiBudW1iZXJbXSk7XG4gICAgcmV0dXJuIGNvdW50cy5sZW5ndGggPiAwID8gY291bnRzWzBdIDogMDtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZ2V0QWNjb3VudFRyYW5zYWN0aW9uU3VtbWFyaWVzKFxuICAgIF9wYXJlbnQsXG4gICAgYXJnczogeyBhY2NvdW50SWQ/OiBzdHJpbmcsIGFmdGVyTHQ/OiBzdHJpbmcsIGxpbWl0PzogbnVtYmVyIH0sXG4gICAgY29udGV4dDogQ29udGV4dFxuKTogUHJvbWlzZTxBY2NvdW50VHJhbnNhY3Rpb25TdW1tYXJ5W10+IHtcbiAgICBjb25zdCByZXN1bHQ6IGFueSA9IGF3YWl0IGNvbnRleHQuZGIuZmV0Y2hRdWVyeShgXG4gICAgICAgIEZPUiB0IElOIHRyYW5zYWN0aW9uc1xuICAgICAgICBGSUxURVIgKHQuYWNjb3VudF9hZGRyID09IEBhY2NvdW50SWQgfHwgbS5zcmMgPT0gQGFjY291bnRJZCkgJiYgdC5sdCA+IEBhZnRlckx0XG4gICAgICAgICAgICBGT1IgbXNnX2lkIElOIEFQUEVORChbdC5pbl9tc2ddLCB0Lm91dF9tc2dzKVxuICAgICAgICAgICAgTEVUIG0gPSBET0NVTUVOVChcIm1lc3NhZ2VzXCIsIG1zZ19pZClcbiAgICAgICAgICAgIExFVCBiID0gRE9DVU1FTlQoXCJibG9ja3NcIiwgdC5ibG9ja19pZH0pXG4gICAgICAgICAgICBGSUxURVIgKG0ubXNnX3R5cGUgPT0gMCkgJiYgKG0udmFsdWUgPiBcIjBcIikgJiYgYi5zZXFfbm9cbiAgICAgICAgU09SVCB0Lmdlbl91dGltZSBERVNDXG4gICAgICAgIExJTUlUIEBsaW1pdFxuICAgICAgICBSRVRVUk4gXG4gICAgICAgICAgICBcImlkXCI6IHQuX2tleSxcbiAgICAgICAgICAgIFwidGltZVwiOiB0Lmdlbl91dGltZSxcbiAgICAgICAgICAgIFwiYW1vdW50XCI6IG0udmFsdWUsXG4gICAgICAgICAgICBcImZyb21cIjogbS5zcmMsXG4gICAgICAgICAgICBcInRvXCI6IG0uZHN0LFxuICAgICAgICAgICAgXCJibG9ja1wiOiBiLnNlcV9ub1xuICAgIGAsIHtcbiAgICAgICAgYWNjb3VudElkOiBhcmdzLmFjY291bnRJZCxcbiAgICAgICAgYWZ0ZXJMdDogYXJncy5hZnRlckx0IHx8IFwiMFwiLFxuICAgICAgICBsaW1pdDogTWF0aC5tYXgoNTAsIE51bWJlcihhcmdzLmxpbWl0IHx8IDUwKSlcbiAgICB9KTtcbiAgICByZXR1cm4gKHJlc3VsdDogQWNjb3VudFRyYW5zYWN0aW9uU3VtbWFyeVtdKTtcbn1cblxuLy8gTXV0YXRpb25cblxuYXN5bmMgZnVuY3Rpb24gcG9zdFJlcXVlc3RzVXNpbmdSZXN0KHJlcXVlc3RzOiBSZXF1ZXN0W10sIGNvbnRleHQ6IENvbnRleHQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBjb25maWcgPSBjb250ZXh0LmNvbmZpZy5yZXF1ZXN0cztcbiAgICBjb25zdCB1cmwgPSBgJHtlbnN1cmVQcm90b2NvbChjb25maWcuc2VydmVyLCAnaHR0cCcpfS90b3BpY3MvJHtjb25maWcudG9waWN9YDtcbiAgICBjb25zb2xlLmxvZygnPj4+JywgJ1BPU1QgUkVRVUVTVFMnKTtcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKHVybCwge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgbW9kZTogJ2NvcnMnLFxuICAgICAgICBjYWNoZTogJ25vLWNhY2hlJyxcbiAgICAgICAgY3JlZGVudGlhbHM6ICdzYW1lLW9yaWdpbicsXG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgIH0sXG4gICAgICAgIHJlZGlyZWN0OiAnZm9sbG93JyxcbiAgICAgICAgcmVmZXJyZXI6ICduby1yZWZlcnJlcicsXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgIHJlY29yZHM6IHJlcXVlc3RzLm1hcCgocmVxdWVzdCkgPT4gKHtcbiAgICAgICAgICAgICAgICBrZXk6IHJlcXVlc3QuaWQsXG4gICAgICAgICAgICAgICAgdmFsdWU6IHJlcXVlc3QuYm9keSxcbiAgICAgICAgICAgIH0pKSxcbiAgICAgICAgfSksXG4gICAgfSk7XG4gICAgaWYgKHJlc3BvbnNlLnN0YXR1cyAhPT0gMjAwKSB7XG4gICAgICAgIGNvbnN0IG1lc3NhZ2UgPSBgUG9zdCByZXF1ZXN0cyBmYWlsZWQ6ICR7YXdhaXQgcmVzcG9uc2UudGV4dCgpfWA7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihtZXNzYWdlKTtcbiAgICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHBvc3RSZXF1ZXN0c1VzaW5nS2Fma2EocmVxdWVzdHM6IFJlcXVlc3RbXSwgY29udGV4dDogQ29udGV4dCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGVuc3VyZVNoYXJlZCA9IGFzeW5jIChuYW1lLCBjcmVhdGVWYWx1ZTogKCkgPT4gUHJvbWlzZTxhbnk+KSA9PiB7XG4gICAgICAgIGlmIChjb250ZXh0LnNoYXJlZC5oYXMobmFtZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBjb250ZXh0LnNoYXJlZC5nZXQobmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdmFsdWUgPSBhd2FpdCBjcmVhdGVWYWx1ZSgpO1xuICAgICAgICBjb250ZXh0LnNoYXJlZC5zZXQobmFtZSwgdmFsdWUpO1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfTtcblxuICAgIGNvbnN0IGNvbmZpZyA9IGNvbnRleHQuY29uZmlnLnJlcXVlc3RzO1xuICAgIGNvbnN0IHByb2R1Y2VyOiBQcm9kdWNlciA9IGF3YWl0IGVuc3VyZVNoYXJlZCgncHJvZHVjZXInLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGthZmthOiBLYWZrYSA9IGF3YWl0IGVuc3VyZVNoYXJlZCgna2Fma2EnLCBhc3luYyAoKSA9PiBuZXcgS2Fma2Eoe1xuICAgICAgICAgICAgY2xpZW50SWQ6ICdxLXNlcnZlcicsXG4gICAgICAgICAgICBicm9rZXJzOiBbY29uZmlnLnNlcnZlcl1cbiAgICAgICAgfSkpO1xuICAgICAgICBjb25zdCBuZXdQcm9kdWNlciA9IGthZmthLnByb2R1Y2VyKCk7XG4gICAgICAgIGF3YWl0IG5ld1Byb2R1Y2VyLmNvbm5lY3QoKTtcbiAgICAgICAgcmV0dXJuIG5ld1Byb2R1Y2VyO1xuXG4gICAgfSk7XG4gICAgYXdhaXQgcHJvZHVjZXIuc2VuZCh7XG4gICAgICAgIHRvcGljOiBjb25maWcudG9waWMsXG4gICAgICAgIG1lc3NhZ2VzOiByZXF1ZXN0cy5tYXAoKHJlcXVlc3QpID0+ICh7XG4gICAgICAgICAgICBrZXk6IHJlcXVlc3QuaWQsXG4gICAgICAgICAgICB2YWx1ZTogcmVxdWVzdC5ib2R5LFxuICAgICAgICB9KSksXG4gICAgfSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHBvc3RSZXF1ZXN0cyhfLCBhcmdzOiB7IHJlcXVlc3RzOiBSZXF1ZXN0W10gfSwgY29udGV4dDogQ29udGV4dCk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICBjb25zdCByZXF1ZXN0czogPyhSZXF1ZXN0W10pID0gYXJncy5yZXF1ZXN0cztcbiAgICBpZiAoIXJlcXVlc3RzKSB7XG4gICAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKGNvbnRleHQuY29uZmlnLnJlcXVlc3RzLm1vZGUgPT09ICdyZXN0Jykge1xuICAgICAgICAgICAgYXdhaXQgcG9zdFJlcXVlc3RzVXNpbmdSZXN0KHJlcXVlc3RzLCBjb250ZXh0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGF3YWl0IHBvc3RSZXF1ZXN0c1VzaW5nS2Fma2EocmVxdWVzdHMsIGNvbnRleHQpO1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ1tRIFNlcnZlcl0gcG9zdCByZXF1ZXN0IGZhaWxlZF0nLCBlcnJvcik7XG4gICAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgICByZXR1cm4gcmVxdWVzdHMubWFwKHggPT4geC5pZCk7XG59XG5cbmNvbnN0IGN1c3RvbVJlc29sdmVycyA9IHtcbiAgICBRdWVyeToge1xuICAgICAgICBpbmZvLFxuICAgICAgICBnZXRBY2NvdW50c0NvdW50LFxuICAgICAgICBnZXRBY2NvdW50VHJhbnNhY3Rpb25TdW1tYXJpZXMsXG4gICAgfSxcbiAgICBNdXRhdGlvbjoge1xuICAgICAgICBwb3N0UmVxdWVzdHMsXG4gICAgfSxcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBhdHRhY2hDdXN0b21SZXNvbHZlcnMob3JpZ2luYWw6IGFueSk6IGFueSB7XG4gICAgb3ZlcnJpZGVPYmplY3Qob3JpZ2luYWwsIGN1c3RvbVJlc29sdmVycyk7XG4gICAgcmV0dXJuIG9yaWdpbmFsO1xufVxuIl19