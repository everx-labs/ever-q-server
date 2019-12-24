// @flow

import fs from "fs";
import Arango from "./arango";
import type { FieldSelection } from "./arango-collection";
import { Collection, CollectionSubscription } from "./arango-collection";
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

type SubscriptionStat = {
    filter: string,
    selection: string,
    queueSize: number,
    eventCount: number,
}

type CollectionStat = {
    name: string,
    subscriptionCount: number,
    waitForCount: number,
    maxQueueSize: number,
    subscriptions: SubscriptionStat[],
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
    const subscriptionToStat = (subscription: CollectionSubscription): SubscriptionStat => {
        return {
            filter: JSON.stringify(subscription.filter),
            selection: selectionToString(subscription.selection),
            queueSize: subscription.getQueueSize(),
            eventCount: subscription.eventCount,
        };
    };
    const db: Arango = context.db;
    return {
        collections: db.collections.map((collection: Collection) => {
            return {
                name: collection.name,
                subscriptionCount: collection.subscriptions.items.size,
                waitForCount: collection.waitFor.items.size,
                maxQueueSize: collection.maxQueueSize,
                subscriptions: [...collection.subscriptions.values()].map(subscriptionToStat),
            }
        })
    }
}

function getChangeLog(_parent: any, args: { id: string }, context: Context): number[] {
    return context.db.changeLog.get(args.id);
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
