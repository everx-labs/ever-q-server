import { Parser } from "graphql/language/parser"
import {
    ArgumentNode,
    FieldNode,
    ObjectFieldNode,
    ObjectValueNode,
    SelectionSetNode,
    ValueNode,
} from "graphql"

import csv from "csv/sync"
import fs from "fs"
import { isCollection, isScalarOpField, parseOrderBy } from "./parsers"

enum Api {
    Collection,
    Blockchain,
}

type RequestStat = {
    request: string
    ms_med: number
    cnt: number
    ms_sum: number
    very_hot: number
    hot: number
    cold: number
    accounts: string[]
}

type FieldUsage = {
    filter: number
    filterOps: Record<string, number>
    orderBy: number
    selection: number
    apiCollection: number
    apiBlockchain: number
    veryHot: number
    hot: number
    cold: number
}

class FieldUsageCollector {
    collections: Record<string, Record<string, FieldUsage>> = {}

    parseQuery(stat: RequestStat) {
        const parser = new Parser(stat.request)
        const doc = parser.parseDocument()
        const op = doc.definitions[0]
        if (op.kind !== "OperationDefinition" || op.operation !== "query") {
            return
        }
        for (const rootField of op.selectionSet.selections) {
            if (rootField.kind !== "Field") {
                continue
            }
            if (isCollection(rootField.name.value)) {
                this.parseCollection(
                    rootField,
                    rootField.name.value,
                    Api.Collection,
                    stat,
                )
            } else if (rootField.name.value === "blockchain") {
                this.parseBlockchain(rootField, stat)
            }
        }
    }

    parseCollection(
        field: FieldNode,
        collection: string,
        api: Api,
        stat: RequestStat,
    ) {
        this.parseFilter(
            field.arguments?.find(x => x.name.value === "filter"),
            collection,
            stat,
        )
        const orderBy = parseOrderBy(
            field.arguments?.find(x => x.name.value === "orderBy"),
        )
        for (const item of orderBy) {
            this.endureField(collection, item.path).orderBy += stat.cnt
        }
        if (field.selectionSet) {
            this.parseSelection(field.selectionSet, collection, api, "", stat)
        }
    }

    parseBlockchain(root: FieldNode, stat: RequestStat) {
        for (const field of root.selectionSet?.selections ?? []) {
            if (field.kind !== "Field") {
                continue
            }
            switch (field.name.value) {
                case "account":
                    this.parseBlockchainAccount(field, stat)
                    break
                case "key_blocks":
                case "blocks":
                    this.parseCollection(
                        skipPagination(field),
                        "blocks",
                        Api.Blockchain,
                        stat,
                    )
                    break
                case "block":
                case "block_by_seq_no":
                    this.parseCollection(field, "blocks", Api.Blockchain, stat)
                    break
                case "message":
                    this.parseCollection(
                        field,
                        "messages",
                        Api.Blockchain,
                        stat,
                    )
                    break
                case "transactions":
                    this.parseCollection(
                        skipPagination(field),
                        "transactions",
                        Api.Blockchain,
                        stat,
                    )
                    break
                case "transaction":
                    this.parseCollection(
                        field,
                        "transactions",
                        Api.Blockchain,
                        stat,
                    )
                    break
            }
        }
    }

    parseBlockchainAccount(account: FieldNode, stat: RequestStat) {
        for (const field of account.selectionSet?.selections ?? []) {
            if (field.kind !== "Field") {
                continue
            }
            switch (field.name.value) {
                case "info":
                    this.parseCollection(
                        skipPagination(field),
                        "accounts",
                        Api.Blockchain,
                        stat,
                    )
                    break
                case "messages":
                    this.parseCollection(
                        skipPagination(field),
                        "messages",
                        Api.Blockchain,
                        stat,
                    )
                    break
                case "transactions":
                    this.parseCollection(
                        skipPagination(field),
                        "transactions",
                        Api.Blockchain,
                        stat,
                    )
                    break
            }
        }
    }

    parseFilter(
        arg: ArgumentNode | undefined,
        collection: string,
        stat: RequestStat,
    ) {
        if (!arg || arg.value.kind !== "ObjectValue") {
            return
        }
        this.parseFilterStruct(arg.value, collection, "", stat)
    }

    parseFilterStruct(
        node: ObjectValueNode,
        collection: string,
        path: string,
        stat: RequestStat,
    ) {
        for (const orOperand of splitOr(node.fields)) {
            for (const field of orOperand) {
                this.parseFilterValue(
                    field.value,
                    collection,
                    addPath(path, field.name.value),
                    stat,
                )
            }
        }
    }

    parseFilterValue(
        node: ValueNode,
        collection: string,
        path: string,
        stat: RequestStat,
    ) {
        if (node.kind === "ObjectValue") {
            const usedScalarOps = new Set<string>()
            for (const field of node.fields) {
                if (isScalarOpField(field)) {
                    usedScalarOps.add(field.name.value)
                } else {
                    usedScalarOps.clear()
                    break
                }
            }
            if (usedScalarOps.size > 0) {
                const field = this.endureField(collection, path)
                for (const op of usedScalarOps) {
                    incFilterOp(field, op, stat.cnt)
                }
            } else {
                this.parseFilterStruct(node, collection, path, stat)
            }
        }
    }

