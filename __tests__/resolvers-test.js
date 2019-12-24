import Arango from "../server/arango";
import QLogs from "../server/logs";
import { convertBigUInt, QParams, resolveBigUInt } from "../server/q-types";
import {
    Transaction,
    Account,
    Message,
    createResolvers
} from "../server/resolvers-generated";

test("BigUInt", () => {
    expect(convertBigUInt(1, 0x1)).toEqual('11');
    expect(convertBigUInt(1, 0x100)).toEqual('3100');
    expect(convertBigUInt(1, 0x1000000000)).toEqual('a1000000000');
    expect(convertBigUInt(1, 256)).toEqual('3100');
    expect(convertBigUInt(1, '256')).toEqual('3100');
    expect(convertBigUInt(1, '0x256')).toEqual('3256');
    expect(convertBigUInt(1, '0x3100')).toEqual('43100');
    expect(convertBigUInt(1, '3100')).toEqual('3c1c');

    expect(convertBigUInt(2, 0x1)).toEqual('011');
    expect(convertBigUInt(2, 0x100)).toEqual('03100');
    expect(convertBigUInt(2, 0x1000000000)).toEqual('0a1000000000');
    expect(convertBigUInt(2, 256)).toEqual('03100');
    expect(convertBigUInt(2, '0x3100')).toEqual('043100');
    expect(convertBigUInt(2, '3100')).toEqual('03c1c');
    expect(convertBigUInt(2, '0x10000000000000000')).toEqual('1110000000000000000');

    expect(resolveBigUInt(1, '11')).toEqual('0x1');
    expect(resolveBigUInt(1, '3100')).toEqual('0x100');
    expect(resolveBigUInt(1, 'a1000000000')).toEqual('0x1000000000');
    expect(resolveBigUInt(1, '43100')).toEqual('0x3100');
    expect(resolveBigUInt(2, '011')).toEqual('0x1');

    expect(resolveBigUInt(2, '03100')).toEqual('0x100');
    expect(resolveBigUInt(2, '0a1000000000')).toEqual('0x1000000000');
    expect(resolveBigUInt(2, '043100')).toEqual('0x3100');
    expect(resolveBigUInt(2, '1110000000000000000')).toEqual('0x10000000000000000');
});

test("Filter test", () => {
    const filter = {
        "id": { "eq": "01d7acd8d454d33c95199346683ef1938d994e6432f1b8a0b11b8eea2556f3b2" },
        "acc_type": { eq: 3 },
    };
    const doc = {
        "id": "01d7acd8d454d33c95199346683ef1938d994e6432f1b8a0b11b8eea2556f3b2",
        "_key": "01d7acd8d454d33c95199346683ef1938d994e6432f1b8a0b11b8eea2556f3b2",
        "acc_type": 3,
    };
    expect(Account.test(null, doc, filter)).toBeTruthy();
});

test("Generate AQL", () => {
    const params = new QParams();
    let ql = Transaction.ql(params, 'doc', { in_msg: { ne: "1" } });
    expect(ql).toEqual(`doc.in_msg != @v1`);
    expect(params.values.v1).toEqual('1');

    params.clear();
    ql = Transaction.ql(params, 'doc', { out_msgs: { any: { ne: "1" } } });
    expect(ql).toEqual(`LENGTH(doc.out_msgs[* FILTER CURRENT != @v1]) > 0`);
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
});

test("Enum Names", () => {
    const db = new Arango({ database: { server: 'http://0.0.0.0', name: 'blockchain' } }, new QLogs());
    const params = new QParams();
    const resolvers = createResolvers(db);
    const m1 = {
        msg_type: 1,
    };
    const m2 = {
        ...m1,
        msg_type_name: resolvers.Message.msg_type_name(m1),
    };
    expect(m2.msg_type_name).toEqual('ExtIn');
    expect(resolvers.Message.msg_type_name({ msg_type: 0 })).toEqual('Internal');

    let ql = Message.ql(params, 'doc', { msg_type_name: { eq: "ExtIn" } });
    expect(ql).toEqual(`doc.msg_type == @v1`);
    expect(params.values.v1).toEqual(1);

    params.clear();
    ql = Message.ql(params, 'doc', { msg_type_name: { eq: "Internal" } });
    expect(ql).toEqual(`doc.msg_type == @v1`);
    expect(params.values.v1).toEqual(0);

    expect(Message.test(null, m1, { msg_type_name: { eq: "ExtIn" } })).toBeTruthy();
    expect(Message.test(null, { msg_type: 0 }, { msg_type_name: { eq: "Internal" } })).toBeTruthy();

    params.clear();
    ql = Message.ql(params, 'doc', { msg_type_name: { in: ["Internal"] } });
    expect(ql).toEqual(`doc.msg_type == @v1`);
    expect(params.values.v1).toEqual(0);

    expect(Message.test(null, m1, { msg_type_name: { in: ["ExtIn"] } })).toBeTruthy();
});
