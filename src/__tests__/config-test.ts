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
        authEndpoint: "",
        mamAccessKeys: "",
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
