import { AccessRights } from "../auth";
import {
    CollectionFilter,
    collectReturnExpressions,
    combineReturnExpressions,
    FieldSelection,
    mergeFieldWithSelectionSet,
    OrderBy,
    parseSelectionSet,
    QParams,
    QType,
    ScalarFilter,
    splitOr,
    StructFilter,
} from "../filter/filters";
import {
    SelectionSetNode,
} from "graphql";
import {
    FilterConfig,
    FilterOrConversion,
    QConfig,
} from "../config";

export class QCollectionQuery {
    private constructor(
        public filter: CollectionFilter,
        public selection: FieldSelection[],
        public orderBy: OrderBy[],
        public limit: number,
        public timeout: number,
        public operationId: string | null,
        public text: string,
        public params: { [name: string]: unknown },
        public accessRights: AccessRights,
        public shards: Set<string> | undefined,
    ) {
    }

    static create(
        collectionName: string,
        collectionDocType: QType,
        args: {
            filter?: CollectionFilter,
            orderBy?: OrderBy[],
            limit?: number,
            timeout?: number,
            operationId?: string,
        },
        selectionSet: SelectionSetNode | undefined,
        accessRights: AccessRights,
        config?: FilterConfig,
    ): QCollectionQuery | null {
        const orderBy: OrderBy[] = args.orderBy || [];
        const orderByText = orderBy
            .map((field) => {
                const direction = (field.direction && field.direction.toLowerCase() === "desc")
                    ? " DESC"
                    : "";
                return `doc.${field.path.replace(/\bid\b/gi, "_key")}${direction}`;
            })
            .join(", ");

        const sortSection = orderByText !== "" ? `SORT ${orderByText}` : "";
        const limit: number = Math.min(args.limit || 50, 50);
        const limitSection = `LIMIT ${limit}`;

        const params = new QParams();
        const orConversion = config?.orConversion ?? FilterOrConversion.SUB_QUERIES;
        const useSubQueries = orConversion === FilterOrConversion.SUB_QUERIES;
        const filter = args.filter ?? {};
        const subFilters = useSubQueries ? splitOr(filter) : [filter];

        const texts: string[] = [];

        for (const subFilter of subFilters) {
            const condition = QCollectionQuery.buildFilterCondition(collectionName, collectionDocType, subFilter, params, accessRights);
            if (condition !== null) {
                const filterSection = condition ? `FILTER ${condition}` : "";
                const returnExpression = QCollectionQuery.buildReturnExpression(collectionDocType, selectionSet, orderBy);
                texts.push(`
                    FOR doc IN ${collectionName}
                    ${filterSection}
                    ${sortSection}
                    ${limitSection}
                    RETURN ${returnExpression}
                `);
            }
        }

        if (texts.length === 0) {
            return null;
        }

        const text = texts.length === 1
            ? texts[0]
            : `
                FOR doc IN UNION_DISTINCT(${texts.map(x => `${x}`).join(", ")})
                ${sortSection}
                ${limitSection}
                RETURN doc`;
        const timeout = Number(args.timeout) || 0;
        const selection: FieldSelection[] = parseSelectionSet(selectionSet, collectionName);
        const shards = QCollectionQuery.getShards(collectionName, filter);

        return new QCollectionQuery(
            filter,
            selection,
            orderBy,
            limit,
            timeout,
            args.operationId || null,
            text,
            params.values,
            accessRights,
            shards,
        );
    }

    static createForJoin(
        onValues: string[],
        refCollectionName: string,
        refCollectionDocType: QType,
        refOn: string,
        refOnIsArray: boolean,
        fieldSelection: SelectionSetNode | undefined,
        accessRights: AccessRights,
        config: QConfig,
    ): QCollectionQuery | null {
        if (!refOnIsArray) {
            return QCollectionQuery.create(
                refCollectionName,
                refCollectionDocType,
                {
                    filter: {
                        [refOn]: { in: onValues },
                    },
                },
                fieldSelection,
                accessRights,
                config.filter,
            );
        }
        const returnExpression = QCollectionQuery.buildReturnExpression(refCollectionDocType, fieldSelection, []);
        let filterSection = "";
        const params = new QParams();
        for (const onValue of onValues) {
            if (filterSection === "") {
                filterSection = "FILTER ";
            } else {
                filterSection += " OR ";
            }
            filterSection += `@${params.add(onValue)} IN doc.${refOn}`;
        }
        const text = `
            FOR doc IN ${refCollectionName}
            ${filterSection}
            RETURN ${returnExpression}
        `;
        return new QCollectionQuery(
            {
                [refOn]: { any: { in: onValues } },
            },
            parseSelectionSet(fieldSelection, refCollectionName),
            [],
            1000,
            0,
            null,
            text,
            params.values,
            accessRights,
            undefined,
        );
    }

