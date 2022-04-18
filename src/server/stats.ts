import { STATS } from './config'
import { StatsD, Callback as StatsCallback } from 'node-statsd'

export interface IStats {
    configuredTags: string[]

    increment(stat: string, value: number, tags: string[]): Promise<void>

    gauge(stat: string, value: number, tags: string[]): Promise<void>

    timing(stat: string, value: number, tags: string[]): Promise<void>

    close(): void
}

export interface IStatsImpl {
    increment(
        stat: string,
        value: number,
        tags: string[],
        callback: StatsCallback,
    ): void

    gauge(
        stat: string,
        value: number,
        tags: string[],
        callback: StatsCallback,
    ): void

    timing(
        stat: string,
        value: number,
        tags: string[],
        callback: StatsCallback,
    ): void

    close(): void
}

function logStatsError(error: Error) {
    console.log(`StatsD send failed: ${error.message}`)
}

const dummyStats: IStats = {
    configuredTags: [],
    increment(): Promise<void> {
        return Promise.resolve()
    },
    gauge(): Promise<void> {
        return Promise.resolve()
    },
    timing(): Promise<void> {
        return Promise.resolve()
    },
    close() {},
}

export class QStats implements IStats {
    static create(
        server: string,
        configuredTags: string[],
        resetInterval: number,
    ): IStats {
        return server
            ? new QStats(server, configuredTags, resetInterval)
            : dummyStats
    }

    host: string
    port: number | undefined
    impl: IStatsImpl | null
    resetInterval: number
    resetTime: number
    configuredTags: string[]

    constructor(
        server: string,
        configuredTags: string[],
        resetInterval: number,
    ) {
        const hostPort = server.split(':')
        this.host = hostPort[0]
        this.port = hostPort[1] !== undefined ? Number(hostPort[1]) : undefined
        this.configuredTags = configuredTags
        this.resetInterval = resetInterval

        this.impl = null
        this.resetTime = resetInterval > 0 ? Date.now() + resetInterval : 0
    }

    ensureImpl() {
        const impl = this.impl
        if (impl !== null) {
            return impl
        }
        const newImpl = new StatsD(this.host, this.port, STATS.prefix)
        newImpl.socket.on('error', (err: Error) => {
            logStatsError(err)
            this.dropImpl()
        })
        this.impl = newImpl
        return newImpl
    }

    dropImpl(error?: Error) {
        if (error !== undefined && error !== null) {
            logStatsError(error)
        }
        if (this.impl !== null) {
            this.impl.close()
            this.impl = null
        }
    }

    withImpl(
        f: (impl: IStatsImpl, callback: StatsCallback) => void,
    ): Promise<void> {
        return new Promise(resolve => {
            const timeoutTimer = setTimeout(() => {
                // It was confirmed that StatsD lib sometimes hangs and we need this timeout
                this.dropImpl({ name: '', message: 'timeouted' })
                resolve()
            }, 1000)

            try {
                if (this.resetTime > 0) {
                    const now = Date.now()
                    if (now > this.resetTime) {
                        this.dropImpl()
                        this.resetTime = now + this.resetInterval
                    }
                }
                f(this.ensureImpl(), (error?: Error) => {
                    if (error !== undefined && error !== null) {
                        this.dropImpl(error)
                    }
                    clearTimeout(timeoutTimer)
                    resolve()
                })
            } catch (error) {
                clearTimeout(timeoutTimer)
                this.dropImpl(error as Error)
                resolve()
            }
        })
    }

    increment(stat: string, value: number, tags: string[]): Promise<void> {
        return this.withImpl((stats, callback) =>
            stats.increment(stat, value, tags, callback),
        )
    }

    gauge(stat: string, value: number, tags: string[]): Promise<void> {
        return this.withImpl((stats, callback) =>
            stats.gauge(stat, value, tags, callback),
        )
    }

    timing(stat: string, value: number, tags: string[]): Promise<void> {
        return this.withImpl((stats, callback) =>
            stats.timing(stat, value, tags, callback),
        )
    }

    close() {
        this.dropImpl()
    }

    static combineTags(stats: IStats, tags: string[]): string[] {
        return (stats?.configuredTags?.length ?? 0) > 0
            ? stats.configuredTags.concat(tags)
            : tags
    }
}

export class StatsCounter {
    stats: IStats
    name: string
    tags: string[]

    constructor(stats: IStats, name: string, tags: string[]) {
        this.stats = stats
        this.name = name
        this.tags = QStats.combineTags(stats, tags)
    }

    increment() {
        return this.stats.increment(this.name, 1, this.tags)
    }
}

export class StatsGauge {
    stats: IStats
    name: string
    tags: string[]
    value: number

    constructor(stats: IStats, name: string, tags: string[]) {
        this.stats = stats
        this.name = name
        this.tags = QStats.combineTags(stats, tags)
        this.value = 0
    }

    set(value: number) {
        this.value = value
        return this.stats.gauge(this.name, this.value, this.tags)
    }

    increment(delta = 1) {
        return this.set(this.value + delta)
    }

    decrement(delta = 1) {
        return this.set(this.value - delta)
    }
}

export class StatsTiming {
    stats: IStats
    name: string
    tags: string[]

    constructor(stats: IStats, name: string, tags: string[]) {
        this.stats = stats
        this.name = name
        this.tags = QStats.combineTags(stats, tags)
    }

    report(value: number) {
        return this.stats.timing(this.name, value, this.tags)
    }

    start(): () => Promise<void> {
        const start = Date.now()
        return () => {
            return this.report(Date.now() - start)
        }
    }
}
