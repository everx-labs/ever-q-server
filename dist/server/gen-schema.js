"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _dbSchemaV = _interopRequireDefault(require("./db.schema.v1.js"));

var _dbSchemaV2 = _interopRequireDefault(require("./db.schema.v2.js"));

var _genQl = _interopRequireDefault(require("./gen-ql.js"));

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
var fs = require('fs');

function genSchema(def, suffix) {
  var _gen = (0, _genQl["default"])(def),
      ql = _gen.ql,
      js = _gen.js;

  fs.writeFileSync("./type-defs".concat(suffix, ".graphql"), ql);
  fs.writeFileSync("./server/q-resolvers".concat(suffix, ".js"), js);
}

genSchema(_dbSchemaV["default"], '.v1');
genSchema(_dbSchemaV2["default"], '.v2');
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9nZW4tc2NoZW1hLmpzIl0sIm5hbWVzIjpbImZzIiwicmVxdWlyZSIsImdlblNjaGVtYSIsImRlZiIsInN1ZmZpeCIsInFsIiwianMiLCJ3cml0ZUZpbGVTeW5jIiwic2NoZW1hRGVmVjEiLCJzY2hlbWFEZWZWMiJdLCJtYXBwaW5ncyI6Ijs7OztBQWdCQTs7QUFDQTs7QUFDQTs7QUFsQkE7Ozs7Ozs7Ozs7Ozs7OztBQW1CQSxJQUFNQSxFQUFFLEdBQUdDLE9BQU8sQ0FBQyxJQUFELENBQWxCOztBQUVBLFNBQVNDLFNBQVQsQ0FBbUJDLEdBQW5CLEVBQXdCQyxNQUF4QixFQUFnQztBQUFBLGFBQ1QsdUJBQUlELEdBQUosQ0FEUztBQUFBLE1BQ3BCRSxFQURvQixRQUNwQkEsRUFEb0I7QUFBQSxNQUNoQkMsRUFEZ0IsUUFDaEJBLEVBRGdCOztBQUk1Qk4sRUFBQUEsRUFBRSxDQUFDTyxhQUFILHNCQUErQkgsTUFBL0IsZUFBaURDLEVBQWpEO0FBQ0FMLEVBQUFBLEVBQUUsQ0FBQ08sYUFBSCwrQkFBd0NILE1BQXhDLFVBQXFERSxFQUFyRDtBQUNIOztBQUVESixTQUFTLENBQUNNLHFCQUFELEVBQWMsS0FBZCxDQUFUO0FBQ0FOLFNBQVMsQ0FBQ08sc0JBQUQsRUFBYyxLQUFkLENBQVQiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IDIwMTgtMjAxOSBUT04gREVWIFNPTFVUSU9OUyBMVEQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIFNPRlRXQVJFIEVWQUxVQVRJT04gTGljZW5zZSAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlXG4gKiB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGVcbiAqIExpY2Vuc2UgYXQ6XG4gKlxuICogaHR0cDovL3d3dy50b24uZGV2L2xpY2Vuc2VzXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBUT04gREVWIHNvZnR3YXJlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCBzY2hlbWFEZWZWMSBmcm9tICcuL2RiLnNjaGVtYS52MS5qcyc7XG5pbXBvcnQgc2NoZW1hRGVmVjIgZnJvbSAnLi9kYi5zY2hlbWEudjIuanMnO1xuaW1wb3J0IGdlbiBmcm9tICcuL2dlbi1xbC5qcyc7XG5jb25zdCBmcyA9IHJlcXVpcmUoJ2ZzJyk7XG5cbmZ1bmN0aW9uIGdlblNjaGVtYShkZWYsIHN1ZmZpeCkge1xuICAgIGNvbnN0IHsgcWwsIGpzIH0gPSBnZW4oZGVmKTtcblxuXG4gICAgZnMud3JpdGVGaWxlU3luYyhgLi90eXBlLWRlZnMke3N1ZmZpeH0uZ3JhcGhxbGAsIHFsKTtcbiAgICBmcy53cml0ZUZpbGVTeW5jKGAuL3NlcnZlci9xLXJlc29sdmVycyR7c3VmZml4fS5qc2AsIGpzKTtcbn1cblxuZ2VuU2NoZW1hKHNjaGVtYURlZlYxLCAnLnYxJyk7XG5nZW5TY2hlbWEoc2NoZW1hRGVmVjIsICcudjInKTtcbiJdfQ==