import EventEmitter from "events"
import { RedisPubSub } from "graphql-redis-subscriptions"

import { QConfig } from "../config"
import QLogs, { QLog } from "../logs"

export class SubscriptionsRedis {
    public readonly events = new EventEmitter().setMaxListeners(0)
    public readonly pubsub: RedisPubSub
    public healthy = true

    private log: QLog

    constructor(config: QConfig["subscriptions"], logs: QLogs) {
        this.log = logs.create("SubscriptionsRedis")
        const retryStrategy = (times: number): number => {
            // > 1800 ms of downtime (50+100+150+200+250+300+350+400)
            if (times > 8) {
                this.log.error("ConnectionError")
                this.healthy = false
                this.events.emit("error")
                this.events.emit("connection-error")
            }
            return Math.min(times * 50, 2000)
        }
        this.pubsub = new RedisPubSub({
            connection: {
                ...config.redisOptions,
                maxRetriesPerRequest: null,
                retryStrategy,
            },
        })
        if (config.healthRedisChannel) {
            const healthError = () => {
                this.log.error("HealthError")
                this.healthy = false
                this.events.emit("error")
                this.events.emit("health-error")
            }
            const timeout = setTimeout(healthError, config.healthTimeout)
            this.pubsub
                .subscribe(config.healthRedisChannel, m => {
                    if (m == "OK") {
                        this.healthy = true
                        timeout.refresh()
                    } else {
                        // no clearTimeout is for code simplicity
                        this.log.error("UnexpectedHealthMessage", m)
                        healthError()
                    }
                })
                .catch(healthError)
        }
    }
}
