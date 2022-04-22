import { Kafka, Producer } from "kafkajs"
import { QRequestContext } from "../request"

const postSubscription = async (
    context: QRequestContext,
    message: { key: string; value: string },
) => {
    const { kafkaOptions } = context.services.config.subscriptions
    const size = message.value.length
    if (size > kafkaOptions.maxSize) {
        throw new Error(
            `Message size ${size} is too large. Maximum size is ${kafkaOptions.maxSize} bytes.`,
        )
    }

    const producer: Producer = await context.ensureShared(
        "subscr-producer",
        async () => {
            const kafka: Kafka = await context.ensureShared(
                "subscr-kafka",
                async () =>
                    new Kafka({
                        clientId: "subscr-q-server",
                        brokers: [kafkaOptions.server],
                    }),
            )
            const newProducer = kafka.producer()
            await newProducer.connect()
            return newProducer
        },
    )

    await producer.send({
        topic: kafkaOptions.topic,
        messages: [message],
    })
}

export default postSubscription
