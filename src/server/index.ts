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

import program from "commander";
import type { QConfig } from "./config";
import {
    createConfig,
    programOptions, readConfigFile
} from "./config";
import type { QLog } from "./logs";
import QLogs from "./logs";
import TONQServer from "./server";


Object.values(programOptions).forEach((value) => {
    const option = value;
    program.option(option.option, option.description);
});

program.parse(process.argv);

type GlobalState = {
    reloadLock: boolean,
    server?: TONQServer,
    config?: QConfig,
    logs?: QLogs,
    configLog?: QLog,
    configPath?: string,
};

// used mainly for config reload purpose
// helps to avoid potential closures chain
const gs: GlobalState = {
    reloadLock: false,
    server: undefined,
    config: undefined,
    logs: undefined,
    configLog: undefined,
    configPath: program.config || process.env.Q_CONFIG,
};

process.on("SIGHUP", () => {
    /**
     * WARNING: while multiple simultaneous SIGHUP calls
     * we ignore new SIGHUP signals until the last reload handler finished
     * but since we don't wait until server start (only stop + set a promise on start)
     * it should be quite fast most of the time
     */
    if (!gs.reloadLock) {
        gs.reloadLock = true;
        gs.configLog?.debug("RELOAD", "CONFIG", gs.configPath);
        (async () => {
            gs.configLog?.debug("STOP", "SERVER");
            await gs.server?.stop();
        })().then(() => {
            main();
            gs.reloadLock = false;
        });
    }
});


function initGlobalState() {
    const configData = gs.configPath
        ? readConfigFile(gs.configPath)
        : {};

    gs.config = createConfig(
        program, // program args
        configData, // config file
        process.env, // os envs
        programOptions, // defaults
    );

    gs.logs = new QLogs();
    gs.logs.start();
    gs.configLog = gs.logs.create("config");
    gs.configLog.debug("USE", gs.config);

    gs.server = new TONQServer({
        config: gs.config,
        logs: gs.logs,
    });
}

export function main() {
    initGlobalState();

    (async () => {
        if (gs.server) {
            try {
                await gs.server.start();
            } catch (error) {
                gs.server.log.error("FAILED", "START", error);
                process.exit(1);
            }
        }
    })();
}
