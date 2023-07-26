import EventEmitter from "events"
import { ensureProtocol, QArangoConfig } from "../config"
import type { QLog } from "../logs"
import type {
    QDatabaseConnection,
    QDataEvent,
    QDataProvider,
    QDataProviderQueryParams,
    QDoc,
    QIndexInfo,
} from "./data-provider"
import ArangoChair from "arangochair"
import { QTraceSpan } from "../tracing"
import { Database } from "arangojs"

type ArangoCollectionDescr = {
    name: string
}

type Subscription = {
    collection: string
    listener: (doc: QDoc, event: QDataEvent) => void
}

export class QDatabaseProvider implements QDataProvider {
    started: boolean
    collectionsForSubscribe: string[]
    listener: ArangoChair | null
    listenerSubscribers: EventEmitter
    listenerSubscribersCount: number
    private activeQueries: ActiveQueries

    constructor(
        public log: QLog,
        public connection: QDatabaseConnection,
        private useListener: boolean,
    ) {
        this.started = false
        this.collectionsForSubscribe = []
        this.listener = null
        this.listenerSubscribers = new EventEmitter()
        this.listenerSubscribers.setMaxListeners(0)
        this.listenerSubscribersCount = 0
        this.activeQueries = new ActiveQueries(
            this.connection.config.resultCacheTTL &&
            this.connection.config.resultCacheTTL > 0
                ? this.connection.config.resultCacheTTL
                : undefined,
        )
    }

    async start(collectionsForSubscribe: string[]): Promise<void> {
        this.started = true
        let subscriptionsChanged = false
        for (const collection of collectionsForSubscribe) {
            if (
                !this.collectionsForSubscribe.find(
                    x => x.toLowerCase() === collection.toLowerCase(),
                )
            ) {
                subscriptionsChanged = true
                this.collectionsForSubscribe.push(collection)
            }
        }
        if (subscriptionsChanged) {
            this.checkStopListener()
        }
        this.checkStartListener()
        return Promise.resolve()
    }

    async stop() {
        this.checkStopListener()
    }

    getCollectionIndexes(collection: string): Promise<QIndexInfo[]> {
        return this.connection.database.collection(collection).indexes()
    }

    /**
     * Returns an object with collection names in keys and collection size in values.
     */
    async loadFingerprint(): Promise<unknown> {
        const collections: ArangoCollectionDescr[] =
            await this.connection.database.listCollections()
        const collectionNames = collections.map(descr => descr.name)
        // TODO: add this when required a new version arangojs v7.x.x
        // await Promise.all(collections.map(col => this.arango.collection(col).recalculateCount()));
        const results = await Promise.all(
            collectionNames.map(col =>
                this.connection.database.collection(col).count(),
            ),
        )
        const fingerprint: { [name: string]: number } = {}
        collectionNames.forEach((collectionName, i) => {
            fingerprint[collectionName] = results[i].count
        })
        return fingerprint
    }

    async hotUpdate(): Promise<void> {
        return Promise.resolve()
    }

    async query(params: QDataProviderQueryParams): Promise<QDoc[]> {
        const { text, vars, traceSpan, request } = params
        const queryKey = `${text}${JSON.stringify(vars)}`
        return await this.activeQueries.query(queryKey, async () => {
            const maxRuntime = params.maxRuntimeInS
                ? Math.min(
                      params.maxRuntimeInS,
                      request.services.config.queries.maxRuntimeInS,
                  )
                : request.services.config.queries.maxRuntimeInS

            const impl = async (span: QTraceSpan) => {
                request.requestTags.arangoCalls += 1
                const cursor = await this.connection.database.query(
                    text,
                    vars,
                    {
                        maxRuntime,
                    },
                )
                span.logEvent("cursor_obtained")
                return await cursor.all()
            }
            return traceSpan.traceChildOperation(`arango.query`, impl)
        })
    }

    subscribe(
        collection: string,
        listener: (doc: QDoc, event: QDataEvent) => void,
    ): unknown {
        if (this.listenerSubscribers) {
            this.listenerSubscribers.on(collection, listener)
            this.listenerSubscribersCount += 1
        }
        this.checkStartListener()
        return {
            collection,
            listener,
        }
    }

    unsubscribe(subscription: unknown) {
        if (this.listenerSubscribers) {
            this.listenerSubscribers.removeListener(
                (subscription as Subscription).collection,
                (subscription as Subscription).listener,
            )
            this.listenerSubscribersCount = Math.max(
                this.listenerSubscribersCount - 1,
                0,
            )
        }
    }

