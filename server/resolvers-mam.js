// @flow

import fs from "fs";
import Arango from "./arango";
import { Collection } from "./arango-collection";
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

type CollectionStat = {
    name: string,
    subscriptions: number,
    waitFor: number,
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
    const db: Arango = context.db;
    return {
        collections: db.collections.map((collection: Collection) => {
            return {
                name: collection.name,
                subscriptions: collection.subscriptions.items.size,
                waitFor: collection.waitFor.items.size,
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
