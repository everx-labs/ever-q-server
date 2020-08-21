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
            query: gql`
                query {
                    transactions(
                        timeout:60000
                        filter: { id: { eq: "${Date.now()}" } }
                    ) {
                        id
                        in_message { id }
                        block { id }
                    }
                }
            `,
            context: {
                fetchOptions: {
                    signal: this.abortController.signal,
                },
            },
        }).catch((error) => {
            console.log('>>>', error);
        })
    }

    abort() {
        this.abortController.abort();
        this.client.close();
    }
}

test('Data Broker', async () => {
    const server = await testServerRequired();
});
