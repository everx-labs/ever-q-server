// @flow

import { STATS } from './config';
import type { QConfig } from "./config";
import { tracer as noopTracer } from "opentracing/lib/noop";
import StatsD from 'node-statsd';
import { Tracer, Tags, FORMAT_TEXT_MAP, FORMAT_BINARY, Span, SpanContext } from "opentracing";

import {
    initTracerFromEnv as initJaegerTracer,
    SpanContext as JaegerSpanContext,
} from 'jaeger-client';
import { cleanError, toLog } from "./utils";

export interface IStats {
    configuredTags: string[],

    increment(stat: string, value: number, tags: string[]): Promise<void>,

    gauge(stat: string, value: number, tags: string[]): Promise<void>,

    timing(stat: string, value: number, tags: string[]): Promise<void>,

    close(): void,
}

type StatsCallback = (error: any, bytes: any) => void;

export interface IStatsImpl {
    increment(stat: string, value: number, tags: string[], callback: StatsCallback): void,

    gauge(stat: string, value: number, tags: string[], callback: StatsCallback): void,

    timing(stat: string, value: number, tags: string[], callback: StatsCallback): void,

    close(): void,
}

function logStatsError(error: any) {
    console.log(`StatsD send failed: ${error.message}`);
}

const dummyStats: IStats = {
    configuredTags: [],
    increment(_stat: string, _value: number, _tags: string[]): Promise<any> {
        return Promise.resolve();
    },
    gauge(_stat: string, _value: number, _tags: string[]): Promise<any> {
        return Promise.resolve();
    },
    timing(_stat: string, _value: number, _tags: string[]): Promise<any> {
        return Promise.resolve();
    },
    close() {
    }
};

export class QStats {
    static create(
        server: string,
        configuredTags: string[],
        resetInterval: number,
    ): IStats {
        return server ? new QStats(server, configuredTags, resetInterval) : dummyStats;
    }

    host: string;
    port: string | typeof undefined;
    impl: ?IStatsImpl;
    resetInterval: number;
    resetTime: number;
    configuredTags: string[];

    constructor(server: string, configuredTags: string[], resetInterval: number) {
        const hostPort = server.split(':');
        this.host = hostPort[0];
        this.port = hostPort[1];
        this.configuredTags = configuredTags;
        this.resetInterval = resetInterval;

        this.impl = null;
        this.resetTime = resetInterval > 0 ? Date.now() + resetInterval : 0;
    }

    ensureImpl() {
        const impl = this.impl;
        if (impl) {
            return impl;
        }
        const newImpl = new StatsD(this.host, this.port, STATS.prefix);
        newImpl.socket.on("error", (err) => {
            logStatsError(err);
            this.dropImpl();
        });
        this.impl = newImpl;
        return newImpl;
    }

    dropImpl(error?: Error) {
        if (error) {
            logStatsError(error);
        }
        if (this.impl) {
            this.impl.close();
            this.impl = null;
        }
    }

    withImpl(f: (impl: IStatsImpl, callback: any) => void): Promise<void> {
        return new Promise((resolve, _) => {
            try {
                if (this.resetTime > 0) {
                    const now = Date.now();
                    if (now > this.resetTime) {
                        this.dropImpl();
                        this.resetTime = now + this.resetInterval;
                    }
                }
                f(this.ensureImpl(), (error, _) => {
                    if (error) {
                        this.dropImpl(error);
                    }
                    resolve();
                });
            } catch (error) {
                this.dropImpl(error);
                resolve();
            }
        });
    };

    increment(stat: string, value: number, tags: string[]): Promise<void> {
        return this.withImpl((stats, callback) => stats.increment(stat, value, tags, callback));
    }

    gauge(stat: string, value: number, tags: string[]): Promise<void> {
        return this.withImpl((stats, callback) => stats.gauge(stat, value, tags, callback));
    }

    timing(stat: string, value: number, tags: string[]): Promise<void> {
        return this.withImpl((stats, callback) => stats.timing(stat, value, tags, callback));
    }

    close() {
        this.dropImpl();
    }


    static combineTags(stats: IStats, tags: string[]): string[] {
        return (stats && stats.configuredTags && stats.configuredTags.length > 0)
            ? stats.configuredTags.concat(tags)
            : tags;
    }
}

export class StatsCounter {
    stats: IStats;
    name: string;
    tags: string[];

    constructor(stats: IStats, name: string, tags: string[]) {
        this.stats = stats;
        this.name = name;
        this.tags = QStats.combineTags(stats, tags);
    }

    increment() {
        return this.stats.increment(this.name, 1, this.tags);
    }
}

export class StatsGauge {
    stats: IStats;
    name: string;
    tags: string[];
    value: number;

    constructor(stats: IStats, name: string, tags: string[]) {
        this.stats = stats;
        this.name = name;
        this.tags = QStats.combineTags(stats, tags);
        this.value = 0;
    }

    set(value: number) {
        this.value = value;
        return this.stats.gauge(this.name, this.value, this.tags);
    }

    increment(delta: number = 1) {
        return this.set(this.value + delta);
    }

    decrement(delta: number = 1) {
        return this.set(this.value - delta);
    }
}

