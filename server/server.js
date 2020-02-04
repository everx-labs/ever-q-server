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
import { QTracer } from "./tracer";
import { Tracer } from "opentracing";

type QOptions = {
    config: QConfig,
    logs: QLogs,
}

type EndPoint = {
    path: string,
    resolvers: any,
    typeDefFileNames: string[],
    supportSubscriptions: boolean,
    extraContext: (req: express.Request) => any,
}

export default class TONQServer {
    config: QConfig;
    logs: QLogs;
    log: QLog;
    app: express.Application;
    server: any;
    endPoints: EndPoint[];
    db: Arango;
    tracer: Tracer;
    shared: Map<string, any>;


    constructor(options: QOptions) {
        this.config = options.config;
        this.logs = options.logs;
        this.log = this.logs.create('server');
        this.shared = new Map();
        this.tracer = QTracer.create(options.config);
        this.endPoints = [];
        this.app = express();
        this.server = http.createServer(this.app);
        this.db = new Arango(this.config, this.logs, this.tracer);
        this.addEndPoint({
            path: '/graphql/mam',
            resolvers: resolversMam,
            typeDefFileNames: ['type-defs-mam.graphql'],
            supportSubscriptions: false,
            extraContext: (req) => QTracer.createContext(this.tracer, req),
        });
        this.addEndPoint({
            path: '/graphql',
            resolvers: attachCustomResolvers(createResolvers(this.db)),
            typeDefFileNames: ['type-defs-generated.graphql', 'type-defs-custom.graphql'],
            supportSubscriptions: true,
            extraContext: (req) => QTracer.createContext(this.tracer, req)
        });
    }


    async start() {
        await this.db.start();
        const { host, port } = this.config.server;
        this.server.listen({ host, port }, () => {
            this.endPoints.forEach((endPoint: EndPoint) => {
                this.log.debug('GRAPHQL', `http://${host}:${port}${endPoint.path}`);
            });
        });
    }


    addEndPoint(endPoint: EndPoint) {
        const typeDefs = endPoint.typeDefFileNames
            .map(x => fs.readFileSync(x, 'utf-8'))
            .join('\n');
        const apollo = new ApolloServer({
            typeDefs,
            resolvers: endPoint.resolvers,
            context: ({ req, connection }) => {
                const remoteAddress = (req.socket && req.socket.remoteAddress) || '';
                return {
                    db: this.db,
                    config: this.config,
                    shared: this.shared,
                    remoteAddress,
                    ...endPoint.extraContext(connection ? connection : req),
                };
            },
        });
        apollo.applyMiddleware({ app: this.app, path: endPoint.path });
        if (endPoint.supportSubscriptions) {
            apollo.installSubscriptionHandlers(this.server);
        }
        this.endPoints.push(endPoint);
    }


}

