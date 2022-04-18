import { QConfig } from './config'
import { AccessArgs, AccessRights, Auth } from './auth'
import { Span, SpanContext, Tracer } from 'opentracing'
import { QTraceSpan, QTracer } from './tracing'
import { TonClient } from '@tonclient/core'
import QLogs from './logs'
import QBlockchainData from './data/blockchain'
import EventEmitter from 'events'
import { extractHeader, QError, RequestWithHeaders } from './utils'
import express from 'express'
import { ExecutionParams } from 'subscriptions-transport-ws'
import { IStats } from './stats'
import { QRequestParams } from './filter/filters'

export class QRequestServices {
    constructor(
        public config: QConfig,
        public auth: Auth,
        public tracer: Tracer,
        public stats: IStats,
        public client: TonClient,
        public shared: Map<string, unknown>,
        public logs: QLogs,
        public data: QBlockchainData,
    ) {}
}

export const RequestEvent = {
    CLOSE: 'close',
    FINISH: 'finish',
}

export class QRequestContext implements QRequestParams {
    start: number
    events: EventEmitter
    remoteAddress: string
    accessKey: string
    expectedAccountBocVersion: number
    usedAccessKey?: string = undefined
    usedMamAccessKey?: string = undefined
    multipleAccessKeysDetected = false
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
        req?.on?.('close', () => {
            this.emitClose()
        })
        this.remoteAddress = req?.socket?.remoteAddress ?? ''
        this.expectedAccountBocVersion = Number.parseInt(
            extractHeader(
                req as RequestWithHeaders,
                connection,
                'X-Evernode-Expected-Account-Boc-Version',
                '1',
            ),
        )
        this.accessKey = Auth.extractAccessKey(
            req as RequestWithHeaders,
            connection,
        )
        this.parentSpan =
            QTracer.extractParentSpan(services.tracer, connection ?? req) ??
            undefined
        this.requestSpan = QTraceSpan.create(
            services.tracer,
            'q-request',
            this.parentSpan,
        )
        this.requestSpan.log({
            event: 'QRequestContext_created',
            headers: req?.headers,
            request_body: req?.body,
        })
    }

    async requireGrantedAccess(args: AccessArgs): Promise<AccessRights> {
        const accessKey = this.accessKey ?? args.accessKey ?? undefined
        this.usedAccessKey = this.checkUsedAccessKey(accessKey)
        return await this.services.auth.requireGrantedAccess(accessKey)
    }

    checkUsedAccessKey(accessKey?: string): string | undefined {
        if (!accessKey) {
            return this.usedAccessKey
        }
        if (this.usedAccessKey && accessKey !== this.usedAccessKey) {
            this.multipleAccessKeysDetected = true
            throw QError.multipleAccessKeys()
        }
        return accessKey
    }

    mamAccessRequired(args: AccessArgs) {
        const accessKey = args.accessKey ?? undefined
        this.usedMamAccessKey = this.checkUsedAccessKey(accessKey)
        if (!accessKey || !this.services.auth.mamAccessKeys.has(accessKey)) {
            throw Auth.unauthorizedError()
        }
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
}
