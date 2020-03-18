// @flow
import { Def } from "ton-labs-dev-ops/dist/src/schema";
import type { IntSizeType, TypeDef } from "ton-labs-dev-ops/src/schema";

const { ref, arrayOf } = Def;

export const join = (refDef: (string | { [string]: TypeDef }), on: string, refOn: string, preCondition?: string): TypeDef => {
    return {
        ...ref(refDef),
        _: {
            join: {
                on,
                refOn,
                preCondition: (preCondition || ''),
            }
        }
    }
};

export const withDoc = (def: TypeDef, doc?: string) => ({
    ...def,
    ...(doc ? { _doc: doc } : {})
});

export const required = (def: TypeDef) => def;

const uint = (size: IntSizeType, doc?: string) => withDoc({
    _int: { unsigned: true, size }
}, doc);

const int = (size: IntSizeType, doc?: string) => withDoc({
    _int: { unsigned: false, size }
}, doc);

export const i8 = (doc?: string) => int(8, doc);
export const i32 = (doc?: string) => int(32, doc);
export const u8 = (doc?: string) => uint(8, doc);
export const u16 = (doc?: string) => uint(16, doc);
export const u32 = (doc?: string) => uint(32, doc);
export const u64 = (doc?: string) => uint(64, doc);
const u128 = (doc?: string) => uint(128, doc);
const u256 = (doc?: string) => uint(256, doc);

export const grams = u128;

type IntEnumValues = {
    [string]: number
};

export function u8enum(name: string, values: IntEnumValues) {
    return (doc?: string): TypeDef => {
        const valuesDoc = Object.entries(values).map(([name, value]) => {
            return `- ${(value: any)} – ${name}`;
        }).join('\n');
        const effectiveDoc = `${doc ? `${doc}\n` : ''}${valuesDoc}`;
        return withDoc({
            _int: {
                unsigned: true,
                size: 8,
            },
            _: {
                enum: {
                    name,
                    values
                }
            }
        }, effectiveDoc);
    }
}

export const OtherCurrency: TypeDef = {
    currency: u32(),
    value: u256(),
};

export const otherCurrencyCollection = (doc?: string): TypeDef => arrayOf(ref({ OtherCurrency }), doc);
