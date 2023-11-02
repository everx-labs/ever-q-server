import express from "express"
import { Database } from "arangojs"
import {
    accounts as accountsData,
    blocks as blocksData,
    messages as messagesData,
    summary as chainRangesVerificationSummary,
    transactions as transactionData,
    block_signatures as blockSignaturesData,
} from "./blockchain-mock-data"
import { QConfig, resolveConfig, SubscriptionsMode } from "../server/config"
import TONQServer, { DataProviderFactory } from "../server/server"
import QLogs from "../server/logs"
import QBlockchainData from "../server/data/blockchain"
import { QTracer } from "../server/tracing"
import { createTestClient, testConfig } from "./init-tests"
import { QStats } from "../server/stats"
import { createBocProvider } from "../server/data/boc-provider"
import { createNodeClient } from "../server/data/node-client"
import { cloneDeep } from "../server/utils"
import { ApolloClient } from "apollo-client"
import gql from "graphql-tag"
import {
    blockArchiveFields,
    messageArchiveFields,
    transactionArchiveFields,
} from "../server/graphql/blockchain/boc-parsers"
import isObject from "subscriptions-transport-ws/dist/utils/is-object"

function getTestDbServer(): string {
    return (
        process.env.Q_DATA_MUT ??
        process.env.Q_ACCOUNTS ??
        "http://localhost:8901"
    )
}

function getTestDbName(archive: boolean): string {
    const TEST_DB_NAME = "Q-server_test_db"
    const TEST_ARCHIVE_DB_NAME = "Q-server_test_archive_db"
    return archive ? TEST_ARCHIVE_DB_NAME : TEST_DB_NAME
}

function getTestDbUrl(archive: boolean): string {
    const url = new URL(getTestDbServer())
    url.searchParams.set("name", getTestDbName(archive))
    return url.toString()
}

export type AccountMock = {
    boc: string
    meta: { [name: string]: unknown }
}

type NodeRpcStat = {
    getAccountBoc: number
    getAccountMeta: number
}

type NodeRpcMock = {
    server: any
    stat: NodeRpcStat
}

export function startNodeRpcMock(
    port: number,
    accounts: { [address: string]: AccountMock },
) {
    const app = express()
    app.use(express.json())
    const stat = {
        getAccountBoc: 0,
        getAccountMeta: 0,
    }
    app.post("/", (req, res) => {
        const { method, params, id } = req.body
        const response: { [name: string]: unknown } = {
            jsonrpc: "2.0",
            id,
        }
        const acc =
            accounts[
                params.byBlock
                    ? `${params.account}:${params.byBlock}`
                    : params.account
            ]
        switch (method) {
            case "getAccountBoc":
                {
                    response.result = acc
                        ? {
                              boc: acc.boc,
                          }
                        : null
                    stat.getAccountBoc += 1
                }
                break
            case "getAccountMeta":
                {
                    response.result = acc
                        ? {
                              meta: {
                                  ...acc.meta,
                                  address: acc.meta._key ?? acc.meta.id,
                              },
                          }
                        : null
                    stat.getAccountMeta += 1
                }
                break
            default:
                response.error = "Invalid method"
        }
        res.contentType("application/json")
        res.send(JSON.stringify(response))
    })
    return {
        server: app.listen(port),
        stat,
    }
}

export async function startTestServer(
    overrideConfig?: (config: QConfig) => void,
): Promise<TONQServer> {
    // prepare TONQServer
    const dbUrl = getTestDbUrl(false)

    const config = resolveConfig(
        {},
        {
            blockchain: {
                accounts: [dbUrl],
                blocks: {
                    hot: [dbUrl],
                },
                transactions: {
                    hot: [dbUrl],
                },
            },
            chainRangesVerification: [dbUrl],
        },
        {},
    )
    overrideConfig?.(config)
    const logs = new QLogs()
    const providers = new DataProviderFactory(config, logs)
    const blockchainData = new QBlockchainData({
        providers: providers.ensure(),
        logs,
        tracer: QTracer.create(testConfig),
        stats: QStats.create("", [], 0),
        blockBocProvider: createBocProvider(config.blockBocs),
        nodeClient: createNodeClient(logs, config.accountProvider),
        isTests: true,
        subscriptionsMode: SubscriptionsMode.Arango,
        filterConfig: config.queries.filter,
        ignoreMessagesForLatency: false,
    })

    const serverConfig = cloneDeep(testConfig) as QConfig
    overrideConfig?.(serverConfig)
    const server = new TONQServer({
        config: serverConfig,
        logs: new QLogs(),
        data: blockchainData,
    })
    await server.start()
    return server
}

