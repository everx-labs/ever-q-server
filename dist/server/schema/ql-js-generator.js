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
        const params = field.type === scalarTypes.uint64 || field.type === scalarTypes.uint1024 ? '(format: BigIntFormat)' : '';
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
        typeDeclaration = `join${field.arrayDepth > 0 ? 'Array' : ''}('${join.on}', '${join.refOn}', '${field.type.collection || ''}', () => ${field.type.name})`;
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
    const bigUIntFields = type.fields.filter(x => x.type === scalarTypes.uint64 || x.type === scalarTypes.uint1024);
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

      if (field.arrayDepth === 0) {
        js.writeLn(`                return context.db.${collection}.waitForDoc(parent.${on}, '${refOn}');`);
      } else if (field.arrayDepth === 1) {
        js.writeLn(`                return context.db.${collection}.waitForDocs(parent.${on}, '${refOn}');`);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NlcnZlci9zY2hlbWEvcWwtanMtZ2VuZXJhdG9yLmpzIl0sIm5hbWVzIjpbIkRiVHlwZUNhdGVnb3J5IiwidW5yZXNvbHZlZCIsInNjYWxhciIsInVuaW9uIiwic3RydWN0Iiwic2NhbGFyVHlwZSIsIm5hbWUiLCJjYXRlZ29yeSIsImZpZWxkcyIsImRvYyIsInNjYWxhclR5cGVzIiwiaW50IiwidWludDY0IiwidWludDEwMjQiLCJmbG9hdCIsImJvb2xlYW4iLCJzdHJpbmciLCJ1bnJlc29sdmVkVHlwZSIsImlzTG93ZXJDYXNlZCIsInMiLCJsIiwidG9Mb3dlckNhc2UiLCJ1IiwidG9VcHBlckNhc2UiLCJpc1VwcGVyQ2FzZWQiLCJ0b0FsbENhcHMiLCJyZXN1bHQiLCJpIiwibGVuZ3RoIiwidG9FbnVtU3R5bGUiLCJzdWJzdHIiLCJzdHJpbmdpZnlFbnVtVmFsdWVzIiwidmFsdWVzIiwiT2JqZWN0IiwiZW50cmllcyIsIm1hcCIsInZhbHVlIiwiam9pbiIsImdldERvY01EIiwic2NoZW1hIiwibWQiLCJtYWluIiwic2NoZW1hRGVmIiwiZGJUeXBlcyIsImxhc3RSZXBvcnRlZFR5cGUiLCJlbnVtVHlwZXMiLCJNYXAiLCJyZXBvcnRUeXBlIiwiZmllbGQiLCJ0eXBlIiwiY29uc29sZSIsImxvZyIsInBhcnNlRGJGaWVsZCIsInR5cGVOYW1lIiwic2NoZW1hRmllbGQiLCJzY2hlbWFUeXBlIiwiYXJyYXlEZXB0aCIsImFycmF5IiwiZW51bURlZiIsIl8iLCJlbnVtIiwic2V0IiwicmVmIiwiYm9vbCIsInVuc2lnbmVkIiwic2l6ZSIsIkVycm9yIiwiSlNPTiIsInN0cmluZ2lmeSIsInByb2Nlc3MiLCJleGl0IiwidW53cmFwQXJyYXlzIiwicGFyc2VEYlR5cGUiLCJjb2xsZWN0aW9uIiwicHVzaCIsImZvckVhY2giLCJ1bndyYXBwZWQiLCJvd25UeXBlIiwicGFyc2VEYlR5cGVzIiwidHlwZXMiLCJyZXNvbHZpbmciLCJTZXQiLCJyZXNvbHZlZCIsIm9yZGVyZWRSZXNvbHZlZCIsInQiLCJyZXNvbHZlVHlwZSIsImhhcyIsImFkZCIsImdldCIsImRlbGV0ZSIsInFsIiwiV3JpdGVyIiwianMiLCJnZW5RTERvYyIsInByZWZpeCIsInRyaW0iLCJsaW5lcyIsInNwbGl0IiwiaW5jbHVkZXMiLCJ3cml0ZUxuIiwibGluZSIsInVuaW9uVmFyaWFudFR5cGUiLCJ2YXJpYW50IiwiZ2VuUUxUeXBlRGVjbGFyYXRpb25zRm9yVW5pb25WYXJpYW50cyIsIndyaXRlQmxvY2tMbiIsImdlblFMRW51bVR5cGVzIiwia2V5cyIsImdlblFMVHlwZURlY2xhcmF0aW9uIiwidHlwZURlY2xhcmF0aW9uIiwicmVwZWF0IiwicGFyYW1zIiwicHJldmVudFR3aWNlIiwibmFtZXMiLCJ3b3JrIiwiZ2VuUUxGaWx0ZXJzRm9yQXJyYXlGaWVsZHMiLCJxbE5hbWVzIiwiaXRlbVR5cGVOYW1lIiwiZmlsdGVyTmFtZSIsIm9wIiwiZ2VuUUxGaWx0ZXJzRm9yRW51bU5hbWVGaWVsZHMiLCJnZW5RTFNjYWxhclR5cGVzRmlsdGVyIiwiZ2VuUUxGaWx0ZXIiLCJnZW5RTFF1ZXJpZXMiLCJnZW5RTFN1YnNjcmlwdGlvbnMiLCJnZXRTY2FsYXJSZXNvbHZlck5hbWUiLCJnZW5KU0ZpbHRlcnNGb3JBcnJheUZpZWxkcyIsImpzTmFtZXMiLCJpdGVtUmVzb2x2ZXJOYW1lIiwiZ2VuSlNTdHJ1Y3RGaWx0ZXIiLCJvbiIsInJlZk9uIiwiZ2VuSlNVbmlvblJlc29sdmVyIiwiZ2VuSlNGaWx0ZXIiLCJnZW5KU0N1c3RvbVJlc29sdmVycyIsImpvaW5GaWVsZHMiLCJmaWx0ZXIiLCJ4IiwiYmlnVUludEZpZWxkcyIsImVudW1GaWVsZHMiLCJjdXN0b21SZXNvbHZlclJlcXVpcmVkIiwib25GaWVsZCIsImZpbmQiLCJwcmVmaXhMZW5ndGgiLCJnZW5KU1R5cGVSZXNvbHZlcnNGb3JVbmlvbiIsImdlbmVyYXRlIiwicWxBcnJheUZpbHRlcnMiLCJjb2xsZWN0aW9ucyIsImpzQXJyYXlG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QUFDWSxZQUFILENBQWlCOztTQUFqQjtBQUdIOztBQUVELFFBQU1qRSxNQUFNLEdBQUcsMEJBQWFHLFNBQWIsQ0FBZjs7QUFFQSxNQUFJSCxNQUFNLENBQUM2RyxLQUFYLEVBQWtCO0FBQ2R0RSxJQUFBQSxZQUFZLENBQUN2QyxNQUFNLENBQUM2RyxLQUFQLENBQWFyRSxLQUFkLENBQVo7QUFDQWlFLElBQUFBLFFBQVEsQ0FBQ3JHLE9BQUQsQ0FBUjtBQUNIOztBQUVELE9BQUssTUFBTTBHLENBQVgsSUFBNEJ4RyxTQUFTLENBQUNiLE1BQVYsRUFBNUIsRUFBZ0Q7QUFDNUNrQixJQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBYSxpQkFBZ0JrRyxDQUFDLENBQUMvSSxJQUFLLE1BQXBDO0FBQ0E0QyxJQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWWxCLE1BQU0sQ0FBQ0MsT0FBUCxDQUFlbUgsQ0FBQyxDQUFDckgsTUFBakIsRUFBeUJHLEdBQXpCLENBQTZCLENBQUMsQ0FBQzdCLElBQUQsRUFBTzhCLEtBQVAsQ0FBRCxLQUFtQjtBQUN4RCxhQUFRLE9BQU05QixJQUFLLEtBQUs4QixLQUFZLEdBQXBDO0FBQ0gsS0FGVyxFQUVUQyxJQUZTLENBRUosSUFGSSxDQUFaO0FBR0FhLElBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFhLE1BQWI7QUFDSDs7QUFFRCxTQUFPO0FBQ0h1QyxJQUFBQSxFQUFFLEVBQUVBLEVBQUUsQ0FBQzRELFNBQUgsRUFERDtBQUVIMUQsSUFBQUEsRUFBRSxFQUFFQSxFQUFFLENBQUMwRCxTQUFIO0FBRkQsR0FBUDtBQUlIOztlQUVjN0csSSIsInNvdXJjZXNDb250ZW50IjpbIi8vQGZsb3dcblxuaW1wb3J0IHsgbWFrZUZpZWxkVHlwZU5hbWUsIFdyaXRlciB9IGZyb20gJ3Rvbi1sYWJzLWRldi1vcHMvZGlzdC9zcmMvZ2VuLmpzJztcbmltcG9ydCB0eXBlIHsgU2NoZW1hRG9jLCBTY2hlbWFNZW1iZXIsIFNjaGVtYVR5cGUsIFR5cGVEZWYgfSBmcm9tICd0b24tbGFicy1kZXYtb3BzL3NyYy9zY2hlbWEuanMnO1xuaW1wb3J0IHsgcGFyc2VUeXBlRGVmIH0gZnJvbSAndG9uLWxhYnMtZGV2LW9wcy9kaXN0L3NyYy9zY2hlbWEuanMnO1xuXG5jb25zdCBEYlR5cGVDYXRlZ29yeSA9IHtcbiAgICB1bnJlc29sdmVkOiAndW5yZXNvbHZlZCcsXG4gICAgc2NhbGFyOiAnc2NhbGFyJyxcbiAgICB1bmlvbjogJ3VuaW9uJyxcbiAgICBzdHJ1Y3Q6ICdzdHJ1Y3QnLFxufTtcblxudHlwZSBEYkpvaW4gPSB7XG4gICAgY29sbGVjdGlvbjogc3RyaW5nLFxuICAgIG9uOiBzdHJpbmcsXG4gICAgcmVmT246IHN0cmluZyxcbn1cblxudHlwZSBEYlR5cGUgPSB7XG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGZpZWxkczogRGJGaWVsZFtdLFxuICAgIGNhdGVnb3J5OiAndW5yZXNvbHZlZCcgfCAnc2NhbGFyJyB8ICd1bmlvbicgfCAnc3RydWN0JyxcbiAgICBjb2xsZWN0aW9uPzogc3RyaW5nLFxuICAgIGRvYzogc3RyaW5nLFxufVxuXG50eXBlIEludEVudW1EZWYgPSB7XG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHZhbHVlczoge1xuICAgICAgICBbc3RyaW5nXTogbnVtYmVyXG4gICAgfSxcbn1cblxudHlwZSBEYkZpZWxkID0ge1xuICAgIG5hbWU6IHN0cmluZyxcbiAgICB0eXBlOiBEYlR5cGUsXG4gICAgYXJyYXlEZXB0aDogbnVtYmVyLFxuICAgIGpvaW4/OiBEYkpvaW4sXG4gICAgZW51bURlZj86IEludEVudW1EZWYsXG4gICAgZG9jOiBzdHJpbmcsXG59XG5cbmZ1bmN0aW9uIHNjYWxhclR5cGUobmFtZTogc3RyaW5nKTogRGJUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBuYW1lLFxuICAgICAgICBjYXRlZ29yeTogRGJUeXBlQ2F0ZWdvcnkuc2NhbGFyLFxuICAgICAgICBmaWVsZHM6IFtdLFxuICAgICAgICBkb2M6ICcnLFxuICAgIH1cbn1cblxuY29uc3Qgc2NhbGFyVHlwZXMgPSB7XG4gICAgaW50OiBzY2FsYXJUeXBlKCdJbnQnKSxcbiAgICB1aW50NjQ6IHNjYWxhclR5cGUoJ1N0cmluZycpLFxuICAgIHVpbnQxMDI0OiBzY2FsYXJUeXBlKCdTdHJpbmcnKSxcbiAgICBmbG9hdDogc2NhbGFyVHlwZSgnRmxvYXQnKSxcbiAgICBib29sZWFuOiBzY2FsYXJUeXBlKCdCb29sZWFuJyksXG4gICAgc3RyaW5nOiBzY2FsYXJUeXBlKCdTdHJpbmcnKSxcbn07XG5cbmZ1bmN0aW9uIHVucmVzb2x2ZWRUeXBlKG5hbWU6IHN0cmluZyk6IERiVHlwZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgbmFtZSxcbiAgICAgICAgY2F0ZWdvcnk6IERiVHlwZUNhdGVnb3J5LnVucmVzb2x2ZWQsXG4gICAgICAgIGZpZWxkczogW10sXG4gICAgICAgIGRvYzogJycsXG4gICAgfVxufVxuXG5mdW5jdGlvbiBpc0xvd2VyQ2FzZWQoczogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgY29uc3QgbCA9IHMudG9Mb3dlckNhc2UoKTtcbiAgICBjb25zdCB1ID0gcy50b1VwcGVyQ2FzZSgpO1xuICAgIHJldHVybiAodSAhPT0gbCkgJiYgKHMgPT09IGwpO1xufVxuXG5mdW5jdGlvbiBpc1VwcGVyQ2FzZWQoczogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgY29uc3QgbCA9IHMudG9Mb3dlckNhc2UoKTtcbiAgICBjb25zdCB1ID0gcy50b1VwcGVyQ2FzZSgpO1xuICAgIHJldHVybiAodSAhPT0gbCkgJiYgKHMgPT09IHUpO1xufVxuXG5mdW5jdGlvbiB0b0FsbENhcHMoczogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBsZXQgcmVzdWx0ID0gJyc7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGlmICgoaSA+IDApICYmIChzW2kgLSAxXSAhPT0gJ18nKSAmJiBpc0xvd2VyQ2FzZWQoc1tpIC0gMV0pICYmIGlzVXBwZXJDYXNlZChzW2ldKSkge1xuICAgICAgICAgICAgcmVzdWx0ICs9ICdfJztcbiAgICAgICAgfVxuICAgICAgICByZXN1bHQgKz0gc1tpXTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdC50b1VwcGVyQ2FzZSgpO1xufVxuXG5mdW5jdGlvbiB0b0VudW1TdHlsZShzOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiBgJHtzLnN1YnN0cigwLCAxKS50b1VwcGVyQ2FzZSgpfSR7cy5zdWJzdHIoMSl9YDtcbn1cblxuZnVuY3Rpb24gc3RyaW5naWZ5RW51bVZhbHVlcyh2YWx1ZXM6IHsgW3N0cmluZ106IG51bWJlciB9KTogc3RyaW5nIHtcbiAgICBjb25zdCBmaWVsZHMgPSBPYmplY3QuZW50cmllcyh2YWx1ZXMpLm1hcCgoW25hbWUsIHZhbHVlXSkgPT4ge1xuICAgICAgICByZXR1cm4gYCR7dG9FbnVtU3R5bGUobmFtZSl9OiAkeyh2YWx1ZTogYW55KX1gO1xuICAgIH0pO1xuICAgIHJldHVybiBgeyAke2ZpZWxkcy5qb2luKCcsICcpfSB9YDtcbn1cblxuZnVuY3Rpb24gZ2V0RG9jTUQoc2NoZW1hOiBTY2hlbWFEb2MpOiBzdHJpbmcge1xuICAgIGNvbnN0IGRvYyA9IHNjaGVtYS5kb2M7XG4gICAgaWYgKCFkb2MpIHtcbiAgICAgICAgcmV0dXJuICcnO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGRvYyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgcmV0dXJuIGRvYztcbiAgICB9XG4gICAgaWYgKGRvYy5tZCkge1xuICAgICAgICByZXR1cm4gKGRvYy5tZDogYW55KTtcbiAgICB9XG4gICAgcmV0dXJuICcnO1xufVxuXG5mdW5jdGlvbiBtYWluKHNjaGVtYURlZjogVHlwZURlZikge1xuXG4gICAgbGV0IGRiVHlwZXM6IERiVHlwZVtdID0gW107XG4gICAgbGV0IGxhc3RSZXBvcnRlZFR5cGU6IHN0cmluZyA9ICcnO1xuICAgIGxldCBlbnVtVHlwZXM6IE1hcDxzdHJpbmcsIEludEVudW1EZWY+ID0gbmV3IE1hcCgpO1xuXG4gICAgZnVuY3Rpb24gcmVwb3J0VHlwZShuYW1lOiBzdHJpbmcsIGZpZWxkOiBzdHJpbmcsIHR5cGU6IHN0cmluZykge1xuICAgICAgICBpZiAobmFtZSAhPT0gbGFzdFJlcG9ydGVkVHlwZSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2cobmFtZSk7XG4gICAgICAgICAgICBsYXN0UmVwb3J0ZWRUeXBlID0gbmFtZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmxvZyhgICAgICR7ZmllbGR9OiAke3R5cGV9YCk7XG5cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZURiRmllbGQoXG4gICAgICAgIHR5cGVOYW1lOiBzdHJpbmcsXG4gICAgICAgIHNjaGVtYUZpZWxkOiBTY2hlbWFNZW1iZXI8U2NoZW1hVHlwZT4sXG4gICAgKTogRGJGaWVsZCB7XG4gICAgICAgIGxldCBzY2hlbWFUeXBlID0gc2NoZW1hRmllbGQ7XG4gICAgICAgIGNvbnN0IGZpZWxkOiBEYkZpZWxkID0ge1xuICAgICAgICAgICAgbmFtZTogc2NoZW1hRmllbGQubmFtZSxcbiAgICAgICAgICAgIGFycmF5RGVwdGg6IDAsXG4gICAgICAgICAgICB0eXBlOiBzY2FsYXJUeXBlcy5zdHJpbmcsXG4gICAgICAgICAgICBkb2M6IGdldERvY01EKHNjaGVtYUZpZWxkKSxcbiAgICAgICAgfTtcbiAgICAgICAgd2hpbGUgKHNjaGVtYVR5cGUuYXJyYXkpIHtcbiAgICAgICAgICAgIGZpZWxkLmFycmF5RGVwdGggKz0gMTtcbiAgICAgICAgICAgIHNjaGVtYVR5cGUgPSBzY2hlbWFUeXBlLmFycmF5O1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGVudW1EZWY6ID9JbnRFbnVtRGVmID0gKHNjaGVtYVR5cGUuXyAmJiBzY2hlbWFUeXBlLl8uZW51bSkgfHwgbnVsbDtcbiAgICAgICAgaWYgKGVudW1EZWYpIHtcbiAgICAgICAgICAgIGZpZWxkLmVudW1EZWYgPSBlbnVtRGVmO1xuICAgICAgICAgICAgZW51bVR5cGVzLnNldChlbnVtRGVmLm5hbWUsIGVudW1EZWYpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGpvaW4gPSAoc2NoZW1hVHlwZTogYW55KS5fLmpvaW47XG4gICAgICAgIGlmIChqb2luKSB7XG4gICAgICAgICAgICBmaWVsZC5qb2luID0gam9pbjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc2NoZW1hVHlwZS51bmlvbiB8fCBzY2hlbWFUeXBlLnN0cnVjdCkge1xuICAgICAgICAgICAgZmllbGQudHlwZSA9IHVucmVzb2x2ZWRUeXBlKG1ha2VGaWVsZFR5cGVOYW1lKHR5cGVOYW1lLCBzY2hlbWFGaWVsZC5uYW1lKSk7XG4gICAgICAgIH0gZWxzZSBpZiAoc2NoZW1hVHlwZS5yZWYpIHtcbiAgICAgICAgICAgIGZpZWxkLnR5cGUgPSB1bnJlc29sdmVkVHlwZShzY2hlbWFUeXBlLnJlZi5uYW1lKTtcbiAgICAgICAgfSBlbHNlIGlmIChzY2hlbWFUeXBlLmJvb2wpIHtcbiAgICAgICAgICAgIGZpZWxkLnR5cGUgPSBzY2FsYXJUeXBlcy5ib29sZWFuO1xuICAgICAgICB9IGVsc2UgaWYgKHNjaGVtYVR5cGUuaW50KSB7XG4gICAgICAgICAgICBjb25zdCB1bnNpZ25lZDogYm9vbGVhbiA9IChzY2hlbWFUeXBlLmludCAmJiBzY2hlbWFUeXBlLmludC51bnNpZ25lZCkgfHwgZmFsc2U7XG4gICAgICAgICAgICBjb25zdCBzaXplOiBudW1iZXIgPSAoc2NoZW1hVHlwZS5pbnQgJiYgc2NoZW1hVHlwZS5pbnQuc2l6ZSkgfHwgMzI7XG4gICAgICAgICAgICBpZiAodW5zaWduZWQpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2l6ZSA+PSAxMjgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVwb3J0VHlwZSh0eXBlTmFtZSwgZmllbGQubmFtZSwgJ3UxMDI0Jyk7XG4gICAgICAgICAgICAgICAgICAgIGZpZWxkLnR5cGUgPSBzY2FsYXJUeXBlcy51aW50MTAyNDtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHNpemUgPj0gNjQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVwb3J0VHlwZSh0eXBlTmFtZSwgZmllbGQubmFtZSwgJ3U2NCcpO1xuICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlID0gc2NhbGFyVHlwZXMudWludDY0O1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc2l6ZSA+PSAzMikge1xuICAgICAgICAgICAgICAgICAgICByZXBvcnRUeXBlKHR5cGVOYW1lLCBmaWVsZC5uYW1lLCAndTMyJyk7XG4gICAgICAgICAgICAgICAgICAgIGZpZWxkLnR5cGUgPSBzY2FsYXJUeXBlcy5mbG9hdDtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXBvcnRUeXBlKHR5cGVOYW1lLCBmaWVsZC5uYW1lLCBgdSR7c2l6ZX1gKTtcbiAgICAgICAgICAgICAgICAgICAgZmllbGQudHlwZSA9IHNjYWxhclR5cGVzLmludDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChzaXplID4gMzIpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnRlZ2VyIHR5cGUgd2l0aCBzaXplICR7c2l6ZX0gYml0IGRvZXMgbm90IHN1cHBvcnRlZGApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcG9ydFR5cGUodHlwZU5hbWUsIGZpZWxkLm5hbWUsICdpMzInKTtcbiAgICAgICAgICAgICAgICAgICAgZmllbGQudHlwZSA9IHNjYWxhclR5cGVzLmludDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoc2NoZW1hVHlwZS5mbG9hdCkge1xuICAgICAgICAgICAgcmVwb3J0VHlwZSh0eXBlTmFtZSwgZmllbGQubmFtZSwgJ2Zsb2F0Jyk7XG4gICAgICAgICAgICBmaWVsZC50eXBlID0gc2NhbGFyVHlwZXMuZmxvYXQ7XG4gICAgICAgIH0gZWxzZSBpZiAoc2NoZW1hVHlwZS5zdHJpbmcpIHtcbiAgICAgICAgICAgIGZpZWxkLnR5cGUgPSBzY2FsYXJUeXBlcy5zdHJpbmc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmaWVsZC50eXBlID0gc2NhbGFyVHlwZXMuc3RyaW5nO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ0ludmFsaWQgZmllbGQgdHlwZTogJywgSlNPTi5zdHJpbmdpZnkoc2NoZW1hVHlwZSkpO1xuICAgICAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmaWVsZDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB1bndyYXBBcnJheXModHlwZTogU2NoZW1hVHlwZSk6IFNjaGVtYVR5cGUge1xuICAgICAgICBpZiAodHlwZS5hcnJheSkge1xuICAgICAgICAgICAgcmV0dXJuIHVud3JhcEFycmF5cyh0eXBlLmFycmF5KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHlwZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZURiVHlwZShcbiAgICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgICBzY2hlbWFUeXBlOiBTY2hlbWFUeXBlXG4gICAgKSB7XG4gICAgICAgIGNvbnN0IHN0cnVjdCA9IHNjaGVtYVR5cGUudW5pb24gfHwgc2NoZW1hVHlwZS5zdHJ1Y3Q7XG4gICAgICAgIGlmICghc3RydWN0KSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgPz8gJHtuYW1lfTogJHtKU09OLnN0cmluZ2lmeShzY2hlbWFUeXBlKS5zdWJzdHIoMCwgMjAwKX1gKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0eXBlOiBEYlR5cGUgPSB7XG4gICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgY2F0ZWdvcnk6IHNjaGVtYVR5cGUudW5pb24gPyBEYlR5cGVDYXRlZ29yeS51bmlvbiA6IERiVHlwZUNhdGVnb3J5LnN0cnVjdCxcbiAgICAgICAgICAgIGZpZWxkczogW10sXG4gICAgICAgICAgICBjb2xsZWN0aW9uOiAoc2NoZW1hVHlwZTogYW55KS5fLmNvbGxlY3Rpb24sXG4gICAgICAgICAgICBkb2M6IGdldERvY01EKHNjaGVtYVR5cGUpLFxuICAgICAgICB9O1xuXG4gICAgICAgIGlmICh0eXBlLmNvbGxlY3Rpb24pIHtcbiAgICAgICAgICAgIHR5cGUuZmllbGRzLnB1c2goe1xuICAgICAgICAgICAgICAgIG5hbWU6ICdpZCcsXG4gICAgICAgICAgICAgICAgYXJyYXlEZXB0aDogMCxcbiAgICAgICAgICAgICAgICB0eXBlOiBzY2FsYXJUeXBlcy5zdHJpbmcsXG4gICAgICAgICAgICAgICAgZG9jOiAnJyxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHN0cnVjdC5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgdHlwZS5maWVsZHMucHVzaChwYXJzZURiRmllbGQobmFtZSwgZmllbGQpKTtcbiAgICAgICAgICAgIGNvbnN0IHVud3JhcHBlZCA9IHVud3JhcEFycmF5cyhmaWVsZCk7XG4gICAgICAgICAgICBjb25zdCBvd25UeXBlID0gKHVud3JhcHBlZC5zdHJ1Y3QgfHwgdW53cmFwcGVkLnVuaW9uKSA/IHVud3JhcHBlZCA6IG51bGw7XG4gICAgICAgICAgICBpZiAob3duVHlwZSkge1xuICAgICAgICAgICAgICAgIHBhcnNlRGJUeXBlKG1ha2VGaWVsZFR5cGVOYW1lKG5hbWUsIGZpZWxkLm5hbWUpLCBvd25UeXBlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGRiVHlwZXMucHVzaCh0eXBlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZURiVHlwZXModHlwZXM6IFNjaGVtYU1lbWJlcjxTY2hlbWFUeXBlPltdKSB7XG4gICAgICAgIHR5cGVzLmZvckVhY2goKHR5cGU6IFNjaGVtYU1lbWJlcjxTY2hlbWFUeXBlPikgPT4ge1xuICAgICAgICAgICAgcGFyc2VEYlR5cGUodHlwZS5uYW1lLCB0eXBlKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IHVucmVzb2x2ZWQ6IE1hcDxzdHJpbmcsIERiVHlwZT4gPSBuZXcgTWFwPHN0cmluZywgRGJUeXBlPigpO1xuICAgICAgICBjb25zdCByZXNvbHZpbmc6IFNldDxzdHJpbmc+ID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgICAgIGNvbnN0IHJlc29sdmVkOiBNYXA8c3RyaW5nLCBEYlR5cGU+ID0gbmV3IE1hcDxzdHJpbmcsIERiVHlwZT4oKTtcbiAgICAgICAgY29uc3Qgb3JkZXJlZFJlc29sdmVkOiBEYlR5cGVbXSA9IFtdO1xuICAgICAgICBkYlR5cGVzLmZvckVhY2godCA9PiB1bnJlc29sdmVkLnNldCh0Lm5hbWUsIHQpKTtcbiAgICAgICAgY29uc3QgcmVzb2x2ZVR5cGUgPSAodHlwZTogRGJUeXBlKSA9PiB7XG4gICAgICAgICAgICBpZiAocmVzb2x2ZWQuaGFzKHR5cGUubmFtZSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocmVzb2x2aW5nLmhhcyh0eXBlLm5hbWUpKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFdBUk5JTkc6IENpcmN1bGFyIHJlZmVyZW5jZSB0byB0eXBlICR7dHlwZS5uYW1lfWApO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlc29sdmluZy5hZGQodHlwZS5uYW1lKTtcbiAgICAgICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGZpZWxkLnR5cGUuY2F0ZWdvcnkgPT09IERiVHlwZUNhdGVnb3J5LnVucmVzb2x2ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHR5cGUgPSByZXNvbHZlZC5nZXQoZmllbGQudHlwZS5uYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlID0gdW5yZXNvbHZlZC5nZXQoZmllbGQudHlwZS5uYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZVR5cGUodHlwZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBSZWZlcmVuY2VkIHR5cGUgbm90IGZvdW5kOiAke2ZpZWxkLnR5cGUubmFtZX1gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpZWxkLnR5cGUgPSB0eXBlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXNvbHZpbmcuZGVsZXRlKHR5cGUubmFtZSk7XG4gICAgICAgICAgICBvcmRlcmVkUmVzb2x2ZWQucHVzaCh0eXBlKTtcbiAgICAgICAgICAgIHVucmVzb2x2ZWQuZGVsZXRlKHR5cGUubmFtZSk7XG4gICAgICAgICAgICByZXNvbHZlZC5zZXQodHlwZS5uYW1lLCB0eXBlKTtcbiAgICAgICAgfTtcbiAgICAgICAgZGJUeXBlcy5mb3JFYWNoKHJlc29sdmVUeXBlKTtcbiAgICAgICAgZGJUeXBlcyA9IG9yZGVyZWRSZXNvbHZlZDtcbiAgICB9XG5cbi8vIEdlbmVyYXRvcnNcblxuICAgIGNvbnN0IHFsID0gbmV3IFdyaXRlcigpO1xuICAgIGNvbnN0IGpzID0gbmV3IFdyaXRlcigpO1xuXG4gICAgZnVuY3Rpb24gZ2VuUUxEb2MocHJlZml4OiBzdHJpbmcsIGRvYzogc3RyaW5nKSB7XG4gICAgICAgIGlmIChkb2MudHJpbSgpID09PSAnJykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGxpbmVzID0gZG9jLnNwbGl0KC9cXG5cXHI/fFxcclxcbj8vKTtcbiAgICAgICAgaWYgKGxpbmVzLmxlbmd0aCA9PT0gMSAmJiAhbGluZXNbMF0uaW5jbHVkZXMoJ1wiJykpIHtcbiAgICAgICAgICAgIHFsLndyaXRlTG4ocHJlZml4LCAnXCInLCBsaW5lc1swXSwgJ1wiJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBxbC53cml0ZUxuKHByZWZpeCwgJ1wiXCJcIicpO1xuICAgICAgICAgICAgbGluZXMuZm9yRWFjaCgobGluZSkgPT4ge1xuICAgICAgICAgICAgICAgIHFsLndyaXRlTG4ocHJlZml4LCBsaW5lKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcWwud3JpdGVMbihwcmVmaXgsICdcIlwiXCInKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHVuaW9uVmFyaWFudFR5cGUodHlwZTogRGJUeXBlLCB2YXJpYW50OiBEYkZpZWxkKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIGAke3R5cGUubmFtZX0ke3ZhcmlhbnQubmFtZX1WYXJpYW50YDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5RTFR5cGVEZWNsYXJhdGlvbnNGb3JVbmlvblZhcmlhbnRzKHR5cGU6IERiVHlwZSkge1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKCh2YXJpYW50KSA9PiB7XG4gICAgICAgICAgICBxbC53cml0ZUJsb2NrTG4oYFxuICAgICAgICB0eXBlICR7dW5pb25WYXJpYW50VHlwZSh0eXBlLCB2YXJpYW50KX0ge1xuICAgICAgICAgICAgJHt2YXJpYW50Lm5hbWV9OiAke3ZhcmlhbnQudHlwZS5uYW1lfVxuICAgICAgICB9XG5cbiAgICAgICAgYCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlblFMRW51bVR5cGVzKCkge1xuICAgICAgICBmb3IgKGNvbnN0IGVudW1EZWY6IEludEVudW1EZWYgb2YgZW51bVR5cGVzLnZhbHVlcygpKSB7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGBlbnVtICR7ZW51bURlZi5uYW1lfUVudW0ge2ApO1xuICAgICAgICAgICAgT2JqZWN0LmtleXMoZW51bURlZi52YWx1ZXMpLmZvckVhY2goKG5hbWUpID0+IHtcbiAgICAgICAgICAgICAgICBxbC53cml0ZUxuKGAgICAgJHt0b0VudW1TdHlsZShuYW1lKX1gKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcWwud3JpdGVMbihgfWApO1xuICAgICAgICAgICAgcWwud3JpdGVMbigpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuUUxUeXBlRGVjbGFyYXRpb24odHlwZTogRGJUeXBlKSB7XG4gICAgICAgIGlmICh0eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS51bmlvbikge1xuICAgICAgICAgICAgZ2VuUUxUeXBlRGVjbGFyYXRpb25zRm9yVW5pb25WYXJpYW50cyh0eXBlKTtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oYHVuaW9uICR7dHlwZS5uYW1lfSA9IGApO1xuICAgICAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCh2YXJpYW50ID0+IHtcbiAgICAgICAgICAgICAgICBxbC53cml0ZUxuKGBcXHR8ICR7dW5pb25WYXJpYW50VHlwZSh0eXBlLCB2YXJpYW50KX1gKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcWwud3JpdGVMbigpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZ2VuUUxEb2MoJycsIHR5cGUuZG9jKTtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oYHR5cGUgJHt0eXBlLm5hbWV9IHtgKTtcbiAgICAgICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goZmllbGQgPT4ge1xuICAgICAgICAgICAgICAgIGdlblFMRG9jKCdcXHQnLCBmaWVsZC5kb2MpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHR5cGVEZWNsYXJhdGlvbiA9XG4gICAgICAgICAgICAgICAgICAgICdbJy5yZXBlYXQoZmllbGQuYXJyYXlEZXB0aCkgK1xuICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlLm5hbWUgK1xuICAgICAgICAgICAgICAgICAgICAnXScucmVwZWF0KGZpZWxkLmFycmF5RGVwdGgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHBhcmFtcyA9IChmaWVsZC50eXBlID09PSBzY2FsYXJUeXBlcy51aW50NjQgfHwgZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDEwMjQpXG4gICAgICAgICAgICAgICAgICAgID8gJyhmb3JtYXQ6IEJpZ0ludEZvcm1hdCknXG4gICAgICAgICAgICAgICAgICAgIDogJyc7XG4gICAgICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0JHtmaWVsZC5uYW1lfSR7cGFyYW1zfTogJHt0eXBlRGVjbGFyYXRpb259YCk7XG4gICAgICAgICAgICAgICAgY29uc3QgZW51bURlZiA9IGZpZWxkLmVudW1EZWY7XG4gICAgICAgICAgICAgICAgaWYgKGVudW1EZWYpIHtcbiAgICAgICAgICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0JHtmaWVsZC5uYW1lfV9uYW1lOiAke2VudW1EZWYubmFtZX1FbnVtYCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGB9YCk7XG4gICAgICAgIH1cbiAgICAgICAgcWwud3JpdGVMbigpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHByZXZlbnRUd2ljZShuYW1lOiBzdHJpbmcsIG5hbWVzOiBTZXQ8c3RyaW5nPiwgd29yazogKCkgPT4gdm9pZCkge1xuICAgICAgICBpZiAoIW5hbWVzLmhhcyhuYW1lKSkge1xuICAgICAgICAgICAgbmFtZXMuYWRkKG5hbWUpO1xuICAgICAgICAgICAgd29yaygpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuUUxGaWx0ZXJzRm9yQXJyYXlGaWVsZHModHlwZTogRGJUeXBlLCBxbE5hbWVzOiBTZXQ8c3RyaW5nPikge1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgbGV0IGl0ZW1UeXBlTmFtZSA9IGZpZWxkLnR5cGUubmFtZTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZmllbGQuYXJyYXlEZXB0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmlsdGVyTmFtZSA9IGAke2l0ZW1UeXBlTmFtZX1BcnJheUZpbHRlcmA7XG4gICAgICAgICAgICAgICAgcHJldmVudFR3aWNlKGZpbHRlck5hbWUsIHFsTmFtZXMsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcWwud3JpdGVMbihgaW5wdXQgJHtmaWx0ZXJOYW1lfSB7YCk7XG4gICAgICAgICAgICAgICAgICAgIFsnYW55JywgJ2FsbCddLmZvckVhY2goKG9wKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBxbC53cml0ZUxuKGBcXHQke29wfTogJHtpdGVtVHlwZU5hbWV9RmlsdGVyYCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBxbC53cml0ZUxuKCd9Jyk7XG4gICAgICAgICAgICAgICAgICAgIHFsLndyaXRlTG4oKTtcblxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGl0ZW1UeXBlTmFtZSArPSAnQXJyYXknO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5RTEZpbHRlcnNGb3JFbnVtTmFtZUZpZWxkcyh0eXBlOiBEYlR5cGUsIHFsTmFtZXM6IFNldDxzdHJpbmc+KSB7XG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBlbnVtRGVmID0gZmllbGQuZW51bURlZjtcbiAgICAgICAgICAgIGlmIChlbnVtRGVmKSB7XG4gICAgICAgICAgICAgICAgcHJldmVudFR3aWNlKGAke2VudW1EZWYubmFtZX1FbnVtRmlsdGVyYCwgcWxOYW1lcywgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBnZW5RTFNjYWxhclR5cGVzRmlsdGVyKGAke2VudW1EZWYubmFtZX1FbnVtYCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlblFMRmlsdGVyKHR5cGU6IERiVHlwZSwgcWxOYW1lczogU2V0PHN0cmluZz4pIHtcbiAgICAgICAgaWYgKHR5cGUuZmllbGRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGdlblFMRmlsdGVyc0ZvckFycmF5RmllbGRzKHR5cGUsIHFsTmFtZXMpO1xuICAgICAgICBnZW5RTEZpbHRlcnNGb3JFbnVtTmFtZUZpZWxkcyh0eXBlLCBxbE5hbWVzKTtcbiAgICAgICAgZ2VuUUxEb2MoJycsIHR5cGUuZG9jKTtcbiAgICAgICAgcWwud3JpdGVMbihgaW5wdXQgJHt0eXBlLm5hbWV9RmlsdGVyIHtgKTtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGdlblFMRG9jKCdcXHQnLCBmaWVsZC5kb2MpO1xuICAgICAgICAgICAgY29uc3QgdHlwZURlY2xhcmF0aW9uID0gZmllbGQudHlwZS5uYW1lICsgXCJBcnJheVwiLnJlcGVhdChmaWVsZC5hcnJheURlcHRoKTtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oYFxcdCR7ZmllbGQubmFtZX06ICR7dHlwZURlY2xhcmF0aW9ufUZpbHRlcmApO1xuICAgICAgICAgICAgY29uc3QgZW51bURlZiA9IGZpZWxkLmVudW1EZWY7XG4gICAgICAgICAgICBpZiAoZW51bURlZikge1xuICAgICAgICAgICAgICAgIHFsLndyaXRlTG4oYFxcdCR7ZmllbGQubmFtZX1fbmFtZTogJHtlbnVtRGVmLm5hbWV9RW51bUZpbHRlcmApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcWwud3JpdGVMbihgfWApO1xuICAgICAgICBxbC53cml0ZUxuKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuUUxTY2FsYXJUeXBlc0ZpbHRlcihuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgcWwud3JpdGVMbihgaW5wdXQgJHtuYW1lfUZpbHRlciB7YCk7XG4gICAgICAgIFsnZXEnLCAnbmUnLCAnZ3QnLCAnbHQnLCAnZ2UnLCAnbGUnXS5mb3JFYWNoKChvcCkgPT4ge1xuICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0JHtvcH06ICR7bmFtZX1gKTtcbiAgICAgICAgfSk7XG4gICAgICAgIFsnaW4nLCAnbm90SW4nXS5mb3JFYWNoKChvcCkgPT4ge1xuICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0JHtvcH06IFske25hbWV9XWApO1xuICAgICAgICB9KTtcbiAgICAgICAgcWwud3JpdGVMbignfScpO1xuICAgICAgICBxbC53cml0ZUxuKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuUUxRdWVyaWVzKHR5cGVzOiBEYlR5cGVbXSkge1xuICAgICAgICBxbC53cml0ZUJsb2NrTG4oYFxuICAgICAgICBcIlNwZWNpZnkgc29ydCBvcmRlciBkaXJlY3Rpb25cIlxuICAgICAgICBlbnVtIFF1ZXJ5T3JkZXJCeURpcmVjdGlvbiB7XG4gICAgICAgICAgICBcIkRvY3VtZW50cyB3aWxsIGJlIHNvcnRlZCBpbiBhc2NlbmRlZCBvcmRlciAoZS5nLiBmcm9tIEEgdG8gWilcIlxuICAgICAgICAgICAgQVNDXG4gICAgICAgICAgICBcIkRvY3VtZW50cyB3aWxsIGJlIHNvcnRlZCBpbiBkZXNjZW5kYW50IG9yZGVyIChlLmcuIGZyb20gWiB0byBBKVwiXG4gICAgICAgICAgICBERVNDXG4gICAgICAgIH1cblxuICAgICAgICBcbiAgICAgICAgXCJcIlwiXG4gICAgICAgIFNwZWNpZnkgaG93IHRvIHNvcnQgcmVzdWx0cy5cbiAgICAgICAgWW91IGNhbiBzb3J0IGRvY3VtZW50cyBpbiByZXN1bHQgc2V0IHVzaW5nIG1vcmUgdGhhbiBvbmUgZmllbGQuXG4gICAgICAgIFwiXCJcIlxuICAgICAgICBpbnB1dCBRdWVyeU9yZGVyQnkge1xuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgICBQYXRoIHRvIGZpZWxkIHdoaWNoIG11c3QgYmUgdXNlZCBhcyBhIHNvcnQgY3JpdGVyaWEuXG4gICAgICAgICAgICBJZiBmaWVsZCByZXNpZGVzIGRlZXAgaW4gc3RydWN0dXJlIHBhdGggaXRlbXMgbXVzdCBiZSBzZXBhcmF0ZWQgd2l0aCBkb3QgKGUuZy4gJ2Zvby5iYXIuYmF6JykuXG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICAgIHBhdGg6IFN0cmluZ1xuICAgICAgICAgICAgXCJTb3J0IG9yZGVyIGRpcmVjdGlvblwiXG4gICAgICAgICAgICBkaXJlY3Rpb246IFF1ZXJ5T3JkZXJCeURpcmVjdGlvblxuICAgICAgICB9XG5cbiAgICAgICAgdHlwZSBRdWVyeSB7XG4gICAgICAgIGApO1xuXG4gICAgICAgIHR5cGVzLmZvckVhY2goKHR5cGU6IERiVHlwZSkgPT4ge1xuICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0JHt0eXBlLmNvbGxlY3Rpb24gfHwgJyd9KGZpbHRlcjogJHt0eXBlLm5hbWV9RmlsdGVyLCBvcmRlckJ5OiBbUXVlcnlPcmRlckJ5XSwgbGltaXQ6IEludCwgdGltZW91dDogRmxvYXQsIGFjY2Vzc0tleTogU3RyaW5nKTogWyR7dHlwZS5uYW1lfV1gKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcWwud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgfVxuXG4gICAgICAgIGApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlblFMU3Vic2NyaXB0aW9ucyh0eXBlczogRGJUeXBlW10pIHtcbiAgICAgICAgcWwud3JpdGVMbigndHlwZSBTdWJzY3JpcHRpb24geycpO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGBcXHQke3R5cGUuY29sbGVjdGlvbiB8fCAnJ30oZmlsdGVyOiAke3R5cGUubmFtZX1GaWx0ZXIsIGFjY2Vzc0tleTogU3RyaW5nKTogJHt0eXBlLm5hbWV9YCk7XG4gICAgICAgIH0pO1xuICAgICAgICBxbC53cml0ZUxuKCd9Jyk7XG4gICAgfVxuXG5cbiAgICBmdW5jdGlvbiBnZXRTY2FsYXJSZXNvbHZlck5hbWUoZmllbGQ6IERiRmllbGQpOiBzdHJpbmcge1xuICAgICAgICBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDY0KSB7XG4gICAgICAgICAgICByZXR1cm4gJ2JpZ1VJbnQxJztcbiAgICAgICAgfVxuICAgICAgICBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDEwMjQpIHtcbiAgICAgICAgICAgIHJldHVybiAnYmlnVUludDInO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnc2NhbGFyJztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5KU0ZpbHRlcnNGb3JBcnJheUZpZWxkcyh0eXBlOiBEYlR5cGUsIGpzTmFtZXM6IFNldDxzdHJpbmc+KSB7XG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBsZXQgaXRlbVR5cGVOYW1lID0gZmllbGQudHlwZS5uYW1lO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmaWVsZC5hcnJheURlcHRoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWx0ZXJOYW1lID0gYCR7aXRlbVR5cGVOYW1lfUFycmF5YDtcbiAgICAgICAgICAgICAgICBwcmV2ZW50VHdpY2UoZmlsdGVyTmFtZSwganNOYW1lcywgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpdGVtUmVzb2x2ZXJOYW1lID0gKGkgPT09IDAgJiYgZmllbGQudHlwZS5jYXRlZ29yeSA9PT0gRGJUeXBlQ2F0ZWdvcnkuc2NhbGFyKVxuICAgICAgICAgICAgICAgICAgICAgICAgPyBnZXRTY2FsYXJSZXNvbHZlck5hbWUoZmllbGQpXG4gICAgICAgICAgICAgICAgICAgICAgICA6IGl0ZW1UeXBlTmFtZTtcbiAgICAgICAgICAgICAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgICAgICAgICBjb25zdCAke2ZpbHRlck5hbWV9ID0gYXJyYXkoKCkgPT4gJHtpdGVtUmVzb2x2ZXJOYW1lfSk7XG4gICAgICAgICAgICAgICAgYCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaXRlbVR5cGVOYW1lICs9ICdBcnJheSc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkpTU3RydWN0RmlsdGVyKHR5cGU6IERiVHlwZSkge1xuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBjb25zdCAke3R5cGUubmFtZX0gPSBzdHJ1Y3Qoe1xuICAgIGApO1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgbGV0IHR5cGVEZWNsYXJhdGlvbjogP3N0cmluZyA9IG51bGw7XG4gICAgICAgICAgICBjb25zdCBqb2luID0gZmllbGQuam9pbjtcbiAgICAgICAgICAgIGlmIChqb2luKSB7XG4gICAgICAgICAgICAgICAgdHlwZURlY2xhcmF0aW9uID0gYGpvaW4ke2ZpZWxkLmFycmF5RGVwdGggPiAwID8gJ0FycmF5JyA6ICcnfSgnJHtqb2luLm9ufScsICcke2pvaW4ucmVmT259JywgJyR7ZmllbGQudHlwZS5jb2xsZWN0aW9uIHx8ICcnfScsICgpID0+ICR7ZmllbGQudHlwZS5uYW1lfSlgO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC5hcnJheURlcHRoID4gMCkge1xuICAgICAgICAgICAgICAgIHR5cGVEZWNsYXJhdGlvbiA9XG4gICAgICAgICAgICAgICAgICAgIGZpZWxkLnR5cGUubmFtZSArXG4gICAgICAgICAgICAgICAgICAgICdBcnJheScucmVwZWF0KGZpZWxkLmFycmF5RGVwdGgpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC50eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS5zY2FsYXIpIHtcbiAgICAgICAgICAgICAgICB0eXBlRGVjbGFyYXRpb24gPSBnZXRTY2FsYXJSZXNvbHZlck5hbWUoZmllbGQpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC50eXBlLmZpZWxkcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgdHlwZURlY2xhcmF0aW9uID0gZmllbGQudHlwZS5uYW1lO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHR5cGVEZWNsYXJhdGlvbikge1xuICAgICAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAke2ZpZWxkLm5hbWV9OiAke3R5cGVEZWNsYXJhdGlvbn0sYCk7XG4gICAgICAgICAgICAgICAgY29uc3QgZW51bURlZiA9IGZpZWxkLmVudW1EZWY7XG4gICAgICAgICAgICAgICAgaWYgKGVudW1EZWYpIHtcbiAgICAgICAgICAgICAgICAgICAganMud3JpdGVMbihgICAgICR7ZmllbGQubmFtZX1fbmFtZTogZW51bU5hbWUoJyR7ZmllbGQubmFtZX0nLCAke3N0cmluZ2lmeUVudW1WYWx1ZXMoZW51bURlZi52YWx1ZXMpfSksYCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgfSR7dHlwZS5jb2xsZWN0aW9uID8gJywgdHJ1ZScgOiAnJ30pO1xuXG4gICAgYCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuSlNVbmlvblJlc29sdmVyKHR5cGU6IERiVHlwZSkge1xuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBjb25zdCAke3R5cGUubmFtZX1SZXNvbHZlciA9IHtcbiAgICAgICAgICAgIF9fcmVzb2x2ZVR5cGUob2JqLCBjb250ZXh0LCBpbmZvKSB7XG4gICAgICAgIGApO1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKCh2YXJpYW50KSA9PiB7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgIGlmICgnJHt2YXJpYW50Lm5hbWV9JyBpbiBvYmopIHtgKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgIHJldHVybiAnJHt1bmlvblZhcmlhbnRUeXBlKHR5cGUsIHZhcmlhbnQpfSc7YCk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgIH1gKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgYCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuSlNGaWx0ZXIodHlwZTogRGJUeXBlLCBqc05hbWVzOiBTZXQ8c3RyaW5nPikge1xuICAgICAgICBpZiAodHlwZS5maWVsZHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGUuY2F0ZWdvcnkgPT09IERiVHlwZUNhdGVnb3J5LnVuaW9uKSB7XG4gICAgICAgICAgICAvLyBnZW5KU0ZpbHRlcnNGb3JVbmlvblZhcmlhbnRzKHR5cGUsIGpzTmFtZXMpO1xuICAgICAgICB9XG4gICAgICAgIGdlbkpTRmlsdGVyc0ZvckFycmF5RmllbGRzKHR5cGUsIGpzTmFtZXMpO1xuICAgICAgICBnZW5KU1N0cnVjdEZpbHRlcih0eXBlKTtcbiAgICAgICAgaWYgKHR5cGUuY2F0ZWdvcnkgPT09IERiVHlwZUNhdGVnb3J5LnVuaW9uKSB7XG4gICAgICAgICAgICBnZW5KU1VuaW9uUmVzb2x2ZXIodHlwZSk7XG4gICAgICAgIH1cblxuXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2VuZXJhdGUgY3VzdG9tIHJlc29sdmVycyBmb3IgdHlwZXMgd2l0aDpcbiAgICAgKiAtIGlkIGZpZWxkXG4gICAgICogLSBqb2luIGZpZWxkc1xuICAgICAqIC0gdTY0IGFuZCBoaWdoZXIgZmllbGRzXG4gICAgICogQHBhcmFtIHR5cGVcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBnZW5KU0N1c3RvbVJlc29sdmVycyh0eXBlOiBEYlR5cGUpIHtcbiAgICAgICAgY29uc3Qgam9pbkZpZWxkcyA9IHR5cGUuZmllbGRzLmZpbHRlcih4ID0+ICEheC5qb2luKTtcbiAgICAgICAgY29uc3QgYmlnVUludEZpZWxkcyA9IHR5cGUuZmllbGRzLmZpbHRlcigoeDogRGJGaWVsZCkgPT4gKHgudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDY0KSB8fCAoeC50eXBlID09PSBzY2FsYXJUeXBlcy51aW50MTAyNCkpO1xuICAgICAgICBjb25zdCBlbnVtRmllbGRzID0gdHlwZS5maWVsZHMuZmlsdGVyKHggPT4geC5lbnVtRGVmKTtcbiAgICAgICAgY29uc3QgY3VzdG9tUmVzb2x2ZXJSZXF1aXJlZCA9IHR5cGUuY29sbGVjdGlvblxuICAgICAgICAgICAgfHwgam9pbkZpZWxkcy5sZW5ndGggPiAwXG4gICAgICAgICAgICB8fCBiaWdVSW50RmllbGRzLmxlbmd0aCA+IDBcbiAgICAgICAgICAgIHx8IGVudW1GaWVsZHMubGVuZ3RoID4gMDtcbiAgICAgICAgaWYgKCFjdXN0b21SZXNvbHZlclJlcXVpcmVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAganMud3JpdGVMbihgICAgICAgICAke3R5cGUubmFtZX06IHtgKTtcbiAgICAgICAgaWYgKHR5cGUuY29sbGVjdGlvbikge1xuICAgICAgICAgICAganMud3JpdGVMbignICAgICAgICAgICAgaWQocGFyZW50KSB7Jyk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKCcgICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5OycpO1xuICAgICAgICAgICAganMud3JpdGVMbignICAgICAgICAgICAgfSwnKTtcbiAgICAgICAgfVxuICAgICAgICBqb2luRmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBqb2luID0gZmllbGQuam9pbjtcbiAgICAgICAgICAgIGlmICgham9pbikge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IG9uRmllbGQgPSB0eXBlLmZpZWxkcy5maW5kKHggPT4geC5uYW1lID09PSBqb2luLm9uKTtcbiAgICAgICAgICAgIGlmICghb25GaWVsZCkge1xuICAgICAgICAgICAgICAgIHRocm93ICdKb2luIG9uIGZpZWxkIGRvZXMgbm90IGV4aXN0Lic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBvbiA9IGpvaW4ub24gPT09ICdpZCcgPyAnX2tleScgOiAoam9pbi5vbiB8fCAnX2tleScpO1xuICAgICAgICAgICAgY29uc3QgcmVmT24gPSBqb2luLnJlZk9uID09PSAnaWQnID8gJ19rZXknIDogKGpvaW4ucmVmT24gfHwgJ19rZXknKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbGxlY3Rpb24gPSBmaWVsZC50eXBlLmNvbGxlY3Rpb247XG4gICAgICAgICAgICBpZiAoIWNvbGxlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICB0aHJvdyAnSm9pbmVkIHR5cGUgaXMgbm90IGEgY29sbGVjdGlvbi4nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgJHtmaWVsZC5uYW1lfShwYXJlbnQsIF9hcmdzLCBjb250ZXh0KSB7YCk7XG4gICAgICAgICAgICBpZiAoZmllbGQuYXJyYXlEZXB0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICAgICByZXR1cm4gY29udGV4dC5kYi4ke2NvbGxlY3Rpb259LndhaXRGb3JEb2MocGFyZW50LiR7b259LCAnJHtyZWZPbn0nKTtgKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQuYXJyYXlEZXB0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICAgICByZXR1cm4gY29udGV4dC5kYi4ke2NvbGxlY3Rpb259LndhaXRGb3JEb2NzKHBhcmVudC4ke29ufSwgJyR7cmVmT259Jyk7YCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93ICdKb2lucyBvbiBhIG5lc3RlZCBhcnJheXMgZG9lcyBub3Qgc3VwcG9ydGVkLic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICB9LGApO1xuICAgICAgICB9KTtcbiAgICAgICAgYmlnVUludEZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcHJlZml4TGVuZ3RoID0gZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDY0ID8gMSA6IDI7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAke2ZpZWxkLm5hbWV9KHBhcmVudCwgYXJncykge2ApO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgke3ByZWZpeExlbmd0aH0sIHBhcmVudC4ke2ZpZWxkLm5hbWV9LCBhcmdzKTtgKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgIH0sYCk7XG4gICAgICAgIH0pO1xuICAgICAgICBlbnVtRmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBlbnVtRGVmID0gZmllbGQuZW51bURlZjtcbiAgICAgICAgICAgIGlmIChlbnVtRGVmKSB7XG4gICAgICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgJHtmaWVsZC5uYW1lfV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCcke2ZpZWxkLm5hbWV9JywgJHtzdHJpbmdpZnlFbnVtVmFsdWVzKGVudW1EZWYudmFsdWVzKX0pLGApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAganMud3JpdGVMbihgICAgICAgICB9LGApO1xuICAgIH1cblxuXG4gICAgZnVuY3Rpb24gZ2VuSlNUeXBlUmVzb2x2ZXJzRm9yVW5pb24odHlwZTogRGJUeXBlKSB7XG4gICAgICAgIGlmICh0eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS51bmlvbikge1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAke3R5cGUubmFtZX06ICR7dHlwZS5uYW1lfVJlc29sdmVyLGApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuZXJhdGUodHlwZXM6IERiVHlwZVtdKSB7XG5cbiAgICAgICAgLy8gUUxcblxuICAgICAgICBxbC53cml0ZUJsb2NrTG4oYFxuICAgICAgICBcIlwiXCJcbiAgICAgICAgRHVlIHRvIEdyYXBoUUwgbGltaXRhdGlvbnMgYmlnIG51bWJlcnMgYXJlIHJldHVybmVkIGFzIGEgc3RyaW5nLlxuICAgICAgICBZb3UgY2FuIHNwZWNpZnkgZm9ybWF0IHVzZWQgdG8gc3RyaW5nIHJlcHJlc2VudGF0aW9uIGZvciBiaWcgaW50ZWdlcnMuXG4gICAgICAgIFwiXCJcIlxuICAgICAgICBlbnVtIEJpZ0ludEZvcm1hdCB7XG4gICAgICAgICAgICBcIiBIZXhhZGVjaW1hbCByZXByZXNlbnRhdGlvbiBzdGFydGVkIHdpdGggMHggKGRlZmF1bHQpIFwiXG4gICAgICAgICAgICBIRVhcbiAgICAgICAgICAgIFwiIERlY2ltYWwgcmVwcmVzZW50YXRpb24gXCJcbiAgICAgICAgICAgIERFQ1xuICAgICAgICB9XG4gICAgICAgIGApO1xuICAgICAgICBbJ1N0cmluZycsICdCb29sZWFuJywgJ0ludCcsICdGbG9hdCddLmZvckVhY2goZ2VuUUxTY2FsYXJUeXBlc0ZpbHRlcik7XG4gICAgICAgIGdlblFMRW51bVR5cGVzKCk7XG4gICAgICAgIHR5cGVzLmZvckVhY2godHlwZSA9PiBnZW5RTFR5cGVEZWNsYXJhdGlvbih0eXBlKSk7XG4gICAgICAgIGNvbnN0IHFsQXJyYXlGaWx0ZXJzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgICAgIHR5cGVzLmZvckVhY2godHlwZSA9PiBnZW5RTEZpbHRlcih0eXBlLCBxbEFycmF5RmlsdGVycykpO1xuXG4gICAgICAgIGNvbnN0IGNvbGxlY3Rpb25zID0gdHlwZXMuZmlsdGVyKHQgPT4gISF0LmNvbGxlY3Rpb24pO1xuICAgICAgICBnZW5RTFF1ZXJpZXMoY29sbGVjdGlvbnMpO1xuICAgICAgICBnZW5RTFN1YnNjcmlwdGlvbnMoY29sbGVjdGlvbnMpO1xuXG4gICAgICAgIC8vIEpTXG5cbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgY29uc3Qge1xuICAgICAgICAgICAgc2NhbGFyLFxuICAgICAgICAgICAgYmlnVUludDEsXG4gICAgICAgICAgICBiaWdVSW50MixcbiAgICAgICAgICAgIHJlc29sdmVCaWdVSW50LFxuICAgICAgICAgICAgc3RydWN0LFxuICAgICAgICAgICAgYXJyYXksXG4gICAgICAgICAgICBqb2luLFxuICAgICAgICAgICAgam9pbkFycmF5LFxuICAgICAgICAgICAgZW51bU5hbWUsXG4gICAgICAgICAgICBjcmVhdGVFbnVtTmFtZVJlc29sdmVyLFxuICAgICAgICB9ID0gcmVxdWlyZSgnLi9kYi10eXBlcy5qcycpO1xuICAgICAgICBgKTtcbiAgICAgICAgY29uc3QganNBcnJheUZpbHRlcnMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICAgICAgdHlwZXMuZm9yRWFjaCh0eXBlID0+IGdlbkpTRmlsdGVyKHR5cGUsIGpzQXJyYXlGaWx0ZXJzKSk7XG5cbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgZnVuY3Rpb24gY3JlYXRlUmVzb2x2ZXJzKGRiKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICBgKTtcbiAgICAgICAgdHlwZXMuZm9yRWFjaCgodHlwZSkgPT4ge1xuICAgICAgICAgICAgZ2VuSlNDdXN0b21SZXNvbHZlcnModHlwZSk7XG4gICAgICAgICAgICBnZW5KU1R5cGVSZXNvbHZlcnNGb3JVbmlvbih0eXBlKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGpzLndyaXRlTG4oJyAgICAgICAgUXVlcnk6IHsnKTtcbiAgICAgICAgY29sbGVjdGlvbnMuZm9yRWFjaCgodHlwZSkgPT4ge1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgJHt0eXBlLmNvbGxlY3Rpb24gfHwgJyd9OiBkYi4ke3R5cGUuY29sbGVjdGlvbiB8fCAnJ30ucXVlcnlSZXNvbHZlcigpLGApXG4gICAgICAgIH0pO1xuICAgICAgICBqcy53cml0ZUxuKCcgICAgICAgIH0sJyk7XG4gICAgICAgIGpzLndyaXRlTG4oJyAgICAgICAgU3Vic2NyaXB0aW9uOiB7Jyk7XG4gICAgICAgIGNvbGxlY3Rpb25zLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICR7dHlwZS5jb2xsZWN0aW9uIHx8ICcnfTogZGIuJHt0eXBlLmNvbGxlY3Rpb24gfHwgJyd9LnN1YnNjcmlwdGlvblJlc29sdmVyKCksYClcbiAgICAgICAgfSk7XG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgYCk7XG5cbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgICAgICAgICBjcmVhdGVSZXNvbHZlcnMsXG4gICAgICAgIGApO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKHR5cGUgPT4ganMud3JpdGVMbihgICAgICR7dHlwZS5uYW1lfSxgKSk7XG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIH07XG4gICAgICAgIGApO1xuICAgIH1cblxuICAgIGNvbnN0IHNjaGVtYSA9IHBhcnNlVHlwZURlZihzY2hlbWFEZWYpO1xuXG4gICAgaWYgKHNjaGVtYS5jbGFzcykge1xuICAgICAgICBwYXJzZURiVHlwZXMoc2NoZW1hLmNsYXNzLnR5cGVzKTtcbiAgICAgICAgZ2VuZXJhdGUoZGJUeXBlcyk7XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBlOiBJbnRFbnVtRGVmIG9mIGVudW1UeXBlcy52YWx1ZXMoKSkge1xuICAgICAgICBjb25zb2xlLmxvZyhgZXhwb3J0IGNvbnN0IFEke2UubmFtZX0gPSB7YCk7XG4gICAgICAgIGNvbnNvbGUubG9nKE9iamVjdC5lbnRyaWVzKGUudmFsdWVzKS5tYXAoKFtuYW1lLCB2YWx1ZV0pID0+IHtcbiAgICAgICAgICAgIHJldHVybiBgICAgICR7bmFtZX06ICR7KHZhbHVlOiBhbnkpfSxgO1xuICAgICAgICB9KS5qb2luKCdcXG4nKSk7XG4gICAgICAgIGNvbnNvbGUubG9nKGB9O1xcbmApO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIHFsOiBxbC5nZW5lcmF0ZWQoKSxcbiAgICAgICAganM6IGpzLmdlbmVyYXRlZCgpLFxuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgbWFpbjtcbiJdfQ==