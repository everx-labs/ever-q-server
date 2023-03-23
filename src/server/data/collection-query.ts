import {
    CollectionFilter,
    collectReturnExpressions,
    combineReturnExpressions,
    FieldSelection,
    mergeFieldWithSelectionSet,
    OrderBy,
    parseSelectionSet,
    QParams,
    QRequestParams,
    QType,
    ScalarFilter,
    splitOr,
    StructFilter,
} from "../filter/filters"
import { SelectionSetNode } from "graphql"
import { FilterConfig, FilterOrConversion, QConfig } from "../config"
import { getFastIndexHint } from "../filter/fast-index-hints"

export class QCollectionQuery {
    private constructor(
        public filter: CollectionFilter,
        public selection: FieldSelection[],
        public orderBy: OrderBy[],
        public limit: number,
        public timeout: number,
        public text: string,
        public params: { [name: string]: unknown },
        public shards: Set<string> | undefined,
    ) {}

    static create(
        config: FilterConfig,
        request: QRequestParams,
        collectionName: string,
        collectionDocType: QType,
        args: {
            filter?: CollectionFilter | null
            orderBy?: OrderBy[] | null
            limit?: number | null
            timeout?: number | null
        },
        selectionSet: SelectionSetNode | undefined,
        shardingDegree: number,
    ): QCollectionQuery | null {
        const orderBy: OrderBy[] = args.orderBy || []
        const orderByText = orderBy
            .map(field => {
                const direction =
                    field.direction && field.direction.toLowerCase() === "desc"
                        ? " DESC"
                        : ""
                return `doc.${field.path.replace(
                    /\bid\b/gi,
                    "_key",
                )}${direction}`
            })
            .join(", ")

        const sortSection = orderByText !== "" ? `SORT ${orderByText}` : ""
        const limit: number = Math.min(args.limit || 50, 50)
        const limitSection = `LIMIT ${limit}`

        const params = new QParams({
            stringifyKeyInAqlComparison: config.stringifyKeyInAqlComparison,
        })
        const orConversion =
            config?.orConversion ?? FilterOrConversion.SUB_QUERIES
        const useSubQueries = orConversion === FilterOrConversion.SUB_QUERIES
        const filter = args.filter ?? {}
        const subFilters = useSubQueries ? splitOr(filter) : [filter]

        const texts: string[] = []

        for (const subFilter of subFilters) {
            const indexHint = getFastIndexHint(
                collectionName,
                subFilter,
                orderBy,
            )
            const forOptions =
                indexHint !== null
                    ? `OPTIONS { indexHint: "${indexHint}" }`
                    : ""

            const condition = QCollectionQuery.buildFilterCondition(
                collectionDocType,
                subFilter,
                params,
            )
            const filterSection = condition ? `FILTER ${condition}` : ""
            const returnExpression = QCollectionQuery.buildReturnExpression(
                request,
                collectionDocType,
                selectionSet,
                orderBy,
            )
            texts.push(`
                FOR doc IN ${collectionName}
                ${forOptions}
                ${filterSection}
                ${sortSection}
                ${limitSection}
                RETURN ${returnExpression}
            `)
            if (collectionName === "messages" && shardingDegree > 0) {
                texts.push(`
                    FOR doc IN messages_complement
                    ${forOptions}
                    ${filterSection}
                    ${sortSection}
                    ${limitSection}
                    RETURN ${returnExpression}
                `)
            }
        }

        if (texts.length === 0) {
            return null
        }

        const text =
            texts.length === 1
                ? texts[0]
                : `
                FOR doc IN UNION_DISTINCT(${texts.map(x => `${x}`).join(", ")})
                ${sortSection}
                ${limitSection}
                RETURN doc`
        const timeout = Number(args.timeout) || 0
        const selection: FieldSelection[] = parseSelectionSet(
            selectionSet,
            collectionName,
        )
        const shards = QCollectionQuery.getShards(
            collectionName,
            filter,
            shardingDegree,
        )

        return new QCollectionQuery(
            filter,
            selection,
            orderBy,
            limit,
            timeout,
            text,
            params.values,
            shards,
        )
    }

    static createForJoin(
        request: QRequestParams,
        onValues: string[],
        refCollectionName: string,
        refCollectionDocType: QType,
        refOn: string,
        refOnIsArray: boolean,
        fieldSelection: SelectionSetNode | undefined,
        shardingDegree: number,
        config: QConfig,
    ): QCollectionQuery | null {
        if (!refOnIsArray) {
            return QCollectionQuery.create(
                config.queries.filter,
                request,
                refCollectionName,
                refCollectionDocType,
                {
                    filter: {
                        [refOn]: { in: onValues },
                    },
                },
                fieldSelection,
                shardingDegree,
            )
        }
        const returnExpression = QCollectionQuery.buildReturnExpression(
            request,
            refCollectionDocType,
            fieldSelection,
            [],
        )
        let filterSection = ""
        const params = new QParams({
            stringifyKeyInAqlComparison:
                config.queries.filter.stringifyKeyInAqlComparison,
        })
        for (const onValue of onValues) {
            if (filterSection === "") {
                filterSection = "FILTER "
            } else {
                filterSection += " OR "
            }
            filterSection += `@${params.add(onValue)} IN doc.${refOn}`
        }
        const text =
            refCollectionName === "messages" && shardingDegree > 0
                ? `
                FOR doc IN UNION_DISTINCT(
                    FOR doc IN messages
                    ${filterSection}
                    RETURN ${returnExpression},

                    FOR doc IN messages_complement
                    ${filterSection}
                    RETURN ${returnExpression}
                )
                RETURN doc
            `
                : `
                FOR doc IN ${refCollectionName}
                ${filterSection}
                RETURN ${returnExpression}
            `
        return new QCollectionQuery(
            {
                [refOn]: { any: { in: onValues } },
            },
            parseSelectionSet(fieldSelection, refCollectionName),
            [],
            1000,
            0,
            text,
            params.values,
            undefined,
        )
    }

    static buildFilterCondition(
        collectionDocType: QType,
        filter: { [name: string]: unknown } | null,
        params: QParams,
    ): string | null {
        return filter !== null && Object.keys(filter).length > 0
            ? collectionDocType.filterCondition(params, "doc", filter)
            : null
    }

    static buildReturnExpression(
        request: QRequestParams,
        collectionDocType: QType,
        selectionSet: SelectionSetNode | undefined,
        orderBy: OrderBy[],
        path = "doc",
        overrides: Map<string, string> | undefined = undefined,
    ): string {
        const expressions = new Map()
        expressions.set("_key", `${path}._key`)
        const fields = collectionDocType.fields
        if (fields) {
            collectReturnExpressions(
                request,
                expressions,
                path,
                selectionSet,
                fields,
            )
            if (orderBy.length > 0) {
                let orderBySelectionSet: SelectionSetNode | undefined =
                    undefined
                for (const item of orderBy) {
                    orderBySelectionSet = mergeFieldWithSelectionSet(
                        item.path,
                        orderBySelectionSet,
                    )
                }
                collectReturnExpressions(
                    request,
                    expressions,
                    path,
                    orderBySelectionSet,
                    fields,
                )
            }
        }
        expressions.delete("id")
        if (overrides) {
            overrides.forEach((value, key) => {
                expressions.set(key, value)
            })
        }
        return combineReturnExpressions(expressions)
    }

    static getShards(
        collectionName: string,
        filter: CollectionFilter,
        shardingDegree: number,
    ): Set<string> | undefined {
        const shards = new Set<string>()
        const getShards = {
            accounts: getAccountsShards,
            blocks: getBlocksShards,
            messages: getMessagesShards,
            transactions: getTransactionsShards,
        }[collectionName]
        if (getShards === undefined || shardingDegree === 0) {
            return undefined
        }
        for (const orOperand of splitOr(filter)) {
            if (!getShards(orOperand as StructFilter, shards, shardingDegree)) {
                return undefined
            }
        }
        return shards
    }
}

function getAccountsShards(
    filter: StructFilter,
    shards: Set<string>,
    shardingDegree: number,
): boolean {
    return getShardsForEqOrIn(
        filter,
        "id",
        shards,
        shardingDegree,
        getAccountShard,
    )
}

function getBlocksShards(
    filter: StructFilter,
    shards: Set<string>,
    shardingDegree: number,
): boolean {
    return getShardsForEqOrIn(
        filter,
        "id",
        shards,
        shardingDegree,
        getBlockShard,
    )
}

function getMessagesShards(
    filter: StructFilter,
    shards: Set<string>,
    shardingDegree: number,
) {
    const srcUsed = getShardsForEqOrIn(
        filter,
        "src",
        shards,
        shardingDegree,
        getMessageAddressShard,
    )
    const dstUsed = getShardsForEqOrIn(
        filter,
        "dst",
        shards,
        shardingDegree,
        getMessageAddressShard,
    )
    return srcUsed || dstUsed
}

function getTransactionsShards(
    filter: StructFilter,
    shards: Set<string>,
    shardingDegree: number,
) {
    return getShardsForEqOrIn(
        filter,
        "account_addr",
        shards,
        shardingDegree,
        getAccountShard,
    )
}

function getMessageAddressShard(
    address: string,
    shardingDegree: number,
): number | undefined {
    const addressWithoutPrefix = address.split(":")[1]
    if (addressWithoutPrefix === undefined || addressWithoutPrefix.length < 1) {
        return undefined
    }
    return getShardFromHexString(
        addressWithoutPrefix.replace("_", ""),
        shardingDegree,
    )
}

function getAccountShard(
    address: string,
    shardingDegree: number,
): number | undefined {
    const addressWithoutPrefix = address.split(":")[1]
    if (
        addressWithoutPrefix === undefined ||
        addressWithoutPrefix.length !== 64
    ) {
        return undefined // some users depend on the absence of errors for incorrect ids
    }
    return getShardFromHexString(addressWithoutPrefix, shardingDegree)
}

function getBlockShard(id: string, shardingDegree: number): number | undefined {
    if (id.length !== 64) {
        return undefined // some users depend on the absence of errors for incorrect ids
    }
    return getShardFromHexString(id, shardingDegree)
}

function getShardFromHexString(
    hex: string,
    shardingDegree: number,
): number | undefined {
    const symbols = Math.ceil(shardingDegree / 4)
    const excessBits = symbols * 4 - shardingDegree
    return (
        parseInt(hex.padEnd(symbols, "0").substr(0, symbols), 16) >> excessBits
    )
}

function getShardsForEqOrIn(
    filter: StructFilter,
    field: string,
    shards: Set<string>,
    shardingDegree: number,
    shardFromValue: (
        value: string,
        shardingDegree: number,
    ) => number | undefined,
): boolean {
    const fieldFilter = filter[field] as ScalarFilter | undefined
    if (fieldFilter === undefined) {
        return false
    }
    const values: string[] = []
    const eqValue = fieldFilter.eq
    if (eqValue !== undefined && eqValue !== null) {
        values.push(`${eqValue}`)
    }
    const inValues = fieldFilter.in
    if (inValues !== undefined && inValues !== null) {
        for (const value of inValues) {
            values.push(`${value}`)
        }
    }
    for (const value of values) {
        const shard = shardFromValue(value, shardingDegree)
        if (shard !== undefined && shard >= 0 && shard <= 0xff) {
            shards.add(shard.toString(2).padStart(shardingDegree, "0"))
        } else {
            return false
        }
    }
    return values.length > 0
}
