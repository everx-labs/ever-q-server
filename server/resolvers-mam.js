// @flow

import fs from "fs";
import Arango from "./arango";
import type { FieldSelection } from "./arango-collection";
import { Collection, CollectionListener, SubscriptionListener } from "./arango-collection";
import type { QConfig } from "./config";
import path from 'path';

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

function selectionToString(selection: FieldSelection[]): string {
    return selection
        .filter(x => x.name !== '__typename')
        .map((field: FieldSelection) => {
            const fieldSelection = selectionToString(field.selection);
            return `${field.name}${fieldSelection !== '' ? ` { ${fieldSelection} }` : ''}`;
        }).join(' ');
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

function getChangeLog(_parent: any, args: { id: string }, context: Context): number[] {
    return context.db.changeLog.get(args.id);
}

async function getCollections(_parent: any, _args: any, context: Context): Promise<CollectionSummary[]> {
    const span = await context.db.tracer.startSpanLog(context.tracer_ctx, "resolvers-mam.js:getCollections",
        'new getCollections query', _args);
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
    await span.finish();
    return collections;
}

// Mutation

function setChangeLog(_parent: any, args: { op: string }, context: Context): number {
    if (args.op === 'CLEAR') {
        context.db.changeLog.clear();
    } else if (args.op === 'ON') {
        context.db.changeLog.enabled = true;
    } else if (args.op === 'OFF') {
        context.db.changeLog.enabled = false;
    }
    return 1;
}

export const resolversMam = {
    Query: {
        info,
        getChangeLog,
        getCollections,
        stat
    },
    Mutation: {
        setChangeLog,
    },
};
