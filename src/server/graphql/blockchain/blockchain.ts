import { FieldNode, GraphQLResolveInfo } from "graphql";
import { AccessRights } from "../../auth";
import { QParams } from "../../filter/filters";
import { QRequestContext } from "../../request";
import { QError, required } from "../../utils";

import {
    BlockchainQuery,
    BlockchainQueryAccount_TransactionsArgs,
    BlockchainQueryMaster_Seq_No_RangeArgs,
    BlockchainQueryWorkchain_TransactionsArgs,
    BlockchainTransaction,
    BlockchainTransactionsConnection,
    Resolvers,
} from "./resolvers-types-generated";
import { QCollectionQuery } from "../../data/collection-query";
import { QTraceSpan } from "../../tracing/trace-span";

const enum Direction {
    Forward,
    Backward,
}

function parseMasterSeqNo(chain_order: string) {
    const length = parseInt(chain_order[0], 16) + 1;
    return parseInt(chain_order.slice(1, length + 1), 16);
}

async function resolve_maser_seq_no_range(args: BlockchainQueryMaster_Seq_No_RangeArgs, context: QRequestContext, traceSpan: QTraceSpan) {
    if (args.time_start && args.time_end && args.time_start > args.time_end) {
        throw QError.invalidQuery("time_start should not be greater than time_end");
    }

    const text = `
        RETURN {
            _key: UUID(),
            start: @time_start ? (FOR b IN blocks FILTER b.gen_utime >= @time_start SORT b.chain_order ASC LIMIT 1 RETURN b.chain_order)[0] : null,
            end: @time_end ? (FOR b IN blocks FILTER b.gen_utime <= @time_end SORT b.chain_order DESC LIMIT 1 RETURN b.chain_order)[0] : null
        }
    `; // UUID is a hack to bypass QDataCombiner deduplication
    const vars: Record<string, unknown> = {
        time_start: args.time_start ?? null,
        time_end: args.time_end ?? null,
    };
    const result = await context.services.data.query(
        required(context.services.data.blocks.provider),
        {
            text,
            vars,
            orderBy: [],
            request: context,
            traceSpan,
        },
    ) as { start: string | null, end: string | null }[];

    let start: string | null = null;
    let end: string | null = null;
    for (const r of result) {
        if (r.start && (!start || r.start < start)) {
            start = r.start;
        }
        if (r.end && (!end || r.end > end)) {
            end = r.end;
        }
    }
    if (args.time_end && !end) {
        start = null;
    }
    if (args.time_start && !start) {
        end = null;
    }

    // reliable boundary
    const reliable = await context.services.data.getReliableChainOrderUpperBoundary(context);
    if (reliable.boundary == "") {
        throw QError.internalServerError();
    }

    return {
        start: start ? parseMasterSeqNo(start) : null,
        end: end ? Math.min(parseMasterSeqNo(end) + 1, parseMasterSeqNo(reliable.boundary)) : null,
    };
}

function toU64String(value: number): string {
    const hex = value.toString(16);
    return `${(hex.length - 1).toString(16)}${hex}`;
}

async function prepareChainOrderFilter(
    args: BlockchainQueryAccount_TransactionsArgs | BlockchainQueryWorkchain_TransactionsArgs,
    params: QParams,
    filters: string[],
    context: QRequestContext,
) {
    // master_seq_no
    let start_chain_order = args.master_seq_no?.start ? toU64String(args.master_seq_no.start) : null;
    let end_chain_order = args.master_seq_no?.end ? toU64String(args.master_seq_no.end) : null;

    // before, after
    start_chain_order = args.after && (!start_chain_order || args.after > start_chain_order)
        ? args.after
        : start_chain_order;
    end_chain_order = args.before && (!end_chain_order || args.before < end_chain_order)
        ? args.before
        : end_chain_order;

    // reliable boundary
    const reliable = await context.services.data.getReliableChainOrderUpperBoundary(context);
    if (reliable.boundary == "") {
        throw QError.internalServerError();
    }

    end_chain_order = (end_chain_order && end_chain_order < reliable.boundary) ? end_chain_order : reliable.boundary;

    // apply
    if (start_chain_order) {
        const paramName = params.add(start_chain_order);
        filters.push(`doc.chain_order > @${paramName}`);
    }

    const paramName = params.add(end_chain_order);
    filters.push(`doc.chain_order < @${paramName}`);
}

function getAccountAccessRestictionCondition(accessRights: AccessRights, params: QParams) {
    const accounts = accessRights.restrictToAccounts;
    if (accounts.length === 0) {
        return "";
    }
    const condition = accounts.length === 1
        ? `== @${params.add(accounts[0])}`
        : `IN @${params.add(accounts)}`;
    return `doc.account_addr ${condition}`;
}

