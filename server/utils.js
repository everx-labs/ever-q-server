import type { QLog } from './logs';

export function cleanError(error: any): any {
    if ('ArangoError' in error) {
        return error.ArangoError;
    }
    delete error.request;
    delete error.response;
    error.stack = '...';
    return error;
}


export function createError(code: number, message: string, source: string = 'graphql'): Error {
    const error = new Error(message);
    (error: any).source = source;
    (error: any).code = code;
    error.stack = '...';
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

export type FieldSelection = {
    name: string,
    selection: FieldSelection[],
}

export function parseSelectionSet(selectionSet: any, returnFieldSelection: string): FieldSelection[] {
    const fields: FieldSelection[] = [];
    const selections = selectionSet && selectionSet.selections;
    if (selections) {
        for (const item of selections) {
            const name = (item.name && item.name.value) || '';
            if (name) {
                const field: FieldSelection = {
                    name,
                    selection: parseSelectionSet(item.selectionSet, ''),
                };
                if (returnFieldSelection !== '' && field.name === returnFieldSelection) {
                    return field.selection;
                }
                fields.push(field);
            }
        }
    }
    return fields;
}

export function selectionToString(selection: FieldSelection[]): string {
    return selection
        .filter(x => x.name !== '__typename')
        .map((field: FieldSelection) => {
            const fieldSelection = selectionToString(field.selection);
            return `${field.name}${fieldSelection !== '' ? ` { ${fieldSelection} }` : ''}`;
        }).join(' ');
}

export function selectFields(doc: any, selection: FieldSelection[]): any {
    if (selection.length === 0) {
        return doc;
    }
    const selected: any = {};
    if (doc._key) {
        selected._key = doc._key;
        selected.id = doc._key;
    }
    for (const item of selection) {
        const requiredForJoin = {
            in_message: ['in_msg'],
            out_messages: ['out_msg'],
            signatures: ['id'],
            src_transaction: ['id', 'msg_type'],
            dst_transaction: ['id', 'msg_type'],
        }[item.name];
        if (requiredForJoin !== undefined) {
            requiredForJoin.forEach((field) => {
                if (doc[field] !== undefined) {
                    selected[field] = doc[field];
                }
            });
        }
        const value = doc[item.name];
        if (value !== undefined) {
            selected[item.name] = item.selection.length > 0
                ? selectFields(value, item.selection)
                : value;
        }
    }
    return selected;
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
