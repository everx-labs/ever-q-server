import { Database } from "arangojs";
import ApolloClient from "apollo-client";
import gql from "graphql-tag";

import { Auth } from "../server/auth";
import { resolveConfig } from "../server/config";
import QBlockchainData from "../server/data/blockchain";
import QLogs from "../server/logs";
import TONQServer, { DataProviderFactory } from "../server/server";
import { QStats, QTracer } from "../server/tracer";

import { createTestClient, testConfig } from "./init-tests";
import {
    blocks as blocksData,
    transactions as transactionsData,
    summary as chainRangesVerificationSummary
} from "./blockchain-data";

const TEST_DB_NAME = "Q-server_test_db";
let server: TONQServer | null = null;

beforeAll(async () => {
    let serverAddress = process.env.Q_DATA_MUT ?? "http://localhost:8901";
    
    // prepare db
    const db = new Database(serverAddress);
    try {
        await db.dropDatabase(TEST_DB_NAME);
    } catch {
        // do nothing
    }
    await db.createDatabase(TEST_DB_NAME);
    await db.useDatabase(TEST_DB_NAME);
    const blocks = db.collection("blocks");
    await blocks.create();
    await blocks.save(blocksData);
    const transactions = db.collection("transactions");
    await transactions.create();
    await transactions.save(transactionsData);
    const crv = db.collection("chain_ranges_verification");
    await crv.create();
    await crv.save(chainRangesVerificationSummary);

    // prepare TONQServer
    const url = new URL(serverAddress);
    url.searchParams.set("name", TEST_DB_NAME);
    serverAddress = url.toString();

    const config = resolveConfig(
        {}, 
        {
            blockchain: {
                blocks: {
                    hot: [serverAddress],
                },
                transactions: {
                    hot: [serverAddress],
                },
            },
            chainRangesVerification: [serverAddress],
        },
        {},
    );
    const providers = new DataProviderFactory(config, new QLogs());
    const blockchainData = new QBlockchainData({
        providers: providers.ensure(),
        logs: new QLogs(),
        auth: new Auth(testConfig),
        tracer: QTracer.create(testConfig),
        stats: QStats.create("", [], 0),
        isTests: true,
    });

    server = new TONQServer({
        config: testConfig,
        logs: new QLogs(),
        data: blockchainData,
    });
    await server.start();
});

afterAll(async () => {
    await server?.stop();
});

test("master_seq_no_range", async () => {
    if (!server) {
        throw new Error("server is null");
    }
    const client = createTestClient({ useWebSockets: true });

    const queryResult1 = await client.query({
       query: gql`{
            blockchain {
                master_seq_no_range(time_end: 1622099906) {
                    start
                    end
                }
            }
       }`,
    });
    expect(queryResult1.data.blockchain.master_seq_no_range).toMatchObject({ start: null, end: 8898622 });

    const queryResult2 = await client.query({
        query: gql`{
            blockchain {
                master_seq_no_range(time_start: 1622099903, time_end: 1622099906) {
                    start
                    end
                }
            }
        }`,
    });
    expect(queryResult2.data.blockchain.master_seq_no_range).toMatchObject({ start: 8898620, end: 8898622 });
    
    // is limited by reliable boundary
    const queryResult3 = await client.query({
        query: gql`{
            blockchain {
                master_seq_no_range(time_end: 1622200000) {
                    start
                    end
                }
            }
        }`,
    });
    expect(queryResult3.data.blockchain.master_seq_no_range).toMatchObject({ start: null, end: 8898623 });
});