async function initCollection(
    db: Database,
    collectionName: string,
    docs: any[],
    archive: boolean,
    archiveFields: Set<string>,
) {
    const collection = db.collection(collectionName)
    await collection.create()
    const dbArchiveFields = new Set(archiveFields)
    dbArchiveFields.add("_key")
    dbArchiveFields.add("_id")
    dbArchiveFields.add("_rev")
    const saveDocs = archive
        ? docs.map(x => buildArchiveValue("", x, dbArchiveFields))
        : docs
    await collection.save(saveDocs)
}

function buildArchiveValue(
    path: string,
    value: any,
    archiveFields: Set<string>,
): any {
    if (path !== "" && !archiveFields.has(path)) {
        return undefined
    }
    if (!isObject(value)) {
        return value
    }
    let archiveDoc: any = undefined
    for (const [fieldName, fieldValue] of Object.entries(value)) {
        const fieldPath = path !== "" ? `${path}.${fieldName}` : fieldName
        const archiveValue = buildArchiveValue(
            fieldPath,
            fieldValue,
            archiveFields,
        )
        if (archiveValue !== undefined) {
            if (archiveDoc === undefined) {
                archiveDoc = { [fieldName]: archiveValue }
            } else {
                archiveDoc[fieldName] = archiveValue
            }
        }
    }
    return archiveDoc
}

async function createMockDb(archive: boolean) {
    const dbName = getTestDbName(archive)
    const db = new Database(getTestDbServer())
    try {
        await db.dropDatabase(dbName)
    } catch (err) {
        console.log(err)
        // do nothing
    }
    await db.createDatabase(dbName)
    await db.useDatabase(dbName)

    await initCollection(db, "blocks", blocksData, archive, blockArchiveFields)
    await initCollection(
        db,
        "messages",
        messagesData,
        archive,
        messageArchiveFields,
    )
    await initCollection(
        db,
        "transactions",
        transactionData,
        archive,
        transactionArchiveFields,
    )

    if (!archive) {
        await initCollection(db, "accounts", accountsData, false, new Set())
        await initCollection(
            db,
            "blocks_signatures",
            blockSignaturesData,
            false,
            new Set(),
        )

        const crv = db.collection("chain_ranges_verification")
        await crv.create()
        await crv.save(chainRangesVerificationSummary)
    }
}

export async function createTestData() {
    await createMockDb(false)
    await createMockDb(true)
}
type TestSetupOptions = {
    port?: number
    withArchiveDb?: boolean
    accounts?: { [hash: string]: AccountMock }
}

export class TestSetup {
    constructor(
        public client: ApolloClient<any>,
        public server: TONQServer,
        public nodeClient?: NodeRpcMock,
    ) {}

    static async create(options: TestSetupOptions): Promise<TestSetup> {
        const port = options.port ?? 1
        const serverPort = 5000 + port
        const nodeRpcPort = 6000 + port
        const nodeClient = options.accounts
            ? startNodeRpcMock(nodeRpcPort, options.accounts)
            : undefined
        const server = await startTestServer(x => {
            x.server.port = serverPort
            if (options.accounts) {
                x.accountProvider.evernodeRpc = {
                    endpoint: `http://localhost:${nodeRpcPort}`,
                }
            }
            const archive =
                options.withArchiveDb ?? false ? [getTestDbUrl(true)] : []
            x.archive = archive
            x.blockchain.transactions.archive = archive
            x.blockchain.blocks.archive = archive
        })

        const client = createTestClient({
            useWebSockets: false,
            port: serverPort,
        })
        server.logs.start()
        return new TestSetup(client, server, nodeClient)
    }

    async queryBlockchain(query: string) {
        return (await this.query(`blockchain { ${query} }`)).blockchain
    }

    async query(query: string) {
        return (
            await this.client.query({
                query: gql(`{ ${query} }`),
            })
        ).data
    }

    async mutate(mutation: string) {
        try {
            return (
                await this.client.mutate({
                    mutation: gql(`mutation { ${mutation} }`),
                })
            ).data
        } catch (err) {
            console.log(">>>", JSON.stringify(err, undefined, 4))
            throw err
        }
    }

    nodeRpcStat() {
        return (
            this.nodeClient?.stat ?? {
                getAccountBoc: 0,
                getAccountMeta: 0,
            }
        )
    }
    async close(): Promise<void> {
        await this.client.stop()
        await this.server.stop()
        if (this.nodeClient) {
            this.nodeClient.server.close()
        }
    }
}
