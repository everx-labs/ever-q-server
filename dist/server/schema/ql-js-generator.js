"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _gen = require("ton-labs-dev-ops/dist/src/gen.js");

var _schema = require("ton-labs-dev-ops/dist/src/schema.js");

const DbTypeCategory = {
  unresolved: 'unresolved',
  scalar: 'scalar',
  union: 'union',
  struct: 'struct'
};

function scalarType(name) {
  return {
    name,
    category: DbTypeCategory.scalar,
    fields: [],
    doc: ''
  };
}

const scalarTypes = {
  int: scalarType('Int'),
  uint64: scalarType('String'),
  uint1024: scalarType('String'),
  float: scalarType('Float'),
  boolean: scalarType('Boolean'),
  string: scalarType('String')
};

function isBigInt(type) {
  return type === scalarTypes.uint1024 || type === scalarTypes.uint64;
}

function unresolvedType(name) {
  return {
    name,
    category: DbTypeCategory.unresolved,
    fields: [],
    doc: ''
  };
}

function isLowerCased(s) {
  const l = s.toLowerCase();
  const u = s.toUpperCase();
  return u !== l && s === l;
}

function isUpperCased(s) {
  const l = s.toLowerCase();
  const u = s.toUpperCase();
  return u !== l && s === u;
}

function toAllCaps(s) {
  let result = '';

  for (let i = 0; i < s.length; i += 1) {
    if (i > 0 && s[i - 1] !== '_' && isLowerCased(s[i - 1]) && isUpperCased(s[i])) {
      result += '_';
    }

    result += s[i];
  }

  return result.toUpperCase();
}

function toEnumStyle(s) {
  return `${s.substr(0, 1).toUpperCase()}${s.substr(1)}`;
}

function stringifyEnumValues(values) {
  const fields = Object.entries(values).map(([name, value]) => {
    return `${toEnumStyle(name)}: ${value}`;
  });
  return `{ ${fields.join(', ')} }`;
}

function getDocMD(schema) {
  const doc = schema.doc;

  if (!doc) {
    return '';
  }

  if (typeof doc === 'string') {
    return doc;
  }

  if (doc.md) {
    return doc.md;
  }

  return '';
}

