import gql from "graphql-tag"
import {
    combineResults,
    QDataCombiner,
    QDataPrecachedCombiner,
} from "../server/data/data-provider"
import QLogs from "../server/logs"
import EverQServer from "../server/server"
import {
    createTestClient,
    MockCache,
    testConfig,
    mock,
    createTestData,
    createLocalArangoTestData,
} from "./init-tests"

test("Query without id should be filtered by limit", async () => {
    const data = createLocalArangoTestData(new QLogs())
    const server = new EverQServer({
        config: testConfig,
        logs: new QLogs(),
        data,
    })
    await server.start()
    const client = createTestClient({ useWebSockets: true })
    const messages = await client.query({
        query: gql`
            query {
                messages(limit: 1) {
                    value
                    created_at
                    created_lt
                }
            }
        `,
    })
    expect(messages.data.messages.length).toEqual(1)
    void server.stop()
})

type Accounts = {
    accounts: { id: string }[]
}

type Transactions = {
    transactions: { id: string }[]
}

test("Data Broker", async () => {
    const mut = mock([
        {
            _key: "a1",
            balance: "2",
        },
        {
            _key: "a2",
            balance: "1",
        },
    ])
    const cache = new MockCache()
    const hot = mock([
        {
            _key: "t1",
            lt: "4",
        },
        {
            _key: "t4",
            lt: "1",
        },
    ])
    const cold = [
        mock([
            {
                _key: "t3",
                lt: "3",
            },
        ]),
        mock([
            {
                _key: "t2",
                lt: "2",
            },
        ]),
    ]

    const logs = new QLogs()
    const immut = new QDataCombiner([
        hot,
        new QDataPrecachedCombiner(
            logs.create("cache"),
            cache,
            cold,
            testConfig.networkName,
            testConfig.cacheKeyPrefix,
        ),
    ])
    const server = new EverQServer({
        config: testConfig,
        logs: logs,
        data: createTestData({
            blockchain: {
                accounts: mut,
                blocks: immut,
                transactions: immut,
            },
            counterparties: mut,
            chainRangesVerification: hot,
        }),
    })
    await server.start()
    const client = createTestClient({ useWebSockets: true })
    const accounts = (
        await client.query<Accounts>({
            query: gql`
                query {
                    accounts(orderBy: { path: "id" }) {
                        id
                    }
                }
            `,
        })
    ).data.accounts
    expect(accounts.map(x => x.id).join(" ")).toEqual("a1 a2")
    expect(mut.queryCount).toEqual(1)
    expect(hot.queryCount).toEqual(0)
    expect(cold[0].queryCount).toEqual(0)
    expect(cold[1].queryCount).toEqual(0)
    expect(cache.getCount).toEqual(0)
    expect(cache.setCount).toEqual(0)

    let transactions = (
        await client.query<Transactions>({
            query: gql`
                query {
                    transactions(orderBy: { path: "id" }) {
                        id
                        lt
                    }
                }
            `,
        })
    ).data.transactions
    expect(transactions.map(x => x.id).join(" ")).toEqual("t1 t2 t3 t4")
    expect(mut.queryCount).toEqual(1)
    expect(hot.queryCount).toEqual(1)
    expect(cold[0].queryCount).toEqual(1)
    expect(cold[1].queryCount).toEqual(1)
    expect(cache.getCount).toEqual(1)
    expect(cache.setCount).toEqual(2)

    transactions = (
        await client.query({
            query: gql`
                query {
                    transactions(orderBy: { path: "id" }) {
                        id
                        lt
                    }
                }
            `,
        })
    ).data.transactions
    expect(transactions.map(x => x.id).join(" ")).toEqual("t1 t2 t3 t4")
    expect(mut.queryCount).toEqual(1)
    expect(hot.queryCount).toEqual(2)
    expect(cold[0].queryCount).toEqual(1)
    expect(cold[1].queryCount).toEqual(1)
    expect(cache.getCount).toEqual(2)
    expect(cache.setCount).toEqual(2)

    transactions = (
        await client.query({
            query: gql`
                query {
                    transactions(orderBy: { path: "id" }, limit: 1) {
                        id
                        lt
                    }
                }
            `,
        })
    ).data.transactions
    expect(transactions.length).toEqual(1)

    void server.stop()
})

test("Limit of combined data", async () => {
    const mut = mock([
        {
            _key: "a1",
            balance: "2",
        },
        {
            _key: "a2",
            balance: "1",
        },
    ])
    const withLt = (
        prefix: string,
        count: number,
        id: number,
        lt: number,
    ): { _key: string; lt: number }[] => {
        const data = []
        for (let i = 0; i < count; i += 1) {
            data.push({
                _key: `${prefix}${id + i}`,
                lt: lt + 1,
            })
        }
        return data
    }
    const cache = new MockCache()
    const hot = mock(withLt("t", 100, 0, 0))
    const cold = [
        mock(withLt("t", 100, 100, 100)),
        mock(withLt("t", 100, 200, 200)),
    ]

    const logs = new QLogs()
    const immut = new QDataCombiner([
        hot,
        new QDataPrecachedCombiner(
            logs.create("cache"),
            cache,
            cold,
            testConfig.networkName,
            testConfig.cacheKeyPrefix,
        ),
    ])
    const server = new EverQServer({
        config: testConfig,
        logs: logs,
        data: createTestData({
            blockchain: {
                accounts: mut,
                blocks: immut,
                transactions: immut,
            },
            counterparties: mut,
            chainRangesVerification: hot,
        }),
    })
    await server.start()
    const client = createTestClient({ useWebSockets: true })
    const transactions = (
        await client.query({
            query: gql`
                query {
                    transactions(orderBy: { path: "id" }, limit: 100) {
                        id
                        lt
                    }
                }
            `,
        })
    ).data.transactions

    expect(transactions.length).toEqual(50)
    void server.stop()
})

test("Combiner", async () => {
    const results = [
        {
            _key: "47001019291c9fbb55acde131880db394a7f31243be676a3724dbe6d17a7160d",
            gen_utime: 1623961839,
            seq_no: 13688395,
        },
        {
            _key: "e01d5a660a419a334ec1be7890da6d0df0c4b18410f9288c3308817f806ca675",
            gen_utime: 1623961839,
            seq_no: 13690034,
        },
        {
            _key: "425dd01c443b753c1b66e86e6a3c05b266f53e1d50839f6a753128544fc6cb67",
            gen_utime: 1623961839,
            seq_no: 13690814,
        },
        {
            _key: "550d40daef31681f39ab3550cb9d56b4770ff760150ba64e53f8334344305f47",
            gen_utime: 1623961839,
            seq_no: 13692015,
        },
        {
            _key: "7ac30f565df739d9cf05cd39240c555029deb64ae18ffe686f487aa6611a5016",
            gen_utime: 1623961840,
            seq_no: 13687309,
        },
        {
            _key: "f3514929b725aa878c763eebe7c61bcae27841e954af225a2dc95023d7f6fa13",
            gen_utime: 1623961840,
            seq_no: 13688501,
        },
        {
            _key: "1d13783cd7797503e4063b23548adf0f7ff5d83fbbcc6bb5b0c33d8e5eb3366b",
            gen_utime: 1623961840,
            seq_no: 13691073,
        },
        {
            _key: "338c50af88bf4ac9bf42f240f5ec0884cf97c933e877e2e06f4afc1f02524a59",
            gen_utime: 1623961840,
            seq_no: 13692665,
        },
        {
            _key: "acd75d19204d3dd47ec872fee2aae8eca1c071bce9136a54c88da475476feb65",
            gen_utime: 1623961840,
            seq_no: 13693811,
        },
        {
            _key: "706f34febe494f090edbe0824d8dbfb92378bdcc199879fa2e0c6eaa579800a6",
            gen_utime: 1623961840,
            seq_no: 13697521,
        },
        {
            _key: "fe293380752b03b08b37f2d84991cd3e7dafaceb0920e27e4c70997257480dc5",
            gen_utime: 1623961840,
            seq_no: 13697707,
        },
        {
            _key: "33d20c147111ee0fc503920943b510457b12d7b8b3c4db03e557858cb84f738c",
            gen_utime: 1623961841,
            seq_no: 9356207,
        },
        {
            _key: "44c7d4813db7a288fe3e5f43403da7da6a70fd0046277298c1eb4f61fa47618a",
            gen_utime: 1623961841,
            seq_no: 13688903,
        },
        {
            _key: "12eb0e173447f8c32170a441c82932c04172a9cc23aaa092621e2b0c0835ebcc",
            gen_utime: 1623961841,
            seq_no: 13690815,
        },
        {
            _key: "4e8e8e2cf433f07cf115c65180e073e7a6c92ce70f3561cf645651816926a2f7",
            gen_utime: 1623961841,
            seq_no: 13692016,
        },
        {
            _key: "76ffee49fc5282363d7ace45ff9876374d192260480ae29466626123f3f8f576",
            gen_utime: 1623961841,
            seq_no: 13693035,
        },
        {
            _key: "d8a6f5f85c499a65787064a8fb9476d2e8ddb21f35c5cc014004b77a871f0610",
            gen_utime: 1623961841,
            seq_no: 13703157,
        },
        {
            _key: "45c3758c0603a950b977e9828628223be53d50c43c09770dd2d4074b1fd2ba45",
            gen_utime: 1623961842,
            seq_no: 13688396,
        },
        {
            _key: "facc221f89cf0b97efb3fa33b84f89972dd080aa2a5e880220a7b1da77cd4a7d",
            gen_utime: 1623961842,
            seq_no: 13688502,
        },
        {
            _key: "f9e8717d781f08c3319fea43db2ed3a591f975e115c1c45c0a37b220c6377103",
            gen_utime: 1623961842,
            seq_no: 13690863,
        },
        {
            _key: "a4930f0cc0e263abb6347cc256170d3cb6b4b43740c0afb3201fb857838625d1",
            gen_utime: 1623961842,
            seq_no: 13691074,
        },
        {
            _key: "c1077697f3097fe9dea6f576e55eec558b8286442b127ff08947fc78ab5dbcf3",
            gen_utime: 1623961843,
            seq_no: 13688904,
        },
        {
            _key: "8d6c107cfae4fdcca88744d5b57ab2586df8280133691808cc3c2d12f498e4fc",
            gen_utime: 1623961843,
            seq_no: 13692017,
        },
        {
            _key: "a6c13cae8eedae8a2319c48a2013e8ea4bdffaca6183c9eb7cfaa32070e0da4e",
            gen_utime: 1623961843,
            seq_no: 13692666,
        },
        {
            _key: "16e5116564a8d7d836fc4d80083a086eb588515406c0fa1d8b02fe9d7290e68f",
            gen_utime: 1623961843,
            seq_no: 13693812,
        },
        {
            _key: "1a833f97fbae8ced0c25838e7e44358ddb7a5026aa72cea76d35db055a5d7ebd",
            gen_utime: 1623961843,
            seq_no: 13697522,
        },
        {
            _key: "fe6dcd6104bbe72890d24a8cbe2dbfe794b59755e9da80f0dbfc84207a1a5ae3",
            gen_utime: 1623961843,
            seq_no: 13697708,
        },
        {
            _key: "005d548e0a8c2ef6fb6d3c427d85ba67257058b990673fe156256ff07811361e",
            gen_utime: 1623961843,
            seq_no: 13703158,
        },
        {
            _key: "fd42c99b37af97cdf521e68ef92898438cbd4674a945b026bef6f849d4b9f45b",
            gen_utime: 1623961844,
            seq_no: 13688397,
        },
        {
            _key: "88147441bc845c731f135ae3a5c742347a74f4f5f71ea5a07af0f5fb00a027cb",
            gen_utime: 1623961844,
            seq_no: 13688503,
        },
        {
            _key: "df09662928bff4af10b147160147a8904c6aabcd3065c5e682162db11525c8d8",
            gen_utime: 1623961844,
            seq_no: 13690035,
        },
        {
            _key: "059187834a1667ce672a593e57e8c4c590e772a34de308b983b66410f278b9fc",
            gen_utime: 1623961844,
            seq_no: 13690816,
        },
        {
            _key: "eff43ec082c034fa8b76a1f2800c982f276bcfdcc0068a3def380996e442515a",
            gen_utime: 1623961844,
            seq_no: 13693036,
        },
        {
            _key: "97938bac01c59d2f632e536fa542ff5b473a9eb46ac6a78e955daaf64308b32d",
            gen_utime: 1623961845,
            seq_no: 9356208,
        },
        {
            _key: "1d5c9851297c9e2e6686b7263921ec0edf603d48ec0533f4eae3c5f150a26b50",
            gen_utime: 1623961845,
            seq_no: 13687310,
        },
        {
            _key: "63864b3fd7783982c2fbd8dc875c3391512e8b79a0cc87d41a77dc103df64a5a",
            gen_utime: 1623961845,
            seq_no: 13690864,
        },
        {
            _key: "dc652a80b3fcccd68163626bf798a28cb37db80e29fc0e5be5f4afcf474da924",
            gen_utime: 1623961845,
            seq_no: 13691075,
        },
        {
            _key: "f6986ec44eb90311af5ae0d3095a19c382314eb2efa303f5e3c17bf83cd1c097",
            gen_utime: 1623961845,
            seq_no: 13693813,
        },
        {
            _key: "8e1c5e7fe3fc5e57d6a9699ce179fd03ec05fa7bca3f614c7ce08f356ba70279",
            gen_utime: 1623961845,
            seq_no: 13697523,
        },
        {
            _key: "ab29a2cb004b3a2cb32a0bb2cde2efdb8072280f7ec66fd334ff12c3499af510",
            gen_utime: 1623961845,
            seq_no: 13703159,
        },
        {
            _key: "e90e7d3d11cef5070be79f5ccf73b5724760eb74903e3088be9b4c8544c52161",
            gen_utime: 1623961846,
            seq_no: 13688398,
        },
        {
            _key: "34e74725794fda4b675e8e2e0289e4a728e55fdc5ae10a764ecfd3fc6fc4388e",
            gen_utime: 1623961846,
            seq_no: 13688905,
        },
        {
            _key: "bc9006af220a65c9829d4b896c7f7b9e5611a251d1d760c9aebb0d3af19bb3ff",
            gen_utime: 1623961846,
            seq_no: 13690036,
        },
        {
            _key: "1605bf4b9eec1e2d1e30202e69cd6291955dd4bf48caeb9bfd503b6583d8d4d9",
            gen_utime: 1623961846,
            seq_no: 13690817,
        },
        {
            _key: "1ca835fa276c7888d99e65f8a66a792ac5b7a497022487d00a545da128120d94",
            gen_utime: 1623961846,
            seq_no: 13691505,
        },
        {
            _key: "b7ea997b134024e45a84de127d0403547edcc0c096c5170fbdfd6af8ac4b84a6",
            gen_utime: 1623961846,
            seq_no: 13692018,
        },
        {
            _key: "ce46d5df5362918edc1be9e44c49be964642e52d7644d48ec3f2168d89415bb9",
            gen_utime: 1623961846,
            seq_no: 13692667,
        },
        {
            _key: "ed504f504e53f0cc7541595ae6cdca0ca397df0ec92a3a025992d915787c033e",
            gen_utime: 1623961846,
            seq_no: 13697709,
        },
        {
            _key: "f839d2419c093dcc02b9386014681afc25ceb8f942166d42aaf639df17d61f1f",
            gen_utime: 1623961847,
            seq_no: 13687311,
        },
        {
            _key: "21bee010ca639eda3af07cae10777548e5820d1e1c4734dab59d5c71d9483303",
            gen_utime: 1623961847,
            seq_no: 13688504,
        },
    ]
    const combined = combineResults(
        [results],
        [
            {
                path: "gen_utime",
                direction: "ASC",
            },
            {
                path: "seq_no",
                direction: "ASC",
            },
        ],
    )
    for (let i = 0; i < results.length; i += 1) {
        expect(combined[i]).toEqual(results[i])
    }
})
