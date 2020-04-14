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

import type { QConfig } from "./config";
import TONQServer from './server';
import QLogs from './logs';

import os from 'os';

const program = require('commander');

function getIp(): string {
    const ipv4 = (Object.values(os.networkInterfaces()): any)
        .flatMap(x => x)
        .find(x => x.family === 'IPv4' && !x.internal);
    return ipv4 && ipv4.address;
}

type ProgramOptions = {
    requestsMode: 'kafka' | 'rest',
    requestsServer: string,
    requestsTopic: string,
    dbServer: string,
    dbName: string,
    dbAuth: string,
    dbMaxSockets: string,
    slowDbServer: string,
    slowDbName: string,
    slowDbAuth: string,
    slowDbMaxSockets: string,
    host: string,
    port: string,
    rpcPort: string,
    jaegerEndpoint: string,
    traceService: string,
    traceTags: string,
    authEndpoint: string,
    statsdServer: string,
    mamAccessKeys: string,
}

program
    .option('-h, --host <host>', 'listening address',
        process.env.Q_SERVER_HOST || getIp())
    .option('-p, --port <port>', 'listening port',
        process.env.Q_SERVER_PORT || '4000')
    .option('--rpc-port <port>', 'listening rpc port',
        process.env.Q_SERVER_RPC_PORT || '')

    .option('-m, --requests-mode <mode>', 'Requests mode (kafka | rest)',
        process.env.Q_REQUESTS_MODE || 'kafka')
    .option('-r, --requests-server <url>', 'Requests server url',
        process.env.Q_REQUESTS_SERVER || 'kafka:9092')
    .option('-t, --requests-topic <name>', 'Requests topic name',
        process.env.Q_REQUESTS_TOPIC || 'requests')

    .option('-d, --db-server <address>', 'database server:port',
        process.env.Q_DATABASE_SERVER || 'arangodb:8529')
    .option('-n, --db-name <name>', 'database name',
        process.env.Q_DATABASE_NAME || 'blockchain')
    .option('-a, --db-auth <name>', 'database auth in form "user:password',
        process.env.Q_DATABASE_AUTH || '')
    .option('--db-max-sockets <number>', 'database max sockets',
        process.env.Q_DATABASE_MAX_SOCKETS || '100')

    .option('--slow-db-server <address>', 'slow queries database server:port',
        process.env.Q_SLOW_DATABASE_SERVER || '')
    .option('--slow-db-name <name>', 'slow database name',
        process.env.Q_SLOW_DATABASE_NAME || '')
    .option('--slow-db-auth <name>', 'slow database auth in form "user:password',
        process.env.Q_SLOW_DATABASE_AUTH || '')
    .option('--slow-db-max-sockets <number>', 'slow database max sockets',
        process.env.Q_SLOW_DATABASE_MAX_SOCKETS || '3')

    .option('--auth-endpoint <url>', 'auth endpoint',
        process.env.AUTH_ENDPOINT || '')
    .option('--mam-access-keys <keys>', 'Access keys used to authorize mam endpoint access',
        process.env.MAM_ACCESS_KEYS || '')

    .option('-j, --jaeger-endpoint <url>', 'jaeger endpoint',
        process.env.JAEGER_ENDPOINT || '')
    .option('--trace-service <name>', 'trace service name',
        process.env.Q_TRACE_SERVICE || 'Q Server')
    .option('--trace-tags <tags>', 'additional trace tags (comma separated name=value pairs)',
        process.env.Q_TRACE_TAGS || '')

    .option('-s, --statsd-server <url>', 'statsd server (host:port)',
        process.env.Q_STATSD_SERVER || '')

    .parse(process.argv);

const options: ProgramOptions = program;

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
const config: QConfig = {
    server: {
        host: options.host,
        port: Number.parseInt(options.port),
        rpcPort: options.rpcPort,
    },
    requests: {
        mode: options.requestsMode,
        server: options.requestsServer,
        topic: options.requestsTopic,
    },
    database: {
        server: options.dbServer,
        name: options.dbName,
        auth: options.dbAuth,
        maxSockets: Number(options.dbMaxSockets),
    },
    slowDatabase: {
        server: options.slowDbServer || options.dbServer,
        name: options.slowDbName || options.dbName,
        auth: options.slowDbAuth || options.dbAuth,
        maxSockets: Number(options.slowDbMaxSockets),
    },
    listener: {
        restartTimeout: 1000
    },
    authorization: {
        endpoint: options.authEndpoint,
    },
    jaeger: {
        endpoint: options.jaegerEndpoint,
        service: options.traceService,
        tags: parseTags(options.traceTags),
    },
    statsd: {
        server: options.statsdServer,
    },
    mamAccessKeys: new Set((options.mamAccessKeys || '').split(',')),
};

const logs = new QLogs();
const configLog = logs.create('config');
configLog.debug('USE', config);

const server = new TONQServer({
    config,
    logs,
});

export function main() {
    (async () => {
        try {
            await server.start();
        } catch (error) {
            server.log.error('FAILED', 'START', error);
            process.exit(1);
        }
    })();
}
