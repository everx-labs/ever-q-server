// @flow

import QBlockchainData from '../data/blockchain';
import { requireGrantedAccess } from '../data/collection';
import { bigUInt2, resolveBigUInt, stringLowerFilter, struct, scalar } from "../filter/filters";
import { QTracer } from '../tracer';
import type { GraphQLRequestContextEx } from "./resolvers-custom";

//------------------------------------------------------------- Counterparties

export const Counterparty = struct({
    account: stringLowerFilter,
    counterparty: stringLowerFilter,
    last_message_at: scalar,
    last_message_id: stringLowerFilter,
    last_message_is_reverse: scalar,
    last_message_value: bigUInt2,
}, true);

async function counterparties(_parent, args, context: GraphQLRequestContextEx): Promise<Object[]> {
    const tracer = context.tracer;
    return QTracer.trace(tracer, 'counterparties', async () => {
        await requireGrantedAccess(context, args);
        let text = "FOR doc IN counterparties FILTER doc.account == @account";
        const vars: any = {
            account: args.account,
            first: Math.min(50, Number.parseInt(args.first || 50)),
        };
        if (args.after) {
            const after = args.after.split("/");
            text += " AND (" +
                "doc.last_message_at > @after_0" +
                " OR doc.last_message_at == @after_0 AND doc.counterparty > @after_1" +
                ")";
            vars.after_0 = Number.parseInt(after[0]);
            vars.after_1 = after[1];
        }
        text += " SORT doc.last_message_at, doc.counterparty LIMIT @first RETURN doc";

        const result: any = await context.data.query(
            context.data.counterparties.provider,
            text,
            vars,
            [{ path: "last_message_at,counterparty", direction: "DESC" }],
        );
        result.forEach(x => x.cursor = `${x.last_message_at}/${x.counterparty}`)
        return result;
    }, QTracer.getParentSpan(tracer, context))
}

export function counterpartiesResolvers(_data: QBlockchainData): any {
    return {
        Counterparty: {
            last_message_value(parent, args) {
                return resolveBigUInt(2, parent.last_message_value, args);
            },
        },
        Query: {
            counterparties,
        },
    };
}
