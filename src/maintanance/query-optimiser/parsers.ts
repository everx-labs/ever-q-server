import {
    ArgumentNode,
    ObjectFieldNode,
    ObjectValueNode,
    ValueNode,
} from "graphql"
import { OrderBy } from "../../server/filter/filters"

const scalarOps = new Set(["eq", "ne", "gt", "ge", "lt", "le", "in", "notIn"])
const collectionNames = new Set([
    "blocks",
    "messages",
    "transactions",
    "accounts",
])

export function isCollection(name: string): boolean {
    return collectionNames.has(name)
}

export function isScalarOpField(field: ObjectFieldNode): boolean {
    return scalarOps.has(field.name.value) && isScalarOpArg(field.value)
}

function isScalarOpArg(node: ValueNode): boolean {
    switch (node.kind) {
        case "BooleanValue":
            return true
        case "EnumValue":
            return true
        case "FloatValue":
            return true
        case "IntValue":
            return true
        case "StringValue":
            return true
        case "NullValue":
            return true
        case "Variable":
            return true
        case "ListValue":
            return true
        case "ObjectValue":
            return false
    }
    return false
}

export function parseOrderBy(arg?: ArgumentNode): OrderBy[] {
    if (!arg) {
        return []
    }
    const fields: OrderBy[] = []
    if (arg.value.kind === "ListValue") {
        for (const item of arg.value.values) {
            if (item.kind === "ObjectValue") {
                parseOrderByField(item, fields)
            }
        }
    } else if (arg.value.kind === "ObjectValue") {
        parseOrderByField(arg.value, fields)
    }
    return fields
}

export function parseOrderByField(field: ObjectValueNode, fields: OrderBy[]) {
    const pathNode = field.fields.find(x => x.name.value === "path")
    if (!pathNode || pathNode.value.kind !== "StringValue") {
        return
    }
    const directionNode = field.fields.find(x => x.name.value === "direction")
    const direction =
        directionNode &&
        directionNode.value.kind === "EnumValue" &&
        directionNode.value.value === "DESC"
            ? "DESC"
            : "ASC"
    fields.push({ path: pathNode.value.value, direction })
}
