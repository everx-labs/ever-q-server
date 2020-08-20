import { InMemoryCache } from 'apollo-cache-inmemory';
import { split } from 'apollo-link';
import { HttpLink } from 'apollo-link-http';
import { WebSocketLink } from 'apollo-link-ws';
import { getMainDefinition } from 'apollo-utilities';
import { SubscriptionClient } from 'subscriptions-transport-ws';
import { ApolloClient } from 'apollo-client';

import fetch from 'node-fetch';
import WebSocket from 'ws';
import QData from '../src/server/data/data';
import { createConfig, defaultOptions } from '../src/server/config';
import QLogs from '../src/server/logs';
import TONQServer from '../src/server/server';

jest.setTimeout(100000);

const testConfig = createConfig({}, process.env, {
    ...defaultOptions,
    dbServer: 'localhost:8901',
});
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

export async function testServerRequired(): Promise<TONQServer> {
    if (testServer) {
        return testServer;
    }
    testServer = new TONQServer({
        config: testConfig,
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
                ...(variables ? variables : {}),
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

export function createTestData(): QData {
    return new QData({
        isTests: true,
        data: {
            server: 'http://0.0.0.0',
            name: 'blockchain',
        },
        slowQueriesData: {
            server: 'http://0.0.0.0',
            name: 'blockchain',
        },
    }, new QLogs());
}

test('Init', () => {
});
