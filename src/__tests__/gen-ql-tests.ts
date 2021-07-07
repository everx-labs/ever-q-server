import {grantedAccess} from "../server/auth";
import {
    OrderBy,
    QParams,
} from "../server/filter/filters";
import type {GDefinition} from "../server/filter/filters";
import {
    Account,
    BlockSignatures,
    Message,
    Transaction,
} from "../server/graphql/resolvers-generated";
import QLogs from "../server/logs";
import {
    createLocalArangoTestData,
    testServerQuery,
} from "./init-tests";
import {gql} from "apollo-server";
import {QDataCollection} from "../server/data/collection";

test("remove nulls", async () => {
    const data = await testServerQuery(`query { blocks { id master { min_shard_gen_utime } } }`);
    expect(data.blocks.length).toBeGreaterThan(0);

    let block = (await testServerQuery(`
        query {
            blocks(filter: { workchain_id: { eq: 0 } }) { 
                master { min_shard_gen_utime } 
            } 
        }
    `)).blocks[0];
    expect(block).toEqual({ master: null });

    block = (await testServerQuery(`
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
    `)).blocks[0];
    expect(block).toEqual({ master: null });
});

test("multi query", async () => {
    const data = await testServerQuery(`
    query { 
        info { time }
        blocks { id }
        b:blocks { id }
    }
    `);
    expect(data.blocks.length).toBeGreaterThan(0);
});

function selectionInfo(r: string) {
    const operation = gql([`query { collection { ${r} } }`] as any).definitions[0];
    const collection = (operation as any).selectionSet.selections[0];
    return collection.selectionSet;
}

function normalized(s: string): string {
    return s.replace(/\s+/g, " ").trim();
}

test("reduced RETURN", () => {
    const data = createLocalArangoTestData(new QLogs());
    const queryText = (collection: QDataCollection, result: string, orderBy?: OrderBy[]) => normalized(
        collection.createDatabaseQuery(
            {
                filter: {},
                orderBy,
            },
            selectionInfo(result),
            grantedAccess,
        )?.text || "",
    );

    expect(queryText(data.blocks, "seq_no", [{
        path: "gen_utime",
        direction: "ASC",
    }])).toEqual(
        normalized(`
        FOR doc IN blocks SORT doc.gen_utime LIMIT 50 RETURN {
            _key: doc._key,
            seq_no: doc.seq_no,
            gen_utime: doc.gen_utime
        }
    `));

    expect(queryText(data.accounts, "id balance __typename")).toEqual(normalized(`
        FOR doc IN accounts LIMIT 50 RETURN {
            _key: doc._key,
            balance: doc.balance
        }
    `));

    expect(queryText(data.blocks, "value_flow { imported }")).toEqual(normalized(`
        FOR doc IN blocks LIMIT 50 RETURN {
            _key: doc._key,
            value_flow: ( doc.value_flow && {
                imported: doc.value_flow.imported 
            } )
        }
    `));

    expect(queryText(data.blocks, "in_msg_descr { msg_type }")).toEqual(normalized(`
        FOR doc IN blocks LIMIT 50 RETURN {
            _key: doc._key,
            in_msg_descr: ( doc.in_msg_descr && (
                FOR doc__in_msg_descr IN doc.in_msg_descr || [] RETURN { msg_type: doc__in_msg_descr.msg_type } 
            ) )
        }
    `));

    expect(queryText(data.transactions, "in_message { id }")).toEqual(normalized(`
        FOR doc IN transactions LIMIT 50 RETURN {
            _key: doc._key,
            in_msg: doc.in_msg
        }
    `));

    expect(queryText(data.transactions, "out_messages { id }")).toEqual(normalized(`
        FOR doc IN transactions LIMIT 50 RETURN {
            _key: doc._key,
            out_msgs: doc.out_msgs
        }
    `));

    expect(queryText(data.messages, "msg_type_name msg_type")).toEqual(normalized(`
        FOR doc IN messages LIMIT 50 RETURN {
            _key: doc._key,
            msg_type: doc.msg_type
        }
    `));

    expect(queryText(data.blocks, "gen_utime_string")).toEqual(normalized(`
        FOR doc IN blocks LIMIT 50 RETURN {
            _key: doc._key,
            gen_utime: doc.gen_utime
        }
    `));

});

