"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _dbSchema = _interopRequireDefault(require("./db.schema.js"));

var _genQlJs = _interopRequireDefault(require("ton-labs-dev-ops/dist/src/ton-server/gen-ql-js"));

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9nZW4tc2NoZW1hLmpzIl0sIm5hbWVzIjpbInNjaGVtYURlZiIsInFsIiwianMiLCJmcyIsInJlcXVpcmUiLCJ3cml0ZUZpbGVTeW5jIl0sIm1hcHBpbmdzIjoiOzs7O0FBZ0JBOztBQUNBOztBQWpCQTs7Ozs7Ozs7Ozs7Ozs7O1dBbUJtQix5QkFBSUEsb0JBQUosQztJQUFYQyxFLFFBQUFBLEU7SUFBSUMsRSxRQUFBQSxFOztBQUVaLElBQU1DLEVBQUUsR0FBR0MsT0FBTyxDQUFDLElBQUQsQ0FBbEI7O0FBRUFELEVBQUUsQ0FBQ0UsYUFBSCxDQUFpQixxQkFBakIsRUFBd0NKLEVBQXhDO0FBQ0FFLEVBQUUsQ0FBQ0UsYUFBSCxDQUFpQiw4QkFBakIsRUFBaURILEVBQWpEIiwic291cmNlc0NvbnRlbnQiOlsiLypcclxuICogQ29weXJpZ2h0IDIwMTgtMjAxOSBUT04gREVWIFNPTFVUSU9OUyBMVEQuXHJcbiAqXHJcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBTT0ZUV0FSRSBFVkFMVUFUSU9OIExpY2Vuc2UgKHRoZSBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZVxyXG4gKiB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGVcclxuICogTGljZW5zZSBhdDpcclxuICpcclxuICogaHR0cDovL3d3dy50b24uZGV2L2xpY2Vuc2VzXHJcbiAqXHJcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcclxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxyXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cclxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgVE9OIERFViBzb2Z0d2FyZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXHJcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxyXG4gKi9cclxuXHJcbmltcG9ydCBzY2hlbWFEZWYgZnJvbSAnLi9kYi5zY2hlbWEuanMnO1xyXG5pbXBvcnQgZ2VuIGZyb20gJ3Rvbi1sYWJzLWRldi1vcHMvZGlzdC9zcmMvdG9uLXNlcnZlci9nZW4tcWwtanMnO1xyXG5cclxuY29uc3QgeyBxbCwganMgfSA9IGdlbihzY2hlbWFEZWYpO1xyXG5cclxuY29uc3QgZnMgPSByZXF1aXJlKCdmcycpO1xyXG5cclxuZnMud3JpdGVGaWxlU3luYygnLi90eXBlLWRlZnMuZ3JhcGhxbCcsIHFsKTtcclxuZnMud3JpdGVGaWxlU3luYygnLi9zZXJ2ZXIvYXJhbmdvLXJlc29sdmVycy5qcycsIGpzKTtcclxuIl19