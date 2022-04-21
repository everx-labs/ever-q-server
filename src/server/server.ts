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

import { TonClient } from "@tonclient/core"
import { libNode } from "@tonclient/lib-node"
import fs from "fs"
import express from "express"
import http from "http"
import path from "path"

import {
    ApolloServer,
    ApolloServerExpressConfig,
    IResolvers,
} from "apollo-server-express"
import { ConnectionContext } from "subscriptions-transport-ws"
import { QShardDatabaseProvider } from "./data/shard-database-provider"
import QBlockchainData from "./data/blockchain"
import type { QBlockchainDataProvider, QDataProviders } from "./data/data"
import {
    parseArangoConfig,
    QBlockchainDataConfig,
    QHotColdDataConfig,
    STATS,
} from "./config"
import {
    QDatabasePool,
    QDataCombiner,
    QDataPrecachedCombiner,
    QDataProvider,
} from "./data/data-provider"
import { MemjsDataCache } from "./data/caching/memjs-datacache"
import { aggregatesResolvers } from "./graphql/aggregates"
import { counterpartiesResolvers } from "./graphql/counterparties"
import { explainResolvers } from "./graphql/explain"
import { infoResolvers } from "./graphql/info"
import { postRequestsResolvers } from "./graphql/post-requests"
import { blockchainResolvers } from "./graphql/blockchain"

import { createResolvers } from "./graphql/resolvers-generated"
import { accessResolvers } from "./graphql/access"
import { mam } from "./graphql/mam"

import type { QConfig } from "./config"
import { totalsResolvers } from "./graphql/totals"
import QLogs from "./logs"
import type { QLog } from "./logs"
import type { IStats } from "./stats"
import { QStats, StatsCounter } from "./stats"
import { QTracer } from "./tracing"
import { Tracer } from "opentracing"
import { Auth } from "./auth"
import { assignDeep, httpUrl, packageJson, QError } from "./utils"
import WebSocket from "ws"
import { MemStats } from "./mem-stat"
import { QRequestContext, QRequestServices, RequestEvent } from "./request"
import { overrideAccountBoc } from "./graphql/account-boc"
import { rempResolvers } from "./graphql/remp"
import { emptyKVProvider } from "./data/keyvalue"

type QServerOptions = {
    config: QConfig
    logs: QLogs
    data?: QBlockchainData
}

type EndPoint = {
    path: string
    resolvers: IResolvers
    typeDefFileNames: string[]
    supportSubscriptions: boolean
}

export class DataProviderFactory {
    providers = new Map<string, QDataProvider>()
    databasePool = new QDatabasePool()

    constructor(public config: QConfig, public logs: QLogs) {}

    ensure(): QDataProviders {
        return {
            blockchain: this.ensureBlockchain(
                this.config.blockchain,
                "blockchain",
            ),
            counterparties: this.ensureDatabases(
                this.config.counterparties,
                "counterparties",
                false,
            ),
            chainRangesVerification: this.ensureDatabases(
                this.config.chainRangesVerification,
                "chainRangesVerification",
                false,
            ),
        }
    }

    ensureBlockchain(
        config: QBlockchainDataConfig | undefined,
        logKey: string,
    ): QBlockchainDataProvider | undefined {
        return config === undefined
            ? undefined
            : {
                  accounts: this.ensureDatabases(
                      config.accounts,
                      `${logKey}_accounts`,
                      true,
                  ),
                  blocks: this.ensureHotCold(config.blocks, `${logKey}_blocks`),
                  transactions: this.ensureHotCold(
                      config.transactions,
                      `${logKey}_transactions`,
                  ),
                  zerostate: this.ensureDatabase(
                      config.zerostate,
                      `${logKey}_zerostate`,
                      0,
                  ),
              }
    }

    preCache(
        main: QDataProvider | undefined,
        config: string | undefined,
        logKey: string,
        dataExpirationTimeout = 0,
        emptyDataExpirationTimeout = 0,
    ): QDataProvider | undefined {
        const cacheConfig = (config ?? "").trim()
        if (main === undefined || cacheConfig === "") {
            return main
        }
        return new QDataPrecachedCombiner(
            this.logs.create(logKey),
            new MemjsDataCache(this.logs.create(`${logKey}_cache`), {
                server: cacheConfig,
            }),
            // new InMemoryDataCache(),
            [main],
            this.config.networkName,
            this.config.cacheKeyPrefix,
            dataExpirationTimeout,
            emptyDataExpirationTimeout,
        )
    }

    ensureHotCold(
        config: QHotColdDataConfig,
        logKey: string,
    ): QDataProvider | undefined {
        return this.ensureProvider(
            config,
            () => {
                const hot = this.preCache(
                    this.ensureDatabases(config.hot, `${logKey}_hot`, true),
                    this.config.blockchain.hotCache,
                    logKey,
                    this.config.blockchain.hotCacheExpiration,
                    this.config.blockchain.hotCacheEmptyDataExpiration,
                )
                const cold = this.preCache(
                    this.ensureDatabases(config.cold, `${logKey}_cold`, false),
                    config.cache,
                    logKey,
                )
                if (hot !== undefined && cold !== undefined) {
                    return new QDataCombiner([hot, cold])
                }
                return hot ?? cold
            },
            "hot-cold",
        )
    }

    ensureDatabases(
        config: string[],
        logKey: string,
        sharded: boolean,
    ): QDataProvider | undefined {
        return this.ensureProvider(
            config,
            () => {
                const providers: QDataProvider[] = []
                const shardingDepth =
                    sharded && config.length > 0 ? Math.log2(config.length) : 0
                if (shardingDepth % 1 !== 0) {
                    throw new Error(
                        "Invalid sharding configuration: the count of databases should be a power of 2",
                    )
                }

                config.forEach((x, i) => {
                    const provider = this.ensureDatabase(
                        x,
                        `${logKey}_${i}`,
                        shardingDepth,
                    )
                    if (
                        provider !== undefined &&
                        !providers.includes(provider)
                    ) {
                        providers.push(provider)
                    }
                })
                if (providers.length === 0) {
                    return undefined
                }
                return providers.length === 1
                    ? providers[0]
                    : new QDataCombiner(providers)
            },
            sharded.toString(),
        )
    }

    ensureDatabase(
        config: string,
        logKey: string,
        shardingDepth: number,
    ): QDataProvider | undefined {
        return this.ensureProvider(
            config,
            () => {
                if (config.trim() === "") {
                    return undefined
                }
                const databaseConfig = parseArangoConfig(config)
                const shard =
                    shardingDepth > 0
                        ? databaseConfig.name.slice(-shardingDepth)
                        : ""
                const qShard = this.databasePool.ensureShard(
                    databaseConfig,
                    shard,
                )
                return new QShardDatabaseProvider(
                    this.logs.create(logKey),
                    qShard,
                    this.config.useListeners,
                )
            },
            shardingDepth.toString(),
        )
    }

    ensureProvider(
        config: unknown,
        factory: () => QDataProvider | undefined,
        uniqueKey: string,
    ): QDataProvider | undefined {
        const providerKey = JSON.stringify({ config, uniqueKey })
        const existing = this.providers.get(providerKey)
        if (existing !== undefined) {
            return existing
        }
        const provider = factory()
        if (provider !== undefined) {
            this.providers.set(providerKey, provider)
        }
        return provider
    }
}

type QConnectionContext = ConnectionContext & {
    activeRequests?: QRequestContext[]
}

type QConnectionParams = {
    accessKey?: string | null
    accesskey?: string | null
}

export default class TONQServer {
    config: QConfig
    logs: QLogs
    log: QLog
    app: express.Application
    server: http.Server
    endPoints: EndPoint[]
    data: QBlockchainData
    tracer: Tracer
    stats: IStats
    client: TonClient
    auth: Auth
    memStats: MemStats
    internalErrorStats: StatsCounter
    shared: Map<string, unknown>
    requestServices: QRequestServices

    constructor(options: QServerOptions) {
        TonClient.useBinaryLibrary(libNode)
        this.client = new TonClient()
        this.config = options.config
        this.logs = options.logs
        this.log = this.logs.create("server")
        this.shared = new Map()
        this.tracer = QTracer.create(options.config)
        this.stats = QStats.create(
            options.config.statsd.server,
            options.config.statsd.tags,
            options.config.statsd.resetInterval,
        )
        this.auth = new Auth(options.config)
        this.endPoints = []
        this.app = express()
        this.server = http.createServer(this.app)
        const providers = new DataProviderFactory(this.config, this.logs)
        this.data =
            options.data ||
            new QBlockchainData({
                logs: this.logs,
                auth: this.auth,
                tracer: this.tracer,
                stats: this.stats,
                providers: providers.ensure(),
                slowQueriesProviders: providers.ensureBlockchain(
                    this.config.slowQueriesBlockchain,
                    "slow",
                ),
                isTests: false,
            })
        this.internalErrorStats = new StatsCounter(
            this.stats,
            STATS.errors.internal,
            [],
        )
        this.memStats = new MemStats(this.stats)
        this.memStats.start()
        this.requestServices = new QRequestServices(
            this.config,
            this.auth,
            this.tracer,
            this.stats,
            this.client,
            this.shared,
            this.logs,
            this.data,
        )
        this.addEndPoint({
            path: "/graphql/mam",
            resolvers: mam,
            typeDefFileNames: ["type-defs-mam.graphql"],
            supportSubscriptions: false,
        })
        overrideAccountBoc()
        const resolvers = createResolvers(this.data) as IResolvers
        ;[
            infoResolvers,
            totalsResolvers,
            aggregatesResolvers(this.data),
            explainResolvers(this.data),
            postRequestsResolvers,
            accessResolvers,
            counterpartiesResolvers(this.data),
            rempResolvers(this.data, emptyKVProvider),
            blockchainResolvers,
        ].forEach(x => assignDeep(resolvers, x))
        this.addEndPoint({
            path: "/graphql",
            resolvers,
            typeDefFileNames: [
                "type-defs-info.graphql",
                "type-defs-blockchain/account.graphql",
                "type-defs-blockchain/block.graphql",
                "type-defs-blockchain/blockchain.graphql",
                "type-defs-blockchain/common.graphql",
                "type-defs-blockchain/message.graphql",
                "type-defs-blockchain/transaction.graphql",
                "type-defs-generated.graphql",
                "type-defs-counterparties.graphql",
                "type-defs-custom.graphql",
            ],
            supportSubscriptions: true,
        })
    }

