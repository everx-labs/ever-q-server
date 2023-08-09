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

import { QDataCollection } from "./collection"
import { FilterConfig, STATS, SubscriptionsMode } from "../config"
import type { QLog } from "../logs"
import QLogs from "../logs"
import type { QType } from "../filter/filters"
import { Tracer } from "opentracing"
import { StatsCounter } from "../stats"
import type { IStats } from "../stats"
import { wrap } from "../utils"
import type {
    QDataProvider,
    QDataProviderQueryParams,
    QIndexInfo,
} from "./data-provider"
import { IBocProvider } from "./boc-provider"
import { QDatabaseProvider } from "./database-provider"
import { IAccountProvider } from "./account-provider"

export type QBlockchainDataProvider = {
    blocks?: QDataProvider
    hotBlocks?: QDatabaseProvider
    transactions?: QDataProvider
    hotTransactions?: QDatabaseProvider
    accounts?: QDataProvider
    zerostate?: QDataProvider
}

export type QDataProviders = {
    blockchain?: QBlockchainDataProvider
    counterparties?: QDataProvider
    chainRangesVerification?: QDataProvider
}

export type QDataOptions = {
    providers: QDataProviders
    slowQueriesProviders?: QBlockchainDataProvider
    blockBocProvider?: IBocProvider
    accountProvider?: IAccountProvider
    logs: QLogs
    tracer: Tracer
    stats: IStats
    subscriptionsMode: SubscriptionsMode
    filterConfig: FilterConfig
    isTests: boolean
    ignoreMessagesForLatency: boolean
}

function collectProviders(
    source: (QDataProvider | undefined)[],
): QDataProvider[] {
    const providers: QDataProvider[] = []
    for (const provider of source) {
        if (provider !== undefined && !providers.includes(provider)) {
            providers.push(provider)
        }
    }
    return providers
}

export default class QData {
    // Dependencies
    providers: QDataProviders
    slowQueriesProviders?: QBlockchainDataProvider
    logs: QLogs
    stats: IStats
    tracer: Tracer
    isTests: boolean
    filterConfig: FilterConfig
    subscriptionsMode: SubscriptionsMode
    blockBocProvider?: IBocProvider
    accountProvider?: IAccountProvider

    // Own
    log: QLog
    statPostCount: StatsCounter
    statPostFailed: StatsCounter

    dataProviders: QDataProvider[]
    slowQueriesDataProviders: QDataProvider[]

    collections: QDataCollection[]
    collectionsByName: Map<string, QDataCollection>

    constructor(options: QDataOptions) {
        this.providers = options.providers
        this.slowQueriesProviders = options.slowQueriesProviders
        this.logs = options.logs
        this.stats = options.stats
        this.tracer = options.tracer
        this.isTests = options.isTests
        this.subscriptionsMode = options.subscriptionsMode
        this.filterConfig = options.filterConfig

        this.log = this.logs.create("data")

        this.statPostCount = new StatsCounter(this.stats, STATS.post.count, [])
        this.statPostFailed = new StatsCounter(
            this.stats,
            STATS.post.failed,
            [],
        )

        this.collections = []
        this.collectionsByName = new Map()

        this.dataProviders = collectProviders([
            this.providers.blockchain?.blocks,
            this.providers.blockchain?.transactions,
            this.providers.blockchain?.accounts,
            this.providers.blockchain?.zerostate,
            this.providers.counterparties,
        ])

        this.slowQueriesDataProviders = collectProviders([
            this.slowQueriesProviders?.blocks,
            this.slowQueriesProviders?.transactions,
            this.slowQueriesProviders?.accounts,
            this.slowQueriesProviders?.zerostate,
        ])

        this.blockBocProvider = options.blockBocProvider
        this.accountProvider = options.accountProvider
    }

    addCollection(
        name: string,
        docType: QType,
        provider: QDataProvider | undefined,
        slowQueriesProvider: QDataProvider | undefined,
        indexes: QIndexInfo[],
    ) {
        const collection = new QDataCollection({
            name,
            docType,
            indexes,
            provider,
            slowQueriesProvider,
            logs: this.logs,
            tracer: this.tracer,
            stats: this.stats,
            isTests: this.isTests,
            subscriptionsMode: this.subscriptionsMode,
            filterConfig: this.filterConfig,
        })
        this.collections.push(collection)
        this.collectionsByName.set(name, collection)
        return collection
    }

    async start() {
        for (const provider of this.dataProviders) {
            const collectionsForSubscribe = this.collections
                .filter(x => x.provider === provider)
                .map(x => x.name)
            await provider.start(collectionsForSubscribe)
            await provider.hotUpdate()
        }
        for (const provider of this.slowQueriesDataProviders) {
            await provider.start([])
        }
    }

    async stop() {
        for (const provider of [
            ...this.dataProviders,
            ...this.slowQueriesDataProviders,
        ]) {
            await provider.stop()
        }
    }

    async dropCachedDbInfo() {
        this.collections.forEach((x: QDataCollection) => x.dropCachedDbInfo())
        for (const provider of this.dataProviders) {
            await provider.hotUpdate()
        }
    }

    async query(
        provider: QDataProvider,
        queryParams: QDataProviderQueryParams,
    ) {
        return wrap(
            this.log,
            "QUERY",
            {
                text: queryParams.text,
                vars: queryParams.vars,
            },
            async () => {
                return provider.query(queryParams)
            },
        )
    }
}