    // Internals

    checkStopListener() {
        if (this.listener) {
            this.listener.removeAllListeners()
            this.listener.stop()
            this.listener = null
        }
    }

    checkStartListener() {
        if (!this.useListener) {
            return
        }
        if (!this.started) {
            return
        }
        if (this.listener) {
            return
        }
        if (this.collectionsForSubscribe.length === 0) {
            return
        }
        if (this.listenerSubscribersCount === 0) {
            return
        }
        this.listener = this.createAndStartListener()
    }

    createAndStartListener(): ArangoChair {
        const { server, name, auth } = this.connection.config
        const dbUrl = ensureProtocol(server, "http")
        const listenerUrl = `${dbUrl}/${name}`

        const listener = new ArangoChair(listenerUrl)
        const parsedDbUrl = new URL(dbUrl)

        const pathPrefix =
            parsedDbUrl.pathname !== "/" ? parsedDbUrl.pathname || "" : ""
        listener._loggerStatePath = `${pathPrefix}/_db/${name}/_api/replication/logger-state`
        listener._loggerFollowPath = `${pathPrefix}/_db/${name}/_api/replication/logger-follow`

        if (this.connection.config.auth) {
            const userPassword = Buffer.from(auth).toString("base64")
            listener.req.opts.headers["Authorization"] = `Basic ${userPassword}`
        }

        this.collectionsForSubscribe.forEach(collectionName => {
            listener.subscribe({ collection: collectionName })
            listener.on(collectionName, (docJson: QDoc, type: QDataEvent) => {
                if (
                    type === "insert/update" ||
                    type === "insert" ||
                    type === "update"
                ) {
                    this.onDataEvent(type, collectionName, docJson)
                }
            })
        })

        listener.on(
            "error",
            (err: Error, _status: unknown, _headers: unknown, body: string) => {
                let error
                try {
                    error = JSON.parse(body)
                } catch {
                    error = err
                }
                this.log.error("FAILED", "LISTEN", `${err}`, error)
                setTimeout(
                    () => listener.start(),
                    this.connection.config.listenerRestartTimeout || 1000,
                )
            },
        )
        listener.start()
        return listener
    }

    onDataEvent(event: QDataEvent, collection: string, doc: QDoc) {
        if (this.listenerSubscribers) {
            this.listenerSubscribers.emit(collection, doc, event)
        }
    }
}

type ActiveQuery = {
    resultPromise: Promise<QDoc[]>
    // Drain time
    drainTime?: number
}

export class ActiveQueries {
    private items = new Map<string, ActiveQuery>()
    private drainTime: number | undefined = undefined

    constructor(private resultTTL?: number) {}

    async query(
        queryKey: string,
        startQuery: () => Promise<QDoc[]>,
    ): Promise<QDoc[]> {
        const now = Date.now()

        this.drainIfRequired(now)

        // If we already have an active promise, wait for the result and returns it
        const existing = this.items.get(queryKey)
        if (existing) {
            return await existing.resultPromise
        }

        // Otherwise, create the new active query and store it
        const activeQuery: ActiveQuery = {
            resultPromise: startQuery(),
        }
        this.items.set(queryKey, activeQuery)

        try {
            // Try to fetch results
            const result = await activeQuery.resultPromise
            if (this.resultTTL) {
                // If result caching is enabled, set result's drain time
                activeQuery.drainTime = now + this.resultTTL
            } else {
                // If result caching is disabled, just remove this query
                this.items.delete(queryKey)
            }
            return result
        } catch (err) {
            // If result fetching failed, remove an active query
            this.items.delete(queryKey)
            throw err
        }
    }

    private drainIfRequired(now: number) {
        // If result caching is disabled do nothing
        if (!this.resultTTL) {
            return
        }
        // If drain time is set but less than now, do nothing
        if (this.drainTime && this.drainTime > now) {
            return
        }
        // Remove all entries with specified drain time and drain time more than now
        for (const [key, entry] of this.items) {
            if (entry.drainTime && entry.drainTime < now) {
                this.items.delete(key)
            }
        }
        // Plan next drain time
        this.drainTime = now + this.resultTTL
    }
}

export function createDatabase(config: QArangoConfig): Database {
    const database = new Database({
        url: `${ensureProtocol(config.server, "http")}`,
        agentOptions: {
            maxSockets: config.maxSockets,
        },
    })
    database.useDatabase(config.name)
    if (config.auth) {
        const authParts = config.auth.split(":")
        database.useBasicAuth(authParts[0], authParts.slice(1).join(":"))
    }
    return database
}
