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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9pbmRleC5qcyJdLCJuYW1lcyI6WyJzZXJ2ZXIiLCJUT05RU2VydmVyIiwiY29uZmlnIiwibG9ncyIsIlFMb2dzIiwibWFpbiIsInN0YXJ0IiwibG9nIiwiZXJyb3IiLCJwcm9jZXNzIiwiZXhpdCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUVBLElBQU1BLE1BQU0sR0FBRyxJQUFJQyxrQkFBSixDQUFlO0FBQzdCQyxFQUFBQSxNQUFNLEVBQU5BLGtCQUQ2QjtBQUU3QkMsRUFBQUEsSUFBSSxFQUFFLElBQUlDLGdCQUFKO0FBRnVCLENBQWYsQ0FBZjs7QUFLTyxTQUFTQyxJQUFULEdBQWdCO0FBQ25CO0FBQUE7QUFBQSwrQkFBQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLG1CQUVhTCxNQUFNLENBQUNNLEtBQVAsRUFGYjs7QUFBQTtBQUFBO0FBQUE7O0FBQUE7QUFBQTtBQUFBO0FBSU9OLFlBQUFBLE1BQU0sQ0FBQ08sR0FBUCxDQUFXQyxLQUFYLENBQWlCLGVBQWpCO0FBQ0FDLFlBQUFBLE9BQU8sQ0FBQ0MsSUFBUixDQUFhLENBQWI7O0FBTFA7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsR0FBRDtBQVFIIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFRPTlFTZXJ2ZXIgZnJvbSAnLi9zZXJ2ZXInO1xuaW1wb3J0IGNvbmZpZyBmcm9tICcuL2NvbmZpZyc7XG5pbXBvcnQgUUxvZ3MgZnJvbSAnLi9sb2dzJztcblxuY29uc3Qgc2VydmVyID0gbmV3IFRPTlFTZXJ2ZXIoe1xuXHRjb25maWcsXG5cdGxvZ3M6IG5ldyBRTG9ncygpLFxufSk7XG5cbmV4cG9ydCBmdW5jdGlvbiBtYWluKCkge1xuICAgIChhc3luYyAoKSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCBzZXJ2ZXIuc3RhcnQoKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIHNlcnZlci5sb2cuZXJyb3IoJ1N0YXJ0IGZhaWxlZDonLCBlcnJvcik7XG4gICAgICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgICAgIH1cbiAgICB9KSgpO1xufVxuIl19