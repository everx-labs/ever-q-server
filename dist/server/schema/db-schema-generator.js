"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _dbSchema = _interopRequireDefault(require("./db-schema.js"));

var _qlJsGenerator = _interopRequireDefault(require("./ql-js-generator.js"));

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
var fs = require('fs');

var _gen = (0, _qlJsGenerator["default"])(_dbSchema["default"]),
    ql = _gen.ql,
    js = _gen.js;

fs.writeFileSync("./type-defs-generated.graphql", ql);
fs.writeFileSync("./server/resolvers-generated.js", js);