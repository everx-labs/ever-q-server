import { parseArangoConfig, QAccountProviderConfig } from "../config"
import { Database } from "arangojs"
import { createDatabase } from "./database-provider"
import { RequestManager, HTTPTransport, Client } from "@open-rpc/client-js"

export interface IAccountProvider {
    getBocs(addresses: string[]): Promise<Map<string, string>>
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
}

class ArangoProvider implements IAccountProvider {
    private readonly database: Database
    constructor(
        public config: {
            database: string
            collection: string
        },
    ) {
        this.database = createDatabase(parseArangoConfig(config.database))
    }

    async getBocs(addresses: string[]): Promise<Map<string, string>> {
        const resolved = new Map()
        const cursor = await this.database.query(
            `
            FOR doc IN ${this.config.collection}
            FILTER doc._key IN @addresses
            RETURN { address: doc._key, boc: doc.boc }
            `,
            {
                addresses,
            },
        )
        const docs: { address: string; boc: string }[] = await cursor.all()
        for (const doc of docs) {
            resolved.set(doc.address, doc.boc)
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
    if (config.arango && (config.arango.database ?? "" !== "")) {
        return new ArangoProvider(config.arango)
    }
    return undefined
}