function selection(name: string, selections: GDefinition[]): GDefinition {
    return {
        kind: "Field",
        name: {
            kind: "Name",
            value: name,
        },
        alias: "",
        arguments: [],
        directives: [],
        selectionSet: {
            kind: "SelectionSet",
            selections,
        },
    };
}

test("Include join precondition fields", () => {
    const e = Message.returnExpressions("doc", selection("message", [
        selection("dst_transaction", [selection("id", [])]),
    ]));
    expect(e[0].expression).toEqual(`( doc.message && { _key: doc.message._key, msg_type: doc.message.msg_type } )`);
});


test("Generate Array AQL", () => {
    const params = new QParams();

    params.clear();
    let ql = BlockSignatures.filterCondition(
        params,
        "doc",
        { signatures: { any: { node_id: { eq: "1" } } } },
    );
    expect(ql).toEqual(`@v1 IN doc.signatures[*].node_id`);
    expect(params.values.v1).toEqual("1");

    params.clear();
    ql = BlockSignatures.filterCondition(
        params,
        "doc",
        { signatures: { any: { node_id: { ne: "1" } } } },
    );
    expect(ql).toEqual(`LENGTH(doc.signatures[* FILTER CURRENT.node_id != @v1]) > 0`);
    expect(params.values.v1).toEqual("1");
});

test("Generate AQL", () => {
    const params = new QParams();
    let ql;

    params.clear();
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
    });
    expect(ql)
        .toEqual(`((doc.gen_utime >= @v1) AND (doc.gen_utime <= @v2)) AND ((@v3 IN doc.signatures[*].node_id) OR (@v4 IN doc.signatures[*].node_id))`);
    expect(params.values.v1).toEqual(1);
    expect(params.values.v2).toEqual(2);
    expect(params.values.v3).toEqual("3");
    expect(params.values.v4).toEqual("4");

    params.clear();
    ql = Transaction.filterCondition(params, "doc", { id: { notIn: ["1", "2"] } });
    expect(ql).toEqual(`NOT ((doc._key == @v1) OR (doc._key == @v2))`);
    expect(params.values.v1).toEqual("1");
    expect(params.values.v2).toEqual("2");

    params.clear();
    ql = Transaction.filterCondition(params, "doc", { in_msg: { ne: "1" } });
    expect(ql).toEqual(`doc.in_msg != @v1`);
    expect(params.values.v1).toEqual("1");

    params.clear();
    ql = Transaction.filterCondition(params, "doc", { out_msgs: { any: { ne: "1" } } });
    expect(ql).toEqual(`LENGTH(doc.out_msgs[* FILTER CURRENT != @v1]) > 0`);
    expect(params.values.v1).toEqual("1");

    params.clear();
    ql = Transaction.filterCondition(params, "doc", { out_msgs: { any: { eq: "1" } } });
    expect(ql).toEqual(`@v1 IN doc.out_msgs[*]`);
    expect(params.values.v1).toEqual("1");

    params.clear();
    ql = Message.filterCondition(params, "doc", { value: { ne: null } });
    expect(ql).toEqual(`doc.value != @v1`);
    expect(params.values.v1).toBeNull();

    params.clear();
    ql = Account.filterCondition(params, "doc", { id: { gt: "fff" } });
    expect(ql).toEqual(`TO_STRING(doc._key) > @v1`);
    expect(params.values.v1).toEqual("fff");

    params.clear();
    ql = Account.filterCondition(params, "doc", { id: { eq: "fff" } });
    expect(ql).toEqual(`doc._key == @v1`);
    expect(params.values.v1).toEqual("fff");

    params.clear();
    ql =
        Account.filterCondition(
            params,
            "doc",
            {
                id: { gt: "fff" },
                last_paid: { ge: 20 },
            },
        );
    expect(ql).toEqual(`(TO_STRING(doc._key) > @v1) AND (doc.last_paid >= @v2)`);
    expect(params.values.v1).toEqual("fff");
    expect(params.values.v2).toEqual(20);

    params.clear();
    ql = Message.filterCondition(params, "doc", {
        src: { eq: "1" },
        dst: { eq: "2" },
        OR: {
            src: { eq: "2" },
            dst: { eq: "1" },
        },
    });
    expect(ql).toEqual(`((doc.src == @v1) AND (doc.dst == @v2)) OR ((doc.src == @v3) AND (doc.dst == @v4))`);
    expect(params.values.v1).toEqual("1");
    expect(params.values.v2).toEqual("2");
    expect(params.values.v3).toEqual("2");
    expect(params.values.v4).toEqual("1");
});
