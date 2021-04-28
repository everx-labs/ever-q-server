"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _gen = require("./gen.js");

var _dbSchemaTypes = require("../../server/schema/db-schema-types");

function compareFields(a, b) {
  if (a.name === "id") {
    return b.name === "id" ? 0 : -1;
  }

  if (b.name === "id") {
    return 1;
  }

  return a.name === b.name ? 0 : a.name < b.name ? -1 : 1;
}

function main(schemaDef) {
  const {
    types: dbTypes,
    enumTypes
  } = (0, _dbSchemaTypes.parseDbSchema)(schemaDef);
  dbTypes.forEach(dbType => {
    dbType.fields.sort(compareFields);
  }); // Generators

  const g = new _gen.Writer();
  const js = new _gen.Writer();

  function genGDoc(prefix, doc) {
    if (doc.trim() === '') {
      return;
    }

    const lines = doc.split(/\n\r?|\r\n?/);

    if (lines.length === 1 && !lines[0].includes('"')) {
      g.writeLn(prefix, '"', lines[0], '"');
    } else {
      g.writeLn(prefix, '"""');
      lines.forEach(line => {
        g.writeLn(prefix, line);
      });
      g.writeLn(prefix, '"""');
    }
  }

  function unionVariantType(type, variant) {
    return `${type.name}${variant.name}Variant`;
  }

  function genGTypeDeclarationsForUnionVariants(type) {
    type.fields.forEach(variant => {
      g.writeBlockLn(`
        type ${unionVariantType(type, variant)} {
            ${variant.name}: ${variant.type.name}
        }

        `);
    });
  }

  function genGEnumTypes() {
    for (const enumDef of enumTypes.values()) {
      g.writeLn(`enum ${enumDef.name}Enum {`);
      Object.keys(enumDef.values).forEach(name => {
        g.writeLn(`    ${(0, _dbSchemaTypes.toEnumStyle)(name)}`);
      });
      g.writeLn(`}`);
      g.writeLn();
    }
  }

  function genGTypeDeclaration(type) {
    if (type.category === _dbSchemaTypes.DbTypeCategory.union) {
      genGTypeDeclarationsForUnionVariants(type);
      g.writeLn(`union ${type.name} = `);
      type.fields.forEach(variant => {
        g.writeLn(`\t| ${unionVariantType(type, variant)}`);
      });
      g.writeLn();
    } else {
      genGDoc('', type.doc);
      g.writeLn(`type ${type.name} {`);
      type.fields.forEach(field => {
        genGDoc('\t', field.doc);
        const typeDeclaration = '['.repeat(field.arrayDepth) + field.type.name + ']'.repeat(field.arrayDepth);
        let params = '';

        if ((0, _dbSchemaTypes.isBigInt)(field.type)) {
          params = '(format: BigIntFormat)';
        } else if (field.join) {
          params = `(timeout: Int, when: ${type.name}Filter)`;
        }

        g.writeLn(`\t${field.name}${params}: ${typeDeclaration}`);
        const enumDef = field.enumDef;

        if (enumDef) {
          g.writeLn(`\t${field.name}_name: ${enumDef.name}Enum`);
        }

        if (field.formatter) {
          g.writeLn(`\t${field.name}_string: String`);
        }
      });
      g.writeLn(`}`);
    }

    g.writeLn();
  }

  function preventTwice(name, names, work) {
    if (!names.has(name)) {
      names.add(name);
      work();
    }
  }

  function genGFiltersForArrayFields(type, gNames) {
    type.fields.forEach(field => {
      let itemTypeName = field.type.name;

      for (let i = 0; i < field.arrayDepth; i += 1) {
        const filterName = `${itemTypeName}ArrayFilter`;
        preventTwice(filterName, gNames, () => {
          g.writeLn(`input ${filterName} {`);
          ['any', 'all'].forEach(op => {
            g.writeLn(`\t${op}: ${itemTypeName}Filter`);
          });
          g.writeLn('}');
          g.writeLn();
        });
        itemTypeName += 'Array';
      }
    });
  }

  function genGFiltersForEnumNameFields(type, gNames) {
    type.fields.forEach(field => {
      const enumDef = field.enumDef;

      if (enumDef) {
        preventTwice(`${enumDef.name}EnumFilter`, gNames, () => {
          genGScalarTypesFilter(`${enumDef.name}Enum`);
        });
      }
    });
  }

  function genGFilter(type, gNames) {
    if (type.fields.length === 0) {
      return;
    }

    genGFiltersForArrayFields(type, gNames);
    genGFiltersForEnumNameFields(type, gNames);
    genGDoc('', type.doc);
    g.writeLn(`input ${type.name}Filter {`);
    type.fields.forEach(field => {
      genGDoc('\t', field.doc);
      const typeDeclaration = field.type.name + "Array".repeat(field.arrayDepth);
      g.writeLn(`\t${field.name}: ${typeDeclaration}Filter`);
      const enumDef = field.enumDef;

      if (enumDef) {
        g.writeLn(`\t${field.name}_name: ${enumDef.name}EnumFilter`);
      }
    });
    g.writeLn(`    OR: ${type.name}Filter`);
    g.writeLn(`}`);
    g.writeLn();
  }

  function genGScalarTypesFilter(name) {
    g.writeLn(`input ${name}Filter {`);
    ['eq', 'ne', 'gt', 'lt', 'ge', 'le'].forEach(op => {
      g.writeLn(`\t${op}: ${name}`);
    });
    ['in', 'notIn'].forEach(op => {
      g.writeLn(`\t${op}: [${name}]`);
    });
    g.writeLn('}');
    g.writeLn();
  }

  function genGQueries(types) {
    g.writeBlockLn(`
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
      g.writeLn(`\t${type.collection || ''}(filter: ${type.name}Filter, orderBy: [QueryOrderBy], limit: Int, timeout: Float, accessKey: String, operationId: String): [${type.name}]`);
    });
    g.writeBlockLn(`
        }

        `);
  }

  function genGSubscriptions(types) {
    g.writeLn('type Subscription {');
    types.forEach(type => {
      g.writeLn(`\t${type.collection || ''}(filter: ${type.name}Filter, accessKey: String): ${type.name}`);
    });
    g.writeLn('}');
  }

  function getScalarResolverName(field) {
    if (field.type === _dbSchemaTypes.scalarTypes.uint64) {
      return 'bigUInt1';
    }

    if (field.type === _dbSchemaTypes.scalarTypes.uint1024) {
      return 'bigUInt2';
    }

    if (field.type === _dbSchemaTypes.scalarTypes.string && field.lowerFilter) {
      return 'stringLowerFilter';
    }

    return 'scalar';
  }

  function genJSFiltersForArrayFields(type, jsNames) {
    type.fields.forEach(field => {
      let itemTypeName = field.type.name;

      for (let i = 0; i < field.arrayDepth; i += 1) {
        const filterName = `${itemTypeName}Array`;
        preventTwice(filterName, jsNames, () => {
          const itemResolverName = i === 0 && field.type.category === _dbSchemaTypes.DbTypeCategory.scalar ? getScalarResolverName(field) : itemTypeName;
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
        const params = [`'${join.on}'`, `'${join.refOn}'`, `'${field.type.collection || ''}'`];

        if (field.arrayDepth === 0) {
          const extraFields = join.preCondition.split(" ").map(x => x.trim()).filter(x => x.startsWith("parent.")).map(x => x.substr(7));
          params.push(extraFields.length > 0 ? `['${extraFields.join("', '")}']` : "[]");
        }

        params.push(`() => ${field.type.name}`);
        typeDeclaration = `join${suffix}(${params.join(", ")})`;
      } else if (field.arrayDepth > 0) {
        typeDeclaration = field.type.name + 'Array'.repeat(field.arrayDepth);
      } else if (field.type.category === _dbSchemaTypes.DbTypeCategory.scalar) {
        typeDeclaration = getScalarResolverName(field);
      } else if (field.type.fields.length > 0) {
        typeDeclaration = field.type.name;
      }

      if (typeDeclaration) {
        js.writeLn(`    ${field.name}: ${typeDeclaration},`);
        const enumDef = field.enumDef;

        if (enumDef) {
          js.writeLn(`    ${field.name}_name: enumName('${field.name}', ${(0, _dbSchemaTypes.stringifyEnumValues)(enumDef.values)}),`);
        }

        if (field.formatter) {
          js.writeLn(`    ${field.name}_string: stringCompanion('${field.name}'),`);
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

    if (type.category === _dbSchemaTypes.DbTypeCategory.union) {// genJSFiltersForUnionVariants(type, jsNames);
    }

    genJSFiltersForArrayFields(type, jsNames);
    genJSStructFilter(type);

    if (type.category === _dbSchemaTypes.DbTypeCategory.union) {
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
    const bigUIntFields = type.fields.filter(x => (0, _dbSchemaTypes.isBigInt)(x.type));
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
        js.writeLn(`                return context.data.${collection}.waitForDoc(parent.${on}, '${refOn}', args, context);`);
      } else if (field.arrayDepth === 1) {
        js.writeLn(`                return context.data.${collection}.waitForDocs(parent.${on}, '${refOn}', args, context);`);
      } else {
        throw 'Joins on a nested arrays does not supported.';
      }

      js.writeLn(`            },`);
    });
    bigUIntFields.forEach(field => {
      const prefixLength = field.type === _dbSchemaTypes.scalarTypes.uint64 ? 1 : 2;
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
        js.writeLn(`            ${field.name}_name: createEnumNameResolver('${field.name}', ${(0, _dbSchemaTypes.stringifyEnumValues)(enumDef.values)}),`);
      }
    });
    js.writeLn(`        },`);
  }

  function genJSScalarFields(type, parentPath, parentDocPath) {
    type.fields.forEach(field => {
      if (field.join || field.enumDef) {
        return;
      }

      const docName = type.collection && field.name === 'id' ? '_key' : field.name;
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

          if (field.type === _dbSchemaTypes.scalarTypes.boolean) {
            typeName = 'boolean';
          } else if (field.type === _dbSchemaTypes.scalarTypes.float) {
            typeName = 'number';
          } else if (field.type === _dbSchemaTypes.scalarTypes.int) {
            typeName = 'number';
          } else if (field.type === _dbSchemaTypes.scalarTypes.uint64) {
            typeName = 'uint64';
          } else if (field.type === _dbSchemaTypes.scalarTypes.uint1024) {
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
    if (type.category === _dbSchemaTypes.DbTypeCategory.union) {
      js.writeLn(`        ${type.name}: ${type.name}Resolver,`);
    }
  }

  function generate(types) {
    // G
    g.writeBlockLn(`
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
    ['String', 'Boolean', 'Int', 'Float'].forEach(genGScalarTypesFilter);
    genGEnumTypes();
    types.forEach(type => genGTypeDeclaration(type));
    const gArrayFilters = new Set();
    types.forEach(type => genGFilter(type, gArrayFilters));
    const collections = types.filter(t => !!t.collection);
    genGQueries(collections);
    genGSubscriptions(collections); // JS

    js.writeBlockLn(`
        const {
            scalar,
            bigUInt1,
            bigUInt2,
            stringLowerFilter,
            resolveBigUInt,
            struct,
            array,
            join,
            joinArray,
            enumName,
            stringCompanion,
            createEnumNameResolver,
            unixMillisecondsToString,
            unixSecondsToString,
        } = require('../filter/filters.js');
        `);
    const jsArrayFilters = new Set();
    types.forEach(type => genJSFilter(type, jsArrayFilters));
    js.writeBlockLn(`
        function createResolvers(data) {
            return {
        `);
    types.forEach(type => {
      genJSCustomResolvers(type);
      genJSTypeResolversForUnion(type);
    });
    js.writeLn('        Query: {');
    collections.forEach(type => {
      js.writeLn(`            ${type.collection || ''}: data.${type.collection || ''}.queryResolver(),`);
    });
    js.writeLn('        },');
    js.writeLn('        Subscription: {');
    collections.forEach(type => {
      js.writeLn(`            ${type.collection || ''}: data.${type.collection || ''}.subscriptionResolver(),`);
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

  generate(dbTypes);

  for (const e of enumTypes.values()) {
    console.log(`export const Q${e.name} = {`);
    console.log(Object.entries(e.values).map(([name, value]) => {
      return `    ${name}: ${value},`;
    }).join('\n'));
    console.log(`};\n`);
  }

  return {
    ql: g.generated(),
    js: js.generated()
  };
}

var _default = main;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9tYWludGFuYW5jZS9nZW4tZ3JhcGhxbC9xbC1qcy1nZW5lcmF0b3IuanMiXSwibmFtZXMiOlsiY29tcGFyZUZpZWxkcyIsImEiLCJiIiwibmFtZSIsIm1haW4iLCJzY2hlbWFEZWYiLCJ0eXBlcyIsImRiVHlwZXMiLCJlbnVtVHlwZXMiLCJmb3JFYWNoIiwiZGJUeXBlIiwiZmllbGRzIiwic29ydCIsImciLCJXcml0ZXIiLCJqcyIsImdlbkdEb2MiLCJwcmVmaXgiLCJkb2MiLCJ0cmltIiwibGluZXMiLCJzcGxpdCIsImxlbmd0aCIsImluY2x1ZGVzIiwid3JpdGVMbiIsImxpbmUiLCJ1bmlvblZhcmlhbnRUeXBlIiwidHlwZSIsInZhcmlhbnQiLCJnZW5HVHlwZURlY2xhcmF0aW9uc0ZvclVuaW9uVmFyaWFudHMiLCJ3cml0ZUJsb2NrTG4iLCJnZW5HRW51bVR5cGVzIiwiZW51bURlZiIsInZhbHVlcyIsIk9iamVjdCIsImtleXMiLCJnZW5HVHlwZURlY2xhcmF0aW9uIiwiY2F0ZWdvcnkiLCJEYlR5cGVDYXRlZ29yeSIsInVuaW9uIiwiZmllbGQiLCJ0eXBlRGVjbGFyYXRpb24iLCJyZXBlYXQiLCJhcnJheURlcHRoIiwicGFyYW1zIiwiam9pbiIsImZvcm1hdHRlciIsInByZXZlbnRUd2ljZSIsIm5hbWVzIiwid29yayIsImhhcyIsImFkZCIsImdlbkdGaWx0ZXJzRm9yQXJyYXlGaWVsZHMiLCJnTmFtZXMiLCJpdGVtVHlwZU5hbWUiLCJpIiwiZmlsdGVyTmFtZSIsIm9wIiwiZ2VuR0ZpbHRlcnNGb3JFbnVtTmFtZUZpZWxkcyIsImdlbkdTY2FsYXJUeXBlc0ZpbHRlciIsImdlbkdGaWx0ZXIiLCJnZW5HUXVlcmllcyIsImNvbGxlY3Rpb24iLCJnZW5HU3Vic2NyaXB0aW9ucyIsImdldFNjYWxhclJlc29sdmVyTmFtZSIsInNjYWxhclR5cGVzIiwidWludDY0IiwidWludDEwMjQiLCJzdHJpbmciLCJsb3dlckZpbHRlciIsImdlbkpTRmlsdGVyc0ZvckFycmF5RmllbGRzIiwianNOYW1lcyIsIml0ZW1SZXNvbHZlck5hbWUiLCJzY2FsYXIiLCJnZW5KU1N0cnVjdEZpbHRlciIsInN1ZmZpeCIsIm9uIiwicmVmT24iLCJleHRyYUZpZWxkcyIsInByZUNvbmRpdGlvbiIsIm1hcCIsIngiLCJmaWx0ZXIiLCJzdGFydHNXaXRoIiwic3Vic3RyIiwicHVzaCIsImdlbkpTVW5pb25SZXNvbHZlciIsImdlbkpTRmlsdGVyIiwiZ2VuSlNDdXN0b21SZXNvbHZlcnMiLCJqb2luRmllbGRzIiwiYmlnVUludEZpZWxkcyIsInN0cmluZ0Zvcm1hdHRlZEZpZWxkcyIsImVudW1GaWVsZHMiLCJjdXN0b21SZXNvbHZlclJlcXVpcmVkIiwib25GaWVsZCIsImZpbmQiLCJwcmVmaXhMZW5ndGgiLCJnZW5KU1NjYWxhckZpZWxkcyIsInBhcmVudFBhdGgiLCJwYXJlbnREb2NQYXRoIiwiZG9jTmFtZSIsInBhdGgiLCJkb2NQYXRoIiwiZGVwdGgiLCJzIiwidHlwZU5hbWUiLCJib29sZWFuIiwiZmxvYXQiLCJpbnQiLCJnZW5KU1R5cGVSZXNvbHZlcnNGb3JVbmlvbiIsImdlbmVyYXRlIiwiZ0FycmF5RmlsdGVycyIsIlNldCIsImNvbGxlY3Rpb25zIiwidCIsImpzQXJyYXlGaWx0ZXJzIiwiZSIsImNvbnNvbGUiLCJsb2ciLCJlbnRyaWVzIiwidmFsdWUiLCJxbCIsImdlbmVyYXRlZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUVBOztBQUdBOztBQVFBLFNBQVNBLGFBQVQsQ0FBdUJDLENBQXZCLEVBQW1DQyxDQUFuQyxFQUF1RDtBQUNuRCxNQUFJRCxDQUFDLENBQUNFLElBQUYsS0FBVyxJQUFmLEVBQXFCO0FBQ2pCLFdBQU9ELENBQUMsQ0FBQ0MsSUFBRixLQUFXLElBQVgsR0FBa0IsQ0FBbEIsR0FBc0IsQ0FBQyxDQUE5QjtBQUNIOztBQUNELE1BQUlELENBQUMsQ0FBQ0MsSUFBRixLQUFXLElBQWYsRUFBcUI7QUFDakIsV0FBTyxDQUFQO0FBQ0g7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SUEvQyxJQUFBQSxFQUFFLENBQUNlLFlBQUgsQ0FBaUI7QUFDekI7QUFDQTtBQUNBO0FBQ0EsU0FKUTtBQUtBeEIsSUFBQUEsS0FBSyxDQUFDRyxPQUFOLENBQWNrQixJQUFJLElBQUlaLEVBQUUsQ0FBQ1MsT0FBSCxDQUFZLE9BQU1HLElBQUksQ0FBQ3hCLElBQUssR0FBNUIsQ0FBdEI7QUFDQVksSUFBQUEsRUFBRSxDQUFDZSxZQUFILENBQWlCO0FBQ3pCO0FBQ0EsU0FGUTtBQUdIOztBQUVEZ0YsRUFBQUEsUUFBUSxDQUFDdkcsT0FBRCxDQUFSOztBQUVBLE9BQUssTUFBTTZHLENBQVgsSUFBNEI1RyxTQUFTLENBQUN5QixNQUFWLEVBQTVCLEVBQWdEO0FBQzVDb0YsSUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQWEsaUJBQWdCRixDQUFDLENBQUNqSCxJQUFLLE1BQXBDO0FBQ0FrSCxJQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWXBGLE1BQU0sQ0FBQ3FGLE9BQVAsQ0FBZUgsQ0FBQyxDQUFDbkYsTUFBakIsRUFBeUIrQyxHQUF6QixDQUE2QixDQUFDLENBQUM3RSxJQUFELEVBQU9xSCxLQUFQLENBQUQsS0FBbUI7QUFDeEQsYUFBUSxPQUFNckgsSUFBSyxLQUFLcUgsS0FBWSxHQUFwQztBQUNILEtBRlcsRUFFVDNFLElBRlMsQ0FFSixJQUZJLENBQVo7QUFHQXdFLElBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFhLE1BQWI7QUFDSDs7QUFFRCxTQUFPO0FBQ0hHLElBQUFBLEVBQUUsRUFBRTVHLENBQUMsQ0FBQzZHLFNBQUYsRUFERDtBQUVIM0csSUFBQUEsRUFBRSxFQUFFQSxFQUFFLENBQUMyRyxTQUFIO0FBRkQsR0FBUDtBQUlIOztlQUVjdEgsSSIsInNvdXJjZXNDb250ZW50IjpbIi8vQGZsb3dcblxuaW1wb3J0IHsgV3JpdGVyIH0gZnJvbSAnLi9nZW4uanMnO1xuaW1wb3J0IHR5cGUgeyBUeXBlRGVmIH0gZnJvbSAnLi4vLi4vc2VydmVyL3NjaGVtYS9zY2hlbWEuanMnO1xuaW1wb3J0IHR5cGUgeyBEYkZpZWxkLCBEYlR5cGUsIEludEVudW1EZWYgfSBmcm9tICcuLi8uLi9zZXJ2ZXIvc2NoZW1hL2RiLXNjaGVtYS10eXBlcyc7XG5pbXBvcnQge1xuICAgIERiVHlwZUNhdGVnb3J5LFxuICAgIGlzQmlnSW50LCBwYXJzZURiU2NoZW1hLFxuICAgIHNjYWxhclR5cGVzLFxuICAgIHN0cmluZ2lmeUVudW1WYWx1ZXMsXG4gICAgdG9FbnVtU3R5bGUsXG59IGZyb20gJy4uLy4uL3NlcnZlci9zY2hlbWEvZGItc2NoZW1hLXR5cGVzJztcblxuZnVuY3Rpb24gY29tcGFyZUZpZWxkcyhhOiBEYkZpZWxkLCBiOiBEYkZpZWxkKTogbnVtYmVyIHtcbiAgICBpZiAoYS5uYW1lID09PSBcImlkXCIpIHtcbiAgICAgICAgcmV0dXJuIGIubmFtZSA9PT0gXCJpZFwiID8gMCA6IC0xO1xuICAgIH1cbiAgICBpZiAoYi5uYW1lID09PSBcImlkXCIpIHtcbiAgICAgICAgcmV0dXJuIDE7XG4gICAgfVxuICAgIHJldHVybiAoYS5uYW1lID09PSBiLm5hbWUpID8gMCA6IChhLm5hbWUgPCBiLm5hbWUgPyAtMSA6IDEpO1xufVxuXG5mdW5jdGlvbiBtYWluKHNjaGVtYURlZjogVHlwZURlZikge1xuICAgIGNvbnN0IHsgdHlwZXM6IGRiVHlwZXMsIGVudW1UeXBlcyB9ID0gcGFyc2VEYlNjaGVtYShzY2hlbWFEZWYpO1xuICAgIGRiVHlwZXMuZm9yRWFjaCgoZGJUeXBlOiBEYlR5cGUpID0+IHtcbiAgICAgICAgZGJUeXBlLmZpZWxkcy5zb3J0KGNvbXBhcmVGaWVsZHMpO1xuICAgIH0pO1xuXG4vLyBHZW5lcmF0b3JzXG5cbiAgICBjb25zdCBnID0gbmV3IFdyaXRlcigpO1xuICAgIGNvbnN0IGpzID0gbmV3IFdyaXRlcigpO1xuXG4gICAgZnVuY3Rpb24gZ2VuR0RvYyhwcmVmaXg6IHN0cmluZywgZG9jOiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKGRvYy50cmltKCkgPT09ICcnKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbGluZXMgPSBkb2Muc3BsaXQoL1xcblxccj98XFxyXFxuPy8pO1xuICAgICAgICBpZiAobGluZXMubGVuZ3RoID09PSAxICYmICFsaW5lc1swXS5pbmNsdWRlcygnXCInKSkge1xuICAgICAgICAgICAgZy53cml0ZUxuKHByZWZpeCwgJ1wiJywgbGluZXNbMF0sICdcIicpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZy53cml0ZUxuKHByZWZpeCwgJ1wiXCJcIicpO1xuICAgICAgICAgICAgbGluZXMuZm9yRWFjaCgobGluZSkgPT4ge1xuICAgICAgICAgICAgICAgIGcud3JpdGVMbihwcmVmaXgsIGxpbmUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBnLndyaXRlTG4ocHJlZml4LCAnXCJcIlwiJyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiB1bmlvblZhcmlhbnRUeXBlKHR5cGU6IERiVHlwZSwgdmFyaWFudDogRGJGaWVsZCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiBgJHt0eXBlLm5hbWV9JHt2YXJpYW50Lm5hbWV9VmFyaWFudGA7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuR1R5cGVEZWNsYXJhdGlvbnNGb3JVbmlvblZhcmlhbnRzKHR5cGU6IERiVHlwZSkge1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKCh2YXJpYW50KSA9PiB7XG4gICAgICAgICAgICBnLndyaXRlQmxvY2tMbihgXG4gICAgICAgIHR5cGUgJHt1bmlvblZhcmlhbnRUeXBlKHR5cGUsIHZhcmlhbnQpfSB7XG4gICAgICAgICAgICAke3ZhcmlhbnQubmFtZX06ICR7dmFyaWFudC50eXBlLm5hbWV9XG4gICAgICAgIH1cblxuICAgICAgICBgKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuR0VudW1UeXBlcygpIHtcbiAgICAgICAgZm9yIChjb25zdCBlbnVtRGVmOiBJbnRFbnVtRGVmIG9mIGVudW1UeXBlcy52YWx1ZXMoKSkge1xuICAgICAgICAgICAgZy53cml0ZUxuKGBlbnVtICR7ZW51bURlZi5uYW1lfUVudW0ge2ApO1xuICAgICAgICAgICAgT2JqZWN0LmtleXMoZW51bURlZi52YWx1ZXMpLmZvckVhY2goKG5hbWUpID0+IHtcbiAgICAgICAgICAgICAgICBnLndyaXRlTG4oYCAgICAke3RvRW51bVN0eWxlKG5hbWUpfWApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBnLndyaXRlTG4oYH1gKTtcbiAgICAgICAgICAgIGcud3JpdGVMbigpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuR1R5cGVEZWNsYXJhdGlvbih0eXBlOiBEYlR5cGUpIHtcbiAgICAgICAgaWYgKHR5cGUuY2F0ZWdvcnkgPT09IERiVHlwZUNhdGVnb3J5LnVuaW9uKSB7XG4gICAgICAgICAgICBnZW5HVHlwZURlY2xhcmF0aW9uc0ZvclVuaW9uVmFyaWFudHModHlwZSk7XG4gICAgICAgICAgICBnLndyaXRlTG4oYHVuaW9uICR7dHlwZS5uYW1lfSA9IGApO1xuICAgICAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCh2YXJpYW50ID0+IHtcbiAgICAgICAgICAgICAgICBnLndyaXRlTG4oYFxcdHwgJHt1bmlvblZhcmlhbnRUeXBlKHR5cGUsIHZhcmlhbnQpfWApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBnLndyaXRlTG4oKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGdlbkdEb2MoJycsIHR5cGUuZG9jKTtcbiAgICAgICAgICAgIGcud3JpdGVMbihgdHlwZSAke3R5cGUubmFtZX0ge2ApO1xuICAgICAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaChmaWVsZCA9PiB7XG4gICAgICAgICAgICAgICAgZ2VuR0RvYygnXFx0JywgZmllbGQuZG9jKTtcbiAgICAgICAgICAgICAgICBjb25zdCB0eXBlRGVjbGFyYXRpb24gPVxuICAgICAgICAgICAgICAgICAgICAnWycucmVwZWF0KGZpZWxkLmFycmF5RGVwdGgpICtcbiAgICAgICAgICAgICAgICAgICAgZmllbGQudHlwZS5uYW1lICtcbiAgICAgICAgICAgICAgICAgICAgJ10nLnJlcGVhdChmaWVsZC5hcnJheURlcHRoKTtcbiAgICAgICAgICAgICAgICBsZXQgcGFyYW1zID0gJyc7XG4gICAgICAgICAgICAgICAgaWYgKGlzQmlnSW50KGZpZWxkLnR5cGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhcmFtcyA9ICcoZm9ybWF0OiBCaWdJbnRGb3JtYXQpJztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLmpvaW4pIHtcbiAgICAgICAgICAgICAgICAgICAgcGFyYW1zID0gYCh0aW1lb3V0OiBJbnQsIHdoZW46ICR7dHlwZS5uYW1lfUZpbHRlcilgO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGcud3JpdGVMbihgXFx0JHtmaWVsZC5uYW1lfSR7cGFyYW1zfTogJHt0eXBlRGVjbGFyYXRpb259YCk7XG4gICAgICAgICAgICAgICAgY29uc3QgZW51bURlZiA9IGZpZWxkLmVudW1EZWY7XG4gICAgICAgICAgICAgICAgaWYgKGVudW1EZWYpIHtcbiAgICAgICAgICAgICAgICAgICAgZy53cml0ZUxuKGBcXHQke2ZpZWxkLm5hbWV9X25hbWU6ICR7ZW51bURlZi5uYW1lfUVudW1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGZpZWxkLmZvcm1hdHRlcikge1xuICAgICAgICAgICAgICAgICAgICBnLndyaXRlTG4oYFxcdCR7ZmllbGQubmFtZX1fc3RyaW5nOiBTdHJpbmdgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGcud3JpdGVMbihgfWApO1xuICAgICAgICB9XG4gICAgICAgIGcud3JpdGVMbigpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHByZXZlbnRUd2ljZShuYW1lOiBzdHJpbmcsIG5hbWVzOiBTZXQ8c3RyaW5nPiwgd29yazogKCkgPT4gdm9pZCkge1xuICAgICAgICBpZiAoIW5hbWVzLmhhcyhuYW1lKSkge1xuICAgICAgICAgICAgbmFtZXMuYWRkKG5hbWUpO1xuICAgICAgICAgICAgd29yaygpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuR0ZpbHRlcnNGb3JBcnJheUZpZWxkcyh0eXBlOiBEYlR5cGUsIGdOYW1lczogU2V0PHN0cmluZz4pIHtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGxldCBpdGVtVHlwZU5hbWUgPSBmaWVsZC50eXBlLm5hbWU7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZpZWxkLmFycmF5RGVwdGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpbHRlck5hbWUgPSBgJHtpdGVtVHlwZU5hbWV9QXJyYXlGaWx0ZXJgO1xuICAgICAgICAgICAgICAgIHByZXZlbnRUd2ljZShmaWx0ZXJOYW1lLCBnTmFtZXMsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgZy53cml0ZUxuKGBpbnB1dCAke2ZpbHRlck5hbWV9IHtgKTtcbiAgICAgICAgICAgICAgICAgICAgWydhbnknLCAnYWxsJ10uZm9yRWFjaCgob3ApID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGcud3JpdGVMbihgXFx0JHtvcH06ICR7aXRlbVR5cGVOYW1lfUZpbHRlcmApO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgZy53cml0ZUxuKCd9Jyk7XG4gICAgICAgICAgICAgICAgICAgIGcud3JpdGVMbigpO1xuXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaXRlbVR5cGVOYW1lICs9ICdBcnJheSc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkdGaWx0ZXJzRm9yRW51bU5hbWVGaWVsZHModHlwZTogRGJUeXBlLCBnTmFtZXM6IFNldDxzdHJpbmc+KSB7XG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBlbnVtRGVmID0gZmllbGQuZW51bURlZjtcbiAgICAgICAgICAgIGlmIChlbnVtRGVmKSB7XG4gICAgICAgICAgICAgICAgcHJldmVudFR3aWNlKGAke2VudW1EZWYubmFtZX1FbnVtRmlsdGVyYCwgZ05hbWVzLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGdlbkdTY2FsYXJUeXBlc0ZpbHRlcihgJHtlbnVtRGVmLm5hbWV9RW51bWApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5HRmlsdGVyKHR5cGU6IERiVHlwZSwgZ05hbWVzOiBTZXQ8c3RyaW5nPikge1xuICAgICAgICBpZiAodHlwZS5maWVsZHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgZ2VuR0ZpbHRlcnNGb3JBcnJheUZpZWxkcyh0eXBlLCBnTmFtZXMpO1xuICAgICAgICBnZW5HRmlsdGVyc0ZvckVudW1OYW1lRmllbGRzKHR5cGUsIGdOYW1lcyk7XG4gICAgICAgIGdlbkdEb2MoJycsIHR5cGUuZG9jKTtcbiAgICAgICAgZy53cml0ZUxuKGBpbnB1dCAke3R5cGUubmFtZX1GaWx0ZXIge2ApO1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgZ2VuR0RvYygnXFx0JywgZmllbGQuZG9jKTtcbiAgICAgICAgICAgIGNvbnN0IHR5cGVEZWNsYXJhdGlvbiA9IGZpZWxkLnR5cGUubmFtZSArIFwiQXJyYXlcIi5yZXBlYXQoZmllbGQuYXJyYXlEZXB0aCk7XG4gICAgICAgICAgICBnLndyaXRlTG4oYFxcdCR7ZmllbGQubmFtZX06ICR7dHlwZURlY2xhcmF0aW9ufUZpbHRlcmApO1xuICAgICAgICAgICAgY29uc3QgZW51bURlZiA9IGZpZWxkLmVudW1EZWY7XG4gICAgICAgICAgICBpZiAoZW51bURlZikge1xuICAgICAgICAgICAgICAgIGcud3JpdGVMbihgXFx0JHtmaWVsZC5uYW1lfV9uYW1lOiAke2VudW1EZWYubmFtZX1FbnVtRmlsdGVyYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBnLndyaXRlTG4oYCAgICBPUjogJHt0eXBlLm5hbWV9RmlsdGVyYCk7XG4gICAgICAgIGcud3JpdGVMbihgfWApO1xuICAgICAgICBnLndyaXRlTG4oKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5HU2NhbGFyVHlwZXNGaWx0ZXIobmFtZTogc3RyaW5nKSB7XG4gICAgICAgIGcud3JpdGVMbihgaW5wdXQgJHtuYW1lfUZpbHRlciB7YCk7XG4gICAgICAgIFsnZXEnLCAnbmUnLCAnZ3QnLCAnbHQnLCAnZ2UnLCAnbGUnXS5mb3JFYWNoKChvcCkgPT4ge1xuICAgICAgICAgICAgZy53cml0ZUxuKGBcXHQke29wfTogJHtuYW1lfWApO1xuICAgICAgICB9KTtcbiAgICAgICAgWydpbicsICdub3RJbiddLmZvckVhY2goKG9wKSA9PiB7XG4gICAgICAgICAgICBnLndyaXRlTG4oYFxcdCR7b3B9OiBbJHtuYW1lfV1gKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGcud3JpdGVMbignfScpO1xuICAgICAgICBnLndyaXRlTG4oKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5HUXVlcmllcyh0eXBlczogRGJUeXBlW10pIHtcbiAgICAgICAgZy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBcIlNwZWNpZnkgc29ydCBvcmRlciBkaXJlY3Rpb25cIlxuICAgICAgICBlbnVtIFF1ZXJ5T3JkZXJCeURpcmVjdGlvbiB7XG4gICAgICAgICAgICBcIkRvY3VtZW50cyB3aWxsIGJlIHNvcnRlZCBpbiBhc2NlbmRlZCBvcmRlciAoZS5nLiBmcm9tIEEgdG8gWilcIlxuICAgICAgICAgICAgQVNDXG4gICAgICAgICAgICBcIkRvY3VtZW50cyB3aWxsIGJlIHNvcnRlZCBpbiBkZXNjZW5kYW50IG9yZGVyIChlLmcuIGZyb20gWiB0byBBKVwiXG4gICAgICAgICAgICBERVNDXG4gICAgICAgIH1cblxuICAgICAgICBcbiAgICAgICAgXCJcIlwiXG4gICAgICAgIFNwZWNpZnkgaG93IHRvIHNvcnQgcmVzdWx0cy5cbiAgICAgICAgWW91IGNhbiBzb3J0IGRvY3VtZW50cyBpbiByZXN1bHQgc2V0IHVzaW5nIG1vcmUgdGhhbiBvbmUgZmllbGQuXG4gICAgICAgIFwiXCJcIlxuICAgICAgICBpbnB1dCBRdWVyeU9yZGVyQnkge1xuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgICBQYXRoIHRvIGZpZWxkIHdoaWNoIG11c3QgYmUgdXNlZCBhcyBhIHNvcnQgY3JpdGVyaWEuXG4gICAgICAgICAgICBJZiBmaWVsZCByZXNpZGVzIGRlZXAgaW4gc3RydWN0dXJlIHBhdGggaXRlbXMgbXVzdCBiZSBzZXBhcmF0ZWQgd2l0aCBkb3QgKGUuZy4gJ2Zvby5iYXIuYmF6JykuXG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICAgIHBhdGg6IFN0cmluZ1xuICAgICAgICAgICAgXCJTb3J0IG9yZGVyIGRpcmVjdGlvblwiXG4gICAgICAgICAgICBkaXJlY3Rpb246IFF1ZXJ5T3JkZXJCeURpcmVjdGlvblxuICAgICAgICB9XG5cbiAgICAgICAgdHlwZSBRdWVyeSB7XG4gICAgICAgIGApO1xuXG4gICAgICAgIHR5cGVzLmZvckVhY2goKHR5cGU6IERiVHlwZSkgPT4ge1xuICAgICAgICAgICAgZy53cml0ZUxuKGBcXHQke3R5cGUuY29sbGVjdGlvbiB8fCAnJ30oZmlsdGVyOiAke3R5cGUubmFtZX1GaWx0ZXIsIG9yZGVyQnk6IFtRdWVyeU9yZGVyQnldLCBsaW1pdDogSW50LCB0aW1lb3V0OiBGbG9hdCwgYWNjZXNzS2V5OiBTdHJpbmcsIG9wZXJhdGlvbklkOiBTdHJpbmcpOiBbJHt0eXBlLm5hbWV9XWApO1xuICAgICAgICB9KTtcblxuICAgICAgICBnLndyaXRlQmxvY2tMbihgXG4gICAgICAgIH1cblxuICAgICAgICBgKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5HU3Vic2NyaXB0aW9ucyh0eXBlczogRGJUeXBlW10pIHtcbiAgICAgICAgZy53cml0ZUxuKCd0eXBlIFN1YnNjcmlwdGlvbiB7Jyk7XG4gICAgICAgIHR5cGVzLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICAgICAgICAgIGcud3JpdGVMbihgXFx0JHt0eXBlLmNvbGxlY3Rpb24gfHwgJyd9KGZpbHRlcjogJHt0eXBlLm5hbWV9RmlsdGVyLCBhY2Nlc3NLZXk6IFN0cmluZyk6ICR7dHlwZS5uYW1lfWApO1xuICAgICAgICB9KTtcbiAgICAgICAgZy53cml0ZUxuKCd9Jyk7XG4gICAgfVxuXG5cbiAgICBmdW5jdGlvbiBnZXRTY2FsYXJSZXNvbHZlck5hbWUoZmllbGQ6IERiRmllbGQpOiBzdHJpbmcge1xuICAgICAgICBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDY0KSB7XG4gICAgICAgICAgICByZXR1cm4gJ2JpZ1VJbnQxJztcbiAgICAgICAgfVxuICAgICAgICBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDEwMjQpIHtcbiAgICAgICAgICAgIHJldHVybiAnYmlnVUludDInO1xuICAgICAgICB9XG4gICAgICAgIGlmIChmaWVsZC50eXBlID09PSBzY2FsYXJUeXBlcy5zdHJpbmcgJiYgZmllbGQubG93ZXJGaWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiAnc3RyaW5nTG93ZXJGaWx0ZXInO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnc2NhbGFyJztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5KU0ZpbHRlcnNGb3JBcnJheUZpZWxkcyh0eXBlOiBEYlR5cGUsIGpzTmFtZXM6IFNldDxzdHJpbmc+KSB7XG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBsZXQgaXRlbVR5cGVOYW1lID0gZmllbGQudHlwZS5uYW1lO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmaWVsZC5hcnJheURlcHRoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWx0ZXJOYW1lID0gYCR7aXRlbVR5cGVOYW1lfUFycmF5YDtcbiAgICAgICAgICAgICAgICBwcmV2ZW50VHdpY2UoZmlsdGVyTmFtZSwganNOYW1lcywgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpdGVtUmVzb2x2ZXJOYW1lID0gKGkgPT09IDAgJiYgZmllbGQudHlwZS5jYXRlZ29yeSA9PT0gRGJUeXBlQ2F0ZWdvcnkuc2NhbGFyKVxuICAgICAgICAgICAgICAgICAgICAgICAgPyBnZXRTY2FsYXJSZXNvbHZlck5hbWUoZmllbGQpXG4gICAgICAgICAgICAgICAgICAgICAgICA6IGl0ZW1UeXBlTmFtZTtcbiAgICAgICAgICAgICAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgICAgICAgICBjb25zdCAke2ZpbHRlck5hbWV9ID0gYXJyYXkoKCkgPT4gJHtpdGVtUmVzb2x2ZXJOYW1lfSk7XG4gICAgICAgICAgICAgICAgYCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaXRlbVR5cGVOYW1lICs9ICdBcnJheSc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkpTU3RydWN0RmlsdGVyKHR5cGU6IERiVHlwZSkge1xuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBjb25zdCAke3R5cGUubmFtZX0gPSBzdHJ1Y3Qoe1xuICAgIGApO1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZDogRGJGaWVsZCkgPT4ge1xuICAgICAgICAgICAgbGV0IHR5cGVEZWNsYXJhdGlvbjogP3N0cmluZyA9IG51bGw7XG4gICAgICAgICAgICBjb25zdCBqb2luID0gZmllbGQuam9pbjtcbiAgICAgICAgICAgIGlmIChqb2luKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3VmZml4ID0gZmllbGQuYXJyYXlEZXB0aCA+IDAgPyAnQXJyYXknIDogJyc7XG4gICAgICAgICAgICAgICAgY29uc3QgcGFyYW1zID0gW1xuICAgICAgICAgICAgICAgICAgICBgJyR7am9pbi5vbn0nYCxcbiAgICAgICAgICAgICAgICAgICAgYCcke2pvaW4ucmVmT259J2AsXG4gICAgICAgICAgICAgICAgICAgIGAnJHtmaWVsZC50eXBlLmNvbGxlY3Rpb24gfHwgJyd9J2AsXG4gICAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgICAgICBpZiAoZmllbGQuYXJyYXlEZXB0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBleHRyYUZpZWxkcyA9IGpvaW4ucHJlQ29uZGl0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICAuc3BsaXQoXCIgXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAubWFwKHggPT4geC50cmltKCkpXG4gICAgICAgICAgICAgICAgICAgICAgICAuZmlsdGVyKHggPT4geC5zdGFydHNXaXRoKFwicGFyZW50LlwiKSlcbiAgICAgICAgICAgICAgICAgICAgICAgIC5tYXAoeCA9PiB4LnN1YnN0cig3KSk7XG4gICAgICAgICAgICAgICAgICAgIHBhcmFtcy5wdXNoKGV4dHJhRmllbGRzLmxlbmd0aCA+IDAgPyBgWycke2V4dHJhRmllbGRzLmpvaW4oXCInLCAnXCIpfSddYCA6IFwiW11cIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHBhcmFtcy5wdXNoKGAoKSA9PiAke2ZpZWxkLnR5cGUubmFtZX1gKTtcbiAgICAgICAgICAgICAgICB0eXBlRGVjbGFyYXRpb24gPSBgam9pbiR7c3VmZml4fSgke3BhcmFtcy5qb2luKFwiLCBcIil9KWA7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLmFycmF5RGVwdGggPiAwKSB7XG4gICAgICAgICAgICAgICAgdHlwZURlY2xhcmF0aW9uID1cbiAgICAgICAgICAgICAgICAgICAgZmllbGQudHlwZS5uYW1lICtcbiAgICAgICAgICAgICAgICAgICAgJ0FycmF5Jy5yZXBlYXQoZmllbGQuYXJyYXlEZXB0aCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLnR5cGUuY2F0ZWdvcnkgPT09IERiVHlwZUNhdGVnb3J5LnNjYWxhcikge1xuICAgICAgICAgICAgICAgIHR5cGVEZWNsYXJhdGlvbiA9IGdldFNjYWxhclJlc29sdmVyTmFtZShmaWVsZCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLnR5cGUuZmllbGRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB0eXBlRGVjbGFyYXRpb24gPSBmaWVsZC50eXBlLm5hbWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodHlwZURlY2xhcmF0aW9uKSB7XG4gICAgICAgICAgICAgICAganMud3JpdGVMbihgICAgICR7ZmllbGQubmFtZX06ICR7dHlwZURlY2xhcmF0aW9ufSxgKTtcbiAgICAgICAgICAgICAgICBjb25zdCBlbnVtRGVmID0gZmllbGQuZW51bURlZjtcbiAgICAgICAgICAgICAgICBpZiAoZW51bURlZikge1xuICAgICAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgJHtmaWVsZC5uYW1lfV9uYW1lOiBlbnVtTmFtZSgnJHtmaWVsZC5uYW1lfScsICR7c3RyaW5naWZ5RW51bVZhbHVlcyhlbnVtRGVmLnZhbHVlcyl9KSxgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGZpZWxkLmZvcm1hdHRlcikge1xuICAgICAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgJHtmaWVsZC5uYW1lfV9zdHJpbmc6IHN0cmluZ0NvbXBhbmlvbignJHtmaWVsZC5uYW1lfScpLGApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIH0ke3R5cGUuY29sbGVjdGlvbiA/ICcsIHRydWUnIDogJyd9KTtcblxuICAgIGApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkpTVW5pb25SZXNvbHZlcih0eXBlOiBEYlR5cGUpIHtcbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgY29uc3QgJHt0eXBlLm5hbWV9UmVzb2x2ZXIgPSB7XG4gICAgICAgICAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xuICAgICAgICBgKTtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgodmFyaWFudCkgPT4ge1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICBpZiAoJyR7dmFyaWFudC5uYW1lfScgaW4gb2JqKSB7YCk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICByZXR1cm4gJyR7dW5pb25WYXJpYW50VHlwZSh0eXBlLCB2YXJpYW50KX0nO2ApO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICB9YCk7XG4gICAgICAgIH0pO1xuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkpTRmlsdGVyKHR5cGU6IERiVHlwZSwganNOYW1lczogU2V0PHN0cmluZz4pIHtcbiAgICAgICAgaWYgKHR5cGUuZmllbGRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS51bmlvbikge1xuICAgICAgICAgICAgLy8gZ2VuSlNGaWx0ZXJzRm9yVW5pb25WYXJpYW50cyh0eXBlLCBqc05hbWVzKTtcbiAgICAgICAgfVxuICAgICAgICBnZW5KU0ZpbHRlcnNGb3JBcnJheUZpZWxkcyh0eXBlLCBqc05hbWVzKTtcbiAgICAgICAgZ2VuSlNTdHJ1Y3RGaWx0ZXIodHlwZSk7XG4gICAgICAgIGlmICh0eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS51bmlvbikge1xuICAgICAgICAgICAgZ2VuSlNVbmlvblJlc29sdmVyKHR5cGUpO1xuICAgICAgICB9XG5cblxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlIGN1c3RvbSByZXNvbHZlcnMgZm9yIHR5cGVzIHdpdGg6XG4gICAgICogLSBpZCBmaWVsZFxuICAgICAqIC0gam9pbiBmaWVsZHNcbiAgICAgKiAtIHU2NCBhbmQgaGlnaGVyIGZpZWxkc1xuICAgICAqIEBwYXJhbSB0eXBlXG4gICAgICovXG4gICAgZnVuY3Rpb24gZ2VuSlNDdXN0b21SZXNvbHZlcnModHlwZTogRGJUeXBlKSB7XG4gICAgICAgIGNvbnN0IGpvaW5GaWVsZHMgPSB0eXBlLmZpZWxkcy5maWx0ZXIoeCA9PiAhIXguam9pbik7XG4gICAgICAgIGNvbnN0IGJpZ1VJbnRGaWVsZHMgPSB0eXBlLmZpZWxkcy5maWx0ZXIoKHg6IERiRmllbGQpID0+IGlzQmlnSW50KHgudHlwZSkpO1xuICAgICAgICBjb25zdCBzdHJpbmdGb3JtYXR0ZWRGaWVsZHMgPSB0eXBlLmZpZWxkcy5maWx0ZXIoKHg6IERiRmllbGQpID0+IHguZm9ybWF0dGVyKTtcbiAgICAgICAgY29uc3QgZW51bUZpZWxkcyA9IHR5cGUuZmllbGRzLmZpbHRlcih4ID0+IHguZW51bURlZik7XG4gICAgICAgIGNvbnN0IGN1c3RvbVJlc29sdmVyUmVxdWlyZWQgPSB0eXBlLmNvbGxlY3Rpb25cbiAgICAgICAgICAgIHx8IGpvaW5GaWVsZHMubGVuZ3RoID4gMFxuICAgICAgICAgICAgfHwgYmlnVUludEZpZWxkcy5sZW5ndGggPiAwXG4gICAgICAgICAgICB8fCBlbnVtRmllbGRzLmxlbmd0aCA+IDA7XG4gICAgICAgIGlmICghY3VzdG9tUmVzb2x2ZXJSZXF1aXJlZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgJHt0eXBlLm5hbWV9OiB7YCk7XG4gICAgICAgIGlmICh0eXBlLmNvbGxlY3Rpb24pIHtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oJyAgICAgICAgICAgIGlkKHBhcmVudCkgeycpO1xuICAgICAgICAgICAganMud3JpdGVMbignICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTsnKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oJyAgICAgICAgICAgIH0sJyk7XG4gICAgICAgIH1cbiAgICAgICAgam9pbkZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgY29uc3Qgam9pbiA9IGZpZWxkLmpvaW47XG4gICAgICAgICAgICBpZiAoIWpvaW4pIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBvbkZpZWxkID0gdHlwZS5maWVsZHMuZmluZCh4ID0+IHgubmFtZSA9PT0gam9pbi5vbik7XG4gICAgICAgICAgICBpZiAoIW9uRmllbGQpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyAnSm9pbiBvbiBmaWVsZCBkb2VzIG5vdCBleGlzdC4nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3Qgb24gPSBqb2luLm9uID09PSAnaWQnID8gJ19rZXknIDogKGpvaW4ub24gfHwgJ19rZXknKTtcbiAgICAgICAgICAgIGNvbnN0IHJlZk9uID0gam9pbi5yZWZPbiA9PT0gJ2lkJyA/ICdfa2V5JyA6IChqb2luLnJlZk9uIHx8ICdfa2V5Jyk7XG4gICAgICAgICAgICBjb25zdCBjb2xsZWN0aW9uID0gZmllbGQudHlwZS5jb2xsZWN0aW9uO1xuICAgICAgICAgICAgaWYgKCFjb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgJ0pvaW5lZCB0eXBlIGlzIG5vdCBhIGNvbGxlY3Rpb24uJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICR7ZmllbGQubmFtZX0ocGFyZW50LCBhcmdzLCBjb250ZXh0KSB7YCk7XG4gICAgICAgICAgICBpZiAoam9pbi5wcmVDb25kaXRpb24pIHtcbiAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAgICAgaWYgKCEoJHtqb2luLnByZUNvbmRpdGlvbn0pKSB7YCk7XG4gICAgICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtgKTtcbiAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAgICAgfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgICAgIGlmIChhcmdzLndoZW4gJiYgISR7dHlwZS5uYW1lfS50ZXN0KG51bGwsIHBhcmVudCwgYXJncy53aGVuKSkge2ApO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtgKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICAgICB9YCk7XG5cbiAgICAgICAgICAgIGlmIChmaWVsZC5hcnJheURlcHRoID09PSAwKSB7XG4gICAgICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgICAgIHJldHVybiBjb250ZXh0LmRhdGEuJHtjb2xsZWN0aW9ufS53YWl0Rm9yRG9jKHBhcmVudC4ke29ufSwgJyR7cmVmT259JywgYXJncywgY29udGV4dCk7YCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLmFycmF5RGVwdGggPT09IDEpIHtcbiAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQuZGF0YS4ke2NvbGxlY3Rpb259LndhaXRGb3JEb2NzKHBhcmVudC4ke29ufSwgJyR7cmVmT259JywgYXJncywgY29udGV4dCk7YCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93ICdKb2lucyBvbiBhIG5lc3RlZCBhcnJheXMgZG9lcyBub3Qgc3VwcG9ydGVkLic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICB9LGApO1xuICAgICAgICB9KTtcbiAgICAgICAgYmlnVUludEZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcHJlZml4TGVuZ3RoID0gZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDY0ID8gMSA6IDI7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAke2ZpZWxkLm5hbWV9KHBhcmVudCwgYXJncykge2ApO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgke3ByZWZpeExlbmd0aH0sIHBhcmVudC4ke2ZpZWxkLm5hbWV9LCBhcmdzKTtgKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgIH0sYCk7XG4gICAgICAgIH0pO1xuICAgICAgICBzdHJpbmdGb3JtYXR0ZWRGaWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICR7ZmllbGQubmFtZX1fc3RyaW5nKHBhcmVudCwgYXJncykge2ApO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgICAgIHJldHVybiAke2ZpZWxkLmZvcm1hdHRlciB8fCAnJ30ocGFyZW50LiR7ZmllbGQubmFtZX0pO2ApO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgfSxgKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGVudW1GaWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGVudW1EZWYgPSBmaWVsZC5lbnVtRGVmO1xuICAgICAgICAgICAgaWYgKGVudW1EZWYpIHtcbiAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAke2ZpZWxkLm5hbWV9X25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJyR7ZmllbGQubmFtZX0nLCAke3N0cmluZ2lmeUVudW1WYWx1ZXMoZW51bURlZi52YWx1ZXMpfSksYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgIH0sYCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuSlNTY2FsYXJGaWVsZHModHlwZTogRGJUeXBlLCBwYXJlbnRQYXRoLCBwYXJlbnREb2NQYXRoOiBzdHJpbmcpIHtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgoZmllbGQ6IERiRmllbGQpID0+IHtcbiAgICAgICAgICAgIGlmIChmaWVsZC5qb2luIHx8IGZpZWxkLmVudW1EZWYpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBkb2NOYW1lID0gKHR5cGUuY29sbGVjdGlvbiAmJiBmaWVsZC5uYW1lID09PSAnaWQnKSA/ICdfa2V5JyA6IGZpZWxkLm5hbWU7XG4gICAgICAgICAgICBjb25zdCBwYXRoID0gYCR7cGFyZW50UGF0aH0uJHtmaWVsZC5uYW1lfWA7XG4gICAgICAgICAgICBsZXQgZG9jUGF0aCA9IGAke3BhcmVudERvY1BhdGh9LiR7ZG9jTmFtZX1gO1xuICAgICAgICAgICAgaWYgKGZpZWxkLmFycmF5RGVwdGggPiAwKSB7XG4gICAgICAgICAgICAgICAgbGV0IHN1ZmZpeCA9ICdbKl0nO1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGRlcHRoID0gMTA7IGRlcHRoID4gMDsgZGVwdGggLT0gMSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzID0gYFskeycqJy5yZXBlYXQoZGVwdGgpfV1gO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZG9jUGF0aC5pbmNsdWRlcyhzKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VmZml4ID0gYFskeycqJy5yZXBlYXQoZGVwdGggKyAxKX1dYDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGRvY1BhdGggPSBgJHtkb2NQYXRofSR7c3VmZml4fWA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzd2l0Y2ggKGZpZWxkLnR5cGUuY2F0ZWdvcnkpIHtcbiAgICAgICAgICAgIGNhc2UgXCJzY2FsYXJcIjpcbiAgICAgICAgICAgICAgICBsZXQgdHlwZU5hbWU7XG4gICAgICAgICAgICAgICAgaWYgKGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLmJvb2xlYW4pIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWUgPSAnYm9vbGVhbic7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC50eXBlID09PSBzY2FsYXJUeXBlcy5mbG9hdCkge1xuICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZSA9ICdudW1iZXInO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMuaW50KSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lID0gJ251bWJlcic7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC50eXBlID09PSBzY2FsYXJUeXBlcy51aW50NjQpIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWUgPSAndWludDY0JztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLnVpbnQxMDI0KSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lID0gJ3VpbnQxMDI0JztcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZSA9ICdzdHJpbmcnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGBzY2FsYXJGaWVsZHMuc2V0KCcke3BhdGh9JywgeyB0eXBlOiAnJHt0eXBlTmFtZX0nLCBwYXRoOiAnJHtkb2NQYXRofScgfSk7YCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwic3RydWN0XCI6XG4gICAgICAgICAgICBjYXNlIFwidW5pb25cIjpcbiAgICAgICAgICAgICAgICBnZW5KU1NjYWxhckZpZWxkcyhmaWVsZC50eXBlLCBwYXRoLCBkb2NQYXRoKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG5cbiAgICBmdW5jdGlvbiBnZW5KU1R5cGVSZXNvbHZlcnNGb3JVbmlvbih0eXBlOiBEYlR5cGUpIHtcbiAgICAgICAgaWYgKHR5cGUuY2F0ZWdvcnkgPT09IERiVHlwZUNhdGVnb3J5LnVuaW9uKSB7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICR7dHlwZS5uYW1lfTogJHt0eXBlLm5hbWV9UmVzb2x2ZXIsYCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5lcmF0ZSh0eXBlczogRGJUeXBlW10pIHtcblxuICAgICAgICAvLyBHXG5cbiAgICAgICAgZy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBcIlwiXCJcbiAgICAgICAgRHVlIHRvIEdyYXBoUUwgbGltaXRhdGlvbnMgYmlnIG51bWJlcnMgYXJlIHJldHVybmVkIGFzIGEgc3RyaW5nLlxuICAgICAgICBZb3UgY2FuIHNwZWNpZnkgZm9ybWF0IHVzZWQgdG8gc3RyaW5nIHJlcHJlc2VudGF0aW9uIGZvciBiaWcgaW50ZWdlcnMuXG4gICAgICAgIFwiXCJcIlxuICAgICAgICBlbnVtIEJpZ0ludEZvcm1hdCB7XG4gICAgICAgICAgICBcIiBIZXhhZGVjaW1hbCByZXByZXNlbnRhdGlvbiBzdGFydGVkIHdpdGggMHggKGRlZmF1bHQpIFwiXG4gICAgICAgICAgICBIRVhcbiAgICAgICAgICAgIFwiIERlY2ltYWwgcmVwcmVzZW50YXRpb24gXCJcbiAgICAgICAgICAgIERFQ1xuICAgICAgICB9XG4gICAgICAgIGApO1xuICAgICAgICBbJ1N0cmluZycsICdCb29sZWFuJywgJ0ludCcsICdGbG9hdCddLmZvckVhY2goZ2VuR1NjYWxhclR5cGVzRmlsdGVyKTtcbiAgICAgICAgZ2VuR0VudW1UeXBlcygpO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKHR5cGUgPT4gZ2VuR1R5cGVEZWNsYXJhdGlvbih0eXBlKSk7XG4gICAgICAgIGNvbnN0IGdBcnJheUZpbHRlcnMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICAgICAgdHlwZXMuZm9yRWFjaCh0eXBlID0+IGdlbkdGaWx0ZXIodHlwZSwgZ0FycmF5RmlsdGVycykpO1xuXG4gICAgICAgIGNvbnN0IGNvbGxlY3Rpb25zID0gdHlwZXMuZmlsdGVyKHQgPT4gISF0LmNvbGxlY3Rpb24pO1xuICAgICAgICBnZW5HUXVlcmllcyhjb2xsZWN0aW9ucyk7XG4gICAgICAgIGdlbkdTdWJzY3JpcHRpb25zKGNvbGxlY3Rpb25zKTtcblxuICAgICAgICAvLyBKU1xuXG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIGNvbnN0IHtcbiAgICAgICAgICAgIHNjYWxhcixcbiAgICAgICAgICAgIGJpZ1VJbnQxLFxuICAgICAgICAgICAgYmlnVUludDIsXG4gICAgICAgICAgICBzdHJpbmdMb3dlckZpbHRlcixcbiAgICAgICAgICAgIHJlc29sdmVCaWdVSW50LFxuICAgICAgICAgICAgc3RydWN0LFxuICAgICAgICAgICAgYXJyYXksXG4gICAgICAgICAgICBqb2luLFxuICAgICAgICAgICAgam9pbkFycmF5LFxuICAgICAgICAgICAgZW51bU5hbWUsXG4gICAgICAgICAgICBzdHJpbmdDb21wYW5pb24sXG4gICAgICAgICAgICBjcmVhdGVFbnVtTmFtZVJlc29sdmVyLFxuICAgICAgICAgICAgdW5peE1pbGxpc2Vjb25kc1RvU3RyaW5nLFxuICAgICAgICAgICAgdW5peFNlY29uZHNUb1N0cmluZyxcbiAgICAgICAgfSA9IHJlcXVpcmUoJy4uL2ZpbHRlci9maWx0ZXJzLmpzJyk7XG4gICAgICAgIGApO1xuICAgICAgICBjb25zdCBqc0FycmF5RmlsdGVycyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKHR5cGUgPT4gZ2VuSlNGaWx0ZXIodHlwZSwganNBcnJheUZpbHRlcnMpKTtcblxuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBmdW5jdGlvbiBjcmVhdGVSZXNvbHZlcnMoZGF0YSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgYCk7XG4gICAgICAgIHR5cGVzLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICAgICAgICAgIGdlbkpTQ3VzdG9tUmVzb2x2ZXJzKHR5cGUpO1xuICAgICAgICAgICAgZ2VuSlNUeXBlUmVzb2x2ZXJzRm9yVW5pb24odHlwZSk7XG4gICAgICAgIH0pO1xuICAgICAgICBqcy53cml0ZUxuKCcgICAgICAgIFF1ZXJ5OiB7Jyk7XG4gICAgICAgIGNvbGxlY3Rpb25zLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICR7dHlwZS5jb2xsZWN0aW9uIHx8ICcnfTogZGF0YS4ke3R5cGUuY29sbGVjdGlvbiB8fCAnJ30ucXVlcnlSZXNvbHZlcigpLGApXG4gICAgICAgIH0pO1xuICAgICAgICBqcy53cml0ZUxuKCcgICAgICAgIH0sJyk7XG4gICAgICAgIGpzLndyaXRlTG4oJyAgICAgICAgU3Vic2NyaXB0aW9uOiB7Jyk7XG4gICAgICAgIGNvbGxlY3Rpb25zLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICR7dHlwZS5jb2xsZWN0aW9uIHx8ICcnfTogZGF0YS4ke3R5cGUuY29sbGVjdGlvbiB8fCAnJ30uc3Vic2NyaXB0aW9uUmVzb2x2ZXIoKSxgKVxuICAgICAgICB9KTtcbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBgKTtcblxuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBjb25zdCBzY2FsYXJGaWVsZHMgPSBuZXcgTWFwKCk7XG4gICAgICAgIGApO1xuICAgICAgICBjb2xsZWN0aW9ucy5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgICAgICAgICBnZW5KU1NjYWxhckZpZWxkcyh0eXBlLCB0eXBlLmNvbGxlY3Rpb24gfHwgJycsICdkb2MnKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgICAgICAgICBzY2FsYXJGaWVsZHMsXG4gICAgICAgICAgICBjcmVhdGVSZXNvbHZlcnMsXG4gICAgICAgIGApO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKHR5cGUgPT4ganMud3JpdGVMbihgICAgICR7dHlwZS5uYW1lfSxgKSk7XG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIH07XG4gICAgICAgIGApO1xuICAgIH1cblxuICAgIGdlbmVyYXRlKGRiVHlwZXMpO1xuXG4gICAgZm9yIChjb25zdCBlOiBJbnRFbnVtRGVmIG9mIGVudW1UeXBlcy52YWx1ZXMoKSkge1xuICAgICAgICBjb25zb2xlLmxvZyhgZXhwb3J0IGNvbnN0IFEke2UubmFtZX0gPSB7YCk7XG4gICAgICAgIGNvbnNvbGUubG9nKE9iamVjdC5lbnRyaWVzKGUudmFsdWVzKS5tYXAoKFtuYW1lLCB2YWx1ZV0pID0+IHtcbiAgICAgICAgICAgIHJldHVybiBgICAgICR7bmFtZX06ICR7KHZhbHVlOiBhbnkpfSxgO1xuICAgICAgICB9KS5qb2luKCdcXG4nKSk7XG4gICAgICAgIGNvbnNvbGUubG9nKGB9O1xcbmApO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIHFsOiBnLmdlbmVyYXRlZCgpLFxuICAgICAgICBqczoganMuZ2VuZXJhdGVkKCksXG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBtYWluO1xuIl19