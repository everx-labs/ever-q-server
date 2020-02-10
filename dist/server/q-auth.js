"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _nodeFetch = _interopRequireDefault(require("node-fetch"));

var grantedBlockchainAccess = Object.freeze({
  granted: true,
  restrictToAccounts: []
});
var deniedBlockchainAccess = Object.freeze({
  granted: false,
  restrictToAccounts: []
});

var QAuth =
/*#__PURE__*/
function () {
  function QAuth(config) {
    (0, _classCallCheck2["default"])(this, QAuth);
    (0, _defineProperty2["default"])(this, "config", void 0);
    this.config = config;
  }

  (0, _createClass2["default"])(QAuth, [{
    key: "requireGrantedAccess",
    value: function () {
      var _requireGrantedAccess = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee(accessKey) {
        var access;
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return this.getBlockchainAccessRights(accessKey);

              case 2:
                access = _context.sent;

                if (access.granted) {
                  _context.next = 5;
                  break;
                }

                throw QAuth.error(401, 'Unauthorized');

              case 5:
                if (!(access.restrictToAccounts.length > 0)) {
                  _context.next = 7;
                  break;
                }

                throw QAuth.error(500, 'Internal error: GraphQL services doesn\'t support account restrictions yet');

              case 7:
                return _context.abrupt("return", access);

              case 8:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function requireGrantedAccess(_x) {
        return _requireGrantedAccess.apply(this, arguments);
      }

      return requireGrantedAccess;
    }()
  }, {
    key: "getBlockchainAccessRights",
    value: function () {
      var _getBlockchainAccessRights = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee2(accessKey) {
        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (this.config.authorization.endpoint) {
                  _context2.next = 2;
                  break;
                }

                return _context2.abrupt("return", grantedBlockchainAccess);

              case 2:
                if (!((accessKey || '') === '')) {
                  _context2.next = 4;
                  break;
                }

                return _context2.abrupt("return", deniedBlockchainAccess);

              case 4:
                return _context2.abrupt("return", this.invokeAuth('getBlockchainAccessRights', {
                  accessKey: accessKey
                }));

              case 5:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function getBlockchainAccessRights(_x2) {
        return _getBlockchainAccessRights.apply(this, arguments);
      }

      return getBlockchainAccessRights;
    }()
  }, {
    key: "registerAccessKeys",
    value: function () {
      var _registerAccessKeys = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee3(account, keys, signature) {
        return _regenerator["default"].wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                if (this.config.authorization.endpoint) {
                  _context3.next = 2;
                  break;
                }

                throw QAuth.error(500, 'Auth service unavailable');

              case 2:
                return _context3.abrupt("return", this.invokeAuth('registerAccessKeys', {
                  account: account,
                  keys: keys,
                  signature: signature
                }));

              case 3:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function registerAccessKeys(_x3, _x4, _x5) {
        return _registerAccessKeys.apply(this, arguments);
      }

      return registerAccessKeys;
    }()
  }, {
    key: "revokeAccessKeys",
    value: function () {
      var _revokeAccessKeys = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee4(account, keys, signature) {
        return _regenerator["default"].wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                if (this.config.authorization.endpoint) {
                  _context4.next = 2;
                  break;
                }

                throw QAuth.error(500, 'Auth service unavailable');

              case 2:
                return _context4.abrupt("return", this.invokeAuth('revokeAccessKeys', {
                  account: account,
                  keys: keys,
                  signature: signature
                }));

              case 3:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function revokeAccessKeys(_x6, _x7, _x8) {
        return _revokeAccessKeys.apply(this, arguments);
      }

      return revokeAccessKeys;
    }()
  }, {
    key: "invokeAuth",
    value: function () {
      var _invokeAuth = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee5(method, params) {
        var res, response, error;
        return _regenerator["default"].wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                _context5.next = 2;
                return (0, _nodeFetch["default"])(this.config.authorization.endpoint, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: '1',
                    method: method,
                    params: params
                  })
                });

              case 2:
                res = _context5.sent;

                if (!(res.status !== 200)) {
                  _context5.next = 11;
                  break;
                }

                _context5.t0 = Error;
                _context5.t1 = "Auth service failed: ";
                _context5.next = 8;
                return res.text();

              case 8:
                _context5.t2 = _context5.sent;
                _context5.t3 = _context5.t1.concat.call(_context5.t1, _context5.t2);
                throw new _context5.t0(_context5.t3);

              case 11:
                _context5.next = 13;
                return res.json();

              case 13:
                response = _context5.sent;

                if (!response.error) {
                  _context5.next = 19;
                  break;
                }

                error = new Error(response.error.message || response.error.description);
                error.source = response.error.source || 'graphql';
                error.code = response.error.code || 500;
                throw error;

              case 19:
                return _context5.abrupt("return", response.result);

              case 20:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function invokeAuth(_x9, _x10) {
        return _invokeAuth.apply(this, arguments);
      }

      return invokeAuth;
    }()
  }], [{
    key: "extractAccessKey",
    value: function extractAccessKey(req) {
      return req && req.headers && req.headers.authorization || '';
    }
  }, {
    key: "error",
    value: function error(code, message) {
      var error = new Error(message);
      error.source = 'graphql';
      error.code = code;
      return error;
    }
  }]);
  return QAuth;
}();

exports["default"] = QAuth;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9xLWF1dGguanMiXSwibmFtZXMiOlsiZ3JhbnRlZEJsb2NrY2hhaW5BY2Nlc3MiLCJPYmplY3QiLCJmcmVlemUiLCJncmFudGVkIiwicmVzdHJpY3RUb0FjY291bnRzIiwiZGVuaWVkQmxvY2tjaGFpbkFjY2VzcyIsIlFBdXRoIiwiY29uZmlnIiwiYWNjZXNzS2V5IiwiZ2V0QmxvY2tjaGFpbkFjY2Vzc1JpZ2h0cyIsImFjY2VzcyIsImVycm9yIiwibGVuZ3RoIiwiYXV0aG9yaXphdGlvbiIsImVuZHBvaW50IiwiaW52b2tlQXV0aCIsImFjY291bnQiLCJrZXlzIiwic2lnbmF0dXJlIiwibWV0aG9kIiwicGFyYW1zIiwiaGVhZGVycyIsImJvZHkiLCJKU09OIiwic3RyaW5naWZ5IiwianNvbnJwYyIsImlkIiwicmVzIiwic3RhdHVzIiwiRXJyb3IiLCJ0ZXh0IiwianNvbiIsInJlc3BvbnNlIiwibWVzc2FnZSIsImRlc2NyaXB0aW9uIiwic291cmNlIiwiY29kZSIsInJlc3VsdCIsInJlcSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUdBOztBQU9BLElBQU1BLHVCQUErQyxHQUFHQyxNQUFNLENBQUNDLE1BQVAsQ0FBYztBQUNsRUMsRUFBQUEsT0FBTyxFQUFFLElBRHlEO0FBRWxFQyxFQUFBQSxrQkFBa0IsRUFBRTtBQUY4QyxDQUFkLENBQXhEO0FBS0EsSUFBTUMsc0JBQThDLEdBQUdKLE1BQU0sQ0FBQ0MsTUFBUCxDQUFjO0FBQ2pFQyxFQUFBQSxPQUFPLEVBQUUsS0FEd0Q7QUFFakVDLEVBQUFBLGtCQUFrQixFQUFFO0FBRjZDLENBQWQsQ0FBdkQ7O0lBS3FCRSxLOzs7QUFHakIsaUJBQVlDLE1BQVosRUFBNkI7QUFBQTtBQUFBO0FBQ3pCLFNBQUtBLE1BQUwsR0FBY0EsTUFBZDtBQUNIOzs7Ozs7O29EQWEwQkMsUzs7Ozs7Ozt1QkFDRixLQUFLQyx5QkFBTCxDQUErQkQsU0FBL0IsQzs7O0FBQWZFLGdCQUFB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Ozs7Ozs7Ozs7O3FDQWxGSUMsRyxFQUFrQjtBQUN0QyxhQUFRQSxHQUFHLElBQUlBLEdBQUcsQ0FBQ2pCLE9BQVgsSUFBc0JpQixHQUFHLENBQUNqQixPQUFKLENBQVlSLGFBQW5DLElBQXFELEVBQTVEO0FBQ0g7OzswQkFFWXVCLEksRUFBY0gsTyxFQUF3QjtBQUMvQyxVQUFNdEIsS0FBSyxHQUFHLElBQUlrQixLQUFKLENBQVVJLE9BQVYsQ0FBZDtBQUNDdEIsTUFBQUEsS0FBRCxDQUFhd0IsTUFBYixHQUFzQixTQUF0QjtBQUNDeEIsTUFBQUEsS0FBRCxDQUFheUIsSUFBYixHQUFvQkEsSUFBcEI7QUFDQSxhQUFPekIsS0FBUDtBQUNIIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQGZsb3dcblxuaW1wb3J0IHR5cGUgeyBRQ29uZmlnIH0gZnJvbSBcIi4vY29uZmlnXCI7XG5pbXBvcnQgZmV0Y2ggZnJvbSAnbm9kZS1mZXRjaCc7XG5cbmV4cG9ydCB0eXBlIEJsb2NrY2hhaW5BY2Nlc3NSaWdodHMgPSB7XG4gICAgZ3JhbnRlZDogYm9vbCxcbiAgICByZXN0cmljdFRvQWNjb3VudHM6IHN0cmluZ1tdLFxufVxuXG5jb25zdCBncmFudGVkQmxvY2tjaGFpbkFjY2VzczogQmxvY2tjaGFpbkFjY2Vzc1JpZ2h0cyA9IE9iamVjdC5mcmVlemUoe1xuICAgIGdyYW50ZWQ6IHRydWUsXG4gICAgcmVzdHJpY3RUb0FjY291bnRzOiBbXSxcbn0pO1xuXG5jb25zdCBkZW5pZWRCbG9ja2NoYWluQWNjZXNzOiBCbG9ja2NoYWluQWNjZXNzUmlnaHRzID0gT2JqZWN0LmZyZWV6ZSh7XG4gICAgZ3JhbnRlZDogZmFsc2UsXG4gICAgcmVzdHJpY3RUb0FjY291bnRzOiBbXSxcbn0pO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBRQXV0aCB7XG4gICAgY29uZmlnOiBRQ29uZmlnO1xuXG4gICAgY29uc3RydWN0b3IoY29uZmlnOiBRQ29uZmlnKSB7XG4gICAgICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgIH1cblxuICAgIHN0YXRpYyBleHRyYWN0QWNjZXNzS2V5KHJlcTogYW55KTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIChyZXEgJiYgcmVxLmhlYWRlcnMgJiYgcmVxLmhlYWRlcnMuYXV0aG9yaXphdGlvbikgfHwgJydcbiAgICB9XG5cbiAgICBzdGF0aWMgZXJyb3IoY29kZTogbnVtYmVyLCBtZXNzYWdlOiBzdHJpbmcpOiBFcnJvciB7XG4gICAgICAgIGNvbnN0IGVycm9yID0gbmV3IEVycm9yKG1lc3NhZ2UpO1xuICAgICAgICAoZXJyb3I6IGFueSkuc291cmNlID0gJ2dyYXBocWwnO1xuICAgICAgICAoZXJyb3I6IGFueSkuY29kZSA9IGNvZGU7XG4gICAgICAgIHJldHVybiBlcnJvcjtcbiAgICB9XG5cbiAgICBhc3luYyByZXF1aXJlR3JhbnRlZEFjY2VzcyhhY2Nlc3NLZXk6IHN0cmluZyB8IHR5cGVvZiB1bmRlZmluZWQpOiBQcm9taXNlPEJsb2NrY2hhaW5BY2Nlc3NSaWdodHM+IHtcbiAgICAgICAgY29uc3QgYWNjZXNzID0gYXdhaXQgdGhpcy5nZXRCbG9ja2NoYWluQWNjZXNzUmlnaHRzKGFjY2Vzc0tleSk7XG4gICAgICAgIGlmICghYWNjZXNzLmdyYW50ZWQpIHtcbiAgICAgICAgICAgIHRocm93IFFBdXRoLmVycm9yKDQwMSwgJ1VuYXV0aG9yaXplZCcpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChhY2Nlc3MucmVzdHJpY3RUb0FjY291bnRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHRocm93IFFBdXRoLmVycm9yKDUwMCwgJ0ludGVybmFsIGVycm9yOiBHcmFwaFFMIHNlcnZpY2VzIGRvZXNuXFwndCBzdXBwb3J0IGFjY291bnQgcmVzdHJpY3Rpb25zIHlldCcpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhY2Nlc3M7XG4gICAgfVxuXG4gICAgYXN5bmMgZ2V0QmxvY2tjaGFpbkFjY2Vzc1JpZ2h0cyhhY2Nlc3NLZXk6IHN0cmluZyB8IHR5cGVvZiB1bmRlZmluZWQpOiBQcm9taXNlPEJsb2NrY2hhaW5BY2Nlc3NSaWdodHM+IHtcbiAgICAgICAgaWYgKCF0aGlzLmNvbmZpZy5hdXRob3JpemF0aW9uLmVuZHBvaW50KSB7XG4gICAgICAgICAgICByZXR1cm4gZ3JhbnRlZEJsb2NrY2hhaW5BY2Nlc3M7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKChhY2Nlc3NLZXkgfHwgJycpID09PSAnJykge1xuICAgICAgICAgICAgcmV0dXJuIGRlbmllZEJsb2NrY2hhaW5BY2Nlc3M7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuaW52b2tlQXV0aCgnZ2V0QmxvY2tjaGFpbkFjY2Vzc1JpZ2h0cycsIHtcbiAgICAgICAgICAgIGFjY2Vzc0tleSxcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMgcmVnaXN0ZXJBY2Nlc3NLZXlzKGFjY291bnQ6IHN0cmluZywga2V5czogc3RyaW5nW10sIHNpZ25hdHVyZTogc3RyaW5nKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICAgICAgaWYgKCF0aGlzLmNvbmZpZy5hdXRob3JpemF0aW9uLmVuZHBvaW50KSB7XG4gICAgICAgICAgICB0aHJvdyBRQXV0aC5lcnJvcig1MDAsICdBdXRoIHNlcnZpY2UgdW5hdmFpbGFibGUnKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5pbnZva2VBdXRoKCdyZWdpc3RlckFjY2Vzc0tleXMnLCB7XG4gICAgICAgICAgICBhY2NvdW50LFxuICAgICAgICAgICAga2V5cyxcbiAgICAgICAgICAgIHNpZ25hdHVyZVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYyByZXZva2VBY2Nlc3NLZXlzKGFjY291bnQ6IHN0cmluZywga2V5czogc3RyaW5nW10sIHNpZ25hdHVyZTogc3RyaW5nKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICAgICAgaWYgKCF0aGlzLmNvbmZpZy5hdXRob3JpemF0aW9uLmVuZHBvaW50KSB7XG4gICAgICAgICAgICB0aHJvdyBRQXV0aC5lcnJvcig1MDAsICdBdXRoIHNlcnZpY2UgdW5hdmFpbGFibGUnKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5pbnZva2VBdXRoKCdyZXZva2VBY2Nlc3NLZXlzJywge1xuICAgICAgICAgICAgYWNjb3VudCxcbiAgICAgICAgICAgIGtleXMsXG4gICAgICAgICAgICBzaWduYXR1cmVcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMgaW52b2tlQXV0aChtZXRob2Q6IHN0cmluZywgcGFyYW1zOiBhbnkpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCh0aGlzLmNvbmZpZy5hdXRob3JpemF0aW9uLmVuZHBvaW50LCB7XG4gICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgICBqc29ucnBjOiAnMi4wJyxcbiAgICAgICAgICAgICAgICBpZDogJzEnLFxuICAgICAgICAgICAgICAgIG1ldGhvZCxcbiAgICAgICAgICAgICAgICBwYXJhbXNcbiAgICAgICAgICAgIH0pLFxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAocmVzLnN0YXR1cyAhPT0gMjAwKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEF1dGggc2VydmljZSBmYWlsZWQ6ICR7YXdhaXQgcmVzLnRleHQoKX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgICAgaWYgKHJlc3BvbnNlLmVycm9yKSB7XG4gICAgICAgICAgICBjb25zdCBlcnJvciA9IG5ldyBFcnJvcihyZXNwb25zZS5lcnJvci5tZXNzYWdlIHx8IHJlc3BvbnNlLmVycm9yLmRlc2NyaXB0aW9uKTtcbiAgICAgICAgICAgIChlcnJvcjogYW55KS5zb3VyY2UgPSByZXNwb25zZS5lcnJvci5zb3VyY2UgfHwgJ2dyYXBocWwnO1xuICAgICAgICAgICAgKGVycm9yOiBhbnkpLmNvZGUgPSByZXNwb25zZS5lcnJvci5jb2RlIHx8IDUwMDtcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlLnJlc3VsdDtcbiAgICB9XG5cbn1cbiJdfQ==