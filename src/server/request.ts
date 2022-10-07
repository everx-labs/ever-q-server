import { QConfig } from "./config"
import { Span, SpanContext, Tracer } from "opentracing"
import { QTraceSpan, QTracer } from "./tracing"
import { TonClient } from "@tonclient/core"
import QLogs from "./logs"
import QBlockchainData from "./data/blockchain"
import EventEmitter from "events"
import { extractHeader, RequestWithHeaders } from "./utils"
import express from "express"
import { ExecutionParams } from "subscriptions-transport-ws"
import { IStats } from "./stats"
import { QRequestParams } from "./filter/filters"

export class QRequestServices {
    constructor(
        public config: QConfig,
        public tracer: Tracer,
        public stats: IStats,
        public client: TonClient,
        public shared: Map<string, unknown>,
        public logs: QLogs,
        public data: QBlockchainData,
    ) {}
}

export const RequestEvent = {
    CLOSE: "close",
    FINISH: "finish",
}

export class QRequestContext implements QRequestParams {
    start: number
    events: EventEmitter
    remoteAddress: string
    expectedAccountBocVersion: number
    parentSpan: Span | SpanContext | undefined
    requestSpan: QTraceSpan
    requestTags = {
        hasWaitFor: false,
        hasAggregations: false,
        hasTotals: false,
        arangoCalls: 0,
        hasRangedQuery: false,
    }

    constructor(
        public services: QRequestServices,
        public req: express.Request | undefined,
        public connection: ExecutionParams | undefined,
    ) {
        this.start = Date.now()
        this.events = new EventEmitter()
        this.events.setMaxListeners(0)
        req?.on?.("close", () => {
            this.emitClose()
        })
        this.remoteAddress = req?.socket?.remoteAddress ?? ""
        this.expectedAccountBocVersion = Number.parseInt(
            extractHeader(
                req as RequestWithHeaders,
                connection,
                "X-Evernode-Expected-Account-Boc-Version",
                "1",
            ),
        )
        this.parentSpan =
            QTracer.extractParentSpan(services.tracer, connection ?? req) ??
            undefined
        this.requestSpan = QTraceSpan.create(
            services.tracer,
            "q-request",
            this.parentSpan,
        )
        this.requestSpan.log({
            event: "QRequestContext_created",
            headers: req?.headers,
            request_body: req?.body,
        })
    }

    emitClose() {
        this.events.emit(RequestEvent.CLOSE)
    }

    finish() {
        this.events.emit(RequestEvent.FINISH)
        this.events.removeAllListeners()
    }

    log(event_name: string, additionalInfo?: string): void {
        const logEntry = {
            event: event_name,
            time: Date.now() - this.start,
            ...(additionalInfo ? { info: additionalInfo } : {}),
        }
        this.requestSpan.log(logEntry)
    }

    onRequestFinishing(): void {
        this.requestSpan.addTags(this.requestTags)
        this.requestSpan.finish()
    }

    trace<T>(
        operationName: string,
        operation: (span: QTraceSpan) => Promise<T>,
    ): Promise<T> {
        return this.requestSpan.traceChildOperation(operationName, operation)
    }

    async ensureShared<T>(
        name: string,
        createValue: () => Promise<T>,
    ): Promise<T> {
        const shared = this.services.shared
        if (shared.has(name)) {
            return shared.get(name) as T
        }
        const value = await createValue()
        shared.set(name, value)
        return value
    }
}
