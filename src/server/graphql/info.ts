import { packageJson } from "../utils";
import { QRequestContext } from "../request";

const { version } = packageJson();

type Info = {
    version: string,
    time: number,
    lastBlockTime: number,
    blocksLatency: number,
    transactionsLatency: number,
    messagesLatency: number,
    latency: number,
    endpoints: string[],
    chainOrderBoundary: string | null,
};

async function info(_parent: Record<string, unknown>, _args: unknown, context: QRequestContext): Promise<Info> {
    const data = context.services.data;
    const latency = await data.getLatency();
    
    let chainOrderBoundary = null;
    try {
        chainOrderBoundary = (await context.services.data.getReliableChainOrderUpperBoundary()).boundary;
    } catch {
        // intentionally left blank
    }
    return {
        version: version as string,
        time: Date.now(),
        lastBlockTime: latency.lastBlockTime,
        blocksLatency: latency.blocks.latency,
        transactionsLatency: latency.transactions.latency,
        messagesLatency: latency.messages.latency,
        latency: data.debugLatency === 0 ? latency.latency : data.debugLatency,
        endpoints: context.services.config.endpoints,
        chainOrderBoundary,
    };
}

export const infoResolvers = {
    Query: {
        info,
    },
};
