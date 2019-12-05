// @flow

import fs from "fs";
import { Kafka, Producer } from "kafkajs";
import Arango from "./arango";
import type { QConfig } from "./config";
import { ensureProtocol } from "./config";
import path from 'path';
import fetch from 'node-fetch';

function isObject(test: any): boolean {
    return typeof test === 'object' && test !== null;
}

function overrideObject(original: any, overrides: any) {
    Object.entries(overrides).forEach(([name, overrideValue]) => {
        if ((name in original) && isObject(overrideValue) && isObject(original[name])) {
            overrideObject(original[name], overrideValue);
        } else {
            original[name] = overrideValue;
        }
    });
}

type Info = {
    version: string,
}

type Request = {
    id: string,
    body: string,
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

async function getAccountsCount(_parent, _args, context: Context): Promise<number> {
    const result: any = await context.db.fetchQuery(`RETURN LENGTH(accounts)`, {});
    const counts = (result: number[]);
    return counts.length > 0 ? counts[0] : 0;
}

async function getTransactionsCount(_parent, _args, context: Context): Promise<number> {
    const result: any = await context.db.fetchQuery(`RETURN LENGTH(transactions)`, {});
    const counts = (result: number[]);
    return counts.length > 0 ? counts[0] : 0;
}

async function getAccountsTotalBalance(_parent, _args, context: Context): Promise<String> {
    /*
    Because arango can not sum BigInts we need to sum separately:
    hs = SUM of high bits (from 24-bit and higher)
    ls = SUM of lower 24 bits
    And the total result is (hs << 24) + ls
     */

    const result: any = await context.db.fetchQuery(`
        LET d = 16777216
        FOR a in accounts
        LET b = TO_NUMBER(CONCAT("0x", SUBSTRING(a.balance, 2)))
        COLLECT AGGREGATE
            hs = SUM(FLOOR(b / d)),
            ls = SUM(b % (d - 1))
        RETURN { hs, ls }
    `, {});
    const parts = (result: {hs:number, ls: number}[])[0];
    //$FlowFixMe
    return (BigInt(parts.hs) * BigInt(0x1000000) + BigInt(parts.ls)).toString();
}

// Mutation

async function postRequestsUsingRest(requests: Request[], context: Context): Promise<void> {
    const config = context.config.requests;
    const url = `${ensureProtocol(config.server, 'http')}/topics/${config.topic}`;
    const response = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
        },
        redirect: 'follow',
        referrer: 'no-referrer',
        body: JSON.stringify({
            records: requests.map((request) => ({
                key: request.id,
                value: request.body,
            })),
        }),
    });
    if (response.status !== 200) {
        const message = `Post requests failed: ${await response.text()}`;
        throw new Error(message);
    }
}

async function postRequestsUsingKafka(requests: Request[], context: Context): Promise<void> {
    const ensureShared = async (name, createValue: () => Promise<any>) => {
        if (context.shared.has(name)) {
            return context.shared.get(name);
        }
        const value = await createValue();
        context.shared.set(name, value);
        return value;
    };

    const config = context.config.requests;
    const producer: Producer = await ensureShared('producer', async () => {
        const kafka: Kafka = await ensureShared('kafka', async () => new Kafka({
            clientId: 'q-server',
            brokers: [config.server]
        }));
        const newProducer = kafka.producer();
        await newProducer.connect();
        return newProducer;

    });
    await producer.send({
        topic: config.topic,
        messages: requests.map((request) => ({
            key: request.id,
            value: request.body,
        })),
    });
}

async function postRequests(_, args: { requests: Request[] }, context: Context): Promise<string[]> {
    const requests: ?(Request[]) = args.requests;
    if (!requests) {
        return [];
    }
    try {
        if (context.config.requests.mode === 'rest') {
            await postRequestsUsingRest(requests, context);
        } else {
            await postRequestsUsingKafka(requests, context);
        }
    } catch (error) {
        console.log('[Q Server] post request failed]', error);
        throw error;
    }
    return requests.map(x => x.id);
}

const customResolvers = {
    Query: {
        info,
        getAccountsCount,
        getTransactionsCount,
        getAccountsTotalBalance,
    },
    Mutation: {
        postRequests,
    },
};

export function attachCustomResolvers(original: any): any {
    overrideObject(original, customResolvers);
    return original;
}
