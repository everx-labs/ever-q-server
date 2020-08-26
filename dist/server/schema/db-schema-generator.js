"use strict";

var _dbSchema = _interopRequireDefault(require("./db-schema.js"));

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

fs.writeFileSync(`./type-defs-generated.graphql`, ql);
fs.writeFileSync(`./server/resolvers-generated.js`, js);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NlcnZlci9zY2hlbWEvZGItc2NoZW1hLWdlbmVyYXRvci5qcyJdLCJuYW1lcyI6WyJmcyIsInJlcXVpcmUiLCJxbCIsImpzIiwic2NoZW1hRGVmIiwid3JpdGVGaWxlU3luYyJdLCJtYXBwaW5ncyI6Ijs7QUFnQkE7O0FBQ0E7Ozs7QUFqQkE7Ozs7Ozs7Ozs7Ozs7OztBQWtCQSxNQUFNQSxFQUFFLEdBQUdDLE9BQU8sQ0FBQyxJQUFELENBQWxCOztBQUVBLE1BQU07QUFBRUMsRUFBQUEsRUFBRjtBQUFNQyxFQUFBQTtBQUFOLElBQWEsNEJBQUlDLGlCQUFKLENBQW5CLEMsQ0FFQTs7QUFDQUosRUFBRSxDQUFDSyxhQUFILENBQWtCLCtCQUFsQixFQUFrREgsRUFBbEQ7QUFDQUYsRUFBRSxDQUFDSyxhQUFILENBQWtCLGlDQUFsQixFQUFvREYsRUFBcEQiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxyXG4gKiBDb3B5cmlnaHQgMjAxOC0yMDIwIFRPTiBERVYgU09MVVRJT05TIExURC5cclxuICpcclxuICogTGljZW5zZWQgdW5kZXIgdGhlIFNPRlRXQVJFIEVWQUxVQVRJT04gTGljZW5zZSAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlXHJcbiAqIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZVxyXG4gKiBMaWNlbnNlIGF0OlxyXG4gKlxyXG4gKiBodHRwOi8vd3d3LnRvbi5kZXYvbGljZW5zZXNcclxuICpcclxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxyXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXHJcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxyXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBUT04gREVWIHNvZnR3YXJlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcclxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXHJcbiAqL1xyXG5cclxuaW1wb3J0IHNjaGVtYURlZiBmcm9tICcuL2RiLXNjaGVtYS5qcyc7XHJcbmltcG9ydCBnZW4gZnJvbSAnLi9xbC1qcy1nZW5lcmF0b3IuanMnO1xyXG5jb25zdCBmcyA9IHJlcXVpcmUoJ2ZzJyk7XHJcblxyXG5jb25zdCB7IHFsLCBqcyB9ID0gZ2VuKHNjaGVtYURlZik7XHJcblxyXG4vLyBQbGVhc2UgZW5zdXJlIHRoYXQgbmV3IGZpbGVzIGFyZSBhZGRlZCB0byBwYWNrYWdlLmpzb24gXCJwcmUtY29tbWl0XCIgY29tbWFuZCBhcyB3ZWxsXHJcbmZzLndyaXRlRmlsZVN5bmMoYC4vdHlwZS1kZWZzLWdlbmVyYXRlZC5ncmFwaHFsYCwgcWwpO1xyXG5mcy53cml0ZUZpbGVTeW5jKGAuL3NlcnZlci9yZXNvbHZlcnMtZ2VuZXJhdGVkLmpzYCwganMpO1xyXG4iXX0=