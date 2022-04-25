import { $$asyncIterator } from "iterall"

export interface KVProvider {
    get<T>(key: string): Promise<T | null | undefined>

    subscribe<T>(key: string): Promise<AsyncIterator<T>>
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
