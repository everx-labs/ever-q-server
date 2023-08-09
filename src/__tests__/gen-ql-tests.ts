import { QParams } from "../server/filter/filters"
import {
    Account,
    Block,
    BlockSignatures,
    Message,
    Transaction,
} from "../server/graphql/resolvers-generated"
import QLogs from "../server/logs"
import {
    createLocalArangoTestData,
    normalized,
    queryText,
    selectionInfo,
    testServerQuery,
} from "./init-tests"
import { FieldNode, SelectionNode } from "graphql"
import { FilterOrConversion } from "../server/config"
import { QCollectionQuery } from "../server/data/collection-query"
import { overrideAccountBocFilter } from "../server/graphql/account-boc"

type Blocks = {
    blocks: {
        id: string
        master: unknown[] | null
    }[]
}
test("remove nulls", async () => {
    const data = await testServerQuery<Blocks>(
        "query { blocks { id master { min_shard_gen_utime } } }",
    )
    expect(data.blocks.length).toBeGreaterThan(0)

    let block = (
        await testServerQuery<Blocks>(`
        query {
            blocks(filter: { workchain_id: { eq: 0 } }) {
                master { min_shard_gen_utime }
            }
        }
    `)
    ).blocks[0]
    expect(block).toEqual({ master: null })

    block = (
        await testServerQuery<Blocks>(`
        query {
            blocks(filter: { workchain_id: { eq: 0 } }) {
                master {
                    shard_hashes {
                      workchain_id
                      shard
                      descr {seq_no}
                    }
                }
            }
        }
    `)
    ).blocks[0]
    expect(block).toEqual({ master: null })
})

test("multi query", async () => {
    const data = await testServerQuery<Blocks>(`
    query {
        info { time }
        blocks { id }
        b:blocks { id }
    }
    `)
    expect(data.blocks.length).toBeGreaterThan(0)
})

test("{in: null} should raise helpful error message", async () => {
    expect(Block.test({}, "", { id: { in: null } })).toBeFalsy()
    expect(Block.test({}, "", { id: { notIn: null } })).toBeFalsy()
    try {
        await testServerQuery<Blocks>(`
        query {
            blocks(filter:{id:{in:null}}) { id }
        }
        `)
    } catch (err: any) {
        expect(
            err.message.startsWith("Cannot read properties of null"),
        ).toBeFalsy()
    }
})

/*
for doc in messages
filter
doc.src == "-1:0000000000000000000000000000000000000000000000000000000000000000"
or doc.dst == "-1:0000000000000000000000000000000000000000000000000000000000000000"
sort doc.created_at
limit 50
return {created_at:doc.created_at, src:doc.src, dst:doc.dst, id:doc._key}

for doc in UNION_DISTINCT(

(
for doc in messages
filter
doc.src == "0:86c4e9e0a97e48a69782206417764488b1ad56d1af24e276e42bf137352ee6f7"
sort doc.created_at
limit 50
return {created_at:doc.created_at, src:doc.src, dst:doc.dst, id:doc._key}
)
,
(
for doc in messages
filter
doc.dst == "0:86c4e9e0a97e48a69782206417764488b1ad56d1af24e276e42bf137352ee6f7"
sort doc.created_at
limit 50
return {created_at:doc.created_at, src:doc.src, dst:doc.dst, id:doc._key}
)
)

sort doc.created_at
limit 50
return doc

 */

test("OR conversions", () => {
    const data = createLocalArangoTestData(new QLogs())
    const withOr = normalized(
        QCollectionQuery.create(
            {
                ...data.filterConfig,
                orConversion: FilterOrConversion.OR_OPERATOR,
            },
            { expectedAccountBocVersion: 1 },
            data.messages.name,
            data.messages.docType,
            {
                filter: {
                    src: { eq: "1" },
                    OR: { dst: { eq: "1" } },
                },
                orderBy: [
                    {
                        path: "created_at",
                        direction: "ASC",
                    },
                ],
            },
            selectionInfo("src dst"),
        )?.text ?? "",
    )

    expect(withOr).toEqual(
        normalized(`
        FOR doc IN messages
        FILTER (doc.src == @v1) OR (doc.dst == @v2)
        SORT doc.created_at
        LIMIT 50
        RETURN { _key: doc._key, src: doc.src, dst: doc.dst, created_at: doc.created_at }
    `),
    )

    const withSubQueries = normalized(
        QCollectionQuery.create(
            {
                ...data.filterConfig,
                orConversion: FilterOrConversion.SUB_QUERIES,
            },
            { expectedAccountBocVersion: 1 },
            data.messages.name,
            data.messages.docType,
            {
                filter: {
                    src: { eq: "1" },
                    OR: { dst: { eq: "1" } },
                },
                orderBy: [
                    {
                        path: "created_at",
                        direction: "ASC",
                    },
                ],
            },
            selectionInfo("src dst"),
        )?.text ?? "",
    )

    expect(withSubQueries).toEqual(
        normalized(`
        FOR doc IN UNION_DISTINCT(
            FOR doc IN messages
            FILTER doc.src == @v1
            SORT doc.created_at
            LIMIT 50
            RETURN { _key: doc._key, src: doc.src, dst: doc.dst, created_at: doc.created_at }
            ,
            FOR doc IN messages
            FILTER doc.dst == @v2
            SORT doc.created_at
            LIMIT 50
            RETURN { _key: doc._key, src: doc.src, dst: doc.dst, created_at: doc.created_at }
        )
        SORT doc.created_at
        LIMIT 50
        RETURN doc
    `),
    )
})

