// @flow


import type { CollectionInfo } from "./config";
import { QParams } from "./db-types";
import type { OrderBy, QFieldExplanation, QType } from "./db-types";

function isSubSet<T>(subSet: Set<T>, superSet: Set<T>): boolean {
    for (const e of subSet) {
        if (!superSet.has(e)) {
            return false;
        }
    }
    return true;
}

const eqOp = new Set(['==']);
const neOp = new Set(['!=']);
const cmpOp = new Set(['>', '<', '>=', '<=']);

function canUseIndexedRange(ops: Set<string>): boolean {
    return isSubSet(ops, eqOp)
        || isSubSet(ops, neOp)
        || isSubSet(ops, cmpOp);
}

export function isFastQuery(collection: CollectionInfo, type: QType, filter: any, orderBy: OrderBy[]): boolean {
    const params = new QParams({
        explain: true,
    });
    type.ql(params, '', filter);
    const usedIndexes = collection.indexes.map(x => x.join(','));
    if (params.explanation) {
        const fields = [];
        for (const [field, explanation] of params.explanation.fields) {
            if (
                field !== 'CURRENT'
                && canUseIndexedRange(explanation.operations)
            ) {
                fields.push(field.slice(1));
            } else {
                fields.length = 0;
                break;
            }
        }
        console.log('>>>', {
            filter,
            fields,
            usedIndexes,
        });
    }
    return true;
}
