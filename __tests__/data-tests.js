// @flow
import gql from 'graphql-tag';
import { Auth } from '../src/server/auth';
import QBlockchainData, { INDEXES } from '../src/server/data/blockchain';
import type { QDataProviders } from '../src/server/data/data';
import { QDataCombiner, QDataPrecachedCombiner } from '../src/server/data/data-provider';
import type { QDataCache, QDataEvent, QDataProvider, QIndexInfo } from '../src/server/data/data-provider';
import QLogs from '../src/server/logs';
import TONQServer from '../src/server/server';
import { QStats, QTracer } from '../src/server/tracer';
import { createTestClient, testConfig } from './init-tests';

class MockProvider implements QDataProvider {
    data: any;
    queryCount: number;

    constructor(data: any) {
        this.data = data;
        this.queryCount = 0;
    }

    start(): void {
    }

    getCollectionIndexes(collection: string): Promise<QIndexInfo[]> {
        return Promise.resolve(INDEXES[collection].indexes);
    }

    query(text: string, vars: { [string]: any }): Promise<any> {
        this.queryCount += 1;
        return this.data;
    }

    subscribe(collection: string, listener: (doc: any, event: QDataEvent) => void): any {

    }

    unsubscribe(subscription: any): void {

    }
}

class MockCache implements QDataCache {
    data: Map<string, any>;
    getCount: number;
    setCount: number;

    constructor() {
        this.data = new Map();
        this.getCount = 0;
        this.setCount = 0;
    }

    get(key: string): Promise<any> {
        this.getCount += 1;
        return Promise.resolve(this.data.get(key));
    }

    set(key: string, value: any): Promise<void> {
        this.setCount += 1;
        this.data.set(key, value);
        return Promise.resolve();
    }
}

function mock(data): MockProvider {
    return new MockProvider(data);
}

function createTestData(providers: QDataProviders): QBlockchainData {
    return new QBlockchainData({
        providers,
        slowQueriesProviders: providers,
        logs: new QLogs(),
        auth: new Auth(testConfig),
        tracer: QTracer.create(testConfig),
        stats: QStats.create('', []),
        isTests: true,
    });
}

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

    server.stop();
});
