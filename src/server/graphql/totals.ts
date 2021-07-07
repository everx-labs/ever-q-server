import { requireGrantedAccess } from "../data/collection";
import { QTracer } from "../tracer";
import type { GraphQLRequestContextEx } from "./context";

declare function BigInt(a: any): any;

//------------------------------------------------------------- Query

async function getAccountsCount(_parent: any, args: any, context: GraphQLRequestContextEx): Promise<number> {
    const tracer = context.tracer;
    return QTracer.trace(tracer, "getAccountsCount", async () => {
        await requireGrantedAccess(context, args);
        const result: any = await context.data.query(
            context.data.accounts.provider,
            `RETURN LENGTH(accounts)`,
            {},
            [],
        );
        const counts = (result as number[]);
        return counts.length > 0 ? counts[0] : 0;
    }, QTracer.getParentSpan(tracer, context));
}

async function getTransactionsCount(_parent: any, args: any, context: GraphQLRequestContextEx): Promise<number> {
    const tracer = context.tracer;
    return QTracer.trace(tracer, "getTransactionsCount", async () => {
        await requireGrantedAccess(context, args);
        const result: any = await context.data.query(
            context.data.transactions.provider,
            `RETURN LENGTH(transactions)`,
            {},
            [],
        );
        const counts = (result as number[]);
        return counts.length > 0 ? counts[0] : 0;
    }, QTracer.getParentSpan(tracer, context));
}

async function getAccountsTotalBalance(_parent: any, args: any, context: GraphQLRequestContextEx): Promise<String> {
    const tracer = context.tracer;
    return QTracer.trace(tracer, "getAccountsTotalBalance", async () => {
        await requireGrantedAccess(context, args);
        /*
        Because arango can not sum BigInt's we need to sum separately:
        hs = SUM of high bits (from 24-bit and higher)
        ls = SUM of lower 24 bits
        And the total result is (hs << 24) + ls
         */
        const result: any = await context.data.query(
            context.data.accounts.provider,
            `
            LET d = 16777216
            FOR a in accounts
            LET b = TO_NUMBER(CONCAT("0x", SUBSTRING(a.balance, 2)))
            COLLECT AGGREGATE
                hs = SUM(FLOOR(b / d)),
                ls = SUM(b % (d - 1))
            RETURN { hs, ls }
        `,
            {},
            []);
        const parts = (result as { hs: number, ls: number }[])[0];
        return (BigInt(parts.hs) * BigInt(0x1000000) + BigInt(parts.ls)).toString();
    }, QTracer.getParentSpan(tracer, context));
}

export const totalsResolvers = {
    Query: {
        getAccountsCount,
        getTransactionsCount,
        getAccountsTotalBalance,
    },
};