test("reduced RETURN", () => {
    const data = createLocalArangoTestData(new QLogs())
    const blocks = data.blocks
    const accounts = data.accounts
    const transactions = data.transactions
    const messages = data.messages

    expect(
        queryText(blocks, "seq_no", [
            {
                path: "gen_utime",
                direction: "ASC",
            },
        ]),
    ).toEqual(
        normalized(`
        FOR doc IN blocks SORT doc.gen_utime LIMIT 50 RETURN {
            _key: doc._key,
            seq_no: doc.seq_no,
            gen_utime: doc.gen_utime
        }
    `),
    )

    expect(queryText(accounts, "id balance __typename")).toEqual(
        normalized(`
        FOR doc IN accounts LIMIT 50 RETURN {
            _key: doc._key,
            balance: doc.balance
        }
    `),
    )

    expect(queryText(blocks, "value_flow { imported }")).toEqual(
        normalized(`
        FOR doc IN blocks LIMIT 50 RETURN {
            _key: doc._key,
            value_flow: ( doc.value_flow && {
                imported: doc.value_flow.imported
            } )
        }
    `),
    )

    expect(queryText(blocks, "in_msg_descr { msg_type }")).toEqual(
        normalized(`
        FOR doc IN blocks LIMIT 50 RETURN {
            _key: doc._key,
            in_msg_descr: ( doc.in_msg_descr && (
                FOR doc__in_msg_descr IN doc.in_msg_descr || [] RETURN { msg_type: doc__in_msg_descr.msg_type }
            ) )
        }
    `),
    )

    expect(queryText(transactions, "in_message { id }")).toEqual(
        normalized(`
        FOR doc IN transactions LIMIT 50 RETURN {
            _key: doc._key,
            in_msg: doc.in_msg
        }
    `),
    )

    expect(queryText(transactions, "out_messages { id }")).toEqual(
        normalized(`
        FOR doc IN transactions LIMIT 50 RETURN {
            _key: doc._key,
            out_msgs: doc.out_msgs
        }
    `),
    )

    expect(queryText(messages, "msg_type_name msg_type")).toEqual(
        normalized(`
        FOR doc IN messages LIMIT 50 RETURN {
            _key: doc._key,
            msg_type: doc.msg_type
        }
    `),
    )

    expect(queryText(blocks, "gen_utime_string")).toEqual(
        normalized(`
        FOR doc IN blocks LIMIT 50 RETURN {
            _key: doc._key,
            gen_utime: doc.gen_utime
        }
    `),
    )

    expect(
        queryText(
            blocks,
            "id",
            [
                {
                    path: "seq_no",
                    direction: "DESC",
                },
            ],
            undefined,
            {
                workchain_id: { eq: -1 },
            },
            1,
        ),
    ).toEqual(
        normalized(`
        FOR doc IN blocks
        FILTER doc.workchain_id == @v1 SORT doc.seq_no DESC
        LIMIT 1
        RETURN {
            _key: doc._key,
            seq_no: doc.seq_no
        }
    `),
    )
})

function selection(name: string, selections: SelectionNode[]): FieldNode {
    return {
        kind: "Field",
        name: {
            kind: "Name",
            value: name,
        },
        arguments: [],
        directives: [],
        selectionSet: {
            kind: "SelectionSet",
            selections,
        },
    }
}

test("Include join precondition fields", () => {
    const e = Message.returnExpressions(
        {
            expectedAccountBocVersion: 1,
        },
        "doc",
        selection("message", [
            selection("dst_transaction", [selection("id", [])]),
        ]),
    )
    expect(e[0].expression).toEqual(
        "( doc.message && { _key: doc.message._key, msg_type: doc.message.msg_type } )",
    )
})

test("Generate Array AQL", () => {
    const params = new QParams()

    params.clear()
    let ql = BlockSignatures.filterCondition(params, "doc", {
        signatures: { any: { node_id: { eq: "1" } } },
    })
    expect(ql).toEqual("@v1 IN doc.signatures[*].node_id")
    expect(params.values.v1).toEqual("1")

    params.clear()
    ql = BlockSignatures.filterCondition(params, "doc", {
        signatures: { any: { node_id: { ne: "1" } } },
    })
    expect(ql).toEqual(
        "LENGTH(doc.signatures[* FILTER CURRENT.node_id != @v1]) > 0",
    )
    expect(params.values.v1).toEqual("1")
})

