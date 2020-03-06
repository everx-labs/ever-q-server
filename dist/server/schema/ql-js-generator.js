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
        console.log(`Circular reference to type ${type.name}`);
        process.exit(1);
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
        ql.writeLn(`\t${field.name}: ${typeDeclaration}`);
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
      ql.writeLn(`\t${type.collection || ''}(filter: ${type.name}Filter, auth: String): ${type.name}`);
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
                const ${filterName} = array(${itemResolverName});
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
        typeDeclaration = `join${field.arrayDepth > 0 ? 'Array' : ''}('${join.on}', '${field.type.collection || ''}', ${field.type.name})`;
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
      const onField = type.fields.find(x => x.name === (field.join && field.join.on) || '');

      if (!onField) {
        throw 'Join on field does not exist.';
      }

      const collection = field.type.collection;

      if (!collection) {
        throw 'Joined type is not a collection.';
      }

      js.writeLn(`            ${field.name}(parent, _args, context) {`);

      if (field.arrayDepth === 0) {
        js.writeLn(`                return context.db.${collection}.waitForDoc(parent.${onField.name});`);
      } else if (field.arrayDepth === 1) {
        js.writeLn(`                return context.db.${collection}.waitForDocs(parent.${onField.name});`);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NlcnZlci9zY2hlbWEvcWwtanMtZ2VuZXJhdG9yLmpzIl0sIm5hbWVzIjpbIkRiVHlwZUNhdGVnb3J5IiwidW5yZXNvbHZlZCIsInNjYWxhciIsInVuaW9uIiwic3RydWN0Iiwic2NhbGFyVHlwZSIsIm5hbWUiLCJjYXRlZ29yeSIsImZpZWxkcyIsImRvYyIsInNjYWxhclR5cGVzIiwiaW50IiwidWludDY0IiwidWludDEwMjQiLCJmbG9hdCIsImJvb2xlYW4iLCJzdHJpbmciLCJ1bnJlc29sdmVkVHlwZSIsImlzTG93ZXJDYXNlZCIsInMiLCJsIiwidG9Mb3dlckNhc2UiLCJ1IiwidG9VcHBlckNhc2UiLCJpc1VwcGVyQ2FzZWQiLCJ0b0FsbENhcHMiLCJyZXN1bHQiLCJpIiwibGVuZ3RoIiwidG9FbnVtU3R5bGUiLCJzdWJzdHIiLCJzdHJpbmdpZnlFbnVtVmFsdWVzIiwidmFsdWVzIiwiT2JqZWN0IiwiZW50cmllcyIsIm1hcCIsInZhbHVlIiwiam9pbiIsImdldERvY01EIiwic2NoZW1hIiwibWQiLCJtYWluIiwic2NoZW1hRGVmIiwiZGJUeXBlcyIsImxhc3RSZXBvcnRlZFR5cGUiLCJlbnVtVHlwZXMiLCJNYXAiLCJyZXBvcnRUeXBlIiwiZmllbGQiLCJ0eXBlIiwiY29uc29sZSIsImxvZyIsInBhcnNlRGJGaWVsZCIsInR5cGVOYW1lIiwic2NoZW1hRmllbGQiLCJzY2hlbWFUeXBlIiwiYXJyYXlEZXB0aCIsImFycmF5IiwiZW51bURlZiIsIl8iLCJlbnVtIiwic2V0IiwicmVmIiwiYm9vbCIsInVuc2lnbmVkIiwic2l6ZSIsIkVycm9yIiwiSlNPTiIsInN0cmluZ2lmeSIsInByb2Nlc3MiLCJleGl0IiwidW53cmFwQXJyYXlzIiwicGFyc2VEYlR5cGUiLCJjb2xsZWN0aW9uIiwicHVzaCIsImZvckVhY2giLCJ1bndyYXBwZWQiLCJvd25UeXBlIiwicGFyc2VEYlR5cGVzIiwidHlwZXMiLCJyZXNvbHZpbmciLCJTZXQiLCJyZXNvbHZlZCIsIm9yZGVyZWRSZXNvbHZlZCIsInQiLCJyZXNvbHZlVHlwZSIsImhhcyIsImFkZCIsImdldCIsImRlbGV0ZSIsInFsIiwiV3JpdGVyIiwianMiLCJnZW5RTERvYyIsInByZWZpeCIsInRyaW0iLCJsaW5lcyIsInNwbGl0IiwiaW5jbHVkZXMiLCJ3cml0ZUxuIiwibGluZSIsInVuaW9uVmFyaWFudFR5cGUiLCJ2YXJpYW50IiwiZ2VuUUxUeXBlRGVjbGFyYXRpb25zRm9yVW5pb25WYXJpYW50cyIsIndyaXRlQmxvY2tMbiIsImdlblFMRW51bVR5cGVzIiwia2V5cyIsImdlblFMVHlwZURlY2xhcmF0aW9uIiwidHlwZURlY2xhcmF0aW9uIiwicmVwZWF0IiwicHJldmVudFR3aWNlIiwibmFtZXMiLCJ3b3JrIiwiZ2VuUUxGaWx0ZXJzRm9yQXJyYXlGaWVsZHMiLCJxbE5hbWVzIiwiaXRlbVR5cGVOYW1lIiwiZmlsdGVyTmFtZSIsIm9wIiwiZ2VuUUxGaWx0ZXJzRm9yRW51bU5hbWVGaWVsZHMiLCJnZW5RTFNjYWxhclR5cGVzRmlsdGVyIiwiZ2VuUUxGaWx0ZXIiLCJnZW5RTFF1ZXJpZXMiLCJnZW5RTFN1YnNjcmlwdGlvbnMiLCJnZXRTY2FsYXJSZXNvbHZlck5hbWUiLCJnZW5KU0ZpbHRlcnNGb3JBcnJheUZpZWxkcyIsImpzTmFtZXMiLCJpdGVtUmVzb2x2ZXJOYW1lIiwiZ2VuSlNTdHJ1Y3RGaWx0ZXIiLCJvbiIsImdlbkpTVW5pb25SZXNvbHZlciIsImdlbkpTRmlsdGVyIiwiZ2VuSlNDdXN0b21SZXNvbHZlcnMiLCJqb2luRmllbGRzIiwiZmlsdGVyIiwieCIsImJpZ1VJbnRGaWVsZHMiLCJlbnVtRmllbGRzIiwiY3VzdG9tUmVzb2x2ZXJSZXF1aXJlZCIsIm9uRmllbGQiLCJmaW5kIiwicHJlZml4TGVuZ3RoIiwiZ2VuSlNUeXBlUmVzb2x2ZXJzRm9yVW5pb24iLCJnZW5lcmF0ZSIsInFsQXJyYXlGaWx0ZXJzIiwiY29sbGVjdGlvbnMiLCJqc0FycmF5RmlsdGVycyIsImNsYXNzIiwiZSIsImdlbmVyYXRlZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUVBOztBQUVBOztBQUVBLE1BQU1BLGNBQWMsR0FBRztBQUNuQkMsRUFBQUEsVUFBVSxFQUFFLFlBRE87QUFFbkJDLEVBQUFBLE1BQU0sRUFBRSxRQUZXO0FBR25CQyxFQUFBQSxLQUFLLEVBQUUsT0FIWTtBQUluQkMsRUFBQUEsTUFBTSxFQUFFO0FBSlcsQ0FBdkI7O0FBb0NBLFNBQVNDLFVBQVQsQ0FBb0JDLElBQXBCLEVBQTBDO0FBQ3RDLFNBQU87QUFDSEEsSUFBQUEsSUFERztBQUVIQyxJQUFBQSxRQUFRLEVBQUVQLGNBQWMsQ0FBQ0UsTUFGdEI7QUFHSE0sSUFBQUEsTUFBTSxFQUFFLEVBSEw7QUFJSEMsSUFBQUEsR0FBRyxFQUFFO0FBSkYsR0FBUDtBQU1IOztBQUVELE1BQU1DLFdBQVcsR0FBRztBQUNoQkMsRUFBQUEsR0FBRyxFQUFFTixVQUFVLENBQUMsS0FBRCxDQURDO0FBRWhCTyxFQUFBQSxNQUFNLEVBQUVQLFVBQVUsQ0FBQyxRQUFELENBRkY7QUFHaEJRLEVBQUFBLFFBQVEsRUFBRVIsVUFBVSxDQUFDLFFBQUQsQ0FISjtBQUloQlMsRUFBQUEsS0FBSyxFQUFFVCxVQUFVLENBQUMsT0FBRCxDQUpEO0FBS2hCVSxFQUFBQSxPQUFPLEVBQUVWLFVBQVUsQ0FBQyxTQUFELENBTEg7QUFNaEJXLEVBQUFBLE1BQU0sRUFBRVgsVUFBVSxDQUFDLFFBQUQ7QUFORixDQUFwQjs7QUFTQSxTQUFTWSxjQUFULENBQXdCWCxJQUF4QixFQUE4QztBQUMxQyxTQUFPO0FBQ0hBLElBQUFBLElBREc7QUFFSEMsSUFBQUEsUUFBUSxFQUFFUCxjQUFjLENBQUNDLFVBRnRCO0FBR0hPLElBQUFBLE1BQU0sRUFBRSxFQUhMO0FBSUhDLElBQUFBLEdBQUcsRUFBRTtBQUpGLEdBQVA7QUFNSDs7QUFFRCxTQUFTUyxZQUFULENBQXNCQyxDQUF0QixFQUEwQztBQUN0QyxRQUFNQyxDQUFDLEdBQUdELENBQUMsQ0FBQ0UsV0FBRixFQUFWO0FBQ0EsUUFBTUMsQ0FBQyxHQUFHSCxDQUFDLENBQUNJLFdBQUYsRUFBVjtBQUNBLFNBQVFELENBQUMsS0FBS0YsQ0FBUCxJQUFjRCxDQUFDLEtBQUtDLENBQTNCO0FBQ0g7O0FBRUQsU0FBU0ksWUFBVCxDQUFzQkwsQ0FBdEIsRUFBMEM7QUFDdEMsUUFBTUMsQ0FBQyxHQUFHRCxDQUFDLENBQUNFLFdBQUYsRUFBVjtBQUNBLFFBQU1DLENBQUMsR0FBR0gsQ0FBQyxDQUFDSSxXQUFGLEVBQVY7QUFDQSxTQUFRRCxDQUFDLEtBQUtGLENBQVAsSUFBY0QsQ0FBQyxLQUFLRyxDQUEzQjtBQUNIOztBQUVELFNBQVNHLFNBQVQsQ0FBbUJOLENBQW5CLEVBQXNDO0FBQ2xDLE1BQUlPLE1BQU0sR0FBRyxFQUFiOztBQUNBLE9BQUssSUFBSUMsQ0FBQyxHQUFHLENBQWIsRUFBZ0JBLENBQUMsR0FBR1IsQ0FBQyxDQUFDUyxNQUF0QixFQUE4QkQsQ0FBQyxJQUFJLENBQW5DLEVBQXNDO0FBQ2xDLFFBQUtBLENBQUMsR0FBRyxDQUFMLElBQVlSLENBQUMsQ0FBQ1EsQ0FBQyxHQUFHLENBQUwsQ0FBRCxLQUFhLEdBQXpCLElBQWlDVCxZQUFZLENBQUNDLENBQUMsQ0FBQ1EsQ0FBQyxHQUFHLENBQUwsQ0FBRixDQUE3QyxJQUEyREgsWUFBWSxDQUFDTCxDQUFDLENBQUNRLENBQUQsQ0FBRixDQUEzRSxFQUFtRjtBQUMvRUQsTUFBQUEsTUFBTSxJQUFJLEdBQVY7QUFDSDs7QUFDREEsSUFBQUEsTUFBTSxJQUFJUCxDQUFDLENBQUNRLENBQUQsQ0FBWDtBQUNIOztBQUNELFNBQU9ELE1BQU0sQ0FBQ0gsV0FBUCxFQUFQO0FBQ0g7O0FBRUQsU0FBU00sV0FBVCxDQUFxQlYsQ0FBckIsRUFBd0M7QUFDcEMsU0FBUSxHQUFFQSxDQUFDLENBQUNXLE1BQUYsQ0FBUyxDQUFULEVBQVksQ0FBWixFQUFlUCxXQUFmLEVBQTZCLEdBQUVKLENBQUMsQ0FBQ1csTUFBRixDQUFTLENBQVQsQ0FBWSxFQUFyRDtBQUNIOztBQUVELFNBQVNDLG1CQUFULENBQTZCQyxNQUE3QixFQUFtRTtBQUMvRCxRQUFNeEIsTUFBTSxHQUFHeUIsTUFBTSxDQUFDQyxPQUFQLENBQWVGLE1BQWYsRUFBdUJHLEdBQXZCLENBQTJCLENBQUMsQ0FBQzdCLElBQUQsRUFBTzhCLEtBQVAsQ0FBRCxLQUFtQjtBQUN6RCxXQUFRLEdBQUVQLFdBQVcsQ0FBQ3ZCLElBQUQsQ0FBTyxLQUFLOEIsS0FBWSxFQUE3QztBQUNILEdBRmMsQ0FBZjtBQUdBLFNBQVEsS0FBSTVCLE1BQU0sQ0FBQzZCLElBQVAsQ0FBWSxJQUFaLENBQWtCLElBQTlCO0FBQ0g7O0FBRUQsU0FBU0MsUUFBVCxDQUFrQkMsTUFBbEIsRUFBNkM7QUFDekMsUUFBTTlCLEdBQUcsR0FBRzhCLE1BQU0sQ0FBQzlCLEdBQW5COztBQUNBLE1BQUksQ0FBQ0EsR0FBTCxFQUFVO0FBQ04sV0FBTyxFQUFQO0FBQ0g7O0FBQ0QsTUFBSSxPQUFPQSxHQUFQLEtBQWUsUUFBbkIsRUFBNkI7QUFDekIsV0FBT0EsR0FBUDtBQUNIOztBQUNELE1BQUlBLEdBQUcsQ0FBQytCLEVBQVIsRUFBWTtBQUNSLFdBQVEvQixHQUFHLENBQUMrQixFQUFaO0FBQ0g7O0FBQ0QsU0FBTyxFQUFQO0FBQ0g7O0FBRUQsU0FBU0MsSUFBVCxDQUFjQyxTQUFkLEVBQWtDO0FBRTlCLE1BQUlDLE9BQWlCLEdBQUcsRUFBeEI7QUFDQSxNQUFJQyxnQkFBd0IsR0FBRyxFQUEvQjtBQUNBLE1BQUlDLFNBQWtDLEdBQUcsSUFBSUMsR0FBSixFQUF6Qzs7QUFFQSxXQUFTQyxVQUFULENBQW9CekMsSUFBcEIsRUFBa0MwQyxLQUFsQyxFQUFpREMsSUFBakQsRUFBK0Q7QUFDM0QsUUFBSTNDLElBQUksS0FBS3NDLGdCQUFiLEVBQStCO0FBQzNCTSxNQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWTdDLElBQVo7QUFDQXNDLE1BQUFBLGdCQUFnQixHQUFHdEMsSUFBbkI7QUFDSDs7QUFDRDRDLElBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFhLE9BQU1ILEtBQU0sS0FBSUMsSUFBSyxFQUFsQztBQUVIOztBQUVELFdBQVNHLFlBQVQsQ0FDSUMsUUFESixFQUVJQyxXQUZKLEVBR1c7QUFDUCxRQUFJQyxVQUFVLEdBQUdELFdBQWpCO0FBQ0EsVUFBTU4sS0FBYyxHQUFHO0FBQ25CMUMsTUFBQUEsSUFBSSxFQUFFZ0QsV0FBVyxDQUFDaEQsSUFEQztBQUVuQmtELE1BQUFBLFVBQVUsRUFBRSxDQUZPO0FBR25CUCxNQUFBQSxJQUFJLEVBQUV2QyxXQUFXLENBQUNNLE1BSEM7QUFJbkJQLE1BQUFBLEdBQUcsRUFBRTZCLFFBQVEsQ0FBQ2dCLFdBQUQ7QUFKTSxLQUF2Qjs7QUFNQSxXQUFPQyxVQUFVLENBQUNFLEtBQWxCLEVBQXlCO0FBQ3JCVCxNQUFBQSxLQUFLLENBQUNRLFVBQU4sSUFBb0IsQ0FBcEI7QUFDQUQsTUFBQUEsVUFBVSxHQUFHQSxVQUFVLENBQUNFLEtBQXhCO0FBQ0g7O0FBQ0QsVUFBTUMsT0FBb0IsR0FBSUgsVUFBVSxDQUFDSSxDQUFYLElBQWdCSixVQUFVLENBQUNJLENBQVgsQ0FBYUMsSUFBOUIsSUFBdUMsSUFBcEU7O0FBQ0EsUUFBSUYsT0FBSixFQUFhO0FBQ1RWLE1BQUFBLEtBQUssQ0FBQ1UsT0FBTixHQUFnQkEsT0FBaEI7QUFDQWIsTUFBQUEsU0FBUyxDQUFDZ0IsR0FBVixDQUFjSCxPQUFPLENBQUNwRCxJQUF0QixFQUE0Qm9ELE9BQTVCO0FBQ0g7O0FBQ0QsVUFBTXJCLElBQUksR0FBSWtCLFVBQUQsQ0FBa0JJLENBQWxCLENBQW9CdEIsSUFBakM7O0FBQ0EsUUFBSUEsSUFBSixFQUFVO0FBQ05XLE1BQUFBLEtBQUssQ0FBQ1gsSUFBTixHQUFhQSxJQUFiO0FBQ0g7O0FBQ0QsUUFBSWtCLFVBQVUsQ0FBQ3BELEtBQVgsSUFBb0JvRCxVQUFVLENBQUNuRCxNQUFuQyxFQUEyQztBQUN2QzRDLE1BQUFBLEtBQUssQ0FBQ0MsSUFBTixHQUFhaEMsY0FBYyxDQUFDLDRCQUFrQm9DLFFBQWxCLEVBQTRCQyxXQUFXLENBQUNoRCxJQUF4QyxDQUFELENBQTNCO0FBQ0gsS0FGRCxNQUVPLElBQUlpRCxVQUFVLENBQUNPLEdBQWYsRUFBb0I7QUFDdkJkLE1BQUFBLEtBQUssQ0FBQ0MsSUFBTixHQUFhaEMsY0FBYyxDQUFDc0MsVUFBVSxDQUFDTyxHQUFYLENBQWV4RCxJQUFoQixDQUEzQjtBQUNILEtBRk0sTUFFQSxJQUFJaUQsVUFBVSxDQUFDUSxJQUFmLEVBQXFCO0FBQ3hCZixNQUFBQSxLQUFLLENBQUNDLElBQU4sR0FBYXZDLFdBQVcsQ0FBQ0ssT0FBekI7QUFDSCxLQUZNLE1BRUEsSUFBSXdDLFVBQVUsQ0FBQzVDLEdBQWYsRUFBb0I7QUFDdkIsWUFBTXFELFFBQWlCLEdBQUlULFVBQVUsQ0FBQzVDLEdBQVgsSUFBa0I0QyxVQUFVLENBQUM1QyxHQUFYLENBQWVxRCxRQUFsQyxJQUErQyxLQUF6RTtBQUNBLFlBQU1DLElBQVksR0FBSVYsVUFBVSxDQUFDNUMsR0FBWCxJQUFrQjRDLFVBQVUsQ0FBQzVDLEdBQVgsQ0FBZXNELElBQWxDLElBQTJDLEVBQWhFOztBQUNBLFVBQUlELFFBQUosRUFBYztBQUNWLFlBQUlDLElBQUksSUFBSSxHQUFaLEVBQWlCO0FBQ2JsQixVQUFBQSxVQUFVLENBQUNNLFFBQUQsRUFBV0wsS0FBSyxDQUFDMUMsSUFBakIsRUFBdUIsT0FBdkIsQ0FBVjtBQUNBMEMsVUFBQUEsS0FBSyxDQUFDQyxJQUFOLEdBQWF2QyxXQUFXLENBQUNHLFFBQXpCO0FBQ0gsU0FIRCxNQUdPLElBQUlvRCxJQUFJLElBQUksRUFBWixFQUFnQjtBQUNuQmxCLFVBQUFBLFVBQVUsQ0FBQ00sUUFBRCxFQUFXTCxLQUFLLENBQUMxQyxJQUFqQixFQUF1QixLQUF2QixDQUFWO0FBQ0EwQyxVQUFBQSxLQUFLLENBQUNDLElBQU4sR0FBYXZDLFdBQVcsQ0FBQ0UsTUFBekI7QUFDSCxTQUhNLE1BR0EsSUFBSXFELElBQUksSUFBSSxFQUFaLEVBQWdCO0FBQ25CbEIsVUFBQUEsVUFBVSxDQUFDTSxRQUFELEVBQVdMLEtBQUssQ0FBQzFDLElBQWpCLEVBQXVCLEtBQXZCLENBQVY7QUFDQTBDLFVBQUFBLEtBQUssQ0FBQ0MsSUFBTixHQUFhdkMsV0FBVyxDQUFDSSxLQUF6QjtBQUNILFNBSE0sTUFHQTtBQUNIaUMsVUFBQUEsVUFBVSxDQUFDTSxRQUFELEVBQVdMLEtBQUssQ0FBQzFDLElBQWpCLEVBQXdCLElBQUcyRCxJQUFLLEVBQWhDLENBQVY7QUFDQWpCLFVBQUFBLEtBQUssQ0FBQ0MsSUFBTixHQUFhdkMsV0FBVyxDQUFDQyxHQUF6QjtBQUNIO0FBQ0osT0FkRCxNQWNPO0FBQ0gsWUFBSXNELElBQUksR0FBRyxFQUFYLEVBQWU7QUFDWCxnQkFBTSxJQUFJQyxLQUFKLENBQVcsMEJBQXlCRCxJQUFLLHlCQUF6QyxDQUFOO0FBQ0gsU0FGRCxNQUVPO0FBQ0hsQixVQUFBQSxVQUFVLENBQUNNLFFBQUQsRUFBV0wsS0FBSyxDQUFDMUMsSUFBakIsRUFBdUIsS0FBdkIsQ0FBVjtBQUNBMEMsVUFBQUEsS0FBSyxDQUFDQyxJQUFOLEdBQWF2QyxXQUFXLENBQUNDLEdBQXpCO0FBQ0g7QUFDSjtBQUNKLEtBekJNLE1BeUJBLElBQUk0QyxVQUFVLENBQUN6QyxLQUFmLEVBQXNCO0FBQ3pCaUMsTUFBQUEsVUFBVSxDQUFDTSxRQUFELEVBQVdMLEtBQUssQ0FBQzFDLElBQWpCLEVBQXVCLE9BQXZCLENBQVY7QUFDQTBDLE1BQUFBLEtBQUssQ0FBQ0MsSUFBTixHQUFhdkMsV0FBVyxDQUFDSSxLQUF6QjtBQUNILEtBSE0sTUFHQSxJQUFJeUMsVUFBVSxDQUFDdkMsTUFBZixFQUF1QjtBQUMxQmdDLE1BQUFBLEtBQUssQ0FBQ0MsSUFBTixHQUFhdkMsV0FBVyxDQUFDTSxNQUF6QjtBQUNILEtBRk0sTUFFQTtBQUNIZ0MsTUFBQUEsS0FBSyxDQUFDQyxJQUFOLEdBQWF2QyxXQUFXLENBQUNNLE1BQXpCO0FBQ0FrQyxNQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSxzQkFBWixFQUFvQ2dCLElBQUksQ0FBQ0MsU0FBTCxDQUFlYixVQUFmLENBQXBDO0FBQ0FjLE1BQUFBLE9BQU8sQ0FBQ0MsSUFBUixDQUFhLENBQWI7QUFDSDs7QUFDRCxXQUFPdEIsS0FBUDtBQUNIOztBQUVELFdBQVN1QixZQUFULENBQXNCdEIsSUFBdEIsRUFBb0Q7QUFDaEQsUUFBSUEsSUFBSSxDQUFDUSxLQUFULEVBQWdCO0FBQ1osYUFBT2MsWUFBWSxDQUFDdEIsSUFBSSxDQUFDUSxLQUFOLENBQW5CO0FBQ0g7O0FBQ0QsV0FBT1IsSUFBUDtBQUNIOztBQUVELFdBQVN1QixXQUFULENBQ0lsRSxJQURKLEVBRUlpRCxVQUZKLEVBR0U7QUFDRSxVQUFNbkQsTUFBTSxHQUFHbUQsVUFBVSxDQUFDcEQsS0FBWCxJQUFvQm9ELFVBQVUsQ0FBQ25ELE1BQTlDOztBQUNBLFFBQUksQ0FBQ0EsTUFBTCxFQUFhO0FBQ1Q4QyxNQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBYSxNQUFLN0MsSUFBSyxLQUFJNkQsSUFBSSxDQUFDQyxTQUFMLENBQWViLFVBQWYsRUFBMkJ6QixNQUEzQixDQUFrQyxDQUFsQyxFQUFxQyxHQUFyQyxDQUEwQyxFQUFyRTtBQUNBO0FBQ0g7O0FBQ0QsVUFBTW1CLElBQVksR0FBRztBQUNqQjNDLE1BQUFBLElBRGlCO0FBRWpCQyxNQUFBQSxRQUFRLEVBQUVnRCxVQUFVLENBQUNwRCxLQUFYLEdBQW1CSCxjQUFjLENBQUNHLEtBQWxDLEdBQTBDSCxjQUFjLENBQUNJLE1BRmxEO0FBR2pCSSxNQUFBQSxNQUFNLEVBQUUsRUFIUztBQUlqQmlFLE1BQUFBLFVBQVUsRUFBR2xCLFVBQUQsQ0FBa0JJLENBQWxCLENBQW9CYyxVQUpmO0FBS2pCaEUsTUFBQUEsR0FBRyxFQUFFNkIsUUFBUSxDQUFDaUIsVUFBRDtBQUxJLEtBQXJCOztBQVFBLFFBQUlOLElBQUksQ0FBQ3dCLFVBQVQsRUFBcUI7QUFDakJ4QixNQUFBQSxJQUFJLENBQUN6QyxNQUFMLENBQVlrRSxJQUFaLENBQWlCO0FBQ2JwRSxRQUFBQSxJQUFJLEVBQUUsSUFETztBQUVia0QsUUFBQUEsVUFBVSxFQUFFLENBRkM7QUFHYlAsUUFBQUEsSUFBSSxFQUFFdkMsV0FBVyxDQUFDTSxNQUhMO0FBSWJQLFFBQUFBLEdBQUcsRUFBRTtBQUpRLE9BQWpCO0FBTUg7O0FBQ0RMLElBQUFBLE1BQU0sQ0FBQ3VFLE9BQVAsQ0FBZ0IzQixLQUFELElBQVc7QUFDdEJDLE1BQUFBLElBQUksQ0FBQ3pDLE1BQUwsQ0FBWWtFLElBQVosQ0FBaUJ0QixZQUFZLENBQUM5QyxJQUFELEVBQU8wQyxLQUFQLENBQTdCO0FBQ0EsWUFBTTRCLFNBQVMsR0FBR0wsWUFBWSxDQUFDdkIsS0FBRCxDQUE5QjtBQUNBLFlBQU02QixPQUFPLEdBQUlELFNBQVMsQ0FBQ3hFLE1BQVYsSUFBb0J3RSxTQUFTLENBQUN6RSxLQUEvQixHQUF3Q3lFLFNBQXhDLEdBQW9ELElBQXBFOztBQUNBLFVBQUlDLE9BQUosRUFBYTtBQUNUTCxRQUFBQSxXQUFXLENBQUMsNEJBQWtCbEUsSUFBbEIsRUFBd0IwQyxLQUFLLENBQUMxQyxJQUE5QixDQUFELEVBQXNDdUUsT0FBdEMsQ0FBWDtBQUNIO0FBQ0osS0FQRDtBQVFBbEMsSUFBQUEsT0FBTyxDQUFDK0IsSUFBUixDQUFhekIsSUFBYjtBQUNIOztBQUVELFdBQVM2QixZQUFULENBQXNCQyxLQUF0QixFQUF5RDtBQUNyREEsSUFBQUEsS0FBSyxDQUFDSixPQUFOLENBQWUxQixJQUFELElBQW9DO0FBQzlDdUIsTUFBQUEsV0FBVyxDQUFDdkIsSUFBSSxDQUFDM0MsSUFBTixFQUFZMkMsSUFBWixDQUFYO0FBQ0gsS0FGRDtBQUdBLFVBQU1oRCxVQUErQixHQUFHLElBQUk2QyxHQUFKLEVBQXhDO0FBQ0EsVUFBTWtDLFNBQXNCLEdBQUcsSUFBSUMsR0FBSixFQUEvQjtBQUNBLFVBQU1DLFFBQTZCLEdBQUcsSUFBSXBDLEdBQUosRUFBdEM7QUFDQSxVQUFNcUMsZUFBeUIsR0FBRyxFQUFsQztBQUNBeEMsSUFBQUEsT0FBTyxDQUFDZ0MsT0FBUixDQUFnQlMsQ0FBQyxJQUFJbkYsVUFBVSxDQUFDNEQsR0FBWCxDQUFldUIsQ0FBQyxDQUFDOUUsSUFBakIsRUFBdUI4RSxDQUF2QixDQUFyQjs7QUFDQSxVQUFNQyxXQUFXLEdBQUlwQyxJQUFELElBQWtCO0FBQ2xDLFVBQUlpQyxRQUFRLENBQUNJLEdBQVQsQ0FBYXJDLElBQUksQ0FBQzNDLElBQWxCLENBQUosRUFBNkI7QUFDekI7QUFDSDs7QUFDRCxVQUFJMEUsU0FBUyxDQUFDTSxHQUFWLENBQWNyQyxJQUFJLENBQUMzQyxJQUFuQixDQUFKLEVBQThCO0FBQzFCNEMsUUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQWEsOEJBQTZCRixJQUFJLENBQUMzQyxJQUFLLEVBQXBEO0FBQ0ErRCxRQUFBQSxPQUFPLENBQUNDLElBQVIsQ0FBYSxDQUFiO0FBQ0g7O0FBQ0RVLE1BQUFBLFNBQVMsQ0FBQ08sR0FBVixDQUFjdEMsSUFBSSxDQUFDM0MsSUFBbkI7QUFDQTJDLE1BQUFBLElBQUksQ0FBQ3pDLE1BQUwsQ0FBWW1FLE9BQVosQ0FBcUIzQixLQUFELElBQVc7QUFDM0IsWUFBSUEsS0FBSyxDQUFDQyxJQUFOLENBQVcxQyxRQUFYLEtBQXdCUCxjQUFjLENBQUNDLFVBQTNDLEVBQXVEO0FBQ25ELGNBQUlnRCxJQUFJLEdBQUdpQyxRQUFRLENBQUNNLEdBQVQsQ0FBYXhDLEtBQUssQ0FBQ0MsSUFBTixDQUFXM0MsSUFBeEIsQ0FBWDs7QUFDQSxjQUFJLENBQUMyQyxJQUFMLEVBQVc7QUFDUEEsWUFBQUEsSUFBSSxHQUFHaEQsVUFBVSxDQUFDdUYsR0FBWCxDQUFleEMsS0FBSyxDQUFDQyxJQUFOLENBQVczQyxJQUExQixDQUFQOztBQUNBLGdCQUFJMkMsSUFBSixFQUFVO0FBQ05vQyxjQUFBQSxXQUFXLENBQUNwQyxJQUFELENBQVg7QUFDSCxhQUZELE1BRU87QUFDSEMsY0FBQUEsT0FBTyxDQUFDQyxHQUFSLENBQWEsOEJBQTZCSCxLQUFLLENBQUNDLElBQU4sQ0FBVzNDLElBQUssRUFBMUQ7QUFDQStELGNBQUFBLE9BQU8sQ0FBQ0MsSUFBUixDQUFhLENBQWI7QUFDSDtBQUNKOztBQUNELGNBQUlyQixJQUFKLEVBQVU7QUFDTkQsWUFBQUEsS0FBSyxDQUFDQyxJQUFOLEdBQWFBLElBQWI7QUFDSDtBQUNKO0FBQ0osT0FoQkQ7QUFpQkErQixNQUFBQSxTQUFTLENBQUNTLE1BQVYsQ0FBaUJ4QyxJQUFJLENBQUMzQyxJQUF0QjtBQUNBNkUsTUFBQUEsZUFBZSxDQUFDVCxJQUFoQixDQUFxQnpCLElBQXJCO0FBQ0FoRCxNQUFBQSxVQUFVLENBQUN3RixNQUFYLENBQWtCeEMsSUFBSSxDQUFDM0MsSUFBdkI7QUFDQTRFLE1BQUFBLFFBQVEsQ0FBQ3JCLEdBQVQsQ0FBYVosSUFBSSxDQUFDM0MsSUFBbEIsRUFBd0IyQyxJQUF4QjtBQUNILEtBOUJEOztBQStCQU4sSUFBQUEsT0FBTyxDQUFDZ0MsT0FBUixDQUFnQlUsV0FBaEI7QUFDQTFDLElBQUFBLE9BQU8sR0FBR3dDLGVBQVY7QUFDSCxHQXhLNkIsQ0EwS2xDOzs7QUFFSSxRQUFNTyxFQUFFLEdBQUcsSUFBSUMsV0FBSixFQUFYO0FBQ0EsUUFBTUMsRUFBRSxHQUFHLElBQUlELFdBQUosRUFBWDs7QUFFQSxXQUFTRSxRQUFULENBQWtCQyxNQUFsQixFQUFrQ3JGLEdBQWxDLEVBQStDO0FBQzNDLFFBQUlBLEdBQUcsQ0FBQ3NGLElBQUosT0FBZSxFQUFuQixFQUF1QjtBQUNuQjtBQUNIOztBQUNELFVBQU1DLEtBQUssR0FBR3ZGLEdBQUcsQ0FBQ3dGLEtBQUosQ0FBVSxhQUFWLENBQWQ7O0FBQ0EsUUFBSUQsS0FBSyxDQUFDcEUsTUFBTixLQUFpQixDQUFqQixJQUFzQixDQUFDb0UsS0FBSyxDQUFDLENBQUQsQ0FBTCxDQUFTRSxRQUFULENBQWtCLEdBQWxCLENBQTNCLEVBQW1EO0FBQy9DUixNQUFBQSxFQUFFLENBQUNTLE9BQUgsQ0FBV0wsTUFBWCxFQUFtQixHQUFuQixFQUF3QkUsS0FBSyxDQUFDLENBQUQsQ0FBN0IsRUFBa0MsR0FBbEM7QUFDSCxLQUZELE1BRU87QUFDSE4sTUFBQUEsRUFBRSxDQUFDUyxPQUFILENBQVdMLE1BQVgsRUFBbUIsS0FBbkI7QUFDQUUsTUFBQUEsS0FBSyxDQUFDckIsT0FBTixDQUFleUIsSUFBRCxJQUFVO0FBQ3BCVixRQUFBQSxFQUFFLENBQUNTLE9BQUgsQ0FBV0wsTUFBWCxFQUFtQk0sSUFBbkI7QUFDSCxPQUZEO0FBR0FWLE1BQUFBLEVBQUUsQ0FBQ1MsT0FBSCxDQUFXTCxNQUFYLEVBQW1CLEtBQW5CO0FBQ0g7QUFDSjs7QUFFRCxXQUFTTyxnQkFBVCxDQUEwQnBELElBQTFCLEVBQXdDcUQsT0FBeEMsRUFBa0U7QUFDOUQsV0FBUSxHQUFFckQsSUFBSSxDQUFDM0MsSUFBSyxHQUFFZ0csT0FBTyxDQUFDaEcsSUFBSyxTQUFuQztBQUNIOztBQUVELFdBQVNpRyxxQ0FBVCxDQUErQ3RELElBQS9DLEVBQTZEO0FBQ3pEQSxJQUFBQSxJQUFJLENBQUN6QyxNQUFMLENBQVltRSxPQUFaLENBQXFCMkIsT0FBRCxJQUFhO0FBQzdCWixNQUFBQSxFQUFFLENBQUNjLFlBQUgsQ0FBaUI7ZUFDZEgsZ0JBQWdCLENBQUNwRCxJQUFELEVBQU9xRCxPQUFQLENBQWdCO2NBQ2pDQSxPQUFPLENBQUNoRyxJQUFLLEtBQUlnRyxPQUFPLENBQUNyRCxJQUFSLENBQWEzQyxJQUFLOzs7U0FGckM7QUFNSCxLQVBEO0FBUUg7O0FBRUQsV0FBU21HLGNBQVQsR0FBMEI7QUFDdEIsU0FBSyxNQUFNL0MsT0FBWCxJQUFrQ2IsU0FBUyxDQUFDYixNQUFWLEVBQWxDLEVBQXNEO0FBQ2xEMEQsTUFBQUEsRUFBRSxDQUFDUyxPQUFILENBQVksUUFBT3pDLE9BQU8sQ0FBQ3BELElBQUssUUFBaEM7QUFDQTJCLE1BQUFBLE1BQU0sQ0FBQ3lFLElBQVAsQ0FBWWhELE9BQU8sQ0FBQzFCLE1BQXBCLEVBQTRCMkMsT0FBNUIsQ0FBcUNyRSxJQUFELElBQVU7QUFDMUNvRixRQUFBQSxFQUFFLENBQUNTLE9BQUgsQ0FBWSxPQUFNdEUsV0FBVyxDQUFDdkIsSUFBRCxDQUFPLEVBQXBDO0FBQ0gsT0FGRDtBQUdBb0YsTUFBQUEsRUFBRSxDQUFDUyxPQUFILENBQVksR0FBWjtBQUNBVCxNQUFBQSxFQUFFLENBQUNTLE9BQUg7QUFDSDtBQUNKOztBQUVELFdBQVNRLG9CQUFULENBQThCMUQsSUFBOUIsRUFBNEM7QUFDeEMsUUFBSUEsSUFBSSxDQUFDMUMsUUFBTCxLQUFrQlAsY0FBYyxDQUFDRyxLQUFyQyxFQUE0QztBQUN4Q29HLE1BQUFBLHFDQUFxQyxDQUFDdEQsSUFBRCxDQUFyQztBQUNBeUMsTUFBQUEsRUFBRSxDQUFDUyxPQUFILENBQVksU0FBUWxELElBQUksQ0FBQzNDLElBQUssS0FBOUI7QUFDQTJDLE1BQUFBLElBQUksQ0FBQ3pDLE1BQUwsQ0FBWW1FLE9BQVosQ0FBb0IyQixPQUFPLElBQUk7QUFDM0JaLFFBQUFBLEVBQUUsQ0FBQ1MsT0FBSCxDQUFZLE9BQU1FLGdCQUFnQixDQUFDcEQsSUFBRCxFQUFPcUQsT0FBUCxDQUFnQixFQUFsRDtBQUNILE9BRkQ7QUFHQVosTUFBQUEsRUFBRSxDQUFDUyxPQUFIO0FBQ0gsS0FQRCxNQU9PO0FBQ0hOLE1BQUFBLFFBQVEsQ0FBQyxFQUFELEVBQUs1QyxJQUFJLENBQUN4QyxHQUFWLENBQVI7QUFDQWlGLE1BQUFBLEVBQUUsQ0FBQ1MsT0FBSCxDQUFZLFFBQU9sRCxJQUFJLENBQUMzQyxJQUFLLElBQTdCO0FBQ0EyQyxNQUFBQSxJQUFJLENBQUN6QyxNQUFMLENBQVltRSxPQUFaLENBQW9CM0IsS0FBSyxJQUFJO0FBQ3pCNkMsUUFBQUEsUUFBUSxDQUFDLElBQUQsRUFBTzdDLEtBQUssQ0FBQ3ZDLEdBQWIsQ0FBUjtBQUNBLGNBQU1tRyxlQUFlLEdBQ2pCLElBQUlDLE1BQUosQ0FBVzdELEtBQUssQ0FBQ1EsVUFBakIsSUFDQVIsS0FBSyxDQUFDQyxJQUFOLENBQVczQyxJQURYLEdBRUEsSUFBSXVHLE1BQUosQ0FBVzdELEtBQUssQ0FBQ1EsVUFBakIsQ0FISjtBQUlBa0MsUUFBQUEsRUFBRSxDQUFDUyxPQUFILENBQVksS0FBSW5ELEtBQUssQ0FBQzFDLElBQUssS0FBSXNHLGVBQWdCLEVBQS9DO0FBQ0EsY0FBTWxELE9BQU8sR0FBR1YsS0FBSyxDQUFDVSxPQUF0Qjs7QUFDQSxZQUFJQSxPQUFKLEVBQWE7QUFDVGdDLFVBQUFBLEVBQUUsQ0FBQ1MsT0FBSCxDQUFZLEtBQUluRCxLQUFLLENBQUMxQyxJQUFLLFVBQVNvRCxPQUFPLENBQUNwRCxJQUFLLE1BQWpEO0FBQ0g7QUFDSixPQVhEO0FBWUFvRixNQUFBQSxFQUFFLENBQUNTLE9BQUgsQ0FBWSxHQUFaO0FBQ0g7O0FBQ0RULElBQUFBLEVBQUUsQ0FBQ1MsT0FBSDtBQUNIOztBQUVELFdBQVNXLFlBQVQsQ0FBc0J4RyxJQUF0QixFQUFvQ3lHLEtBQXBDLEVBQXdEQyxJQUF4RCxFQUEwRTtBQUN0RSxRQUFJLENBQUNELEtBQUssQ0FBQ3pCLEdBQU4sQ0FBVWhGLElBQVYsQ0FBTCxFQUFzQjtBQUNsQnlHLE1BQUFBLEtBQUssQ0FBQ3hCLEdBQU4sQ0FBVWpGLElBQVY7QUFDQTBHLE1BQUFBLElBQUk7QUFDUDtBQUNKOztBQUVELFdBQVNDLDBCQUFULENBQW9DaEUsSUFBcEMsRUFBa0RpRSxPQUFsRCxFQUF3RTtBQUNwRWpFLElBQUFBLElBQUksQ0FBQ3pDLE1BQUwsQ0FBWW1FLE9BQVosQ0FBcUIzQixLQUFELElBQVc7QUFDM0IsVUFBSW1FLFlBQVksR0FBR25FLEtBQUssQ0FBQ0MsSUFBTixDQUFXM0MsSUFBOUI7O0FBQ0EsV0FBSyxJQUFJcUIsQ0FBQyxHQUFHLENBQWIsRUFBZ0JBLENBQUMsR0FBR3FCLEtBQUssQ0FBQ1EsVUFBMUIsRUFBc0M3QixDQUFDLElBQUksQ0FBM0MsRUFBOEM7QUFDMUMsY0FBTXlGLFVBQVUsR0FBSSxHQUFFRCxZQUFhLGFBQW5DO0FBQ0FMLFFBQUFBLFlBQVksQ0FBQ00sVUFBRCxFQUFhRixPQUFiLEVBQXNCLE1BQU07QUFDcEN4QixVQUFBQSxFQUFFLENBQUNTLE9BQUgsQ0FBWSxTQUFRaUIsVUFBVyxJQUEvQjtBQUNBLFdBQUMsS0FBRCxFQUFRLEtBQVIsRUFBZXpDLE9BQWYsQ0FBd0IwQyxFQUFELElBQVE7QUFDM0IzQixZQUFBQSxFQUFFLENBQUNTLE9BQUgsQ0FBWSxLQUFJa0IsRUFBRyxLQUFJRixZQUFhLFFBQXBDO0FBQ0gsV0FGRDtBQUdBekIsVUFBQUEsRUFBRSxDQUFDUyxPQUFILENBQVcsR0FBWDtBQUNBVCxVQUFBQSxFQUFFLENBQUNTLE9BQUg7QUFFSCxTQVJXLENBQVo7QUFTQWdCLFFBQUFBLFlBQVksSUFBSSxPQUFoQjtBQUNIO0FBQ0osS0FmRDtBQWdCSDs7QUFFRCxXQUFTRyw2QkFBVCxDQUF1Q3JFLElBQXZDLEVBQXFEaUUsT0FBckQsRUFBMkU7QUFDdkVqRSxJQUFBQSxJQUFJLENBQUN6QyxNQUFMLENBQVltRSxPQUFaLENBQXFCM0IsS0FBRCxJQUFXO0FBQzNCLFlBQU1VLE9BQU8sR0FBR1YsS0FBSyxDQUFDVSxPQUF0Qjs7QUFDQSxVQUFJQSxPQUFKLEVBQWE7QUFDVG9ELFFBQUFBLFlBQVksQ0FBRSxHQUFFcEQsT0FBTyxDQUFDcEQsSUFBSyxZQUFqQixFQUE4QjRHLE9BQTlCLEVBQXVDLE1BQU07QUFDckRLLFVBQUFBLHNCQUFzQixDQUFFLEdBQUU3RCxPQUFPLENBQUNwRCxJQUFLLE1BQWpCLENBQXRCO0FBQ0gsU0FGVyxDQUFaO0FBR0g7QUFDSixLQVBEO0FBUUg7O0FBRUQsV0FBU2tILFdBQVQsQ0FBcUJ2RSxJQUFyQixFQUFtQ2lFLE9BQW5DLEVBQXlEO0FBQ3JELFFBQUlqRSxJQUFJLENBQUN6QyxNQUFMLENBQVlvQixNQUFaLEtBQXVCLENBQTNCLEVBQThCO0FBQzFCO0FBQ0g7O0FBQ0RxRixJQUFBQSwwQkFBMEIsQ0FBQ2hFLElBQUQsRUFBT2lFLE9BQVAsQ0FBMUI7QUFDQUksSUFBQUEsNkJBQTZCLENBQUNyRSxJQUFELEVBQU9pRSxPQUFQLENBQTdCO0FBQ0FyQixJQUFBQSxRQUFRLENBQUMsRUFBRCxFQUFLNUMsSUFBSSxDQUFDeEMsR0FBVixDQUFSO0FBQ0FpRixJQUFBQSxFQUFFLENBQUNTLE9BQUgsQ0FBWSxTQUFRbEQsSUFBSSxDQUFDM0MsSUFBSyxVQUE5QjtBQUNBMkMsSUFBQUEsSUFBSSxDQUFDekMsTUFBTCxDQUFZbUUsT0FBWixDQUFxQjNCLEtBQUQsSUFBVztBQUMzQjZDLE1BQUFBLFFBQVEsQ0FBQyxJQUFELEVBQU83QyxLQUFLLENBQUN2QyxHQUFiLENBQVI7QUFDQSxZQUFNbUcsZUFBZSxHQUFHNUQsS0FBSyxDQUFDQyxJQUFOLENBQVczQyxJQUFYLEdBQWtCLFFBQVF1RyxNQUFSLENBQWU3RCxLQUFLLENBQUNRLFVBQXJCLENBQTFDO0FBQ0FrQyxNQUFBQSxFQUFFLENBQUNTLE9BQUgsQ0FBWSxLQUFJbkQsS0FBSyxDQUFDMUMsSUFBSyxLQUFJc0csZUFBZ0IsUUFBL0M7QUFDQSxZQUFNbEQsT0FBTyxHQUFHVixLQUFLLENBQUNVLE9BQXRCOztBQUNBLFVBQUlBLE9BQUosRUFBYTtBQUNUZ0MsUUFBQUEsRUFBRSxDQUFDUyxPQUFILENBQVksS0FBSW5ELEtBQUssQ0FBQzFDLElBQUssVUFBU29ELE9BQU8sQ0FBQ3BELElBQUssWUFBakQ7QUFDSDtBQUNKLEtBUkQ7QUFTQW9GLElBQUFBLEVBQUUsQ0FBQ1MsT0FBSCxDQUFZLEdBQVo7QUFDQVQsSUFBQUEsRUFBRSxDQUFDUyxPQUFIO0FBQ0g7O0FBRUQsV0FBU29CLHNCQUFULENBQWdDakgsSUFBaEMsRUFBOEM7QUFDMUNvRixJQUFBQSxFQUFFLENBQUNTLE9BQUgsQ0FBWSxTQUFRN0YsSUFBSyxVQUF6QjtBQUNBLEtBQUMsSUFBRCxFQUFPLElBQVAsRUFBYSxJQUFiLEVBQW1CLElBQW5CLEVBQXlCLElBQXpCLEVBQStCLElBQS9CLEVBQXFDcUUsT0FBckMsQ0FBOEMwQyxFQUFELElBQVE7QUFDakQzQixNQUFBQSxFQUFFLENBQUNTLE9BQUgsQ0FBWSxLQUFJa0IsRUFBRyxLQUFJL0csSUFBSyxFQUE1QjtBQUNILEtBRkQ7QUFHQSxLQUFDLElBQUQsRUFBTyxPQUFQLEVBQWdCcUUsT0FBaEIsQ0FBeUIwQyxFQUFELElBQVE7QUFDNUIzQixNQUFBQSxFQUFFLENBQUNTLE9BQUgsQ0FBWSxLQUFJa0IsRUFBRyxNQUFLL0csSUFBSyxHQUE3QjtBQUNILEtBRkQ7QUFHQW9GLElBQUFBLEVBQUUsQ0FBQ1MsT0FBSCxDQUFXLEdBQVg7QUFDQVQsSUFBQUEsRUFBRSxDQUFDUyxPQUFIO0FBQ0g7O0FBRUQsV0FBU3NCLFlBQVQsQ0FBc0IxQyxLQUF0QixFQUF1QztBQUNuQ1csSUFBQUEsRUFBRSxDQUFDYyxZQUFILENBQWlCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O1NBQWpCO0FBMkJBekIsSUFBQUEsS0FBSyxDQUFDSixPQUFOLENBQWUxQixJQUFELElBQWtCO0FBQzVCeUMsTUFBQUEsRUFBRSxDQUFDUyxPQUFILENBQVksS0FBSWxELElBQUksQ0FBQ3dCLFVBQUwsSUFBbUIsRUFBRyxZQUFXeEIsSUFBSSxDQUFDM0MsSUFBSyxxRkFBb0YyQyxJQUFJLENBQUMzQyxJQUFLLEdBQXpKO0FBQ0gsS0FGRDtBQUlBb0YsSUFBQUEsRUFBRSxDQUFDYyxZQUFILENBQWlCOzs7U0FBakI7QUFJSDs7QUFFRCxXQUFTa0Isa0JBQVQsQ0FBNEIzQyxLQUE1QixFQUE2QztBQUN6Q1csSUFBQUEsRUFBRSxDQUFDUyxPQUFILENBQVcscUJBQVg7QUFDQXBCLElBQUFBLEtBQUssQ0FBQ0osT0FBTixDQUFlMUIsSUFBRCxJQUFVO0FBQ3BCeUMsTUFBQUEsRUFBRSxDQUFDUyxPQUFILENBQVksS0FBSWxELElBQUksQ0FBQ3dCLFVBQUwsSUFBbUIsRUFBRyxZQUFXeEIsSUFBSSxDQUFDM0MsSUFBSywwQkFBeUIyQyxJQUFJLENBQUMzQyxJQUFLLEVBQTlGO0FBQ0gsS0FGRDtBQUdBb0YsSUFBQUEsRUFBRSxDQUFDUyxPQUFILENBQVcsR0FBWDtBQUNIOztBQUdELFdBQVN3QixxQkFBVCxDQUErQjNFLEtBQS9CLEVBQXVEO0FBQ25ELFFBQUlBLEtBQUssQ0FBQ0MsSUFBTixLQUFldkMsV0FBVyxDQUFDRSxNQUEvQixFQUF1QztBQUNuQyxhQUFPLFVBQVA7QUFDSDs7QUFDRCxRQUFJb0MsS0FBSyxDQUFDQyxJQUFOLEtBQWV2QyxXQUFXLENBQUNHLFFBQS9CLEVBQXlDO0FBQ3JDLGFBQU8sVUFBUDtBQUNIOztBQUNELFdBQU8sUUFBUDtBQUNIOztBQUVELFdBQVMrRywwQkFBVCxDQUFvQzNFLElBQXBDLEVBQWtENEUsT0FBbEQsRUFBd0U7QUFDcEU1RSxJQUFBQSxJQUFJLENBQUN6QyxNQUFMLENBQVltRSxPQUFaLENBQXFCM0IsS0FBRCxJQUFXO0FBQzNCLFVBQUltRSxZQUFZLEdBQUduRSxLQUFLLENBQUNDLElBQU4sQ0FBVzNDLElBQTlCOztBQUNBLFdBQUssSUFBSXFCLENBQUMsR0FBRyxDQUFiLEVBQWdCQSxDQUFDLEdBQUdxQixLQUFLLENBQUNRLFVBQTFCLEVBQXNDN0IsQ0FBQyxJQUFJLENBQTNDLEVBQThDO0FBQzFDLGNBQU15RixVQUFVLEdBQUksR0FBRUQsWUFBYSxPQUFuQztBQUNBTCxRQUFBQSxZQUFZLENBQUNNLFVBQUQsRUFBYVMsT0FBYixFQUFzQixNQUFNO0FBQ3BDLGdCQUFNQyxnQkFBZ0IsR0FBSW5HLENBQUMsS0FBSyxDQUFOLElBQVdxQixLQUFLLENBQUNDLElBQU4sQ0FBVzFDLFFBQVgsS0FBd0JQLGNBQWMsQ0FBQ0UsTUFBbkQsR0FDbkJ5SCxxQkFBcUIsQ0FBQzNFLEtBQUQsQ0FERixHQUVuQm1FLFlBRk47QUFHQXZCLFVBQUFBLEVBQUUsQ0FBQ1ksWUFBSCxDQUFpQjt3QkFDYlksVUFBVyxZQUFXVSxnQkFBaUI7aUJBRDNDO0FBR0gsU0FQVyxDQUFaO0FBUUFYLFFBQUFBLFlBQVksSUFBSSxPQUFoQjtBQUNIO0FBQ0osS0FkRDtBQWVIOztBQUVELFdBQVNZLGlCQUFULENBQTJCOUUsSUFBM0IsRUFBeUM7QUFDckMyQyxJQUFBQSxFQUFFLENBQUNZLFlBQUgsQ0FBaUI7Z0JBQ1R2RCxJQUFJLENBQUMzQyxJQUFLO0tBRGxCO0FBR0EyQyxJQUFBQSxJQUFJLENBQUN6QyxNQUFMLENBQVltRSxPQUFaLENBQXFCM0IsS0FBRCxJQUFXO0FBQzNCLFVBQUk0RCxlQUF3QixHQUFHLElBQS9CO0FBQ0EsWUFBTXZFLElBQUksR0FBR1csS0FBSyxDQUFDWCxJQUFuQjs7QUFDQSxVQUFJQSxJQUFKLEVBQVU7QUFDTnVFLFFBQUFBLGVBQWUsR0FBSSxPQUFNNUQsS0FBSyxDQUFDUSxVQUFOLEdBQW1CLENBQW5CLEdBQXVCLE9BQXZCLEdBQWlDLEVBQUcsS0FBSW5CLElBQUksQ0FBQzJGLEVBQUcsT0FBTWhGLEtBQUssQ0FBQ0MsSUFBTixDQUFXd0IsVUFBWCxJQUF5QixFQUFHLE1BQUt6QixLQUFLLENBQUNDLElBQU4sQ0FBVzNDLElBQUssR0FBaEk7QUFDSCxPQUZELE1BRU8sSUFBSTBDLEtBQUssQ0FBQ1EsVUFBTixHQUFtQixDQUF2QixFQUEwQjtBQUM3Qm9ELFFBQUFBLGVBQWUsR0FDWDVELEtBQUssQ0FBQ0MsSUFBTixDQUFXM0MsSUFBWCxHQUNBLFFBQVF1RyxNQUFSLENBQWU3RCxLQUFLLENBQUNRLFVBQXJCLENBRko7QUFHSCxPQUpNLE1BSUEsSUFBSVIsS0FBSyxDQUFDQyxJQUFOLENBQVcxQyxRQUFYLEtBQXdCUCxjQUFjLENBQUNFLE1BQTNDLEVBQW1EO0FBQ3REMEcsUUFBQUEsZUFBZSxHQUFHZSxxQkFBcUIsQ0FBQzNFLEtBQUQsQ0FBdkM7QUFDSCxPQUZNLE1BRUEsSUFBSUEsS0FBSyxDQUFDQyxJQUFOLENBQVd6QyxNQUFYLENBQWtCb0IsTUFBbEIsR0FBMkIsQ0FBL0IsRUFBa0M7QUFDckNnRixRQUFBQSxlQUFlLEdBQUc1RCxLQUFLLENBQUNDLElBQU4sQ0FBVzNDLElBQTdCO0FBQ0g7O0FBQ0QsVUFBSXNHLGVBQUosRUFBcUI7QUFDakJoQixRQUFBQSxFQUFFLENBQUNPLE9BQUgsQ0FBWSxPQUFNbkQsS0FBSyxDQUFDMUMsSUFBSyxLQUFJc0csZUFBZ0IsR0FBakQ7QUFDQSxjQUFNbEQsT0FBTyxHQUFHVixLQUFLLENBQUNVLE9BQXRCOztBQUNBLFlBQUlBLE9BQUosRUFBYTtBQUNUa0MsVUFBQUEsRUFBRSxDQUFDTyxPQUFILENBQVksT0FBTW5ELEtBQUssQ0FBQzFDLElBQUssb0JBQW1CMEMsS0FBSyxDQUFDMUMsSUFBSyxNQUFLeUIsbUJBQW1CLENBQUMyQixPQUFPLENBQUMxQixNQUFULENBQWlCLElBQXBHO0FBQ0g7QUFDSjtBQUNKLEtBckJEO0FBc0JBNEQsSUFBQUEsRUFBRSxDQUFDWSxZQUFILENBQWlCO1dBQ2R2RCxJQUFJLENBQUN3QixVQUFMLEdBQWtCLFFBQWxCLEdBQTZCLEVBQUc7O0tBRG5DO0FBSUg7O0FBRUQsV0FBU3dELGtCQUFULENBQTRCaEYsSUFBNUIsRUFBMEM7QUFDdEMyQyxJQUFBQSxFQUFFLENBQUNZLFlBQUgsQ0FBaUI7Z0JBQ1R2RCxJQUFJLENBQUMzQyxJQUFLOztTQURsQjtBQUlBMkMsSUFBQUEsSUFBSSxDQUFDekMsTUFBTCxDQUFZbUUsT0FBWixDQUFxQjJCLE9BQUQsSUFBYTtBQUM3QlYsTUFBQUEsRUFBRSxDQUFDTyxPQUFILENBQVksZ0JBQWVHLE9BQU8sQ0FBQ2hHLElBQUssYUFBeEM7QUFDQXNGLE1BQUFBLEVBQUUsQ0FBQ08sT0FBSCxDQUFZLHVCQUFzQkUsZ0JBQWdCLENBQUNwRCxJQUFELEVBQU9xRCxPQUFQLENBQWdCLElBQWxFO0FBQ0FWLE1BQUFBLEVBQUUsQ0FBQ08sT0FBSCxDQUFZLFdBQVo7QUFDSCxLQUpEO0FBS0FQLElBQUFBLEVBQUUsQ0FBQ1ksWUFBSCxDQUFpQjs7Ozs7U0FBakI7QUFNSDs7QUFFRCxXQUFTMEIsV0FBVCxDQUFxQmpGLElBQXJCLEVBQW1DNEUsT0FBbkMsRUFBeUQ7QUFDckQsUUFBSTVFLElBQUksQ0FBQ3pDLE1BQUwsQ0FBWW9CLE1BQVosS0FBdUIsQ0FBM0IsRUFBOEI7QUFDMUI7QUFDSDs7QUFDRCxRQUFJcUIsSUFBSSxDQUFDMUMsUUFBTCxLQUFrQlAsY0FBYyxDQUFDRyxLQUFyQyxFQUE0QyxDQUN4QztBQUNIOztBQUNEeUgsSUFBQUEsMEJBQTBCLENBQUMzRSxJQUFELEVBQU80RSxPQUFQLENBQTFCO0FBQ0FFLElBQUFBLGlCQUFpQixDQUFDOUUsSUFBRCxDQUFqQjs7QUFDQSxRQUFJQSxJQUFJLENBQUMxQyxRQUFMLEtBQWtCUCxjQUFjLENBQUNHLEtBQXJDLEVBQTRDO0FBQ3hDOEgsTUFBQUEsa0JBQWtCLENBQUNoRixJQUFELENBQWxCO0FBQ0g7QUFHSjtBQUVEOzs7Ozs7Ozs7QUFPQSxXQUFTa0Ysb0JBQVQsQ0FBOEJsRixJQUE5QixFQUE0QztBQUN4QyxVQUFNbUYsVUFBVSxHQUFHbkYsSUFBSSxDQUFDekMsTUFBTCxDQUFZNkgsTUFBWixDQUFtQkMsQ0FBQyxJQUFJLENBQUMsQ0FBQ0EsQ0FBQyxDQUFDakcsSUFBNUIsQ0FBbkI7QUFDQSxVQUFNa0csYUFBYSxHQUFHdEYsSUFBSSxDQUFDekMsTUFBTCxDQUFZNkgsTUFBWixDQUFvQkMsQ0FBRCxJQUFpQkEsQ0FBQyxDQUFDckYsSUFBRixLQUFXdkMsV0FBVyxDQUFDRSxNQUF4QixJQUFvQzBILENBQUMsQ0FBQ3JGLElBQUYsS0FBV3ZDLFdBQVcsQ0FBQ0csUUFBOUYsQ0FBdEI7QUFDQSxVQUFNMkgsVUFBVSxHQUFHdkYsSUFBSSxDQUFDekMsTUFBTCxDQUFZNkgsTUFBWixDQUFtQkMsQ0FBQyxJQUFJQSxDQUFDLENBQUM1RSxPQUExQixDQUFuQjtBQUNBLFVBQU0rRSxzQkFBc0IsR0FBR3hGLElBQUksQ0FBQ3dCLFVBQUwsSUFDeEIyRCxVQUFVLENBQUN4RyxNQUFYLEdBQW9CLENBREksSUFFeEIyRyxhQUFhLENBQUMzRyxNQUFkLEdBQXVCLENBRkMsSUFHeEI0RyxVQUFVLENBQUM1RyxNQUFYLEdBQW9CLENBSDNCOztBQUlBLFFBQUksQ0FBQzZHLHNCQUFMLEVBQTZCO0FBQ3pCO0FBQ0g7O0FBQ0Q3QyxJQUFBQSxFQUFFLENBQUNPLE9BQUgsQ0FBWSxXQUFVbEQsSUFBSSxDQUFDM0MsSUFBSyxLQUFoQzs7QUFDQSxRQUFJMkMsSUFBSSxDQUFDd0IsVUFBVCxFQUFxQjtBQUNqQm1CLE1BQUFBLEVBQUUsQ0FBQ08sT0FBSCxDQUFXLDBCQUFYO0FBQ0FQLE1BQUFBLEVBQUUsQ0FBQ08sT0FBSCxDQUFXLHFDQUFYO0FBQ0FQLE1BQUFBLEVBQUUsQ0FBQ08sT0FBSCxDQUFXLGdCQUFYO0FBQ0g7O0FBQ0RpQyxJQUFBQSxVQUFVLENBQUN6RCxPQUFYLENBQW9CM0IsS0FBRCxJQUFXO0FBQzFCLFlBQU0wRixPQUFPLEdBQUd6RixJQUFJLENBQUN6QyxNQUFMLENBQVltSSxJQUFaLENBQWlCTCxDQUFDLElBQUlBLENBQUMsQ0FBQ2hJLElBQUYsTUFBWTBDLEtBQUssQ0FBQ1gsSUFBTixJQUFjVyxLQUFLLENBQUNYLElBQU4sQ0FBVzJGLEVBQXJDLEtBQTRDLEVBQWxFLENBQWhCOztBQUNBLFVBQUksQ0FBQ1UsT0FBTCxFQUFjO0FBQ1YsY0FBTSwrQkFBTjtBQUNIOztBQUNELFlBQU1qRSxVQUFVLEdBQUd6QixLQUFLLENBQUNDLElBQU4sQ0FBV3dCLFVBQTlCOztBQUNBLFVBQUksQ0FBQ0EsVUFBTCxFQUFpQjtBQUNiLGNBQU0sa0NBQU47QUFDSDs7QUFDRG1CLE1BQUFBLEVBQUUsQ0FBQ08sT0FBSCxDQUFZLGVBQWNuRCxLQUFLLENBQUMxQyxJQUFLLDRCQUFyQzs7QUFDQSxVQUFJMEMsS0FBSyxDQUFDUSxVQUFOLEtBQXFCLENBQXpCLEVBQTRCO0FBQ3hCb0MsUUFBQUEsRUFBRSxDQUFDTyxPQUFILENBQVkscUNBQW9DMUIsVUFBVyxzQkFBcUJpRSxPQUFPLENBQUNwSSxJQUFLLElBQTdGO0FBQ0gsT0FGRCxNQUVPLElBQUkwQyxLQUFLLENBQUNRLFVBQU4sS0FBcUIsQ0FBekIsRUFBNEI7QUFDL0JvQyxRQUFBQSxFQUFFLENBQUNPLE9BQUgsQ0FBWSxxQ0FBb0MxQixVQUFXLHVCQUFzQmlFLE9BQU8sQ0FBQ3BJLElBQUssSUFBOUY7QUFDSCxPQUZNLE1BRUE7QUFDSCxjQUFNLDhDQUFOO0FBQ0g7O0FBQ0RzRixNQUFBQSxFQUFFLENBQUNPLE9BQUgsQ0FBWSxnQkFBWjtBQUNILEtBbEJEO0FBbUJBb0MsSUFBQUEsYUFBYSxDQUFDNUQsT0FBZCxDQUF1QjNCLEtBQUQsSUFBVztBQUM3QixZQUFNNEYsWUFBWSxHQUFHNUYsS0FBSyxDQUFDQyxJQUFOLEtBQWV2QyxXQUFXLENBQUNFLE1BQTNCLEdBQW9DLENBQXBDLEdBQXdDLENBQTdEO0FBQ0FnRixNQUFBQSxFQUFFLENBQUNPLE9BQUgsQ0FBWSxlQUFjbkQsS0FBSyxDQUFDMUMsSUFBSyxZQUFyQztBQUNBc0YsTUFBQUEsRUFBRSxDQUFDTyxPQUFILENBQVkseUNBQXdDeUMsWUFBYSxZQUFXNUYsS0FBSyxDQUFDMUMsSUFBSyxJQUF2RjtBQUNBc0YsTUFBQUEsRUFBRSxDQUFDTyxPQUFILENBQVksZ0JBQVo7QUFDSCxLQUxEO0FBTUFxQyxJQUFBQSxVQUFVLENBQUM3RCxPQUFYLENBQW9CM0IsS0FBRCxJQUFXO0FBQzFCLFlBQU1VLE9BQU8sR0FBR1YsS0FBSyxDQUFDVSxPQUF0Qjs7QUFDQSxVQUFJQSxPQUFKLEVBQWE7QUFDVGtDLFFBQUFBLEVBQUUsQ0FBQ08sT0FBSCxDQUFZLGVBQWNuRCxLQUFLLENBQUMxQyxJQUFLLGtDQUFpQzBDLEtBQUssQ0FBQzFDLElBQUssTUFBS3lCLG1CQUFtQixDQUFDMkIsT0FBTyxDQUFDMUIsTUFBVCxDQUFpQixJQUExSDtBQUNIO0FBQ0osS0FMRDtBQU1BNEQsSUFBQUEsRUFBRSxDQUFDTyxPQUFILENBQVksWUFBWjtBQUNIOztBQUdELFdBQVMwQywwQkFBVCxDQUFvQzVGLElBQXBDLEVBQWtEO0FBQzlDLFFBQUlBLElBQUksQ0FBQzFDLFFBQUwsS0FBa0JQLGNBQWMsQ0FBQ0csS0FBckMsRUFBNEM7QUFDeEN5RixNQUFBQSxFQUFFLENBQUNPLE9BQUgsQ0FBWSxXQUFVbEQsSUFBSSxDQUFDM0MsSUFBSyxLQUFJMkMsSUFBSSxDQUFDM0MsSUFBSyxXQUE5QztBQUNIO0FBQ0o7O0FBRUQsV0FBU3dJLFFBQVQsQ0FBa0IvRCxLQUFsQixFQUFtQztBQUUvQjtBQUVBLEtBQUMsUUFBRCxFQUFXLFNBQVgsRUFBc0IsS0FBdEIsRUFBNkIsT0FBN0IsRUFBc0NKLE9BQXRDLENBQThDNEMsc0JBQTlDO0FBQ0FkLElBQUFBLGNBQWM7QUFDZDFCLElBQUFBLEtBQUssQ0FBQ0osT0FBTixDQUFjMUIsSUFBSSxJQUFJMEQsb0JBQW9CLENBQUMxRCxJQUFELENBQTFDO0FBQ0EsVUFBTThGLGNBQWMsR0FBRyxJQUFJOUQsR0FBSixFQUF2QjtBQUNBRixJQUFBQSxLQUFLLENBQUNKLE9BQU4sQ0FBYzFCLElBQUksSUFBSXVFLFdBQVcsQ0FBQ3ZFLElBQUQsRUFBTzhGLGNBQVAsQ0FBakM7QUFFQSxVQUFNQyxXQUFXLEdBQUdqRSxLQUFLLENBQUNzRCxNQUFOLENBQWFqRCxDQUFDLElBQUksQ0FBQyxDQUFDQSxDQUFDLENBQUNYLFVBQXRCLENBQXBCO0FBQ0FnRCxJQUFBQSxZQUFZLENBQUN1QixXQUFELENBQVo7QUFDQXRCLElBQUFBLGtCQUFrQixDQUFDc0IsV0FBRCxDQUFsQixDQVorQixDQWMvQjs7QUFFQXBELElBQUFBLEVBQUUsQ0FBQ1ksWUFBSCxDQUFpQjs7Ozs7Ozs7Ozs7OztTQUFqQjtBQWNBLFVBQU15QyxjQUFjLEdBQUcsSUFBSWhFLEdBQUosRUFBdkI7QUFDQUYsSUFBQUEsS0FBSyxDQUFDSixPQUFOLENBQWMxQixJQUFJLElBQUlpRixXQUFXLENBQUNqRixJQUFELEVBQU9nRyxjQUFQLENBQWpDO0FBRUFyRCxJQUFBQSxFQUFFLENBQUNZLFlBQUgsQ0FBaUI7OztTQUFqQjtBQUlBekIsSUFBQUEsS0FBSyxDQUFDSixPQUFOLENBQWUxQixJQUFELElBQVU7QUFDcEJrRixNQUFBQSxvQkFBb0IsQ0FBQ2xGLElBQUQsQ0FBcEI7QUFDQTRGLE1BQUFBLDBCQUEwQixDQUFDNUYsSUFBRCxDQUExQjtBQUNILEtBSEQ7QUFJQTJDLElBQUFBLEVBQUUsQ0FBQ08sT0FBSCxDQUFXLGtCQUFYO0FBQ0E2QyxJQUFBQSxXQUFXLENBQUNyRSxPQUFaLENBQXFCMUIsSUFBRCxJQUFVO0FBQzFCMkMsTUFBQUEsRUFBRSxDQUFDTyxPQUFILENBQVksZUFBY2xELElBQUksQ0FBQ3dCLFVBQUwsSUFBbUIsRUFBRyxRQUFPeEIsSUFBSSxDQUFDd0IsVUFBTCxJQUFtQixFQUFHLG1CQUE3RTtBQUNILEtBRkQ7QUFHQW1CLElBQUFBLEVBQUUsQ0FBQ08sT0FBSCxDQUFXLFlBQVg7QUFDQVAsSUFBQUEsRUFBRSxDQUFDTyxPQUFILENBQVcseUJBQVg7QUFDQTZDLElBQUFBLFdBQVcsQ0FBQ3JFLE9BQVosQ0FBcUIxQixJQUFELElBQVU7QUFDMUIyQyxNQUFBQSxFQUFFLENBQUNPLE9BQUgsQ0FBWSxlQUFjbEQsSUFBSSxDQUFDd0IsVUFBTCxJQUFtQixFQUFHLFFBQU94QixJQUFJLENBQUN3QixVQUFMLElBQW1CLEVBQUcsMEJBQTdFO0FBQ0gsS0FGRDtBQUdBbUIsSUFBQUEsRUFBRSxDQUFDWSxZQUFILENBQWlCOzs7OztTQUFqQjtBQU9BWixJQUFBQSxFQUFFLENBQUNZLFlBQUgsQ0FBaUI7OztTQUFqQjtBQUlBekIsSUFBQUEsS0FBSyxDQUFDSixPQUFOLENBQWMxQixJQUFJLElBQUkyQyxFQUFFLENBQUNPLE9BQUgsQ0FBWSxPQUFNbEQsSUFBSSxDQUFDM0MsSUFBSyxHQUE1QixDQUF0QjtBQUNBc0YsSUFBQUEsRUFBRSxDQUFDWSxZQUFILENBQWlCOztTQUFqQjtBQUdIOztBQUVELFFBQU1qRSxNQUFNLEdBQUcsMEJBQWFHLFNBQWIsQ0FBZjs7QUFFQSxNQUFJSCxNQUFNLENBQUMyRyxLQUFYLEVBQWtCO0FBQ2RwRSxJQUFBQSxZQUFZLENBQUN2QyxNQUFNLENBQUMyRyxLQUFQLENBQWFuRSxLQUFkLENBQVo7QUFDQStELElBQUFBLFFBQVEsQ0FBQ25HLE9BQUQsQ0FBUjtBQUNIOztBQUVELE9BQUssTUFBTXdHLENBQVgsSUFBNEJ0RyxTQUFTLENBQUNiLE1BQVYsRUFBNUIsRUFBZ0Q7QUFDNUNrQixJQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBYSxpQkFBZ0JnRyxDQUFDLENBQUM3SSxJQUFLLE1BQXBDO0FBQ0E0QyxJQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWWxCLE1BQU0sQ0FBQ0MsT0FBUCxDQUFlaUgsQ0FBQyxDQUFDbkgsTUFBakIsRUFBeUJHLEdBQXpCLENBQTZCLENBQUMsQ0FBQzdCLElBQUQsRUFBTzhCLEtBQVAsQ0FBRCxLQUFtQjtBQUN4RCxhQUFRLE9BQU05QixJQUFLLEtBQUs4QixLQUFZLEdBQXBDO0FBQ0gsS0FGVyxFQUVUQyxJQUZTLENBRUosSUFGSSxDQUFaO0FBR0FhLElBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFhLE1BQWI7QUFDSDs7QUFFRCxTQUFPO0FBQ0h1QyxJQUFBQSxFQUFFLEVBQUVBLEVBQUUsQ0FBQzBELFNBQUgsRUFERDtBQUVIeEQsSUFBQUEsRUFBRSxFQUFFQSxFQUFFLENBQUN3RCxTQUFIO0FBRkQsR0FBUDtBQUlIOztlQUVjM0csSSIsInNvdXJjZXNDb250ZW50IjpbIi8vQGZsb3dcblxuaW1wb3J0IHsgbWFrZUZpZWxkVHlwZU5hbWUsIFdyaXRlciB9IGZyb20gJ3Rvbi1sYWJzLWRldi1vcHMvZGlzdC9zcmMvZ2VuLmpzJztcbmltcG9ydCB0eXBlIHsgU2NoZW1hRG9jLCBTY2hlbWFNZW1iZXIsIFNjaGVtYVR5cGUsIFR5cGVEZWYgfSBmcm9tICd0b24tbGFicy1kZXYtb3BzL3NyYy9zY2hlbWEuanMnO1xuaW1wb3J0IHsgcGFyc2VUeXBlRGVmIH0gZnJvbSAndG9uLWxhYnMtZGV2LW9wcy9kaXN0L3NyYy9zY2hlbWEuanMnO1xuXG5jb25zdCBEYlR5cGVDYXRlZ29yeSA9IHtcbiAgICB1bnJlc29sdmVkOiAndW5yZXNvbHZlZCcsXG4gICAgc2NhbGFyOiAnc2NhbGFyJyxcbiAgICB1bmlvbjogJ3VuaW9uJyxcbiAgICBzdHJ1Y3Q6ICdzdHJ1Y3QnLFxufTtcblxudHlwZSBEYkpvaW4gPSB7XG4gICAgY29sbGVjdGlvbjogc3RyaW5nLFxuICAgIG9uOiBzdHJpbmcsXG59XG5cbnR5cGUgRGJUeXBlID0ge1xuICAgIG5hbWU6IHN0cmluZyxcbiAgICBmaWVsZHM6IERiRmllbGRbXSxcbiAgICBjYXRlZ29yeTogJ3VucmVzb2x2ZWQnIHwgJ3NjYWxhcicgfCAndW5pb24nIHwgJ3N0cnVjdCcsXG4gICAgY29sbGVjdGlvbj86IHN0cmluZyxcbiAgICBkb2M6IHN0cmluZyxcbn1cblxudHlwZSBJbnRFbnVtRGVmID0ge1xuICAgIG5hbWU6IHN0cmluZyxcbiAgICB2YWx1ZXM6IHtcbiAgICAgICAgW3N0cmluZ106IG51bWJlclxuICAgIH0sXG59XG5cbnR5cGUgRGJGaWVsZCA9IHtcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgdHlwZTogRGJUeXBlLFxuICAgIGFycmF5RGVwdGg6IG51bWJlcixcbiAgICBqb2luPzogRGJKb2luLFxuICAgIGVudW1EZWY/OiBJbnRFbnVtRGVmLFxuICAgIGRvYzogc3RyaW5nLFxufVxuXG5mdW5jdGlvbiBzY2FsYXJUeXBlKG5hbWU6IHN0cmluZyk6IERiVHlwZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgbmFtZSxcbiAgICAgICAgY2F0ZWdvcnk6IERiVHlwZUNhdGVnb3J5LnNjYWxhcixcbiAgICAgICAgZmllbGRzOiBbXSxcbiAgICAgICAgZG9jOiAnJyxcbiAgICB9XG59XG5cbmNvbnN0IHNjYWxhclR5cGVzID0ge1xuICAgIGludDogc2NhbGFyVHlwZSgnSW50JyksXG4gICAgdWludDY0OiBzY2FsYXJUeXBlKCdTdHJpbmcnKSxcbiAgICB1aW50MTAyNDogc2NhbGFyVHlwZSgnU3RyaW5nJyksXG4gICAgZmxvYXQ6IHNjYWxhclR5cGUoJ0Zsb2F0JyksXG4gICAgYm9vbGVhbjogc2NhbGFyVHlwZSgnQm9vbGVhbicpLFxuICAgIHN0cmluZzogc2NhbGFyVHlwZSgnU3RyaW5nJyksXG59O1xuXG5mdW5jdGlvbiB1bnJlc29sdmVkVHlwZShuYW1lOiBzdHJpbmcpOiBEYlR5cGUge1xuICAgIHJldHVybiB7XG4gICAgICAgIG5hbWUsXG4gICAgICAgIGNhdGVnb3J5OiBEYlR5cGVDYXRlZ29yeS51bnJlc29sdmVkLFxuICAgICAgICBmaWVsZHM6IFtdLFxuICAgICAgICBkb2M6ICcnLFxuICAgIH1cbn1cblxuZnVuY3Rpb24gaXNMb3dlckNhc2VkKHM6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGwgPSBzLnRvTG93ZXJDYXNlKCk7XG4gICAgY29uc3QgdSA9IHMudG9VcHBlckNhc2UoKTtcbiAgICByZXR1cm4gKHUgIT09IGwpICYmIChzID09PSBsKTtcbn1cblxuZnVuY3Rpb24gaXNVcHBlckNhc2VkKHM6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGwgPSBzLnRvTG93ZXJDYXNlKCk7XG4gICAgY29uc3QgdSA9IHMudG9VcHBlckNhc2UoKTtcbiAgICByZXR1cm4gKHUgIT09IGwpICYmIChzID09PSB1KTtcbn1cblxuZnVuY3Rpb24gdG9BbGxDYXBzKHM6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgbGV0IHJlc3VsdCA9ICcnO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBpZiAoKGkgPiAwKSAmJiAoc1tpIC0gMV0gIT09ICdfJykgJiYgaXNMb3dlckNhc2VkKHNbaSAtIDFdKSAmJiBpc1VwcGVyQ2FzZWQoc1tpXSkpIHtcbiAgICAgICAgICAgIHJlc3VsdCArPSAnXyc7XG4gICAgICAgIH1cbiAgICAgICAgcmVzdWx0ICs9IHNbaV07XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQudG9VcHBlckNhc2UoKTtcbn1cblxuZnVuY3Rpb24gdG9FbnVtU3R5bGUoczogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYCR7cy5zdWJzdHIoMCwgMSkudG9VcHBlckNhc2UoKX0ke3Muc3Vic3RyKDEpfWA7XG59XG5cbmZ1bmN0aW9uIHN0cmluZ2lmeUVudW1WYWx1ZXModmFsdWVzOiB7IFtzdHJpbmddOiBudW1iZXIgfSk6IHN0cmluZyB7XG4gICAgY29uc3QgZmllbGRzID0gT2JqZWN0LmVudHJpZXModmFsdWVzKS5tYXAoKFtuYW1lLCB2YWx1ZV0pID0+IHtcbiAgICAgICAgcmV0dXJuIGAke3RvRW51bVN0eWxlKG5hbWUpfTogJHsodmFsdWU6IGFueSl9YDtcbiAgICB9KTtcbiAgICByZXR1cm4gYHsgJHtmaWVsZHMuam9pbignLCAnKX0gfWA7XG59XG5cbmZ1bmN0aW9uIGdldERvY01EKHNjaGVtYTogU2NoZW1hRG9jKTogc3RyaW5nIHtcbiAgICBjb25zdCBkb2MgPSBzY2hlbWEuZG9jO1xuICAgIGlmICghZG9jKSB7XG4gICAgICAgIHJldHVybiAnJztcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBkb2MgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHJldHVybiBkb2M7XG4gICAgfVxuICAgIGlmIChkb2MubWQpIHtcbiAgICAgICAgcmV0dXJuIChkb2MubWQ6IGFueSk7XG4gICAgfVxuICAgIHJldHVybiAnJztcbn1cblxuZnVuY3Rpb24gbWFpbihzY2hlbWFEZWY6IFR5cGVEZWYpIHtcblxuICAgIGxldCBkYlR5cGVzOiBEYlR5cGVbXSA9IFtdO1xuICAgIGxldCBsYXN0UmVwb3J0ZWRUeXBlOiBzdHJpbmcgPSAnJztcbiAgICBsZXQgZW51bVR5cGVzOiBNYXA8c3RyaW5nLCBJbnRFbnVtRGVmPiA9IG5ldyBNYXAoKTtcblxuICAgIGZ1bmN0aW9uIHJlcG9ydFR5cGUobmFtZTogc3RyaW5nLCBmaWVsZDogc3RyaW5nLCB0eXBlOiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKG5hbWUgIT09IGxhc3RSZXBvcnRlZFR5cGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKG5hbWUpO1xuICAgICAgICAgICAgbGFzdFJlcG9ydGVkVHlwZSA9IG5hbWU7XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5sb2coYCAgICAke2ZpZWxkfTogJHt0eXBlfWApO1xuXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VEYkZpZWxkKFxuICAgICAgICB0eXBlTmFtZTogc3RyaW5nLFxuICAgICAgICBzY2hlbWFGaWVsZDogU2NoZW1hTWVtYmVyPFNjaGVtYVR5cGU+LFxuICAgICk6IERiRmllbGQge1xuICAgICAgICBsZXQgc2NoZW1hVHlwZSA9IHNjaGVtYUZpZWxkO1xuICAgICAgICBjb25zdCBmaWVsZDogRGJGaWVsZCA9IHtcbiAgICAgICAgICAgIG5hbWU6IHNjaGVtYUZpZWxkLm5hbWUsXG4gICAgICAgICAgICBhcnJheURlcHRoOiAwLFxuICAgICAgICAgICAgdHlwZTogc2NhbGFyVHlwZXMuc3RyaW5nLFxuICAgICAgICAgICAgZG9jOiBnZXREb2NNRChzY2hlbWFGaWVsZCksXG4gICAgICAgIH07XG4gICAgICAgIHdoaWxlIChzY2hlbWFUeXBlLmFycmF5KSB7XG4gICAgICAgICAgICBmaWVsZC5hcnJheURlcHRoICs9IDE7XG4gICAgICAgICAgICBzY2hlbWFUeXBlID0gc2NoZW1hVHlwZS5hcnJheTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBlbnVtRGVmOiA/SW50RW51bURlZiA9IChzY2hlbWFUeXBlLl8gJiYgc2NoZW1hVHlwZS5fLmVudW0pIHx8IG51bGw7XG4gICAgICAgIGlmIChlbnVtRGVmKSB7XG4gICAgICAgICAgICBmaWVsZC5lbnVtRGVmID0gZW51bURlZjtcbiAgICAgICAgICAgIGVudW1UeXBlcy5zZXQoZW51bURlZi5uYW1lLCBlbnVtRGVmKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBqb2luID0gKHNjaGVtYVR5cGU6IGFueSkuXy5qb2luO1xuICAgICAgICBpZiAoam9pbikge1xuICAgICAgICAgICAgZmllbGQuam9pbiA9IGpvaW47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNjaGVtYVR5cGUudW5pb24gfHwgc2NoZW1hVHlwZS5zdHJ1Y3QpIHtcbiAgICAgICAgICAgIGZpZWxkLnR5cGUgPSB1bnJlc29sdmVkVHlwZShtYWtlRmllbGRUeXBlTmFtZSh0eXBlTmFtZSwgc2NoZW1hRmllbGQubmFtZSkpO1xuICAgICAgICB9IGVsc2UgaWYgKHNjaGVtYVR5cGUucmVmKSB7XG4gICAgICAgICAgICBmaWVsZC50eXBlID0gdW5yZXNvbHZlZFR5cGUoc2NoZW1hVHlwZS5yZWYubmFtZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoc2NoZW1hVHlwZS5ib29sKSB7XG4gICAgICAgICAgICBmaWVsZC50eXBlID0gc2NhbGFyVHlwZXMuYm9vbGVhbjtcbiAgICAgICAgfSBlbHNlIGlmIChzY2hlbWFUeXBlLmludCkge1xuICAgICAgICAgICAgY29uc3QgdW5zaWduZWQ6IGJvb2xlYW4gPSAoc2NoZW1hVHlwZS5pbnQgJiYgc2NoZW1hVHlwZS5pbnQudW5zaWduZWQpIHx8IGZhbHNlO1xuICAgICAgICAgICAgY29uc3Qgc2l6ZTogbnVtYmVyID0gKHNjaGVtYVR5cGUuaW50ICYmIHNjaGVtYVR5cGUuaW50LnNpemUpIHx8IDMyO1xuICAgICAgICAgICAgaWYgKHVuc2lnbmVkKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNpemUgPj0gMTI4KSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcG9ydFR5cGUodHlwZU5hbWUsIGZpZWxkLm5hbWUsICd1MTAyNCcpO1xuICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlID0gc2NhbGFyVHlwZXMudWludDEwMjQ7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzaXplID49IDY0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcG9ydFR5cGUodHlwZU5hbWUsIGZpZWxkLm5hbWUsICd1NjQnKTtcbiAgICAgICAgICAgICAgICAgICAgZmllbGQudHlwZSA9IHNjYWxhclR5cGVzLnVpbnQ2NDtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHNpemUgPj0gMzIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVwb3J0VHlwZSh0eXBlTmFtZSwgZmllbGQubmFtZSwgJ3UzMicpO1xuICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlID0gc2NhbGFyVHlwZXMuZmxvYXQ7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVwb3J0VHlwZSh0eXBlTmFtZSwgZmllbGQubmFtZSwgYHUke3NpemV9YCk7XG4gICAgICAgICAgICAgICAgICAgIGZpZWxkLnR5cGUgPSBzY2FsYXJUeXBlcy5pbnQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoc2l6ZSA+IDMyKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSW50ZWdlciB0eXBlIHdpdGggc2l6ZSAke3NpemV9IGJpdCBkb2VzIG5vdCBzdXBwb3J0ZWRgKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXBvcnRUeXBlKHR5cGVOYW1lLCBmaWVsZC5uYW1lLCAnaTMyJyk7XG4gICAgICAgICAgICAgICAgICAgIGZpZWxkLnR5cGUgPSBzY2FsYXJUeXBlcy5pbnQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHNjaGVtYVR5cGUuZmxvYXQpIHtcbiAgICAgICAgICAgIHJlcG9ydFR5cGUodHlwZU5hbWUsIGZpZWxkLm5hbWUsICdmbG9hdCcpO1xuICAgICAgICAgICAgZmllbGQudHlwZSA9IHNjYWxhclR5cGVzLmZsb2F0O1xuICAgICAgICB9IGVsc2UgaWYgKHNjaGVtYVR5cGUuc3RyaW5nKSB7XG4gICAgICAgICAgICBmaWVsZC50eXBlID0gc2NhbGFyVHlwZXMuc3RyaW5nO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZmllbGQudHlwZSA9IHNjYWxhclR5cGVzLnN0cmluZztcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdJbnZhbGlkIGZpZWxkIHR5cGU6ICcsIEpTT04uc3RyaW5naWZ5KHNjaGVtYVR5cGUpKTtcbiAgICAgICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmllbGQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdW53cmFwQXJyYXlzKHR5cGU6IFNjaGVtYVR5cGUpOiBTY2hlbWFUeXBlIHtcbiAgICAgICAgaWYgKHR5cGUuYXJyYXkpIHtcbiAgICAgICAgICAgIHJldHVybiB1bndyYXBBcnJheXModHlwZS5hcnJheSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHR5cGU7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VEYlR5cGUoXG4gICAgICAgIG5hbWU6IHN0cmluZyxcbiAgICAgICAgc2NoZW1hVHlwZTogU2NoZW1hVHlwZVxuICAgICkge1xuICAgICAgICBjb25zdCBzdHJ1Y3QgPSBzY2hlbWFUeXBlLnVuaW9uIHx8IHNjaGVtYVR5cGUuc3RydWN0O1xuICAgICAgICBpZiAoIXN0cnVjdCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYD8/ICR7bmFtZX06ICR7SlNPTi5zdHJpbmdpZnkoc2NoZW1hVHlwZSkuc3Vic3RyKDAsIDIwMCl9YCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdHlwZTogRGJUeXBlID0ge1xuICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgIGNhdGVnb3J5OiBzY2hlbWFUeXBlLnVuaW9uID8gRGJUeXBlQ2F0ZWdvcnkudW5pb24gOiBEYlR5cGVDYXRlZ29yeS5zdHJ1Y3QsXG4gICAgICAgICAgICBmaWVsZHM6IFtdLFxuICAgICAgICAgICAgY29sbGVjdGlvbjogKHNjaGVtYVR5cGU6IGFueSkuXy5jb2xsZWN0aW9uLFxuICAgICAgICAgICAgZG9jOiBnZXREb2NNRChzY2hlbWFUeXBlKSxcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAodHlwZS5jb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICB0eXBlLmZpZWxkcy5wdXNoKHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnaWQnLFxuICAgICAgICAgICAgICAgIGFycmF5RGVwdGg6IDAsXG4gICAgICAgICAgICAgICAgdHlwZTogc2NhbGFyVHlwZXMuc3RyaW5nLFxuICAgICAgICAgICAgICAgIGRvYzogJycsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBzdHJ1Y3QuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIHR5cGUuZmllbGRzLnB1c2gocGFyc2VEYkZpZWxkKG5hbWUsIGZpZWxkKSk7XG4gICAgICAgICAgICBjb25zdCB1bndyYXBwZWQgPSB1bndyYXBBcnJheXMoZmllbGQpO1xuICAgICAgICAgICAgY29uc3Qgb3duVHlwZSA9ICh1bndyYXBwZWQuc3RydWN0IHx8IHVud3JhcHBlZC51bmlvbikgPyB1bndyYXBwZWQgOiBudWxsO1xuICAgICAgICAgICAgaWYgKG93blR5cGUpIHtcbiAgICAgICAgICAgICAgICBwYXJzZURiVHlwZShtYWtlRmllbGRUeXBlTmFtZShuYW1lLCBmaWVsZC5uYW1lKSwgb3duVHlwZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBkYlR5cGVzLnB1c2godHlwZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VEYlR5cGVzKHR5cGVzOiBTY2hlbWFNZW1iZXI8U2NoZW1hVHlwZT5bXSkge1xuICAgICAgICB0eXBlcy5mb3JFYWNoKCh0eXBlOiBTY2hlbWFNZW1iZXI8U2NoZW1hVHlwZT4pID0+IHtcbiAgICAgICAgICAgIHBhcnNlRGJUeXBlKHR5cGUubmFtZSwgdHlwZSk7XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCB1bnJlc29sdmVkOiBNYXA8c3RyaW5nLCBEYlR5cGU+ID0gbmV3IE1hcDxzdHJpbmcsIERiVHlwZT4oKTtcbiAgICAgICAgY29uc3QgcmVzb2x2aW5nOiBTZXQ8c3RyaW5nPiA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgICAgICBjb25zdCByZXNvbHZlZDogTWFwPHN0cmluZywgRGJUeXBlPiA9IG5ldyBNYXA8c3RyaW5nLCBEYlR5cGU+KCk7XG4gICAgICAgIGNvbnN0IG9yZGVyZWRSZXNvbHZlZDogRGJUeXBlW10gPSBbXTtcbiAgICAgICAgZGJUeXBlcy5mb3JFYWNoKHQgPT4gdW5yZXNvbHZlZC5zZXQodC5uYW1lLCB0KSk7XG4gICAgICAgIGNvbnN0IHJlc29sdmVUeXBlID0gKHR5cGU6IERiVHlwZSkgPT4ge1xuICAgICAgICAgICAgaWYgKHJlc29sdmVkLmhhcyh0eXBlLm5hbWUpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHJlc29sdmluZy5oYXModHlwZS5uYW1lKSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBDaXJjdWxhciByZWZlcmVuY2UgdG8gdHlwZSAke3R5cGUubmFtZX1gKTtcbiAgICAgICAgICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXNvbHZpbmcuYWRkKHR5cGUubmFtZSk7XG4gICAgICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChmaWVsZC50eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS51bnJlc29sdmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCB0eXBlID0gcmVzb2x2ZWQuZ2V0KGZpZWxkLnR5cGUubmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghdHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSA9IHVucmVzb2x2ZWQuZ2V0KGZpZWxkLnR5cGUubmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmVUeXBlKHR5cGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgUmVmZXJlbmNlZCB0eXBlIG5vdCBmb3VuZDogJHtmaWVsZC50eXBlLm5hbWV9YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlID0gdHlwZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmVzb2x2aW5nLmRlbGV0ZSh0eXBlLm5hbWUpO1xuICAgICAgICAgICAgb3JkZXJlZFJlc29sdmVkLnB1c2godHlwZSk7XG4gICAgICAgICAgICB1bnJlc29sdmVkLmRlbGV0ZSh0eXBlLm5hbWUpO1xuICAgICAgICAgICAgcmVzb2x2ZWQuc2V0KHR5cGUubmFtZSwgdHlwZSk7XG4gICAgICAgIH07XG4gICAgICAgIGRiVHlwZXMuZm9yRWFjaChyZXNvbHZlVHlwZSk7XG4gICAgICAgIGRiVHlwZXMgPSBvcmRlcmVkUmVzb2x2ZWQ7XG4gICAgfVxuXG4vLyBHZW5lcmF0b3JzXG5cbiAgICBjb25zdCBxbCA9IG5ldyBXcml0ZXIoKTtcbiAgICBjb25zdCBqcyA9IG5ldyBXcml0ZXIoKTtcblxuICAgIGZ1bmN0aW9uIGdlblFMRG9jKHByZWZpeDogc3RyaW5nLCBkb2M6IHN0cmluZykge1xuICAgICAgICBpZiAoZG9jLnRyaW0oKSA9PT0gJycpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBsaW5lcyA9IGRvYy5zcGxpdCgvXFxuXFxyP3xcXHJcXG4/Lyk7XG4gICAgICAgIGlmIChsaW5lcy5sZW5ndGggPT09IDEgJiYgIWxpbmVzWzBdLmluY2x1ZGVzKCdcIicpKSB7XG4gICAgICAgICAgICBxbC53cml0ZUxuKHByZWZpeCwgJ1wiJywgbGluZXNbMF0sICdcIicpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcWwud3JpdGVMbihwcmVmaXgsICdcIlwiXCInKTtcbiAgICAgICAgICAgIGxpbmVzLmZvckVhY2goKGxpbmUpID0+IHtcbiAgICAgICAgICAgICAgICBxbC53cml0ZUxuKHByZWZpeCwgbGluZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHFsLndyaXRlTG4ocHJlZml4LCAnXCJcIlwiJyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiB1bmlvblZhcmlhbnRUeXBlKHR5cGU6IERiVHlwZSwgdmFyaWFudDogRGJGaWVsZCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiBgJHt0eXBlLm5hbWV9JHt2YXJpYW50Lm5hbWV9VmFyaWFudGA7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuUUxUeXBlRGVjbGFyYXRpb25zRm9yVW5pb25WYXJpYW50cyh0eXBlOiBEYlR5cGUpIHtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgodmFyaWFudCkgPT4ge1xuICAgICAgICAgICAgcWwud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgdHlwZSAke3VuaW9uVmFyaWFudFR5cGUodHlwZSwgdmFyaWFudCl9IHtcbiAgICAgICAgICAgICR7dmFyaWFudC5uYW1lfTogJHt2YXJpYW50LnR5cGUubmFtZX1cbiAgICAgICAgfVxuXG4gICAgICAgIGApO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5RTEVudW1UeXBlcygpIHtcbiAgICAgICAgZm9yIChjb25zdCBlbnVtRGVmOiBJbnRFbnVtRGVmIG9mIGVudW1UeXBlcy52YWx1ZXMoKSkge1xuICAgICAgICAgICAgcWwud3JpdGVMbihgZW51bSAke2VudW1EZWYubmFtZX1FbnVtIHtgKTtcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKGVudW1EZWYudmFsdWVzKS5mb3JFYWNoKChuYW1lKSA9PiB7XG4gICAgICAgICAgICAgICAgcWwud3JpdGVMbihgICAgICR7dG9FbnVtU3R5bGUobmFtZSl9YCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oYH1gKTtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlblFMVHlwZURlY2xhcmF0aW9uKHR5cGU6IERiVHlwZSkge1xuICAgICAgICBpZiAodHlwZS5jYXRlZ29yeSA9PT0gRGJUeXBlQ2F0ZWdvcnkudW5pb24pIHtcbiAgICAgICAgICAgIGdlblFMVHlwZURlY2xhcmF0aW9uc0ZvclVuaW9uVmFyaWFudHModHlwZSk7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGB1bmlvbiAke3R5cGUubmFtZX0gPSBgKTtcbiAgICAgICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2godmFyaWFudCA9PiB7XG4gICAgICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0fCAke3VuaW9uVmFyaWFudFR5cGUodHlwZSwgdmFyaWFudCl9YCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGdlblFMRG9jKCcnLCB0eXBlLmRvYyk7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGB0eXBlICR7dHlwZS5uYW1lfSB7YCk7XG4gICAgICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKGZpZWxkID0+IHtcbiAgICAgICAgICAgICAgICBnZW5RTERvYygnXFx0JywgZmllbGQuZG9jKTtcbiAgICAgICAgICAgICAgICBjb25zdCB0eXBlRGVjbGFyYXRpb24gPVxuICAgICAgICAgICAgICAgICAgICAnWycucmVwZWF0KGZpZWxkLmFycmF5RGVwdGgpICtcbiAgICAgICAgICAgICAgICAgICAgZmllbGQudHlwZS5uYW1lICtcbiAgICAgICAgICAgICAgICAgICAgJ10nLnJlcGVhdChmaWVsZC5hcnJheURlcHRoKTtcbiAgICAgICAgICAgICAgICBxbC53cml0ZUxuKGBcXHQke2ZpZWxkLm5hbWV9OiAke3R5cGVEZWNsYXJhdGlvbn1gKTtcbiAgICAgICAgICAgICAgICBjb25zdCBlbnVtRGVmID0gZmllbGQuZW51bURlZjtcbiAgICAgICAgICAgICAgICBpZiAoZW51bURlZikge1xuICAgICAgICAgICAgICAgICAgICBxbC53cml0ZUxuKGBcXHQke2ZpZWxkLm5hbWV9X25hbWU6ICR7ZW51bURlZi5uYW1lfUVudW1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oYH1gKTtcbiAgICAgICAgfVxuICAgICAgICBxbC53cml0ZUxuKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcHJldmVudFR3aWNlKG5hbWU6IHN0cmluZywgbmFtZXM6IFNldDxzdHJpbmc+LCB3b3JrOiAoKSA9PiB2b2lkKSB7XG4gICAgICAgIGlmICghbmFtZXMuaGFzKG5hbWUpKSB7XG4gICAgICAgICAgICBuYW1lcy5hZGQobmFtZSk7XG4gICAgICAgICAgICB3b3JrKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5RTEZpbHRlcnNGb3JBcnJheUZpZWxkcyh0eXBlOiBEYlR5cGUsIHFsTmFtZXM6IFNldDxzdHJpbmc+KSB7XG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBsZXQgaXRlbVR5cGVOYW1lID0gZmllbGQudHlwZS5uYW1lO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmaWVsZC5hcnJheURlcHRoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWx0ZXJOYW1lID0gYCR7aXRlbVR5cGVOYW1lfUFycmF5RmlsdGVyYDtcbiAgICAgICAgICAgICAgICBwcmV2ZW50VHdpY2UoZmlsdGVyTmFtZSwgcWxOYW1lcywgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBxbC53cml0ZUxuKGBpbnB1dCAke2ZpbHRlck5hbWV9IHtgKTtcbiAgICAgICAgICAgICAgICAgICAgWydhbnknLCAnYWxsJ10uZm9yRWFjaCgob3ApID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHFsLndyaXRlTG4oYFxcdCR7b3B9OiAke2l0ZW1UeXBlTmFtZX1GaWx0ZXJgKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHFsLndyaXRlTG4oJ30nKTtcbiAgICAgICAgICAgICAgICAgICAgcWwud3JpdGVMbigpO1xuXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaXRlbVR5cGVOYW1lICs9ICdBcnJheSc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlblFMRmlsdGVyc0ZvckVudW1OYW1lRmllbGRzKHR5cGU6IERiVHlwZSwgcWxOYW1lczogU2V0PHN0cmluZz4pIHtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGVudW1EZWYgPSBmaWVsZC5lbnVtRGVmO1xuICAgICAgICAgICAgaWYgKGVudW1EZWYpIHtcbiAgICAgICAgICAgICAgICBwcmV2ZW50VHdpY2UoYCR7ZW51bURlZi5uYW1lfUVudW1GaWx0ZXJgLCBxbE5hbWVzLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGdlblFMU2NhbGFyVHlwZXNGaWx0ZXIoYCR7ZW51bURlZi5uYW1lfUVudW1gKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuUUxGaWx0ZXIodHlwZTogRGJUeXBlLCBxbE5hbWVzOiBTZXQ8c3RyaW5nPikge1xuICAgICAgICBpZiAodHlwZS5maWVsZHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgZ2VuUUxGaWx0ZXJzRm9yQXJyYXlGaWVsZHModHlwZSwgcWxOYW1lcyk7XG4gICAgICAgIGdlblFMRmlsdGVyc0ZvckVudW1OYW1lRmllbGRzKHR5cGUsIHFsTmFtZXMpO1xuICAgICAgICBnZW5RTERvYygnJywgdHlwZS5kb2MpO1xuICAgICAgICBxbC53cml0ZUxuKGBpbnB1dCAke3R5cGUubmFtZX1GaWx0ZXIge2ApO1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgZ2VuUUxEb2MoJ1xcdCcsIGZpZWxkLmRvYyk7XG4gICAgICAgICAgICBjb25zdCB0eXBlRGVjbGFyYXRpb24gPSBmaWVsZC50eXBlLm5hbWUgKyBcIkFycmF5XCIucmVwZWF0KGZpZWxkLmFycmF5RGVwdGgpO1xuICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0JHtmaWVsZC5uYW1lfTogJHt0eXBlRGVjbGFyYXRpb259RmlsdGVyYCk7XG4gICAgICAgICAgICBjb25zdCBlbnVtRGVmID0gZmllbGQuZW51bURlZjtcbiAgICAgICAgICAgIGlmIChlbnVtRGVmKSB7XG4gICAgICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0JHtmaWVsZC5uYW1lfV9uYW1lOiAke2VudW1EZWYubmFtZX1FbnVtRmlsdGVyYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBxbC53cml0ZUxuKGB9YCk7XG4gICAgICAgIHFsLndyaXRlTG4oKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5RTFNjYWxhclR5cGVzRmlsdGVyKG5hbWU6IHN0cmluZykge1xuICAgICAgICBxbC53cml0ZUxuKGBpbnB1dCAke25hbWV9RmlsdGVyIHtgKTtcbiAgICAgICAgWydlcScsICduZScsICdndCcsICdsdCcsICdnZScsICdsZSddLmZvckVhY2goKG9wKSA9PiB7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGBcXHQke29wfTogJHtuYW1lfWApO1xuICAgICAgICB9KTtcbiAgICAgICAgWydpbicsICdub3RJbiddLmZvckVhY2goKG9wKSA9PiB7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGBcXHQke29wfTogWyR7bmFtZX1dYCk7XG4gICAgICAgIH0pO1xuICAgICAgICBxbC53cml0ZUxuKCd9Jyk7XG4gICAgICAgIHFsLndyaXRlTG4oKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5RTFF1ZXJpZXModHlwZXM6IERiVHlwZVtdKSB7XG4gICAgICAgIHFsLndyaXRlQmxvY2tMbihgXG4gICAgICAgIFwiU3BlY2lmeSBzb3J0IG9yZGVyIGRpcmVjdGlvblwiXG4gICAgICAgIGVudW0gUXVlcnlPcmRlckJ5RGlyZWN0aW9uIHtcbiAgICAgICAgICAgIFwiRG9jdW1lbnRzIHdpbGwgYmUgc29ydGVkIGluIGFzY2VuZGVkIG9yZGVyIChlLmcuIGZyb20gQSB0byBaKVwiXG4gICAgICAgICAgICBBU0NcbiAgICAgICAgICAgIFwiRG9jdW1lbnRzIHdpbGwgYmUgc29ydGVkIGluIGRlc2NlbmRhbnQgb3JkZXIgKGUuZy4gZnJvbSBaIHRvIEEpXCJcbiAgICAgICAgICAgIERFU0NcbiAgICAgICAgfVxuXG4gICAgICAgIFxuICAgICAgICBcIlwiXCJcbiAgICAgICAgU3BlY2lmeSBob3cgdG8gc29ydCByZXN1bHRzLlxuICAgICAgICBZb3UgY2FuIHNvcnQgZG9jdW1lbnRzIGluIHJlc3VsdCBzZXQgdXNpbmcgbW9yZSB0aGFuIG9uZSBmaWVsZC5cbiAgICAgICAgXCJcIlwiXG4gICAgICAgIGlucHV0IFF1ZXJ5T3JkZXJCeSB7XG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICAgIFBhdGggdG8gZmllbGQgd2hpY2ggbXVzdCBiZSB1c2VkIGFzIGEgc29ydCBjcml0ZXJpYS5cbiAgICAgICAgICAgIElmIGZpZWxkIHJlc2lkZXMgZGVlcCBpbiBzdHJ1Y3R1cmUgcGF0aCBpdGVtcyBtdXN0IGJlIHNlcGFyYXRlZCB3aXRoIGRvdCAoZS5nLiAnZm9vLmJhci5iYXonKS5cbiAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgICAgcGF0aDogU3RyaW5nXG4gICAgICAgICAgICBcIlNvcnQgb3JkZXIgZGlyZWN0aW9uXCJcbiAgICAgICAgICAgIGRpcmVjdGlvbjogUXVlcnlPcmRlckJ5RGlyZWN0aW9uXG4gICAgICAgIH1cblxuICAgICAgICB0eXBlIFF1ZXJ5IHtcbiAgICAgICAgYCk7XG5cbiAgICAgICAgdHlwZXMuZm9yRWFjaCgodHlwZTogRGJUeXBlKSA9PiB7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGBcXHQke3R5cGUuY29sbGVjdGlvbiB8fCAnJ30oZmlsdGVyOiAke3R5cGUubmFtZX1GaWx0ZXIsIG9yZGVyQnk6IFtRdWVyeU9yZGVyQnldLCBsaW1pdDogSW50LCB0aW1lb3V0OiBGbG9hdCwgYWNjZXNzS2V5OiBTdHJpbmcpOiBbJHt0eXBlLm5hbWV9XWApO1xuICAgICAgICB9KTtcblxuICAgICAgICBxbC53cml0ZUJsb2NrTG4oYFxuICAgICAgICB9XG5cbiAgICAgICAgYCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuUUxTdWJzY3JpcHRpb25zKHR5cGVzOiBEYlR5cGVbXSkge1xuICAgICAgICBxbC53cml0ZUxuKCd0eXBlIFN1YnNjcmlwdGlvbiB7Jyk7XG4gICAgICAgIHR5cGVzLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oYFxcdCR7dHlwZS5jb2xsZWN0aW9uIHx8ICcnfShmaWx0ZXI6ICR7dHlwZS5uYW1lfUZpbHRlciwgYXV0aDogU3RyaW5nKTogJHt0eXBlLm5hbWV9YCk7XG4gICAgICAgIH0pO1xuICAgICAgICBxbC53cml0ZUxuKCd9Jyk7XG4gICAgfVxuXG5cbiAgICBmdW5jdGlvbiBnZXRTY2FsYXJSZXNvbHZlck5hbWUoZmllbGQ6IERiRmllbGQpOiBzdHJpbmcge1xuICAgICAgICBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDY0KSB7XG4gICAgICAgICAgICByZXR1cm4gJ2JpZ1VJbnQxJztcbiAgICAgICAgfVxuICAgICAgICBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDEwMjQpIHtcbiAgICAgICAgICAgIHJldHVybiAnYmlnVUludDInO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnc2NhbGFyJztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5KU0ZpbHRlcnNGb3JBcnJheUZpZWxkcyh0eXBlOiBEYlR5cGUsIGpzTmFtZXM6IFNldDxzdHJpbmc+KSB7XG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBsZXQgaXRlbVR5cGVOYW1lID0gZmllbGQudHlwZS5uYW1lO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmaWVsZC5hcnJheURlcHRoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWx0ZXJOYW1lID0gYCR7aXRlbVR5cGVOYW1lfUFycmF5YDtcbiAgICAgICAgICAgICAgICBwcmV2ZW50VHdpY2UoZmlsdGVyTmFtZSwganNOYW1lcywgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpdGVtUmVzb2x2ZXJOYW1lID0gKGkgPT09IDAgJiYgZmllbGQudHlwZS5jYXRlZ29yeSA9PT0gRGJUeXBlQ2F0ZWdvcnkuc2NhbGFyKVxuICAgICAgICAgICAgICAgICAgICAgICAgPyBnZXRTY2FsYXJSZXNvbHZlck5hbWUoZmllbGQpXG4gICAgICAgICAgICAgICAgICAgICAgICA6IGl0ZW1UeXBlTmFtZTtcbiAgICAgICAgICAgICAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgICAgICAgICBjb25zdCAke2ZpbHRlck5hbWV9ID0gYXJyYXkoJHtpdGVtUmVzb2x2ZXJOYW1lfSk7XG4gICAgICAgICAgICAgICAgYCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaXRlbVR5cGVOYW1lICs9ICdBcnJheSc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkpTU3RydWN0RmlsdGVyKHR5cGU6IERiVHlwZSkge1xuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBjb25zdCAke3R5cGUubmFtZX0gPSBzdHJ1Y3Qoe1xuICAgIGApO1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgbGV0IHR5cGVEZWNsYXJhdGlvbjogP3N0cmluZyA9IG51bGw7XG4gICAgICAgICAgICBjb25zdCBqb2luID0gZmllbGQuam9pbjtcbiAgICAgICAgICAgIGlmIChqb2luKSB7XG4gICAgICAgICAgICAgICAgdHlwZURlY2xhcmF0aW9uID0gYGpvaW4ke2ZpZWxkLmFycmF5RGVwdGggPiAwID8gJ0FycmF5JyA6ICcnfSgnJHtqb2luLm9ufScsICcke2ZpZWxkLnR5cGUuY29sbGVjdGlvbiB8fCAnJ30nLCAke2ZpZWxkLnR5cGUubmFtZX0pYDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQuYXJyYXlEZXB0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB0eXBlRGVjbGFyYXRpb24gPVxuICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlLm5hbWUgK1xuICAgICAgICAgICAgICAgICAgICAnQXJyYXknLnJlcGVhdChmaWVsZC5hcnJheURlcHRoKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZS5jYXRlZ29yeSA9PT0gRGJUeXBlQ2F0ZWdvcnkuc2NhbGFyKSB7XG4gICAgICAgICAgICAgICAgdHlwZURlY2xhcmF0aW9uID0gZ2V0U2NhbGFyUmVzb2x2ZXJOYW1lKGZpZWxkKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZS5maWVsZHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHR5cGVEZWNsYXJhdGlvbiA9IGZpZWxkLnR5cGUubmFtZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0eXBlRGVjbGFyYXRpb24pIHtcbiAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgJHtmaWVsZC5uYW1lfTogJHt0eXBlRGVjbGFyYXRpb259LGApO1xuICAgICAgICAgICAgICAgIGNvbnN0IGVudW1EZWYgPSBmaWVsZC5lbnVtRGVmO1xuICAgICAgICAgICAgICAgIGlmIChlbnVtRGVmKSB7XG4gICAgICAgICAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAke2ZpZWxkLm5hbWV9X25hbWU6IGVudW1OYW1lKCcke2ZpZWxkLm5hbWV9JywgJHtzdHJpbmdpZnlFbnVtVmFsdWVzKGVudW1EZWYudmFsdWVzKX0pLGApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIH0ke3R5cGUuY29sbGVjdGlvbiA/ICcsIHRydWUnIDogJyd9KTtcblxuICAgIGApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkpTVW5pb25SZXNvbHZlcih0eXBlOiBEYlR5cGUpIHtcbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgY29uc3QgJHt0eXBlLm5hbWV9UmVzb2x2ZXIgPSB7XG4gICAgICAgICAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xuICAgICAgICBgKTtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgodmFyaWFudCkgPT4ge1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICBpZiAoJyR7dmFyaWFudC5uYW1lfScgaW4gb2JqKSB7YCk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICByZXR1cm4gJyR7dW5pb25WYXJpYW50VHlwZSh0eXBlLCB2YXJpYW50KX0nO2ApO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICB9YCk7XG4gICAgICAgIH0pO1xuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkpTRmlsdGVyKHR5cGU6IERiVHlwZSwganNOYW1lczogU2V0PHN0cmluZz4pIHtcbiAgICAgICAgaWYgKHR5cGUuZmllbGRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS51bmlvbikge1xuICAgICAgICAgICAgLy8gZ2VuSlNGaWx0ZXJzRm9yVW5pb25WYXJpYW50cyh0eXBlLCBqc05hbWVzKTtcbiAgICAgICAgfVxuICAgICAgICBnZW5KU0ZpbHRlcnNGb3JBcnJheUZpZWxkcyh0eXBlLCBqc05hbWVzKTtcbiAgICAgICAgZ2VuSlNTdHJ1Y3RGaWx0ZXIodHlwZSk7XG4gICAgICAgIGlmICh0eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS51bmlvbikge1xuICAgICAgICAgICAgZ2VuSlNVbmlvblJlc29sdmVyKHR5cGUpO1xuICAgICAgICB9XG5cblxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlIGN1c3RvbSByZXNvbHZlcnMgZm9yIHR5cGVzIHdpdGg6XG4gICAgICogLSBpZCBmaWVsZFxuICAgICAqIC0gam9pbiBmaWVsZHNcbiAgICAgKiAtIHU2NCBhbmQgaGlnaGVyIGZpZWxkc1xuICAgICAqIEBwYXJhbSB0eXBlXG4gICAgICovXG4gICAgZnVuY3Rpb24gZ2VuSlNDdXN0b21SZXNvbHZlcnModHlwZTogRGJUeXBlKSB7XG4gICAgICAgIGNvbnN0IGpvaW5GaWVsZHMgPSB0eXBlLmZpZWxkcy5maWx0ZXIoeCA9PiAhIXguam9pbik7XG4gICAgICAgIGNvbnN0IGJpZ1VJbnRGaWVsZHMgPSB0eXBlLmZpZWxkcy5maWx0ZXIoKHg6IERiRmllbGQpID0+ICh4LnR5cGUgPT09IHNjYWxhclR5cGVzLnVpbnQ2NCkgfHwgKHgudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDEwMjQpKTtcbiAgICAgICAgY29uc3QgZW51bUZpZWxkcyA9IHR5cGUuZmllbGRzLmZpbHRlcih4ID0+IHguZW51bURlZik7XG4gICAgICAgIGNvbnN0IGN1c3RvbVJlc29sdmVyUmVxdWlyZWQgPSB0eXBlLmNvbGxlY3Rpb25cbiAgICAgICAgICAgIHx8IGpvaW5GaWVsZHMubGVuZ3RoID4gMFxuICAgICAgICAgICAgfHwgYmlnVUludEZpZWxkcy5sZW5ndGggPiAwXG4gICAgICAgICAgICB8fCBlbnVtRmllbGRzLmxlbmd0aCA+IDA7XG4gICAgICAgIGlmICghY3VzdG9tUmVzb2x2ZXJSZXF1aXJlZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgJHt0eXBlLm5hbWV9OiB7YCk7XG4gICAgICAgIGlmICh0eXBlLmNvbGxlY3Rpb24pIHtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oJyAgICAgICAgICAgIGlkKHBhcmVudCkgeycpO1xuICAgICAgICAgICAganMud3JpdGVMbignICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTsnKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oJyAgICAgICAgICAgIH0sJyk7XG4gICAgICAgIH1cbiAgICAgICAgam9pbkZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgY29uc3Qgb25GaWVsZCA9IHR5cGUuZmllbGRzLmZpbmQoeCA9PiB4Lm5hbWUgPT09IChmaWVsZC5qb2luICYmIGZpZWxkLmpvaW4ub24pIHx8ICcnKTtcbiAgICAgICAgICAgIGlmICghb25GaWVsZCkge1xuICAgICAgICAgICAgICAgIHRocm93ICdKb2luIG9uIGZpZWxkIGRvZXMgbm90IGV4aXN0Lic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBjb2xsZWN0aW9uID0gZmllbGQudHlwZS5jb2xsZWN0aW9uO1xuICAgICAgICAgICAgaWYgKCFjb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgJ0pvaW5lZCB0eXBlIGlzIG5vdCBhIGNvbGxlY3Rpb24uJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICR7ZmllbGQubmFtZX0ocGFyZW50LCBfYXJncywgY29udGV4dCkge2ApO1xuICAgICAgICAgICAgaWYgKGZpZWxkLmFycmF5RGVwdGggPT09IDApIHtcbiAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQuZGIuJHtjb2xsZWN0aW9ufS53YWl0Rm9yRG9jKHBhcmVudC4ke29uRmllbGQubmFtZX0pO2ApO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC5hcnJheURlcHRoID09PSAxKSB7XG4gICAgICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgICAgIHJldHVybiBjb250ZXh0LmRiLiR7Y29sbGVjdGlvbn0ud2FpdEZvckRvY3MocGFyZW50LiR7b25GaWVsZC5uYW1lfSk7YCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93ICdKb2lucyBvbiBhIG5lc3RlZCBhcnJheXMgZG9lcyBub3Qgc3VwcG9ydGVkLic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICB9LGApO1xuICAgICAgICB9KTtcbiAgICAgICAgYmlnVUludEZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcHJlZml4TGVuZ3RoID0gZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDY0ID8gMSA6IDI7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAke2ZpZWxkLm5hbWV9KHBhcmVudCkge2ApO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgke3ByZWZpeExlbmd0aH0sIHBhcmVudC4ke2ZpZWxkLm5hbWV9KTtgKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgIH0sYCk7XG4gICAgICAgIH0pO1xuICAgICAgICBlbnVtRmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBlbnVtRGVmID0gZmllbGQuZW51bURlZjtcbiAgICAgICAgICAgIGlmIChlbnVtRGVmKSB7XG4gICAgICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgJHtmaWVsZC5uYW1lfV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCcke2ZpZWxkLm5hbWV9JywgJHtzdHJpbmdpZnlFbnVtVmFsdWVzKGVudW1EZWYudmFsdWVzKX0pLGApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAganMud3JpdGVMbihgICAgICAgICB9LGApO1xuICAgIH1cblxuXG4gICAgZnVuY3Rpb24gZ2VuSlNUeXBlUmVzb2x2ZXJzRm9yVW5pb24odHlwZTogRGJUeXBlKSB7XG4gICAgICAgIGlmICh0eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS51bmlvbikge1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAke3R5cGUubmFtZX06ICR7dHlwZS5uYW1lfVJlc29sdmVyLGApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuZXJhdGUodHlwZXM6IERiVHlwZVtdKSB7XG5cbiAgICAgICAgLy8gUUxcblxuICAgICAgICBbJ1N0cmluZycsICdCb29sZWFuJywgJ0ludCcsICdGbG9hdCddLmZvckVhY2goZ2VuUUxTY2FsYXJUeXBlc0ZpbHRlcik7XG4gICAgICAgIGdlblFMRW51bVR5cGVzKCk7XG4gICAgICAgIHR5cGVzLmZvckVhY2godHlwZSA9PiBnZW5RTFR5cGVEZWNsYXJhdGlvbih0eXBlKSk7XG4gICAgICAgIGNvbnN0IHFsQXJyYXlGaWx0ZXJzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgICAgIHR5cGVzLmZvckVhY2godHlwZSA9PiBnZW5RTEZpbHRlcih0eXBlLCBxbEFycmF5RmlsdGVycykpO1xuXG4gICAgICAgIGNvbnN0IGNvbGxlY3Rpb25zID0gdHlwZXMuZmlsdGVyKHQgPT4gISF0LmNvbGxlY3Rpb24pO1xuICAgICAgICBnZW5RTFF1ZXJpZXMoY29sbGVjdGlvbnMpO1xuICAgICAgICBnZW5RTFN1YnNjcmlwdGlvbnMoY29sbGVjdGlvbnMpO1xuXG4gICAgICAgIC8vIEpTXG5cbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgY29uc3Qge1xuICAgICAgICAgICAgc2NhbGFyLFxuICAgICAgICAgICAgYmlnVUludDEsXG4gICAgICAgICAgICBiaWdVSW50MixcbiAgICAgICAgICAgIHJlc29sdmVCaWdVSW50LFxuICAgICAgICAgICAgc3RydWN0LFxuICAgICAgICAgICAgYXJyYXksXG4gICAgICAgICAgICBqb2luLFxuICAgICAgICAgICAgam9pbkFycmF5LFxuICAgICAgICAgICAgZW51bU5hbWUsXG4gICAgICAgICAgICBjcmVhdGVFbnVtTmFtZVJlc29sdmVyLFxuICAgICAgICB9ID0gcmVxdWlyZSgnLi9kYi10eXBlcy5qcycpO1xuICAgICAgICBgKTtcbiAgICAgICAgY29uc3QganNBcnJheUZpbHRlcnMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICAgICAgdHlwZXMuZm9yRWFjaCh0eXBlID0+IGdlbkpTRmlsdGVyKHR5cGUsIGpzQXJyYXlGaWx0ZXJzKSk7XG5cbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgZnVuY3Rpb24gY3JlYXRlUmVzb2x2ZXJzKGRiKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICBgKTtcbiAgICAgICAgdHlwZXMuZm9yRWFjaCgodHlwZSkgPT4ge1xuICAgICAgICAgICAgZ2VuSlNDdXN0b21SZXNvbHZlcnModHlwZSk7XG4gICAgICAgICAgICBnZW5KU1R5cGVSZXNvbHZlcnNGb3JVbmlvbih0eXBlKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGpzLndyaXRlTG4oJyAgICAgICAgUXVlcnk6IHsnKTtcbiAgICAgICAgY29sbGVjdGlvbnMuZm9yRWFjaCgodHlwZSkgPT4ge1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgJHt0eXBlLmNvbGxlY3Rpb24gfHwgJyd9OiBkYi4ke3R5cGUuY29sbGVjdGlvbiB8fCAnJ30ucXVlcnlSZXNvbHZlcigpLGApXG4gICAgICAgIH0pO1xuICAgICAgICBqcy53cml0ZUxuKCcgICAgICAgIH0sJyk7XG4gICAgICAgIGpzLndyaXRlTG4oJyAgICAgICAgU3Vic2NyaXB0aW9uOiB7Jyk7XG4gICAgICAgIGNvbGxlY3Rpb25zLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICR7dHlwZS5jb2xsZWN0aW9uIHx8ICcnfTogZGIuJHt0eXBlLmNvbGxlY3Rpb24gfHwgJyd9LnN1YnNjcmlwdGlvblJlc29sdmVyKCksYClcbiAgICAgICAgfSk7XG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgYCk7XG5cbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgICAgICAgICBjcmVhdGVSZXNvbHZlcnMsXG4gICAgICAgIGApO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKHR5cGUgPT4ganMud3JpdGVMbihgICAgICR7dHlwZS5uYW1lfSxgKSk7XG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIH07XG4gICAgICAgIGApO1xuICAgIH1cblxuICAgIGNvbnN0IHNjaGVtYSA9IHBhcnNlVHlwZURlZihzY2hlbWFEZWYpO1xuXG4gICAgaWYgKHNjaGVtYS5jbGFzcykge1xuICAgICAgICBwYXJzZURiVHlwZXMoc2NoZW1hLmNsYXNzLnR5cGVzKTtcbiAgICAgICAgZ2VuZXJhdGUoZGJUeXBlcyk7XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBlOiBJbnRFbnVtRGVmIG9mIGVudW1UeXBlcy52YWx1ZXMoKSkge1xuICAgICAgICBjb25zb2xlLmxvZyhgZXhwb3J0IGNvbnN0IFEke2UubmFtZX0gPSB7YCk7XG4gICAgICAgIGNvbnNvbGUubG9nKE9iamVjdC5lbnRyaWVzKGUudmFsdWVzKS5tYXAoKFtuYW1lLCB2YWx1ZV0pID0+IHtcbiAgICAgICAgICAgIHJldHVybiBgICAgICR7bmFtZX06ICR7KHZhbHVlOiBhbnkpfSxgO1xuICAgICAgICB9KS5qb2luKCdcXG4nKSk7XG4gICAgICAgIGNvbnNvbGUubG9nKGB9O1xcbmApO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIHFsOiBxbC5nZW5lcmF0ZWQoKSxcbiAgICAgICAganM6IGpzLmdlbmVyYXRlZCgpLFxuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgbWFpbjtcbiJdfQ==