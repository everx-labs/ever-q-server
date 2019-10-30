"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.main = main;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _server = _interopRequireDefault(require("./server"));

var _config = _interopRequireDefault(require("./config"));

var _logs = _interopRequireDefault(require("./logs"));

/*
 * Copyright 2018-2019 TON DEV SOLUTIONS LTD.
 *
 * Licensed under the SOFTWARE EVALUATION License (the "License"); you may not use
 * this file except in compliance with the License.  You may obtain a copy of the
 * License at:
 *
 * http://www.ton.dev/licenses
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific TON DEV software governing permissions and
 * limitations under the License.
 */
var server = new _server["default"]({
  config: _config["default"],
  logs: new _logs["default"]()
});

function main() {
  (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee() {
    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;
            _context.next = 3;
            return server.start();

          case 3:
            _context.next = 9;
            break;

          case 5:
            _context.prev = 5;
            _context.t0 = _context["catch"](0);
            server.log.error('Start failed:', _context.t0);
            process.exit(1);

          case 9:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[0, 5]]);
  }))();
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9pbmRleC5qcyJdLCJuYW1lcyI6WyJzZXJ2ZXIiLCJUT05RU2VydmVyIiwiY29uZmlnIiwibG9ncyIsIlFMb2dzIiwibWFpbiIsInN0YXJ0IiwibG9nIiwiZXJyb3IiLCJwcm9jZXNzIiwiZXhpdCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQWdCQTs7QUFDQTs7QUFDQTs7QUFsQkE7Ozs7Ozs7Ozs7Ozs7OztBQW9CQSxJQUFNQSxNQUFNLEdBQUcsSUFBSUMsa0JBQUosQ0FBZTtBQUM3QkMsRUFBQUEsTUFBTSxFQUFOQSxrQkFENkI7QUFFN0JDLEVBQUFBLElBQUksRUFBRSxJQUFJQyxnQkFBSjtBQUZ1QixDQUFmLENBQWY7O0FBS08sU0FBU0MsSUFBVCxHQUFnQjtBQUNuQjtBQUFBO0FBQUEsK0JBQUM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxtQkFFYUwsTUFBTSxDQUFDTSxLQUFQLEVBRmI7O0FBQUE7QUFBQTtBQUFBOztBQUFBO0FBQUE7QUFBQTtBQUlPTixZQUFBQSxNQUFNLENBQUNPLEdBQVAsQ0FBV0MsS0FBWCxDQUFpQixlQUFqQjtBQUNBQyxZQUFBQSxPQUFPLENBQUNDLElBQVIsQ0FBYSxDQUFiOztBQUxQO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEdBQUQ7QUFRSCIsInNvdXJjZXNDb250ZW50IjpbIi8qXHJcbiAqIENvcHlyaWdodCAyMDE4LTIwMTkgVE9OIERFViBTT0xVVElPTlMgTFRELlxyXG4gKlxyXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgU09GVFdBUkUgRVZBTFVBVElPTiBMaWNlbnNlICh0aGUgXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2VcclxuICogdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlXHJcbiAqIExpY2Vuc2UgYXQ6XHJcbiAqXHJcbiAqIGh0dHA6Ly93d3cudG9uLmRldi9saWNlbnNlc1xyXG4gKlxyXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXHJcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcclxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXHJcbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIFRPTiBERVYgc29mdHdhcmUgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxyXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cclxuICovXHJcblxyXG5pbXBvcnQgVE9OUVNlcnZlciBmcm9tICcuL3NlcnZlcic7XHJcbmltcG9ydCBjb25maWcgZnJvbSAnLi9jb25maWcnO1xyXG5pbXBvcnQgUUxvZ3MgZnJvbSAnLi9sb2dzJztcclxuXHJcbmNvbnN0IHNlcnZlciA9IG5ldyBUT05RU2VydmVyKHtcclxuXHRjb25maWcsXHJcblx0bG9nczogbmV3IFFMb2dzKCksXHJcbn0pO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG1haW4oKSB7XHJcbiAgICAoYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGF3YWl0IHNlcnZlci5zdGFydCgpO1xyXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgIHNlcnZlci5sb2cuZXJyb3IoJ1N0YXJ0IGZhaWxlZDonLCBlcnJvcik7XHJcbiAgICAgICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcclxuICAgICAgICB9XHJcbiAgICB9KSgpO1xyXG59XHJcbiJdfQ==