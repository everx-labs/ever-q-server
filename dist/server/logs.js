"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var QLogs =
/*#__PURE__*/
function () {
  function QLogs() {
    (0, _classCallCheck2["default"])(this, QLogs);
  }

  (0, _createClass2["default"])(QLogs, [{
    key: "create",
    value: function create(name) {
      return {
        error: function error() {
          var _console;

          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }

          (_console = console).error.apply(_console, ["[".concat(name, "]")].concat(args));
        },
        debug: function debug() {
          var _console2;

          for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
            args[_key2] = arguments[_key2];
          }

          (_console2 = console).debug.apply(_console2, ["[".concat(name, "]")].concat(args));
        }
      };
    }
  }]);
  return QLogs;
}();

exports["default"] = QLogs;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9sb2dzLmpzIl0sIm5hbWVzIjpbIlFMb2dzIiwibmFtZSIsImVycm9yIiwiYXJncyIsImNvbnNvbGUiLCJkZWJ1ZyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztJQU9xQkEsSzs7Ozs7Ozs7OzJCQUNiQyxJLEVBQW9CO0FBQzFCLGFBQU87QUFDTkMsUUFBQUEsS0FETSxtQkFDUztBQUFBOztBQUFBLDRDQUFOQyxJQUFNO0FBQU5BLFlBQUFBLElBQU07QUFBQTs7QUFDZCxzQkFBQUMsT0FBTyxFQUFDRixLQUFSLDZCQUFrQkQsSUFBbEIsZUFBOEJFLElBQTlCO0FBQ0EsU0FISztBQUlORSxRQUFBQSxLQUpNLG1CQUlTO0FBQUE7O0FBQUEsNkNBQU5GLElBQU07QUFBTkEsWUFBQUEsSUFBTTtBQUFBOztBQUNkLHVCQUFBQyxPQUFPLEVBQUNDLEtBQVIsOEJBQWtCSixJQUFsQixlQUE4QkUsSUFBOUI7QUFDQTtBQU5LLE9BQVA7QUFRQSIsInNvdXJjZXNDb250ZW50IjpbIi8vIEBmbG93XG5cbmV4cG9ydCB0eXBlIFFMb2cgPSB7XG4gICAgZXJyb3I6ICguLi5hcmdzOiBhbnkpID0+IHZvaWQsXG4gICAgZGVidWc6ICguLi5hcmdzOiBhbnkpID0+IHZvaWQsXG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFFMb2dzIHtcblx0Y3JlYXRlKG5hbWU6IHN0cmluZyk6IFFMb2cge1xuXHRcdHJldHVybiB7XG5cdFx0XHRlcnJvciguLi5hcmdzKSB7XG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IoYFske25hbWV9XWAsIC4uLmFyZ3MpO1xuXHRcdFx0fSxcblx0XHRcdGRlYnVnKC4uLmFyZ3MpIHtcblx0XHRcdFx0Y29uc29sZS5kZWJ1ZyhgWyR7bmFtZX1dYCwgLi4uYXJncyk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG59XG4iXX0=