async function resolve_transactions(
    parent: BlockchainQuery,
    args: BlockchainQueryAccount_TransactionsArgs | BlockchainQueryWorkchain_TransactionsArgs,
    context: QRequestContext,
    info: GraphQLResolveInfo,
    prepareAccountFilter: (params: QParams, filters: string[]) => void,
    traceSpan: QTraceSpan,
) {
    // filters
    const filters: string[] = [];
    const params = new QParams();

    await prepareChainOrderFilter(args, params, filters, context);
    prepareAccountFilter(params, filters);

    const accessFilter = getAccountAccessRestictionCondition(parent.accessRights, params);
    if (accessFilter) {
        filters.push(accessFilter);
    }

    // first, last
    if (args.first && args.last) {
        throw QError.invalidQuery("\"first\" and \"last\" shouldn't be used simultaneously");
    }
    if (args.first && args.before) {
        throw QError.invalidQuery("\"first\" should not be used with \"before\"");
    }
    if (args.last && args.after) {
        throw QError.invalidQuery("\"last\" should not be used with \"after\"");
    }
    if (args.first && args.first < 1) {
        throw QError.invalidQuery("\"first\" should not be less than than 1");
    }
    if (args.last && args.last < 1) {
        throw QError.invalidQuery("\"last\" should not be less than than 1");
    }
    const limit = 1 + Math.min(50, args.first ?? 50, args.last ?? 50);
    const direction = (args.last || args.before) ? Direction.Backward : Direction.Forward;

    // get node selection set
    const edgesNode =
        info.fieldNodes[0].selectionSet?.selections
            .find(s => s.kind == "Field" && s.name.value == "edges") as FieldNode | undefined;
    const nodeNode =
        edgesNode?.selectionSet?.selections
            .find(s => s.kind == "Field" && s.name.value == "node") as FieldNode | undefined;
    let selectionSet = nodeNode?.selectionSet;

    // filter out "hash" field
    if (selectionSet && selectionSet.selections.find(s =>s.kind == "Field" && s.name.value == "hash")) {
        selectionSet = Object.assign({}, selectionSet);
        selectionSet.selections = selectionSet.selections
            .filter(s => !(s.kind == "Field" && s.name.value == "hash"));
    }

    // build return expression
    const orderBy = [{ path: "chain_order", direction: "ASC" }];
    const returnExpression = QCollectionQuery.buildReturnExpression(
        context.services.data.transactions.docType,
        selectionSet,
        orderBy,
    );

    // query
    const query = `
        FOR doc IN transactions
        FILTER ${filters.join(" AND ")}
        SORT doc.chain_order ${direction == Direction.Backward ? "DESC" : "ASC"}
        LIMIT ${limit}
        RETURN ${returnExpression}
    `;
    const queryResult = await context.services.data.query(
        required(context.services.data.transactions.provider),
        {
            text: query,
            vars: params.values,
            orderBy,
            request: context,
            traceSpan,
        },
    ) as BlockchainTransaction[];

    // sort query result by chain_order ASC
    queryResult.sort((a, b) => {
        if (!a.chain_order || !b.chain_order) {
            throw QError.internalServerError();
        }
        if (a.chain_order > b.chain_order) {
            return 1;
        }
        if (a.chain_order < b.chain_order) {
            return -1;
        }
        throw QError.internalServerError();
    });

    // limit result length
    const hasMore = queryResult.length >= limit;
    if (hasMore) {
        switch (direction) {
            case Direction.Forward:
                queryResult.splice(limit - 1);
                break;
            case Direction.Backward:
                queryResult.splice(0, queryResult.length - limit + 1);
                break;
        }
    }

    return {
        edges: queryResult.map(t => {
            return {
                node: t,
                cursor: t.chain_order,
            };
        }),
        pageInfo: {
            startCursor: queryResult.length > 0 ? queryResult[0].chain_order : "",
            endCursor: queryResult.length > 0 ? queryResult[queryResult.length - 1].chain_order : "",
            hasNextPage: (direction == Direction.Forward) ? hasMore : false,
            hasPreviousPage: (direction == Direction.Backward) ? hasMore : false,
        },
    } as BlockchainTransactionsConnection;
}

export const resolvers: Resolvers<QRequestContext> = {
    Query: {
        blockchain: async (_parent, args, context) => {
            return {
                accessRights: await context.requireGrantedAccess(args)
            };
        },
    },
    BlockchainQuery: {
        master_seq_no_range: (_parent, args, context) => {
            return context.trace("blockchain-master_seq_no_range", async traceSpan => {
                return await resolve_maser_seq_no_range(args, context, traceSpan);
            });
        },
        account_transactions: async (parent, args, context, info) => {
            return context.trace("blockchain-account_transactions", async traceSpan => {
                return await resolve_transactions(
                    parent,
                    args,
                    context,
                    info,
                    (params, filters) => {
                        if (args.account_addresses) {
                            const paramName = params.add(args.account_addresses);
                            filters.push(`doc.account_addr IN @${paramName}`);
                        }
                    },
                    traceSpan,
                );
            });
        },
        workchain_transactions: async (parent, args, context, info) => {
            return context.trace("blockchain-workchain_transactions", async traceSpan => {
                return await resolve_transactions(
                    parent,
                    args,
                    context,
                    info,
                    (params, filters) => {
                        if (args.workchains) {
                            const paramName = params.add(args.workchains);
                            filters.push(`doc.workchain_id IN @${paramName}`);
                            // we could probably use (doc.account_addr > "{w}:" AND doc.account_addr < "{w};")
                        }
                    },
                    traceSpan,
                );
            });
        },
    },
    Node: {
        __resolveType: (parent) => {
            // it could fail if parent is a value from db instead of a value with resolved fields
            // need to test
            switch(parent.id.split("/")[0]) {
                case "transaction":
                    return "BlockchainTransaction";
                default:
                    return null;
            }
        }
    },
};
