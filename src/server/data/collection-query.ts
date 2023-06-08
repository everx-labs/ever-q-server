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
    splitOr,
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
    ) {}

    extractIdFilter(): string[] {
        const singleProp = (value: any): [string, any] | undefined => {
            if (
                typeof value !== "object" ||
                value === null ||
                Array.isArray(value)
            ) {
                return undefined
            }
            const entries = Object.entries(value)
            return entries.length === 1 ? entries[0] : undefined
        }
        const idProp = singleProp(this.filter)
        if (idProp?.[0] === "id") {
            const opProp = singleProp(idProp[1])
            if (opProp?.[0] === "eq") {
                return [`${opProp[1]}`]
            }
            if (opProp?.[0] === "in") {
                return (opProp[1] as any[]).map((x: any) => `${x}`)
            }
        }
        return []
    }

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
                indexHint !== undefined
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
        return new QCollectionQuery(
            filter,
            selection,
            orderBy,
            limit,
            timeout,
            text,
            params.values,
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
        const text = `
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
}
