import { Kafka, Producer } from 'kafkajs'
import { QRequestContext } from '../request'

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
    const ensureShared = async <T>(
        name: string,
        createValue: () => Promise<T>,
    ): Promise<T> => {
        const shared = context.services.shared
        if (shared.has(name)) {
            return shared.get(name) as T
        }
        const value = await createValue()
        shared.set(name, value)
        return value
    }

    const producer: Producer = await ensureShared(
        'subscr-producer',
        async () => {
            const kafka: Kafka = await ensureShared(
                'subscr-kafka',
                async () =>
                    new Kafka({
                        clientId: 'subscr-q-server',
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
