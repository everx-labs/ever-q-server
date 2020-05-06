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
      let docPath = `${parentDocPath}.${docName}`;

      if (field.arrayDepth > 0) {
        let suffix = '[*]';

        for (let depth = 10; depth > 0; depth -= 1) {
          const s = `[${'*'.repeat(depth)}]`;

          if (docPath.includes(s)) {
            suffix = `[${'*'.repeat(depth + 1)}]`;
            break;
          }
        }

        docPath = `${docPath}${suffix}`;
      }

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NlcnZlci9zY2hlbWEvcWwtanMtZ2VuZXJhdG9yLmpzIl0sIm5hbWVzIjpbIkRiVHlwZUNhdGVnb3J5IiwidW5yZXNvbHZlZCIsInNjYWxhciIsInVuaW9uIiwic3RydWN0Iiwic2NhbGFyVHlwZSIsIm5hbWUiLCJjYXRlZ29yeSIsImZpZWxkcyIsImRvYyIsInNjYWxhclR5cGVzIiwiaW50IiwidWludDY0IiwidWludDEwMjQiLCJmbG9hdCIsImJvb2xlYW4iLCJzdHJpbmciLCJpc0JpZ0ludCIsInR5cGUiLCJ1bnJlc29sdmVkVHlwZSIsImlzTG93ZXJDYXNlZCIsInMiLCJsIiwidG9Mb3dlckNhc2UiLCJ1IiwidG9VcHBlckNhc2UiLCJpc1VwcGVyQ2FzZWQiLCJ0b0FsbENhcHMiLCJyZXN1bHQiLCJpIiwibGVuZ3RoIiwidG9FbnVtU3R5bGUiLCJzdWJzdHIiLCJzdHJpbmdpZnlFbnVtVmFsdWVzIiwidmFsdWVzIiwiT2JqZWN0IiwiZW50cmllcyIsIm1hcCIsInZhbHVlIiwiam9pbiIsImdldERvY01EIiwic2NoZW1hIiwibWQiLCJtYWluIiwic2NoZW1hRGVmIiwiZGJUeXBlcyIsImxhc3RSZXBvcnRlZFR5cGUiLCJlbnVtVHlwZXMiLCJNYXAiLCJyZXBvcnRUeXBlIiwiZmllbGQiLCJjb25zb2xlIiwibG9nIiwicGFyc2VEYkZpZWxkIiwidHlwZU5hbWUiLCJzY2hlbWFGaWVsZCIsInNjaGVtYVR5cGUiLCJhcnJheURlcHRoIiwiaXNVbml4VGltZSIsImFycmF5IiwiZXgiLCJfIiwiZW51bURlZiIsImVudW0iLCJzZXQiLCJyZWYiLCJib29sIiwidW5zaWduZWQiLCJzaXplIiwiRXJyb3IiLCJKU09OIiwic3RyaW5naWZ5IiwicHJvY2VzcyIsImV4aXQiLCJ1bndyYXBBcnJheXMiLCJwYXJzZURiVHlwZSIsImNvbGxlY3Rpb24iLCJwdXNoIiwiZm9yRWFjaCIsInVud3JhcHBlZCIsIm93blR5cGUiLCJwYXJzZURiVHlwZXMiLCJ0eXBlcyIsInJlc29sdmluZyIsIlNldCIsInJlc29sdmVkIiwib3JkZXJlZFJlc29sdmVkIiwidCIsInJlc29sdmVUeXBlIiwiaGFzIiwiYWRkIiwiZ2V0IiwiZGVsZXRlIiwicWwiLCJXcml0ZXIiLCJqcyIsImdlblFMRG9jIiwicHJlZml4IiwidHJpbSIsImxpbmVzIiwic3BsaXQiLCJpbmNsdWRlcyIsIndyaXRlTG4iLCJsaW5lIiwidW5pb25WYXJpYW50VHlwZSIsInZhcmlhbnQiLCJnZW5RTFR5cGVEZWNsYXJhdGlvbnNGb3JVbmlvblZhcmlhbnRzIiwid3JpdGVCbG9ja0xuIiwiZ2VuUUxFbnVtVHlwZXMiLCJrZXlzIiwiZ2VuUUxUeXBlRGVjbGFyYXRpb24iLCJ0eXBlRGVjbGFyYXRpb24iLCJyZXBlYXQiLCJwYXJhbXMiLCJwcmV2ZW50VHdpY2UiLCJuYW1lcyIsIndvcmsiLCJnZW5RTEZpbHRlcnNGb3JBcnJheUZpZWxkcyIsInFsTmFtZXMiLCJpdGVtVHlwZU5hbWUiLCJmaWx0ZXJOYW1lIiwib3AiLCJnZW5RTEZpbHRlcnNGb3JFbnVtTmFtZUZpZWxkcyIsImdlblFMU2NhbGFyVHlwZXNGaWx0ZXIiLCJnZW5RTEZpbHRlciIsImdlblFMUXVlcmllcyIsImdlblFMU3Vic2NyaXB0aW9ucyIsImdldFNjYWxhclJlc29sdmVyTmFtZSIsImdlbkpTRmlsdGVyc0ZvckFycmF5RmllbGRzIiwianNOYW1lcyIsIml0ZW1SZXNvbHZlck5hbWUiLCJnZW5KU1N0cnVjdEZpbHRlciIsInN1ZmZpeCIsIm9uIiwicmVmT24iLCJnZW5KU1VuaW9uUmVzb2x2ZXIiLCJnZW5KU0ZpbHRlciIsImdlbkpTQ3VzdG9tUmVzb2x2ZXJzIiwiam9pbkZpZWxkcyIsImZpbHRlciIsIngiLCJiaWdVSW50RmllbGRzIiwidW5peFRpbWVGaWVsZHMiLCJlbnVtRmllbGRzIiwiY3VzdG9tUmVzb2x2ZXJSZXF1aXJlZCIsIm9uRmllbGQiLCJmaW5kIiwicHJlIiwicHJlQ29uZGl0aW9uIiwicG9zdCIsInByZWZpeExlbmd0aCIsImdlbkpTU2NhbGFyRmllbGRzIiwicGFyZW50UGF0aCIsInBhcmVudERvY1BhdGgiLCJkb2NOYW1lIiwicGF0aCIsImRvY1BhdGgiLCJkZXB0aCIsImdlbkpTVHlwZVJlc29sdmVyc0ZvclVuaW9uIiwiZ2VuZXJhdGUiLCJxbEFycmF5RmlsdGVycyIsImNvbGxlY3Rpb25zIiwianNBcnJheUZpbHRlcnMiLCJjbGFzcyIsImUiLCJnZW5lcmF0ZWQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFFQTs7QUFFQTs7QUFFQSxNQUFNQSxjQUFjLEdBQUc7QUFDbkJDLEVBQUFBLFVBQVUsRUFBRSxZQURPO0FBRW5CQyxFQUFBQSxNQUFNLEVBQUUsUUFGVztBQUduQkMsRUFBQUEsS0FBSyxFQUFFLE9BSFk7QUFJbkJDLEVBQUFBLE1BQU0sRUFBRTtBQUpXLENBQXZCOztBQXVDQSxTQUFTQyxVQUFULENBQW9CQyxJQUFwQixFQUEwQztBQUN0QyxTQUFPO0FBQ0hBLElBQUFBLElBREc7QUFFSEMsSUFBQUEsUUFBUSxFQUFFUCxjQUFjLENBQUNFLE1BRnRCO0FBR0hNLElBQUFBLE1BQU0sRUFBRSxFQUhMO0FBSUhDLElBQUFBLEdBQUcsRUFBRTtBQUpGLEdBQVA7QUFNSDs7QUFFRCxNQUFNQyxXQUFXLEdBQUc7QUFDaEJDLEVBQUFBLEdBQUcsRUFBRU4sVUFBVSxDQUFDLEtBQUQsQ0FEQztBQUVoQk8sRUFBQUEsTUFBTSxFQUFFUCxVQUFVLENBQUMsUUFBRCxDQUZGO0FBR2hCUSxFQUFBQSxRQUFRLEVBQUVSLFVBQVUsQ0FBQyxRQUFELENBSEo7QUFJaEJTLEVBQUFBLEtBQUssRUFBRVQsVUFBVSxDQUFDLE9BQUQsQ0FKRDtBQUtoQlUsRUFBQUEsT0FBTyxFQUFFVixVQUFVLENBQUMsU0FBRCxDQUxIO0FBTWhCVyxFQUFBQSxNQUFNLEVBQUVYLFVBQVUsQ0FBQyxRQUFEO0FBTkYsQ0FBcEI7O0FBU0EsU0FBU1ksUUFBVCxDQUFrQkMsSUFBbEIsRUFBeUM7QUFDckMsU0FBT0EsSUFBSSxLQUFLUixXQUFXLENBQUNH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LEVBQUUsRUFBRUEsRUFBRSxDQUFDc0UsU0FBSDtBQUZELEdBQVA7QUFJSDs7ZUFFYzFILEkiLCJzb3VyY2VzQ29udGVudCI6WyIvL0BmbG93XG5cbmltcG9ydCB7IG1ha2VGaWVsZFR5cGVOYW1lLCBXcml0ZXIgfSBmcm9tICd0b24tbGFicy1kZXYtb3BzL2Rpc3Qvc3JjL2dlbi5qcyc7XG5pbXBvcnQgdHlwZSB7IFNjaGVtYURvYywgU2NoZW1hTWVtYmVyLCBTY2hlbWFUeXBlLCBUeXBlRGVmIH0gZnJvbSAndG9uLWxhYnMtZGV2LW9wcy9zcmMvc2NoZW1hLmpzJztcbmltcG9ydCB7IHBhcnNlVHlwZURlZiB9IGZyb20gJ3Rvbi1sYWJzLWRldi1vcHMvZGlzdC9zcmMvc2NoZW1hLmpzJztcblxuY29uc3QgRGJUeXBlQ2F0ZWdvcnkgPSB7XG4gICAgdW5yZXNvbHZlZDogJ3VucmVzb2x2ZWQnLFxuICAgIHNjYWxhcjogJ3NjYWxhcicsXG4gICAgdW5pb246ICd1bmlvbicsXG4gICAgc3RydWN0OiAnc3RydWN0Jyxcbn07XG5cbnR5cGUgRGJKb2luID0ge1xuICAgIGNvbGxlY3Rpb246IHN0cmluZyxcbiAgICBvbjogc3RyaW5nLFxuICAgIHJlZk9uOiBzdHJpbmcsXG4gICAgcHJlQ29uZGl0aW9uOiBzdHJpbmcsXG59XG5cbnR5cGUgRGJUeXBlID0ge1xuICAgIG5hbWU6IHN0cmluZyxcbiAgICBmaWVsZHM6IERiRmllbGRbXSxcbiAgICBjYXRlZ29yeTogJ3VucmVzb2x2ZWQnIHwgJ3NjYWxhcicgfCAndW5pb24nIHwgJ3N0cnVjdCcsXG4gICAgY29sbGVjdGlvbj86IHN0cmluZyxcbiAgICBkb2M6IHN0cmluZyxcbn1cblxudHlwZSBJbnRFbnVtRGVmID0ge1xuICAgIG5hbWU6IHN0cmluZyxcbiAgICB2YWx1ZXM6IHtcbiAgICAgICAgW3N0cmluZ106IG51bWJlclxuICAgIH0sXG59XG5cbnR5cGUgRGJGaWVsZCA9IHtcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgdHlwZTogRGJUeXBlLFxuICAgIGFycmF5RGVwdGg6IG51bWJlcixcbiAgICBqb2luPzogRGJKb2luLFxuICAgIGVudW1EZWY/OiBJbnRFbnVtRGVmLFxuICAgIGlzVW5peFRpbWU6IGJvb2xlYW4sXG4gICAgZG9jOiBzdHJpbmcsXG59XG5cbmZ1bmN0aW9uIHNjYWxhclR5cGUobmFtZTogc3RyaW5nKTogRGJUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBuYW1lLFxuICAgICAgICBjYXRlZ29yeTogRGJUeXBlQ2F0ZWdvcnkuc2NhbGFyLFxuICAgICAgICBmaWVsZHM6IFtdLFxuICAgICAgICBkb2M6ICcnLFxuICAgIH1cbn1cblxuY29uc3Qgc2NhbGFyVHlwZXMgPSB7XG4gICAgaW50OiBzY2FsYXJUeXBlKCdJbnQnKSxcbiAgICB1aW50NjQ6IHNjYWxhclR5cGUoJ1N0cmluZycpLFxuICAgIHVpbnQxMDI0OiBzY2FsYXJUeXBlKCdTdHJpbmcnKSxcbiAgICBmbG9hdDogc2NhbGFyVHlwZSgnRmxvYXQnKSxcbiAgICBib29sZWFuOiBzY2FsYXJUeXBlKCdCb29sZWFuJyksXG4gICAgc3RyaW5nOiBzY2FsYXJUeXBlKCdTdHJpbmcnKSxcbn07XG5cbmZ1bmN0aW9uIGlzQmlnSW50KHR5cGU6IERiVHlwZSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0eXBlID09PSBzY2FsYXJUeXBlcy51aW50MTAyNCB8fCB0eXBlID09PSBzY2FsYXJUeXBlcy51aW50NjQ7XG59XG5cbmZ1bmN0aW9uIHVucmVzb2x2ZWRUeXBlKG5hbWU6IHN0cmluZyk6IERiVHlwZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgbmFtZSxcbiAgICAgICAgY2F0ZWdvcnk6IERiVHlwZUNhdGVnb3J5LnVucmVzb2x2ZWQsXG4gICAgICAgIGZpZWxkczogW10sXG4gICAgICAgIGRvYzogJycsXG4gICAgfVxufVxuXG5mdW5jdGlvbiBpc0xvd2VyQ2FzZWQoczogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgY29uc3QgbCA9IHMudG9Mb3dlckNhc2UoKTtcbiAgICBjb25zdCB1ID0gcy50b1VwcGVyQ2FzZSgpO1xuICAgIHJldHVybiAodSAhPT0gbCkgJiYgKHMgPT09IGwpO1xufVxuXG5mdW5jdGlvbiBpc1VwcGVyQ2FzZWQoczogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgY29uc3QgbCA9IHMudG9Mb3dlckNhc2UoKTtcbiAgICBjb25zdCB1ID0gcy50b1VwcGVyQ2FzZSgpO1xuICAgIHJldHVybiAodSAhPT0gbCkgJiYgKHMgPT09IHUpO1xufVxuXG5mdW5jdGlvbiB0b0FsbENhcHMoczogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBsZXQgcmVzdWx0ID0gJyc7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGlmICgoaSA+IDApICYmIChzW2kgLSAxXSAhPT0gJ18nKSAmJiBpc0xvd2VyQ2FzZWQoc1tpIC0gMV0pICYmIGlzVXBwZXJDYXNlZChzW2ldKSkge1xuICAgICAgICAgICAgcmVzdWx0ICs9ICdfJztcbiAgICAgICAgfVxuICAgICAgICByZXN1bHQgKz0gc1tpXTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdC50b1VwcGVyQ2FzZSgpO1xufVxuXG5mdW5jdGlvbiB0b0VudW1TdHlsZShzOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiBgJHtzLnN1YnN0cigwLCAxKS50b1VwcGVyQ2FzZSgpfSR7cy5zdWJzdHIoMSl9YDtcbn1cblxuZnVuY3Rpb24gc3RyaW5naWZ5RW51bVZhbHVlcyh2YWx1ZXM6IHsgW3N0cmluZ106IG51bWJlciB9KTogc3RyaW5nIHtcbiAgICBjb25zdCBmaWVsZHMgPSBPYmplY3QuZW50cmllcyh2YWx1ZXMpLm1hcCgoW25hbWUsIHZhbHVlXSkgPT4ge1xuICAgICAgICByZXR1cm4gYCR7dG9FbnVtU3R5bGUobmFtZSl9OiAkeyh2YWx1ZTogYW55KX1gO1xuICAgIH0pO1xuICAgIHJldHVybiBgeyAke2ZpZWxkcy5qb2luKCcsICcpfSB9YDtcbn1cblxuZnVuY3Rpb24gZ2V0RG9jTUQoc2NoZW1hOiBTY2hlbWFEb2MpOiBzdHJpbmcge1xuICAgIGNvbnN0IGRvYyA9IHNjaGVtYS5kb2M7XG4gICAgaWYgKCFkb2MpIHtcbiAgICAgICAgcmV0dXJuICcnO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGRvYyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgcmV0dXJuIGRvYztcbiAgICB9XG4gICAgaWYgKGRvYy5tZCkge1xuICAgICAgICByZXR1cm4gKGRvYy5tZDogYW55KTtcbiAgICB9XG4gICAgcmV0dXJuICcnO1xufVxuXG5mdW5jdGlvbiBtYWluKHNjaGVtYURlZjogVHlwZURlZikge1xuXG4gICAgbGV0IGRiVHlwZXM6IERiVHlwZVtdID0gW107XG4gICAgbGV0IGxhc3RSZXBvcnRlZFR5cGU6IHN0cmluZyA9ICcnO1xuICAgIGxldCBlbnVtVHlwZXM6IE1hcDxzdHJpbmcsIEludEVudW1EZWY+ID0gbmV3IE1hcCgpO1xuXG4gICAgZnVuY3Rpb24gcmVwb3J0VHlwZShuYW1lOiBzdHJpbmcsIGZpZWxkOiBzdHJpbmcsIHR5cGU6IHN0cmluZykge1xuICAgICAgICBpZiAobmFtZSAhPT0gbGFzdFJlcG9ydGVkVHlwZSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2cobmFtZSk7XG4gICAgICAgICAgICBsYXN0UmVwb3J0ZWRUeXBlID0gbmFtZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmxvZyhgICAgICR7ZmllbGR9OiAke3R5cGV9YCk7XG5cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZURiRmllbGQoXG4gICAgICAgIHR5cGVOYW1lOiBzdHJpbmcsXG4gICAgICAgIHNjaGVtYUZpZWxkOiBTY2hlbWFNZW1iZXI8U2NoZW1hVHlwZT4sXG4gICAgKTogRGJGaWVsZCB7XG4gICAgICAgIGxldCBzY2hlbWFUeXBlID0gc2NoZW1hRmllbGQ7XG4gICAgICAgIGNvbnN0IGZpZWxkOiBEYkZpZWxkID0ge1xuICAgICAgICAgICAgbmFtZTogc2NoZW1hRmllbGQubmFtZSxcbiAgICAgICAgICAgIGFycmF5RGVwdGg6IDAsXG4gICAgICAgICAgICB0eXBlOiBzY2FsYXJUeXBlcy5zdHJpbmcsXG4gICAgICAgICAgICBkb2M6IGdldERvY01EKHNjaGVtYUZpZWxkKSxcbiAgICAgICAgICAgIGlzVW5peFRpbWU6IGZhbHNlLFxuICAgICAgICB9O1xuICAgICAgICB3aGlsZSAoc2NoZW1hVHlwZS5hcnJheSkge1xuICAgICAgICAgICAgZmllbGQuYXJyYXlEZXB0aCArPSAxO1xuICAgICAgICAgICAgc2NoZW1hVHlwZSA9IHNjaGVtYVR5cGUuYXJyYXk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZXggPSAoc2NoZW1hVHlwZTogYW55KS5fO1xuICAgICAgICBjb25zdCBlbnVtRGVmOiA/SW50RW51bURlZiA9IChleCAmJiBleC5lbnVtKSB8fCBudWxsO1xuICAgICAgICBpZiAoZW51bURlZikge1xuICAgICAgICAgICAgZmllbGQuZW51bURlZiA9IGVudW1EZWY7XG4gICAgICAgICAgICBlbnVtVHlwZXMuc2V0KGVudW1EZWYubmFtZSwgZW51bURlZik7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgam9pbiA9IGV4ICYmIGV4LmpvaW47XG4gICAgICAgIGlmIChqb2luKSB7XG4gICAgICAgICAgICBmaWVsZC5qb2luID0gam9pbjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZXggJiYgZXguaXNVbml4VGltZSkge1xuICAgICAgICAgICAgZmllbGQuaXNVbml4VGltZSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNjaGVtYVR5cGUudW5pb24gfHwgc2NoZW1hVHlwZS5zdHJ1Y3QpIHtcbiAgICAgICAgICAgIGZpZWxkLnR5cGUgPSB1bnJlc29sdmVkVHlwZShtYWtlRmllbGRUeXBlTmFtZSh0eXBlTmFtZSwgc2NoZW1hRmllbGQubmFtZSkpO1xuICAgICAgICB9IGVsc2UgaWYgKHNjaGVtYVR5cGUucmVmKSB7XG4gICAgICAgICAgICBmaWVsZC50eXBlID0gdW5yZXNvbHZlZFR5cGUoc2NoZW1hVHlwZS5yZWYubmFtZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoc2NoZW1hVHlwZS5ib29sKSB7XG4gICAgICAgICAgICBmaWVsZC50eXBlID0gc2NhbGFyVHlwZXMuYm9vbGVhbjtcbiAgICAgICAgfSBlbHNlIGlmIChzY2hlbWFUeXBlLmludCkge1xuICAgICAgICAgICAgY29uc3QgdW5zaWduZWQ6IGJvb2xlYW4gPSAoc2NoZW1hVHlwZS5pbnQgJiYgc2NoZW1hVHlwZS5pbnQudW5zaWduZWQpIHx8IGZhbHNlO1xuICAgICAgICAgICAgY29uc3Qgc2l6ZTogbnVtYmVyID0gKHNjaGVtYVR5cGUuaW50ICYmIHNjaGVtYVR5cGUuaW50LnNpemUpIHx8IDMyO1xuICAgICAgICAgICAgaWYgKHVuc2lnbmVkKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNpemUgPj0gMTI4KSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcG9ydFR5cGUodHlwZU5hbWUsIGZpZWxkLm5hbWUsICd1MTAyNCcpO1xuICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlID0gc2NhbGFyVHlwZXMudWludDEwMjQ7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzaXplID49IDY0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcG9ydFR5cGUodHlwZU5hbWUsIGZpZWxkLm5hbWUsICd1NjQnKTtcbiAgICAgICAgICAgICAgICAgICAgZmllbGQudHlwZSA9IHNjYWxhclR5cGVzLnVpbnQ2NDtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHNpemUgPj0gMzIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVwb3J0VHlwZSh0eXBlTmFtZSwgZmllbGQubmFtZSwgJ3UzMicpO1xuICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlID0gc2NhbGFyVHlwZXMuZmxvYXQ7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVwb3J0VHlwZSh0eXBlTmFtZSwgZmllbGQubmFtZSwgYHUke3NpemV9YCk7XG4gICAgICAgICAgICAgICAgICAgIGZpZWxkLnR5cGUgPSBzY2FsYXJUeXBlcy5pbnQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoc2l6ZSA+IDMyKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSW50ZWdlciB0eXBlIHdpdGggc2l6ZSAke3NpemV9IGJpdCBkb2VzIG5vdCBzdXBwb3J0ZWRgKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXBvcnRUeXBlKHR5cGVOYW1lLCBmaWVsZC5uYW1lLCAnaTMyJyk7XG4gICAgICAgICAgICAgICAgICAgIGZpZWxkLnR5cGUgPSBzY2FsYXJUeXBlcy5pbnQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHNjaGVtYVR5cGUuZmxvYXQpIHtcbiAgICAgICAgICAgIHJlcG9ydFR5cGUodHlwZU5hbWUsIGZpZWxkLm5hbWUsICdmbG9hdCcpO1xuICAgICAgICAgICAgZmllbGQudHlwZSA9IHNjYWxhclR5cGVzLmZsb2F0O1xuICAgICAgICB9IGVsc2UgaWYgKHNjaGVtYVR5cGUuc3RyaW5nKSB7XG4gICAgICAgICAgICBmaWVsZC50eXBlID0gc2NhbGFyVHlwZXMuc3RyaW5nO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZmllbGQudHlwZSA9IHNjYWxhclR5cGVzLnN0cmluZztcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdJbnZhbGlkIGZpZWxkIHR5cGU6ICcsIEpTT04uc3RyaW5naWZ5KHNjaGVtYVR5cGUpKTtcbiAgICAgICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmllbGQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdW53cmFwQXJyYXlzKHR5cGU6IFNjaGVtYVR5cGUpOiBTY2hlbWFUeXBlIHtcbiAgICAgICAgaWYgKHR5cGUuYXJyYXkpIHtcbiAgICAgICAgICAgIHJldHVybiB1bndyYXBBcnJheXModHlwZS5hcnJheSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHR5cGU7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VEYlR5cGUoXG4gICAgICAgIG5hbWU6IHN0cmluZyxcbiAgICAgICAgc2NoZW1hVHlwZTogU2NoZW1hVHlwZVxuICAgICkge1xuICAgICAgICBjb25zdCBzdHJ1Y3QgPSBzY2hlbWFUeXBlLnVuaW9uIHx8IHNjaGVtYVR5cGUuc3RydWN0O1xuICAgICAgICBpZiAoIXN0cnVjdCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYD8/ICR7bmFtZX06ICR7SlNPTi5zdHJpbmdpZnkoc2NoZW1hVHlwZSkuc3Vic3RyKDAsIDIwMCl9YCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdHlwZTogRGJUeXBlID0ge1xuICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgIGNhdGVnb3J5OiBzY2hlbWFUeXBlLnVuaW9uID8gRGJUeXBlQ2F0ZWdvcnkudW5pb24gOiBEYlR5cGVDYXRlZ29yeS5zdHJ1Y3QsXG4gICAgICAgICAgICBmaWVsZHM6IFtdLFxuICAgICAgICAgICAgY29sbGVjdGlvbjogKHNjaGVtYVR5cGU6IGFueSkuXy5jb2xsZWN0aW9uLFxuICAgICAgICAgICAgZG9jOiBnZXREb2NNRChzY2hlbWFUeXBlKSxcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAodHlwZS5jb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICB0eXBlLmZpZWxkcy5wdXNoKHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnaWQnLFxuICAgICAgICAgICAgICAgIGFycmF5RGVwdGg6IDAsXG4gICAgICAgICAgICAgICAgdHlwZTogc2NhbGFyVHlwZXMuc3RyaW5nLFxuICAgICAgICAgICAgICAgIGlzVW5peFRpbWU6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGRvYzogJycsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBzdHJ1Y3QuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIHR5cGUuZmllbGRzLnB1c2gocGFyc2VEYkZpZWxkKG5hbWUsIGZpZWxkKSk7XG4gICAgICAgICAgICBjb25zdCB1bndyYXBwZWQgPSB1bndyYXBBcnJheXMoZmllbGQpO1xuICAgICAgICAgICAgY29uc3Qgb3duVHlwZSA9ICh1bndyYXBwZWQuc3RydWN0IHx8IHVud3JhcHBlZC51bmlvbikgPyB1bndyYXBwZWQgOiBudWxsO1xuICAgICAgICAgICAgaWYgKG93blR5cGUpIHtcbiAgICAgICAgICAgICAgICBwYXJzZURiVHlwZShtYWtlRmllbGRUeXBlTmFtZShuYW1lLCBmaWVsZC5uYW1lKSwgb3duVHlwZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBkYlR5cGVzLnB1c2godHlwZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VEYlR5cGVzKHR5cGVzOiBTY2hlbWFNZW1iZXI8U2NoZW1hVHlwZT5bXSkge1xuICAgICAgICB0eXBlcy5mb3JFYWNoKCh0eXBlOiBTY2hlbWFNZW1iZXI8U2NoZW1hVHlwZT4pID0+IHtcbiAgICAgICAgICAgIHBhcnNlRGJUeXBlKHR5cGUubmFtZSwgdHlwZSk7XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCB1bnJlc29sdmVkOiBNYXA8c3RyaW5nLCBEYlR5cGU+ID0gbmV3IE1hcDxzdHJpbmcsIERiVHlwZT4oKTtcbiAgICAgICAgY29uc3QgcmVzb2x2aW5nOiBTZXQ8c3RyaW5nPiA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgICAgICBjb25zdCByZXNvbHZlZDogTWFwPHN0cmluZywgRGJUeXBlPiA9IG5ldyBNYXA8c3RyaW5nLCBEYlR5cGU+KCk7XG4gICAgICAgIGNvbnN0IG9yZGVyZWRSZXNvbHZlZDogRGJUeXBlW10gPSBbXTtcbiAgICAgICAgZGJUeXBlcy5mb3JFYWNoKHQgPT4gdW5yZXNvbHZlZC5zZXQodC5uYW1lLCB0KSk7XG4gICAgICAgIGNvbnN0IHJlc29sdmVUeXBlID0gKHR5cGU6IERiVHlwZSkgPT4ge1xuICAgICAgICAgICAgaWYgKHJlc29sdmVkLmhhcyh0eXBlLm5hbWUpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHJlc29sdmluZy5oYXModHlwZS5uYW1lKSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBXQVJOSU5HOiBDaXJjdWxhciByZWZlcmVuY2UgdG8gdHlwZSAke3R5cGUubmFtZX1gKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXNvbHZpbmcuYWRkKHR5cGUubmFtZSk7XG4gICAgICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChmaWVsZC50eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS51bnJlc29sdmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCB0eXBlID0gcmVzb2x2ZWQuZ2V0KGZpZWxkLnR5cGUubmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghdHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSA9IHVucmVzb2x2ZWQuZ2V0KGZpZWxkLnR5cGUubmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmVUeXBlKHR5cGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgUmVmZXJlbmNlZCB0eXBlIG5vdCBmb3VuZDogJHtmaWVsZC50eXBlLm5hbWV9YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlID0gdHlwZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmVzb2x2aW5nLmRlbGV0ZSh0eXBlLm5hbWUpO1xuICAgICAgICAgICAgb3JkZXJlZFJlc29sdmVkLnB1c2godHlwZSk7XG4gICAgICAgICAgICB1bnJlc29sdmVkLmRlbGV0ZSh0eXBlLm5hbWUpO1xuICAgICAgICAgICAgcmVzb2x2ZWQuc2V0KHR5cGUubmFtZSwgdHlwZSk7XG4gICAgICAgIH07XG4gICAgICAgIGRiVHlwZXMuZm9yRWFjaChyZXNvbHZlVHlwZSk7XG4gICAgICAgIGRiVHlwZXMgPSBvcmRlcmVkUmVzb2x2ZWQ7XG4gICAgfVxuXG4vLyBHZW5lcmF0b3JzXG5cbiAgICBjb25zdCBxbCA9IG5ldyBXcml0ZXIoKTtcbiAgICBjb25zdCBqcyA9IG5ldyBXcml0ZXIoKTtcblxuICAgIGZ1bmN0aW9uIGdlblFMRG9jKHByZWZpeDogc3RyaW5nLCBkb2M6IHN0cmluZykge1xuICAgICAgICBpZiAoZG9jLnRyaW0oKSA9PT0gJycpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBsaW5lcyA9IGRvYy5zcGxpdCgvXFxuXFxyP3xcXHJcXG4/Lyk7XG4gICAgICAgIGlmIChsaW5lcy5sZW5ndGggPT09IDEgJiYgIWxpbmVzWzBdLmluY2x1ZGVzKCdcIicpKSB7XG4gICAgICAgICAgICBxbC53cml0ZUxuKHByZWZpeCwgJ1wiJywgbGluZXNbMF0sICdcIicpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcWwud3JpdGVMbihwcmVmaXgsICdcIlwiXCInKTtcbiAgICAgICAgICAgIGxpbmVzLmZvckVhY2goKGxpbmUpID0+IHtcbiAgICAgICAgICAgICAgICBxbC53cml0ZUxuKHByZWZpeCwgbGluZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHFsLndyaXRlTG4ocHJlZml4LCAnXCJcIlwiJyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiB1bmlvblZhcmlhbnRUeXBlKHR5cGU6IERiVHlwZSwgdmFyaWFudDogRGJGaWVsZCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiBgJHt0eXBlLm5hbWV9JHt2YXJpYW50Lm5hbWV9VmFyaWFudGA7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuUUxUeXBlRGVjbGFyYXRpb25zRm9yVW5pb25WYXJpYW50cyh0eXBlOiBEYlR5cGUpIHtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgodmFyaWFudCkgPT4ge1xuICAgICAgICAgICAgcWwud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgdHlwZSAke3VuaW9uVmFyaWFudFR5cGUodHlwZSwgdmFyaWFudCl9IHtcbiAgICAgICAgICAgICR7dmFyaWFudC5uYW1lfTogJHt2YXJpYW50LnR5cGUubmFtZX1cbiAgICAgICAgfVxuXG4gICAgICAgIGApO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5RTEVudW1UeXBlcygpIHtcbiAgICAgICAgZm9yIChjb25zdCBlbnVtRGVmOiBJbnRFbnVtRGVmIG9mIGVudW1UeXBlcy52YWx1ZXMoKSkge1xuICAgICAgICAgICAgcWwud3JpdGVMbihgZW51bSAke2VudW1EZWYubmFtZX1FbnVtIHtgKTtcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKGVudW1EZWYudmFsdWVzKS5mb3JFYWNoKChuYW1lKSA9PiB7XG4gICAgICAgICAgICAgICAgcWwud3JpdGVMbihgICAgICR7dG9FbnVtU3R5bGUobmFtZSl9YCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oYH1gKTtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlblFMVHlwZURlY2xhcmF0aW9uKHR5cGU6IERiVHlwZSkge1xuICAgICAgICBpZiAodHlwZS5jYXRlZ29yeSA9PT0gRGJUeXBlQ2F0ZWdvcnkudW5pb24pIHtcbiAgICAgICAgICAgIGdlblFMVHlwZURlY2xhcmF0aW9uc0ZvclVuaW9uVmFyaWFudHModHlwZSk7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGB1bmlvbiAke3R5cGUubmFtZX0gPSBgKTtcbiAgICAgICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2godmFyaWFudCA9PiB7XG4gICAgICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0fCAke3VuaW9uVmFyaWFudFR5cGUodHlwZSwgdmFyaWFudCl9YCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGdlblFMRG9jKCcnLCB0eXBlLmRvYyk7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGB0eXBlICR7dHlwZS5uYW1lfSB7YCk7XG4gICAgICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKGZpZWxkID0+IHtcbiAgICAgICAgICAgICAgICBnZW5RTERvYygnXFx0JywgZmllbGQuZG9jKTtcbiAgICAgICAgICAgICAgICBjb25zdCB0eXBlRGVjbGFyYXRpb24gPVxuICAgICAgICAgICAgICAgICAgICAnWycucmVwZWF0KGZpZWxkLmFycmF5RGVwdGgpICtcbiAgICAgICAgICAgICAgICAgICAgZmllbGQudHlwZS5uYW1lICtcbiAgICAgICAgICAgICAgICAgICAgJ10nLnJlcGVhdChmaWVsZC5hcnJheURlcHRoKTtcbiAgICAgICAgICAgICAgICBsZXQgcGFyYW1zID0gJyc7XG4gICAgICAgICAgICAgICAgaWYgKGlzQmlnSW50KGZpZWxkLnR5cGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhcmFtcyA9ICcoZm9ybWF0OiBCaWdJbnRGb3JtYXQpJztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLmpvaW4pIHtcbiAgICAgICAgICAgICAgICAgICAgcGFyYW1zID0gJyh0aW1lb3V0OiBJbnQpJztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBxbC53cml0ZUxuKGBcXHQke2ZpZWxkLm5hbWV9JHtwYXJhbXN9OiAke3R5cGVEZWNsYXJhdGlvbn1gKTtcbiAgICAgICAgICAgICAgICBjb25zdCBlbnVtRGVmID0gZmllbGQuZW51bURlZjtcbiAgICAgICAgICAgICAgICBpZiAoZW51bURlZikge1xuICAgICAgICAgICAgICAgICAgICBxbC53cml0ZUxuKGBcXHQke2ZpZWxkLm5hbWV9X25hbWU6ICR7ZW51bURlZi5uYW1lfUVudW1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGZpZWxkLmlzVW5peFRpbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0JHtmaWVsZC5uYW1lfV9zdHJpbmc6IFN0cmluZ2ApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcWwud3JpdGVMbihgfWApO1xuICAgICAgICB9XG4gICAgICAgIHFsLndyaXRlTG4oKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwcmV2ZW50VHdpY2UobmFtZTogc3RyaW5nLCBuYW1lczogU2V0PHN0cmluZz4sIHdvcms6ICgpID0+IHZvaWQpIHtcbiAgICAgICAgaWYgKCFuYW1lcy5oYXMobmFtZSkpIHtcbiAgICAgICAgICAgIG5hbWVzLmFkZChuYW1lKTtcbiAgICAgICAgICAgIHdvcmsoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlblFMRmlsdGVyc0ZvckFycmF5RmllbGRzKHR5cGU6IERiVHlwZSwgcWxOYW1lczogU2V0PHN0cmluZz4pIHtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGxldCBpdGVtVHlwZU5hbWUgPSBmaWVsZC50eXBlLm5hbWU7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZpZWxkLmFycmF5RGVwdGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpbHRlck5hbWUgPSBgJHtpdGVtVHlwZU5hbWV9QXJyYXlGaWx0ZXJgO1xuICAgICAgICAgICAgICAgIHByZXZlbnRUd2ljZShmaWx0ZXJOYW1lLCBxbE5hbWVzLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHFsLndyaXRlTG4oYGlucHV0ICR7ZmlsdGVyTmFtZX0ge2ApO1xuICAgICAgICAgICAgICAgICAgICBbJ2FueScsICdhbGwnXS5mb3JFYWNoKChvcCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0JHtvcH06ICR7aXRlbVR5cGVOYW1lfUZpbHRlcmApO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgcWwud3JpdGVMbignfScpO1xuICAgICAgICAgICAgICAgICAgICBxbC53cml0ZUxuKCk7XG5cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBpdGVtVHlwZU5hbWUgKz0gJ0FycmF5JztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuUUxGaWx0ZXJzRm9yRW51bU5hbWVGaWVsZHModHlwZTogRGJUeXBlLCBxbE5hbWVzOiBTZXQ8c3RyaW5nPikge1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgZW51bURlZiA9IGZpZWxkLmVudW1EZWY7XG4gICAgICAgICAgICBpZiAoZW51bURlZikge1xuICAgICAgICAgICAgICAgIHByZXZlbnRUd2ljZShgJHtlbnVtRGVmLm5hbWV9RW51bUZpbHRlcmAsIHFsTmFtZXMsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgZ2VuUUxTY2FsYXJUeXBlc0ZpbHRlcihgJHtlbnVtRGVmLm5hbWV9RW51bWApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5RTEZpbHRlcih0eXBlOiBEYlR5cGUsIHFsTmFtZXM6IFNldDxzdHJpbmc+KSB7XG4gICAgICAgIGlmICh0eXBlLmZpZWxkcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBnZW5RTEZpbHRlcnNGb3JBcnJheUZpZWxkcyh0eXBlLCBxbE5hbWVzKTtcbiAgICAgICAgZ2VuUUxGaWx0ZXJzRm9yRW51bU5hbWVGaWVsZHModHlwZSwgcWxOYW1lcyk7XG4gICAgICAgIGdlblFMRG9jKCcnLCB0eXBlLmRvYyk7XG4gICAgICAgIHFsLndyaXRlTG4oYGlucHV0ICR7dHlwZS5uYW1lfUZpbHRlciB7YCk7XG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBnZW5RTERvYygnXFx0JywgZmllbGQuZG9jKTtcbiAgICAgICAgICAgIGNvbnN0IHR5cGVEZWNsYXJhdGlvbiA9IGZpZWxkLnR5cGUubmFtZSArIFwiQXJyYXlcIi5yZXBlYXQoZmllbGQuYXJyYXlEZXB0aCk7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGBcXHQke2ZpZWxkLm5hbWV9OiAke3R5cGVEZWNsYXJhdGlvbn1GaWx0ZXJgKTtcbiAgICAgICAgICAgIGNvbnN0IGVudW1EZWYgPSBmaWVsZC5lbnVtRGVmO1xuICAgICAgICAgICAgaWYgKGVudW1EZWYpIHtcbiAgICAgICAgICAgICAgICBxbC53cml0ZUxuKGBcXHQke2ZpZWxkLm5hbWV9X25hbWU6ICR7ZW51bURlZi5uYW1lfUVudW1GaWx0ZXJgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHFsLndyaXRlTG4oYCAgICBPUjogJHt0eXBlLm5hbWV9RmlsdGVyYCk7XG4gICAgICAgIHFsLndyaXRlTG4oYH1gKTtcbiAgICAgICAgcWwud3JpdGVMbigpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlblFMU2NhbGFyVHlwZXNGaWx0ZXIobmFtZTogc3RyaW5nKSB7XG4gICAgICAgIHFsLndyaXRlTG4oYGlucHV0ICR7bmFtZX1GaWx0ZXIge2ApO1xuICAgICAgICBbJ2VxJywgJ25lJywgJ2d0JywgJ2x0JywgJ2dlJywgJ2xlJ10uZm9yRWFjaCgob3ApID0+IHtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oYFxcdCR7b3B9OiAke25hbWV9YCk7XG4gICAgICAgIH0pO1xuICAgICAgICBbJ2luJywgJ25vdEluJ10uZm9yRWFjaCgob3ApID0+IHtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oYFxcdCR7b3B9OiBbJHtuYW1lfV1gKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHFsLndyaXRlTG4oJ30nKTtcbiAgICAgICAgcWwud3JpdGVMbigpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlblFMUXVlcmllcyh0eXBlczogRGJUeXBlW10pIHtcbiAgICAgICAgcWwud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgXCJTcGVjaWZ5IHNvcnQgb3JkZXIgZGlyZWN0aW9uXCJcbiAgICAgICAgZW51bSBRdWVyeU9yZGVyQnlEaXJlY3Rpb24ge1xuICAgICAgICAgICAgXCJEb2N1bWVudHMgd2lsbCBiZSBzb3J0ZWQgaW4gYXNjZW5kZWQgb3JkZXIgKGUuZy4gZnJvbSBBIHRvIFopXCJcbiAgICAgICAgICAgIEFTQ1xuICAgICAgICAgICAgXCJEb2N1bWVudHMgd2lsbCBiZSBzb3J0ZWQgaW4gZGVzY2VuZGFudCBvcmRlciAoZS5nLiBmcm9tIFogdG8gQSlcIlxuICAgICAgICAgICAgREVTQ1xuICAgICAgICB9XG5cbiAgICAgICAgXG4gICAgICAgIFwiXCJcIlxuICAgICAgICBTcGVjaWZ5IGhvdyB0byBzb3J0IHJlc3VsdHMuXG4gICAgICAgIFlvdSBjYW4gc29ydCBkb2N1bWVudHMgaW4gcmVzdWx0IHNldCB1c2luZyBtb3JlIHRoYW4gb25lIGZpZWxkLlxuICAgICAgICBcIlwiXCJcbiAgICAgICAgaW5wdXQgUXVlcnlPcmRlckJ5IHtcbiAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgICAgUGF0aCB0byBmaWVsZCB3aGljaCBtdXN0IGJlIHVzZWQgYXMgYSBzb3J0IGNyaXRlcmlhLlxuICAgICAgICAgICAgSWYgZmllbGQgcmVzaWRlcyBkZWVwIGluIHN0cnVjdHVyZSBwYXRoIGl0ZW1zIG11c3QgYmUgc2VwYXJhdGVkIHdpdGggZG90IChlLmcuICdmb28uYmFyLmJheicpLlxuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgICBwYXRoOiBTdHJpbmdcbiAgICAgICAgICAgIFwiU29ydCBvcmRlciBkaXJlY3Rpb25cIlxuICAgICAgICAgICAgZGlyZWN0aW9uOiBRdWVyeU9yZGVyQnlEaXJlY3Rpb25cbiAgICAgICAgfVxuXG4gICAgICAgIHR5cGUgUXVlcnkge1xuICAgICAgICBgKTtcblxuICAgICAgICB0eXBlcy5mb3JFYWNoKCh0eXBlOiBEYlR5cGUpID0+IHtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oYFxcdCR7dHlwZS5jb2xsZWN0aW9uIHx8ICcnfShmaWx0ZXI6ICR7dHlwZS5uYW1lfUZpbHRlciwgb3JkZXJCeTogW1F1ZXJ5T3JkZXJCeV0sIGxpbWl0OiBJbnQsIHRpbWVvdXQ6IEZsb2F0LCBhY2Nlc3NLZXk6IFN0cmluZywgb3BlcmF0aW9uSWQ6IFN0cmluZyk6IFske3R5cGUubmFtZX1dYCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHFsLndyaXRlQmxvY2tMbihgXG4gICAgICAgIH1cblxuICAgICAgICBgKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5RTFN1YnNjcmlwdGlvbnModHlwZXM6IERiVHlwZVtdKSB7XG4gICAgICAgIHFsLndyaXRlTG4oJ3R5cGUgU3Vic2NyaXB0aW9uIHsnKTtcbiAgICAgICAgdHlwZXMuZm9yRWFjaCgodHlwZSkgPT4ge1xuICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0JHt0eXBlLmNvbGxlY3Rpb24gfHwgJyd9KGZpbHRlcjogJHt0eXBlLm5hbWV9RmlsdGVyLCBhY2Nlc3NLZXk6IFN0cmluZyk6ICR7dHlwZS5uYW1lfWApO1xuICAgICAgICB9KTtcbiAgICAgICAgcWwud3JpdGVMbignfScpO1xuICAgIH1cblxuXG4gICAgZnVuY3Rpb24gZ2V0U2NhbGFyUmVzb2x2ZXJOYW1lKGZpZWxkOiBEYkZpZWxkKTogc3RyaW5nIHtcbiAgICAgICAgaWYgKGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLnVpbnQ2NCkge1xuICAgICAgICAgICAgcmV0dXJuICdiaWdVSW50MSc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLnVpbnQxMDI0KSB7XG4gICAgICAgICAgICByZXR1cm4gJ2JpZ1VJbnQyJztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJ3NjYWxhcic7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuSlNGaWx0ZXJzRm9yQXJyYXlGaWVsZHModHlwZTogRGJUeXBlLCBqc05hbWVzOiBTZXQ8c3RyaW5nPikge1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgbGV0IGl0ZW1UeXBlTmFtZSA9IGZpZWxkLnR5cGUubmFtZTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZmllbGQuYXJyYXlEZXB0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmlsdGVyTmFtZSA9IGAke2l0ZW1UeXBlTmFtZX1BcnJheWA7XG4gICAgICAgICAgICAgICAgcHJldmVudFR3aWNlKGZpbHRlck5hbWUsIGpzTmFtZXMsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaXRlbVJlc29sdmVyTmFtZSA9IChpID09PSAwICYmIGZpZWxkLnR5cGUuY2F0ZWdvcnkgPT09IERiVHlwZUNhdGVnb3J5LnNjYWxhcilcbiAgICAgICAgICAgICAgICAgICAgICAgID8gZ2V0U2NhbGFyUmVzb2x2ZXJOYW1lKGZpZWxkKVxuICAgICAgICAgICAgICAgICAgICAgICAgOiBpdGVtVHlwZU5hbWU7XG4gICAgICAgICAgICAgICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgICAgICAgICAgY29uc3QgJHtmaWx0ZXJOYW1lfSA9IGFycmF5KCgpID0+ICR7aXRlbVJlc29sdmVyTmFtZX0pO1xuICAgICAgICAgICAgICAgIGApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGl0ZW1UeXBlTmFtZSArPSAnQXJyYXknO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5KU1N0cnVjdEZpbHRlcih0eXBlOiBEYlR5cGUpIHtcbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgY29uc3QgJHt0eXBlLm5hbWV9ID0gc3RydWN0KHtcbiAgICBgKTtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGxldCB0eXBlRGVjbGFyYXRpb246ID9zdHJpbmcgPSBudWxsO1xuICAgICAgICAgICAgY29uc3Qgam9pbiA9IGZpZWxkLmpvaW47XG4gICAgICAgICAgICBpZiAoam9pbikge1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1ZmZpeCA9IGZpZWxkLmFycmF5RGVwdGggPiAwID8gJ0FycmF5JyA6ICcnO1xuICAgICAgICAgICAgICAgIHR5cGVEZWNsYXJhdGlvbiA9IGBqb2luJHtzdWZmaXh9KCcke2pvaW4ub259JywgJyR7am9pbi5yZWZPbn0nLCAnJHtmaWVsZC50eXBlLmNvbGxlY3Rpb24gfHwgJyd9JywgKCkgPT4gJHtmaWVsZC50eXBlLm5hbWV9KWA7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLmFycmF5RGVwdGggPiAwKSB7XG4gICAgICAgICAgICAgICAgdHlwZURlY2xhcmF0aW9uID1cbiAgICAgICAgICAgICAgICAgICAgZmllbGQudHlwZS5uYW1lICtcbiAgICAgICAgICAgICAgICAgICAgJ0FycmF5Jy5yZXBlYXQoZmllbGQuYXJyYXlEZXB0aCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLnR5cGUuY2F0ZWdvcnkgPT09IERiVHlwZUNhdGVnb3J5LnNjYWxhcikge1xuICAgICAgICAgICAgICAgIHR5cGVEZWNsYXJhdGlvbiA9IGdldFNjYWxhclJlc29sdmVyTmFtZShmaWVsZCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLnR5cGUuZmllbGRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB0eXBlRGVjbGFyYXRpb24gPSBmaWVsZC50eXBlLm5hbWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodHlwZURlY2xhcmF0aW9uKSB7XG4gICAgICAgICAgICAgICAganMud3JpdGVMbihgICAgICR7ZmllbGQubmFtZX06ICR7dHlwZURlY2xhcmF0aW9ufSxgKTtcbiAgICAgICAgICAgICAgICBjb25zdCBlbnVtRGVmID0gZmllbGQuZW51bURlZjtcbiAgICAgICAgICAgICAgICBpZiAoZW51bURlZikge1xuICAgICAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgJHtmaWVsZC5uYW1lfV9uYW1lOiBlbnVtTmFtZSgnJHtmaWVsZC5uYW1lfScsICR7c3RyaW5naWZ5RW51bVZhbHVlcyhlbnVtRGVmLnZhbHVlcyl9KSxgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICB9JHt0eXBlLmNvbGxlY3Rpb24gPyAnLCB0cnVlJyA6ICcnfSk7XG5cbiAgICBgKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5KU1VuaW9uUmVzb2x2ZXIodHlwZTogRGJUeXBlKSB7XG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIGNvbnN0ICR7dHlwZS5uYW1lfVJlc29sdmVyID0ge1xuICAgICAgICAgICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgYCk7XG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKHZhcmlhbnQpID0+IHtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgaWYgKCcke3ZhcmlhbnQubmFtZX0nIGluIG9iaikge2ApO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgcmV0dXJuICcke3VuaW9uVmFyaWFudFR5cGUodHlwZSwgdmFyaWFudCl9JztgKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgfWApO1xuICAgICAgICB9KTtcbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBgKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5KU0ZpbHRlcih0eXBlOiBEYlR5cGUsIGpzTmFtZXM6IFNldDxzdHJpbmc+KSB7XG4gICAgICAgIGlmICh0eXBlLmZpZWxkcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZS5jYXRlZ29yeSA9PT0gRGJUeXBlQ2F0ZWdvcnkudW5pb24pIHtcbiAgICAgICAgICAgIC8vIGdlbkpTRmlsdGVyc0ZvclVuaW9uVmFyaWFudHModHlwZSwganNOYW1lcyk7XG4gICAgICAgIH1cbiAgICAgICAgZ2VuSlNGaWx0ZXJzRm9yQXJyYXlGaWVsZHModHlwZSwganNOYW1lcyk7XG4gICAgICAgIGdlbkpTU3RydWN0RmlsdGVyKHR5cGUpO1xuICAgICAgICBpZiAodHlwZS5jYXRlZ29yeSA9PT0gRGJUeXBlQ2F0ZWdvcnkudW5pb24pIHtcbiAgICAgICAgICAgIGdlbkpTVW5pb25SZXNvbHZlcih0eXBlKTtcbiAgICAgICAgfVxuXG5cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZW5lcmF0ZSBjdXN0b20gcmVzb2x2ZXJzIGZvciB0eXBlcyB3aXRoOlxuICAgICAqIC0gaWQgZmllbGRcbiAgICAgKiAtIGpvaW4gZmllbGRzXG4gICAgICogLSB1NjQgYW5kIGhpZ2hlciBmaWVsZHNcbiAgICAgKiBAcGFyYW0gdHlwZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGdlbkpTQ3VzdG9tUmVzb2x2ZXJzKHR5cGU6IERiVHlwZSkge1xuICAgICAgICBjb25zdCBqb2luRmllbGRzID0gdHlwZS5maWVsZHMuZmlsdGVyKHggPT4gISF4LmpvaW4pO1xuICAgICAgICBjb25zdCBiaWdVSW50RmllbGRzID0gdHlwZS5maWVsZHMuZmlsdGVyKCh4OiBEYkZpZWxkKSA9PiBpc0JpZ0ludCh4LnR5cGUpKTtcbiAgICAgICAgY29uc3QgdW5peFRpbWVGaWVsZHMgPSB0eXBlLmZpZWxkcy5maWx0ZXIoKHg6IERiRmllbGQpID0+IHguaXNVbml4VGltZSk7XG4gICAgICAgIGNvbnN0IGVudW1GaWVsZHMgPSB0eXBlLmZpZWxkcy5maWx0ZXIoeCA9PiB4LmVudW1EZWYpO1xuICAgICAgICBjb25zdCBjdXN0b21SZXNvbHZlclJlcXVpcmVkID0gdHlwZS5jb2xsZWN0aW9uXG4gICAgICAgICAgICB8fCBqb2luRmllbGRzLmxlbmd0aCA+IDBcbiAgICAgICAgICAgIHx8IGJpZ1VJbnRGaWVsZHMubGVuZ3RoID4gMFxuICAgICAgICAgICAgfHwgZW51bUZpZWxkcy5sZW5ndGggPiAwO1xuICAgICAgICBpZiAoIWN1c3RvbVJlc29sdmVyUmVxdWlyZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICR7dHlwZS5uYW1lfToge2ApO1xuICAgICAgICBpZiAodHlwZS5jb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICBqcy53cml0ZUxuKCcgICAgICAgICAgICBpZChwYXJlbnQpIHsnKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oJyAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7Jyk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKCcgICAgICAgICAgICB9LCcpO1xuICAgICAgICB9XG4gICAgICAgIGpvaW5GaWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGpvaW4gPSBmaWVsZC5qb2luO1xuICAgICAgICAgICAgaWYgKCFqb2luKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3Qgb25GaWVsZCA9IHR5cGUuZmllbGRzLmZpbmQoeCA9PiB4Lm5hbWUgPT09IGpvaW4ub24pO1xuICAgICAgICAgICAgaWYgKCFvbkZpZWxkKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgJ0pvaW4gb24gZmllbGQgZG9lcyBub3QgZXhpc3QuJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IG9uID0gam9pbi5vbiA9PT0gJ2lkJyA/ICdfa2V5JyA6IChqb2luLm9uIHx8ICdfa2V5Jyk7XG4gICAgICAgICAgICBjb25zdCByZWZPbiA9IGpvaW4ucmVmT24gPT09ICdpZCcgPyAnX2tleScgOiAoam9pbi5yZWZPbiB8fCAnX2tleScpO1xuICAgICAgICAgICAgY29uc3QgY29sbGVjdGlvbiA9IGZpZWxkLnR5cGUuY29sbGVjdGlvbjtcbiAgICAgICAgICAgIGlmICghY29sbGVjdGlvbikge1xuICAgICAgICAgICAgICAgIHRocm93ICdKb2luZWQgdHlwZSBpcyBub3QgYSBjb2xsZWN0aW9uLic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAke2ZpZWxkLm5hbWV9KHBhcmVudCwgYXJncywgY29udGV4dCkge2ApO1xuICAgICAgICAgICAgY29uc3QgcHJlID0gam9pbi5wcmVDb25kaXRpb24gPyBgJHtqb2luLnByZUNvbmRpdGlvbn0gPyBgIDogJyc7XG4gICAgICAgICAgICBjb25zdCBwb3N0ID0gam9pbi5wcmVDb25kaXRpb24gPyBgIDogbnVsbGAgOiAnJztcbiAgICAgICAgICAgIGlmIChmaWVsZC5hcnJheURlcHRoID09PSAwKSB7XG4gICAgICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgICAgIHJldHVybiAke3ByZX1jb250ZXh0LmRiLiR7Y29sbGVjdGlvbn0ud2FpdEZvckRvYyhwYXJlbnQuJHtvbn0sICcke3JlZk9ufScsIGFyZ3MpJHtwb3N0fTtgKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQuYXJyYXlEZXB0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICAgICByZXR1cm4gJHtwcmV9Y29udGV4dC5kYi4ke2NvbGxlY3Rpb259LndhaXRGb3JEb2NzKHBhcmVudC4ke29ufSwgJyR7cmVmT259JywgYXJncykke3Bvc3R9O2ApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyAnSm9pbnMgb24gYSBuZXN0ZWQgYXJyYXlzIGRvZXMgbm90IHN1cHBvcnRlZC4nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgfSxgKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGJpZ1VJbnRGaWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHByZWZpeExlbmd0aCA9IGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLnVpbnQ2NCA/IDEgOiAyO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgJHtmaWVsZC5uYW1lfShwYXJlbnQsIGFyZ3MpIHtgKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoJHtwcmVmaXhMZW5ndGh9LCBwYXJlbnQuJHtmaWVsZC5uYW1lfSwgYXJncyk7YCk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICB9LGApO1xuICAgICAgICB9KTtcbiAgICAgICAgdW5peFRpbWVGaWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICR7ZmllbGQubmFtZX1fc3RyaW5nKHBhcmVudCwgYXJncykge2ApO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlVW5peFRpbWVTdHJpbmcocGFyZW50LiR7ZmllbGQubmFtZX0pO2ApO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgfSxgKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGVudW1GaWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGVudW1EZWYgPSBmaWVsZC5lbnVtRGVmO1xuICAgICAgICAgICAgaWYgKGVudW1EZWYpIHtcbiAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAke2ZpZWxkLm5hbWV9X25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJyR7ZmllbGQubmFtZX0nLCAke3N0cmluZ2lmeUVudW1WYWx1ZXMoZW51bURlZi52YWx1ZXMpfSksYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgIH0sYCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuSlNTY2FsYXJGaWVsZHModHlwZTogRGJUeXBlLCBwYXJlbnRQYXRoLCBwYXJlbnREb2NQYXRoOiBzdHJpbmcpIHtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgoZmllbGQ6IERiRmllbGQpID0+IHtcbiAgICAgICAgICAgIGlmIChmaWVsZC5qb2luIHx8IGZpZWxkLmVudW1EZWYpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBkb2NOYW1lID0gZmllbGQubmFtZSA9PT0gJ2lkJyA/ICdfa2V5JyA6IGZpZWxkLm5hbWU7XG4gICAgICAgICAgICBjb25zdCBwYXRoID0gYCR7cGFyZW50UGF0aH0uJHtmaWVsZC5uYW1lfWA7XG4gICAgICAgICAgICBsZXQgZG9jUGF0aCA9IGAke3BhcmVudERvY1BhdGh9LiR7ZG9jTmFtZX1gO1xuICAgICAgICAgICAgaWYgKGZpZWxkLmFycmF5RGVwdGggPiAwKSB7XG4gICAgICAgICAgICAgICAgbGV0IHN1ZmZpeCA9ICdbKl0nO1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGRlcHRoID0gMTA7IGRlcHRoID4gMDsgZGVwdGggLT0gMSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzID0gYFskeycqJy5yZXBlYXQoZGVwdGgpfV1gO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZG9jUGF0aC5pbmNsdWRlcyhzKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VmZml4ID0gYFskeycqJy5yZXBlYXQoZGVwdGggKyAxKX1dYDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGRvY1BhdGggPSBgJHtkb2NQYXRofSR7c3VmZml4fWA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzd2l0Y2goZmllbGQudHlwZS5jYXRlZ29yeSkge1xuICAgICAgICAgICAgY2FzZSBcInNjYWxhclwiOlxuICAgICAgICAgICAgICAgIGxldCB0eXBlTmFtZTtcbiAgICAgICAgICAgICAgICBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMuYm9vbGVhbikge1xuICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZSA9ICdib29sZWFuJztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLmZsb2F0KSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lID0gJ251bWJlcic7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC50eXBlID09PSBzY2FsYXJUeXBlcy5pbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWUgPSAnbnVtYmVyJztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLnVpbnQ2NCkge1xuICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZSA9ICd1aW50NjQnO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDEwMjQpIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWUgPSAndWludDEwMjQnO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lID0gJ3N0cmluZyc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGpzLndyaXRlTG4oYHNjYWxhckZpZWxkcy5zZXQoJyR7cGF0aH0nLCB7IHR5cGU6ICcke3R5cGVOYW1lfScsIHBhdGg6ICcke2RvY1BhdGh9JyB9KTtgKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJzdHJ1Y3RcIjpcbiAgICAgICAgICAgIGNhc2UgXCJ1bmlvblwiOlxuICAgICAgICAgICAgICAgIGdlbkpTU2NhbGFyRmllbGRzKGZpZWxkLnR5cGUsIHBhdGgsIGRvY1BhdGgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cblxuICAgIGZ1bmN0aW9uIGdlbkpTVHlwZVJlc29sdmVyc0ZvclVuaW9uKHR5cGU6IERiVHlwZSkge1xuICAgICAgICBpZiAodHlwZS5jYXRlZ29yeSA9PT0gRGJUeXBlQ2F0ZWdvcnkudW5pb24pIHtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgJHt0eXBlLm5hbWV9OiAke3R5cGUubmFtZX1SZXNvbHZlcixgKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbmVyYXRlKHR5cGVzOiBEYlR5cGVbXSkge1xuXG4gICAgICAgIC8vIFFMXG5cbiAgICAgICAgcWwud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgXCJcIlwiXG4gICAgICAgIER1ZSB0byBHcmFwaFFMIGxpbWl0YXRpb25zIGJpZyBudW1iZXJzIGFyZSByZXR1cm5lZCBhcyBhIHN0cmluZy5cbiAgICAgICAgWW91IGNhbiBzcGVjaWZ5IGZvcm1hdCB1c2VkIHRvIHN0cmluZyByZXByZXNlbnRhdGlvbiBmb3IgYmlnIGludGVnZXJzLlxuICAgICAgICBcIlwiXCJcbiAgICAgICAgZW51bSBCaWdJbnRGb3JtYXQge1xuICAgICAgICAgICAgXCIgSGV4YWRlY2ltYWwgcmVwcmVzZW50YXRpb24gc3RhcnRlZCB3aXRoIDB4IChkZWZhdWx0KSBcIlxuICAgICAgICAgICAgSEVYXG4gICAgICAgICAgICBcIiBEZWNpbWFsIHJlcHJlc2VudGF0aW9uIFwiXG4gICAgICAgICAgICBERUNcbiAgICAgICAgfVxuICAgICAgICBgKTtcbiAgICAgICAgWydTdHJpbmcnLCAnQm9vbGVhbicsICdJbnQnLCAnRmxvYXQnXS5mb3JFYWNoKGdlblFMU2NhbGFyVHlwZXNGaWx0ZXIpO1xuICAgICAgICBnZW5RTEVudW1UeXBlcygpO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKHR5cGUgPT4gZ2VuUUxUeXBlRGVjbGFyYXRpb24odHlwZSkpO1xuICAgICAgICBjb25zdCBxbEFycmF5RmlsdGVycyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKHR5cGUgPT4gZ2VuUUxGaWx0ZXIodHlwZSwgcWxBcnJheUZpbHRlcnMpKTtcblxuICAgICAgICBjb25zdCBjb2xsZWN0aW9ucyA9IHR5cGVzLmZpbHRlcih0ID0+ICEhdC5jb2xsZWN0aW9uKTtcbiAgICAgICAgZ2VuUUxRdWVyaWVzKGNvbGxlY3Rpb25zKTtcbiAgICAgICAgZ2VuUUxTdWJzY3JpcHRpb25zKGNvbGxlY3Rpb25zKTtcblxuICAgICAgICAvLyBKU1xuXG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIGNvbnN0IHtcbiAgICAgICAgICAgIHNjYWxhcixcbiAgICAgICAgICAgIGJpZ1VJbnQxLFxuICAgICAgICAgICAgYmlnVUludDIsXG4gICAgICAgICAgICByZXNvbHZlQmlnVUludCxcbiAgICAgICAgICAgIHN0cnVjdCxcbiAgICAgICAgICAgIGFycmF5LFxuICAgICAgICAgICAgam9pbixcbiAgICAgICAgICAgIGpvaW5BcnJheSxcbiAgICAgICAgICAgIGVudW1OYW1lLFxuICAgICAgICAgICAgY3JlYXRlRW51bU5hbWVSZXNvbHZlcixcbiAgICAgICAgICAgIHJlc29sdmVVbml4VGltZVN0cmluZyxcbiAgICAgICAgfSA9IHJlcXVpcmUoJy4vZGItdHlwZXMuanMnKTtcbiAgICAgICAgYCk7XG4gICAgICAgIGNvbnN0IGpzQXJyYXlGaWx0ZXJzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgICAgIHR5cGVzLmZvckVhY2godHlwZSA9PiBnZW5KU0ZpbHRlcih0eXBlLCBqc0FycmF5RmlsdGVycykpO1xuXG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIGZ1bmN0aW9uIGNyZWF0ZVJlc29sdmVycyhkYikge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgYCk7XG4gICAgICAgIHR5cGVzLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICAgICAgICAgIGdlbkpTQ3VzdG9tUmVzb2x2ZXJzKHR5cGUpO1xuICAgICAgICAgICAgZ2VuSlNUeXBlUmVzb2x2ZXJzRm9yVW5pb24odHlwZSk7XG4gICAgICAgIH0pO1xuICAgICAgICBqcy53cml0ZUxuKCcgICAgICAgIFF1ZXJ5OiB7Jyk7XG4gICAgICAgIGNvbGxlY3Rpb25zLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICR7dHlwZS5jb2xsZWN0aW9uIHx8ICcnfTogZGIuJHt0eXBlLmNvbGxlY3Rpb24gfHwgJyd9LnF1ZXJ5UmVzb2x2ZXIoKSxgKVxuICAgICAgICB9KTtcbiAgICAgICAganMud3JpdGVMbignICAgICAgICB9LCcpO1xuICAgICAgICBqcy53cml0ZUxuKCcgICAgICAgIFN1YnNjcmlwdGlvbjogeycpO1xuICAgICAgICBjb2xsZWN0aW9ucy5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAke3R5cGUuY29sbGVjdGlvbiB8fCAnJ306IGRiLiR7dHlwZS5jb2xsZWN0aW9uIHx8ICcnfS5zdWJzY3JpcHRpb25SZXNvbHZlcigpLGApXG4gICAgICAgIH0pO1xuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGApO1xuXG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIGNvbnN0IHNjYWxhckZpZWxkcyA9IG5ldyBNYXAoKTtcbiAgICAgICAgYCk7XG4gICAgICAgIGNvbGxlY3Rpb25zLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICAgICAgICAgIGdlbkpTU2NhbGFyRmllbGRzKHR5cGUsIHR5cGUuY29sbGVjdGlvbiB8fCAnJywgJ2RvYycpO1xuICAgICAgICB9KTtcblxuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAgICAgICAgIHNjYWxhckZpZWxkcyxcbiAgICAgICAgICAgIGNyZWF0ZVJlc29sdmVycyxcbiAgICAgICAgYCk7XG4gICAgICAgIHR5cGVzLmZvckVhY2godHlwZSA9PiBqcy53cml0ZUxuKGAgICAgJHt0eXBlLm5hbWV9LGApKTtcbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgfTtcbiAgICAgICAgYCk7XG4gICAgfVxuXG4gICAgY29uc3Qgc2NoZW1hID0gcGFyc2VUeXBlRGVmKHNjaGVtYURlZik7XG5cbiAgICBpZiAoc2NoZW1hLmNsYXNzKSB7XG4gICAgICAgIHBhcnNlRGJUeXBlcyhzY2hlbWEuY2xhc3MudHlwZXMpO1xuICAgICAgICBnZW5lcmF0ZShkYlR5cGVzKTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IGU6IEludEVudW1EZWYgb2YgZW51bVR5cGVzLnZhbHVlcygpKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBleHBvcnQgY29uc3QgUSR7ZS5uYW1lfSA9IHtgKTtcbiAgICAgICAgY29uc29sZS5sb2coT2JqZWN0LmVudHJpZXMoZS52YWx1ZXMpLm1hcCgoW25hbWUsIHZhbHVlXSkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGAgICAgJHtuYW1lfTogJHsodmFsdWU6IGFueSl9LGA7XG4gICAgICAgIH0pLmpvaW4oJ1xcbicpKTtcbiAgICAgICAgY29uc29sZS5sb2coYH07XFxuYCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcWw6IHFsLmdlbmVyYXRlZCgpLFxuICAgICAgICBqczoganMuZ2VuZXJhdGVkKCksXG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBtYWluO1xuIl19