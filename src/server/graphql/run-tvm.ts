import { QRequestContext } from "../request"
import { FieldNode } from "graphql"
import { required } from "../utils"

type RunTvmExtMsgArgs = {
    address: string
    body: string
    byBlock?: string
}

type RunTvmExtMsgResult = {
    exitCode: number
    messages: string[]
    byBlock: string
}

async function runTvmExtMsg(
    _parent: Record<string, unknown>,
    args: RunTvmExtMsgArgs,
    context: QRequestContext,
    _info: { fieldNodes: FieldNode[] },
): Promise<RunTvmExtMsgResult> {
    const node = required(context.services.data.nodeClient)
    return await node.runTvmExtMsg(args.address, args.body, args.byBlock)
}

export const runTvmResolvers = {
    Query: {
        runTvmExtMsg,
    },
}
