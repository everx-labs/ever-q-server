// Def

import {
    EmptyRecord,
    IntSizeType,
    SchemaDoc,
    SchemaEx,
    SchemaMember,
    SchemaType,
} from "./schema";

export type ClassDef = {
    types?: MembersDef<TypeDef>,
    fields?: MembersDef<TypeDef>,
    functions?: MembersDef<FunctionDef>
}

export type ExplicitDef = {
    _doc?: SchemaDoc,
    _?: SchemaEx,
    _void?: EmptyRecord,
    _any?: EmptyRecord,
    _ref?: string,
    _bool?: EmptyRecord,
    _time?: EmptyRecord,
    _string?: EmptyRecord,
    _float?: { size?: 32 | 64 },
    _int?: { unsigned?: boolean, size?: IntSizeType },
    _array?: TypeDef,
    _struct?: MembersDef<TypeDef>,
    _union?: MembersDef<TypeDef>,
    _class?: ClassDef,
    _value?: string | number | boolean,
}

export type StructDef = {
    [name: string]: TypeDef | SchemaDoc | SchemaEx | StructDef
}

export type TypeDef = ExplicitDef | StructDef;

export type FunctionDef = {
    _doc?: SchemaDoc,
    args?: OrderedMembersDef<TypeDef>,
    result?: TypeDef,
}

export type UnorderedMembersDef<M> = {
    [name: string]: M
}

export type OrderedMembersDef<M> = UnorderedMembersDef<M>[]

export type MembersDef<M> = OrderedMembersDef<M> | UnorderedMembersDef<M>

export const Def = {
    any(doc?: SchemaDoc): ExplicitDef {
        return { _any: {}, ...(doc ? { _doc: doc } : {}) };
    },
    float(doc?: SchemaDoc): ExplicitDef {
        return { _float: {}, ...(doc ? { _doc: doc } : {}) };
    },
    string(doc?: SchemaDoc): ExplicitDef {
        return { _string: {}, ...(doc ? { _doc: doc } : {}) };
    },
    bool(doc?: SchemaDoc): ExplicitDef {
        return { _bool: {}, ...(doc ? { _doc: doc } : {}) };
    },
    time(doc?: SchemaDoc): ExplicitDef {
        return { _time: {}, ...(doc ? { _doc: doc } : {}) };
    },
    arrayOf(item: TypeDef, doc?: SchemaDoc): ExplicitDef {
        return { _array: item, ...(doc ? { _doc: doc } : {}) };
    },
    ref(nameOrType: string | { [name: string]: TypeDef }, doc?: SchemaDoc): ExplicitDef {
        const name = typeof nameOrType === "string" ? nameOrType : Object.keys(nameOrType)[0];
        return { _ref: name, ...(doc ? { _doc: doc } : {}) };
    },
    value(value: string, doc?: SchemaDoc): ExplicitDef {
        return { _value: value, ...(doc ? { _doc: doc } : {}) };
    },
};

function isReservedKey(key: string): boolean {
    return key === "_doc" || key === "_";
}

// Parser

export function parseTypeDef(def: TypeDef): SchemaType {
    const parser = new SchemaParser();
    return parser.parseTypeDef(def, "");
}

// Internals

type ParsingType = {
    type: SchemaType,
    unresolved: { name: string, type: SchemaType }[],
}

function combineName(base: string, name: string): string {
    return base !== "" ? `${base}.${name}` : name;
}

const UnresolvedType: SchemaType = {
    void: {},
};

class SchemaParser {
    types: { [name: string]: ParsingType };

    constructor() {
        this.types = {};
    }

    typeRef(def: ExplicitDef): SchemaType {
        const defRef = def._ref || "";
        const existing = this.types[defRef];
        if (existing) {
            if (existing.type !== UnresolvedType) {
                return {
                    ref: {
                        name: defRef,
                        type: existing.type,
                    },
                };
            }
            const ref = {
                name: defRef,
                type: UnresolvedType,
            };
            existing.unresolved.push(ref);
            return { ref };
        }
        const ref = {
            name: defRef,
            type: UnresolvedType,
        };
        this.types[defRef] = {
            type: UnresolvedType,
            unresolved: [ref],
        };
        return { ref };
    }

    resolveType(name: string, type: SchemaType) {
        const existing = this.types[name];
        if (existing) {
            existing.unresolved.forEach(x => x.type = type);
        }
        this.types[name] = {
            type,
            unresolved: [],
        };
    }

