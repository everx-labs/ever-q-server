import type { AccessKey } from '../auth'
import { QRequestContext } from '../request'

type ManagementArgs = {
    account?: string
    signedManagementAccessKey?: string
}

type RegisterAccessKeysArgs = ManagementArgs & {
    keys: AccessKey[]
}

type RevokeAccessKeysArgs = ManagementArgs & {
    keys: string[]
}

async function getManagementAccessKey(
    _parent: unknown,
    _args: unknown,
    context: QRequestContext,
): Promise<string> {
    return context.services.auth.getManagementAccessKey()
}

async function registerAccessKeys(
    _parent: unknown,
    args: RegisterAccessKeysArgs,
    context: QRequestContext,
): Promise<number> {
    return context.services.auth.registerAccessKeys(
        args.account || '',
        args.keys || [],
        args.signedManagementAccessKey || '',
    )
}

async function revokeAccessKeys(
    _parent: unknown,
    args: RevokeAccessKeysArgs,
    context: QRequestContext,
): Promise<number> {
    return context.services.auth.revokeAccessKeys(
        args.account || '',
        args.keys || [],
        args.signedManagementAccessKey || '',
    )
}

type FinishOperationsArgs = {
    operationIds?: string[]
}

async function finishOperations(
    _parent: unknown,
    args: FinishOperationsArgs,
    context: QRequestContext,
): Promise<number> {
    const operationIds = new Set(args.operationIds || [])
    if (operationIds.size === 0) {
        return 0
    }
    return context.services.data.finishOperations(operationIds)
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
}
