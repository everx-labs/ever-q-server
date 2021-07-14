import { createConfig, parseArangoConfig, programOptions, readConfigFile } from "../server/config";
import { QTracer } from "../server/tracer";
import { httpUrl } from "../server/utils";

test("Config File", () => {
    expect(readConfigFile("src/__tests__/configs/config-full.json")).toMatchObject({
        Q_ENDPOINTS: "",
        Q_HOST: "localhost",
        Q_PORT: 4000,
        Q_KEEP_ALIVE: 60000,
        Q_REQUESTS_MODE: "rest",
        Q_REQUESTS_SERVER: "localhost",
        Q_REQUESTS_TOPIC: "requests",
        Q_REQUESTS_MAX_SIZE: 16383,
        Q_DATA_MUT: "",
        Q_DATA_HOT: "",
        Q_DATA_COLD: "",
        Q_DATA_CACHE: "",
        Q_DATA_COUNTERPARTIES: "",
        Q_SLOW_QUERIES: "redirect",
        Q_SLOW_QUERIES_MUT: "arangodb",
        Q_SLOW_QUERIES_HOT: "arangodb",
        Q_SLOW_QUERIES_COLD: "",
        Q_SLOW_QUERIES_CACHE: "",
        Q_AUTH_ENDPOINT: "",
        Q_MAM_ACCESS_KEYS: "",
        Q_JAEGER_ENDPOINT: "",
        Q_TRACE_SERVICE: "",
        Q_TRACE_TAGS: "",
        Q_STATSD_SERVER: "",
        Q_STATSD_TAGS: "",
        Q_STATSD_RESET_INTERVAL: 0,
    });
    expect(readConfigFile('wrong_file_name')).toMatchObject({});
});

test("Config Priority", () => {
    // override direction:
    //   defaults -> OS envs -> config file -> args

    const full_options = createConfig(
        { "port": 8083 },
        { "Q_PORT": 8082 },
        { "Q_PORT": 8081 },
        programOptions,
    );
    expect(full_options.server.port).toEqual(8083);

    const no_args_options = createConfig(
        {},
        { "Q_PORT": 8082 },
        { "Q_PORT": 8081 },
        programOptions,
    );
    expect(no_args_options.server.port).toEqual(8082);

    const only_env_options = createConfig(
        {},
        {},
        { "Q_PORT": 8081 },
        programOptions,
    );
    expect(only_env_options.server.port).toEqual(8081);
});


test("Arango Config", () => {
    expect(parseArangoConfig("arango", 3)).toMatchObject({
        server: "https://arango",
        auth: "",
        name: "blockchain",
        maxSockets: 3,
    });
    expect(parseArangoConfig("arango:8529", 3)).toMatchObject({
        server: "https://arango:8529",
        auth: "",
        name: "blockchain",
        maxSockets: 3,
    });
    expect(parseArangoConfig(httpUrl("arango:8529"), 3)).toMatchObject({
        server: httpUrl("arango:8529"),
        auth: "",
        name: "blockchain",
        maxSockets: 3,
    });
    expect(parseArangoConfig(httpUrl("u:p@arango:8529?name=bc&maxSockets=6"), 3)).toMatchObject({
        server: httpUrl("arango:8529"),
        auth: "u:p",
        name: "bc",
        maxSockets: 6,
    });
});

test("Jaeger Config", () => {
    expect(QTracer.getJaegerConfig({
        endpoint: "",
        service: "",
        tags: {},
    })).toBeNull();

    expect(QTracer.getJaegerConfig({
        endpoint: httpUrl("collector:1234"),
        service: "service",
        tags: {},
    })).toEqual({
        serviceName: "service",
        sampler: {
            type: "const",
            param: 1,
        },
        reporter: {
            collectorEndpoint: httpUrl("collector:1234"),
            logSpans: true,
        },
    });

    expect(QTracer.getJaegerConfig({
        endpoint: "jaeger-agent:8631",
        service: "service",
        tags: {},
    })).toEqual({
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
    });
});