    async start() {
        await this.data.start()
        const { host, port } = this.config.server
        this.server.listen(
            {
                host,
                port,
            },
            () => {
                this.endPoints.forEach((endPoint: EndPoint) => {
                    this.log.debug(
                        "GRAPHQL",
                        httpUrl(`${host}:${port}${endPoint.path}`),
                    )
                })
            },
        )
        this.server.setTimeout(2147483647)

        const version = packageJson().version
        const startCounter = new StatsCounter(this.stats, STATS.start, [
            `version:${version}`,
        ])
        await startCounter.increment()
    }

    async stop() {
        await new Promise<void>(resolve => this.server.close(() => resolve()))
        this.logs.stop()

        for (const collection of this.data.collections) {
            collection.close()
        }
        await this.data.stop()
    }

    addEndPoint(endPoint: EndPoint) {
        const typeDefs = endPoint.typeDefFileNames
            .map(x => fs.readFileSync(path.join("res", x), "utf-8"))
            .join("\n")
        const config: ApolloServerExpressConfig = {
            debug: false,
            typeDefs,
            resolvers: endPoint.resolvers,
            subscriptions: {
                keepAlive: this.config.server.keepAlive,
                onDisconnect(
                    _webSocket: WebSocket,
                    context: QConnectionContext,
                ) {
                    const activeRequests = context.activeRequests
                    if (activeRequests) {
                        activeRequests.forEach(x => x.emitClose())
                        context.activeRequests = []
                    }
                },
                onConnect(
                    connectionParams: QConnectionParams,
                    _webSocket: WebSocket,
                    context: QConnectionContext,
                ): Record<string, unknown> {
                    const activeRequests: QRequestContext[] = []
                    context.activeRequests = activeRequests
                    return {
                        activeRequests,
                        accessKey:
                            connectionParams.accessKey ??
                            connectionParams.accesskey,
                    }
                },
            },
            context: ({ req, connection }) => {
                const request = new QRequestContext(
                    this.requestServices,
                    req,
                    connection,
                )
                if (connection?.context !== undefined) {
                    if (!connection.context.activeRequests) {
                        connection.context.activeRequests = []
                    }
                    const activeRequests = connection.context.activeRequests
                    activeRequests.push(request)
                    request.events.on(RequestEvent.FINISH, () => {
                        const index = activeRequests.indexOf(request)
                        if (index >= 0) {
                            activeRequests.splice(index, 1)
                        }
                    })
                }
                return request
            },
            plugins: [
                {
                    requestDidStart() {
                        return {
                            didResolveSource(ctx) {
                                const context = ctx.context as QRequestContext
                                context.log("Apollo_didResolveSource")
                            },
                            parsingDidStart(ctx) {
                                const context = ctx.context as QRequestContext
                                context.log("Apollo_parsingDidStart")
                            },
                            validationDidStart(ctx) {
                                const context = ctx.context as QRequestContext
                                context.log("Apollo_validationDidStart")
                            },
                            executionDidStart(ctx) {
                                const context = ctx.context as QRequestContext
                                context.log("Apollo_executionDidStart")
                            },
                            willSendResponse(ctx) {
                                const context = ctx.context as QRequestContext
                                context.log("Apollo_willSendResponse")
                                context.onRequestFinishing()
                                if (
                                    context.multipleAccessKeysDetected ??
                                    false
                                ) {
                                    throw QError.multipleAccessKeys()
                                }
                            },
                        }
                    },
                },
            ],
            formatError: err => {
                if (err.extensions?.code === "INTERNAL_SERVER_ERROR") {
                    void this.internalErrorStats.increment()
                }
                return err
            },
        }
        const apollo = new ApolloServer(config)
        apollo.applyMiddleware({
            app: this.app,
            path: endPoint.path,
        })
        if (endPoint.supportSubscriptions) {
            apollo.installSubscriptionHandlers(this.server)
        }
        this.endPoints.push(endPoint)
    }
}
