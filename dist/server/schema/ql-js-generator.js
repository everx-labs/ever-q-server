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
        const params = isBigInt(field.type) ? '(decimal: Boolean)' : '';
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
      ql.writeLn(`\t${type.collection || ''}(filter: ${type.name}Filter, orderBy: [QueryOrderBy], limit: Int, timeout: Float, accessKey: String): [${type.name}]`);
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
      js.writeLn(`            ${field.name}(parent) {`);
      js.writeLn(`                return resolveBigUInt(${prefixLength}, parent.${field.name});`);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NlcnZlci9zY2hlbWEvcWwtanMtZ2VuZXJhdG9yLmpzIl0sIm5hbWVzIjpbIkRiVHlwZUNhdGVnb3J5IiwidW5yZXNvbHZlZCIsInNjYWxhciIsInVuaW9uIiwic3RydWN0Iiwic2NhbGFyVHlwZSIsIm5hbWUiLCJjYXRlZ29yeSIsImZpZWxkcyIsImRvYyIsInNjYWxhclR5cGVzIiwiaW50IiwidWludDY0IiwidWludDEwMjQiLCJmbG9hdCIsImJvb2xlYW4iLCJzdHJpbmciLCJpc0JpZ0ludCIsInR5cGUiLCJ1bnJlc29sdmVkVHlwZSIsImlzTG93ZXJDYXNlZCIsInMiLCJsIiwidG9Mb3dlckNhc2UiLCJ1IiwidG9VcHBlckNhc2UiLCJpc1VwcGVyQ2FzZWQiLCJ0b0FsbENhcHMiLCJyZXN1bHQiLCJpIiwibGVuZ3RoIiwidG9FbnVtU3R5bGUiLCJzdWJzdHIiLCJzdHJpbmdpZnlFbnVtVmFsdWVzIiwidmFsdWVzIiwiT2JqZWN0IiwiZW50cmllcyIsIm1hcCIsInZhbHVlIiwiam9pbiIsImdldERvY01EIiwic2NoZW1hIiwibWQiLCJtYWluIiwic2NoZW1hRGVmIiwiZGJUeXBlcyIsImxhc3RSZXBvcnRlZFR5cGUiLCJlbnVtVHlwZXMiLCJNYXAiLCJyZXBvcnRUeXBlIiwiZmllbGQiLCJjb25zb2xlIiwibG9nIiwicGFyc2VEYkZpZWxkIiwidHlwZU5hbWUiLCJzY2hlbWFGaWVsZCIsInNjaGVtYVR5cGUiLCJhcnJheURlcHRoIiwiYXJyYXkiLCJlbnVtRGVmIiwiXyIsImVudW0iLCJzZXQiLCJyZWYiLCJib29sIiwidW5zaWduZWQiLCJzaXplIiwiRXJyb3IiLCJKU09OIiwic3RyaW5naWZ5IiwicHJvY2VzcyIsImV4aXQiLCJ1bndyYXBBcnJheXMiLCJwYXJzZURiVHlwZSIsImNvbGxlY3Rpb24iLCJwdXNoIiwiZm9yRWFjaCIsInVud3JhcHBlZCIsIm93blR5cGUiLCJwYXJzZURiVHlwZXMiLCJ0eXBlcyIsInJlc29sdmluZyIsIlNldCIsInJlc29sdmVkIiwib3JkZXJlZFJlc29sdmVkIiwidCIsInJlc29sdmVUeXBlIiwiaGFzIiwiYWRkIiwiZ2V0IiwiZGVsZXRlIiwicWwiLCJXcml0ZXIiLCJqcyIsImdlblFMRG9jIiwicHJlZml4IiwidHJpbSIsImxpbmVzIiwic3BsaXQiLCJpbmNsdWRlcyIsIndyaXRlTG4iLCJsaW5lIiwidW5pb25WYXJpYW50VHlwZSIsInZhcmlhbnQiLCJnZW5RTFR5cGVEZWNsYXJhdGlvbnNGb3JVbmlvblZhcmlhbnRzIiwid3JpdGVCbG9ja0xuIiwiZ2VuUUxFbnVtVHlwZXMiLCJrZXlzIiwiZ2VuUUxUeXBlRGVjbGFyYXRpb24iLCJ0eXBlRGVjbGFyYXRpb24iLCJyZXBlYXQiLCJwYXJhbXMiLCJwcmV2ZW50VHdpY2UiLCJuYW1lcyIsIndvcmsiLCJnZW5RTEZpbHRlcnNGb3JBcnJheUZpZWxkcyIsInFsTmFtZXMiLCJpdGVtVHlwZU5hbWUiLCJmaWx0ZXJOYW1lIiwib3AiLCJnZW5RTEZpbHRlcnNGb3JFbnVtTmFtZUZpZWxkcyIsImdlblFMU2NhbGFyVHlwZXNGaWx0ZXIiLCJnZW5RTEZpbHRlciIsImdlblFMUXVlcmllcyIsImdlblFMU3Vic2NyaXB0aW9ucyIsImdldFNjYWxhclJlc29sdmVyTmFtZSIsImdlbkpTRmlsdGVyc0ZvckFycmF5RmllbGRzIiwianNOYW1lcyIsIml0ZW1SZXNvbHZlck5hbWUiLCJnZW5KU1N0cnVjdEZpbHRlciIsInN1ZmZpeCIsIm9uIiwicmVmT24iLCJnZW5KU1VuaW9uUmVzb2x2ZXIiLCJnZW5KU0ZpbHRlciIsImdlbkpTQ3VzdG9tUmVzb2x2ZXJzIiwiam9pbkZpZWxkcyIsImZpbHRlciIsIngiLCJiaWdVSW50RmllbGRzIiwiZW51bUZpZWxkcyIsImN1c3RvbVJlc29sdmVyUmVxdWlyZWQiLCJvbkZpZWxkIiwiZmluZCIsInByZSIsInByZUNvbmRpdGlvbiIsInBvc3QiLCJwcmVmaXhMZW5ndGgiLCJnZW5KU1R5cGVSZXNvbHZlcnNGb3JVbmlvbiIsImdlbmVyYXRlIiwicWxBcnJheUZpbHRlcnMiLCJjb2xsZWN0aW9ucyIsImpzQXJyYXlGaWx0ZXJzIiwiY2xhc3MiLCJlIiwiZ2VuZXJhdGVkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBRUE7O0FBRUE7O0FBRUEsTUFBTUEsY0FBYyxHQUFHO0FBQ25CQyxFQUFBQSxVQUFVLEVBQUUsWUFETztBQUVuQkMsRUFBQUEsTUFBTSxFQUFFLFFBRlc7QUFHbkJDLEVBQUFBLEtBQUssRUFBRSxPQUhZO0FBSW5CQyxFQUFBQSxNQUFNLEVBQUU7QUFKVyxDQUF2Qjs7QUFzQ0EsU0FBU0MsVUFBVCxDQUFvQkMsSUFBcEIsRUFBMEM7QUFDdEMsU0FBTztBQUNIQSxJQUFBQSxJQURHO0FBRUhDLElBQUFBLFFBQVEsRUFBRVAsY0FBYyxDQUFDRSxNQUZ0QjtBQUdITSxJQUFBQSxNQUFNLEVBQUUsRUFITDtBQUlIQyxJQUFBQSxHQUFHLEVBQUU7QUFKRixHQUFQO0FBTUg7O0FBRUQsTUFBTUMsV0FBVyxHQUFHO0FBQ2hCQyxFQUFBQSxHQUFHLEVBQUVOLFVBQVUsQ0FBQyxLQUFELENBREM7QUFFaEJPLEVBQUFBLE1BQU0sRUFBRVAsVUFBVSxDQUFDLFFBQUQsQ0FGRjtBQUdoQlEsRUFBQUEsUUFBUSxFQUFFUixVQUFVLENBQUMsUUFBRCxDQUhKO0FBSWhCUyxFQUFBQSxLQUFLLEVBQUVULFVBQVUsQ0FBQyxPQUFELENBSkQ7QUFLaEJVLEVBQUFBLE9BQU8sRUFBRVYsVUFBVSxDQUFDLFNBQUQsQ0FMSDtBQU1oQlcsRUFBQUEsTUFBTSxFQUFFWCxVQUFVLENBQUMsUUFBRDtBQU5GLENBQXBCOztBQVNBLFNBQVNZLFFBQVQsQ0FBa0JDLElBQWxCLEVBQXlDO0FBQ3JDLFNBQU9BLElBQUksS0FBS1IsV0FBVyxDQUFDRyxRQUFyQixJQUFpQ0ssSUFBSSxLQUFLUixXQUFXLENBQUNFLE1BQTdEO0FBQ0g7O0FBRUQsU0FBU08sY0FBVCxDQUF3QmIsSUFBeEIsRUFBOEM7QUFDMUMsU0FBTztBQUNIQSxJQUFBQSxJQURHO0FBRUhDLElB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Q29udGVudCI6WyIvL0BmbG93XG5cbmltcG9ydCB7IG1ha2VGaWVsZFR5cGVOYW1lLCBXcml0ZXIgfSBmcm9tICd0b24tbGFicy1kZXYtb3BzL2Rpc3Qvc3JjL2dlbi5qcyc7XG5pbXBvcnQgdHlwZSB7IFNjaGVtYURvYywgU2NoZW1hTWVtYmVyLCBTY2hlbWFUeXBlLCBUeXBlRGVmIH0gZnJvbSAndG9uLWxhYnMtZGV2LW9wcy9zcmMvc2NoZW1hLmpzJztcbmltcG9ydCB7IHBhcnNlVHlwZURlZiB9IGZyb20gJ3Rvbi1sYWJzLWRldi1vcHMvZGlzdC9zcmMvc2NoZW1hLmpzJztcblxuY29uc3QgRGJUeXBlQ2F0ZWdvcnkgPSB7XG4gICAgdW5yZXNvbHZlZDogJ3VucmVzb2x2ZWQnLFxuICAgIHNjYWxhcjogJ3NjYWxhcicsXG4gICAgdW5pb246ICd1bmlvbicsXG4gICAgc3RydWN0OiAnc3RydWN0Jyxcbn07XG5cbnR5cGUgRGJKb2luID0ge1xuICAgIGNvbGxlY3Rpb246IHN0cmluZyxcbiAgICBvbjogc3RyaW5nLFxuICAgIHJlZk9uOiBzdHJpbmcsXG4gICAgcHJlQ29uZGl0aW9uOiBzdHJpbmcsXG59XG5cbnR5cGUgRGJUeXBlID0ge1xuICAgIG5hbWU6IHN0cmluZyxcbiAgICBmaWVsZHM6IERiRmllbGRbXSxcbiAgICBjYXRlZ29yeTogJ3VucmVzb2x2ZWQnIHwgJ3NjYWxhcicgfCAndW5pb24nIHwgJ3N0cnVjdCcsXG4gICAgY29sbGVjdGlvbj86IHN0cmluZyxcbiAgICBkb2M6IHN0cmluZyxcbn1cblxudHlwZSBJbnRFbnVtRGVmID0ge1xuICAgIG5hbWU6IHN0cmluZyxcbiAgICB2YWx1ZXM6IHtcbiAgICAgICAgW3N0cmluZ106IG51bWJlclxuICAgIH0sXG59XG5cbnR5cGUgRGJGaWVsZCA9IHtcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgdHlwZTogRGJUeXBlLFxuICAgIGFycmF5RGVwdGg6IG51bWJlcixcbiAgICBqb2luPzogRGJKb2luLFxuICAgIGVudW1EZWY/OiBJbnRFbnVtRGVmLFxuICAgIGRvYzogc3RyaW5nLFxufVxuXG5mdW5jdGlvbiBzY2FsYXJUeXBlKG5hbWU6IHN0cmluZyk6IERiVHlwZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgbmFtZSxcbiAgICAgICAgY2F0ZWdvcnk6IERiVHlwZUNhdGVnb3J5LnNjYWxhcixcbiAgICAgICAgZmllbGRzOiBbXSxcbiAgICAgICAgZG9jOiAnJyxcbiAgICB9XG59XG5cbmNvbnN0IHNjYWxhclR5cGVzID0ge1xuICAgIGludDogc2NhbGFyVHlwZSgnSW50JyksXG4gICAgdWludDY0OiBzY2FsYXJUeXBlKCdTdHJpbmcnKSxcbiAgICB1aW50MTAyNDogc2NhbGFyVHlwZSgnU3RyaW5nJyksXG4gICAgZmxvYXQ6IHNjYWxhclR5cGUoJ0Zsb2F0JyksXG4gICAgYm9vbGVhbjogc2NhbGFyVHlwZSgnQm9vbGVhbicpLFxuICAgIHN0cmluZzogc2NhbGFyVHlwZSgnU3RyaW5nJyksXG59O1xuXG5mdW5jdGlvbiBpc0JpZ0ludCh0eXBlOiBEYlR5cGUpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDEwMjQgfHwgdHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDY0O1xufVxuXG5mdW5jdGlvbiB1bnJlc29sdmVkVHlwZShuYW1lOiBzdHJpbmcpOiBEYlR5cGUge1xuICAgIHJldHVybiB7XG4gICAgICAgIG5hbWUsXG4gICAgICAgIGNhdGVnb3J5OiBEYlR5cGVDYXRlZ29yeS51bnJlc29sdmVkLFxuICAgICAgICBmaWVsZHM6IFtdLFxuICAgICAgICBkb2M6ICcnLFxuICAgIH1cbn1cblxuZnVuY3Rpb24gaXNMb3dlckNhc2VkKHM6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGwgPSBzLnRvTG93ZXJDYXNlKCk7XG4gICAgY29uc3QgdSA9IHMudG9VcHBlckNhc2UoKTtcbiAgICByZXR1cm4gKHUgIT09IGwpICYmIChzID09PSBsKTtcbn1cblxuZnVuY3Rpb24gaXNVcHBlckNhc2VkKHM6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGwgPSBzLnRvTG93ZXJDYXNlKCk7XG4gICAgY29uc3QgdSA9IHMudG9VcHBlckNhc2UoKTtcbiAgICByZXR1cm4gKHUgIT09IGwpICYmIChzID09PSB1KTtcbn1cblxuZnVuY3Rpb24gdG9BbGxDYXBzKHM6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgbGV0IHJlc3VsdCA9ICcnO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBpZiAoKGkgPiAwKSAmJiAoc1tpIC0gMV0gIT09ICdfJykgJiYgaXNMb3dlckNhc2VkKHNbaSAtIDFdKSAmJiBpc1VwcGVyQ2FzZWQoc1tpXSkpIHtcbiAgICAgICAgICAgIHJlc3VsdCArPSAnXyc7XG4gICAgICAgIH1cbiAgICAgICAgcmVzdWx0ICs9IHNbaV07XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQudG9VcHBlckNhc2UoKTtcbn1cblxuZnVuY3Rpb24gdG9FbnVtU3R5bGUoczogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYCR7cy5zdWJzdHIoMCwgMSkudG9VcHBlckNhc2UoKX0ke3Muc3Vic3RyKDEpfWA7XG59XG5cbmZ1bmN0aW9uIHN0cmluZ2lmeUVudW1WYWx1ZXModmFsdWVzOiB7IFtzdHJpbmddOiBudW1iZXIgfSk6IHN0cmluZyB7XG4gICAgY29uc3QgZmllbGRzID0gT2JqZWN0LmVudHJpZXModmFsdWVzKS5tYXAoKFtuYW1lLCB2YWx1ZV0pID0+IHtcbiAgICAgICAgcmV0dXJuIGAke3RvRW51bVN0eWxlKG5hbWUpfTogJHsodmFsdWU6IGFueSl9YDtcbiAgICB9KTtcbiAgICByZXR1cm4gYHsgJHtmaWVsZHMuam9pbignLCAnKX0gfWA7XG59XG5cbmZ1bmN0aW9uIGdldERvY01EKHNjaGVtYTogU2NoZW1hRG9jKTogc3RyaW5nIHtcbiAgICBjb25zdCBkb2MgPSBzY2hlbWEuZG9jO1xuICAgIGlmICghZG9jKSB7XG4gICAgICAgIHJldHVybiAnJztcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBkb2MgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHJldHVybiBkb2M7XG4gICAgfVxuICAgIGlmIChkb2MubWQpIHtcbiAgICAgICAgcmV0dXJuIChkb2MubWQ6IGFueSk7XG4gICAgfVxuICAgIHJldHVybiAnJztcbn1cblxuZnVuY3Rpb24gbWFpbihzY2hlbWFEZWY6IFR5cGVEZWYpIHtcblxuICAgIGxldCBkYlR5cGVzOiBEYlR5cGVbXSA9IFtdO1xuICAgIGxldCBsYXN0UmVwb3J0ZWRUeXBlOiBzdHJpbmcgPSAnJztcbiAgICBsZXQgZW51bVR5cGVzOiBNYXA8c3RyaW5nLCBJbnRFbnVtRGVmPiA9IG5ldyBNYXAoKTtcblxuICAgIGZ1bmN0aW9uIHJlcG9ydFR5cGUobmFtZTogc3RyaW5nLCBmaWVsZDogc3RyaW5nLCB0eXBlOiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKG5hbWUgIT09IGxhc3RSZXBvcnRlZFR5cGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKG5hbWUpO1xuICAgICAgICAgICAgbGFzdFJlcG9ydGVkVHlwZSA9IG5hbWU7XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5sb2coYCAgICAke2ZpZWxkfTogJHt0eXBlfWApO1xuXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VEYkZpZWxkKFxuICAgICAgICB0eXBlTmFtZTogc3RyaW5nLFxuICAgICAgICBzY2hlbWFGaWVsZDogU2NoZW1hTWVtYmVyPFNjaGVtYVR5cGU+LFxuICAgICk6IERiRmllbGQge1xuICAgICAgICBsZXQgc2NoZW1hVHlwZSA9IHNjaGVtYUZpZWxkO1xuICAgICAgICBjb25zdCBmaWVsZDogRGJGaWVsZCA9IHtcbiAgICAgICAgICAgIG5hbWU6IHNjaGVtYUZpZWxkLm5hbWUsXG4gICAgICAgICAgICBhcnJheURlcHRoOiAwLFxuICAgICAgICAgICAgdHlwZTogc2NhbGFyVHlwZXMuc3RyaW5nLFxuICAgICAgICAgICAgZG9jOiBnZXREb2NNRChzY2hlbWFGaWVsZCksXG4gICAgICAgIH07XG4gICAgICAgIHdoaWxlIChzY2hlbWFUeXBlLmFycmF5KSB7XG4gICAgICAgICAgICBmaWVsZC5hcnJheURlcHRoICs9IDE7XG4gICAgICAgICAgICBzY2hlbWFUeXBlID0gc2NoZW1hVHlwZS5hcnJheTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBlbnVtRGVmOiA/SW50RW51bURlZiA9IChzY2hlbWFUeXBlLl8gJiYgc2NoZW1hVHlwZS5fLmVudW0pIHx8IG51bGw7XG4gICAgICAgIGlmIChlbnVtRGVmKSB7XG4gICAgICAgICAgICBmaWVsZC5lbnVtRGVmID0gZW51bURlZjtcbiAgICAgICAgICAgIGVudW1UeXBlcy5zZXQoZW51bURlZi5uYW1lLCBlbnVtRGVmKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBqb2luID0gKHNjaGVtYVR5cGU6IGFueSkuXy5qb2luO1xuICAgICAgICBpZiAoam9pbikge1xuICAgICAgICAgICAgZmllbGQuam9pbiA9IGpvaW47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNjaGVtYVR5cGUudW5pb24gfHwgc2NoZW1hVHlwZS5zdHJ1Y3QpIHtcbiAgICAgICAgICAgIGZpZWxkLnR5cGUgPSB1bnJlc29sdmVkVHlwZShtYWtlRmllbGRUeXBlTmFtZSh0eXBlTmFtZSwgc2NoZW1hRmllbGQubmFtZSkpO1xuICAgICAgICB9IGVsc2UgaWYgKHNjaGVtYVR5cGUucmVmKSB7XG4gICAgICAgICAgICBmaWVsZC50eXBlID0gdW5yZXNvbHZlZFR5cGUoc2NoZW1hVHlwZS5yZWYubmFtZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoc2NoZW1hVHlwZS5ib29sKSB7XG4gICAgICAgICAgICBmaWVsZC50eXBlID0gc2NhbGFyVHlwZXMuYm9vbGVhbjtcbiAgICAgICAgfSBlbHNlIGlmIChzY2hlbWFUeXBlLmludCkge1xuICAgICAgICAgICAgY29uc3QgdW5zaWduZWQ6IGJvb2xlYW4gPSAoc2NoZW1hVHlwZS5pbnQgJiYgc2NoZW1hVHlwZS5pbnQudW5zaWduZWQpIHx8IGZhbHNlO1xuICAgICAgICAgICAgY29uc3Qgc2l6ZTogbnVtYmVyID0gKHNjaGVtYVR5cGUuaW50ICYmIHNjaGVtYVR5cGUuaW50LnNpemUpIHx8IDMyO1xuICAgICAgICAgICAgaWYgKHVuc2lnbmVkKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNpemUgPj0gMTI4KSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcG9ydFR5cGUodHlwZU5hbWUsIGZpZWxkLm5hbWUsICd1MTAyNCcpO1xuICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlID0gc2NhbGFyVHlwZXMudWludDEwMjQ7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzaXplID49IDY0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcG9ydFR5cGUodHlwZU5hbWUsIGZpZWxkLm5hbWUsICd1NjQnKTtcbiAgICAgICAgICAgICAgICAgICAgZmllbGQudHlwZSA9IHNjYWxhclR5cGVzLnVpbnQ2NDtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHNpemUgPj0gMzIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVwb3J0VHlwZSh0eXBlTmFtZSwgZmllbGQubmFtZSwgJ3UzMicpO1xuICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlID0gc2NhbGFyVHlwZXMuZmxvYXQ7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVwb3J0VHlwZSh0eXBlTmFtZSwgZmllbGQubmFtZSwgYHUke3NpemV9YCk7XG4gICAgICAgICAgICAgICAgICAgIGZpZWxkLnR5cGUgPSBzY2FsYXJUeXBlcy5pbnQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoc2l6ZSA+IDMyKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSW50ZWdlciB0eXBlIHdpdGggc2l6ZSAke3NpemV9IGJpdCBkb2VzIG5vdCBzdXBwb3J0ZWRgKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXBvcnRUeXBlKHR5cGVOYW1lLCBmaWVsZC5uYW1lLCAnaTMyJyk7XG4gICAgICAgICAgICAgICAgICAgIGZpZWxkLnR5cGUgPSBzY2FsYXJUeXBlcy5pbnQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHNjaGVtYVR5cGUuZmxvYXQpIHtcbiAgICAgICAgICAgIHJlcG9ydFR5cGUodHlwZU5hbWUsIGZpZWxkLm5hbWUsICdmbG9hdCcpO1xuICAgICAgICAgICAgZmllbGQudHlwZSA9IHNjYWxhclR5cGVzLmZsb2F0O1xuICAgICAgICB9IGVsc2UgaWYgKHNjaGVtYVR5cGUuc3RyaW5nKSB7XG4gICAgICAgICAgICBmaWVsZC50eXBlID0gc2NhbGFyVHlwZXMuc3RyaW5nO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZmllbGQudHlwZSA9IHNjYWxhclR5cGVzLnN0cmluZztcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdJbnZhbGlkIGZpZWxkIHR5cGU6ICcsIEpTT04uc3RyaW5naWZ5KHNjaGVtYVR5cGUpKTtcbiAgICAgICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmllbGQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdW53cmFwQXJyYXlzKHR5cGU6IFNjaGVtYVR5cGUpOiBTY2hlbWFUeXBlIHtcbiAgICAgICAgaWYgKHR5cGUuYXJyYXkpIHtcbiAgICAgICAgICAgIHJldHVybiB1bndyYXBBcnJheXModHlwZS5hcnJheSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHR5cGU7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VEYlR5cGUoXG4gICAgICAgIG5hbWU6IHN0cmluZyxcbiAgICAgICAgc2NoZW1hVHlwZTogU2NoZW1hVHlwZVxuICAgICkge1xuICAgICAgICBjb25zdCBzdHJ1Y3QgPSBzY2hlbWFUeXBlLnVuaW9uIHx8IHNjaGVtYVR5cGUuc3RydWN0O1xuICAgICAgICBpZiAoIXN0cnVjdCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYD8/ICR7bmFtZX06ICR7SlNPTi5zdHJpbmdpZnkoc2NoZW1hVHlwZSkuc3Vic3RyKDAsIDIwMCl9YCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdHlwZTogRGJUeXBlID0ge1xuICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgIGNhdGVnb3J5OiBzY2hlbWFUeXBlLnVuaW9uID8gRGJUeXBlQ2F0ZWdvcnkudW5pb24gOiBEYlR5cGVDYXRlZ29yeS5zdHJ1Y3QsXG4gICAgICAgICAgICBmaWVsZHM6IFtdLFxuICAgICAgICAgICAgY29sbGVjdGlvbjogKHNjaGVtYVR5cGU6IGFueSkuXy5jb2xsZWN0aW9uLFxuICAgICAgICAgICAgZG9jOiBnZXREb2NNRChzY2hlbWFUeXBlKSxcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAodHlwZS5jb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICB0eXBlLmZpZWxkcy5wdXNoKHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnaWQnLFxuICAgICAgICAgICAgICAgIGFycmF5RGVwdGg6IDAsXG4gICAgICAgICAgICAgICAgdHlwZTogc2NhbGFyVHlwZXMuc3RyaW5nLFxuICAgICAgICAgICAgICAgIGRvYzogJycsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBzdHJ1Y3QuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIHR5cGUuZmllbGRzLnB1c2gocGFyc2VEYkZpZWxkKG5hbWUsIGZpZWxkKSk7XG4gICAgICAgICAgICBjb25zdCB1bndyYXBwZWQgPSB1bndyYXBBcnJheXMoZmllbGQpO1xuICAgICAgICAgICAgY29uc3Qgb3duVHlwZSA9ICh1bndyYXBwZWQuc3RydWN0IHx8IHVud3JhcHBlZC51bmlvbikgPyB1bndyYXBwZWQgOiBudWxsO1xuICAgICAgICAgICAgaWYgKG93blR5cGUpIHtcbiAgICAgICAgICAgICAgICBwYXJzZURiVHlwZShtYWtlRmllbGRUeXBlTmFtZShuYW1lLCBmaWVsZC5uYW1lKSwgb3duVHlwZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBkYlR5cGVzLnB1c2godHlwZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VEYlR5cGVzKHR5cGVzOiBTY2hlbWFNZW1iZXI8U2NoZW1hVHlwZT5bXSkge1xuICAgICAgICB0eXBlcy5mb3JFYWNoKCh0eXBlOiBTY2hlbWFNZW1iZXI8U2NoZW1hVHlwZT4pID0+IHtcbiAgICAgICAgICAgIHBhcnNlRGJUeXBlKHR5cGUubmFtZSwgdHlwZSk7XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCB1bnJlc29sdmVkOiBNYXA8c3RyaW5nLCBEYlR5cGU+ID0gbmV3IE1hcDxzdHJpbmcsIERiVHlwZT4oKTtcbiAgICAgICAgY29uc3QgcmVzb2x2aW5nOiBTZXQ8c3RyaW5nPiA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgICAgICBjb25zdCByZXNvbHZlZDogTWFwPHN0cmluZywgRGJUeXBlPiA9IG5ldyBNYXA8c3RyaW5nLCBEYlR5cGU+KCk7XG4gICAgICAgIGNvbnN0IG9yZGVyZWRSZXNvbHZlZDogRGJUeXBlW10gPSBbXTtcbiAgICAgICAgZGJUeXBlcy5mb3JFYWNoKHQgPT4gdW5yZXNvbHZlZC5zZXQodC5uYW1lLCB0KSk7XG4gICAgICAgIGNvbnN0IHJlc29sdmVUeXBlID0gKHR5cGU6IERiVHlwZSkgPT4ge1xuICAgICAgICAgICAgaWYgKHJlc29sdmVkLmhhcyh0eXBlLm5hbWUpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHJlc29sdmluZy5oYXModHlwZS5uYW1lKSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBXQVJOSU5HOiBDaXJjdWxhciByZWZlcmVuY2UgdG8gdHlwZSAke3R5cGUubmFtZX1gKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXNvbHZpbmcuYWRkKHR5cGUubmFtZSk7XG4gICAgICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChmaWVsZC50eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS51bnJlc29sdmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCB0eXBlID0gcmVzb2x2ZWQuZ2V0KGZpZWxkLnR5cGUubmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghdHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSA9IHVucmVzb2x2ZWQuZ2V0KGZpZWxkLnR5cGUubmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmVUeXBlKHR5cGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgUmVmZXJlbmNlZCB0eXBlIG5vdCBmb3VuZDogJHtmaWVsZC50eXBlLm5hbWV9YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlID0gdHlwZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmVzb2x2aW5nLmRlbGV0ZSh0eXBlLm5hbWUpO1xuICAgICAgICAgICAgb3JkZXJlZFJlc29sdmVkLnB1c2godHlwZSk7XG4gICAgICAgICAgICB1bnJlc29sdmVkLmRlbGV0ZSh0eXBlLm5hbWUpO1xuICAgICAgICAgICAgcmVzb2x2ZWQuc2V0KHR5cGUubmFtZSwgdHlwZSk7XG4gICAgICAgIH07XG4gICAgICAgIGRiVHlwZXMuZm9yRWFjaChyZXNvbHZlVHlwZSk7XG4gICAgICAgIGRiVHlwZXMgPSBvcmRlcmVkUmVzb2x2ZWQ7XG4gICAgfVxuXG4vLyBHZW5lcmF0b3JzXG5cbiAgICBjb25zdCBxbCA9IG5ldyBXcml0ZXIoKTtcbiAgICBjb25zdCBqcyA9IG5ldyBXcml0ZXIoKTtcblxuICAgIGZ1bmN0aW9uIGdlblFMRG9jKHByZWZpeDogc3RyaW5nLCBkb2M6IHN0cmluZykge1xuICAgICAgICBpZiAoZG9jLnRyaW0oKSA9PT0gJycpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBsaW5lcyA9IGRvYy5zcGxpdCgvXFxuXFxyP3xcXHJcXG4/Lyk7XG4gICAgICAgIGlmIChsaW5lcy5sZW5ndGggPT09IDEgJiYgIWxpbmVzWzBdLmluY2x1ZGVzKCdcIicpKSB7XG4gICAgICAgICAgICBxbC53cml0ZUxuKHByZWZpeCwgJ1wiJywgbGluZXNbMF0sICdcIicpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcWwud3JpdGVMbihwcmVmaXgsICdcIlwiXCInKTtcbiAgICAgICAgICAgIGxpbmVzLmZvckVhY2goKGxpbmUpID0+IHtcbiAgICAgICAgICAgICAgICBxbC53cml0ZUxuKHByZWZpeCwgbGluZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHFsLndyaXRlTG4ocHJlZml4LCAnXCJcIlwiJyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiB1bmlvblZhcmlhbnRUeXBlKHR5cGU6IERiVHlwZSwgdmFyaWFudDogRGJGaWVsZCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiBgJHt0eXBlLm5hbWV9JHt2YXJpYW50Lm5hbWV9VmFyaWFudGA7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuUUxUeXBlRGVjbGFyYXRpb25zRm9yVW5pb25WYXJpYW50cyh0eXBlOiBEYlR5cGUpIHtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgodmFyaWFudCkgPT4ge1xuICAgICAgICAgICAgcWwud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgdHlwZSAke3VuaW9uVmFyaWFudFR5cGUodHlwZSwgdmFyaWFudCl9IHtcbiAgICAgICAgICAgICR7dmFyaWFudC5uYW1lfTogJHt2YXJpYW50LnR5cGUubmFtZX1cbiAgICAgICAgfVxuXG4gICAgICAgIGApO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5RTEVudW1UeXBlcygpIHtcbiAgICAgICAgZm9yIChjb25zdCBlbnVtRGVmOiBJbnRFbnVtRGVmIG9mIGVudW1UeXBlcy52YWx1ZXMoKSkge1xuICAgICAgICAgICAgcWwud3JpdGVMbihgZW51bSAke2VudW1EZWYubmFtZX1FbnVtIHtgKTtcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKGVudW1EZWYudmFsdWVzKS5mb3JFYWNoKChuYW1lKSA9PiB7XG4gICAgICAgICAgICAgICAgcWwud3JpdGVMbihgICAgICR7dG9FbnVtU3R5bGUobmFtZSl9YCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oYH1gKTtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlblFMVHlwZURlY2xhcmF0aW9uKHR5cGU6IERiVHlwZSkge1xuICAgICAgICBpZiAodHlwZS5jYXRlZ29yeSA9PT0gRGJUeXBlQ2F0ZWdvcnkudW5pb24pIHtcbiAgICAgICAgICAgIGdlblFMVHlwZURlY2xhcmF0aW9uc0ZvclVuaW9uVmFyaWFudHModHlwZSk7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGB1bmlvbiAke3R5cGUubmFtZX0gPSBgKTtcbiAgICAgICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2godmFyaWFudCA9PiB7XG4gICAgICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0fCAke3VuaW9uVmFyaWFudFR5cGUodHlwZSwgdmFyaWFudCl9YCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGdlblFMRG9jKCcnLCB0eXBlLmRvYyk7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGB0eXBlICR7dHlwZS5uYW1lfSB7YCk7XG4gICAgICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKGZpZWxkID0+IHtcbiAgICAgICAgICAgICAgICBnZW5RTERvYygnXFx0JywgZmllbGQuZG9jKTtcbiAgICAgICAgICAgICAgICBjb25zdCB0eXBlRGVjbGFyYXRpb24gPVxuICAgICAgICAgICAgICAgICAgICAnWycucmVwZWF0KGZpZWxkLmFycmF5RGVwdGgpICtcbiAgICAgICAgICAgICAgICAgICAgZmllbGQudHlwZS5uYW1lICtcbiAgICAgICAgICAgICAgICAgICAgJ10nLnJlcGVhdChmaWVsZC5hcnJheURlcHRoKTtcbiAgICAgICAgICAgICAgICBjb25zdCBwYXJhbXMgPSBpc0JpZ0ludChmaWVsZC50eXBlKSA/ICcoZGVjaW1hbDogQm9vbGVhbiknIDogJyc7XG4gICAgICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0JHtmaWVsZC5uYW1lfSR7cGFyYW1zfTogJHt0eXBlRGVjbGFyYXRpb259YCk7XG4gICAgICAgICAgICAgICAgY29uc3QgZW51bURlZiA9IGZpZWxkLmVudW1EZWY7XG4gICAgICAgICAgICAgICAgaWYgKGVudW1EZWYpIHtcbiAgICAgICAgICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0JHtmaWVsZC5uYW1lfV9uYW1lOiAke2VudW1EZWYubmFtZX1FbnVtYCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGB9YCk7XG4gICAgICAgIH1cbiAgICAgICAgcWwud3JpdGVMbigpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHByZXZlbnRUd2ljZShuYW1lOiBzdHJpbmcsIG5hbWVzOiBTZXQ8c3RyaW5nPiwgd29yazogKCkgPT4gdm9pZCkge1xuICAgICAgICBpZiAoIW5hbWVzLmhhcyhuYW1lKSkge1xuICAgICAgICAgICAgbmFtZXMuYWRkKG5hbWUpO1xuICAgICAgICAgICAgd29yaygpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuUUxGaWx0ZXJzRm9yQXJyYXlGaWVsZHModHlwZTogRGJUeXBlLCBxbE5hbWVzOiBTZXQ8c3RyaW5nPikge1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgbGV0IGl0ZW1UeXBlTmFtZSA9IGZpZWxkLnR5cGUubmFtZTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZmllbGQuYXJyYXlEZXB0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmlsdGVyTmFtZSA9IGAke2l0ZW1UeXBlTmFtZX1BcnJheUZpbHRlcmA7XG4gICAgICAgICAgICAgICAgcHJldmVudFR3aWNlKGZpbHRlck5hbWUsIHFsTmFtZXMsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcWwud3JpdGVMbihgaW5wdXQgJHtmaWx0ZXJOYW1lfSB7YCk7XG4gICAgICAgICAgICAgICAgICAgIFsnYW55JywgJ2FsbCddLmZvckVhY2goKG9wKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBxbC53cml0ZUxuKGBcXHQke29wfTogJHtpdGVtVHlwZU5hbWV9RmlsdGVyYCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBxbC53cml0ZUxuKCd9Jyk7XG4gICAgICAgICAgICAgICAgICAgIHFsLndyaXRlTG4oKTtcblxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGl0ZW1UeXBlTmFtZSArPSAnQXJyYXknO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5RTEZpbHRlcnNGb3JFbnVtTmFtZUZpZWxkcyh0eXBlOiBEYlR5cGUsIHFsTmFtZXM6IFNldDxzdHJpbmc+KSB7XG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBlbnVtRGVmID0gZmllbGQuZW51bURlZjtcbiAgICAgICAgICAgIGlmIChlbnVtRGVmKSB7XG4gICAgICAgICAgICAgICAgcHJldmVudFR3aWNlKGAke2VudW1EZWYubmFtZX1FbnVtRmlsdGVyYCwgcWxOYW1lcywgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBnZW5RTFNjYWxhclR5cGVzRmlsdGVyKGAke2VudW1EZWYubmFtZX1FbnVtYCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlblFMRmlsdGVyKHR5cGU6IERiVHlwZSwgcWxOYW1lczogU2V0PHN0cmluZz4pIHtcbiAgICAgICAgaWYgKHR5cGUuZmllbGRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGdlblFMRmlsdGVyc0ZvckFycmF5RmllbGRzKHR5cGUsIHFsTmFtZXMpO1xuICAgICAgICBnZW5RTEZpbHRlcnNGb3JFbnVtTmFtZUZpZWxkcyh0eXBlLCBxbE5hbWVzKTtcbiAgICAgICAgZ2VuUUxEb2MoJycsIHR5cGUuZG9jKTtcbiAgICAgICAgcWwud3JpdGVMbihgaW5wdXQgJHt0eXBlLm5hbWV9RmlsdGVyIHtgKTtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGdlblFMRG9jKCdcXHQnLCBmaWVsZC5kb2MpO1xuICAgICAgICAgICAgY29uc3QgdHlwZURlY2xhcmF0aW9uID0gZmllbGQudHlwZS5uYW1lICsgXCJBcnJheVwiLnJlcGVhdChmaWVsZC5hcnJheURlcHRoKTtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oYFxcdCR7ZmllbGQubmFtZX06ICR7dHlwZURlY2xhcmF0aW9ufUZpbHRlcmApO1xuICAgICAgICAgICAgY29uc3QgZW51bURlZiA9IGZpZWxkLmVudW1EZWY7XG4gICAgICAgICAgICBpZiAoZW51bURlZikge1xuICAgICAgICAgICAgICAgIHFsLndyaXRlTG4oYFxcdCR7ZmllbGQubmFtZX1fbmFtZTogJHtlbnVtRGVmLm5hbWV9RW51bUZpbHRlcmApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcWwud3JpdGVMbihgfWApO1xuICAgICAgICBxbC53cml0ZUxuKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuUUxTY2FsYXJUeXBlc0ZpbHRlcihuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgcWwud3JpdGVMbihgaW5wdXQgJHtuYW1lfUZpbHRlciB7YCk7XG4gICAgICAgIFsnZXEnLCAnbmUnLCAnZ3QnLCAnbHQnLCAnZ2UnLCAnbGUnXS5mb3JFYWNoKChvcCkgPT4ge1xuICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0JHtvcH06ICR7bmFtZX1gKTtcbiAgICAgICAgfSk7XG4gICAgICAgIFsnaW4nLCAnbm90SW4nXS5mb3JFYWNoKChvcCkgPT4ge1xuICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0JHtvcH06IFske25hbWV9XWApO1xuICAgICAgICB9KTtcbiAgICAgICAgcWwud3JpdGVMbignfScpO1xuICAgICAgICBxbC53cml0ZUxuKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuUUxRdWVyaWVzKHR5cGVzOiBEYlR5cGVbXSkge1xuICAgICAgICBxbC53cml0ZUJsb2NrTG4oYFxuICAgICAgICBcIlNwZWNpZnkgc29ydCBvcmRlciBkaXJlY3Rpb25cIlxuICAgICAgICBlbnVtIFF1ZXJ5T3JkZXJCeURpcmVjdGlvbiB7XG4gICAgICAgICAgICBcIkRvY3VtZW50cyB3aWxsIGJlIHNvcnRlZCBpbiBhc2NlbmRlZCBvcmRlciAoZS5nLiBmcm9tIEEgdG8gWilcIlxuICAgICAgICAgICAgQVNDXG4gICAgICAgICAgICBcIkRvY3VtZW50cyB3aWxsIGJlIHNvcnRlZCBpbiBkZXNjZW5kYW50IG9yZGVyIChlLmcuIGZyb20gWiB0byBBKVwiXG4gICAgICAgICAgICBERVNDXG4gICAgICAgIH1cblxuICAgICAgICBcbiAgICAgICAgXCJcIlwiXG4gICAgICAgIFNwZWNpZnkgaG93IHRvIHNvcnQgcmVzdWx0cy5cbiAgICAgICAgWW91IGNhbiBzb3J0IGRvY3VtZW50cyBpbiByZXN1bHQgc2V0IHVzaW5nIG1vcmUgdGhhbiBvbmUgZmllbGQuXG4gICAgICAgIFwiXCJcIlxuICAgICAgICBpbnB1dCBRdWVyeU9yZGVyQnkge1xuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgICBQYXRoIHRvIGZpZWxkIHdoaWNoIG11c3QgYmUgdXNlZCBhcyBhIHNvcnQgY3JpdGVyaWEuXG4gICAgICAgICAgICBJZiBmaWVsZCByZXNpZGVzIGRlZXAgaW4gc3RydWN0dXJlIHBhdGggaXRlbXMgbXVzdCBiZSBzZXBhcmF0ZWQgd2l0aCBkb3QgKGUuZy4gJ2Zvby5iYXIuYmF6JykuXG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICAgIHBhdGg6IFN0cmluZ1xuICAgICAgICAgICAgXCJTb3J0IG9yZGVyIGRpcmVjdGlvblwiXG4gICAgICAgICAgICBkaXJlY3Rpb246IFF1ZXJ5T3JkZXJCeURpcmVjdGlvblxuICAgICAgICB9XG5cbiAgICAgICAgdHlwZSBRdWVyeSB7XG4gICAgICAgIGApO1xuXG4gICAgICAgIHR5cGVzLmZvckVhY2goKHR5cGU6IERiVHlwZSkgPT4ge1xuICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0JHt0eXBlLmNvbGxlY3Rpb24gfHwgJyd9KGZpbHRlcjogJHt0eXBlLm5hbWV9RmlsdGVyLCBvcmRlckJ5OiBbUXVlcnlPcmRlckJ5XSwgbGltaXQ6IEludCwgdGltZW91dDogRmxvYXQsIGFjY2Vzc0tleTogU3RyaW5nKTogWyR7dHlwZS5uYW1lfV1gKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcWwud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgfVxuXG4gICAgICAgIGApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlblFMU3Vic2NyaXB0aW9ucyh0eXBlczogRGJUeXBlW10pIHtcbiAgICAgICAgcWwud3JpdGVMbigndHlwZSBTdWJzY3JpcHRpb24geycpO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGBcXHQke3R5cGUuY29sbGVjdGlvbiB8fCAnJ30oZmlsdGVyOiAke3R5cGUubmFtZX1GaWx0ZXIsIGFjY2Vzc0tleTogU3RyaW5nKTogJHt0eXBlLm5hbWV9YCk7XG4gICAgICAgIH0pO1xuICAgICAgICBxbC53cml0ZUxuKCd9Jyk7XG4gICAgfVxuXG5cbiAgICBmdW5jdGlvbiBnZXRTY2FsYXJSZXNvbHZlck5hbWUoZmllbGQ6IERiRmllbGQpOiBzdHJpbmcge1xuICAgICAgICBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDY0KSB7XG4gICAgICAgICAgICByZXR1cm4gJ2JpZ1VJbnQxJztcbiAgICAgICAgfVxuICAgICAgICBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDEwMjQpIHtcbiAgICAgICAgICAgIHJldHVybiAnYmlnVUludDInO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnc2NhbGFyJztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5KU0ZpbHRlcnNGb3JBcnJheUZpZWxkcyh0eXBlOiBEYlR5cGUsIGpzTmFtZXM6IFNldDxzdHJpbmc+KSB7XG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBsZXQgaXRlbVR5cGVOYW1lID0gZmllbGQudHlwZS5uYW1lO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmaWVsZC5hcnJheURlcHRoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWx0ZXJOYW1lID0gYCR7aXRlbVR5cGVOYW1lfUFycmF5YDtcbiAgICAgICAgICAgICAgICBwcmV2ZW50VHdpY2UoZmlsdGVyTmFtZSwganNOYW1lcywgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpdGVtUmVzb2x2ZXJOYW1lID0gKGkgPT09IDAgJiYgZmllbGQudHlwZS5jYXRlZ29yeSA9PT0gRGJUeXBlQ2F0ZWdvcnkuc2NhbGFyKVxuICAgICAgICAgICAgICAgICAgICAgICAgPyBnZXRTY2FsYXJSZXNvbHZlck5hbWUoZmllbGQpXG4gICAgICAgICAgICAgICAgICAgICAgICA6IGl0ZW1UeXBlTmFtZTtcbiAgICAgICAgICAgICAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgICAgICAgICBjb25zdCAke2ZpbHRlck5hbWV9ID0gYXJyYXkoKCkgPT4gJHtpdGVtUmVzb2x2ZXJOYW1lfSk7XG4gICAgICAgICAgICAgICAgYCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaXRlbVR5cGVOYW1lICs9ICdBcnJheSc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkpTU3RydWN0RmlsdGVyKHR5cGU6IERiVHlwZSkge1xuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBjb25zdCAke3R5cGUubmFtZX0gPSBzdHJ1Y3Qoe1xuICAgIGApO1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgbGV0IHR5cGVEZWNsYXJhdGlvbjogP3N0cmluZyA9IG51bGw7XG4gICAgICAgICAgICBjb25zdCBqb2luID0gZmllbGQuam9pbjtcbiAgICAgICAgICAgIGlmIChqb2luKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3VmZml4ID0gZmllbGQuYXJyYXlEZXB0aCA+IDAgPyAnQXJyYXknIDogJyc7XG4gICAgICAgICAgICAgICAgdHlwZURlY2xhcmF0aW9uID0gYGpvaW4ke3N1ZmZpeH0oJyR7am9pbi5vbn0nLCAnJHtqb2luLnJlZk9ufScsICcke2ZpZWxkLnR5cGUuY29sbGVjdGlvbiB8fCAnJ30nLCAoKSA9PiAke2ZpZWxkLnR5cGUubmFtZX0pYDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQuYXJyYXlEZXB0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB0eXBlRGVjbGFyYXRpb24gPVxuICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlLm5hbWUgK1xuICAgICAgICAgICAgICAgICAgICAnQXJyYXknLnJlcGVhdChmaWVsZC5hcnJheURlcHRoKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZS5jYXRlZ29yeSA9PT0gRGJUeXBlQ2F0ZWdvcnkuc2NhbGFyKSB7XG4gICAgICAgICAgICAgICAgdHlwZURlY2xhcmF0aW9uID0gZ2V0U2NhbGFyUmVzb2x2ZXJOYW1lKGZpZWxkKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZS5maWVsZHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHR5cGVEZWNsYXJhdGlvbiA9IGZpZWxkLnR5cGUubmFtZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0eXBlRGVjbGFyYXRpb24pIHtcbiAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgJHtmaWVsZC5uYW1lfTogJHt0eXBlRGVjbGFyYXRpb259LGApO1xuICAgICAgICAgICAgICAgIGNvbnN0IGVudW1EZWYgPSBmaWVsZC5lbnVtRGVmO1xuICAgICAgICAgICAgICAgIGlmIChlbnVtRGVmKSB7XG4gICAgICAgICAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAke2ZpZWxkLm5hbWV9X25hbWU6IGVudW1OYW1lKCcke2ZpZWxkLm5hbWV9JywgJHtzdHJpbmdpZnlFbnVtVmFsdWVzKGVudW1EZWYudmFsdWVzKX0pLGApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIH0ke3R5cGUuY29sbGVjdGlvbiA/ICcsIHRydWUnIDogJyd9KTtcblxuICAgIGApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkpTVW5pb25SZXNvbHZlcih0eXBlOiBEYlR5cGUpIHtcbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgY29uc3QgJHt0eXBlLm5hbWV9UmVzb2x2ZXIgPSB7XG4gICAgICAgICAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xuICAgICAgICBgKTtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgodmFyaWFudCkgPT4ge1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICBpZiAoJyR7dmFyaWFudC5uYW1lfScgaW4gb2JqKSB7YCk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICByZXR1cm4gJyR7dW5pb25WYXJpYW50VHlwZSh0eXBlLCB2YXJpYW50KX0nO2ApO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICB9YCk7XG4gICAgICAgIH0pO1xuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkpTRmlsdGVyKHR5cGU6IERiVHlwZSwganNOYW1lczogU2V0PHN0cmluZz4pIHtcbiAgICAgICAgaWYgKHR5cGUuZmllbGRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS51bmlvbikge1xuICAgICAgICAgICAgLy8gZ2VuSlNGaWx0ZXJzRm9yVW5pb25WYXJpYW50cyh0eXBlLCBqc05hbWVzKTtcbiAgICAgICAgfVxuICAgICAgICBnZW5KU0ZpbHRlcnNGb3JBcnJheUZpZWxkcyh0eXBlLCBqc05hbWVzKTtcbiAgICAgICAgZ2VuSlNTdHJ1Y3RGaWx0ZXIodHlwZSk7XG4gICAgICAgIGlmICh0eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS51bmlvbikge1xuICAgICAgICAgICAgZ2VuSlNVbmlvblJlc29sdmVyKHR5cGUpO1xuICAgICAgICB9XG5cblxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlIGN1c3RvbSByZXNvbHZlcnMgZm9yIHR5cGVzIHdpdGg6XG4gICAgICogLSBpZCBmaWVsZFxuICAgICAqIC0gam9pbiBmaWVsZHNcbiAgICAgKiAtIHU2NCBhbmQgaGlnaGVyIGZpZWxkc1xuICAgICAqIEBwYXJhbSB0eXBlXG4gICAgICovXG4gICAgZnVuY3Rpb24gZ2VuSlNDdXN0b21SZXNvbHZlcnModHlwZTogRGJUeXBlKSB7XG4gICAgICAgIGNvbnN0IGpvaW5GaWVsZHMgPSB0eXBlLmZpZWxkcy5maWx0ZXIoeCA9PiAhIXguam9pbik7XG4gICAgICAgIGNvbnN0IGJpZ1VJbnRGaWVsZHMgPSB0eXBlLmZpZWxkcy5maWx0ZXIoKHg6IERiRmllbGQpID0+IGlzQmlnSW50KHgudHlwZSkpO1xuICAgICAgICBjb25zdCBlbnVtRmllbGRzID0gdHlwZS5maWVsZHMuZmlsdGVyKHggPT4geC5lbnVtRGVmKTtcbiAgICAgICAgY29uc3QgY3VzdG9tUmVzb2x2ZXJSZXF1aXJlZCA9IHR5cGUuY29sbGVjdGlvblxuICAgICAgICAgICAgfHwgam9pbkZpZWxkcy5sZW5ndGggPiAwXG4gICAgICAgICAgICB8fCBiaWdVSW50RmllbGRzLmxlbmd0aCA+IDBcbiAgICAgICAgICAgIHx8IGVudW1GaWVsZHMubGVuZ3RoID4gMDtcbiAgICAgICAgaWYgKCFjdXN0b21SZXNvbHZlclJlcXVpcmVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAganMud3JpdGVMbihgICAgICAgICAke3R5cGUubmFtZX06IHtgKTtcbiAgICAgICAgaWYgKHR5cGUuY29sbGVjdGlvbikge1xuICAgICAgICAgICAganMud3JpdGVMbignICAgICAgICAgICAgaWQocGFyZW50KSB7Jyk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKCcgICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5OycpO1xuICAgICAgICAgICAganMud3JpdGVMbignICAgICAgICAgICAgfSwnKTtcbiAgICAgICAgfVxuICAgICAgICBqb2luRmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBqb2luID0gZmllbGQuam9pbjtcbiAgICAgICAgICAgIGlmICgham9pbikge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IG9uRmllbGQgPSB0eXBlLmZpZWxkcy5maW5kKHggPT4geC5uYW1lID09PSBqb2luLm9uKTtcbiAgICAgICAgICAgIGlmICghb25GaWVsZCkge1xuICAgICAgICAgICAgICAgIHRocm93ICdKb2luIG9uIGZpZWxkIGRvZXMgbm90IGV4aXN0Lic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBvbiA9IGpvaW4ub24gPT09ICdpZCcgPyAnX2tleScgOiAoam9pbi5vbiB8fCAnX2tleScpO1xuICAgICAgICAgICAgY29uc3QgcmVmT24gPSBqb2luLnJlZk9uID09PSAnaWQnID8gJ19rZXknIDogKGpvaW4ucmVmT24gfHwgJ19rZXknKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbGxlY3Rpb24gPSBmaWVsZC50eXBlLmNvbGxlY3Rpb247XG4gICAgICAgICAgICBpZiAoIWNvbGxlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICB0aHJvdyAnSm9pbmVkIHR5cGUgaXMgbm90IGEgY29sbGVjdGlvbi4nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgJHtmaWVsZC5uYW1lfShwYXJlbnQsIF9hcmdzLCBjb250ZXh0KSB7YCk7XG4gICAgICAgICAgICBjb25zdCBwcmUgPSBqb2luLnByZUNvbmRpdGlvbiA/IGAke2pvaW4ucHJlQ29uZGl0aW9ufSA/IGAgOiAnJztcbiAgICAgICAgICAgIGNvbnN0IHBvc3QgPSBqb2luLnByZUNvbmRpdGlvbiA/IGAgOiBudWxsYCA6ICcnO1xuICAgICAgICAgICAgaWYgKGZpZWxkLmFycmF5RGVwdGggPT09IDApIHtcbiAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAgICAgcmV0dXJuICR7cHJlfWNvbnRleHQuZGIuJHtjb2xsZWN0aW9ufS53YWl0Rm9yRG9jKHBhcmVudC4ke29ufSwgJyR7cmVmT259Jykke3Bvc3R9O2ApO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC5hcnJheURlcHRoID09PSAxKSB7XG4gICAgICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgICAgIHJldHVybiAke3ByZX1jb250ZXh0LmRiLiR7Y29sbGVjdGlvbn0ud2FpdEZvckRvY3MocGFyZW50LiR7b259LCAnJHtyZWZPbn0nKSR7cG9zdH07YCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93ICdKb2lucyBvbiBhIG5lc3RlZCBhcnJheXMgZG9lcyBub3Qgc3VwcG9ydGVkLic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICB9LGApO1xuICAgICAgICB9KTtcbiAgICAgICAgYmlnVUludEZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcHJlZml4TGVuZ3RoID0gZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDY0ID8gMSA6IDI7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAke2ZpZWxkLm5hbWV9KHBhcmVudCkge2ApO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgke3ByZWZpeExlbmd0aH0sIHBhcmVudC4ke2ZpZWxkLm5hbWV9KTtgKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgIH0sYCk7XG4gICAgICAgIH0pO1xuICAgICAgICBlbnVtRmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBlbnVtRGVmID0gZmllbGQuZW51bURlZjtcbiAgICAgICAgICAgIGlmIChlbnVtRGVmKSB7XG4gICAgICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgJHtmaWVsZC5uYW1lfV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCcke2ZpZWxkLm5hbWV9JywgJHtzdHJpbmdpZnlFbnVtVmFsdWVzKGVudW1EZWYudmFsdWVzKX0pLGApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAganMud3JpdGVMbihgICAgICAgICB9LGApO1xuICAgIH1cblxuXG4gICAgZnVuY3Rpb24gZ2VuSlNUeXBlUmVzb2x2ZXJzRm9yVW5pb24odHlwZTogRGJUeXBlKSB7XG4gICAgICAgIGlmICh0eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS51bmlvbikge1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAke3R5cGUubmFtZX06ICR7dHlwZS5uYW1lfVJlc29sdmVyLGApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuZXJhdGUodHlwZXM6IERiVHlwZVtdKSB7XG5cbiAgICAgICAgLy8gUUxcblxuICAgICAgICBbJ1N0cmluZycsICdCb29sZWFuJywgJ0ludCcsICdGbG9hdCddLmZvckVhY2goZ2VuUUxTY2FsYXJUeXBlc0ZpbHRlcik7XG4gICAgICAgIGdlblFMRW51bVR5cGVzKCk7XG4gICAgICAgIHR5cGVzLmZvckVhY2godHlwZSA9PiBnZW5RTFR5cGVEZWNsYXJhdGlvbih0eXBlKSk7XG4gICAgICAgIGNvbnN0IHFsQXJyYXlGaWx0ZXJzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgICAgIHR5cGVzLmZvckVhY2godHlwZSA9PiBnZW5RTEZpbHRlcih0eXBlLCBxbEFycmF5RmlsdGVycykpO1xuXG4gICAgICAgIGNvbnN0IGNvbGxlY3Rpb25zID0gdHlwZXMuZmlsdGVyKHQgPT4gISF0LmNvbGxlY3Rpb24pO1xuICAgICAgICBnZW5RTFF1ZXJpZXMoY29sbGVjdGlvbnMpO1xuICAgICAgICBnZW5RTFN1YnNjcmlwdGlvbnMoY29sbGVjdGlvbnMpO1xuXG4gICAgICAgIC8vIEpTXG5cbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgY29uc3Qge1xuICAgICAgICAgICAgc2NhbGFyLFxuICAgICAgICAgICAgYmlnVUludDEsXG4gICAgICAgICAgICBiaWdVSW50MixcbiAgICAgICAgICAgIHJlc29sdmVCaWdVSW50LFxuICAgICAgICAgICAgc3RydWN0LFxuICAgICAgICAgICAgYXJyYXksXG4gICAgICAgICAgICBqb2luLFxuICAgICAgICAgICAgam9pbkFycmF5LFxuICAgICAgICAgICAgZW51bU5hbWUsXG4gICAgICAgICAgICBjcmVhdGVFbnVtTmFtZVJlc29sdmVyLFxuICAgICAgICB9ID0gcmVxdWlyZSgnLi9kYi10eXBlcy5qcycpO1xuICAgICAgICBgKTtcbiAgICAgICAgY29uc3QganNBcnJheUZpbHRlcnMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICAgICAgdHlwZXMuZm9yRWFjaCh0eXBlID0+IGdlbkpTRmlsdGVyKHR5cGUsIGpzQXJyYXlGaWx0ZXJzKSk7XG5cbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgZnVuY3Rpb24gY3JlYXRlUmVzb2x2ZXJzKGRiKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICBgKTtcbiAgICAgICAgdHlwZXMuZm9yRWFjaCgodHlwZSkgPT4ge1xuICAgICAgICAgICAgZ2VuSlNDdXN0b21SZXNvbHZlcnModHlwZSk7XG4gICAgICAgICAgICBnZW5KU1R5cGVSZXNvbHZlcnNGb3JVbmlvbih0eXBlKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGpzLndyaXRlTG4oJyAgICAgICAgUXVlcnk6IHsnKTtcbiAgICAgICAgY29sbGVjdGlvbnMuZm9yRWFjaCgodHlwZSkgPT4ge1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgJHt0eXBlLmNvbGxlY3Rpb24gfHwgJyd9OiBkYi4ke3R5cGUuY29sbGVjdGlvbiB8fCAnJ30ucXVlcnlSZXNvbHZlcigpLGApXG4gICAgICAgIH0pO1xuICAgICAgICBqcy53cml0ZUxuKCcgICAgICAgIH0sJyk7XG4gICAgICAgIGpzLndyaXRlTG4oJyAgICAgICAgU3Vic2NyaXB0aW9uOiB7Jyk7XG4gICAgICAgIGNvbGxlY3Rpb25zLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICR7dHlwZS5jb2xsZWN0aW9uIHx8ICcnfTogZGIuJHt0eXBlLmNvbGxlY3Rpb24gfHwgJyd9LnN1YnNjcmlwdGlvblJlc29sdmVyKCksYClcbiAgICAgICAgfSk7XG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgYCk7XG5cbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgICAgICAgICBjcmVhdGVSZXNvbHZlcnMsXG4gICAgICAgIGApO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKHR5cGUgPT4ganMud3JpdGVMbihgICAgICR7dHlwZS5uYW1lfSxgKSk7XG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIH07XG4gICAgICAgIGApO1xuICAgIH1cblxuICAgIGNvbnN0IHNjaGVtYSA9IHBhcnNlVHlwZURlZihzY2hlbWFEZWYpO1xuXG4gICAgaWYgKHNjaGVtYS5jbGFzcykge1xuICAgICAgICBwYXJzZURiVHlwZXMoc2NoZW1hLmNsYXNzLnR5cGVzKTtcbiAgICAgICAgZ2VuZXJhdGUoZGJUeXBlcyk7XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBlOiBJbnRFbnVtRGVmIG9mIGVudW1UeXBlcy52YWx1ZXMoKSkge1xuICAgICAgICBjb25zb2xlLmxvZyhgZXhwb3J0IGNvbnN0IFEke2UubmFtZX0gPSB7YCk7XG4gICAgICAgIGNvbnNvbGUubG9nKE9iamVjdC5lbnRyaWVzKGUudmFsdWVzKS5tYXAoKFtuYW1lLCB2YWx1ZV0pID0+IHtcbiAgICAgICAgICAgIHJldHVybiBgICAgICR7bmFtZX06ICR7KHZhbHVlOiBhbnkpfSxgO1xuICAgICAgICB9KS5qb2luKCdcXG4nKSk7XG4gICAgICAgIGNvbnNvbGUubG9nKGB9O1xcbmApO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIHFsOiBxbC5nZW5lcmF0ZWQoKSxcbiAgICAgICAganM6IGpzLmdlbmVyYXRlZCgpLFxuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgbWFpbjtcbiJdfQ==