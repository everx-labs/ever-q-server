/*
 * Copyright 2018-2019 TON DEV SOLUTIONS LTD.
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
    dbName: string,
    dbServer: string,
    dbName: string,
    dbAuth: string,
    dbVersion: string,
    host: string,
    port: string,
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
    .option('-n, --db-version <version>', 'database schema version',
        process.env.Q_DATABASE_VERSION || '2')
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
        version: options.dbVersion,
    },
    listener: {
        restartTimeout: 1000
    }
};

console.log('Using config:', config);

const server = new TONQServer({
    config,
    logs: new QLogs(),
});

export function main() {
    (async () => {
        try {
            await server.start();
        } catch (error) {
            server.log.error('Start failed:', error);
            process.exit(1);
        }
    })();
}