    private parseSelection(
        selection: SelectionSetNode,
        collection: string,
        api: Api,
        path: string,
        stat: RequestStat,
    ) {
        for (const field of selection.selections) {
            if (field.kind === "Field") {
                const fieldPath = addPath(path, field.name.value)
                if (
                    fieldPath === "tokenTransfer" ||
                    fieldPath === "tokenHolder"
                ) {
                    continue
                }
                if (
                    this.parseJoin(
                        field,
                        collection,
                        fieldPath,
                        [
                            [
                                "transactions",
                                "in_message",
                                "in_msg",
                                "messages",
                            ],
                            [
                                "transactions",
                                "out_messages",
                                "out_msgs",
                                "messages",
                            ],
                            ["transactions", "block", "block_id", "blocks"],
                            [
                                "transactions",
                                "account",
                                "account_addr",
                                "accounts",
                            ],
                            [
                                "messages",
                                "src_transaction",
                                "id",
                                "transactions",
                            ],
                            [
                                "messages",
                                "dst_transaction",
                                "id",
                                "transactions",
                            ],
                            ["messages", "src_account", "src", "accounts"],
                            ["messages", "dst_account", "dst", "accounts"],
                            ["messages", "block", "block_id", "blocks"],
                        ],
                        api,
                        stat,
                    )
                ) {
                    continue
                }
                if (
                    field.selectionSet &&
                    field.selectionSet.selections.length > 0
                ) {
                    this.parseSelection(
                        field.selectionSet,
                        collection,
                        api,
                        fieldPath,
                        stat,
                    )
                } else if (!field.name.value.startsWith("__")) {
                    this.parseSelectionField(collection, fieldPath, api, stat)
                }
            }
        }
    }

    private parseJoin(
        field: FieldNode,
        fieldCollection: string,
        fieldPath: string,
        joins: string[][],
        api: Api,
        stat: RequestStat,
    ): boolean {
        for (const [
            testCollection,
            testPath,
            joinField,
            joinCollection,
        ] of joins) {
            if (fieldCollection === testCollection && fieldPath === testPath) {
                this.parseSelectionField(fieldCollection, joinField, api, stat)
                if (field.selectionSet) {
                    this.parseSelection(
                        field.selectionSet,
                        joinCollection,
                        api,
                        "",
                        stat,
                    )
                }
                return true
            }
        }
        return false
    }

    private parseSelectionField(
        collection: string,
        path: string,
        api: Api,
        stat: RequestStat,
    ) {
        const usage = this.endureField(collection, path)
        usage.selection += stat.cnt
        usage.veryHot += stat.very_hot
        usage.hot += stat.hot
        usage.cold += stat.cold
        if (api === Api.Collection) {
            usage.apiCollection += stat.cnt
        } else {
            usage.apiBlockchain += stat.cnt
        }
    }

    endureField(collection: string, path: string): FieldUsage {
        let fieldsCollection = this.collections[collection]
        if (!fieldsCollection) {
            fieldsCollection = {}
            this.collections[collection] = fieldsCollection
        }
        let field = fieldsCollection[path]
        if (!field) {
            field = {
                filter: 0,
                filterOps: {},
                orderBy: 0,
                selection: 0,
                apiBlockchain: 0,
                apiCollection: 0,
                veryHot: 0,
                hot: 0,
                cold: 0,
            }
            fieldsCollection[path] = field
        }
        return field
    }
}

function incFilterOp(field: FieldUsage, op: string, count: number) {
    field.filter += count
    field.filterOps[op] = (field.filterOps[op] ?? 0) + count
}

function splitOr(
    fields: ReadonlyArray<ObjectFieldNode>,
): ReadonlyArray<ObjectFieldNode>[] {
    const operands: ReadonlyArray<ObjectFieldNode>[] = []
    let operand: ReadonlyArray<ObjectFieldNode> | null = fields
    while (operand) {
        const orOperand: ObjectFieldNode | undefined = operand.find(
            x => x.name.value === "OR",
        )
        if (orOperand) {
            operands.push(operand.filter(x => x !== orOperand))
            if (orOperand.value.kind === "ObjectValue") {
                operand = orOperand.value.fields
            } else {
                operand = null
            }
        } else {
            operands.push(operand)
            operand = null
        }
    }
    return operands
}

function addPath(path: string, name: string): string {
    return path !== "" ? `${path}.${name}` : name
}

function skipPagination(field: FieldNode): FieldNode {
    return findNested(findNested(field, "edges"), "node") ?? field
}

function findNested(
    field: FieldNode | undefined,
    name: string,
): FieldNode | undefined {
    const nested = field?.selectionSet?.selections.find(
        x => x.kind === "Field" && x.name.value === name,
    )
    return nested?.kind === "Field" ? nested : undefined
}

function main() {
    const stats: RequestStat[] = csv.parse(
        fs.readFileSync(".secret/req_stat.csv", "utf-8"),
        {
            columns: true,
            cast: true,
        },
    )
    const fields = new FieldUsageCollector()
    for (const stat of stats) {
        if (stat.cnt > 10) {
            try {
                if (stat.request !== "") {
                    fields.parseQuery(stat)
                }
            } catch (err) {
                console.log(`>>> invalid request [${stat.request}]: ${err}`)
            }
        }
    }

    for (const [collectionName, collectionFields] of Object.entries(
        fields.collections,
    )) {
        const csvFields = []
        for (const [fieldName, field] of Object.entries(collectionFields)) {
            csvFields.push({
                field: fieldName,
                filter: field.filter,
                orderBy: field.orderBy,
                selection: field.selection,
                apiBlockchain: field.apiBlockchain,
                apiCollection: field.apiCollection,
                veryHot: field.veryHot,
                hot: field.hot,
                cold: field.cold,
            })
        }
        fs.writeFileSync(
            `.secret/${collectionName}_field_usage.csv`,
            csv.stringify(csvFields, {
                header: true,
            }),
        )
    }
}

main()
