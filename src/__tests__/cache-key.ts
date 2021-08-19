import { hash } from "../server/utils";
import TONQServer from "../server/server";
import {
    QDataCombiner,
    QDataPrecachedCombiner,
} from "../server/data/data-provider";
import type { QArangoConfig } from "../server/config";
import { ArangoProvider } from "../server/data/arango-provider";
import QLogs from "../server/logs";
import {
    MockCache,
    testConfig,
    mock,
    createTestData,
    MockProvider,
} from "./init-tests";
import { OrderBy } from "../server/filter/filters";
import { QRequestContext } from "../server/request";


jest.mock("arangojs", () => ({
    __esModule: true,
    Database: (jest.genMockFromModule("arangojs") as { Database: unknown }).Database,
}));

describe("Fingerprint", () => {
    let provider: ArangoProvider;

    beforeEach(async () => {
        const logs = new QLogs();
        const config: QArangoConfig = {
            server: "mock",
            name: "mock",
            auth: "mock",
            maxSockets: 0,
            listenerRestartTimeout: 0,
        };
        provider = new ArangoProvider(
            logs.create("arango"),
            config,
        );
    });

    it("should calculated by size of collections", async () => {
        const expected = {
            a: 3,
            b: 2,
            c: 1,
        };
        provider.arango.listCollections = jest.fn().mockResolvedValue([{ name: "a" }, { name: "b" }, { name: "c" }]);
        (provider.arango as { collection: unknown }).collection = jest.fn((x) => {
            return {
                count: jest.fn(async () => {
                    return { count: expected[x as keyof typeof expected] };
                }),
            };
        });

        expect(await provider.loadFingerprint()).toEqual(expected);
    });
});

describe("DataCache", () => {
    let server: TONQServer;
    let cachedCold: QDataPrecachedCombiner;
    let cache: MockCache<unknown>;
    let firstCold: MockProvider<{ _key: string, lt: string }>;
    let secondCold: MockProvider<{ _key: string, lt: string }>;

    beforeEach(async () => {
        const mutable = mock([
            {
                _key: "a1",
                balance: "4",
            },
            {
                _key: "a2",
                balance: "3",
            },
            {
                _key: "a3",
                balance: "2",
            },
            {
                _key: "a4",
                balance: "1",
            },
        ]);
        cache = new MockCache();
        const hot = mock([
            {
                _key: "t1",
                lt: "6",
            },
            {
                _key: "t6",
                lt: "1",
            },
        ]);
        firstCold =
            mock([
                {
                    _key: "t5",
                    lt: "2",
                },
                {
                    _key: "t4",
                    lt: "3",
                },
                {
                    _key: "t3",
                    lt: "4",
                },
            ]);
        secondCold =
            mock([
                {
                    _key: "t2",
                    lt: "5",
                },
            ]);
        const cold = [
            firstCold,
            secondCold,
        ];
        const logs = new QLogs();
        cachedCold = new QDataPrecachedCombiner(
            logs.create("cache"),
            cache,
            cold,
            testConfig.networkName,
            testConfig.cacheKeyPrefix,
        );
        const immutable = new QDataCombiner([hot, cachedCold]);

        server = new TONQServer({
            config: testConfig,
            logs,
            data: createTestData({
                blockchain: {
                    accounts: mutable,
                    blocks: immutable,
                    transactions: immutable,
                },
                counterparties: mutable,
                chainRangesVerification: immutable,
            }),
        });
    });

    it("should trigger hotUpdate on each data providers", async () => {
        expect(firstCold.hotUpdateCount).toEqual(0);
        expect(secondCold.hotUpdateCount).toEqual(0);

        await server.start();

        expect(firstCold.hotUpdateCount).toEqual(1);
        expect(secondCold.hotUpdateCount).toEqual(1);

        await server.data.providers.blockchain?.blocks?.hotUpdate();

        expect(firstCold.hotUpdateCount).toEqual(2);
        expect(secondCold.hotUpdateCount).toEqual(2);
    });

    it("should change configHash after start", async () => {
        expect(cachedCold.configHash).toEqual("");

        await server.start();

        const fingerprint = `[[{"data":${firstCold.data.length}}],[{"data":${secondCold.data.length}}]]`;
        const configHash = hash(testConfig.networkName, fingerprint);

        expect(cachedCold.configHash).toEqual(configHash);
    });

    it("should not changed after dropCachedDbInfo", async () => {
        await server.start();

        const old = cachedCold.configHash;
        await server.data.dropCachedDbInfo();

        expect(cachedCold.configHash).toEqual(old);
    });

    it("should change after new counts and dropCachedDbInfo", async () => {
        await server.start();

        const old = cachedCold.configHash;
        firstCold.data.push({
            _key: "t6",
            lt: "1",
        });
        await server.data.dropCachedDbInfo();

        expect(cachedCold.configHash).not.toEqual(old);
    });

    it("should collect fingerprint from providers", async () => {
        await server.start();

        const fingerprint = await cachedCold.loadFingerprint();

        expect(fingerprint).toEqual([  // from combiner of colds
            [{ data: firstCold.data.length }], // from first cold
            [{ data: secondCold.data.length }], // from second cold
        ]);
    });

    it("should use cacheKeyPrefix", async () => {
        await server.start();

        const text = "q1";
        const vars = { b: 2 };
        const orderBy: OrderBy[] = [];

        await server.data.providers.blockchain?.blocks?.query(text, vars, orderBy, null as unknown as QRequestContext);
        const lastKey = "Q_" + hash(cachedCold.configHash, JSON.stringify({
            text,
            vars,
            orderBy,
        }));

        expect(cache.lastKey).toEqual(lastKey);
    });

    afterEach(async () => {
        // This hack to stop server if some of tests fails
        try {
            await server.stop();
        } finally {
            await server.stop();
        }
    });
});
