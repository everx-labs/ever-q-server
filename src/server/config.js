/*
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

import os from 'os';

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
};

export type QConfig = {
    server: {
        host: string,
        port: number,
        keepAlive: number,
    },
    requests: {
        mode: 'kafka' | 'rest',
        server: string,
        topic: string,
    },
    data: QDataProvidersConfig,
    slowQueriesData: QDataProvidersConfig,
    authorization: {
        endpoint: string,
    },
    jaeger: {
        endpoint: string,
        service: string,
        tags: { [string]: string }
    },
    statsd: {
        server: string,
        tags: string[],
    },
    mamAccessKeys: Set<string>,
    isTests?: boolean,
    networkName: string,
    cacheKeyPrefix: string,
}

export type ProgramOption = {
    option: string,
    env: string,
    def: string,
    description: string,
};
export type ProgramOptions = { [string]: ProgramOption };

const DEFAULT_LISTENER_RESTART_TIMEOUT = 1000;
const DEFAULT_ARANGO_MAX_SOCKETS = 100;
const DEFAULT_SLOW_QUERIES_ARANGO_MAX_SOCKETS = 3;

export const requestsMode = {
    kafka: 'kafka',
    rest: 'rest',
};

export const programOptions: ProgramOptions = {};

const toPascal = s => `${s[0].toUpperCase()}${s.substr(1).toLowerCase()}`;

const opt = (option: string, def: string, description: string) => {
    const words = option.split('-');
    const name = `${words[0]}${words.slice(1).map(toPascal).join('')}`;
    const env = `Q_${words.map(x => x.toUpperCase()).join('_')}`;
    programOptions[name] = {
        option: `--${option} <value>`,
        env,
        def,
        description: `${description}${def && ` (default: "${def}")`}`,
    }
};

const dataOpt = (prefix: string) => {
    const o = name => `${prefix.toLowerCase().split(' ').join('-')}-${name}`;
    const d = text => `${toPascal(prefix)} ${text}`;

    opt(o('mut'), 'arangodb', d('mutable db config url'));
    opt(o('hot'), 'arangodb', d('hot db config url'));
    opt(o('cold'), '', d('cold db config urls (comma separated)'));
    opt(o('cache'), '', d('cache config url'));
}

opt('host', getIp(), 'Listening address');
opt('port', '4000', 'Listening port');
opt('keep-alive', '60000', 'GraphQL keep alive ms');

opt('requests-mode', 'kafka', 'Requests mode (kafka | rest)');
opt('requests-server', 'kafka:9092', 'Requests server url');
opt('requests-topic', 'requests', 'Requests topic name');

dataOpt('data');
dataOpt('slow queries');

opt('auth-endpoint', '', 'Auth endpoint');
opt('mam-access-keys', '', 'Access keys used to authorize mam endpoint access');

opt('jaeger-endpoint', '', 'Jaeger endpoint');
opt('trace-service', 'Q Server', 'Trace service name');
opt('trace-tags', '', 'Additional trace tags (comma separated name=value pairs)');

opt('statsd-server', '', 'StatsD server (host:port)');
opt('statsd-tags', '', 'Additional StatsD tags (comma separated name=value pairs)');

opt('network-name', 'cinet.tonlabs.io', 'Define the name of the network q-server is working with');

opt('cache-key-prefix', 'Q_', 'Prefix string to identify q-server keys in datacache');

// Stats Schema

export const STATS = {
    start: 'start',
    prefix: 'qserver.',
    doc: {
        count: 'doc.count',
    },
    post: {
        count: 'post.count',
        failed: 'post.failed',
    },
    query: {
        count: 'query.count',
        time: 'query.time',
        active: 'query.active',
        failed: 'query.failed',
        slow: 'query.slow',
    },
    subscription: {
        active: 'subscription.active',
    },
    waitFor: {
        active: 'waitfor.active',
    },
};


export function ensureProtocol(address: string, defaultProtocol: string): string {
    return /^\w+:\/\//gi.test(address) ? address : `${defaultProtocol}://${address}`;
}

export function parseArangoConfig(config: string, defMaxSockets: number): QArangoConfig {
    const lowerCased = config.toLowerCase().trim();
    const hasProtocol = lowerCased.startsWith('http:') || lowerCased.startsWith('https:');
    const url = new URL(hasProtocol ? config : `https://${config}`);
    const protocol = url.protocol || 'https:';
    const host = (url.port || protocol.toLowerCase() === 'https:') ? url.host : `${url.host}:8529`;
    const path = url.pathname !== '/' ? url.pathname : '';
    const param = name => url.searchParams.get(name) || '';
    return {
        server: `${protocol}//${host}${path}`,
        auth: url.username && `${url.username}:${url.password}`,
        name: param('name') || 'blockchain',
        maxSockets: Number.parseInt(param('maxSockets')) || defMaxSockets,
        listenerRestartTimeout: Number.parseInt(param('listenerRestartTimeout')) || DEFAULT_LISTENER_RESTART_TIMEOUT,
    }
}

export function parseMemCachedConfig(config: string): QMemCachedConfig {
    return {
        server: config,
    }
}

export function overrideDefs(options: ProgramOptions, defs: any): ProgramOptions {
    const resolved = {};
    Object.entries(options).forEach(([name, value]) => {
        const opt = ((value: any): ProgramOption);
        resolved[name] = {
            ...opt,
            def: defs[name] || opt.def,
        };
    });
    return resolved;
}

export function resolveValues(values: any, env: any, def: ProgramOptions): any {
    const resolved = {};
    Object.entries(def).forEach(([name, value]) => {
        const opt = ((value: any): ProgramOption);
        resolved[name] = values[name] || env[opt.env] || def[name].def;
    });
    return resolved;
}

export function createConfig(
    values: any,
    env: any,
    def: ProgramOptions,
): QConfig {
    const resolved = resolveValues(values, env, def);
    const { data, slowQueriesData, networkName, cacheKeyPrefix } = parseDataConfig(resolved);
    return {
        server: {
            host: resolved.host,
            port: Number.parseInt(resolved.port),
            keepAlive: Number.parseInt(resolved.keepAlive),
        },
        requests: {
            mode: resolved.requestsMode,
            server: resolved.requestsServer,
            topic: resolved.requestsTopic,
        },
        data,
        slowQueriesData,
        authorization: {
            endpoint: resolved.authEndpoint,
        },
        mamAccessKeys: new Set((resolved.mamAccessKeys || '').split(',')),
        jaeger: {
            endpoint: resolved.jaegerEndpoint,
            service: resolved.traceService,
            tags: parseTags(resolved.traceTags),
        },
        statsd: {
            server: resolved.statsdServer,
            tags: (resolved.statsdTags || '').split(',').map(x => x.trim()).filter(x => x),
        },
        networkName,
        cacheKeyPrefix,
    };
}

// Internals

function getIp(): string {
    const ipv4 = (Object.values(os.networkInterfaces()): any)
        .reduce((acc, x) => acc.concat(x), [])
        .find(x => x.family === 'IPv4' && !x.internal);
    return ipv4 && ipv4.address;
}


function parseTags(s: string): { [string]: string } {
    const tags: { [string]: string } = {};
    s.split(',').forEach((t) => {
        const i = t.indexOf('=');
        if (i >= 0) {
            tags[t.substr(0, i)] = t.substr(i + 1);
        } else {
            tags[t] = '';
        }
    });
    return tags;

}


export function parseDataConfig(values: any): {
    data: QDataProvidersConfig,
    slowQueriesData: QDataProvidersConfig,
    networkName: string,
    cacheKeyPrefix: string,
} {
    function parse(prefix: string, defMaxSockets: number): QDataProvidersConfig {
        const opt = (suffix: string): string => values[`${prefix}${suffix}`] || '';
        return {
            mut: parseArangoConfig(opt('Mut'), defMaxSockets),
            hot: parseArangoConfig(opt('Hot'), defMaxSockets),
            cold: opt('Cold').split(',').filter(x => x).map(x => parseArangoConfig(x, defMaxSockets)),
            cache: parseMemCachedConfig(opt('Cache')),
        }
    }

    const { networkName, cacheKeyPrefix } = values;

    return {
        data: parse('data', DEFAULT_ARANGO_MAX_SOCKETS),
        slowQueriesData: parse('slowQueries', DEFAULT_SLOW_QUERIES_ARANGO_MAX_SOCKETS),
        networkName,
        cacheKeyPrefix,
    };
}
