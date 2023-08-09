import { SelectionNode, SelectionSetNode } from "graphql"

import { QDataCollection } from "../../data/collection"
import { QCollectionQuery } from "../../data/collection-query"
import { QParams } from "../../filter/filters"
import { QRequestContext } from "../../request"
import { QTraceSpan } from "../../tracing"
import { QError, required } from "../../utils"

import { getFieldSelectionSet, KeyOf, KeyOfWithValueOf } from "./helpers"
import {
    BlockchainAccount,
    BlockchainBlock,
    BlockchainMessage,
    BlockchainTransaction,
    Maybe,
} from "./resolvers-types-generated"

export type Config = {
    accounts: CompiledCollectionConfig<BlockchainAccount>
    blocks: CompiledCollectionConfig<BlockchainBlock>
    messages: CompiledCollectionConfig<BlockchainMessage>
    transactions: CompiledCollectionConfig<BlockchainTransaction>
}

export const config: Config = {
    blocks: compileCollectionConfig({
        alwaysFetchFields: ["chain_order"],
        excludeFields: ["hash"],
        qDataCollectionSelector: ctx => ctx.services.data.blocks,
    }),
    accounts: compileCollectionConfig({
        excludeFields: ["address"],
        qDataCollectionSelector: ctx => ctx.services.data.accounts,
    }),
    messages: compileCollectionConfig({
        alwaysFetchFields: [
            "chain_order",
            "src_chain_order",
            "dst_chain_order",
        ],
        excludeFields: ["hash"],
        qDataCollectionSelector: ctx => ctx.services.data.messages,
        joins: [
            {
                targetField: "src_transaction",
                additionalFields: ["msg_type"],
                pathForQuery: "tr",
                joinedCollection: "transactions",
                prefetchQueryBuilder: (
                    parentPath,
                    joinPath,
                    returnExpression,
                ) =>
                    `(FOR ${joinPath} IN transactions ` +
                    `FILTER ${parentPath}._key IN ${joinPath}.out_msgs ` +
                    `RETURN ${returnExpression})[0]`,
                needFetch: m => !m.src_transaction && m.msg_type != 1,
                onField: "_key",
                refOnField: "out_msgs",
                queryBuilder: (path, onFieldParam, returnExpression) =>
                    `FOR key IN @${onFieldParam} ` +
                    `FOR ${path} in transactions ` +
                    `FILTER key IN ${path}.out_msgs ` +
                    `RETURN DISTINCT ${returnExpression}`,
            },
            {
                targetField: "dst_transaction",
                additionalFields: ["msg_type"],
                pathForQuery: "tr",
                joinedCollection: "transactions",
                prefetchQueryBuilder: (
                    parentPath,
                    joinPath,
                    returnExpression,
                ) =>
                    `(FOR ${joinPath} IN transactions ` +
                    `FILTER ${parentPath}._key == ${joinPath}.in_msg ` +
                    `RETURN ${returnExpression})[0]`,
                needFetch: m => !m.dst_transaction && m.msg_type != 2,
                onField: "_key",
                refOnField: "in_msg",
                queryBuilder: (path, onFieldParam, returnExpression) =>
                    `FOR ${path} in transactions ` +
                    `FILTER ${path}.in_msg IN @${onFieldParam} ` +
                    `RETURN ${returnExpression}`,
            },
            // TODO:
            // {
            //     targetField: "src_account",
            //     additionalFields: ["msg_type"],
            //     pathForQuery: "acc",
            //     joinedCollection: "accounts",
            //     prefetchQueryBuilder: (
            //         parentPath,
            //         joinPath,
            //         returnExpression,
            //     ) =>
            //         `(${parentPath}.msg_type != 1 ? ` +
            //         `(FOR ${joinPath} IN accounts ` +
            //         `FILTER ${joinPath}._key == ${parentPath}.src ` +
            //         `RETURN ${returnExpression})[0] ` +
            //         `: null)`,
            //     needFetch: m => !m.src_account && m.msg_type != 1,
            //     onField: "src",
            //     refOnField: "_key",
            //     queryBuilder: (path, onFieldParam, returnExpression) =>
            //         `FOR ${path} in accounts ` +
            //         `FILTER ${path}._key IN @${onFieldParam} ` +
            //         `RETURN ${returnExpression}`,
            // },
            // {
            //     targetField: "dst_account",
            //     additionalFields: ["msg_type"],
            //     pathForQuery: "acc",
            //     joinedCollection: "accounts",
            //     prefetchQueryBuilder: (
            //         parentPath,
            //         joinPath,
            //         returnExpression,
            //     ) =>
            //         `(${parentPath}.msg_type != 2 ? ` +
            //         `(FOR ${joinPath} IN accounts ` +
            //         `FILTER ${joinPath}._key == ${parentPath}.dst ` +
            //         `RETURN ${returnExpression})[0] ` +
            //         `: null)`,
            //     needFetch: m => !m.dst_account && m.msg_type != 2,
            //     onField: "dst",
            //     refOnField: "_key",
            //     queryBuilder: (path, onFieldParam, returnExpression) =>
            //         `FOR ${path} in accounts ` +
            //         `FILTER ${path}._key IN @${onFieldParam} ` +
            //         `RETURN ${returnExpression}`,
            // },
        ],
    }),
    transactions: compileCollectionConfig({
        alwaysFetchFields: ["chain_order"],
        excludeFields: ["hash"],
        qDataCollectionSelector: ctx => ctx.services.data.transactions,
        joins: [
            // {
            //     targetField: "account",
            //     additionalFields: ["account_addr"],
            //     pathForQuery: "acc",
            //     joinedCollection: "accounts",
            //     prefetchQueryBuilder: (
            //         parentPath,
            //         joinPath,
            //         returnExpression,
            //     ) =>
            //         `(FOR ${joinPath} IN accounts ` +
            //         `FILTER ${joinPath}._key == ${parentPath}.account_addr ` +
            //         `RETURN ${returnExpression})[0]`,
            //     needFetch: t => !isDefined(t.account),
            //     onField: "account_addr",
            //     refOnField: "_key",
            //     queryBuilder: (path, onFieldParam, returnExpression) =>
            //         `FOR ${path} in accounts ` +
            //         `FILTER ${path}._key IN @${onFieldParam} ` +
            //         `RETURN ${returnExpression}`,
            // },
            {
                targetField: "in_message",
                additionalFields: ["in_msg"],
                pathForQuery: "msg",
                joinedCollection: "messages",
                prefetchQueryBuilder: (
                    parentPath,
                    joinPath,
                    returnExpression,
                ) =>
                    `(FOR ${joinPath} IN messages ` +
                    `FILTER ${joinPath}._key == ${parentPath}.in_msg ` +
                    `RETURN ${returnExpression})[0]`,
                needFetch: t => !!t.in_message != !!t.in_msg,
                onField: "in_msg",
                refOnField: "_key",
                queryBuilder: (path, onFieldParam, returnExpression) =>
                    `FOR ${path} in messages ` +
                    `FILTER ${path}._key IN @${onFieldParam} ` +
                    `RETURN ${returnExpression}`,
            },
            {
                targetField: "out_messages",
                additionalFields: ["out_msgs"],
                pathForQuery: "msg",
                joinedCollection: "messages",
                prefetchQueryBuilder: (
                    parentPath,
                    joinPath,
                    returnExpression,
                ) =>
                    `(FOR ${joinPath} IN messages ` +
                    `FILTER ${joinPath}._key IN ${parentPath}.out_msgs ` +
                    `RETURN ${returnExpression})`,
                needFetch: t => t.out_messages?.length != t.out_msgs?.length,
                onField: "out_msgs",
                refOnField: "_key",
                queryBuilder: (path, onFieldParam, returnExpression) =>
                    `FOR ${path} in messages ` +
                    `FILTER ${path}._key IN @${onFieldParam} ` +
                    `RETURN ${returnExpression}`,
            },
        ],
    }),
}

export type CompiledCollectionConfig<TItem> = {
    buildReturnExpression: (
        selectionSet: SelectionSetNode | undefined,
        context: QRequestContext,
        maxJoinDepth: number,
        path: string,
        additionalFields?: KeyOf<TItem>[],
        overriddenFields?: [fieldName: string, fetcher: string][],
    ) => string
    fetchJoins: (
        data: TItem[],
        selectionSet: SelectionSetNode | undefined,
        context: QRequestContext,
        traceSpan: QTraceSpan,
        maxJoinDepth: number,
        archive: boolean | undefined | null,
    ) => Promise<void>
    qDataCollectionSelector: (context: QRequestContext) => QDataCollection
}

export type CollectionConfig<TItem> =
    | {
          alwaysFetchFields?: KeyOf<TItem>[]
          excludeFields?: KeyOf<TItem>[] // exclude fields for compatibility with QType
          joins?: JoinConfig<TItem, keyof Config>[]
          qDataCollectionSelector: (context: QRequestContext) => QDataCollection
      }
    | CompiledCollectionConfig<TItem>

export type JoinConfig<TParent, TJoinCollection extends keyof Config> = {
    targetField: KeyOf<TParent>
    additionalFields?: KeyOf<TParent>[]
    pathForQuery: string
    joinedCollection: TJoinCollection
    prefetchQueryBuilder: (
        parentPath: string,
        joinPath: string,
        returnExpression: string,
    ) => string
    queryBuilder: (
        path: string,
        onFieldParam: string,
        returnExpression: string,
    ) => string
    needFetch: (parent: TParent) => boolean
    onField: KeyOfWithValueOf<TParent, AllowedJoinOnTypes>
    refOnField: string
}

