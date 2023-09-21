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

import { TonClient } from "@eversdk/core"
import { libNode } from "@eversdk/lib-node"
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
import { QDatabaseProvider } from "./data/database-provider"
import QBlockchainData from "./data/blockchain"
import type { QBlockchainDataProvider, QDataProviders } from "./data/data"
import {
    parseArangoConfig,
    QBlockchainDataConfig,
    QDataProviderConfig,
    STATS,
    SubscriptionsMode,
} from "./config"
import {
    QArchiveCombiner,
    QDatabasePool,
    QDataCombiner,
    QDataPrecachedCombiner,
    QDataProvider,
} from "./data/data-provider"
import { MemjsDataCache } from "./data/caching/memjs-datacache"
import { aggregatesResolvers } from "./graphql/aggregates"
import { counterpartiesResolvers } from "./graphql/counterparties"
import { infoResolvers } from "./graphql/info"
import { postRequestsResolvers } from "./graphql/post-requests"
import { blockchainResolvers } from "./graphql/blockchain"

import { createResolvers } from "./graphql/resolvers-generated"

import type { QConfig } from "./config"
import QLogs from "./logs"
import type { QLog } from "./logs"
import type { IStats } from "./stats"
import { QStats, StatsCounter } from "./stats"
import { QTracer } from "./tracing"
import { Tracer } from "opentracing"
import { assignDeep, httpUrl, packageJson } from "./utils"
import WebSocket from "ws"
import { MemStats } from "./mem-stat"
import { QRequestContext, QRequestServices, RequestEvent } from "./request"
import { overrideAccountBocFilter } from "./graphql/account-boc"
import { rempResolvers } from "./graphql/remp"
import { LiteClient } from "ton-lite-client"
import {
    addMasterSeqNoFilters,
    masterSeqNoResolvers,
} from "./graphql/chain-order"
import { blockBocResolvers, overrideBlockBocFilter } from "./graphql/block-boc"
import { createAccountProvider } from "./data/account-provider"
import { createBocProvider } from "./data/boc-provider"
import { lastKeyBlockResolvers } from "./graphql/last-key-block"

type QServerOptions = {
    config: QConfig
    logs: QLogs
    data?: QBlockchainData
    liteclient?: LiteClient
}

type EndPoint = {
    path: string
    resolvers: IResolvers
    typeDefFileNames: string[]
    supportSubscriptions: boolean
}

type ProviderFactoryItem = {
    provider: QDataProvider
    hot: QDatabaseProvider | undefined
}

