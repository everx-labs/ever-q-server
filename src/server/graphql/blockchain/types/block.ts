import {
    BigIntArgs,
    masterSeqNoFromChainOrder,
    resolveBigUInt,
    unixSecondsToString,
} from "../../../filter/filters"
import { QRequestContext } from "../../../request"
import {
    BlockProcessingStatusEnum,
    Resolvers,
} from "../resolvers-types-generated"
import { FieldNode, GraphQLResolveInfo, SelectionSetNode } from "graphql"
import { Path } from "graphql/jsutils/Path"
import { fetch_block_signatures } from "../fetchers"

export const resolvers: Resolvers<QRequestContext> = {
    BlockchainBlock: {
        id: parent => `block/${parent._key}`,
        hash: parent => parent._key,
        end_lt: (parent, args) =>
            resolveBigUInt(1, parent.end_lt, args as BigIntArgs),
        gen_software_capabilities: (parent, args) =>
            resolveBigUInt(
                1,
                parent.gen_software_capabilities,
                args as BigIntArgs,
            ),
        start_lt: (parent, args) =>
            resolveBigUInt(1, parent.start_lt, args as BigIntArgs),
        gen_utime_string: parent => unixSecondsToString(parent.gen_utime),
        status_name: parent => {
            switch (parent.status) {
                case 0:
                    return BlockProcessingStatusEnum.Unknown
                case 1:
                    return BlockProcessingStatusEnum.Proposed
                case 2:
                    return BlockProcessingStatusEnum.Finalized
                case 3:
                    return BlockProcessingStatusEnum.Refused
                default:
                    return null
            }
        },
        master_seq_no: parent => masterSeqNoFromChainOrder(parent.chain_order),
        signatures: async (parent, _args, context, info) => {
            const archive = resolveArchiveArg(info) ?? false
            if (archive) {
                return null
            }
            return await fetch_block_signatures(
                parent._key,
                context,
                info,
                context.requestSpan,
            )
        },
    },
    BlockchainBlockSignatures: {
        sig_weight: (parent, args) =>
            resolveBigUInt(1, parent.sig_weight, args as BigIntArgs),
        gen_utime_string: parent => unixSecondsToString(parent.gen_utime),
    },
}

function collectPath(info: GraphQLResolveInfo): Path[] {
    const path: Path[] = []
    let p: Path | undefined = info.path
    while (p) {
        path.push(p)
        p = p.prev
    }
    return path
}

function findField(
    selection: SelectionSetNode,
    name: string,
): FieldNode | undefined {
    return selection.selections.find(
        x => x.kind === "Field" && x.name.value === name,
    ) as FieldNode | undefined
}

function resolveArchiveArg(info: GraphQLResolveInfo): boolean | undefined {
    const path = collectPath(info)
    let archive: boolean | undefined = undefined
    let selection: SelectionSetNode | undefined = info.operation.selectionSet
    let step = path.pop()
    while (step && selection) {
        if (typeof step.key === "string") {
            const field = findField(selection, step.key)
            if (field && field.arguments) {
                const arg = field.arguments.find(
                    x => x.name.value === "archive",
                )
                if (arg && arg.value.kind === "BooleanValue") {
                    archive = arg.value.value
                }
            }
            selection = field?.selectionSet
        }
        step = path.pop()
    }
    return archive
}
