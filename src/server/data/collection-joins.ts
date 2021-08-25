import {
    JoinArgs,
    mergeFieldWithSelectionSet,
} from "../filter/filters";
import {
    FieldNode,
    SelectionSetNode,
    ValueNode,
} from "graphql";
import { QRequestContext } from "../request";
import { AccessRights } from "../auth";
import { QCollectionQuery } from "./collection-query";
import { Span } from "opentracing";
import { QTracer } from "../tracer";
import { QDataCollection } from "./collection";
import {
    joinFields,
} from "../graphql/resolvers-generated";
import QData from "./data";
import QBlockchainData from "./blockchain";

export class QJoinQuery {
    on: string;
    onAttr: string;
    joinField: string;
    args: JoinArgs;
    refCollection: QDataCollection;
    refOn: string;
    refOnAttr: string;
    refOnIsArray: boolean;
    canJoin: (parent: unknown, args: JoinArgs) => boolean;

    constructor(
        join: {
            on: string,
            collection: string,
            refOn: string,
            canJoin: (parent: unknown, args: JoinArgs) => boolean,
        },
        public field: FieldNode,
        data: QData,
    ) {
        this.on = join.on;
        this.onAttr = join.on === "id" ? "_key" : join.on;
        this.joinField = field.name.value;
        this.args = QJoinQuery.parseArgs(field) as JoinArgs;
        this.refCollection = data.collectionsByName.get(join.collection) ?? data.collections[0];
        this.refOnIsArray = join.refOn.endsWith("[*]");
        this.refOn = this.refOnIsArray ? join.refOn.slice(0, -3) : join.refOn;
        this.refOnAttr = this.refOn === "id" ? "_key" : this.refOn;
        this.canJoin = join.canJoin;
    }

    static getJoins(
        mainCollectionName: string,
        mainSelection: SelectionSetNode | undefined,
        data: QBlockchainData,
    ): QJoinQuery[] {
        const joins: QJoinQuery[] = [];

        for (const field of (mainSelection?.selections ?? [])) {
            if (field.kind === "Field") {
                const join = joinFields.get(`${mainCollectionName}.${field.name.value}`);
                if (join !== undefined) {
                    joins.push(new QJoinQuery(join, field, data));
                }
            }
        }
        return joins;
    }

    buildPlan(mainRecords: Record<string, unknown>[]): Map<string, Record<string, unknown>[]> {
        const plan = new Map<string, Record<string, unknown>[]>();
        for (const record of mainRecords) {
            if (this.canJoin(record, this.field.arguments as JoinArgs)) {
                const onValue = record[this.onAttr] as string | string[] | null | undefined;
                if (onValue !== null && onValue !== undefined) {
                    if (Array.isArray(onValue)) {
                        const joins: (Record<string, unknown> | null)[] = [];
                        for (const value of onValue) {
                            const valuePlan = plan.get(value);
                            if (valuePlan !== undefined) {
                                valuePlan.push(record);
                            } else {
                                plan.set(value, [record]);
                            }
                            joins.push(null);
                        }
                        record[this.joinField] = joins;
                    } else {
                        const valuePlan = plan.get(onValue);
                        if (valuePlan !== undefined) {
                            valuePlan.push(record);
                        } else {
                            plan.set(onValue, [record]);
                        }
                    }
                }
            }
        }
        return plan;
    }

    joinRecordToMain(
        mainRecordsByOnValue: Map<string, Record<string, unknown>[]>,
        joinedRecord: Record<string, unknown>,
    ) {
        const joinedLinkValues = joinedRecord[this.refOnAttr] as string;
        for (const joinedLinkValue of Array.isArray(joinedLinkValues) ? joinedLinkValues : [joinedLinkValues]) {
            const mainRecords = mainRecordsByOnValue.get(joinedLinkValue);
            if (mainRecords !== undefined) {
                for (const mainRecord of mainRecords) {
                    const mainLinkValues = mainRecord[this.onAttr];
                    if (Array.isArray(mainLinkValues)) {
                        const joins = mainRecord[this.joinField] as (Record<string, unknown> | null)[];
                        for (let i = 0; i < joins.length; i += 1) {
                            if (mainLinkValues[i] === joinedLinkValue) {
                                joins[i] = joinedRecord;
                            }
                        }
                    } else {
                        mainRecord[this.joinField] = joinedRecord;
                    }
                }
                mainRecordsByOnValue.delete(joinedLinkValue);
            }
        }
    }

    async join(
        mainCollection: QDataCollection,
        mainRecords: Record<string, unknown>[],
        accessRights: AccessRights,
        defaultTimeout: number | undefined,
        request: QRequestContext,
    ): Promise<void> {
        const joinPlan = this.buildPlan(mainRecords);
        const fieldSelection = mergeFieldWithSelectionSet(this.refOn, this.field.selectionSet);
        const timeout = this.args.timeout ?? defaultTimeout ?? 0;
        const timeLimit = Date.now() + timeout;
        while (joinPlan.size > 0) {
            const joinQuery = QCollectionQuery.createForJoin(
                [...joinPlan.keys()],
                this.refCollection.name,
                this.refCollection.docType,
                this.refOn,
                this.refOnIsArray,
                fieldSelection,
                accessRights,
                request.services.config,
            );
            if (joinQuery !== null) {
                const fetcher = async (span: Span) => {
                    span.log({
                        text: joinQuery.text,
                        params: joinQuery.params,
                        shards: joinQuery.shards,
                    });
                    return await this.refCollection.queryProvider(
                        joinQuery.text,
                        joinQuery.params,
                        [],
                        true,
                        request,
                        joinQuery.shards,
                    ) as Record<string, unknown>[];
                };
                const joinedRecords = await QTracer.trace(request.services.tracer, `${mainCollection.name}.query.join`, fetcher, request.requestSpan);
                for (const joinedRecord of joinedRecords) {
                    this.joinRecordToMain(joinPlan, joinedRecord);
                }
                await QJoinQuery.fetchJoinedRecords(this.refCollection, joinedRecords, fieldSelection, accessRights, defaultTimeout, request);
            }
            if (Date.now() > timeLimit) {
                break;
            }
        }

    }

    static async fetchJoinedRecords(
        mainCollection: QDataCollection,
        mainRecords: Record<string, unknown>[],
        mainSelection: SelectionSetNode | undefined,
        accessRights: AccessRights,
        defaultTimeout: number | undefined,
        request: QRequestContext,
    ): Promise<void> {
        const joins = QJoinQuery.getJoins(mainCollection.name, mainSelection, request.services.data);
        for (const join of joins) {
            await join.join(
                mainCollection,
                mainRecords,
                accessRights,
                defaultTimeout,
                request,
            );
        }
    }

    static parseValue(node: ValueNode): unknown {
        switch (node.kind) {
        case "StringValue":
            return node.value;
        case "IntValue":
            return parseInt(node.value);
        case "ObjectValue": {
            const obj: Record<string, unknown> = {};
            for (const field of node.fields) {
                obj[field.name.value] = this.parseValue(field.value);
            }
            return obj;
        }
        case "BooleanValue":
            return node.value;
        case "EnumValue":
            return node.value;
        case "FloatValue":
            return Number(node.value);
        case "NullValue":
            return null;
        case "ListValue": {
            const list = [];
            for (const item of node.values) {
                list.push(this.parseValue(item));
            }
            return list;
        }
        default:
            return undefined;
        }
    }

    static parseArgs(field: FieldNode): Record<string, unknown> {
        const args: Record<string, unknown> = {};
        for (const arg of field.arguments ?? []) {
            const value = this.parseValue(arg.value);
            if (value !== undefined) {
                args[arg.name.value] = value;
            }
        }
        return args;
    }


}
