// @flow

import { TonClient } from "@tonclient/core";
import { Kafka, Producer } from 'kafkajs';
import { Span, FORMAT_TEXT_MAP } from 'opentracing';
import type { QConfig } from "../config";
import { requireGrantedAccess } from '../data/collection';
import { Auth } from '../auth';
import { ensureProtocol } from '../config';
import fetch from 'node-fetch';
import type { AccessRights } from '../auth';
import { QTracer } from '../tracer';
import { QError } from '../utils';
import type { GraphQLRequestContextEx } from "./context";

type Request = {
    id: string,
    body: string,
    expireAt: number,
}

async function postRequestsUsingRest(requests: Request[], context: GraphQLRequestContextEx, _span: Span): Promise<void> {
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
            brokers: [config.server],
        }));
        const newProducer = kafka.producer();
        await newProducer.connect();
        return newProducer;

    });

    const messages = requests.map((request) => {
        const traceInfo = {};
        context.data.tracer.inject(span, FORMAT_TEXT_MAP, traceInfo);
        const keyBuffer = Buffer.from(request.id, 'base64');
        const traceBuffer = (Object.keys(traceInfo).length > 0)
            ? Buffer.from(JSON.stringify(traceInfo), 'utf8')
            : Buffer.from([]);
        const key = Buffer.concat([keyBuffer, traceBuffer]);
        const value = Buffer.from(request.body, 'base64');
        return {
            key,
            value,
        };
    });
    await producer.send({
        topic: config.topic,
        messages,
    });
}

async function checkPostRestrictions(
    config: QConfig,
    client: TonClient,
    requests: Request[],
    accessRights: AccessRights,
) {
    requests.forEach((request) => {
        const size = Math.ceil(request.body.length * 3 / 4);
        if (size > config.requests.maxSize) {
            throw new Error(`Message size ${size} is too large. Maximum size is ${config.requests.maxSize} bytes.`);
        }
    });

    if (accessRights.restrictToAccounts.length === 0) {
        return;
    }
    const accounts = new Set(accessRights.restrictToAccounts);
    for (const request: Request of requests) {
        const message = (await client.boc.parse_message({
            boc: request.body,
        })).parsed;
        if (!accounts.has(message.dst)) {
            throw Auth.unauthorizedError();
        }
    }
}

async function postRequests(
    _parent: any,
    args: { requests: Request[], accessKey?: string },
    context: GraphQLRequestContextEx,
): Promise<string[]> {
    const requests: ?(Request[]) = args.requests;
    if (!requests) {
        return [];
    }

    const tracer = context.tracer;
    return QTracer.trace(tracer, 'postRequests', async (span: Span) => {
        span.setTag('params', requests);
        const accessRights = await requireGrantedAccess(context, args);
        await checkPostRestrictions(context.config, context.client, requests, accessRights);

        const expired: ?Request = requests.find(x => x.expireAt && (Date.now() > x.expireAt));
        if (expired) {
            throw QError.messageExpired(expired.id, expired.expireAt);
        }

        const messageTraceSpans = requests.map((request) => {
            const messageId = Buffer.from(request.id, 'base64').toString('hex');
            const postSpan = tracer.startSpan('postRequest', {
                childOf: QTracer.messageRootSpanContext(messageId),
            });
            postSpan.addTags({
                messageId,
                messageSize: Math.ceil(request.body.length * 3 / 4),
            })
            return postSpan;
        });
        try {
            if (context.config.requests.mode === 'rest') {
                await postRequestsUsingRest(requests, context, span);
            } else {
                await postRequestsUsingKafka(requests, context, span);
            }
            context.data.statPostCount.increment();
            context.data.log.debug('postRequests', 'POSTED', args, context.remoteAddress);
        } catch (error) {
            context.data.statPostFailed.increment();
            context.data.log.debug('postRequests', 'FAILED', args, context.remoteAddress);
            throw error;
        } finally {
            messageTraceSpans.forEach(x => x.finish());
        }
        return requests.map(x => x.id);
    }, context.parentSpan);
}

export const postRequestsResolvers = {
    Mutation: {
        postRequests,
    },
};
