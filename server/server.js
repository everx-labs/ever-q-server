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

import { ApolloServer, ApolloServerExpressConfig } from 'apollo-server-express';
import { ConnectionContext } from 'subscriptions-transport-ws';
import type { TONClient } from "ton-client-js/types";
import { TONClient as TONClientNodeJs } from 'ton-client-node-js';
import Arango from './arango';
import type { GraphQLRequestContext } from "./arango-collection";

import { createResolvers } from './resolvers-generated';
import { attachCustomResolvers } from "./resolvers-custom";
import { resolversMam } from "./resolvers-mam";

import type { QConfig } from './config';
import QLogs from './logs';
import type { QLog } from './logs';
import { QTracer } from "./tracer";
import { Tracer } from "opentracing";
import { Auth } from './auth';
import { createError } from "./utils";

type QOptions = {
    config: QConfig,
    logs: QLogs,
}

type EndPoint = {
    path: string,
    resolvers: any,
    typeDefFileNames: string[],
    supportSubscriptions: boolean,
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
    client: TONClient;
    auth: Auth;
    shared: Map<string, any>;


    constructor(options: QOptions) {
        this.config = options.config;
        this.logs = options.logs;
        this.log = this.logs.create('server');
        this.shared = new Map();
        this.tracer = QTracer.create(options.config);
        this.auth = new Auth(options.config);
        this.endPoints = [];
        this.app = express();
        this.server = http.createServer(this.app);
        this.db = new Arango(this.config, this.logs, this.auth, this.tracer);
        this.addEndPoint({
            path: '/graphql/mam',
            resolvers: resolversMam,
            typeDefFileNames: ['type-defs-mam.graphql'],
            supportSubscriptions: false,
        });
        this.addEndPoint({
            path: '/graphql',
            resolvers: attachCustomResolvers(createResolvers(this.db)),
            typeDefFileNames: ['type-defs-generated.graphql', 'type-defs-custom.graphql'],
            supportSubscriptions: true,
        });
    }


    async start() {
        this.client = await TONClientNodeJs.create({ servers: [''] });
        await this.db.start();
        const { host, port } = this.config.server;
        this.server.listen({ host, port }, () => {
            this.endPoints.forEach((endPoint: EndPoint) => {
                this.log.debug('GRAPHQL', `http://${host}:${port}${endPoint.path}`);
            });
        });
        this.server.setTimeout(2147483647);
    }


    addEndPoint(endPoint: EndPoint) {
        const typeDefs = endPoint.typeDefFileNames
            .map(x => fs.readFileSync(x, 'utf-8'))
            .join('\n');
        const config: ApolloServerExpressConfig = {
            typeDefs,
            resolvers: endPoint.resolvers,
            subscriptions: {
                onConnect(connectionParams: Object, _websocket: WebSocket, _context: ConnectionContext): any {
                    return {
                        accessKey: connectionParams.accessKey || connectionParams.accesskey,
                    }
                }
            },
            context: ({ req, connection }) => {
                return {
                    db: this.db,
                    tracer: this.tracer,
                    auth: this.auth,
                    client: this.client,
                    config: this.config,
                    shared: this.shared,
                    remoteAddress: (req && req.socket && req.socket.remoteAddress) || '',
                    accessKey: Auth.extractAccessKey(req, connection),
                    parentSpan: QTracer.extractParentSpan(this.tracer, connection ? connection : req),
                };
            },
            plugins: [
                {
                    requestDidStart(_requestContext) {
                        return {
                            willSendResponse(ctx) {
                                const context: GraphQLRequestContext = ctx.context;
                                if (context.multipleAccessKeysDetected) {
                                    throw createError(
                                        400,
                                        'Request must use the same access key for all queries and mutations',
                                    );
                                }
                            }
                        }
                    }
                }
            ],
        };
        const apollo = new ApolloServer(config);
        apollo.applyMiddleware({ app: this.app, path: endPoint.path });
        if (endPoint.supportSubscriptions) {
            apollo.installSubscriptionHandlers(this.server);
        }
        this.endPoints.push(endPoint);
    }


}

