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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9sb2dzLmpzIl0sIm5hbWVzIjpbIlFMb2dzIiwibmFtZSIsImVycm9yIiwiYXJncyIsImNvbnNvbGUiLCJkZWJ1ZyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQUFBOzs7Ozs7Ozs7Ozs7Ozs7SUF1QnFCQSxLOzs7Ozs7Ozs7MkJBQ2JDLEksRUFBb0I7QUFDMUIsYUFBTztBQUNOQyxRQUFBQSxLQURNLG1CQUNTO0FBQUE7O0FBQUEsNENBQU5DLElBQU07QUFBTkEsWUFBQUEsSUFBTTtBQUFBOztBQUNkLHNCQUFBQyxPQUFPLEVBQUNGLEtBQVIsNkJBQWtCRCxJQUFsQixlQUE4QkUsSUFBOUI7QUFDQSxTQUhLO0FBSU5FLFFBQUFBLEtBSk0sbUJBSVM7QUFBQTs7QUFBQSw2Q0FBTkYsSUFBTTtBQUFOQSxZQUFBQSxJQUFNO0FBQUE7O0FBQ2QsdUJBQUFDLE9BQU8sRUFBQ0MsS0FBUiw4QkFBa0JKLElBQWxCLGVBQThCRSxJQUE5QjtBQUNBO0FBTkssT0FBUDtBQVFBIiwic291cmNlc0NvbnRlbnQiOlsiLypcclxuICogQ29weXJpZ2h0IDIwMTgtMjAxOSBUT04gREVWIFNPTFVUSU9OUyBMVEQuXHJcbiAqXHJcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBTT0ZUV0FSRSBFVkFMVUFUSU9OIExpY2Vuc2UgKHRoZSBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZVxyXG4gKiB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGVcclxuICogTGljZW5zZSBhdDpcclxuICpcclxuICogaHR0cDovL3d3dy50b24uZGV2L2xpY2Vuc2VzXHJcbiAqXHJcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcclxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxyXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cclxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgVE9OIERFViBzb2Z0d2FyZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXHJcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxyXG4gKi9cclxuXHJcbi8vIEBmbG93XHJcblxyXG5leHBvcnQgdHlwZSBRTG9nID0ge1xyXG4gICAgZXJyb3I6ICguLi5hcmdzOiBhbnkpID0+IHZvaWQsXHJcbiAgICBkZWJ1ZzogKC4uLmFyZ3M6IGFueSkgPT4gdm9pZCxcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUUxvZ3Mge1xyXG5cdGNyZWF0ZShuYW1lOiBzdHJpbmcpOiBRTG9nIHtcclxuXHRcdHJldHVybiB7XHJcblx0XHRcdGVycm9yKC4uLmFyZ3MpIHtcclxuXHRcdFx0XHRjb25zb2xlLmVycm9yKGBbJHtuYW1lfV1gLCAuLi5hcmdzKTtcclxuXHRcdFx0fSxcclxuXHRcdFx0ZGVidWcoLi4uYXJncykge1xyXG5cdFx0XHRcdGNvbnNvbGUuZGVidWcoYFske25hbWV9XWAsIC4uLmFyZ3MpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG59XHJcbiJdfQ==