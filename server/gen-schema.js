import schemaDef from './db.schema.js';
import gen from 'ton-labs-dev-ops/dist/src/ton-server/gen-ql-js';

const { ql, js } = gen(schemaDef);

const fs = require('fs');

fs.writeFileSync('./server/type-defs.graphql', ql);
fs.writeFileSync('./server/arango-resolvers.js', js);
