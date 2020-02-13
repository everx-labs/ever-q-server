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
                return _context.abrupt("return", access);

              case 6:
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9xLWF1dGguanMiXSwibmFtZXMiOlsiZ3JhbnRlZEFjY2VzcyIsIk9iamVjdCIsImZyZWV6ZSIsImdyYW50ZWQiLCJyZXN0cmljdFRvQWNjb3VudHMiLCJkZW5pZWRBY2Nlc3MiLCJRQXV0aCIsImNvbmZpZyIsImF1dGhvcml6YXRpb24iLCJlbmRwb2ludCIsImVycm9yIiwiYWNjZXNzS2V5IiwiZ2V0QWNjZXNzUmlnaHRzIiwiYWNjZXNzIiwiaW52b2tlQXV0aCIsInJpZ2h0cyIsImF1dGhTZXJ2aWNlUmVxdWlyZWQiLCJhY2NvdW50Iiwia2V5cyIsInNpZ25lZE1hbmFnZW1lbnRBY2Nlc3NLZXkiLCJtZXRob2QiLCJwYXJhbXMiLCJoZWFkZXJzIiwiYm9keSIsIkpTT04iLCJzdHJpbmdpZnkiLCJqc29ucnBjIiwiaWQiLCJyZXMiLCJzdGF0dXMiLCJFcnJvciIsInRleHQiLCJqc29uIiwicmVzcG9uc2UiLCJtZXNzYWdlIiwiZGVzY3JpcHRpb24iLCJzb3VyY2UiLCJjb2RlIiwicmVzdWx0IiwicmVxIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBR0E7O0FBWUEsSUFBTUEsYUFBMkIsR0FBR0MsTUFBTSxDQUFDQyxNQUFQLENBQWM7QUFDOUNDLEVBQUFBLE9BQU8sRUFBRSxJQURxQztBQUU5Q0MsRUFBQUEsa0JBQWtCLEVBQUU7QUFGMEIsQ0FBZCxDQUFwQztBQUtBLElBQU1DLFlBQTBCLEdBQUdKLE1BQU0sQ0FBQ0MsTUFBUCxDQUFjO0FBQzdDQyxFQUFBQSxPQUFPLEVBQUUsS0FEb0M7QUFFN0NDLEVBQUFBLGtCQUFrQixFQUFFO0FBRnlCLENBQWQsQ0FBbkM7O0lBS3FCRSxLOzs7QUFHakIsaUJBQVlDLE1BQVosRUFBNkI7QUFBQTtBQUFBO0FBQ3pCLFNBQUtBLE1BQUwsR0FBY0EsTUFBZDtBQUNIOzs7OzBDQWFxQjtBQUNsQixVQUFJLENBQUMsS0FBS0EsTUFBTCxDQUFZQyxhQUFaLENBQTBCQyxRQUEvQixF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QUFiLEdBQW9CSixRQUFRLENBQUN2QixLQUFULENBQWUyQixJQUFmLElBQXVCLEdBQTNDO3NCQUNNM0IsSzs7O2tEQUdIdUIsUUFBUSxDQUFDSyxNOzs7Ozs7Ozs7Ozs7Ozs7Ozs7cUNBbEdJQyxHLEVBQWtCO0FBQ3RDLGFBQVFBLEdBQUcsSUFBSUEsR0FBRyxDQUFDakIsT0FBWCxJQUFzQmlCLEdBQUcsQ0FBQ2pCLE9BQUosQ0FBWWQsYUFBbkMsSUFBcUQsRUFBNUQ7QUFDSDs7OzBCQUVZNkIsSSxFQUFjSCxPLEVBQXdCO0FBQy9DLFVBQU14QixLQUFLLEdBQUcsSUFBSW9CLEtBQUosQ0FBVUksT0FBVixDQUFkO0FBQ0N4QixNQUFBQSxLQUFELENBQWEwQixNQUFiLEdBQXNCLFNBQXRCO0FBQ0MxQixNQUFBQSxLQUFELENBQWEyQixJQUFiLEdBQW9CQSxJQUFwQjtBQUNBLGFBQU8zQixLQUFQO0FBQ0giLCJzb3VyY2VzQ29udGVudCI6WyIvLyBAZmxvd1xuXG5pbXBvcnQgdHlwZSB7IFFDb25maWcgfSBmcm9tIFwiLi9jb25maWdcIjtcbmltcG9ydCBmZXRjaCBmcm9tICdub2RlLWZldGNoJztcblxuZXhwb3J0IHR5cGUgQWNjZXNzS2V5ID0ge1xuICAgIGtleTogc3RyaW5nLFxuICAgIHJlc3RyaWN0VG9BY2NvdW50cz86IHN0cmluZ1tdLFxufVxuXG5leHBvcnQgdHlwZSBBY2Nlc3NSaWdodHMgPSB7XG4gICAgZ3JhbnRlZDogYm9vbCxcbiAgICByZXN0cmljdFRvQWNjb3VudHM6IHN0cmluZ1tdLFxufVxuXG5jb25zdCBncmFudGVkQWNjZXNzOiBBY2Nlc3NSaWdodHMgPSBPYmplY3QuZnJlZXplKHtcbiAgICBncmFudGVkOiB0cnVlLFxuICAgIHJlc3RyaWN0VG9BY2NvdW50czogW10sXG59KTtcblxuY29uc3QgZGVuaWVkQWNjZXNzOiBBY2Nlc3NSaWdodHMgPSBPYmplY3QuZnJlZXplKHtcbiAgICBncmFudGVkOiBmYWxzZSxcbiAgICByZXN0cmljdFRvQWNjb3VudHM6IFtdLFxufSk7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFFBdXRoIHtcbiAgICBjb25maWc6IFFDb25maWc7XG5cbiAgICBjb25zdHJ1Y3Rvcihjb25maWc6IFFDb25maWcpIHtcbiAgICAgICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgfVxuXG4gICAgc3RhdGljIGV4dHJhY3RBY2Nlc3NLZXkocmVxOiBhbnkpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gKHJlcSAmJiByZXEuaGVhZGVycyAmJiByZXEuaGVhZGVycy5hdXRob3JpemF0aW9uKSB8fCAnJ1xuICAgIH1cblxuICAgIHN0YXRpYyBlcnJvcihjb2RlOiBudW1iZXIsIG1lc3NhZ2U6IHN0cmluZyk6IEVycm9yIHtcbiAgICAgICAgY29uc3QgZXJyb3IgPSBuZXcgRXJyb3IobWVzc2FnZSk7XG4gICAgICAgIChlcnJvcjogYW55KS5zb3VyY2UgPSAnZ3JhcGhxbCc7XG4gICAgICAgIChlcnJvcjogYW55KS5jb2RlID0gY29kZTtcbiAgICAgICAgcmV0dXJuIGVycm9yO1xuICAgIH1cblxuICAgIGF1dGhTZXJ2aWNlUmVxdWlyZWQoKSB7XG4gICAgICAgIGlmICghdGhpcy5jb25maWcuYXV0aG9yaXphdGlvbi5lbmRwb2ludCkge1xuICAgICAgICAgICAgdGhyb3cgUUF1dGguZXJyb3IoNTAwLCAnQXV0aCBzZXJ2aWNlIHVuYXZhaWxhYmxlJyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyByZXF1aXJlR3JhbnRlZEFjY2VzcyhhY2Nlc3NLZXk6IHN0cmluZyB8IHR5cGVvZiB1bmRlZmluZWQpOiBQcm9taXNlPEFjY2Vzc1JpZ2h0cz4ge1xuICAgICAgICBjb25zdCBhY2Nlc3MgPSBhd2FpdCB0aGlzLmdldEFjY2Vzc1JpZ2h0cyhhY2Nlc3NLZXkpO1xuICAgICAgICBpZiAoIWFjY2Vzcy5ncmFudGVkKSB7XG4gICAgICAgICAgICB0aHJvdyBRQXV0aC5lcnJvcig0MDEsICdVbmF1dGhvcml6ZWQnKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYWNjZXNzO1xuICAgIH1cblxuICAgIGFzeW5jIGdldEFjY2Vzc1JpZ2h0cyhhY2Nlc3NLZXk6IHN0cmluZyB8IHR5cGVvZiB1bmRlZmluZWQpOiBQcm9taXNlPEFjY2Vzc1JpZ2h0cz4ge1xuICAgICAgICBpZiAoIXRoaXMuY29uZmlnLmF1dGhvcml6YXRpb24uZW5kcG9pbnQpIHtcbiAgICAgICAgICAgIHJldHVybiBncmFudGVkQWNjZXNzO1xuICAgICAgICB9XG4gICAgICAgIGlmICgoYWNjZXNzS2V5IHx8ICcnKSA9PT0gJycpIHtcbiAgICAgICAgICAgIHJldHVybiBkZW5pZWRBY2Nlc3M7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcmlnaHRzID0gYXdhaXQgdGhpcy5pbnZva2VBdXRoKCdnZXRBY2Nlc3NSaWdodHMnLCB7XG4gICAgICAgICAgICBhY2Nlc3NLZXksXG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoIXJpZ2h0cy5yZXN0cmljdFRvQWNjb3VudHMpIHtcbiAgICAgICAgICAgIHJpZ2h0cy5yZXN0cmljdFRvQWNjb3VudHMgPSBbXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmlnaHRzO1xuICAgIH1cblxuICAgIGFzeW5jIGdldE1hbmFnZW1lbnRBY2Nlc3NLZXkoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICAgICAgdGhpcy5hdXRoU2VydmljZVJlcXVpcmVkKCk7XG4gICAgICAgIHJldHVybiB0aGlzLmludm9rZUF1dGgoJ2dldE1hbmFnZW1lbnRBY2Nlc3NLZXknLCB7fSk7XG4gICAgfVxuXG4gICAgYXN5bmMgcmVnaXN0ZXJBY2Nlc3NLZXlzKFxuICAgICAgICBhY2NvdW50OiBzdHJpbmcsXG4gICAgICAgIGtleXM6IEFjY2Vzc0tleVtdLFxuICAgICAgICBzaWduZWRNYW5hZ2VtZW50QWNjZXNzS2V5OiBzdHJpbmdcbiAgICApOiBQcm9taXNlPG51bWJlcj4ge1xuICAgICAgICB0aGlzLmF1dGhTZXJ2aWNlUmVxdWlyZWQoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuaW52b2tlQXV0aCgncmVnaXN0ZXJBY2Nlc3NLZXlzJywge1xuICAgICAgICAgICAgYWNjb3VudCxcbiAgICAgICAgICAgIGtleXMsXG4gICAgICAgICAgICBzaWduZWRNYW5hZ2VtZW50QWNjZXNzS2V5XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGFzeW5jIHJldm9rZUFjY2Vzc0tleXMoXG4gICAgICAgIGFjY291bnQ6IHN0cmluZyxcbiAgICAgICAga2V5czogc3RyaW5nW10sXG4gICAgICAgIHNpZ25lZE1hbmFnZW1lbnRBY2Nlc3NLZXk6IHN0cmluZ1xuICAgICk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgICAgIHRoaXMuYXV0aFNlcnZpY2VSZXF1aXJlZCgpO1xuICAgICAgICByZXR1cm4gdGhpcy5pbnZva2VBdXRoKCdyZXZva2VBY2Nlc3NLZXlzJywge1xuICAgICAgICAgICAgYWNjb3VudCxcbiAgICAgICAgICAgIGtleXMsXG4gICAgICAgICAgICBzaWduZWRNYW5hZ2VtZW50QWNjZXNzS2V5XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGFzeW5jIGludm9rZUF1dGgobWV0aG9kOiBzdHJpbmcsIHBhcmFtczogYW55KTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2godGhpcy5jb25maWcuYXV0aG9yaXphdGlvbi5lbmRwb2ludCwge1xuICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgICAganNvbnJwYzogJzIuMCcsXG4gICAgICAgICAgICAgICAgaWQ6ICcxJyxcbiAgICAgICAgICAgICAgICBtZXRob2QsXG4gICAgICAgICAgICAgICAgcGFyYW1zXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKHJlcy5zdGF0dXMgIT09IDIwMCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBBdXRoIHNlcnZpY2UgZmFpbGVkOiAke2F3YWl0IHJlcy50ZXh0KCl9YCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICAgIGlmIChyZXNwb25zZS5lcnJvcikge1xuICAgICAgICAgICAgY29uc3QgZXJyb3IgPSBuZXcgRXJyb3IocmVzcG9uc2UuZXJyb3IubWVzc2FnZSB8fCByZXNwb25zZS5lcnJvci5kZXNjcmlwdGlvbik7XG4gICAgICAgICAgICAoZXJyb3I6IGFueSkuc291cmNlID0gcmVzcG9uc2UuZXJyb3Iuc291cmNlIHx8ICdncmFwaHFsJztcbiAgICAgICAgICAgIChlcnJvcjogYW55KS5jb2RlID0gcmVzcG9uc2UuZXJyb3IuY29kZSB8fCA1MDA7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXNwb25zZS5yZXN1bHQ7XG4gICAgfVxuXG59XG4iXX0=