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

import schemaDefV1 from './db.schema.v1.js';
import schemaDefV2 from './db.schema.v2.js';
import gen from './gen-ql-js.js';
const fs = require('fs');

function genSchema(def, suffix) {
    const { ql, js } = gen(def);


    fs.writeFileSync(`./type-defs${suffix}.graphql`, ql);
    fs.writeFileSync(`./server/arango-resolvers${suffix}.js`, js);
}

genSchema(schemaDefV1, '.v1');
genSchema(schemaDefV2, '.v2');
