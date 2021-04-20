// @flow

import { packageJson } from '../utils';
import type { GraphQLRequestContextEx } from "./context";

const { version } = packageJson();

type Info = {
    version: string,
    time: number,
    lastBlockTime: number,
    endpoints: string[],
}

async function info(_parent: any, _args: any, context: GraphQLRequestContextEx): Promise<Info> {
    return {
        version,
        time: Date.now(),
        lastBlockTime: await context.data.getLastBlockTime(),
        endpoints: context.config.endpoints,
    };
}

export const infoResolvers = {
    Query: {
        info,
    },
};
