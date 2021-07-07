import type { ScalarField } from "../filter/filters";
import { scalarFields } from "../graphql/resolvers-generated";

export enum AggregationFn {
    COUNT = "COUNT",
    MIN = "MIN",
    MAX = "MAX",
    SUM = "SUM",
    AVERAGE = "AVERAGE",
}


export type FieldAggregation = {
    field: string,
    fn: AggregationFn,
}

type AggregationContext = {
    index: number,
    field: ScalarField,
    fn: AggregationFn,
    bigIntPrefix: number,
    isArray: boolean,
}

type AggregationQueryParts = {
    collect: string,
    result: string,
}

export type AggregationHelper = {
    context: AggregationContext,
    buildQuery: (context: AggregationContext) => AggregationQueryParts,
    convertResult: (context: AggregationContext, value: any) => any,
}

// Query Builders

/**
 * Returns query parts in form of:
 * { collect: 'a<i> = <exprs0>', result: 'a<i>'} if exprs.length === 1
 * or
 * { collect: 'a<i> = <exprs0>, b<i> = <exprs1>, ..'., result: '{ a: a<i>, b: b<i>, ... }'}
 * if exprs.length > 1
 *
 * @param exprs
 * @param context
 * @return {{result: string, collects: string}}
 */
function queryParts(context: AggregationContext, ...exprs: string[]): AggregationQueryParts {
    const n = "abcdef";
    const v = (i: number) => `${n[i]}${context.index}`; // 'a0' | 'b0' | ...
    const collectExpr = (x: string, i: number) => `${v(i)} = ${x}`; // 'a0 = expr[0]' | 'b0 = expr[1]' | ...
    const returnExpr = (_x: string, i: number) => `${n[i]}: ${v(i)}`; // 'a: a0' | 'b: b0' | ...
    return {
        collect: exprs.map(collectExpr).join(", "), // 'a0 = expr[0], b0 = expr[1], ...'
        result: exprs.length === 1
            ? `${v(0)}` // 'a0'
            : `{ ${exprs.map(returnExpr).join(", ")} }`, // '{ a: a0, b: b0, ... }'
    };
}

const countField: ScalarField = {
    type: "string",
    path: "",
};

function count(context: AggregationContext): AggregationQueryParts {
    return queryParts(context, "COUNT(doc)");
}

function simple(context: AggregationContext): AggregationQueryParts {
    const fn = context.fn;
    return queryParts(context, context.isArray
        ? `${fn}(${fn}(${context.field.path}))`
        : `${fn}(${context.field.path})`,
    );
}

function minOrMax(context: AggregationContext): AggregationQueryParts {
    const fn = context.fn;
    return queryParts(context, context.isArray
        ? `${fn}(${fn}(${context.field.path}))`
        : `${fn}(${context.field.path})`,
    );
}

function bigIntToNum(hex: any): string {
    return `TO_NUMBER(CONCAT("0x", ${hex}))`;
}

function negBigIntToNum(hex: any): string {
    return `-(EXP2(LENGTH(${hex}) * 4) - 1 - ${bigIntToNum(hex)})`;
}

function bigIntHiPart(path: string, prefix: number): string {
    return `SUBSTRING(${path}, ${prefix}, LENGTH(${path}) - ${prefix + 8})`;
}

function bigIntLoPart(path: string, prefix: number): string {
    return `RIGHT(SUBSTRING(${path}, ${prefix}), 8)`;
}

function signedBigIntPart(path: string, prefix: number, part: (path: string, prefix: number) => string): string {
    return `SUBSTRING(${path}, 0, 1) == "-"
    ? ${negBigIntToNum(part(path, prefix + 1))}
    : ${bigIntToNum(part(path, prefix))}`;
}

function signedBigIntHiPart(path: string, prefix: number): string {
    return signedBigIntPart(path, prefix, bigIntHiPart);
}

function signedBigIntLoPart(path: string, prefix: number): string {
    return signedBigIntPart(path, prefix, bigIntLoPart);
}

function bigIntSumExpr(part: (path: string, prefix: number) => string, context: AggregationContext) {
    const path = context.field.path;
    const prefix = context.bigIntPrefix;
    return context.isArray
        ? `SUM(SUM((${path})[* RETURN ${part("CURRENT", prefix)}]))`
        : `SUM(${part(path, prefix)})`;
}

function bigIntSum(context: AggregationContext): AggregationQueryParts {
    return queryParts(
        context,
        bigIntSumExpr(signedBigIntHiPart, context),
        bigIntSumExpr(signedBigIntLoPart, context),
    );
}

function bigIntAvg(context: AggregationContext): AggregationQueryParts {
    return queryParts(
        context,
        bigIntSumExpr(signedBigIntHiPart, context),
        bigIntSumExpr(signedBigIntLoPart, context),
        context.isArray
            ? `SUM(COUNT(${context.field.path}))`
            : `COUNT(doc)`,
    );
}

// Converters

function reduce(context: AggregationContext, values: any[], fn: AggregationFn): any {
    let reduced = values[0];
    for (let i = 1; i < values.length; i += 1) {
        const value = values[i];
        if (fn === "MIN") {
            if (value < reduced) {
                reduced = value;
            }
        } else if (fn === "MAX") {
            if (value > reduced) {
                reduced = value;
            }
        } else {
            reduced += value;
        }
    }
    if (fn === "AVERAGE") {
        if (context.bigIntPrefix > 0) {
            reduced = reduced / BigInt(values.length);
        } else {
            reduced = Math.trunc(reduced / values.length);
        }
    }
    return reduced;
}

function reducer(
    convert: (context: AggregationContext, value: any) => any,
    convertBack: (context: AggregationContext, value: any) => any,
    fn: AggregationFn,
): (context: AggregationContext, values: any[]) => any {
    return (context: AggregationContext, values: any[]) => {
        if (values.length === 0) {
            return undefined;
        }
        let reduced = reduce(context, values.map(x => convert(context, x)), fn);
        return convertBack(context, reduced);
    };
}

function noConversion(_context: AggregationContext, x: any) {
    return x;
}

function bigIntStringToDecimalString(context: AggregationContext, value: any): string | bigint {
    if (typeof value === "number") {
        return value.toString();
    }
    return value.substr(0, 1) === "-"
        ? BigInt(`-0x${value.substr(context.bigIntPrefix + 1)}`).toString()
        : BigInt(`0x${value.substr(context.bigIntPrefix)}`).toString();
}

//$FlowFixMe
function bigIntPartsToBigInt(_context: AggregationContext, parts: { a: number, b: number }): bigint {
    const h = parts.a >= 0
        ? BigInt(`0x${Math.round(parts.a).toString(16)}00000000`)
        : -BigInt(`0x${Math.round(Math.abs(parts.a)).toString(16)}00000000`);
    const l = BigInt(Math.round(parts.b));
    return h + l;
}

function toString(_context: AggregationContext, value: any): any {
    return value.toString();
}

function bigIntPartsToBigIntAvg(context: AggregationContext, value: any): bigint {
    const sum = bigIntPartsToBigInt(context, value);
    const count = Number(value.c || 0);
    return count > 0 ? (sum / BigInt(Math.round(count))) : sum;
}

export class AggregationHelperFactory {
    static create(collection: string, index: number, aggregation: FieldAggregation): AggregationHelper {
        const field = scalarFields.get(`${collection}.${aggregation.field || "id"}`) || countField;
        const fn = aggregation.fn || AggregationFn.COUNT;
        const context: AggregationContext = {
            index,
            field,
            fn,
            bigIntPrefix: (field.type === "uint1024") ? 2 : (field.type === "uint64" ? 1 : 0),
            isArray: field.path.includes("[*]"),
        };

        // Case of count
        if (context.fn === AggregationFn.COUNT) {
            return {
                context,
                buildQuery: count,
                convertResult: (context, values) => reduce(context, values, AggregationFn.SUM),
            };
        }

        if (context.field.path === "") {
            throw new Error(`[${aggregation.field}] can't be aggregated`);
        }

        const isMinOrMax = fn === AggregationFn.MIN || fn === AggregationFn.MAX;
        // Case of number fields or min/max fn
        if (field.type === "number" || isMinOrMax) {
            return {
                context,
                buildQuery: isMinOrMax ? minOrMax : simple,
                convertResult: context.bigIntPrefix > 0
                    // big integers
                    ? reducer(noConversion, bigIntStringToDecimalString, fn)
                    // numbers and strings
                    : reducer(noConversion, noConversion, fn),
            };
        }

        if (context.bigIntPrefix > 0) {
            return (context.fn === AggregationFn.AVERAGE)
                ? { // big integer average
                    context,
                    buildQuery: bigIntAvg,
                    convertResult: reducer(bigIntPartsToBigIntAvg, toString, fn),
                } : { // big integer sum
                    context,
                    buildQuery: bigIntSum,
                    convertResult: reducer(bigIntPartsToBigInt, toString, fn),
                };

        }

        throw new Error(`[${aggregation.field}] can't be used with [${fn}]`);
    }

    static createQuery(
        collection: string,
        filter: string,
        fields: FieldAggregation[],
    ): {
        text: string,
        helpers: AggregationHelper[],
    } {
        const filterSection = filter ? `FILTER ${filter}` : "";
        const helpers: AggregationHelper[] = fields.map((aggregation, i) => {
            return AggregationHelperFactory.create(collection, i, aggregation);
        });

        let text;
        const isSingleCount = (fields.length === 1) && (fields[0].fn === AggregationFn.COUNT);
        if (isSingleCount) {
            if (filterSection !== "") {
                text = `
                    FOR doc IN ${collection}
                    ${filterSection}
                    COLLECT WITH COUNT INTO a0
                    RETURN [a0]`;
            } else {
                text = `RETURN [LENGTH(${collection})]`;
            }
        } else {
            const queries = helpers.map(x => x.buildQuery(x.context));
            text = `
                FOR doc IN ${collection}
                ${filterSection}
                COLLECT AGGREGATE ${queries.map(x => x.collect).join(", ")}
                RETURN [${queries.map(x => x.result).join(", ")}]`;
        }
        return {
            text,
            helpers,
        };
    }

    static convertResults(results: any[][], helpers: AggregationHelper[]): any[] {
        return helpers.map((helper, i) => {
            const values = results.map(x => x[i]).filter(x => x !== undefined && x !== null);
            return helper.convertResult(helper.context, values);
        });

    }
}