    static getAdditionalCondition(collectionName: string, accessRights: AccessRights, params: QParams) {
        const accounts = accessRights.restrictToAccounts;
        if (accounts.length === 0) {
            return "";
        }
        const condition = accounts.length === 1
            ? `== @${params.add(accounts[0])}`
            : `IN [${accounts.map(x => `@${params.add(x)}`).join(",")}]`;
        switch (collectionName) {
        case "accounts":
            return `doc._key ${condition}`;
        case "transactions":
            return `doc.account_addr ${condition}`;
        case "messages":
            return `(doc.src ${condition}) OR (doc.dst ${condition})`;
        default:
            return "";
        }
    }

    static buildFilterCondition(
        collectionName: string,
        collectionDocType: QType,
        filter: { [name: string]: unknown },
        params: QParams,
        accessRights: AccessRights,
    ): string | null {
        const primaryCondition = Object.keys(filter).length > 0
            ? collectionDocType.filterCondition(params, "doc", filter)
            : "";
        const additionalCondition = QCollectionQuery.getAdditionalCondition(collectionName, accessRights, params);
        if (primaryCondition === "false" || additionalCondition === "false") {
            return null;
        }
        return (primaryCondition && additionalCondition)
            ? `(${primaryCondition}) AND (${additionalCondition})`
            : (primaryCondition || additionalCondition);

    }

    static buildReturnExpression(
        collectionDocType: QType,
        selectionSet: SelectionSetNode | undefined,
        orderBy: OrderBy[],
    ): string {
        const expressions = new Map();
        expressions.set("_key", "doc._key");
        const fields = collectionDocType.fields;
        if (fields) {
            collectReturnExpressions(expressions, "doc", selectionSet, fields);
            if (orderBy.length > 0) {
                let orderBySelectionSet: SelectionSetNode | undefined = undefined;
                for (const item of orderBy) {
                    orderBySelectionSet = mergeFieldWithSelectionSet(item.path, orderBySelectionSet);
                }
                collectReturnExpressions(
                    expressions,
                    "doc",
                    orderBySelectionSet,
                    fields,
                );
            }
        }
        expressions.delete("id");
        return combineReturnExpressions(expressions);
    }

    static getShards(collectionName: string, filter: CollectionFilter): Set<string> | undefined {
        const shards = new Set<string>();
        const getShards = {
            "accounts": getAccountsShards,
            "blocks": getBlocksShards,
            "messages": getMessagesShards,
            "transactions": getTransactionsShards,
        }[collectionName];
        if (getShards === undefined) {
            return undefined;
        }
        for (const orOperand of splitOr(filter)) {
            if (!getShards(orOperand as StructFilter, shards)) {
                return undefined;
            }
        }
        return shards;
    }
}

function getAccountsShards(filter: StructFilter, shards: Set<string>): boolean {
    return getShardsForEqOrIn(filter, "id", shards, getAccountShard);
}

function getBlocksShards(filter: StructFilter, shards: Set<string>): boolean {
    return getShardsForEqOrIn(filter, "id", shards, getBlockShard);
}

function getMessagesShards(filter: StructFilter, shards: Set<string>) {
    const srcUsed = getShardsForEqOrIn(filter, "src", shards, getTransactionShard);
    const dstUsed = getShardsForEqOrIn(filter, "dst", shards, getTransactionShard);
    return srcUsed || dstUsed;
}

function getTransactionsShards(filter: StructFilter, shards: Set<string>) {
    return getShardsForEqOrIn(filter, "account_addr", shards, getTransactionShard);
}

function getAccountShard(address: string): number | undefined {
    const workchain = parseInt(address.split(":")[0] ?? "undefined");
    return workchain === -1 ? 0 : workchain;
}

function getTransactionShard(account_address: string): number | undefined {
    return parseInt(account_address.substr(0, 2), 16) >> 3;
}

function getBlockShard(id: string): number | undefined {
    return parseInt(id.substr(0, 2), 16) >> 3;
}

function getShardsForEqOrIn(filter: StructFilter, field: string, shards: Set<string>, shardFromValue: (value: string) => number | undefined): boolean {
    const fieldFilter = filter[field] as ScalarFilter | undefined;
    if (fieldFilter === undefined) {
        return false;
    }
    const values: string[] = [];
    const eqValue = fieldFilter.eq;
    if (eqValue !== undefined && eqValue !== null) {
        values.push(`${eqValue}`);
    }
    const inValues = fieldFilter.in;
    if (inValues !== undefined && inValues !== null) {
        for (const value of inValues) {
            values.push(`${value}`);
        }
    }
    for (const value of values) {
        const shard = shardFromValue(value);
        if (shard !== undefined && shard >= 0 && shard <= 31) {
            shards.add(shard.toString(2).padStart(5, "0"));
        } else {
            return false;
        }
    }
    return values.length > 0;
}

