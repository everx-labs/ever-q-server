import { Parser } from "graphql/language/parser"
import { OrderBy, QType } from "../../server/filter/filters"
import { ArgumentNode, ObjectValueNode, ValueNode } from "graphql"
import {
    explainSlowReason,
    SlowReason,
} from "../../server/filter/slow-detector"
import { FilterOrConversion } from "../../server/config"
import { QIndexInfo } from "../../server/data/data-provider"
import { INDEXES } from "../../server/data/blockchain"
import {
    Account,
    Block,
    Message,
    Transaction,
} from "../../server/graphql/resolvers-generated"

import csv from "csv/sync"
import fs from "fs"
import { parseOrderBy } from "./parsers"

main()

function main() {
    const stats: {
        request: string
        ms_med: number
        cnt: number
        ms_sum: number
        accounts: string[]
    }[] = csv.parse(fs.readFileSync(".secret/req_stat.csv", "utf-8"), {
        columns: true,
        cast: true,
    })
    const statsByCollection: {
        [collection: string]: {
            filter: Record<string, any>
            orderBy: string[]
            msMed: number
            count: number
        }[]
    } = {}
    for (const stat of stats) {
        if (stat.cnt > 1000) {
            try {
                const result = detectSlowReasonForCollectionQuery(stat.request)
                if (result?.slowReason) {
                    statsByCollection[result.collection] = [
                        ...(statsByCollection[result.collection] ?? []),
                        {
                            filter: result.filter,
                            orderBy: result.orderBy.map(x => x.path),
                            msMed: stat.ms_med,
                            count: stat.cnt,
                        },
                    ]
                }
            } catch (err) {
                console.log(">>> ERROR: ", stat.request, err)
            }
        }
    }

    console.log(JSON.stringify(statsByCollection))
}

function detectSlowReasonForCollectionQuery(query: string):
    | {
          collection: string
          filter: Record<string, any>
          orderBy: OrderBy[]
          slowReason: SlowReason | null
      }
    | undefined {
    const parser = new Parser(query)
    const doc = parser.parseDocument()
    const op = doc.definitions[0]
    if (op.kind !== "OperationDefinition" || op.operation !== "query") {
        return undefined
    }
    const collectionQuery = op.selectionSet.selections[0]
    if (collectionQuery.kind !== "Field" || !collectionQuery.arguments) {
        return undefined
    }
    type CollectionInfo = {
        indexes: QIndexInfo[]
        resolver: QType
    }
    const collectionInfos: Record<string, CollectionInfo> = {
        ["blocks"]: {
            indexes: INDEXES["blocks"].indexes,
            resolver: Block,
        },
        messages: {
            indexes: INDEXES["messages"].indexes,
            resolver: Message,
        },
        transactions: {
            indexes: INDEXES["transactions"].indexes,
            resolver: Transaction,
        },
        accounts: {
            indexes: INDEXES["accounts"].indexes,
            resolver: Account,
        },
    }

    const collectionInfo: CollectionInfo | undefined = collectionInfos[
        collectionQuery.name.value
    ] as CollectionInfo | undefined
    if (!collectionInfo) {
        return undefined
    }
    const filter = parseFilter(
        collectionQuery.arguments.find(x => x.name.value === "filter"),
    )
    const orderBy = parseOrderBy(
        collectionQuery.arguments.find(x => x.name.value === "orderBy"),
    )
    return {
        collection: collectionQuery.name.value,
        filter,
        orderBy,
        slowReason: explainSlowReason(
            {
                stringifyKeyInAqlComparison: false,
                orConversion: FilterOrConversion.OR_OPERATOR,
            },
            collectionQuery.name.value,
            collectionInfo.indexes,
            collectionInfo.resolver,
            filter,
            orderBy,
            {
                skipValueConversion: true,
            },
        ),
    }
}

function parseFilter(arg?: ArgumentNode): Record<string, unknown> {
    if (!arg || arg.value.kind !== "ObjectValue") {
        return {}
    }
    return parseObjectValue(arg.value)
}

function parseObjectValue(node: ObjectValueNode): Record<string, unknown> {
    const value: Record<string, unknown> = {}
    for (const field of node.fields) {
        value[field.name.value] = parseValue(field.value)
    }
    return value
}

function parseValue(node: ValueNode): unknown {
    switch (node.kind) {
        case "BooleanValue":
            return null
        case "EnumValue":
            return null
        case "FloatValue":
            return null
        case "IntValue":
            return null
        case "StringValue":
            return null
        case "NullValue":
            return null
        case "Variable":
            return null
        case "ListValue": {
            const list: unknown[] = []
            for (const item of node.values) {
                const itemValue = parseValue(item)
                if (itemValue !== null) {
                    list.push(itemValue)
                }
            }
            return list.length > 0 ? list : null
        }
        case "ObjectValue": {
            return parseObjectValue(node)
        }
    }
    return undefined
}
