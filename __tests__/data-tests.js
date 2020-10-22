// @flow
import gql from 'graphql-tag';
import { QDataCombiner, QDataPrecachedCombiner } from '../src/server/data/data-provider';
import QLogs from '../src/server/logs';
import TONQServer from '../src/server/server';
import { createTestClient, MockCache, testConfig, mock, createTestData, createLocalArangoTestData } from './init-tests';

test('Query without id should be filtered by limit', async () => {
    const server = new TONQServer({
        config: testConfig,
        logs: new QLogs(),
        data: createLocalArangoTestData(new QLogs()),
    });
    await server.start();
    const client = createTestClient({ useWebSockets: true });
    let messages = (await client.query({
        query: gql`query { messages(limit: 1){value created_at created_lt} }`,
    }));
console.log(messages)
    expect(messages.data.messages.length).toEqual(1);
    server.stop();
});

test('Data Broker', async () => {
    const mut = mock([
        { _key: 'a1', balance: '2' },
        { _key: 'a2', balance: '1' },
    ]);
    const cache = new MockCache();
    const hot = mock([
        { _key: 't1', lt: '4' },
        { _key: 't4', lt: '1' },
    ]);
    const cold = [
        mock([
            { _key: 't3', lt: '3' },
        ]),
        mock([
            { _key: 't2', lt: '2' },
        ]),
    ];

    const server = new TONQServer({
        config: testConfig,
        logs: new QLogs(),
        data: createTestData({
            mutable: mut,
            immutable: new QDataCombiner([hot, new QDataPrecachedCombiner(cache, cold)]),
        }),
    });
    await server.start();
    const client = createTestClient({ useWebSockets: true });
    const accounts = (await client.query({
        query: gql`query { accounts(orderBy:{path:"id"}) { id } }`,
    })).data.accounts;
    expect(accounts.map(x => x.id).join(' ')).toEqual('a1 a2');
    expect(mut.queryCount).toEqual(1);
    expect(hot.queryCount).toEqual(0);
    expect(cold[0].queryCount).toEqual(0);
    expect(cold[1].queryCount).toEqual(0);
    expect(cache.getCount).toEqual(0);
    expect(cache.setCount).toEqual(0);

    let transactions = (await client.query({
        query: gql`query { transactions(orderBy:{path:"id"}) { id lt } }`,
    })).data.transactions;
    expect(transactions.map(x => x.id).join(' ')).toEqual('t1 t2 t3 t4');
    expect(mut.queryCount).toEqual(1);
    expect(hot.queryCount).toEqual(1);
    expect(cold[0].queryCount).toEqual(1);
    expect(cold[1].queryCount).toEqual(1);
    expect(cache.getCount).toEqual(1);
    expect(cache.setCount).toEqual(1);

    transactions = (await client.query({
        query: gql`query { transactions(orderBy:{path:"id"}) { id lt } }`,
    })).data.transactions;
    expect(transactions.map(x => x.id).join(' ')).toEqual('t1 t2 t3 t4');
    expect(mut.queryCount).toEqual(1);
    expect(hot.queryCount).toEqual(2);
    expect(cold[0].queryCount).toEqual(1);
    expect(cold[1].queryCount).toEqual(1);
    expect(cache.getCount).toEqual(2);
    expect(cache.setCount).toEqual(1);

    transactions = (await client.query({
        query: gql`query { transactions(orderBy:{path:"id"} limit: 1) { id lt } }`,
    })).data.transactions;
    expect(transactions.length).toEqual(1);

    server.stop();
});

