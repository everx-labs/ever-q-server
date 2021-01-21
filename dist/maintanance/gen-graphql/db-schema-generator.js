"use strict";

var _dbSchema = _interopRequireDefault(require("../../server/schema/db-schema.js"));

var _qlJsGenerator = _interopRequireDefault(require("./ql-js-generator.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
const fs = require('fs');

const {
  ql,
  js
} = (0, _qlJsGenerator.default)(_dbSchema.default); // Please ensure that new files are added to package.json "pre-commit" command as well

fs.writeFileSync(`./res/type-defs-generated.graphql`, ql);
fs.writeFileSync(`./src/server/graphql/resolvers-generated.js`, js);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9tYWludGFuYW5jZS9nZW4tZ3JhcGhxbC9kYi1zY2hlbWEtZ2VuZXJhdG9yLmpzIl0sIm5hbWVzIjpbImZzIiwicmVxdWlyZSIsInFsIiwianMiLCJzY2hlbWFEZWYiLCJ3cml0ZUZpbGVTeW5jIl0sIm1hcHBpbmdzIjoiOztBQWdCQTs7QUFDQTs7OztBQWpCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFJQSxNQUFNQSxFQUFFLEdBQUdDLE9BQU8sQ0FBQyxJQUFELENBQWxCOztBQUVBLE1BQU07QUFBRUMsRUFBQUEsRUFBRjtBQUFNQyxFQUFBQTtBQUFOLElBQWEsNEJBQUlDLGlCQUFKLENBQW5CLEMsQ0FFQTs7QUFDQUosRUFBRSxDQUFDSyxhQUFILENBQWtCLG1DQUFsQixFQUFzREgsRUFBdEQ7QUFDQUYsRUFBRSxDQUFDSyxhQUFILENBQWtCLDZDQUFsQixFQUFnRUYsRUFBaEUiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IDIwMTgtMjAyMCBUT04gREVWIFNPTFVUSU9OUyBMVEQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIFNPRlRXQVJFIEVWQUxVQVRJT04gTGljZW5zZSAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlXG4gKiB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGVcbiAqIExpY2Vuc2UgYXQ6XG4gKlxuICogaHR0cDovL3d3dy50b24uZGV2L2xpY2Vuc2VzXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBUT04gREVWIHNvZnR3YXJlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCBzY2hlbWFEZWYgZnJvbSAnLi4vLi4vc2VydmVyL3NjaGVtYS9kYi1zY2hlbWEuanMnO1xuaW1wb3J0IGdlbiBmcm9tICcuL3FsLWpzLWdlbmVyYXRvci5qcyc7XG5jb25zdCBmcyA9IHJlcXVpcmUoJ2ZzJyk7XG5cbmNvbnN0IHsgcWwsIGpzIH0gPSBnZW4oc2NoZW1hRGVmKTtcblxuLy8gUGxlYXNlIGVuc3VyZSB0aGF0IG5ldyBmaWxlcyBhcmUgYWRkZWQgdG8gcGFja2FnZS5qc29uIFwicHJlLWNvbW1pdFwiIGNvbW1hbmQgYXMgd2VsbFxuZnMud3JpdGVGaWxlU3luYyhgLi9yZXMvdHlwZS1kZWZzLWdlbmVyYXRlZC5ncmFwaHFsYCwgcWwpO1xuZnMud3JpdGVGaWxlU3luYyhgLi9zcmMvc2VydmVyL2dyYXBocWwvcmVzb2x2ZXJzLWdlbmVyYXRlZC5qc2AsIGpzKTtcbiJdfQ==