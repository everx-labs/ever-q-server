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

import {URL} from "url";
import {readFileSync} from "fs";
import {
    ConfigParam,
    ConfigValue,
    DeepPartial,
} from "./config-param";

export type QConfig = {
    config: string,
    filter: FilterConfig,
    server: {
        host: string,
        port: number,
        keepAlive: number,
    },
    requests: {
        mode: RequestsMode,
        server: string,
        topic: string,
        maxSize: number,
    },
    blockchain: QBlockchainDataConfig,
    counterparties: string[],
    chainRangesVerification: string[],

    slowQueries: SlowQueriesMode,
    slowQueriesBlockchain?: QBlockchainDataConfig,

    data?: QDeprecatedDataConfig,
    slowQueriesData?: QDeprecatedDataConfig,

    authorization: {
        endpoint: string,
    },
    jaeger: {
        endpoint: string,
        service: string,
        tags: Record<string, string>,
    },
    statsd: {
        server: string,
        tags: string[],
        resetInterval: number,
    },
    mamAccessKeys: string[],
    isTests: boolean,
    networkName: string,
    cacheKeyPrefix: string,
    endpoints: string[],
};


export const configParams = {
    config: ConfigParam.string("config", "", "Path to JSON configuration file"),
    filter: {
        orConversion: ConfigParam.string(
            "filter-or-conversion",
            "sub-queries",
            "Filter OR conversion (or-operator | sub-queries)",
        ),
    },
    server: {
        host: ConfigParam.string("host", "{ip}", "Listening address"),
        port: ConfigParam.integer("port", 4000, "Listening port"),
        keepAlive: ConfigParam.integer("keep-alive", 60000, "GraphQL keep alive ms"),
    },
    requests: {
        mode: ConfigParam.string("requests-mode", "kafka", "Requests mode (kafka | rest)"),
        server: ConfigParam.string("requests-server", "kafka:9092", "Requests server url"),
        topic: ConfigParam.string("requests-topic", "requests", "Requests topic name"),
        maxSize: ConfigParam.integer("requests-max-size", 16383, "Maximum request message size in bytes"),
    },
    blockchain: ConfigParam.blockchain(""),
    counterparties: ConfigParam.databases("counterparties"),
    chainRangesVerification: ConfigParam.databases("chain ranges verification"),

    slowQueries: ConfigParam.string(
        "slow-queries",
        "redirect",
        "Slow queries handling (enable | redirect | disable)",
    ),
    slowQueriesBlockchain: ConfigParam.blockchain("slow queries"),

    data: ConfigParam.dataDeprecated("data"),
    slowQueriesData: ConfigParam.dataDeprecated("slow-queries"),

    authorization: {
        endpoint: ConfigParam.string("auth-endpoint", "", "Auth endpoint"),
    },
    jaeger: {
        endpoint: ConfigParam.string("jaeger-endpoint", "", "Jaeger endpoint"),
        service: ConfigParam.string("trace-service", "Q Server", "Trace service name"),
        tags: ConfigParam.map(
            "trace-tags",
            {},
            "Additional trace tags (comma separated name=value pairs)",
        ),
    },
    statsd: {
        server: ConfigParam.string("statsd-server", "", "StatsD server (host:port)"),
        tags: ConfigParam.map(
            "statsd-tags",
            {},
            "Additional StatsD tags (comma separated name=value pairs)",
        ),
        resetInterval: ConfigParam.integer(
            "statsd-reset-interval",
            0,
            "Interval in ms between recreations of the StatsD socket",
        ),
    },
    mamAccessKeys: ConfigParam.array(
        "mam-access-keys",
        [],
        "Access keys used to authorize mam endpoint access",
    ),
    isTests: ConfigParam.boolean("is-tests", false, ""),
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
};


export type QArangoConfig = {
    server: string,
    name: string,
    auth: string,
    maxSockets: number,
    listenerRestartTimeout: number;
};

export type QMemCachedConfig = {
    server: string,
};

export type QHotColdDataConfig = {
    hot: string[],
    cache?: string,
    cold: string[],
};

export type QBlockchainDataConfig = {
    accounts: string[],
    blocks: QHotColdDataConfig,
    transactions: QHotColdDataConfig,
};

export type QDeprecatedDataConfig = {
    mut?: string;
    hot?: string;
    cold?: string[];
    cache?: string;
    counterparties?: string;
};

export enum SlowQueriesMode {
    ENABLE = "enable",
    REDIRECT = "redirect",
    DISABLE = "disable"
}

export enum RequestsMode {
    KAFKA = "kafka",
    REST = "rest",
}

export enum FilterOrConversion {
    OR_OPERATOR = "or-operator",
    SUB_QUERIES = "sub-queries",
}

export type FilterConfig = {
    orConversion: FilterOrConversion,
};

const DEFAULT_LISTENER_RESTART_TIMEOUT = 1000;
const DEFAULT_ARANGO_MAX_SOCKETS = 100;
const DEFAULT_SLOW_QUERIES_ARANGO_MAX_SOCKETS = 3;

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
};


export function ensureProtocol(address: string, defaultProtocol: string): string {
    return /^\w+:\/\//gi.test(address) ? address : `${defaultProtocol}://${address}`;
}

export function readConfigFile(configFile: string): DeepPartial<QConfig> {
    try {
        return JSON.parse(readFileSync(configFile).toString()) as DeepPartial<QConfig>;
    } catch (error) {
        console.error("Error while reading config file:", error);
        return {};
    }
}

export function parseArangoConfig(config: string): QArangoConfig {
    const lowerCased = config.toLowerCase().trim();
    const hasProtocol = lowerCased.startsWith("http:") || lowerCased.startsWith("https:");
    const url = new URL(hasProtocol ? config : `https://${config}`);
    const protocol = url.protocol || "https:";
    const host = (url.port || protocol.toLowerCase() === "https:") ? url.host : `${url.host}:8529`;
    const path = url.pathname !== "/" ? url.pathname : "";
    const param = (name: string) => url.searchParams.get(name) || "";
    return {
        server: `${protocol}//${host}${path}`,
        auth: url.username && `${url.username}:${url.password}`,
        name: param("name") || "blockchain",
        maxSockets: Number.parseInt(param("maxSockets")) || DEFAULT_ARANGO_MAX_SOCKETS,
        listenerRestartTimeout: Number.parseInt(param("listenerRestartTimeout")) || DEFAULT_LISTENER_RESTART_TIMEOUT,
    };
}

function resolveMaxSockets(config: string, defMaxSockets: number): string {
    const lowerCased = config.toLowerCase().trim();
    const hasProtocol = lowerCased.startsWith("http:") || lowerCased.startsWith("https:");
    const url = new URL(hasProtocol ? config : `https://${config}`);
    if ((url.searchParams.get("maxSockets") || "") === "") {
        url.search = `${url.search !== "" ? `${url.search}&` : ""}maxSockets=${defMaxSockets}`;
    }
    return url.toString();
}

function resolveMaxSocketsFor(configs: (string[] | undefined)[], defMaxSockets: number) {
    for (const config of configs) {
        if (config !== undefined) {
            for (let j = 0; j < config.length; j += 1) {
                config[j] = resolveMaxSockets(config[j], defMaxSockets);
            }
        }
    }
}

function upgradeDatabases(deprecated: string | undefined): string[] {
    return (deprecated ?? "")
        .split(",")
        .map(x => x.trim())
        .filter(x => x !== "");
}

function upgradeHotCold(deprecated: QDeprecatedDataConfig, def: string | undefined): QHotColdDataConfig {
    return {
        hot: upgradeDatabases(deprecated.hot || def),
        cache: deprecated.cache,
        cold: deprecated.cold ?? [],
    };
}

function upgradeBlockchain(deprecated: QDeprecatedDataConfig): QBlockchainDataConfig {
    return {
        accounts: upgradeDatabases(deprecated.mut),
        blocks: upgradeHotCold(deprecated, deprecated.mut),
        transactions: upgradeHotCold(deprecated, deprecated.mut),
    };
}

export function resolveConfig(
    options: Record<string, ConfigValue>,
    json: DeepPartial<QConfig>,
    env: Record<string, string>,
): QConfig {
    const config = ConfigParam.resolveConfig(options, json, env, configParams);
    if (config.data) {
        config.blockchain = upgradeBlockchain(config.data);
        config.counterparties = upgradeDatabases(config.data.counterparties);
    }
    if (config.slowQueriesData) {
        config.slowQueriesBlockchain = upgradeBlockchain(config.slowQueriesData);
    }
    const slow = config.slowQueriesBlockchain;
    if (slow !== undefined) {
        resolveMaxSocketsFor([
            slow.accounts,
            slow.blocks.hot,
            slow.blocks.cold,
            slow.transactions.hot,
            slow.transactions.cold,
        ], DEFAULT_SLOW_QUERIES_ARANGO_MAX_SOCKETS);
    }
    return config;
}


