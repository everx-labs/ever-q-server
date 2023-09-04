import { QAccountProviderConfig } from "../config"
import { RequestManager, HTTPTransport, Client } from "@open-rpc/client-js"
import QLogs, { QLog } from "../logs"

export interface IAccountProvider {
    getBocs(addresses: string[]): Promise<Map<string, string>>
    getMetas(addresses: string[]): Promise<Map<string, any>>
}

class NodeRpcProvider implements IAccountProvider {
    log: QLog
    client: Client
    constructor(
        logs: QLogs,
        public config: {
            endpoint: string
        },
    ) {
        const transport = new HTTPTransport(config.endpoint)
        this.client = new Client(new RequestManager([transport]))
        this.log = logs.create("NodeRpcClient")
    }
    async getBocs(addresses: string[]): Promise<Map<string, string>> {
        const resolved = new Map()
        // TODO: fetch bocs in parallel
        for (const address of addresses) {
            const result = await this.client.request({
                method: "getAccount",
                params: {
                    account: address,
                },
            })
            if (result?.account_boc ?? "" !== "") {
                resolved.set(address, result.account_boc)
            }
        }
        this.log.debug("GET_ACCOUNT", addresses)
        return resolved
    }

    async getMetas(addresses: string[]): Promise<Map<string, any>> {
        const resolved = new Map()
        // TODO: fetch bocs in parallel
        for (const address of addresses) {
            const result = await this.client.request({
                method: "getAccountMeta",
                params: {
                    account: address,
                },
            })
            if (result?.account_meta ?? "" !== "") {
                resolved.set(address, result.account_meta)
            }
        }
        this.log.debug("GET_ACCOUNT_META", addresses)
        return resolved
    }
}

export function createAccountProvider(
    logs: QLogs,
    config: QAccountProviderConfig,
): IAccountProvider | undefined {
    const rpcEndpoint = config.evernodeRpc?.endpoint ?? ""
    if (rpcEndpoint !== "") {
        return new NodeRpcProvider(logs, {
            endpoint: rpcEndpoint,
        })
    }
    return undefined
}
