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

  function genJSScalarFields(type, parentPath, parentDocPath) {
    type.fields.forEach(field => {
      if (field.join || field.enumDef) {
        return;
      }

      const docName = field.name === 'id' ? '_key' : field.name;
      const path = `${parentPath}.${field.name}`;
      const docPath = `${parentDocPath}.${docName}${field.arrayDepth > 0 ? '[*]' : ''}`;

      switch (field.type.category) {
        case "scalar":
          let typeName;

          if (field.type === scalarTypes.boolean) {
            typeName = 'boolean';
          } else if (field.type === scalarTypes.float) {
            typeName = 'number';
          } else if (field.type === scalarTypes.int) {
            typeName = 'number';
          } else if (field.type === scalarTypes.uint64) {
            typeName = 'uint64';
          } else if (field.type === scalarTypes.uint1024) {
            typeName = 'uint1024';
          } else {
            typeName = 'string';
          }

          js.writeLn(`scalarFields.set('${path}', { type: '${typeName}', path: '${docPath}' });`);
          break;

        case "struct":
        case "union":
          genJSScalarFields(field.type, path, docPath);
          break;
      }
    });
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
        const scalarFields = new Map();
        `);
    collections.forEach(type => {
      genJSScalarFields(type, type.collection, 'doc');
    });
    js.writeBlockLn(`
        module.exports = {
            scalarFields,
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NlcnZlci9zY2hlbWEvcWwtanMtZ2VuZXJhdG9yLmpzIl0sIm5hbWVzIjpbIkRiVHlwZUNhdGVnb3J5IiwidW5yZXNvbHZlZCIsInNjYWxhciIsInVuaW9uIiwic3RydWN0Iiwic2NhbGFyVHlwZSIsIm5hbWUiLCJjYXRlZ29yeSIsImZpZWxkcyIsImRvYyIsInNjYWxhclR5cGVzIiwiaW50IiwidWludDY0IiwidWludDEwMjQiLCJmbG9hdCIsImJvb2xlYW4iLCJzdHJpbmciLCJpc0JpZ0ludCIsInR5cGUiLCJ1bnJlc29sdmVkVHlwZSIsImlzTG93ZXJDYXNlZCIsInMiLCJsIiwidG9Mb3dlckNhc2UiLCJ1IiwidG9VcHBlckNhc2UiLCJpc1VwcGVyQ2FzZWQiLCJ0b0FsbENhcHMiLCJyZXN1bHQiLCJpIiwibGVuZ3RoIiwidG9FbnVtU3R5bGUiLCJzdWJzdHIiLCJzdHJpbmdpZnlFbnVtVmFsdWVzIiwidmFsdWVzIiwiT2JqZWN0IiwiZW50cmllcyIsIm1hcCIsInZhbHVlIiwiam9pbiIsImdldERvY01EIiwic2NoZW1hIiwibWQiLCJtYWluIiwic2NoZW1hRGVmIiwiZGJUeXBlcyIsImxhc3RSZXBvcnRlZFR5cGUiLCJlbnVtVHlwZXMiLCJNYXAiLCJyZXBvcnRUeXBlIiwiZmllbGQiLCJjb25zb2xlIiwibG9nIiwicGFyc2VEYkZpZWxkIiwidHlwZU5hbWUiLCJzY2hlbWFGaWVsZCIsInNjaGVtYVR5cGUiLCJhcnJheURlcHRoIiwiYXJyYXkiLCJlbnVtRGVmIiwiXyIsImVudW0iLCJzZXQiLCJyZWYiLCJib29sIiwidW5zaWduZWQiLCJzaXplIiwiRXJyb3IiLCJKU09OIiwic3RyaW5naWZ5IiwicHJvY2VzcyIsImV4aXQiLCJ1bndyYXBBcnJheXMiLCJwYXJzZURiVHlwZSIsImNvbGxlY3Rpb24iLCJwdXNoIiwiZm9yRWFjaCIsInVud3JhcHBlZCIsIm93blR5cGUiLCJwYXJzZURiVHlwZXMiLCJ0eXBlcyIsInJlc29sdmluZyIsIlNldCIsInJlc29sdmVkIiwib3JkZXJlZFJlc29sdmVkIiwidCIsInJlc29sdmVUeXBlIiwiaGFzIiwiYWRkIiwiZ2V0IiwiZGVsZXRlIiwicWwiLCJXcml0ZXIiLCJqcyIsImdlblFMRG9jIiwicHJlZml4IiwidHJpbSIsImxpbmVzIiwic3BsaXQiLCJpbmNsdWRlcyIsIndyaXRlTG4iLCJsaW5lIiwidW5pb25WYXJpYW50VHlwZSIsInZhcmlhbnQiLCJnZW5RTFR5cGVEZWNsYXJhdGlvbnNGb3JVbmlvblZhcmlhbnRzIiwid3JpdGVCbG9ja0xuIiwiZ2VuUUxFbnVtVHlwZXMiLCJrZXlzIiwiZ2VuUUxUeXBlRGVjbGFyYXRpb24iLCJ0eXBlRGVjbGFyYXRpb24iLCJyZXBlYXQiLCJwYXJhbXMiLCJwcmV2ZW50VHdpY2UiLCJuYW1lcyIsIndvcmsiLCJnZW5RTEZpbHRlcnNGb3JBcnJheUZpZWxkcyIsInFsTmFtZXMiLCJpdGVtVHlwZU5hbWUiLCJmaWx0ZXJOYW1lIiwib3AiLCJnZW5RTEZpbHRlcnNGb3JFbnVtTmFtZUZpZWxkcyIsImdlblFMU2NhbGFyVHlwZXNGaWx0ZXIiLCJnZW5RTEZpbHRlciIsImdlblFMUXVlcmllcyIsImdlblFMU3Vic2NyaXB0aW9ucyIsImdldFNjYWxhclJlc29sdmVyTmFtZSIsImdlbkpTRmlsdGVyc0ZvckFycmF5RmllbGRzIiwianNOYW1lcyIsIml0ZW1SZXNvbHZlck5hbWUiLCJnZW5KU1N0cnVjdEZpbHRlciIsInN1ZmZpeCIsIm9uIiwicmVmT24iLCJnZW5KU1VuaW9uUmVzb2x2ZXIiLCJnZW5KU0ZpbHRlciIsImdlbkpTQ3VzdG9tUmVzb2x2ZXJzIiwiam9pbkZpZWxkcyIsImZpbHRlciIsIngiLCJiaWdVSW50RmllbGRzIiwiZW51bUZpZWxkcyIsImN1c3RvbVJlc29sdmVyUmVxdWlyZWQiLCJvbkZpZWxkIiwiZmluZCIsInByZSIsInByZUNvbmRpdGlvbiIsInBvc3QiLCJwcmVmaXhMZW5ndGgiLCJnZW5KU1NjYWxhckZpZWxkcyIsInBhcmVudFBhdGgiLCJwYXJlbnREb2NQYXRoIiwiZG9jTmFtZSIsInBhdGgiLCJkb2NQYXRoIiwiZ2VuSlNUeXBlUmVzb2x2ZXJzRm9yVW5pb24iLCJnZW5lcmF0ZSIsInFsQXJyYXlGaWx0ZXJzIiwiY29sbGVjdGlvbnMiLCJqc0FycmF5RmlsdGVycyIsImNsYXNzIiwiZSIsImdlbmVyYXRlZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUVBOztBQUVBOztBQUVBLE1BQU1BLGNBQWMsR0FBRztBQUNuQkMsRUFBQUEsVUFBVSxFQUFFLFlBRE87QUFFbkJDLEVBQUFBLE1BQU0sRUFBRSxRQUZXO0FBR25CQyxFQUFBQSxLQUFLLEVBQUUsT0FIWTtBQUluQkMsRUFBQUEsTUFBTSxFQUFFO0FBSlcsQ0FBdkI7O0FBc0NBLFNBQVNDLFVBQVQsQ0FBb0JDLElBQXBCLEVBQTBDO0FBQ3RDLFNBQU87QUFDSEEsSUFBQUEsSUFERztBQUVIQyxJQUFBQSxRQUFRLEVBQUVQLGNBQWMsQ0FBQ0UsTUFGdEI7QUFHSE0sSUFBQUEsTUFBTSxFQUFFLEVBSEw7QUFJSEMsSUFBQUEsR0FBRyxFQUFFO0FBSkYsR0FBUDtBQU1IOztBQUVELE1BQU1DLFdBQVcsR0FBRztBQUNoQkMsRUFBQUEsR0FBRyxFQUFFTixVQUFVLENBQUMsS0FBRCxDQURDO0FBRWhCTyxFQUFBQSxNQUFNLEVBQUVQLFVBQVUsQ0FBQyxRQUFELENBRkY7QUFHaEJRLEVBQUFBLFFBQVEsRUFBRVIsVUFBVSxDQUFDLFFBQUQsQ0FISjtBQUloQlMsRUFBQUEsS0FBSyxFQUFFVCxVQUFVLENBQUMsT0FBRCxDQUpEO0FBS2hCVSxFQUFBQSxPQUFPLEVBQUVWLFVBQVUsQ0FBQyxTQUFELENBTEg7QUFNaEJXLEVBQUFBLE1BQU0sRUFBRVgsVUFBVSxDQUFDLFFBQUQ7QUFORixDQUFwQjs7QUFTQSxTQUFTWSxRQUFULENBQWtCQyxJQUFsQixFQUF5QztBQUNyQyxTQUFPQSxJQUFJLEtBQUtSLFdBQVcsQ0FBQ0csUUFBckIsSUFBaUNLLElBQUksS0FBS1IsV0FBVyxDQUFDRSxNQUE3RDtB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SUFBQUEsRUFBRSxDQUFDWSxZQUFILENBQWlCOztTQUFqQjtBQUdIOztBQUVELFFBQU1oRSxNQUFNLEdBQUcsMEJBQWFHLFNBQWIsQ0FBZjs7QUFFQSxNQUFJSCxNQUFNLENBQUNzSCxLQUFYLEVBQWtCO0FBQ2RoRixJQUFBQSxZQUFZLENBQUN0QyxNQUFNLENBQUNzSCxLQUFQLENBQWEvRSxLQUFkLENBQVo7QUFDQTJFLElBQUFBLFFBQVEsQ0FBQzlHLE9BQUQsQ0FBUjtBQUNIOztBQUVELE9BQUssTUFBTW1ILENBQVgsSUFBNEJqSCxTQUFTLENBQUNiLE1BQVYsRUFBNUIsRUFBZ0Q7QUFDNUNpQixJQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBYSxpQkFBZ0I0RyxDQUFDLENBQUMxSixJQUFLLE1BQXBDO0FBQ0E2QyxJQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWWpCLE1BQU0sQ0FBQ0MsT0FBUCxDQUFlNEgsQ0FBQyxDQUFDOUgsTUFBakIsRUFBeUJHLEdBQXpCLENBQTZCLENBQUMsQ0FBQy9CLElBQUQsRUFBT2dDLEtBQVAsQ0FBRCxLQUFtQjtBQUN4RCxhQUFRLE9BQU1oQyxJQUFLLEtBQUtnQyxLQUFZLEdBQXBDO0FBQ0gsS0FGVyxFQUVUQyxJQUZTLENBRUosSUFGSSxDQUFaO0FBR0FZLElBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFhLE1BQWI7QUFDSDs7QUFFRCxTQUFPO0FBQ0h1QyxJQUFBQSxFQUFFLEVBQUVBLEVBQUUsQ0FBQ3NFLFNBQUgsRUFERDtBQUVIcEUsSUFBQUEsRUFBRSxFQUFFQSxFQUFFLENBQUNvRSxTQUFIO0FBRkQsR0FBUDtBQUlIOztlQUVjdEgsSSIsInNvdXJjZXNDb250ZW50IjpbIi8vQGZsb3dcblxuaW1wb3J0IHsgbWFrZUZpZWxkVHlwZU5hbWUsIFdyaXRlciB9IGZyb20gJ3Rvbi1sYWJzLWRldi1vcHMvZGlzdC9zcmMvZ2VuLmpzJztcbmltcG9ydCB0eXBlIHsgU2NoZW1hRG9jLCBTY2hlbWFNZW1iZXIsIFNjaGVtYVR5cGUsIFR5cGVEZWYgfSBmcm9tICd0b24tbGFicy1kZXYtb3BzL3NyYy9zY2hlbWEuanMnO1xuaW1wb3J0IHsgcGFyc2VUeXBlRGVmIH0gZnJvbSAndG9uLWxhYnMtZGV2LW9wcy9kaXN0L3NyYy9zY2hlbWEuanMnO1xuXG5jb25zdCBEYlR5cGVDYXRlZ29yeSA9IHtcbiAgICB1bnJlc29sdmVkOiAndW5yZXNvbHZlZCcsXG4gICAgc2NhbGFyOiAnc2NhbGFyJyxcbiAgICB1bmlvbjogJ3VuaW9uJyxcbiAgICBzdHJ1Y3Q6ICdzdHJ1Y3QnLFxufTtcblxudHlwZSBEYkpvaW4gPSB7XG4gICAgY29sbGVjdGlvbjogc3RyaW5nLFxuICAgIG9uOiBzdHJpbmcsXG4gICAgcmVmT246IHN0cmluZyxcbiAgICBwcmVDb25kaXRpb246IHN0cmluZyxcbn1cblxudHlwZSBEYlR5cGUgPSB7XG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGZpZWxkczogRGJGaWVsZFtdLFxuICAgIGNhdGVnb3J5OiAndW5yZXNvbHZlZCcgfCAnc2NhbGFyJyB8ICd1bmlvbicgfCAnc3RydWN0JyxcbiAgICBjb2xsZWN0aW9uPzogc3RyaW5nLFxuICAgIGRvYzogc3RyaW5nLFxufVxuXG50eXBlIEludEVudW1EZWYgPSB7XG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHZhbHVlczoge1xuICAgICAgICBbc3RyaW5nXTogbnVtYmVyXG4gICAgfSxcbn1cblxudHlwZSBEYkZpZWxkID0ge1xuICAgIG5hbWU6IHN0cmluZyxcbiAgICB0eXBlOiBEYlR5cGUsXG4gICAgYXJyYXlEZXB0aDogbnVtYmVyLFxuICAgIGpvaW4/OiBEYkpvaW4sXG4gICAgZW51bURlZj86IEludEVudW1EZWYsXG4gICAgZG9jOiBzdHJpbmcsXG59XG5cbmZ1bmN0aW9uIHNjYWxhclR5cGUobmFtZTogc3RyaW5nKTogRGJUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBuYW1lLFxuICAgICAgICBjYXRlZ29yeTogRGJUeXBlQ2F0ZWdvcnkuc2NhbGFyLFxuICAgICAgICBmaWVsZHM6IFtdLFxuICAgICAgICBkb2M6ICcnLFxuICAgIH1cbn1cblxuY29uc3Qgc2NhbGFyVHlwZXMgPSB7XG4gICAgaW50OiBzY2FsYXJUeXBlKCdJbnQnKSxcbiAgICB1aW50NjQ6IHNjYWxhclR5cGUoJ1N0cmluZycpLFxuICAgIHVpbnQxMDI0OiBzY2FsYXJUeXBlKCdTdHJpbmcnKSxcbiAgICBmbG9hdDogc2NhbGFyVHlwZSgnRmxvYXQnKSxcbiAgICBib29sZWFuOiBzY2FsYXJUeXBlKCdCb29sZWFuJyksXG4gICAgc3RyaW5nOiBzY2FsYXJUeXBlKCdTdHJpbmcnKSxcbn07XG5cbmZ1bmN0aW9uIGlzQmlnSW50KHR5cGU6IERiVHlwZSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0eXBlID09PSBzY2FsYXJUeXBlcy51aW50MTAyNCB8fCB0eXBlID09PSBzY2FsYXJUeXBlcy51aW50NjQ7XG59XG5cbmZ1bmN0aW9uIHVucmVzb2x2ZWRUeXBlKG5hbWU6IHN0cmluZyk6IERiVHlwZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgbmFtZSxcbiAgICAgICAgY2F0ZWdvcnk6IERiVHlwZUNhdGVnb3J5LnVucmVzb2x2ZWQsXG4gICAgICAgIGZpZWxkczogW10sXG4gICAgICAgIGRvYzogJycsXG4gICAgfVxufVxuXG5mdW5jdGlvbiBpc0xvd2VyQ2FzZWQoczogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgY29uc3QgbCA9IHMudG9Mb3dlckNhc2UoKTtcbiAgICBjb25zdCB1ID0gcy50b1VwcGVyQ2FzZSgpO1xuICAgIHJldHVybiAodSAhPT0gbCkgJiYgKHMgPT09IGwpO1xufVxuXG5mdW5jdGlvbiBpc1VwcGVyQ2FzZWQoczogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgY29uc3QgbCA9IHMudG9Mb3dlckNhc2UoKTtcbiAgICBjb25zdCB1ID0gcy50b1VwcGVyQ2FzZSgpO1xuICAgIHJldHVybiAodSAhPT0gbCkgJiYgKHMgPT09IHUpO1xufVxuXG5mdW5jdGlvbiB0b0FsbENhcHMoczogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBsZXQgcmVzdWx0ID0gJyc7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGlmICgoaSA+IDApICYmIChzW2kgLSAxXSAhPT0gJ18nKSAmJiBpc0xvd2VyQ2FzZWQoc1tpIC0gMV0pICYmIGlzVXBwZXJDYXNlZChzW2ldKSkge1xuICAgICAgICAgICAgcmVzdWx0ICs9ICdfJztcbiAgICAgICAgfVxuICAgICAgICByZXN1bHQgKz0gc1tpXTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdC50b1VwcGVyQ2FzZSgpO1xufVxuXG5mdW5jdGlvbiB0b0VudW1TdHlsZShzOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiBgJHtzLnN1YnN0cigwLCAxKS50b1VwcGVyQ2FzZSgpfSR7cy5zdWJzdHIoMSl9YDtcbn1cblxuZnVuY3Rpb24gc3RyaW5naWZ5RW51bVZhbHVlcyh2YWx1ZXM6IHsgW3N0cmluZ106IG51bWJlciB9KTogc3RyaW5nIHtcbiAgICBjb25zdCBmaWVsZHMgPSBPYmplY3QuZW50cmllcyh2YWx1ZXMpLm1hcCgoW25hbWUsIHZhbHVlXSkgPT4ge1xuICAgICAgICByZXR1cm4gYCR7dG9FbnVtU3R5bGUobmFtZSl9OiAkeyh2YWx1ZTogYW55KX1gO1xuICAgIH0pO1xuICAgIHJldHVybiBgeyAke2ZpZWxkcy5qb2luKCcsICcpfSB9YDtcbn1cblxuZnVuY3Rpb24gZ2V0RG9jTUQoc2NoZW1hOiBTY2hlbWFEb2MpOiBzdHJpbmcge1xuICAgIGNvbnN0IGRvYyA9IHNjaGVtYS5kb2M7XG4gICAgaWYgKCFkb2MpIHtcbiAgICAgICAgcmV0dXJuICcnO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGRvYyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgcmV0dXJuIGRvYztcbiAgICB9XG4gICAgaWYgKGRvYy5tZCkge1xuICAgICAgICByZXR1cm4gKGRvYy5tZDogYW55KTtcbiAgICB9XG4gICAgcmV0dXJuICcnO1xufVxuXG5mdW5jdGlvbiBtYWluKHNjaGVtYURlZjogVHlwZURlZikge1xuXG4gICAgbGV0IGRiVHlwZXM6IERiVHlwZVtdID0gW107XG4gICAgbGV0IGxhc3RSZXBvcnRlZFR5cGU6IHN0cmluZyA9ICcnO1xuICAgIGxldCBlbnVtVHlwZXM6IE1hcDxzdHJpbmcsIEludEVudW1EZWY+ID0gbmV3IE1hcCgpO1xuXG4gICAgZnVuY3Rpb24gcmVwb3J0VHlwZShuYW1lOiBzdHJpbmcsIGZpZWxkOiBzdHJpbmcsIHR5cGU6IHN0cmluZykge1xuICAgICAgICBpZiAobmFtZSAhPT0gbGFzdFJlcG9ydGVkVHlwZSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2cobmFtZSk7XG4gICAgICAgICAgICBsYXN0UmVwb3J0ZWRUeXBlID0gbmFtZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmxvZyhgICAgICR7ZmllbGR9OiAke3R5cGV9YCk7XG5cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZURiRmllbGQoXG4gICAgICAgIHR5cGVOYW1lOiBzdHJpbmcsXG4gICAgICAgIHNjaGVtYUZpZWxkOiBTY2hlbWFNZW1iZXI8U2NoZW1hVHlwZT4sXG4gICAgKTogRGJGaWVsZCB7XG4gICAgICAgIGxldCBzY2hlbWFUeXBlID0gc2NoZW1hRmllbGQ7XG4gICAgICAgIGNvbnN0IGZpZWxkOiBEYkZpZWxkID0ge1xuICAgICAgICAgICAgbmFtZTogc2NoZW1hRmllbGQubmFtZSxcbiAgICAgICAgICAgIGFycmF5RGVwdGg6IDAsXG4gICAgICAgICAgICB0eXBlOiBzY2FsYXJUeXBlcy5zdHJpbmcsXG4gICAgICAgICAgICBkb2M6IGdldERvY01EKHNjaGVtYUZpZWxkKSxcbiAgICAgICAgfTtcbiAgICAgICAgd2hpbGUgKHNjaGVtYVR5cGUuYXJyYXkpIHtcbiAgICAgICAgICAgIGZpZWxkLmFycmF5RGVwdGggKz0gMTtcbiAgICAgICAgICAgIHNjaGVtYVR5cGUgPSBzY2hlbWFUeXBlLmFycmF5O1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGVudW1EZWY6ID9JbnRFbnVtRGVmID0gKHNjaGVtYVR5cGUuXyAmJiBzY2hlbWFUeXBlLl8uZW51bSkgfHwgbnVsbDtcbiAgICAgICAgaWYgKGVudW1EZWYpIHtcbiAgICAgICAgICAgIGZpZWxkLmVudW1EZWYgPSBlbnVtRGVmO1xuICAgICAgICAgICAgZW51bVR5cGVzLnNldChlbnVtRGVmLm5hbWUsIGVudW1EZWYpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGpvaW4gPSAoc2NoZW1hVHlwZTogYW55KS5fLmpvaW47XG4gICAgICAgIGlmIChqb2luKSB7XG4gICAgICAgICAgICBmaWVsZC5qb2luID0gam9pbjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc2NoZW1hVHlwZS51bmlvbiB8fCBzY2hlbWFUeXBlLnN0cnVjdCkge1xuICAgICAgICAgICAgZmllbGQudHlwZSA9IHVucmVzb2x2ZWRUeXBlKG1ha2VGaWVsZFR5cGVOYW1lKHR5cGVOYW1lLCBzY2hlbWFGaWVsZC5uYW1lKSk7XG4gICAgICAgIH0gZWxzZSBpZiAoc2NoZW1hVHlwZS5yZWYpIHtcbiAgICAgICAgICAgIGZpZWxkLnR5cGUgPSB1bnJlc29sdmVkVHlwZShzY2hlbWFUeXBlLnJlZi5uYW1lKTtcbiAgICAgICAgfSBlbHNlIGlmIChzY2hlbWFUeXBlLmJvb2wpIHtcbiAgICAgICAgICAgIGZpZWxkLnR5cGUgPSBzY2FsYXJUeXBlcy5ib29sZWFuO1xuICAgICAgICB9IGVsc2UgaWYgKHNjaGVtYVR5cGUuaW50KSB7XG4gICAgICAgICAgICBjb25zdCB1bnNpZ25lZDogYm9vbGVhbiA9IChzY2hlbWFUeXBlLmludCAmJiBzY2hlbWFUeXBlLmludC51bnNpZ25lZCkgfHwgZmFsc2U7XG4gICAgICAgICAgICBjb25zdCBzaXplOiBudW1iZXIgPSAoc2NoZW1hVHlwZS5pbnQgJiYgc2NoZW1hVHlwZS5pbnQuc2l6ZSkgfHwgMzI7XG4gICAgICAgICAgICBpZiAodW5zaWduZWQpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2l6ZSA+PSAxMjgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVwb3J0VHlwZSh0eXBlTmFtZSwgZmllbGQubmFtZSwgJ3UxMDI0Jyk7XG4gICAgICAgICAgICAgICAgICAgIGZpZWxkLnR5cGUgPSBzY2FsYXJUeXBlcy51aW50MTAyNDtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHNpemUgPj0gNjQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVwb3J0VHlwZSh0eXBlTmFtZSwgZmllbGQubmFtZSwgJ3U2NCcpO1xuICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlID0gc2NhbGFyVHlwZXMudWludDY0O1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc2l6ZSA+PSAzMikge1xuICAgICAgICAgICAgICAgICAgICByZXBvcnRUeXBlKHR5cGVOYW1lLCBmaWVsZC5uYW1lLCAndTMyJyk7XG4gICAgICAgICAgICAgICAgICAgIGZpZWxkLnR5cGUgPSBzY2FsYXJUeXBlcy5mbG9hdDtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXBvcnRUeXBlKHR5cGVOYW1lLCBmaWVsZC5uYW1lLCBgdSR7c2l6ZX1gKTtcbiAgICAgICAgICAgICAgICAgICAgZmllbGQudHlwZSA9IHNjYWxhclR5cGVzLmludDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChzaXplID4gMzIpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnRlZ2VyIHR5cGUgd2l0aCBzaXplICR7c2l6ZX0gYml0IGRvZXMgbm90IHN1cHBvcnRlZGApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcG9ydFR5cGUodHlwZU5hbWUsIGZpZWxkLm5hbWUsICdpMzInKTtcbiAgICAgICAgICAgICAgICAgICAgZmllbGQudHlwZSA9IHNjYWxhclR5cGVzLmludDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoc2NoZW1hVHlwZS5mbG9hdCkge1xuICAgICAgICAgICAgcmVwb3J0VHlwZSh0eXBlTmFtZSwgZmllbGQubmFtZSwgJ2Zsb2F0Jyk7XG4gICAgICAgICAgICBmaWVsZC50eXBlID0gc2NhbGFyVHlwZXMuZmxvYXQ7XG4gICAgICAgIH0gZWxzZSBpZiAoc2NoZW1hVHlwZS5zdHJpbmcpIHtcbiAgICAgICAgICAgIGZpZWxkLnR5cGUgPSBzY2FsYXJUeXBlcy5zdHJpbmc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmaWVsZC50eXBlID0gc2NhbGFyVHlwZXMuc3RyaW5nO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ0ludmFsaWQgZmllbGQgdHlwZTogJywgSlNPTi5zdHJpbmdpZnkoc2NoZW1hVHlwZSkpO1xuICAgICAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmaWVsZDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB1bndyYXBBcnJheXModHlwZTogU2NoZW1hVHlwZSk6IFNjaGVtYVR5cGUge1xuICAgICAgICBpZiAodHlwZS5hcnJheSkge1xuICAgICAgICAgICAgcmV0dXJuIHVud3JhcEFycmF5cyh0eXBlLmFycmF5KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHlwZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZURiVHlwZShcbiAgICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgICBzY2hlbWFUeXBlOiBTY2hlbWFUeXBlXG4gICAgKSB7XG4gICAgICAgIGNvbnN0IHN0cnVjdCA9IHNjaGVtYVR5cGUudW5pb24gfHwgc2NoZW1hVHlwZS5zdHJ1Y3Q7XG4gICAgICAgIGlmICghc3RydWN0KSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgPz8gJHtuYW1lfTogJHtKU09OLnN0cmluZ2lmeShzY2hlbWFUeXBlKS5zdWJzdHIoMCwgMjAwKX1gKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0eXBlOiBEYlR5cGUgPSB7XG4gICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgY2F0ZWdvcnk6IHNjaGVtYVR5cGUudW5pb24gPyBEYlR5cGVDYXRlZ29yeS51bmlvbiA6IERiVHlwZUNhdGVnb3J5LnN0cnVjdCxcbiAgICAgICAgICAgIGZpZWxkczogW10sXG4gICAgICAgICAgICBjb2xsZWN0aW9uOiAoc2NoZW1hVHlwZTogYW55KS5fLmNvbGxlY3Rpb24sXG4gICAgICAgICAgICBkb2M6IGdldERvY01EKHNjaGVtYVR5cGUpLFxuICAgICAgICB9O1xuXG4gICAgICAgIGlmICh0eXBlLmNvbGxlY3Rpb24pIHtcbiAgICAgICAgICAgIHR5cGUuZmllbGRzLnB1c2goe1xuICAgICAgICAgICAgICAgIG5hbWU6ICdpZCcsXG4gICAgICAgICAgICAgICAgYXJyYXlEZXB0aDogMCxcbiAgICAgICAgICAgICAgICB0eXBlOiBzY2FsYXJUeXBlcy5zdHJpbmcsXG4gICAgICAgICAgICAgICAgZG9jOiAnJyxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHN0cnVjdC5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgdHlwZS5maWVsZHMucHVzaChwYXJzZURiRmllbGQobmFtZSwgZmllbGQpKTtcbiAgICAgICAgICAgIGNvbnN0IHVud3JhcHBlZCA9IHVud3JhcEFycmF5cyhmaWVsZCk7XG4gICAgICAgICAgICBjb25zdCBvd25UeXBlID0gKHVud3JhcHBlZC5zdHJ1Y3QgfHwgdW53cmFwcGVkLnVuaW9uKSA/IHVud3JhcHBlZCA6IG51bGw7XG4gICAgICAgICAgICBpZiAob3duVHlwZSkge1xuICAgICAgICAgICAgICAgIHBhcnNlRGJUeXBlKG1ha2VGaWVsZFR5cGVOYW1lKG5hbWUsIGZpZWxkLm5hbWUpLCBvd25UeXBlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGRiVHlwZXMucHVzaCh0eXBlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZURiVHlwZXModHlwZXM6IFNjaGVtYU1lbWJlcjxTY2hlbWFUeXBlPltdKSB7XG4gICAgICAgIHR5cGVzLmZvckVhY2goKHR5cGU6IFNjaGVtYU1lbWJlcjxTY2hlbWFUeXBlPikgPT4ge1xuICAgICAgICAgICAgcGFyc2VEYlR5cGUodHlwZS5uYW1lLCB0eXBlKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IHVucmVzb2x2ZWQ6IE1hcDxzdHJpbmcsIERiVHlwZT4gPSBuZXcgTWFwPHN0cmluZywgRGJUeXBlPigpO1xuICAgICAgICBjb25zdCByZXNvbHZpbmc6IFNldDxzdHJpbmc+ID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgICAgIGNvbnN0IHJlc29sdmVkOiBNYXA8c3RyaW5nLCBEYlR5cGU+ID0gbmV3IE1hcDxzdHJpbmcsIERiVHlwZT4oKTtcbiAgICAgICAgY29uc3Qgb3JkZXJlZFJlc29sdmVkOiBEYlR5cGVbXSA9IFtdO1xuICAgICAgICBkYlR5cGVzLmZvckVhY2godCA9PiB1bnJlc29sdmVkLnNldCh0Lm5hbWUsIHQpKTtcbiAgICAgICAgY29uc3QgcmVzb2x2ZVR5cGUgPSAodHlwZTogRGJUeXBlKSA9PiB7XG4gICAgICAgICAgICBpZiAocmVzb2x2ZWQuaGFzKHR5cGUubmFtZSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocmVzb2x2aW5nLmhhcyh0eXBlLm5hbWUpKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFdBUk5JTkc6IENpcmN1bGFyIHJlZmVyZW5jZSB0byB0eXBlICR7dHlwZS5uYW1lfWApO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlc29sdmluZy5hZGQodHlwZS5uYW1lKTtcbiAgICAgICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGZpZWxkLnR5cGUuY2F0ZWdvcnkgPT09IERiVHlwZUNhdGVnb3J5LnVucmVzb2x2ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHR5cGUgPSByZXNvbHZlZC5nZXQoZmllbGQudHlwZS5uYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlID0gdW5yZXNvbHZlZC5nZXQoZmllbGQudHlwZS5uYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZVR5cGUodHlwZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBSZWZlcmVuY2VkIHR5cGUgbm90IGZvdW5kOiAke2ZpZWxkLnR5cGUubmFtZX1gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpZWxkLnR5cGUgPSB0eXBlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXNvbHZpbmcuZGVsZXRlKHR5cGUubmFtZSk7XG4gICAgICAgICAgICBvcmRlcmVkUmVzb2x2ZWQucHVzaCh0eXBlKTtcbiAgICAgICAgICAgIHVucmVzb2x2ZWQuZGVsZXRlKHR5cGUubmFtZSk7XG4gICAgICAgICAgICByZXNvbHZlZC5zZXQodHlwZS5uYW1lLCB0eXBlKTtcbiAgICAgICAgfTtcbiAgICAgICAgZGJUeXBlcy5mb3JFYWNoKHJlc29sdmVUeXBlKTtcbiAgICAgICAgZGJUeXBlcyA9IG9yZGVyZWRSZXNvbHZlZDtcbiAgICB9XG5cbi8vIEdlbmVyYXRvcnNcblxuICAgIGNvbnN0IHFsID0gbmV3IFdyaXRlcigpO1xuICAgIGNvbnN0IGpzID0gbmV3IFdyaXRlcigpO1xuXG4gICAgZnVuY3Rpb24gZ2VuUUxEb2MocHJlZml4OiBzdHJpbmcsIGRvYzogc3RyaW5nKSB7XG4gICAgICAgIGlmIChkb2MudHJpbSgpID09PSAnJykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGxpbmVzID0gZG9jLnNwbGl0KC9cXG5cXHI/fFxcclxcbj8vKTtcbiAgICAgICAgaWYgKGxpbmVzLmxlbmd0aCA9PT0gMSAmJiAhbGluZXNbMF0uaW5jbHVkZXMoJ1wiJykpIHtcbiAgICAgICAgICAgIHFsLndyaXRlTG4ocHJlZml4LCAnXCInLCBsaW5lc1swXSwgJ1wiJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBxbC53cml0ZUxuKHByZWZpeCwgJ1wiXCJcIicpO1xuICAgICAgICAgICAgbGluZXMuZm9yRWFjaCgobGluZSkgPT4ge1xuICAgICAgICAgICAgICAgIHFsLndyaXRlTG4ocHJlZml4LCBsaW5lKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcWwud3JpdGVMbihwcmVmaXgsICdcIlwiXCInKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHVuaW9uVmFyaWFudFR5cGUodHlwZTogRGJUeXBlLCB2YXJpYW50OiBEYkZpZWxkKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIGAke3R5cGUubmFtZX0ke3ZhcmlhbnQubmFtZX1WYXJpYW50YDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5RTFR5cGVEZWNsYXJhdGlvbnNGb3JVbmlvblZhcmlhbnRzKHR5cGU6IERiVHlwZSkge1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKCh2YXJpYW50KSA9PiB7XG4gICAgICAgICAgICBxbC53cml0ZUJsb2NrTG4oYFxuICAgICAgICB0eXBlICR7dW5pb25WYXJpYW50VHlwZSh0eXBlLCB2YXJpYW50KX0ge1xuICAgICAgICAgICAgJHt2YXJpYW50Lm5hbWV9OiAke3ZhcmlhbnQudHlwZS5uYW1lfVxuICAgICAgICB9XG5cbiAgICAgICAgYCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlblFMRW51bVR5cGVzKCkge1xuICAgICAgICBmb3IgKGNvbnN0IGVudW1EZWY6IEludEVudW1EZWYgb2YgZW51bVR5cGVzLnZhbHVlcygpKSB7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGBlbnVtICR7ZW51bURlZi5uYW1lfUVudW0ge2ApO1xuICAgICAgICAgICAgT2JqZWN0LmtleXMoZW51bURlZi52YWx1ZXMpLmZvckVhY2goKG5hbWUpID0+IHtcbiAgICAgICAgICAgICAgICBxbC53cml0ZUxuKGAgICAgJHt0b0VudW1TdHlsZShuYW1lKX1gKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcWwud3JpdGVMbihgfWApO1xuICAgICAgICAgICAgcWwud3JpdGVMbigpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuUUxUeXBlRGVjbGFyYXRpb24odHlwZTogRGJUeXBlKSB7XG4gICAgICAgIGlmICh0eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS51bmlvbikge1xuICAgICAgICAgICAgZ2VuUUxUeXBlRGVjbGFyYXRpb25zRm9yVW5pb25WYXJpYW50cyh0eXBlKTtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oYHVuaW9uICR7dHlwZS5uYW1lfSA9IGApO1xuICAgICAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCh2YXJpYW50ID0+IHtcbiAgICAgICAgICAgICAgICBxbC53cml0ZUxuKGBcXHR8ICR7dW5pb25WYXJpYW50VHlwZSh0eXBlLCB2YXJpYW50KX1gKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcWwud3JpdGVMbigpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZ2VuUUxEb2MoJycsIHR5cGUuZG9jKTtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oYHR5cGUgJHt0eXBlLm5hbWV9IHtgKTtcbiAgICAgICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goZmllbGQgPT4ge1xuICAgICAgICAgICAgICAgIGdlblFMRG9jKCdcXHQnLCBmaWVsZC5kb2MpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHR5cGVEZWNsYXJhdGlvbiA9XG4gICAgICAgICAgICAgICAgICAgICdbJy5yZXBlYXQoZmllbGQuYXJyYXlEZXB0aCkgK1xuICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlLm5hbWUgK1xuICAgICAgICAgICAgICAgICAgICAnXScucmVwZWF0KGZpZWxkLmFycmF5RGVwdGgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHBhcmFtcyA9IGlzQmlnSW50KGZpZWxkLnR5cGUpXG4gICAgICAgICAgICAgICAgICAgID8gJyhmb3JtYXQ6IEJpZ0ludEZvcm1hdCknXG4gICAgICAgICAgICAgICAgICAgIDogJyc7XG4gICAgICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0JHtmaWVsZC5uYW1lfSR7cGFyYW1zfTogJHt0eXBlRGVjbGFyYXRpb259YCk7XG4gICAgICAgICAgICAgICAgY29uc3QgZW51bURlZiA9IGZpZWxkLmVudW1EZWY7XG4gICAgICAgICAgICAgICAgaWYgKGVudW1EZWYpIHtcbiAgICAgICAgICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0JHtmaWVsZC5uYW1lfV9uYW1lOiAke2VudW1EZWYubmFtZX1FbnVtYCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGB9YCk7XG4gICAgICAgIH1cbiAgICAgICAgcWwud3JpdGVMbigpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHByZXZlbnRUd2ljZShuYW1lOiBzdHJpbmcsIG5hbWVzOiBTZXQ8c3RyaW5nPiwgd29yazogKCkgPT4gdm9pZCkge1xuICAgICAgICBpZiAoIW5hbWVzLmhhcyhuYW1lKSkge1xuICAgICAgICAgICAgbmFtZXMuYWRkKG5hbWUpO1xuICAgICAgICAgICAgd29yaygpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuUUxGaWx0ZXJzRm9yQXJyYXlGaWVsZHModHlwZTogRGJUeXBlLCBxbE5hbWVzOiBTZXQ8c3RyaW5nPikge1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgbGV0IGl0ZW1UeXBlTmFtZSA9IGZpZWxkLnR5cGUubmFtZTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZmllbGQuYXJyYXlEZXB0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmlsdGVyTmFtZSA9IGAke2l0ZW1UeXBlTmFtZX1BcnJheUZpbHRlcmA7XG4gICAgICAgICAgICAgICAgcHJldmVudFR3aWNlKGZpbHRlck5hbWUsIHFsTmFtZXMsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcWwud3JpdGVMbihgaW5wdXQgJHtmaWx0ZXJOYW1lfSB7YCk7XG4gICAgICAgICAgICAgICAgICAgIFsnYW55JywgJ2FsbCddLmZvckVhY2goKG9wKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBxbC53cml0ZUxuKGBcXHQke29wfTogJHtpdGVtVHlwZU5hbWV9RmlsdGVyYCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBxbC53cml0ZUxuKCd9Jyk7XG4gICAgICAgICAgICAgICAgICAgIHFsLndyaXRlTG4oKTtcblxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGl0ZW1UeXBlTmFtZSArPSAnQXJyYXknO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5RTEZpbHRlcnNGb3JFbnVtTmFtZUZpZWxkcyh0eXBlOiBEYlR5cGUsIHFsTmFtZXM6IFNldDxzdHJpbmc+KSB7XG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBlbnVtRGVmID0gZmllbGQuZW51bURlZjtcbiAgICAgICAgICAgIGlmIChlbnVtRGVmKSB7XG4gICAgICAgICAgICAgICAgcHJldmVudFR3aWNlKGAke2VudW1EZWYubmFtZX1FbnVtRmlsdGVyYCwgcWxOYW1lcywgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBnZW5RTFNjYWxhclR5cGVzRmlsdGVyKGAke2VudW1EZWYubmFtZX1FbnVtYCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlblFMRmlsdGVyKHR5cGU6IERiVHlwZSwgcWxOYW1lczogU2V0PHN0cmluZz4pIHtcbiAgICAgICAgaWYgKHR5cGUuZmllbGRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGdlblFMRmlsdGVyc0ZvckFycmF5RmllbGRzKHR5cGUsIHFsTmFtZXMpO1xuICAgICAgICBnZW5RTEZpbHRlcnNGb3JFbnVtTmFtZUZpZWxkcyh0eXBlLCBxbE5hbWVzKTtcbiAgICAgICAgZ2VuUUxEb2MoJycsIHR5cGUuZG9jKTtcbiAgICAgICAgcWwud3JpdGVMbihgaW5wdXQgJHt0eXBlLm5hbWV9RmlsdGVyIHtgKTtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGdlblFMRG9jKCdcXHQnLCBmaWVsZC5kb2MpO1xuICAgICAgICAgICAgY29uc3QgdHlwZURlY2xhcmF0aW9uID0gZmllbGQudHlwZS5uYW1lICsgXCJBcnJheVwiLnJlcGVhdChmaWVsZC5hcnJheURlcHRoKTtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oYFxcdCR7ZmllbGQubmFtZX06ICR7dHlwZURlY2xhcmF0aW9ufUZpbHRlcmApO1xuICAgICAgICAgICAgY29uc3QgZW51bURlZiA9IGZpZWxkLmVudW1EZWY7XG4gICAgICAgICAgICBpZiAoZW51bURlZikge1xuICAgICAgICAgICAgICAgIHFsLndyaXRlTG4oYFxcdCR7ZmllbGQubmFtZX1fbmFtZTogJHtlbnVtRGVmLm5hbWV9RW51bUZpbHRlcmApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcWwud3JpdGVMbihgICAgIE9SOiAke3R5cGUubmFtZX1GaWx0ZXJgKTtcbiAgICAgICAgcWwud3JpdGVMbihgfWApO1xuICAgICAgICBxbC53cml0ZUxuKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuUUxTY2FsYXJUeXBlc0ZpbHRlcihuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgcWwud3JpdGVMbihgaW5wdXQgJHtuYW1lfUZpbHRlciB7YCk7XG4gICAgICAgIFsnZXEnLCAnbmUnLCAnZ3QnLCAnbHQnLCAnZ2UnLCAnbGUnXS5mb3JFYWNoKChvcCkgPT4ge1xuICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0JHtvcH06ICR7bmFtZX1gKTtcbiAgICAgICAgfSk7XG4gICAgICAgIFsnaW4nLCAnbm90SW4nXS5mb3JFYWNoKChvcCkgPT4ge1xuICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0JHtvcH06IFske25hbWV9XWApO1xuICAgICAgICB9KTtcbiAgICAgICAgcWwud3JpdGVMbignfScpO1xuICAgICAgICBxbC53cml0ZUxuKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuUUxRdWVyaWVzKHR5cGVzOiBEYlR5cGVbXSkge1xuICAgICAgICBxbC53cml0ZUJsb2NrTG4oYFxuICAgICAgICBcIlNwZWNpZnkgc29ydCBvcmRlciBkaXJlY3Rpb25cIlxuICAgICAgICBlbnVtIFF1ZXJ5T3JkZXJCeURpcmVjdGlvbiB7XG4gICAgICAgICAgICBcIkRvY3VtZW50cyB3aWxsIGJlIHNvcnRlZCBpbiBhc2NlbmRlZCBvcmRlciAoZS5nLiBmcm9tIEEgdG8gWilcIlxuICAgICAgICAgICAgQVNDXG4gICAgICAgICAgICBcIkRvY3VtZW50cyB3aWxsIGJlIHNvcnRlZCBpbiBkZXNjZW5kYW50IG9yZGVyIChlLmcuIGZyb20gWiB0byBBKVwiXG4gICAgICAgICAgICBERVNDXG4gICAgICAgIH1cblxuICAgICAgICBcbiAgICAgICAgXCJcIlwiXG4gICAgICAgIFNwZWNpZnkgaG93IHRvIHNvcnQgcmVzdWx0cy5cbiAgICAgICAgWW91IGNhbiBzb3J0IGRvY3VtZW50cyBpbiByZXN1bHQgc2V0IHVzaW5nIG1vcmUgdGhhbiBvbmUgZmllbGQuXG4gICAgICAgIFwiXCJcIlxuICAgICAgICBpbnB1dCBRdWVyeU9yZGVyQnkge1xuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgICBQYXRoIHRvIGZpZWxkIHdoaWNoIG11c3QgYmUgdXNlZCBhcyBhIHNvcnQgY3JpdGVyaWEuXG4gICAgICAgICAgICBJZiBmaWVsZCByZXNpZGVzIGRlZXAgaW4gc3RydWN0dXJlIHBhdGggaXRlbXMgbXVzdCBiZSBzZXBhcmF0ZWQgd2l0aCBkb3QgKGUuZy4gJ2Zvby5iYXIuYmF6JykuXG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICAgIHBhdGg6IFN0cmluZ1xuICAgICAgICAgICAgXCJTb3J0IG9yZGVyIGRpcmVjdGlvblwiXG4gICAgICAgICAgICBkaXJlY3Rpb246IFF1ZXJ5T3JkZXJCeURpcmVjdGlvblxuICAgICAgICB9XG5cbiAgICAgICAgdHlwZSBRdWVyeSB7XG4gICAgICAgIGApO1xuXG4gICAgICAgIHR5cGVzLmZvckVhY2goKHR5cGU6IERiVHlwZSkgPT4ge1xuICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0JHt0eXBlLmNvbGxlY3Rpb24gfHwgJyd9KGZpbHRlcjogJHt0eXBlLm5hbWV9RmlsdGVyLCBvcmRlckJ5OiBbUXVlcnlPcmRlckJ5XSwgbGltaXQ6IEludCwgdGltZW91dDogRmxvYXQsIGFjY2Vzc0tleTogU3RyaW5nLCBvcGVyYXRpb25JZDogU3RyaW5nKTogWyR7dHlwZS5uYW1lfV1gKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcWwud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgfVxuXG4gICAgICAgIGApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlblFMU3Vic2NyaXB0aW9ucyh0eXBlczogRGJUeXBlW10pIHtcbiAgICAgICAgcWwud3JpdGVMbigndHlwZSBTdWJzY3JpcHRpb24geycpO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGBcXHQke3R5cGUuY29sbGVjdGlvbiB8fCAnJ30oZmlsdGVyOiAke3R5cGUubmFtZX1GaWx0ZXIsIGFjY2Vzc0tleTogU3RyaW5nKTogJHt0eXBlLm5hbWV9YCk7XG4gICAgICAgIH0pO1xuICAgICAgICBxbC53cml0ZUxuKCd9Jyk7XG4gICAgfVxuXG5cbiAgICBmdW5jdGlvbiBnZXRTY2FsYXJSZXNvbHZlck5hbWUoZmllbGQ6IERiRmllbGQpOiBzdHJpbmcge1xuICAgICAgICBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDY0KSB7XG4gICAgICAgICAgICByZXR1cm4gJ2JpZ1VJbnQxJztcbiAgICAgICAgfVxuICAgICAgICBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDEwMjQpIHtcbiAgICAgICAgICAgIHJldHVybiAnYmlnVUludDInO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnc2NhbGFyJztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5KU0ZpbHRlcnNGb3JBcnJheUZpZWxkcyh0eXBlOiBEYlR5cGUsIGpzTmFtZXM6IFNldDxzdHJpbmc+KSB7XG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBsZXQgaXRlbVR5cGVOYW1lID0gZmllbGQudHlwZS5uYW1lO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmaWVsZC5hcnJheURlcHRoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWx0ZXJOYW1lID0gYCR7aXRlbVR5cGVOYW1lfUFycmF5YDtcbiAgICAgICAgICAgICAgICBwcmV2ZW50VHdpY2UoZmlsdGVyTmFtZSwganNOYW1lcywgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpdGVtUmVzb2x2ZXJOYW1lID0gKGkgPT09IDAgJiYgZmllbGQudHlwZS5jYXRlZ29yeSA9PT0gRGJUeXBlQ2F0ZWdvcnkuc2NhbGFyKVxuICAgICAgICAgICAgICAgICAgICAgICAgPyBnZXRTY2FsYXJSZXNvbHZlck5hbWUoZmllbGQpXG4gICAgICAgICAgICAgICAgICAgICAgICA6IGl0ZW1UeXBlTmFtZTtcbiAgICAgICAgICAgICAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgICAgICAgICBjb25zdCAke2ZpbHRlck5hbWV9ID0gYXJyYXkoKCkgPT4gJHtpdGVtUmVzb2x2ZXJOYW1lfSk7XG4gICAgICAgICAgICAgICAgYCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaXRlbVR5cGVOYW1lICs9ICdBcnJheSc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkpTU3RydWN0RmlsdGVyKHR5cGU6IERiVHlwZSkge1xuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBjb25zdCAke3R5cGUubmFtZX0gPSBzdHJ1Y3Qoe1xuICAgIGApO1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgbGV0IHR5cGVEZWNsYXJhdGlvbjogP3N0cmluZyA9IG51bGw7XG4gICAgICAgICAgICBjb25zdCBqb2luID0gZmllbGQuam9pbjtcbiAgICAgICAgICAgIGlmIChqb2luKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3VmZml4ID0gZmllbGQuYXJyYXlEZXB0aCA+IDAgPyAnQXJyYXknIDogJyc7XG4gICAgICAgICAgICAgICAgdHlwZURlY2xhcmF0aW9uID0gYGpvaW4ke3N1ZmZpeH0oJyR7am9pbi5vbn0nLCAnJHtqb2luLnJlZk9ufScsICcke2ZpZWxkLnR5cGUuY29sbGVjdGlvbiB8fCAnJ30nLCAoKSA9PiAke2ZpZWxkLnR5cGUubmFtZX0pYDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQuYXJyYXlEZXB0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB0eXBlRGVjbGFyYXRpb24gPVxuICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlLm5hbWUgK1xuICAgICAgICAgICAgICAgICAgICAnQXJyYXknLnJlcGVhdChmaWVsZC5hcnJheURlcHRoKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZS5jYXRlZ29yeSA9PT0gRGJUeXBlQ2F0ZWdvcnkuc2NhbGFyKSB7XG4gICAgICAgICAgICAgICAgdHlwZURlY2xhcmF0aW9uID0gZ2V0U2NhbGFyUmVzb2x2ZXJOYW1lKGZpZWxkKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZS5maWVsZHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHR5cGVEZWNsYXJhdGlvbiA9IGZpZWxkLnR5cGUubmFtZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0eXBlRGVjbGFyYXRpb24pIHtcbiAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgJHtmaWVsZC5uYW1lfTogJHt0eXBlRGVjbGFyYXRpb259LGApO1xuICAgICAgICAgICAgICAgIGNvbnN0IGVudW1EZWYgPSBmaWVsZC5lbnVtRGVmO1xuICAgICAgICAgICAgICAgIGlmIChlbnVtRGVmKSB7XG4gICAgICAgICAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAke2ZpZWxkLm5hbWV9X25hbWU6IGVudW1OYW1lKCcke2ZpZWxkLm5hbWV9JywgJHtzdHJpbmdpZnlFbnVtVmFsdWVzKGVudW1EZWYudmFsdWVzKX0pLGApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIH0ke3R5cGUuY29sbGVjdGlvbiA/ICcsIHRydWUnIDogJyd9KTtcblxuICAgIGApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkpTVW5pb25SZXNvbHZlcih0eXBlOiBEYlR5cGUpIHtcbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgY29uc3QgJHt0eXBlLm5hbWV9UmVzb2x2ZXIgPSB7XG4gICAgICAgICAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xuICAgICAgICBgKTtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgodmFyaWFudCkgPT4ge1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICBpZiAoJyR7dmFyaWFudC5uYW1lfScgaW4gb2JqKSB7YCk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICByZXR1cm4gJyR7dW5pb25WYXJpYW50VHlwZSh0eXBlLCB2YXJpYW50KX0nO2ApO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICB9YCk7XG4gICAgICAgIH0pO1xuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkpTRmlsdGVyKHR5cGU6IERiVHlwZSwganNOYW1lczogU2V0PHN0cmluZz4pIHtcbiAgICAgICAgaWYgKHR5cGUuZmllbGRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS51bmlvbikge1xuICAgICAgICAgICAgLy8gZ2VuSlNGaWx0ZXJzRm9yVW5pb25WYXJpYW50cyh0eXBlLCBqc05hbWVzKTtcbiAgICAgICAgfVxuICAgICAgICBnZW5KU0ZpbHRlcnNGb3JBcnJheUZpZWxkcyh0eXBlLCBqc05hbWVzKTtcbiAgICAgICAgZ2VuSlNTdHJ1Y3RGaWx0ZXIodHlwZSk7XG4gICAgICAgIGlmICh0eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS51bmlvbikge1xuICAgICAgICAgICAgZ2VuSlNVbmlvblJlc29sdmVyKHR5cGUpO1xuICAgICAgICB9XG5cblxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlIGN1c3RvbSByZXNvbHZlcnMgZm9yIHR5cGVzIHdpdGg6XG4gICAgICogLSBpZCBmaWVsZFxuICAgICAqIC0gam9pbiBmaWVsZHNcbiAgICAgKiAtIHU2NCBhbmQgaGlnaGVyIGZpZWxkc1xuICAgICAqIEBwYXJhbSB0eXBlXG4gICAgICovXG4gICAgZnVuY3Rpb24gZ2VuSlNDdXN0b21SZXNvbHZlcnModHlwZTogRGJUeXBlKSB7XG4gICAgICAgIGNvbnN0IGpvaW5GaWVsZHMgPSB0eXBlLmZpZWxkcy5maWx0ZXIoeCA9PiAhIXguam9pbik7XG4gICAgICAgIGNvbnN0IGJpZ1VJbnRGaWVsZHMgPSB0eXBlLmZpZWxkcy5maWx0ZXIoKHg6IERiRmllbGQpID0+IGlzQmlnSW50KHgudHlwZSkpO1xuICAgICAgICBjb25zdCBlbnVtRmllbGRzID0gdHlwZS5maWVsZHMuZmlsdGVyKHggPT4geC5lbnVtRGVmKTtcbiAgICAgICAgY29uc3QgY3VzdG9tUmVzb2x2ZXJSZXF1aXJlZCA9IHR5cGUuY29sbGVjdGlvblxuICAgICAgICAgICAgfHwgam9pbkZpZWxkcy5sZW5ndGggPiAwXG4gICAgICAgICAgICB8fCBiaWdVSW50RmllbGRzLmxlbmd0aCA+IDBcbiAgICAgICAgICAgIHx8IGVudW1GaWVsZHMubGVuZ3RoID4gMDtcbiAgICAgICAgaWYgKCFjdXN0b21SZXNvbHZlclJlcXVpcmVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAganMud3JpdGVMbihgICAgICAgICAke3R5cGUubmFtZX06IHtgKTtcbiAgICAgICAgaWYgKHR5cGUuY29sbGVjdGlvbikge1xuICAgICAgICAgICAganMud3JpdGVMbignICAgICAgICAgICAgaWQocGFyZW50KSB7Jyk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKCcgICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5OycpO1xuICAgICAgICAgICAganMud3JpdGVMbignICAgICAgICAgICAgfSwnKTtcbiAgICAgICAgfVxuICAgICAgICBqb2luRmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBqb2luID0gZmllbGQuam9pbjtcbiAgICAgICAgICAgIGlmICgham9pbikge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IG9uRmllbGQgPSB0eXBlLmZpZWxkcy5maW5kKHggPT4geC5uYW1lID09PSBqb2luLm9uKTtcbiAgICAgICAgICAgIGlmICghb25GaWVsZCkge1xuICAgICAgICAgICAgICAgIHRocm93ICdKb2luIG9uIGZpZWxkIGRvZXMgbm90IGV4aXN0Lic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBvbiA9IGpvaW4ub24gPT09ICdpZCcgPyAnX2tleScgOiAoam9pbi5vbiB8fCAnX2tleScpO1xuICAgICAgICAgICAgY29uc3QgcmVmT24gPSBqb2luLnJlZk9uID09PSAnaWQnID8gJ19rZXknIDogKGpvaW4ucmVmT24gfHwgJ19rZXknKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbGxlY3Rpb24gPSBmaWVsZC50eXBlLmNvbGxlY3Rpb247XG4gICAgICAgICAgICBpZiAoIWNvbGxlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICB0aHJvdyAnSm9pbmVkIHR5cGUgaXMgbm90IGEgY29sbGVjdGlvbi4nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgJHtmaWVsZC5uYW1lfShwYXJlbnQsIF9hcmdzLCBjb250ZXh0KSB7YCk7XG4gICAgICAgICAgICBjb25zdCBwcmUgPSBqb2luLnByZUNvbmRpdGlvbiA/IGAke2pvaW4ucHJlQ29uZGl0aW9ufSA/IGAgOiAnJztcbiAgICAgICAgICAgIGNvbnN0IHBvc3QgPSBqb2luLnByZUNvbmRpdGlvbiA/IGAgOiBudWxsYCA6ICcnO1xuICAgICAgICAgICAgaWYgKGZpZWxkLmFycmF5RGVwdGggPT09IDApIHtcbiAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAgICAgcmV0dXJuICR7cHJlfWNvbnRleHQuZGIuJHtjb2xsZWN0aW9ufS53YWl0Rm9yRG9jKHBhcmVudC4ke29ufSwgJyR7cmVmT259Jykke3Bvc3R9O2ApO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC5hcnJheURlcHRoID09PSAxKSB7XG4gICAgICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgICAgIHJldHVybiAke3ByZX1jb250ZXh0LmRiLiR7Y29sbGVjdGlvbn0ud2FpdEZvckRvY3MocGFyZW50LiR7b259LCAnJHtyZWZPbn0nKSR7cG9zdH07YCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93ICdKb2lucyBvbiBhIG5lc3RlZCBhcnJheXMgZG9lcyBub3Qgc3VwcG9ydGVkLic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICB9LGApO1xuICAgICAgICB9KTtcbiAgICAgICAgYmlnVUludEZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcHJlZml4TGVuZ3RoID0gZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDY0ID8gMSA6IDI7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAke2ZpZWxkLm5hbWV9KHBhcmVudCwgYXJncykge2ApO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgke3ByZWZpeExlbmd0aH0sIHBhcmVudC4ke2ZpZWxkLm5hbWV9LCBhcmdzKTtgKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgIH0sYCk7XG4gICAgICAgIH0pO1xuICAgICAgICBlbnVtRmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBlbnVtRGVmID0gZmllbGQuZW51bURlZjtcbiAgICAgICAgICAgIGlmIChlbnVtRGVmKSB7XG4gICAgICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgJHtmaWVsZC5uYW1lfV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCcke2ZpZWxkLm5hbWV9JywgJHtzdHJpbmdpZnlFbnVtVmFsdWVzKGVudW1EZWYudmFsdWVzKX0pLGApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAganMud3JpdGVMbihgICAgICAgICB9LGApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkpTU2NhbGFyRmllbGRzKHR5cGU6IERiVHlwZSwgcGFyZW50UGF0aCwgcGFyZW50RG9jUGF0aDogc3RyaW5nKSB7XG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKGZpZWxkOiBEYkZpZWxkKSA9PiB7XG4gICAgICAgICAgICBpZiAoZmllbGQuam9pbiB8fCBmaWVsZC5lbnVtRGVmKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgZG9jTmFtZSA9IGZpZWxkLm5hbWUgPT09ICdpZCcgPyAnX2tleScgOiBmaWVsZC5uYW1lO1xuICAgICAgICAgICAgY29uc3QgcGF0aCA9IGAke3BhcmVudFBhdGh9LiR7ZmllbGQubmFtZX1gO1xuICAgICAgICAgICAgY29uc3QgZG9jUGF0aCA9IGAke3BhcmVudERvY1BhdGh9LiR7ZG9jTmFtZX0ke2ZpZWxkLmFycmF5RGVwdGggPiAwID8gJ1sqXScgOiAnJ31gO1xuICAgICAgICAgICAgc3dpdGNoKGZpZWxkLnR5cGUuY2F0ZWdvcnkpIHtcbiAgICAgICAgICAgIGNhc2UgXCJzY2FsYXJcIjpcbiAgICAgICAgICAgICAgICBsZXQgdHlwZU5hbWU7XG4gICAgICAgICAgICAgICAgaWYgKGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLmJvb2xlYW4pIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWUgPSAnYm9vbGVhbic7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC50eXBlID09PSBzY2FsYXJUeXBlcy5mbG9hdCkge1xuICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZSA9ICdudW1iZXInO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMuaW50KSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lID0gJ251bWJlcic7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC50eXBlID09PSBzY2FsYXJUeXBlcy51aW50NjQpIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWUgPSAndWludDY0JztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLnVpbnQxMDI0KSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lID0gJ3VpbnQxMDI0JztcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZSA9ICdzdHJpbmcnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGBzY2FsYXJGaWVsZHMuc2V0KCcke3BhdGh9JywgeyB0eXBlOiAnJHt0eXBlTmFtZX0nLCBwYXRoOiAnJHtkb2NQYXRofScgfSk7YCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwic3RydWN0XCI6XG4gICAgICAgICAgICBjYXNlIFwidW5pb25cIjpcbiAgICAgICAgICAgICAgICBnZW5KU1NjYWxhckZpZWxkcyhmaWVsZC50eXBlLCBwYXRoLCBkb2NQYXRoKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG5cbiAgICBmdW5jdGlvbiBnZW5KU1R5cGVSZXNvbHZlcnNGb3JVbmlvbih0eXBlOiBEYlR5cGUpIHtcbiAgICAgICAgaWYgKHR5cGUuY2F0ZWdvcnkgPT09IERiVHlwZUNhdGVnb3J5LnVuaW9uKSB7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICR7dHlwZS5uYW1lfTogJHt0eXBlLm5hbWV9UmVzb2x2ZXIsYCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5lcmF0ZSh0eXBlczogRGJUeXBlW10pIHtcblxuICAgICAgICAvLyBRTFxuXG4gICAgICAgIHFsLndyaXRlQmxvY2tMbihgXG4gICAgICAgIFwiXCJcIlxuICAgICAgICBEdWUgdG8gR3JhcGhRTCBsaW1pdGF0aW9ucyBiaWcgbnVtYmVycyBhcmUgcmV0dXJuZWQgYXMgYSBzdHJpbmcuXG4gICAgICAgIFlvdSBjYW4gc3BlY2lmeSBmb3JtYXQgdXNlZCB0byBzdHJpbmcgcmVwcmVzZW50YXRpb24gZm9yIGJpZyBpbnRlZ2Vycy5cbiAgICAgICAgXCJcIlwiXG4gICAgICAgIGVudW0gQmlnSW50Rm9ybWF0IHtcbiAgICAgICAgICAgIFwiIEhleGFkZWNpbWFsIHJlcHJlc2VudGF0aW9uIHN0YXJ0ZWQgd2l0aCAweCAoZGVmYXVsdCkgXCJcbiAgICAgICAgICAgIEhFWFxuICAgICAgICAgICAgXCIgRGVjaW1hbCByZXByZXNlbnRhdGlvbiBcIlxuICAgICAgICAgICAgREVDXG4gICAgICAgIH1cbiAgICAgICAgYCk7XG4gICAgICAgIFsnU3RyaW5nJywgJ0Jvb2xlYW4nLCAnSW50JywgJ0Zsb2F0J10uZm9yRWFjaChnZW5RTFNjYWxhclR5cGVzRmlsdGVyKTtcbiAgICAgICAgZ2VuUUxFbnVtVHlwZXMoKTtcbiAgICAgICAgdHlwZXMuZm9yRWFjaCh0eXBlID0+IGdlblFMVHlwZURlY2xhcmF0aW9uKHR5cGUpKTtcbiAgICAgICAgY29uc3QgcWxBcnJheUZpbHRlcnMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICAgICAgdHlwZXMuZm9yRWFjaCh0eXBlID0+IGdlblFMRmlsdGVyKHR5cGUsIHFsQXJyYXlGaWx0ZXJzKSk7XG5cbiAgICAgICAgY29uc3QgY29sbGVjdGlvbnMgPSB0eXBlcy5maWx0ZXIodCA9PiAhIXQuY29sbGVjdGlvbik7XG4gICAgICAgIGdlblFMUXVlcmllcyhjb2xsZWN0aW9ucyk7XG4gICAgICAgIGdlblFMU3Vic2NyaXB0aW9ucyhjb2xsZWN0aW9ucyk7XG5cbiAgICAgICAgLy8gSlNcblxuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBjb25zdCB7XG4gICAgICAgICAgICBzY2FsYXIsXG4gICAgICAgICAgICBiaWdVSW50MSxcbiAgICAgICAgICAgIGJpZ1VJbnQyLFxuICAgICAgICAgICAgcmVzb2x2ZUJpZ1VJbnQsXG4gICAgICAgICAgICBzdHJ1Y3QsXG4gICAgICAgICAgICBhcnJheSxcbiAgICAgICAgICAgIGpvaW4sXG4gICAgICAgICAgICBqb2luQXJyYXksXG4gICAgICAgICAgICBlbnVtTmFtZSxcbiAgICAgICAgICAgIGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIsXG4gICAgICAgIH0gPSByZXF1aXJlKCcuL2RiLXR5cGVzLmpzJyk7XG4gICAgICAgIGApO1xuICAgICAgICBjb25zdCBqc0FycmF5RmlsdGVycyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKHR5cGUgPT4gZ2VuSlNGaWx0ZXIodHlwZSwganNBcnJheUZpbHRlcnMpKTtcblxuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBmdW5jdGlvbiBjcmVhdGVSZXNvbHZlcnMoZGIpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgIGApO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgICAgICAgICBnZW5KU0N1c3RvbVJlc29sdmVycyh0eXBlKTtcbiAgICAgICAgICAgIGdlbkpTVHlwZVJlc29sdmVyc0ZvclVuaW9uKHR5cGUpO1xuICAgICAgICB9KTtcbiAgICAgICAganMud3JpdGVMbignICAgICAgICBRdWVyeTogeycpO1xuICAgICAgICBjb2xsZWN0aW9ucy5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAke3R5cGUuY29sbGVjdGlvbiB8fCAnJ306IGRiLiR7dHlwZS5jb2xsZWN0aW9uIHx8ICcnfS5xdWVyeVJlc29sdmVyKCksYClcbiAgICAgICAgfSk7XG4gICAgICAgIGpzLndyaXRlTG4oJyAgICAgICAgfSwnKTtcbiAgICAgICAganMud3JpdGVMbignICAgICAgICBTdWJzY3JpcHRpb246IHsnKTtcbiAgICAgICAgY29sbGVjdGlvbnMuZm9yRWFjaCgodHlwZSkgPT4ge1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgJHt0eXBlLmNvbGxlY3Rpb24gfHwgJyd9OiBkYi4ke3R5cGUuY29sbGVjdGlvbiB8fCAnJ30uc3Vic2NyaXB0aW9uUmVzb2x2ZXIoKSxgKVxuICAgICAgICB9KTtcbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBgKTtcblxuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBjb25zdCBzY2FsYXJGaWVsZHMgPSBuZXcgTWFwKCk7XG4gICAgICAgIGApO1xuICAgICAgICBjb2xsZWN0aW9ucy5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgICAgICAgICBnZW5KU1NjYWxhckZpZWxkcyh0eXBlLCB0eXBlLmNvbGxlY3Rpb24sICdkb2MnKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgICAgICAgICBzY2FsYXJGaWVsZHMsXG4gICAgICAgICAgICBjcmVhdGVSZXNvbHZlcnMsXG4gICAgICAgIGApO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKHR5cGUgPT4ganMud3JpdGVMbihgICAgICR7dHlwZS5uYW1lfSxgKSk7XG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIH07XG4gICAgICAgIGApO1xuICAgIH1cblxuICAgIGNvbnN0IHNjaGVtYSA9IHBhcnNlVHlwZURlZihzY2hlbWFEZWYpO1xuXG4gICAgaWYgKHNjaGVtYS5jbGFzcykge1xuICAgICAgICBwYXJzZURiVHlwZXMoc2NoZW1hLmNsYXNzLnR5cGVzKTtcbiAgICAgICAgZ2VuZXJhdGUoZGJUeXBlcyk7XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBlOiBJbnRFbnVtRGVmIG9mIGVudW1UeXBlcy52YWx1ZXMoKSkge1xuICAgICAgICBjb25zb2xlLmxvZyhgZXhwb3J0IGNvbnN0IFEke2UubmFtZX0gPSB7YCk7XG4gICAgICAgIGNvbnNvbGUubG9nKE9iamVjdC5lbnRyaWVzKGUudmFsdWVzKS5tYXAoKFtuYW1lLCB2YWx1ZV0pID0+IHtcbiAgICAgICAgICAgIHJldHVybiBgICAgICR7bmFtZX06ICR7KHZhbHVlOiBhbnkpfSxgO1xuICAgICAgICB9KS5qb2luKCdcXG4nKSk7XG4gICAgICAgIGNvbnNvbGUubG9nKGB9O1xcbmApO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIHFsOiBxbC5nZW5lcmF0ZWQoKSxcbiAgICAgICAganM6IGpzLmdlbmVyYXRlZCgpLFxuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgbWFpbjtcbiJdfQ==