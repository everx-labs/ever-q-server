import { parseArangoConfig } from '../src/server/config';
import { QTracer } from '../src/server/tracer';
test("Arango Config", () => {
    expect(parseArangoConfig('arango', 3)).toMatchObject({
        server: 'https://arango:8059',
        auth: '',
        name: 'blockchain',
        maxSockets: 3,
    })
    expect(parseArangoConfig('arango:8059', 3)).toMatchObject({
        server: 'https://arango:8059',
        auth: '',
        name: 'blockchain',
        maxSockets: 3,
    })
    expect(parseArangoConfig('http://arango:8059', 3)).toMatchObject({
        server: 'http://arango:8059',
        auth: '',
        name: 'blockchain',
        maxSockets: 3,
    })
    expect(parseArangoConfig('http://u:p@arango:8059?name=bc&maxSockets=6', 3)).toMatchObject({
        server: 'http://arango:8059',
        auth: 'u:p',
        name: 'bc',
        maxSockets: 6,
    })
});

test("Jaeger Config", () => {
    expect(QTracer.getJaegerConfig({
        endpoint: '',
        service: '',
        tags: [],
    })).toBeNull();

    expect(QTracer.getJaegerConfig({
        endpoint: 'http://collector:1234',
        service: 'service',
        tags: [],
    })).toEqual({
        serviceName: 'service',
        sampler: {
            type: 'const',
            param: 1,
        },
        reporter: {
            collectorEndpoint: 'http://collector:1234',
            logSpans: true,
        },
    });

    expect(QTracer.getJaegerConfig({
        endpoint: 'jaeger-agent:8631',
        service: 'service',
        tags: [],
    })).toEqual({
        serviceName: 'service',
        sampler: {
            type: 'const',
            param: 1,
        },
        reporter: {
            agentHost: 'jaeger-agent',
            agentPort: 8631,
            logSpans: true,
        },
    });
});