export class StatsTiming {
    stats: IStats;
    name: string;
    tags: string[];

    constructor(stats: IStats, name: string, tags: string[]) {
        this.stats = stats;
        this.name = name;
        this.tags = QStats.combineTags(stats, tags);
    }

    report(value: number) {
        return this.stats.timing(this.name, value, this.tags);
    }

    start(): () => Promise<void> {
        const start = Date.now();
        return () => {
            return this.report(Date.now() - start);
        }
    }
}

function parseUrl(url: string): {
    protocol: string,
    host: string,
    port: string,
    path: string,
    query: string,
} {
    const protocolSeparatorPos = url.indexOf('://');
    const protocolEnd = protocolSeparatorPos >= 0 ? protocolSeparatorPos + 3 : 0;
    const questionPos = url.indexOf('?', protocolEnd);
    const queryStart = questionPos >= 0 ? questionPos + 1 : url.length;
    const pathEnd = questionPos >= 0 ? questionPos : url.length;
    const pathSeparatorPos = url.indexOf('/', protocolEnd);
    // eslint-disable-next-line no-nested-ternary
    const pathStart = pathSeparatorPos >= 0
        ? (pathSeparatorPos < pathEnd ? pathSeparatorPos : pathEnd)
        : (questionPos >= 0 ? questionPos : url.length);
    const hostPort = url.substring(protocolEnd, pathStart).split(':');
    return {
        protocol: url.substring(0, protocolEnd),
        host: hostPort[0],
        port: hostPort[1] || '',
        path: url.substring(pathStart, pathEnd),
        query: url.substring(queryStart),
    };
}

type JaegerConfig = {
    serviceName: string,
    disable?: boolean,
    sampler: {
        type: string,
        param: number,
        hostPort?: string,
        host?: string,
        port?: number,
        refreshIntervalMs?: number,
    },
    reporter: {
        logSpans: boolean,
        agentHost?: string,
        agentPort?: number,
        agentSocketType?: string,
        collectorEndpoint?: string,
        username?: string,
        password?: string,
        flushIntervalMs?: number,
    },
    throttler?: {
        host: string,
        port: number,
        refreshIntervalMs: number,
    },
}

export class QTracer {
    static config: QConfig;

    static getJaegerConfig(config: {
        endpoint: string,
        service: string,
        tags: { [string]: string }
    }): ?JaegerConfig {
        const endpoint = config.endpoint;
        if (!endpoint) {
            return null;
        }
        const parts = parseUrl(endpoint);
        return (parts.protocol === '')
            ? {
                serviceName: config.service,
                sampler: {
                    type: 'const',
                    param: 1,
                },
                reporter: {
                    logSpans: true,
                    agentHost: parts.host,
                    agentPort: Number(parts.port)
                    ,
                },
            }
            : {
                serviceName: config.service,
                sampler: {
                    type: 'const',
                    param: 1,
                },
                reporter: {
                    logSpans: true,
                    collectorEndpoint: endpoint,
                },
            };
    }

    static create(config: QConfig): Tracer {
        QTracer.config = config;
        const jaegerConfig = QTracer.getJaegerConfig(config.jaeger);
        if (!jaegerConfig) {
            return noopTracer;
        }
        return initJaegerTracer(jaegerConfig, {
            logger: {
                info(msg) {
                    console.log('INFO ', msg);
                },
                error(msg) {
                    console.log('ERROR', msg);
                },
            },
        });
    }

    static messageRootSpanContext(messageId: string): ?SpanContext {
        if (!messageId) {
            return null;
        }
        const traceId = messageId.substr(0, 16);
        const spanId = messageId.substr(16, 16);
        return JaegerSpanContext.fromString(`${traceId}:${spanId}:0:1`);
    }

    static extractParentSpan(tracer: Tracer, req: any): any {
        let ctx_src,
            ctx_frm;
        if (req.headers) {
            ctx_src = req.headers;
            ctx_frm = FORMAT_TEXT_MAP;
        } else {
            ctx_src = req.context;
            ctx_frm = FORMAT_BINARY;
        }
        return tracer.extract(ctx_frm, ctx_src);
    }

    static getParentSpan(tracer: Tracer, context: any): (SpanContext | typeof undefined) {
        return context.tracerParentSpan;
    }

    static failed(tracer: Tracer, span: Span, error: any) {
        span.log({
            event: 'failed',
            payload: toLog(error),
        });
    }

    static async trace<T>(
        tracer: Tracer,
        name: string,
        f: (span: Span) => Promise<T>,
        parentSpan?: (Span | SpanContext),
    ): Promise<T> {
        const span = tracer.startSpan(name, { childOf: parentSpan });
        try {
            span.setTag(Tags.SPAN_KIND, 'server');
            Object.entries(QTracer.config.jaeger.tags).forEach(([name, value]) => {
                if (name) {
                    span.setTag(name, value);
                }
            });
            const result = await f(span);
            if (result !== undefined) {
                span.setTag('result', toLog(result));
            }
            span.finish();
            return result;
        } catch (error) {
            const cleaned = cleanError(error);
            QTracer.failed(tracer, span, cleaned);
            span.finish();
            throw cleaned;
        }
    }
}
