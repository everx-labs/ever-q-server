import gql from "graphql-tag"
import { AggregationFn } from "../server/data/aggregations"
import QLogs from "../server/logs"
import EverQServer from "../server/server"
import {
    aggregationQueryText,
    createLocalArangoTestData,
    createTestClient,
    normalized,
    testConfig,
} from "./init-tests"
import { FieldAggregation } from "@eversdk/core"
import { CollectionFilter } from "../server/filter/filters"
import { required } from "../server/utils"

test("Optimized MIN, MAX", () => {
    const data = createLocalArangoTestData(new QLogs())

    expect(
        aggregationQueryText(required(data.blocks), [
            {
                field: "seq_no",
                fn: AggregationFn.MIN,
            },
        ]),
    ).toEqual(
        normalized(`
        RETURN [
            (FOR doc IN blocks LET a = doc.seq_no SORT a ASC LIMIT 1 RETURN a)[0]
        ]
    `),
    )
})

test("Aggregations Fast Detector", async () => {
    const data = createLocalArangoTestData(new QLogs())

    const isFast = async (
        filter: CollectionFilter,
        fields: FieldAggregation[],
    ) => {
        const q = required(data.transactions).createAggregationQuery(
            filter,
            fields,
        )
        return (
            q !== null &&
            required(data.transactions).isFastAggregationQuery(
                q.text,
                filter,
                q.queries,
            )
        )
    }
    expect(
        await isFast({}, [
            {
                fn: AggregationFn.MIN,
                field: "lt",
            },
        ]),
    ).toBeTruthy()
    expect(
        await isFast({}, [
            {
                fn: AggregationFn.MIN,
                field: "outmsg_cnt",
            },
        ]),
    ).toBeFalsy()
    expect(
        await isFast({ outmsg_cnt: { eq: 1 } }, [
            {
                fn: AggregationFn.SUM,
                field: "lt",
            },
        ]),
    ).toBeTruthy()
    expect(
        await isFast({ outmsg_cnt: { eq: 1 } }, [
            {
                fn: AggregationFn.COUNT,
                field: "",
            },
        ]),
    ).toBeFalsy()
    expect(
        await isFast({}, [
            {
                fn: AggregationFn.COUNT,
                field: "",
            },
        ]),
    ).toBeTruthy()
})

function aggregateNumbers<T>(items: T[], getValue: (item: T) => bigint) {
    let sum = getValue(items[0])
    let min = sum
    let max = sum
    for (let i = 1; i < items.length; i += 1) {
        const value = getValue(items[i])
        if (value < min) {
            min = value
        }
        if (value > max) {
            max = value
        }
        sum += value
    }
    const avg = sum / BigInt(items.length)
    return {
        sum,
        min,
        max,
        avg,
    }
}

function aggregateStrings<T>(items: T[], getValue: (item: T) => string) {
    let min = getValue(items[0])
    let max = min
    for (let i = 1; i < items.length; i += 1) {
        const value = getValue(items[i])
        if (value < min) {
            min = value
        }
        if (value > max) {
            max = value
        }
    }
    return {
        min,
        max,
    }
}

