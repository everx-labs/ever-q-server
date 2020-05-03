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
      doc: getDocMD(schemaField),
      isUnixTime: false
    };

    while (schemaType.array) {
      field.arrayDepth += 1;
      schemaType = schemaType.array;
    }

    const ex = schemaType._;
    const enumDef = ex && ex.enum || null;

    if (enumDef) {
      field.enumDef = enumDef;
      enumTypes.set(enumDef.name, enumDef);
    }

    const join = ex && ex.join;

    if (join) {
      field.join = join;
    }

    if (ex && ex.isUnixTime) {
      field.isUnixTime = true;
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
        isUnixTime: false,
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
        let params = '';

        if (isBigInt(field.type)) {
          params = '(format: BigIntFormat)';
        } else if (field.join) {
          params = '(timeout: Int)';
        }

        ql.writeLn(`\t${field.name}${params}: ${typeDeclaration}`);
        const enumDef = field.enumDef;

        if (enumDef) {
          ql.writeLn(`\t${field.name}_name: ${enumDef.name}Enum`);
        }

        if (field.isUnixTime) {
          ql.writeLn(`\t${field.name}_string: String`);
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
    const unixTimeFields = type.fields.filter(x => x.isUnixTime);
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

      js.writeLn(`            ${field.name}(parent, args, context) {`);
      const pre = join.preCondition ? `${join.preCondition} ? ` : '';
      const post = join.preCondition ? ` : null` : '';

      if (field.arrayDepth === 0) {
        js.writeLn(`                return ${pre}context.db.${collection}.waitForDoc(parent.${on}, '${refOn}', args)${post};`);
      } else if (field.arrayDepth === 1) {
        js.writeLn(`                return ${pre}context.db.${collection}.waitForDocs(parent.${on}, '${refOn}', args)${post};`);
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
    unixTimeFields.forEach(field => {
      js.writeLn(`            ${field.name}_string(parent, args) {`);
      js.writeLn(`                return resolveUnixTimeString(parent.${field.name});`);
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
            resolveUnixTimeString,
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
      genJSScalarFields(type, type.collection || '', 'doc');
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NlcnZlci9zY2hlbWEvcWwtanMtZ2VuZXJhdG9yLmpzIl0sIm5hbWVzIjpbIkRiVHlwZUNhdGVnb3J5IiwidW5yZXNvbHZlZCIsInNjYWxhciIsInVuaW9uIiwic3RydWN0Iiwic2NhbGFyVHlwZSIsIm5hbWUiLCJjYXRlZ29yeSIsImZpZWxkcyIsImRvYyIsInNjYWxhclR5cGVzIiwiaW50IiwidWludDY0IiwidWludDEwMjQiLCJmbG9hdCIsImJvb2xlYW4iLCJzdHJpbmciLCJpc0JpZ0ludCIsInR5cGUiLCJ1bnJlc29sdmVkVHlwZSIsImlzTG93ZXJDYXNlZCIsInMiLCJsIiwidG9Mb3dlckNhc2UiLCJ1IiwidG9VcHBlckNhc2UiLCJpc1VwcGVyQ2FzZWQiLCJ0b0FsbENhcHMiLCJyZXN1bHQiLCJpIiwibGVuZ3RoIiwidG9FbnVtU3R5bGUiLCJzdWJzdHIiLCJzdHJpbmdpZnlFbnVtVmFsdWVzIiwidmFsdWVzIiwiT2JqZWN0IiwiZW50cmllcyIsIm1hcCIsInZhbHVlIiwiam9pbiIsImdldERvY01EIiwic2NoZW1hIiwibWQiLCJtYWluIiwic2NoZW1hRGVmIiwiZGJUeXBlcyIsImxhc3RSZXBvcnRlZFR5cGUiLCJlbnVtVHlwZXMiLCJNYXAiLCJyZXBvcnRUeXBlIiwiZmllbGQiLCJjb25zb2xlIiwibG9nIiwicGFyc2VEYkZpZWxkIiwidHlwZU5hbWUiLCJzY2hlbWFGaWVsZCIsInNjaGVtYVR5cGUiLCJhcnJheURlcHRoIiwiaXNVbml4VGltZSIsImFycmF5IiwiZXgiLCJfIiwiZW51bURlZiIsImVudW0iLCJzZXQiLCJyZWYiLCJib29sIiwidW5zaWduZWQiLCJzaXplIiwiRXJyb3IiLCJKU09OIiwic3RyaW5naWZ5IiwicHJvY2VzcyIsImV4aXQiLCJ1bndyYXBBcnJheXMiLCJwYXJzZURiVHlwZSIsImNvbGxlY3Rpb24iLCJwdXNoIiwiZm9yRWFjaCIsInVud3JhcHBlZCIsIm93blR5cGUiLCJwYXJzZURiVHlwZXMiLCJ0eXBlcyIsInJlc29sdmluZyIsIlNldCIsInJlc29sdmVkIiwib3JkZXJlZFJlc29sdmVkIiwidCIsInJlc29sdmVUeXBlIiwiaGFzIiwiYWRkIiwiZ2V0IiwiZGVsZXRlIiwicWwiLCJXcml0ZXIiLCJqcyIsImdlblFMRG9jIiwicHJlZml4IiwidHJpbSIsImxpbmVzIiwic3BsaXQiLCJpbmNsdWRlcyIsIndyaXRlTG4iLCJsaW5lIiwidW5pb25WYXJpYW50VHlwZSIsInZhcmlhbnQiLCJnZW5RTFR5cGVEZWNsYXJhdGlvbnNGb3JVbmlvblZhcmlhbnRzIiwid3JpdGVCbG9ja0xuIiwiZ2VuUUxFbnVtVHlwZXMiLCJrZXlzIiwiZ2VuUUxUeXBlRGVjbGFyYXRpb24iLCJ0eXBlRGVjbGFyYXRpb24iLCJyZXBlYXQiLCJwYXJhbXMiLCJwcmV2ZW50VHdpY2UiLCJuYW1lcyIsIndvcmsiLCJnZW5RTEZpbHRlcnNGb3JBcnJheUZpZWxkcyIsInFsTmFtZXMiLCJpdGVtVHlwZU5hbWUiLCJmaWx0ZXJOYW1lIiwib3AiLCJnZW5RTEZpbHRlcnNGb3JFbnVtTmFtZUZpZWxkcyIsImdlblFMU2NhbGFyVHlwZXNGaWx0ZXIiLCJnZW5RTEZpbHRlciIsImdlblFMUXVlcmllcyIsImdlblFMU3Vic2NyaXB0aW9ucyIsImdldFNjYWxhclJlc29sdmVyTmFtZSIsImdlbkpTRmlsdGVyc0ZvckFycmF5RmllbGRzIiwianNOYW1lcyIsIml0ZW1SZXNvbHZlck5hbWUiLCJnZW5KU1N0cnVjdEZpbHRlciIsInN1ZmZpeCIsIm9uIiwicmVmT24iLCJnZW5KU1VuaW9uUmVzb2x2ZXIiLCJnZW5KU0ZpbHRlciIsImdlbkpTQ3VzdG9tUmVzb2x2ZXJzIiwiam9pbkZpZWxkcyIsImZpbHRlciIsIngiLCJiaWdVSW50RmllbGRzIiwidW5peFRpbWVGaWVsZHMiLCJlbnVtRmllbGRzIiwiY3VzdG9tUmVzb2x2ZXJSZXF1aXJlZCIsIm9uRmllbGQiLCJmaW5kIiwicHJlIiwicHJlQ29uZGl0aW9uIiwicG9zdCIsInByZWZpeExlbmd0aCIsImdlbkpTU2NhbGFyRmllbGRzIiwicGFyZW50UGF0aCIsInBhcmVudERvY1BhdGgiLCJkb2NOYW1lIiwicGF0aCIsImRvY1BhdGgiLCJnZW5KU1R5cGVSZXNvbHZlcnNGb3JVbmlvbiIsImdlbmVyYXRlIiwicWxBcnJheUZpbHRlcnMiLCJjb2xsZWN0aW9ucyIsImpzQXJyYXlGaWx0ZXJzIiwiY2xhc3MiLCJlIiwiZ2VuZXJhdGVkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBRUE7O0FBRUE7O0FBRUEsTUFBTUEsY0FBYyxHQUFHO0FBQ25CQyxFQUFBQSxVQUFVLEVBQUUsWUFETztBQUVuQkMsRUFBQUEsTUFBTSxFQUFFLFFBRlc7QUFHbkJDLEVBQUFBLEtBQUssRUFBRSxPQUhZO0FBSW5CQyxFQUFBQSxNQUFNLEVBQUU7QUFKVyxDQUF2Qjs7QUF1Q0EsU0FBU0MsVUFBVCxDQUFvQkMsSUFBcEIsRUFBMEM7QUFDdEMsU0FBTztBQUNIQSxJQUFBQSxJQURHO0FBRUhDLElBQUFBLFFBQVEsRUFBRVAsY0FBYyxDQUFDRSxNQUZ0QjtBQUdITSxJQUFBQSxNQUFNLEVBQUUsRUFITDtBQUlIQyxJQUFBQSxHQUFHLEVBQUU7QUFKRixHQUFQO0FBTUg7O0FBRUQsTUFBTUMsV0FBVyxHQUFHO0FBQ2hCQyxFQUFBQSxHQUFHLEVBQUVOLFVBQVUsQ0FBQyxLQUFELENBREM7QUFFaEJPLEVBQUFBLE1BQU0sRUFBRVAsVUFBVSxDQUFDLFFBQUQsQ0FGRjtBQUdoQlEsRUFBQUEsUUFBUSxFQUFFUixVQUFVLENBQUMsUUFBRCxDQUhKO0FBSWhCUyxFQUFBQSxLQUFLLEVBQUVULFVBQVUsQ0FBQyxPQUFELENBSkQ7QUFLaEJVLEVBQUFBLE9BQU8sRUFBRVYsVUFBVSxDQUFDLFNBQUQsQ0FMSDtBQU1oQlcsRUFBQUEsTUFBTSxFQUFFWCxVQUFVLENBQUMsUUFBRDtBQU5GLENBQXBCOztBQVNBLFNBQVNZLFFBQVQsQ0FBa0JDLElBQWxCLEVBQXlDO0FBQ3JDLFNBQU9BLElBQUksS0FBS1IsV0FBVyxDQUFDRyxRQUFyQixJ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LENBQUN5SCxLQUFQLENBQWFoRixLQUFkLENBQVo7QUFDQTRFLElBQUFBLFFBQVEsQ0FBQ2pILE9BQUQsQ0FBUjtBQUNIOztBQUVELE9BQUssTUFBTXNILENBQVgsSUFBNEJwSCxTQUFTLENBQUNiLE1BQVYsRUFBNUIsRUFBZ0Q7QUFDNUNpQixJQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBYSxpQkFBZ0IrRyxDQUFDLENBQUM3SixJQUFLLE1BQXBDO0FBQ0E2QyxJQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWWpCLE1BQU0sQ0FBQ0MsT0FBUCxDQUFlK0gsQ0FBQyxDQUFDakksTUFBakIsRUFBeUJHLEdBQXpCLENBQTZCLENBQUMsQ0FBQy9CLElBQUQsRUFBT2dDLEtBQVAsQ0FBRCxLQUFtQjtBQUN4RCxhQUFRLE9BQU1oQyxJQUFLLEtBQUtnQyxLQUFZLEdBQXBDO0FBQ0gsS0FGVyxFQUVUQyxJQUZTLENBRUosSUFGSSxDQUFaO0FBR0FZLElBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFhLE1BQWI7QUFDSDs7QUFFRCxTQUFPO0FBQ0h5QyxJQUFBQSxFQUFFLEVBQUVBLEVBQUUsQ0FBQ3VFLFNBQUgsRUFERDtBQUVIckUsSUFBQUEsRUFBRSxFQUFFQSxFQUFFLENBQUNxRSxTQUFIO0FBRkQsR0FBUDtBQUlIOztlQUVjekgsSSIsInNvdXJjZXNDb250ZW50IjpbIi8vQGZsb3dcblxuaW1wb3J0IHsgbWFrZUZpZWxkVHlwZU5hbWUsIFdyaXRlciB9IGZyb20gJ3Rvbi1sYWJzLWRldi1vcHMvZGlzdC9zcmMvZ2VuLmpzJztcbmltcG9ydCB0eXBlIHsgU2NoZW1hRG9jLCBTY2hlbWFNZW1iZXIsIFNjaGVtYVR5cGUsIFR5cGVEZWYgfSBmcm9tICd0b24tbGFicy1kZXYtb3BzL3NyYy9zY2hlbWEuanMnO1xuaW1wb3J0IHsgcGFyc2VUeXBlRGVmIH0gZnJvbSAndG9uLWxhYnMtZGV2LW9wcy9kaXN0L3NyYy9zY2hlbWEuanMnO1xuXG5jb25zdCBEYlR5cGVDYXRlZ29yeSA9IHtcbiAgICB1bnJlc29sdmVkOiAndW5yZXNvbHZlZCcsXG4gICAgc2NhbGFyOiAnc2NhbGFyJyxcbiAgICB1bmlvbjogJ3VuaW9uJyxcbiAgICBzdHJ1Y3Q6ICdzdHJ1Y3QnLFxufTtcblxudHlwZSBEYkpvaW4gPSB7XG4gICAgY29sbGVjdGlvbjogc3RyaW5nLFxuICAgIG9uOiBzdHJpbmcsXG4gICAgcmVmT246IHN0cmluZyxcbiAgICBwcmVDb25kaXRpb246IHN0cmluZyxcbn1cblxudHlwZSBEYlR5cGUgPSB7XG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGZpZWxkczogRGJGaWVsZFtdLFxuICAgIGNhdGVnb3J5OiAndW5yZXNvbHZlZCcgfCAnc2NhbGFyJyB8ICd1bmlvbicgfCAnc3RydWN0JyxcbiAgICBjb2xsZWN0aW9uPzogc3RyaW5nLFxuICAgIGRvYzogc3RyaW5nLFxufVxuXG50eXBlIEludEVudW1EZWYgPSB7XG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHZhbHVlczoge1xuICAgICAgICBbc3RyaW5nXTogbnVtYmVyXG4gICAgfSxcbn1cblxudHlwZSBEYkZpZWxkID0ge1xuICAgIG5hbWU6IHN0cmluZyxcbiAgICB0eXBlOiBEYlR5cGUsXG4gICAgYXJyYXlEZXB0aDogbnVtYmVyLFxuICAgIGpvaW4/OiBEYkpvaW4sXG4gICAgZW51bURlZj86IEludEVudW1EZWYsXG4gICAgaXNVbml4VGltZTogYm9vbGVhbixcbiAgICBkb2M6IHN0cmluZyxcbn1cblxuZnVuY3Rpb24gc2NhbGFyVHlwZShuYW1lOiBzdHJpbmcpOiBEYlR5cGUge1xuICAgIHJldHVybiB7XG4gICAgICAgIG5hbWUsXG4gICAgICAgIGNhdGVnb3J5OiBEYlR5cGVDYXRlZ29yeS5zY2FsYXIsXG4gICAgICAgIGZpZWxkczogW10sXG4gICAgICAgIGRvYzogJycsXG4gICAgfVxufVxuXG5jb25zdCBzY2FsYXJUeXBlcyA9IHtcbiAgICBpbnQ6IHNjYWxhclR5cGUoJ0ludCcpLFxuICAgIHVpbnQ2NDogc2NhbGFyVHlwZSgnU3RyaW5nJyksXG4gICAgdWludDEwMjQ6IHNjYWxhclR5cGUoJ1N0cmluZycpLFxuICAgIGZsb2F0OiBzY2FsYXJUeXBlKCdGbG9hdCcpLFxuICAgIGJvb2xlYW46IHNjYWxhclR5cGUoJ0Jvb2xlYW4nKSxcbiAgICBzdHJpbmc6IHNjYWxhclR5cGUoJ1N0cmluZycpLFxufTtcblxuZnVuY3Rpb24gaXNCaWdJbnQodHlwZTogRGJUeXBlKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHR5cGUgPT09IHNjYWxhclR5cGVzLnVpbnQxMDI0IHx8IHR5cGUgPT09IHNjYWxhclR5cGVzLnVpbnQ2NDtcbn1cblxuZnVuY3Rpb24gdW5yZXNvbHZlZFR5cGUobmFtZTogc3RyaW5nKTogRGJUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBuYW1lLFxuICAgICAgICBjYXRlZ29yeTogRGJUeXBlQ2F0ZWdvcnkudW5yZXNvbHZlZCxcbiAgICAgICAgZmllbGRzOiBbXSxcbiAgICAgICAgZG9jOiAnJyxcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGlzTG93ZXJDYXNlZChzOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBjb25zdCBsID0gcy50b0xvd2VyQ2FzZSgpO1xuICAgIGNvbnN0IHUgPSBzLnRvVXBwZXJDYXNlKCk7XG4gICAgcmV0dXJuICh1ICE9PSBsKSAmJiAocyA9PT0gbCk7XG59XG5cbmZ1bmN0aW9uIGlzVXBwZXJDYXNlZChzOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBjb25zdCBsID0gcy50b0xvd2VyQ2FzZSgpO1xuICAgIGNvbnN0IHUgPSBzLnRvVXBwZXJDYXNlKCk7XG4gICAgcmV0dXJuICh1ICE9PSBsKSAmJiAocyA9PT0gdSk7XG59XG5cbmZ1bmN0aW9uIHRvQWxsQ2FwcyhzOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGxldCByZXN1bHQgPSAnJztcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgaWYgKChpID4gMCkgJiYgKHNbaSAtIDFdICE9PSAnXycpICYmIGlzTG93ZXJDYXNlZChzW2kgLSAxXSkgJiYgaXNVcHBlckNhc2VkKHNbaV0pKSB7XG4gICAgICAgICAgICByZXN1bHQgKz0gJ18nO1xuICAgICAgICB9XG4gICAgICAgIHJlc3VsdCArPSBzW2ldO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0LnRvVXBwZXJDYXNlKCk7XG59XG5cbmZ1bmN0aW9uIHRvRW51bVN0eWxlKHM6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGAke3Muc3Vic3RyKDAsIDEpLnRvVXBwZXJDYXNlKCl9JHtzLnN1YnN0cigxKX1gO1xufVxuXG5mdW5jdGlvbiBzdHJpbmdpZnlFbnVtVmFsdWVzKHZhbHVlczogeyBbc3RyaW5nXTogbnVtYmVyIH0pOiBzdHJpbmcge1xuICAgIGNvbnN0IGZpZWxkcyA9IE9iamVjdC5lbnRyaWVzKHZhbHVlcykubWFwKChbbmFtZSwgdmFsdWVdKSA9PiB7XG4gICAgICAgIHJldHVybiBgJHt0b0VudW1TdHlsZShuYW1lKX06ICR7KHZhbHVlOiBhbnkpfWA7XG4gICAgfSk7XG4gICAgcmV0dXJuIGB7ICR7ZmllbGRzLmpvaW4oJywgJyl9IH1gO1xufVxuXG5mdW5jdGlvbiBnZXREb2NNRChzY2hlbWE6IFNjaGVtYURvYyk6IHN0cmluZyB7XG4gICAgY29uc3QgZG9jID0gc2NoZW1hLmRvYztcbiAgICBpZiAoIWRvYykge1xuICAgICAgICByZXR1cm4gJyc7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgZG9jID09PSAnc3RyaW5nJykge1xuICAgICAgICByZXR1cm4gZG9jO1xuICAgIH1cbiAgICBpZiAoZG9jLm1kKSB7XG4gICAgICAgIHJldHVybiAoZG9jLm1kOiBhbnkpO1xuICAgIH1cbiAgICByZXR1cm4gJyc7XG59XG5cbmZ1bmN0aW9uIG1haW4oc2NoZW1hRGVmOiBUeXBlRGVmKSB7XG5cbiAgICBsZXQgZGJUeXBlczogRGJUeXBlW10gPSBbXTtcbiAgICBsZXQgbGFzdFJlcG9ydGVkVHlwZTogc3RyaW5nID0gJyc7XG4gICAgbGV0IGVudW1UeXBlczogTWFwPHN0cmluZywgSW50RW51bURlZj4gPSBuZXcgTWFwKCk7XG5cbiAgICBmdW5jdGlvbiByZXBvcnRUeXBlKG5hbWU6IHN0cmluZywgZmllbGQ6IHN0cmluZywgdHlwZTogc3RyaW5nKSB7XG4gICAgICAgIGlmIChuYW1lICE9PSBsYXN0UmVwb3J0ZWRUeXBlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhuYW1lKTtcbiAgICAgICAgICAgIGxhc3RSZXBvcnRlZFR5cGUgPSBuYW1lO1xuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUubG9nKGAgICAgJHtmaWVsZH06ICR7dHlwZX1gKTtcblxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlRGJGaWVsZChcbiAgICAgICAgdHlwZU5hbWU6IHN0cmluZyxcbiAgICAgICAgc2NoZW1hRmllbGQ6IFNjaGVtYU1lbWJlcjxTY2hlbWFUeXBlPixcbiAgICApOiBEYkZpZWxkIHtcbiAgICAgICAgbGV0IHNjaGVtYVR5cGUgPSBzY2hlbWFGaWVsZDtcbiAgICAgICAgY29uc3QgZmllbGQ6IERiRmllbGQgPSB7XG4gICAgICAgICAgICBuYW1lOiBzY2hlbWFGaWVsZC5uYW1lLFxuICAgICAgICAgICAgYXJyYXlEZXB0aDogMCxcbiAgICAgICAgICAgIHR5cGU6IHNjYWxhclR5cGVzLnN0cmluZyxcbiAgICAgICAgICAgIGRvYzogZ2V0RG9jTUQoc2NoZW1hRmllbGQpLFxuICAgICAgICAgICAgaXNVbml4VGltZTogZmFsc2UsXG4gICAgICAgIH07XG4gICAgICAgIHdoaWxlIChzY2hlbWFUeXBlLmFycmF5KSB7XG4gICAgICAgICAgICBmaWVsZC5hcnJheURlcHRoICs9IDE7XG4gICAgICAgICAgICBzY2hlbWFUeXBlID0gc2NoZW1hVHlwZS5hcnJheTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBleCA9IChzY2hlbWFUeXBlOiBhbnkpLl87XG4gICAgICAgIGNvbnN0IGVudW1EZWY6ID9JbnRFbnVtRGVmID0gKGV4ICYmIGV4LmVudW0pIHx8IG51bGw7XG4gICAgICAgIGlmIChlbnVtRGVmKSB7XG4gICAgICAgICAgICBmaWVsZC5lbnVtRGVmID0gZW51bURlZjtcbiAgICAgICAgICAgIGVudW1UeXBlcy5zZXQoZW51bURlZi5uYW1lLCBlbnVtRGVmKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBqb2luID0gZXggJiYgZXguam9pbjtcbiAgICAgICAgaWYgKGpvaW4pIHtcbiAgICAgICAgICAgIGZpZWxkLmpvaW4gPSBqb2luO1xuICAgICAgICB9XG4gICAgICAgIGlmIChleCAmJiBleC5pc1VuaXhUaW1lKSB7XG4gICAgICAgICAgICBmaWVsZC5pc1VuaXhUaW1lID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc2NoZW1hVHlwZS51bmlvbiB8fCBzY2hlbWFUeXBlLnN0cnVjdCkge1xuICAgICAgICAgICAgZmllbGQudHlwZSA9IHVucmVzb2x2ZWRUeXBlKG1ha2VGaWVsZFR5cGVOYW1lKHR5cGVOYW1lLCBzY2hlbWFGaWVsZC5uYW1lKSk7XG4gICAgICAgIH0gZWxzZSBpZiAoc2NoZW1hVHlwZS5yZWYpIHtcbiAgICAgICAgICAgIGZpZWxkLnR5cGUgPSB1bnJlc29sdmVkVHlwZShzY2hlbWFUeXBlLnJlZi5uYW1lKTtcbiAgICAgICAgfSBlbHNlIGlmIChzY2hlbWFUeXBlLmJvb2wpIHtcbiAgICAgICAgICAgIGZpZWxkLnR5cGUgPSBzY2FsYXJUeXBlcy5ib29sZWFuO1xuICAgICAgICB9IGVsc2UgaWYgKHNjaGVtYVR5cGUuaW50KSB7XG4gICAgICAgICAgICBjb25zdCB1bnNpZ25lZDogYm9vbGVhbiA9IChzY2hlbWFUeXBlLmludCAmJiBzY2hlbWFUeXBlLmludC51bnNpZ25lZCkgfHwgZmFsc2U7XG4gICAgICAgICAgICBjb25zdCBzaXplOiBudW1iZXIgPSAoc2NoZW1hVHlwZS5pbnQgJiYgc2NoZW1hVHlwZS5pbnQuc2l6ZSkgfHwgMzI7XG4gICAgICAgICAgICBpZiAodW5zaWduZWQpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2l6ZSA+PSAxMjgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVwb3J0VHlwZSh0eXBlTmFtZSwgZmllbGQubmFtZSwgJ3UxMDI0Jyk7XG4gICAgICAgICAgICAgICAgICAgIGZpZWxkLnR5cGUgPSBzY2FsYXJUeXBlcy51aW50MTAyNDtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHNpemUgPj0gNjQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVwb3J0VHlwZSh0eXBlTmFtZSwgZmllbGQubmFtZSwgJ3U2NCcpO1xuICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlID0gc2NhbGFyVHlwZXMudWludDY0O1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc2l6ZSA+PSAzMikge1xuICAgICAgICAgICAgICAgICAgICByZXBvcnRUeXBlKHR5cGVOYW1lLCBmaWVsZC5uYW1lLCAndTMyJyk7XG4gICAgICAgICAgICAgICAgICAgIGZpZWxkLnR5cGUgPSBzY2FsYXJUeXBlcy5mbG9hdDtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXBvcnRUeXBlKHR5cGVOYW1lLCBmaWVsZC5uYW1lLCBgdSR7c2l6ZX1gKTtcbiAgICAgICAgICAgICAgICAgICAgZmllbGQudHlwZSA9IHNjYWxhclR5cGVzLmludDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChzaXplID4gMzIpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnRlZ2VyIHR5cGUgd2l0aCBzaXplICR7c2l6ZX0gYml0IGRvZXMgbm90IHN1cHBvcnRlZGApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcG9ydFR5cGUodHlwZU5hbWUsIGZpZWxkLm5hbWUsICdpMzInKTtcbiAgICAgICAgICAgICAgICAgICAgZmllbGQudHlwZSA9IHNjYWxhclR5cGVzLmludDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoc2NoZW1hVHlwZS5mbG9hdCkge1xuICAgICAgICAgICAgcmVwb3J0VHlwZSh0eXBlTmFtZSwgZmllbGQubmFtZSwgJ2Zsb2F0Jyk7XG4gICAgICAgICAgICBmaWVsZC50eXBlID0gc2NhbGFyVHlwZXMuZmxvYXQ7XG4gICAgICAgIH0gZWxzZSBpZiAoc2NoZW1hVHlwZS5zdHJpbmcpIHtcbiAgICAgICAgICAgIGZpZWxkLnR5cGUgPSBzY2FsYXJUeXBlcy5zdHJpbmc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmaWVsZC50eXBlID0gc2NhbGFyVHlwZXMuc3RyaW5nO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ0ludmFsaWQgZmllbGQgdHlwZTogJywgSlNPTi5zdHJpbmdpZnkoc2NoZW1hVHlwZSkpO1xuICAgICAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmaWVsZDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB1bndyYXBBcnJheXModHlwZTogU2NoZW1hVHlwZSk6IFNjaGVtYVR5cGUge1xuICAgICAgICBpZiAodHlwZS5hcnJheSkge1xuICAgICAgICAgICAgcmV0dXJuIHVud3JhcEFycmF5cyh0eXBlLmFycmF5KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHlwZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZURiVHlwZShcbiAgICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgICBzY2hlbWFUeXBlOiBTY2hlbWFUeXBlXG4gICAgKSB7XG4gICAgICAgIGNvbnN0IHN0cnVjdCA9IHNjaGVtYVR5cGUudW5pb24gfHwgc2NoZW1hVHlwZS5zdHJ1Y3Q7XG4gICAgICAgIGlmICghc3RydWN0KSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgPz8gJHtuYW1lfTogJHtKU09OLnN0cmluZ2lmeShzY2hlbWFUeXBlKS5zdWJzdHIoMCwgMjAwKX1gKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0eXBlOiBEYlR5cGUgPSB7XG4gICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgY2F0ZWdvcnk6IHNjaGVtYVR5cGUudW5pb24gPyBEYlR5cGVDYXRlZ29yeS51bmlvbiA6IERiVHlwZUNhdGVnb3J5LnN0cnVjdCxcbiAgICAgICAgICAgIGZpZWxkczogW10sXG4gICAgICAgICAgICBjb2xsZWN0aW9uOiAoc2NoZW1hVHlwZTogYW55KS5fLmNvbGxlY3Rpb24sXG4gICAgICAgICAgICBkb2M6IGdldERvY01EKHNjaGVtYVR5cGUpLFxuICAgICAgICB9O1xuXG4gICAgICAgIGlmICh0eXBlLmNvbGxlY3Rpb24pIHtcbiAgICAgICAgICAgIHR5cGUuZmllbGRzLnB1c2goe1xuICAgICAgICAgICAgICAgIG5hbWU6ICdpZCcsXG4gICAgICAgICAgICAgICAgYXJyYXlEZXB0aDogMCxcbiAgICAgICAgICAgICAgICB0eXBlOiBzY2FsYXJUeXBlcy5zdHJpbmcsXG4gICAgICAgICAgICAgICAgaXNVbml4VGltZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgZG9jOiAnJyxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHN0cnVjdC5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgdHlwZS5maWVsZHMucHVzaChwYXJzZURiRmllbGQobmFtZSwgZmllbGQpKTtcbiAgICAgICAgICAgIGNvbnN0IHVud3JhcHBlZCA9IHVud3JhcEFycmF5cyhmaWVsZCk7XG4gICAgICAgICAgICBjb25zdCBvd25UeXBlID0gKHVud3JhcHBlZC5zdHJ1Y3QgfHwgdW53cmFwcGVkLnVuaW9uKSA/IHVud3JhcHBlZCA6IG51bGw7XG4gICAgICAgICAgICBpZiAob3duVHlwZSkge1xuICAgICAgICAgICAgICAgIHBhcnNlRGJUeXBlKG1ha2VGaWVsZFR5cGVOYW1lKG5hbWUsIGZpZWxkLm5hbWUpLCBvd25UeXBlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGRiVHlwZXMucHVzaCh0eXBlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZURiVHlwZXModHlwZXM6IFNjaGVtYU1lbWJlcjxTY2hlbWFUeXBlPltdKSB7XG4gICAgICAgIHR5cGVzLmZvckVhY2goKHR5cGU6IFNjaGVtYU1lbWJlcjxTY2hlbWFUeXBlPikgPT4ge1xuICAgICAgICAgICAgcGFyc2VEYlR5cGUodHlwZS5uYW1lLCB0eXBlKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IHVucmVzb2x2ZWQ6IE1hcDxzdHJpbmcsIERiVHlwZT4gPSBuZXcgTWFwPHN0cmluZywgRGJUeXBlPigpO1xuICAgICAgICBjb25zdCByZXNvbHZpbmc6IFNldDxzdHJpbmc+ID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgICAgIGNvbnN0IHJlc29sdmVkOiBNYXA8c3RyaW5nLCBEYlR5cGU+ID0gbmV3IE1hcDxzdHJpbmcsIERiVHlwZT4oKTtcbiAgICAgICAgY29uc3Qgb3JkZXJlZFJlc29sdmVkOiBEYlR5cGVbXSA9IFtdO1xuICAgICAgICBkYlR5cGVzLmZvckVhY2godCA9PiB1bnJlc29sdmVkLnNldCh0Lm5hbWUsIHQpKTtcbiAgICAgICAgY29uc3QgcmVzb2x2ZVR5cGUgPSAodHlwZTogRGJUeXBlKSA9PiB7XG4gICAgICAgICAgICBpZiAocmVzb2x2ZWQuaGFzKHR5cGUubmFtZSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocmVzb2x2aW5nLmhhcyh0eXBlLm5hbWUpKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFdBUk5JTkc6IENpcmN1bGFyIHJlZmVyZW5jZSB0byB0eXBlICR7dHlwZS5uYW1lfWApO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlc29sdmluZy5hZGQodHlwZS5uYW1lKTtcbiAgICAgICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGZpZWxkLnR5cGUuY2F0ZWdvcnkgPT09IERiVHlwZUNhdGVnb3J5LnVucmVzb2x2ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHR5cGUgPSByZXNvbHZlZC5nZXQoZmllbGQudHlwZS5uYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlID0gdW5yZXNvbHZlZC5nZXQoZmllbGQudHlwZS5uYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZVR5cGUodHlwZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBSZWZlcmVuY2VkIHR5cGUgbm90IGZvdW5kOiAke2ZpZWxkLnR5cGUubmFtZX1gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpZWxkLnR5cGUgPSB0eXBlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXNvbHZpbmcuZGVsZXRlKHR5cGUubmFtZSk7XG4gICAgICAgICAgICBvcmRlcmVkUmVzb2x2ZWQucHVzaCh0eXBlKTtcbiAgICAgICAgICAgIHVucmVzb2x2ZWQuZGVsZXRlKHR5cGUubmFtZSk7XG4gICAgICAgICAgICByZXNvbHZlZC5zZXQodHlwZS5uYW1lLCB0eXBlKTtcbiAgICAgICAgfTtcbiAgICAgICAgZGJUeXBlcy5mb3JFYWNoKHJlc29sdmVUeXBlKTtcbiAgICAgICAgZGJUeXBlcyA9IG9yZGVyZWRSZXNvbHZlZDtcbiAgICB9XG5cbi8vIEdlbmVyYXRvcnNcblxuICAgIGNvbnN0IHFsID0gbmV3IFdyaXRlcigpO1xuICAgIGNvbnN0IGpzID0gbmV3IFdyaXRlcigpO1xuXG4gICAgZnVuY3Rpb24gZ2VuUUxEb2MocHJlZml4OiBzdHJpbmcsIGRvYzogc3RyaW5nKSB7XG4gICAgICAgIGlmIChkb2MudHJpbSgpID09PSAnJykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGxpbmVzID0gZG9jLnNwbGl0KC9cXG5cXHI/fFxcclxcbj8vKTtcbiAgICAgICAgaWYgKGxpbmVzLmxlbmd0aCA9PT0gMSAmJiAhbGluZXNbMF0uaW5jbHVkZXMoJ1wiJykpIHtcbiAgICAgICAgICAgIHFsLndyaXRlTG4ocHJlZml4LCAnXCInLCBsaW5lc1swXSwgJ1wiJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBxbC53cml0ZUxuKHByZWZpeCwgJ1wiXCJcIicpO1xuICAgICAgICAgICAgbGluZXMuZm9yRWFjaCgobGluZSkgPT4ge1xuICAgICAgICAgICAgICAgIHFsLndyaXRlTG4ocHJlZml4LCBsaW5lKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcWwud3JpdGVMbihwcmVmaXgsICdcIlwiXCInKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHVuaW9uVmFyaWFudFR5cGUodHlwZTogRGJUeXBlLCB2YXJpYW50OiBEYkZpZWxkKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIGAke3R5cGUubmFtZX0ke3ZhcmlhbnQubmFtZX1WYXJpYW50YDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5RTFR5cGVEZWNsYXJhdGlvbnNGb3JVbmlvblZhcmlhbnRzKHR5cGU6IERiVHlwZSkge1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKCh2YXJpYW50KSA9PiB7XG4gICAgICAgICAgICBxbC53cml0ZUJsb2NrTG4oYFxuICAgICAgICB0eXBlICR7dW5pb25WYXJpYW50VHlwZSh0eXBlLCB2YXJpYW50KX0ge1xuICAgICAgICAgICAgJHt2YXJpYW50Lm5hbWV9OiAke3ZhcmlhbnQudHlwZS5uYW1lfVxuICAgICAgICB9XG5cbiAgICAgICAgYCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlblFMRW51bVR5cGVzKCkge1xuICAgICAgICBmb3IgKGNvbnN0IGVudW1EZWY6IEludEVudW1EZWYgb2YgZW51bVR5cGVzLnZhbHVlcygpKSB7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGBlbnVtICR7ZW51bURlZi5uYW1lfUVudW0ge2ApO1xuICAgICAgICAgICAgT2JqZWN0LmtleXMoZW51bURlZi52YWx1ZXMpLmZvckVhY2goKG5hbWUpID0+IHtcbiAgICAgICAgICAgICAgICBxbC53cml0ZUxuKGAgICAgJHt0b0VudW1TdHlsZShuYW1lKX1gKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcWwud3JpdGVMbihgfWApO1xuICAgICAgICAgICAgcWwud3JpdGVMbigpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuUUxUeXBlRGVjbGFyYXRpb24odHlwZTogRGJUeXBlKSB7XG4gICAgICAgIGlmICh0eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS51bmlvbikge1xuICAgICAgICAgICAgZ2VuUUxUeXBlRGVjbGFyYXRpb25zRm9yVW5pb25WYXJpYW50cyh0eXBlKTtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oYHVuaW9uICR7dHlwZS5uYW1lfSA9IGApO1xuICAgICAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCh2YXJpYW50ID0+IHtcbiAgICAgICAgICAgICAgICBxbC53cml0ZUxuKGBcXHR8ICR7dW5pb25WYXJpYW50VHlwZSh0eXBlLCB2YXJpYW50KX1gKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcWwud3JpdGVMbigpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZ2VuUUxEb2MoJycsIHR5cGUuZG9jKTtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oYHR5cGUgJHt0eXBlLm5hbWV9IHtgKTtcbiAgICAgICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goZmllbGQgPT4ge1xuICAgICAgICAgICAgICAgIGdlblFMRG9jKCdcXHQnLCBmaWVsZC5kb2MpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHR5cGVEZWNsYXJhdGlvbiA9XG4gICAgICAgICAgICAgICAgICAgICdbJy5yZXBlYXQoZmllbGQuYXJyYXlEZXB0aCkgK1xuICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlLm5hbWUgK1xuICAgICAgICAgICAgICAgICAgICAnXScucmVwZWF0KGZpZWxkLmFycmF5RGVwdGgpO1xuICAgICAgICAgICAgICAgIGxldCBwYXJhbXMgPSAnJztcbiAgICAgICAgICAgICAgICBpZiAoaXNCaWdJbnQoZmllbGQudHlwZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcGFyYW1zID0gJyhmb3JtYXQ6IEJpZ0ludEZvcm1hdCknO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQuam9pbikge1xuICAgICAgICAgICAgICAgICAgICBwYXJhbXMgPSAnKHRpbWVvdXQ6IEludCknO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHFsLndyaXRlTG4oYFxcdCR7ZmllbGQubmFtZX0ke3BhcmFtc306ICR7dHlwZURlY2xhcmF0aW9ufWApO1xuICAgICAgICAgICAgICAgIGNvbnN0IGVudW1EZWYgPSBmaWVsZC5lbnVtRGVmO1xuICAgICAgICAgICAgICAgIGlmIChlbnVtRGVmKSB7XG4gICAgICAgICAgICAgICAgICAgIHFsLndyaXRlTG4oYFxcdCR7ZmllbGQubmFtZX1fbmFtZTogJHtlbnVtRGVmLm5hbWV9RW51bWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZmllbGQuaXNVbml4VGltZSkge1xuICAgICAgICAgICAgICAgICAgICBxbC53cml0ZUxuKGBcXHQke2ZpZWxkLm5hbWV9X3N0cmluZzogU3RyaW5nYCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGB9YCk7XG4gICAgICAgIH1cbiAgICAgICAgcWwud3JpdGVMbigpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHByZXZlbnRUd2ljZShuYW1lOiBzdHJpbmcsIG5hbWVzOiBTZXQ8c3RyaW5nPiwgd29yazogKCkgPT4gdm9pZCkge1xuICAgICAgICBpZiAoIW5hbWVzLmhhcyhuYW1lKSkge1xuICAgICAgICAgICAgbmFtZXMuYWRkKG5hbWUpO1xuICAgICAgICAgICAgd29yaygpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuUUxGaWx0ZXJzRm9yQXJyYXlGaWVsZHModHlwZTogRGJUeXBlLCBxbE5hbWVzOiBTZXQ8c3RyaW5nPikge1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgbGV0IGl0ZW1UeXBlTmFtZSA9IGZpZWxkLnR5cGUubmFtZTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZmllbGQuYXJyYXlEZXB0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmlsdGVyTmFtZSA9IGAke2l0ZW1UeXBlTmFtZX1BcnJheUZpbHRlcmA7XG4gICAgICAgICAgICAgICAgcHJldmVudFR3aWNlKGZpbHRlck5hbWUsIHFsTmFtZXMsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcWwud3JpdGVMbihgaW5wdXQgJHtmaWx0ZXJOYW1lfSB7YCk7XG4gICAgICAgICAgICAgICAgICAgIFsnYW55JywgJ2FsbCddLmZvckVhY2goKG9wKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBxbC53cml0ZUxuKGBcXHQke29wfTogJHtpdGVtVHlwZU5hbWV9RmlsdGVyYCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBxbC53cml0ZUxuKCd9Jyk7XG4gICAgICAgICAgICAgICAgICAgIHFsLndyaXRlTG4oKTtcblxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGl0ZW1UeXBlTmFtZSArPSAnQXJyYXknO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5RTEZpbHRlcnNGb3JFbnVtTmFtZUZpZWxkcyh0eXBlOiBEYlR5cGUsIHFsTmFtZXM6IFNldDxzdHJpbmc+KSB7XG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBlbnVtRGVmID0gZmllbGQuZW51bURlZjtcbiAgICAgICAgICAgIGlmIChlbnVtRGVmKSB7XG4gICAgICAgICAgICAgICAgcHJldmVudFR3aWNlKGAke2VudW1EZWYubmFtZX1FbnVtRmlsdGVyYCwgcWxOYW1lcywgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBnZW5RTFNjYWxhclR5cGVzRmlsdGVyKGAke2VudW1EZWYubmFtZX1FbnVtYCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlblFMRmlsdGVyKHR5cGU6IERiVHlwZSwgcWxOYW1lczogU2V0PHN0cmluZz4pIHtcbiAgICAgICAgaWYgKHR5cGUuZmllbGRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGdlblFMRmlsdGVyc0ZvckFycmF5RmllbGRzKHR5cGUsIHFsTmFtZXMpO1xuICAgICAgICBnZW5RTEZpbHRlcnNGb3JFbnVtTmFtZUZpZWxkcyh0eXBlLCBxbE5hbWVzKTtcbiAgICAgICAgZ2VuUUxEb2MoJycsIHR5cGUuZG9jKTtcbiAgICAgICAgcWwud3JpdGVMbihgaW5wdXQgJHt0eXBlLm5hbWV9RmlsdGVyIHtgKTtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGdlblFMRG9jKCdcXHQnLCBmaWVsZC5kb2MpO1xuICAgICAgICAgICAgY29uc3QgdHlwZURlY2xhcmF0aW9uID0gZmllbGQudHlwZS5uYW1lICsgXCJBcnJheVwiLnJlcGVhdChmaWVsZC5hcnJheURlcHRoKTtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oYFxcdCR7ZmllbGQubmFtZX06ICR7dHlwZURlY2xhcmF0aW9ufUZpbHRlcmApO1xuICAgICAgICAgICAgY29uc3QgZW51bURlZiA9IGZpZWxkLmVudW1EZWY7XG4gICAgICAgICAgICBpZiAoZW51bURlZikge1xuICAgICAgICAgICAgICAgIHFsLndyaXRlTG4oYFxcdCR7ZmllbGQubmFtZX1fbmFtZTogJHtlbnVtRGVmLm5hbWV9RW51bUZpbHRlcmApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcWwud3JpdGVMbihgICAgIE9SOiAke3R5cGUubmFtZX1GaWx0ZXJgKTtcbiAgICAgICAgcWwud3JpdGVMbihgfWApO1xuICAgICAgICBxbC53cml0ZUxuKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuUUxTY2FsYXJUeXBlc0ZpbHRlcihuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgcWwud3JpdGVMbihgaW5wdXQgJHtuYW1lfUZpbHRlciB7YCk7XG4gICAgICAgIFsnZXEnLCAnbmUnLCAnZ3QnLCAnbHQnLCAnZ2UnLCAnbGUnXS5mb3JFYWNoKChvcCkgPT4ge1xuICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0JHtvcH06ICR7bmFtZX1gKTtcbiAgICAgICAgfSk7XG4gICAgICAgIFsnaW4nLCAnbm90SW4nXS5mb3JFYWNoKChvcCkgPT4ge1xuICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0JHtvcH06IFske25hbWV9XWApO1xuICAgICAgICB9KTtcbiAgICAgICAgcWwud3JpdGVMbignfScpO1xuICAgICAgICBxbC53cml0ZUxuKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuUUxRdWVyaWVzKHR5cGVzOiBEYlR5cGVbXSkge1xuICAgICAgICBxbC53cml0ZUJsb2NrTG4oYFxuICAgICAgICBcIlNwZWNpZnkgc29ydCBvcmRlciBkaXJlY3Rpb25cIlxuICAgICAgICBlbnVtIFF1ZXJ5T3JkZXJCeURpcmVjdGlvbiB7XG4gICAgICAgICAgICBcIkRvY3VtZW50cyB3aWxsIGJlIHNvcnRlZCBpbiBhc2NlbmRlZCBvcmRlciAoZS5nLiBmcm9tIEEgdG8gWilcIlxuICAgICAgICAgICAgQVNDXG4gICAgICAgICAgICBcIkRvY3VtZW50cyB3aWxsIGJlIHNvcnRlZCBpbiBkZXNjZW5kYW50IG9yZGVyIChlLmcuIGZyb20gWiB0byBBKVwiXG4gICAgICAgICAgICBERVNDXG4gICAgICAgIH1cblxuICAgICAgICBcbiAgICAgICAgXCJcIlwiXG4gICAgICAgIFNwZWNpZnkgaG93IHRvIHNvcnQgcmVzdWx0cy5cbiAgICAgICAgWW91IGNhbiBzb3J0IGRvY3VtZW50cyBpbiByZXN1bHQgc2V0IHVzaW5nIG1vcmUgdGhhbiBvbmUgZmllbGQuXG4gICAgICAgIFwiXCJcIlxuICAgICAgICBpbnB1dCBRdWVyeU9yZGVyQnkge1xuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgICBQYXRoIHRvIGZpZWxkIHdoaWNoIG11c3QgYmUgdXNlZCBhcyBhIHNvcnQgY3JpdGVyaWEuXG4gICAgICAgICAgICBJZiBmaWVsZCByZXNpZGVzIGRlZXAgaW4gc3RydWN0dXJlIHBhdGggaXRlbXMgbXVzdCBiZSBzZXBhcmF0ZWQgd2l0aCBkb3QgKGUuZy4gJ2Zvby5iYXIuYmF6JykuXG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICAgIHBhdGg6IFN0cmluZ1xuICAgICAgICAgICAgXCJTb3J0IG9yZGVyIGRpcmVjdGlvblwiXG4gICAgICAgICAgICBkaXJlY3Rpb246IFF1ZXJ5T3JkZXJCeURpcmVjdGlvblxuICAgICAgICB9XG5cbiAgICAgICAgdHlwZSBRdWVyeSB7XG4gICAgICAgIGApO1xuXG4gICAgICAgIHR5cGVzLmZvckVhY2goKHR5cGU6IERiVHlwZSkgPT4ge1xuICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0JHt0eXBlLmNvbGxlY3Rpb24gfHwgJyd9KGZpbHRlcjogJHt0eXBlLm5hbWV9RmlsdGVyLCBvcmRlckJ5OiBbUXVlcnlPcmRlckJ5XSwgbGltaXQ6IEludCwgdGltZW91dDogRmxvYXQsIGFjY2Vzc0tleTogU3RyaW5nLCBvcGVyYXRpb25JZDogU3RyaW5nKTogWyR7dHlwZS5uYW1lfV1gKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcWwud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgfVxuXG4gICAgICAgIGApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlblFMU3Vic2NyaXB0aW9ucyh0eXBlczogRGJUeXBlW10pIHtcbiAgICAgICAgcWwud3JpdGVMbigndHlwZSBTdWJzY3JpcHRpb24geycpO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGBcXHQke3R5cGUuY29sbGVjdGlvbiB8fCAnJ30oZmlsdGVyOiAke3R5cGUubmFtZX1GaWx0ZXIsIGFjY2Vzc0tleTogU3RyaW5nKTogJHt0eXBlLm5hbWV9YCk7XG4gICAgICAgIH0pO1xuICAgICAgICBxbC53cml0ZUxuKCd9Jyk7XG4gICAgfVxuXG5cbiAgICBmdW5jdGlvbiBnZXRTY2FsYXJSZXNvbHZlck5hbWUoZmllbGQ6IERiRmllbGQpOiBzdHJpbmcge1xuICAgICAgICBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDY0KSB7XG4gICAgICAgICAgICByZXR1cm4gJ2JpZ1VJbnQxJztcbiAgICAgICAgfVxuICAgICAgICBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDEwMjQpIHtcbiAgICAgICAgICAgIHJldHVybiAnYmlnVUludDInO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnc2NhbGFyJztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5KU0ZpbHRlcnNGb3JBcnJheUZpZWxkcyh0eXBlOiBEYlR5cGUsIGpzTmFtZXM6IFNldDxzdHJpbmc+KSB7XG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBsZXQgaXRlbVR5cGVOYW1lID0gZmllbGQudHlwZS5uYW1lO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmaWVsZC5hcnJheURlcHRoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWx0ZXJOYW1lID0gYCR7aXRlbVR5cGVOYW1lfUFycmF5YDtcbiAgICAgICAgICAgICAgICBwcmV2ZW50VHdpY2UoZmlsdGVyTmFtZSwganNOYW1lcywgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpdGVtUmVzb2x2ZXJOYW1lID0gKGkgPT09IDAgJiYgZmllbGQudHlwZS5jYXRlZ29yeSA9PT0gRGJUeXBlQ2F0ZWdvcnkuc2NhbGFyKVxuICAgICAgICAgICAgICAgICAgICAgICAgPyBnZXRTY2FsYXJSZXNvbHZlck5hbWUoZmllbGQpXG4gICAgICAgICAgICAgICAgICAgICAgICA6IGl0ZW1UeXBlTmFtZTtcbiAgICAgICAgICAgICAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgICAgICAgICBjb25zdCAke2ZpbHRlck5hbWV9ID0gYXJyYXkoKCkgPT4gJHtpdGVtUmVzb2x2ZXJOYW1lfSk7XG4gICAgICAgICAgICAgICAgYCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaXRlbVR5cGVOYW1lICs9ICdBcnJheSc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkpTU3RydWN0RmlsdGVyKHR5cGU6IERiVHlwZSkge1xuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBjb25zdCAke3R5cGUubmFtZX0gPSBzdHJ1Y3Qoe1xuICAgIGApO1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgbGV0IHR5cGVEZWNsYXJhdGlvbjogP3N0cmluZyA9IG51bGw7XG4gICAgICAgICAgICBjb25zdCBqb2luID0gZmllbGQuam9pbjtcbiAgICAgICAgICAgIGlmIChqb2luKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3VmZml4ID0gZmllbGQuYXJyYXlEZXB0aCA+IDAgPyAnQXJyYXknIDogJyc7XG4gICAgICAgICAgICAgICAgdHlwZURlY2xhcmF0aW9uID0gYGpvaW4ke3N1ZmZpeH0oJyR7am9pbi5vbn0nLCAnJHtqb2luLnJlZk9ufScsICcke2ZpZWxkLnR5cGUuY29sbGVjdGlvbiB8fCAnJ30nLCAoKSA9PiAke2ZpZWxkLnR5cGUubmFtZX0pYDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQuYXJyYXlEZXB0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB0eXBlRGVjbGFyYXRpb24gPVxuICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlLm5hbWUgK1xuICAgICAgICAgICAgICAgICAgICAnQXJyYXknLnJlcGVhdChmaWVsZC5hcnJheURlcHRoKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZS5jYXRlZ29yeSA9PT0gRGJUeXBlQ2F0ZWdvcnkuc2NhbGFyKSB7XG4gICAgICAgICAgICAgICAgdHlwZURlY2xhcmF0aW9uID0gZ2V0U2NhbGFyUmVzb2x2ZXJOYW1lKGZpZWxkKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZS5maWVsZHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHR5cGVEZWNsYXJhdGlvbiA9IGZpZWxkLnR5cGUubmFtZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0eXBlRGVjbGFyYXRpb24pIHtcbiAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgJHtmaWVsZC5uYW1lfTogJHt0eXBlRGVjbGFyYXRpb259LGApO1xuICAgICAgICAgICAgICAgIGNvbnN0IGVudW1EZWYgPSBmaWVsZC5lbnVtRGVmO1xuICAgICAgICAgICAgICAgIGlmIChlbnVtRGVmKSB7XG4gICAgICAgICAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAke2ZpZWxkLm5hbWV9X25hbWU6IGVudW1OYW1lKCcke2ZpZWxkLm5hbWV9JywgJHtzdHJpbmdpZnlFbnVtVmFsdWVzKGVudW1EZWYudmFsdWVzKX0pLGApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIH0ke3R5cGUuY29sbGVjdGlvbiA/ICcsIHRydWUnIDogJyd9KTtcblxuICAgIGApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkpTVW5pb25SZXNvbHZlcih0eXBlOiBEYlR5cGUpIHtcbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgY29uc3QgJHt0eXBlLm5hbWV9UmVzb2x2ZXIgPSB7XG4gICAgICAgICAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xuICAgICAgICBgKTtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgodmFyaWFudCkgPT4ge1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICBpZiAoJyR7dmFyaWFudC5uYW1lfScgaW4gb2JqKSB7YCk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICByZXR1cm4gJyR7dW5pb25WYXJpYW50VHlwZSh0eXBlLCB2YXJpYW50KX0nO2ApO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICB9YCk7XG4gICAgICAgIH0pO1xuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkpTRmlsdGVyKHR5cGU6IERiVHlwZSwganNOYW1lczogU2V0PHN0cmluZz4pIHtcbiAgICAgICAgaWYgKHR5cGUuZmllbGRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS51bmlvbikge1xuICAgICAgICAgICAgLy8gZ2VuSlNGaWx0ZXJzRm9yVW5pb25WYXJpYW50cyh0eXBlLCBqc05hbWVzKTtcbiAgICAgICAgfVxuICAgICAgICBnZW5KU0ZpbHRlcnNGb3JBcnJheUZpZWxkcyh0eXBlLCBqc05hbWVzKTtcbiAgICAgICAgZ2VuSlNTdHJ1Y3RGaWx0ZXIodHlwZSk7XG4gICAgICAgIGlmICh0eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS51bmlvbikge1xuICAgICAgICAgICAgZ2VuSlNVbmlvblJlc29sdmVyKHR5cGUpO1xuICAgICAgICB9XG5cblxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlIGN1c3RvbSByZXNvbHZlcnMgZm9yIHR5cGVzIHdpdGg6XG4gICAgICogLSBpZCBmaWVsZFxuICAgICAqIC0gam9pbiBmaWVsZHNcbiAgICAgKiAtIHU2NCBhbmQgaGlnaGVyIGZpZWxkc1xuICAgICAqIEBwYXJhbSB0eXBlXG4gICAgICovXG4gICAgZnVuY3Rpb24gZ2VuSlNDdXN0b21SZXNvbHZlcnModHlwZTogRGJUeXBlKSB7XG4gICAgICAgIGNvbnN0IGpvaW5GaWVsZHMgPSB0eXBlLmZpZWxkcy5maWx0ZXIoeCA9PiAhIXguam9pbik7XG4gICAgICAgIGNvbnN0IGJpZ1VJbnRGaWVsZHMgPSB0eXBlLmZpZWxkcy5maWx0ZXIoKHg6IERiRmllbGQpID0+IGlzQmlnSW50KHgudHlwZSkpO1xuICAgICAgICBjb25zdCB1bml4VGltZUZpZWxkcyA9IHR5cGUuZmllbGRzLmZpbHRlcigoeDogRGJGaWVsZCkgPT4geC5pc1VuaXhUaW1lKTtcbiAgICAgICAgY29uc3QgZW51bUZpZWxkcyA9IHR5cGUuZmllbGRzLmZpbHRlcih4ID0+IHguZW51bURlZik7XG4gICAgICAgIGNvbnN0IGN1c3RvbVJlc29sdmVyUmVxdWlyZWQgPSB0eXBlLmNvbGxlY3Rpb25cbiAgICAgICAgICAgIHx8IGpvaW5GaWVsZHMubGVuZ3RoID4gMFxuICAgICAgICAgICAgfHwgYmlnVUludEZpZWxkcy5sZW5ndGggPiAwXG4gICAgICAgICAgICB8fCBlbnVtRmllbGRzLmxlbmd0aCA+IDA7XG4gICAgICAgIGlmICghY3VzdG9tUmVzb2x2ZXJSZXF1aXJlZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgJHt0eXBlLm5hbWV9OiB7YCk7XG4gICAgICAgIGlmICh0eXBlLmNvbGxlY3Rpb24pIHtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oJyAgICAgICAgICAgIGlkKHBhcmVudCkgeycpO1xuICAgICAgICAgICAganMud3JpdGVMbignICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTsnKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oJyAgICAgICAgICAgIH0sJyk7XG4gICAgICAgIH1cbiAgICAgICAgam9pbkZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgY29uc3Qgam9pbiA9IGZpZWxkLmpvaW47XG4gICAgICAgICAgICBpZiAoIWpvaW4pIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBvbkZpZWxkID0gdHlwZS5maWVsZHMuZmluZCh4ID0+IHgubmFtZSA9PT0gam9pbi5vbik7XG4gICAgICAgICAgICBpZiAoIW9uRmllbGQpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyAnSm9pbiBvbiBmaWVsZCBkb2VzIG5vdCBleGlzdC4nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3Qgb24gPSBqb2luLm9uID09PSAnaWQnID8gJ19rZXknIDogKGpvaW4ub24gfHwgJ19rZXknKTtcbiAgICAgICAgICAgIGNvbnN0IHJlZk9uID0gam9pbi5yZWZPbiA9PT0gJ2lkJyA/ICdfa2V5JyA6IChqb2luLnJlZk9uIHx8ICdfa2V5Jyk7XG4gICAgICAgICAgICBjb25zdCBjb2xsZWN0aW9uID0gZmllbGQudHlwZS5jb2xsZWN0aW9uO1xuICAgICAgICAgICAgaWYgKCFjb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgJ0pvaW5lZCB0eXBlIGlzIG5vdCBhIGNvbGxlY3Rpb24uJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICR7ZmllbGQubmFtZX0ocGFyZW50LCBhcmdzLCBjb250ZXh0KSB7YCk7XG4gICAgICAgICAgICBjb25zdCBwcmUgPSBqb2luLnByZUNvbmRpdGlvbiA/IGAke2pvaW4ucHJlQ29uZGl0aW9ufSA/IGAgOiAnJztcbiAgICAgICAgICAgIGNvbnN0IHBvc3QgPSBqb2luLnByZUNvbmRpdGlvbiA/IGAgOiBudWxsYCA6ICcnO1xuICAgICAgICAgICAgaWYgKGZpZWxkLmFycmF5RGVwdGggPT09IDApIHtcbiAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAgICAgcmV0dXJuICR7cHJlfWNvbnRleHQuZGIuJHtjb2xsZWN0aW9ufS53YWl0Rm9yRG9jKHBhcmVudC4ke29ufSwgJyR7cmVmT259JywgYXJncykke3Bvc3R9O2ApO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC5hcnJheURlcHRoID09PSAxKSB7XG4gICAgICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgICAgIHJldHVybiAke3ByZX1jb250ZXh0LmRiLiR7Y29sbGVjdGlvbn0ud2FpdEZvckRvY3MocGFyZW50LiR7b259LCAnJHtyZWZPbn0nLCBhcmdzKSR7cG9zdH07YCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93ICdKb2lucyBvbiBhIG5lc3RlZCBhcnJheXMgZG9lcyBub3Qgc3VwcG9ydGVkLic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICB9LGApO1xuICAgICAgICB9KTtcbiAgICAgICAgYmlnVUludEZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcHJlZml4TGVuZ3RoID0gZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDY0ID8gMSA6IDI7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAke2ZpZWxkLm5hbWV9KHBhcmVudCwgYXJncykge2ApO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgke3ByZWZpeExlbmd0aH0sIHBhcmVudC4ke2ZpZWxkLm5hbWV9LCBhcmdzKTtgKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgIH0sYCk7XG4gICAgICAgIH0pO1xuICAgICAgICB1bml4VGltZUZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgJHtmaWVsZC5uYW1lfV9zdHJpbmcocGFyZW50LCBhcmdzKSB7YCk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVVbml4VGltZVN0cmluZyhwYXJlbnQuJHtmaWVsZC5uYW1lfSk7YCk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICB9LGApO1xuICAgICAgICB9KTtcbiAgICAgICAgZW51bUZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgZW51bURlZiA9IGZpZWxkLmVudW1EZWY7XG4gICAgICAgICAgICBpZiAoZW51bURlZikge1xuICAgICAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICR7ZmllbGQubmFtZX1fbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignJHtmaWVsZC5uYW1lfScsICR7c3RyaW5naWZ5RW51bVZhbHVlcyhlbnVtRGVmLnZhbHVlcyl9KSxgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgfSxgKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5KU1NjYWxhckZpZWxkcyh0eXBlOiBEYlR5cGUsIHBhcmVudFBhdGgsIHBhcmVudERvY1BhdGg6IHN0cmluZykge1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZDogRGJGaWVsZCkgPT4ge1xuICAgICAgICAgICAgaWYgKGZpZWxkLmpvaW4gfHwgZmllbGQuZW51bURlZikge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGRvY05hbWUgPSBmaWVsZC5uYW1lID09PSAnaWQnID8gJ19rZXknIDogZmllbGQubmFtZTtcbiAgICAgICAgICAgIGNvbnN0IHBhdGggPSBgJHtwYXJlbnRQYXRofS4ke2ZpZWxkLm5hbWV9YDtcbiAgICAgICAgICAgIGNvbnN0IGRvY1BhdGggPSBgJHtwYXJlbnREb2NQYXRofS4ke2RvY05hbWV9JHtmaWVsZC5hcnJheURlcHRoID4gMCA/ICdbKl0nIDogJyd9YDtcbiAgICAgICAgICAgIHN3aXRjaChmaWVsZC50eXBlLmNhdGVnb3J5KSB7XG4gICAgICAgICAgICBjYXNlIFwic2NhbGFyXCI6XG4gICAgICAgICAgICAgICAgbGV0IHR5cGVOYW1lO1xuICAgICAgICAgICAgICAgIGlmIChmaWVsZC50eXBlID09PSBzY2FsYXJUeXBlcy5ib29sZWFuKSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lID0gJ2Jvb2xlYW4nO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMuZmxvYXQpIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWUgPSAnbnVtYmVyJztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLmludCkge1xuICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZSA9ICdudW1iZXInO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDY0KSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lID0gJ3VpbnQ2NCc7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC50eXBlID09PSBzY2FsYXJUeXBlcy51aW50MTAyNCkge1xuICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZSA9ICd1aW50MTAyNCc7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWUgPSAnc3RyaW5nJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAganMud3JpdGVMbihgc2NhbGFyRmllbGRzLnNldCgnJHtwYXRofScsIHsgdHlwZTogJyR7dHlwZU5hbWV9JywgcGF0aDogJyR7ZG9jUGF0aH0nIH0pO2ApO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcInN0cnVjdFwiOlxuICAgICAgICAgICAgY2FzZSBcInVuaW9uXCI6XG4gICAgICAgICAgICAgICAgZ2VuSlNTY2FsYXJGaWVsZHMoZmllbGQudHlwZSwgcGF0aCwgZG9jUGF0aCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuXG4gICAgZnVuY3Rpb24gZ2VuSlNUeXBlUmVzb2x2ZXJzRm9yVW5pb24odHlwZTogRGJUeXBlKSB7XG4gICAgICAgIGlmICh0eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS51bmlvbikge1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAke3R5cGUubmFtZX06ICR7dHlwZS5uYW1lfVJlc29sdmVyLGApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuZXJhdGUodHlwZXM6IERiVHlwZVtdKSB7XG5cbiAgICAgICAgLy8gUUxcblxuICAgICAgICBxbC53cml0ZUJsb2NrTG4oYFxuICAgICAgICBcIlwiXCJcbiAgICAgICAgRHVlIHRvIEdyYXBoUUwgbGltaXRhdGlvbnMgYmlnIG51bWJlcnMgYXJlIHJldHVybmVkIGFzIGEgc3RyaW5nLlxuICAgICAgICBZb3UgY2FuIHNwZWNpZnkgZm9ybWF0IHVzZWQgdG8gc3RyaW5nIHJlcHJlc2VudGF0aW9uIGZvciBiaWcgaW50ZWdlcnMuXG4gICAgICAgIFwiXCJcIlxuICAgICAgICBlbnVtIEJpZ0ludEZvcm1hdCB7XG4gICAgICAgICAgICBcIiBIZXhhZGVjaW1hbCByZXByZXNlbnRhdGlvbiBzdGFydGVkIHdpdGggMHggKGRlZmF1bHQpIFwiXG4gICAgICAgICAgICBIRVhcbiAgICAgICAgICAgIFwiIERlY2ltYWwgcmVwcmVzZW50YXRpb24gXCJcbiAgICAgICAgICAgIERFQ1xuICAgICAgICB9XG4gICAgICAgIGApO1xuICAgICAgICBbJ1N0cmluZycsICdCb29sZWFuJywgJ0ludCcsICdGbG9hdCddLmZvckVhY2goZ2VuUUxTY2FsYXJUeXBlc0ZpbHRlcik7XG4gICAgICAgIGdlblFMRW51bVR5cGVzKCk7XG4gICAgICAgIHR5cGVzLmZvckVhY2godHlwZSA9PiBnZW5RTFR5cGVEZWNsYXJhdGlvbih0eXBlKSk7XG4gICAgICAgIGNvbnN0IHFsQXJyYXlGaWx0ZXJzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgICAgIHR5cGVzLmZvckVhY2godHlwZSA9PiBnZW5RTEZpbHRlcih0eXBlLCBxbEFycmF5RmlsdGVycykpO1xuXG4gICAgICAgIGNvbnN0IGNvbGxlY3Rpb25zID0gdHlwZXMuZmlsdGVyKHQgPT4gISF0LmNvbGxlY3Rpb24pO1xuICAgICAgICBnZW5RTFF1ZXJpZXMoY29sbGVjdGlvbnMpO1xuICAgICAgICBnZW5RTFN1YnNjcmlwdGlvbnMoY29sbGVjdGlvbnMpO1xuXG4gICAgICAgIC8vIEpTXG5cbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgY29uc3Qge1xuICAgICAgICAgICAgc2NhbGFyLFxuICAgICAgICAgICAgYmlnVUludDEsXG4gICAgICAgICAgICBiaWdVSW50MixcbiAgICAgICAgICAgIHJlc29sdmVCaWdVSW50LFxuICAgICAgICAgICAgc3RydWN0LFxuICAgICAgICAgICAgYXJyYXksXG4gICAgICAgICAgICBqb2luLFxuICAgICAgICAgICAgam9pbkFycmF5LFxuICAgICAgICAgICAgZW51bU5hbWUsXG4gICAgICAgICAgICBjcmVhdGVFbnVtTmFtZVJlc29sdmVyLFxuICAgICAgICAgICAgcmVzb2x2ZVVuaXhUaW1lU3RyaW5nLFxuICAgICAgICB9ID0gcmVxdWlyZSgnLi9kYi10eXBlcy5qcycpO1xuICAgICAgICBgKTtcbiAgICAgICAgY29uc3QganNBcnJheUZpbHRlcnMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICAgICAgdHlwZXMuZm9yRWFjaCh0eXBlID0+IGdlbkpTRmlsdGVyKHR5cGUsIGpzQXJyYXlGaWx0ZXJzKSk7XG5cbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgZnVuY3Rpb24gY3JlYXRlUmVzb2x2ZXJzKGRiKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICBgKTtcbiAgICAgICAgdHlwZXMuZm9yRWFjaCgodHlwZSkgPT4ge1xuICAgICAgICAgICAgZ2VuSlNDdXN0b21SZXNvbHZlcnModHlwZSk7XG4gICAgICAgICAgICBnZW5KU1R5cGVSZXNvbHZlcnNGb3JVbmlvbih0eXBlKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGpzLndyaXRlTG4oJyAgICAgICAgUXVlcnk6IHsnKTtcbiAgICAgICAgY29sbGVjdGlvbnMuZm9yRWFjaCgodHlwZSkgPT4ge1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgJHt0eXBlLmNvbGxlY3Rpb24gfHwgJyd9OiBkYi4ke3R5cGUuY29sbGVjdGlvbiB8fCAnJ30ucXVlcnlSZXNvbHZlcigpLGApXG4gICAgICAgIH0pO1xuICAgICAgICBqcy53cml0ZUxuKCcgICAgICAgIH0sJyk7XG4gICAgICAgIGpzLndyaXRlTG4oJyAgICAgICAgU3Vic2NyaXB0aW9uOiB7Jyk7XG4gICAgICAgIGNvbGxlY3Rpb25zLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICR7dHlwZS5jb2xsZWN0aW9uIHx8ICcnfTogZGIuJHt0eXBlLmNvbGxlY3Rpb24gfHwgJyd9LnN1YnNjcmlwdGlvblJlc29sdmVyKCksYClcbiAgICAgICAgfSk7XG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgYCk7XG5cbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgY29uc3Qgc2NhbGFyRmllbGRzID0gbmV3IE1hcCgpO1xuICAgICAgICBgKTtcbiAgICAgICAgY29sbGVjdGlvbnMuZm9yRWFjaCgodHlwZSkgPT4ge1xuICAgICAgICAgICAgZ2VuSlNTY2FsYXJGaWVsZHModHlwZSwgdHlwZS5jb2xsZWN0aW9uIHx8ICcnLCAnZG9jJyk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0ge1xuICAgICAgICAgICAgc2NhbGFyRmllbGRzLFxuICAgICAgICAgICAgY3JlYXRlUmVzb2x2ZXJzLFxuICAgICAgICBgKTtcbiAgICAgICAgdHlwZXMuZm9yRWFjaCh0eXBlID0+IGpzLndyaXRlTG4oYCAgICAke3R5cGUubmFtZX0sYCkpO1xuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICB9O1xuICAgICAgICBgKTtcbiAgICB9XG5cbiAgICBjb25zdCBzY2hlbWEgPSBwYXJzZVR5cGVEZWYoc2NoZW1hRGVmKTtcblxuICAgIGlmIChzY2hlbWEuY2xhc3MpIHtcbiAgICAgICAgcGFyc2VEYlR5cGVzKHNjaGVtYS5jbGFzcy50eXBlcyk7XG4gICAgICAgIGdlbmVyYXRlKGRiVHlwZXMpO1xuICAgIH1cblxuICAgIGZvciAoY29uc3QgZTogSW50RW51bURlZiBvZiBlbnVtVHlwZXMudmFsdWVzKCkpIHtcbiAgICAgICAgY29uc29sZS5sb2coYGV4cG9ydCBjb25zdCBRJHtlLm5hbWV9ID0ge2ApO1xuICAgICAgICBjb25zb2xlLmxvZyhPYmplY3QuZW50cmllcyhlLnZhbHVlcykubWFwKChbbmFtZSwgdmFsdWVdKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gYCAgICAke25hbWV9OiAkeyh2YWx1ZTogYW55KX0sYDtcbiAgICAgICAgfSkuam9pbignXFxuJykpO1xuICAgICAgICBjb25zb2xlLmxvZyhgfTtcXG5gKTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBxbDogcWwuZ2VuZXJhdGVkKCksXG4gICAgICAgIGpzOiBqcy5nZW5lcmF0ZWQoKSxcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IG1haW47XG4iXX0=