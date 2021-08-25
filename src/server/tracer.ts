import type { QConfig } from "./config";
import { tracer as noopTracer } from "opentracing/lib/noop";
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
            QTracer.attachCommonTags(span);
            const result = await f(span);
            if (result !== undefined) {
                span.log({ result: toLog(result) });
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

    static attachCommonTags(span: Span) {
        span
            .setTag(Tags.SPAN_KIND, "server");
        Object
            .entries(QTracer.config.jaeger.tags).forEach(([name, value]) => {
            if (name !== "") {
                span.setTag(name, value);
            }
        });
    }
}
