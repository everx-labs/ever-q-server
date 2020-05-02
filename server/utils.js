import type {QLog} from './logs';

export function cleanError(error: any): any {
    if ('ArangoError' in error) {
        return error.ArangoError;
    }
    delete error.request;
    delete error.response;
    return error;
}


export function createError(code: number, message: string, source: string = 'graphql'): Error {
    const error = new Error(message);
    (error: any).source = source;
    (error: any).code = code;
    return error;
}

function isInternalServerError(error: Error): boolean {
    if ('type' in error && error.type === 'system') {
        return true;
    }
    if ('errno' in error && 'syscall' in error) {
        return true;
    }
}

export async function wrap<R>(log: QLog, op: string, args: any, fetch: () => Promise<R>) {
    try {
        return await fetch();
    } catch (err) {
        let cleaned = cleanError(err);
        log.error('FAILED', op, args, cleaned);
        if (isInternalServerError(cleaned)) {
            cleaned = createError(500, 'Service temporary unavailable');
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
            return `${value.substr(0, 50)}… [${value.length}]`
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
        const valueToLog: { [string]: any } = {};
        Object.entries(value).forEach(([n, v]) => {
            const propertyValueToLog = toLog(v, newObjs);
            if (propertyValueToLog !== undefined) {
                valueToLog[n] = propertyValueToLog;
            }
        });
        return valueToLog
    }
}
