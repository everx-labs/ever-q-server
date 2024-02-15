export type SchemaDoc = string | { md: string } | { html: string }

export enum ToStringFormatter {
    unixMillisecondsToString = "unixMillisecondsToString",
    unixSecondsToString = "unixSecondsToString",
}

export type DbJoin = {
    collection: string
    on: string
    refOn: string
    preCondition?: string
}

export type IntEnumValues = {
    [name: string]: number
}

export type IntEnumDef = {
    name: string
    values: IntEnumValues
}

export type IntFlags = {
    CapNone: number
    CapIhrEnabled: number
    CapCreateStatsEnabled: number
    CapBounceMsgBody: number
    // forces all collators to report their supported version and capabilities in the block headers of the blocks they generate
    CapReportVersion: number
    CapSplitMergeTransactions: number
    CapShortDequeue: number
    CapMbppEnabled: number
    CapFastStorageStat: number
    CapInitCodeHash: number
    CapOffHypercube: number
    // enabled opcode MYCODE see https://docs.everscale.network/tvm.pdf
    CapMyCode: number
    CapSetLibCode: number
    CapFixTupleIndexBug: number
    // see https://docs.everscale.network/arch/networking/remp#remp-catchain
    CapRemp: number
    CapDElections: number
    // enabled to put full body in bounced message
    CapFullBodyInBounced: number
    // enable opcode STORAGEFEE see https://docs.everscale.network/tvm.pdf
    CapStorageFeeToTvm: number
    // use contracts with copyleft opcode COPYLEFT see https://docs.everscale.network/standard/TIP-1.1
    CapCopyleft: number
    CapIndexAccounts: number
    CapDiff: number
    // popsave, exception handler, loops
    CapsTvmBugfixes2022: number
    CapWorkchains: number
    // support old format continuation serialization
    CapStcontNewFormat: number
    // calc cell datasize using fast storage stat
    CapFastStorageStatBugfix: number
    CapResolveMerkleCell: number
    // se some predefined id during signature check
    CapSignatureWithId: number
    // if transaction fails on Action phase, bounced message will be produced
    CapBounceAfterFailedAction: number
    // support Groth16 proof system (opcode VERGRTH16)
    CapGroth16: number
    // all fees in config are in gas units
    CapFeeInGasUnits: number
    CapBigCells: number
    CapSuspendedList: number
    CapFastFinality: number
    // TVM v1.9.x improvemements
    CapTvmV19: number
    CapSmft: number
    // Don't split out queue on shard splitting
    CapNoSplitOutQueue: number
}

export type IntFlagsDef = {
    name: string
    values: IntFlags
}

export type SchemaEx = {
    collection?: string
    enum?: IntEnumDef
    flags?: IntFlagsDef
    join?: DbJoin
    formatter?: ToStringFormatter
    lowerFilter?: boolean
}

export type IntSizeType = 8 | 16 | 32 | 64 | 128 | 256

export type SchemaClass = {
    types: SchemaMember<SchemaType>[]
    fields: SchemaMember<SchemaType>[]
    functions: SchemaMember<SchemaFunction>[]
}

export type EmptyRecord = Record<string, never>

export enum SchemaSubType {
    NONE,
    ADDRESS,
}

export type SchemaType = {
    doc?: SchemaDoc
    _?: SchemaEx
    void?: EmptyRecord
    any?: EmptyRecord
    int?: { unsigned?: boolean; size?: IntSizeType }
    float?: { size?: 32 | 64 }
    string?: { subType?: SchemaSubType }
    bool?: EmptyRecord
    time?: EmptyRecord
    array?: SchemaType
    struct?: SchemaMember<SchemaType>[]
    union?: SchemaMember<SchemaType>[]
    ref?: { name: string; type: SchemaType }
    class?: SchemaClass
    value?: string | number | boolean
}

export type SchemaFunction = {
    doc?: SchemaDoc
    args: SchemaMember<SchemaType>[]
    result: SchemaType
}

export type SchemaMember<M> = { name: string } & M
