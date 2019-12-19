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

export class Tracer {
    jaeger: JaegerTracer;

    constructor(config: QConfig) {
        const jaegerConfig = {
            serviceName: 'Q Server',
            sampler: {
                type: 'const',
                param: 1,
            },
            reporter: config.jaeger.endpoint
                ? {
                    collectorEndpoint: config.jaeger.endpoint,
                    logSpans: true,
                }
                : {}
        };
        const options = {
            logger: {
                info(msg) {
                    console.log('INFO ', msg);
                },
                error(msg) {
                    console.log('ERROR', msg);
                },
            },
        };
        this.jaeger = initJaegerTracer(jaegerConfig, options);
    }

    getContext(req: express.Request): any {
        return {
            tracer: this.jaeger.extract(FORMAT_TEXT_MAP, req.headers),
        }
    }

    async startSpanLog(context: any, name: string, event: string, value: any): Promise<TracerSpan> {
        const span: JaegerSpan = await this.jaeger.startSpan(name, {
            childOf: context.tracer,
        });
        await span.setTag(Tags.SPAN_KIND, 'server');
        await span.log({
            event,
            value,
        });
        return span;
    }
}
