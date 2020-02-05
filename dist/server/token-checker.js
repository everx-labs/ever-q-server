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

var querystring = require('querystring');

var http = require('http');

var TokenChecker =
/*#__PURE__*/
function () {
  function TokenChecker(config) {
    (0, _classCallCheck2["default"])(this, TokenChecker);
    (0, _defineProperty2["default"])(this, "config", void 0);
    this.config = config;
  }

  (0, _createClass2["default"])(TokenChecker, [{
    key: "check_token",
    value: function () {
      var _check_token = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee(token, app_key) {
        var _this = this;

        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                return _context.abrupt("return", new Promise(function (resolve, reject) {
                  var post_data = querystring.stringify({
                    token: token,
                    app_key: app_key,
                    service_id: _this.config.authorization.this_server_id
                  });
                  var post_options = {
                    hostname: _this.config.authorization.server,
                    port: _this.config.authorization.port,
                    path: '/tokens/check_token',
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/x-www-form-urlencoded',
                      'Content-Length': Buffer.byteLength(post_data)
                    }
                  };
                  var post_req = http.request(post_options, function (res) {
                    res.setEncoding('utf8');
                    res.on('data', function (data) {
                      var dataObj = JSON.parse(data);
                      resolve(dataObj.result === 200);
                    });
                  });
                  post_req.on('error', function (err) {
                    resolve(false);
                  });
                  post_req.write(post_data);
                  post_req.end();
                }));

              case 1:
              case "end":
                return _context.stop();
            }
          }
        }, _callee);
      }));

      function check_token(_x, _x2) {
        return _check_token.apply(this, arguments);
      }

      return check_token;
    }()
  }]);
  return TokenChecker;
}();

exports["default"] = TokenChecker;