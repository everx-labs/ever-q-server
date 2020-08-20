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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9tYWludGFuYW5jZS9nZW4tZ3JhcGhxbC9kYi1zY2hlbWEtZ2VuZXJhdG9yLmpzIl0sIm5hbWVzIjpbImZzIiwicmVxdWlyZSIsInFsIiwianMiLCJzY2hlbWFEZWYiLCJ3cml0ZUZpbGVTeW5jIl0sIm1hcHBpbmdzIjoiOztBQWdCQTs7QUFDQTs7OztBQWpCQTs7Ozs7Ozs7Ozs7Ozs7O0FBa0JBLE1BQU1BLEVBQUUsR0FBR0MsT0FBTyxDQUFDLElBQUQsQ0FBbEI7O0FBRUEsTUFBTTtBQUFFQyxFQUFBQSxFQUFGO0FBQU1DLEVBQUFBO0FBQU4sSUFBYSw0QkFBSUMsaUJBQUosQ0FBbkIsQyxDQUVBOztBQUNBSixFQUFFLENBQUNLLGFBQUgsQ0FBa0IsbUNBQWxCLEVBQXNESCxFQUF0RDtBQUNBRixFQUFFLENBQUNLLGFBQUgsQ0FBa0IsNkNBQWxCLEVBQWdFRixFQUFoRSIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgMjAxOC0yMDIwIFRPTiBERVYgU09MVVRJT05TIExURC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgU09GVFdBUkUgRVZBTFVBVElPTiBMaWNlbnNlICh0aGUgXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2VcbiAqIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZVxuICogTGljZW5zZSBhdDpcbiAqXG4gKiBodHRwOi8vd3d3LnRvbi5kZXYvbGljZW5zZXNcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIFRPTiBERVYgc29mdHdhcmUgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IHNjaGVtYURlZiBmcm9tICcuLi8uLi9zZXJ2ZXIvc2NoZW1hL2RiLXNjaGVtYS5qcyc7XG5pbXBvcnQgZ2VuIGZyb20gJy4vcWwtanMtZ2VuZXJhdG9yLmpzJztcbmNvbnN0IGZzID0gcmVxdWlyZSgnZnMnKTtcblxuY29uc3QgeyBxbCwganMgfSA9IGdlbihzY2hlbWFEZWYpO1xuXG4vLyBQbGVhc2UgZW5zdXJlIHRoYXQgbmV3IGZpbGVzIGFyZSBhZGRlZCB0byBwYWNrYWdlLmpzb24gXCJwcmUtY29tbWl0XCIgY29tbWFuZCBhcyB3ZWxsXG5mcy53cml0ZUZpbGVTeW5jKGAuL3Jlcy90eXBlLWRlZnMtZ2VuZXJhdGVkLmdyYXBocWxgLCBxbCk7XG5mcy53cml0ZUZpbGVTeW5jKGAuL3NyYy9zZXJ2ZXIvZ3JhcGhxbC9yZXNvbHZlcnMtZ2VuZXJhdGVkLmpzYCwganMpO1xuIl19