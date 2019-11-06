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
import os from 'os';
const program = require('commander');

function getIp(): string {
    const ipv4 = (Object.values(os.networkInterfaces()): any)
        .flatMap(x => x)
        .find(x => x.family === 'IPv4' && !x.internal);
    return ipv4 && ipv4.address;
}

const MODE = {
    production: 'production',
    development: 'development',
};

type ProgramOptions = {
    dbServer: string,
    dbName: string,
    dbVersion: string,
    host: string,
    port: string,
}

program
    .option('-h, --host <host>', 'listening address',
        process.env.Q_SERVER_HOST || getIp())
    .option('-p, --port <port>', 'listening port',
        process.env.Q_SERVER_PORT || '4000')
    .option('-d, --db-server <address>', 'database server:port',
        process.env.Q_DATABASE_SERVER || 'arangodb:8529')
    .option('-n, --db-name <name>', 'database name',
        process.env.Q_DATABASE_NAME || 'blockchain')
    .option('-n, --db-version <version>', 'database schema version',
        process.env.Q_DATABASE_VERSION || '2')
    .parse(process.argv);

const options: ProgramOptions = program;

const env = {
    ssl: (process.env.Q_SSL || '') === 'true',
    database_server: options.dbServer,
    database_name: options.dbName,
    database_version: options.dbVersion,
    server_host: options.host,
    server_port: options.port,
};

export type QConfig = {
    server: {
        host: string,
        port: number,
        ssl: ?{
            port: number,
            key: string,
            cert: string,
        },
    },
    database: {
        server: string,
        name: string,
        version: string,
    },
    listener: {
        restartTimeout: number
    }
}

const config: QConfig = {
    server: {
        host: env.server_host,
        port: Number.parseInt(env.server_port),
        ssl: env.ssl
            ? {
                port: 4001,
                key: 'server/ssl/server.key',
                cert: 'server/ssl/server.crt',
            }
            : null,
    },
    database: {
        server: env.database_server,
        name: env.database_name,
        version: env.database_version,
    },
    listener: {
        restartTimeout: 1000
    }
};

console.log('Using config:', config);
export default config;
