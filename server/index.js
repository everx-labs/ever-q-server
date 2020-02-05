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
    jaegerEndpoint: string,
}

program
    .option('-h, --host <host>', 'listening address',
        process.env.Q_SERVER_HOST || getIp())
    .option('-p, --port <port>', 'listening port',
        process.env.Q_SERVER_PORT || '4000')

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

    .option('--auth-server <address>', 'auth-service address',
        process.env.AUTH_SERVER || '127.0.0.1')
    .option('--auth-port <port>', 'auth-service port',
        process.env.AUTH_PORT || '8888')
    .option('--q-server-id <name>', 'This server id',
        process.env.Q_SERVER_ID || '1')

    .option('-j, --jaeger-endpoint <host>', 'jaeger collector host',
        process.env.JAEGER_ENDPOINT || '')
    .parse(process.argv);

const options: ProgramOptions = program;

const config: QConfig = {
    server: {
        host: options.host,
        port: Number.parseInt(options.port),
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
        server: options.authServer,
        port: options.authPort,
        this_server_id: options.qServerId,
    },
    jaeger: {
        endpoint: options.jaegerEndpoint
    }
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
