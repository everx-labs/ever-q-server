import { AccessArgs } from "../auth";
import { QRequestContext } from "../request";
import { required } from "../utils";

//------------------------------------------------------------- Query

async function getAccountsCount(_parent: Record<string, unknown>, args: AccessArgs, context: QRequestContext): Promise<number> {
    const {
        data,
    } = context.services;
    return context.trace("getAccountsCount", async traceSpan => {
        context.requestTags.hasTotals = true;
        await context.requireGrantedAccess(args);
        const result = await data.query(
            required(data.accounts.provider),
            {
                text: "RETURN LENGTH(accounts)",
                vars: {},
                orderBy: [],
                request: context,
                traceSpan,
            }
        );
        return result.length > 0 ? result.reduce<number>((acc, r) => acc + (r as number), 0) : 0;
    });
}

async function getTransactionsCount(_parent: Record<string, unknown>, args: AccessArgs, context: QRequestContext): Promise<number> {
    const {
        data,
    } = context.services;
    return context.trace("getTransactionsCount", async traceSpan => {
        context.requestTags.hasTotals = true;
        await context.requireGrantedAccess(args);
        const result = await data.query(
            required(data.transactions.provider),
            {
                text: "RETURN LENGTH(transactions)",
                vars: {},
                orderBy: [],
                request: context,
                traceSpan,
            }
        );
        return result.length > 0 ? result.reduce<number>((acc, r) => acc + (r as number), 0) : 0;
    });
}

async function getAccountsTotalBalance(_parent: Record<string, unknown>, args: AccessArgs, context: QRequestContext): Promise<string> {
    const {
        data,
    } = context.services;
    return context.trace("getAccountsTotalBalance", async traceSpan => {
        context.requestTags.hasTotals = true;
        await context.requireGrantedAccess(args);
        /*
        Because arango can not sum BigInt we need to sum separately:
        hs = SUM of high bits (from 24-bit and higher)
        ls = SUM of lower 24 bits
        And the total result is (hs << 24) + ls
         */
        const result = await data.query(
            required(data.accounts.provider),
            {
                text: `
                    LET d = 16777216
                    FOR a in accounts
                    LET b = TO_NUMBER(CONCAT("0x", SUBSTRING(a.balance, 2)))
                    COLLECT AGGREGATE
                        hs = SUM(FLOOR(b / d)),
                        ls = SUM(b % (d - 1))
                    RETURN { hs, ls }
                `,
                vars: {},
                orderBy: [],
                request: context,
                traceSpan,
            }) as { hs: number, ls: number }[];

        return result
            .reduce((acc, r) => acc + (BigInt(r.hs) * BigInt(0x1000000) + BigInt(r.ls)), BigInt(0))
            .toString();
    });
}

export const totalsResolvers = {
    Query: {
        getAccountsCount,
        getTransactionsCount,
        getAccountsTotalBalance,
    },
};
