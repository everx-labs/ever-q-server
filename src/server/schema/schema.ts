export type SchemaDoc = string | { md: string } | { html: string };

export enum ToStringFormatter {
    unixMillisecondsToString = "unixMillisecondsToString",
    unixSecondsToString = "unixSecondsToString",
}

export type DbJoin = {
    collection: string,
    on: string,
    refOn: string,
    preCondition?: string,
};

export type IntEnumValues = {
    [name: string]: number
};


export type IntEnumDef = {
    name: string,
    values: IntEnumValues,
};


export type SchemaEx = {
    collection?: string,
    enum?: IntEnumDef,
    join?: DbJoin,
    formatter?: ToStringFormatter,
    lowerFilter?: boolean,
};

export type IntSizeType = 8 | 16 | 32 | 64 | 128 | 256;

export type SchemaClass = {
    types: SchemaMember<SchemaType>[],
    fields: SchemaMember<SchemaType>[],
    functions: SchemaMember<SchemaFunction>[]
};

export type EmptyRecord = Record<string, never>;

export type SchemaType = {
    doc?: SchemaDoc,
    _?: SchemaEx,
    void?: EmptyRecord,
    any?: EmptyRecord,
    int?: { unsigned?: boolean, size?: IntSizeType },
    float?: { size?: (32 | 64) },
    string?: EmptyRecord,
    bool?: EmptyRecord,
    time?: EmptyRecord,
    array?: SchemaType,
    struct?: SchemaMember<SchemaType>[],
    union?: SchemaMember<SchemaType>[],
    ref?: { name: string, type: SchemaType },
    class?: SchemaClass,
    value?: string | number | boolean
};

export type SchemaFunction = {
    doc?: SchemaDoc,
    args: SchemaMember<SchemaType>[],
    result: SchemaType,
};

export type SchemaMember<M> = { name: string } & M;

