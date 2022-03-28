import { Kafka, Producer } from "kafkajs";
import { QRequestContext } from "../request";

const postSubscription = async (
    context: QRequestContext,
    message: { key: string; value: string }
) => {
    console.log("YOU CALL SENT MESSAGE", message);
    const cfg = context.services.config.subscriptions;
    const size = message.value.length;
    if (size > cfg.maxSize) {
        throw new Error(`Message size ${size} is too large. Maximum size is ${cfg.maxSize} bytes.`);
    }
    const ensureShared = async <T>(name: string, createValue: () => Promise<T>): Promise<T> => {
        const shared = context.services.shared;
        if (shared.has(name)) {
            return shared.get(name) as T;
        }
        const value = await createValue();
        shared.set(name, value);
        return value;
    };

    const producer: Producer = await ensureShared("producer", async () => {
        const kafka: Kafka = await ensureShared(
            "kafka",
            async () =>
                new Kafka({
                    clientId: "q-server",
                    brokers: [cfg.server],
                })
        );
        const newProducer = kafka.producer();
        await newProducer.connect();
        return newProducer;
    });

    await producer.send({
        topic: cfg.topic,
        messages: [message],
    });
    console.log("MESSAGE SENT:", message, "\nTopic:", cfg.topic);
};

export default postSubscription;