async function testPagination(client: ApolloClient<unknown>, queryName: string) {
    // simple forward
    const queryResult1 = await client.query({
        query: gql`{
            blockchain {
                ${queryName}(
                    master_seq_no: { start: 8898621, end: 8898625 }
                    first: 5
                    after: "587c83d005c622df11803"
                ) {
                    edges {
                        node {
                            id
                            hash
                            chain_order
                            balance_delta(format: HEX)
                        }
                        cursor
                    }
                    pageInfo {
                        startCursor
                        endCursor
                        hasNextPage
                    }
                }
            }
        }`
    });
    expect(queryResult1.data.blockchain[queryName]).toMatchObject({
        "edges": [
            {
                "node": {
                    "id": "transaction/c9f365fd3bfa8a6260b5154a22973ae5cd525fbe9dbd3ee632a9f52588295e14",
                    "hash": "c9f365fd3bfa8a6260b5154a22973ae5cd525fbe9dbd3ee632a9f52588295e14",
                    "chain_order": "587c83d005c622df11804",
                    "balance_delta": "-0x43afcdfd"
                },
                "cursor": "587c83d005c622df11804"
            },
            {
                "node": {
                    "id": "transaction/7c4f031ac7db3763884eb16d51e6ade302c12fef14708c9b2afce653b07c4361",
                    "hash": "7c4f031ac7db3763884eb16d51e6ade302c12fef14708c9b2afce653b07c4361",
                    "chain_order": "587c83d005c622df11805",
                    "balance_delta": "-0xe28448"
                },
                "cursor": "587c83d005c622df11805"
            },
            {
                "node": {
                    "id": "transaction/ddf949b10a09878a34d57b64551d32c30cd4ee56e37992fe985537bd6be29308",
                    "hash": "ddf949b10a09878a34d57b64551d32c30cd4ee56e37992fe985537bd6be29308",
                    "chain_order": "587c83d005c622df11806",
                    "balance_delta": "-0xe28448"
                },
                "cursor": "587c83d005c622df11806"
            },
            {
                "node": {
                    "id": "transaction/b2df4a58f3af4b7d50f14bf6c235539fdae4c843f38ba98e5251020bc127212f",
                    "hash": "b2df4a58f3af4b7d50f14bf6c235539fdae4c843f38ba98e5251020bc127212f",
                    "chain_order": "587c83d005c622df11807",
                    "balance_delta": "0x373dfba8"
                },
                "cursor": "587c83d005c622df11807"
            },
            {
                "node": {
                    "id": "transaction/defa2e50e9c71f4e5a53a653494c79b84f9cdd0bfdcff1f736985f3a80f3cc5c",
                    "hash": "defa2e50e9c71f4e5a53a653494c79b84f9cdd0bfdcff1f736985f3a80f3cc5c",
                    "chain_order": "587c83d005c635aa11000",
                    "balance_delta": "0x37840928"
                },
                "cursor": "587c83d005c635aa11000"
            }
        ],
        "pageInfo": {
            "startCursor": "587c83d005c622df11804",
            "endCursor": "587c83d005c635aa11000",
            "hasNextPage": true
        }
    });

    // forward limited by realiable_chain_order_boundary (587c83f)
    const queryResult2 = await client.query({
        query: gql`{
            blockchain {
                ${queryName}(
                    master_seq_no: { start: 8898621, end: 8898625 }
                    first: 5
                    after: "587c83em05"
                ) {
                    edges {
                        node {
                            chain_order
                        }
                        cursor
                    }
                    pageInfo {
                        startCursor
                        endCursor
                        hasNextPage
                    }
                }
            }
        }`
    });
    expect(queryResult2.data.blockchain[queryName]).toMatchObject({
        "edges": [
            {
                "node": {
                    "chain_order": "587c83em06"
                },
                "cursor": "587c83em06"
            },
            {
                "node": {
                    "chain_order": "587c83em07"
                },
                "cursor": "587c83em07"
            }
        ],
        "pageInfo": {
            "startCursor": "587c83em06",
            "endCursor": "587c83em07",
            "hasNextPage": false
        }
    });

    // backward
    const queryResult3 = await client.query({
        query: gql`{
            blockchain {
                ${queryName}(
                    master_seq_no: { start: 8898621, end: 8898625 }
                    last: 5
                ) {
                    edges {
                        node {
                            chain_order
                        }
                        cursor
                    }
                    pageInfo {
                        startCursor
                        endCursor
                        hasPreviousPage
                    }
                }
            }
        }`
    });
    expect(queryResult3.data.blockchain[queryName]).toMatchObject({
        "edges": [
            {
                "node": {
                    "chain_order": "587c83em03"
                },
                "cursor": "587c83em03"
            },
            {
                "node": {
                    "chain_order": "587c83em04"
                },
                "cursor": "587c83em04"
            },
            {
                "node": {
                    "chain_order": "587c83em05"
                },
                "cursor": "587c83em05"
            },
            {
                "node": {
                    "chain_order": "587c83em06"
                },
                "cursor": "587c83em06"
            },
            {
                "node": {
                    "chain_order": "587c83em07"
                },
                "cursor": "587c83em07"
            }
        ],
        "pageInfo": {
            "startCursor": "587c83em03",
            "endCursor": "587c83em07",
            "hasPreviousPage": true
        }
    });

    // backward with before
    const queryResult4 = await client.query({
        query: gql`{
            blockchain {
                ${queryName}(
                    master_seq_no: { start: 8898621, end: 8898625 }
                    last: 5
                    before: "587c83em05"
                ) {
                    edges {
                        node {
                            chain_order
                        }
                        cursor
                    }
                    pageInfo {
                        startCursor
                        endCursor
                        hasPreviousPage
                    }
                }
            }
        }`
    });
    expect(queryResult4.data.blockchain[queryName]).toMatchObject({
        "edges": [
            {
                "node": {
                    "chain_order": "587c83em00"
                },
                "cursor": "587c83em00"
            },
            {
                "node": {
                    "chain_order": "587c83em01"
                },
                "cursor": "587c83em01"
            },
            {
                "node": {
                    "chain_order": "587c83em02"
                },
                "cursor": "587c83em02"
            },
            {
                "node": {
                    "chain_order": "587c83em03"
                },
                "cursor": "587c83em03"
            },
            {
                "node": {
                    "chain_order": "587c83em04"
                },
                "cursor": "587c83em04"
            }
        ],
        "pageInfo": {
            "startCursor": "587c83em00",
            "endCursor": "587c83em04",
            "hasPreviousPage": true
        }
    });
}

test("account_transactions", async () => {
    if (!server) {
        throw new Error("server is null");
    }
    const client = createTestClient({ useWebSockets: true });
    
    await testPagination(client, "account_transactions");

    // filter by account_addresses
    const queryResult5 = await client.query({
        query: gql`{
            blockchain {
                account_transactions(
                    master_seq_no: { start: 8898621, end: 8898625 }
                    account_addresses: [
                        "0:198880de2ac28bcf71ab8082d7132d22c337879351cae8b48dd397aadf12f206"
                        "0:04963554676ce00b6fff7d02f47e612e5a8441da5d63b878d1aaebb1eb3c91ae"
                    ]
                    first: 50
                ) {
                    edges {
                        node {
                            hash
                        }
                        cursor
                    }
                    pageInfo {
                        startCursor
                        endCursor
                        hasNextPage
                    }
                }
            }
        }`,
    });
    expect(queryResult5.data).toMatchObject({
        "blockchain": {
          "account_transactions": {
            "edges": [
              {
                "node": {
                  "hash": "a1725e48f08eb5b4e07eaaa1979204b02385f351a4485d192f2ef6775ec7b2ca"
                },
                "cursor": "587c83d005c622df11800"
              },
              {
                "node": {
                  "hash": "34c0895d65e005129d0ef1f87783bd4ea48a5be79306a15dea85a44efc0c2e13"
                },
                "cursor": "587c83d005c622df11801"
              },
              {
                "node": {
                  "hash": "3cf3672f5288eec840ea535ad38d790e1c94a582619a903191f6881e43c50bab"
                },
                "cursor": "587c83d005c622df11802"
              },
              {
                "node": {
                  "hash": "bf2b8eac7e0e64948fef2300c4ee865c232b42b4986b6e41419f51759d5d42c7"
                },
                "cursor": "587c83d005c622df11803"
              },
              {
                "node": {
                  "hash": "c9f365fd3bfa8a6260b5154a22973ae5cd525fbe9dbd3ee632a9f52588295e14"
                },
                "cursor": "587c83d005c622df11804"
              },
              {
                "node": {
                  "hash": "7c4f031ac7db3763884eb16d51e6ade302c12fef14708c9b2afce653b07c4361"
                },
                "cursor": "587c83d005c622df11805"
              },
              {
                "node": {
                  "hash": "ddf949b10a09878a34d57b64551d32c30cd4ee56e37992fe985537bd6be29308"
                },
                "cursor": "587c83d005c622df11806"
              },
              {
                "node": {
                  "hash": "b2df4a58f3af4b7d50f14bf6c235539fdae4c843f38ba98e5251020bc127212f"
                },
                "cursor": "587c83d005c622df11807"
              },
              {
                "node": {
                  "hash": "defa2e50e9c71f4e5a53a653494c79b84f9cdd0bfdcff1f736985f3a80f3cc5c"
                },
                "cursor": "587c83d005c635aa11000"
              }
            ],
            "pageInfo": {
              "startCursor": "587c83d005c622df11800",
              "endCursor": "587c83d005c635aa11000",
              "hasNextPage": false
            }
          }
        }
    });
});


test("workchain_transactions", async () => {
    if (!server) {
        throw new Error("server is null");
    }
    const client = createTestClient({ useWebSockets: true });
    
    await testPagination(client, "workchain_transactions");

    // filter by account_addresses
    const queryResult5 = await client.query({
        query: gql`{
            blockchain {
                workchain_transactions(
                    master_seq_no: { start: 8898621, end: 8898622 }
                    workchains: 0
                    first: 10
                ) {
                    edges {
                        node {
                            account_addr
                        }
                        cursor
                    }
                    pageInfo {
                        startCursor
                        endCursor
                        hasNextPage
                    }
                }
            }
        }`,
    });
    expect(queryResult5.data).toMatchObject({
        "blockchain": {
          "workchain_transactions": {
            "edges": [
              {
                "node": {
                  "account_addr": "0:198880de2ac28bcf71ab8082d7132d22c337879351cae8b48dd397aadf12f206"
                },
                "cursor": "587c83d005c622df11800"
              },
              {
                "node": {
                  "account_addr": "0:198880de2ac28bcf71ab8082d7132d22c337879351cae8b48dd397aadf12f206"
                },
                "cursor": "587c83d005c622df11801"
              },
              {
                "node": {
                  "account_addr": "0:198880de2ac28bcf71ab8082d7132d22c337879351cae8b48dd397aadf12f206"
                },
                "cursor": "587c83d005c622df11802"
              },
              {
                "node": {
                  "account_addr": "0:198880de2ac28bcf71ab8082d7132d22c337879351cae8b48dd397aadf12f206"
                },
                "cursor": "587c83d005c622df11803"
              },
              {
                "node": {
                  "account_addr": "0:198880de2ac28bcf71ab8082d7132d22c337879351cae8b48dd397aadf12f206"
                },
                "cursor": "587c83d005c622df11804"
              },
              {
                "node": {
                  "account_addr": "0:198880de2ac28bcf71ab8082d7132d22c337879351cae8b48dd397aadf12f206"
                },
                "cursor": "587c83d005c622df11805"
              },
              {
                "node": {
                  "account_addr": "0:198880de2ac28bcf71ab8082d7132d22c337879351cae8b48dd397aadf12f206"
                },
                "cursor": "587c83d005c622df11806"
              },
              {
                "node": {
                  "account_addr": "0:198880de2ac28bcf71ab8082d7132d22c337879351cae8b48dd397aadf12f206"
                },
                "cursor": "587c83d005c622df11807"
              },
              {
                "node": {
                  "account_addr": "0:04963554676ce00b6fff7d02f47e612e5a8441da5d63b878d1aaebb1eb3c91ae"
                },
                "cursor": "587c83d005c635aa11000"
              }
            ],
            "pageInfo": {
              "startCursor": "587c83d005c622df11800",
              "endCursor": "587c83d005c635aa11000",
              "hasNextPage": false
            }
          }
        }
    });
});
