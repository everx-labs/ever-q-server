"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

/*
 * Copyright 2018-2020 TON DEV SOLUTIONS LTD.
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
function toJSON(value) {
  try {
    return JSON.stringify(value);
  } catch (error) {
    return JSON.stringify("".concat(value));
  }
}

function str(arg) {
  var s = typeof arg === 'string' ? arg : toJSON(arg);
  return s.split('\n').join('\\n').split('\t').join('\\t');
}

function format(name, args) {
  return "".concat(Date.now(), "\t").concat(name, "\t").concat(args.map(str).join('\t'));
}

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
          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }

          console.error(format(name, args));
        },
        debug: function debug() {
          for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
            args[_key2] = arguments[_key2];
          }

          console.debug(format(name, args));
        }
      };
    }
  }]);
  return QLogs;
}();

exports["default"] = QLogs;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9sb2dzLmpzIl0sIm5hbWVzIjpbInRvSlNPTiIsInZhbHVlIiwiSlNPTiIsInN0cmluZ2lmeSIsImVycm9yIiwic3RyIiwiYXJnIiwicyIsInNwbGl0Iiwiam9pbiIsImZvcm1hdCIsIm5hbWUiLCJhcmdzIiwiRGF0ZSIsIm5vdyIsIm1hcCIsIlFMb2dzIiwiY29uc29sZSIsImRlYnVnIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0FBQUE7Ozs7Ozs7Ozs7Ozs7OztBQXVCQSxTQUFTQSxNQUFULENBQWdCQyxLQUFoQixFQUFvQztBQUNoQyxNQUFJO0FBQ0EsV0FBT0MsSUFBSSxDQUFDQyxTQUFMLENBQWVGLEtBQWYsQ0FBUDtBQUNILEdBRkQsQ0FFRSxPQUFPRyxLQUFQLEVBQWM7QUFDWixXQUFPRixJQUFJLENBQUNDLFNBQUwsV0FBa0JGLEtBQWxCLEVBQVA7QUFDSDtBQUNKOztBQUVELFNBQVNJLEdBQVQsQ0FBYUMsR0FBYixFQUErQjtBQUMzQixNQUFNQyxDQUFDLEdBQUcsT0FBT0QsR0FBUCxLQUFlLFFBQWYsR0FBMEJBLEdBQTFCLEdBQWdDTixNQUFNLENBQUNNLEdBQUQsQ0FBaEQ7QUFDQSxTQUFPQyxDQUFDLENBQUNDLEtBQUYsQ0FBUSxJQUFSLEVBQWNDLElBQWQsQ0FBbUIsS0FBbkIsRUFBMEJELEtBQTFCLENBQWdDLElBQWhDLEVBQXNDQyxJQUF0QyxDQUEyQyxLQUEzQyxDQUFQO0FBQ0g7O0FBRUQsU0FBU0MsTUFBVCxDQUFnQkMsSUFBaEIsRUFBOEJDLElBQTlCLEVBQThDO0FBQzFDLG1CQUFVQyxJQUFJLENBQUNDLEdBQUwsRUFBVixlQUF5QkgsSUFBekIsZUFBa0NDLElBQUksQ0FBQ0csR0FBTCxDQUFTVixHQUFULEVBQWNJLElBQWQsQ0FBbUIsSUFBbkIsQ0FBbEM7QUFDSDs7SUFFb0JPLEs7Ozs7Ozs7OzsyQkFDYkwsSSxFQUFvQjtBQUMxQixhQUFPO0FBQ05QLFFBQUFBLEtBRE0sbUJBQ1M7QUFBQSw0Q0FBTlEsSUFBTTtBQUFOQSxZQUFBQSxJQUFNO0FBQUE7O0FBQ2RLLFVBQUFBLE9BQU8sQ0FBQ2IsS0FBUixDQUFjTSxNQUFNLENBQUNDLElBQUQsRUFBT0MsSUFBUCxDQUFwQjtBQUNBLFNBSEs7QUFJTk0sUUFBQUEsS0FKTSxtQkFJUztBQUFBLDZDQUFOTixJQUFNO0FBQU5BLFlBQUFBLElBQU07QUFBQTs7QUFDZEssVUFBQUEsT0FBTyxDQUFDQyxLQUFSLENBQWNSLE1BQU0sQ0FBQ0MsSUFBRCxFQUFPQyxJQUFQLENBQXBCO0FBQ0E7QUFOSyxPQUFQO0FBUUEiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IDIwMTgtMjAyMCBUT04gREVWIFNPTFVUSU9OUyBMVEQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIFNPRlRXQVJFIEVWQUxVQVRJT04gTGljZW5zZSAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlXG4gKiB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGVcbiAqIExpY2Vuc2UgYXQ6XG4gKlxuICogaHR0cDovL3d3dy50b24uZGV2L2xpY2Vuc2VzXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBUT04gREVWIHNvZnR3YXJlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8vIEBmbG93XG5cbmV4cG9ydCB0eXBlIFFMb2cgPSB7XG4gICAgZXJyb3I6ICguLi5hcmdzOiBhbnkpID0+IHZvaWQsXG4gICAgZGVidWc6ICguLi5hcmdzOiBhbnkpID0+IHZvaWQsXG59XG5cbmZ1bmN0aW9uIHRvSlNPTih2YWx1ZTogYW55KTogc3RyaW5nIHtcbiAgICB0cnkge1xuICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkodmFsdWUpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShgJHt2YWx1ZX1gKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHN0cihhcmc6IGFueSk6IHN0cmluZyB7XG4gICAgY29uc3QgcyA9IHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnID8gYXJnIDogdG9KU09OKGFyZyk7XG4gICAgcmV0dXJuIHMuc3BsaXQoJ1xcbicpLmpvaW4oJ1xcXFxuJykuc3BsaXQoJ1xcdCcpLmpvaW4oJ1xcXFx0Jyk7XG59XG5cbmZ1bmN0aW9uIGZvcm1hdChuYW1lOiBzdHJpbmcsIGFyZ3M6IHN0cmluZ1tdKSB7XG4gICAgcmV0dXJuIGAke0RhdGUubm93KCl9XFx0JHtuYW1lfVxcdCR7YXJncy5tYXAoc3RyKS5qb2luKCdcXHQnKX1gO1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBRTG9ncyB7XG5cdGNyZWF0ZShuYW1lOiBzdHJpbmcpOiBRTG9nIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0ZXJyb3IoLi4uYXJncykge1xuXHRcdFx0XHRjb25zb2xlLmVycm9yKGZvcm1hdChuYW1lLCBhcmdzKSk7XG5cdFx0XHR9LFxuXHRcdFx0ZGVidWcoLi4uYXJncykge1xuXHRcdFx0XHRjb25zb2xlLmRlYnVnKGZvcm1hdChuYW1lLCBhcmdzKSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG59XG4iXX0=