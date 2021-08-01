import { QResult } from "../data/data-provider";
import { AccessArgs } from "../auth";
import { QRequestContext } from "../request";
import { QTracer } from "../tracer";
import { required } from "../utils";

//------------------------------------------------------------- Query

async function getAccountsCount(_parent: Record<string, unknown>, args: AccessArgs, context: QRequestContext): Promise<number> {
    const {
        tracer,
        data,
    } = context.services;
    return QTracer.trace(tracer, "getAccountsCount", async () => {
        await context.requireGrantedAccess(args);
        const result: QResult = await data.query(
            required(data.accounts.provider),
            "RETURN LENGTH(accounts)",
            {},
            [],
        );
        const counts = (result as number[]);
        return counts.length > 0 ? counts[0] : 0;
    }, QTracer.getParentSpan(tracer, context));
}

async function getTransactionsCount(_parent: Record<string, unknown>, args: AccessArgs, context: QRequestContext): Promise<number> {
    const {
        tracer,
        data,
    } = context.services;
    return QTracer.trace(tracer, "getTransactionsCount", async () => {
        await context.requireGrantedAccess(args);
        const result = await data.query(
            required(data.transactions.provider),
            "RETURN LENGTH(transactions)",
            {},
            [],
        );
        return result.length > 0 ? result[0] as number : 0;
    }, QTracer.getParentSpan(tracer, context));
}

async function getAccountsTotalBalance(_parent: Record<string, unknown>, args: AccessArgs, context: QRequestContext): Promise<string> {
    const {
        tracer,
        data,
    } = context.services;
    return QTracer.trace(tracer, "getAccountsTotalBalance", async () => {
        await context.requireGrantedAccess(args);
        /*
        Because arango can not sum BigInt we need to sum separately:
        hs = SUM of high bits (from 24-bit and higher)
        ls = SUM of lower 24 bits
        And the total result is (hs << 24) + ls
         */
        const result = await data.query(
            required(data.accounts.provider),
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
