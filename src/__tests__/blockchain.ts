import gql from "graphql-tag"

import EverQServer from "../server/server"

import { createTestClient } from "./init-tests"
import { createTestData, startTestServer, TestSetup } from "./blockchain-mock"
import { InternalEvent, LastKeyBlockCacheEventArg } from "../server/request"

let server: EverQServer | null = null

beforeAll(async () => {
    await createTestData()
    server = await startTestServer()
})

afterAll(async () => {
    await server?.stop()
})

test("master_seq_no_range", async () => {
    if (!server) {
        throw new Error("server is null")
    }
    const client = createTestClient({ useWebSockets: true })

    const queryResult1 = await client.query({
        query: gql`
            {
                blockchain {
                    master_seq_no_range(time_end: 1622099906) {
                        start
                        end
                    }
                }
            }
        `,
    })
    expect(queryResult1.data.blockchain.master_seq_no_range).toMatchObject({
        start: null,
        end: 8898622,
    })

    const queryResult2 = await client.query({
        query: gql`
            {
                blockchain {
                    master_seq_no_range(
                        time_start: 1622099903
                        time_end: 1622099906
                    ) {
                        start
                        end
                    }
                }
            }
        `,
    })
    expect(queryResult2.data.blockchain.master_seq_no_range).toMatchObject({
        start: 8898620,
        end: 8898622,
    })

    // is limited by reliable boundary
    const queryResult3 = await client.query({
        query: gql`
            {
                blockchain {
                    master_seq_no_range(time_end: 1622200000) {
                        start
                        end
                    }
                }
            }
        `,
    })
    expect(queryResult3.data.blockchain.master_seq_no_range).toMatchObject({
        start: null,
        end: null,
    })
})

test("blocks", async () => {
    if (!server) {
        throw new Error("server is null")
    }
    const client = createTestClient({ useWebSockets: true })

    const queryResult1 = await client.query({
        query: gql`
            {
                blockchain {
                    blocks(workchain: -1, first: 2) {
                        edges {
                            node {
                                id
                                hash
                                chain_order
                                start_lt(format: HEX)
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
            }
        `,
    })
    expect(queryResult1.data).toMatchObject({
        blockchain: {
            blocks: {
                edges: [
                    {
                        node: {
                            id: "block/52cba78cf9ddc27995031456677141fdf679aa22057bdcec3f55a62556c7dda5",
                            hash: "52cba78cf9ddc27995031456677141fdf679aa22057bdcec3f55a62556c7dda5",
                            chain_order: "587c83bm",
                            start_lt: "0xd36a6edd700",
                            __typename: "BlockchainBlock",
                        },
                        cursor: "587c83bm",
                        __typename: "BlockchainBlocksEdge",
                    },
                    {
                        node: {
                            id: "block/6c9075ea0e490437102503dfcad4aea0688528aae7a7391b311c651d390312c6",
                            hash: "6c9075ea0e490437102503dfcad4aea0688528aae7a7391b311c651d390312c6",
                            chain_order: "587c83cm",
                            start_lt: "0xd36a71b9dc0",
                            __typename: "BlockchainBlock",
                        },
                        cursor: "587c83cm",
                        __typename: "BlockchainBlocksEdge",
                    },
                ],
                pageInfo: {
                    startCursor: "587c83bm",
                    endCursor: "587c83cm",
                    hasNextPage: true,
                    __typename: "PageInfo",
                },
                __typename: "BlockchainBlocksConnection",
            },
            __typename: "BlockchainQuery",
        },
    })

    const queryResult2 = await client.query({
        query: gql`
            {
                blockchain {
                    blocks(workchain: 0, shard: "5800000000000000", last: 2) {
                        edges {
                            node {
                                id
                                hash
                                chain_order
                                start_lt(format: HEX)
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
            }
        `,
    })
    expect(queryResult2.data).toMatchObject({
        blockchain: {
            blocks: {
                edges: [
                    {
                        node: {
                            id: "block/48007c93e25c94e5fa301fa1e14d786613715d2599c1a26abb3a8c0fd794148d",
                            hash: "48007c93e25c94e5fa301fa1e14d786613715d2599c1a26abb3a8c0fd794148d",
                            chain_order: "587c83e005c6440a11a",
                            start_lt: "0xd36a72ae000",
                            __typename: "BlockchainBlock",
                        },
                        cursor: "587c83e005c6440a11a",
                        __typename: "BlockchainBlocksEdge",
                    },
                    {
                        node: {
                            id: "block/b9d24217148800bf78ea78cdbf6b6d1caf0739cdc0e67d4ced6f100dea50b4a1",
                            hash: "b9d24217148800bf78ea78cdbf6b6d1caf0739cdc0e67d4ced6f100dea50b4a1",
                            chain_order: "587c83e005c6440b11a",
                            start_lt: "0xd36a73a2240",
                            __typename: "BlockchainBlock",
                        },
                        cursor: "587c83e005c6440b11a",
                        __typename: "BlockchainBlocksEdge",
                    },
                ],
                pageInfo: {
                    startCursor: "587c83e005c6440a11a",
                    endCursor: "587c83e005c6440b11a",
                    hasNextPage: false,
                    __typename: "PageInfo",
                },
                __typename: "BlockchainBlocksConnection",
            },
            __typename: "BlockchainQuery",
        },
    })

    const queryResult3 = await client.query({
        query: gql`
            {
                blockchain {
                    blocks(
                        workchain: 0
                        shard: "5800000000000000"
                        first: 2
                        after: "587c83d005c6440911a"
                    ) {
                        edges {
                            node {
                                id
                                hash
                                chain_order
                                start_lt(format: HEX)
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
            }
        `,
    })

    expect(queryResult3.data).toMatchObject({
        blockchain: {
            blocks: {
                edges: [
                    {
                        node: {
                            id: "block/48007c93e25c94e5fa301fa1e14d786613715d2599c1a26abb3a8c0fd794148d",
                            hash: "48007c93e25c94e5fa301fa1e14d786613715d2599c1a26abb3a8c0fd794148d",
                            chain_order: "587c83e005c6440a11a",
                            start_lt: "0xd36a72ae000",
                            __typename: "BlockchainBlock",
                        },
                        cursor: "587c83e005c6440a11a",
                        __typename: "BlockchainBlocksEdge",
                    },
                    {
                        node: {
                            id: "block/b9d24217148800bf78ea78cdbf6b6d1caf0739cdc0e67d4ced6f100dea50b4a1",
                            hash: "b9d24217148800bf78ea78cdbf6b6d1caf0739cdc0e67d4ced6f100dea50b4a1",
                            chain_order: "587c83e005c6440b11a",
                            start_lt: "0xd36a73a2240",
                            __typename: "BlockchainBlock",
                        },
                        cursor: "587c83e005c6440b11a",
                        __typename: "BlockchainBlocksEdge",
                    },
                ],
                pageInfo: {
                    startCursor: "587c83e005c6440a11a",
                    endCursor: "587c83e005c6440b11a",
                    hasNextPage: false,
                    __typename: "PageInfo",
                },
                __typename: "BlockchainBlocksConnection",
            },
            __typename: "BlockchainQuery",
        },
    })
})

test("Last Key Block", async () => {
    if (!server) {
        throw new Error("server is null")
    }
    const client = createTestClient({ useWebSockets: true })
    const stat = {
        blocks: 0,
        blockchain: 0,
    }
    server.requestServices.internalEvents.on(
        InternalEvent.LAST_KEY_BLOCK_CACHE,
        (args: LastKeyBlockCacheEventArg) => {
            if (args.isBlocksResolver) {
                stat.blocks += 1
            } else {
                stat.blockchain += 1
            }
        },
    )

    await client.query({
        query: gql`
            {
                blocks(
                    filter: { workchain_id: { eq: -1 } }
                    orderBy: { path: "seq_no", direction: DESC }
                    limit: 1
                ) {
                    id
                    boc
                }
            }
        `,
    })
    expect(stat).toMatchObject({
        blocks: 0,
        blockchain: 0,
    })

    const result1 = (
        await client.query({
            query: gql`
                {
                    blockchain {
                        key_blocks(last: 1) {
                            edges {
                                node {
                                    hash
                                    boc
                                }
                            }
                        }
                    }
                }
            `,
        })
    ).data.blockchain.key_blocks.edges[0].node
    expect(stat).toMatchObject({
        blocks: 0,
        blockchain: 1,
    })
    const result2 = (
        await client.query({
            query: gql`
                {
                    blocks(
                        filter: {
                            workchain_id: { eq: -1 }
                            key_block: { eq: true }
                        }
                        orderBy: { path: "seq_no", direction: DESC }
                        limit: 1
                    ) {
                        id
                        boc
                    }
                }
            `,
        })
    ).data.blocks[0]
    expect(stat).toMatchObject({
        blocks: 1,
        blockchain: 1,
    })
    const result3 = (
        await client.query({
            query: gql`
            { blockchain { block(hash: "${result1.hash}") { hash boc } } }
        `,
        })
    ).data.blockchain.block

    expect(result1.boc).toEqual(result2.boc)
    expect(result1.boc).toEqual(result3.boc)
})

test("next_shard_blocks", async () => {
    if (!server) {
        throw new Error("server is null")
    }
    const client = createTestClient({ useWebSockets: true })

    const queryResult1 = await client.query({
        query: gql`
            {
                blockchain {
                    next_shard_blocks(
                        hash: "2ff719c6801ffbdb54991041288f3fde7900c73d97d30609a71ecf30cc33a166"
                    ) {
                        hash
                    }
                }
            }
        `,
    })
    expect(queryResult1.data).toMatchObject({
        blockchain: {
            next_shard_blocks: [
                {
                    hash: "ddfe4ed2b0fbf41785a044a053d01335841a07a69df3912bbaec745609eb53e0",
                },
            ],
        },
    })
})

test("blockchain.account.transactions", async () => {
    if (!server) {
        throw new Error("server is null")
    }
    const client = createTestClient({ useWebSockets: true })

    // filter by account_addresses
    const queryResult = await client.query({
        query: gql`
            {
                blockchain {
                    account(
                        address: "0:198880de2ac28bcf71ab8082d7132d22c337879351cae8b48dd397aadf12f206"
                    ) {
                        transactions(
                            master_seq_no_range: {
                                start: 8898621
                                end: 8898625
                            }
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
                }
            }
        `,
    })

    expect(queryResult.data).toMatchObject({
        blockchain: {
            account: {
                transactions: {
                    edges: [
                        {
                            node: {
                                hash: "a1725e48f08eb5b4e07eaaa1979204b02385f351a4485d192f2ef6775ec7b2ca",
                                __typename: "BlockchainTransaction",
                            },
                            cursor: "587c83d005c622df11800",
                            __typename: "BlockchainTransactionEdge",
                        },
                        {
                            node: {
                                hash: "34c0895d65e005129d0ef1f87783bd4ea48a5be79306a15dea85a44efc0c2e13",
                                __typename: "BlockchainTransaction",
                            },
                            cursor: "587c83d005c622df11801",
                            __typename: "BlockchainTransactionEdge",
                        },
                        {
                            node: {
                                hash: "3cf3672f5288eec840ea535ad38d790e1c94a582619a903191f6881e43c50bab",
                                __typename: "BlockchainTransaction",
                            },
                            cursor: "587c83d005c622df11802",
                            __typename: "BlockchainTransactionEdge",
                        },
                        {
                            node: {
                                hash: "bf2b8eac7e0e64948fef2300c4ee865c232b42b4986b6e41419f51759d5d42c7",
                                __typename: "BlockchainTransaction",
                            },
                            cursor: "587c83d005c622df11803",
                            __typename: "BlockchainTransactionEdge",
                        },
                        {
                            node: {
                                hash: "c9f365fd3bfa8a6260b5154a22973ae5cd525fbe9dbd3ee632a9f52588295e14",
                                __typename: "BlockchainTransaction",
                            },
                            cursor: "587c83d005c622df11804",
                            __typename: "BlockchainTransactionEdge",
                        },
                        {
                            node: {
                                hash: "7c4f031ac7db3763884eb16d51e6ade302c12fef14708c9b2afce653b07c4361",
                                __typename: "BlockchainTransaction",
                            },
                            cursor: "587c83d005c622df11805",
                            __typename: "BlockchainTransactionEdge",
                        },
                        {
                            node: {
                                hash: "ddf949b10a09878a34d57b64551d32c30cd4ee56e37992fe985537bd6be29308",
                                __typename: "BlockchainTransaction",
                            },
                            cursor: "587c83d005c622df11806",
                            __typename: "BlockchainTransactionEdge",
                        },
                        {
                            node: {
                                hash: "b2df4a58f3af4b7d50f14bf6c235539fdae4c843f38ba98e5251020bc127212f",
                                __typename: "BlockchainTransaction",
                            },
                            cursor: "587c83d005c622df11807",
                            __typename: "BlockchainTransactionEdge",
                        },
                    ],
                    pageInfo: {
                        startCursor: "587c83d005c622df11800",
                        endCursor: "587c83d005c622df11807",
                        hasNextPage: false,
                        __typename: "PageInfo",
                    },
                    __typename: "BlockchainTransactionsConnection",
                },
                __typename: "BlockchainAccountQuery",
            },
            __typename: "BlockchainQuery",
        },
    })
})

test("blockchain.account.transactions_by_lt", async () => {
    if (!server) {
        throw new Error("server is null")
    }
    const client = createTestClient({ useWebSockets: true })

    // filter by account_addresses
    const queryResult = await client.query({
        query: gql`
            {
                blockchain {
                    account(
                        address: "0:198880de2ac28bcf71ab8082d7132d22c337879351cae8b48dd397aadf12f206"
                    ) {
                        transactions_by_lt(after: "0xd36a70c5b81", first: 5) {
                            edges {
                                node {
                                    hash
                                    lt
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
                }
            }
        `,
    })

    expect(queryResult.data).toMatchObject({
        blockchain: {
            account: {
                transactions_by_lt: {
                    edges: [
                        {
                            node: {
                                hash: "34c0895d65e005129d0ef1f87783bd4ea48a5be79306a15dea85a44efc0c2e13",
                                lt: "0xd36a70c5b85",
                                __typename: "BlockchainTransaction",
                            },
                            cursor: "0xd36a70c5b85",
                            __typename: "BlockchainTransactionEdge",
                        },
                        {
                            node: {
                                hash: "3cf3672f5288eec840ea535ad38d790e1c94a582619a903191f6881e43c50bab",
                                lt: "0xd36a70c5b86",
                                __typename: "BlockchainTransaction",
                            },
                            cursor: "0xd36a70c5b86",
                            __typename: "BlockchainTransactionEdge",
                        },
                        {
                            node: {
                                hash: "bf2b8eac7e0e64948fef2300c4ee865c232b42b4986b6e41419f51759d5d42c7",
                                lt: "0xd36a70c5b89",
                                __typename: "BlockchainTransaction",
                            },
                            cursor: "0xd36a70c5b89",
                            __typename: "BlockchainTransactionEdge",
                        },
                        {
                            node: {
                                hash: "c9f365fd3bfa8a6260b5154a22973ae5cd525fbe9dbd3ee632a9f52588295e14",
                                lt: "0xd36a70c5b8d",
                                __typename: "BlockchainTransaction",
                            },
                            cursor: "0xd36a70c5b8d",
                            __typename: "BlockchainTransactionEdge",
                        },
                        {
                            node: {
                                hash: "7c4f031ac7db3763884eb16d51e6ade302c12fef14708c9b2afce653b07c4361",
                                lt: "0xd36a70c5b94",
                                __typename: "BlockchainTransaction",
                            },
                            cursor: "0xd36a70c5b94",
                            __typename: "BlockchainTransactionEdge",
                        },
                    ],
                    pageInfo: {
                        startCursor: "0xd36a70c5b85",
                        endCursor: "0xd36a70c5b94",
                        hasNextPage: true,
                        __typename: "PageInfo",
                    },
                    __typename: "BlockchainTransactionsConnection",
                },
                __typename: "BlockchainAccountQuery",
            },
            __typename: "BlockchainQuery",
        },
    })
})

test("transactions_by_in_msg", async () => {
    if (!server) {
        throw new Error("server is null")
    }
    const client = createTestClient({ useWebSockets: true })

    const queryResult = await client.query({
        query: gql`
            {
                blockchain {
                    transactions_by_in_msg(
                        msg_hash: "35bd031e5342b1b875524468d219ce64bbc74243870e1a1e706fb48f7820c340"
                    ) {
                        hash
                    }
                }
            }
        `,
    })

    expect(queryResult.data).toMatchObject({
        blockchain: {
            transactions_by_in_msg: [
                {
                    hash: "34c0895d65e005129d0ef1f87783bd4ea48a5be79306a15dea85a44efc0c2e13",
                },
            ],
        },
    })
})

test("blockchain.transactions", async () => {
    if (!server) {
        throw new Error("server is null")
    }
    const client = createTestClient({ useWebSockets: true })

    // simple forward
    const queryResult1 = await client.query({
        query: gql`
            {
                blockchain {
                    transactions(
                        master_seq_no_range: { start: 8898621, end: 8898625 }
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
            }
        `,
    })
    expect(queryResult1.data.blockchain.transactions).toMatchObject({
        edges: [
            {
                node: {
                    id: "transaction/c9f365fd3bfa8a6260b5154a22973ae5cd525fbe9dbd3ee632a9f52588295e14",
                    hash: "c9f365fd3bfa8a6260b5154a22973ae5cd525fbe9dbd3ee632a9f52588295e14",
                    chain_order: "587c83d005c622df11804",
                    balance_delta: "-0x43afcdfd",
                },
                cursor: "587c83d005c622df11804",
            },
            {
                node: {
                    id: "transaction/7c4f031ac7db3763884eb16d51e6ade302c12fef14708c9b2afce653b07c4361",
                    hash: "7c4f031ac7db3763884eb16d51e6ade302c12fef14708c9b2afce653b07c4361",
                    chain_order: "587c83d005c622df11805",
                    balance_delta: "-0xe28448",
                },
                cursor: "587c83d005c622df11805",
            },
            {
                node: {
                    id: "transaction/ddf949b10a09878a34d57b64551d32c30cd4ee56e37992fe985537bd6be29308",
                    hash: "ddf949b10a09878a34d57b64551d32c30cd4ee56e37992fe985537bd6be29308",
                    chain_order: "587c83d005c622df11806",
                    balance_delta: "-0xe28448",
                },
                cursor: "587c83d005c622df11806",
            },
            {
                node: {
                    id: "transaction/b2df4a58f3af4b7d50f14bf6c235539fdae4c843f38ba98e5251020bc127212f",
                    hash: "b2df4a58f3af4b7d50f14bf6c235539fdae4c843f38ba98e5251020bc127212f",
                    chain_order: "587c83d005c622df11807",
                    balance_delta: "0x373dfba8",
                },
                cursor: "587c83d005c622df11807",
            },
            {
                node: {
                    id: "transaction/defa2e50e9c71f4e5a53a653494c79b84f9cdd0bfdcff1f736985f3a80f3cc5c",
                    hash: "defa2e50e9c71f4e5a53a653494c79b84f9cdd0bfdcff1f736985f3a80f3cc5c",
                    chain_order: "587c83d005c635aa11000",
                    balance_delta: "0x37840928",
                },
                cursor: "587c83d005c635aa11000",
            },
        ],
        pageInfo: {
            startCursor: "587c83d005c622df11804",
            endCursor: "587c83d005c635aa11000",
            hasNextPage: true,
        },
    })

    // forward limited by realiable_chain_order_boundary (587c83f)
    const queryResult2 = await client.query({
        query: gql`
            {
                blockchain {
                    transactions(
                        master_seq_no_range: { start: 8898621, end: 8898625 }
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
            }
        `,
    })
    expect(queryResult2.data.blockchain.transactions).toMatchObject({
        edges: [
            {
                node: {
                    chain_order: "587c83em06",
                },
                cursor: "587c83em06",
            },
            {
                node: {
                    chain_order: "587c83em07",
                },
                cursor: "587c83em07",
            },
        ],
        pageInfo: {
            startCursor: "587c83em06",
            endCursor: "587c83em07",
            hasNextPage: false,
        },
    })

    // backward
    const queryResult3 = await client.query({
        query: gql`
            {
                blockchain {
                    transactions(
                        master_seq_no_range: { start: 8898621, end: 8898625 }
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
            }
        `,
    })
    expect(queryResult3.data.blockchain.transactions).toMatchObject({
        edges: [
            {
                node: {
                    chain_order: "587c83em03",
                },
                cursor: "587c83em03",
            },
            {
                node: {
                    chain_order: "587c83em04",
                },
                cursor: "587c83em04",
            },
            {
                node: {
                    chain_order: "587c83em05",
                },
                cursor: "587c83em05",
            },
            {
                node: {
                    chain_order: "587c83em06",
                },
                cursor: "587c83em06",
            },
            {
                node: {
                    chain_order: "587c83em07",
                },
                cursor: "587c83em07",
            },
        ],
        pageInfo: {
            startCursor: "587c83em03",
            endCursor: "587c83em07",
            hasPreviousPage: true,
        },
    })

    // backward with before
    const queryResult4 = await client.query({
        query: gql`
            {
                blockchain {
                    transactions(
                        master_seq_no_range: { start: 8898621, end: 8898625 }
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
            }
        `,
    })
    expect(queryResult4.data.blockchain.transactions).toMatchObject({
        edges: [
            {
                node: {
                    chain_order: "587c83em00",
                },
                cursor: "587c83em00",
            },
            {
                node: {
                    chain_order: "587c83em01",
                },
                cursor: "587c83em01",
            },
            {
                node: {
                    chain_order: "587c83em02",
                },
                cursor: "587c83em02",
            },
            {
                node: {
                    chain_order: "587c83em03",
                },
                cursor: "587c83em03",
            },
            {
                node: {
                    chain_order: "587c83em04",
                },
                cursor: "587c83em04",
            },
        ],
        pageInfo: {
            startCursor: "587c83em00",
            endCursor: "587c83em04",
            hasPreviousPage: true,
        },
    })

    // filter by account_addresses
    const queryResult5 = await client.query({
        query: gql`
            {
                blockchain {
                    transactions(
                        master_seq_no_range: { start: 8898621, end: 8898622 }
                        workchain: 0
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
            }
        `,
    })
    expect(queryResult5.data).toMatchObject({
        blockchain: {
            transactions: {
                edges: [
                    {
                        node: {
                            account_addr:
                                "0:198880de2ac28bcf71ab8082d7132d22c337879351cae8b48dd397aadf12f206",
                        },
                        cursor: "587c83d005c622df11800",
                    },
                    {
                        node: {
                            account_addr:
                                "0:198880de2ac28bcf71ab8082d7132d22c337879351cae8b48dd397aadf12f206",
                        },
                        cursor: "587c83d005c622df11801",
                    },
                    {
                        node: {
                            account_addr:
                                "0:198880de2ac28bcf71ab8082d7132d22c337879351cae8b48dd397aadf12f206",
                        },
                        cursor: "587c83d005c622df11802",
                    },
                    {
                        node: {
                            account_addr:
                                "0:198880de2ac28bcf71ab8082d7132d22c337879351cae8b48dd397aadf12f206",
                        },
                        cursor: "587c83d005c622df11803",
                    },
                    {
                        node: {
                            account_addr:
                                "0:198880de2ac28bcf71ab8082d7132d22c337879351cae8b48dd397aadf12f206",
                        },
                        cursor: "587c83d005c622df11804",
                    },
                    {
                        node: {
                            account_addr:
                                "0:198880de2ac28bcf71ab8082d7132d22c337879351cae8b48dd397aadf12f206",
                        },
                        cursor: "587c83d005c622df11805",
                    },
                    {
                        node: {
                            account_addr:
                                "0:198880de2ac28bcf71ab8082d7132d22c337879351cae8b48dd397aadf12f206",
                        },
                        cursor: "587c83d005c622df11806",
                    },
                    {
                        node: {
                            account_addr:
                                "0:198880de2ac28bcf71ab8082d7132d22c337879351cae8b48dd397aadf12f206",
                        },
                        cursor: "587c83d005c622df11807",
                    },
                    {
                        node: {
                            account_addr:
                                "0:04963554676ce00b6fff7d02f47e612e5a8441da5d63b878d1aaebb1eb3c91ae",
                        },
                        cursor: "587c83d005c635aa11000",
                    },
                ],
                pageInfo: {
                    startCursor: "587c83d005c622df11800",
                    endCursor: "587c83d005c635aa11000",
                    hasNextPage: false,
                },
            },
        },
    })
})

test("blockchain.account.messages", async () => {
    if (!server) {
        throw new Error("server is null")
    }
    const client = createTestClient({ useWebSockets: true })
    let queryResult: ReturnType<typeof client.query> extends Promise<infer T>
        ? T
        : never

    // no filter
    queryResult = await client.query({
        query: gql`
            {
                blockchain {
                    account(
                        address: "0:198880de2ac28bcf71ab8082d7132d22c337879351cae8b48dd397aadf12f206"
                    ) {
                        messages(first: 3) {
                            edges {
                                node {
                                    hash
                                    created_lt
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
                }
            }
        `,
    })
    expect(queryResult.data).toMatchObject({
        blockchain: {
            account: {
                messages: {
                    edges: [
                        {
                            node: {
                                hash: "32c75632aebfb890145477374cb265e2572d513fccbc7f5f58e108531fa42022",
                                created_lt: "0xd36a6edd706",
                            },
                            cursor: "587c83d005c622df1180000",
                        },
                        {
                            node: {
                                hash: "7a1234b3331c9ac515501c0ab46d480d68a066e402f445fd6592a07a9e7c79f2",
                                created_lt: "0xd36a70c5b82",
                            },
                            cursor: "587c83d005c622df1180001",
                        },
                        {
                            node: {
                                hash: "f195c12dbf145f6d050d824a2b984da6b7c38795ddd0ce1f6bd881c8cd883ec3",
                                created_lt: "0xd36a70c5b83",
                            },
                            cursor: "587c83d005c622df1180002",
                        },
                    ],
                    pageInfo: {
                        startCursor: "587c83d005c622df1180000",
                        endCursor: "587c83d005c622df1180002",
                        hasNextPage: true,
                    },
                },
            },
        },
    })

    // IntIn
    queryResult = await client.query({
        query: gql`
            {
                blockchain {
                    account(
                        address: "0:198880de2ac28bcf71ab8082d7132d22c337879351cae8b48dd397aadf12f206"
                    ) {
                        messages(
                            msg_type: [IntIn]
                            first: 3
                            after: "587c83d005c622df1180500"
                        ) {
                            edges {
                                node {
                                    hash
                                    created_lt
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
                }
            }
        `,
    })
    expect(queryResult.data).toMatchObject({
        blockchain: {
            account: {
                messages: {
                    edges: [
                        {
                            node: {
                                hash: "06f2ed90879d6a067bbbc4546844bdc84fbe49b9c114484df1e798bbc4c2e709",
                                created_lt: "0xd36a70c5b8c",
                            },
                            cursor: "587c83d005c622df1180600",
                        },
                        {
                            node: {
                                hash: "3cba5d7893ad386410f2982aae45f683850fbcf40c19fcbffdf818f1c9b5248e",
                                created_lt: "0xd36a70c5b93",
                            },
                            cursor: "587c83d005c622df1180700",
                        },
                    ],
                    pageInfo: {
                        startCursor: "587c83d005c622df1180600",
                        endCursor: "587c83d005c622df1180700",
                        hasNextPage: false,
                    },
                },
            },
        },
    })

    // ExtIn
    const queryResult3 = await client.query({
        query: gql`
            {
                blockchain {
                    account(
                        address: "0:198880de2ac28bcf71ab8082d7132d22c337879351cae8b48dd397aadf12f206"
                    ) {
                        messages(msg_type: [ExtIn], first: 3) {
                            edges {
                                node {
                                    hash
                                    created_lt
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
                }
            }
        `,
    })
    expect(queryResult3.data).toMatchObject({
        blockchain: {
            account: {
                messages: {
                    edges: [
                        {
                            node: {
                                hash: "34cd2e7055f09a01bc7143751366dbb6ab24eb08536d8eee347fbb78455d2ad9",
                                created_lt: "0xd36a70c5b98",
                            },
                            cursor: "587c83d005c622df1180702",
                        },
                    ],
                    pageInfo: {
                        startCursor: "587c83d005c622df1180702",
                        endCursor: "587c83d005c622df1180702",
                        hasNextPage: false,
                    },
                },
            },
        },
    })

    // IntOut
    queryResult = await client.query({
        query: gql`
            {
                blockchain {
                    account(
                        address: "0:198880de2ac28bcf71ab8082d7132d22c337879351cae8b48dd397aadf12f206"
                    ) {
                        messages(msg_type: [IntOut], first: 3) {
                            edges {
                                node {
                                    hash
                                    created_lt
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
                }
            }
        `,
    })
    expect(queryResult.data).toMatchObject({
        blockchain: {
            account: {
                messages: {
                    edges: [
                        {
                            node: {
                                hash: "7a1234b3331c9ac515501c0ab46d480d68a066e402f445fd6592a07a9e7c79f2",
                                created_lt: "0xd36a70c5b82",
                            },
                            cursor: "587c83d005c622df1180001",
                        },
                        {
                            node: {
                                hash: "f195c12dbf145f6d050d824a2b984da6b7c38795ddd0ce1f6bd881c8cd883ec3",
                                created_lt: "0xd36a70c5b83",
                            },
                            cursor: "587c83d005c622df1180002",
                        },
                        {
                            node: {
                                hash: "4b2707f00c3c35c288ccc3acfbc9fb1b6e0fd89e60f25ed6b86bed653c3a9757",
                                created_lt: "0xd36a70c5b87",
                            },
                            cursor: "587c83d005c622df1180201",
                        },
                    ],
                    pageInfo: {
                        startCursor: "587c83d005c622df1180001",
                        endCursor: "587c83d005c622df1180201",
                        hasNextPage: true,
                    },
                },
            },
        },
    })

    // ExtOut
    queryResult = await client.query({
        query: gql`
            {
                blockchain {
                    account(
                        address: "0:198880de2ac28bcf71ab8082d7132d22c337879351cae8b48dd397aadf12f206"
                    ) {
                        messages(msg_type: [ExtOut], first: 3) {
                            edges {
                                node {
                                    hash
                                    created_lt
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
                }
            }
        `,
    })
    expect(queryResult.data).toMatchObject({
        blockchain: {
            account: {
                messages: {
                    edges: [
                        {
                            node: {
                                hash: "f7d8071627d9f236a2329082c4d859ac95cb1be24dbc40d45f07684676bb8a2f",
                                created_lt: "0xd36a70c5b84",
                            },
                            cursor: "587c83d005c622df1180003",
                        },
                        {
                            node: {
                                hash: "64cd2e7055f09a01bc7143751366dbb6ab24eb08536d8eee347fbb78455d2ad9",
                                created_lt: "0xd36a70c5b97",
                            },
                            cursor: "587c83d005c622df1180701",
                        },
                    ],
                    pageInfo: {
                        startCursor: "587c83d005c622df1180003",
                        endCursor: "587c83d005c622df1180701",
                        hasNextPage: false,
                    },
                },
            },
        },
    })

    // Inbound
    queryResult = await client.query({
        query: gql`
            {
                blockchain {
                    account(
                        address: "0:198880de2ac28bcf71ab8082d7132d22c337879351cae8b48dd397aadf12f206"
                    ) {
                        messages(
                            msg_type: [ExtIn, IntIn]
                            first: 3
                            after: "587c83d005c622df1180500"
                        ) {
                            edges {
                                node {
                                    hash
                                    created_lt
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
                }
            }
        `,
    })
    expect(queryResult.data).toMatchObject({
        blockchain: {
            account: {
                messages: {
                    edges: [
                        {
                            node: {
                                hash: "06f2ed90879d6a067bbbc4546844bdc84fbe49b9c114484df1e798bbc4c2e709",
                                created_lt: "0xd36a70c5b8c",
                            },
                            cursor: "587c83d005c622df1180600",
                        },
                        {
                            node: {
                                hash: "3cba5d7893ad386410f2982aae45f683850fbcf40c19fcbffdf818f1c9b5248e",
                                created_lt: "0xd36a70c5b93",
                            },
                            cursor: "587c83d005c622df1180700",
                        },
                        {
                            node: {
                                hash: "34cd2e7055f09a01bc7143751366dbb6ab24eb08536d8eee347fbb78455d2ad9",
                                created_lt: "0xd36a70c5b98",
                            },
                            cursor: "587c83d005c622df1180702",
                        },
                    ],
                    pageInfo: {
                        startCursor: "587c83d005c622df1180600",
                        endCursor: "587c83d005c622df1180702",
                        hasNextPage: false,
                    },
                },
            },
        },
    })

    // Outbound
    queryResult = await client.query({
        query: gql`
            {
                blockchain {
                    account(
                        address: "0:198880de2ac28bcf71ab8082d7132d22c337879351cae8b48dd397aadf12f206"
                    ) {
                        messages(msg_type: [ExtOut, IntOut], first: 3) {
                            edges {
                                node {
                                    hash
                                    created_lt
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
                }
            }
        `,
    })
    expect(queryResult.data).toMatchObject({
        blockchain: {
            account: {
                messages: {
                    edges: [
                        {
                            node: {
                                hash: "7a1234b3331c9ac515501c0ab46d480d68a066e402f445fd6592a07a9e7c79f2",
                                created_lt: "0xd36a70c5b82",
                            },
                            cursor: "587c83d005c622df1180001",
                        },
                        {
                            node: {
                                hash: "f195c12dbf145f6d050d824a2b984da6b7c38795ddd0ce1f6bd881c8cd883ec3",
                                created_lt: "0xd36a70c5b83",
                            },
                            cursor: "587c83d005c622df1180002",
                        },
                        {
                            node: {
                                hash: "f7d8071627d9f236a2329082c4d859ac95cb1be24dbc40d45f07684676bb8a2f",
                                created_lt: "0xd36a70c5b84",
                            },
                            cursor: "587c83d005c622df1180003",
                        },
                    ],
                    pageInfo: {
                        startCursor: "587c83d005c622df1180001",
                        endCursor: "587c83d005c622df1180003",
                        hasNextPage: true,
                    },
                },
            },
        },
    })

    // counterparty
    queryResult = await client.query({
        query: gql`
            {
                blockchain {
                    account(
                        address: "0:198880de2ac28bcf71ab8082d7132d22c337879351cae8b48dd397aadf12f206"
                    ) {
                        messages(
                            counterparties: [
                                "0:61de96fd3796674103210d92f26de76e4ef5de1878eafc9b5d5f13f3a92bbe58"
                            ]
                            first: 3
                        ) {
                            edges {
                                node {
                                    hash
                                    created_lt
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
                }
            }
        `,
    })
    expect(queryResult.data).toMatchObject({
        blockchain: {
            account: {
                messages: {
                    edges: [
                        {
                            node: {
                                hash: "607ba96c3460736e8b9ce4d95100249e1e4d2d1a8eb106a60ebba5315bad84d8",
                                created_lt: "0xd36a70c5b8f",
                            },
                            cursor: "587c83d005c622df1180402",
                        },
                    ],
                    pageInfo: {
                        startCursor: "587c83d005c622df1180402",
                        endCursor: "587c83d005c622df1180402",
                        hasNextPage: false,
                    },
                },
            },
        },
    })

    // check self messages duplication (with different cursors)
    queryResult = await client.query({
        query: gql`
            {
                blockchain {
                    account(
                        address: "0:198880de2ac28bcf71ab8082d7132d22c337879351cae8b48dd397aadf12f206"
                    ) {
                        messages(
                            counterparties: [
                                "0:198880de2ac28bcf71ab8082d7132d22c337879351cae8b48dd397aadf12f206"
                            ]
                            first: 3
                        ) {
                            edges {
                                node {
                                    hash
                                    created_lt
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
                }
            }
        `,
    })
    expect(queryResult.data).toMatchObject({
        blockchain: {
            account: {
                messages: {
                    edges: [
                        {
                            node: {
                                hash: "f195c12dbf145f6d050d824a2b984da6b7c38795ddd0ce1f6bd881c8cd883ec3",
                                created_lt: "0xd36a70c5b83",
                            },
                            cursor: "587c83d005c622df1180002",
                        },
                        {
                            node: {
                                hash: "f195c12dbf145f6d050d824a2b984da6b7c38795ddd0ce1f6bd881c8cd883ec3",
                                created_lt: "0xd36a70c5b83",
                            },
                            cursor: "587c83d005c622df1180200",
                        },
                        {
                            node: {
                                hash: "4b2707f00c3c35c288ccc3acfbc9fb1b6e0fd89e60f25ed6b86bed653c3a9757",
                                created_lt: "0xd36a70c5b87",
                            },
                            cursor: "587c83d005c622df1180201",
                        },
                    ],
                    pageInfo: {
                        startCursor: "587c83d005c622df1180002",
                        endCursor: "587c83d005c622df1180201",
                        hasNextPage: true,
                    },
                },
            },
        },
    })
})

test("blockchain fetchers", async () => {
    if (!server) {
        throw new Error("server is null")
    }
    const client = createTestClient({ useWebSockets: true })
    let queryResult: ReturnType<typeof client.query> extends Promise<infer T>
        ? T
        : never

    // account
    queryResult = await client.query({
        query: gql`
            {
                blockchain {
                    account(
                        address: "0:3d3442a1de0c4f720ee64546ef9714fe0dd83d848115652253b2d7a782c2c954"
                    ) {
                        info {
                            id
                            address
                            code_hash
                        }
                    }
                }
            }
        `,
    })
    expect(queryResult.data).toMatchObject({
        blockchain: {
            account: {
                info: {
                    id: "account/0:3d3442a1de0c4f720ee64546ef9714fe0dd83d848115652253b2d7a782c2c954",
                    address:
                        "0:3d3442a1de0c4f720ee64546ef9714fe0dd83d848115652253b2d7a782c2c954",
                    code_hash:
                        "80d6c47c4a25543c9b397b71716f3fae1e2c5d247174c52e2c19bd896442b105",
                },
            },
        },
    })

    // block
    queryResult = await client.query({
        query: gql`
            {
                blockchain {
                    block(
                        hash: "52cba78cf9ddc27995031456677141fdf679aa22057bdcec3f55a62556c7dda5"
                    ) {
                        id
                        hash
                        created_by
                    }
                }
            }
        `,
    })
    expect(queryResult.data).toMatchObject({
        blockchain: {
            block: {
                id: "block/52cba78cf9ddc27995031456677141fdf679aa22057bdcec3f55a62556c7dda5",
                hash: "52cba78cf9ddc27995031456677141fdf679aa22057bdcec3f55a62556c7dda5",
                created_by:
                    "edccfb0fcd990bac6f8ece14c9323e8bddf0d8fb9d9895bd0f02fc5d50d8af39",
            },
        },
    })

    // block by seq_no
    queryResult = await client.query({
        query: gql`
            {
                blockchain {
                    block_by_seq_no(
                        workchain: 0
                        shard: "9800000000000000"
                        seq_no: 12987363
                    ) {
                        id
                        hash
                        created_by
                    }
                }
            }
        `,
    })
    expect(queryResult.data).toMatchObject({
        blockchain: {
            block_by_seq_no: {
                id: "block/32ec85d6913b2add9763c86b62e381a8675e4a7b1d565de6f948fec7cb49fd05",
                hash: "32ec85d6913b2add9763c86b62e381a8675e4a7b1d565de6f948fec7cb49fd05",
                created_by:
                    "a308a2b0b0a5b888227d592b593c9aca91f7a0ce2c8b70b9e7a726775d116cf1",
            },
        },
    })

    // transaction
    queryResult = await client.query({
        query: gql`
            {
                blockchain {
                    transaction(
                        hash: "d80e4a907b2405a1141e6f9953abbd175a2393ca04ac1e59aae07297c1637afc"
                    ) {
                        id
                        hash
                        account_addr
                    }
                }
            }
        `,
    })
    expect(queryResult.data).toMatchObject({
        blockchain: {
            transaction: {
                id: "transaction/d80e4a907b2405a1141e6f9953abbd175a2393ca04ac1e59aae07297c1637afc",
                hash: "d80e4a907b2405a1141e6f9953abbd175a2393ca04ac1e59aae07297c1637afc",
                account_addr:
                    "-1:04f64c6afbff3dd10d8ba6707790ac9670d540f37a9448b0337baa6a5a92acac",
            },
        },
    })

    // message
    queryResult = await client.query({
        query: gql`
            {
                blockchain {
                    message(
                        hash: "32c75632aebfb890145477374cb265e2572d513fccbc7f5f58e108531fa42022"
                    ) {
                        id
                        hash
                        dst
                    }
                }
            }
        `,
    })
    expect(queryResult.data).toMatchObject({
        blockchain: {
            message: {
                id: "message/32c75632aebfb890145477374cb265e2572d513fccbc7f5f58e108531fa42022",
                hash: "32c75632aebfb890145477374cb265e2572d513fccbc7f5f58e108531fa42022",
                dst: "0:198880de2ac28bcf71ab8082d7132d22c337879351cae8b48dd397aadf12f206",
            },
        },
    })
})
test("blockchain master_seq_no", async () => {
    if (!server) {
        throw new Error("server is null")
    }
    const client = createTestClient({ useWebSockets: true })
    let queryResult: ReturnType<typeof client.query> extends Promise<infer T>
        ? T
        : never

    // block
    queryResult = await client.query({
        query: gql`
            {
                blockchain {
                    block(
                        hash: "52cba78cf9ddc27995031456677141fdf679aa22057bdcec3f55a62556c7dda5"
                    ) {
                        master_seq_no
                    }
                }
            }
        `,
    })
    expect(queryResult.data).toMatchObject({
        blockchain: {
            block: {
                master_seq_no: 8898619,
            },
        },
    })

    // transaction
    queryResult = await client.query({
        query: gql`
            {
                blockchain {
                    transaction(
                        hash: "d80e4a907b2405a1141e6f9953abbd175a2393ca04ac1e59aae07297c1637afc"
                    ) {
                        master_seq_no
                    }
                }
            }
        `,
    })
    expect(queryResult.data).toMatchObject({
        blockchain: {
            transaction: {
                master_seq_no: 8898619,
            },
        },
    })

    // message
    queryResult = await client.query({
        query: gql`
            {
                blockchain {
                    message(
                        hash: "32c75632aebfb890145477374cb265e2572d513fccbc7f5f58e108531fa42022"
                    ) {
                        master_seq_no
                        chain_order
                    }
                }
            }
        `,
    })
    expect(queryResult.data).toMatchObject({
        blockchain: {
            message: {
                master_seq_no: 8898619,
                chain_order: "587c83bm0901",
            },
        },
    })
})