export class DataProviderFactory {
    providers = new Map<string, ProviderFactoryItem>()
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
            )?.provider,
            chainRangesVerification: this.ensureDatabases(
                this.config.chainRangesVerification,
                "chainRangesVerification",
            )?.provider,
        }
    }

    ensureBlockchain(
        config: QBlockchainDataConfig | undefined,
        logKey: string,
    ): QBlockchainDataProvider | undefined {
        if (config === undefined) {
            return undefined
        }
        const blocks = this.ensureDataProvider(
            config.blocks,
            `${logKey}_blocks`,
        )
        const transactions = this.ensureDataProvider(
            config.transactions,
            `${logKey}_transactions`,
        )
        return {
            accounts: this.ensureDatabases(
                config.accounts,
                `${logKey}_accounts`,
            )?.provider,
            blocks: blocks?.provider,
            hotBlocks: blocks?.hot,
            transactions: transactions?.provider,
            hotTransactions: transactions?.hot,
            zerostate: this.ensureDatabase(
                config.zerostate,
                `${logKey}_zerostate`,
            )?.provider,
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

    ensureDataProvider(
        config: QDataProviderConfig,
        logKey: string,
    ): ProviderFactoryItem | undefined {
        return this.ensureProvider(
            config,
            () => {
                const hotDatabase = this.ensureDatabases(
                    config.hot,
                    `${logKey}_hot`,
                )?.hot
                const hot = this.preCache(
                    hotDatabase,
                    this.config.blockchain.hotCache,
                    logKey,
                    this.config.blockchain.hotCacheExpiration,
                    this.config.blockchain.hotCacheEmptyDataExpiration,
                )
                const cold = this.preCache(
                    this.ensureDatabases(config.cold, `${logKey}_cold`)
                        ?.provider,
                    config.cache,
                    logKey,
                )
                let provider =
                    hot !== undefined && cold !== undefined
                        ? new QDataCombiner([hot, cold])
                        : hot ?? cold
                if (provider) {
                    const archive = this.ensureDatabases(
                        config.archive,
                        `${logKey}_archive`,
                    )?.provider
                    if (archive) {
                        provider = new QArchiveCombiner(archive, provider)
                    }
                }
                if (!provider) {
                    return undefined
                }
                return {
                    provider,
                    hot: hotDatabase,
                }
            },
            "hot-cold",
        )
    }

    ensureDatabases(
        config: string[],
        logKey: string,
    ): ProviderFactoryItem | undefined {
        return this.ensureProvider(
            config,
            () => {
                const factoryItems: ProviderFactoryItem[] = []
                config.forEach((x, i) => {
                    const factoryItem = this.ensureDatabase(x, `${logKey}_${i}`)
                    if (
                        factoryItem !== undefined &&
                        !factoryItems.includes(factoryItem)
                    ) {
                        factoryItems.push(factoryItem)
                    }
                })
                if (factoryItems.length === 0) {
                    return undefined
                }
                if (factoryItems.length === 1) {
                    return factoryItems[0]
                }

                return {
                    provider: new QDataCombiner(
                        factoryItems.map(x => x.provider),
                    ),
                    hot: factoryItems[0].hot,
                }
            },
            "false",
        )
    }

    ensureDatabase(
        config: string,
        logKey: string,
    ): ProviderFactoryItem | undefined {
        return this.ensureProvider(
            config,
            () => {
                if (config.trim() === "") {
                    return undefined
                }
                const databaseConfig = parseArangoConfig(config)
                const connection =
                    this.databasePool.ensureConnection(databaseConfig)
                const database = new QDatabaseProvider(
                    this.logs.create(logKey),
                    connection,
                    this.config.subscriptionsMode === SubscriptionsMode.Arango,
                )
                return {
                    provider: database,
                    hot: database,
                }
            },
            "false",
        )
    }

    ensureProvider(
        config: unknown,
        factory: () => ProviderFactoryItem | undefined,
        uniqueKey: string,
    ): ProviderFactoryItem | undefined {
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
    liteclient?: LiteClient
    memStats: MemStats
    internalErrorStats: StatsCounter
    shared: Map<string, unknown>
    requestServices: QRequestServices

    constructor(options: QServerOptions) {
        TonClient.useBinaryLibrary(libNode)
        this.client = new TonClient()
        this.liteclient = options.liteclient
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
        this.endPoints = []
        this.app = express()
        this.server = http.createServer(this.app)
        const providers = new DataProviderFactory(this.config, this.logs)
        this.data =
            options.data ||
            new QBlockchainData({
                logs: this.logs,
                tracer: this.tracer,
                stats: this.stats,
                providers: providers.ensure(),
                slowQueriesProviders: providers.ensureBlockchain(
                    this.config.slowQueriesBlockchain,
                    "slow",
                ),
                blockBocProvider: createBocProvider(this.config.blockBocs),
                accountProvider: createAccountProvider(
                    this.logs,
                    this.config.accountProvider,
                ),
                isTests: false,
                subscriptionsMode: this.config.subscriptionsMode,
                filterConfig: this.config.queries.filter,
                ignoreMessagesForLatency: this.config.ignoreMessagesForLatency,
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
            this.tracer,
            this.stats,
            this.client,
            this.shared,
            this.logs,
            this.data,
            this.liteclient,
        )
        overrideAccountBocFilter()
        addMasterSeqNoFilters()
        overrideBlockBocFilter(this.data.blockBocProvider)
        const resolvers = createResolvers(this.data) as IResolvers
        assignDeep(resolvers, infoResolvers)
        assignDeep(resolvers, aggregatesResolvers(this.data))
        assignDeep(resolvers, postRequestsResolvers)
        assignDeep(resolvers, counterpartiesResolvers(this.data))
        assignDeep(resolvers, rempResolvers(this.config.remp, this.logs))
        assignDeep(resolvers, blockchainResolvers)
        assignDeep(resolvers, masterSeqNoResolvers)
        assignDeep(resolvers, blockBocResolvers(this.data.blockBocProvider))
        if (options.config.lastKeyBlockCache.enabled) {
            assignDeep(
                resolvers,
                lastKeyBlockResolvers(
                    resolvers,
                    this.requestServices,
                    options.config.lastKeyBlockCache.ttlMs,
                ),
            )
        }
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
                "type-defs-remp.graphql",
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
        await Promise.race([
            new Promise<void>(resolve => this.server.close(() => resolve())),
            new Promise<void>(resolve => setTimeout(resolve, 50)),
        ])

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
                    _connectionParams: unknown,
                    _webSocket: WebSocket,
                    context: QConnectionContext,
                ): Record<string, unknown> {
                    const activeRequests: QRequestContext[] = []
                    context.activeRequests = activeRequests
                    return {
                        activeRequests,
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