export type AllowedJoinOnTypes = Maybe<string> | Maybe<string>[]

export function compileCollectionConfig<TItem>(
    collection: CollectionConfig<TItem>,
): CompiledCollectionConfig<TItem> {
    if ("buildReturnExpression" in collection) {
        return collection
    }

    const joinDepthIsExceededError = collection.joins
        ? `Allowed joins depth is exceeded (hint: ${collection.joins
              .map(j => j.targetField)
              .join(", ")})`
        : ""

    const returnExpressionBuilder = (
        selectionSet: SelectionSetNode | undefined,
        context: QRequestContext,
        maxJoinDepth: number,
        path: string,
        additionalFields?: KeyOf<TItem>[],
        overriddenFields?: [fieldName: string, fetcher: string][],
    ) => {
        const returnExpressionsOverrides = new Map()
        for (const field of collection.alwaysFetchFields ?? []) {
            returnExpressionsOverrides.set(field, `${path}.${field}`)
        }
        for (const field of additionalFields ?? []) {
            returnExpressionsOverrides.set(field, `${path}.${field}`)
        }
        for (const join of collection.joins ?? []) {
            const joinSelectionSet = getFieldSelectionSet(
                selectionSet,
                join.targetField,
            )
            if (!joinSelectionSet) {
                continue
            }
            if (maxJoinDepth <= 0) {
                throw QError.invalidQuery(joinDepthIsExceededError)
            }
            for (const field of join.additionalFields ?? []) {
                returnExpressionsOverrides.set(field, `${path}.${field}`)
            }

            // maxJoinDepth is because in nested joins all paths should be different
            const pathForQuery = `${join.pathForQuery}${maxJoinDepth}`
            const returnExression = config[
                join.joinedCollection
            ].buildReturnExpression(
                joinSelectionSet,
                context,
                maxJoinDepth - 1,
                pathForQuery,
            )
            const query = join.prefetchQueryBuilder(
                path,
                pathForQuery,
                returnExression,
            )
            returnExpressionsOverrides.set(join.targetField, query)
        }

        const shouldBeExcluded = (s: SelectionNode) =>
            s.kind == "Field" &&
            (collection.excludeFields as Maybe<string[]>)?.includes(
                s.name.value,
            )
        if (
            collection.excludeFields &&
            collection.excludeFields.length > 0 &&
            selectionSet?.selections.find(s => shouldBeExcluded(s))
        ) {
            selectionSet = Object.assign({}, selectionSet)
            selectionSet.selections = selectionSet.selections.filter(
                s => !shouldBeExcluded(s),
            )
        }

        for (const override of overriddenFields ?? []) {
            returnExpressionsOverrides.set(override[0], override[1])
        }

        return QCollectionQuery.buildReturnExpression(
            context,
            collection.qDataCollectionSelector(context).docType,
            selectionSet,
            [],
            path,
            returnExpressionsOverrides,
        )
    }

    const joinsFetcher = async (
        data: TItem[],
        selectionSet: SelectionSetNode | undefined,
        context: QRequestContext,
        traceSpan: QTraceSpan,
        maxJoinDepth: number,
        archive: boolean | undefined | null,
    ) => {
        for (const join of collection.joins || []) {
            const joinSelectionSet = getFieldSelectionSet(
                selectionSet,
                join.targetField,
            )
            if (!joinSelectionSet) {
                continue
            }

            const { itemsToUpdateByJoinedKey, onFieldIsArray } =
                getItemsToFetch<TItem>(data, join)

            if (itemsToUpdateByJoinedKey.size === 0) {
                await fetchSubjoins()
                continue
            }

            // maxJoinDepth is because in nested joins all paths should be different
            const pathForQuery = `${join.pathForQuery}${maxJoinDepth - 1}`
            const params = new QParams({
                stringifyKeyInAqlComparison:
                    context.services.config.queries.filter
                        .stringifyKeyInAqlComparison,
            })
            const returnExpression = config[
                join.joinedCollection
            ].buildReturnExpression(
                joinSelectionSet,
                context,
                maxJoinDepth - 1,
                // in nested joins all paths should be different
                pathForQuery,
                [join.refOnField as any],
            )
            const onFieldsParamName = params.add([
                ...itemsToUpdateByJoinedKey.keys(),
            ])
            const query = `${join.queryBuilder(
                pathForQuery,
                onFieldsParamName,
                returnExpression,
            )}`
            const queryResult = (await context.services.data.query(
                required(
                    config[join.joinedCollection].qDataCollectionSelector(
                        context,
                    ).provider,
                ),
                {
                    text: query,
                    vars: params.values,
                    orderBy: [],
                    request: context,
                    traceSpan,
                    archive,
                },
            )) as any[][]
            for (const joinItem of queryResult.flat()) {
                const refOn = joinItem[join.refOnField]
                if (typeof refOn === "string") {
                    addToParent(refOn)
                } else {
                    for (const ro of refOn) {
                        if (ro) {
                            addToParent(ro as string)
                        }
                    }
                }
                /* eslint-disable no-inner-declarations */
                function addToParent(refOn: string) {
                    const parents = itemsToUpdateByJoinedKey.get(refOn)
                    if (!parents) {
                        return
                    }
                    for (const parent of parents) {
                        if (onFieldIsArray) {
                            if (parent[join.targetField]) {
                                ;(
                                    parent[join.targetField] as unknown as any[]
                                ).push(joinItem)
                            } else {
                                parent[join.targetField] = [joinItem] as any
                            }
                        } else {
                            parent[join.targetField] = joinItem
                        }
                    }
                }
            }

            await fetchSubjoins()

            async function fetchSubjoins() {
                // in next line flat is for array-like fields (e.g. out_messages)
                const joined = data
                    .map(d => d[join.targetField])
                    .filter(d => !!d)
                    .flat() as any
                await config[join.joinedCollection].fetchJoins(
                    joined,
                    joinSelectionSet,
                    context,
                    traceSpan,
                    maxJoinDepth - 1,
                    archive,
                )
            }
        }
    }

    return {
        buildReturnExpression: returnExpressionBuilder,
        fetchJoins: joinsFetcher,
        qDataCollectionSelector: collection.qDataCollectionSelector,
    }
}

function getItemsToFetch<TItem>(
    data: TItem[],
    join: JoinConfig<TItem, keyof Config>,
) {
    const itemsToUpdateByJoinedKey = new Map<string, TItem[]>()
    let onFieldIsArray = false
    data.forEach(item => {
        if (!join.needFetch(item)) {
            return
        }

        // cast in next line is because type inferring is not ideal
        const onFieldValue = item[join.onField] as unknown as AllowedJoinOnTypes
        if (!onFieldValue) {
            // TODO: Consider metric for unexpected errors
            throw QError.create(
                500,
                "error during join fetching (no join field)",
            )
        }

        function addToMap(fieldValue: string) {
            const record = itemsToUpdateByJoinedKey.get(fieldValue)
            if (record) {
                record.push(item)
            } else {
                itemsToUpdateByJoinedKey.set(fieldValue, [item])
            }
        }

        if (typeof onFieldValue === "string") {
            addToMap(onFieldValue)
            onFieldIsArray = false
        } else {
            for (const fv of onFieldValue) {
                if (fv) {
                    addToMap(fv)
                } // TODO: Else metric?
            }
            onFieldIsArray = true
        }
    })
    return { itemsToUpdateByJoinedKey, onFieldIsArray }
}
