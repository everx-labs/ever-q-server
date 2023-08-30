import {
    parseArangoConfig,
    readConfigFile,
    resolveConfig,
} from "../server/config"
import { QTracer } from "../server/tracing"
import { httpUrl } from "../server/utils"

test("Config File", () => {
    expect(
        readConfigFile("src/__tests__/configs/config-full.json"),
    ).toMatchObject({
        endpoints: [],
        server: {
            host: "localhost",
            port: 4000,
            keepAlive: 60000,
        },
        requests: {
            mode: "rest",
            server: "localhost",
            topic: "requests",
            maxSize: 16383,
        },
        data: {
            mut: "",
            hot: "",
            cold: [],
            cache: "",
            counterparties: "",
            chainRangesVerification: "",
        },
        slowQueries: {
            mode: "redirect",
            mut: "arangodb",
            hot: "arangodb",
            cold: [],
            cache: "",
        },
        jaegerEndpoint: "",
        trace: {
            service: "",
            tags: [],
        },
        statsd: {
            server: "",
            tags: [],
            resetInterval: 0,
        },
    })
    expect(readConfigFile("wrong_file_name")).toMatchObject({})
})

test("Config Priority", () => {
    // override direction:
    //   defaults -> OS envs -> config file -> args

    const full_options = resolveConfig(
        { port: 8083 },
        { server: { port: 8082 } },
        { Q_PORT: "8081" },
    )
    expect(full_options.server.port).toEqual(8083)

    const no_args_options = resolveConfig(
        {},
        { server: { port: 8082 } },
        { Q_PORT: "8081" },
    )
    expect(no_args_options.server.port).toEqual(8082)

    const only_env_options = resolveConfig({}, {}, { Q_PORT: "8081" })
    expect(only_env_options.server.port).toEqual(8081)
})

test("Test SubscriptionsMode enum", () => {
    const config = resolveConfig({}, {}, { Q_SUBSCRIPTIONS_MODE: "disabled" })
    expect(config.subscriptionsMode).toEqual("disabled")

    expect(() => {
        resolveConfig({}, {}, { Q_SUBSCRIPTIONS_MODE: "disable" })
    }).toThrowError(/Unknown subscriptions-mode/)
})

test("Test SlowQueriesMode enum", () => {
    const config = resolveConfig({}, {}, { Q_SLOW_QUERIES: "redirect" })
    expect(config.queries.slowQueries).toEqual("redirect")

    expect(() => {
        resolveConfig({}, {}, { Q_SLOW_QUERIES: "something" })
    }).toThrowError(/Unknown slow-queries/)
})

test("Test RequestsMode enum", () => {
    const config = resolveConfig({}, {}, { Q_REQUESTS_MODE: "kafka" })
    expect(config.requests.mode).toEqual("kafka")

    expect(() => {
        resolveConfig({}, {}, { Q_REQUESTS_MODE: "something" })
    }).toThrowError(/Unknown requests-mode/)
})

test("Test FilterOrConversion enum", () => {
    const config = resolveConfig(
        {},
        {},
        { Q_FILTER_OR_CONVERSION: "sub-queries" },
    )
    expect(config.queries.filter.orConversion).toEqual("sub-queries")

    expect(() => {
        resolveConfig({}, {}, { Q_FILTER_OR_CONVERSION: "something" })
    }).toThrowError(/Unknown filter-or-conversion/)
})

test("Arango Config", () => {
    expect(parseArangoConfig("arango")).toMatchObject({
        server: "https://arango",
        auth: "",
        name: "blockchain",
        maxSockets: 100,
    })
    expect(parseArangoConfig("arango:8529")).toMatchObject({
        server: "https://arango:8529",
        auth: "",
        name: "blockchain",
        maxSockets: 100,
    })
    expect(parseArangoConfig(httpUrl("arango:8529"))).toMatchObject({
        server: httpUrl("arango:8529"),
        auth: "",
        name: "blockchain",
        maxSockets: 100,
    })
    expect(
        parseArangoConfig(httpUrl("u:p@arango:8529?name=bc&maxSockets=6")),
    ).toMatchObject({
        server: httpUrl("arango:8529"),
        auth: "u:p",
        name: "bc",
        maxSockets: 6,
    })
    expect(
        parseArangoConfig(httpUrl("u:p@arango:8529/_db/bc?maxSockets=6")),
    ).toMatchObject({
        server: httpUrl("arango:8529"),
        auth: "u:p",
        name: "bc",
        maxSockets: 6,
    })
})

test("Jaeger Config", () => {
    expect(
        QTracer.getJaegerConfig({
            endpoint: "",
            service: "",
            tags: {},
        }),
    ).toBeNull()

    expect(
        QTracer.getJaegerConfig({
            endpoint: httpUrl("collector:1234"),
            service: "service",
            tags: {},
        }),
    ).toEqual({
        serviceName: "service",
        sampler: {
            type: "const",
            param: 1,
        },
        reporter: {
            collectorEndpoint: httpUrl("collector:1234"),
            logSpans: true,
        },
    })

    expect(
        QTracer.getJaegerConfig({
            endpoint: "jaeger-agent:8631",
            service: "service",
            tags: {},
        }),
    ).toEqual({
        serviceName: "service",
        sampler: {
            type: "const",
            param: 1,
        },
        reporter: {
            agentHost: "jaeger-agent",
            agentPort: 8631,
            logSpans: true,
        },
    })
})
