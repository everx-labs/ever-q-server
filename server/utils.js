import type { QLog } from './logs';

export function cleanError(err: any): any {
    delete err.response;
    return err.ArangoError || err;
}

export async function wrap<R>(log: QLog, op: string, args: any, fetch: () => Promise<R>) {
    try {
        return await fetch();
    } catch (err) {
        const cleaned = cleanError(err);
        log.error('FAILED', op, args, cleaned.message || err.toString());
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
        const onField = {
            in_message: 'in_msg',
            out_messages: 'out_msg',
            signatures: 'id',
        }[item.name];
        if (onField !== undefined && doc[onField] !== undefined) {
            selected[onField] = doc[onField];
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
