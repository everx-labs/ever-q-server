import { AccountMock, createTestData, TestSetup } from "./blockchain-mock"
import { accounts, transactions } from "./blockchain-mock-data"
import {
    BlockchainAccount,
    BlockchainTransaction,
} from "../server/graphql/blockchain/resolvers-types-generated"
import { toU64String } from "../server/utils"
import {
    accountDbFields,
    convertDocFromDb,
} from "../server/graphql/blockchain/fetchers"
import { bucketName } from "../server/data/boc-provider"

beforeAll(async () => {
    await createTestData()
})

// _key: "0:aaa5bc9cc88f3965b258e14ac9c99b61c9c55d3394d001969c3f5b36b35d07ef",
// id: "accounts/0:aaa5bc9cc88f3965b258e14ac9c99b61c9c55d3394d001969c3f5b36b35d07ef",
const mockAcc = {
    boc: "te6ccgECEwEAAtEAAm/ACqpbycyI85ZbJY4UrJyZthycVdM5TQAZacP1s2s10H7yJoURQyWsOoAAAAAAAAAAMQdIC1ATQAYBAWGAAADEsoxIzAAAAAAADbugVptUh94vSUj+5DUD/DWpPFXxmwjBE7eKNHS9J10IXlBgAgIDzyAFAwEB3gQAA9AgAEHa02qQ+8XpKR/chqB/hrUnir4zYRgidvFGjpek66ELygwCJv8A9KQgIsABkvSg4YrtU1gw9KEJBwEK9KQg9KEIAAACASAMCgH+/38h1SDHAZFwjhIggQIA1yHXC/8i+QFTIfkQ8qjiItMf0z81IHBwcO1E0PQEATQggQCA10WY0z8BM9M/ATKWgggbd0Ay4nAjJrmOJCX4I4ED6KgkoLmOF8glAfQAJs8LPyPPCz8izxYgye1UfzIw3t4FXwWZJCLxQAFfCtsw4AsADIA08vBfCgIBIBANAQm8waZuzA4B/nDtRND0BAEyINaAMu1HIm+MI2+MIW+MIO1XXwRwaHWhYH+6lWh4oWAx3u1HbxHXC/+68uBk+AD6QNN/0gAwIcIAIJcwIfgnbxC53vLgZSIiInDIcc8LASLPCgBxz0D4KM8WJM8WI/oCcc9AcPoCcPoCgEDPQPgjzwsfcs9AIMkPABYi+wBfBV8DcGrbMAIBSBIRAOu4iQAnXaiaBBAgEFrovk5gHwAdqPkQICAZ6Bk6DfGAPoCLLfGdquAmDh2o7eJQCB6B3lFa4X/9qOQN4iYAORl/+ToN6j2q/ajkDeJZHoALBBjgMcIGDhnhZ/BBA27oGeFn7jnoMrnizjnoPEAt4jni2T2qjg1QAMrccCHXSSDBII4rIMAAjhwj0HPXIdcLACDAAZbbMF8H2zCW2zBfB9sw4wTZltswXwbbMOME2eAi0x80IHS7II4VMCCCEP////+6IJkwIIIQ/////rrf35bbMF8H2zDgIyHxQAFfBw==",
    meta: {
        id: "0:aaa5bc9cc88f3965b258e14ac9c99b61c9c55d3394d001969c3f5b36b35d07ef",
        workchain_id: 0,
        last_paid: 1689618256,
        bits: "0x1445",
        cells: "0x13",
        public_cells: "0x0",
        last_trans_lt: "0xc",
        balance: "0x1d202d40",
        code: "te6ccgECDQEAAjAAAib/APSkICLAAZL0oOGK7VNYMPShAwEBCvSkIPShAgAAAgEgBgQB/v9/IdUgxwGRcI4SIIECANch1wv/IvkBUyH5EPKo4iLTH9M/NSBwcHDtRND0BAE0IIEAgNdFmNM/ATPTPwEyloIIG3dAMuJwIya5jiQl+COBA+ioJKC5jhfIJQH0ACbPCz8jzws/Is8WIMntVH8yMN7eBV8FmSQi8UABXwrbMOAFAAyANPLwXwoCASAKBwEJvMGmbswIAf5w7UTQ9AQBMiDWgDLtRyJvjCNvjCFvjCDtV18EcGh1oWB/upVoeKFgMd7tR28R1wv/uvLgZPgA+kDTf9IAMCHCACCXMCH4J28Qud7y4GUiIiJwyHHPCwEizwoAcc9A+CjPFiTPFiP6AnHPQHD6AnD6AoBAz0D4I88LH3LPQCDJCQAWIvsAXwVfA3Bq2zACAUgMCwDruIkAJ12omgQQIBBa6L5OYB8AHaj5ECAgGegZOg3xgD6Aiy3xnargJg4dqO3iUAgegd5RWuF//ajkDeImADkZf/k6Deo9qv2o5A3iWR6ACwQY4DHCBg4Z4WfwQQNu6BnhZ+456DK54s456DxALeI54tk9qo4NUADK3HAh10kgwSCOKyDAAI4cI9Bz1yHXCwAgwAGW2zBfB9swltswXwfbMOME2ZbbMF8G2zDjBNngItMfNCB0uyCOFTAgghD/////uiCZMCCCEP////6639+W2zBfB9sw4CMh8UABXwc=",
        code_hash:
            "98196905d4f1d250741ab885ac2411e0a547c72486f613d8cb5f302fd9d51c6a",
        data: "te6ccgEBBQEAZQABYYAAAMSyjEjMAAAAAAANu6BWm1SH3i9JSP7kNQP8Nak8VfGbCMETt4o0dL0nXQheUGABAgPPIAQCAQHeAwAD0CAAQdrTapD7xekpH9yGoH+GtSeKvjNhGCJ28UaOl6TroQvKDA==",
        data_hash:
            "3e86879954d46cb6879303fac1161c787bb16edcc3f42039fbdf725c21c44e8d",
        acc_type: 1,
    },
}

