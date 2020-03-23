//@flow

import { makeFieldTypeName, Writer } from 'ton-labs-dev-ops/dist/src/gen.js';
import type { SchemaDoc, SchemaMember, SchemaType, TypeDef } from 'ton-labs-dev-ops/src/schema.js';
import { parseTypeDef } from 'ton-labs-dev-ops/dist/src/schema.js';

const DbTypeCategory = {
    unresolved: 'unresolved',
    scalar: 'scalar',
    union: 'union',
    struct: 'struct',
};

type DbJoin = {
    collection: string,
    on: string,
    refOn: string,
    preCondition: string,
}

type DbType = {
    name: string,
    fields: DbField[],
    category: 'unresolved' | 'scalar' | 'union' | 'struct',
    collection?: string,
    doc: string,
}

type IntEnumDef = {
    name: string,
    values: {
        [string]: number
    },
}

type DbField = {
    name: string,
    type: DbType,
    arrayDepth: number,
    join?: DbJoin,
    enumDef?: IntEnumDef,
    doc: string,
}

function scalarType(name: string): DbType {
    return {
        name,
        category: DbTypeCategory.scalar,
        fields: [],
        doc: '',
    }
}

const scalarTypes = {
    int: scalarType('Int'),
    uint64: scalarType('String'),
    uint1024: scalarType('String'),
    float: scalarType('Float'),
    boolean: scalarType('Boolean'),
    string: scalarType('String'),
};

function isBigInt(type: DbType): boolean {
    return type === scalarTypes.uint1024 || type === scalarTypes.uint64;
}

function unresolvedType(name: string): DbType {
    return {
        name,
        category: DbTypeCategory.unresolved,
        fields: [],
        doc: '',
    }
}

function isLowerCased(s: string): boolean {
    const l = s.toLowerCase();
    const u = s.toUpperCase();
    return (u !== l) && (s === l);
}

function isUpperCased(s: string): boolean {
    const l = s.toLowerCase();
    const u = s.toUpperCase();
    return (u !== l) && (s === u);
}

function toAllCaps(s: string): string {
    let result = '';
    for (let i = 0; i < s.length; i += 1) {
        if ((i > 0) && (s[i - 1] !== '_') && isLowerCased(s[i - 1]) && isUpperCased(s[i])) {
            result += '_';
        }
        result += s[i];
    }
    return result.toUpperCase();
}

function toEnumStyle(s: string): string {
    return `${s.substr(0, 1).toUpperCase()}${s.substr(1)}`;
}

function stringifyEnumValues(values: { [string]: number }): string {
    const fields = Object.entries(values).map(([name, value]) => {
        return `${toEnumStyle(name)}: ${(value: any)}`;
    });
    return `{ ${fields.join(', ')} }`;
}

function getDocMD(schema: SchemaDoc): string {
    const doc = schema.doc;
    if (!doc) {
        return '';
    }
    if (typeof doc === 'string') {
        return doc;
    }
    if (doc.md) {
        return (doc.md: any);
    }
    return '';
}

