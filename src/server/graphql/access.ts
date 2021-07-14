import type {
    GraphQLRequestContext,
} from "../data/collection";
import type { AccessKey } from "../auth";
import type { GraphQLRequestContextEx } from "./context";

type ManagementArgs = {
    account?: string,
    signedManagementAccessKey?: string,
}

type RegisterAccessKeysArgs = ManagementArgs & {
    keys: AccessKey[],
}

type RevokeAccessKeysArgs = ManagementArgs & {
    keys: string[],
}

async function getManagementAccessKey(_parent: unknown, _args: unknown, context: GraphQLRequestContext): Promise<string> {
    return context.auth.getManagementAccessKey();
}

async function registerAccessKeys(
    _parent: unknown,
    args: RegisterAccessKeysArgs,
    context: GraphQLRequestContext,
): Promise<number> {
    return context.auth.registerAccessKeys(
        args.account || "",
        args.keys || [],
        args.signedManagementAccessKey || "");
}

async function revokeAccessKeys(
    _parent: unknown,
    args: RevokeAccessKeysArgs,
    context: GraphQLRequestContext,
): Promise<number> {
    return context.auth.revokeAccessKeys(
        args.account || "",
        args.keys || [],
        args.signedManagementAccessKey || "");
}

type FinishOperationsArgs = {
    operationIds?: string[],
}

async function finishOperations(
    _parent: unknown,
    args: FinishOperationsArgs,
    context: GraphQLRequestContextEx,
): Promise<number> {
    const operationIds = new Set(args.operationIds || []);
    if (operationIds.size === 0) {
        return 0;
    }
    return context.data.finishOperations(operationIds);
}

export const accessResolvers = {
    Query: {
        getManagementAccessKey,
    },
    Mutation: {
        registerAccessKeys,
        revokeAccessKeys,
        finishOperations,
    },
};
