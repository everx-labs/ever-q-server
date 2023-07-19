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

import { URL } from "url"
import { readFileSync } from "fs"
import { ConfigParam, ConfigValue, DeepPartial } from "./config-param"
import { QError } from "./utils"
import { RempConfig, rempConfigParams } from "./graphql/remp"

export type QConfig = {
    config: string
    server: {
        host: string
        port: number
        keepAlive: number
    }
    requests: {
        mode: RequestsMode
        server: string
        pubkey: string
        topic: string
        maxSize: number
    }
    subscriptions: {
        kafkaOptions: {
            server: string
            topic: string
            maxSize: number
            keepAliveInterval: number
        }
        redisOptions: {
            port: number
            host: string
        }
        healthRedisChannel: string
        healthTimeout: number
    }
    queries: {
        filter: FilterConfig
        maxRuntimeInS: number
        maxTimeout: number
        slowQueries: SlowQueriesMode
        waitForPeriod: number
    }
    remp: RempConfig
    useListeners?: boolean
    walkingUseCache: boolean
    subscriptionsMode: SubscriptionsMode
    hot: string[]
    archive: string[]
    blockchain: QBlockchainDataConfig
    counterparties: string[]
    blockBocs: QBocResolverConfig
    chainRangesVerification: string[]
    ignoreMessagesForLatency: boolean

    slowQueriesBlockchain?: QBlockchainDataConfig

    jaeger: {
        endpoint: string
        service: string
        tags: Record<string, string>
    }
    statsd: {
        server: string
        tags: string[]
        resetInterval: number
    }
    isTests: boolean
    networkName: string
    cacheKeyPrefix: string
    endpoints: string[]
}

export type FilterConfig = {
    orConversion: FilterOrConversion
    stringifyKeyInAqlComparison: boolean
}

export type QBocResolverConfig = {
    // S3 compatible service
    s3?: {
        endpoint: string
        region: string
        bucket: string
        accessKey?: string
        secretKey?: string
    }
    // Boc pattern replacement:
    // - `{hash}` will be replaced with boc hash
    pattern?: string
}

export type QBlockchainDataConfig = {
    hotCache?: string
    hotCacheExpiration: number
    hotCacheEmptyDataExpiration: number
    accounts: string[]
    blocks: QDataProviderConfig
    transactions: QDataProviderConfig
    zerostate: string
}

export type QDataProviderConfig = {
    hot: string[]
    archive: string[]
    cache?: string
    cold: string[]
}

export enum SlowQueriesMode {
    ENABLE = "enable",
    REDIRECT = "redirect",
    DISABLE = "disable",
}

export enum RequestsMode {
    TCP_ADNL = "tcpadnl", // via c++ lite-server tcp adnl
    KAFKA = "kafka",
    REST = "rest",
    JRPC = "jrpc",
}

export enum FilterOrConversion {
    OR_OPERATOR = "or-operator",
    SUB_QUERIES = "sub-queries",
}

export enum SubscriptionsMode {
    Disabled = "disabled",
    Arango = "arango",
    External = "external",
}

export const configParams = {
    config: ConfigParam.string("config", "", "Path to JSON configuration file"),
    server: {
        host: ConfigParam.string("host", "{ip}", "Listening address"),
        port: ConfigParam.integer("port", 4000, "Listening port"),
        keepAlive: ConfigParam.integer(
            "keep-alive",
            60000,
            "GraphQL keep alive ms",
        ),
    },
    requests: {
        mode: ConfigParam.string(
            "requests-mode",
            "kafka",
            "Requests mode:\n" +
                "`tcpadnl` – posts external messages to c++ liteserver\n" +
                "`kafka` – writes external messages to kafka topic\n" +
                "`rest` – posts external messages to REST endpoint\n" +
                "`jrpc` – posts external messages to JRPC endpoint",
        ),
        server: ConfigParam.string(
            "requests-server",
            "kafka:9092",
            "Requests server url",
        ),
        pubkey: ConfigParam.string(
            "requests-pubkey",
            "",
            "Liteserver base64 pubkey",
        ),
        topic: ConfigParam.string(
            "requests-topic",
            "requests",
            "Requests topic name",
        ),
        maxSize: ConfigParam.integer(
            "requests-max-size",
            65535,
            "Maximum request message size in bytes",
        ),
    },

    subscriptions: {
        kafkaOptions: {
            server: ConfigParam.string(
                "subscriptions-kafka-server",
                "kafka:9092",
                "Subscriptions server url (for 'external' subscriptions mode)",
            ),
            topic: ConfigParam.string(
                "subscriptions-kafka-topic",
                "subscriptions",
                "Subscriptions topic name (for 'external' subscriptions mode)",
            ),
            maxSize: ConfigParam.integer(
                "subscriptions-max-filter-size",
                65535,
                "Maximum subscription's filter size in bytes (for 'external' subscriptions mode)",
            ),
            keepAliveInterval: ConfigParam.integer(
                "subscriptions-filters-millis",
                30000,
                "Kafka keep alive period for filters in millisecons (for 'external' subscriptions mode)",
            ),
        },
        redisOptions: {
            port: ConfigParam.integer(
                "subscriptions-redis-port",
                6379,
                "Redis port (for 'external' subscriptions mode)",
            ),
            host: ConfigParam.string(
                "subscriptions-redis-host",
                "redis",
                "Redis host (for 'external' subscriptions mode)",
            ),
        },
        healthRedisChannel: ConfigParam.string(
            "subscriptions-health-redis-channel",
            "",
            "Redis channel with 'subscriptions are alive' messages",
        ),
        healthTimeout: ConfigParam.integer(
            "subscriptions-health-timeout",
            60000,
            "Timeout for 'subscriptions are alive' messages",
        ),
    },

    queries: {
        filter: {
            orConversion: ConfigParam.string(
                "filter-or-conversion",
                "sub-queries",
                "Filter OR conversion:\n" +
                    "`or-operator` – q-server uses AQL with OR\n" +
                    "`sub-queries` – q-server performs parallel queries for each OR operand\n" +
                    " and combines results (this option provides faster execution\n" +
                    " than OR operator in AQL)",
            ),
            stringifyKeyInAqlComparison: ConfigParam.boolean(
                "stringify-key-in-aql-comparison",
                false,
                "**UNSTABLE!** If `true` then AQL will use `TO_STRING(doc._key)` conversion\n" +
                    'if _key comparison operator is used in filter (e.g. `{ id: { lt: "123" }`).',
                false,
            ),
        },
        maxRuntimeInS: ConfigParam.integer(
            "query-max-runtime",
            600,
            "Max allowed execution time for ArangoDb queries in seconds",
        ),
        maxTimeout: ConfigParam.integer(
            "query-max-timeout-arg",
            24 * 3600 * 1000,
            "Max allowed `timeout` argument value (is ms) for collections queries\n" +
                "(timeout will be coerced down to this value)",
        ),
        slowQueries: ConfigParam.string(
            "slow-queries",
            "redirect",
            "Slow queries handling:\n" +
                "`enable` – process slow queries on the main database\n" +
                "`redirect` – redirect slow queries to slow-queries database\n" +
                "`disable` – fail on slow queries",
        ),
        waitForPeriod: ConfigParam.integer(
            "query-wait-for-period",
            1000,
            "Initial collection polling period for wait-for queries\n" +
                "(collection queries with timeout) in ms",
        ),
    },
    remp: rempConfigParams,
    useListeners: ConfigParam.boolean(
        "use-listeners",
        true,
        "Use database listeners for subscriptions (deprecated in favor of subscriptions-mode)",
        true,
    ),
    walkingUseCache: ConfigParam.boolean(
        "walking-use-cache",
        false,
        "Use cache to serve block walking algorithm",
    ),
    ignoreMessagesForLatency: ConfigParam.boolean(
        "ignore-messages-for-latency",
        false,
        "Exclude messages from total latency (for networks without service messages)",
    ),
    subscriptionsMode: ConfigParam.string(
        "subscriptions-mode",
        "arango",
        "Subscriptions mode:\n" +
            "`disabled` - disable subscriptions\n" +
            "`arango` - subscribe to ArangoDB WAL for changes\n" +
            "`external` - use external services to handle subscriptions",
    ),
    hot: ConfigParam.databases("hot", "default hot"),
    archive: ConfigParam.databases("archive", "default archive"),
    blockchain: ConfigParam.blockchain(""),
    counterparties: ConfigParam.databases("counterparties"),
    chainRangesVerification: ConfigParam.databases("chain ranges verification"),
    slowQueriesBlockchain: ConfigParam.blockchain("slow queries"),
    blockBocs: ConfigParam.bocResolver("block-bocs"),

    jaeger: {
        endpoint: ConfigParam.string("jaeger-endpoint", "", "Jaeger endpoint"),
        service: ConfigParam.string(
            "trace-service",
            "Q Server",
            "Trace service name",
        ),
        tags: ConfigParam.map(
            "trace-tags",
            {},
            "Additional trace tags (comma separated name=value pairs)",
        ),
    },
    statsd: {
        server: ConfigParam.string(
            "statsd-server",
            "",
            "StatsD server (host:port)",
        ),
        tags: ConfigParam.map(
            "statsd-tags",
            {},
            "Additional StatsD tags (comma separated name=value pairs)",
        ),
        resetInterval: ConfigParam.integer(
            "statsd-reset-interval",
            0,
            "Interval between statsd reconnects.\nIf it is zero – no reconnects.",
        ),
    },
    isTests: ConfigParam.boolean(
        "is-tests",
        false,
        "Determines that q-server runs in unit tests mode.",
    ),
    networkName: ConfigParam.string(
        "network-name",
        "cinet.tonlabs.io",
        "Define the name of the network q-server is working with",
    ),
    cacheKeyPrefix: ConfigParam.string(
        "cache-key-prefix",
        "Q_",
        "Prefix string to identify q-server keys in data cache",
    ),
    endpoints: ConfigParam.array(
        "endpoints",
        [],
        "Alternative endpoints of q-server (comma separated addresses)",
    ),
}

export type QArangoConfig = {
    server: string
    name: string
    auth: string
    maxSockets: number
    listenerRestartTimeout: number
    resultCacheTTL: number
}

export type QMemCachedConfig = {
    server: string
}

const DEFAULT_LISTENER_RESTART_TIMEOUT = 1000
const DEFAULT_RESULT_CACHE_TTL = 0
const DEFAULT_ARANGO_MAX_SOCKETS = 100
const DEFAULT_SLOW_QUERIES_ARANGO_MAX_SOCKETS = 3

// Stats Schema

export const STATS = {
    start: "start",
    prefix: "qserver.",
    doc: {
        count: "doc.count",
    },
    post: {
        count: "post.count",
        failed: "post.failed",
    },
    query: {
        count: "query.count",
        time: "query.time",
        active: "query.active",
        failed: "query.failed",
        slow: "query.slow",
    },
    subscription: {
        count: "subscription.count",
        active: "subscription.active",
    },
    waitFor: {
        active: "waitfor.active",
    },
    errors: {
        internal: "errors.internal",
    },
}

export function ensureProtocol(
    address: string,
    defaultProtocol: string,
): string {
    return /^\w+:\/\//gi.test(address)
        ? address
        : `${defaultProtocol}://${address}`
}

export function readConfigFile(configFile: string): DeepPartial<QConfig> {
    try {
        return JSON.parse(
            readFileSync(configFile).toString(),
        ) as DeepPartial<QConfig>
    } catch (error) {
        console.error("Error while reading config file:", error)
        return {}
    }
}

export function parseArangoConfig(config: string): QArangoConfig {
    const lowerCased = config.toLowerCase().trim()
    const hasProtocol =
        lowerCased.startsWith("http:") || lowerCased.startsWith("https:")
    const url = new URL(hasProtocol ? config : `https://${config}`)
    const protocol = url.protocol || "https:"
    const host =
        url.port || protocol.toLowerCase() === "https:"
            ? url.host
            : `${url.host}:8529`
    const path = url.pathname !== "/" ? url.pathname : ""
    const param = (name: string) => url.searchParams.get(name) || ""
    return {
        server: `${protocol}//${host}${path}`,
        auth: url.username && `${url.username}:${url.password}`,
        name: param("name") || "blockchain",
        maxSockets:
            Number.parseInt(param("maxSockets")) || DEFAULT_ARANGO_MAX_SOCKETS,
        listenerRestartTimeout:
            Number.parseInt(param("listenerRestartTimeout")) ||
            DEFAULT_LISTENER_RESTART_TIMEOUT,
        resultCacheTTL:
            Number.parseInt(param("resultCacheTTL")) ||
            DEFAULT_RESULT_CACHE_TTL,
    }
}

function resolveMaxSockets(config: string, defMaxSockets: number): string {
    const lowerCased = config.toLowerCase().trim()
    const hasProtocol =
        lowerCased.startsWith("http:") || lowerCased.startsWith("https:")
    const url = new URL(hasProtocol ? config : `https://${config}`)
    if ((url.searchParams.get("maxSockets") || "") === "") {
        url.search = `${
            url.search !== "" ? `${url.search}&` : ""
        }maxSockets=${defMaxSockets}`
    }
    return url.toString()
}

function resolveMaxSocketsFor(
    configs: (string[] | undefined)[],
    defMaxSockets: number,
) {
    for (const config of configs) {
        if (config !== undefined) {
            for (let j = 0; j < config.length; j += 1) {
                config[j] = resolveMaxSockets(config[j], defMaxSockets)
            }
        }
    }
}

function checkSubscriptionsConfig(
    config: QConfig,
    specified: ConfigParam<ConfigValue>[],
): void {
    const isUseListenersSpecified = specified.includes(
        configParams.useListeners,
    )
    const isSubscriptionsModeSpecified = specified.includes(
        configParams.subscriptionsMode,
    )
    if (isUseListenersSpecified && isSubscriptionsModeSpecified) {
        throw QError.invalidConfig(
            "Invalid data config: use-listeners mustn't be mixed with subscriptions-mode. Please choose one.",
        )
    }
    if (isUseListenersSpecified) {
        config.subscriptionsMode = config.useListeners
            ? SubscriptionsMode.Arango
            : SubscriptionsMode.Disabled
    }
}

function applyDatabaseDefaults(config: string[], def: string[]) {
    if (config.length === 0 && def.length > 0) {
        config.push(...def)
    }
}

function applyDataProviderDefaults(
    provider: QDataProviderConfig,
    { hot, archive }: QConfig,
) {
    applyDatabaseDefaults(provider.hot, hot)
    applyDatabaseDefaults(provider.archive, archive)
}

export function resolveConfig(
    options: Record<string, ConfigValue>,
    json: DeepPartial<QConfig>,
    env: Record<string, string>,
): QConfig {
    const { config, specified } = ConfigParam.resolveConfig(
        options,
        json,
        env,
        configParams,
    )

    applyDatabaseDefaults(config.blockchain.accounts, config.hot)
    applyDataProviderDefaults(config.blockchain.blocks, config)
    applyDataProviderDefaults(config.blockchain.transactions, config)
    checkSubscriptionsConfig(config, specified)
    // Check all parameters that are enums
    checkEnum("subscriptions-mode", config.subscriptionsMode, SubscriptionsMode)
    checkEnum("slow-queries", config.queries.slowQueries, SlowQueriesMode)
    checkEnum("requests-mode", config.requests.mode, RequestsMode)
    checkEnum(
        "filter-or-conversion",
        config.queries.filter.orConversion,
        FilterOrConversion,
    )

    const slow = config.slowQueriesBlockchain
    if (slow !== undefined) {
        resolveMaxSocketsFor(
            [
                slow.accounts,
                slow.blocks.hot,
                slow.blocks.cold,
                slow.transactions.hot,
                slow.transactions.cold,
            ],
            DEFAULT_SLOW_QUERIES_ARANGO_MAX_SOCKETS,
        )
    }
    if (
        config.blockchain.zerostate === "" &&
        !specified.includes(configParams.blockchain.zerostate)
    ) {
        config.blockchain.zerostate =
            config.blockchain.blocks.hot[0] ??
            config.blockchain.blocks.cold[0] ??
            ""
    }
    return config
}

function checkEnum(
    paramName: string,
    paramValue: string,
    matchedEnum: Record<string, unknown>,
) {
    if (!Object.values(matchedEnum).includes(`${paramValue}`)) {
        throw QError.invalidConfig(
            `Unknown ${paramName}: got ${paramValue}, but expected one of [${Object.values(
                matchedEnum,
            ).join(", ")}]`,
        )
    }
}
