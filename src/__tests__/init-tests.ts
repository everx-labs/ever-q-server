import { InMemoryCache } from 'apollo-cache-inmemory'
import { DocumentNode, split } from 'apollo-link'
import { FetchOptions, HttpLink } from 'apollo-link-http'
import { WebSocketLink } from 'apollo-link-ws'
import { getMainDefinition } from 'apollo-utilities'
import { SubscriptionClient } from 'subscriptions-transport-ws'
import { ApolloClient } from 'apollo-client'

import nodeFetch, { RequestInit } from 'node-fetch'
import WebSocket from 'ws'
import QBlockchainData, { INDEXES } from '../server/data/blockchain'
import { QConfig, resolveConfig } from '../server/config'
import type { QDataProviders } from '../server/data/data'
import type {
    QDataCache,
    QDataProvider,
    QIndexInfo,
    QResult,
} from '../server/data/data-provider'
import QLogs from '../server/logs'
import TONQServer, { DataProviderFactory } from '../server/server'
import { QStats } from '../server/stats'
import { QTracer } from '../server/tracing'
import { Auth, grantedAccess } from '../server/auth'
import { QDataCollection } from '../server/data/collection'
import {
    CollectionFilter,
    OrderBy,
    QRequestParams,
} from '../server/filter/filters'
import { gql } from 'apollo-server'
import { FieldAggregation } from '../server/data/aggregations'
import { FieldNode, OperationDefinitionNode } from 'graphql'
import { httpUrl, assignDeep, cloneDeep } from '../server/utils'
import fetch from 'node-fetch'
import { QCollectionQuery } from '../server/data/collection-query'

jest.setTimeout(100000)

export const testConfig = resolveConfig(
    {},
    {},
    process.env as Record<string, string>,
)

let testServer: TONQServer | null = null

afterAll(async () => {
    if (testServer !== null) {
        await testServer.stop()
        testServer = null
    }
})

export function normalized(s: string): string {
    return s.replace(/\s+/g, ' ').trim()
}

export function selectionInfo(r: string) {
    const operation = gql(`query { collection { ${r} } }`)
        .definitions[0] as OperationDefinitionNode
    const collection = operation.selectionSet.selections[0] as FieldNode
    return collection.selectionSet
}

export function queryText(
    collection: QDataCollection,
    result: string,
    orderBy?: OrderBy[],
    request?: QRequestParams,
    filter?: CollectionFilter,
    limit?: number | null,
): string {
    return normalized(
        QCollectionQuery.create(
            request ?? { expectedAccountBocVersion: 1 },
            collection.name,
            collection.docType,
            {
                filter: filter ?? {},
                limit,
                orderBy,
            },
            selectionInfo(result),
            grantedAccess,
            0,
        )?.text ?? '',
    )
}

export function aggregationQueryText(
    collection: QDataCollection,
    fields: FieldAggregation[],
): string {
    return normalized(
        collection.createAggregationQuery({}, fields, grantedAccess)?.text ??
            '',
    )
}

interface SubscriptionClientPrivate {
    maxConnectTimeGenerator: {
        duration(): number
        max: number
    }
}

export function createTestClient(options: {
    useWebSockets: boolean
}): ApolloClient<unknown> {
    const useHttp = !options.useWebSockets

    const url = `${testConfig.server.host}:${testConfig.server.port}/graphql`
    const subscriptionClient = new SubscriptionClient(
        `ws://${url}`,
        {},
        WebSocket,
    )
    ;(
        subscriptionClient as unknown as SubscriptionClientPrivate
    ).maxConnectTimeGenerator.duration = () => {
        return (subscriptionClient as unknown as SubscriptionClientPrivate)
            .maxConnectTimeGenerator.max
    }

    const isSubscription = ({ query }: { query: DocumentNode }) => {
        const definition = getMainDefinition(query)
        return (
            definition.kind === 'OperationDefinition' &&
            definition.operation === 'subscription'
        )
    }

    const wsLink = new WebSocketLink(subscriptionClient)
    const httpLink = useHttp
        ? new HttpLink({
              uri: httpUrl(url),
              fetch: nodeFetch as unknown as FetchOptions['fetch'],
          })
        : null
    const link =
        httpLink !== null ? split(isSubscription, wsLink, httpLink) : wsLink
    const client = new ApolloClient({
        cache: new InMemoryCache({}),
        link,
        defaultOptions: {
            watchQuery: {
                fetchPolicy: 'no-cache',
            },
            query: {
                fetchPolicy: 'no-cache',
            },
        },
    })
    ;(client as unknown as { close: () => void }).close = () => {
        client.stop()
        subscriptionClient.client.close()
    }
    return client
}

