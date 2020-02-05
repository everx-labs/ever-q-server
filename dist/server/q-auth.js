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
  granted: true,
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
      _regenerator["default"].mark(function _callee(token) {
        var access, error, _error;

        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return this.getBlockchainAccessRights(token);

              case 2:
                access = _context.sent;

                if (access.granted) {
                  _context.next = 7;
                  break;
                }

                error = new Error('You have not access to GraphQL services');
                error.code = 8000;
                throw error;

              case 7:
                if (!(access.restrictToAccounts.length > 0)) {
                  _context.next = 11;
                  break;
                }

                _error = new Error('Internal error: GraphQL services doesn\'t support account restrictions yet');
                _error.code = 8001;
                throw _error;

              case 11:
                return _context.abrupt("return", access);

              case 12:
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
      _regenerator["default"].mark(function _callee2(token) {
        var res, response;
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
                if (!((token || '') === '')) {
                  _context2.next = 4;
                  break;
                }

                return _context2.abrupt("return", deniedBlockchainAccess);

              case 4:
                _context2.next = 6;
                return (0, _nodeFetch["default"])(this.config.authorization.endpoint, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: '1',
                    method: 'getBlockchainAccessRights',
                    params: {
                      token: token || ''
                    }
                  })
                });

              case 6:
                res = _context2.sent;

                if (!(res.status !== 200)) {
                  _context2.next = 15;
                  break;
                }

                _context2.t0 = Error;
                _context2.t1 = "Auth service failed: ";
                _context2.next = 12;
                return res.text();

              case 12:
                _context2.t2 = _context2.sent;
                _context2.t3 = _context2.t1.concat.call(_context2.t1, _context2.t2);
                throw new _context2.t0(_context2.t3);

              case 15:
                _context2.next = 17;
                return res.json();

              case 17:
                response = _context2.sent;

                if (!response.error) {
                  _context2.next = 20;
                  break;
                }

                throw response.error;

              case 20:
                return _context2.abrupt("return", response.result);

              case 21:
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
  }], [{
    key: "extractToken",
    value: function extractToken(req) {
      return req && req.headers && req.headers.authorization || '';
    }
  }]);
  return QAuth;
}();

