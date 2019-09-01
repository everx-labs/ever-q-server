"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _server = _interopRequireDefault(require("./server"));

var _config = _interopRequireDefault(require("./config"));

var _logs = _interopRequireDefault(require("./logs"));

var server = new _server["default"]({
  config: _config["default"],
  logs: new _logs["default"]()
});
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9pbmRleC5qcyJdLCJuYW1lcyI6WyJzZXJ2ZXIiLCJUT05RU2VydmVyIiwiY29uZmlnIiwibG9ncyIsIlFMb2dzIiwic3RhcnQiLCJsb2ciLCJlcnJvciIsInByb2Nlc3MiLCJleGl0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUVBLElBQU1BLE1BQU0sR0FBRyxJQUFJQyxrQkFBSixDQUFlO0FBQzdCQyxFQUFBQSxNQUFNLEVBQU5BLGtCQUQ2QjtBQUU3QkMsRUFBQUEsSUFBSSxFQUFFLElBQUlDLGdCQUFKO0FBRnVCLENBQWYsQ0FBZjtBQUtBO0FBQUE7QUFBQSw2QkFBQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLGlCQUVhSixNQUFNLENBQUNLLEtBQVAsRUFGYjs7QUFBQTtBQUFBO0FBQUE7O0FBQUE7QUFBQTtBQUFBO0FBSU9MLFVBQUFBLE1BQU0sQ0FBQ00sR0FBUCxDQUFXQyxLQUFYLENBQWlCLGVBQWpCO0FBQ0FDLFVBQUFBLE9BQU8sQ0FBQ0MsSUFBUixDQUFhLENBQWI7O0FBTFA7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsQ0FBRCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBUT05RU2VydmVyIGZyb20gJy4vc2VydmVyJztcbmltcG9ydCBjb25maWcgZnJvbSAnLi9jb25maWcnO1xuaW1wb3J0IFFMb2dzIGZyb20gJy4vbG9ncyc7XG5cbmNvbnN0IHNlcnZlciA9IG5ldyBUT05RU2VydmVyKHtcblx0Y29uZmlnLFxuXHRsb2dzOiBuZXcgUUxvZ3MoKSxcbn0pO1xuXG4oYXN5bmMgKCkgPT4ge1xuICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IHNlcnZlci5zdGFydCgpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIHNlcnZlci5sb2cuZXJyb3IoJ1N0YXJ0IGZhaWxlZDonLCBlcnJvcik7XG4gICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICB9XG59KSgpO1xuXG5cbiJdfQ==