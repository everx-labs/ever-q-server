import { SelectionSetNode } from "graphql"
import { mergeFieldWithSelectionSet } from "../../filter/filters"
import {
    BlockchainBlock,
    BlockchainMessage,
    BlockchainTransaction,
} from "./resolvers-types-generated"
import { QRequestContext } from "../../request"

export const blockArchiveFields = new Set([
    "id",
    "hash",
    "chain_order",
    "gen_utime",
    "key_block",
    "master.shard_hashes.descr.root_hash",
    "master.shard_hashes.descr.seq_no",
    "master.shard_hashes.shard",
    "master.shard_hashes.workchain_id",
    "prev_alt_ref.root_hash",
    "prev_key_block_seqno",
    "prev_ref.root_hash",
    "seq_no",
    "shard",
    "tr_count",
    "value_flow.fees_collected",
    "workchain_id",
])
export const transactionArchiveFields = new Set([
    "id",
    "hash",
    "boc",
    "aborted",
    "account_addr",
    "account",
    "action.total_fwd_fees",
    "balance_delta",
    "block_id",
    "block",
    "chain_order",
    "compute.exit_code",
    "compute.gas_fees",
    "ext_in_msg_fee",
    "in_msg",
    "in_message",
    "lt",
    "now",
    "out_msgs",
    "out_messages",
    "storage.storage_fees_collected",
    "total_fees",
    "tr_type",
    "tr_type_name",
    "workchain_id",
])
export const messageArchiveFields = new Set([
    "id",
    "hash",
    "boc",
    "block_id",
    "block",
    "chain_order",
    "created_at",
    "dst",
    "dst_account",
    "msg_type",
    "msg_type_name",
    "src",
    "src_account",
    "value",
])

export function upgradeSelectionForBocParsing(
    archive: boolean,
    selection: SelectionSetNode | undefined,
    archivedFields: Set<string>,
): { selectionSet: SelectionSetNode | undefined; requireBocParsing: boolean } {
    if (
        archive &&
        selection &&
        selectionContainsNonArchivedFields("", selection, archivedFields)
    ) {
        return {
            selectionSet: mergeFieldWithSelectionSet("boc", selection),
            requireBocParsing: true,
        }
    }
    return { selectionSet: selection, requireBocParsing: false }
}

function selectionContainsNonArchivedFields(
    parentPath: string,
    selection: SelectionSetNode,
    archivedFields: Set<string>,
) {
    for (const field of selection.selections) {
        if (field.kind !== "Field") {
            continue
        }
        const fieldPath =
            parentPath !== ""
                ? `${parentPath}.${field.name.value}`
                : field.name.value
        if (archivedFields.has(fieldPath)) {
            continue
        }
        if (
            !field.selectionSet ||
            selectionContainsNonArchivedFields(
                fieldPath,
                field.selectionSet,
                archivedFields,
            )
        ) {
            return true
        }
    }
    return false
}

interface DocWithBoc {
    boc?: string | null
}
async function parseBocs<T extends DocWithBoc>(
    docs: T[],
    parse: (boc: string) => Promise<T>,
): Promise<T[]> {
    const parsed: T[] = []
    for (const doc of docs) {
        if (doc.boc) {
            parsed.push({ ...(await parse(doc.boc)), ...doc })
        } else {
            parsed.push(doc)
        }
    }
    return parsed
}

export async function parseBlockBocsIfRequired(
    requireParsing: boolean,
    context: QRequestContext,
    blocks: BlockchainBlock[],
): Promise<BlockchainBlock[]> {
    if (!requireParsing) {
        return blocks
    }
    const blocksStorage = context.services.data.bocStorage.blocks
    if (!blocksStorage) {
        return blocks
    }
    const bocs = await blocksStorage.resolveBocs(
        blocks.map(x => ({
            hash: x._key,
            boc: x.boc,
        })),
    )
    for (const block of blocks) {
        const boc = bocs.get(block._key)
        if (boc) {
            block.boc = boc
        }
    }
    return await parseBocs(blocks, async boc => {
        return (
            await context.services.client.boc.parse_block({
                boc,
            })
        ).parsed
    })
}

export async function parseMessageBocsIfRequired(
    requireParsing: boolean,
    context: QRequestContext,
    messages: BlockchainMessage[],
): Promise<BlockchainMessage[]> {
    if (requireParsing) {
        return await parseBocs(messages, async boc => {
            return (
                await context.services.client.boc.parse_message({
                    boc,
                })
            ).parsed
        })
    } else {
        return messages
    }
}

export async function parseTransactionBocsIfRequired(
    requireParsing: boolean,
    context: QRequestContext,
    transactions: BlockchainTransaction[],
): Promise<BlockchainTransaction[]> {
    if (requireParsing) {
        return await parseBocs(transactions, async boc => {
            return (
                await context.services.client.boc.parse_transaction({
                    boc,
                })
            ).parsed
        })
    } else {
        return transactions
    }
}
