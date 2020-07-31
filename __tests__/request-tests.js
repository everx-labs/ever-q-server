import gql from 'graphql-tag';
import { createTestClient, testServerRequired } from './init-tests';

const sleep = async (ms) => new Promise(x => setTimeout(x, ms));

class TestQuery {
    constructor(options) {
        this.abortController = new AbortController();
        this.client = createTestClient(options);
    }

    sendQuery() {
        this.client.query({
            query: gql`query { blocks(timeout:60000 filter:{id:{eq:"${Date.now()}"}}) { id } }`,
            context: {
                fetchOptions: {
                    signal: this.abortController.signal,
                },
            },
        })
    }

    abort() {
        this.abortController.abort();
        this.client.close();
    }
}

test.each([true, false])('Release Aborted Requests (webSockets: %s)', async (useWebSockets) => {
    const server = await testServerRequired();
    const q1 = new TestQuery({ useWebSockets });
    const q2 = new TestQuery({ useWebSockets });
    q1.sendQuery();
    q2.sendQuery();
    await sleep(200);
    expect(server.db.blocks.waitForCount).toEqual(2);
    q1.abort();
    await sleep(100);
    expect(server.db.blocks.waitForCount).toEqual(1);
    q2.abort();
    await sleep(100);
    expect(server.db.blocks.waitForCount).toEqual(0);
});
