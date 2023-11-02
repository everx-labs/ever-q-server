import { QAccountProviderConfig } from "../config"
import { LiteClient, QueryArgs } from "ton-lite-client"
import { Address } from "@ton/core"
import QLogs, { QLog } from "../logs"
import { DEFAULT_TIMEOUT_MS } from "../config-param"
import { Functions } from "ton-lite-client/dist/schema"
import { BocModule } from "@eversdk/core"
import { IJsonRpcClient, OpenJsonRpcClient } from "../json-rpc"

export type QueryAccountParams = {
    address: string
    byBlock?: string | null
}

export type RunTvmExtMsgResult = {
    exitCode: number
    messages: string[]
    byBlock: string
}

export interface INodeClient {
    getAccountBocs(accounts: QueryAccountParams[]): Promise<Map<string, string>>
    getAccountMetas(accounts: QueryAccountParams[]): Promise<Map<string, any>>
    runTvmExtMsg(
        address: string,
        body: string,
        byBlock?: string,
    ): Promise<RunTvmExtMsgResult>
}

function getAccountParams(account: QueryAccountParams): any {
    return account.byBlock !== undefined && account.byBlock !== null
        ? {
              account: account.address,
              byBlock: account.byBlock,
          }
        : { account: account.address }
}

class NodeRpcClient implements INodeClient {
    log: QLog
    client: IJsonRpcClient
    constructor(
        logs: QLogs,
        public config: {
            endpoint: string
            timeout: number
        },
    ) {
        this.log = logs.create("NodeRpcClient")
        this.client = new OpenJsonRpcClient(
            this.log,
            "Node RPC account",
            config.endpoint,
            config.timeout,
        )
    }

    async runTvmExtMsg(
        address: string,
        body: string,
        byBlock?: string,
    ): Promise<RunTvmExtMsgResult> {
        const result = await this.client.request(
            "runTvmExtMsg",
            byBlock !== undefined && byBlock !== null
                ? {
                      address,
                      body,
                      byBlock,
                  }
                : { address, body },
        )
        this.log.debug("RUN_TVM_EXT_MSG", address, byBlock)
        return result
    }

    async getAccountBocs(
        accounts: QueryAccountParams[],
    ): Promise<Map<string, string>> {
        const resolved = new Map()
        // TODO: fetch bocs in parallel
        for (const account of accounts) {
            const result = await this.client.request(
                "getAccountBoc",
                getAccountParams(account),
            )
            if (result?.boc ?? "" !== "") {
                resolved.set(account.address, result.boc)
            }
        }
        this.log.debug("GET_ACCOUNT_BOC", accounts)
        return resolved
    }

    async getAccountMetas(
        accounts: QueryAccountParams[],
    ): Promise<Map<string, any>> {
        const resolved = new Map()
        // TODO: fetch bocs in parallel
        for (const account of accounts) {
            const result = await this.client.request(
                "getAccountMeta",
                getAccountParams(account),
            )
            if (result?.meta ?? "" !== "") {
                resolved.set(account.address, result.meta)
            }
        }
        this.log.debug("GET_ACCOUNT_META", accounts)
        return resolved
    }
}

type BlockIdExt = Parameters<typeof LiteClient.prototype.getAccountState>[1]

interface StateWithAddress {
    state: Buffer
    address: Address
}

export class LiteServerClient implements INodeClient {
    log: QLog
    sdkboc: BocModule
    client: LiteClient
    timeout: number

    constructor(
        logs: QLogs,
        sdkboc: BocModule,
        client: LiteClient,
        timeout: number = DEFAULT_TIMEOUT_MS,
    ) {
        this.log = logs.create("LiteServerClient")
        this.sdkboc = sdkboc
        this.client = client
        this.timeout = timeout
    }

    runTvmExtMsg(
        _address: string,
        _body: string,
        _byBlock?: string,
    ): Promise<RunTvmExtMsgResult> {
        throw new Error("Method not implemented.")
    }

    private async getAccountStateBoc(
        src: Address,
        block: BlockIdExt,
        qargs: QueryArgs = { timeout: this.timeout },
    ): Promise<StateWithAddress> {
        const res = await this.client.engine.query(
            Functions.liteServer_getAccountState,
            {
                kind: "liteServer.getAccountState",
                id: {
                    kind: "tonNode.blockIdExt",
                    seqno: block.seqno,
                    shard: block.shard,
                    workchain: block.workchain,
                    fileHash: block.fileHash,
                    rootHash: block.rootHash,
                },
                account: {
                    kind: "liteServer.accountId",
                    workchain: src.workChain,
                    id: src.hash,
                },
            },
            qargs,
        )

        return { state: res.state, address: src }
    }

    private addressFromRawWithChecks(address: string) {
        const [wc, addr] = address.split(":")
        if (wc == undefined || addr == undefined) {
            throw Error("invalid account address, can not split by ':'")
        }

        const wcpart = parseInt(wc, 10)
        if (!Number.isInteger(wcpart)) {
            throw Error("invalid account address, can not parse wc part")
        }

        const hashpart = Buffer.from(addr, "hex")
        if (hashpart.length != 32) {
            throw Error("invalid account address, can not parse hash part")
        }

        return new Address(wcpart, hashpart)
    }

    private async getAccountsWithParams(
        accounts: QueryAccountParams[],
    ): Promise<StateWithAddress[]> {
        const master = await this.client.getMasterchainInfo()
        const results: Promise<StateWithAddress>[] = []

        for (const account of accounts) {
            const address = this.addressFromRawWithChecks(account.address)
            results.push(this.getAccountStateBoc(address, master.last))
        }

        return Promise.all(results)
    }

    async getAccountBocs(
        accounts: QueryAccountParams[],
    ): Promise<Map<string, string>> {
        const resolved = new Map()
        const awaited = await this.getAccountsWithParams(accounts)

        for (const acc of awaited) {
            if (acc.state.length == 0) {
                continue
            }

            const address = acc.address.toRawString().toLowerCase()
            const b64State = acc.state.toString("base64")
            resolved.set(address, b64State)
        }

        return resolved
    }

    async getAccountMetas(
        accounts: QueryAccountParams[],
    ): Promise<Map<string, any>> {
        const resolved = new Map()
        const awaited = await this.getAccountsWithParams(accounts)

        for (const acc of awaited) {
            if (acc.state.length == 0) {
                continue
            }

            const boc = acc.state.toString("base64")
            const address = acc.address.toRawString().toLowerCase()
            const parsed = (await this.sdkboc.parse_account({ boc })).parsed

            resolved.set(address, parsed)
        }

        return resolved
    }
}

export function createNodeClient(
    logs: QLogs,
    config: QAccountProviderConfig,
): INodeClient | undefined {
    const rpcEndpoint = config.evernodeRpc?.endpoint ?? ""
    if (rpcEndpoint !== "") {
        return new NodeRpcClient(logs, {
            endpoint: rpcEndpoint,
            timeout: config.evernodeRpc?.timeout ?? DEFAULT_TIMEOUT_MS,
        })
    }
    return undefined
}
