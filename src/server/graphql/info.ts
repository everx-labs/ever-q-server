import { packageJson } from "../utils";
import type { GraphQLRequestContextEx } from "./context";

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
    reliableChainOrderUpperBoundary: string,
};

async function info(_parent: Record<string, unknown>, _args: unknown, context: GraphQLRequestContextEx): Promise<Info> {
    const latency = await context.data.getLatency();
    const reliableChainOrderUpperBoundary = await context.data.getReliableChainOrderUpperBoundary();
    return {
        version: version as string,
        time: Date.now(),
        lastBlockTime: latency.lastBlockTime,
        blocksLatency: latency.blocks.latency,
        transactionsLatency: latency.transactions.latency,
        messagesLatency: latency.messages.latency,
        latency: context.data.debugLatency === 0 ? latency.latency : context.data.debugLatency,
        endpoints: context.config.endpoints,
        reliableChainOrderUpperBoundary: reliableChainOrderUpperBoundary.boundary,
    };
}

export const infoResolvers = {
    Query: {
        info,
    },
};
