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
import { TonClient } from '@tonclient/core';
import { libNode } from "@tonclient/lib-node";
import fs from 'fs';
import express from 'express';
import http from 'http';
import path from 'path';

import { ApolloServer, ApolloServerExpressConfig } from 'apollo-server-express';
import { ConnectionContext } from 'subscriptions-transport-ws';
import { ArangoProvider } from './data/arango-provider';
import QBlockchainData from './data/blockchain';
import type { QDataProviders } from './data/data';
import { RequestController, RequestEvent } from './data/collection';
import type { GraphQLRequestContext } from './data/collection';
import { STATS } from './config';
import { missingDataCache, QDataCombiner, QDataPrecachedCombiner } from './data/data-provider';
import { isCacheEnabled, MemjsDataCache } from './data/memjs-datacache';
import { counterpartiesResolvers } from "./graphql/resolvers-counterparties";

import { createResolvers } from './graphql/resolvers-generated';
import { customResolvers } from './graphql/resolvers-custom';
import { resolversMam } from './graphql/resolvers-mam';

import type { QArangoConfig, QConfig, QDataProvidersConfig } from './config';
import QLogs from './logs';
import type { QLog } from './logs';
import type { IStats } from './tracer';
import { QStats, QTracer, StatsCounter } from './tracer';
import { Tracer } from 'opentracing';
import { Auth } from './auth';
import { packageJson, QError } from './utils';

type QOptions = {
    config: QConfig,
    logs: QLogs,
    data?: QBlockchainData,
}

type EndPoint = {
    path: string,
    resolvers: any,
    typeDefFileNames: string[],
    supportSubscriptions: boolean,
}

const v8 = require('v8');

class MemStats {
    stats: IStats;

    constructor(stats: IStats) {
        this.stats = stats;
    }

    report() {
        v8.getHeapSpaceStatistics().forEach((space) => {
            const spaceName = space.space_name
                .replace('space_', '')
                .replace('_space', '');
            const gauge = (metric: string, value: number) => {
                this.stats.gauge(`heap.space.${spaceName}.${metric}`, value);
            };
            gauge('physical_size', space.physical_space_size);
            gauge('available_size', space.space_available_size);
            gauge('size', space.space_size);
            gauge('used_size', space.space_used_size);
        });
    }

    start() {
        //TODO: this.checkMemReport();
        //TODO: this.checkGc();
    }

    checkMemReport() {
        setTimeout(() => {
            this.report();
            this.checkMemReport();
        }, 5000);
    }

    checkGc() {
        setTimeout(() => {
            global.gc();
            this.checkGc();
        }, 60000);
    }
}

export function createProviders(configName: string, logs: QLogs, config: QDataProvidersConfig, networkName: string, cacheKeyPrefix: string): QDataProviders {
    const newArangoProvider = (dbName: string, config: QArangoConfig): ArangoProvider => (
        new ArangoProvider(logs.create(`${configName}_${dbName}`), config)
    );
    const mutable = newArangoProvider('mut', config.mut);
    const hot = newArangoProvider('hot', config.hot);
    const cacheLog = logs.create(`${configName}_cache`);
    const cold = new QDataPrecachedCombiner(
        cacheLog,
        isCacheEnabled(config.cache) ? new MemjsDataCache(cacheLog, config.cache) : missingDataCache,
        config.cold.map(x => newArangoProvider('cold', x)),
        networkName,
        cacheKeyPrefix,
    );
    const immutable = new QDataCombiner([hot, cold]);
    const counterparties = newArangoProvider('counterparties', config.counterparties);
    return {
        mutable,
        immutable,
        counterparties,
    };
}

function isObject(test: any): boolean {
    return typeof test === 'object' && test !== null;
}

function overrideObject(original: any, overrides: any) {
    Object.entries(overrides).forEach(([name, overrideValue]) => {
        if ((name in original) && isObject(overrideValue) && isObject(original[name])) {
            overrideObject(original[name], overrideValue);
        } else {
            original[name] = overrideValue;
        }
    });
}

export default class TONQServer {
    config: QConfig;
    logs: QLogs;
    log: QLog;
    app: express.Application;
    server: any;
    endPoints: EndPoint[];
    data: QBlockchainData;
    tracer: Tracer;
    stats: IStats;
    client: TonClient;
    auth: Auth;
    memStats: MemStats;
    shared: Map<string, any>;


