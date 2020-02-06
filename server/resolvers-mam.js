// @flow

import fs from "fs";
import path from 'path';
import Arango from "./arango";
import { Collection, CollectionListener, selectionToString, SubscriptionListener } from "./arango-collection";
import type { QConfig } from "./config";

type Context = {
    db: Arango,
    config: QConfig,
    shared: Map<string, any>,
}

type Info = {
    version: string,
}

type ListenerStat = {
    filter: string,
    selection: string,
    queueSize: number,
    eventCount: number,
    secondsActive: number,
}

type CollectionStat = {
    name: string,
    subscriptionCount: number,
    waitForCount: number,
    maxQueueSize: number,
    subscriptions: ListenerStat[],
    waitFor: ListenerStat[],
}

type Stat = {
    collections: CollectionStat[]
}

type CollectionSummary = {
    collection: string,
    count: number,
    indexes: string[],
}

// Query

function info(): Info {
    const pkg = JSON.parse((fs.readFileSync(path.resolve(__dirname, '..', '..', 'package.json')): any));
    return {
        version: pkg.version,
    };
}

function stat(_parent: any, _args: any, context: Context): Stat {
    const listenerToStat = (listener: CollectionListener ): ListenerStat => {
        return {
            filter: JSON.stringify(listener.filter),
            selection: selectionToString(listener.selection),
            queueSize: 0,
            eventCount: listener.getEventCount(),
            secondsActive: (Date.now() - listener.startTime) / 1000,
        };
    };
    const isSubscription = (listener: CollectionListener): bool => {
        return listener instanceof SubscriptionListener;
    };
    const db: Arango = context.db;
    return {
        collections: db.collections.map((collection: Collection) => {
            const listeners = [...collection.listeners.values()];
            const waitFor = listeners.filter(x => !isSubscription(x));
            const subscriptions = listeners.filter(isSubscription);
            return {
                name: collection.name,
                subscriptionCount: subscriptions.length,
                waitForCount: waitFor.length,
                maxQueueSize: collection.maxQueueSize,
                subscriptions: subscriptions.map(listenerToStat),
                waitFor: waitFor.map(listenerToStat),
            }
        })
    };
}

async function getCollections(_parent: any, _args: any, context: Context): Promise<CollectionSummary[]> {
    const db: Arango = context.db;
    const collections: CollectionSummary[] = [];
    for (const collection of db.collections) {
        const indexes: string[] = [];
        const dbCollection = collection.dbCollection();
        for (const index of await dbCollection.indexes()) {
            indexes.push(index.fields.join(', '));
        }
        collections.push({
            collection: collection.name,
            count: (await dbCollection.count()).count,
            indexes,
        });
    }
    return collections;
}

// Mutation

export const resolversMam = {
    Query: {
        info,
        getCollections,
        stat
    },
    Mutation: {
    },
};
