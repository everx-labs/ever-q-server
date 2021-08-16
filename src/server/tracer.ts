import { STATS } from "./config";
import type { QConfig } from "./config";
import { tracer as noopTracer } from "opentracing/lib/noop";
import {
    StatsD,
    Callback as StatsCallback,
} from "node-statsd";
import opentracing, {
    Tracer,
    Tags,
    FORMAT_TEXT_MAP,
    FORMAT_BINARY,
    Span,
    SpanContext,
} from "opentracing";

import jaegerclient from "jaeger-client";

import {
    cleanError,
    toLog,
} from "./utils";
import express from "express";

declare module "jaeger-client" {
    class SpanContext {
        static fromString(s: string): opentracing.SpanContext
    }
}

export interface IStats {
    configuredTags: string[],

    increment(stat: string, value: number, tags: string[]): Promise<void>,

    gauge(stat: string, value: number, tags: string[]): Promise<void>,

    timing(stat: string, value: number, tags: string[]): Promise<void>,

    close(): void,
}

export interface IStatsImpl {
    increment(stat: string, value: number, tags: string[], callback: StatsCallback): void,

    gauge(stat: string, value: number, tags: string[], callback: StatsCallback): void,

    timing(stat: string, value: number, tags: string[], callback: StatsCallback): void,

    close(): void,
}

function logStatsError(error: Error) {
    console.log(`StatsD send failed: ${error.message}`);
}

const dummyStats: IStats = {
    configuredTags: [],
    increment(): Promise<void> {
        return Promise.resolve();
    },
    gauge(): Promise<void> {
        return Promise.resolve();
    },
    timing(): Promise<void> {
        return Promise.resolve();
    },
    close() {
    },
};

export class QStats implements IStats {
    static create(
        server: string,
        configuredTags: string[],
        resetInterval: number,
    ): IStats {
        return server ? new QStats(server, configuredTags, resetInterval) : dummyStats;
    }

    host: string;
    port: number | undefined;
    impl: IStatsImpl | null;
    resetInterval: number;
    resetTime: number;
    configuredTags: string[];

    constructor(server: string, configuredTags: string[], resetInterval: number) {
        const hostPort = server.split(":");
        this.host = hostPort[0];
        this.port = hostPort[1] !== undefined ? Number(hostPort[1]) : undefined;
        this.configuredTags = configuredTags;
        this.resetInterval = resetInterval;

        this.impl = null;
        this.resetTime = resetInterval > 0 ? Date.now() + resetInterval : 0;
    }

    ensureImpl() {
        const impl = this.impl;
        if (impl !== null) {
            return impl;
        }
        const newImpl = new StatsD(this.host, this.port, STATS.prefix);
        newImpl.socket.on("error", (err: Error) => {
            logStatsError(err);
            this.dropImpl();
        });
        this.impl = newImpl;
        return newImpl;
    }

    dropImpl(error?: Error) {
        if (error !== undefined && error !== null) {
            logStatsError(error);
        }
        if (this.impl !== null) {
            this.impl.close();
            this.impl = null;
        }
    }

    withImpl(f: (impl: IStatsImpl, callback: StatsCallback) => void): Promise<void> {
        return new Promise((resolve) => {
            try {
                if (this.resetTime > 0) {
                    const now = Date.now();
                    if (now > this.resetTime) {
                        this.dropImpl();
                        this.resetTime = now + this.resetInterval;
                    }
                }
                f(this.ensureImpl(), (error?: Error) => {
                    if (error !== undefined && error !== null) {
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
        return (stats?.configuredTags?.length ?? 0) > 0
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

    increment(delta = 1) {
        return this.set(this.value + delta);
    }

    decrement(delta = 1) {
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
        };
    }
}

function parseUrl(url: string): {
    protocol: string,
    host: string,
    port: string,
    path: string,
    query: string,
} {
    const protocolSeparatorPos = url.indexOf("://");
    const protocolEnd = protocolSeparatorPos >= 0 ? protocolSeparatorPos + 3 : 0;
    const questionPos = url.indexOf("?", protocolEnd);
    const queryStart = questionPos >= 0 ? questionPos + 1 : url.length;
    const pathEnd = questionPos >= 0 ? questionPos : url.length;
    const pathSeparatorPos = url.indexOf("/", protocolEnd);
    // eslint-disable-next-line no-nested-ternary
    const pathStart = pathSeparatorPos >= 0
        ? (pathSeparatorPos < pathEnd ? pathSeparatorPos : pathEnd)
        : (questionPos >= 0 ? questionPos : url.length);
    const hostPort = url.substring(protocolEnd, pathStart).split(":");
    return {
        protocol: url.substring(0, protocolEnd),
        host: hostPort[0],
        port: hostPort[1] ?? "",
        path: url.substring(pathStart, pathEnd),
        query: url.substring(queryStart),
    };
}

type JaegerConfig = jaegerclient.TracingConfig;

export type ParentSpanSource = express.Request | {
    context: unknown,
};

export class QTracer {
    static config: QConfig;

    static getJaegerConfig(config: {
        endpoint: string,
        service: string,
        tags: { [name: string]: string }
    }): JaegerConfig | null {
        const endpoint = config.endpoint;

        if (endpoint === "") {
            return null;
        }

        const parts = parseUrl(endpoint);
        return (parts.protocol === "")
            ? {
                serviceName: config.service,
                sampler: {
                    type: "const",
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
                    type: "const",
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
        if (jaegerConfig === null) {
            return noopTracer as Tracer;
        }

        return jaegerclient.initTracerFromEnv(jaegerConfig, {
            logger: {
                info(msg: unknown) {
                    console.log("INFO ", msg);
                },
                error(msg: unknown) {
                    console.log("ERROR", msg);
                },
            },
        });

    }

    static messageRootSpanContext(messageId: string): SpanContext | undefined {
        if (messageId === "") {
            return undefined;
        }
        const traceId = messageId.substr(0, 16);
        const spanId = messageId.substr(16, 16);
        return jaegerclient.SpanContext.fromString(`${traceId}:${spanId}:0:1`);
    }

    static extractParentSpan(tracer: Tracer, source: ParentSpanSource | undefined): SpanContext | null {
        if (source === undefined) {
            return null;
        }
        let ctx_src: unknown;
        let ctx_frm: string;
        if ("headers" in source) {
            ctx_src = source.headers;
            ctx_frm = FORMAT_TEXT_MAP;
        } else {
            ctx_src = source.context;
            ctx_frm = FORMAT_BINARY;
        }
        return tracer.extract(ctx_frm, ctx_src);
    }

    static getParentSpan(_tracer: Tracer, context: { parentSpan?: Span | SpanContext }): Span | SpanContext | undefined {
        return context.parentSpan;
    }

    static failed(_tracer: Tracer, span: Span, error: Error) {
        span.log({
            event: "failed",
            payload: toLog(error),
        });
    }

    static async trace<T>(
        tracer: Tracer,
        name: string,
        f: (span: Span) => Promise<T>,
        parentSpan ?: (Span | SpanContext),
    ): Promise<T> {
        const span = tracer.startSpan(name, { childOf: parentSpan });
        try {
            span
                .setTag(Tags.SPAN_KIND, "server");
            Object
                .entries(QTracer.config.jaeger.tags).forEach(([name, value]) => {
                if (name !== "") {
                    span.setTag(name, value);
                }
            });
            const result = await f(span);
            if (result !== undefined) {
                span.setTag("result", toLog(result));
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
