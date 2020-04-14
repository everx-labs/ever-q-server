import Arango from "../server/arango";
import QLogs from "../server/logs";
import {convertBigUInt, QParams, resolveBigUInt, selectFields} from "../server/db-types";
import {
    Transaction,
    Account,
    Message,
    createResolvers
} from "../server/resolvers-generated";

test("BigUInt", () => {
    expect(convertBigUInt(1, null)).toBeNull();
    expect(convertBigUInt(1, undefined)).toBeUndefined();
    expect(convertBigUInt(1, 0x1)).toEqual('01');
    expect(convertBigUInt(1, 0x100)).toEqual('2100');
    expect(convertBigUInt(1, 0x1000000000)).toEqual('91000000000');
    expect(convertBigUInt(1, 256)).toEqual('2100');
    expect(convertBigUInt(1, '256')).toEqual('2100');
    expect(convertBigUInt(1, '0x256')).toEqual('2256');
    expect(convertBigUInt(1, '0x3100')).toEqual('33100');
    expect(convertBigUInt(1, '3100')).toEqual('2c1c');


    expect(convertBigUInt(1, 478177959234)).toEqual('96f55a09d42'); //0x6F55A09D42
    expect(convertBigUInt(1, '9223372036854775807')).toEqual('f7fffffffffffffff'); //0X7FFFFFFFFFFFFFFF
    expect(convertBigUInt(1, '0X7FFFFFFFFFFFFFFF')).toEqual('f7fffffffffffffff');
    expect(convertBigUInt(1, '18446744073709551615')).toEqual('fffffffffffffffff');
    expect(convertBigUInt(1, Number.MAX_SAFE_INTEGER)).toEqual('d1fffffffffffff');
    // noinspection JSAnnotator
    expect(convertBigUInt(1, 0xffffffffffffffffn)).toEqual('fffffffffffffffff');

    expect(convertBigUInt(2, null)).toBeNull();
    expect(convertBigUInt(2, undefined)).toBeUndefined();
    expect(convertBigUInt(2, 0x1)).toEqual('001');
    expect(convertBigUInt(2, 0x100)).toEqual('02100');
    expect(convertBigUInt(2, 0x1000000000)).toEqual('091000000000');
    expect(convertBigUInt(2, 256)).toEqual('02100');
    expect(convertBigUInt(2, '0x3100')).toEqual('033100');
    expect(convertBigUInt(2, '3100')).toEqual('02c1c');
    expect(convertBigUInt(2, '0x10000000000000000')).toEqual('1010000000000000000');

    expect(resolveBigUInt(1, null)).toBeNull();
    expect(resolveBigUInt(1, undefined)).toBeUndefined();
    expect(resolveBigUInt(1, '01')).toEqual('0x1');
    expect(resolveBigUInt(1, '2100')).toEqual('0x100');
    expect(resolveBigUInt(1, '91000000000')).toEqual('0x1000000000');
    expect(resolveBigUInt(1, '33100')).toEqual('0x3100');

    expect(resolveBigUInt(2, null)).toBeNull();
    expect(resolveBigUInt(2, undefined)).toBeUndefined();
    expect(resolveBigUInt(2, '001')).toEqual('0x1');
    expect(resolveBigUInt(2, '02100')).toEqual('0x100');
    expect(resolveBigUInt(2, '091000000000')).toEqual('0x1000000000');
    expect(resolveBigUInt(2, '033100')).toEqual('0x3100');
    expect(resolveBigUInt(2, '1010000000000000000')).toEqual('0x10000000000000000');
});

test("Filter test", () => {
    expect(Account.test(null, {
        "id": "01d7acd8d454d33c95199346683ef1938d994e6432f1b8a0b11b8eea2556f3b2",
        "_key": "01d7acd8d454d33c95199346683ef1938d994e6432f1b8a0b11b8eea2556f3b2",
        "acc_type": 3,
    }, {
        "id": { "eq": "01d7acd8d454d33c95199346683ef1938d994e6432f1b8a0b11b8eea2556f3b2" },
        "acc_type": { eq: 3 },
    })).toBeTruthy();

    expect(Transaction.test(null, { in_msg: null, }, { in_msg: { ne: null }, })).toBeFalsy();
    expect(Transaction.test(null, { in_msg: null, }, { in_msg: { eq: null }, })).toBeTruthy();
    expect(Transaction.test(null, {}, { in_msg: { ne: null }, })).toBeFalsy();
    expect(Transaction.test(null, {}, { in_msg: { eq: null }, })).toBeTruthy();
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
});

test("Enum Names", () => {
    const db = new Arango({
        database: { server: 'http://0.0.0.0', name: 'blockchain' },
        slowDatabase: { server: 'http://0.0.0.0', name: 'blockchain' }
    }, new QLogs());
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

test("Select Fields", () => {
    const selected = selectFields({
        _key: 'eefae8631f57f44900e572999abe7ed76058ae2ce2d1ef850eecc7ce09250ab3',
        _id: 'blocks/eefae8631f57f44900e572999abe7ed76058ae2ce2d1ef850eecc7ce09250ab3',
        want_split: false,
        seq_no: 19468,
        global_id: 4294967057,
        version: 0,
        gen_validator_list_hash_short: 2348868602,
        created_by: '20f8defd07e745cec86c6b66f71645829d923f4f57cbf75e6f7d3c2423871c6b',
        master: {
            shard_hashes: [{ shard: '1' }, { shard: '2' }],
            max_shard_gen_utime: 1585298974,
        }
    }, [
        {
            name: 'seq_no',
            selection: []
        },
        {
            name: 'master',
            selection: [
                {
                    name: 'shard_hashes',
                    selection: [
                        {
                            name: 'shard',
                            selection: []
                        }
                    ]
                }
            ]
        }
    ]);
    expect(selected).toEqual({
        _key: 'eefae8631f57f44900e572999abe7ed76058ae2ce2d1ef850eecc7ce09250ab3',
        id: 'eefae8631f57f44900e572999abe7ed76058ae2ce2d1ef850eecc7ce09250ab3',
        seq_no: 19468,
        master: { shard_hashes: [{ shard: '1' }, { shard: '2' }] }
    })
});

