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
                return _context2.abrupt("return", this.invokeAuth('getAccessRights', {
                  accessKey: accessKey
                }));

              case 5:
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9xLWF1dGguanMiXSwibmFtZXMiOlsiZ3JhbnRlZEFjY2VzcyIsIk9iamVjdCIsImZyZWV6ZSIsImdyYW50ZWQiLCJyZXN0cmljdFRvQWNjb3VudHMiLCJkZW5pZWRBY2Nlc3MiLCJRQXV0aCIsImNvbmZpZyIsImF1dGhvcml6YXRpb24iLCJlbmRwb2ludCIsImVycm9yIiwiYWNjZXNzS2V5IiwiZ2V0QWNjZXNzUmlnaHRzIiwiYWNjZXNzIiwibGVuZ3RoIiwiaW52b2tlQXV0aCIsImF1dGhTZXJ2aWNlUmVxdWlyZWQiLCJhY2NvdW50Iiwia2V5cyIsInNpZ25lZE1hbmFnZW1lbnRBY2Nlc3NLZXkiLCJtZXRob2QiLCJwYXJhbXMiLCJoZWFkZXJzIiwiYm9keSIsIkpTT04iLCJzdHJpbmdpZnkiLCJqc29ucnBjIiwiaWQiLCJyZXMiLCJzdGF0dXMiLCJFcnJvciIsInRleHQiLCJqc29uIiwicmVzcG9uc2UiLCJtZXNzYWdlIiwiZGVzY3JpcHRpb24iLCJzb3VyY2UiLCJjb2RlIiwicmVzdWx0IiwicmVxIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBR0E7O0FBT0EsSUFBTUEsYUFBMkIsR0FBR0MsTUFBTSxDQUFDQyxNQUFQLENBQWM7QUFDOUNDLEVBQUFBLE9BQU8sRUFBRSxJQURxQztBQUU5Q0MsRUFBQUEsa0JBQWtCLEVBQUU7QUFGMEIsQ0FBZCxDQUFwQztBQUtBLElBQU1DLFlBQTBCLEdBQUdKLE1BQU0sQ0FBQ0MsTUFBUCxDQUFjO0FBQzdDQyxFQUFBQSxPQUFPLEVBQUUsS0FEb0M7QUFFN0NDLEVBQUFBLGtCQUFrQixFQUFFO0FBRnlCLENBQWQsQ0FBbkM7O0lBS3FCRSxLOzs7QUFHakIsaUJBQVlDLE1BQVosRUFBNkI7QUFBQTtBQUFBO0FBQ3pCLFNBQUtBLE1BQUwsR0FBY0EsTUFBZDtBQUNIOzs7OzBDQWFxQjtBQUNsQixVQUFJLENBQUMsS0FBS0EsTUFBTCxDQUFZQyxhQUFaLENBQTBCQyxRQUEvQixF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QUN2QixLQUFULENBQWUyQixJQUFmLElBQXVCLEdBQTNDO3NCQUNNM0IsSzs7O2tEQUdIdUIsUUFBUSxDQUFDSyxNOzs7Ozs7Ozs7Ozs7Ozs7Ozs7cUNBakdJQyxHLEVBQWtCO0FBQ3RDLGFBQVFBLEdBQUcsSUFBSUEsR0FBRyxDQUFDakIsT0FBWCxJQUFzQmlCLEdBQUcsQ0FBQ2pCLE9BQUosQ0FBWWQsYUFBbkMsSUFBcUQsRUFBNUQ7QUFDSDs7OzBCQUVZNkIsSSxFQUFjSCxPLEVBQXdCO0FBQy9DLFVBQU14QixLQUFLLEdBQUcsSUFBSW9CLEtBQUosQ0FBVUksT0FBVixDQUFkO0FBQ0N4QixNQUFBQSxLQUFELENBQWEwQixNQUFiLEdBQXNCLFNBQXRCO0FBQ0MxQixNQUFBQSxLQUFELENBQWEyQixJQUFiLEdBQW9CQSxJQUFwQjtBQUNBLGFBQU8zQixLQUFQO0FBQ0giLCJzb3VyY2VzQ29udGVudCI6WyIvLyBAZmxvd1xuXG5pbXBvcnQgdHlwZSB7IFFDb25maWcgfSBmcm9tIFwiLi9jb25maWdcIjtcbmltcG9ydCBmZXRjaCBmcm9tICdub2RlLWZldGNoJztcblxuZXhwb3J0IHR5cGUgQWNjZXNzUmlnaHRzID0ge1xuICAgIGdyYW50ZWQ6IGJvb2wsXG4gICAgcmVzdHJpY3RUb0FjY291bnRzOiBzdHJpbmdbXSxcbn1cblxuY29uc3QgZ3JhbnRlZEFjY2VzczogQWNjZXNzUmlnaHRzID0gT2JqZWN0LmZyZWV6ZSh7XG4gICAgZ3JhbnRlZDogdHJ1ZSxcbiAgICByZXN0cmljdFRvQWNjb3VudHM6IFtdLFxufSk7XG5cbmNvbnN0IGRlbmllZEFjY2VzczogQWNjZXNzUmlnaHRzID0gT2JqZWN0LmZyZWV6ZSh7XG4gICAgZ3JhbnRlZDogZmFsc2UsXG4gICAgcmVzdHJpY3RUb0FjY291bnRzOiBbXSxcbn0pO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBRQXV0aCB7XG4gICAgY29uZmlnOiBRQ29uZmlnO1xuXG4gICAgY29uc3RydWN0b3IoY29uZmlnOiBRQ29uZmlnKSB7XG4gICAgICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgIH1cblxuICAgIHN0YXRpYyBleHRyYWN0QWNjZXNzS2V5KHJlcTogYW55KTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIChyZXEgJiYgcmVxLmhlYWRlcnMgJiYgcmVxLmhlYWRlcnMuYXV0aG9yaXphdGlvbikgfHwgJydcbiAgICB9XG5cbiAgICBzdGF0aWMgZXJyb3IoY29kZTogbnVtYmVyLCBtZXNzYWdlOiBzdHJpbmcpOiBFcnJvciB7XG4gICAgICAgIGNvbnN0IGVycm9yID0gbmV3IEVycm9yKG1lc3NhZ2UpO1xuICAgICAgICAoZXJyb3I6IGFueSkuc291cmNlID0gJ2dyYXBocWwnO1xuICAgICAgICAoZXJyb3I6IGFueSkuY29kZSA9IGNvZGU7XG4gICAgICAgIHJldHVybiBlcnJvcjtcbiAgICB9XG5cbiAgICBhdXRoU2VydmljZVJlcXVpcmVkKCkge1xuICAgICAgICBpZiAoIXRoaXMuY29uZmlnLmF1dGhvcml6YXRpb24uZW5kcG9pbnQpIHtcbiAgICAgICAgICAgIHRocm93IFFBdXRoLmVycm9yKDUwMCwgJ0F1dGggc2VydmljZSB1bmF2YWlsYWJsZScpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgcmVxdWlyZUdyYW50ZWRBY2Nlc3MoYWNjZXNzS2V5OiBzdHJpbmcgfCB0eXBlb2YgdW5kZWZpbmVkKTogUHJvbWlzZTxBY2Nlc3NSaWdodHM+IHtcbiAgICAgICAgY29uc3QgYWNjZXNzID0gYXdhaXQgdGhpcy5nZXRBY2Nlc3NSaWdodHMoYWNjZXNzS2V5KTtcbiAgICAgICAgaWYgKCFhY2Nlc3MuZ3JhbnRlZCkge1xuICAgICAgICAgICAgdGhyb3cgUUF1dGguZXJyb3IoNDAxLCAnVW5hdXRob3JpemVkJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGFjY2Vzcy5yZXN0cmljdFRvQWNjb3VudHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdGhyb3cgUUF1dGguZXJyb3IoNTAwLCAnSW50ZXJuYWwgZXJyb3I6IEdyYXBoUUwgc2VydmljZXMgZG9lc25cXCd0IHN1cHBvcnQgYWNjb3VudCByZXN0cmljdGlvbnMgeWV0Jyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFjY2VzcztcbiAgICB9XG5cbiAgICBhc3luYyBnZXRBY2Nlc3NSaWdodHMoYWNjZXNzS2V5OiBzdHJpbmcgfCB0eXBlb2YgdW5kZWZpbmVkKTogUHJvbWlzZTxBY2Nlc3NSaWdodHM+IHtcbiAgICAgICAgaWYgKCF0aGlzLmNvbmZpZy5hdXRob3JpemF0aW9uLmVuZHBvaW50KSB7XG4gICAgICAgICAgICByZXR1cm4gZ3JhbnRlZEFjY2VzcztcbiAgICAgICAgfVxuICAgICAgICBpZiAoKGFjY2Vzc0tleSB8fCAnJykgPT09ICcnKSB7XG4gICAgICAgICAgICByZXR1cm4gZGVuaWVkQWNjZXNzO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLmludm9rZUF1dGgoJ2dldEFjY2Vzc1JpZ2h0cycsIHtcbiAgICAgICAgICAgIGFjY2Vzc0tleSxcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMgZ2V0TWFuYWdlbWVudEFjY2Vzc0tleSgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgICAgICB0aGlzLmF1dGhTZXJ2aWNlUmVxdWlyZWQoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuaW52b2tlQXV0aCgnZ2V0TWFuYWdlbWVudEFjY2Vzc0tleScsIHt9KTtcbiAgICB9XG5cbiAgICBhc3luYyByZWdpc3RlckFjY2Vzc0tleXMoXG4gICAgICAgIGFjY291bnQ6IHN0cmluZyxcbiAgICAgICAga2V5czogc3RyaW5nW10sXG4gICAgICAgIHNpZ25lZE1hbmFnZW1lbnRBY2Nlc3NLZXk6IHN0cmluZ1xuICAgICk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgICAgIHRoaXMuYXV0aFNlcnZpY2VSZXF1aXJlZCgpO1xuICAgICAgICByZXR1cm4gdGhpcy5pbnZva2VBdXRoKCdyZWdpc3RlckFjY2Vzc0tleXMnLCB7XG4gICAgICAgICAgICBhY2NvdW50LFxuICAgICAgICAgICAga2V5cyxcbiAgICAgICAgICAgIHNpZ25lZE1hbmFnZW1lbnRBY2Nlc3NLZXlcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMgcmV2b2tlQWNjZXNzS2V5cyhcbiAgICAgICAgYWNjb3VudDogc3RyaW5nLFxuICAgICAgICBrZXlzOiBzdHJpbmdbXSxcbiAgICAgICAgc2lnbmVkTWFuYWdlbWVudEFjY2Vzc0tleTogc3RyaW5nXG4gICAgKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICAgICAgdGhpcy5hdXRoU2VydmljZVJlcXVpcmVkKCk7XG4gICAgICAgIHJldHVybiB0aGlzLmludm9rZUF1dGgoJ3Jldm9rZUFjY2Vzc0tleXMnLCB7XG4gICAgICAgICAgICBhY2NvdW50LFxuICAgICAgICAgICAga2V5cyxcbiAgICAgICAgICAgIHNpZ25lZE1hbmFnZW1lbnRBY2Nlc3NLZXlcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMgaW52b2tlQXV0aChtZXRob2Q6IHN0cmluZywgcGFyYW1zOiBhbnkpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCh0aGlzLmNvbmZpZy5hdXRob3JpemF0aW9uLmVuZHBvaW50LCB7XG4gICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgICBqc29ucnBjOiAnMi4wJyxcbiAgICAgICAgICAgICAgICBpZDogJzEnLFxuICAgICAgICAgICAgICAgIG1ldGhvZCxcbiAgICAgICAgICAgICAgICBwYXJhbXNcbiAgICAgICAgICAgIH0pLFxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAocmVzLnN0YXR1cyAhPT0gMjAwKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEF1dGggc2VydmljZSBmYWlsZWQ6ICR7YXdhaXQgcmVzLnRleHQoKX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgICAgaWYgKHJlc3BvbnNlLmVycm9yKSB7XG4gICAgICAgICAgICBjb25zdCBlcnJvciA9IG5ldyBFcnJvcihyZXNwb25zZS5lcnJvci5tZXNzYWdlIHx8IHJlc3BvbnNlLmVycm9yLmRlc2NyaXB0aW9uKTtcbiAgICAgICAgICAgIChlcnJvcjogYW55KS5zb3VyY2UgPSByZXNwb25zZS5lcnJvci5zb3VyY2UgfHwgJ2dyYXBocWwnO1xuICAgICAgICAgICAgKGVycm9yOiBhbnkpLmNvZGUgPSByZXNwb25zZS5lcnJvci5jb2RlIHx8IDUwMDtcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlLnJlc3VsdDtcbiAgICB9XG5cbn1cbiJdfQ==