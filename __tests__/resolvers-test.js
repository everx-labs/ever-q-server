import { convertBigUInt, resolveBigUInt } from "../server/arango-types";

test("BigUInt", () => {
    expect(convertBigUInt(1, 0x1)).toEqual('11');
    expect(convertBigUInt(1, 0x100)).toEqual('3100');
    expect(convertBigUInt(1, 0x1000000000)).toEqual('a1000000000');
    expect(convertBigUInt(1, 256)).toEqual('3100');
    expect(convertBigUInt(1, '0x3100')).toEqual('43100');
    expect(convertBigUInt(1, '3100')).toEqual('3100');

    expect(convertBigUInt(2, 0x1)).toEqual('011');
    expect(convertBigUInt(2, 0x100)).toEqual('03100');
    expect(convertBigUInt(2, 0x1000000000)).toEqual('0a1000000000');
    expect(convertBigUInt(2, 256)).toEqual('03100');
    expect(convertBigUInt(2, '0x3100')).toEqual('043100');
    expect(convertBigUInt(2, '3100')).toEqual('03100');
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
