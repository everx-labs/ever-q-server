import { QConfig } from "./config";
import {
    AccessArgs,
    AccessRights,
    Auth,
    RequestWithAccessHeaders,
} from "./auth";
import {
    Span,
    SpanContext,
    Tracer,
} from "opentracing";
import {
    IStats,
    QTracer,
} from "./tracer";
import { TonClient } from "@tonclient/core";
import QLogs from "./logs";
import QBlockchainData from "./data/blockchain";
import EventEmitter from "events";
import { QError } from "./utils";
import express from "express";
import { ExecutionParams } from "subscriptions-transport-ws";

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
    ) {
    }
}

export const RequestEvent = {
    CLOSE: "close",
    FINISH: "finish",
};

export class QRequestContext {
    events: EventEmitter;
    remoteAddress: string;
    accessKey: string;
    usedAccessKey?: string = undefined;
    usedMamAccessKey?: string = undefined;
    multipleAccessKeysDetected = false;
    parentSpan: Span | SpanContext | undefined;

    constructor(
        public services: QRequestServices,
        public req: express.Request | undefined,
        public connection: ExecutionParams | undefined,
    ) {
        this.events = new EventEmitter();
        this.events.setMaxListeners(0);
        req?.on?.("close", () => {
            this.emitClose();
        });
        this.remoteAddress = req?.socket?.remoteAddress ?? "";
        this.accessKey = Auth.extractAccessKey(req as RequestWithAccessHeaders, connection);
        this.parentSpan = QTracer.extractParentSpan(services.tracer, connection ?? req) ?? undefined;
    }

    async requireGrantedAccess(args: AccessArgs): Promise<AccessRights> {
        const accessKey = this.accessKey ?? args.accessKey ?? undefined;
        this.usedAccessKey = this.checkUsedAccessKey(accessKey);
        return await this.services.auth.requireGrantedAccess(accessKey);
    }

    checkUsedAccessKey(accessKey?: string): string | undefined {
        if (!accessKey) {
            return this.usedAccessKey;
        }
        if (this.usedAccessKey && accessKey !== this.usedAccessKey) {
            this.multipleAccessKeysDetected = true;
            throw QError.multipleAccessKeys();
        }
        return accessKey;
    }

    mamAccessRequired(args: AccessArgs) {
        const accessKey = args.accessKey ?? undefined;
        this.usedMamAccessKey = this.checkUsedAccessKey(accessKey);
        if (!accessKey || !this.services.auth.mamAccessKeys.has(accessKey)) {
            throw Auth.unauthorizedError();
        }
    }

    emitClose() {
        this.events.emit(RequestEvent.CLOSE);
    }

    finish() {
        this.events.emit(RequestEvent.FINISH);
        this.events.removeAllListeners();
    }
}

