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
      js.writeLn(`                return ${field.formatter || ''}(parent.${field.name});`);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NlcnZlci9zY2hlbWEvcWwtanMtZ2VuZXJhdG9yLmpzIl0sIm5hbWVzIjpbIkRiVHlwZUNhdGVnb3J5IiwidW5yZXNvbHZlZCIsInNjYWxhciIsInVuaW9uIiwic3RydWN0Iiwic2NhbGFyVHlwZSIsIm5hbWUiLCJjYXRlZ29yeSIsImZpZWxkcyIsImRvYyIsInNjYWxhclR5cGVzIiwiaW50IiwidWludDY0IiwidWludDEwMjQiLCJmbG9hdCIsImJvb2xlYW4iLCJzdHJpbmciLCJpc0JpZ0ludCIsInR5cGUiLCJ1bnJlc29sdmVkVHlwZSIsImlzTG93ZXJDYXNlZCIsInMiLCJsIiwidG9Mb3dlckNhc2UiLCJ1IiwidG9VcHBlckNhc2UiLCJpc1VwcGVyQ2FzZWQiLCJ0b0FsbENhcHMiLCJyZXN1bHQiLCJpIiwibGVuZ3RoIiwidG9FbnVtU3R5bGUiLCJzdWJzdHIiLCJzdHJpbmdpZnlFbnVtVmFsdWVzIiwidmFsdWVzIiwiT2JqZWN0IiwiZW50cmllcyIsIm1hcCIsInZhbHVlIiwiam9pbiIsImdldERvY01EIiwic2NoZW1hIiwibWQiLCJtYWluIiwic2NoZW1hRGVmIiwiZGJUeXBlcyIsImxhc3RSZXBvcnRlZFR5cGUiLCJlbnVtVHlwZXMiLCJNYXAiLCJyZXBvcnRUeXBlIiwiZmllbGQiLCJjb25zb2xlIiwibG9nIiwicGFyc2VEYkZpZWxkIiwidHlwZU5hbWUiLCJzY2hlbWFGaWVsZCIsInNjaGVtYVR5cGUiLCJhcnJheURlcHRoIiwiYXJyYXkiLCJleCIsIl8iLCJlbnVtRGVmIiwiZW51bSIsInNldCIsImZvcm1hdHRlciIsInJlZiIsImJvb2wiLCJ1bnNpZ25lZCIsInNpemUiLCJFcnJvciIsIkpTT04iLCJzdHJpbmdpZnkiLCJwcm9jZXNzIiwiZXhpdCIsInVud3JhcEFycmF5cyIsInBhcnNlRGJUeXBlIiwiY29sbGVjdGlvbiIsInB1c2giLCJmb3JFYWNoIiwidW53cmFwcGVkIiwib3duVHlwZSIsInBhcnNlRGJUeXBlcyIsInR5cGVzIiwicmVzb2x2aW5nIiwiU2V0IiwicmVzb2x2ZWQiLCJvcmRlcmVkUmVzb2x2ZWQiLCJ0IiwicmVzb2x2ZVR5cGUiLCJoYXMiLCJhZGQiLCJnZXQiLCJkZWxldGUiLCJxbCIsIldyaXRlciIsImpzIiwiZ2VuUUxEb2MiLCJwcmVmaXgiLCJ0cmltIiwibGluZXMiLCJzcGxpdCIsImluY2x1ZGVzIiwid3JpdGVMbiIsImxpbmUiLCJ1bmlvblZhcmlhbnRUeXBlIiwidmFyaWFudCIsImdlblFMVHlwZURlY2xhcmF0aW9uc0ZvclVuaW9uVmFyaWFudHMiLCJ3cml0ZUJsb2NrTG4iLCJnZW5RTEVudW1UeXBlcyIsImtleXMiLCJnZW5RTFR5cGVEZWNsYXJhdGlvbiIsInR5cGVEZWNsYXJhdGlvbiIsInJlcGVhdCIsInBhcmFtcyIsInByZXZlbnRUd2ljZSIsIm5hbWVzIiwid29yayIsImdlblFMRmlsdGVyc0ZvckFycmF5RmllbGRzIiwicWxOYW1lcyIsIml0ZW1UeXBlTmFtZSIsImZpbHRlck5hbWUiLCJvcCIsImdlblFMRmlsdGVyc0ZvckVudW1OYW1lRmllbGRzIiwiZ2VuUUxTY2FsYXJUeXBlc0ZpbHRlciIsImdlblFMRmlsdGVyIiwiZ2VuUUxRdWVyaWVzIiwiZ2VuUUxTdWJzY3JpcHRpb25zIiwiZ2V0U2NhbGFyUmVzb2x2ZXJOYW1lIiwiZ2VuSlNGaWx0ZXJzRm9yQXJyYXlGaWVsZHMiLCJqc05hbWVzIiwiaXRlbVJlc29sdmVyTmFtZSIsImdlbkpTU3RydWN0RmlsdGVyIiwic3VmZml4Iiwib24iLCJyZWZPbiIsImdlbkpTVW5pb25SZXNvbHZlciIsImdlbkpTRmlsdGVyIiwiZ2VuSlNDdXN0b21SZXNvbHZlcnMiLCJqb2luRmllbGRzIiwiZmlsdGVyIiwieCIsImJpZ1VJbnRGaWVsZHMiLCJzdHJpbmdGb3JtYXR0ZWRGaWVsZHMiLCJlbnVtRmllbGRzIiwiY3VzdG9tUmVzb2x2ZXJSZXF1aXJlZCIsIm9uRmllbGQiLCJmaW5kIiwicHJlQ29uZGl0aW9uIiwicHJlZml4TGVuZ3RoIiwiZ2VuSlNTY2FsYXJGaWVsZHMiLCJwYXJlbnRQYXRoIiwicGFyZW50RG9jUGF0aCIsImRvY05hbWUiLCJwYXRoIiwiZG9jUGF0aCIsImRlcHRoIiwiZ2VuSlNUeXBlUmVzb2x2ZXJzRm9yVW5pb24iLCJnZW5lcmF0ZSIsInFsQXJyYXlGaWx0ZXJzIiwiY29sbGVjdGlvbnMiLCJqc0FycmF5RmlsdGVycyIsImNsYXNzIiwiZSIsImdlbmVyYXRlZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUVBOztBQUVBOztBQUdBLE1BQU1BLGNBQWMsR0FBRztBQUNuQkMsRUFBQUEsVUFBVSxFQUFFLFlBRE87QUFFbkJDLEVBQUFBLE1BQU0sRUFBRSxRQUZXO0FBR25CQyxFQUFBQSxLQUFLLEVBQUUsT0FIWTtBQUluQkMsRUFBQUEsTUFBTSxFQUFFO0FBSlcsQ0FBdkI7O0FBdUNBLFNBQVNDLFVBQVQsQ0FBb0JDLElBQXBCLEVBQTBDO0FBQ3RDLFNBQU87QUFDSEEsSUFBQUEsSUFERztBQUVIQyxJQUFBQSxRQUFRLEVBQUVQLGNBQWMsQ0FBQ0UsTUFGdEI7QUFHSE0sSUFBQUEsTUFBTSxFQUFFLEVBSEw7QUFJSEMsSUFBQUEsR0FBRyxFQUFFO0FBSkYsR0FBUDtBQU1IOztBQUVELE1BQU1DLFdBQVcsR0FBRztBQUNoQkMsRUFBQUEsR0FBRyxFQUFFTixVQUFVLENBQUMsS0FBRCxDQURDO0FBRWhCTyxFQUFBQSxNQUFNLEVBQUVQLFVBQVUsQ0FBQyxRQUFELENBRkY7QUFHaEJRLEVBQUFBLFFBQVEsRUFBRVIsVUFBVSxDQUFDLFFBQUQsQ0FISjtBQUloQlMsRUFBQUEsS0FBSyxFQUFFVCxVQUFVLENBQUMsT0FBRCxDQUpEO0FBS2hCVSxFQUFBQSxPQUFPLEVBQUVWLFVBQVUsQ0FBQyxTQUFELENBTEg7QUFNaEJXLEVBQUFBLE1BQU0sRUFBRVgsVUFBVSxDQUFDLFFBQUQ7QUFORixDQUFwQjs7QUFTQSxTQUFTWSxRQUFULENBQWtCQyxJQUFsQixFQUF5QztBQUNyQyxTQUFPQSxJQUFJLEtBQUtSLFdBQVcsQ0FBQ0csUUFBckIs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QUFDSCxLQUZXLEVBRVRDLElBRlMsQ0FFSixJQUZJLENBQVo7QUFHQVksSUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQWEsTUFBYjtBQUNIOztBQUVELFNBQU87QUFDSHlDLElBQUFBLEVBQUUsRUFBRUEsRUFBRSxDQUFDc0UsU0FBSCxFQUREO0FBRUhwRSxJQUFBQSxFQUFFLEVBQUVBLEVBQUUsQ0FBQ29FLFNBQUg7QUFGRCxHQUFQO0FBSUg7O2VBRWN4SCxJIiwic291cmNlc0NvbnRlbnQiOlsiLy9AZmxvd1xuXG5pbXBvcnQgeyBtYWtlRmllbGRUeXBlTmFtZSwgV3JpdGVyIH0gZnJvbSAndG9uLWxhYnMtZGV2LW9wcy9kaXN0L3NyYy9nZW4uanMnO1xuaW1wb3J0IHR5cGUgeyBTY2hlbWFEb2MsIFNjaGVtYU1lbWJlciwgU2NoZW1hVHlwZSwgVHlwZURlZiB9IGZyb20gJ3Rvbi1sYWJzLWRldi1vcHMvc3JjL3NjaGVtYS5qcyc7XG5pbXBvcnQgeyBwYXJzZVR5cGVEZWYgfSBmcm9tICd0b24tbGFicy1kZXYtb3BzL2Rpc3Qvc3JjL3NjaGVtYS5qcyc7XG5pbXBvcnQgdHlwZSB7VG9TdHJpbmdGb3JtYXR0ZXJUeXBlfSBmcm9tICcuL2RiLXNjaGVtYS10eXBlcyc7XG5cbmNvbnN0IERiVHlwZUNhdGVnb3J5ID0ge1xuICAgIHVucmVzb2x2ZWQ6ICd1bnJlc29sdmVkJyxcbiAgICBzY2FsYXI6ICdzY2FsYXInLFxuICAgIHVuaW9uOiAndW5pb24nLFxuICAgIHN0cnVjdDogJ3N0cnVjdCcsXG59O1xuXG50eXBlIERiSm9pbiA9IHtcbiAgICBjb2xsZWN0aW9uOiBzdHJpbmcsXG4gICAgb246IHN0cmluZyxcbiAgICByZWZPbjogc3RyaW5nLFxuICAgIHByZUNvbmRpdGlvbjogc3RyaW5nLFxufVxuXG50eXBlIERiVHlwZSA9IHtcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgZmllbGRzOiBEYkZpZWxkW10sXG4gICAgY2F0ZWdvcnk6ICd1bnJlc29sdmVkJyB8ICdzY2FsYXInIHwgJ3VuaW9uJyB8ICdzdHJ1Y3QnLFxuICAgIGNvbGxlY3Rpb24/OiBzdHJpbmcsXG4gICAgZG9jOiBzdHJpbmcsXG59XG5cbnR5cGUgSW50RW51bURlZiA9IHtcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgdmFsdWVzOiB7XG4gICAgICAgIFtzdHJpbmddOiBudW1iZXJcbiAgICB9LFxufVxuXG50eXBlIERiRmllbGQgPSB7XG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHR5cGU6IERiVHlwZSxcbiAgICBhcnJheURlcHRoOiBudW1iZXIsXG4gICAgam9pbj86IERiSm9pbixcbiAgICBlbnVtRGVmPzogSW50RW51bURlZixcbiAgICBmb3JtYXR0ZXI/OiBUb1N0cmluZ0Zvcm1hdHRlclR5cGUsXG4gICAgZG9jOiBzdHJpbmcsXG59XG5cbmZ1bmN0aW9uIHNjYWxhclR5cGUobmFtZTogc3RyaW5nKTogRGJUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBuYW1lLFxuICAgICAgICBjYXRlZ29yeTogRGJUeXBlQ2F0ZWdvcnkuc2NhbGFyLFxuICAgICAgICBmaWVsZHM6IFtdLFxuICAgICAgICBkb2M6ICcnLFxuICAgIH1cbn1cblxuY29uc3Qgc2NhbGFyVHlwZXMgPSB7XG4gICAgaW50OiBzY2FsYXJUeXBlKCdJbnQnKSxcbiAgICB1aW50NjQ6IHNjYWxhclR5cGUoJ1N0cmluZycpLFxuICAgIHVpbnQxMDI0OiBzY2FsYXJUeXBlKCdTdHJpbmcnKSxcbiAgICBmbG9hdDogc2NhbGFyVHlwZSgnRmxvYXQnKSxcbiAgICBib29sZWFuOiBzY2FsYXJUeXBlKCdCb29sZWFuJyksXG4gICAgc3RyaW5nOiBzY2FsYXJUeXBlKCdTdHJpbmcnKSxcbn07XG5cbmZ1bmN0aW9uIGlzQmlnSW50KHR5cGU6IERiVHlwZSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0eXBlID09PSBzY2FsYXJUeXBlcy51aW50MTAyNCB8fCB0eXBlID09PSBzY2FsYXJUeXBlcy51aW50NjQ7XG59XG5cbmZ1bmN0aW9uIHVucmVzb2x2ZWRUeXBlKG5hbWU6IHN0cmluZyk6IERiVHlwZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgbmFtZSxcbiAgICAgICAgY2F0ZWdvcnk6IERiVHlwZUNhdGVnb3J5LnVucmVzb2x2ZWQsXG4gICAgICAgIGZpZWxkczogW10sXG4gICAgICAgIGRvYzogJycsXG4gICAgfVxufVxuXG5mdW5jdGlvbiBpc0xvd2VyQ2FzZWQoczogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgY29uc3QgbCA9IHMudG9Mb3dlckNhc2UoKTtcbiAgICBjb25zdCB1ID0gcy50b1VwcGVyQ2FzZSgpO1xuICAgIHJldHVybiAodSAhPT0gbCkgJiYgKHMgPT09IGwpO1xufVxuXG5mdW5jdGlvbiBpc1VwcGVyQ2FzZWQoczogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgY29uc3QgbCA9IHMudG9Mb3dlckNhc2UoKTtcbiAgICBjb25zdCB1ID0gcy50b1VwcGVyQ2FzZSgpO1xuICAgIHJldHVybiAodSAhPT0gbCkgJiYgKHMgPT09IHUpO1xufVxuXG5mdW5jdGlvbiB0b0FsbENhcHMoczogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBsZXQgcmVzdWx0ID0gJyc7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGlmICgoaSA+IDApICYmIChzW2kgLSAxXSAhPT0gJ18nKSAmJiBpc0xvd2VyQ2FzZWQoc1tpIC0gMV0pICYmIGlzVXBwZXJDYXNlZChzW2ldKSkge1xuICAgICAgICAgICAgcmVzdWx0ICs9ICdfJztcbiAgICAgICAgfVxuICAgICAgICByZXN1bHQgKz0gc1tpXTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdC50b1VwcGVyQ2FzZSgpO1xufVxuXG5mdW5jdGlvbiB0b0VudW1TdHlsZShzOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiBgJHtzLnN1YnN0cigwLCAxKS50b1VwcGVyQ2FzZSgpfSR7cy5zdWJzdHIoMSl9YDtcbn1cblxuZnVuY3Rpb24gc3RyaW5naWZ5RW51bVZhbHVlcyh2YWx1ZXM6IHsgW3N0cmluZ106IG51bWJlciB9KTogc3RyaW5nIHtcbiAgICBjb25zdCBmaWVsZHMgPSBPYmplY3QuZW50cmllcyh2YWx1ZXMpLm1hcCgoW25hbWUsIHZhbHVlXSkgPT4ge1xuICAgICAgICByZXR1cm4gYCR7dG9FbnVtU3R5bGUobmFtZSl9OiAkeyh2YWx1ZTogYW55KX1gO1xuICAgIH0pO1xuICAgIHJldHVybiBgeyAke2ZpZWxkcy5qb2luKCcsICcpfSB9YDtcbn1cblxuZnVuY3Rpb24gZ2V0RG9jTUQoc2NoZW1hOiBTY2hlbWFEb2MpOiBzdHJpbmcge1xuICAgIGNvbnN0IGRvYyA9IHNjaGVtYS5kb2M7XG4gICAgaWYgKCFkb2MpIHtcbiAgICAgICAgcmV0dXJuICcnO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGRvYyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgcmV0dXJuIGRvYztcbiAgICB9XG4gICAgaWYgKGRvYy5tZCkge1xuICAgICAgICByZXR1cm4gKGRvYy5tZDogYW55KTtcbiAgICB9XG4gICAgcmV0dXJuICcnO1xufVxuXG5mdW5jdGlvbiBtYWluKHNjaGVtYURlZjogVHlwZURlZikge1xuXG4gICAgbGV0IGRiVHlwZXM6IERiVHlwZVtdID0gW107XG4gICAgbGV0IGxhc3RSZXBvcnRlZFR5cGU6IHN0cmluZyA9ICcnO1xuICAgIGxldCBlbnVtVHlwZXM6IE1hcDxzdHJpbmcsIEludEVudW1EZWY+ID0gbmV3IE1hcCgpO1xuXG4gICAgZnVuY3Rpb24gcmVwb3J0VHlwZShuYW1lOiBzdHJpbmcsIGZpZWxkOiBzdHJpbmcsIHR5cGU6IHN0cmluZykge1xuICAgICAgICBpZiAobmFtZSAhPT0gbGFzdFJlcG9ydGVkVHlwZSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2cobmFtZSk7XG4gICAgICAgICAgICBsYXN0UmVwb3J0ZWRUeXBlID0gbmFtZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmxvZyhgICAgICR7ZmllbGR9OiAke3R5cGV9YCk7XG5cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZURiRmllbGQoXG4gICAgICAgIHR5cGVOYW1lOiBzdHJpbmcsXG4gICAgICAgIHNjaGVtYUZpZWxkOiBTY2hlbWFNZW1iZXI8U2NoZW1hVHlwZT4sXG4gICAgKTogRGJGaWVsZCB7XG4gICAgICAgIGxldCBzY2hlbWFUeXBlID0gc2NoZW1hRmllbGQ7XG4gICAgICAgIGNvbnN0IGZpZWxkOiBEYkZpZWxkID0ge1xuICAgICAgICAgICAgbmFtZTogc2NoZW1hRmllbGQubmFtZSxcbiAgICAgICAgICAgIGFycmF5RGVwdGg6IDAsXG4gICAgICAgICAgICB0eXBlOiBzY2FsYXJUeXBlcy5zdHJpbmcsXG4gICAgICAgICAgICBkb2M6IGdldERvY01EKHNjaGVtYUZpZWxkKSxcbiAgICAgICAgfTtcbiAgICAgICAgd2hpbGUgKHNjaGVtYVR5cGUuYXJyYXkpIHtcbiAgICAgICAgICAgIGZpZWxkLmFycmF5RGVwdGggKz0gMTtcbiAgICAgICAgICAgIHNjaGVtYVR5cGUgPSBzY2hlbWFUeXBlLmFycmF5O1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGV4ID0gKHNjaGVtYVR5cGU6IGFueSkuXztcbiAgICAgICAgY29uc3QgZW51bURlZjogP0ludEVudW1EZWYgPSAoZXggJiYgZXguZW51bSkgfHwgbnVsbDtcbiAgICAgICAgaWYgKGVudW1EZWYpIHtcbiAgICAgICAgICAgIGZpZWxkLmVudW1EZWYgPSBlbnVtRGVmO1xuICAgICAgICAgICAgZW51bVR5cGVzLnNldChlbnVtRGVmLm5hbWUsIGVudW1EZWYpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGpvaW4gPSBleCAmJiBleC5qb2luO1xuICAgICAgICBpZiAoam9pbikge1xuICAgICAgICAgICAgZmllbGQuam9pbiA9IGpvaW47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGV4ICYmIGV4LmZvcm1hdHRlcikge1xuICAgICAgICAgICAgZmllbGQuZm9ybWF0dGVyID0gZXguZm9ybWF0dGVyO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzY2hlbWFUeXBlLnVuaW9uIHx8IHNjaGVtYVR5cGUuc3RydWN0KSB7XG4gICAgICAgICAgICBmaWVsZC50eXBlID0gdW5yZXNvbHZlZFR5cGUobWFrZUZpZWxkVHlwZU5hbWUodHlwZU5hbWUsIHNjaGVtYUZpZWxkLm5hbWUpKTtcbiAgICAgICAgfSBlbHNlIGlmIChzY2hlbWFUeXBlLnJlZikge1xuICAgICAgICAgICAgZmllbGQudHlwZSA9IHVucmVzb2x2ZWRUeXBlKHNjaGVtYVR5cGUucmVmLm5hbWUpO1xuICAgICAgICB9IGVsc2UgaWYgKHNjaGVtYVR5cGUuYm9vbCkge1xuICAgICAgICAgICAgZmllbGQudHlwZSA9IHNjYWxhclR5cGVzLmJvb2xlYW47XG4gICAgICAgIH0gZWxzZSBpZiAoc2NoZW1hVHlwZS5pbnQpIHtcbiAgICAgICAgICAgIGNvbnN0IHVuc2lnbmVkOiBib29sZWFuID0gKHNjaGVtYVR5cGUuaW50ICYmIHNjaGVtYVR5cGUuaW50LnVuc2lnbmVkKSB8fCBmYWxzZTtcbiAgICAgICAgICAgIGNvbnN0IHNpemU6IG51bWJlciA9IChzY2hlbWFUeXBlLmludCAmJiBzY2hlbWFUeXBlLmludC5zaXplKSB8fCAzMjtcbiAgICAgICAgICAgIGlmICh1bnNpZ25lZCkge1xuICAgICAgICAgICAgICAgIGlmIChzaXplID49IDEyOCkge1xuICAgICAgICAgICAgICAgICAgICByZXBvcnRUeXBlKHR5cGVOYW1lLCBmaWVsZC5uYW1lLCAndTEwMjQnKTtcbiAgICAgICAgICAgICAgICAgICAgZmllbGQudHlwZSA9IHNjYWxhclR5cGVzLnVpbnQxMDI0O1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc2l6ZSA+PSA2NCkge1xuICAgICAgICAgICAgICAgICAgICByZXBvcnRUeXBlKHR5cGVOYW1lLCBmaWVsZC5uYW1lLCAndTY0Jyk7XG4gICAgICAgICAgICAgICAgICAgIGZpZWxkLnR5cGUgPSBzY2FsYXJUeXBlcy51aW50NjQ7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzaXplID49IDMyKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcG9ydFR5cGUodHlwZU5hbWUsIGZpZWxkLm5hbWUsICd1MzInKTtcbiAgICAgICAgICAgICAgICAgICAgZmllbGQudHlwZSA9IHNjYWxhclR5cGVzLmZsb2F0O1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcG9ydFR5cGUodHlwZU5hbWUsIGZpZWxkLm5hbWUsIGB1JHtzaXplfWApO1xuICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlID0gc2NhbGFyVHlwZXMuaW50O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKHNpemUgPiAzMikge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludGVnZXIgdHlwZSB3aXRoIHNpemUgJHtzaXplfSBiaXQgZG9lcyBub3Qgc3VwcG9ydGVkYCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVwb3J0VHlwZSh0eXBlTmFtZSwgZmllbGQubmFtZSwgJ2kzMicpO1xuICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlID0gc2NhbGFyVHlwZXMuaW50O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChzY2hlbWFUeXBlLmZsb2F0KSB7XG4gICAgICAgICAgICByZXBvcnRUeXBlKHR5cGVOYW1lLCBmaWVsZC5uYW1lLCAnZmxvYXQnKTtcbiAgICAgICAgICAgIGZpZWxkLnR5cGUgPSBzY2FsYXJUeXBlcy5mbG9hdDtcbiAgICAgICAgfSBlbHNlIGlmIChzY2hlbWFUeXBlLnN0cmluZykge1xuICAgICAgICAgICAgZmllbGQudHlwZSA9IHNjYWxhclR5cGVzLnN0cmluZztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZpZWxkLnR5cGUgPSBzY2FsYXJUeXBlcy5zdHJpbmc7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnSW52YWxpZCBmaWVsZCB0eXBlOiAnLCBKU09OLnN0cmluZ2lmeShzY2hlbWFUeXBlKSk7XG4gICAgICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZpZWxkO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHVud3JhcEFycmF5cyh0eXBlOiBTY2hlbWFUeXBlKTogU2NoZW1hVHlwZSB7XG4gICAgICAgIGlmICh0eXBlLmFycmF5KSB7XG4gICAgICAgICAgICByZXR1cm4gdW53cmFwQXJyYXlzKHR5cGUuYXJyYXkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0eXBlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlRGJUeXBlKFxuICAgICAgICBuYW1lOiBzdHJpbmcsXG4gICAgICAgIHNjaGVtYVR5cGU6IFNjaGVtYVR5cGVcbiAgICApIHtcbiAgICAgICAgY29uc3Qgc3RydWN0ID0gc2NoZW1hVHlwZS51bmlvbiB8fCBzY2hlbWFUeXBlLnN0cnVjdDtcbiAgICAgICAgaWYgKCFzdHJ1Y3QpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGA/PyAke25hbWV9OiAke0pTT04uc3RyaW5naWZ5KHNjaGVtYVR5cGUpLnN1YnN0cigwLCAyMDApfWApO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHR5cGU6IERiVHlwZSA9IHtcbiAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICBjYXRlZ29yeTogc2NoZW1hVHlwZS51bmlvbiA/IERiVHlwZUNhdGVnb3J5LnVuaW9uIDogRGJUeXBlQ2F0ZWdvcnkuc3RydWN0LFxuICAgICAgICAgICAgZmllbGRzOiBbXSxcbiAgICAgICAgICAgIGNvbGxlY3Rpb246IChzY2hlbWFUeXBlOiBhbnkpLl8uY29sbGVjdGlvbixcbiAgICAgICAgICAgIGRvYzogZ2V0RG9jTUQoc2NoZW1hVHlwZSksXG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKHR5cGUuY29sbGVjdGlvbikge1xuICAgICAgICAgICAgdHlwZS5maWVsZHMucHVzaCh7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2lkJyxcbiAgICAgICAgICAgICAgICBhcnJheURlcHRoOiAwLFxuICAgICAgICAgICAgICAgIHR5cGU6IHNjYWxhclR5cGVzLnN0cmluZyxcbiAgICAgICAgICAgICAgICBkb2M6ICcnLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgc3RydWN0LmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICB0eXBlLmZpZWxkcy5wdXNoKHBhcnNlRGJGaWVsZChuYW1lLCBmaWVsZCkpO1xuICAgICAgICAgICAgY29uc3QgdW53cmFwcGVkID0gdW53cmFwQXJyYXlzKGZpZWxkKTtcbiAgICAgICAgICAgIGNvbnN0IG93blR5cGUgPSAodW53cmFwcGVkLnN0cnVjdCB8fCB1bndyYXBwZWQudW5pb24pID8gdW53cmFwcGVkIDogbnVsbDtcbiAgICAgICAgICAgIGlmIChvd25UeXBlKSB7XG4gICAgICAgICAgICAgICAgcGFyc2VEYlR5cGUobWFrZUZpZWxkVHlwZU5hbWUobmFtZSwgZmllbGQubmFtZSksIG93blR5cGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgZGJUeXBlcy5wdXNoKHR5cGUpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlRGJUeXBlcyh0eXBlczogU2NoZW1hTWVtYmVyPFNjaGVtYVR5cGU+W10pIHtcbiAgICAgICAgdHlwZXMuZm9yRWFjaCgodHlwZTogU2NoZW1hTWVtYmVyPFNjaGVtYVR5cGU+KSA9PiB7XG4gICAgICAgICAgICBwYXJzZURiVHlwZSh0eXBlLm5hbWUsIHR5cGUpO1xuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgdW5yZXNvbHZlZDogTWFwPHN0cmluZywgRGJUeXBlPiA9IG5ldyBNYXA8c3RyaW5nLCBEYlR5cGU+KCk7XG4gICAgICAgIGNvbnN0IHJlc29sdmluZzogU2V0PHN0cmluZz4gPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICAgICAgY29uc3QgcmVzb2x2ZWQ6IE1hcDxzdHJpbmcsIERiVHlwZT4gPSBuZXcgTWFwPHN0cmluZywgRGJUeXBlPigpO1xuICAgICAgICBjb25zdCBvcmRlcmVkUmVzb2x2ZWQ6IERiVHlwZVtdID0gW107XG4gICAgICAgIGRiVHlwZXMuZm9yRWFjaCh0ID0+IHVucmVzb2x2ZWQuc2V0KHQubmFtZSwgdCkpO1xuICAgICAgICBjb25zdCByZXNvbHZlVHlwZSA9ICh0eXBlOiBEYlR5cGUpID0+IHtcbiAgICAgICAgICAgIGlmIChyZXNvbHZlZC5oYXModHlwZS5uYW1lKSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChyZXNvbHZpbmcuaGFzKHR5cGUubmFtZSkpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgV0FSTklORzogQ2lyY3VsYXIgcmVmZXJlbmNlIHRvIHR5cGUgJHt0eXBlLm5hbWV9YCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVzb2x2aW5nLmFkZCh0eXBlLm5hbWUpO1xuICAgICAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZmllbGQudHlwZS5jYXRlZ29yeSA9PT0gRGJUeXBlQ2F0ZWdvcnkudW5yZXNvbHZlZCkge1xuICAgICAgICAgICAgICAgICAgICBsZXQgdHlwZSA9IHJlc29sdmVkLmdldChmaWVsZC50eXBlLm5hbWUpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgPSB1bnJlc29sdmVkLmdldChmaWVsZC50eXBlLm5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlVHlwZSh0eXBlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFJlZmVyZW5jZWQgdHlwZSBub3QgZm91bmQ6ICR7ZmllbGQudHlwZS5uYW1lfWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZmllbGQudHlwZSA9IHR5cGU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJlc29sdmluZy5kZWxldGUodHlwZS5uYW1lKTtcbiAgICAgICAgICAgIG9yZGVyZWRSZXNvbHZlZC5wdXNoKHR5cGUpO1xuICAgICAgICAgICAgdW5yZXNvbHZlZC5kZWxldGUodHlwZS5uYW1lKTtcbiAgICAgICAgICAgIHJlc29sdmVkLnNldCh0eXBlLm5hbWUsIHR5cGUpO1xuICAgICAgICB9O1xuICAgICAgICBkYlR5cGVzLmZvckVhY2gocmVzb2x2ZVR5cGUpO1xuICAgICAgICBkYlR5cGVzID0gb3JkZXJlZFJlc29sdmVkO1xuICAgIH1cblxuLy8gR2VuZXJhdG9yc1xuXG4gICAgY29uc3QgcWwgPSBuZXcgV3JpdGVyKCk7XG4gICAgY29uc3QganMgPSBuZXcgV3JpdGVyKCk7XG5cbiAgICBmdW5jdGlvbiBnZW5RTERvYyhwcmVmaXg6IHN0cmluZywgZG9jOiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKGRvYy50cmltKCkgPT09ICcnKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbGluZXMgPSBkb2Muc3BsaXQoL1xcblxccj98XFxyXFxuPy8pO1xuICAgICAgICBpZiAobGluZXMubGVuZ3RoID09PSAxICYmICFsaW5lc1swXS5pbmNsdWRlcygnXCInKSkge1xuICAgICAgICAgICAgcWwud3JpdGVMbihwcmVmaXgsICdcIicsIGxpbmVzWzBdLCAnXCInKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHFsLndyaXRlTG4ocHJlZml4LCAnXCJcIlwiJyk7XG4gICAgICAgICAgICBsaW5lcy5mb3JFYWNoKChsaW5lKSA9PiB7XG4gICAgICAgICAgICAgICAgcWwud3JpdGVMbihwcmVmaXgsIGxpbmUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBxbC53cml0ZUxuKHByZWZpeCwgJ1wiXCJcIicpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdW5pb25WYXJpYW50VHlwZSh0eXBlOiBEYlR5cGUsIHZhcmlhbnQ6IERiRmllbGQpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gYCR7dHlwZS5uYW1lfSR7dmFyaWFudC5uYW1lfVZhcmlhbnRgO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlblFMVHlwZURlY2xhcmF0aW9uc0ZvclVuaW9uVmFyaWFudHModHlwZTogRGJUeXBlKSB7XG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKHZhcmlhbnQpID0+IHtcbiAgICAgICAgICAgIHFsLndyaXRlQmxvY2tMbihgXG4gICAgICAgIHR5cGUgJHt1bmlvblZhcmlhbnRUeXBlKHR5cGUsIHZhcmlhbnQpfSB7XG4gICAgICAgICAgICAke3ZhcmlhbnQubmFtZX06ICR7dmFyaWFudC50eXBlLm5hbWV9XG4gICAgICAgIH1cblxuICAgICAgICBgKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuUUxFbnVtVHlwZXMoKSB7XG4gICAgICAgIGZvciAoY29uc3QgZW51bURlZjogSW50RW51bURlZiBvZiBlbnVtVHlwZXMudmFsdWVzKCkpIHtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oYGVudW0gJHtlbnVtRGVmLm5hbWV9RW51bSB7YCk7XG4gICAgICAgICAgICBPYmplY3Qua2V5cyhlbnVtRGVmLnZhbHVlcykuZm9yRWFjaCgobmFtZSkgPT4ge1xuICAgICAgICAgICAgICAgIHFsLndyaXRlTG4oYCAgICAke3RvRW51bVN0eWxlKG5hbWUpfWApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGB9YCk7XG4gICAgICAgICAgICBxbC53cml0ZUxuKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5RTFR5cGVEZWNsYXJhdGlvbih0eXBlOiBEYlR5cGUpIHtcbiAgICAgICAgaWYgKHR5cGUuY2F0ZWdvcnkgPT09IERiVHlwZUNhdGVnb3J5LnVuaW9uKSB7XG4gICAgICAgICAgICBnZW5RTFR5cGVEZWNsYXJhdGlvbnNGb3JVbmlvblZhcmlhbnRzKHR5cGUpO1xuICAgICAgICAgICAgcWwud3JpdGVMbihgdW5pb24gJHt0eXBlLm5hbWV9ID0gYCk7XG4gICAgICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKHZhcmlhbnQgPT4ge1xuICAgICAgICAgICAgICAgIHFsLndyaXRlTG4oYFxcdHwgJHt1bmlvblZhcmlhbnRUeXBlKHR5cGUsIHZhcmlhbnQpfWApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBxbC53cml0ZUxuKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBnZW5RTERvYygnJywgdHlwZS5kb2MpO1xuICAgICAgICAgICAgcWwud3JpdGVMbihgdHlwZSAke3R5cGUubmFtZX0ge2ApO1xuICAgICAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaChmaWVsZCA9PiB7XG4gICAgICAgICAgICAgICAgZ2VuUUxEb2MoJ1xcdCcsIGZpZWxkLmRvYyk7XG4gICAgICAgICAgICAgICAgY29uc3QgdHlwZURlY2xhcmF0aW9uID1cbiAgICAgICAgICAgICAgICAgICAgJ1snLnJlcGVhdChmaWVsZC5hcnJheURlcHRoKSArXG4gICAgICAgICAgICAgICAgICAgIGZpZWxkLnR5cGUubmFtZSArXG4gICAgICAgICAgICAgICAgICAgICddJy5yZXBlYXQoZmllbGQuYXJyYXlEZXB0aCk7XG4gICAgICAgICAgICAgICAgbGV0IHBhcmFtcyA9ICcnO1xuICAgICAgICAgICAgICAgIGlmIChpc0JpZ0ludChmaWVsZC50eXBlKSkge1xuICAgICAgICAgICAgICAgICAgICBwYXJhbXMgPSAnKGZvcm1hdDogQmlnSW50Rm9ybWF0KSc7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC5qb2luKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhcmFtcyA9IGAodGltZW91dDogSW50LCB3aGVuOiAke3R5cGUubmFtZX1GaWx0ZXIpYDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBxbC53cml0ZUxuKGBcXHQke2ZpZWxkLm5hbWV9JHtwYXJhbXN9OiAke3R5cGVEZWNsYXJhdGlvbn1gKTtcbiAgICAgICAgICAgICAgICBjb25zdCBlbnVtRGVmID0gZmllbGQuZW51bURlZjtcbiAgICAgICAgICAgICAgICBpZiAoZW51bURlZikge1xuICAgICAgICAgICAgICAgICAgICBxbC53cml0ZUxuKGBcXHQke2ZpZWxkLm5hbWV9X25hbWU6ICR7ZW51bURlZi5uYW1lfUVudW1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGZpZWxkLmZvcm1hdHRlcikge1xuICAgICAgICAgICAgICAgICAgICBxbC53cml0ZUxuKGBcXHQke2ZpZWxkLm5hbWV9X3N0cmluZzogU3RyaW5nYCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGB9YCk7XG4gICAgICAgIH1cbiAgICAgICAgcWwud3JpdGVMbigpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHByZXZlbnRUd2ljZShuYW1lOiBzdHJpbmcsIG5hbWVzOiBTZXQ8c3RyaW5nPiwgd29yazogKCkgPT4gdm9pZCkge1xuICAgICAgICBpZiAoIW5hbWVzLmhhcyhuYW1lKSkge1xuICAgICAgICAgICAgbmFtZXMuYWRkKG5hbWUpO1xuICAgICAgICAgICAgd29yaygpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuUUxGaWx0ZXJzRm9yQXJyYXlGaWVsZHModHlwZTogRGJUeXBlLCBxbE5hbWVzOiBTZXQ8c3RyaW5nPikge1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgbGV0IGl0ZW1UeXBlTmFtZSA9IGZpZWxkLnR5cGUubmFtZTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZmllbGQuYXJyYXlEZXB0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmlsdGVyTmFtZSA9IGAke2l0ZW1UeXBlTmFtZX1BcnJheUZpbHRlcmA7XG4gICAgICAgICAgICAgICAgcHJldmVudFR3aWNlKGZpbHRlck5hbWUsIHFsTmFtZXMsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcWwud3JpdGVMbihgaW5wdXQgJHtmaWx0ZXJOYW1lfSB7YCk7XG4gICAgICAgICAgICAgICAgICAgIFsnYW55JywgJ2FsbCddLmZvckVhY2goKG9wKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBxbC53cml0ZUxuKGBcXHQke29wfTogJHtpdGVtVHlwZU5hbWV9RmlsdGVyYCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBxbC53cml0ZUxuKCd9Jyk7XG4gICAgICAgICAgICAgICAgICAgIHFsLndyaXRlTG4oKTtcblxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGl0ZW1UeXBlTmFtZSArPSAnQXJyYXknO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5RTEZpbHRlcnNGb3JFbnVtTmFtZUZpZWxkcyh0eXBlOiBEYlR5cGUsIHFsTmFtZXM6IFNldDxzdHJpbmc+KSB7XG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBlbnVtRGVmID0gZmllbGQuZW51bURlZjtcbiAgICAgICAgICAgIGlmIChlbnVtRGVmKSB7XG4gICAgICAgICAgICAgICAgcHJldmVudFR3aWNlKGAke2VudW1EZWYubmFtZX1FbnVtRmlsdGVyYCwgcWxOYW1lcywgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBnZW5RTFNjYWxhclR5cGVzRmlsdGVyKGAke2VudW1EZWYubmFtZX1FbnVtYCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlblFMRmlsdGVyKHR5cGU6IERiVHlwZSwgcWxOYW1lczogU2V0PHN0cmluZz4pIHtcbiAgICAgICAgaWYgKHR5cGUuZmllbGRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGdlblFMRmlsdGVyc0ZvckFycmF5RmllbGRzKHR5cGUsIHFsTmFtZXMpO1xuICAgICAgICBnZW5RTEZpbHRlcnNGb3JFbnVtTmFtZUZpZWxkcyh0eXBlLCBxbE5hbWVzKTtcbiAgICAgICAgZ2VuUUxEb2MoJycsIHR5cGUuZG9jKTtcbiAgICAgICAgcWwud3JpdGVMbihgaW5wdXQgJHt0eXBlLm5hbWV9RmlsdGVyIHtgKTtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGdlblFMRG9jKCdcXHQnLCBmaWVsZC5kb2MpO1xuICAgICAgICAgICAgY29uc3QgdHlwZURlY2xhcmF0aW9uID0gZmllbGQudHlwZS5uYW1lICsgXCJBcnJheVwiLnJlcGVhdChmaWVsZC5hcnJheURlcHRoKTtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oYFxcdCR7ZmllbGQubmFtZX06ICR7dHlwZURlY2xhcmF0aW9ufUZpbHRlcmApO1xuICAgICAgICAgICAgY29uc3QgZW51bURlZiA9IGZpZWxkLmVudW1EZWY7XG4gICAgICAgICAgICBpZiAoZW51bURlZikge1xuICAgICAgICAgICAgICAgIHFsLndyaXRlTG4oYFxcdCR7ZmllbGQubmFtZX1fbmFtZTogJHtlbnVtRGVmLm5hbWV9RW51bUZpbHRlcmApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcWwud3JpdGVMbihgICAgIE9SOiAke3R5cGUubmFtZX1GaWx0ZXJgKTtcbiAgICAgICAgcWwud3JpdGVMbihgfWApO1xuICAgICAgICBxbC53cml0ZUxuKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuUUxTY2FsYXJUeXBlc0ZpbHRlcihuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgcWwud3JpdGVMbihgaW5wdXQgJHtuYW1lfUZpbHRlciB7YCk7XG4gICAgICAgIFsnZXEnLCAnbmUnLCAnZ3QnLCAnbHQnLCAnZ2UnLCAnbGUnXS5mb3JFYWNoKChvcCkgPT4ge1xuICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0JHtvcH06ICR7bmFtZX1gKTtcbiAgICAgICAgfSk7XG4gICAgICAgIFsnaW4nLCAnbm90SW4nXS5mb3JFYWNoKChvcCkgPT4ge1xuICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0JHtvcH06IFske25hbWV9XWApO1xuICAgICAgICB9KTtcbiAgICAgICAgcWwud3JpdGVMbignfScpO1xuICAgICAgICBxbC53cml0ZUxuKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuUUxRdWVyaWVzKHR5cGVzOiBEYlR5cGVbXSkge1xuICAgICAgICBxbC53cml0ZUJsb2NrTG4oYFxuICAgICAgICBcIlNwZWNpZnkgc29ydCBvcmRlciBkaXJlY3Rpb25cIlxuICAgICAgICBlbnVtIFF1ZXJ5T3JkZXJCeURpcmVjdGlvbiB7XG4gICAgICAgICAgICBcIkRvY3VtZW50cyB3aWxsIGJlIHNvcnRlZCBpbiBhc2NlbmRlZCBvcmRlciAoZS5nLiBmcm9tIEEgdG8gWilcIlxuICAgICAgICAgICAgQVNDXG4gICAgICAgICAgICBcIkRvY3VtZW50cyB3aWxsIGJlIHNvcnRlZCBpbiBkZXNjZW5kYW50IG9yZGVyIChlLmcuIGZyb20gWiB0byBBKVwiXG4gICAgICAgICAgICBERVNDXG4gICAgICAgIH1cblxuICAgICAgICBcbiAgICAgICAgXCJcIlwiXG4gICAgICAgIFNwZWNpZnkgaG93IHRvIHNvcnQgcmVzdWx0cy5cbiAgICAgICAgWW91IGNhbiBzb3J0IGRvY3VtZW50cyBpbiByZXN1bHQgc2V0IHVzaW5nIG1vcmUgdGhhbiBvbmUgZmllbGQuXG4gICAgICAgIFwiXCJcIlxuICAgICAgICBpbnB1dCBRdWVyeU9yZGVyQnkge1xuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgICBQYXRoIHRvIGZpZWxkIHdoaWNoIG11c3QgYmUgdXNlZCBhcyBhIHNvcnQgY3JpdGVyaWEuXG4gICAgICAgICAgICBJZiBmaWVsZCByZXNpZGVzIGRlZXAgaW4gc3RydWN0dXJlIHBhdGggaXRlbXMgbXVzdCBiZSBzZXBhcmF0ZWQgd2l0aCBkb3QgKGUuZy4gJ2Zvby5iYXIuYmF6JykuXG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICAgIHBhdGg6IFN0cmluZ1xuICAgICAgICAgICAgXCJTb3J0IG9yZGVyIGRpcmVjdGlvblwiXG4gICAgICAgICAgICBkaXJlY3Rpb246IFF1ZXJ5T3JkZXJCeURpcmVjdGlvblxuICAgICAgICB9XG5cbiAgICAgICAgdHlwZSBRdWVyeSB7XG4gICAgICAgIGApO1xuXG4gICAgICAgIHR5cGVzLmZvckVhY2goKHR5cGU6IERiVHlwZSkgPT4ge1xuICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0JHt0eXBlLmNvbGxlY3Rpb24gfHwgJyd9KGZpbHRlcjogJHt0eXBlLm5hbWV9RmlsdGVyLCBvcmRlckJ5OiBbUXVlcnlPcmRlckJ5XSwgbGltaXQ6IEludCwgdGltZW91dDogRmxvYXQsIGFjY2Vzc0tleTogU3RyaW5nLCBvcGVyYXRpb25JZDogU3RyaW5nKTogWyR7dHlwZS5uYW1lfV1gKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcWwud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgfVxuXG4gICAgICAgIGApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlblFMU3Vic2NyaXB0aW9ucyh0eXBlczogRGJUeXBlW10pIHtcbiAgICAgICAgcWwud3JpdGVMbigndHlwZSBTdWJzY3JpcHRpb24geycpO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGBcXHQke3R5cGUuY29sbGVjdGlvbiB8fCAnJ30oZmlsdGVyOiAke3R5cGUubmFtZX1GaWx0ZXIsIGFjY2Vzc0tleTogU3RyaW5nKTogJHt0eXBlLm5hbWV9YCk7XG4gICAgICAgIH0pO1xuICAgICAgICBxbC53cml0ZUxuKCd9Jyk7XG4gICAgfVxuXG5cbiAgICBmdW5jdGlvbiBnZXRTY2FsYXJSZXNvbHZlck5hbWUoZmllbGQ6IERiRmllbGQpOiBzdHJpbmcge1xuICAgICAgICBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDY0KSB7XG4gICAgICAgICAgICByZXR1cm4gJ2JpZ1VJbnQxJztcbiAgICAgICAgfVxuICAgICAgICBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDEwMjQpIHtcbiAgICAgICAgICAgIHJldHVybiAnYmlnVUludDInO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnc2NhbGFyJztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5KU0ZpbHRlcnNGb3JBcnJheUZpZWxkcyh0eXBlOiBEYlR5cGUsIGpzTmFtZXM6IFNldDxzdHJpbmc+KSB7XG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBsZXQgaXRlbVR5cGVOYW1lID0gZmllbGQudHlwZS5uYW1lO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmaWVsZC5hcnJheURlcHRoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWx0ZXJOYW1lID0gYCR7aXRlbVR5cGVOYW1lfUFycmF5YDtcbiAgICAgICAgICAgICAgICBwcmV2ZW50VHdpY2UoZmlsdGVyTmFtZSwganNOYW1lcywgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpdGVtUmVzb2x2ZXJOYW1lID0gKGkgPT09IDAgJiYgZmllbGQudHlwZS5jYXRlZ29yeSA9PT0gRGJUeXBlQ2F0ZWdvcnkuc2NhbGFyKVxuICAgICAgICAgICAgICAgICAgICAgICAgPyBnZXRTY2FsYXJSZXNvbHZlck5hbWUoZmllbGQpXG4gICAgICAgICAgICAgICAgICAgICAgICA6IGl0ZW1UeXBlTmFtZTtcbiAgICAgICAgICAgICAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgICAgICAgICBjb25zdCAke2ZpbHRlck5hbWV9ID0gYXJyYXkoKCkgPT4gJHtpdGVtUmVzb2x2ZXJOYW1lfSk7XG4gICAgICAgICAgICAgICAgYCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaXRlbVR5cGVOYW1lICs9ICdBcnJheSc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkpTU3RydWN0RmlsdGVyKHR5cGU6IERiVHlwZSkge1xuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBjb25zdCAke3R5cGUubmFtZX0gPSBzdHJ1Y3Qoe1xuICAgIGApO1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgbGV0IHR5cGVEZWNsYXJhdGlvbjogP3N0cmluZyA9IG51bGw7XG4gICAgICAgICAgICBjb25zdCBqb2luID0gZmllbGQuam9pbjtcbiAgICAgICAgICAgIGlmIChqb2luKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3VmZml4ID0gZmllbGQuYXJyYXlEZXB0aCA+IDAgPyAnQXJyYXknIDogJyc7XG4gICAgICAgICAgICAgICAgdHlwZURlY2xhcmF0aW9uID0gYGpvaW4ke3N1ZmZpeH0oJyR7am9pbi5vbn0nLCAnJHtqb2luLnJlZk9ufScsICcke2ZpZWxkLnR5cGUuY29sbGVjdGlvbiB8fCAnJ30nLCAoKSA9PiAke2ZpZWxkLnR5cGUubmFtZX0pYDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQuYXJyYXlEZXB0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB0eXBlRGVjbGFyYXRpb24gPVxuICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlLm5hbWUgK1xuICAgICAgICAgICAgICAgICAgICAnQXJyYXknLnJlcGVhdChmaWVsZC5hcnJheURlcHRoKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZS5jYXRlZ29yeSA9PT0gRGJUeXBlQ2F0ZWdvcnkuc2NhbGFyKSB7XG4gICAgICAgICAgICAgICAgdHlwZURlY2xhcmF0aW9uID0gZ2V0U2NhbGFyUmVzb2x2ZXJOYW1lKGZpZWxkKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZS5maWVsZHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHR5cGVEZWNsYXJhdGlvbiA9IGZpZWxkLnR5cGUubmFtZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0eXBlRGVjbGFyYXRpb24pIHtcbiAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgJHtmaWVsZC5uYW1lfTogJHt0eXBlRGVjbGFyYXRpb259LGApO1xuICAgICAgICAgICAgICAgIGNvbnN0IGVudW1EZWYgPSBmaWVsZC5lbnVtRGVmO1xuICAgICAgICAgICAgICAgIGlmIChlbnVtRGVmKSB7XG4gICAgICAgICAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAke2ZpZWxkLm5hbWV9X25hbWU6IGVudW1OYW1lKCcke2ZpZWxkLm5hbWV9JywgJHtzdHJpbmdpZnlFbnVtVmFsdWVzKGVudW1EZWYudmFsdWVzKX0pLGApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIH0ke3R5cGUuY29sbGVjdGlvbiA/ICcsIHRydWUnIDogJyd9KTtcblxuICAgIGApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkpTVW5pb25SZXNvbHZlcih0eXBlOiBEYlR5cGUpIHtcbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgY29uc3QgJHt0eXBlLm5hbWV9UmVzb2x2ZXIgPSB7XG4gICAgICAgICAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xuICAgICAgICBgKTtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgodmFyaWFudCkgPT4ge1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICBpZiAoJyR7dmFyaWFudC5uYW1lfScgaW4gb2JqKSB7YCk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICByZXR1cm4gJyR7dW5pb25WYXJpYW50VHlwZSh0eXBlLCB2YXJpYW50KX0nO2ApO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICB9YCk7XG4gICAgICAgIH0pO1xuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkpTRmlsdGVyKHR5cGU6IERiVHlwZSwganNOYW1lczogU2V0PHN0cmluZz4pIHtcbiAgICAgICAgaWYgKHR5cGUuZmllbGRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS51bmlvbikge1xuICAgICAgICAgICAgLy8gZ2VuSlNGaWx0ZXJzRm9yVW5pb25WYXJpYW50cyh0eXBlLCBqc05hbWVzKTtcbiAgICAgICAgfVxuICAgICAgICBnZW5KU0ZpbHRlcnNGb3JBcnJheUZpZWxkcyh0eXBlLCBqc05hbWVzKTtcbiAgICAgICAgZ2VuSlNTdHJ1Y3RGaWx0ZXIodHlwZSk7XG4gICAgICAgIGlmICh0eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS51bmlvbikge1xuICAgICAgICAgICAgZ2VuSlNVbmlvblJlc29sdmVyKHR5cGUpO1xuICAgICAgICB9XG5cblxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlIGN1c3RvbSByZXNvbHZlcnMgZm9yIHR5cGVzIHdpdGg6XG4gICAgICogLSBpZCBmaWVsZFxuICAgICAqIC0gam9pbiBmaWVsZHNcbiAgICAgKiAtIHU2NCBhbmQgaGlnaGVyIGZpZWxkc1xuICAgICAqIEBwYXJhbSB0eXBlXG4gICAgICovXG4gICAgZnVuY3Rpb24gZ2VuSlNDdXN0b21SZXNvbHZlcnModHlwZTogRGJUeXBlKSB7XG4gICAgICAgIGNvbnN0IGpvaW5GaWVsZHMgPSB0eXBlLmZpZWxkcy5maWx0ZXIoeCA9PiAhIXguam9pbik7XG4gICAgICAgIGNvbnN0IGJpZ1VJbnRGaWVsZHMgPSB0eXBlLmZpZWxkcy5maWx0ZXIoKHg6IERiRmllbGQpID0+IGlzQmlnSW50KHgudHlwZSkpO1xuICAgICAgICBjb25zdCBzdHJpbmdGb3JtYXR0ZWRGaWVsZHMgPSB0eXBlLmZpZWxkcy5maWx0ZXIoKHg6IERiRmllbGQpID0+IHguZm9ybWF0dGVyKTtcbiAgICAgICAgY29uc3QgZW51bUZpZWxkcyA9IHR5cGUuZmllbGRzLmZpbHRlcih4ID0+IHguZW51bURlZik7XG4gICAgICAgIGNvbnN0IGN1c3RvbVJlc29sdmVyUmVxdWlyZWQgPSB0eXBlLmNvbGxlY3Rpb25cbiAgICAgICAgICAgIHx8IGpvaW5GaWVsZHMubGVuZ3RoID4gMFxuICAgICAgICAgICAgfHwgYmlnVUludEZpZWxkcy5sZW5ndGggPiAwXG4gICAgICAgICAgICB8fCBlbnVtRmllbGRzLmxlbmd0aCA+IDA7XG4gICAgICAgIGlmICghY3VzdG9tUmVzb2x2ZXJSZXF1aXJlZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgJHt0eXBlLm5hbWV9OiB7YCk7XG4gICAgICAgIGlmICh0eXBlLmNvbGxlY3Rpb24pIHtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oJyAgICAgICAgICAgIGlkKHBhcmVudCkgeycpO1xuICAgICAgICAgICAganMud3JpdGVMbignICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTsnKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oJyAgICAgICAgICAgIH0sJyk7XG4gICAgICAgIH1cbiAgICAgICAgam9pbkZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgY29uc3Qgam9pbiA9IGZpZWxkLmpvaW47XG4gICAgICAgICAgICBpZiAoIWpvaW4pIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBvbkZpZWxkID0gdHlwZS5maWVsZHMuZmluZCh4ID0+IHgubmFtZSA9PT0gam9pbi5vbik7XG4gICAgICAgICAgICBpZiAoIW9uRmllbGQpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyAnSm9pbiBvbiBmaWVsZCBkb2VzIG5vdCBleGlzdC4nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3Qgb24gPSBqb2luLm9uID09PSAnaWQnID8gJ19rZXknIDogKGpvaW4ub24gfHwgJ19rZXknKTtcbiAgICAgICAgICAgIGNvbnN0IHJlZk9uID0gam9pbi5yZWZPbiA9PT0gJ2lkJyA/ICdfa2V5JyA6IChqb2luLnJlZk9uIHx8ICdfa2V5Jyk7XG4gICAgICAgICAgICBjb25zdCBjb2xsZWN0aW9uID0gZmllbGQudHlwZS5jb2xsZWN0aW9uO1xuICAgICAgICAgICAgaWYgKCFjb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgJ0pvaW5lZCB0eXBlIGlzIG5vdCBhIGNvbGxlY3Rpb24uJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICR7ZmllbGQubmFtZX0ocGFyZW50LCBhcmdzLCBjb250ZXh0KSB7YCk7XG4gICAgICAgICAgICBpZiAoam9pbi5wcmVDb25kaXRpb24pIHtcbiAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAgICAgaWYgKCEoJHtqb2luLnByZUNvbmRpdGlvbn0pKSB7YCk7XG4gICAgICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtgKTtcbiAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAgICAgfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgICAgIGlmIChhcmdzLndoZW4gJiYgISR7dHlwZS5uYW1lfS50ZXN0KG51bGwsIHBhcmVudCwgYXJncy53aGVuKSkge2ApO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtgKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICAgICB9YCk7XG5cbiAgICAgICAgICAgIGlmIChmaWVsZC5hcnJheURlcHRoID09PSAwKSB7XG4gICAgICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgICAgIHJldHVybiBjb250ZXh0LmRiLiR7Y29sbGVjdGlvbn0ud2FpdEZvckRvYyhwYXJlbnQuJHtvbn0sICcke3JlZk9ufScsIGFyZ3MpO2ApO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC5hcnJheURlcHRoID09PSAxKSB7XG4gICAgICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgICAgIHJldHVybiBjb250ZXh0LmRiLiR7Y29sbGVjdGlvbn0ud2FpdEZvckRvY3MocGFyZW50LiR7b259LCAnJHtyZWZPbn0nLCBhcmdzKTtgKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgJ0pvaW5zIG9uIGEgbmVzdGVkIGFycmF5cyBkb2VzIG5vdCBzdXBwb3J0ZWQuJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgIH0sYCk7XG4gICAgICAgIH0pO1xuICAgICAgICBiaWdVSW50RmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwcmVmaXhMZW5ndGggPSBmaWVsZC50eXBlID09PSBzY2FsYXJUeXBlcy51aW50NjQgPyAxIDogMjtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICR7ZmllbGQubmFtZX0ocGFyZW50LCBhcmdzKSB7YCk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KCR7cHJlZml4TGVuZ3RofSwgcGFyZW50LiR7ZmllbGQubmFtZX0sIGFyZ3MpO2ApO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgfSxgKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHN0cmluZ0Zvcm1hdHRlZEZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgJHtmaWVsZC5uYW1lfV9zdHJpbmcocGFyZW50LCBhcmdzKSB7YCk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAgICAgcmV0dXJuICR7ZmllbGQuZm9ybWF0dGVyIHx8ICcnfShwYXJlbnQuJHtmaWVsZC5uYW1lfSk7YCk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICB9LGApO1xuICAgICAgICB9KTtcbiAgICAgICAgZW51bUZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgZW51bURlZiA9IGZpZWxkLmVudW1EZWY7XG4gICAgICAgICAgICBpZiAoZW51bURlZikge1xuICAgICAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICR7ZmllbGQubmFtZX1fbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignJHtmaWVsZC5uYW1lfScsICR7c3RyaW5naWZ5RW51bVZhbHVlcyhlbnVtRGVmLnZhbHVlcyl9KSxgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgfSxgKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5KU1NjYWxhckZpZWxkcyh0eXBlOiBEYlR5cGUsIHBhcmVudFBhdGgsIHBhcmVudERvY1BhdGg6IHN0cmluZykge1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZDogRGJGaWVsZCkgPT4ge1xuICAgICAgICAgICAgaWYgKGZpZWxkLmpvaW4gfHwgZmllbGQuZW51bURlZikge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGRvY05hbWUgPSBmaWVsZC5uYW1lID09PSAnaWQnID8gJ19rZXknIDogZmllbGQubmFtZTtcbiAgICAgICAgICAgIGNvbnN0IHBhdGggPSBgJHtwYXJlbnRQYXRofS4ke2ZpZWxkLm5hbWV9YDtcbiAgICAgICAgICAgIGxldCBkb2NQYXRoID0gYCR7cGFyZW50RG9jUGF0aH0uJHtkb2NOYW1lfWA7XG4gICAgICAgICAgICBpZiAoZmllbGQuYXJyYXlEZXB0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBsZXQgc3VmZml4ID0gJ1sqXSc7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgZGVwdGggPSAxMDsgZGVwdGggPiAwOyBkZXB0aCAtPSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHMgPSBgWyR7JyonLnJlcGVhdChkZXB0aCl9XWA7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkb2NQYXRoLmluY2x1ZGVzKHMpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWZmaXggPSBgWyR7JyonLnJlcGVhdChkZXB0aCArIDEpfV1gO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZG9jUGF0aCA9IGAke2RvY1BhdGh9JHtzdWZmaXh9YDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN3aXRjaChmaWVsZC50eXBlLmNhdGVnb3J5KSB7XG4gICAgICAgICAgICBjYXNlIFwic2NhbGFyXCI6XG4gICAgICAgICAgICAgICAgbGV0IHR5cGVOYW1lO1xuICAgICAgICAgICAgICAgIGlmIChmaWVsZC50eXBlID09PSBzY2FsYXJUeXBlcy5ib29sZWFuKSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lID0gJ2Jvb2xlYW4nO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMuZmxvYXQpIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWUgPSAnbnVtYmVyJztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLmludCkge1xuICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZSA9ICdudW1iZXInO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDY0KSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lID0gJ3VpbnQ2NCc7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC50eXBlID09PSBzY2FsYXJUeXBlcy51aW50MTAyNCkge1xuICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZSA9ICd1aW50MTAyNCc7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWUgPSAnc3RyaW5nJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAganMud3JpdGVMbihgc2NhbGFyRmllbGRzLnNldCgnJHtwYXRofScsIHsgdHlwZTogJyR7dHlwZU5hbWV9JywgcGF0aDogJyR7ZG9jUGF0aH0nIH0pO2ApO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcInN0cnVjdFwiOlxuICAgICAgICAgICAgY2FzZSBcInVuaW9uXCI6XG4gICAgICAgICAgICAgICAgZ2VuSlNTY2FsYXJGaWVsZHMoZmllbGQudHlwZSwgcGF0aCwgZG9jUGF0aCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuXG4gICAgZnVuY3Rpb24gZ2VuSlNUeXBlUmVzb2x2ZXJzRm9yVW5pb24odHlwZTogRGJUeXBlKSB7XG4gICAgICAgIGlmICh0eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS51bmlvbikge1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAke3R5cGUubmFtZX06ICR7dHlwZS5uYW1lfVJlc29sdmVyLGApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuZXJhdGUodHlwZXM6IERiVHlwZVtdKSB7XG5cbiAgICAgICAgLy8gUUxcblxuICAgICAgICBxbC53cml0ZUJsb2NrTG4oYFxuICAgICAgICBcIlwiXCJcbiAgICAgICAgRHVlIHRvIEdyYXBoUUwgbGltaXRhdGlvbnMgYmlnIG51bWJlcnMgYXJlIHJldHVybmVkIGFzIGEgc3RyaW5nLlxuICAgICAgICBZb3UgY2FuIHNwZWNpZnkgZm9ybWF0IHVzZWQgdG8gc3RyaW5nIHJlcHJlc2VudGF0aW9uIGZvciBiaWcgaW50ZWdlcnMuXG4gICAgICAgIFwiXCJcIlxuICAgICAgICBlbnVtIEJpZ0ludEZvcm1hdCB7XG4gICAgICAgICAgICBcIiBIZXhhZGVjaW1hbCByZXByZXNlbnRhdGlvbiBzdGFydGVkIHdpdGggMHggKGRlZmF1bHQpIFwiXG4gICAgICAgICAgICBIRVhcbiAgICAgICAgICAgIFwiIERlY2ltYWwgcmVwcmVzZW50YXRpb24gXCJcbiAgICAgICAgICAgIERFQ1xuICAgICAgICB9XG4gICAgICAgIGApO1xuICAgICAgICBbJ1N0cmluZycsICdCb29sZWFuJywgJ0ludCcsICdGbG9hdCddLmZvckVhY2goZ2VuUUxTY2FsYXJUeXBlc0ZpbHRlcik7XG4gICAgICAgIGdlblFMRW51bVR5cGVzKCk7XG4gICAgICAgIHR5cGVzLmZvckVhY2godHlwZSA9PiBnZW5RTFR5cGVEZWNsYXJhdGlvbih0eXBlKSk7XG4gICAgICAgIGNvbnN0IHFsQXJyYXlGaWx0ZXJzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgICAgIHR5cGVzLmZvckVhY2godHlwZSA9PiBnZW5RTEZpbHRlcih0eXBlLCBxbEFycmF5RmlsdGVycykpO1xuXG4gICAgICAgIGNvbnN0IGNvbGxlY3Rpb25zID0gdHlwZXMuZmlsdGVyKHQgPT4gISF0LmNvbGxlY3Rpb24pO1xuICAgICAgICBnZW5RTFF1ZXJpZXMoY29sbGVjdGlvbnMpO1xuICAgICAgICBnZW5RTFN1YnNjcmlwdGlvbnMoY29sbGVjdGlvbnMpO1xuXG4gICAgICAgIC8vIEpTXG5cbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgY29uc3Qge1xuICAgICAgICAgICAgc2NhbGFyLFxuICAgICAgICAgICAgYmlnVUludDEsXG4gICAgICAgICAgICBiaWdVSW50MixcbiAgICAgICAgICAgIHJlc29sdmVCaWdVSW50LFxuICAgICAgICAgICAgc3RydWN0LFxuICAgICAgICAgICAgYXJyYXksXG4gICAgICAgICAgICBqb2luLFxuICAgICAgICAgICAgam9pbkFycmF5LFxuICAgICAgICAgICAgZW51bU5hbWUsXG4gICAgICAgICAgICBjcmVhdGVFbnVtTmFtZVJlc29sdmVyLFxuICAgICAgICAgICAgdW5peE1pbGxpc2Vjb25kc1RvU3RyaW5nLFxuICAgICAgICAgICAgdW5peFNlY29uZHNUb1N0cmluZyxcbiAgICAgICAgfSA9IHJlcXVpcmUoJy4vZGItdHlwZXMuanMnKTtcbiAgICAgICAgYCk7XG4gICAgICAgIGNvbnN0IGpzQXJyYXlGaWx0ZXJzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgICAgIHR5cGVzLmZvckVhY2godHlwZSA9PiBnZW5KU0ZpbHRlcih0eXBlLCBqc0FycmF5RmlsdGVycykpO1xuXG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIGZ1bmN0aW9uIGNyZWF0ZVJlc29sdmVycyhkYikge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgYCk7XG4gICAgICAgIHR5cGVzLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICAgICAgICAgIGdlbkpTQ3VzdG9tUmVzb2x2ZXJzKHR5cGUpO1xuICAgICAgICAgICAgZ2VuSlNUeXBlUmVzb2x2ZXJzRm9yVW5pb24odHlwZSk7XG4gICAgICAgIH0pO1xuICAgICAgICBqcy53cml0ZUxuKCcgICAgICAgIFF1ZXJ5OiB7Jyk7XG4gICAgICAgIGNvbGxlY3Rpb25zLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICR7dHlwZS5jb2xsZWN0aW9uIHx8ICcnfTogZGIuJHt0eXBlLmNvbGxlY3Rpb24gfHwgJyd9LnF1ZXJ5UmVzb2x2ZXIoKSxgKVxuICAgICAgICB9KTtcbiAgICAgICAganMud3JpdGVMbignICAgICAgICB9LCcpO1xuICAgICAgICBqcy53cml0ZUxuKCcgICAgICAgIFN1YnNjcmlwdGlvbjogeycpO1xuICAgICAgICBjb2xsZWN0aW9ucy5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAke3R5cGUuY29sbGVjdGlvbiB8fCAnJ306IGRiLiR7dHlwZS5jb2xsZWN0aW9uIHx8ICcnfS5zdWJzY3JpcHRpb25SZXNvbHZlcigpLGApXG4gICAgICAgIH0pO1xuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGApO1xuXG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIGNvbnN0IHNjYWxhckZpZWxkcyA9IG5ldyBNYXAoKTtcbiAgICAgICAgYCk7XG4gICAgICAgIGNvbGxlY3Rpb25zLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICAgICAgICAgIGdlbkpTU2NhbGFyRmllbGRzKHR5cGUsIHR5cGUuY29sbGVjdGlvbiB8fCAnJywgJ2RvYycpO1xuICAgICAgICB9KTtcblxuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAgICAgICAgIHNjYWxhckZpZWxkcyxcbiAgICAgICAgICAgIGNyZWF0ZVJlc29sdmVycyxcbiAgICAgICAgYCk7XG4gICAgICAgIHR5cGVzLmZvckVhY2godHlwZSA9PiBqcy53cml0ZUxuKGAgICAgJHt0eXBlLm5hbWV9LGApKTtcbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgfTtcbiAgICAgICAgYCk7XG4gICAgfVxuXG4gICAgY29uc3Qgc2NoZW1hID0gcGFyc2VUeXBlRGVmKHNjaGVtYURlZik7XG5cbiAgICBpZiAoc2NoZW1hLmNsYXNzKSB7XG4gICAgICAgIHBhcnNlRGJUeXBlcyhzY2hlbWEuY2xhc3MudHlwZXMpO1xuICAgICAgICBnZW5lcmF0ZShkYlR5cGVzKTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IGU6IEludEVudW1EZWYgb2YgZW51bVR5cGVzLnZhbHVlcygpKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBleHBvcnQgY29uc3QgUSR7ZS5uYW1lfSA9IHtgKTtcbiAgICAgICAgY29uc29sZS5sb2coT2JqZWN0LmVudHJpZXMoZS52YWx1ZXMpLm1hcCgoW25hbWUsIHZhbHVlXSkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGAgICAgJHtuYW1lfTogJHsodmFsdWU6IGFueSl9LGA7XG4gICAgICAgIH0pLmpvaW4oJ1xcbicpKTtcbiAgICAgICAgY29uc29sZS5sb2coYH07XFxuYCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcWw6IHFsLmdlbmVyYXRlZCgpLFxuICAgICAgICBqczoganMuZ2VuZXJhdGVkKCksXG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBtYWluO1xuIl19