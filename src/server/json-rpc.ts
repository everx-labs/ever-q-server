import fetch from "isomorphic-fetch"
import { QError } from "./utils"
import { RequestManager, HTTPTransport, Client } from "@open-rpc/client-js"
import { QLog } from "./logs"

export interface IJsonRpcClient {
    request(method: string, params: any): Promise<any>
}

function timeoutFetch(
    log: QLog,
    service: string,
    timeout: number,
): typeof fetch {
    return async (input, init) => {
        const controller = new AbortController()
        const id = setTimeout(() => controller.abort(), timeout)
        try {
            const response = await fetch(input, {
                ...init,
                signal: controller.signal,
            })
            clearTimeout(id)
            return response
        } catch (err) {
            clearTimeout(id)
            if (
                err.constructor?.name === "AbortError" &&
                err.type === "aborted"
            ) {
                log.error(
                    `JSON RPC request [${init?.body}] to [${input}] has aborted due to timeout ${timeout} ms`,
                )
                throw QError.create(
                    500,
                    `${service} request has aborted due to timeout ${timeout}`,
                )
            }
            throw err
        }
    }
}

export class OpenJsonRpcClient implements IJsonRpcClient {
    client: Client
    constructor(log: QLog, service: string, endpoint: string, timeout: number) {
        const options =
            timeout > 0
                ? {
                      fetcher: timeoutFetch(log, service, timeout),
                  }
                : undefined
        const transport = new HTTPTransport(endpoint, options)
        this.client = new Client(new RequestManager([transport]))
    }

    async request(method: string, params: any): Promise<any> {
        return await this.client.request({
            method,
            params,
        })
    }
}
