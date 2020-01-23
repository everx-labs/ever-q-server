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

async function getAccountsCount(_parent, args, context: Context): Promise<number> {
    const span = await context.db.tracer.startSpanLog(
        context,
        "resolvers-custom.js:getAccountCount",
        "new getAccountCount query",
        args);
    try {
        const result: any = await context.db.fetchQuery(`RETURN LENGTH(accounts)`, {}, span);
        const counts = (result: number[]);
        return counts.length > 0 ? counts[0] : 0;
    } finally {
        await span.finish();
    }
}

async function getTransactionsCount(_parent, args, context: Context): Promise<number> {
    const span = await context.db.tracer.startSpanLog(
        context,
        "resolvers-custom.js:getTransactionsCount",
        "new getTransactionsCount query",
        args);
    try {
        const result: any = await context.db.fetchQuery(`RETURN LENGTH(transactions)`, {}, span);
        const counts = (result: number[]);
        return counts.length > 0 ? counts[0] : 0;
    } finally {
        await span.finish();
    }
}

async function getAccountsTotalBalance(_parent, args, context: Context): Promise<String> {
    /*
    Because arango can not sum BigInts we need to sum separately:
    hs = SUM of high bits (from 24-bit and higher)
    ls = SUM of lower 24 bits
    And the total result is (hs << 24) + ls
     */
    const span = await context.db.tracer.startSpanLog(
        context,
        "resolvers-custom.js:getAccountTotalBalance",
        "new getAccountTotalBalance query",
        args);
    try {
        const result: any = await context.db.fetchQuery(`
        LET d = 16777216
        FOR a in accounts
        LET b = TO_NUMBER(CONCAT("0x", SUBSTRING(a.balance, 2)))
        COLLECT AGGREGATE
            hs = SUM(FLOOR(b / d)),
            ls = SUM(b % (d - 1))
        RETURN { hs, ls }
    `, {}, span);
        const parts = (result: { hs: number, ls: number }[])[0];
        //$FlowFixMe
        return (BigInt(parts.hs) * BigInt(0x1000000) + BigInt(parts.ls)).toString();
    } finally {
        await span.finish();
    }
}

// Mutation

async function postRequestsUsingRest(requests: Request[], context: Context, rootSpan: any): Promise<void> {
    const span = await context.db.tracer.startSpan(rootSpan, "resolvers-custom.js:postRequestsUsingRest");
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
        await span.log({
            event: 'post request to rest failed ',
            value: message
        });
        await span.finish();
        throw new Error(message);
    }
    await span.finish();
}

async function postRequestsUsingKafka(requests: Request[], context: Context, rootSpan: any): Promise<void> {
    const span = await context.db.tracer.startSpan(rootSpan, "resolvers-custom.js:postRequestUsingKafka");
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
    console.log('[postRequests]', requests);
    await span.log({
        event: 'post requests to kafka',
        value: requests
    });
    const messages = requests.map((request) => ({
        key: Buffer.from(request.id, 'base64'),
        value: Buffer.from(request.body, 'base64'),
    }));
    await producer.send({
        topic: config.topic,
        messages,
    });
    await span.log({
        event: 'messages sended to kafka',
        value: messages
    });
    await span.finish();
}

async function postRequests(_, args: { requests: Request[] }, context: Context): Promise<string[]> {
    const span = await context.db.tracer.startSpanLog(
        context,
        "resolvers-custom.js:postRequests",
        "new post request",
        args);
    const requests: ?(Request[]) = args.requests;
    if (!requests) {
        await span.finish();
        return [];
    }
    try {
        if (context.config.requests.mode === 'rest') {
            await postRequestsUsingRest(requests, context, span);
        } else {
            await postRequestsUsingKafka(requests, context, span);
        }
    } catch (error) {
        console.log('[Q Server] post request failed]', error);
        await span.log({
            event: 'post request failed',
            value: error
        });
        await span.finish();
        throw error;
    }
    await span.finish();
    return requests.map(x => x.id);
}

const resolversCustom = {
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
    overrideObject(original, resolversCustom);
    return original;
}
