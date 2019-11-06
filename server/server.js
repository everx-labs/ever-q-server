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

// @flow
import fs from 'fs';

import express from 'express';
import http from 'http';
import https from 'https';

import { ApolloServer } from 'apollo-server-express';

import Arango from './arango';

import { createResolvers as createResolversV1 } from './arango-resolvers.v1';
import { createResolvers as createResolversV2 } from './arango-resolvers.v2';
import { attachCustomResolvers as attachCustomResolversV1 } from "./custom-resolvers.v1";
import { attachCustomResolvers as attachCustomResolversV2 } from "./custom-resolvers.v2";

import type { QConfig } from "./config";
import QLogs from "./logs";
import type { QLog } from "./logs";

type QOptions = {
    config: QConfig,
    logs: QLogs,
}

export default class TONQServer {
    config: QConfig;
    logs: QLogs;
    log: QLog;
    db: Arango;

    constructor(options: QOptions) {
        this.config = options.config;
        this.logs = options.logs;
        this.log = this.logs.create('Q Server');
    }


    async start() {
        const config = this.config.server;
        const ssl = config.ssl;

        this.db = new Arango(this.config, this.logs);
        const typeDefs = fs.readFileSync(`type-defs.v${this.config.database.version}.graphql`, 'utf-8');
        const createResolvers = this.config.database.version === '1' ? createResolversV1 : createResolversV2;
        const attachCustomResolvers = this.config.database.version === '1' ? attachCustomResolversV1 : attachCustomResolversV2;
        const resolvers = attachCustomResolvers(createResolvers(this.db));
        await this.db.start();

        const apollo = new ApolloServer({
            typeDefs,
            resolvers,
        });

        const app = express();
        apollo.applyMiddleware({ app, path: '/graphql' });

        let server;
        if (ssl) {
            server = https.createServer(
                {
                    key: fs.readFileSync(ssl.key),
                    cert: fs.readFileSync(ssl.cert)
                },
                app
            )
        } else {
            server = http.createServer(app)
        }
        apollo.installSubscriptionHandlers(server);

        server.listen({
            host: config.host,
            port: ssl ? ssl.port : config.port
        }, () => {
            const uri = `http${ssl ? 's' : ''}://${config.host}:${ssl ? ssl.port : config.port}/graphql`;
            this.log.debug(`Started on ${uri}`);
        });
    }
}

