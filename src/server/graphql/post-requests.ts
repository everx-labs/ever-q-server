import { Kafka, Producer } from "kafkajs"
import { FORMAT_TEXT_MAP } from "opentracing"
import type { QConfig } from "../config"
import { ensureProtocol, RequestsMode } from "../config"
import fetch, { RequestInit } from "node-fetch"
import { QTraceSpan, QTracer } from "../tracing"
import { QError } from "../utils"
import { QRequestContext } from "../request"
import { LiteClient } from "ton-lite-client"

type Request = {
    id: string
    body: string
    expireAt: number
}

type RequestInitEx = RequestInit & {
    mode: string
    cache: string
    credentials: string
    referrer: string
}

async function postRequestsUsingRest(
    requests: Request[],
    context: QRequestContext,
): Promise<void> {
    const config = context.services.config.requests
    const url = `${ensureProtocol(config.server, "http")}/topics/${
        config.topic
    }`
    const request: RequestInitEx = {
        method: "POST",
        mode: "cors",
        cache: "no-cache",
        credentials: "same-origin",
        headers: {
            "Content-Type": "application/json",
        },
        redirect: "follow",
        referrer: "no-referrer",
        body: JSON.stringify({
            records: requests.map(request => ({
                key: request.id,
                value: request.body,
            })),
        }),
    }
    const response = await fetch(url, request)
    if (response.status !== 200) {
        const message = `Post requests failed: ${await response.text()}`
        throw new Error(message)
    }
}

async function postRequestsUsingJrpc(
    requests: Request[],
    context: QRequestContext,
): Promise<void> {
    const config = context.services.config.requests
    const url = ensureProtocol(config.server, "https")

    // No throttling (no pauses between requests).
    // If requests fail with a "too many requests" error, it's the user's fault,
    // let him reduce the number of messages in the request
    for (const request of requests) {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                jsonrpc: "2.0",
                method: "sendMessage",
                params: { message: request.body },
                id: request.id,
            }),
        })
        if (response.status !== 200) {
            const message = `Post requests failed: ${await response.text()}`
            throw new Error(message)
        }
    }
}
async function postRequestsUsingKafka(
    requests: Request[],
    context: QRequestContext,
    span: QTraceSpan,
): Promise<void> {
    const config = context.services.config.requests
    const producer: Producer = await context.ensureShared(
        "producer",
        async () => {
            const kafka: Kafka = await context.ensureShared(
                "kafka",
                async () =>
                    new Kafka({
                        clientId: "q-server",
                        brokers: [config.server],
                    }),
            )
            const newProducer = kafka.producer()
            await newProducer.connect()
            span.logEvent("kafka_producer_connected")
            return newProducer
        },
    )

    span.logEvent("kafka_message_preparation_start")
    const messages = requests.map(request => {
        const traceInfo = {}
        context.services.data.tracer.inject(
            span.span,
            FORMAT_TEXT_MAP,
            traceInfo,
        )
        const keyBuffer = Buffer.from(request.id, "base64")
        const traceBuffer =
            Object.keys(traceInfo).length > 0
                ? Buffer.from(JSON.stringify(traceInfo), "utf8")
                : Buffer.from([])
        const key = Buffer.concat([keyBuffer, traceBuffer])
        const value = Buffer.from(request.body, "base64")
        return {
            key,
            value,
        }
    })
    span.logEvent("kafka_ready_to_send")
    const send = producer.send({
        topic: config.topic,
        messages,
    })
    span.logEvent("kafka_sent")
    await send
}

async function postRequestsUsingAdnl(
    requests: Request[],
    client: LiteClient,
): Promise<void> {
    try {
        const res = requests.map(r => {
            const body = Buffer.from(r.body, "base64")
            return client.sendMessage(body)
        })

        await Promise.all(res)
    } catch (_) {
        // do nothing ...
    }
}

async function checkPostRestrictions(config: QConfig, requests: Request[]) {
    requests.forEach(request => {
        const size = Math.ceil((request.body.length * 3) / 4)
        if (size > config.requests.maxSize) {
            throw new Error(
                `Message size ${size} is too large. Maximum size is ${config.requests.maxSize} bytes.`,
            )
        }
    })
}

async function postRequests(
    _parent: Record<string, unknown>,
    args: { requests: Request[] },
    context: QRequestContext,
): Promise<string[]> {
    const requests: Request[] | null = args.requests
    if (!requests) {
        return []
    }

    const { tracer, data, config } = context.services

    return context.trace("postRequests", async (span: QTraceSpan) => {
        span.logEvent("start", { requests })
        await checkPostRestrictions(config, requests)

        const expired: Request | undefined = requests.find(
            x => x.expireAt && Date.now() > x.expireAt,
        )
        if (expired) {
            throw QError.messageExpired(expired.id, expired.expireAt)
        }

        const messageTraceSpans = requests.map(request => {
            const messageId = Buffer.from(request.id, "base64").toString("hex")
            const postSpan = tracer.startSpan("postRequest", {
                childOf: QTracer.messageRootSpanContext(messageId),
            })
            postSpan.addTags({
                messageId,
                messageSize: Math.ceil((request.body.length * 3) / 4),
            })

            // ----- This is a hack to be able to link messageId with requestContext -----
            const postSpan2 = span.createChildSpan("postRequests_postRequest")
            postSpan2.addTags({
                messageId,
                messageSize: Math.ceil((request.body.length * 3) / 4),
            })
            // ------------------------------------------------

            return [postSpan, postSpan2]
        })
        try {
            span.logEvent("ready_to_send")

            if (config.requests.mode === RequestsMode.REST) {
                await postRequestsUsingRest(requests, context)
            } else if (config.requests.mode === RequestsMode.JRPC) {
                await postRequestsUsingJrpc(requests, context)
            } else if (config.requests.mode === RequestsMode.KAFKA) {
                await postRequestsUsingKafka(requests, context, span)
            } else if (config.requests.mode === RequestsMode.TCP_ADNL) {
                const client = context.services.liteclient
                if (!client) {
                    throw new Error("context.services.liteclient is not inited")
                }

                await postRequestsUsingAdnl(requests, client)
            } else {
                throw new Error(
                    `unexpected config.requests.mode: "${config.requests.mode}"`,
                )
            }

            await data.statPostCount.increment()

            data.log.debug(
                "postRequests",
                "POSTED",
                args,
                context.remoteAddress,
            )

            span.logEvent("sent", { remoteAddress: context.remoteAddress })
        } catch (error) {
            await data.statPostFailed.increment()
            data.log.debug(
                "postRequests",
                "FAILED",
                args,
                context.remoteAddress,
            )
            throw error
        } finally {
            messageTraceSpans.forEach(x => x.forEach(y => y.finish()))
        }
        return requests.map(x => x.id)
    })
}

export const postRequestsResolvers = {
    Mutation: {
        postRequests,
    },
}
