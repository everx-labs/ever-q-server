import { createConfig, parseArangoConfig, programOptions, readConfigFile } from "../server/config";
import { QTracer } from "../server/tracer";

test("Config File", () => {
    expect(readConfigFile('src/__tests__/configs/config-simple.json')).toMatchObject({
        "Q_HOST": "localhost",
        "Q_PORT": 2020,
        "Q_DATA_MUT": "http://localhost:8081",
        "Q_DATA_HOT": "http://localhost:8081",
        "Q_REQUESTS_MODE": "rest",
        "Q_REQUESTS_SERVER": "localhost"
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
    expect(parseArangoConfig("http://arango:8529", 3)).toMatchObject({
        server: "http://arango:8529",
        auth: "",
        name: "blockchain",
        maxSockets: 3,
    });
    expect(parseArangoConfig("http://u:p@arango:8529?name=bc&maxSockets=6", 3)).toMatchObject({
        server: "http://arango:8529",
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
        endpoint: "http://collector:1234",
        service: "service",
        tags: {},
    })).toEqual({
        serviceName: "service",
        sampler: {
            type: "const",
            param: 1,
        },
        reporter: {
            collectorEndpoint: "http://collector:1234",
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
