import { unixSecondsToString } from "../server/filter/filters"
import { packageJson } from "../server/utils"
import { testServerQuery } from "./init-tests"
import { resolveAddress } from "../server/address"
import { addressStringFormatBase64 } from "@eversdk/core"

const { version } = packageJson()

type Messages = {
    messages: {
        id: string
        value: string
        src: string
        dst: string
        src_transaction: Record<string, unknown> | null
        dst_transaction: Record<string, unknown> | null
        created_at: number
        created_at_string: string
    }[]
}

test("version", async () => {
    const info = await testServerQuery("query{info{version}}")
    expect(info).toMatchObject({ info: { version } })
})

test("time companion fields", async () => {
    const minTime = 1000000000000 // 2001-09-09T01:46:40.000Z
    const maxTime = 10000000000000 // 2286-11-20T17:46:40.000Z

    const isValidSeconds = (value: number | null, string: string | null) => {
        if (value === null && string === null) {
            return true
        }
        const ms = (value ?? 0) * 1000
        if (ms < minTime || ms > maxTime) {
            return false
        }
        return unixSecondsToString(value) === string
    }
    const data = await testServerQuery<Messages>(
        "query { messages { created_at created_at_string } }",
    )
    for (const message of data.messages) {
        expect(
            isValidSeconds(message.created_at, message.created_at_string),
        ).toBeTruthy()
    }
})

test("when conditions for joins", async () => {
    const data = await testServerQuery<Messages>(`
    query {
        messages {
            dst_transaction(timeout: 0, when: { value: { gt: "0" } }) {
                id
            }
            value
            dst
        }
    }
    `)
    for (const message of data.messages) {
        if (message.value && BigInt(message.value) > BigInt(0)) {
            expect(message.dst_transaction).toBeTruthy()
        } else if (message.dst) {
            expect(message.dst_transaction).toBeNull()
        }
    }
})

test("Case insensitive filters", async () => {
    const query = async (collection: string, field: string, value: unknown) => {
        return (
            await testServerQuery<Record<string, Record<string, unknown>[]>>(
                `query { ${collection}(filter:{${field}:{eq:"${value}"}}) { ${field} } }`,
            )
        )[collection]
    }
    const testField = async (collection: string, field: string) => {
        const docs = (
            await testServerQuery<Record<string, Record<string, unknown>[]>>(
                `query { ${collection} { ${field} } }`,
            )
        )[collection]
        const valueLower = `${docs[0][field]}`.toLowerCase()
        const docsUpper = await query(
            collection,
            field,
            valueLower.toUpperCase(),
        )
        const docsLower = await query(collection, field, valueLower)
        expect(docsLower.length).toEqual(docsUpper.length)
        for (let i = 0; i < docsLower.length; i += 1) {
            expect(`${docsUpper[i][field]}`.toLowerCase()).toEqual(valueLower)
            expect(`${docsLower[i][field]}`.toLowerCase()).toEqual(valueLower)
        }
    }
    await testField("messages", "src")
    await testField("messages", "dst")
    await testField("transactions", "account_addr")
})

test("Address filters", async () => {
    const query = async (
        collection: string,
        field: string,
        value: unknown,
        format: string,
    ) => {
        return (
            await testServerQuery<Record<string, Record<string, unknown>[]>>(
                `query { ${collection}(filter:{${field}:{eq:"${value}"}}) { ${field}(format: ${format}) } }`,
            )
        )[collection]
    }
    const testField = async (collection: string, field: string) => {
        const docs = (
            await testServerQuery<Record<string, Record<string, unknown>[]>>(
                `query { ${collection} { ${field} } }`,
            )
        )[collection]
        const addrHex = `${docs[0][field]}`
        const addrBase64 = resolveAddress(
            addrHex,
            addressStringFormatBase64(false, false, false),
        )
        const docsBase64 = await query(collection, field, addrBase64, "BASE64_NOURL_NOTEST_NOBOUNCE")
        const docsHex = await query(collection, field, addrHex, "HEX")
        expect(docsHex.length).toEqual(docsBase64.length)
        for (let i = 0; i < docsHex.length; i += 1) {
            expect(`${docsBase64[i][field]}`).toEqual(addrBase64)
            expect(`${docsHex[i][field]}`).toEqual(addrHex)
        }
    }
    await testField("messages", "src")
    await testField("messages", "dst")
    await testField("transactions", "account_addr")
})

test("Non Exists acc_type for missing accounts", async () => {
    const id1 = `0:${"1".repeat(64)}`
    const id2 = `-1:${"2".repeat(64)}`
    const idEq = (
        await testServerQuery<Record<string, Record<string, unknown>[]>>(
            `query { accounts(filter:{id:{eq:"${id1}"}})
            { id acc_type acc_type_name balance workchain_id } }`,
        )
    )["accounts"]

    const accounts = (ids: string[]) =>
        ids.map(id => ({
            id,
            acc_type: 3,
            acc_type_name: "NonExist",
            balance: "0x0",
            workchain_id: Number(id.split(":")[0]),
        }))
    expect(idEq).toEqual(accounts([id1]))

    const idIn = (
        await testServerQuery<Record<string, Record<string, unknown>[]>>(
            `query { accounts(filter:{id:{in:["${id1}", "${id2}"]}})
            { id acc_type acc_type_name balance workchain_id } }`,
        )
    )["accounts"]
    expect(idIn).toEqual(accounts([id1, id2]))

    const blockchainAccountAddress = (
        await testServerQuery<Record<string, Record<string, unknown>[]>>(
            `query { blockchain { account(address:"${id1}")
            { info { id acc_type acc_type_name balance workchain_id } transactions { edges { node { hash } } } messages { edges { node { hash } } } } } }`,
        )
    )["blockchain"]

    expect(blockchainAccountAddress).toEqual({
        account: {
            info: {
                id: `account/${id1}`,
                acc_type: 3,
                acc_type_name: "NonExist",
                balance: "0x0",
                workchain_id: Number(id1.split(":")[0]),
            },
            transactions: { edges: [] },
            messages: { edges: [] },
        },
    })
})
