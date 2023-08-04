import { createTestData, TestSetup } from "./blockchain-mock"
import { accounts, transactions } from "./blockchain-mock-data"
import {
    BlockchainAccount,
    BlockchainTransaction,
} from "../server/graphql/blockchain/resolvers-types-generated"
import { toU64String } from "../server/utils"

beforeAll(async () => {
    await createTestData()
})

const mockAcc = {
    id: "accounts/0:aaa5bc9cc88f3965b258e14ac9c99b61c9c55d3394d001969c3f5b36b35d07ef",
    _key: "0:aaa5bc9cc88f3965b258e14ac9c99b61c9c55d3394d001969c3f5b36b35d07ef",
    workchain_id: 0,
    boc: "te6ccgECEwEAAtEAAm/ACqpbycyI85ZbJY4UrJyZthycVdM5TQAZacP1s2s10H7yJoURQyWsOoAAAAAAAAAAMQdIC1ATQAYBAWGAAADEsoxIzAAAAAAADbugVptUh94vSUj+5DUD/DWpPFXxmwjBE7eKNHS9J10IXlBgAgIDzyAFAwEB3gQAA9AgAEHa02qQ+8XpKR/chqB/hrUnir4zYRgidvFGjpek66ELygwCJv8A9KQgIsABkvSg4YrtU1gw9KEJBwEK9KQg9KEIAAACASAMCgH+/38h1SDHAZFwjhIggQIA1yHXC/8i+QFTIfkQ8qjiItMf0z81IHBwcO1E0PQEATQggQCA10WY0z8BM9M/ATKWgggbd0Ay4nAjJrmOJCX4I4ED6KgkoLmOF8glAfQAJs8LPyPPCz8izxYgye1UfzIw3t4FXwWZJCLxQAFfCtsw4AsADIA08vBfCgIBIBANAQm8waZuzA4B/nDtRND0BAEyINaAMu1HIm+MI2+MIW+MIO1XXwRwaHWhYH+6lWh4oWAx3u1HbxHXC/+68uBk+AD6QNN/0gAwIcIAIJcwIfgnbxC53vLgZSIiInDIcc8LASLPCgBxz0D4KM8WJM8WI/oCcc9AcPoCcPoCgEDPQPgjzwsfcs9AIMkPABYi+wBfBV8DcGrbMAIBSBIRAOu4iQAnXaiaBBAgEFrovk5gHwAdqPkQICAZ6Bk6DfGAPoCLLfGdquAmDh2o7eJQCB6B3lFa4X/9qOQN4iYAORl/+ToN6j2q/ajkDeJZHoALBBjgMcIGDhnhZ/BBA27oGeFn7jnoMrnizjnoPEAt4jni2T2qjg1QAMrccCHXSSDBII4rIMAAjhwj0HPXIdcLACDAAZbbMF8H2zCW2zBfB9sw4wTZltswXwbbMOME2eAi0x80IHS7II4VMCCCEP////+6IJkwIIIQ/////rrf35bbMF8H2zDgIyHxQAFfBw==",
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
}

test("cloud15.account-provider", async () => {
    const test1 = await TestSetup.create({ port: 1 })

    const refAccount = (await test1.query(`accounts { id boc data code }`))
        .accounts[0]

    const query = `account(address: "${refAccount.id}") { info { boc data code } }`
    const queryResult1 = (await test1.queryBlockchain(query)) as any
    const account1 = queryResult1.account.info
    expect(account1.boc).toBe(refAccount.boc)
    expect(account1.data).toBe(refAccount.data)
    expect(account1.code).toBe(refAccount.code)
    await test1.close()

    const test2 = await TestSetup.create({
        port: 2,
        accounts: {
            [refAccount.id]: mockAcc.boc,
        },
    })
    const queryResult2 = (await test2.queryBlockchain(query)) as any
    const account2 = queryResult2.account.info
    expect(account2.boc).toBe(mockAcc.boc)
    expect(account2.data).toBe(mockAcc.data)
    expect(account2.code).toBe(mockAcc.code)
    await test2.close()
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
        accounts?: { [hash: string]: string }
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
        [testAcc._key]: mockAcc.boc,
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
        expect(page.pageInfo.startCursor).toBe("ad36a72ae001")
        expect(page.pageInfo.endCursor).toBe("ad36a7496483")
    }
    await testPagination(true)
    await testPagination(false)
    await test.close()
})
