"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _dbSchema = _interopRequireDefault(require("./db-schema.js"));

var _qlJsGenerator = _interopRequireDefault(require("./ql-js-generator.js"));

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

var _gen = (0, _qlJsGenerator["default"])(_dbSchema["default"]),
    ql = _gen.ql,
    js = _gen.js;

fs.writeFileSync("./type-defs-generated.graphql", ql);
fs.writeFileSync("./server/resolvers-generated.js", js);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NlcnZlci9zY2hlbWEvZGItc2NoZW1hLWdlbmVyYXRvci5qcyJdLCJuYW1lcyI6WyJmcyIsInJlcXVpcmUiLCJzY2hlbWFEZWYiLCJxbCIsImpzIiwid3JpdGVGaWxlU3luYyJdLCJtYXBwaW5ncyI6Ijs7OztBQWdCQTs7QUFDQTs7QUFqQkE7Ozs7Ozs7Ozs7Ozs7OztBQWtCQSxJQUFNQSxFQUFFLEdBQUdDLE9BQU8sQ0FBQyxJQUFELENBQWxCOztXQUVtQiwrQkFBSUMsb0JBQUosQztJQUFYQyxFLFFBQUFBLEU7SUFBSUMsRSxRQUFBQSxFOztBQUNaSixFQUFFLENBQUNLLGFBQUgsa0NBQWtERixFQUFsRDtBQUNBSCxFQUFFLENBQUNLLGFBQUgsb0NBQW9ERCxFQUFwRCIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgMjAxOC0yMDE5IFRPTiBERVYgU09MVVRJT05TIExURC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgU09GVFdBUkUgRVZBTFVBVElPTiBMaWNlbnNlICh0aGUgXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2VcbiAqIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZVxuICogTGljZW5zZSBhdDpcbiAqXG4gKiBodHRwOi8vd3d3LnRvbi5kZXYvbGljZW5zZXNcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIFRPTiBERVYgc29mdHdhcmUgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IHNjaGVtYURlZiBmcm9tICcuL2RiLXNjaGVtYS5qcyc7XG5pbXBvcnQgZ2VuIGZyb20gJy4vcWwtanMtZ2VuZXJhdG9yLmpzJztcbmNvbnN0IGZzID0gcmVxdWlyZSgnZnMnKTtcblxuY29uc3QgeyBxbCwganMgfSA9IGdlbihzY2hlbWFEZWYpO1xuZnMud3JpdGVGaWxlU3luYyhgLi90eXBlLWRlZnMtZ2VuZXJhdGVkLmdyYXBocWxgLCBxbCk7XG5mcy53cml0ZUZpbGVTeW5jKGAuL3NlcnZlci9yZXNvbHZlcnMtZ2VuZXJhdGVkLmpzYCwganMpO1xuIl19