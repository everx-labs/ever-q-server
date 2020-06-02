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

    if (ex && ex.formatter) {
      field.formatter = ex.formatter;
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
        let params = '';

        if (isBigInt(field.type)) {
          params = '(format: BigIntFormat)';
        } else if (field.join) {
          params = `(timeout: Int, when: ${type.name}Filter)`;
        }

        ql.writeLn(`\t${field.name}${params}: ${typeDeclaration}`);
        const enumDef = field.enumDef;

        if (enumDef) {
          ql.writeLn(`\t${field.name}_name: ${enumDef.name}Enum`);
        }

        if (field.formatter) {
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
    const stringFormattedFields = type.fields.filter(x => x.formatter);
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

      if (join.preCondition) {
        js.writeLn(`                if (!(${join.preCondition})) {`);
        js.writeLn(`                    return null;`);
        js.writeLn(`                }`);
      }

      js.writeLn(`                if (args.when && !${type.name}.test(null, parent, args.when)) {`);
      js.writeLn(`                    return null;`);
      js.writeLn(`                }`);

      if (field.arrayDepth === 0) {
        js.writeLn(`                return context.db.${collection}.waitForDoc(parent.${on}, '${refOn}', args);`);
      } else if (field.arrayDepth === 1) {
        js.writeLn(`                return context.db.${collection}.waitForDocs(parent.${on}, '${refOn}', args);`);
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
    stringFormattedFields.forEach(field => {
      js.writeLn(`            ${field.name}_string(parent, args) {`);
      js.writeLn(`                return ${field.formatter}(parent.${field.name});`);
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
            unixMillisecondsToString,
            unixSecondsToString,
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NlcnZlci9zY2hlbWEvcWwtanMtZ2VuZXJhdG9yLmpzIl0sIm5hbWVzIjpbIkRiVHlwZUNhdGVnb3J5IiwidW5yZXNvbHZlZCIsInNjYWxhciIsInVuaW9uIiwic3RydWN0Iiwic2NhbGFyVHlwZSIsIm5hbWUiLCJjYXRlZ29yeSIsImZpZWxkcyIsImRvYyIsInNjYWxhclR5cGVzIiwiaW50IiwidWludDY0IiwidWludDEwMjQiLCJmbG9hdCIsImJvb2xlYW4iLCJzdHJpbmciLCJpc0JpZ0ludCIsInR5cGUiLCJ1bnJlc29sdmVkVHlwZSIsImlzTG93ZXJDYXNlZCIsInMiLCJsIiwidG9Mb3dlckNhc2UiLCJ1IiwidG9VcHBlckNhc2UiLCJpc1VwcGVyQ2FzZWQiLCJ0b0FsbENhcHMiLCJyZXN1bHQiLCJpIiwibGVuZ3RoIiwidG9FbnVtU3R5bGUiLCJzdWJzdHIiLCJzdHJpbmdpZnlFbnVtVmFsdWVzIiwidmFsdWVzIiwiT2JqZWN0IiwiZW50cmllcyIsIm1hcCIsInZhbHVlIiwiam9pbiIsImdldERvY01EIiwic2NoZW1hIiwibWQiLCJtYWluIiwic2NoZW1hRGVmIiwiZGJUeXBlcyIsImxhc3RSZXBvcnRlZFR5cGUiLCJlbnVtVHlwZXMiLCJNYXAiLCJyZXBvcnRUeXBlIiwiZmllbGQiLCJjb25zb2xlIiwibG9nIiwicGFyc2VEYkZpZWxkIiwidHlwZU5hbWUiLCJzY2hlbWFGaWVsZCIsInNjaGVtYVR5cGUiLCJhcnJheURlcHRoIiwiYXJyYXkiLCJleCIsIl8iLCJlbnVtRGVmIiwiZW51bSIsInNldCIsImZvcm1hdHRlciIsInJlZiIsImJvb2wiLCJ1bnNpZ25lZCIsInNpemUiLCJFcnJvciIsIkpTT04iLCJzdHJpbmdpZnkiLCJwcm9jZXNzIiwiZXhpdCIsInVud3JhcEFycmF5cyIsInBhcnNlRGJUeXBlIiwiY29sbGVjdGlvbiIsInB1c2giLCJmb3JFYWNoIiwidW53cmFwcGVkIiwib3duVHlwZSIsInBhcnNlRGJUeXBlcyIsInR5cGVzIiwicmVzb2x2aW5nIiwiU2V0IiwicmVzb2x2ZWQiLCJvcmRlcmVkUmVzb2x2ZWQiLCJ0IiwicmVzb2x2ZVR5cGUiLCJoYXMiLCJhZGQiLCJnZXQiLCJkZWxldGUiLCJxbCIsIldyaXRlciIsImpzIiwiZ2VuUUxEb2MiLCJwcmVmaXgiLCJ0cmltIiwibGluZXMiLCJzcGxpdCIsImluY2x1ZGVzIiwid3JpdGVMbiIsImxpbmUiLCJ1bmlvblZhcmlhbnRUeXBlIiwidmFyaWFudCIsImdlblFMVHlwZURlY2xhcmF0aW9uc0ZvclVuaW9uVmFyaWFudHMiLCJ3cml0ZUJsb2NrTG4iLCJnZW5RTEVudW1UeXBlcyIsImtleXMiLCJnZW5RTFR5cGVEZWNsYXJhdGlvbiIsInR5cGVEZWNsYXJhdGlvbiIsInJlcGVhdCIsInBhcmFtcyIsInByZXZlbnRUd2ljZSIsIm5hbWVzIiwid29yayIsImdlblFMRmlsdGVyc0ZvckFycmF5RmllbGRzIiwicWxOYW1lcyIsIml0ZW1UeXBlTmFtZSIsImZpbHRlck5hbWUiLCJvcCIsImdlblFMRmlsdGVyc0ZvckVudW1OYW1lRmllbGRzIiwiZ2VuUUxTY2FsYXJUeXBlc0ZpbHRlciIsImdlblFMRmlsdGVyIiwiZ2VuUUxRdWVyaWVzIiwiZ2VuUUxTdWJzY3JpcHRpb25zIiwiZ2V0U2NhbGFyUmVzb2x2ZXJOYW1lIiwiZ2VuSlNGaWx0ZXJzRm9yQXJyYXlGaWVsZHMiLCJqc05hbWVzIiwiaXRlbVJlc29sdmVyTmFtZSIsImdlbkpTU3RydWN0RmlsdGVyIiwic3VmZml4Iiwib24iLCJyZWZPbiIsImdlbkpTVW5pb25SZXNvbHZlciIsImdlbkpTRmlsdGVyIiwiZ2VuSlNDdXN0b21SZXNvbHZlcnMiLCJqb2luRmllbGRzIiwiZmlsdGVyIiwieCIsImJpZ1VJbnRGaWVsZHMiLCJzdHJpbmdGb3JtYXR0ZWRGaWVsZHMiLCJlbnVtRmllbGRzIiwiY3VzdG9tUmVzb2x2ZXJSZXF1aXJlZCIsIm9uRmllbGQiLCJmaW5kIiwicHJlQ29uZGl0aW9uIiwicHJlZml4TGVuZ3RoIiwiZ2VuSlNTY2FsYXJGaWVsZHMiLCJwYXJlbnRQYXRoIiwicGFyZW50RG9jUGF0aCIsImRvY05hbWUiLCJwYXRoIiwiZG9jUGF0aCIsImRlcHRoIiwiZ2VuSlNUeXBlUmVzb2x2ZXJzRm9yVW5pb24iLCJnZW5lcmF0ZSIsInFsQXJyYXlGaWx0ZXJzIiwiY29sbGVjdGlvbnMiLCJqc0FycmF5RmlsdGVycyIsImNsYXNzIiwiZSIsImdlbmVyYXRlZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUVBOztBQUVBOztBQUdBLE1BQU1BLGNBQWMsR0FBRztBQUNuQkMsRUFBQUEsVUFBVSxFQUFFLFlBRE87QUFFbkJDLEVBQUFBLE1BQU0sRUFBRSxRQUZXO0FBR25CQyxFQUFBQSxLQUFLLEVBQUUsT0FIWTtBQUluQkMsRUFBQUEsTUFBTSxFQUFFO0FBSlcsQ0FBdkI7O0FBdUNBLFNBQVNDLFVBQVQsQ0FBb0JDLElBQXBCLEVBQTBDO0FBQ3RDLFNBQU87QUFDSEEsSUFBQUEsSUFERztBQUVIQyxJQUFBQSxRQUFRLEVBQUVQLGNBQWMsQ0FBQ0UsTUFGdEI7QUFHSE0sSUFBQUEsTUFBTSxFQUFFLEVBSEw7QUFJSEMsSUFBQUEsR0FBRyxFQUFFO0FBSkYsR0FBUDtBQU1IOztBQUVELE1BQU1DLFdBQVcsR0FBRztBQUNoQkMsRUFBQUEsR0FBRyxFQUFFTixVQUFVLENBQUMsS0FBRCxDQURDO0FBRWhCTyxFQUFBQSxNQUFNLEVBQUVQLFVBQVUsQ0FBQyxRQUFELENBRkY7QUFHaEJRLEVBQUFBLFFBQVEsRUFBRVIsVUFBVSxDQUFDLFFBQUQsQ0FISjtBQUloQlMsRUFBQUEsS0FBSyxFQUFFVCxVQUFVLENBQUMsT0FBRCxDQUpEO0FBS2hCVSxFQUFBQSxPQUFPLEVBQUVWLFVBQVUsQ0FBQyxTQUFELENBTEg7QUFNaEJXLEVBQUFBLE1BQU0sRUFBRVgsVUFBVSxDQUFDLFFBQUQ7QUFORixDQUFwQjs7QUFTQSxTQUFTWSxRQUFULENBQWtCQyxJQUFsQixFQUF5QztBQUNyQyxTQUFPQSxJQUFJLEtBQUtSLFdBQVcsQ0FBQ0csUUFBckIs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QUVUQyxJQUZTLENBRUosSUFGSSxDQUFaO0FBR0FZLElBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFhLE1BQWI7QUFDSDs7QUFFRCxTQUFPO0FBQ0h5QyxJQUFBQSxFQUFFLEVBQUVBLEVBQUUsQ0FBQ3NFLFNBQUgsRUFERDtBQUVIcEUsSUFBQUEsRUFBRSxFQUFFQSxFQUFFLENBQUNvRSxTQUFIO0FBRkQsR0FBUDtBQUlIOztlQUVjeEgsSSIsInNvdXJjZXNDb250ZW50IjpbIi8vQGZsb3dcblxuaW1wb3J0IHsgbWFrZUZpZWxkVHlwZU5hbWUsIFdyaXRlciB9IGZyb20gJ3Rvbi1sYWJzLWRldi1vcHMvZGlzdC9zcmMvZ2VuLmpzJztcbmltcG9ydCB0eXBlIHsgU2NoZW1hRG9jLCBTY2hlbWFNZW1iZXIsIFNjaGVtYVR5cGUsIFR5cGVEZWYgfSBmcm9tICd0b24tbGFicy1kZXYtb3BzL3NyYy9zY2hlbWEuanMnO1xuaW1wb3J0IHsgcGFyc2VUeXBlRGVmIH0gZnJvbSAndG9uLWxhYnMtZGV2LW9wcy9kaXN0L3NyYy9zY2hlbWEuanMnO1xuaW1wb3J0IHR5cGUge1RvU3RyaW5nRm9ybWF0dGVyVHlwZX0gZnJvbSAnLi9kYi1zY2hlbWEtdHlwZXMnO1xuXG5jb25zdCBEYlR5cGVDYXRlZ29yeSA9IHtcbiAgICB1bnJlc29sdmVkOiAndW5yZXNvbHZlZCcsXG4gICAgc2NhbGFyOiAnc2NhbGFyJyxcbiAgICB1bmlvbjogJ3VuaW9uJyxcbiAgICBzdHJ1Y3Q6ICdzdHJ1Y3QnLFxufTtcblxudHlwZSBEYkpvaW4gPSB7XG4gICAgY29sbGVjdGlvbjogc3RyaW5nLFxuICAgIG9uOiBzdHJpbmcsXG4gICAgcmVmT246IHN0cmluZyxcbiAgICBwcmVDb25kaXRpb246IHN0cmluZyxcbn1cblxudHlwZSBEYlR5cGUgPSB7XG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGZpZWxkczogRGJGaWVsZFtdLFxuICAgIGNhdGVnb3J5OiAndW5yZXNvbHZlZCcgfCAnc2NhbGFyJyB8ICd1bmlvbicgfCAnc3RydWN0JyxcbiAgICBjb2xsZWN0aW9uPzogc3RyaW5nLFxuICAgIGRvYzogc3RyaW5nLFxufVxuXG50eXBlIEludEVudW1EZWYgPSB7XG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHZhbHVlczoge1xuICAgICAgICBbc3RyaW5nXTogbnVtYmVyXG4gICAgfSxcbn1cblxudHlwZSBEYkZpZWxkID0ge1xuICAgIG5hbWU6IHN0cmluZyxcbiAgICB0eXBlOiBEYlR5cGUsXG4gICAgYXJyYXlEZXB0aDogbnVtYmVyLFxuICAgIGpvaW4/OiBEYkpvaW4sXG4gICAgZW51bURlZj86IEludEVudW1EZWYsXG4gICAgZm9ybWF0dGVyPzogVG9TdHJpbmdGb3JtYXR0ZXJUeXBlLFxuICAgIGRvYzogc3RyaW5nLFxufVxuXG5mdW5jdGlvbiBzY2FsYXJUeXBlKG5hbWU6IHN0cmluZyk6IERiVHlwZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgbmFtZSxcbiAgICAgICAgY2F0ZWdvcnk6IERiVHlwZUNhdGVnb3J5LnNjYWxhcixcbiAgICAgICAgZmllbGRzOiBbXSxcbiAgICAgICAgZG9jOiAnJyxcbiAgICB9XG59XG5cbmNvbnN0IHNjYWxhclR5cGVzID0ge1xuICAgIGludDogc2NhbGFyVHlwZSgnSW50JyksXG4gICAgdWludDY0OiBzY2FsYXJUeXBlKCdTdHJpbmcnKSxcbiAgICB1aW50MTAyNDogc2NhbGFyVHlwZSgnU3RyaW5nJyksXG4gICAgZmxvYXQ6IHNjYWxhclR5cGUoJ0Zsb2F0JyksXG4gICAgYm9vbGVhbjogc2NhbGFyVHlwZSgnQm9vbGVhbicpLFxuICAgIHN0cmluZzogc2NhbGFyVHlwZSgnU3RyaW5nJyksXG59O1xuXG5mdW5jdGlvbiBpc0JpZ0ludCh0eXBlOiBEYlR5cGUpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDEwMjQgfHwgdHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDY0O1xufVxuXG5mdW5jdGlvbiB1bnJlc29sdmVkVHlwZShuYW1lOiBzdHJpbmcpOiBEYlR5cGUge1xuICAgIHJldHVybiB7XG4gICAgICAgIG5hbWUsXG4gICAgICAgIGNhdGVnb3J5OiBEYlR5cGVDYXRlZ29yeS51bnJlc29sdmVkLFxuICAgICAgICBmaWVsZHM6IFtdLFxuICAgICAgICBkb2M6ICcnLFxuICAgIH1cbn1cblxuZnVuY3Rpb24gaXNMb3dlckNhc2VkKHM6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGwgPSBzLnRvTG93ZXJDYXNlKCk7XG4gICAgY29uc3QgdSA9IHMudG9VcHBlckNhc2UoKTtcbiAgICByZXR1cm4gKHUgIT09IGwpICYmIChzID09PSBsKTtcbn1cblxuZnVuY3Rpb24gaXNVcHBlckNhc2VkKHM6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGwgPSBzLnRvTG93ZXJDYXNlKCk7XG4gICAgY29uc3QgdSA9IHMudG9VcHBlckNhc2UoKTtcbiAgICByZXR1cm4gKHUgIT09IGwpICYmIChzID09PSB1KTtcbn1cblxuZnVuY3Rpb24gdG9BbGxDYXBzKHM6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgbGV0IHJlc3VsdCA9ICcnO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBpZiAoKGkgPiAwKSAmJiAoc1tpIC0gMV0gIT09ICdfJykgJiYgaXNMb3dlckNhc2VkKHNbaSAtIDFdKSAmJiBpc1VwcGVyQ2FzZWQoc1tpXSkpIHtcbiAgICAgICAgICAgIHJlc3VsdCArPSAnXyc7XG4gICAgICAgIH1cbiAgICAgICAgcmVzdWx0ICs9IHNbaV07XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQudG9VcHBlckNhc2UoKTtcbn1cblxuZnVuY3Rpb24gdG9FbnVtU3R5bGUoczogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYCR7cy5zdWJzdHIoMCwgMSkudG9VcHBlckNhc2UoKX0ke3Muc3Vic3RyKDEpfWA7XG59XG5cbmZ1bmN0aW9uIHN0cmluZ2lmeUVudW1WYWx1ZXModmFsdWVzOiB7IFtzdHJpbmddOiBudW1iZXIgfSk6IHN0cmluZyB7XG4gICAgY29uc3QgZmllbGRzID0gT2JqZWN0LmVudHJpZXModmFsdWVzKS5tYXAoKFtuYW1lLCB2YWx1ZV0pID0+IHtcbiAgICAgICAgcmV0dXJuIGAke3RvRW51bVN0eWxlKG5hbWUpfTogJHsodmFsdWU6IGFueSl9YDtcbiAgICB9KTtcbiAgICByZXR1cm4gYHsgJHtmaWVsZHMuam9pbignLCAnKX0gfWA7XG59XG5cbmZ1bmN0aW9uIGdldERvY01EKHNjaGVtYTogU2NoZW1hRG9jKTogc3RyaW5nIHtcbiAgICBjb25zdCBkb2MgPSBzY2hlbWEuZG9jO1xuICAgIGlmICghZG9jKSB7XG4gICAgICAgIHJldHVybiAnJztcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBkb2MgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHJldHVybiBkb2M7XG4gICAgfVxuICAgIGlmIChkb2MubWQpIHtcbiAgICAgICAgcmV0dXJuIChkb2MubWQ6IGFueSk7XG4gICAgfVxuICAgIHJldHVybiAnJztcbn1cblxuZnVuY3Rpb24gbWFpbihzY2hlbWFEZWY6IFR5cGVEZWYpIHtcblxuICAgIGxldCBkYlR5cGVzOiBEYlR5cGVbXSA9IFtdO1xuICAgIGxldCBsYXN0UmVwb3J0ZWRUeXBlOiBzdHJpbmcgPSAnJztcbiAgICBsZXQgZW51bVR5cGVzOiBNYXA8c3RyaW5nLCBJbnRFbnVtRGVmPiA9IG5ldyBNYXAoKTtcblxuICAgIGZ1bmN0aW9uIHJlcG9ydFR5cGUobmFtZTogc3RyaW5nLCBmaWVsZDogc3RyaW5nLCB0eXBlOiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKG5hbWUgIT09IGxhc3RSZXBvcnRlZFR5cGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKG5hbWUpO1xuICAgICAgICAgICAgbGFzdFJlcG9ydGVkVHlwZSA9IG5hbWU7XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5sb2coYCAgICAke2ZpZWxkfTogJHt0eXBlfWApO1xuXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VEYkZpZWxkKFxuICAgICAgICB0eXBlTmFtZTogc3RyaW5nLFxuICAgICAgICBzY2hlbWFGaWVsZDogU2NoZW1hTWVtYmVyPFNjaGVtYVR5cGU+LFxuICAgICk6IERiRmllbGQge1xuICAgICAgICBsZXQgc2NoZW1hVHlwZSA9IHNjaGVtYUZpZWxkO1xuICAgICAgICBjb25zdCBmaWVsZDogRGJGaWVsZCA9IHtcbiAgICAgICAgICAgIG5hbWU6IHNjaGVtYUZpZWxkLm5hbWUsXG4gICAgICAgICAgICBhcnJheURlcHRoOiAwLFxuICAgICAgICAgICAgdHlwZTogc2NhbGFyVHlwZXMuc3RyaW5nLFxuICAgICAgICAgICAgZG9jOiBnZXREb2NNRChzY2hlbWFGaWVsZCksXG4gICAgICAgIH07XG4gICAgICAgIHdoaWxlIChzY2hlbWFUeXBlLmFycmF5KSB7XG4gICAgICAgICAgICBmaWVsZC5hcnJheURlcHRoICs9IDE7XG4gICAgICAgICAgICBzY2hlbWFUeXBlID0gc2NoZW1hVHlwZS5hcnJheTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBleCA9IChzY2hlbWFUeXBlOiBhbnkpLl87XG4gICAgICAgIGNvbnN0IGVudW1EZWY6ID9JbnRFbnVtRGVmID0gKGV4ICYmIGV4LmVudW0pIHx8IG51bGw7XG4gICAgICAgIGlmIChlbnVtRGVmKSB7XG4gICAgICAgICAgICBmaWVsZC5lbnVtRGVmID0gZW51bURlZjtcbiAgICAgICAgICAgIGVudW1UeXBlcy5zZXQoZW51bURlZi5uYW1lLCBlbnVtRGVmKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBqb2luID0gZXggJiYgZXguam9pbjtcbiAgICAgICAgaWYgKGpvaW4pIHtcbiAgICAgICAgICAgIGZpZWxkLmpvaW4gPSBqb2luO1xuICAgICAgICB9XG4gICAgICAgIGlmIChleCAmJiBleC5mb3JtYXR0ZXIpIHtcbiAgICAgICAgICAgIGZpZWxkLmZvcm1hdHRlciA9IGV4LmZvcm1hdHRlcjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc2NoZW1hVHlwZS51bmlvbiB8fCBzY2hlbWFUeXBlLnN0cnVjdCkge1xuICAgICAgICAgICAgZmllbGQudHlwZSA9IHVucmVzb2x2ZWRUeXBlKG1ha2VGaWVsZFR5cGVOYW1lKHR5cGVOYW1lLCBzY2hlbWFGaWVsZC5uYW1lKSk7XG4gICAgICAgIH0gZWxzZSBpZiAoc2NoZW1hVHlwZS5yZWYpIHtcbiAgICAgICAgICAgIGZpZWxkLnR5cGUgPSB1bnJlc29sdmVkVHlwZShzY2hlbWFUeXBlLnJlZi5uYW1lKTtcbiAgICAgICAgfSBlbHNlIGlmIChzY2hlbWFUeXBlLmJvb2wpIHtcbiAgICAgICAgICAgIGZpZWxkLnR5cGUgPSBzY2FsYXJUeXBlcy5ib29sZWFuO1xuICAgICAgICB9IGVsc2UgaWYgKHNjaGVtYVR5cGUuaW50KSB7XG4gICAgICAgICAgICBjb25zdCB1bnNpZ25lZDogYm9vbGVhbiA9IChzY2hlbWFUeXBlLmludCAmJiBzY2hlbWFUeXBlLmludC51bnNpZ25lZCkgfHwgZmFsc2U7XG4gICAgICAgICAgICBjb25zdCBzaXplOiBudW1iZXIgPSAoc2NoZW1hVHlwZS5pbnQgJiYgc2NoZW1hVHlwZS5pbnQuc2l6ZSkgfHwgMzI7XG4gICAgICAgICAgICBpZiAodW5zaWduZWQpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2l6ZSA+PSAxMjgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVwb3J0VHlwZSh0eXBlTmFtZSwgZmllbGQubmFtZSwgJ3UxMDI0Jyk7XG4gICAgICAgICAgICAgICAgICAgIGZpZWxkLnR5cGUgPSBzY2FsYXJUeXBlcy51aW50MTAyNDtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHNpemUgPj0gNjQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVwb3J0VHlwZSh0eXBlTmFtZSwgZmllbGQubmFtZSwgJ3U2NCcpO1xuICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlID0gc2NhbGFyVHlwZXMudWludDY0O1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc2l6ZSA+PSAzMikge1xuICAgICAgICAgICAgICAgICAgICByZXBvcnRUeXBlKHR5cGVOYW1lLCBmaWVsZC5uYW1lLCAndTMyJyk7XG4gICAgICAgICAgICAgICAgICAgIGZpZWxkLnR5cGUgPSBzY2FsYXJUeXBlcy5mbG9hdDtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXBvcnRUeXBlKHR5cGVOYW1lLCBmaWVsZC5uYW1lLCBgdSR7c2l6ZX1gKTtcbiAgICAgICAgICAgICAgICAgICAgZmllbGQudHlwZSA9IHNjYWxhclR5cGVzLmludDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChzaXplID4gMzIpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnRlZ2VyIHR5cGUgd2l0aCBzaXplICR7c2l6ZX0gYml0IGRvZXMgbm90IHN1cHBvcnRlZGApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcG9ydFR5cGUodHlwZU5hbWUsIGZpZWxkLm5hbWUsICdpMzInKTtcbiAgICAgICAgICAgICAgICAgICAgZmllbGQudHlwZSA9IHNjYWxhclR5cGVzLmludDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoc2NoZW1hVHlwZS5mbG9hdCkge1xuICAgICAgICAgICAgcmVwb3J0VHlwZSh0eXBlTmFtZSwgZmllbGQubmFtZSwgJ2Zsb2F0Jyk7XG4gICAgICAgICAgICBmaWVsZC50eXBlID0gc2NhbGFyVHlwZXMuZmxvYXQ7XG4gICAgICAgIH0gZWxzZSBpZiAoc2NoZW1hVHlwZS5zdHJpbmcpIHtcbiAgICAgICAgICAgIGZpZWxkLnR5cGUgPSBzY2FsYXJUeXBlcy5zdHJpbmc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmaWVsZC50eXBlID0gc2NhbGFyVHlwZXMuc3RyaW5nO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ0ludmFsaWQgZmllbGQgdHlwZTogJywgSlNPTi5zdHJpbmdpZnkoc2NoZW1hVHlwZSkpO1xuICAgICAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmaWVsZDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB1bndyYXBBcnJheXModHlwZTogU2NoZW1hVHlwZSk6IFNjaGVtYVR5cGUge1xuICAgICAgICBpZiAodHlwZS5hcnJheSkge1xuICAgICAgICAgICAgcmV0dXJuIHVud3JhcEFycmF5cyh0eXBlLmFycmF5KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHlwZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZURiVHlwZShcbiAgICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgICBzY2hlbWFUeXBlOiBTY2hlbWFUeXBlXG4gICAgKSB7XG4gICAgICAgIGNvbnN0IHN0cnVjdCA9IHNjaGVtYVR5cGUudW5pb24gfHwgc2NoZW1hVHlwZS5zdHJ1Y3Q7XG4gICAgICAgIGlmICghc3RydWN0KSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgPz8gJHtuYW1lfTogJHtKU09OLnN0cmluZ2lmeShzY2hlbWFUeXBlKS5zdWJzdHIoMCwgMjAwKX1gKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0eXBlOiBEYlR5cGUgPSB7XG4gICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgY2F0ZWdvcnk6IHNjaGVtYVR5cGUudW5pb24gPyBEYlR5cGVDYXRlZ29yeS51bmlvbiA6IERiVHlwZUNhdGVnb3J5LnN0cnVjdCxcbiAgICAgICAgICAgIGZpZWxkczogW10sXG4gICAgICAgICAgICBjb2xsZWN0aW9uOiAoc2NoZW1hVHlwZTogYW55KS5fLmNvbGxlY3Rpb24sXG4gICAgICAgICAgICBkb2M6IGdldERvY01EKHNjaGVtYVR5cGUpLFxuICAgICAgICB9O1xuXG4gICAgICAgIGlmICh0eXBlLmNvbGxlY3Rpb24pIHtcbiAgICAgICAgICAgIHR5cGUuZmllbGRzLnB1c2goe1xuICAgICAgICAgICAgICAgIG5hbWU6ICdpZCcsXG4gICAgICAgICAgICAgICAgYXJyYXlEZXB0aDogMCxcbiAgICAgICAgICAgICAgICB0eXBlOiBzY2FsYXJUeXBlcy5zdHJpbmcsXG4gICAgICAgICAgICAgICAgZG9jOiAnJyxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHN0cnVjdC5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgdHlwZS5maWVsZHMucHVzaChwYXJzZURiRmllbGQobmFtZSwgZmllbGQpKTtcbiAgICAgICAgICAgIGNvbnN0IHVud3JhcHBlZCA9IHVud3JhcEFycmF5cyhmaWVsZCk7XG4gICAgICAgICAgICBjb25zdCBvd25UeXBlID0gKHVud3JhcHBlZC5zdHJ1Y3QgfHwgdW53cmFwcGVkLnVuaW9uKSA/IHVud3JhcHBlZCA6IG51bGw7XG4gICAgICAgICAgICBpZiAob3duVHlwZSkge1xuICAgICAgICAgICAgICAgIHBhcnNlRGJUeXBlKG1ha2VGaWVsZFR5cGVOYW1lKG5hbWUsIGZpZWxkLm5hbWUpLCBvd25UeXBlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGRiVHlwZXMucHVzaCh0eXBlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZURiVHlwZXModHlwZXM6IFNjaGVtYU1lbWJlcjxTY2hlbWFUeXBlPltdKSB7XG4gICAgICAgIHR5cGVzLmZvckVhY2goKHR5cGU6IFNjaGVtYU1lbWJlcjxTY2hlbWFUeXBlPikgPT4ge1xuICAgICAgICAgICAgcGFyc2VEYlR5cGUodHlwZS5uYW1lLCB0eXBlKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IHVucmVzb2x2ZWQ6IE1hcDxzdHJpbmcsIERiVHlwZT4gPSBuZXcgTWFwPHN0cmluZywgRGJUeXBlPigpO1xuICAgICAgICBjb25zdCByZXNvbHZpbmc6IFNldDxzdHJpbmc+ID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgICAgIGNvbnN0IHJlc29sdmVkOiBNYXA8c3RyaW5nLCBEYlR5cGU+ID0gbmV3IE1hcDxzdHJpbmcsIERiVHlwZT4oKTtcbiAgICAgICAgY29uc3Qgb3JkZXJlZFJlc29sdmVkOiBEYlR5cGVbXSA9IFtdO1xuICAgICAgICBkYlR5cGVzLmZvckVhY2godCA9PiB1bnJlc29sdmVkLnNldCh0Lm5hbWUsIHQpKTtcbiAgICAgICAgY29uc3QgcmVzb2x2ZVR5cGUgPSAodHlwZTogRGJUeXBlKSA9PiB7XG4gICAgICAgICAgICBpZiAocmVzb2x2ZWQuaGFzKHR5cGUubmFtZSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocmVzb2x2aW5nLmhhcyh0eXBlLm5hbWUpKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFdBUk5JTkc6IENpcmN1bGFyIHJlZmVyZW5jZSB0byB0eXBlICR7dHlwZS5uYW1lfWApO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlc29sdmluZy5hZGQodHlwZS5uYW1lKTtcbiAgICAgICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGZpZWxkLnR5cGUuY2F0ZWdvcnkgPT09IERiVHlwZUNhdGVnb3J5LnVucmVzb2x2ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHR5cGUgPSByZXNvbHZlZC5nZXQoZmllbGQudHlwZS5uYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlID0gdW5yZXNvbHZlZC5nZXQoZmllbGQudHlwZS5uYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZVR5cGUodHlwZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBSZWZlcmVuY2VkIHR5cGUgbm90IGZvdW5kOiAke2ZpZWxkLnR5cGUubmFtZX1gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpZWxkLnR5cGUgPSB0eXBlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXNvbHZpbmcuZGVsZXRlKHR5cGUubmFtZSk7XG4gICAgICAgICAgICBvcmRlcmVkUmVzb2x2ZWQucHVzaCh0eXBlKTtcbiAgICAgICAgICAgIHVucmVzb2x2ZWQuZGVsZXRlKHR5cGUubmFtZSk7XG4gICAgICAgICAgICByZXNvbHZlZC5zZXQodHlwZS5uYW1lLCB0eXBlKTtcbiAgICAgICAgfTtcbiAgICAgICAgZGJUeXBlcy5mb3JFYWNoKHJlc29sdmVUeXBlKTtcbiAgICAgICAgZGJUeXBlcyA9IG9yZGVyZWRSZXNvbHZlZDtcbiAgICB9XG5cbi8vIEdlbmVyYXRvcnNcblxuICAgIGNvbnN0IHFsID0gbmV3IFdyaXRlcigpO1xuICAgIGNvbnN0IGpzID0gbmV3IFdyaXRlcigpO1xuXG4gICAgZnVuY3Rpb24gZ2VuUUxEb2MocHJlZml4OiBzdHJpbmcsIGRvYzogc3RyaW5nKSB7XG4gICAgICAgIGlmIChkb2MudHJpbSgpID09PSAnJykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGxpbmVzID0gZG9jLnNwbGl0KC9cXG5cXHI/fFxcclxcbj8vKTtcbiAgICAgICAgaWYgKGxpbmVzLmxlbmd0aCA9PT0gMSAmJiAhbGluZXNbMF0uaW5jbHVkZXMoJ1wiJykpIHtcbiAgICAgICAgICAgIHFsLndyaXRlTG4ocHJlZml4LCAnXCInLCBsaW5lc1swXSwgJ1wiJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBxbC53cml0ZUxuKHByZWZpeCwgJ1wiXCJcIicpO1xuICAgICAgICAgICAgbGluZXMuZm9yRWFjaCgobGluZSkgPT4ge1xuICAgICAgICAgICAgICAgIHFsLndyaXRlTG4ocHJlZml4LCBsaW5lKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcWwud3JpdGVMbihwcmVmaXgsICdcIlwiXCInKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHVuaW9uVmFyaWFudFR5cGUodHlwZTogRGJUeXBlLCB2YXJpYW50OiBEYkZpZWxkKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIGAke3R5cGUubmFtZX0ke3ZhcmlhbnQubmFtZX1WYXJpYW50YDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5RTFR5cGVEZWNsYXJhdGlvbnNGb3JVbmlvblZhcmlhbnRzKHR5cGU6IERiVHlwZSkge1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKCh2YXJpYW50KSA9PiB7XG4gICAgICAgICAgICBxbC53cml0ZUJsb2NrTG4oYFxuICAgICAgICB0eXBlICR7dW5pb25WYXJpYW50VHlwZSh0eXBlLCB2YXJpYW50KX0ge1xuICAgICAgICAgICAgJHt2YXJpYW50Lm5hbWV9OiAke3ZhcmlhbnQudHlwZS5uYW1lfVxuICAgICAgICB9XG5cbiAgICAgICAgYCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlblFMRW51bVR5cGVzKCkge1xuICAgICAgICBmb3IgKGNvbnN0IGVudW1EZWY6IEludEVudW1EZWYgb2YgZW51bVR5cGVzLnZhbHVlcygpKSB7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGBlbnVtICR7ZW51bURlZi5uYW1lfUVudW0ge2ApO1xuICAgICAgICAgICAgT2JqZWN0LmtleXMoZW51bURlZi52YWx1ZXMpLmZvckVhY2goKG5hbWUpID0+IHtcbiAgICAgICAgICAgICAgICBxbC53cml0ZUxuKGAgICAgJHt0b0VudW1TdHlsZShuYW1lKX1gKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcWwud3JpdGVMbihgfWApO1xuICAgICAgICAgICAgcWwud3JpdGVMbigpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuUUxUeXBlRGVjbGFyYXRpb24odHlwZTogRGJUeXBlKSB7XG4gICAgICAgIGlmICh0eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS51bmlvbikge1xuICAgICAgICAgICAgZ2VuUUxUeXBlRGVjbGFyYXRpb25zRm9yVW5pb25WYXJpYW50cyh0eXBlKTtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oYHVuaW9uICR7dHlwZS5uYW1lfSA9IGApO1xuICAgICAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCh2YXJpYW50ID0+IHtcbiAgICAgICAgICAgICAgICBxbC53cml0ZUxuKGBcXHR8ICR7dW5pb25WYXJpYW50VHlwZSh0eXBlLCB2YXJpYW50KX1gKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcWwud3JpdGVMbigpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZ2VuUUxEb2MoJycsIHR5cGUuZG9jKTtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oYHR5cGUgJHt0eXBlLm5hbWV9IHtgKTtcbiAgICAgICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goZmllbGQgPT4ge1xuICAgICAgICAgICAgICAgIGdlblFMRG9jKCdcXHQnLCBmaWVsZC5kb2MpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHR5cGVEZWNsYXJhdGlvbiA9XG4gICAgICAgICAgICAgICAgICAgICdbJy5yZXBlYXQoZmllbGQuYXJyYXlEZXB0aCkgK1xuICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlLm5hbWUgK1xuICAgICAgICAgICAgICAgICAgICAnXScucmVwZWF0KGZpZWxkLmFycmF5RGVwdGgpO1xuICAgICAgICAgICAgICAgIGxldCBwYXJhbXMgPSAnJztcbiAgICAgICAgICAgICAgICBpZiAoaXNCaWdJbnQoZmllbGQudHlwZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcGFyYW1zID0gJyhmb3JtYXQ6IEJpZ0ludEZvcm1hdCknO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQuam9pbikge1xuICAgICAgICAgICAgICAgICAgICBwYXJhbXMgPSBgKHRpbWVvdXQ6IEludCwgd2hlbjogJHt0eXBlLm5hbWV9RmlsdGVyKWA7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0JHtmaWVsZC5uYW1lfSR7cGFyYW1zfTogJHt0eXBlRGVjbGFyYXRpb259YCk7XG4gICAgICAgICAgICAgICAgY29uc3QgZW51bURlZiA9IGZpZWxkLmVudW1EZWY7XG4gICAgICAgICAgICAgICAgaWYgKGVudW1EZWYpIHtcbiAgICAgICAgICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0JHtmaWVsZC5uYW1lfV9uYW1lOiAke2VudW1EZWYubmFtZX1FbnVtYCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChmaWVsZC5mb3JtYXR0ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0JHtmaWVsZC5uYW1lfV9zdHJpbmc6IFN0cmluZ2ApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcWwud3JpdGVMbihgfWApO1xuICAgICAgICB9XG4gICAgICAgIHFsLndyaXRlTG4oKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwcmV2ZW50VHdpY2UobmFtZTogc3RyaW5nLCBuYW1lczogU2V0PHN0cmluZz4sIHdvcms6ICgpID0+IHZvaWQpIHtcbiAgICAgICAgaWYgKCFuYW1lcy5oYXMobmFtZSkpIHtcbiAgICAgICAgICAgIG5hbWVzLmFkZChuYW1lKTtcbiAgICAgICAgICAgIHdvcmsoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlblFMRmlsdGVyc0ZvckFycmF5RmllbGRzKHR5cGU6IERiVHlwZSwgcWxOYW1lczogU2V0PHN0cmluZz4pIHtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGxldCBpdGVtVHlwZU5hbWUgPSBmaWVsZC50eXBlLm5hbWU7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZpZWxkLmFycmF5RGVwdGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpbHRlck5hbWUgPSBgJHtpdGVtVHlwZU5hbWV9QXJyYXlGaWx0ZXJgO1xuICAgICAgICAgICAgICAgIHByZXZlbnRUd2ljZShmaWx0ZXJOYW1lLCBxbE5hbWVzLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHFsLndyaXRlTG4oYGlucHV0ICR7ZmlsdGVyTmFtZX0ge2ApO1xuICAgICAgICAgICAgICAgICAgICBbJ2FueScsICdhbGwnXS5mb3JFYWNoKChvcCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0JHtvcH06ICR7aXRlbVR5cGVOYW1lfUZpbHRlcmApO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgcWwud3JpdGVMbignfScpO1xuICAgICAgICAgICAgICAgICAgICBxbC53cml0ZUxuKCk7XG5cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBpdGVtVHlwZU5hbWUgKz0gJ0FycmF5JztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuUUxGaWx0ZXJzRm9yRW51bU5hbWVGaWVsZHModHlwZTogRGJUeXBlLCBxbE5hbWVzOiBTZXQ8c3RyaW5nPikge1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgZW51bURlZiA9IGZpZWxkLmVudW1EZWY7XG4gICAgICAgICAgICBpZiAoZW51bURlZikge1xuICAgICAgICAgICAgICAgIHByZXZlbnRUd2ljZShgJHtlbnVtRGVmLm5hbWV9RW51bUZpbHRlcmAsIHFsTmFtZXMsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgZ2VuUUxTY2FsYXJUeXBlc0ZpbHRlcihgJHtlbnVtRGVmLm5hbWV9RW51bWApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5RTEZpbHRlcih0eXBlOiBEYlR5cGUsIHFsTmFtZXM6IFNldDxzdHJpbmc+KSB7XG4gICAgICAgIGlmICh0eXBlLmZpZWxkcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBnZW5RTEZpbHRlcnNGb3JBcnJheUZpZWxkcyh0eXBlLCBxbE5hbWVzKTtcbiAgICAgICAgZ2VuUUxGaWx0ZXJzRm9yRW51bU5hbWVGaWVsZHModHlwZSwgcWxOYW1lcyk7XG4gICAgICAgIGdlblFMRG9jKCcnLCB0eXBlLmRvYyk7XG4gICAgICAgIHFsLndyaXRlTG4oYGlucHV0ICR7dHlwZS5uYW1lfUZpbHRlciB7YCk7XG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBnZW5RTERvYygnXFx0JywgZmllbGQuZG9jKTtcbiAgICAgICAgICAgIGNvbnN0IHR5cGVEZWNsYXJhdGlvbiA9IGZpZWxkLnR5cGUubmFtZSArIFwiQXJyYXlcIi5yZXBlYXQoZmllbGQuYXJyYXlEZXB0aCk7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGBcXHQke2ZpZWxkLm5hbWV9OiAke3R5cGVEZWNsYXJhdGlvbn1GaWx0ZXJgKTtcbiAgICAgICAgICAgIGNvbnN0IGVudW1EZWYgPSBmaWVsZC5lbnVtRGVmO1xuICAgICAgICAgICAgaWYgKGVudW1EZWYpIHtcbiAgICAgICAgICAgICAgICBxbC53cml0ZUxuKGBcXHQke2ZpZWxkLm5hbWV9X25hbWU6ICR7ZW51bURlZi5uYW1lfUVudW1GaWx0ZXJgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHFsLndyaXRlTG4oYCAgICBPUjogJHt0eXBlLm5hbWV9RmlsdGVyYCk7XG4gICAgICAgIHFsLndyaXRlTG4oYH1gKTtcbiAgICAgICAgcWwud3JpdGVMbigpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlblFMU2NhbGFyVHlwZXNGaWx0ZXIobmFtZTogc3RyaW5nKSB7XG4gICAgICAgIHFsLndyaXRlTG4oYGlucHV0ICR7bmFtZX1GaWx0ZXIge2ApO1xuICAgICAgICBbJ2VxJywgJ25lJywgJ2d0JywgJ2x0JywgJ2dlJywgJ2xlJ10uZm9yRWFjaCgob3ApID0+IHtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oYFxcdCR7b3B9OiAke25hbWV9YCk7XG4gICAgICAgIH0pO1xuICAgICAgICBbJ2luJywgJ25vdEluJ10uZm9yRWFjaCgob3ApID0+IHtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oYFxcdCR7b3B9OiBbJHtuYW1lfV1gKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHFsLndyaXRlTG4oJ30nKTtcbiAgICAgICAgcWwud3JpdGVMbigpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlblFMUXVlcmllcyh0eXBlczogRGJUeXBlW10pIHtcbiAgICAgICAgcWwud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgXCJTcGVjaWZ5IHNvcnQgb3JkZXIgZGlyZWN0aW9uXCJcbiAgICAgICAgZW51bSBRdWVyeU9yZGVyQnlEaXJlY3Rpb24ge1xuICAgICAgICAgICAgXCJEb2N1bWVudHMgd2lsbCBiZSBzb3J0ZWQgaW4gYXNjZW5kZWQgb3JkZXIgKGUuZy4gZnJvbSBBIHRvIFopXCJcbiAgICAgICAgICAgIEFTQ1xuICAgICAgICAgICAgXCJEb2N1bWVudHMgd2lsbCBiZSBzb3J0ZWQgaW4gZGVzY2VuZGFudCBvcmRlciAoZS5nLiBmcm9tIFogdG8gQSlcIlxuICAgICAgICAgICAgREVTQ1xuICAgICAgICB9XG5cbiAgICAgICAgXG4gICAgICAgIFwiXCJcIlxuICAgICAgICBTcGVjaWZ5IGhvdyB0byBzb3J0IHJlc3VsdHMuXG4gICAgICAgIFlvdSBjYW4gc29ydCBkb2N1bWVudHMgaW4gcmVzdWx0IHNldCB1c2luZyBtb3JlIHRoYW4gb25lIGZpZWxkLlxuICAgICAgICBcIlwiXCJcbiAgICAgICAgaW5wdXQgUXVlcnlPcmRlckJ5IHtcbiAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgICAgUGF0aCB0byBmaWVsZCB3aGljaCBtdXN0IGJlIHVzZWQgYXMgYSBzb3J0IGNyaXRlcmlhLlxuICAgICAgICAgICAgSWYgZmllbGQgcmVzaWRlcyBkZWVwIGluIHN0cnVjdHVyZSBwYXRoIGl0ZW1zIG11c3QgYmUgc2VwYXJhdGVkIHdpdGggZG90IChlLmcuICdmb28uYmFyLmJheicpLlxuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgICBwYXRoOiBTdHJpbmdcbiAgICAgICAgICAgIFwiU29ydCBvcmRlciBkaXJlY3Rpb25cIlxuICAgICAgICAgICAgZGlyZWN0aW9uOiBRdWVyeU9yZGVyQnlEaXJlY3Rpb25cbiAgICAgICAgfVxuXG4gICAgICAgIHR5cGUgUXVlcnkge1xuICAgICAgICBgKTtcblxuICAgICAgICB0eXBlcy5mb3JFYWNoKCh0eXBlOiBEYlR5cGUpID0+IHtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oYFxcdCR7dHlwZS5jb2xsZWN0aW9uIHx8ICcnfShmaWx0ZXI6ICR7dHlwZS5uYW1lfUZpbHRlciwgb3JkZXJCeTogW1F1ZXJ5T3JkZXJCeV0sIGxpbWl0OiBJbnQsIHRpbWVvdXQ6IEZsb2F0LCBhY2Nlc3NLZXk6IFN0cmluZywgb3BlcmF0aW9uSWQ6IFN0cmluZyk6IFske3R5cGUubmFtZX1dYCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHFsLndyaXRlQmxvY2tMbihgXG4gICAgICAgIH1cblxuICAgICAgICBgKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5RTFN1YnNjcmlwdGlvbnModHlwZXM6IERiVHlwZVtdKSB7XG4gICAgICAgIHFsLndyaXRlTG4oJ3R5cGUgU3Vic2NyaXB0aW9uIHsnKTtcbiAgICAgICAgdHlwZXMuZm9yRWFjaCgodHlwZSkgPT4ge1xuICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0JHt0eXBlLmNvbGxlY3Rpb24gfHwgJyd9KGZpbHRlcjogJHt0eXBlLm5hbWV9RmlsdGVyLCBhY2Nlc3NLZXk6IFN0cmluZyk6ICR7dHlwZS5uYW1lfWApO1xuICAgICAgICB9KTtcbiAgICAgICAgcWwud3JpdGVMbignfScpO1xuICAgIH1cblxuXG4gICAgZnVuY3Rpb24gZ2V0U2NhbGFyUmVzb2x2ZXJOYW1lKGZpZWxkOiBEYkZpZWxkKTogc3RyaW5nIHtcbiAgICAgICAgaWYgKGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLnVpbnQ2NCkge1xuICAgICAgICAgICAgcmV0dXJuICdiaWdVSW50MSc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLnVpbnQxMDI0KSB7XG4gICAgICAgICAgICByZXR1cm4gJ2JpZ1VJbnQyJztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJ3NjYWxhcic7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuSlNGaWx0ZXJzRm9yQXJyYXlGaWVsZHModHlwZTogRGJUeXBlLCBqc05hbWVzOiBTZXQ8c3RyaW5nPikge1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgbGV0IGl0ZW1UeXBlTmFtZSA9IGZpZWxkLnR5cGUubmFtZTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZmllbGQuYXJyYXlEZXB0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmlsdGVyTmFtZSA9IGAke2l0ZW1UeXBlTmFtZX1BcnJheWA7XG4gICAgICAgICAgICAgICAgcHJldmVudFR3aWNlKGZpbHRlck5hbWUsIGpzTmFtZXMsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaXRlbVJlc29sdmVyTmFtZSA9IChpID09PSAwICYmIGZpZWxkLnR5cGUuY2F0ZWdvcnkgPT09IERiVHlwZUNhdGVnb3J5LnNjYWxhcilcbiAgICAgICAgICAgICAgICAgICAgICAgID8gZ2V0U2NhbGFyUmVzb2x2ZXJOYW1lKGZpZWxkKVxuICAgICAgICAgICAgICAgICAgICAgICAgOiBpdGVtVHlwZU5hbWU7XG4gICAgICAgICAgICAgICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgICAgICAgICAgY29uc3QgJHtmaWx0ZXJOYW1lfSA9IGFycmF5KCgpID0+ICR7aXRlbVJlc29sdmVyTmFtZX0pO1xuICAgICAgICAgICAgICAgIGApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGl0ZW1UeXBlTmFtZSArPSAnQXJyYXknO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5KU1N0cnVjdEZpbHRlcih0eXBlOiBEYlR5cGUpIHtcbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgY29uc3QgJHt0eXBlLm5hbWV9ID0gc3RydWN0KHtcbiAgICBgKTtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGxldCB0eXBlRGVjbGFyYXRpb246ID9zdHJpbmcgPSBudWxsO1xuICAgICAgICAgICAgY29uc3Qgam9pbiA9IGZpZWxkLmpvaW47XG4gICAgICAgICAgICBpZiAoam9pbikge1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1ZmZpeCA9IGZpZWxkLmFycmF5RGVwdGggPiAwID8gJ0FycmF5JyA6ICcnO1xuICAgICAgICAgICAgICAgIHR5cGVEZWNsYXJhdGlvbiA9IGBqb2luJHtzdWZmaXh9KCcke2pvaW4ub259JywgJyR7am9pbi5yZWZPbn0nLCAnJHtmaWVsZC50eXBlLmNvbGxlY3Rpb24gfHwgJyd9JywgKCkgPT4gJHtmaWVsZC50eXBlLm5hbWV9KWA7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLmFycmF5RGVwdGggPiAwKSB7XG4gICAgICAgICAgICAgICAgdHlwZURlY2xhcmF0aW9uID1cbiAgICAgICAgICAgICAgICAgICAgZmllbGQudHlwZS5uYW1lICtcbiAgICAgICAgICAgICAgICAgICAgJ0FycmF5Jy5yZXBlYXQoZmllbGQuYXJyYXlEZXB0aCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLnR5cGUuY2F0ZWdvcnkgPT09IERiVHlwZUNhdGVnb3J5LnNjYWxhcikge1xuICAgICAgICAgICAgICAgIHR5cGVEZWNsYXJhdGlvbiA9IGdldFNjYWxhclJlc29sdmVyTmFtZShmaWVsZCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLnR5cGUuZmllbGRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB0eXBlRGVjbGFyYXRpb24gPSBmaWVsZC50eXBlLm5hbWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodHlwZURlY2xhcmF0aW9uKSB7XG4gICAgICAgICAgICAgICAganMud3JpdGVMbihgICAgICR7ZmllbGQubmFtZX06ICR7dHlwZURlY2xhcmF0aW9ufSxgKTtcbiAgICAgICAgICAgICAgICBjb25zdCBlbnVtRGVmID0gZmllbGQuZW51bURlZjtcbiAgICAgICAgICAgICAgICBpZiAoZW51bURlZikge1xuICAgICAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgJHtmaWVsZC5uYW1lfV9uYW1lOiBlbnVtTmFtZSgnJHtmaWVsZC5uYW1lfScsICR7c3RyaW5naWZ5RW51bVZhbHVlcyhlbnVtRGVmLnZhbHVlcyl9KSxgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICB9JHt0eXBlLmNvbGxlY3Rpb24gPyAnLCB0cnVlJyA6ICcnfSk7XG5cbiAgICBgKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5KU1VuaW9uUmVzb2x2ZXIodHlwZTogRGJUeXBlKSB7XG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIGNvbnN0ICR7dHlwZS5uYW1lfVJlc29sdmVyID0ge1xuICAgICAgICAgICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgYCk7XG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKHZhcmlhbnQpID0+IHtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgaWYgKCcke3ZhcmlhbnQubmFtZX0nIGluIG9iaikge2ApO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgcmV0dXJuICcke3VuaW9uVmFyaWFudFR5cGUodHlwZSwgdmFyaWFudCl9JztgKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgfWApO1xuICAgICAgICB9KTtcbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBgKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5KU0ZpbHRlcih0eXBlOiBEYlR5cGUsIGpzTmFtZXM6IFNldDxzdHJpbmc+KSB7XG4gICAgICAgIGlmICh0eXBlLmZpZWxkcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZS5jYXRlZ29yeSA9PT0gRGJUeXBlQ2F0ZWdvcnkudW5pb24pIHtcbiAgICAgICAgICAgIC8vIGdlbkpTRmlsdGVyc0ZvclVuaW9uVmFyaWFudHModHlwZSwganNOYW1lcyk7XG4gICAgICAgIH1cbiAgICAgICAgZ2VuSlNGaWx0ZXJzRm9yQXJyYXlGaWVsZHModHlwZSwganNOYW1lcyk7XG4gICAgICAgIGdlbkpTU3RydWN0RmlsdGVyKHR5cGUpO1xuICAgICAgICBpZiAodHlwZS5jYXRlZ29yeSA9PT0gRGJUeXBlQ2F0ZWdvcnkudW5pb24pIHtcbiAgICAgICAgICAgIGdlbkpTVW5pb25SZXNvbHZlcih0eXBlKTtcbiAgICAgICAgfVxuXG5cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZW5lcmF0ZSBjdXN0b20gcmVzb2x2ZXJzIGZvciB0eXBlcyB3aXRoOlxuICAgICAqIC0gaWQgZmllbGRcbiAgICAgKiAtIGpvaW4gZmllbGRzXG4gICAgICogLSB1NjQgYW5kIGhpZ2hlciBmaWVsZHNcbiAgICAgKiBAcGFyYW0gdHlwZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGdlbkpTQ3VzdG9tUmVzb2x2ZXJzKHR5cGU6IERiVHlwZSkge1xuICAgICAgICBjb25zdCBqb2luRmllbGRzID0gdHlwZS5maWVsZHMuZmlsdGVyKHggPT4gISF4LmpvaW4pO1xuICAgICAgICBjb25zdCBiaWdVSW50RmllbGRzID0gdHlwZS5maWVsZHMuZmlsdGVyKCh4OiBEYkZpZWxkKSA9PiBpc0JpZ0ludCh4LnR5cGUpKTtcbiAgICAgICAgY29uc3Qgc3RyaW5nRm9ybWF0dGVkRmllbGRzID0gdHlwZS5maWVsZHMuZmlsdGVyKCh4OiBEYkZpZWxkKSA9PiB4LmZvcm1hdHRlcik7XG4gICAgICAgIGNvbnN0IGVudW1GaWVsZHMgPSB0eXBlLmZpZWxkcy5maWx0ZXIoeCA9PiB4LmVudW1EZWYpO1xuICAgICAgICBjb25zdCBjdXN0b21SZXNvbHZlclJlcXVpcmVkID0gdHlwZS5jb2xsZWN0aW9uXG4gICAgICAgICAgICB8fCBqb2luRmllbGRzLmxlbmd0aCA+IDBcbiAgICAgICAgICAgIHx8IGJpZ1VJbnRGaWVsZHMubGVuZ3RoID4gMFxuICAgICAgICAgICAgfHwgZW51bUZpZWxkcy5sZW5ndGggPiAwO1xuICAgICAgICBpZiAoIWN1c3RvbVJlc29sdmVyUmVxdWlyZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICR7dHlwZS5uYW1lfToge2ApO1xuICAgICAgICBpZiAodHlwZS5jb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICBqcy53cml0ZUxuKCcgICAgICAgICAgICBpZChwYXJlbnQpIHsnKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oJyAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7Jyk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKCcgICAgICAgICAgICB9LCcpO1xuICAgICAgICB9XG4gICAgICAgIGpvaW5GaWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGpvaW4gPSBmaWVsZC5qb2luO1xuICAgICAgICAgICAgaWYgKCFqb2luKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3Qgb25GaWVsZCA9IHR5cGUuZmllbGRzLmZpbmQoeCA9PiB4Lm5hbWUgPT09IGpvaW4ub24pO1xuICAgICAgICAgICAgaWYgKCFvbkZpZWxkKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgJ0pvaW4gb24gZmllbGQgZG9lcyBub3QgZXhpc3QuJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IG9uID0gam9pbi5vbiA9PT0gJ2lkJyA/ICdfa2V5JyA6IChqb2luLm9uIHx8ICdfa2V5Jyk7XG4gICAgICAgICAgICBjb25zdCByZWZPbiA9IGpvaW4ucmVmT24gPT09ICdpZCcgPyAnX2tleScgOiAoam9pbi5yZWZPbiB8fCAnX2tleScpO1xuICAgICAgICAgICAgY29uc3QgY29sbGVjdGlvbiA9IGZpZWxkLnR5cGUuY29sbGVjdGlvbjtcbiAgICAgICAgICAgIGlmICghY29sbGVjdGlvbikge1xuICAgICAgICAgICAgICAgIHRocm93ICdKb2luZWQgdHlwZSBpcyBub3QgYSBjb2xsZWN0aW9uLic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAke2ZpZWxkLm5hbWV9KHBhcmVudCwgYXJncywgY29udGV4dCkge2ApO1xuICAgICAgICAgICAgaWYgKGpvaW4ucHJlQ29uZGl0aW9uKSB7XG4gICAgICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgICAgIGlmICghKCR7am9pbi5wcmVDb25kaXRpb259KSkge2ApO1xuICAgICAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7YCk7XG4gICAgICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgICAgIH1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICAgICBpZiAoYXJncy53aGVuICYmICEke3R5cGUubmFtZX0udGVzdChudWxsLCBwYXJlbnQsIGFyZ3Mud2hlbikpIHtgKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7YCk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAgICAgfWApO1xuXG4gICAgICAgICAgICBpZiAoZmllbGQuYXJyYXlEZXB0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICAgICByZXR1cm4gY29udGV4dC5kYi4ke2NvbGxlY3Rpb259LndhaXRGb3JEb2MocGFyZW50LiR7b259LCAnJHtyZWZPbn0nLCBhcmdzKTtgKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQuYXJyYXlEZXB0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICAgICByZXR1cm4gY29udGV4dC5kYi4ke2NvbGxlY3Rpb259LndhaXRGb3JEb2NzKHBhcmVudC4ke29ufSwgJyR7cmVmT259JywgYXJncyk7YCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93ICdKb2lucyBvbiBhIG5lc3RlZCBhcnJheXMgZG9lcyBub3Qgc3VwcG9ydGVkLic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICB9LGApO1xuICAgICAgICB9KTtcbiAgICAgICAgYmlnVUludEZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcHJlZml4TGVuZ3RoID0gZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDY0ID8gMSA6IDI7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAke2ZpZWxkLm5hbWV9KHBhcmVudCwgYXJncykge2ApO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgke3ByZWZpeExlbmd0aH0sIHBhcmVudC4ke2ZpZWxkLm5hbWV9LCBhcmdzKTtgKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgIH0sYCk7XG4gICAgICAgIH0pO1xuICAgICAgICBzdHJpbmdGb3JtYXR0ZWRGaWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICR7ZmllbGQubmFtZX1fc3RyaW5nKHBhcmVudCwgYXJncykge2ApO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgICAgIHJldHVybiAke2ZpZWxkLmZvcm1hdHRlcn0ocGFyZW50LiR7ZmllbGQubmFtZX0pO2ApO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgfSxgKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGVudW1GaWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGVudW1EZWYgPSBmaWVsZC5lbnVtRGVmO1xuICAgICAgICAgICAgaWYgKGVudW1EZWYpIHtcbiAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAke2ZpZWxkLm5hbWV9X25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJyR7ZmllbGQubmFtZX0nLCAke3N0cmluZ2lmeUVudW1WYWx1ZXMoZW51bURlZi52YWx1ZXMpfSksYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgIH0sYCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuSlNTY2FsYXJGaWVsZHModHlwZTogRGJUeXBlLCBwYXJlbnRQYXRoLCBwYXJlbnREb2NQYXRoOiBzdHJpbmcpIHtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgoZmllbGQ6IERiRmllbGQpID0+IHtcbiAgICAgICAgICAgIGlmIChmaWVsZC5qb2luIHx8IGZpZWxkLmVudW1EZWYpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBkb2NOYW1lID0gZmllbGQubmFtZSA9PT0gJ2lkJyA/ICdfa2V5JyA6IGZpZWxkLm5hbWU7XG4gICAgICAgICAgICBjb25zdCBwYXRoID0gYCR7cGFyZW50UGF0aH0uJHtmaWVsZC5uYW1lfWA7XG4gICAgICAgICAgICBsZXQgZG9jUGF0aCA9IGAke3BhcmVudERvY1BhdGh9LiR7ZG9jTmFtZX1gO1xuICAgICAgICAgICAgaWYgKGZpZWxkLmFycmF5RGVwdGggPiAwKSB7XG4gICAgICAgICAgICAgICAgbGV0IHN1ZmZpeCA9ICdbKl0nO1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGRlcHRoID0gMTA7IGRlcHRoID4gMDsgZGVwdGggLT0gMSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzID0gYFskeycqJy5yZXBlYXQoZGVwdGgpfV1gO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZG9jUGF0aC5pbmNsdWRlcyhzKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VmZml4ID0gYFskeycqJy5yZXBlYXQoZGVwdGggKyAxKX1dYDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGRvY1BhdGggPSBgJHtkb2NQYXRofSR7c3VmZml4fWA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzd2l0Y2goZmllbGQudHlwZS5jYXRlZ29yeSkge1xuICAgICAgICAgICAgY2FzZSBcInNjYWxhclwiOlxuICAgICAgICAgICAgICAgIGxldCB0eXBlTmFtZTtcbiAgICAgICAgICAgICAgICBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMuYm9vbGVhbikge1xuICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZSA9ICdib29sZWFuJztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLmZsb2F0KSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lID0gJ251bWJlcic7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC50eXBlID09PSBzY2FsYXJUeXBlcy5pbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWUgPSAnbnVtYmVyJztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLnVpbnQ2NCkge1xuICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZSA9ICd1aW50NjQnO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDEwMjQpIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWUgPSAndWludDEwMjQnO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lID0gJ3N0cmluZyc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGpzLndyaXRlTG4oYHNjYWxhckZpZWxkcy5zZXQoJyR7cGF0aH0nLCB7IHR5cGU6ICcke3R5cGVOYW1lfScsIHBhdGg6ICcke2RvY1BhdGh9JyB9KTtgKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJzdHJ1Y3RcIjpcbiAgICAgICAgICAgIGNhc2UgXCJ1bmlvblwiOlxuICAgICAgICAgICAgICAgIGdlbkpTU2NhbGFyRmllbGRzKGZpZWxkLnR5cGUsIHBhdGgsIGRvY1BhdGgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cblxuICAgIGZ1bmN0aW9uIGdlbkpTVHlwZVJlc29sdmVyc0ZvclVuaW9uKHR5cGU6IERiVHlwZSkge1xuICAgICAgICBpZiAodHlwZS5jYXRlZ29yeSA9PT0gRGJUeXBlQ2F0ZWdvcnkudW5pb24pIHtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgJHt0eXBlLm5hbWV9OiAke3R5cGUubmFtZX1SZXNvbHZlcixgKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbmVyYXRlKHR5cGVzOiBEYlR5cGVbXSkge1xuXG4gICAgICAgIC8vIFFMXG5cbiAgICAgICAgcWwud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgXCJcIlwiXG4gICAgICAgIER1ZSB0byBHcmFwaFFMIGxpbWl0YXRpb25zIGJpZyBudW1iZXJzIGFyZSByZXR1cm5lZCBhcyBhIHN0cmluZy5cbiAgICAgICAgWW91IGNhbiBzcGVjaWZ5IGZvcm1hdCB1c2VkIHRvIHN0cmluZyByZXByZXNlbnRhdGlvbiBmb3IgYmlnIGludGVnZXJzLlxuICAgICAgICBcIlwiXCJcbiAgICAgICAgZW51bSBCaWdJbnRGb3JtYXQge1xuICAgICAgICAgICAgXCIgSGV4YWRlY2ltYWwgcmVwcmVzZW50YXRpb24gc3RhcnRlZCB3aXRoIDB4IChkZWZhdWx0KSBcIlxuICAgICAgICAgICAgSEVYXG4gICAgICAgICAgICBcIiBEZWNpbWFsIHJlcHJlc2VudGF0aW9uIFwiXG4gICAgICAgICAgICBERUNcbiAgICAgICAgfVxuICAgICAgICBgKTtcbiAgICAgICAgWydTdHJpbmcnLCAnQm9vbGVhbicsICdJbnQnLCAnRmxvYXQnXS5mb3JFYWNoKGdlblFMU2NhbGFyVHlwZXNGaWx0ZXIpO1xuICAgICAgICBnZW5RTEVudW1UeXBlcygpO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKHR5cGUgPT4gZ2VuUUxUeXBlRGVjbGFyYXRpb24odHlwZSkpO1xuICAgICAgICBjb25zdCBxbEFycmF5RmlsdGVycyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKHR5cGUgPT4gZ2VuUUxGaWx0ZXIodHlwZSwgcWxBcnJheUZpbHRlcnMpKTtcblxuICAgICAgICBjb25zdCBjb2xsZWN0aW9ucyA9IHR5cGVzLmZpbHRlcih0ID0+ICEhdC5jb2xsZWN0aW9uKTtcbiAgICAgICAgZ2VuUUxRdWVyaWVzKGNvbGxlY3Rpb25zKTtcbiAgICAgICAgZ2VuUUxTdWJzY3JpcHRpb25zKGNvbGxlY3Rpb25zKTtcblxuICAgICAgICAvLyBKU1xuXG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIGNvbnN0IHtcbiAgICAgICAgICAgIHNjYWxhcixcbiAgICAgICAgICAgIGJpZ1VJbnQxLFxuICAgICAgICAgICAgYmlnVUludDIsXG4gICAgICAgICAgICByZXNvbHZlQmlnVUludCxcbiAgICAgICAgICAgIHN0cnVjdCxcbiAgICAgICAgICAgIGFycmF5LFxuICAgICAgICAgICAgam9pbixcbiAgICAgICAgICAgIGpvaW5BcnJheSxcbiAgICAgICAgICAgIGVudW1OYW1lLFxuICAgICAgICAgICAgY3JlYXRlRW51bU5hbWVSZXNvbHZlcixcbiAgICAgICAgICAgIHVuaXhNaWxsaXNlY29uZHNUb1N0cmluZyxcbiAgICAgICAgICAgIHVuaXhTZWNvbmRzVG9TdHJpbmcsXG4gICAgICAgIH0gPSByZXF1aXJlKCcuL2RiLXR5cGVzLmpzJyk7XG4gICAgICAgIGApO1xuICAgICAgICBjb25zdCBqc0FycmF5RmlsdGVycyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKHR5cGUgPT4gZ2VuSlNGaWx0ZXIodHlwZSwganNBcnJheUZpbHRlcnMpKTtcblxuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBmdW5jdGlvbiBjcmVhdGVSZXNvbHZlcnMoZGIpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgIGApO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgICAgICAgICBnZW5KU0N1c3RvbVJlc29sdmVycyh0eXBlKTtcbiAgICAgICAgICAgIGdlbkpTVHlwZVJlc29sdmVyc0ZvclVuaW9uKHR5cGUpO1xuICAgICAgICB9KTtcbiAgICAgICAganMud3JpdGVMbignICAgICAgICBRdWVyeTogeycpO1xuICAgICAgICBjb2xsZWN0aW9ucy5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAke3R5cGUuY29sbGVjdGlvbiB8fCAnJ306IGRiLiR7dHlwZS5jb2xsZWN0aW9uIHx8ICcnfS5xdWVyeVJlc29sdmVyKCksYClcbiAgICAgICAgfSk7XG4gICAgICAgIGpzLndyaXRlTG4oJyAgICAgICAgfSwnKTtcbiAgICAgICAganMud3JpdGVMbignICAgICAgICBTdWJzY3JpcHRpb246IHsnKTtcbiAgICAgICAgY29sbGVjdGlvbnMuZm9yRWFjaCgodHlwZSkgPT4ge1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgJHt0eXBlLmNvbGxlY3Rpb24gfHwgJyd9OiBkYi4ke3R5cGUuY29sbGVjdGlvbiB8fCAnJ30uc3Vic2NyaXB0aW9uUmVzb2x2ZXIoKSxgKVxuICAgICAgICB9KTtcbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBgKTtcblxuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBjb25zdCBzY2FsYXJGaWVsZHMgPSBuZXcgTWFwKCk7XG4gICAgICAgIGApO1xuICAgICAgICBjb2xsZWN0aW9ucy5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgICAgICAgICBnZW5KU1NjYWxhckZpZWxkcyh0eXBlLCB0eXBlLmNvbGxlY3Rpb24gfHwgJycsICdkb2MnKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgICAgICAgICBzY2FsYXJGaWVsZHMsXG4gICAgICAgICAgICBjcmVhdGVSZXNvbHZlcnMsXG4gICAgICAgIGApO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKHR5cGUgPT4ganMud3JpdGVMbihgICAgICR7dHlwZS5uYW1lfSxgKSk7XG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIH07XG4gICAgICAgIGApO1xuICAgIH1cblxuICAgIGNvbnN0IHNjaGVtYSA9IHBhcnNlVHlwZURlZihzY2hlbWFEZWYpO1xuXG4gICAgaWYgKHNjaGVtYS5jbGFzcykge1xuICAgICAgICBwYXJzZURiVHlwZXMoc2NoZW1hLmNsYXNzLnR5cGVzKTtcbiAgICAgICAgZ2VuZXJhdGUoZGJUeXBlcyk7XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBlOiBJbnRFbnVtRGVmIG9mIGVudW1UeXBlcy52YWx1ZXMoKSkge1xuICAgICAgICBjb25zb2xlLmxvZyhgZXhwb3J0IGNvbnN0IFEke2UubmFtZX0gPSB7YCk7XG4gICAgICAgIGNvbnNvbGUubG9nKE9iamVjdC5lbnRyaWVzKGUudmFsdWVzKS5tYXAoKFtuYW1lLCB2YWx1ZV0pID0+IHtcbiAgICAgICAgICAgIHJldHVybiBgICAgICR7bmFtZX06ICR7KHZhbHVlOiBhbnkpfSxgO1xuICAgICAgICB9KS5qb2luKCdcXG4nKSk7XG4gICAgICAgIGNvbnNvbGUubG9nKGB9O1xcbmApO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIHFsOiBxbC5nZW5lcmF0ZWQoKSxcbiAgICAgICAganM6IGpzLmdlbmVyYXRlZCgpLFxuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgbWFpbjtcbiJdfQ==