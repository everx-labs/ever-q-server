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

import os from "os";
import { URL } from "url";
import { readFileSync } from "fs";

// Config Schema

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

export type QDataProvidersConfig = {
    mut: QArangoConfig;
    hot: QArangoConfig;
    cold: QArangoConfig[];
    cache: QMemCachedConfig;
    counterparties: QArangoConfig;
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

export type QConfig = {
    config: string,
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
    data: QDataProvidersConfig,
    slowQueries: SlowQueriesMode,
    slowQueriesData: QDataProvidersConfig,
    authorization: {
        endpoint: string,
    },
    jaeger: {
        endpoint: string,
        service: string,
        tags: { [name: string]: string }
    },
    statsd: {
        server: string,
        tags: string[],
        resetInterval: number,
    },
    mamAccessKeys: Set<string>,
    isTests?: boolean,
    networkName: string,
    cacheKeyPrefix: string,
    endpoints: string[],
};

export type ProgramOption = {
    option: string,
    env: string,
    def: string,
    description: string,
};
export type ProgramOptions = Record<string, ProgramOption>;

const DEFAULT_LISTENER_RESTART_TIMEOUT = 1000;
const DEFAULT_ARANGO_MAX_SOCKETS = 100;
const DEFAULT_SLOW_QUERIES_ARANGO_MAX_SOCKETS = 3;

export const programOptions: ProgramOptions = {};

const toPascal = (s: string) => `${s[0].toUpperCase()}${s.substr(1).toLowerCase()}`;

const opt = (option: string, def: string, description: string) => {
    const words = option.split("-");
    const name = `${words[0]}${words.slice(1).map(toPascal).join("")}`;
    const env = `Q_${words.map(x => x.toUpperCase()).join("_")}`;
    programOptions[name] = {
        option: `--${option} <value>`,
        env,
        def,
        description: `${description}${def && ` (default: "${def}")`}`,
    };
};

const dataOpt = (prefix: string) => {
    const o = (name: string) => `${prefix.toLowerCase().split(" ").join("-")}-${name}`;
    const d = (text: string) => `${toPascal(prefix)} ${text}`;

    opt(o("mut"), "arangodb", d("mutable db config url"));
    opt(o("hot"), "arangodb", d("hot db config url"));
    opt(o("cold"), "", d("cold db config urls (comma separated)"));
    opt(o("cache"), "", d("cache config url"));
    opt(o("counterparties"), "", d("counterparties db config url"));
};

opt("host", getIp(), "Listening address");
opt("port", "4000", "Listening port");
opt("keep-alive", "60000", "GraphQL keep alive ms");

opt("config", "", "Path to JSON configuration file");

opt("requests-mode", RequestsMode.KAFKA, "Requests mode (kafka | rest)");
opt("requests-server", "kafka:9092", "Requests server url");
opt("requests-topic", "requests", "Requests topic name");
opt("requests-max-size", "16383", "Maximum request message size in bytes");

opt("slow-queries", SlowQueriesMode.REDIRECT, "Slow queries handling (enable | redirect | disable)");

dataOpt("data");
dataOpt("slow queries");

opt("auth-endpoint", "", "Auth endpoint");
opt("mam-access-keys", "", "Access keys used to authorize mam endpoint access");

opt("jaeger-endpoint", "", "Jaeger endpoint");
opt("trace-service", "Q Server", "Trace service name");
opt("trace-tags", "", "Additional trace tags (comma separated name=value pairs)");

opt("statsd-server", "", "StatsD server (host:port)");
opt("statsd-tags", "", "Additional StatsD tags (comma separated name=value pairs)");
opt("statsd-reset-interval", "", "Interval in ms between recreations of the StatsD socket");

opt("network-name", "cinet.tonlabs.io", "Define the name of the network q-server is working with");

opt("cache-key-prefix", "Q_", "Prefix string to identify q-server keys in data cache");

opt("endpoints", "", "Alternative endpoints of q-server (comma separated addresses)");

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

export function readConfigFile(configFile: string): Record<string, unknown> {
    try {
        const config = JSON.parse(readFileSync(configFile).toString());
        return {
            Q_ENDPOINTS: config.endpoints.join(","),
            Q_HOST: config.server?.host,
            Q_PORT: config.server?.port,
            Q_KEEP_ALIVE: config.server?.keepAlive,
            // Q_CONFIG -- doesn't make sense here
            Q_REQUESTS_MODE: config.requests?.mode,
            Q_REQUESTS_SERVER: config.requests?.server,
            Q_REQUESTS_TOPIC: config.requests?.topic,
            Q_REQUESTS_MAX_SIZE: config.requests?.maxSize,
            Q_DATA_MUT: config.data?.mut,
            Q_DATA_HOT: config.data?.hot,
            Q_DATA_COLD: config.data?.cold.join(","),
            Q_DATA_CACHE: config.data?.cache,
            Q_DATA_COUNTERPARTIES: config.data?.counterparties,
            Q_SLOW_QUERIES: config.slowQueries?.mode,
            Q_SLOW_QUERIES_MUT: config.slowQueries?.mut,
            Q_SLOW_QUERIES_HOT: config.slowQueries?.hot,
            Q_SLOW_QUERIES_COLD: config.slowQueries?.cold.join(","),
            Q_SLOW_QUERIES_CACHE: config.slowQueries?.cache,
            Q_AUTH_ENDPOINT: config.authEndpoint,
            Q_MAM_ACCESS_KEYS: config.mamAccessKeys,
            Q_JAEGER_ENDPOINT: config.jaegerEndpoint,
            Q_TRACE_SERVICE: config.trace?.service,
            Q_TRACE_TAGS: config.trace?.tags.join(","),
            Q_STATSD_SERVER: config.statsd?.server,
            Q_STATSD_TAGS: config.statsd?.tags.join(","),
            Q_STATSD_RESET_INTERVAL: config.statsd?.resetInterval,
        };
    } catch (error) {
        console.error("Error while reading config file:", error);
        return {};
    }
}

function parseArangoEndpoint(config: string, defMaxSockets: number): QArangoConfig {
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
        maxSockets: Number.parseInt(param("maxSockets")) || defMaxSockets,
        listenerRestartTimeout: Number.parseInt(param("listenerRestartTimeout")) || DEFAULT_LISTENER_RESTART_TIMEOUT,
    };
}

function parseArangoEndpointList(config: string, defMaxSockets: number): QArangoConfig[] {
    return config
        .split(",")
        .filter(x => x.trim() !== "")
        .map(x => parseArangoEndpoint(x, defMaxSockets));
}

export function parseArangoConfig(config: string, defMaxSockets: number): QArangoConfig {
    return parseArangoEndpointList(config, defMaxSockets)[0]
        || parseArangoEndpoint("", defMaxSockets);
}

export function parseMemCachedConfig(config: string): QMemCachedConfig {
    return {
        server: config,
    };
}

export function overrideDefs(options: ProgramOptions, defs: Record<string, unknown>): ProgramOptions {
    const resolved: ProgramOptions = {};
    Object.entries(options).forEach(([name, value]) => {
        const opt = value;
        resolved[name] = {
            ...opt,
            def: (defs[name] ?? opt.def) as string,
        };
    });
    return resolved;
}

export function resolveValues(
    values: Record<string, unknown>,
    configFile: Record<string, unknown>,
    env: Record<string, unknown>,
    def: ProgramOptions,
): Record<string, string> {
    const resolved: Record<string, string> = {};
    Object.entries(def).forEach(([name, opt]) => {
        resolved[name] = `${values[name] ?? configFile[opt.env] ?? env[opt.env] ?? def[name].def}`;
    });
    return resolved;
}

export function createConfig(
    values: Record<string, unknown>,
    configFile: Record<string, unknown>,
    env: Record<string, unknown>,
    def: ProgramOptions,
): QConfig {
    const resolved = resolveValues(values, configFile, env, def);
    const {
        data,
        slowQueriesData,
        networkName,
        cacheKeyPrefix,
    } = parseDataConfig(resolved);

    return {
        config: resolved.config as string,
        server: {
            host: resolved.host as string,
            port: Number.parseInt(resolved.port),
            keepAlive: Number.parseInt(resolved.keepAlive),
        },
        requests: {
            mode: resolved.requestsMode as RequestsMode,
            server: resolved.requestsServer,
            topic: resolved.requestsTopic,
            maxSize: Number.parseInt(resolved.requestsMaxSize),
        },
        data,
        slowQueries: resolved.slowQueries as SlowQueriesMode,
        slowQueriesData,
        authorization: {
            endpoint: resolved.authEndpoint,
        },
        mamAccessKeys: new Set((resolved.mamAccessKeys || "").split(",")),
        jaeger: {
            endpoint: resolved.jaegerEndpoint,
            service: resolved.traceService,
            tags: parseTags(resolved.traceTags),
        },
        statsd: {
            resetInterval: Number.parseInt(resolved.statsdResetInterval) || 0,
            server: resolved.statsdServer,
            tags: ((resolved.statsdTags ?? "").split(",") as string[]).map(x => x.trim()).filter(x => x),
        },
        networkName,
        cacheKeyPrefix,
        endpoints: ((resolved.endpoints ?? "").split(",") as string[]).map(x => x.trim()).filter(x => x),
    };
}

// Internals

function getIp(): string {
    for (const networkInterfaces of Object.values(os.networkInterfaces())) {
        if (networkInterfaces !== undefined) {
            for (const networkInterface of networkInterfaces) {
                if (networkInterface.family === "IPv4" && !networkInterface.internal) {
                    return networkInterface.address;
                }
            }
        }
    }
    return "";
}


function parseTags(s: string): { [name: string]: string } {
    const tags: { [name: string]: string } = {};
    s.split(",").forEach((t) => {
        const i = t.indexOf("=");
        if (i >= 0) {
            tags[t.substr(0, i)] = t.substr(i + 1);
        } else {
            tags[t] = "";
        }
    });
    return tags;

}


export function parseDataConfig(values: Record<string, string>): {
    data: QDataProvidersConfig,
    slowQueriesData: QDataProvidersConfig,
    networkName: string,
    cacheKeyPrefix: string,
} {
    function parse(prefix: string, defMaxSockets: number): QDataProvidersConfig {
        const opt = (suffix: string): string => values[`${prefix}${suffix}`] ?? "";
        const mut = parseArangoConfig(opt("Mut"), defMaxSockets);
        const hot = parseArangoConfig(opt("Hot"), defMaxSockets);
        const cold = parseArangoEndpointList(opt("Cold"), defMaxSockets);
        const cache = parseMemCachedConfig(opt("Cache"));
        const counterpartiesOpt = opt("Counterparties");
        const counterparties = counterpartiesOpt
            ? parseArangoConfig(counterpartiesOpt, defMaxSockets)
            : mut;
        return {
            mut,
            hot,
            cold,
            cache,
            counterparties,
        };
    }

    const {
        networkName,
        cacheKeyPrefix,
    } = values;

    return {
        data: parse("data", DEFAULT_ARANGO_MAX_SOCKETS),
        slowQueriesData: parse("slowQueries", DEFAULT_SLOW_QUERIES_ARANGO_MAX_SOCKETS),
        networkName,
        cacheKeyPrefix,
    };
}
