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
} = (0, _qlJsGenerator.default)(_dbSchema.default);
fs.writeFileSync(`./type-defs-generated.graphql`, ql);
fs.writeFileSync(`./server/resolvers-generated.js`, js);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NlcnZlci9zY2hlbWEvZGItc2NoZW1hLWdlbmVyYXRvci5qcyJdLCJuYW1lcyI6WyJmcyIsInJlcXVpcmUiLCJxbCIsImpzIiwic2NoZW1hRGVmIiwid3JpdGVGaWxlU3luYyJdLCJtYXBwaW5ncyI6Ijs7QUFnQkE7O0FBQ0E7Ozs7QUFqQkE7Ozs7Ozs7Ozs7Ozs7OztBQWtCQSxNQUFNQSxFQUFFLEdBQUdDLE9BQU8sQ0FBQyxJQUFELENBQWxCOztBQUVBLE1BQU07QUFBRUMsRUFBQUEsRUFBRjtBQUFNQyxFQUFBQTtBQUFOLElBQWEsNEJBQUlDLGlCQUFKLENBQW5CO0FBQ0FKLEVBQUUsQ0FBQ0ssYUFBSCxDQUFrQiwrQkFBbEIsRUFBa0RILEVBQWxEO0FBQ0FGLEVBQUUsQ0FBQ0ssYUFBSCxDQUFrQixpQ0FBbEIsRUFBb0RGLEVBQXBEIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE4LTIwMjAgVE9OIERFViBTT0xVVElPTlMgTFRELlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBTT0ZUV0FSRSBFVkFMVUFUSU9OIExpY2Vuc2UgKHRoZSBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZVxuICogdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlXG4gKiBMaWNlbnNlIGF0OlxuICpcbiAqIGh0dHA6Ly93d3cudG9uLmRldi9saWNlbnNlc1xuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgVE9OIERFViBzb2Z0d2FyZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgc2NoZW1hRGVmIGZyb20gJy4vZGItc2NoZW1hLmpzJztcbmltcG9ydCBnZW4gZnJvbSAnLi9xbC1qcy1nZW5lcmF0b3IuanMnO1xuY29uc3QgZnMgPSByZXF1aXJlKCdmcycpO1xuXG5jb25zdCB7IHFsLCBqcyB9ID0gZ2VuKHNjaGVtYURlZik7XG5mcy53cml0ZUZpbGVTeW5jKGAuL3R5cGUtZGVmcy1nZW5lcmF0ZWQuZ3JhcGhxbGAsIHFsKTtcbmZzLndyaXRlRmlsZVN5bmMoYC4vc2VydmVyL3Jlc29sdmVycy1nZW5lcmF0ZWQuanNgLCBqcyk7XG4iXX0=