import { scalarFields } from "../graphql/resolvers-generated";
import {
    QResult,
    Scalar,
} from "./data-provider";

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

export abstract class AggregationQuery {
    abstract getQueryText(): string;

    abstract reduceResult(values: unknown[]): unknown;

    protected constructor(
        public fn: AggregationFn,
        public path: string,
    ) {
    }

    static createForFields(
        collection: string,
        filterText: string,
        fields: FieldAggregation[],
    ): {
        text: string,
        queries: AggregationQuery[],
    } {
        const filter = filterText ? `FILTER ${filterText}` : "";
        const queries: AggregationQuery[] = fields.map(aggregation => {
            const fn = aggregation.fn ?? AggregationFn.COUNT;
            if (fn === AggregationFn.COUNT) {
                return new CountQuery(collection, filter);
            }

            const scalar = scalarFields.get(`${collection}.${aggregation.field}`);
            if (scalar === undefined) {
                throw new Error(`Unknown field [${aggregation.field}]`);
            }

            if (scalar.path === "") {
                throw new Error(`[${aggregation.field}] can't be aggregated`);
            }


            const bigIntPrefix = (scalar.type === "uint1024") ? 2 : (scalar.type === "uint64" ? 1 : 0);
            if (fn === AggregationFn.MIN || fn === AggregationFn.MAX) {
                return new MinMaxQuery(fn, scalar.path, collection, filter, bigIntPrefix);
            }

            if (scalar.type === "number") {
                return new NumberQuery(fn, scalar.path, collection, filter);
            }

            if (bigIntPrefix > 0) {
                return new BigIntQuery(fn, scalar.path, collection, filter, bigIntPrefix);
            }
            throw new Error(`[${aggregation.field}] can't be used with [${fn}]`);
        });

        const text = `
            RETURN [
            ${queries.map(x => x.getQueryText()).join(",\n")}
            ]
        `;
        return {
            text,
            queries,
        };
    }

    static reduceResults(results: QResult[], queries: AggregationQuery[]): unknown[] {
        return queries.map((helper, i) => {
            const values = results.map(x => (x as unknown[])[i]).filter(x => x !== undefined && x !== null);
            return helper.reduceResult(values);
        });

    }
}

class CountQuery extends AggregationQuery {
    constructor(public collection: string, public filter: string) {
        super(AggregationFn.COUNT, "");
    }

    getQueryText(): string {
        return this.filter !== ""
            ? `
                (FOR doc IN ${this.collection}
                ${this.filter}
                COLLECT WITH COUNT INTO c
                RETURN c)[0]
              `
            : `
                LENGTH(${this.collection})
              `;

    }

    reduceResult(values: unknown[]): unknown {
        return reduceValues(values, AggregationFn.SUM, 0);
    }

}

class MinMaxQuery extends AggregationQuery {
    constructor(
        fn: AggregationFn,
        path: string,
        private collection: string,
        private filter: string,
        private bigIntPrefix: number,
    ) {
        super(fn, path);
    }

    getQueryText(): string {
        const collectExpr = isArrayPath(this.path)
            ? `${this.fn}(${this.fn}(${this.path}))`
            : `${this.path}`;

        return `
            (FOR doc IN ${this.collection}
            ${this.filter}
            LET a = ${collectExpr}
            SORT a ${this.fn === AggregationFn.MIN ? "ASC" : "DESC"}
            LIMIT 1
            RETURN a)[0]
        `;
    }

    reduceResult(values: unknown[]): unknown {
        let reduced = reduceValues(values, this.fn, 0);
        if (reduced !== undefined && this.bigIntPrefix > 0) {
            reduced = bigIntStringToDecimalString(reduced, this.bigIntPrefix);
        }
        return reduced;
    }
}

class NumberQuery extends AggregationQuery {
    constructor(
        fn: AggregationFn,
        path: string,
        private collection: string,
        private filter: string,
    ) {
        super(fn, path);
    }

    getQueryText(): string {
        const collectExpr = isArrayPath(this.path)
            ? `${this.fn}(${this.fn}(${this.path}))`
            : `${this.fn}(${this.path})`;

        return `
            (FOR doc IN ${this.collection}
            ${this.filter}
            COLLECT AGGREGATE a = ${collectExpr}
            RETURN a)[0]
        `;
    }

