import { $$asyncIterator } from "iterall"
import { Deferred } from "../utils"

export interface KVProvider {
    get<T>(key: string): Promise<T | null | undefined>

    list<T>(
        key: string,
        first: number,
        last: number,
    ): Promise<T[] | null | undefined>

    subscribe<T>(key: string): Promise<AsyncIterator<T>>
}

export class KVIterator<T> implements AsyncIterator<T> {
    private pullQueue: ((result: IteratorResult<T>) => void)[] = []
    private pushQueue: T[] = []
    private running = true
    private closedWith = new Deferred<IteratorResult<T>>()
    onClose: (() => void) | null = null

    push(value: T) {
        if (!this.running) {
            return
        }
        if (this.pullQueue.length !== 0) {
            this.pullQueue.shift()?.({
                value,
                done: false,
            })
        } else {
            this.pushQueue.push(value)
        }
    }

    async next(): Promise<IteratorResult<T>> {
        if (!this.running) {
            return this.closedWith.promise
        }
        const nextValue = new Promise<IteratorResult<T>>(resolve => {
            if (this.pushQueue.length > 0) {
                resolve({
                    value: this.pushQueue.shift() as T,
                    done: false,
                })
            } else {
                this.pullQueue.push(resolve)
            }
        })
        const result = await Promise.race([this.closedWith.promise, nextValue])
        // recreate instance of Deferred to prevent memory leak
        this.closedWith = new Deferred<IteratorResult<T>>()
        return result
    }

    close(resolved: boolean, error?: Error) {
        if (this.running) {
            this.running = false
            if (resolved) {
                this.closedWith.resolve({ done: true, value: undefined })
            } else {
                this.closedWith.reject(error)
            }
            if (this.onClose) {
                this.onClose()
            }
        }
    }

    async return(): Promise<IteratorResult<T>> {
        this.close(true)
        await this.emptyQueue()
        return {
            value: undefined,
            done: true,
        }
    }

    async throw(error?: Error): Promise<IteratorResult<T>> {
        this.close(false, error)
        await this.emptyQueue()
        return {
            value: undefined,
            done: true,
        }
    }

    [$$asyncIterator]() {
        return this
    }

    async emptyQueue() {
        if (this.running) {
            this.close(true)
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async list<T>(
        _key: string,
        _first: number,
        _last: number,
    ): Promise<T[] | null | undefined> {
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
