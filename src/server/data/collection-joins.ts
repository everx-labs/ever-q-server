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
import { QDataCollection } from "./collection";
import {
    joinFields,
} from "../graphql/resolvers-generated";
import QData from "./data";
import QBlockchainData from "./blockchain";
import { QTraceSpan } from "../tracing";
import { arraysAreEqual, required } from "../utils";

export class QJoinQuery {
    on: string;
    onAttr: string;
    joinField: string;
    args: JoinArgs;
    refCollection: QDataCollection;
    refOn: string;
    refOnAttr: string;
    refOnIsArray: boolean;
    shardOn?: string;
    shardOnShardingDegree: number;
    canJoin: (parent: unknown, args: JoinArgs) => boolean;
    fieldSelection: SelectionSetNode;

    constructor(
        join: {
            on: string,
            collection: string,
            refOn: string,
            shardOn?: string,
            canJoin: (parent: unknown, args: JoinArgs) => boolean,
        },
        public field: FieldNode,
        data: QData,
        public mainCollectionName: string,
    ) {
        this.on = join.on;
        this.onAttr = join.on === "id" ? "_key" : join.on;
        this.joinField = field.name.value;
        this.args = QJoinQuery.parseArgs(field) as JoinArgs;
        this.refCollection = data.collectionsByName.get(join.collection) ?? data.collections[0];
        this.refOnIsArray = join.refOn.endsWith("[*]");
        this.refOn = this.refOnIsArray ? join.refOn.slice(0, -3) : join.refOn;
        this.refOnAttr = this.refOn === "id" ? "_key" : this.refOn;
        this.shardOn = join.shardOn === "id" ? "_key": join.shardOn;
        this.canJoin = join.canJoin;
        this.fieldSelection = mergeFieldWithSelectionSet(this.refOn, this.field.selectionSet);

        const mainCollectionProvider = required(data.collectionsByName.get(mainCollectionName)?.provider);
        const refCollectionProvider = required(this.refCollection.provider);
        const mainShardingDegree = mainCollectionProvider.shardingDegree;
        const refShardingDegree = refCollectionProvider.shardingDegree;
        this.shardOnShardingDegree = Math.min(mainShardingDegree, refShardingDegree);
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
                    joins.push(new QJoinQuery(join, field, data, mainCollectionName));
                }
            }
        }
        return joins;
    }

    buildPlan(mainRecords: Record<string, unknown>[]): JoinPlan {
        const plan = new Map<Shard, Map<OnValue, MainRecord[]>>();
        const shards = new Map<OnValue, Shard>();
        for (const record of mainRecords) {
            if (!this.canJoin(record, this.args)) {
                continue;
            }

            const onValue = record[this.onAttr] as string | string[] | null | undefined;
            if (onValue === null || onValue === undefined) {
                continue;
            }

            if (Array.isArray(onValue)) {
                const joins: (Record<string, unknown> | null)[] = [];
                for (const value of onValue) {
                    processValue(value, record, this);
                    joins.push(null);
                }
                record[this.joinField] = joins;
            } else {
                processValue(onValue, record, this);
            }
        }
        return plan;

        function processValue(value: string, record: MainRecord, joinQuery: QJoinQuery) {
            const shard = getShard(value, record, joinQuery);
            let shardPlan = plan.get(shard);
            if (shardPlan === undefined) {
                shardPlan = new Map<OnValue, MainRecord[]>();
                plan.set(shard, shardPlan);
            }

            const valuePlan = shardPlan.get(value);
            if (valuePlan !== undefined) {
                valuePlan.push(record);
            } else {
                shardPlan.set(value, [record]);
            }
        }

        function getShard(value: string, record: MainRecord, joinQuery: QJoinQuery): string | null {
            if (joinQuery.shardOn === undefined) {
                return null;
            }

            let shard = shards.get(value);
            if (shard !== undefined) {
                return shard;
            }

            [shard] = QCollectionQuery.getShards(
                joinQuery.mainCollectionName,
                { [joinQuery.shardOn]: { eq: record[joinQuery.shardOn] } },
                joinQuery.shardOnShardingDegree,
            ) ?? [null];

            shards.set(value, shard);
            return shard;
        }
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
        traceSpan: QTraceSpan,
    ): Promise<void> {
        const joinPlan = this.buildPlan(mainRecords);
        const timeout = this.args.timeout ?? defaultTimeout ?? 0;
        const timeLimit = Date.now() + timeout;
        let joinedRecords: Record<string, unknown>[] = [];
        const shards = [...joinPlan.keys()];
        for (const shard of shards) {
            const shardPlan = joinPlan.get(shard);
            if (shardPlan === undefined) {
                throw new Error("This error should be impossible in join fetcher");
            }
            let prevPortionOnValues = [] as string[];
            while (shardPlan.size > 0) {
                const portionOnValues =[...shardPlan.keys()].slice(0, 100);
                if (arraysAreEqual(portionOnValues, prevPortionOnValues)) {
                    // throttle repeated queries to 5 times per second
                    await new Promise((resolve) => setTimeout(resolve, 200));
                }
                prevPortionOnValues = portionOnValues;
                const joinQuery = QCollectionQuery.createForJoin(
                    portionOnValues,
                    this.refCollection.name,
                    this.refCollection.docType,
                    this.refOn,
                    this.refOnIsArray,
                    this.fieldSelection,
                    accessRights,
                    required(this.refCollection.provider).shardingDegree,
                    request.services.config,
                );
                if (joinQuery !== null) {
                    const fetcher = async (span: QTraceSpan) => {
                        span.log({
                            text: joinQuery.text,
                            params: joinQuery.params,
                            shards: joinQuery.shards,
                        });
                        return await this.refCollection.queryProvider({
                            text: joinQuery.text,
                            vars: joinQuery.params,
                            orderBy: [],
                            isFast: true,
                            request,
                            shards: (shard !== null) ? new Set([shard]) : joinQuery.shards,
                            traceSpan: span,
                        }) as Record<string, unknown>[];
                    };
                    const joinedPortion = await traceSpan.traceChildOperation(`${mainCollection.name}.query.join`, fetcher);
                    for (const joinedRecord of joinedPortion) {
                        this.joinRecordToMain(shardPlan, joinedRecord);
                    }
                    joinedRecords = joinedRecords.concat(joinedPortion);
                }
                if (Date.now() > timeLimit) {
                    break;
                }
            }
        }
        await QJoinQuery.fetchJoinedRecords(
            this.refCollection,
            joinedRecords,
            this.fieldSelection,
            accessRights,
            defaultTimeout,
            request,
            traceSpan,
        );
    }

    static async fetchJoinedRecords(
        mainCollection: QDataCollection,
        mainRecords: Record<string, unknown>[],
        mainSelection: SelectionSetNode | undefined,
        accessRights: AccessRights,
        defaultTimeout: number | undefined,
        request: QRequestContext,
        traceSpan: QTraceSpan,
    ): Promise<void> {
        const joins = QJoinQuery.getJoins(mainCollection.name, mainSelection, request.services.data);
        for (const join of joins) {
            await join.join(
                mainCollection,
                mainRecords,
                accessRights,
                defaultTimeout,
                request,
                traceSpan,
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

type Shard = string | null;
type OnValue = string;
type MainRecord = Record<string, unknown>;
type JoinPlan = Map<Shard, Map<OnValue, MainRecord[]>>;
