import { Span, SpanContext, Tags, Tracer } from 'opentracing'
import { QTracer } from './tracer'
import { cleanError, toLog } from '../utils'

const SPAN_CREATION_TAGS = {
    // according to some sources next tag should be attached on span creation
    [Tags.SPAN_KIND]: Tags.SPAN_KIND_RPC_SERVER,
}

export class QTraceSpan {
    constructor(public tracer: Tracer, public span: Span) {}

    static create(
        tracer: Tracer,
        name: string,
        parentSpan?: Span | SpanContext,
    ): QTraceSpan {
        const span = tracer.startSpan(name, {
            childOf: parentSpan,
            tags: SPAN_CREATION_TAGS,
        })
        QTracer.attachCommonTags(span)
        return new QTraceSpan(tracer, span)
    }

    async traceChildOperation<T>(
        operationName: string,
        operation: (span: QTraceSpan) => Promise<T>,
    ): Promise<T> {
        const span = this.createChildSpan(operationName)
        try {
            const result = await operation(span)
            if (result !== undefined) {
                span.log({ event: 'completed', result: toLog(result) })
            } else {
                span.log({ event: 'completed' })
            }
            span.finish()
            return result
        } catch (error) {
            const cleaned = cleanError(error)
            span.log({ event: 'error', 'error.object': toLog(error) })
            span.finish()
            throw cleaned
        }
    }

    createChildSpan(name: string): QTraceSpan {
        return QTraceSpan.create(this.tracer, name, this.span)
    }

    addTags(keyValueMap: { [key: string]: unknown }): QTraceSpan {
        this.span.addTags(keyValueMap)
        return this
    }

    setTag(key: string, value: unknown): QTraceSpan {
        this.span.setTag(key, value)
        return this
    }

    log(keyValuePairs: { [key: string]: unknown }): QTraceSpan {
        this.span.log(keyValuePairs)
        return this
    }

    logEvent(event_name: string, info?: unknown): void {
        const logEntry = {
            event: event_name,
            ...(info ? { info: toLog(info) } : {}),
        }
        this.span.log(logEntry)
    }

    finish(): void {
        this.span.finish()
    }
}