export async function testServerRequired(
    override?: Record<string, unknown>,
): Promise<TONQServer> {
    if (testServer !== null) {
        return testServer
    }
    const config = cloneDeep(testConfig) as QConfig
    assignDeep(config, override)
    testServer = new TONQServer({
        config,
        logs: new QLogs(),
    })
    await testServer.start()
    return testServer
}

export async function testServerQuery<T>(
    query: string,
    variables?: Record<string, unknown>,
    fetchOptions?: RequestInit,
): Promise<T> {
    await testServerRequired()
    try {
        const response = await fetch(
            httpUrl(
                `${testConfig.server.host}:${testConfig.server.port}/graphql`,
            ),
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query,
                    variables: variables ?? {},
                }),
                ...fetchOptions,
            },
        )
        const responseJson = await response.json()
        const errors = responseJson.errors
        if (errors) {
            // noinspection ExceptionCaughtLocallyJS
            throw errors.length === 1
                ? errors[0]
                : {
                      message: 'Multiple errors',
                      errors,
                  }
        }
        return responseJson.data
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('>>>', 'Request aborted.')
            return undefined as unknown as T
        }
        throw error
    }
}

export async function testServerStop() {
    const server = testServer
    testServer = null
    if (server !== null) {
        await server.stop()
    }
}

export function createLocalArangoTestData(logs: QLogs): QBlockchainData {
    const dataMut = process.env.Q_DATA_MUT ?? 'http://localhost:8901'
    const slowQueriesMut = process.env.Q_SLOW_QUERIES_MUT ?? dataMut

    const config = resolveConfig(
        {},
        {},
        {
            Q_DATA_MUT: dataMut,
            Q_DATA_HOT: process.env.Q_DATA_HOT ?? dataMut,
            Q_DATA_COLD: process.env.Q_DATA_COLD ?? '',
            Q_SLOW_QUERIES_MUT: slowQueriesMut,
            Q_SLOW_QUERIES_HOT:
                process.env.Q_SLOW_QUERIES_HOT ?? slowQueriesMut,
            Q_SLOW_QUERIES_COLD: process.env.Q_SLOW_QUERIES_COLD ?? '',
        },
    )
    const providers = new DataProviderFactory(config, logs)
    return new QBlockchainData({
        providers: providers.ensure(),
        slowQueriesProviders: providers.ensureBlockchain(
            config.slowQueriesBlockchain,
            'slow',
        ),
        logs: new QLogs(),
        auth: new Auth(testConfig),
        tracer: QTracer.create(testConfig),
        stats: QStats.create('', [], 0),
        isTests: true,
    })
}

export class MockProvider<T extends QResult> implements QDataProvider {
    data: T[]
    queryCount: number
    hotUpdateCount: number
    shards = []
    shardingDegree = 0

    constructor(data: T[]) {
        this.data = data
        this.queryCount = 0
        this.hotUpdateCount = 0
    }

    async start(): Promise<void> {}

    async stop(): Promise<void> {}

    getCollectionIndexes(collection: string): Promise<QIndexInfo[]> {
        return Promise.resolve(INDEXES[collection].indexes)
    }

    async loadFingerprint(): Promise<unknown> {
        return Promise.resolve([{ data: this.data.length }])
    }

    async hotUpdate(): Promise<void> {
        this.hotUpdateCount += 1
    }

    async query(): Promise<QResult[]> {
        this.queryCount += 1
        return this.data
    }

    subscribe(): unknown {
        return {}
    }

    unsubscribe(): void {}
}

export class MockCache<T> implements QDataCache {
    data: Map<string, T>
    getCount: number
    setCount: number
    lastKey: string

    constructor() {
        this.data = new Map()
        this.getCount = 0
        this.setCount = 0
        this.lastKey = ''
    }

    async get(key: string): Promise<T | undefined> {
        this.lastKey = key
        this.getCount += 1
        return this.data.get(key)
    }

    async set(key: string, value: T): Promise<void> {
        this.lastKey = key
        this.setCount += 1
        this.data.set(key, value)
    }
}

export function mock<T extends QResult>(data: T[]): MockProvider<T> {
    return new MockProvider(data)
}

export function createTestData(providers: QDataProviders): QBlockchainData {
    return new QBlockchainData({
        providers,
        slowQueriesProviders: providers.blockchain,
        logs: new QLogs(),
        auth: new Auth(testConfig),
        tracer: QTracer.create(testConfig),
        stats: QStats.create('', [], 0),
        isTests: true,
    })
}

test('Init', () => {})
