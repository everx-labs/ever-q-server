import { ListKeys } from "../server/data/kv-list-changes"
import { KVIterator, KVProvider } from "../server/data/kv-provider"

export type KVMockEntry<T> = ListKeys & {
    values: T[]
    ranges: {
        delay: number
        start: number
        end: number
    }[]
}

export function kvMockEntry<T>(
    keys: ListKeys,
    source: (T | number)[],
): KVMockEntry<T> {
    const values = []
    const ranges = []
    let delay = 0

    for (const item of source) {
        if (typeof item === "number") {
            delay = item
        } else {
            if (delay > 0) {
                ranges.push({
                    delay,
                    start: 0,
                    end: values.length,
                })
                delay = 0
            }
            values.push(item)
        }
    }
    ranges.push({
        delay,
        start: 0,
        end: values.length,
    })
    return {
        ...keys,
        values,
        ranges,
    }
}

export function kvMockProvider<T>(entries: KVMockEntry<T>[]): KVProvider {
    const entriesByListKey = new Map<string, KVMockEntry<T>>()
    const entriesByChangesKey = new Map<string, KVMockEntry<T>>()
    const rangesByListKey = new Map<string, { start: number; end: number }>()
    for (const entry of entries) {
        entriesByListKey.set(entry.listKey, entry)
        entriesByChangesKey.set(entry.changesKey, entry)
    }
    return {
        async get<GT>(key: string): Promise<GT | null | undefined> {
            const range = rangesByListKey.get(key)
            if (!range) {
                return undefined
            }
            const entry = entriesByListKey.get(key)
            if (!entry) {
                return undefined
            }
            return entry.values.slice(range.start, range.end) as unknown as GT
        },

        async list<LT>(
            key: string,
            first: number,
            last: number,
        ): Promise<LT[] | null | undefined> {
            const range = rangesByListKey.get(key)
            if (!range) {
                return undefined
            }
            const entry = entriesByListKey.get(key)
            if (!entry) {
                return undefined
            }
            const list = entry.values.slice(
                range.start,
                range.end,
            ) as unknown as LT[]
            return list.slice(first, last === -1 ? undefined : last - 1)
        },

        async subscribe<CT>(key: string): Promise<AsyncIterator<CT>> {
            const entry = entriesByChangesKey.get(key)
            const iterator = new KVIterator<CT>()
            if (entry) {
                let step = 0
                rangesByListKey.set(entry.listKey, { start: 0, end: 0 })
                const check = () => {
                    if (step < entry.ranges.length) {
                        const range = entry.ranges[step]
                        setTimeout(() => {
                            iterator.push({} as unknown as CT)
                            rangesByListKey.set(entry.listKey, range)
                            step += 1
                            check()
                        }, range.delay)
                    } else {
                        setTimeout(
                            () => rangesByListKey.delete(entry.listKey),
                            100,
                        )
                    }
                }
                check()
            } else {
                await iterator.return()
            }
            return iterator
        },
    }
}

test("There is no tests in this file", () => {})