exports["default"] = QAuth;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9xLWF1dGguanMiXSwibmFtZXMiOlsiZ3JhbnRlZEJsb2NrY2hhaW5BY2Nlc3MiLCJPYmplY3QiLCJmcmVlemUiLCJncmFudGVkIiwicmVzdHJpY3RUb0FjY291bnRzIiwiZGVuaWVkQmxvY2tjaGFpbkFjY2VzcyIsIlFBdXRoIiwiY29uZmlnIiwidG9rZW4iLCJnZXRCbG9ja2NoYWluQWNjZXNzUmlnaHRzIiwiYWNjZXNzIiwiZXJyb3IiLCJFcnJvciIsImNvZGUiLCJsZW5ndGgiLCJhdXRob3JpemF0aW9uIiwiZW5kcG9pbnQiLCJtZXRob2QiLCJoZWFkZXJzIiwiYm9keSIsIkpTT04iLCJzdHJpbmdpZnkiLCJqc29ucnBjIiwiaWQiLCJwYXJhbXMiLCJyZXMiLCJzdGF0dXMiLCJ0ZXh0IiwianNvbiIsInJlc3BvbnNlIiwicmVzdWx0IiwicmVxIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBR0E7O0FBT0EsSUFBTUEsdUJBQStDLEdBQUdDLE1BQU0sQ0FBQ0MsTUFBUCxDQUFjO0FBQ2xFQyxFQUFBQSxPQUFPLEVBQUUsSUFEeUQ7QUFFbEVDLEVBQUFBLGtCQUFrQixFQUFFO0FBRjhDLENBQWQsQ0FBeEQ7QUFLQSxJQUFNQyxzQkFBOEMsR0FBR0osTUFBTSxDQUFDQyxNQUFQLENBQWM7QUFDakVDLEVBQUFBLE9BQU8sRUFBRSxJQUR3RDtBQUVqRUMsRUFBQUEsa0JBQWtCLEVBQUU7QUFGNkMsQ0FBZCxDQUF2RDs7SUFLcUJFLEs7OztBQUdqQixpQkFBWUMsTUFBWixFQUE2QjtBQUFBO0FBQUE7QUFDekIsU0FBS0EsTUFBTCxHQUFjQSxNQUFkO0FBQ0g7Ozs7Ozs7b0RBTTBCQyxLOzs7Ozs7Ozt1QkFDRixLQUFLQyx5QkFBTCxDQUErQkQsS0FBL0IsQzs7O0FBQWZFLGdCQUFBQSxNOztvQkFDREEsTUFBTSxDQUFDUCxPOzs7OztBQUNGUSxnQkFBQUEsSyxHQUFRLElBQUlDLEtBQUosQ0FBVSx5Q0FBVixDO0FBQ2JELGdCQUFBQSxLQUFELENBQWFFLElBQWIsR0FBb0IsSUFBcEI7c0JBQ01GLEs7OztzQkFFTkQsTUFBTSxDQUFDTixrQkFBUCxDQUEwQlUsTUFBMUIsR0FBbUMsQzs7Ozs7QUFDN0JILGdCQUFBQSxNLEdBQVEsSUFBSUMsS0FBSixDQUFVLDRFQUFWLEM7QUFDYkQsZ0JBQUFBLE1BQUQsQ0FBYUUsSUFBYixHQUFvQixJQUFwQjtzQkFDTUYsTTs7O2lEQUVIRCxNOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7cURBR3FCRixLOzs7Ozs7b0JBQ3ZCLEtBQUtELE1BQUwsQ0FBWVEsYUFBWixDQUEwQkMsUTs7Ozs7a0RBQ3BCaEIsdUI7OztzQkFFUCxDQUFDUSxLQUFLLElBQUksRUFBVixNQUFrQixFOzs7OztrREFDWEgsc0I7Ozs7dUJBRU8sMkJBQU0sS0FBS0UsTUFBTCxDQUFZUSxhQUFaLENBQTBCQyxRQUFoQyxFQUEwQztBQUN4REMsa0JBQUFBLE1BQU0sRUFBRSxNQURnRDtBQUV4REMsa0JBQUFBLE9BQU8sRUFBRTtBQUNMLG9DQUFnQjtBQURYLG1CQUYrQztBQUt4REMsa0JBQUFBLElBQUksRUFBRUMsSUFBSSxDQUFDQyxTQUFMLENBQWU7QUFDakJDLG9CQUFBQSxPQUFPLEVBQUUsS0FEUTtBQUVqQkMsb0JBQUFBLEVBQUUsRUFBRSxHQUZhO0FBR2pCTixvQkFBQUEsTUFBTSxFQUFFLDJCQUhTO0FBSWpCTyxvQkFBQUEsTUFBTSxFQUFFO0FBQ0poQixzQkFBQUEsS0FBSyxFQUFFQSxLQUFLLElBQUk7QUFEWjtBQUpTLG1CQUFmO0FBTGtELGlCQUExQyxDOzs7QUFBWmlCLGdCQUFBQSxHOztzQkFlRkEsR0FBRyxDQUFDQyxNQUFKLEtBQWUsRzs7Ozs7K0JBQ0xkLEs7Ozt1QkFBb0NhLEdBQUcsQ0FBQ0UsSUFBSixFOzs7Ozs7Ozs7dUJBRzNCRixHQUFHLENBQUNHLElBQUosRTs7O0FBQWpCQyxnQkFBQUEsUTs7cUJBQ0ZBLFFBQVEsQ0FBQ2xCLEs7Ozs7O3NCQUNIa0IsUUFBUSxDQUFDbEIsSzs7O2tEQUdaa0IsUUFBUSxDQUFDQyxNOzs7Ozs7Ozs7Ozs7Ozs7Ozs7aUNBbERBQyxHLEVBQWtCO0FBQ2xDLGFBQVFBLEdBQUcsSUFBSUEsR0FBRyxDQUFDYixPQUFYLElBQXNCYSxHQUFHLENBQUNiLE9BQUosQ0FBWUgsYUFBbkMsSUFBcUQsRUFBNUQ7QUFDSCIsInNvdXJjZXNDb250ZW50IjpbIi8vIEBmbG93XG5cbmltcG9ydCB0eXBlIHsgUUNvbmZpZyB9IGZyb20gXCIuL2NvbmZpZ1wiO1xuaW1wb3J0IGZldGNoIGZyb20gJ25vZGUtZmV0Y2gnO1xuXG5leHBvcnQgdHlwZSBCbG9ja2NoYWluQWNjZXNzUmlnaHRzID0ge1xuICAgIGdyYW50ZWQ6IGJvb2wsXG4gICAgcmVzdHJpY3RUb0FjY291bnRzOiBzdHJpbmdbXSxcbn1cblxuY29uc3QgZ3JhbnRlZEJsb2NrY2hhaW5BY2Nlc3M6IEJsb2NrY2hhaW5BY2Nlc3NSaWdodHMgPSBPYmplY3QuZnJlZXplKHtcbiAgICBncmFudGVkOiB0cnVlLFxuICAgIHJlc3RyaWN0VG9BY2NvdW50czogW10sXG59KTtcblxuY29uc3QgZGVuaWVkQmxvY2tjaGFpbkFjY2VzczogQmxvY2tjaGFpbkFjY2Vzc1JpZ2h0cyA9IE9iamVjdC5mcmVlemUoe1xuICAgIGdyYW50ZWQ6IHRydWUsXG4gICAgcmVzdHJpY3RUb0FjY291bnRzOiBbXSxcbn0pO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBRQXV0aCB7XG4gICAgY29uZmlnOiBRQ29uZmlnO1xuXG4gICAgY29uc3RydWN0b3IoY29uZmlnOiBRQ29uZmlnKSB7XG4gICAgICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgIH1cblxuICAgIHN0YXRpYyBleHRyYWN0VG9rZW4ocmVxOiBhbnkpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gKHJlcSAmJiByZXEuaGVhZGVycyAmJiByZXEuaGVhZGVycy5hdXRob3JpemF0aW9uKSB8fCAnJ1xuICAgIH1cblxuICAgIGFzeW5jIHJlcXVpcmVHcmFudGVkQWNjZXNzKHRva2VuOiBzdHJpbmcgfCB0eXBlb2YgdW5kZWZpbmVkKTogUHJvbWlzZTxCbG9ja2NoYWluQWNjZXNzUmlnaHRzPiB7XG4gICAgICAgIGNvbnN0IGFjY2VzcyA9IGF3YWl0IHRoaXMuZ2V0QmxvY2tjaGFpbkFjY2Vzc1JpZ2h0cyh0b2tlbik7XG4gICAgICAgIGlmICghYWNjZXNzLmdyYW50ZWQpIHtcbiAgICAgICAgICAgIGNvbnN0IGVycm9yID0gbmV3IEVycm9yKCdZb3UgaGF2ZSBub3QgYWNjZXNzIHRvIEdyYXBoUUwgc2VydmljZXMnKTtcbiAgICAgICAgICAgIChlcnJvcjogYW55KS5jb2RlID0gODAwMDtcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9XG4gICAgICAgIGlmIChhY2Nlc3MucmVzdHJpY3RUb0FjY291bnRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGNvbnN0IGVycm9yID0gbmV3IEVycm9yKCdJbnRlcm5hbCBlcnJvcjogR3JhcGhRTCBzZXJ2aWNlcyBkb2VzblxcJ3Qgc3VwcG9ydCBhY2NvdW50IHJlc3RyaWN0aW9ucyB5ZXQnKTtcbiAgICAgICAgICAgIChlcnJvcjogYW55KS5jb2RlID0gODAwMTtcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhY2Nlc3M7XG4gICAgfVxuXG4gICAgYXN5bmMgZ2V0QmxvY2tjaGFpbkFjY2Vzc1JpZ2h0cyh0b2tlbjogc3RyaW5nIHwgdHlwZW9mIHVuZGVmaW5lZCk6IFByb21pc2U8QmxvY2tjaGFpbkFjY2Vzc1JpZ2h0cz4ge1xuICAgICAgICBpZiAoIXRoaXMuY29uZmlnLmF1dGhvcml6YXRpb24uZW5kcG9pbnQpIHtcbiAgICAgICAgICAgIHJldHVybiBncmFudGVkQmxvY2tjaGFpbkFjY2VzcztcbiAgICAgICAgfVxuICAgICAgICBpZiAoKHRva2VuIHx8ICcnKSA9PT0gJycpIHtcbiAgICAgICAgICAgIHJldHVybiBkZW5pZWRCbG9ja2NoYWluQWNjZXNzO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKHRoaXMuY29uZmlnLmF1dGhvcml6YXRpb24uZW5kcG9pbnQsIHtcbiAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICAgIGpzb25ycGM6ICcyLjAnLFxuICAgICAgICAgICAgICAgIGlkOiAnMScsXG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnZ2V0QmxvY2tjaGFpbkFjY2Vzc1JpZ2h0cycsXG4gICAgICAgICAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgICAgICAgICAgIHRva2VuOiB0b2tlbiB8fCAnJyxcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKHJlcy5zdGF0dXMgIT09IDIwMCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBBdXRoIHNlcnZpY2UgZmFpbGVkOiAke2F3YWl0IHJlcy50ZXh0KCl9YCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICAgIGlmIChyZXNwb25zZS5lcnJvcikge1xuICAgICAgICAgICAgdGhyb3cgcmVzcG9uc2UuZXJyb3I7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzcG9uc2UucmVzdWx0O1xuICAgIH1cblxufVxuIl19