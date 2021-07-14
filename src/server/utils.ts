import type { QLog } from "./logs";
import fs from "fs";
import path from "path";
import { createHash } from "crypto";

export function packageJson(): any {
    let testPath = path.resolve(__dirname);
    const packagePath = () => path.resolve(testPath, "package.json");
    while (testPath && !fs.existsSync(packagePath())) {
        testPath = path.dirname(testPath);
    }
    return JSON.parse(fs.readFileSync(packagePath(), "utf8"));
}

export function cleanError(error: any): any {
    if ("ArangoError" in error) {
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
}

export class QError extends Error {
    source: string;
    code: number;
    data?: any;

    constructor(code: number, message: string, data?: any) {
        super(message);
        this.source = "graphql";
        this.code = code;
        if (data !== undefined) {
            this.data = data;
        }
    }

    static messageExpired(id: string, expiredAt: number): Error {
        return QError.create(QErrorCode.MESSAGE_EXPIRED, `Message expired`, {
            id,
            expiredAt,
            now: Date.now(),
        });
    }

    static queryTerminatedOnTimeout(): Error {
        return QError.create(QErrorCode.QUERY_TERMINATED_ON_TIMEOUT, `Query terminated on timeout`, {
            now: Date.now(),
        });
    }

    static create(code: number, message: string, data?: any): Error {
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
            error.message || (error as any).description,
            { authErrorCode: error.code },
        );
    }
}

function isInternalServerError(error: Error): boolean {
    if ("type" in error && (error as any).type === "system") {
        return true;
    }
    if ("errno" in error && "syscall" in error) {
        return true;
    }
    return false;
}

export async function wrap<R>(log: QLog, op: string, args: any, fetch: () => Promise<R>) {
    try {
        return await fetch();
    } catch (err) {
        let cleaned = cleanError(err);
        log.error("FAILED", op, args, cleaned);
        if (isInternalServerError(cleaned)) {
            cleaned = QError.create(500, "Service temporary unavailable");
        }
        throw cleaned;
    }
}

export class RegistryMap<T> {
    name: string;
    items: Map<number, T>;
    lastId: number;

    constructor(name: string) {
        this.name = name;
        this.lastId = 0;
        this.items = new Map();
    }

    add(item: T): number {
        let id = this.lastId;
        do {
            id = id < Number.MAX_SAFE_INTEGER ? id + 1 : 1;
        } while (this.items.has(id));
        this.lastId = id;
        this.items.set(id, item);
        return id;
    }

    remove(id: number) {
        if (!this.items.delete(id)) {
            console.error(`Failed to remove ${this.name}: item with id [${id}] does not exists`);
        }
    }

    entries(): [number, T][] {
        return [...this.items.entries()];
    }

    values(): T[] {
        return [...this.items.values()];
    }
}

export function toLog(value: any, objs?: Object[]): any {
    const typeOf = typeof value;
    switch (typeOf) {
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
    default:
        if (value === null) {
            return value;
        }
        if (objs && objs.includes(value)) {
            return undefined;
        }
        const newObjs = objs ? [...objs, value] : [value];
        if (Array.isArray(value)) {
            return value.map(x => toLog(x, newObjs));
        }
        const valueToLog: { [name: string]: any } = {};
        Object.entries(value).forEach(([n, v]) => {
            const propertyValueToLog = toLog(v, newObjs);
            if (propertyValueToLog !== undefined) {
                valueToLog[n] = propertyValueToLog;
            }
        });
        return valueToLog;
    }
}

export function hash(...keys: string[]): string {
    return createHash("md5").update(keys.join("")).digest("hex");
}
