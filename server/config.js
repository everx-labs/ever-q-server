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

const env = {
    mode: process.env.Q_MODE || MODE.production,
    ssl: (process.env.Q_SSL || '') === 'true',
    database_server: process.env.Q_DATABASE_SERVER || 'arangodb:8529',
    database_name: process.env.Q_DATABASE_NAME || 'blockchain',
    server_host: process.env.Q_SERVER_HOST || getIp(),
    server_port: Number(process.env.Q_SERVER_PORT || 4000),
};

export type QConfig = {
    MODE: { production: string, development: string },
    mode: string,
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
        name: string
    },
    listener: {
        restartTimeout: number
    }
}

const config: QConfig = {
    MODE,
    mode: env.mode,
    server: {
        host: env.server_host,
        port: env.server_port,
        ssl: env.ssl
            ? {
                port: 4001,
                key: 'server/ssl/server.key',
                cert: 'server/ssl/server.crt',
            }
            : null,
    },
    database: {
        server: env.mode === MODE.production ? env.database_server : 'services.tonlabs.io:8529',
        name: env.database_name
    },
    listener: {
        restartTimeout: 1000
    }
};

export default config;
