// @flow

import type { GraphQLRequestContext } from "../data/collection";
import { packageJson } from '../utils';

const { version } = packageJson();

type Info = {
    version: string,
    time: number,
    endpoints: string[],
}

function info(_parent: any, _args: any, context: GraphQLRequestContext): Info {
    return {
        version,
        time: Date.now(),
        endpoints: context.config.endpoints,
    };
}

export const infoResolvers = {
    Query: {
        info,
    },
};