test("Generate AQL", () => {
    const params = new QParams()
    let ql

    params.clear()
    ql = BlockSignatures.filterCondition(params, "doc", {
        gen_utime: {
            ge: 1,
            le: 2,
        },
        signatures: {
            any: {
                node_id: { in: ["3", "4"] },
            },
        },
    })
    expect(ql).toEqual(
        "((doc.gen_utime >= @v1) AND (doc.gen_utime <= @v2)) AND ((@v3 IN doc.signatures[*].node_id) OR (@v4 IN doc.signatures[*].node_id))",
    )
    expect(params.values.v1).toEqual(1)
    expect(params.values.v2).toEqual(2)
    expect(params.values.v3).toEqual("3")
    expect(params.values.v4).toEqual("4")

    params.clear()
    ql = Transaction.filterCondition(params, "doc", {
        id: { notIn: ["1", "2"] },
    })
    expect(ql).toEqual("NOT ((doc._key == @v1) OR (doc._key == @v2))")
    expect(params.values.v1).toEqual("1")
    expect(params.values.v2).toEqual("2")

    params.clear()
    ql = Transaction.filterCondition(params, "doc", {
        id: { in: [] },
    })
    expect(ql).toEqual("FALSE")
    expect(params.values).toEqual({})

    params.clear()
    ql = Transaction.filterCondition(params, "doc", {
        id: { notIn: [] },
    })
    expect(ql).toEqual("TRUE")
    expect(params.values).toEqual({})

    params.clear()
    ql = Transaction.filterCondition(params, "doc", { in_msg: { ne: "1" } })
    expect(ql).toEqual("doc.in_msg != @v1")
    expect(params.values.v1).toEqual("1")

    params.clear()
    ql = Transaction.filterCondition(params, "doc", {
        out_msgs: { any: { ne: "1" } },
    })
    expect(ql).toEqual("LENGTH(doc.out_msgs[* FILTER CURRENT != @v1]) > 0")
    expect(params.values.v1).toEqual("1")

    params.clear()
    ql = Transaction.filterCondition(params, "doc", {
        out_msgs: { any: { eq: "1" } },
    })
    expect(ql).toEqual("@v1 IN doc.out_msgs[*]")
    expect(params.values.v1).toEqual("1")

    params.clear()
    ql = Message.filterCondition(params, "doc", { value: { ne: null } })
    expect(ql).toEqual("doc.value != @v1")
    expect(params.values.v1).toBeNull()

    params.clear()
    params.stringifyKeyInAqlComparison = true
    ql = Account.filterCondition(params, "doc", { id: { gt: "fff" } })
    expect(ql).toEqual("TO_STRING(doc._key) > @v1")
    expect(params.values.v1).toEqual("fff")

    params.clear()
    params.stringifyKeyInAqlComparison = false
    ql = Account.filterCondition(params, "doc", { id: { gt: "fff" } })
    expect(ql).toEqual("doc._key > @v1")
    expect(params.values.v1).toEqual("fff")

    params.clear()
    ql = Account.filterCondition(params, "doc", { id: { eq: "fff" } })
    expect(ql).toEqual("doc._key == @v1")
    expect(params.values.v1).toEqual("fff")

    params.clear()
    params.stringifyKeyInAqlComparison = true
    ql = Account.filterCondition(params, "doc", {
        id: { gt: "fff" },
        last_paid: { ge: 20 },
    })
    expect(ql).toEqual("(TO_STRING(doc._key) > @v1) AND (doc.last_paid >= @v2)")
    expect(params.values.v1).toEqual("fff")
    expect(params.values.v2).toEqual(20)

    params.clear()
    params.stringifyKeyInAqlComparison = false
    ql = Message.filterCondition(params, "doc", {
        src: { eq: "1" },
        dst: { eq: "2" },
        OR: {
            src: { eq: "2" },
            dst: { eq: "1" },
        },
    })
    expect(ql).toEqual(
        "((doc.src == @v1) AND (doc.dst == @v2)) OR ((doc.src == @v3) AND (doc.dst == @v4))",
    )
    expect(params.values.v1).toEqual("1")
    expect(params.values.v2).toEqual("2")
    expect(params.values.v3).toEqual("2")
    expect(params.values.v4).toEqual("1")
})

test("Account BOC versioning", () => {
    overrideAccountBocFilter()
    const e2 = Account.returnExpressions(
        {
            expectedAccountBocVersion: 2,
        },
        "doc",
        selection("account", [selection("boc", [])]),
    )
    expect(e2[0].expression).toEqual(
        "( doc.account && { boc: doc.account.boc } )",
    )
    const e1 = Account.returnExpressions(
        {
            expectedAccountBocVersion: 1,
        },
        "doc",
        selection("account", [selection("boc", [])]),
    )
    expect(e1[0].expression).toEqual(
        "( doc.account && { boc: doc.account.boc1 || doc.account.boc } )",
    )
})

test("Use null in queries", () => {
    const params = new QParams()

    params.clear()
    const ql = Account.filterCondition(params, "doc", { last_paid: null })
    expect(ql).toBeNull()
})
