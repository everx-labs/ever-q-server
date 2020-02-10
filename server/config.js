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

export const QRequestsMode = {
    kafka: 'kafka',
    rest: 'rest,'
};

export type QDbConfig = {
    server: string,
    name: string,
    auth: string,
    maxSockets: number,
};

export type QConfig = {
    server: {
        host: string,
        port: number,
    },
    requests: {
        mode: 'kafka' | 'rest',
        server: string,
        topic: string,
    },
    database: QDbConfig,
    slowDatabase: QDbConfig,
    listener: {
        restartTimeout: number
    },
    authorization: {
        endpoint: string,
    },
    jaeger: {
        endpoint: string
    }
}

export function ensureProtocol(address: string, defaultProtocol: string): string {
    return /^\w+:\/\//gi.test(address) ? address : `${defaultProtocol}://${address}`;
}
