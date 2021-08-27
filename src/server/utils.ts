import type { QLog } from "./logs";
import fs from "fs";
import path from "path";
import { createHash } from "crypto";

export function packageJson(): Record<string, unknown> {
    let testPath = path.resolve(__dirname);
    const packagePath = () => path.resolve(testPath, "package.json");
    while (testPath !== "" && !fs.existsSync(packagePath())) {
        testPath = path.dirname(testPath);
    }
    return JSON.parse(fs.readFileSync(packagePath(), "utf8"));
}

export function cleanError(error: Error & {
    ArangoError?: Error,
    request?: unknown,
    response?: unknown,
}): Error {
    if (error.ArangoError !== undefined) {
        return error.ArangoError;
    }
    delete error.request;
    delete error.response;
    return error;
}

enum QErrorCode {
    MESSAGE_EXPIRED = 10001,
    MULTIPLE_ACCESS_KEYS = 10002,
    UNAUTHORIZED = 10003,
    AUTH_SERVICE_UNAVAILABLE = 10004,
    AUTH_FAILED = 10005,
    QUERY_TERMINATED_ON_TIMEOUT = 10006,
    INVALID_CONFIG = 10007,
    INVALID_QUERY = 10008,
}

export class QError extends Error {
    source: string;
    code: number;
    data?: Record<string, unknown>;

    constructor(code: number, message: string, data?: Record<string, unknown>) {
        super(message);
        this.source = "graphql";
        this.code = code;
        if (data !== undefined) {
            this.data = data;
        }
    }

    static messageExpired(id: string, expiredAt: number): Error {
        return QError.create(QErrorCode.MESSAGE_EXPIRED, "Message expired", {
            id,
            expiredAt,
            now: Date.now(),
        });
    }

    static queryTerminatedOnTimeout(): Error {
        return QError.create(QErrorCode.QUERY_TERMINATED_ON_TIMEOUT, "Query terminated on timeout", {
            now: Date.now(),
        });
    }

    static create(code: number, message: string, data?: Record<string, unknown>): Error {
        return new QError(code, message, data);
    }

    static multipleAccessKeys() {
        return QError.create(
            QErrorCode.MULTIPLE_ACCESS_KEYS,
            "Request must use the same access key for all queries and mutations",
        );
    }

    static unauthorized() {
        return QError.create(QErrorCode.UNAUTHORIZED, "Unauthorized");
    }

    static authServiceUnavailable() {
        return QError.create(QErrorCode.AUTH_SERVICE_UNAVAILABLE, "Auth service unavailable");
    }

    static auth(error: QError) {
        return QError.create(QErrorCode.AUTH_FAILED,
            error.message ?? (error as { description?: string }).description ?? "",
            { authErrorCode: error.code },
        );
    }

    static internalServerError() {
        return QError.create(500, "Internal Server Error");
    }

    static serviceUnavailable() {
        return QError.create(503, "Service Unavailable");
    }

    static invalidConfigValue(option: string, message: string) {
        return QError.create(QErrorCode.INVALID_CONFIG, `Invalid ${option}: ${message}`);
    }

    static invalidConfig(message: string) {
        return QError.create(QErrorCode.INVALID_CONFIG, message);
    }

    static invalidQuery(message: string) {
        return QError.create(QErrorCode.INVALID_QUERY, message);
    }
}

export function isSystemError(error: Error & {
    type?: string,
    errno?: unknown,
    syscall?: unknown,
}): boolean {
    if (error.type === "system") {
        return true;
    }
    return error.errno !== undefined && error.syscall !== undefined;
}

export async function wrap<R>(log: QLog, op: string, args: unknown, fetch: () => Promise<R>) {
    try {
        return await fetch();
    } catch (err) {
        let cleaned = cleanError(err);
        log.error(`${op}_FAILED`, args, err);
        if (isSystemError(err)) {
            cleaned = QError.internalServerError();
        }
        throw cleaned;
    }
}

export function toJSON(value: unknown): string {
    try {
        return JSON.stringify(toLog(value));
    } catch (error) {
        return JSON.stringify(`${value}`);
    }
}

export function toLog(value: unknown, objs?: unknown[]): unknown {
    switch (typeof value) {
    case "undefined":
    case "boolean":
    case "number":
    case "bigint":
    case "symbol":
        return value;
    case "string":
        if (value.length > 80) {
            return `${value.substr(0, 50)}… [${value.length}]`;
        }
        return value;
    case "function":
        return undefined;
    default: {
        if (value === null) {
            return value;
        }
        if (objs !== undefined && objs.includes(value)) {
            return undefined;
        }
        const newObjs = objs !== undefined ? [...objs, value] : [value];
        if (Array.isArray(value)) {
            return value.map(x => toLog(x, newObjs));
        }
        const valueToLog: Record<string, unknown> = {};
        Object.entries(value as Record<string, unknown>).forEach(([n, v]) => {
            const propertyValueToLog = toLog(v, newObjs);
            if (propertyValueToLog !== undefined) {
                valueToLog[n] = propertyValueToLog;
            }
        });
        return valueToLog;
    }
    }
}

export function hash(...keys: string[]): string {
    return createHash("md5").update(keys.join("")).digest("hex");
}

export function httpUrl(address: string): string {
    const http = "http";
    return `${http}://${address}`;
}

function isObject(test: unknown): boolean {
    return (test !== null && test !== undefined && typeof test === "object" && !Array.isArray(test));
}

export function assignDeep(target: Record<string, unknown>, source: Record<string, unknown> | undefined) {
    if (!source) {
        return;
    }
    for (const [name, value] of Object.entries(source)) {
        if (isObject(value) && isObject(target[name])) {
            assignDeep(target[name] as Record<string, unknown>, value as Record<string, unknown>);
        } else {
            target[name] = value;
        }
    }
}

export function cloneDeep(source: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
    if (source === undefined) {
        return undefined;
    }
    const clone: Record<string, unknown> = {};
    for (const [name, value] of Object.entries(source)) {
        if (isObject(value)) {
            clone[name] = cloneDeep(value as Record<string, unknown>);
        } else {
            clone[name] = value;
        }
    }
    return clone;

}

export function required<T>(value: T | undefined): T {
    if (value !== undefined) {
        return value;
    }
    throw QError.serviceUnavailable();
}

export function setAdd<T>(target: Set<T>, source: Set<T>) {
    for(const x of source) {
        target.add(x);
    }
}

export function setHasIntersections<T>(a: Set<T>, b: Set<T>): boolean {
    const [c, d] = a.size < b.size ? [a, b] : [b, a];
    for(const x of c) {
        if (d.has(x)) {
            return true;
        }
    }
    return false;
}
