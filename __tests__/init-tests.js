// @flow
import { InMemoryCache } from 'apollo-cache-inmemory';
import { split } from 'apollo-link';
import { HttpLink } from 'apollo-link-http';
import { WebSocketLink } from 'apollo-link-ws';
import { getMainDefinition } from 'apollo-utilities';
import { SubscriptionClient } from 'subscriptions-transport-ws';
import { ApolloClient } from 'apollo-client';

import fetch from 'node-fetch';
import WebSocket from 'ws';
import QBlockchainData, { INDEXES } from '../src/server/data/blockchain';
import { createConfig, overrideDefs, parseDataConfig, programOptions } from '../src/server/config';
import type { QDataProviders } from '../src/server/data/data';
import type {
    QDataCache,
    QDataEvent,
    QDataProvider,
    QIndexInfo
} from '../src/server/data/data-provider';
import QLogs from '../src/server/logs';
import TONQServer, { createProviders } from '../src/server/server';
import { QStats, QTracer } from '../src/server/tracer';
import { Auth } from '../src/server/auth';

jest.setTimeout(100000);

export const testConfig = createConfig(
    {},
    {},
    process.env,
    overrideDefs(programOptions, {}),
);

let testServer: ?TONQServer = null

afterAll(async () => {
    if (testServer) {
        await testServer.stop();
        testServer = null;
    }
});

export function createTestClient(options: { useWebSockets: boolean }): ApolloClient {
    const useHttp = !options.useWebSockets;

    const url = `${testConfig.server.host}:${testConfig.server.port}/graphql`;
    const subscriptionClient = new SubscriptionClient(`ws://${url}`, {}, WebSocket);
    subscriptionClient.maxConnectTimeGenerator.duration = () => {
        return subscriptionClient.maxConnectTimeGenerator.max;
    };

    const isSubscription = ({ query }) => {
        const definition = getMainDefinition(query);
        return (
            definition.kind === 'OperationDefinition'
            && definition.operation === 'subscription'
        );
    };

    const wsLink = new WebSocketLink(subscriptionClient);
    const httpLink = useHttp
        ? new HttpLink({
            uri: `http://${url}`,
            fetch: fetch,
        })
        : null;
    const link = httpLink
        ? split(isSubscription, wsLink, httpLink)
        : wsLink;
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
    });
    client.close = () => {
        client.stop();
        subscriptionClient.client.close();
    };
    return client;
}

export async function testServerRequired(override?: any): Promise<TONQServer> {
    if (testServer) {
        return testServer;
    }
    testServer = new TONQServer({
        config: {
            ...testConfig,
            ...override,
        },
        logs: new QLogs(),
    });
    await testServer.start();
    return testServer;
}

export async function testServerQuery(query: string, variables?: { [string]: any }, fetchOptions?: any): Promise<any> {
    await testServerRequired();
    try {
        const response = await fetch(`http://${testConfig.server.host}:${testConfig.server.port}/graphql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query,
                variables: variables || {},
            }),
            ...fetchOptions,
        });
        const responseJson = await response.json();
        const errors = responseJson.errors;
        if (errors) {
            throw errors.length === 1
                ? errors[0]
                : {
                    message: 'Multiple errors',
                    errors,
                };
        }
        return responseJson.data;
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('>>>', 'Request aborted.');
            return [];
        }
        throw error;
    }
}

export async function testServerStop() {
    const server = testServer;
    testServer = null;
    if (server) {
        await server.stop();
    }
}

export function createLocalArangoTestData(logs: QLogs): QBlockchainData {
    const dataMut = process.env.Q_DATA_MUT || 'http://localhost:8901';
    const dataHot = process.env.Q_DATA_HOT || dataMut;
    const dataCold = process.env.Q_DATA_COLD || "";
    const slowQueriesMut = process.env.Q_SLOW_QUERIES_MUT || dataMut;
    const slowQueriesHot = process.env.Q_SLOW_QUERIES_HOT || slowQueriesMut;
    const slowQueriesCold = process.env.Q_SLOW_QUERIES_COLD || "";
    const { data, slowQueriesData } = parseDataConfig({
        dataMut,
        dataHot,
        dataCold,
        slowQueriesMut,
        slowQueriesHot,
        slowQueriesCold,
    });
    return new QBlockchainData({
        providers: createProviders('fast', logs, data, testConfig.networkName, testConfig.cacheKeyPrefix),
        slowQueriesProviders: createProviders('slow', logs, slowQueriesData, testConfig.networkName, testConfig.cacheKeyPrefix),
        logs: new QLogs(),
        auth: new Auth(testConfig),
        tracer: QTracer.create(testConfig),
        stats: QStats.create('', [], 0),
        isTests: true,
    });
}

export class MockProvider implements QDataProvider {
    data: any;
    queryCount: number;
    hotUpdateCount: number;

    constructor(data: any) {
        this.data = data;
        this.queryCount = 0;
        this.hotUpdateCount = 0;
    }

    async start(): Promise<any> {
        return Promise.resolve();
    }

    getCollectionIndexes(collection: string): Promise<QIndexInfo[]> {
        return Promise.resolve(INDEXES[collection].indexes);
    }

    async loadFingerprint(): Promise<any> {
        return Promise.resolve([{ data: this.data.length }]);
    }

    async hotUpdate(): Promise<any> {
        this.hotUpdateCount += 1;
        return Promise.resolve();
    }

    query(text: string, vars: { [string]: any }): Promise<any> {
        this.queryCount += 1;
        return this.data;
    }

    subscribe(collection: string, listener: (doc: any, event: QDataEvent) => void): any {

    }

    unsubscribe(subscription: any): void {

    }
}

export class MockCache implements QDataCache {
    data: Map<string, any>;
    getCount: number;
    setCount: number;
    lastKey: string;

    constructor() {
        this.data = new Map();
        this.getCount = 0;
        this.setCount = 0;
        this.lastKey = '';
    }

    get(key: string): Promise<any> {
        this.lastKey = key;
        this.getCount += 1;
        return Promise.resolve(this.data.get(key));
    }

    set(key: string, value: any): Promise<void> {
        this.lastKey = key;
        this.setCount += 1;
        this.data.set(key, value);
        return Promise.resolve();
    }
}

export function mock(data: any): MockProvider {
    return new MockProvider(data);
}

export function createTestData(providers: QDataProviders): QBlockchainData {
    return new QBlockchainData({
        providers,
        slowQueriesProviders: providers,
        logs: new QLogs(),
        auth: new Auth(testConfig),
        tracer: QTracer.create(testConfig),
        stats: QStats.create('', [], 0),
        isTests: true,
    });
}


test('Init', () => {
});
