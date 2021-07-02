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

import { createConfig, programOptions, readConfigFile } from './config';
import type { ProgramOption, QConfig } from './config';
import TONQServer from './server';
import QLogs from './logs';

const program = require('commander');

Object.values(programOptions).forEach((value) => {
    const option = ((value: any): ProgramOption);
    program.option(option.option, option.description);
});

program.parse(process.argv);

const configData = program.config ? readConfigFile(program.config) : {};

const config: QConfig = createConfig(
    program, // program args
    configData, // config file
    process.env, // os envs
    programOptions, // defaults
);

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
