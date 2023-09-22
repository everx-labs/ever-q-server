import { QAccountProviderConfig } from "../config"
import { RequestManager, HTTPTransport, Client } from "@open-rpc/client-js"
import QLogs, { QLog } from "../logs"
import { RequestArguments } from "@open-rpc/client-js/build/ClientInterface"
import { DEFAULT_TIMEOUT_MS } from "../config-param"

export type QueryAccountParams = {
    address: string
    byBlock?: string | null
}

export interface IAccountProvider {
    getBocs(accounts: QueryAccountParams[]): Promise<Map<string, string>>
    getMetas(accounts: QueryAccountParams[]): Promise<Map<string, any>>
}

function nodeRequest(
    method: string,
    account: QueryAccountParams,
): RequestArguments {
    const request = {
        method,
        params: {
            account: account.address,
        },
    }
    if (account.byBlock !== undefined && account.byBlock !== null) {
        ;(request.params as any).byBlock = account.byBlock
    }
    return request
}

class NodeRpcProvider implements IAccountProvider {
    log: QLog
    client: Client
    constructor(
        logs: QLogs,
        public config: {
            endpoint: string
            timeout: number
        },
    ) {
        const transport = new HTTPTransport(config.endpoint)
        this.client = new Client(new RequestManager([transport]))
        this.log = logs.create("NodeRpcClient")
    }
    async getBocs(
        accounts: QueryAccountParams[],
    ): Promise<Map<string, string>> {
        const resolved = new Map()
        // TODO: fetch bocs in parallel
        for (const account of accounts) {
            const result = await this.client.request(
                nodeRequest("getAccountBoc", account),
                this.config.timeout,
            )
            if (result?.boc ?? "" !== "") {
                resolved.set(account.address, result.boc)
            }
        }
        this.log.debug("GET_ACCOUNT_BOC", accounts)
        return resolved
    }

    async getMetas(accounts: QueryAccountParams[]): Promise<Map<string, any>> {
        const resolved = new Map()
        // TODO: fetch bocs in parallel
        for (const account of accounts) {
            const result = await this.client.request(
                nodeRequest("getAccountMeta", account),
            )
            if (result?.meta ?? "" !== "") {
                resolved.set(account.address, result.meta)
            }
        }
        this.log.debug("GET_ACCOUNT_META", accounts)
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
            timeout: config.evernodeRpc?.timeout ?? DEFAULT_TIMEOUT_MS,
        })
    }
    return undefined
}