function main(schemaDef: TypeDef) {

    let dbTypes: DbType[] = [];
    let lastReportedType: string = '';
    let enumTypes: Map<string, IntEnumDef> = new Map();

    function reportType(name: string, field: string, type: string) {
        if (name !== lastReportedType) {
            console.log(name);
            lastReportedType = name;
        }
        console.log(`    ${field}: ${type}`);

    }

    function parseDbField(
        typeName: string,
        schemaField: SchemaMember<SchemaType>,
    ): DbField {
        let schemaType = schemaField;
        const field: DbField = {
            name: schemaField.name,
            arrayDepth: 0,
            type: scalarTypes.string,
            doc: getDocMD(schemaField),
        };
        while (schemaType.array) {
            field.arrayDepth += 1;
            schemaType = schemaType.array;
        }
        const enumDef: ?IntEnumDef = (schemaType._ && schemaType._.enum) || null;
        if (enumDef) {
            field.enumDef = enumDef;
            enumTypes.set(enumDef.name, enumDef);
        }
        const join = (schemaType: any)._.join;
        if (join) {
            field.join = join;
        }
        if (schemaType.union || schemaType.struct) {
            field.type = unresolvedType(makeFieldTypeName(typeName, schemaField.name));
        } else if (schemaType.ref) {
            field.type = unresolvedType(schemaType.ref.name);
        } else if (schemaType.bool) {
            field.type = scalarTypes.boolean;
        } else if (schemaType.int) {
            const unsigned: boolean = (schemaType.int && schemaType.int.unsigned) || false;
            const size: number = (schemaType.int && schemaType.int.size) || 32;
            if (unsigned) {
                if (size >= 128) {
                    reportType(typeName, field.name, 'u1024');
                    field.type = scalarTypes.uint1024;
                } else if (size >= 64) {
                    reportType(typeName, field.name, 'u64');
                    field.type = scalarTypes.uint64;
                } else if (size >= 32) {
                    reportType(typeName, field.name, 'u32');
                    field.type = scalarTypes.float;
                } else {
                    reportType(typeName, field.name, `u${size}`);
                    field.type = scalarTypes.int;
                }
            } else {
                if (size > 32) {
                    throw new Error(`Integer type with size ${size} bit does not supported`);
                } else {
                    reportType(typeName, field.name, 'i32');
                    field.type = scalarTypes.int;
                }
            }
        } else if (schemaType.float) {
            reportType(typeName, field.name, 'float');
            field.type = scalarTypes.float;
        } else if (schemaType.string) {
            field.type = scalarTypes.string;
        } else {
            field.type = scalarTypes.string;
            console.log('Invalid field type: ', JSON.stringify(schemaType));
            process.exit(1);
        }
        return field;
    }

    function unwrapArrays(type: SchemaType): SchemaType {
        if (type.array) {
            return unwrapArrays(type.array);
        }
        return type;
    }

    function parseDbType(
        name: string,
        schemaType: SchemaType
    ) {
        const struct = schemaType.union || schemaType.struct;
        if (!struct) {
            console.log(`?? ${name}: ${JSON.stringify(schemaType).substr(0, 200)}`);
            return;
        }
        const type: DbType = {
            name,
            category: schemaType.union ? DbTypeCategory.union : DbTypeCategory.struct,
            fields: [],
            collection: (schemaType: any)._.collection,
            doc: getDocMD(schemaType),
        };

        if (type.collection) {
            type.fields.push({
                name: 'id',
                arrayDepth: 0,
                type: scalarTypes.string,
                doc: '',
            });
        }
        struct.forEach((field) => {
            type.fields.push(parseDbField(name, field));
            const unwrapped = unwrapArrays(field);
            const ownType = (unwrapped.struct || unwrapped.union) ? unwrapped : null;
            if (ownType) {
                parseDbType(makeFieldTypeName(name, field.name), ownType);
            }
        });
        dbTypes.push(type);
    }

    function parseDbTypes(types: SchemaMember<SchemaType>[]) {
        types.forEach((type: SchemaMember<SchemaType>) => {
            parseDbType(type.name, type);
        });
        const unresolved: Map<string, DbType> = new Map<string, DbType>();
        const resolving: Set<string> = new Set<string>();
        const resolved: Map<string, DbType> = new Map<string, DbType>();
        const orderedResolved: DbType[] = [];
        dbTypes.forEach(t => unresolved.set(t.name, t));
        const resolveType = (type: DbType) => {
            if (resolved.has(type.name)) {
                return;
            }
            if (resolving.has(type.name)) {
                console.log(`WARNING: Circular reference to type ${type.name}`);
                return;
            }
            resolving.add(type.name);
            type.fields.forEach((field) => {
                if (field.type.category === DbTypeCategory.unresolved) {
                    let type = resolved.get(field.type.name);
                    if (!type) {
                        type = unresolved.get(field.type.name);
                        if (type) {
                            resolveType(type);
                        } else {
                            console.log(`Referenced type not found: ${field.type.name}`);
                            process.exit(1);
                        }
                    }
                    if (type) {
                        field.type = type;
                    }
                }
            });
            resolving.delete(type.name);
            orderedResolved.push(type);
            unresolved.delete(type.name);
            resolved.set(type.name, type);
        };
        dbTypes.forEach(resolveType);
        dbTypes = orderedResolved;
    }

// Generators

    const ql = new Writer();
    const js = new Writer();

    function genQLDoc(prefix: string, doc: string) {
        if (doc.trim() === '') {
            return;
        }
        const lines = doc.split(/\n\r?|\r\n?/);
        if (lines.length === 1 && !lines[0].includes('"')) {
            ql.writeLn(prefix, '"', lines[0], '"');
        } else {
            ql.writeLn(prefix, '"""');
            lines.forEach((line) => {
                ql.writeLn(prefix, line);
            });
            ql.writeLn(prefix, '"""');
        }
    }

    function unionVariantType(type: DbType, variant: DbField): string {
        return `${type.name}${variant.name}Variant`;
    }

    function genQLTypeDeclarationsForUnionVariants(type: DbType) {
        type.fields.forEach((variant) => {
            ql.writeBlockLn(`
        type ${unionVariantType(type, variant)} {
            ${variant.name}: ${variant.type.name}
        }

        `);
        });
    }

    function genQLEnumTypes() {
        for (const enumDef: IntEnumDef of enumTypes.values()) {
            ql.writeLn(`enum ${enumDef.name}Enum {`);
            Object.keys(enumDef.values).forEach((name) => {
                ql.writeLn(`    ${toEnumStyle(name)}`);
            });
            ql.writeLn(`}`);
            ql.writeLn();
        }
    }

    function genQLTypeDeclaration(type: DbType) {
        if (type.category === DbTypeCategory.union) {
            genQLTypeDeclarationsForUnionVariants(type);
            ql.writeLn(`union ${type.name} = `);
            type.fields.forEach(variant => {
                ql.writeLn(`\t| ${unionVariantType(type, variant)}`);
            });
            ql.writeLn();
        } else {
            genQLDoc('', type.doc);
            ql.writeLn(`type ${type.name} {`);
            type.fields.forEach(field => {
                genQLDoc('\t', field.doc);
                const typeDeclaration =
                    '['.repeat(field.arrayDepth) +
                    field.type.name +
                    ']'.repeat(field.arrayDepth);
                const params = isBigInt(field.type)
                    ? '(format: BigIntFormat)'
                    : '';
                ql.writeLn(`\t${field.name}${params}: ${typeDeclaration}`);
                const enumDef = field.enumDef;
                if (enumDef) {
                    ql.writeLn(`\t${field.name}_name: ${enumDef.name}Enum`);
                }
            });
            ql.writeLn(`}`);
        }
        ql.writeLn();
    }

    function preventTwice(name: string, names: Set<string>, work: () => void) {
        if (!names.has(name)) {
            names.add(name);
            work();
        }
    }

    function genQLFiltersForArrayFields(type: DbType, qlNames: Set<string>) {
        type.fields.forEach((field) => {
            let itemTypeName = field.type.name;
            for (let i = 0; i < field.arrayDepth; i += 1) {
                const filterName = `${itemTypeName}ArrayFilter`;
                preventTwice(filterName, qlNames, () => {
                    ql.writeLn(`input ${filterName} {`);
                    ['any', 'all'].forEach((op) => {
                        ql.writeLn(`\t${op}: ${itemTypeName}Filter`);
                    });
                    ql.writeLn('}');
                    ql.writeLn();

                });
                itemTypeName += 'Array';
            }
        });
    }

    function genQLFiltersForEnumNameFields(type: DbType, qlNames: Set<string>) {
        type.fields.forEach((field) => {
            const enumDef = field.enumDef;
            if (enumDef) {
                preventTwice(`${enumDef.name}EnumFilter`, qlNames, () => {
                    genQLScalarTypesFilter(`${enumDef.name}Enum`);
                });
            }
        });
    }

    function genQLFilter(type: DbType, qlNames: Set<string>) {
        if (type.fields.length === 0) {
            return;
        }
        genQLFiltersForArrayFields(type, qlNames);
        genQLFiltersForEnumNameFields(type, qlNames);
        genQLDoc('', type.doc);
        ql.writeLn(`input ${type.name}Filter {`);
        type.fields.forEach((field) => {
            genQLDoc('\t', field.doc);
            const typeDeclaration = field.type.name + "Array".repeat(field.arrayDepth);
            ql.writeLn(`\t${field.name}: ${typeDeclaration}Filter`);
            const enumDef = field.enumDef;
            if (enumDef) {
                ql.writeLn(`\t${field.name}_name: ${enumDef.name}EnumFilter`);
            }
        });
        ql.writeLn(`}`);
        ql.writeLn();
    }

    function genQLScalarTypesFilter(name: string) {
        ql.writeLn(`input ${name}Filter {`);
        ['eq', 'ne', 'gt', 'lt', 'ge', 'le'].forEach((op) => {
            ql.writeLn(`\t${op}: ${name}`);
        });
        ['in', 'notIn'].forEach((op) => {
            ql.writeLn(`\t${op}: [${name}]`);
        });
        ql.writeLn('}');
        ql.writeLn();
    }

    function genQLQueries(types: DbType[]) {
        ql.writeBlockLn(`
        "Specify sort order direction"
        enum QueryOrderByDirection {
            "Documents will be sorted in ascended order (e.g. from A to Z)"
            ASC
            "Documents will be sorted in descendant order (e.g. from Z to A)"
            DESC
        }

        
        """
        Specify how to sort results.
        You can sort documents in result set using more than one field.
        """
        input QueryOrderBy {
            """
            Path to field which must be used as a sort criteria.
            If field resides deep in structure path items must be separated with dot (e.g. 'foo.bar.baz').
            """
            path: String
            "Sort order direction"
            direction: QueryOrderByDirection
        }

        type Query {
        `);

        types.forEach((type: DbType) => {
            ql.writeLn(`\t${type.collection || ''}(filter: ${type.name}Filter, orderBy: [QueryOrderBy], limit: Int, timeout: Float, accessKey: String): [${type.name}]`);
        });

        ql.writeBlockLn(`
        }

        `);
    }

    function genQLSubscriptions(types: DbType[]) {
        ql.writeLn('type Subscription {');
        types.forEach((type) => {
            ql.writeLn(`\t${type.collection || ''}(filter: ${type.name}Filter, accessKey: String): ${type.name}`);
        });
        ql.writeLn('}');
    }


    function getScalarResolverName(field: DbField): string {
        if (field.type === scalarTypes.uint64) {
            return 'bigUInt1';
        }
        if (field.type === scalarTypes.uint1024) {
            return 'bigUInt2';
        }
        return 'scalar';
    }

    function genJSFiltersForArrayFields(type: DbType, jsNames: Set<string>) {
        type.fields.forEach((field) => {
            let itemTypeName = field.type.name;
            for (let i = 0; i < field.arrayDepth; i += 1) {
                const filterName = `${itemTypeName}Array`;
                preventTwice(filterName, jsNames, () => {
                    const itemResolverName = (i === 0 && field.type.category === DbTypeCategory.scalar)
                        ? getScalarResolverName(field)
                        : itemTypeName;
                    js.writeBlockLn(`
                const ${filterName} = array(() => ${itemResolverName});
                `);
                });
                itemTypeName += 'Array';
            }
        });
    }

    function genJSStructFilter(type: DbType) {
        js.writeBlockLn(`
        const ${type.name} = struct({
    `);
        type.fields.forEach((field) => {
            let typeDeclaration: ?string = null;
            const join = field.join;
            if (join) {
                const suffix = field.arrayDepth > 0 ? 'Array' : '';
                typeDeclaration = `join${suffix}('${join.on}', '${join.refOn}', '${field.type.collection || ''}', () => ${field.type.name})`;
            } else if (field.arrayDepth > 0) {
                typeDeclaration =
                    field.type.name +
                    'Array'.repeat(field.arrayDepth);
            } else if (field.type.category === DbTypeCategory.scalar) {
                typeDeclaration = getScalarResolverName(field);
            } else if (field.type.fields.length > 0) {
                typeDeclaration = field.type.name;
            }
            if (typeDeclaration) {
                js.writeLn(`    ${field.name}: ${typeDeclaration},`);
                const enumDef = field.enumDef;
                if (enumDef) {
                    js.writeLn(`    ${field.name}_name: enumName('${field.name}', ${stringifyEnumValues(enumDef.values)}),`);
                }
            }
        });
        js.writeBlockLn(`
        }${type.collection ? ', true' : ''});

    `);
    }

    function genJSUnionResolver(type: DbType) {
        js.writeBlockLn(`
        const ${type.name}Resolver = {
            __resolveType(obj, context, info) {
        `);
        type.fields.forEach((variant) => {
            js.writeLn(`        if ('${variant.name}' in obj) {`);
            js.writeLn(`            return '${unionVariantType(type, variant)}';`);
            js.writeLn(`        }`);
        });
        js.writeBlockLn(`
                return null;
            }
        };

        `);
    }

    function genJSFilter(type: DbType, jsNames: Set<string>) {
        if (type.fields.length === 0) {
            return;
        }
        if (type.category === DbTypeCategory.union) {
            // genJSFiltersForUnionVariants(type, jsNames);
        }
        genJSFiltersForArrayFields(type, jsNames);
        genJSStructFilter(type);
        if (type.category === DbTypeCategory.union) {
            genJSUnionResolver(type);
        }


    }

    /**
     * Generate custom resolvers for types with:
     * - id field
     * - join fields
     * - u64 and higher fields
     * @param type
     */
    function genJSCustomResolvers(type: DbType) {
        const joinFields = type.fields.filter(x => !!x.join);
        const bigUIntFields = type.fields.filter((x: DbField) => isBigInt(x.type));
        const enumFields = type.fields.filter(x => x.enumDef);
        const customResolverRequired = type.collection
            || joinFields.length > 0
            || bigUIntFields.length > 0
            || enumFields.length > 0;
        if (!customResolverRequired) {
            return;
        }
        js.writeLn(`        ${type.name}: {`);
        if (type.collection) {
            js.writeLn('            id(parent) {');
            js.writeLn('                return parent._key;');
            js.writeLn('            },');
        }
        joinFields.forEach((field) => {
            const join = field.join;
            if (!join) {
                return;
            }
            const onField = type.fields.find(x => x.name === join.on);
            if (!onField) {
                throw 'Join on field does not exist.';
            }
            const on = join.on === 'id' ? '_key' : (join.on || '_key');
            const refOn = join.refOn === 'id' ? '_key' : (join.refOn || '_key');
            const collection = field.type.collection;
            if (!collection) {
                throw 'Joined type is not a collection.';
            }
            js.writeLn(`            ${field.name}(parent, _args, context) {`);
            const pre = join.preCondition ? `${join.preCondition} ? ` : '';
            const post = join.preCondition ? ` : null` : '';
            if (field.arrayDepth === 0) {
                js.writeLn(`                return ${pre}context.db.${collection}.waitForDoc(parent.${on}, '${refOn}')${post};`);
            } else if (field.arrayDepth === 1) {
                js.writeLn(`                return ${pre}context.db.${collection}.waitForDocs(parent.${on}, '${refOn}')${post};`);
            } else {
                throw 'Joins on a nested arrays does not supported.';
            }
            js.writeLn(`            },`);
        });
        bigUIntFields.forEach((field) => {
            const prefixLength = field.type === scalarTypes.uint64 ? 1 : 2;
            js.writeLn(`            ${field.name}(parent, args) {`);
            js.writeLn(`                return resolveBigUInt(${prefixLength}, parent.${field.name}, args);`);
            js.writeLn(`            },`);
        });
        enumFields.forEach((field) => {
            const enumDef = field.enumDef;
            if (enumDef) {
                js.writeLn(`            ${field.name}_name: createEnumNameResolver('${field.name}', ${stringifyEnumValues(enumDef.values)}),`);
            }
        });
        js.writeLn(`        },`);
    }


    function genJSTypeResolversForUnion(type: DbType) {
        if (type.category === DbTypeCategory.union) {
            js.writeLn(`        ${type.name}: ${type.name}Resolver,`);
        }
    }

    function generate(types: DbType[]) {

        // QL

        ql.writeBlockLn(`
        """
        Due to GraphQL limitations big numbers are returned as a string.
        You can specify format used to string representation for big integers.
        """
        enum BigIntFormat {
            " Hexadecimal representation started with 0x (default) "
            HEX
            " Decimal representation "
            DEC
        }
        `);
        ['String', 'Boolean', 'Int', 'Float'].forEach(genQLScalarTypesFilter);
        genQLEnumTypes();
        types.forEach(type => genQLTypeDeclaration(type));
        const qlArrayFilters = new Set<string>();
        types.forEach(type => genQLFilter(type, qlArrayFilters));

        const collections = types.filter(t => !!t.collection);
        genQLQueries(collections);
        genQLSubscriptions(collections);

        // JS

        js.writeBlockLn(`
        const {
            scalar,
            bigUInt1,
            bigUInt2,
            resolveBigUInt,
            struct,
            array,
            join,
            joinArray,
            enumName,
            createEnumNameResolver,
        } = require('./db-types.js');
        `);
        const jsArrayFilters = new Set<string>();
        types.forEach(type => genJSFilter(type, jsArrayFilters));

        js.writeBlockLn(`
        function createResolvers(db) {
            return {
        `);
        types.forEach((type) => {
            genJSCustomResolvers(type);
            genJSTypeResolversForUnion(type);
        });
        js.writeLn('        Query: {');
        collections.forEach((type) => {
            js.writeLn(`            ${type.collection || ''}: db.${type.collection || ''}.queryResolver(),`)
        });
        js.writeLn('        },');
        js.writeLn('        Subscription: {');
        collections.forEach((type) => {
            js.writeLn(`            ${type.collection || ''}: db.${type.collection || ''}.subscriptionResolver(),`)
        });
        js.writeBlockLn(`
                }
            }
        }

        `);

        js.writeBlockLn(`
        module.exports = {
            createResolvers,
        `);
        types.forEach(type => js.writeLn(`    ${type.name},`));
        js.writeBlockLn(`
        };
        `);
    }

    const schema = parseTypeDef(schemaDef);

    if (schema.class) {
        parseDbTypes(schema.class.types);
        generate(dbTypes);
    }

    for (const e: IntEnumDef of enumTypes.values()) {
        console.log(`export const Q${e.name} = {`);
        console.log(Object.entries(e.values).map(([name, value]) => {
            return `    ${name}: ${(value: any)},`;
        }).join('\n'));
        console.log(`};\n`);
    }

    return {
        ql: ql.generated(),
        js: js.generated(),
    }
}

export default main;