test("Partitioned Data", async () => {
    const data = createLocalArangoTestData(new QLogs())
    const server = new EverQServer({
        config: testConfig,
        logs: new QLogs(),
        data,
    })
    await server.start()
    const client = createTestClient({ useWebSockets: true })
    let messages = (
        await client.query({
            query: gql`
                query {
                    messages(
                        filter: {
                            value: { ne: null, lt: "1000000000000000000" }
                        }
                        limit: 10
                    ) {
                        id
                        value
                        created_at
                        created_lt
                    }
                }
            `,
        })
    ).data.messages
    const aggregated: (string | number)[] = (
        await client.query({
            query: gql`
                ${`query { aggregateMessages(
            filter: {id: {in: ["${messages
                .map((x: { id: string }) => x.id)
                .join('","')}"]}}
            fields: [
                {field: "value", fn: COUNT}
                {field: "value", fn: MIN}
                {field: "value", fn: MAX}
                {field: "value", fn: SUM}
                {field: "value", fn: AVERAGE}
                {field: "created_lt", fn: MIN}
                {field: "created_lt", fn: MAX}
                {field: "created_lt", fn: SUM}
                {field: "created_lt", fn: AVERAGE}
                {field: "created_at", fn: MIN}
                {field: "created_at", fn: MAX}
                {field: "created_at", fn: SUM}
                {field: "created_at", fn: AVERAGE}
                {field: "id", fn: MIN}
                {field: "id", fn: MAX}
            ])
        }`}
            `,
        })
    ).data.aggregateMessages
    // If we run on test evn where hot and cold are point to the same arango.
    // we must take in account that aggregation works on two similar set of data.
    if (Number(aggregated[0]) > messages.length) {
        messages = messages.concat(messages)
    }
    expect(aggregated.length).toEqual(15)
    expect(Number(aggregated[0])).toEqual(messages.length)

    // BigInt(2)
    const values = aggregateNumbers<{ value: string }>(messages, m =>
        BigInt(m.value),
    )
    expect(BigInt(aggregated[1])).toEqual(values.min)
    expect(BigInt(aggregated[2])).toEqual(values.max)
    expect(BigInt(aggregated[3])).toEqual(values.sum)
    expect(BigInt(aggregated[4])).toEqual(values.avg)

    // BigInt(1)
    const lts = aggregateNumbers<{ created_lt: string }>(messages, m =>
        BigInt(m.created_lt),
    )
    expect(BigInt(aggregated[5])).toEqual(lts.min)
    expect(BigInt(aggregated[6])).toEqual(lts.max)
    expect(BigInt(aggregated[7])).toEqual(lts.sum)
    expect(BigInt(aggregated[8])).toEqual(lts.avg)

    // Number
    const ats = aggregateNumbers<{ created_at: number }>(messages, m =>
        BigInt(m.created_at),
    )
    expect(BigInt(aggregated[9])).toEqual(ats.min)
    expect(BigInt(aggregated[10])).toEqual(ats.max)
    expect(BigInt(aggregated[11])).toEqual(ats.sum)
    expect(BigInt(aggregated[12])).toEqual(ats.avg)

    // String
    const ids = aggregateStrings<{ id: string }>(messages, m => m.id)
    expect(aggregated[13]).toEqual(ids.min)
    expect(aggregated[14]).toEqual(ids.max)

    void server.stop()
})

test("Partitioned data with null", async () => {
    const data = createLocalArangoTestData(new QLogs())
    const server = new EverQServer({
        config: testConfig,
        logs: new QLogs(),
        data,
    })
    await server.start()
    const client = createTestClient({ useWebSockets: true })
    const aggregated: (string | number)[] = (
        await client.query({
            query: gql`
                ${`query { aggregateMessages(
            filter: {id: {in: ["1"]}}
            fields: [
                {field: "value", fn: COUNT}
                {field: "value", fn: MIN}
            ])
        }`}
            `,
        })
    ).data.aggregateMessages
    expect(aggregated[1]).toBeNull()
    void server.stop()
})

test.skip("Balance delta sum", async () => {
    const data = createLocalArangoTestData(new QLogs())
    const server = new EverQServer({
        config: testConfig,
        logs: new QLogs(),
        data,
    })
    await server.start()
    const client = createTestClient({ useWebSockets: true })
    const account = (
        await client.query({
            query: gql`
                query {
                    accounts(filter: { workchain_id: { eq: 0 } }, limit: 1) {
                        id
                        balance
                    }
                }
            `,
        })
    ).data.accounts[0]

    console.log(account.id)

    const aggregated: (string | number)[] = (
        await client.query({
            query: gql`
                ${`query { aggregateTransactions(
            filter: {account_addr: {eq: "${account.id}"}}
            fields: [
                {field: "balance_delta", fn: SUM}
            ])
        }`}
            `,
        })
    ).data.aggregateTransactions

    expect(BigInt(aggregated[0]).toString()).toEqual(
        BigInt(account.balance).toString(),
    )

    void server.stop()
})