    constructor(options: QOptions) {
        this.config = options.config;
        this.logs = options.logs;
        this.log = this.logs.create('server');
        this.shared = new Map();
        this.tracer = QTracer.create(options.config);
        this.stats = QStats.create(options.config.statsd.server, options.config.statsd.tags);
        this.auth = new Auth(options.config);
        this.endPoints = [];
        this.app = express();
        this.server = http.createServer(this.app);
        this.data = options.data || new QBlockchainData({
            logs: this.logs,
            auth: this.auth,
            tracer: this.tracer,
            stats: this.stats,
            providers: createProviders('fast', this.logs, this.config.data, this.config.networkName, this.config.cacheKeyPrefix),
            slowQueriesProviders: createProviders('slow', this.logs, this.config.slowQueriesData, this.config.networkName, this.config.cacheKeyPrefix),
            isTests: false,
        });
        this.memStats = new MemStats(this.stats);
        this.memStats.start();
        this.addEndPoint({
            path: '/graphql/mam',
            resolvers: resolversMam,
            typeDefFileNames: ['type-defs-mam.graphql'],
            supportSubscriptions: false,
        });
        const resolvers = createResolvers(this.data);
        overrideObject(resolvers, customResolvers(this.data));
        overrideObject(resolvers, counterpartiesResolvers(this.data));
        this.addEndPoint({
            path: '/graphql',
            resolvers,
            typeDefFileNames: ['type-defs-generated.graphql', 'type-defs-custom.graphql'],
            supportSubscriptions: true,
        });
    }


    async start() {
        TonClient.useBinaryLibrary(libNode);
        this.client = new TonClient();
        await this.data.start();
        const { host, port } = this.config.server;
        this.server.listen({
            host,
            port,
        }, () => {
            this.endPoints.forEach((endPoint: EndPoint) => {
                this.log.debug('GRAPHQL', `http://${host}:${port}${endPoint.path}`);
            });
        });
        this.server.setTimeout(2147483647);

        const version = packageJson().version;
        const startCounter = new StatsCounter(this.stats, STATS.start, [`version:${version}`]);
        startCounter.increment()
    }


    async stop() {
        await new Promise((resolve) => this.server.close(() => resolve()));
        this.logs.stop();
    }

    addEndPoint(endPoint: EndPoint) {
        const typeDefs = endPoint.typeDefFileNames
            .map(x => fs.readFileSync(path.join('res', x), 'utf-8'))
            .join('\n');
        const config: ApolloServerExpressConfig = {
            debug: false,
            typeDefs,
            resolvers: endPoint.resolvers,
            subscriptions: {
                keepAlive: this.config.server.keepAlive,
                onDisconnect(_webSocket: WebSocket, context: ConnectionContext) {
                    if (context.activeRequests) {
                        context.activeRequests.forEach(x => x.emitClose());
                        context.activeRequests = [];
                    }
                },
                onConnect(connectionParams: Object, _webSocket: WebSocket, context: ConnectionContext): any {
                    const activeRequests = [];
                    context.activeRequests = activeRequests;
                    return {
                        activeRequests,
                        accessKey: connectionParams.accessKey || connectionParams.accesskey,
                    }
                },
            },
            context: ({ req, connection }) => {
                const request = new RequestController();
                if (req && req.on) {
                    req.on('close', () => {
                        request.emitClose();
                    });
                }
                if (connection && connection.context) {
                    if (!connection.context.activeRequests) {
                        connection.context.activeRequests = [];
                    }
                    const activeRequests = connection.context.activeRequests;
                    activeRequests.push(request);
                    request.events.on(RequestEvent.FINISH, () => {
                        const index = activeRequests.indexOf(request);
                        if (index >= 0) {
                            activeRequests.splice(index, 1);
                        }
                    });
                }
                return {
                    data: this.data,
                    tracer: this.tracer,
                    stats: this.stats,
                    auth: this.auth,
                    client: this.client,
                    config: this.config,
                    shared: this.shared,
                    remoteAddress: (req && req.socket && req.socket.remoteAddress) || '',
                    accessKey: Auth.extractAccessKey(req, connection),
                    parentSpan: QTracer.extractParentSpan(this.tracer, connection ? connection : req),
                    req,
                    connection,
                    request,
                };
            },
            plugins: [
                {
                    requestDidStart(_requestContext) {
                        return {
                            willSendResponse(ctx) {
                                const context: GraphQLRequestContext = ctx.context;
                                if (context.multipleAccessKeysDetected) {
                                    throw QError.multipleAccessKeys();
                                }
                            },
                        }
                    },
                },
            ],
        };
        const apollo = new ApolloServer(config);
        apollo.applyMiddleware({
            app: this.app,
            path: endPoint.path,
        });
        if (endPoint.supportSubscriptions) {
            apollo.installSubscriptionHandlers(this.server);
        }
        this.endPoints.push(endPoint);
    }


}
