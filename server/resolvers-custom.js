// @flow

import fs from "fs";
import { Kafka, Producer } from "kafkajs";
import { Span, FORMAT_BINARY } from 'opentracing';
import Arango from "./arango";
import type { GraphQLRequestContext } from "./arango-collection";
import { ensureProtocol } from "./config";
import path from 'path';
import fetch from 'node-fetch';
import type { AccessKey } from "./auth";
import { QTracer } from "./tracer";

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

type GraphQLRequestContextEx = GraphQLRequestContext & {
    db: Arango,
}

// Query

function info(): Info {
    const pkg = JSON.parse((fs.readFileSync(path.resolve(__dirname, '..', '..', 'package.json')): any));
    return {
        version: pkg.version,
    };
}

async function getAccountsCount(_parent, args, context: GraphQLRequestContextEx): Promise<number> {
    const tracer = context.db.tracer;
    return QTracer.trace(tracer, 'getAccountsCount', async () => {
        await context.auth.requireGrantedAccess(context.accessKey || args.accessKey);
        const result: any = await context.db.query(`RETURN LENGTH(accounts)`, {});
        const counts = (result: number[]);
        return counts.length > 0 ? counts[0] : 0;
    }, QTracer.getParentSpan(tracer, context))
}

async function getTransactionsCount(_parent, args, context: GraphQLRequestContextEx): Promise<number> {
    const tracer = context.db.tracer;
    return QTracer.trace(tracer, 'getTransactionsCount', async () => {
        await context.auth.requireGrantedAccess(context.accessKey || args.accessKey);
        const result: any = await context.db.query(`RETURN LENGTH(transactions)`, {});
        const counts = (result: number[]);
        return counts.length > 0 ? counts[0] : 0;
    }, QTracer.getParentSpan(tracer, context))
}

async function getAccountsTotalBalance(_parent, args, context: GraphQLRequestContextEx): Promise<String> {
    const tracer = context.db.tracer;
    return QTracer.trace(tracer, 'getAccountsTotalBalance', async () => {
        await context.auth.requireGrantedAccess(context.accessKey || args.accessKey);
        /*
        Because arango can not sum BigInt's we need to sum separately:
        hs = SUM of high bits (from 24-bit and higher)
        ls = SUM of lower 24 bits
        And the total result is (hs << 24) + ls
         */
        const result: any = await context.db.query(`
            LET d = 16777216
            FOR a in accounts
            LET b = TO_NUMBER(CONCAT("0x", SUBSTRING(a.balance, 2)))
            COLLECT AGGREGATE
                hs = SUM(FLOOR(b / d)),
                ls = SUM(b % (d - 1))
            RETURN { hs, ls }
        `, {});
        const parts = (result: { hs: number, ls: number }[])[0];
        //$FlowFixMe
        return (BigInt(parts.hs) * BigInt(0x1000000) + BigInt(parts.ls)).toString();
    }, QTracer.getParentSpan(tracer, context))
}

async function getManagementAccessKey(_parent, args, context: GraphQLRequestContextEx): Promise<string> {
    return context.auth.getManagementAccessKey();
}

// Mutation

async function postRequestsUsingRest(requests: Request[], context: GraphQLRequestContextEx): Promise<void> {
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

async function postRequestsUsingKafka(requests: Request[], context: GraphQLRequestContextEx, span: Span): Promise<void> {
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
    const messages = requests.map((request) => {
        const keyBuffer = Buffer.from(request.id, 'base64');
        const traceBuffer = Buffer.from([]);
        context.db.tracer.inject(span, FORMAT_BINARY, traceBuffer);
        return {
            key: Buffer.concat([keyBuffer, traceBuffer]),
            value: Buffer.from(request.body, 'base64'),
        };
    });
    await producer.send({
        topic: config.topic,
        messages,
    });
}

async function postRequests(_, args: { requests: Request[], accessKey?: string }, context: GraphQLRequestContextEx): Promise<string[]> {
    const requests: ?(Request[]) = args.requests;
    if (!requests) {
        return [];
    }

    const tracer = context.db.tracer;
    return QTracer.trace(tracer, "postRequests", async (span: Span) => {
        span.setTag('params', requests);
        await context.auth.requireGrantedAccess(context.accessKey || args.accessKey);
        try {
            if (context.config.requests.mode === 'rest') {
                await postRequestsUsingRest(requests, context);
            } else {
                await postRequestsUsingKafka(requests, context, span);
            }
            context.db.log.debug('postRequests', 'POSTED', args, context.remoteAddress);
        } catch (error) {
            context.db.log.debug('postRequests', 'FAILED', args, context.remoteAddress);
            throw error;
        }
        return requests.map(x => x.id);
    }, context.parentSpan);
}

type ManagementArgs = {
    account?: string,
    signedManagementAccessKey?: string,
}

type RegisterAccessKeysArgs = ManagementArgs & {
    keys: AccessKey[],
}

type RevokeAccessKeysArgs = ManagementArgs & {
    keys: string[],
}

async function registerAccessKeys(
    _,
    args: RegisterAccessKeysArgs,
    context: GraphQLRequestContextEx,
): Promise<number> {
    return context.auth.registerAccessKeys(
        args.account || '',
        args.keys || [],
        args.signedManagementAccessKey || '');
}

async function revokeAccessKeys(
    _,
    args: RevokeAccessKeysArgs,
    context: GraphQLRequestContextEx,
): Promise<number> {
    return context.auth.revokeAccessKeys(
        args.account || '',
        args.keys || [],
        args.signedManagementAccessKey || '');
}

const resolversCustom = {
    Query: {
        info,
        getAccountsCount,
        getTransactionsCount,
        getAccountsTotalBalance,
        getManagementAccessKey,
    },
    Mutation: {
        postRequests,
        registerAccessKeys,
        revokeAccessKeys,
    },
};

export function attachCustomResolvers(original: any): any {
    overrideObject(original, resolversCustom);
    return original;
}