test("cloud15.account-provider", async () => {
    const test1 = await TestSetup.create({ port: 1 })

    const refAccount = (await test1.query(`accounts { id boc data code }`))
        .accounts[0]

    const query = `account(address: "${refAccount.id}") { info { address boc data code } }`
    const queryResult1 = (await test1.queryBlockchain(query)) as any
    const account1 = queryResult1.account.info
    expect(account1.address).toBe(refAccount.id)
    expect(account1.boc).toBe(refAccount.boc)
    expect(account1.data).toBe(refAccount.data)
    expect(account1.code).toBe(refAccount.code)
    await test1.close()

    const test2 = await TestSetup.create({
        port: 2,
        accounts: {
            [refAccount.id]: mockAcc,
        },
    })
    const stat = test2.nodeRpcStat()
    const queryResult2 = (await test2.queryBlockchain(query)) as any
    expect(stat.getAccountBoc).toBe(1)
    expect(stat.getAccountMeta).toBe(0)
    const account2 = queryResult2.account.info
    expect(account2.address).toBe(mockAcc.meta.id)
    expect(account2.boc).toBe(mockAcc.boc)
    expect(account2.data).toBe(mockAcc.meta.data)
    expect(account2.code).toBe(mockAcc.meta.code)

    const queryResult3 = (await test2.queryBlockchain(
        `account(address: "${refAccount.id}") { info { address balance bits } }`,
    )) as any
    const account3 = queryResult3.account.info
    expect(stat.getAccountBoc).toBe(1)
    expect(stat.getAccountMeta).toBe(1)
    expect(account3.address).toBe(mockAcc.meta.id)
    expect(account3.balance).toBe(mockAcc.meta.balance)
    expect(account3.bits).toBe(mockAcc.meta.bits)
    await test2.close()
})

test("cloud15.account-info-by-block", async () => {
    const test1 = await TestSetup.create({ port: 1 })

    const qAccounts = (
        await test1.query(`accounts { id boc data code balance }`)
    ).accounts

    const qAcc = qAccounts[0]

    const queryAcc = async (
        test: TestSetup,
        infoArgs: string,
        result: string,
    ) => {
        return (
            (await test.queryBlockchain(
                `account(address: "${qAcc.id}") { info${infoArgs} { ${result} } }`,
            )) as any
        ).account.info
    }

    try {
        const r = await queryAcc(test1, `(byBlock:"1")`, "boc data code")
        fail(`error expected but result received: ${JSON.stringify(r)}`)
    } catch (err) {
        console.log("expected error: ", err.message)
    }
    await test1.close()

    const accMock = (i: number) => ({
        meta: convertDocFromDb(accounts[i], "HEX", accountDbFields),
        boc: accounts[i].boc,
    })

    const test2 = await TestSetup.create({
        port: 2,
        accounts: {
            [qAcc.id]: accMock(0),
            [`${qAcc.id}:1`]: accMock(0),
            [`${qAcc.id}:2`]: accMock(1),
        },
    })
    const acc = await queryAcc(test2, ``, "balance")
    expect(acc.balance).toBe(qAccounts[0].balance)

    const acc1 = await queryAcc(test2, `(byBlock:"1")`, "balance")
    expect(acc1.balance).toBe(qAccounts[0].balance)

    const acc2 = await queryAcc(test2, `(byBlock:"2")`, "balance")
    expect(acc2.balance).toBe(qAccounts[1].balance)

    await test2.close()
})

test("cloud15.unavailable-account-provider", async () => {
    const testAcc = accounts.find(
        x =>
            x._key ===
            "0:198880de2ac28bcf71ab8082d7132d22c337879351cae8b48dd397aadf12f206",
    ) as BlockchainAccount
    const test = await TestSetup.create({
        port: 2,
        accounts: {
            [testAcc._key]: mockAcc,
        },
    })
    test.accountProvider?.server.close()
    try {
        const r = await test.queryBlockchain(
            `account(address: "${testAcc._key}") { info { boc data code } }`,
        )
        fail(`error expected but result received: ${JSON.stringify(r)}`)
    } catch (err) {
        console.log("Unavailable Evernode RPC error: ", err.message)
    }
})

test("cloud15.joins", async () => {
    const testAcc = accounts.find(
        x =>
            x._key ===
            "0:198880de2ac28bcf71ab8082d7132d22c337879351cae8b48dd397aadf12f206",
    ) as BlockchainAccount

    async function testJoins(options: {
        withArchiveDb: boolean
        queryArchive: boolean
        expectedBoc: string
        accounts?: { [hash: string]: AccountMock }
    }) {
        const test = await TestSetup.create({
            withArchiveDb: options.withArchiveDb,
            accounts: options.accounts,
        })
        const archive = options.queryArchive
        const queryResult = (await test.queryBlockchain(
            `
        transaction(hash: "a1725e48f08eb5b4e07eaaa1979204b02385f351a4485d192f2ef6775ec7b2ca" archive: ${archive}) {
            account { balance boc }
        }
        messageSrc: message(hash: "7a1234b3331c9ac515501c0ab46d480d68a066e402f445fd6592a07a9e7c79f2" archive: ${archive}) {
            src_account { boc }
        }
        messageDst: message(hash: "32c75632aebfb890145477374cb265e2572d513fccbc7f5f58e108531fa42022" archive: ${archive}) {
            dst_account { boc }
        }
        `,
        )) as any
        const tr = queryResult.transaction
        expect(tr.account.boc).toBe(options.expectedBoc)
        const messageSrc = queryResult.messageSrc
        expect(messageSrc.src_account.boc).toBe(options.expectedBoc)
        const messageDst = queryResult.messageDst
        expect(messageDst.dst_account.boc).toBe(options.expectedBoc)
        await test.close()
    }

    await testJoins({
        withArchiveDb: false,
        queryArchive: false,
        expectedBoc: testAcc.boc ?? "",
    })
    await testJoins({
        withArchiveDb: false,
        queryArchive: true,
        expectedBoc: testAcc.boc ?? "",
    })
    await testJoins({
        withArchiveDb: true,
        queryArchive: false,
        expectedBoc: testAcc.boc ?? "",
    })
    await testJoins({
        withArchiveDb: true,
        queryArchive: true,
        expectedBoc: testAcc.boc ?? "",
    })

    const mockAccounts = {
        [testAcc._key]: mockAcc,
    }

    await testJoins({
        withArchiveDb: false,
        queryArchive: false,
        expectedBoc: mockAcc.boc,
        accounts: mockAccounts,
    })
    await testJoins({
        withArchiveDb: false,
        queryArchive: true,
        expectedBoc: mockAcc.boc,
        accounts: mockAccounts,
    })
    await testJoins({
        withArchiveDb: true,
        queryArchive: false,
        expectedBoc: mockAcc.boc,
        accounts: mockAccounts,
    })
    await testJoins({
        withArchiveDb: true,
        queryArchive: true,
        expectedBoc: mockAcc.boc,
        accounts: mockAccounts,
    })
})

test("cloud15.boc-parsing", async () => {
    const test = await TestSetup.create({
        withArchiveDb: true,
    })
    async function testTr(hash: string) {
        const mockTr = transactions.find(
            x => x._key === hash,
        ) as BlockchainTransaction

        const queryResult = (await test.queryBlockchain(
            `
        transaction(hash: "${mockTr._key}" archive: true) {
            lt workchain_id block_id action { action_list_hash }
        }
        `,
        )) as any
        const tr = queryResult.transaction
        expect(tr.workchain_id).toBe(mockTr.workchain_id)
        expect(tr.block_id).toBe(mockTr.block_id)
        expect(toU64String(BigInt(tr.lt))).toBe(mockTr.lt)
        expect(tr.action.action_list_hash).toBe(mockTr.action?.action_list_hash)
    }
    await testTr(
        "a1725e48f08eb5b4e07eaaa1979204b02385f351a4485d192f2ef6775ec7b2ca",
    )
    await testTr(
        "d80e4a907b2405a1141e6f9953abbd175a2393ca04ac1e59aae07297c1637afc",
    )
    await testTr(
        "1217653452696b932502327b024084a0d70b2bb146720836355eda22864f49a3",
    )
    await test.close()
})

test("cloud15.pagination", async () => {
    const test = await TestSetup.create({
        withArchiveDb: true,
    })
    async function testPagination(archive: boolean) {
        const queryResult = (await test.queryBlockchain(
            `
        account(
          address: "-1:3333333333333333333333333333333333333333333333333333333333333333"
        ) {
          transactions_by_lt(last: 5, before: "", archive: ${archive}) {
            edges {
              node {
                now_string
              }
            }
            pageInfo {
              endCursor
              startCursor
              hasNextPage
              hasPreviousPage
            }
          }
        }
        `,
        )) as any
        const page = queryResult.account.transactions_by_lt
        expect(page.pageInfo.startCursor).toBe("0xd36a72ae001")
        expect(page.pageInfo.endCursor).toBe("0xd36a7496483")
    }
    await testPagination(true)
    await testPagination(false)
    await test.close()
})

test("cloud15.master_ranges", async () => {
    const test = await TestSetup.create({
        withArchiveDb: true,
    })
    const range1 = (await test.queryBlockchain(
        `master_seq_no_range(time_start: 1622099906 time_end: 1622099910 archive: false) { start end }`,
    )) as any
    const range2 = (await test.queryBlockchain(
        `master_seq_no_range(time_start: 1622099906 time_end: 1622099910 archive: true) { start end }`,
    )) as any
    expect(range1.master_seq_no_range).toEqual(range2.master_seq_no_range)
    await test.close()
})

test("cloud15.blocks_signatures", async () => {
    const test = await TestSetup.create({
        withArchiveDb: true,
    })

    const q = async (archive: boolean) => {
        const result = (await test.queryBlockchain(
            `blocks(workchain:-1 archive:${archive}) { edges { node {
            seq_no
            signatures {
                catchain_seqno
                gen_utime
                gen_utime_string
                proof
                seq_no
                shard
                sig_weight(format: DEC)
                signatures {
                  s
                  r
                  node_id
                }
                validator_list_hash_short
                workchain_id
            }
            } } }`,
        )) as any
        return result.blocks.edges.map((x: any) => x.node)
    }

    const nonArch = await q(false)
    expect(nonArch[0].signatures !== null).toBeTruthy()
    expect(nonArch[0].signatures.seq_no).toBe(nonArch[0].seq_no)

    const arch = await q(true)
    expect(arch[0].signatures).toBeNull()

    await test.close()
})

test("cloud15.s3-bucket-names", () => {
    const buckets = [
        "some-file-name",
        "7cd2c97c7fd81f3498d3cad64c8d751a95edbf03ce80eeaf9e8f7b3e2ecd59c2",
        "6926e5e954b1541943832c77b736d45365cb882d98c1926c0c2edd532811d09f",
        "b4f8b57574509b0303f8845c1465153ec96868a162e6357605fe6b88323ffbc1",
        "46d58e9c208265fc11d538b7ebe090f1a13f685b1eb408e24fdb0ea8b1250e28",
        "834968f0d418400b9f8b215903d26e2eae01a4b86daf81c84a6ffad997f766d6",
        "be907549f71edd3239b034088aadd281a4b87e03782c2d98df51a95454f7dee1",
        "11b38729f15d4dbaa3814f66921def45bc9da0ebef0f466a497cf885efce4d53",
        "2ef17fc66d177cfb39f85c2fbee75a664c19a6ec7d856beb7a19ee4ff4e91113",
        "b43dfb8edd8f79b486bf928cf67bd21f9939d3e1661603f741e874ab4af58cc9",
        "bb1265e2db2faa5ae9a99af3a8baaa9950eaa3bec7778bef8c582898e0d36631",
        "cb5f507ab331c322de68a1f6a8f2fe58ac5f0061dc9a452b27a4f159b909af10",
        "bc61269bbb253c9e13f441c36430517c059d04037905cbe89eec536803fa69f5",
        "2537dc69bbd74c5ec0da26b20dad952e9daa6d5d54918dbc2faf328af09bb78d",
        "869079f2c936dc26122be9bd30659525a72819ddd18d3b5277cfe7bf7934878b",
        "03f2765eb08ba81e1a598e1b7a50e247a261f589e664ca456b1700ffe2fc80f0",
    ].map(x => bucketName(x, "foo", 10))
    const expected = [7, 3, 5, 4, 5, 3, 1, 7, 0, 6, 1, 6, 5, 0, 6, 1].map(
        x => `foo-${x}`,
    )
    expect(buckets).toStrictEqual(expected)
    expect(bucketName("file", "foo", 0)).toBe("foo")
})