test("blockchain.account.transactions. Invalid account should throw", async () => {
    if (!server) {
        throw new Error("server is null")
    }
    const client = createTestClient({ useWebSockets: true })
    try {
        await client.query({
            query: gql`
                {
                    blockchain {
                        account(address: "afc") {
                            info {
                                id
                            }
                        }
                    }
                }
            `,
        })
        expect(true).toBe(false) // this line should be unreachable!
    } catch (err: any) {
        expect(err.constructor.name).toBe("ApolloError")
        const { message, extensions } = err.graphQLErrors[0]
        expect(extensions.code).toEqual("GRAPHQL_VALIDATION_FAILED")
        expect(message).toEqual("Invalid account address")
    }
})

test("blockchain.account.transactions_by_lt", async () => {
    const test = await TestSetup.create({})

    const result = (await test.queryBlockchain(
        `
            account(address:"-1:2bf05f1fee01b78c2b34ddc0ee0eb663be88c1341bdeff3dbec9e7cf37be8601") {
                transactions_by_lt(last:2 before:"0xd36a6edd702" allow_latest_inconsistent_data:true) {
                    edges {
                        node {
                            lt
                        }
                    }
                }
            }`,
    )) as any
    const trs = result.account.transactions_by_lt.edges.map((x: any) => x.node)
    console.log(">>>", trs)
    expect(trs.length).toBeGreaterThan(0)
    await test.close()
})
