/*
 * Copyright 2018-2020 EverX Labs Ltd.
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
 * See the License for the specific EverX Labs software governing permissions and
 * limitations under the License.
 */

import program from "commander"
import { QConfig, RequestsMode } from "./config"
import { configParams, readConfigFile, resolveConfig } from "./config"
import type { QLog } from "./logs"
import QLogs from "./logs"
import EverQServer from "./server"
import { ConfigParam } from "./config-param"
import { LiteClient, LiteSingleEngine } from "ton-lite-client"

ConfigParam.getAll(configParams).forEach(param => {
    program.option(`--${param.option} <value>`, param.descriptionWithDefaults())
})

program.parse(process.argv)

type GlobalState = {
    reloadLock: boolean
    server?: EverQServer
    config?: QConfig
    logs?: QLogs
    configLog?: QLog
    configPath?: string
}

// used mainly for config reload purpose
// helps to avoid potential closures chain
const gs: GlobalState = {
    reloadLock: false,
    server: undefined,
    config: undefined,
    logs: undefined,
    configLog: undefined,
    configPath: program.config || process.env.Q_CONFIG,
}

process.on("SIGHUP", () => {
    /**
     * WARNING: while multiple simultaneous SIGHUP calls
     * we ignore new SIGHUP signals until the last reload handler finished
     * but since we don't wait until server start (only stop + set a promise on start)
     * it should be quite fast most of the time
     */
    if (!gs.reloadLock) {
        gs.reloadLock = true
        gs.configLog?.debug("RELOAD", "CONFIG", gs.configPath)
        void (async () => {
            gs.configLog?.debug("STOP", "SERVER")
            await gs.server?.stop()
        })().then(() => {
            main()
            gs.reloadLock = false
        })
    }
})

function initLiteServer(config: QConfig): LiteClient {
    const engine = new LiteSingleEngine({
        host: `tcp://${config.requests.server}`,
        publicKey: Buffer.from(config.requests.pubkey, "base64"),
    })

    const client = new LiteClient({ engine })

    return client
}

function initGlobalState() {
    const configData = gs.configPath ? readConfigFile(gs.configPath) : {}

    gs.config = resolveConfig(
        program, // program args
        configData, // config file
        process.env as Record<string, string>, // os envs
    )

    gs.logs = new QLogs()
    gs.logs.start()
    gs.configLog = gs.logs.create("config")
    gs.configLog.debug("USE", gs.config)

    let liteclient: LiteClient | undefined
    if (gs.config.requests.mode === RequestsMode.TCP_ADNL) {
        liteclient = initLiteServer(gs.config)
    }

    gs.server = new EverQServer({
        config: gs.config,
        logs: gs.logs,
        liteclient,
    })
}

export function main() {
    initGlobalState()

    void (async () => {
        if (gs.server) {
            try {
                await gs.server.start()
            } catch (error) {
                gs.server.log.error("FAILED", "START", error)
                process.exit(1)
            }
        }
    })()
}
