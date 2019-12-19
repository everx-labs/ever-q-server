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

import { ApolloServer } from 'apollo-server-express';

import Arango from './arango';

import { createResolvers } from './resolvers-generated';
import { attachCustomResolvers } from "./resolvers-custom";
import { resolversMam } from "./resolvers-mam";

import type { QConfig } from './config';
import QLogs from './logs';
import type { QLog } from './logs';
import { Tracer } from "./tracer";

type QOptions = {
    config: QConfig,
    logs: QLogs,
}

export default class TONQServer {
    config: QConfig;
    logs: QLogs;
    log: QLog;
    db: Arango;
    tracer: Tracer;
    shared: Map<string, any>;

    constructor(options: QOptions) {
        this.config = options.config;
        this.logs = options.logs;
        this.log = this.logs.create('Q Server');
        this.shared = new Map();
        this.tracer = new Tracer(options.config);
    }

    async startMam(app: express.Application) {
        const typeDefs = fs.readFileSync('type-defs-mam.graphql', 'utf-8');

        const apollo = new ApolloServer({
            typeDefs,
            resolversMam,
            context: () => ({
                db: this.db,
                config: this.config,
                shared: this.shared,
            })
        });

        apollo.applyMiddleware({ app, path: '/graphql/mam' });
    }

    async start() {
        const config = this.config.server;

        this.db = new Arango(this.config, this.logs, this.tracer);
        const generatedTypeDefs = fs.readFileSync(`type-defs-generated.graphql`, 'utf-8');
        const customTypeDefs = fs.readFileSync('type-defs-custom.graphql', 'utf-8');
        const typeDefs = `${generatedTypeDefs}\n${customTypeDefs}`;
        const resolvers = attachCustomResolvers(createResolvers(this.db));

        await this.db.start();

        const apollo = new ApolloServer({
            typeDefs,
            resolvers,
            context: ({ req }) => {
                return {
                    db: this.db,
                    config: this.config,
                    shared: this.shared,
                    ...this.tracer.getContext(req),
                };
            },
        });

        const app = express();
        await this.startMam(app);
        apollo.applyMiddleware({ app, path: '/graphql' });

        const server = http.createServer(app);
        apollo.installSubscriptionHandlers(server);

        server.listen({
            host: config.host,
            port: config.port,
        }, () => {
            const uri = `http://${config.host}:${config.port}/graphql`;
            this.log.debug(`Started on ${uri}`);
        });
    }
}

