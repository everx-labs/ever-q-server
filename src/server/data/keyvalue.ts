import { $$asyncIterator } from "iterall"

export interface KVProvider {
    get<T>(key: string): Promise<T | null | undefined>

    subscribe<T>(key: string): Promise<AsyncIterator<T>>
}

export const emptyKVProvider: KVProvider = {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async get<T>(_key: string): Promise<T | null | undefined> {
        return undefined
    },

    subscribe<T>(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _key: string,
    ): Promise<AsyncIterator<T>> {
        return Promise.resolve({
            async next(): Promise<IteratorResult<T>> {
                return {
                    value: undefined,
                    done: true,
                }
            },
        })
    },
}

export type KVMockEntry<T> = {
    keys: KVDataWithChangesKeys
    values: T[]
    ranges: {
        delay: number
        start: number
        end: number
    }[]
}

export function kvMockEntry<T>(
    keys: KVDataWithChangesKeys,
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
        keys,
        values,
        ranges,
    }
}

export function kvMockProvider<T>(entries: KVMockEntry<T>[]): KVProvider {
    const entriesByDataKey = new Map<string, KVMockEntry<T>>()
    const entriesByChangesKey = new Map<string, KVMockEntry<T>>()
    const rangesByDataKey = new Map<string, { start: number; end: number }>()
    for (const entry of entries) {
        entriesByDataKey.set(entry.keys.data, entry)
        entriesByChangesKey.set(entry.keys.changes, entry)
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
                rangesByDataKey.set(entry.keys.data, { start: 0, end: 0 })
                const check = () => {
                    if (step < entry.ranges.length) {
                        const range = entry.ranges[step]
                        setTimeout(() => {
                            iterator.push({} as unknown as CT)
                            rangesByDataKey.set(entry.keys.data, range)
                            step += 1
                            check()
                        }, range.delay)
                    } else {
                        setTimeout(
                            () => rangesByDataKey.delete(entry.keys.data),
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

export type KVDataWithChangesKeys = {
    data: string
    changes: string
}

export class KVIterator<T> implements AsyncIterator<T> {
    pullQueue: ((result: IteratorResult<T>) => void)[]
    pushQueue: T[]
    running: boolean
    onClose: (() => void) | null

    constructor() {
        this.pullQueue = []
        this.pushQueue = []
        this.running = true
        this.onClose = null
    }

    push(value: T) {
        if (!this.isQueueOverflow()) {
            this.internalPush(value)
        }
    }

    isQueueOverflow(): boolean {
        return this.getQueueSize() >= 10
    }

    getQueueSize(): number {
        return this.pushQueue.length + this.pullQueue.length
    }

    internalPush(item: T) {
        if (this.pullQueue.length !== 0) {
            this.pullQueue.shift()?.(
                !this.running
                    ? {
                          value: item,
                          done: true,
                      }
                    : {
                          value: item,
                          done: false,
                      },
            )
        } else {
            this.pushQueue.push(item)
        }
    }

    async next(): Promise<IteratorResult<T>> {
        return new Promise(resolve => {
            const dequeued = this.pushQueue.shift()
            if (dequeued !== undefined) {
                const item: IteratorResult<T> = this.running
                    ? {
                          value: dequeued,
                          done: false,
                      }
                    : {
                          value: undefined,
                          done: true,
                      }
                resolve(item)
            } else {
                this.pullQueue.push(resolve)
            }
        })
    }

    async return(): Promise<IteratorResult<T>> {
        if (this.onClose) {
            this.onClose()
        }
        await this.emptyQueue()
        return {
            value: undefined,
            done: true,
        }
    }

    async throw(error?: Error): Promise<IteratorResult<T>> {
        if (this.onClose) {
            this.onClose()
        }
        await this.emptyQueue()
        return Promise.reject(error)
    }

    [$$asyncIterator]() {
        return this
    }

    async emptyQueue() {
        if (this.running) {
            this.running = false
            this.pullQueue.forEach(resolve =>
                resolve({
                    value: undefined,
                    done: true,
                }),
            )
            this.pullQueue = []
            this.pushQueue = []
        }
    }

    static async startWithDataAndChangesKeys<T>(
        provider: KVProvider,
        keys: KVDataWithChangesKeys,
    ): Promise<KVIterator<T>> {
        const iterator = new KVIterator<T>()
        let pushedCount = 0

        async function pushNext() {
            const data = await provider.get<T[]>(keys.data)
            if (data !== null && data !== undefined) {
                while (pushedCount < data.length) {
                    iterator.push(data[pushedCount])
                    pushedCount += 1
                }
            }
        }

        await pushNext()
        void (async () => {
            const changesIterator = await provider.subscribe(keys.changes)
            let done = false
            while (!done) {
                done = (await changesIterator.next()).done ?? false
                if (!done) {
                    await pushNext()
                }
            }
        })().then(() => {})

        return iterator
    }
}