    reduceResult(values: unknown[]): unknown {
        return reduceValues(values, this.fn, 0);
    }
}

class BigIntQuery extends AggregationQuery {
    constructor(
        fn: AggregationFn,
        path: string,
        private collection: string,
        private filter: string,
        private bigIntPrefix: number,
    ) {
        super(fn, path);
    }

    getQueryText(): string {
        const a = bigIntSumExpr(signedBigIntHiPart, this.path, this.bigIntPrefix);
        const b = bigIntSumExpr(signedBigIntLoPart, this.path, this.bigIntPrefix);
        const c = isArrayPath(this.path) ? `SUM(COUNT(${this.path}))` : "COUNT(doc)";
        const collectExpr = this.fn === AggregationFn.AVERAGE
            ? `a = ${a}, b = ${b}, c = ${c}`
            : `a = ${a}, b = ${b}`;
        const returnExpr = this.fn === AggregationFn.AVERAGE ? "{ a, b, c }" : "{ a, b }";
        return `
            (FOR doc IN ${this.collection}
            ${this.filter}
            COLLECT AGGREGATE ${collectExpr}
            RETURN ${returnExpr})[0]
        `;
    }

    reduceResult(values: BigIntParts[]): unknown {
        const converted = values.map(
            this.fn === AggregationFn.AVERAGE
                ? bigIntAvgPartsToBigInt
                : bigIntPartsToBigInt,
        );
        const reduced = reduceValues(converted, this.fn, this.bigIntPrefix);
        return reduced !== undefined ? (reduced as { toString(): string }).toString() : undefined;
    }

}

type BigIntParts = { a: number, b: number, c: number };

function bigIntStringToDecimalString(value: unknown, bigIntPrefix: number): string | bigint {
    if (typeof value === "number") {
        return value.toString();
    }
    if (typeof value !== "string") {
        throw new Error(`Invalid bigint value: ${value}`);
    }
    return value.substr(0, 1) === "-"
        ? BigInt(`-0x${value.substr(bigIntPrefix + 1)}`).toString()
        : BigInt(`0x${value.substr(bigIntPrefix)}`).toString();
}

function isArrayPath(path: string): boolean {
    return path.includes("[*]");
}


// Converters

function reduceValues(values: unknown[], fn: AggregationFn, bigIntPrefix: number): unknown {
    if (values.length === 0) {
        return undefined;
    }
    let reduced = values[0];
    for (let i = 1; i < values.length; i += 1) {
        const value = values[i];
        if (fn === "MIN") {
            if ((value as Scalar) < (reduced as Scalar)) {
                reduced = value;
            }
        } else if (fn === "MAX") {
            if ((value as Scalar) > (reduced as Scalar)) {
                reduced = value;
            }
        } else {
            (reduced as number) += (value as number);
        }
    }
    if (fn === "AVERAGE") {
        if (bigIntPrefix > 0) {
            reduced = (reduced as bigint) / BigInt(values.length);
        } else {
            reduced = Math.trunc((reduced as number) / values.length);
        }
    }
    return reduced;
}

function bigIntPartsToBigInt(parts: BigIntParts): bigint {
    const h = parts.a >= 0
        ? BigInt(`0x${Math.round(parts.a).toString(16)}00000000`)
        : -BigInt(`0x${Math.round(Math.abs(parts.a)).toString(16)}00000000`);
    const l = BigInt(Math.round(parts.b));
    return h + l;
}

function bigIntAvgPartsToBigInt(value: BigIntParts): bigint {
    const sum = bigIntPartsToBigInt(value);
    const count = Number(value.c || 0);
    return count > 0 ? (sum / BigInt(Math.round(count))) : sum;
}

function bigIntToNum(hex: string): string {
    return `TO_NUMBER(CONCAT("0x", ${hex}))`;
}

function negBigIntToNum(hex: string): string {
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

function bigIntSumExpr(part: (path: string, prefix: number) => string, path: string, bigIntPrefix: number) {
    return isArrayPath(path)
        ? `SUM(SUM((${path})[* RETURN ${part("CURRENT", bigIntPrefix)}]))`
        : `SUM(${part(path, bigIntPrefix)})`;
}
