"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _dbSchema = _interopRequireDefault(require("./db.schema.js"));

var _genQlJs = _interopRequireDefault(require("./gen-ql-js.js"));

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
var _gen = (0, _genQlJs["default"])(_dbSchema["default"]),
    ql = _gen.ql,
    js = _gen.js;

var fs = require('fs');

fs.writeFileSync('./type-defs.graphql', ql);
fs.writeFileSync('./server/arango-resolvers.js', js);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9nZW4tc2NoZW1hLmpzIl0sIm5hbWVzIjpbInNjaGVtYURlZiIsInFsIiwianMiLCJmcyIsInJlcXVpcmUiLCJ3cml0ZUZpbGVTeW5jIl0sIm1hcHBpbmdzIjoiOzs7O0FBZ0JBOztBQUNBOztBQWpCQTs7Ozs7Ozs7Ozs7Ozs7O1dBbUJtQix5QkFBSUEsb0JBQUosQztJQUFYQyxFLFFBQUFBLEU7SUFBSUMsRSxRQUFBQSxFOztBQUVaLElBQU1DLEVBQUUsR0FBR0MsT0FBTyxDQUFDLElBQUQsQ0FBbEI7O0FBRUFELEVBQUUsQ0FBQ0UsYUFBSCxDQUFpQixxQkFBakIsRUFBd0NKLEVBQXhDO0FBQ0FFLEVBQUUsQ0FBQ0UsYUFBSCxDQUFpQiw4QkFBakIsRUFBaURILEVBQWpEIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE4LTIwMTkgVE9OIERFViBTT0xVVElPTlMgTFRELlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBTT0ZUV0FSRSBFVkFMVUFUSU9OIExpY2Vuc2UgKHRoZSBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZVxuICogdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlXG4gKiBMaWNlbnNlIGF0OlxuICpcbiAqIGh0dHA6Ly93d3cudG9uLmRldi9saWNlbnNlc1xuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgVE9OIERFViBzb2Z0d2FyZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgc2NoZW1hRGVmIGZyb20gJy4vZGIuc2NoZW1hLmpzJztcbmltcG9ydCBnZW4gZnJvbSAnLi9nZW4tcWwtanMuanMnO1xuXG5jb25zdCB7IHFsLCBqcyB9ID0gZ2VuKHNjaGVtYURlZik7XG5cbmNvbnN0IGZzID0gcmVxdWlyZSgnZnMnKTtcblxuZnMud3JpdGVGaWxlU3luYygnLi90eXBlLWRlZnMuZ3JhcGhxbCcsIHFsKTtcbmZzLndyaXRlRmlsZVN5bmMoJy4vc2VydmVyL2FyYW5nby1yZXNvbHZlcnMuanMnLCBqcyk7XG4iXX0=