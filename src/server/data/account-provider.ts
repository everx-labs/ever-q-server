import { QAccountProviderConfig } from "../config"
import { RequestManager, HTTPTransport, Client } from "@open-rpc/client-js"

export interface IAccountProvider {
    getBocs(addresses: string[]): Promise<Map<string, string>>
    getMetas(addresses: string[]): Promise<Map<string, any>>
}

class NodeRpcProvider implements IAccountProvider {
    client: Client
    constructor(
        public config: {
            endpoint: string
        },
    ) {
        const transport = new HTTPTransport(config.endpoint)
        this.client = new Client(new RequestManager([transport]))
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
        return resolved
    }
}

export function createAccountProvider(
    config: QAccountProviderConfig,
): IAccountProvider | undefined {
    const rpcEndpoint = config.evernodeRpc?.endpoint ?? ""
    if (rpcEndpoint !== "") {
        return new NodeRpcProvider({
            endpoint: rpcEndpoint,
        })
    }
    return undefined
}
