// @flow
import gql from 'graphql-tag';
import { AggregationFn } from '../src/server/data/aggregations';
import type { AccessRights } from '../src/server/auth';
import QLogs from '../src/server/logs';
import TONQServer from '../src/server/server';
import { createLocalArangoTestData, createTestClient, testConfig } from './init-tests';

test('Aggregations Fast Detector', async () => {
    const granted: AccessRights = { granted: true, restrictToAccounts: [] };
    const data = createLocalArangoTestData(new QLogs());

    const isFast = async (filter, fields) => {
        const q = data.transactions.createAggregationQuery(filter, fields, granted);
        return q && data.transactions.isFastAggregationQuery(q.text, filter, q.helpers);
    }
    expect(await isFast({}, [
        { fn: AggregationFn.MIN, field: 'lt' },
    ])).toBeTruthy();
    expect(await isFast({}, [
        { fn: AggregationFn.MIN, field: 'outmsg_cnt' },
    ])).toBeFalsy();
    expect(await isFast({ outmsg_cnt: { eq: 1 } }, [
        { fn: AggregationFn.SUM, field: 'lt' },
    ])).toBeTruthy();
    expect(await isFast({ outmsg_cnt: { eq: 1 } }, [
        { fn: AggregationFn.COUNT, field: '' },
    ])).toBeFalsy();
    expect(await isFast({}, [
        { fn: AggregationFn.COUNT, field: '' },
    ])).toBeTruthy();
});

function aggregate(items, getValue) {
    let sum = getValue(items[0]);
    let min = sum;
    let max = sum;
    for (let i = 1; i < items.length; i += 1) {
        const value = getValue(items[i]);
        if (value < min) {
            min = value;
        }
        if (value > max) {
            max = value;
        }
        if (typeof value !== 'string') {
            sum += value;
        }
    }
    const avg = typeof sum !== 'string'
        ? Math.trunc(sum / items.length)
        : sum;
    return { sum, min, max, avg };
}

test('Partitioned Data', async () => {
    const server = new TONQServer({
        config: testConfig,
        logs: new QLogs(),
        data: createLocalArangoTestData(new QLogs()),
    });
    await server.start();
    const client = createTestClient({ useWebSockets: true });
    let messages = (await client.query({
        query: gql`query { messages(filter: { value: {ne: null, lt: "1000000000000000000"}} limit: 10){id value created_at created_lt} }`,
    })).data.messages;
    let aggregated = (await client.query({
        query: gql`${`query { aggregateMessages(
            filter: {id: {in: ["${messages.map(x => x.id).join('","')}"]}}
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
        }`}`,
    })).data.aggregateMessages;
    // If we run on test evn where hot and cold are point to the same arango.
    // we must take in account that aggregation works on two similar set of data.
    if (Number(aggregated[0]) > messages.length) {
        messages = messages.concat(messages);
    }
    expect(aggregated.length).toEqual(15);
    expect(Number(aggregated[0])).toEqual(messages.length);

    // BigInt(2)
    const values = aggregate(messages, m => Number(m.value));
    expect(Number(aggregated[1])).toEqual(values.min);
    expect(Number(aggregated[2])).toEqual(values.max);
    expect(Number(aggregated[3])).toEqual(values.sum);
    expect(Number(aggregated[4])).toEqual(values.avg);

    // BigInt(1)
    const lts = aggregate(messages, m => Number(m.created_lt));
    expect(Number(aggregated[5])).toEqual(lts.min);
    expect(Number(aggregated[6])).toEqual(lts.max);
    expect(Number(aggregated[7])).toEqual(lts.sum);
    expect(Number(aggregated[8])).toEqual(lts.avg);

    // Number
    const ats = aggregate(messages, m => Number(m.created_at));
    expect(Number(aggregated[9])).toEqual(ats.min);
    expect(Number(aggregated[10])).toEqual(ats.max);
    expect(Number(aggregated[11])).toEqual(ats.sum);
    expect(Number(aggregated[12])).toEqual(ats.avg);

    // String
    const ids = aggregate(messages, m => m.id);
    expect(aggregated[13]).toEqual(ids.min);
    expect(aggregated[14]).toEqual(ids.max);

    // nulls
    aggregated = (await client.query({
        query: gql`${`query { aggregateMessages(
            filter: {id: {in: ["1"]}}
            fields: [
                {field: "value", fn: COUNT}
                {field: "value", fn: MIN}
            ]) 
        }`}`,
    })).data.aggregateMessages;

    server.stop();
});

test('Partitioned data with null', async () => {
    const server = new TONQServer({
        config: testConfig,
        logs: new QLogs(),
        data: createLocalArangoTestData(new QLogs()),
    });
    await server.start();
    const client = createTestClient({ useWebSockets: true });
    const aggregated = (await client.query({
        query: gql`${`query { aggregateMessages(
            filter: {id: {in: ["1"]}}
            fields: [
                {field: "value", fn: COUNT}
                {field: "value", fn: MIN}
            ]) 
        }`}`,
    })).data.aggregateMessages;
    expect(aggregated[1]).toBeNull();
    server.stop();
});
