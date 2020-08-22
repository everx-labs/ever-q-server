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
import QBlockchainData from '../src/server/data/blockchain';
import { createConfig, overrideDefs, parseDataConfig, programOptions } from '../src/server/config';
import QLogs from '../src/server/logs';
import TONQServer from '../src/server/server';
import { QStats, QTracer } from '../src/server/tracer';
import { Auth } from '../src/server/auth';

jest.setTimeout(100000);

const arangoUrl = 'http://localhost:8901';
const testConfig = createConfig({}, process.env, overrideDefs(programOptions, {
    dataMut: arangoUrl,
    dataHot: arangoUrl,
    slowQueriesMut: arangoUrl,
    slowQueriesHot: arangoUrl,
}));

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
                ...((variables ? variables : {}): any),
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

const dataConfig = {
    dataMut: 'http://0.0.0.0',
    dataHot: 'http://0.0.0.0',
    slowQueriesMut: 'http://0.0.0.0',
    slowQueriesHot: 'http://0.0.0.0',
};

export function createTestData(): QBlockchainData {
    const { data, slowQueriesData } = parseDataConfig(dataConfig);
    return new QBlockchainData(({
            isTests: true,
            data,
            slowQueriesData,
        }: any),
        new QLogs(),
        new Auth(testConfig),
        QTracer.create(testConfig),
        QStats.create('', []),
    );
}

test('Init', () => {
});
