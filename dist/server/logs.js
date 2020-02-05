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
function str(arg) {
  var s = typeof arg === 'string' ? arg : JSON.stringify(arg);
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