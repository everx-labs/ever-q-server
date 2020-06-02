import fetch from 'node-fetch';
import {createConfig, defaultOptions} from '../server/config';
import QLogs from '../server/logs';
import TONQServer from '../server/server';

const testConfig = createConfig({}, process.env, {
    ...defaultOptions,
    dbServer: 'localhost:8081',
});
let testServer: ?TONQServer = null

afterAll(async () => {
    if (testServer) {
        await testServer.stop();
        testServer = null;
    }
});

async function testServerRequired(): Promise<TONQServer> {
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

export async function testServerQuery(query: string, variables?: { [string]: any }): any {
    await testServerRequired();
    const response = await fetch(`http://${testConfig.server.host}:${testConfig.server.port}/graphql`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            query,
            ...(variables ? variables : {}),
        }),
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
}
