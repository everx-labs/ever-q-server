// @flow

import fs from "fs";
import Arango from "./arango";
import type { QConfig } from "./config";
import path from 'path';

type Info = {
    version: string,
}

type Context = {
    db: Arango,
    config: QConfig,
    shared: Map<string, any>,
}

// Query

function info(): Info {
    const pkg = JSON.parse((fs.readFileSync(path.resolve(__dirname, '..', '..', 'package.json')): any));
    return {
        version: pkg.version,
    };
}

// Mutation

function getChangeLog(_parent: any, args: { id: string}, context: Context): number[] {
    return context.db.changeLog.get(args.id);
}

function setChangeLog(_parent: any, args: { op: string}, context: Context): number {
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
    },
    Mutation: {
        setChangeLog,
    },
};
