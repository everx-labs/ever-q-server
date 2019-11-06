import { convertBigUInt, resolveBigUInt } from "../server/arango-types";

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

const resolvers = require('../server/arango-resolvers.v1');

test("Filter test", () => {
    const filter = {
        "id": { "eq": "01d7acd8d454d33c95199346683ef1938d994e6432f1b8a0b11b8eea2556f3b2" },
        "storage": {
            "state": {
                "AccountActive": {
                    "code": { "gt": "" },
                    "data": { "gt": "" }
                }
            }
        }
    };
    const doc = {
        "id": "01d7acd8d454d33c95199346683ef1938d994e6432f1b8a0b11b8eea2556f3b2",
        "_key": "01d7acd8d454d33c95199346683ef1938d994e6432f1b8a0b11b8eea2556f3b2",
        "storage": {
            "state": {
                "AccountActive": {
                    "code": "1",
                    "data": "1",
                },
                "AccountUninit": {
                    "None": null,
                    "__typename": "None"
                },
                "__typename": "AccountStorageStateAccountUninitVariant"
            }, "__typename": "AccountStorage"
        }, "__typename": "Account"
    };

    console.log('>>>', resolvers.Account.test(doc, filter));
});
