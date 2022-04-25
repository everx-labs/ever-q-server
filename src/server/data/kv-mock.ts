import { KVIterator, KVProvider } from "./kv-provider"
import { DataChangesKeys } from "./kv-data-changes"

export type KVMockEntry<T> = DataChangesKeys & {
    values: T[]
    ranges: {
        delay: number
        start: number
        end: number
    }[]
}

export function kvMockEntry<T>(
    keys: DataChangesKeys,
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
    const entriesByDataKey = new Map<string, KVMockEntry<T>>()
    const entriesByChangesKey = new Map<string, KVMockEntry<T>>()
    const rangesByDataKey = new Map<string, { start: number; end: number }>()
    for (const entry of entries) {
        entriesByDataKey.set(entry.dataKey, entry)
        entriesByChangesKey.set(entry.changesKey, entry)
    }
    return {
        async get<GT>(key: string): Promise<GT | null | undefined> {
            const range = rangesByDataKey.get(key)
            if (!range) {
                return undefined
            }
            const entry = entriesByDataKey.get(key)
            if (!entry) {
                return undefined
            }
            return entry.values.slice(range.start, range.end) as unknown as GT
        },

        async subscribe<CT>(key: string): Promise<AsyncIterator<CT>> {
            const entry = entriesByChangesKey.get(key)
            const iterator = new KVIterator<CT>()
            if (entry) {
                let step = 0
                rangesByDataKey.set(entry.dataKey, { start: 0, end: 0 })
                const check = () => {
                    if (step < entry.ranges.length) {
                        const range = entry.ranges[step]
                        setTimeout(() => {
                            iterator.push({} as unknown as CT)
                            rangesByDataKey.set(entry.dataKey, range)
                            step += 1
                            check()
                        }, range.delay)
                    } else {
                        setTimeout(
                            () => rangesByDataKey.delete(entry.dataKey),
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