    namedMembersFromUnorderedDefs<D, S>(
        defs: UnorderedMembersDef<D>,
        mapMember: (memberName: string, memberDef: D) => S,
    ): SchemaMember<S>[] {
        return Object.keys(defs).map<SchemaMember<S>>((memberName: string): SchemaMember<S> => {
            const memberDef = defs[memberName];
            return {
                name: memberName,
                ...mapMember(memberName, memberDef),
            };
        });
    }

    namedMembersFromOrderedDefs<D, S>(
        defs: OrderedMembersDef<D>,
        mapMember: (name: string, def: D) => S,
    ): SchemaMember<S>[] {
        const members: SchemaMember<S>[] = [];
        defs.forEach((unorderedDefs: UnorderedMembersDef<D>) => {
            this.namedMembersFromUnorderedDefs(unorderedDefs, mapMember).forEach((member: SchemaMember<S>) => {
                members.push(member);
            });
        });
        return members;
    }

    namedMembers<D, S>(
        defs: MembersDef<D>,
        mapMember: (name: string, def: D) => S,
    ): SchemaMember<S>[] {
        return Array.isArray(defs)
            ? this.namedMembersFromOrderedDefs(defs, mapMember)
            : this.namedMembersFromUnorderedDefs(defs, mapMember);
    }

    typedNamedMembers<D extends TypeDef>(memberDefs: MembersDef<D>, name: string): SchemaMember<SchemaType>[] {
        return this.namedMembers<D, SchemaType>(memberDefs, (memberName: string, memberDef: D): SchemaType => {
            return this.parseTypeDef(memberDef, combineName(name, memberName));
        });
    }

    typedNamedOrderedMembers<D extends TypeDef>(memberDefs: OrderedMembersDef<D>, name: string): SchemaMember<SchemaType>[] {
        return this.namedMembersFromOrderedDefs<D, SchemaType>(memberDefs, (memberName: string, memberDef: D): SchemaType => {
            return this.parseTypeDef(memberDef, combineName(name, memberName));
        });
    }


    parseTypeDef(def: TypeDef, name: string): SchemaType {
        const scalarTypes = ["_void", "_any", "_int", "_float", "_string", "_bool", "_time"];
        if (!def) {
            console.log(">>>", name, def);
        }
        const type: Record<string, unknown> = {
            def,
            doc: def._doc || "",
            _: def._ || {},
        };
        const scalarType = scalarTypes.find(t => t in def);
        const explicit = def as ExplicitDef;
        if (scalarType) {
            Object.assign(type, def);
            type[scalarType.substr(1)] = (def as Record<string, TypeDef>)[scalarType];
        } else if (explicit._ref) {
            Object.assign(type, this.typeRef(def));
        } else if (explicit._array) {
            type.array = this.parseTypeDef(explicit._array, combineName(name, "item"));
        } else if (explicit._struct) {
            type.struct = this.typedNamedMembers(explicit._struct, name);
        } else if (explicit._union) {
            type.union = this.namedMembers(explicit._union, (memberName, memberDef) => {
                return memberDef._value
                    ? memberDef
                    : this.parseTypeDef(memberDef, combineName(name, memberName));
            });
        } else if (explicit._class) {
            const classDef = explicit._class;
            type.class = {
                types: classDef.types ? this.typedNamedMembers(classDef.types, name) : [],
                fields: classDef.fields ? this.typedNamedMembers(classDef.fields, name) : [],
                functions: classDef.functions ? this.namedMembers(classDef.functions, (functionName, functionDef: FunctionDef) => {
                    return {
                        def: functionDef,
                        doc: functionDef._doc || "",
                        args: functionDef.args
                            ? this.typedNamedOrderedMembers(functionDef.args, combineName(name, functionName))
                            : [],
                        result: functionDef.result
                            ? this.parseTypeDef(functionDef.result, combineName(name, "Result"))
                            : {
                                doc: "",
                                void: {},
                            },
                    };
                }) : [],
            };
        } else if (Array.isArray(def)) {
            type.struct = this.typedNamedMembers(def, name);
        } else if (typeof def === "object") {
            const filteredDef: UnorderedMembersDef<TypeDef | StructDef> = {};
            Object.keys(def as StructDef).forEach((key) => {
                if (!isReservedKey(key)) {
                    filteredDef[key] = (def as StructDef)[key] as (TypeDef | StructDef);
                }
            });
            type.struct = this.typedNamedMembers(filteredDef, name);
        } else {
            console.log(">>>", name);
        }
        this.resolveType(name, type);
        return type;
    }
}

