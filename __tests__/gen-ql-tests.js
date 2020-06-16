import {QParams} from "../server/db-types";
import {Account, BlockSignatures, Message, Transaction} from "../server/resolvers-generated";

test("Generate Array AQL", () => {
    const params = new QParams();

    params.clear();
    let ql = BlockSignatures.ql(params, 'doc', { signatures: { any: { node_id: { eq: "1" } } } });
    expect(ql).toEqual(`@v1 IN doc.signatures[*].node_id`);
    expect(params.values.v1).toEqual('1');

    params.clear();
    ql = BlockSignatures.ql(params, 'doc', { signatures: { any: { node_id: { ne: "1" } } } });
    expect(ql).toEqual(`LENGTH(doc.signatures[* FILTER CURRENT.node_id != @v1]) > 0`);
    expect(params.values.v1).toEqual('1');
});

test("Generate AQL", () => {
    const params = new QParams();
    let ql;

    params.clear();
    ql = BlockSignatures.ql(params, 'doc', {
        gen_utime: { ge: 1, le: 2 },
        signatures: {
            any: {
                node_id: { in: ["3", "4"] }
            }
        }
    });
    expect(ql).toEqual(`((doc.gen_utime >= @v1) AND (doc.gen_utime <= @v2)) AND ((@v3 IN doc.signatures[*].node_id) OR (@v4 IN doc.signatures[*].node_id))`);
    expect(params.values.v1).toEqual(1);
    expect(params.values.v2).toEqual(2);
    expect(params.values.v3).toEqual('3');
    expect(params.values.v4).toEqual('4');

    params.clear();
    ql = Transaction.ql(params, 'doc', { in_msg: { ne: "1" } });
    expect(ql).toEqual(`doc.in_msg != @v1`);
    expect(params.values.v1).toEqual('1');

    params.clear();
    ql = Transaction.ql(params, 'doc', { out_msgs: { any: { ne: "1" } } });
    expect(ql).toEqual(`LENGTH(doc.out_msgs[* FILTER CURRENT != @v1]) > 0`);
    expect(params.values.v1).toEqual('1');

    params.clear();
    ql = Transaction.ql(params, 'doc', { out_msgs: { any: { eq: "1" } } });
    expect(ql).toEqual(`@v1 IN doc.out_msgs[*]`);
    expect(params.values.v1).toEqual('1');

    params.clear();
    ql = Account.ql(params, 'doc', { id: { gt: 'fff' } });
    expect(ql).toEqual(`TO_STRING(doc._key) > @v1`);
    expect(params.values.v1).toEqual('fff');

    params.clear();
    ql = Account.ql(params, 'doc', { id: { eq: 'fff' } });
    expect(ql).toEqual(`doc._key == @v1`);
    expect(params.values.v1).toEqual('fff');

    params.clear();
    ql = Account.ql(params, 'doc', { id: { gt: 'fff' }, last_paid: { ge: 20 } });
    expect(ql).toEqual(`(TO_STRING(doc._key) > @v1) AND (doc.last_paid >= @v2)`);
    expect(params.values.v1).toEqual('fff');
    expect(params.values.v2).toEqual(20);

    params.clear();
    ql = Message.ql(params, 'doc', {
        src: { eq: '1' },
        dst: { eq: '2' },
        OR: {
            src: { eq: '2' },
            dst: { eq: '1' },
        }
    });
    expect(ql).toEqual(`((doc.src == @v1) AND (doc.dst == @v2)) OR ((doc.src == @v3) AND (doc.dst == @v4))`);
    expect(params.values.v1).toEqual('1');
    expect(params.values.v2).toEqual('2');
    expect(params.values.v3).toEqual('2');
    expect(params.values.v4).toEqual('1');
});
