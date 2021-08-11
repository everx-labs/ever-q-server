import { AccessArgs, AccessRights } from "../../auth";
import { QParams } from "../../filter/filters";
import { QRequestContext } from "../../request";
import { QTracer } from "../../tracer";
import { QError, required } from "../../utils";

import {
    BlockchainTransaction,
    BlockchainTransactionsConnection,
    Resolvers
} from "./resolvers-types-generated";

const enum Direction {
    Forward,
    Backward,
}

function toU64String(value: number): string {
    const hex = value.toString(16);
    return `${(hex.length - 1).toString(16)}${hex}`;
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

export const resolvers: Resolvers<QRequestContext> = {
    Query: {
        blockchain: () => { return {}; },
    },
    BlockchainQuery: {
        master_seq_no_range: (_parent, args, context) => {
            const tracer = context.services.tracer;
            return QTracer.trace(tracer, "blockchain-master_seq_no_range", async () => {
                await context.requireGrantedAccess(args as AccessArgs);
                const text =
                    `RETURN {
                        _key: UUID(),
                        start: @time_start ? (FOR b IN blocks FILTER b.gen_utime >= @time_start SORT b.gen_utime ASC LIMIT 1 RETURN b.seq_no)[0] : null,
                        end: @time_end ? (FOR b IN blocks FILTER b.gen_utime <= @time_end SORT b.gen_utime DESC LIMIT 1 RETURN b.seq_no)[0] : null
                    }`; // UUID is a hack to bypass QDataCombiner deduplication
                const vars: Record<string, unknown> = {
                    time_start: args.time_start,
                    time_end: args.time_end,
                };
                const result = await context.services.data.query(
                    required(context.services.data.blocks.provider),
                    text,
                    vars,
                    [],
                ) as { start: number, end: number }[];

                let start: number | null = null;
                let end: number | null = null;
                result.forEach(r => {
                    if (r.start && (!start || r.start < start)) {
                        start = r.start;
                    }
                    if (r.end && (!end || r.end > end + 1)) {
                        end = r.end + 1;
                    }
                });
        
                return {
                    start,
                    end
                };
            }, QTracer.getParentSpan(tracer, context));
        },
        account_transactions: async (_parent, args, context, info) => {
            const tracer = context.services.tracer;
            return QTracer.trace(tracer, "blockchain-account_transactions", async () => {
                const accessRights = await context.requireGrantedAccess(args as AccessArgs);
                
                const filters: string[] = [];
                
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
                
                const params = new QParams();
                if (start_chain_order) {
                    const paramName = params.add(start_chain_order);
                    filters.push(`doc.chain_order > @${paramName}`);
                }
                if (end_chain_order) {
                    const paramName = params.add(end_chain_order);
                    filters.push(`doc.chain_order < @${paramName}`);
                }

                // account_addresses
                if (args.account_addresses) {
                    const paramName = params.add(args.account_addresses);
                    filters.push(`doc.account_addr IN @${paramName}`);
                }

                const accessFilter = getAccountAccessRestictionCondition(accessRights, params);
                if (accessFilter) {
                    filters.push(accessFilter);
                }

                // first, last
                if (args.first && args.last) {
                    throw QError.invalidQuery(`"first" and "last" shouldn't be used simultaneously`);
                }
                if (args.first && args.before) {
                    throw QError.invalidQuery(`"first" should not be used with "before"`);
                }
                if (args.last && args.after) {
                    throw QError.invalidQuery(`"last" should not be used with "after"`);
                }
                const limit = 1 + Math.min(50, args.first ?? 50, args.last ?? 50);
                const direction = args.last ? Direction.Backward : Direction.Forward;

                const orderBy = [{ path: "chain_order", direction: "ASC" }];
                const retunExpression = 
                    context.services.data.transactions.buildReturnExpression(
                        info.fieldNodes[0].selectionSet,
                        orderBy,
                    );

                const query = `
                    FOR doc IN transactions
                    FILTER ${filters.join(" AND ")}
                    SORT doc.chain_order ${direction == Direction.Backward ? "DESC" : "ASC"}
                    LIMIT ${limit}
                    ${retunExpression}
                `;

                const result = await context.services.data.query(
                    required(context.services.data.transactions.provider),
                    query,
                    params.values,
                    orderBy,
                ) as BlockchainTransaction[];
                let helperTransaction: BlockchainTransaction | null = null;
                if (result.length > limit) {
                    switch (direction) {
                        case Direction.Forward:
                            helperTransaction = result[limit - 1];
                            result.splice(limit - 1);
                            break;
                        case Direction.Backward: 
                            helperTransaction = result[result.length - limit + 1]
                            result.splice(0, result.length - limit + 1);
                            break;
                    }
                }
                return {
                    edges: result.map(t => {
                        return {
                            node: t,
                            cursor: t.chain_order,
                        };
                    }),
                    pageInfo: {
                        startCursor: result[0].chain_order,
                        endCursor: result[result.length - 1].chain_order,
                        hasNextPage: !!helperTransaction,
                        hasPreviousPage: false,
                    },
                } as BlockchainTransactionsConnection;
            }, QTracer.getParentSpan(tracer, context));
        },
    },
};
