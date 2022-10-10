import QBlockchainData from "../data/blockchain"
import {
    bigUInt2,
    resolveBigUInt,
    stringLowerFilter,
    struct,
    scalar,
    BigIntArgs,
} from "../filter/filters"
import { QRequestContext } from "../request"
import { required } from "../utils"

//------------------------------------------------------------- Counterparties

type CounterpartiesArgs = {
    first?: number | null
    after?: string | null
    account: string
}

type CounterpartiesResult = {
    account?: string
    counterparty?: string
    last_message_at?: number
    last_message_id?: string
    last_message_is_reverse?: boolean
    last_message_value?: string
    cursor?: string
}

export const Counterparty = struct(
    {
        account: stringLowerFilter,
        counterparty: stringLowerFilter,
        last_message_at: scalar,
        last_message_id: stringLowerFilter,
        last_message_is_reverse: scalar,
        last_message_value: bigUInt2,
    },
    true,
)

async function counterparties(
    _parent: unknown,
    args: CounterpartiesArgs,
    context: QRequestContext,
): Promise<CounterpartiesResult[]> {
    return context.trace("counterparties", async traceSpan => {
        let text = "FOR doc IN counterparties FILTER doc.account == @account"
        const vars: Record<string, unknown> = {
            account: args.account,
            first: Math.min(50, args.first ?? 50),
        }
        if (args.after) {
            const after = args.after.split("/")
            text +=
                " AND (" +
                "doc.last_message_at < @after_0" +
                " OR doc.last_message_at == @after_0 AND doc.counterparty < @after_1" +
                ")"
            vars.after_0 = Number.parseInt(after[0])
            vars.after_1 = after[1]
        }
        text +=
            " SORT doc.last_message_at DESC, doc.counterparty DESC LIMIT @first RETURN doc"

        const result = (await context.services.data.query(
            required(context.services.data.counterparties.provider),
            {
                text,
                vars,
                orderBy: [
                    {
                        path: "last_message_at,counterparty",
                        direction: "DESC",
                    },
                ],
                request: context,
                traceSpan,
            },
        )) as CounterpartiesResult[]
        result.forEach(
            x => (x.cursor = `${x.last_message_at}/${x.counterparty}`),
        )
        return result
    })
}

export function counterpartiesResolvers(data: QBlockchainData) {
    return {
        Counterparty: {
            last_message_value(parent: CounterpartiesResult, args: BigIntArgs) {
                return resolveBigUInt(2, parent.last_message_value, args)
            },
        },
        Query: {
            counterparties,
        },
        Subscription: {
            counterparties: data.counterparties.subscriptionResolver(),
        },
    }
}
