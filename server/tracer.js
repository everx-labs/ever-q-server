// @flow

import * as express from "express";
import type { QConfig } from "./config";

const initJaegerTracer = require('jaeger-client').initTracerFromEnv;
const { Tags, FORMAT_TEXT_MAP } = require('opentracing');


export interface TracerSpan {
    finish(): Promise<void>
}

interface JaegerSpan extends TracerSpan {
    setTag(name: string, value: any): Promise<void>,

    log(options: { event: string, value: any }): Promise<void>,
}

interface JaegerTracer {
    extract(key: string, headers: { [string]: any }): any,

    startSpan(name: string, options: {
        childOf: any,
    }): Promise<JaegerSpan>
}

const missingSpan: TracerSpan = {
    finish(): Promise<void> {
        return Promise.resolve();
    }
};

export class Tracer {
    jaeger: ?JaegerTracer;

    constructor(config: QConfig) {
        const endpoint = config.jaeger.endpoint;
        if (!endpoint) {
            this.jaeger = null;
            return;
        }
        this.jaeger = initJaegerTracer({
            serviceName: 'Q Server',
            sampler: {
                type: 'const',
                param: 1,
            },
            reporter: {
                collectorEndpoint: endpoint,
                logSpans: true,
            }
        }, {
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

    getContext(req: express.Request): any {
        return this.jaeger
            ? {
                tracer: this.jaeger.extract(FORMAT_TEXT_MAP, req.headers),
            }
            : {}
    }

    startSpanSync(context: any, name: string): TracerSpan {
        const jaeger = this.jaeger;
        if (!jaeger) {
            return missingSpan;
        }
        const span: JaegerSpan = jaeger.startSpan(name, {
            childOf: context,
        });
        span.setTag(Tags.SPAN_KIND, 'server');
        return span;
    }

    async startSpan(context: any, name: string): Promise<TracerSpan> {
        const jaeger = this.jaeger;
        if (!jaeger) {
            return missingSpan;
        }
        const span: JaegerSpan = await jaeger.startSpan(name, {
            childOf: context,
        });
        await span.setTag(Tags.SPAN_KIND, 'server');
        return span;
    }

    startSpanLogSync(context: any, name: string, event: string, value: any): TracerSpan {
        const jaeger = this.jaeger;
        if (!jaeger) {
            return missingSpan;
        }
        const span: JaegerSpan = jaeger.startSpan(name, {
            childOf: context,
        });
        span.setTag(Tags.SPAN_KIND, 'server');
        span.log({
            event,
            value,
        });
        return span;
    }

    async startSpanLog(context: any, name: string, event: string, value: any): Promise<TracerSpan> {
        const jaeger = this.jaeger;
        if (!jaeger) {
            return missingSpan;
        }
        const span: JaegerSpan = await jaeger.startSpan(name, {
            childOf: context,
        });
        await span.setTag(Tags.SPAN_KIND, 'server');
        await span.log({
            event,
            value,
        });
        return span;
    }

}
