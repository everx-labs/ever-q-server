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

type AccountTransactionSummary = {
    id: string,
    time: number,
    amount: string,
    from: string,
    to: string,
    block: string,
}

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

async function getAccountTransactionSummaries(
    _parent,
    args: { accountId?: string, afterLt?: string, limit?: number },
    context: Context
): Promise<AccountTransactionSummary[]> {
    const result: any = await context.db.fetchQuery(`
        FOR t IN transactions
        FILTER (t.account_addr == @accountId || m.src == @accountId) && t.lt > @afterLt
            FOR msg_id IN APPEND([t.in_msg], t.out_msgs)
            LET m = DOCUMENT("messages", msg_id)
            LET b = DOCUMENT("blocks", t.block_id})
            FILTER (m.msg_type == 0) && (m.value > "0") && b.seq_no
        SORT t.gen_utime DESC
        LIMIT @limit
        RETURN 
            "id": t._key,
            "time": t.gen_utime,
            "amount": m.value,
            "from": m.src,
            "to": m.dst,
            "block": b.seq_no
    `, {
        accountId: args.accountId,
        afterLt: args.afterLt || "0",
        limit: Math.max(50, Number(args.limit || 50))
    });
    return (result: AccountTransactionSummary[]);
}

// Mutation

async function postRequestsUsingRest(requests: Request[], context: Context): Promise<void> {
    const config = context.config.requests;
    const url = `${ensureProtocol(config.server, 'http')}/topics/${config.topic}`;
    console.log('>>>', 'POST REQUESTS');
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
        getAccountTransactionSummaries,
    },
    Mutation: {
        postRequests,
    },
};

export function attachCustomResolvers(original: any): any {
    overrideObject(original, customResolvers);
    return original;
}