function main(schemaDef) {
  let dbTypes = [];
  let lastReportedType = '';
  let enumTypes = new Map();

  function reportType(name, field, type) {
    if (name !== lastReportedType) {
      console.log(name);
      lastReportedType = name;
    }

    console.log(`    ${field}: ${type}`);
  }

  function parseDbField(typeName, schemaField) {
    let schemaType = schemaField;
    const field = {
      name: schemaField.name,
      arrayDepth: 0,
      type: scalarTypes.string,
      doc: getDocMD(schemaField)
    };

    while (schemaType.array) {
      field.arrayDepth += 1;
      schemaType = schemaType.array;
    }

    const enumDef = schemaType._ && schemaType._.enum || null;

    if (enumDef) {
      field.enumDef = enumDef;
      enumTypes.set(enumDef.name, enumDef);
    }

    const join = schemaType._.join;

    if (join) {
      field.join = join;
    }

    if (schemaType.union || schemaType.struct) {
      field.type = unresolvedType((0, _gen.makeFieldTypeName)(typeName, schemaField.name));
    } else if (schemaType.ref) {
      field.type = unresolvedType(schemaType.ref.name);
    } else if (schemaType.bool) {
      field.type = scalarTypes.boolean;
    } else if (schemaType.int) {
      const unsigned = schemaType.int && schemaType.int.unsigned || false;
      const size = schemaType.int && schemaType.int.size || 32;

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

  function unwrapArrays(type) {
    if (type.array) {
      return unwrapArrays(type.array);
    }

    return type;
  }

  function parseDbType(name, schemaType) {
    const struct = schemaType.union || schemaType.struct;

    if (!struct) {
      console.log(`?? ${name}: ${JSON.stringify(schemaType).substr(0, 200)}`);
      return;
    }

    const type = {
      name,
      category: schemaType.union ? DbTypeCategory.union : DbTypeCategory.struct,
      fields: [],
      collection: schemaType._.collection,
      doc: getDocMD(schemaType)
    };

    if (type.collection) {
      type.fields.push({
        name: 'id',
        arrayDepth: 0,
        type: scalarTypes.string,
        doc: ''
      });
    }

    struct.forEach(field => {
      type.fields.push(parseDbField(name, field));
      const unwrapped = unwrapArrays(field);
      const ownType = unwrapped.struct || unwrapped.union ? unwrapped : null;

      if (ownType) {
        parseDbType((0, _gen.makeFieldTypeName)(name, field.name), ownType);
      }
    });
    dbTypes.push(type);
  }

  function parseDbTypes(types) {
    types.forEach(type => {
      parseDbType(type.name, type);
    });
    const unresolved = new Map();
    const resolving = new Set();
    const resolved = new Map();
    const orderedResolved = [];
    dbTypes.forEach(t => unresolved.set(t.name, t));

    const resolveType = type => {
      if (resolved.has(type.name)) {
        return;
      }

      if (resolving.has(type.name)) {
        console.log(`WARNING: Circular reference to type ${type.name}`);
        return;
      }

      resolving.add(type.name);
      type.fields.forEach(field => {
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
  } // Generators


  const ql = new _gen.Writer();
  const js = new _gen.Writer();

  function genQLDoc(prefix, doc) {
    if (doc.trim() === '') {
      return;
    }

    const lines = doc.split(/\n\r?|\r\n?/);

    if (lines.length === 1 && !lines[0].includes('"')) {
      ql.writeLn(prefix, '"', lines[0], '"');
    } else {
      ql.writeLn(prefix, '"""');
      lines.forEach(line => {
        ql.writeLn(prefix, line);
      });
      ql.writeLn(prefix, '"""');
    }
  }

  function unionVariantType(type, variant) {
    return `${type.name}${variant.name}Variant`;
  }

  function genQLTypeDeclarationsForUnionVariants(type) {
    type.fields.forEach(variant => {
      ql.writeBlockLn(`
        type ${unionVariantType(type, variant)} {
            ${variant.name}: ${variant.type.name}
        }

        `);
    });
  }

  function genQLEnumTypes() {
    for (const enumDef of enumTypes.values()) {
      ql.writeLn(`enum ${enumDef.name}Enum {`);
      Object.keys(enumDef.values).forEach(name => {
        ql.writeLn(`    ${toEnumStyle(name)}`);
      });
      ql.writeLn(`}`);
      ql.writeLn();
    }
  }

  function genQLTypeDeclaration(type) {
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
        const typeDeclaration = '['.repeat(field.arrayDepth) + field.type.name + ']'.repeat(field.arrayDepth);
        const params = isBigInt(field.type) ? '(format: BigIntFormat)' : '';
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

  function preventTwice(name, names, work) {
    if (!names.has(name)) {
      names.add(name);
      work();
    }
  }

  function genQLFiltersForArrayFields(type, qlNames) {
    type.fields.forEach(field => {
      let itemTypeName = field.type.name;

      for (let i = 0; i < field.arrayDepth; i += 1) {
        const filterName = `${itemTypeName}ArrayFilter`;
        preventTwice(filterName, qlNames, () => {
          ql.writeLn(`input ${filterName} {`);
          ['any', 'all'].forEach(op => {
            ql.writeLn(`\t${op}: ${itemTypeName}Filter`);
          });
          ql.writeLn('}');
          ql.writeLn();
        });
        itemTypeName += 'Array';
      }
    });
  }

  function genQLFiltersForEnumNameFields(type, qlNames) {
    type.fields.forEach(field => {
      const enumDef = field.enumDef;

      if (enumDef) {
        preventTwice(`${enumDef.name}EnumFilter`, qlNames, () => {
          genQLScalarTypesFilter(`${enumDef.name}Enum`);
        });
      }
    });
  }

  function genQLFilter(type, qlNames) {
    if (type.fields.length === 0) {
      return;
    }

    genQLFiltersForArrayFields(type, qlNames);
    genQLFiltersForEnumNameFields(type, qlNames);
    genQLDoc('', type.doc);
    ql.writeLn(`input ${type.name}Filter {`);
    type.fields.forEach(field => {
      genQLDoc('\t', field.doc);
      const typeDeclaration = field.type.name + "Array".repeat(field.arrayDepth);
      ql.writeLn(`\t${field.name}: ${typeDeclaration}Filter`);
      const enumDef = field.enumDef;

      if (enumDef) {
        ql.writeLn(`\t${field.name}_name: ${enumDef.name}EnumFilter`);
      }
    });
    ql.writeLn(`    OR: ${type.name}Filter`);
    ql.writeLn(`}`);
    ql.writeLn();
  }

  function genQLScalarTypesFilter(name) {
    ql.writeLn(`input ${name}Filter {`);
    ['eq', 'ne', 'gt', 'lt', 'ge', 'le'].forEach(op => {
      ql.writeLn(`\t${op}: ${name}`);
    });
    ['in', 'notIn'].forEach(op => {
      ql.writeLn(`\t${op}: [${name}]`);
    });
    ql.writeLn('}');
    ql.writeLn();
  }

  function genQLQueries(types) {
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
    types.forEach(type => {
      ql.writeLn(`\t${type.collection || ''}(filter: ${type.name}Filter, orderBy: [QueryOrderBy], limit: Int, timeout: Float, accessKey: String, operationId: String): [${type.name}]`);
    });
    ql.writeBlockLn(`
        }

        `);
  }

  function genQLSubscriptions(types) {
    ql.writeLn('type Subscription {');
    types.forEach(type => {
      ql.writeLn(`\t${type.collection || ''}(filter: ${type.name}Filter, accessKey: String): ${type.name}`);
    });
    ql.writeLn('}');
  }

  function getScalarResolverName(field) {
    if (field.type === scalarTypes.uint64) {
      return 'bigUInt1';
    }

    if (field.type === scalarTypes.uint1024) {
      return 'bigUInt2';
    }

    return 'scalar';
  }

  function genJSFiltersForArrayFields(type, jsNames) {
    type.fields.forEach(field => {
      let itemTypeName = field.type.name;

      for (let i = 0; i < field.arrayDepth; i += 1) {
        const filterName = `${itemTypeName}Array`;
        preventTwice(filterName, jsNames, () => {
          const itemResolverName = i === 0 && field.type.category === DbTypeCategory.scalar ? getScalarResolverName(field) : itemTypeName;
          js.writeBlockLn(`
                const ${filterName} = array(() => ${itemResolverName});
                `);
        });
        itemTypeName += 'Array';
      }
    });
  }

  function genJSStructFilter(type) {
    js.writeBlockLn(`
        const ${type.name} = struct({
    `);
    type.fields.forEach(field => {
      let typeDeclaration = null;
      const join = field.join;

      if (join) {
        const suffix = field.arrayDepth > 0 ? 'Array' : '';
        typeDeclaration = `join${suffix}('${join.on}', '${join.refOn}', '${field.type.collection || ''}', () => ${field.type.name})`;
      } else if (field.arrayDepth > 0) {
        typeDeclaration = field.type.name + 'Array'.repeat(field.arrayDepth);
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

  function genJSUnionResolver(type) {
    js.writeBlockLn(`
        const ${type.name}Resolver = {
            __resolveType(obj, context, info) {
        `);
    type.fields.forEach(variant => {
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

  function genJSFilter(type, jsNames) {
    if (type.fields.length === 0) {
      return;
    }

    if (type.category === DbTypeCategory.union) {// genJSFiltersForUnionVariants(type, jsNames);
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


  function genJSCustomResolvers(type) {
    const joinFields = type.fields.filter(x => !!x.join);
    const bigUIntFields = type.fields.filter(x => isBigInt(x.type));
    const enumFields = type.fields.filter(x => x.enumDef);
    const customResolverRequired = type.collection || joinFields.length > 0 || bigUIntFields.length > 0 || enumFields.length > 0;

    if (!customResolverRequired) {
      return;
    }

    js.writeLn(`        ${type.name}: {`);

    if (type.collection) {
      js.writeLn('            id(parent) {');
      js.writeLn('                return parent._key;');
      js.writeLn('            },');
    }

    joinFields.forEach(field => {
      const join = field.join;

      if (!join) {
        return;
      }

      const onField = type.fields.find(x => x.name === join.on);

      if (!onField) {
        throw 'Join on field does not exist.';
      }

      const on = join.on === 'id' ? '_key' : join.on || '_key';
      const refOn = join.refOn === 'id' ? '_key' : join.refOn || '_key';
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
    bigUIntFields.forEach(field => {
      const prefixLength = field.type === scalarTypes.uint64 ? 1 : 2;
      js.writeLn(`            ${field.name}(parent, args) {`);
      js.writeLn(`                return resolveBigUInt(${prefixLength}, parent.${field.name}, args);`);
      js.writeLn(`            },`);
    });
    enumFields.forEach(field => {
      const enumDef = field.enumDef;

      if (enumDef) {
        js.writeLn(`            ${field.name}_name: createEnumNameResolver('${field.name}', ${stringifyEnumValues(enumDef.values)}),`);
      }
    });
    js.writeLn(`        },`);
  }

  function genJSTypeResolversForUnion(type) {
    if (type.category === DbTypeCategory.union) {
      js.writeLn(`        ${type.name}: ${type.name}Resolver,`);
    }
  }

  function generate(types) {
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
    const qlArrayFilters = new Set();
    types.forEach(type => genQLFilter(type, qlArrayFilters));
    const collections = types.filter(t => !!t.collection);
    genQLQueries(collections);
    genQLSubscriptions(collections); // JS

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
    const jsArrayFilters = new Set();
    types.forEach(type => genJSFilter(type, jsArrayFilters));
    js.writeBlockLn(`
        function createResolvers(db) {
            return {
        `);
    types.forEach(type => {
      genJSCustomResolvers(type);
      genJSTypeResolversForUnion(type);
    });
    js.writeLn('        Query: {');
    collections.forEach(type => {
      js.writeLn(`            ${type.collection || ''}: db.${type.collection || ''}.queryResolver(),`);
    });
    js.writeLn('        },');
    js.writeLn('        Subscription: {');
    collections.forEach(type => {
      js.writeLn(`            ${type.collection || ''}: db.${type.collection || ''}.subscriptionResolver(),`);
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

  const schema = (0, _schema.parseTypeDef)(schemaDef);

  if (schema.class) {
    parseDbTypes(schema.class.types);
    generate(dbTypes);
  }

  for (const e of enumTypes.values()) {
    console.log(`export const Q${e.name} = {`);
    console.log(Object.entries(e.values).map(([name, value]) => {
      return `    ${name}: ${value},`;
    }).join('\n'));
    console.log(`};\n`);
  }

  return {
    ql: ql.generated(),
    js: js.generated()
  };
}

var _default = main;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NlcnZlci9zY2hlbWEvcWwtanMtZ2VuZXJhdG9yLmpzIl0sIm5hbWVzIjpbIkRiVHlwZUNhdGVnb3J5IiwidW5yZXNvbHZlZCIsInNjYWxhciIsInVuaW9uIiwic3RydWN0Iiwic2NhbGFyVHlwZSIsIm5hbWUiLCJjYXRlZ29yeSIsImZpZWxkcyIsImRvYyIsInNjYWxhclR5cGVzIiwiaW50IiwidWludDY0IiwidWludDEwMjQiLCJmbG9hdCIsImJvb2xlYW4iLCJzdHJpbmciLCJpc0JpZ0ludCIsInR5cGUiLCJ1bnJlc29sdmVkVHlwZSIsImlzTG93ZXJDYXNlZCIsInMiLCJsIiwidG9Mb3dlckNhc2UiLCJ1IiwidG9VcHBlckNhc2UiLCJpc1VwcGVyQ2FzZWQiLCJ0b0FsbENhcHMiLCJyZXN1bHQiLCJpIiwibGVuZ3RoIiwidG9FbnVtU3R5bGUiLCJzdWJzdHIiLCJzdHJpbmdpZnlFbnVtVmFsdWVzIiwidmFsdWVzIiwiT2JqZWN0IiwiZW50cmllcyIsIm1hcCIsInZhbHVlIiwiam9pbiIsImdldERvY01EIiwic2NoZW1hIiwibWQiLCJtYWluIiwic2NoZW1hRGVmIiwiZGJUeXBlcyIsImxhc3RSZXBvcnRlZFR5cGUiLCJlbnVtVHlwZXMiLCJNYXAiLCJyZXBvcnRUeXBlIiwiZmllbGQiLCJjb25zb2xlIiwibG9nIiwicGFyc2VEYkZpZWxkIiwidHlwZU5hbWUiLCJzY2hlbWFGaWVsZCIsInNjaGVtYVR5cGUiLCJhcnJheURlcHRoIiwiYXJyYXkiLCJlbnVtRGVmIiwiXyIsImVudW0iLCJzZXQiLCJyZWYiLCJib29sIiwidW5zaWduZWQiLCJzaXplIiwiRXJyb3IiLCJKU09OIiwic3RyaW5naWZ5IiwicHJvY2VzcyIsImV4aXQiLCJ1bndyYXBBcnJheXMiLCJwYXJzZURiVHlwZSIsImNvbGxlY3Rpb24iLCJwdXNoIiwiZm9yRWFjaCIsInVud3JhcHBlZCIsIm93blR5cGUiLCJwYXJzZURiVHlwZXMiLCJ0eXBlcyIsInJlc29sdmluZyIsIlNldCIsInJlc29sdmVkIiwib3JkZXJlZFJlc29sdmVkIiwidCIsInJlc29sdmVUeXBlIiwiaGFzIiwiYWRkIiwiZ2V0IiwiZGVsZXRlIiwicWwiLCJXcml0ZXIiLCJqcyIsImdlblFMRG9jIiwicHJlZml4IiwidHJpbSIsImxpbmVzIiwic3BsaXQiLCJpbmNsdWRlcyIsIndyaXRlTG4iLCJsaW5lIiwidW5pb25WYXJpYW50VHlwZSIsInZhcmlhbnQiLCJnZW5RTFR5cGVEZWNsYXJhdGlvbnNGb3JVbmlvblZhcmlhbnRzIiwid3JpdGVCbG9ja0xuIiwiZ2VuUUxFbnVtVHlwZXMiLCJrZXlzIiwiZ2VuUUxUeXBlRGVjbGFyYXRpb24iLCJ0eXBlRGVjbGFyYXRpb24iLCJyZXBlYXQiLCJwYXJhbXMiLCJwcmV2ZW50VHdpY2UiLCJuYW1lcyIsIndvcmsiLCJnZW5RTEZpbHRlcnNGb3JBcnJheUZpZWxkcyIsInFsTmFtZXMiLCJpdGVtVHlwZU5hbWUiLCJmaWx0ZXJOYW1lIiwib3AiLCJnZW5RTEZpbHRlcnNGb3JFbnVtTmFtZUZpZWxkcyIsImdlblFMU2NhbGFyVHlwZXNGaWx0ZXIiLCJnZW5RTEZpbHRlciIsImdlblFMUXVlcmllcyIsImdlblFMU3Vic2NyaXB0aW9ucyIsImdldFNjYWxhclJlc29sdmVyTmFtZSIsImdlbkpTRmlsdGVyc0ZvckFycmF5RmllbGRzIiwianNOYW1lcyIsIml0ZW1SZXNvbHZlck5hbWUiLCJnZW5KU1N0cnVjdEZpbHRlciIsInN1ZmZpeCIsIm9uIiwicmVmT24iLCJnZW5KU1VuaW9uUmVzb2x2ZXIiLCJnZW5KU0ZpbHRlciIsImdlbkpTQ3VzdG9tUmVzb2x2ZXJzIiwiam9pbkZpZWxkcyIsImZpbHRlciIsIngiLCJiaWdVSW50RmllbGRzIiwiZW51bUZpZWxkcyIsImN1c3RvbVJlc29sdmVyUmVxdWlyZWQiLCJvbkZpZWxkIiwiZmluZCIsInByZSIsInByZUNvbmRpdGlvbiIsInBvc3QiLCJwcmVmaXhMZW5ndGgiLCJnZW5KU1R5cGVSZXNvbHZlcnNGb3JVbmlvbiIsImdlbmVyYXRlIiwicWxBcnJheUZpbHRlcnMiLCJjb2xsZWN0aW9ucyIsImpzQXJyYXlGaWx0ZXJzIiwiY2xhc3MiLCJlIiwiZ2VuZXJhdGVkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBRUE7O0FBRUE7O0FBRUEsTUFBTUEsY0FBYyxHQUFHO0FBQ25CQyxFQUFBQSxVQUFVLEVBQUUsWUFETztBQUVuQkMsRUFBQUEsTUFBTSxFQUFFLFFBRlc7QUFHbkJDLEVBQUFBLEtBQUssRUFBRSxPQUhZO0FBSW5CQyxFQUFBQSxNQUFNLEVBQUU7QUFKVyxDQUF2Qjs7QUFzQ0EsU0FBU0MsVUFBVCxDQUFvQkMsSUFBcEIsRUFBMEM7QUFDdEMsU0FBTztBQUNIQSxJQUFBQSxJQURHO0FBRUhDLElBQUFBLFFBQVEsRUFBRVAsY0FBYyxDQUFDRSxNQUZ0QjtBQUdITSxJQUFBQSxNQUFNLEVBQUUsRUFITDtBQUlIQyxJQUFBQSxHQUFHLEVBQUU7QUFKRixHQUFQO0FBTUg7O0FBRUQsTUFBTUMsV0FBVyxHQUFHO0FBQ2hCQyxFQUFBQSxHQUFHLEVBQUVOLFVBQVUsQ0FBQyxLQUFELENBREM7QUFFaEJPLEVBQUFBLE1BQU0sRUFBRVAsVUFBVSxDQUFDLFFBQUQsQ0FGRjtBQUdoQlEsRUFBQUEsUUFBUSxFQUFFUixVQUFVLENBQUMsUUFBRCxDQUhKO0FBSWhCUyxFQUFBQSxLQUFLLEVBQUVULFVBQVUsQ0FBQyxPQUFELENBSkQ7QUFLaEJVLEVBQUFBLE9BQU8sRUFBRVYsVUFBVSxDQUFDLFNBQUQsQ0FMSDtBQU1oQlcsRUFBQUEsTUFBTSxFQUFFWCxVQUFVLENBQUMsUUFBRDtBQU5GLENBQXBCOztBQVNBLFNBQVNZLFFBQVQsQ0FBa0JDLElBQWxCLEVBQXlDO0FBQ3JDLFNBQU9BLElBQUksS0FBS1IsV0FBVyxDQUFDRyxRQUFyQixJQUFpQ0ssSUFBSSxLQUFLUixXQUFXLENBQUNFLE1BQTdEO0FBQ0g7O0FBRUQsU0FBU08sY0FBVCxDQUF3QmIsSUFBeEIsRUFBOEM7QUFDMUMsU0FBTztBQUNIQSxJQUFBQSxJQURHO0FBRUhDLElB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QUFBQSxFQUFFLEVBQUVBLEVBQUUsQ0FBQ2dFLFNBQUgsRUFERDtBQUVIOUQsSUFBQUEsRUFBRSxFQUFFQSxFQUFFLENBQUM4RCxTQUFIO0FBRkQsR0FBUDtBQUlIOztlQUVjaEgsSSIsInNvdXJjZXNDb250ZW50IjpbIi8vQGZsb3dcblxuaW1wb3J0IHsgbWFrZUZpZWxkVHlwZU5hbWUsIFdyaXRlciB9IGZyb20gJ3Rvbi1sYWJzLWRldi1vcHMvZGlzdC9zcmMvZ2VuLmpzJztcbmltcG9ydCB0eXBlIHsgU2NoZW1hRG9jLCBTY2hlbWFNZW1iZXIsIFNjaGVtYVR5cGUsIFR5cGVEZWYgfSBmcm9tICd0b24tbGFicy1kZXYtb3BzL3NyYy9zY2hlbWEuanMnO1xuaW1wb3J0IHsgcGFyc2VUeXBlRGVmIH0gZnJvbSAndG9uLWxhYnMtZGV2LW9wcy9kaXN0L3NyYy9zY2hlbWEuanMnO1xuXG5jb25zdCBEYlR5cGVDYXRlZ29yeSA9IHtcbiAgICB1bnJlc29sdmVkOiAndW5yZXNvbHZlZCcsXG4gICAgc2NhbGFyOiAnc2NhbGFyJyxcbiAgICB1bmlvbjogJ3VuaW9uJyxcbiAgICBzdHJ1Y3Q6ICdzdHJ1Y3QnLFxufTtcblxudHlwZSBEYkpvaW4gPSB7XG4gICAgY29sbGVjdGlvbjogc3RyaW5nLFxuICAgIG9uOiBzdHJpbmcsXG4gICAgcmVmT246IHN0cmluZyxcbiAgICBwcmVDb25kaXRpb246IHN0cmluZyxcbn1cblxudHlwZSBEYlR5cGUgPSB7XG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGZpZWxkczogRGJGaWVsZFtdLFxuICAgIGNhdGVnb3J5OiAndW5yZXNvbHZlZCcgfCAnc2NhbGFyJyB8ICd1bmlvbicgfCAnc3RydWN0JyxcbiAgICBjb2xsZWN0aW9uPzogc3RyaW5nLFxuICAgIGRvYzogc3RyaW5nLFxufVxuXG50eXBlIEludEVudW1EZWYgPSB7XG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHZhbHVlczoge1xuICAgICAgICBbc3RyaW5nXTogbnVtYmVyXG4gICAgfSxcbn1cblxudHlwZSBEYkZpZWxkID0ge1xuICAgIG5hbWU6IHN0cmluZyxcbiAgICB0eXBlOiBEYlR5cGUsXG4gICAgYXJyYXlEZXB0aDogbnVtYmVyLFxuICAgIGpvaW4/OiBEYkpvaW4sXG4gICAgZW51bURlZj86IEludEVudW1EZWYsXG4gICAgZG9jOiBzdHJpbmcsXG59XG5cbmZ1bmN0aW9uIHNjYWxhclR5cGUobmFtZTogc3RyaW5nKTogRGJUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBuYW1lLFxuICAgICAgICBjYXRlZ29yeTogRGJUeXBlQ2F0ZWdvcnkuc2NhbGFyLFxuICAgICAgICBmaWVsZHM6IFtdLFxuICAgICAgICBkb2M6ICcnLFxuICAgIH1cbn1cblxuY29uc3Qgc2NhbGFyVHlwZXMgPSB7XG4gICAgaW50OiBzY2FsYXJUeXBlKCdJbnQnKSxcbiAgICB1aW50NjQ6IHNjYWxhclR5cGUoJ1N0cmluZycpLFxuICAgIHVpbnQxMDI0OiBzY2FsYXJUeXBlKCdTdHJpbmcnKSxcbiAgICBmbG9hdDogc2NhbGFyVHlwZSgnRmxvYXQnKSxcbiAgICBib29sZWFuOiBzY2FsYXJUeXBlKCdCb29sZWFuJyksXG4gICAgc3RyaW5nOiBzY2FsYXJUeXBlKCdTdHJpbmcnKSxcbn07XG5cbmZ1bmN0aW9uIGlzQmlnSW50KHR5cGU6IERiVHlwZSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0eXBlID09PSBzY2FsYXJUeXBlcy51aW50MTAyNCB8fCB0eXBlID09PSBzY2FsYXJUeXBlcy51aW50NjQ7XG59XG5cbmZ1bmN0aW9uIHVucmVzb2x2ZWRUeXBlKG5hbWU6IHN0cmluZyk6IERiVHlwZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgbmFtZSxcbiAgICAgICAgY2F0ZWdvcnk6IERiVHlwZUNhdGVnb3J5LnVucmVzb2x2ZWQsXG4gICAgICAgIGZpZWxkczogW10sXG4gICAgICAgIGRvYzogJycsXG4gICAgfVxufVxuXG5mdW5jdGlvbiBpc0xvd2VyQ2FzZWQoczogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgY29uc3QgbCA9IHMudG9Mb3dlckNhc2UoKTtcbiAgICBjb25zdCB1ID0gcy50b1VwcGVyQ2FzZSgpO1xuICAgIHJldHVybiAodSAhPT0gbCkgJiYgKHMgPT09IGwpO1xufVxuXG5mdW5jdGlvbiBpc1VwcGVyQ2FzZWQoczogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgY29uc3QgbCA9IHMudG9Mb3dlckNhc2UoKTtcbiAgICBjb25zdCB1ID0gcy50b1VwcGVyQ2FzZSgpO1xuICAgIHJldHVybiAodSAhPT0gbCkgJiYgKHMgPT09IHUpO1xufVxuXG5mdW5jdGlvbiB0b0FsbENhcHMoczogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBsZXQgcmVzdWx0ID0gJyc7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGlmICgoaSA+IDApICYmIChzW2kgLSAxXSAhPT0gJ18nKSAmJiBpc0xvd2VyQ2FzZWQoc1tpIC0gMV0pICYmIGlzVXBwZXJDYXNlZChzW2ldKSkge1xuICAgICAgICAgICAgcmVzdWx0ICs9ICdfJztcbiAgICAgICAgfVxuICAgICAgICByZXN1bHQgKz0gc1tpXTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdC50b1VwcGVyQ2FzZSgpO1xufVxuXG5mdW5jdGlvbiB0b0VudW1TdHlsZShzOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiBgJHtzLnN1YnN0cigwLCAxKS50b1VwcGVyQ2FzZSgpfSR7cy5zdWJzdHIoMSl9YDtcbn1cblxuZnVuY3Rpb24gc3RyaW5naWZ5RW51bVZhbHVlcyh2YWx1ZXM6IHsgW3N0cmluZ106IG51bWJlciB9KTogc3RyaW5nIHtcbiAgICBjb25zdCBmaWVsZHMgPSBPYmplY3QuZW50cmllcyh2YWx1ZXMpLm1hcCgoW25hbWUsIHZhbHVlXSkgPT4ge1xuICAgICAgICByZXR1cm4gYCR7dG9FbnVtU3R5bGUobmFtZSl9OiAkeyh2YWx1ZTogYW55KX1gO1xuICAgIH0pO1xuICAgIHJldHVybiBgeyAke2ZpZWxkcy5qb2luKCcsICcpfSB9YDtcbn1cblxuZnVuY3Rpb24gZ2V0RG9jTUQoc2NoZW1hOiBTY2hlbWFEb2MpOiBzdHJpbmcge1xuICAgIGNvbnN0IGRvYyA9IHNjaGVtYS5kb2M7XG4gICAgaWYgKCFkb2MpIHtcbiAgICAgICAgcmV0dXJuICcnO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGRvYyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgcmV0dXJuIGRvYztcbiAgICB9XG4gICAgaWYgKGRvYy5tZCkge1xuICAgICAgICByZXR1cm4gKGRvYy5tZDogYW55KTtcbiAgICB9XG4gICAgcmV0dXJuICcnO1xufVxuXG5mdW5jdGlvbiBtYWluKHNjaGVtYURlZjogVHlwZURlZikge1xuXG4gICAgbGV0IGRiVHlwZXM6IERiVHlwZVtdID0gW107XG4gICAgbGV0IGxhc3RSZXBvcnRlZFR5cGU6IHN0cmluZyA9ICcnO1xuICAgIGxldCBlbnVtVHlwZXM6IE1hcDxzdHJpbmcsIEludEVudW1EZWY+ID0gbmV3IE1hcCgpO1xuXG4gICAgZnVuY3Rpb24gcmVwb3J0VHlwZShuYW1lOiBzdHJpbmcsIGZpZWxkOiBzdHJpbmcsIHR5cGU6IHN0cmluZykge1xuICAgICAgICBpZiAobmFtZSAhPT0gbGFzdFJlcG9ydGVkVHlwZSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2cobmFtZSk7XG4gICAgICAgICAgICBsYXN0UmVwb3J0ZWRUeXBlID0gbmFtZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmxvZyhgICAgICR7ZmllbGR9OiAke3R5cGV9YCk7XG5cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZURiRmllbGQoXG4gICAgICAgIHR5cGVOYW1lOiBzdHJpbmcsXG4gICAgICAgIHNjaGVtYUZpZWxkOiBTY2hlbWFNZW1iZXI8U2NoZW1hVHlwZT4sXG4gICAgKTogRGJGaWVsZCB7XG4gICAgICAgIGxldCBzY2hlbWFUeXBlID0gc2NoZW1hRmllbGQ7XG4gICAgICAgIGNvbnN0IGZpZWxkOiBEYkZpZWxkID0ge1xuICAgICAgICAgICAgbmFtZTogc2NoZW1hRmllbGQubmFtZSxcbiAgICAgICAgICAgIGFycmF5RGVwdGg6IDAsXG4gICAgICAgICAgICB0eXBlOiBzY2FsYXJUeXBlcy5zdHJpbmcsXG4gICAgICAgICAgICBkb2M6IGdldERvY01EKHNjaGVtYUZpZWxkKSxcbiAgICAgICAgfTtcbiAgICAgICAgd2hpbGUgKHNjaGVtYVR5cGUuYXJyYXkpIHtcbiAgICAgICAgICAgIGZpZWxkLmFycmF5RGVwdGggKz0gMTtcbiAgICAgICAgICAgIHNjaGVtYVR5cGUgPSBzY2hlbWFUeXBlLmFycmF5O1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGVudW1EZWY6ID9JbnRFbnVtRGVmID0gKHNjaGVtYVR5cGUuXyAmJiBzY2hlbWFUeXBlLl8uZW51bSkgfHwgbnVsbDtcbiAgICAgICAgaWYgKGVudW1EZWYpIHtcbiAgICAgICAgICAgIGZpZWxkLmVudW1EZWYgPSBlbnVtRGVmO1xuICAgICAgICAgICAgZW51bVR5cGVzLnNldChlbnVtRGVmLm5hbWUsIGVudW1EZWYpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGpvaW4gPSAoc2NoZW1hVHlwZTogYW55KS5fLmpvaW47XG4gICAgICAgIGlmIChqb2luKSB7XG4gICAgICAgICAgICBmaWVsZC5qb2luID0gam9pbjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc2NoZW1hVHlwZS51bmlvbiB8fCBzY2hlbWFUeXBlLnN0cnVjdCkge1xuICAgICAgICAgICAgZmllbGQudHlwZSA9IHVucmVzb2x2ZWRUeXBlKG1ha2VGaWVsZFR5cGVOYW1lKHR5cGVOYW1lLCBzY2hlbWFGaWVsZC5uYW1lKSk7XG4gICAgICAgIH0gZWxzZSBpZiAoc2NoZW1hVHlwZS5yZWYpIHtcbiAgICAgICAgICAgIGZpZWxkLnR5cGUgPSB1bnJlc29sdmVkVHlwZShzY2hlbWFUeXBlLnJlZi5uYW1lKTtcbiAgICAgICAgfSBlbHNlIGlmIChzY2hlbWFUeXBlLmJvb2wpIHtcbiAgICAgICAgICAgIGZpZWxkLnR5cGUgPSBzY2FsYXJUeXBlcy5ib29sZWFuO1xuICAgICAgICB9IGVsc2UgaWYgKHNjaGVtYVR5cGUuaW50KSB7XG4gICAgICAgICAgICBjb25zdCB1bnNpZ25lZDogYm9vbGVhbiA9IChzY2hlbWFUeXBlLmludCAmJiBzY2hlbWFUeXBlLmludC51bnNpZ25lZCkgfHwgZmFsc2U7XG4gICAgICAgICAgICBjb25zdCBzaXplOiBudW1iZXIgPSAoc2NoZW1hVHlwZS5pbnQgJiYgc2NoZW1hVHlwZS5pbnQuc2l6ZSkgfHwgMzI7XG4gICAgICAgICAgICBpZiAodW5zaWduZWQpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2l6ZSA+PSAxMjgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVwb3J0VHlwZSh0eXBlTmFtZSwgZmllbGQubmFtZSwgJ3UxMDI0Jyk7XG4gICAgICAgICAgICAgICAgICAgIGZpZWxkLnR5cGUgPSBzY2FsYXJUeXBlcy51aW50MTAyNDtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHNpemUgPj0gNjQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVwb3J0VHlwZSh0eXBlTmFtZSwgZmllbGQubmFtZSwgJ3U2NCcpO1xuICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlID0gc2NhbGFyVHlwZXMudWludDY0O1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc2l6ZSA+PSAzMikge1xuICAgICAgICAgICAgICAgICAgICByZXBvcnRUeXBlKHR5cGVOYW1lLCBmaWVsZC5uYW1lLCAndTMyJyk7XG4gICAgICAgICAgICAgICAgICAgIGZpZWxkLnR5cGUgPSBzY2FsYXJUeXBlcy5mbG9hdDtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXBvcnRUeXBlKHR5cGVOYW1lLCBmaWVsZC5uYW1lLCBgdSR7c2l6ZX1gKTtcbiAgICAgICAgICAgICAgICAgICAgZmllbGQudHlwZSA9IHNjYWxhclR5cGVzLmludDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChzaXplID4gMzIpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnRlZ2VyIHR5cGUgd2l0aCBzaXplICR7c2l6ZX0gYml0IGRvZXMgbm90IHN1cHBvcnRlZGApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcG9ydFR5cGUodHlwZU5hbWUsIGZpZWxkLm5hbWUsICdpMzInKTtcbiAgICAgICAgICAgICAgICAgICAgZmllbGQudHlwZSA9IHNjYWxhclR5cGVzLmludDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoc2NoZW1hVHlwZS5mbG9hdCkge1xuICAgICAgICAgICAgcmVwb3J0VHlwZSh0eXBlTmFtZSwgZmllbGQubmFtZSwgJ2Zsb2F0Jyk7XG4gICAgICAgICAgICBmaWVsZC50eXBlID0gc2NhbGFyVHlwZXMuZmxvYXQ7XG4gICAgICAgIH0gZWxzZSBpZiAoc2NoZW1hVHlwZS5zdHJpbmcpIHtcbiAgICAgICAgICAgIGZpZWxkLnR5cGUgPSBzY2FsYXJUeXBlcy5zdHJpbmc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmaWVsZC50eXBlID0gc2NhbGFyVHlwZXMuc3RyaW5nO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ0ludmFsaWQgZmllbGQgdHlwZTogJywgSlNPTi5zdHJpbmdpZnkoc2NoZW1hVHlwZSkpO1xuICAgICAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmaWVsZDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB1bndyYXBBcnJheXModHlwZTogU2NoZW1hVHlwZSk6IFNjaGVtYVR5cGUge1xuICAgICAgICBpZiAodHlwZS5hcnJheSkge1xuICAgICAgICAgICAgcmV0dXJuIHVud3JhcEFycmF5cyh0eXBlLmFycmF5KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHlwZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZURiVHlwZShcbiAgICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgICBzY2hlbWFUeXBlOiBTY2hlbWFUeXBlXG4gICAgKSB7XG4gICAgICAgIGNvbnN0IHN0cnVjdCA9IHNjaGVtYVR5cGUudW5pb24gfHwgc2NoZW1hVHlwZS5zdHJ1Y3Q7XG4gICAgICAgIGlmICghc3RydWN0KSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgPz8gJHtuYW1lfTogJHtKU09OLnN0cmluZ2lmeShzY2hlbWFUeXBlKS5zdWJzdHIoMCwgMjAwKX1gKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0eXBlOiBEYlR5cGUgPSB7XG4gICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgY2F0ZWdvcnk6IHNjaGVtYVR5cGUudW5pb24gPyBEYlR5cGVDYXRlZ29yeS51bmlvbiA6IERiVHlwZUNhdGVnb3J5LnN0cnVjdCxcbiAgICAgICAgICAgIGZpZWxkczogW10sXG4gICAgICAgICAgICBjb2xsZWN0aW9uOiAoc2NoZW1hVHlwZTogYW55KS5fLmNvbGxlY3Rpb24sXG4gICAgICAgICAgICBkb2M6IGdldERvY01EKHNjaGVtYVR5cGUpLFxuICAgICAgICB9O1xuXG4gICAgICAgIGlmICh0eXBlLmNvbGxlY3Rpb24pIHtcbiAgICAgICAgICAgIHR5cGUuZmllbGRzLnB1c2goe1xuICAgICAgICAgICAgICAgIG5hbWU6ICdpZCcsXG4gICAgICAgICAgICAgICAgYXJyYXlEZXB0aDogMCxcbiAgICAgICAgICAgICAgICB0eXBlOiBzY2FsYXJUeXBlcy5zdHJpbmcsXG4gICAgICAgICAgICAgICAgZG9jOiAnJyxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHN0cnVjdC5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgdHlwZS5maWVsZHMucHVzaChwYXJzZURiRmllbGQobmFtZSwgZmllbGQpKTtcbiAgICAgICAgICAgIGNvbnN0IHVud3JhcHBlZCA9IHVud3JhcEFycmF5cyhmaWVsZCk7XG4gICAgICAgICAgICBjb25zdCBvd25UeXBlID0gKHVud3JhcHBlZC5zdHJ1Y3QgfHwgdW53cmFwcGVkLnVuaW9uKSA/IHVud3JhcHBlZCA6IG51bGw7XG4gICAgICAgICAgICBpZiAob3duVHlwZSkge1xuICAgICAgICAgICAgICAgIHBhcnNlRGJUeXBlKG1ha2VGaWVsZFR5cGVOYW1lKG5hbWUsIGZpZWxkLm5hbWUpLCBvd25UeXBlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGRiVHlwZXMucHVzaCh0eXBlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZURiVHlwZXModHlwZXM6IFNjaGVtYU1lbWJlcjxTY2hlbWFUeXBlPltdKSB7XG4gICAgICAgIHR5cGVzLmZvckVhY2goKHR5cGU6IFNjaGVtYU1lbWJlcjxTY2hlbWFUeXBlPikgPT4ge1xuICAgICAgICAgICAgcGFyc2VEYlR5cGUodHlwZS5uYW1lLCB0eXBlKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IHVucmVzb2x2ZWQ6IE1hcDxzdHJpbmcsIERiVHlwZT4gPSBuZXcgTWFwPHN0cmluZywgRGJUeXBlPigpO1xuICAgICAgICBjb25zdCByZXNvbHZpbmc6IFNldDxzdHJpbmc+ID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgICAgIGNvbnN0IHJlc29sdmVkOiBNYXA8c3RyaW5nLCBEYlR5cGU+ID0gbmV3IE1hcDxzdHJpbmcsIERiVHlwZT4oKTtcbiAgICAgICAgY29uc3Qgb3JkZXJlZFJlc29sdmVkOiBEYlR5cGVbXSA9IFtdO1xuICAgICAgICBkYlR5cGVzLmZvckVhY2godCA9PiB1bnJlc29sdmVkLnNldCh0Lm5hbWUsIHQpKTtcbiAgICAgICAgY29uc3QgcmVzb2x2ZVR5cGUgPSAodHlwZTogRGJUeXBlKSA9PiB7XG4gICAgICAgICAgICBpZiAocmVzb2x2ZWQuaGFzKHR5cGUubmFtZSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocmVzb2x2aW5nLmhhcyh0eXBlLm5hbWUpKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFdBUk5JTkc6IENpcmN1bGFyIHJlZmVyZW5jZSB0byB0eXBlICR7dHlwZS5uYW1lfWApO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlc29sdmluZy5hZGQodHlwZS5uYW1lKTtcbiAgICAgICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGZpZWxkLnR5cGUuY2F0ZWdvcnkgPT09IERiVHlwZUNhdGVnb3J5LnVucmVzb2x2ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHR5cGUgPSByZXNvbHZlZC5nZXQoZmllbGQudHlwZS5uYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlID0gdW5yZXNvbHZlZC5nZXQoZmllbGQudHlwZS5uYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZVR5cGUodHlwZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBSZWZlcmVuY2VkIHR5cGUgbm90IGZvdW5kOiAke2ZpZWxkLnR5cGUubmFtZX1gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpZWxkLnR5cGUgPSB0eXBlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXNvbHZpbmcuZGVsZXRlKHR5cGUubmFtZSk7XG4gICAgICAgICAgICBvcmRlcmVkUmVzb2x2ZWQucHVzaCh0eXBlKTtcbiAgICAgICAgICAgIHVucmVzb2x2ZWQuZGVsZXRlKHR5cGUubmFtZSk7XG4gICAgICAgICAgICByZXNvbHZlZC5zZXQodHlwZS5uYW1lLCB0eXBlKTtcbiAgICAgICAgfTtcbiAgICAgICAgZGJUeXBlcy5mb3JFYWNoKHJlc29sdmVUeXBlKTtcbiAgICAgICAgZGJUeXBlcyA9IG9yZGVyZWRSZXNvbHZlZDtcbiAgICB9XG5cbi8vIEdlbmVyYXRvcnNcblxuICAgIGNvbnN0IHFsID0gbmV3IFdyaXRlcigpO1xuICAgIGNvbnN0IGpzID0gbmV3IFdyaXRlcigpO1xuXG4gICAgZnVuY3Rpb24gZ2VuUUxEb2MocHJlZml4OiBzdHJpbmcsIGRvYzogc3RyaW5nKSB7XG4gICAgICAgIGlmIChkb2MudHJpbSgpID09PSAnJykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGxpbmVzID0gZG9jLnNwbGl0KC9cXG5cXHI/fFxcclxcbj8vKTtcbiAgICAgICAgaWYgKGxpbmVzLmxlbmd0aCA9PT0gMSAmJiAhbGluZXNbMF0uaW5jbHVkZXMoJ1wiJykpIHtcbiAgICAgICAgICAgIHFsLndyaXRlTG4ocHJlZml4LCAnXCInLCBsaW5lc1swXSwgJ1wiJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBxbC53cml0ZUxuKHByZWZpeCwgJ1wiXCJcIicpO1xuICAgICAgICAgICAgbGluZXMuZm9yRWFjaCgobGluZSkgPT4ge1xuICAgICAgICAgICAgICAgIHFsLndyaXRlTG4ocHJlZml4LCBsaW5lKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcWwud3JpdGVMbihwcmVmaXgsICdcIlwiXCInKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHVuaW9uVmFyaWFudFR5cGUodHlwZTogRGJUeXBlLCB2YXJpYW50OiBEYkZpZWxkKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIGAke3R5cGUubmFtZX0ke3ZhcmlhbnQubmFtZX1WYXJpYW50YDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5RTFR5cGVEZWNsYXJhdGlvbnNGb3JVbmlvblZhcmlhbnRzKHR5cGU6IERiVHlwZSkge1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKCh2YXJpYW50KSA9PiB7XG4gICAgICAgICAgICBxbC53cml0ZUJsb2NrTG4oYFxuICAgICAgICB0eXBlICR7dW5pb25WYXJpYW50VHlwZSh0eXBlLCB2YXJpYW50KX0ge1xuICAgICAgICAgICAgJHt2YXJpYW50Lm5hbWV9OiAke3ZhcmlhbnQudHlwZS5uYW1lfVxuICAgICAgICB9XG5cbiAgICAgICAgYCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlblFMRW51bVR5cGVzKCkge1xuICAgICAgICBmb3IgKGNvbnN0IGVudW1EZWY6IEludEVudW1EZWYgb2YgZW51bVR5cGVzLnZhbHVlcygpKSB7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGBlbnVtICR7ZW51bURlZi5uYW1lfUVudW0ge2ApO1xuICAgICAgICAgICAgT2JqZWN0LmtleXMoZW51bURlZi52YWx1ZXMpLmZvckVhY2goKG5hbWUpID0+IHtcbiAgICAgICAgICAgICAgICBxbC53cml0ZUxuKGAgICAgJHt0b0VudW1TdHlsZShuYW1lKX1gKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcWwud3JpdGVMbihgfWApO1xuICAgICAgICAgICAgcWwud3JpdGVMbigpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuUUxUeXBlRGVjbGFyYXRpb24odHlwZTogRGJUeXBlKSB7XG4gICAgICAgIGlmICh0eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS51bmlvbikge1xuICAgICAgICAgICAgZ2VuUUxUeXBlRGVjbGFyYXRpb25zRm9yVW5pb25WYXJpYW50cyh0eXBlKTtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oYHVuaW9uICR7dHlwZS5uYW1lfSA9IGApO1xuICAgICAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCh2YXJpYW50ID0+IHtcbiAgICAgICAgICAgICAgICBxbC53cml0ZUxuKGBcXHR8ICR7dW5pb25WYXJpYW50VHlwZSh0eXBlLCB2YXJpYW50KX1gKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcWwud3JpdGVMbigpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZ2VuUUxEb2MoJycsIHR5cGUuZG9jKTtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oYHR5cGUgJHt0eXBlLm5hbWV9IHtgKTtcbiAgICAgICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goZmllbGQgPT4ge1xuICAgICAgICAgICAgICAgIGdlblFMRG9jKCdcXHQnLCBmaWVsZC5kb2MpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHR5cGVEZWNsYXJhdGlvbiA9XG4gICAgICAgICAgICAgICAgICAgICdbJy5yZXBlYXQoZmllbGQuYXJyYXlEZXB0aCkgK1xuICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlLm5hbWUgK1xuICAgICAgICAgICAgICAgICAgICAnXScucmVwZWF0KGZpZWxkLmFycmF5RGVwdGgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHBhcmFtcyA9IGlzQmlnSW50KGZpZWxkLnR5cGUpXG4gICAgICAgICAgICAgICAgICAgID8gJyhmb3JtYXQ6IEJpZ0ludEZvcm1hdCknXG4gICAgICAgICAgICAgICAgICAgIDogJyc7XG4gICAgICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0JHtmaWVsZC5uYW1lfSR7cGFyYW1zfTogJHt0eXBlRGVjbGFyYXRpb259YCk7XG4gICAgICAgICAgICAgICAgY29uc3QgZW51bURlZiA9IGZpZWxkLmVudW1EZWY7XG4gICAgICAgICAgICAgICAgaWYgKGVudW1EZWYpIHtcbiAgICAgICAgICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0JHtmaWVsZC5uYW1lfV9uYW1lOiAke2VudW1EZWYubmFtZX1FbnVtYCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGB9YCk7XG4gICAgICAgIH1cbiAgICAgICAgcWwud3JpdGVMbigpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHByZXZlbnRUd2ljZShuYW1lOiBzdHJpbmcsIG5hbWVzOiBTZXQ8c3RyaW5nPiwgd29yazogKCkgPT4gdm9pZCkge1xuICAgICAgICBpZiAoIW5hbWVzLmhhcyhuYW1lKSkge1xuICAgICAgICAgICAgbmFtZXMuYWRkKG5hbWUpO1xuICAgICAgICAgICAgd29yaygpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuUUxGaWx0ZXJzRm9yQXJyYXlGaWVsZHModHlwZTogRGJUeXBlLCBxbE5hbWVzOiBTZXQ8c3RyaW5nPikge1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgbGV0IGl0ZW1UeXBlTmFtZSA9IGZpZWxkLnR5cGUubmFtZTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZmllbGQuYXJyYXlEZXB0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmlsdGVyTmFtZSA9IGAke2l0ZW1UeXBlTmFtZX1BcnJheUZpbHRlcmA7XG4gICAgICAgICAgICAgICAgcHJldmVudFR3aWNlKGZpbHRlck5hbWUsIHFsTmFtZXMsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcWwud3JpdGVMbihgaW5wdXQgJHtmaWx0ZXJOYW1lfSB7YCk7XG4gICAgICAgICAgICAgICAgICAgIFsnYW55JywgJ2FsbCddLmZvckVhY2goKG9wKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBxbC53cml0ZUxuKGBcXHQke29wfTogJHtpdGVtVHlwZU5hbWV9RmlsdGVyYCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBxbC53cml0ZUxuKCd9Jyk7XG4gICAgICAgICAgICAgICAgICAgIHFsLndyaXRlTG4oKTtcblxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGl0ZW1UeXBlTmFtZSArPSAnQXJyYXknO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5RTEZpbHRlcnNGb3JFbnVtTmFtZUZpZWxkcyh0eXBlOiBEYlR5cGUsIHFsTmFtZXM6IFNldDxzdHJpbmc+KSB7XG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBlbnVtRGVmID0gZmllbGQuZW51bURlZjtcbiAgICAgICAgICAgIGlmIChlbnVtRGVmKSB7XG4gICAgICAgICAgICAgICAgcHJldmVudFR3aWNlKGAke2VudW1EZWYubmFtZX1FbnVtRmlsdGVyYCwgcWxOYW1lcywgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBnZW5RTFNjYWxhclR5cGVzRmlsdGVyKGAke2VudW1EZWYubmFtZX1FbnVtYCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlblFMRmlsdGVyKHR5cGU6IERiVHlwZSwgcWxOYW1lczogU2V0PHN0cmluZz4pIHtcbiAgICAgICAgaWYgKHR5cGUuZmllbGRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGdlblFMRmlsdGVyc0ZvckFycmF5RmllbGRzKHR5cGUsIHFsTmFtZXMpO1xuICAgICAgICBnZW5RTEZpbHRlcnNGb3JFbnVtTmFtZUZpZWxkcyh0eXBlLCBxbE5hbWVzKTtcbiAgICAgICAgZ2VuUUxEb2MoJycsIHR5cGUuZG9jKTtcbiAgICAgICAgcWwud3JpdGVMbihgaW5wdXQgJHt0eXBlLm5hbWV9RmlsdGVyIHtgKTtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGdlblFMRG9jKCdcXHQnLCBmaWVsZC5kb2MpO1xuICAgICAgICAgICAgY29uc3QgdHlwZURlY2xhcmF0aW9uID0gZmllbGQudHlwZS5uYW1lICsgXCJBcnJheVwiLnJlcGVhdChmaWVsZC5hcnJheURlcHRoKTtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oYFxcdCR7ZmllbGQubmFtZX06ICR7dHlwZURlY2xhcmF0aW9ufUZpbHRlcmApO1xuICAgICAgICAgICAgY29uc3QgZW51bURlZiA9IGZpZWxkLmVudW1EZWY7XG4gICAgICAgICAgICBpZiAoZW51bURlZikge1xuICAgICAgICAgICAgICAgIHFsLndyaXRlTG4oYFxcdCR7ZmllbGQubmFtZX1fbmFtZTogJHtlbnVtRGVmLm5hbWV9RW51bUZpbHRlcmApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcWwud3JpdGVMbihgICAgIE9SOiAke3R5cGUubmFtZX1GaWx0ZXJgKTtcbiAgICAgICAgcWwud3JpdGVMbihgfWApO1xuICAgICAgICBxbC53cml0ZUxuKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuUUxTY2FsYXJUeXBlc0ZpbHRlcihuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgcWwud3JpdGVMbihgaW5wdXQgJHtuYW1lfUZpbHRlciB7YCk7XG4gICAgICAgIFsnZXEnLCAnbmUnLCAnZ3QnLCAnbHQnLCAnZ2UnLCAnbGUnXS5mb3JFYWNoKChvcCkgPT4ge1xuICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0JHtvcH06ICR7bmFtZX1gKTtcbiAgICAgICAgfSk7XG4gICAgICAgIFsnaW4nLCAnbm90SW4nXS5mb3JFYWNoKChvcCkgPT4ge1xuICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0JHtvcH06IFske25hbWV9XWApO1xuICAgICAgICB9KTtcbiAgICAgICAgcWwud3JpdGVMbignfScpO1xuICAgICAgICBxbC53cml0ZUxuKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuUUxRdWVyaWVzKHR5cGVzOiBEYlR5cGVbXSkge1xuICAgICAgICBxbC53cml0ZUJsb2NrTG4oYFxuICAgICAgICBcIlNwZWNpZnkgc29ydCBvcmRlciBkaXJlY3Rpb25cIlxuICAgICAgICBlbnVtIFF1ZXJ5T3JkZXJCeURpcmVjdGlvbiB7XG4gICAgICAgICAgICBcIkRvY3VtZW50cyB3aWxsIGJlIHNvcnRlZCBpbiBhc2NlbmRlZCBvcmRlciAoZS5nLiBmcm9tIEEgdG8gWilcIlxuICAgICAgICAgICAgQVNDXG4gICAgICAgICAgICBcIkRvY3VtZW50cyB3aWxsIGJlIHNvcnRlZCBpbiBkZXNjZW5kYW50IG9yZGVyIChlLmcuIGZyb20gWiB0byBBKVwiXG4gICAgICAgICAgICBERVNDXG4gICAgICAgIH1cblxuICAgICAgICBcbiAgICAgICAgXCJcIlwiXG4gICAgICAgIFNwZWNpZnkgaG93IHRvIHNvcnQgcmVzdWx0cy5cbiAgICAgICAgWW91IGNhbiBzb3J0IGRvY3VtZW50cyBpbiByZXN1bHQgc2V0IHVzaW5nIG1vcmUgdGhhbiBvbmUgZmllbGQuXG4gICAgICAgIFwiXCJcIlxuICAgICAgICBpbnB1dCBRdWVyeU9yZGVyQnkge1xuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgICBQYXRoIHRvIGZpZWxkIHdoaWNoIG11c3QgYmUgdXNlZCBhcyBhIHNvcnQgY3JpdGVyaWEuXG4gICAgICAgICAgICBJZiBmaWVsZCByZXNpZGVzIGRlZXAgaW4gc3RydWN0dXJlIHBhdGggaXRlbXMgbXVzdCBiZSBzZXBhcmF0ZWQgd2l0aCBkb3QgKGUuZy4gJ2Zvby5iYXIuYmF6JykuXG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICAgIHBhdGg6IFN0cmluZ1xuICAgICAgICAgICAgXCJTb3J0IG9yZGVyIGRpcmVjdGlvblwiXG4gICAgICAgICAgICBkaXJlY3Rpb246IFF1ZXJ5T3JkZXJCeURpcmVjdGlvblxuICAgICAgICB9XG5cbiAgICAgICAgdHlwZSBRdWVyeSB7XG4gICAgICAgIGApO1xuXG4gICAgICAgIHR5cGVzLmZvckVhY2goKHR5cGU6IERiVHlwZSkgPT4ge1xuICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0JHt0eXBlLmNvbGxlY3Rpb24gfHwgJyd9KGZpbHRlcjogJHt0eXBlLm5hbWV9RmlsdGVyLCBvcmRlckJ5OiBbUXVlcnlPcmRlckJ5XSwgbGltaXQ6IEludCwgdGltZW91dDogRmxvYXQsIGFjY2Vzc0tleTogU3RyaW5nLCBvcGVyYXRpb25JZDogU3RyaW5nKTogWyR7dHlwZS5uYW1lfV1gKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcWwud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgfVxuXG4gICAgICAgIGApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlblFMU3Vic2NyaXB0aW9ucyh0eXBlczogRGJUeXBlW10pIHtcbiAgICAgICAgcWwud3JpdGVMbigndHlwZSBTdWJzY3JpcHRpb24geycpO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGBcXHQke3R5cGUuY29sbGVjdGlvbiB8fCAnJ30oZmlsdGVyOiAke3R5cGUubmFtZX1GaWx0ZXIsIGFjY2Vzc0tleTogU3RyaW5nKTogJHt0eXBlLm5hbWV9YCk7XG4gICAgICAgIH0pO1xuICAgICAgICBxbC53cml0ZUxuKCd9Jyk7XG4gICAgfVxuXG5cbiAgICBmdW5jdGlvbiBnZXRTY2FsYXJSZXNvbHZlck5hbWUoZmllbGQ6IERiRmllbGQpOiBzdHJpbmcge1xuICAgICAgICBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDY0KSB7XG4gICAgICAgICAgICByZXR1cm4gJ2JpZ1VJbnQxJztcbiAgICAgICAgfVxuICAgICAgICBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDEwMjQpIHtcbiAgICAgICAgICAgIHJldHVybiAnYmlnVUludDInO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnc2NhbGFyJztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5KU0ZpbHRlcnNGb3JBcnJheUZpZWxkcyh0eXBlOiBEYlR5cGUsIGpzTmFtZXM6IFNldDxzdHJpbmc+KSB7XG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBsZXQgaXRlbVR5cGVOYW1lID0gZmllbGQudHlwZS5uYW1lO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmaWVsZC5hcnJheURlcHRoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWx0ZXJOYW1lID0gYCR7aXRlbVR5cGVOYW1lfUFycmF5YDtcbiAgICAgICAgICAgICAgICBwcmV2ZW50VHdpY2UoZmlsdGVyTmFtZSwganNOYW1lcywgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpdGVtUmVzb2x2ZXJOYW1lID0gKGkgPT09IDAgJiYgZmllbGQudHlwZS5jYXRlZ29yeSA9PT0gRGJUeXBlQ2F0ZWdvcnkuc2NhbGFyKVxuICAgICAgICAgICAgICAgICAgICAgICAgPyBnZXRTY2FsYXJSZXNvbHZlck5hbWUoZmllbGQpXG4gICAgICAgICAgICAgICAgICAgICAgICA6IGl0ZW1UeXBlTmFtZTtcbiAgICAgICAgICAgICAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgICAgICAgICBjb25zdCAke2ZpbHRlck5hbWV9ID0gYXJyYXkoKCkgPT4gJHtpdGVtUmVzb2x2ZXJOYW1lfSk7XG4gICAgICAgICAgICAgICAgYCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaXRlbVR5cGVOYW1lICs9ICdBcnJheSc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkpTU3RydWN0RmlsdGVyKHR5cGU6IERiVHlwZSkge1xuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBjb25zdCAke3R5cGUubmFtZX0gPSBzdHJ1Y3Qoe1xuICAgIGApO1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgbGV0IHR5cGVEZWNsYXJhdGlvbjogP3N0cmluZyA9IG51bGw7XG4gICAgICAgICAgICBjb25zdCBqb2luID0gZmllbGQuam9pbjtcbiAgICAgICAgICAgIGlmIChqb2luKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3VmZml4ID0gZmllbGQuYXJyYXlEZXB0aCA+IDAgPyAnQXJyYXknIDogJyc7XG4gICAgICAgICAgICAgICAgdHlwZURlY2xhcmF0aW9uID0gYGpvaW4ke3N1ZmZpeH0oJyR7am9pbi5vbn0nLCAnJHtqb2luLnJlZk9ufScsICcke2ZpZWxkLnR5cGUuY29sbGVjdGlvbiB8fCAnJ30nLCAoKSA9PiAke2ZpZWxkLnR5cGUubmFtZX0pYDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQuYXJyYXlEZXB0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB0eXBlRGVjbGFyYXRpb24gPVxuICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlLm5hbWUgK1xuICAgICAgICAgICAgICAgICAgICAnQXJyYXknLnJlcGVhdChmaWVsZC5hcnJheURlcHRoKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZS5jYXRlZ29yeSA9PT0gRGJUeXBlQ2F0ZWdvcnkuc2NhbGFyKSB7XG4gICAgICAgICAgICAgICAgdHlwZURlY2xhcmF0aW9uID0gZ2V0U2NhbGFyUmVzb2x2ZXJOYW1lKGZpZWxkKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZS5maWVsZHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHR5cGVEZWNsYXJhdGlvbiA9IGZpZWxkLnR5cGUubmFtZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0eXBlRGVjbGFyYXRpb24pIHtcbiAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgJHtmaWVsZC5uYW1lfTogJHt0eXBlRGVjbGFyYXRpb259LGApO1xuICAgICAgICAgICAgICAgIGNvbnN0IGVudW1EZWYgPSBmaWVsZC5lbnVtRGVmO1xuICAgICAgICAgICAgICAgIGlmIChlbnVtRGVmKSB7XG4gICAgICAgICAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAke2ZpZWxkLm5hbWV9X25hbWU6IGVudW1OYW1lKCcke2ZpZWxkLm5hbWV9JywgJHtzdHJpbmdpZnlFbnVtVmFsdWVzKGVudW1EZWYudmFsdWVzKX0pLGApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIH0ke3R5cGUuY29sbGVjdGlvbiA/ICcsIHRydWUnIDogJyd9KTtcblxuICAgIGApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkpTVW5pb25SZXNvbHZlcih0eXBlOiBEYlR5cGUpIHtcbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgY29uc3QgJHt0eXBlLm5hbWV9UmVzb2x2ZXIgPSB7XG4gICAgICAgICAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xuICAgICAgICBgKTtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgodmFyaWFudCkgPT4ge1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICBpZiAoJyR7dmFyaWFudC5uYW1lfScgaW4gb2JqKSB7YCk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICByZXR1cm4gJyR7dW5pb25WYXJpYW50VHlwZSh0eXBlLCB2YXJpYW50KX0nO2ApO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICB9YCk7XG4gICAgICAgIH0pO1xuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkpTRmlsdGVyKHR5cGU6IERiVHlwZSwganNOYW1lczogU2V0PHN0cmluZz4pIHtcbiAgICAgICAgaWYgKHR5cGUuZmllbGRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS51bmlvbikge1xuICAgICAgICAgICAgLy8gZ2VuSlNGaWx0ZXJzRm9yVW5pb25WYXJpYW50cyh0eXBlLCBqc05hbWVzKTtcbiAgICAgICAgfVxuICAgICAgICBnZW5KU0ZpbHRlcnNGb3JBcnJheUZpZWxkcyh0eXBlLCBqc05hbWVzKTtcbiAgICAgICAgZ2VuSlNTdHJ1Y3RGaWx0ZXIodHlwZSk7XG4gICAgICAgIGlmICh0eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS51bmlvbikge1xuICAgICAgICAgICAgZ2VuSlNVbmlvblJlc29sdmVyKHR5cGUpO1xuICAgICAgICB9XG5cblxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlIGN1c3RvbSByZXNvbHZlcnMgZm9yIHR5cGVzIHdpdGg6XG4gICAgICogLSBpZCBmaWVsZFxuICAgICAqIC0gam9pbiBmaWVsZHNcbiAgICAgKiAtIHU2NCBhbmQgaGlnaGVyIGZpZWxkc1xuICAgICAqIEBwYXJhbSB0eXBlXG4gICAgICovXG4gICAgZnVuY3Rpb24gZ2VuSlNDdXN0b21SZXNvbHZlcnModHlwZTogRGJUeXBlKSB7XG4gICAgICAgIGNvbnN0IGpvaW5GaWVsZHMgPSB0eXBlLmZpZWxkcy5maWx0ZXIoeCA9PiAhIXguam9pbik7XG4gICAgICAgIGNvbnN0IGJpZ1VJbnRGaWVsZHMgPSB0eXBlLmZpZWxkcy5maWx0ZXIoKHg6IERiRmllbGQpID0+IGlzQmlnSW50KHgudHlwZSkpO1xuICAgICAgICBjb25zdCBlbnVtRmllbGRzID0gdHlwZS5maWVsZHMuZmlsdGVyKHggPT4geC5lbnVtRGVmKTtcbiAgICAgICAgY29uc3QgY3VzdG9tUmVzb2x2ZXJSZXF1aXJlZCA9IHR5cGUuY29sbGVjdGlvblxuICAgICAgICAgICAgfHwgam9pbkZpZWxkcy5sZW5ndGggPiAwXG4gICAgICAgICAgICB8fCBiaWdVSW50RmllbGRzLmxlbmd0aCA+IDBcbiAgICAgICAgICAgIHx8IGVudW1GaWVsZHMubGVuZ3RoID4gMDtcbiAgICAgICAgaWYgKCFjdXN0b21SZXNvbHZlclJlcXVpcmVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAganMud3JpdGVMbihgICAgICAgICAke3R5cGUubmFtZX06IHtgKTtcbiAgICAgICAgaWYgKHR5cGUuY29sbGVjdGlvbikge1xuICAgICAgICAgICAganMud3JpdGVMbignICAgICAgICAgICAgaWQocGFyZW50KSB7Jyk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKCcgICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5OycpO1xuICAgICAgICAgICAganMud3JpdGVMbignICAgICAgICAgICAgfSwnKTtcbiAgICAgICAgfVxuICAgICAgICBqb2luRmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBqb2luID0gZmllbGQuam9pbjtcbiAgICAgICAgICAgIGlmICgham9pbikge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IG9uRmllbGQgPSB0eXBlLmZpZWxkcy5maW5kKHggPT4geC5uYW1lID09PSBqb2luLm9uKTtcbiAgICAgICAgICAgIGlmICghb25GaWVsZCkge1xuICAgICAgICAgICAgICAgIHRocm93ICdKb2luIG9uIGZpZWxkIGRvZXMgbm90IGV4aXN0Lic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBvbiA9IGpvaW4ub24gPT09ICdpZCcgPyAnX2tleScgOiAoam9pbi5vbiB8fCAnX2tleScpO1xuICAgICAgICAgICAgY29uc3QgcmVmT24gPSBqb2luLnJlZk9uID09PSAnaWQnID8gJ19rZXknIDogKGpvaW4ucmVmT24gfHwgJ19rZXknKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbGxlY3Rpb24gPSBmaWVsZC50eXBlLmNvbGxlY3Rpb247XG4gICAgICAgICAgICBpZiAoIWNvbGxlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICB0aHJvdyAnSm9pbmVkIHR5cGUgaXMgbm90IGEgY29sbGVjdGlvbi4nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgJHtmaWVsZC5uYW1lfShwYXJlbnQsIF9hcmdzLCBjb250ZXh0KSB7YCk7XG4gICAgICAgICAgICBjb25zdCBwcmUgPSBqb2luLnByZUNvbmRpdGlvbiA/IGAke2pvaW4ucHJlQ29uZGl0aW9ufSA/IGAgOiAnJztcbiAgICAgICAgICAgIGNvbnN0IHBvc3QgPSBqb2luLnByZUNvbmRpdGlvbiA/IGAgOiBudWxsYCA6ICcnO1xuICAgICAgICAgICAgaWYgKGZpZWxkLmFycmF5RGVwdGggPT09IDApIHtcbiAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAgICAgcmV0dXJuICR7cHJlfWNvbnRleHQuZGIuJHtjb2xsZWN0aW9ufS53YWl0Rm9yRG9jKHBhcmVudC4ke29ufSwgJyR7cmVmT259Jykke3Bvc3R9O2ApO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC5hcnJheURlcHRoID09PSAxKSB7XG4gICAgICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgICAgIHJldHVybiAke3ByZX1jb250ZXh0LmRiLiR7Y29sbGVjdGlvbn0ud2FpdEZvckRvY3MocGFyZW50LiR7b259LCAnJHtyZWZPbn0nKSR7cG9zdH07YCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93ICdKb2lucyBvbiBhIG5lc3RlZCBhcnJheXMgZG9lcyBub3Qgc3VwcG9ydGVkLic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICB9LGApO1xuICAgICAgICB9KTtcbiAgICAgICAgYmlnVUludEZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcHJlZml4TGVuZ3RoID0gZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDY0ID8gMSA6IDI7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAke2ZpZWxkLm5hbWV9KHBhcmVudCwgYXJncykge2ApO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgke3ByZWZpeExlbmd0aH0sIHBhcmVudC4ke2ZpZWxkLm5hbWV9LCBhcmdzKTtgKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgIH0sYCk7XG4gICAgICAgIH0pO1xuICAgICAgICBlbnVtRmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBlbnVtRGVmID0gZmllbGQuZW51bURlZjtcbiAgICAgICAgICAgIGlmIChlbnVtRGVmKSB7XG4gICAgICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgJHtmaWVsZC5uYW1lfV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCcke2ZpZWxkLm5hbWV9JywgJHtzdHJpbmdpZnlFbnVtVmFsdWVzKGVudW1EZWYudmFsdWVzKX0pLGApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAganMud3JpdGVMbihgICAgICAgICB9LGApO1xuICAgIH1cblxuXG4gICAgZnVuY3Rpb24gZ2VuSlNUeXBlUmVzb2x2ZXJzRm9yVW5pb24odHlwZTogRGJUeXBlKSB7XG4gICAgICAgIGlmICh0eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS51bmlvbikge1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAke3R5cGUubmFtZX06ICR7dHlwZS5uYW1lfVJlc29sdmVyLGApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuZXJhdGUodHlwZXM6IERiVHlwZVtdKSB7XG5cbiAgICAgICAgLy8gUUxcblxuICAgICAgICBxbC53cml0ZUJsb2NrTG4oYFxuICAgICAgICBcIlwiXCJcbiAgICAgICAgRHVlIHRvIEdyYXBoUUwgbGltaXRhdGlvbnMgYmlnIG51bWJlcnMgYXJlIHJldHVybmVkIGFzIGEgc3RyaW5nLlxuICAgICAgICBZb3UgY2FuIHNwZWNpZnkgZm9ybWF0IHVzZWQgdG8gc3RyaW5nIHJlcHJlc2VudGF0aW9uIGZvciBiaWcgaW50ZWdlcnMuXG4gICAgICAgIFwiXCJcIlxuICAgICAgICBlbnVtIEJpZ0ludEZvcm1hdCB7XG4gICAgICAgICAgICBcIiBIZXhhZGVjaW1hbCByZXByZXNlbnRhdGlvbiBzdGFydGVkIHdpdGggMHggKGRlZmF1bHQpIFwiXG4gICAgICAgICAgICBIRVhcbiAgICAgICAgICAgIFwiIERlY2ltYWwgcmVwcmVzZW50YXRpb24gXCJcbiAgICAgICAgICAgIERFQ1xuICAgICAgICB9XG4gICAgICAgIGApO1xuICAgICAgICBbJ1N0cmluZycsICdCb29sZWFuJywgJ0ludCcsICdGbG9hdCddLmZvckVhY2goZ2VuUUxTY2FsYXJUeXBlc0ZpbHRlcik7XG4gICAgICAgIGdlblFMRW51bVR5cGVzKCk7XG4gICAgICAgIHR5cGVzLmZvckVhY2godHlwZSA9PiBnZW5RTFR5cGVEZWNsYXJhdGlvbih0eXBlKSk7XG4gICAgICAgIGNvbnN0IHFsQXJyYXlGaWx0ZXJzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgICAgIHR5cGVzLmZvckVhY2godHlwZSA9PiBnZW5RTEZpbHRlcih0eXBlLCBxbEFycmF5RmlsdGVycykpO1xuXG4gICAgICAgIGNvbnN0IGNvbGxlY3Rpb25zID0gdHlwZXMuZmlsdGVyKHQgPT4gISF0LmNvbGxlY3Rpb24pO1xuICAgICAgICBnZW5RTFF1ZXJpZXMoY29sbGVjdGlvbnMpO1xuICAgICAgICBnZW5RTFN1YnNjcmlwdGlvbnMoY29sbGVjdGlvbnMpO1xuXG4gICAgICAgIC8vIEpTXG5cbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgY29uc3Qge1xuICAgICAgICAgICAgc2NhbGFyLFxuICAgICAgICAgICAgYmlnVUludDEsXG4gICAgICAgICAgICBiaWdVSW50MixcbiAgICAgICAgICAgIHJlc29sdmVCaWdVSW50LFxuICAgICAgICAgICAgc3RydWN0LFxuICAgICAgICAgICAgYXJyYXksXG4gICAgICAgICAgICBqb2luLFxuICAgICAgICAgICAgam9pbkFycmF5LFxuICAgICAgICAgICAgZW51bU5hbWUsXG4gICAgICAgICAgICBjcmVhdGVFbnVtTmFtZVJlc29sdmVyLFxuICAgICAgICB9ID0gcmVxdWlyZSgnLi9kYi10eXBlcy5qcycpO1xuICAgICAgICBgKTtcbiAgICAgICAgY29uc3QganNBcnJheUZpbHRlcnMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICAgICAgdHlwZXMuZm9yRWFjaCh0eXBlID0+IGdlbkpTRmlsdGVyKHR5cGUsIGpzQXJyYXlGaWx0ZXJzKSk7XG5cbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgZnVuY3Rpb24gY3JlYXRlUmVzb2x2ZXJzKGRiKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICBgKTtcbiAgICAgICAgdHlwZXMuZm9yRWFjaCgodHlwZSkgPT4ge1xuICAgICAgICAgICAgZ2VuSlNDdXN0b21SZXNvbHZlcnModHlwZSk7XG4gICAgICAgICAgICBnZW5KU1R5cGVSZXNvbHZlcnNGb3JVbmlvbih0eXBlKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGpzLndyaXRlTG4oJyAgICAgICAgUXVlcnk6IHsnKTtcbiAgICAgICAgY29sbGVjdGlvbnMuZm9yRWFjaCgodHlwZSkgPT4ge1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgJHt0eXBlLmNvbGxlY3Rpb24gfHwgJyd9OiBkYi4ke3R5cGUuY29sbGVjdGlvbiB8fCAnJ30ucXVlcnlSZXNvbHZlcigpLGApXG4gICAgICAgIH0pO1xuICAgICAgICBqcy53cml0ZUxuKCcgICAgICAgIH0sJyk7XG4gICAgICAgIGpzLndyaXRlTG4oJyAgICAgICAgU3Vic2NyaXB0aW9uOiB7Jyk7XG4gICAgICAgIGNvbGxlY3Rpb25zLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICR7dHlwZS5jb2xsZWN0aW9uIHx8ICcnfTogZGIuJHt0eXBlLmNvbGxlY3Rpb24gfHwgJyd9LnN1YnNjcmlwdGlvblJlc29sdmVyKCksYClcbiAgICAgICAgfSk7XG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgYCk7XG5cbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgICAgICAgICBjcmVhdGVSZXNvbHZlcnMsXG4gICAgICAgIGApO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKHR5cGUgPT4ganMud3JpdGVMbihgICAgICR7dHlwZS5uYW1lfSxgKSk7XG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIH07XG4gICAgICAgIGApO1xuICAgIH1cblxuICAgIGNvbnN0IHNjaGVtYSA9IHBhcnNlVHlwZURlZihzY2hlbWFEZWYpO1xuXG4gICAgaWYgKHNjaGVtYS5jbGFzcykge1xuICAgICAgICBwYXJzZURiVHlwZXMoc2NoZW1hLmNsYXNzLnR5cGVzKTtcbiAgICAgICAgZ2VuZXJhdGUoZGJUeXBlcyk7XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBlOiBJbnRFbnVtRGVmIG9mIGVudW1UeXBlcy52YWx1ZXMoKSkge1xuICAgICAgICBjb25zb2xlLmxvZyhgZXhwb3J0IGNvbnN0IFEke2UubmFtZX0gPSB7YCk7XG4gICAgICAgIGNvbnNvbGUubG9nKE9iamVjdC5lbnRyaWVzKGUudmFsdWVzKS5tYXAoKFtuYW1lLCB2YWx1ZV0pID0+IHtcbiAgICAgICAgICAgIHJldHVybiBgICAgICR7bmFtZX06ICR7KHZhbHVlOiBhbnkpfSxgO1xuICAgICAgICB9KS5qb2luKCdcXG4nKSk7XG4gICAgICAgIGNvbnNvbGUubG9nKGB9O1xcbmApO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIHFsOiBxbC5nZW5lcmF0ZWQoKSxcbiAgICAgICAganM6IGpzLmdlbmVyYXRlZCgpLFxuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgbWFpbjtcbiJdfQ==