"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

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
function str(arg) {
  var s = typeof arg === 'string' ? arg : JSON.stringify(arg);
  return s.split('\n').join('\\n').split('\t').join('\\t');
}

function format(name, args) {
  return "".concat(name, "\t").concat(args.map(str).join('\t'));
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9sb2dzLmpzIl0sIm5hbWVzIjpbInN0ciIsImFyZyIsInMiLCJKU09OIiwic3RyaW5naWZ5Iiwic3BsaXQiLCJqb2luIiwiZm9ybWF0IiwibmFtZSIsImFyZ3MiLCJtYXAiLCJRTG9ncyIsImVycm9yIiwiY29uc29sZSIsImRlYnVnIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0FBQUE7Ozs7Ozs7Ozs7Ozs7OztBQXVCQSxTQUFTQSxHQUFULENBQWFDLEdBQWIsRUFBK0I7QUFDM0IsTUFBTUMsQ0FBQyxHQUFHLE9BQU9ELEdBQVAsS0FBZSxRQUFmLEdBQTBCQSxHQUExQixHQUFnQ0UsSUFBSSxDQUFDQyxTQUFMLENBQWVILEdBQWYsQ0FBMUM7QUFDQSxTQUFPQyxDQUFDLENBQUNHLEtBQUYsQ0FBUSxJQUFSLEVBQWNDLElBQWQsQ0FBbUIsS0FBbkIsRUFBMEJELEtBQTFCLENBQWdDLElBQWhDLEVBQXNDQyxJQUF0QyxDQUEyQyxLQUEzQyxDQUFQO0FBQ0g7O0FBRUQsU0FBU0MsTUFBVCxDQUFnQkMsSUFBaEIsRUFBOEJDLElBQTlCLEVBQThDO0FBQzFDLG1CQUFVRCxJQUFWLGVBQW1CQyxJQUFJLENBQUNDLEdBQUwsQ0FBU1YsR0FBVCxFQUFjTSxJQUFkLENBQW1CLElBQW5CLENBQW5CO0FBQ0g7O0lBRW9CSyxLOzs7Ozs7Ozs7MkJBQ2JILEksRUFBb0I7QUFDMUIsYUFBTztBQUNOSSxRQUFBQSxLQURNLG1CQUNTO0FBQUEsNENBQU5ILElBQU07QUFBTkEsWUFBQUEsSUFBTTtBQUFBOztBQUNkSSxVQUFBQSxPQUFPLENBQUNELEtBQVIsQ0FBY0wsTUFBTSxDQUFDQyxJQUFELEVBQU9DLElBQVAsQ0FBcEI7QUFDQSxTQUhLO0FBSU5LLFFBQUFBLEtBSk0sbUJBSVM7QUFBQSw2Q0FBTkwsSUFBTTtBQUFOQSxZQUFBQSxJQUFNO0FBQUE7O0FBQ2RJLFVBQUFBLE9BQU8sQ0FBQ0MsS0FBUixDQUFjUCxNQUFNLENBQUNDLElBQUQsRUFBT0MsSUFBUCxDQUFwQjtBQUNBO0FBTkssT0FBUDtBQVFBIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE4LTIwMTkgVE9OIERFViBTT0xVVElPTlMgTFRELlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBTT0ZUV0FSRSBFVkFMVUFUSU9OIExpY2Vuc2UgKHRoZSBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZVxuICogdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlXG4gKiBMaWNlbnNlIGF0OlxuICpcbiAqIGh0dHA6Ly93d3cudG9uLmRldi9saWNlbnNlc1xuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgVE9OIERFViBzb2Z0d2FyZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vLyBAZmxvd1xuXG5leHBvcnQgdHlwZSBRTG9nID0ge1xuICAgIGVycm9yOiAoLi4uYXJnczogYW55KSA9PiB2b2lkLFxuICAgIGRlYnVnOiAoLi4uYXJnczogYW55KSA9PiB2b2lkLFxufVxuXG5mdW5jdGlvbiBzdHIoYXJnOiBhbnkpOiBzdHJpbmcge1xuICAgIGNvbnN0IHMgPSB0eXBlb2YgYXJnID09PSAnc3RyaW5nJyA/IGFyZyA6IEpTT04uc3RyaW5naWZ5KGFyZyk7XG4gICAgcmV0dXJuIHMuc3BsaXQoJ1xcbicpLmpvaW4oJ1xcXFxuJykuc3BsaXQoJ1xcdCcpLmpvaW4oJ1xcXFx0Jyk7XG59XG5cbmZ1bmN0aW9uIGZvcm1hdChuYW1lOiBzdHJpbmcsIGFyZ3M6IHN0cmluZ1tdKSB7XG4gICAgcmV0dXJuIGAke25hbWV9XFx0JHthcmdzLm1hcChzdHIpLmpvaW4oJ1xcdCcpfWA7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFFMb2dzIHtcblx0Y3JlYXRlKG5hbWU6IHN0cmluZyk6IFFMb2cge1xuXHRcdHJldHVybiB7XG5cdFx0XHRlcnJvciguLi5hcmdzKSB7XG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IoZm9ybWF0KG5hbWUsIGFyZ3MpKTtcblx0XHRcdH0sXG5cdFx0XHRkZWJ1ZyguLi5hcmdzKSB7XG5cdFx0XHRcdGNvbnNvbGUuZGVidWcoZm9ybWF0KG5hbWUsIGFyZ3MpKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cbn1cbiJdfQ==