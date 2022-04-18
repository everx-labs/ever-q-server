import { QDataCollection } from '../data/collection'
import { packageJson } from '../utils'
import { AccessArgs } from '../auth'
import { QRequestContext } from '../request'

const { version } = packageJson()

type Info = {
    version: string
}

type ListenerStat = {
    filter: string
    selection: string
    queueSize: number
    eventCount: number
    secondsActive: number
}

type CollectionStat = {
    name: string
    subscriptionCount: number
    waitForCount: number
    maxQueueSize: number
    subscriptions: ListenerStat[]
    waitFor: ListenerStat[]
}

type Stat = {
    waitForCount: number
    subscriptionCount: number
    collections: CollectionStat[]
}

type CollectionSummary = {
    name: string
    count: number
    indexes: string[]
}

// Query

function info(): Info {
    return {
        version: version as string,
    }
}

function stat(
    _parent: Record<string, unknown>,
    args: AccessArgs,
    context: QRequestContext,
): Stat {
    context.mamAccessRequired(args)
    const { data } = context.services
    let totalWaitForCount = 0
    let totalSubscriptionCount = 0
    const collections = data.collections.map((collection: QDataCollection) => {
        totalWaitForCount += collection.waitForCount
        totalSubscriptionCount += collection.subscriptionCount
        return {
            name: collection.name,
            subscriptionCount: collection.subscriptionCount,
            waitForCount: collection.waitForCount,
            maxQueueSize: collection.maxQueueSize,
            subscriptions: [],
            waitFor: [],
        }
    })
    return {
        waitForCount: totalWaitForCount,
        subscriptionCount: totalSubscriptionCount,
        collections,
    }
}

async function getCollections(
    _parent: Record<string, unknown>,
    args: AccessArgs,
    context: QRequestContext,
): Promise<CollectionSummary[]> {
    context.mamAccessRequired(args)
    const { data } = context.services
    const collections: CollectionSummary[] = []
    for (const collection of data.collections) {
        const indexes: string[] = []
        for (const index of await collection.getIndexes()) {
            indexes.push(index.fields.join(', '))
        }
        collections.push({
            name: collection.name,
            count: 0,
            indexes,
        })
    }
    return collections
}

async function dropCachedDbInfo(
    _parent: Record<string, unknown>,
    args: AccessArgs,
    context: QRequestContext,
): Promise<boolean> {
    context.mamAccessRequired(args)
    await context.services.data.dropCachedDbInfo()
    return true
}

type UpdateConfigArgs = AccessArgs & {
    config?: {
        debugLatency?: number
    }
}

async function updateConfig(
    _parent: Record<string, unknown>,
    args: UpdateConfigArgs,
    context: QRequestContext,
): Promise<boolean> {
    context.mamAccessRequired(args)
    const config = args.config
    if (config) {
        const { debugLatency } = config
        if (debugLatency !== undefined) {
            context.services.data.updateDebugLatency(debugLatency)
        }
    }
    return true
}

// Mutation

export const mam = {
    Query: {
        info,
        getCollections,
        stat,
    },
    Mutation: {
        dropCachedDbInfo,
        updateConfig,
    },
}
