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

var grantedAccess = Object.freeze({
  granted: true,
  restrictToAccounts: []
});
var deniedAccess = Object.freeze({
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
    key: "authServiceRequired",
    value: function authServiceRequired() {
      if (!this.config.authorization.endpoint) {
        throw QAuth.error(500, 'Auth service unavailable');
      }
    }
  }, {
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
                return this.getAccessRights(accessKey);

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
    key: "getAccessRights",
    value: function () {
      var _getAccessRights = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee2(accessKey) {
        var rights;
        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (this.config.authorization.endpoint) {
                  _context2.next = 2;
                  break;
                }

                return _context2.abrupt("return", grantedAccess);

              case 2:
                if (!((accessKey || '') === '')) {
                  _context2.next = 4;
                  break;
                }

                return _context2.abrupt("return", deniedAccess);

              case 4:
                _context2.next = 6;
                return this.invokeAuth('getAccessRights', {
                  accessKey: accessKey
                });

              case 6:
                rights = _context2.sent;

                if (!rights.restrictToAccounts) {
                  rights.restrictToAccounts = [];
                }

                return _context2.abrupt("return", rights);

              case 9:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function getAccessRights(_x2) {
        return _getAccessRights.apply(this, arguments);
      }

      return getAccessRights;
    }()
  }, {
    key: "getManagementAccessKey",
    value: function () {
      var _getManagementAccessKey = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee3() {
        return _regenerator["default"].wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                this.authServiceRequired();
                return _context3.abrupt("return", this.invokeAuth('getManagementAccessKey', {}));

              case 2:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function getManagementAccessKey() {
        return _getManagementAccessKey.apply(this, arguments);
      }

      return getManagementAccessKey;
    }()
  }, {
    key: "registerAccessKeys",
    value: function () {
      var _registerAccessKeys = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee4(account, keys, signedManagementAccessKey) {
        return _regenerator["default"].wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                this.authServiceRequired();
                return _context4.abrupt("return", this.invokeAuth('registerAccessKeys', {
                  account: account,
                  keys: keys,
                  signedManagementAccessKey: signedManagementAccessKey
                }));

              case 2:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, this);
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
      _regenerator["default"].mark(function _callee5(account, keys, signedManagementAccessKey) {
        return _regenerator["default"].wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                this.authServiceRequired();
                return _context5.abrupt("return", this.invokeAuth('revokeAccessKeys', {
                  account: account,
                  keys: keys,
                  signedManagementAccessKey: signedManagementAccessKey
                }));

              case 2:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5, this);
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
      _regenerator["default"].mark(function _callee6(method, params) {
        var res, response, error;
        return _regenerator["default"].wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                _context6.next = 2;
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
                res = _context6.sent;

                if (!(res.status !== 200)) {
                  _context6.next = 11;
                  break;
                }

                _context6.t0 = Error;
                _context6.t1 = "Auth service failed: ";
                _context6.next = 8;
                return res.text();

              case 8:
                _context6.t2 = _context6.sent;
                _context6.t3 = _context6.t1.concat.call(_context6.t1, _context6.t2);
                throw new _context6.t0(_context6.t3);

              case 11:
                _context6.next = 13;
                return res.json();

              case 13:
                response = _context6.sent;

                if (!response.error) {
                  _context6.next = 19;
                  break;
                }

                error = new Error(response.error.message || response.error.description);
                error.source = response.error.source || 'graphql';
                error.code = response.error.code || 500;
                throw error;

              case 19:
                return _context6.abrupt("return", response.result);

              case 20:
              case "end":
                return _context6.stop();
            }
          }
        }, _callee6, this);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9xLWF1dGguanMiXSwibmFtZXMiOlsiZ3JhbnRlZEFjY2VzcyIsIk9iamVjdCIsImZyZWV6ZSIsImdyYW50ZWQiLCJyZXN0cmljdFRvQWNjb3VudHMiLCJkZW5pZWRBY2Nlc3MiLCJRQXV0aCIsImNvbmZpZyIsImF1dGhvcml6YXRpb24iLCJlbmRwb2ludCIsImVycm9yIiwiYWNjZXNzS2V5IiwiZ2V0QWNjZXNzUmlnaHRzIiwiYWNjZXNzIiwibGVuZ3RoIiwiaW52b2tlQXV0aCIsInJpZ2h0cyIsImF1dGhTZXJ2aWNlUmVxdWlyZWQiLCJhY2NvdW50Iiwia2V5cyIsInNpZ25lZE1hbmFnZW1lbnRBY2Nlc3NLZXkiLCJtZXRob2QiLCJwYXJhbXMiLCJoZWFkZXJzIiwiYm9keSIsIkpTT04iLCJzdHJpbmdpZnkiLCJqc29ucnBjIiwiaWQiLCJyZXMiLCJzdGF0dXMiLCJFcnJvciIsInRleHQiLCJqc29uIiwicmVzcG9uc2UiLCJtZXNzYWdlIiwiZGVzY3JpcHRpb24iLCJzb3VyY2UiLCJjb2RlIiwicmVzdWx0IiwicmVxIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBR0E7O0FBWUEsSUFBTUEsYUFBMkIsR0FBR0MsTUFBTSxDQUFDQyxNQUFQLENBQWM7QUFDOUNDLEVBQUFBLE9BQU8sRUFBRSxJQURxQztBQUU5Q0MsRUFBQUEsa0JBQWtCLEVBQUU7QUFGMEIsQ0FBZCxDQUFwQztBQUtBLElBQU1DLFlBQTBCLEdBQUdKLE1BQU0sQ0FBQ0MsTUFBUCxDQUFjO0FBQzdDQyxFQUFBQSxPQUFPLEVBQUUsS0FEb0M7QUFFN0NDLEVBQUFBLGtCQUFrQixFQUFFO0FBRnlCLENBQWQsQ0FBbkM7O0lBS3FCRSxLOzs7QUFHakIsaUJBQVlDLE1BQVosRUFBNkI7QUFBQTtBQUFBO0FBQ3pCLFNBQUtBLE1BQUwsR0FBY0EsTUFBZDtBQUNIOzs7OzBDQWFxQjtBQUNsQixVQUFJLENBQUMsS0FBS0EsTUFBTCxDQUFZQyxhQUFaLENBQTBC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LEM7QUFDYjFCLGdCQUFBQSxLQUFELENBQWEyQixNQUFiLEdBQXNCSCxRQUFRLENBQUN4QixLQUFULENBQWUyQixNQUFmLElBQXlCLFNBQS9DO0FBQ0MzQixnQkFBQUEsS0FBRCxDQUFhNEIsSUFBYixHQUFvQkosUUFBUSxDQUFDeEIsS0FBVCxDQUFlNEIsSUFBZixJQUF1QixHQUEzQztzQkFDTTVCLEs7OztrREFHSHdCLFFBQVEsQ0FBQ0ssTTs7Ozs7Ozs7Ozs7Ozs7Ozs7O3FDQXJHSUMsRyxFQUFrQjtBQUN0QyxhQUFRQSxHQUFHLElBQUlBLEdBQUcsQ0FBQ2pCLE9BQVgsSUFBc0JpQixHQUFHLENBQUNqQixPQUFKLENBQVlmLGFBQW5DLElBQXFELEVBQTVEO0FBQ0g7OzswQkFFWThCLEksRUFBY0gsTyxFQUF3QjtBQUMvQyxVQUFNekIsS0FBSyxHQUFHLElBQUlxQixLQUFKLENBQVVJLE9BQVYsQ0FBZDtBQUNDekIsTUFBQUEsS0FBRCxDQUFhMkIsTUFBYixHQUFzQixTQUF0QjtBQUNDM0IsTUFBQUEsS0FBRCxDQUFhNEIsSUFBYixHQUFvQkEsSUFBcEI7QUFDQSxhQUFPNUIsS0FBUDtBQUNIIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQGZsb3dcblxuaW1wb3J0IHR5cGUgeyBRQ29uZmlnIH0gZnJvbSBcIi4vY29uZmlnXCI7XG5pbXBvcnQgZmV0Y2ggZnJvbSAnbm9kZS1mZXRjaCc7XG5cbmV4cG9ydCB0eXBlIEFjY2Vzc0tleSA9IHtcbiAgICBrZXk6IHN0cmluZyxcbiAgICByZXN0cmljdFRvQWNjb3VudHM/OiBzdHJpbmdbXSxcbn1cblxuZXhwb3J0IHR5cGUgQWNjZXNzUmlnaHRzID0ge1xuICAgIGdyYW50ZWQ6IGJvb2wsXG4gICAgcmVzdHJpY3RUb0FjY291bnRzOiBzdHJpbmdbXSxcbn1cblxuY29uc3QgZ3JhbnRlZEFjY2VzczogQWNjZXNzUmlnaHRzID0gT2JqZWN0LmZyZWV6ZSh7XG4gICAgZ3JhbnRlZDogdHJ1ZSxcbiAgICByZXN0cmljdFRvQWNjb3VudHM6IFtdLFxufSk7XG5cbmNvbnN0IGRlbmllZEFjY2VzczogQWNjZXNzUmlnaHRzID0gT2JqZWN0LmZyZWV6ZSh7XG4gICAgZ3JhbnRlZDogZmFsc2UsXG4gICAgcmVzdHJpY3RUb0FjY291bnRzOiBbXSxcbn0pO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBRQXV0aCB7XG4gICAgY29uZmlnOiBRQ29uZmlnO1xuXG4gICAgY29uc3RydWN0b3IoY29uZmlnOiBRQ29uZmlnKSB7XG4gICAgICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgIH1cblxuICAgIHN0YXRpYyBleHRyYWN0QWNjZXNzS2V5KHJlcTogYW55KTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIChyZXEgJiYgcmVxLmhlYWRlcnMgJiYgcmVxLmhlYWRlcnMuYXV0aG9yaXphdGlvbikgfHwgJydcbiAgICB9XG5cbiAgICBzdGF0aWMgZXJyb3IoY29kZTogbnVtYmVyLCBtZXNzYWdlOiBzdHJpbmcpOiBFcnJvciB7XG4gICAgICAgIGNvbnN0IGVycm9yID0gbmV3IEVycm9yKG1lc3NhZ2UpO1xuICAgICAgICAoZXJyb3I6IGFueSkuc291cmNlID0gJ2dyYXBocWwnO1xuICAgICAgICAoZXJyb3I6IGFueSkuY29kZSA9IGNvZGU7XG4gICAgICAgIHJldHVybiBlcnJvcjtcbiAgICB9XG5cbiAgICBhdXRoU2VydmljZVJlcXVpcmVkKCkge1xuICAgICAgICBpZiAoIXRoaXMuY29uZmlnLmF1dGhvcml6YXRpb24uZW5kcG9pbnQpIHtcbiAgICAgICAgICAgIHRocm93IFFBdXRoLmVycm9yKDUwMCwgJ0F1dGggc2VydmljZSB1bmF2YWlsYWJsZScpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgcmVxdWlyZUdyYW50ZWRBY2Nlc3MoYWNjZXNzS2V5OiBzdHJpbmcgfCB0eXBlb2YgdW5kZWZpbmVkKTogUHJvbWlzZTxBY2Nlc3NSaWdodHM+IHtcbiAgICAgICAgY29uc3QgYWNjZXNzID0gYXdhaXQgdGhpcy5nZXRBY2Nlc3NSaWdodHMoYWNjZXNzS2V5KTtcbiAgICAgICAgaWYgKCFhY2Nlc3MuZ3JhbnRlZCkge1xuICAgICAgICAgICAgdGhyb3cgUUF1dGguZXJyb3IoNDAxLCAnVW5hdXRob3JpemVkJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGFjY2Vzcy5yZXN0cmljdFRvQWNjb3VudHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdGhyb3cgUUF1dGguZXJyb3IoNTAwLCAnSW50ZXJuYWwgZXJyb3I6IEdyYXBoUUwgc2VydmljZXMgZG9lc25cXCd0IHN1cHBvcnQgYWNjb3VudCByZXN0cmljdGlvbnMgeWV0Jyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFjY2VzcztcbiAgICB9XG5cbiAgICBhc3luYyBnZXRBY2Nlc3NSaWdodHMoYWNjZXNzS2V5OiBzdHJpbmcgfCB0eXBlb2YgdW5kZWZpbmVkKTogUHJvbWlzZTxBY2Nlc3NSaWdodHM+IHtcbiAgICAgICAgaWYgKCF0aGlzLmNvbmZpZy5hdXRob3JpemF0aW9uLmVuZHBvaW50KSB7XG4gICAgICAgICAgICByZXR1cm4gZ3JhbnRlZEFjY2VzcztcbiAgICAgICAgfVxuICAgICAgICBpZiAoKGFjY2Vzc0tleSB8fCAnJykgPT09ICcnKSB7XG4gICAgICAgICAgICByZXR1cm4gZGVuaWVkQWNjZXNzO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJpZ2h0cyA9IGF3YWl0IHRoaXMuaW52b2tlQXV0aCgnZ2V0QWNjZXNzUmlnaHRzJywge1xuICAgICAgICAgICAgYWNjZXNzS2V5LFxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKCFyaWdodHMucmVzdHJpY3RUb0FjY291bnRzKSB7XG4gICAgICAgICAgICByaWdodHMucmVzdHJpY3RUb0FjY291bnRzID0gW107XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJpZ2h0cztcbiAgICB9XG5cbiAgICBhc3luYyBnZXRNYW5hZ2VtZW50QWNjZXNzS2V5KCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgICAgIHRoaXMuYXV0aFNlcnZpY2VSZXF1aXJlZCgpO1xuICAgICAgICByZXR1cm4gdGhpcy5pbnZva2VBdXRoKCdnZXRNYW5hZ2VtZW50QWNjZXNzS2V5Jywge30pO1xuICAgIH1cblxuICAgIGFzeW5jIHJlZ2lzdGVyQWNjZXNzS2V5cyhcbiAgICAgICAgYWNjb3VudDogc3RyaW5nLFxuICAgICAgICBrZXlzOiBBY2Nlc3NLZXlbXSxcbiAgICAgICAgc2lnbmVkTWFuYWdlbWVudEFjY2Vzc0tleTogc3RyaW5nXG4gICAgKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICAgICAgdGhpcy5hdXRoU2VydmljZVJlcXVpcmVkKCk7XG4gICAgICAgIHJldHVybiB0aGlzLmludm9rZUF1dGgoJ3JlZ2lzdGVyQWNjZXNzS2V5cycsIHtcbiAgICAgICAgICAgIGFjY291bnQsXG4gICAgICAgICAgICBrZXlzLFxuICAgICAgICAgICAgc2lnbmVkTWFuYWdlbWVudEFjY2Vzc0tleVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYyByZXZva2VBY2Nlc3NLZXlzKFxuICAgICAgICBhY2NvdW50OiBzdHJpbmcsXG4gICAgICAgIGtleXM6IHN0cmluZ1tdLFxuICAgICAgICBzaWduZWRNYW5hZ2VtZW50QWNjZXNzS2V5OiBzdHJpbmdcbiAgICApOiBQcm9taXNlPG51bWJlcj4ge1xuICAgICAgICB0aGlzLmF1dGhTZXJ2aWNlUmVxdWlyZWQoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuaW52b2tlQXV0aCgncmV2b2tlQWNjZXNzS2V5cycsIHtcbiAgICAgICAgICAgIGFjY291bnQsXG4gICAgICAgICAgICBrZXlzLFxuICAgICAgICAgICAgc2lnbmVkTWFuYWdlbWVudEFjY2Vzc0tleVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYyBpbnZva2VBdXRoKG1ldGhvZDogc3RyaW5nLCBwYXJhbXM6IGFueSk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKHRoaXMuY29uZmlnLmF1dGhvcml6YXRpb24uZW5kcG9pbnQsIHtcbiAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICAgIGpzb25ycGM6ICcyLjAnLFxuICAgICAgICAgICAgICAgIGlkOiAnMScsXG4gICAgICAgICAgICAgICAgbWV0aG9kLFxuICAgICAgICAgICAgICAgIHBhcmFtc1xuICAgICAgICAgICAgfSksXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChyZXMuc3RhdHVzICE9PSAyMDApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQXV0aCBzZXJ2aWNlIGZhaWxlZDogJHthd2FpdCByZXMudGV4dCgpfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgICBpZiAocmVzcG9uc2UuZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnN0IGVycm9yID0gbmV3IEVycm9yKHJlc3BvbnNlLmVycm9yLm1lc3NhZ2UgfHwgcmVzcG9uc2UuZXJyb3IuZGVzY3JpcHRpb24pO1xuICAgICAgICAgICAgKGVycm9yOiBhbnkpLnNvdXJjZSA9IHJlc3BvbnNlLmVycm9yLnNvdXJjZSB8fCAnZ3JhcGhxbCc7XG4gICAgICAgICAgICAoZXJyb3I6IGFueSkuY29kZSA9IHJlc3BvbnNlLmVycm9yLmNvZGUgfHwgNTAwO1xuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzcG9uc2UucmVzdWx0O1xuICAgIH1cblxufVxuIl19