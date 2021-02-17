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
        typeDeclaration = `join${suffix}('${join.on}', '${join.refOn}', '${field.type.collection || ''}', () => ${field.type.name})`;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9tYWludGFuYW5jZS9nZW4tZ3JhcGhxbC9xbC1qcy1nZW5lcmF0b3IuanMiXSwibmFtZXMiOlsiY29tcGFyZUZpZWxkcyIsImEiLCJiIiwibmFtZSIsIm1haW4iLCJzY2hlbWFEZWYiLCJ0eXBlcyIsImRiVHlwZXMiLCJlbnVtVHlwZXMiLCJmb3JFYWNoIiwiZGJUeXBlIiwiZmllbGRzIiwic29ydCIsImciLCJXcml0ZXIiLCJqcyIsImdlbkdEb2MiLCJwcmVmaXgiLCJkb2MiLCJ0cmltIiwibGluZXMiLCJzcGxpdCIsImxlbmd0aCIsImluY2x1ZGVzIiwid3JpdGVMbiIsImxpbmUiLCJ1bmlvblZhcmlhbnRUeXBlIiwidHlwZSIsInZhcmlhbnQiLCJnZW5HVHlwZURlY2xhcmF0aW9uc0ZvclVuaW9uVmFyaWFudHMiLCJ3cml0ZUJsb2NrTG4iLCJnZW5HRW51bVR5cGVzIiwiZW51bURlZiIsInZhbHVlcyIsIk9iamVjdCIsImtleXMiLCJnZW5HVHlwZURlY2xhcmF0aW9uIiwiY2F0ZWdvcnkiLCJEYlR5cGVDYXRlZ29yeSIsInVuaW9uIiwiZmllbGQiLCJ0eXBlRGVjbGFyYXRpb24iLCJyZXBlYXQiLCJhcnJheURlcHRoIiwicGFyYW1zIiwiam9pbiIsImZvcm1hdHRlciIsInByZXZlbnRUd2ljZSIsIm5hbWVzIiwid29yayIsImhhcyIsImFkZCIsImdlbkdGaWx0ZXJzRm9yQXJyYXlGaWVsZHMiLCJnTmFtZXMiLCJpdGVtVHlwZU5hbWUiLCJpIiwiZmlsdGVyTmFtZSIsIm9wIiwiZ2VuR0ZpbHRlcnNGb3JFbnVtTmFtZUZpZWxkcyIsImdlbkdTY2FsYXJUeXBlc0ZpbHRlciIsImdlbkdGaWx0ZXIiLCJnZW5HUXVlcmllcyIsImNvbGxlY3Rpb24iLCJnZW5HU3Vic2NyaXB0aW9ucyIsImdldFNjYWxhclJlc29sdmVyTmFtZSIsInNjYWxhclR5cGVzIiwidWludDY0IiwidWludDEwMjQiLCJzdHJpbmciLCJsb3dlckZpbHRlciIsImdlbkpTRmlsdGVyc0ZvckFycmF5RmllbGRzIiwianNOYW1lcyIsIml0ZW1SZXNvbHZlck5hbWUiLCJzY2FsYXIiLCJnZW5KU1N0cnVjdEZpbHRlciIsInN1ZmZpeCIsIm9uIiwicmVmT24iLCJnZW5KU1VuaW9uUmVzb2x2ZXIiLCJnZW5KU0ZpbHRlciIsImdlbkpTQ3VzdG9tUmVzb2x2ZXJzIiwiam9pbkZpZWxkcyIsImZpbHRlciIsIngiLCJiaWdVSW50RmllbGRzIiwic3RyaW5nRm9ybWF0dGVkRmllbGRzIiwiZW51bUZpZWxkcyIsImN1c3RvbVJlc29sdmVyUmVxdWlyZWQiLCJvbkZpZWxkIiwiZmluZCIsInByZUNvbmRpdGlvbiIsInByZWZpeExlbmd0aCIsImdlbkpTU2NhbGFyRmllbGRzIiwicGFyZW50UGF0aCIsInBhcmVudERvY1BhdGgiLCJkb2NOYW1lIiwicGF0aCIsImRvY1BhdGgiLCJkZXB0aCIsInMiLCJ0eXBlTmFtZSIsImJvb2xlYW4iLCJmbG9hdCIsImludCIsImdlbkpTVHlwZVJlc29sdmVyc0ZvclVuaW9uIiwiZ2VuZXJhdGUiLCJnQXJyYXlGaWx0ZXJzIiwiU2V0IiwiY29sbGVjdGlvbnMiLCJ0IiwianNBcnJheUZpbHRlcnMiLCJlIiwiY29uc29sZSIsImxvZyIsImVudHJpZXMiLCJtYXAiLCJ2YWx1ZSIsInFsIiwiZ2VuZXJhdGVkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBRUE7O0FBR0E7O0FBUUEsU0FBU0EsYUFBVCxDQUF1QkMsQ0FBdkIsRUFBbUNDLENBQW5DLEVBQXVEO0FBQ25ELE1BQUlELENBQUMsQ0FBQ0UsSUFBRixLQUFXLElBQWYsRUFBcUI7QUFDakIsV0FBT0QsQ0FBQyxDQUFDQyxJQUFGLEtBQVcsSUFBWCxHQUFrQixDQUFsQixHQUFzQixDQUFDLENBQTlCO0FBQ0g7O0FBQ0QsTUFBSUQsQ0FBQyxDQUFDQyxJQUFGLEtBQVcsSUFBZixFQUFxQjtBQUNqQixXQUFPLENBQVA7QUFDSDs7QUFDRCxTQUFRRixDQUFDLENBQUNFLElBQUYsS0FBV0QsQ0FBQyxDQUFD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Q0FBWSxPQUFNRyxJQUFJLENBQUN4QixJQUFLLEdBQTVCLENBQXRCO0FBQ0FZLElBQUFBLEVBQUUsQ0FBQ2UsWUFBSCxDQUFpQjs7U0FBakI7QUFHSDs7QUFFRDJFLEVBQUFBLFFBQVEsQ0FBQ2xHLE9BQUQsQ0FBUjs7QUFFQSxPQUFLLE1BQU13RyxDQUFYLElBQTRCdkcsU0FBUyxDQUFDeUIsTUFBVixFQUE1QixFQUFnRDtBQUM1QytFLElBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFhLGlCQUFnQkYsQ0FBQyxDQUFDNUcsSUFBSyxNQUFwQztBQUNBNkcsSUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVkvRSxNQUFNLENBQUNnRixPQUFQLENBQWVILENBQUMsQ0FBQzlFLE1BQWpCLEVBQXlCa0YsR0FBekIsQ0FBNkIsQ0FBQyxDQUFDaEgsSUFBRCxFQUFPaUgsS0FBUCxDQUFELEtBQW1CO0FBQ3hELGFBQVEsT0FBTWpILElBQUssS0FBS2lILEtBQVksR0FBcEM7QUFDSCxLQUZXLEVBRVR2RSxJQUZTLENBRUosSUFGSSxDQUFaO0FBR0FtRSxJQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBYSxNQUFiO0FBQ0g7O0FBRUQsU0FBTztBQUNISSxJQUFBQSxFQUFFLEVBQUV4RyxDQUFDLENBQUN5RyxTQUFGLEVBREQ7QUFFSHZHLElBQUFBLEVBQUUsRUFBRUEsRUFBRSxDQUFDdUcsU0FBSDtBQUZELEdBQVA7QUFJSDs7ZUFFY2xILEkiLCJzb3VyY2VzQ29udGVudCI6WyIvL0BmbG93XG5cbmltcG9ydCB7IFdyaXRlciB9IGZyb20gJy4vZ2VuLmpzJztcbmltcG9ydCB0eXBlIHsgVHlwZURlZiB9IGZyb20gJy4uLy4uL3NlcnZlci9zY2hlbWEvc2NoZW1hLmpzJztcbmltcG9ydCB0eXBlIHsgRGJGaWVsZCwgRGJUeXBlLCBJbnRFbnVtRGVmIH0gZnJvbSAnLi4vLi4vc2VydmVyL3NjaGVtYS9kYi1zY2hlbWEtdHlwZXMnO1xuaW1wb3J0IHtcbiAgICBEYlR5cGVDYXRlZ29yeSxcbiAgICBpc0JpZ0ludCwgcGFyc2VEYlNjaGVtYSxcbiAgICBzY2FsYXJUeXBlcyxcbiAgICBzdHJpbmdpZnlFbnVtVmFsdWVzLFxuICAgIHRvRW51bVN0eWxlLFxufSBmcm9tICcuLi8uLi9zZXJ2ZXIvc2NoZW1hL2RiLXNjaGVtYS10eXBlcyc7XG5cbmZ1bmN0aW9uIGNvbXBhcmVGaWVsZHMoYTogRGJGaWVsZCwgYjogRGJGaWVsZCk6IG51bWJlciB7XG4gICAgaWYgKGEubmFtZSA9PT0gXCJpZFwiKSB7XG4gICAgICAgIHJldHVybiBiLm5hbWUgPT09IFwiaWRcIiA/IDAgOiAtMTtcbiAgICB9XG4gICAgaWYgKGIubmFtZSA9PT0gXCJpZFwiKSB7XG4gICAgICAgIHJldHVybiAxO1xuICAgIH1cbiAgICByZXR1cm4gKGEubmFtZSA9PT0gYi5uYW1lKSA/IDAgOiAoYS5uYW1lIDwgYi5uYW1lID8gLTEgOiAxKTtcbn1cblxuZnVuY3Rpb24gbWFpbihzY2hlbWFEZWY6IFR5cGVEZWYpIHtcbiAgICBjb25zdCB7IHR5cGVzOiBkYlR5cGVzLCBlbnVtVHlwZXMgfSA9IHBhcnNlRGJTY2hlbWEoc2NoZW1hRGVmKTtcbiAgICBkYlR5cGVzLmZvckVhY2goKGRiVHlwZTogRGJUeXBlKSA9PiB7XG4gICAgICAgIGRiVHlwZS5maWVsZHMuc29ydChjb21wYXJlRmllbGRzKTtcbiAgICB9KTtcblxuLy8gR2VuZXJhdG9yc1xuXG4gICAgY29uc3QgZyA9IG5ldyBXcml0ZXIoKTtcbiAgICBjb25zdCBqcyA9IG5ldyBXcml0ZXIoKTtcblxuICAgIGZ1bmN0aW9uIGdlbkdEb2MocHJlZml4OiBzdHJpbmcsIGRvYzogc3RyaW5nKSB7XG4gICAgICAgIGlmIChkb2MudHJpbSgpID09PSAnJykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGxpbmVzID0gZG9jLnNwbGl0KC9cXG5cXHI/fFxcclxcbj8vKTtcbiAgICAgICAgaWYgKGxpbmVzLmxlbmd0aCA9PT0gMSAmJiAhbGluZXNbMF0uaW5jbHVkZXMoJ1wiJykpIHtcbiAgICAgICAgICAgIGcud3JpdGVMbihwcmVmaXgsICdcIicsIGxpbmVzWzBdLCAnXCInKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGcud3JpdGVMbihwcmVmaXgsICdcIlwiXCInKTtcbiAgICAgICAgICAgIGxpbmVzLmZvckVhY2goKGxpbmUpID0+IHtcbiAgICAgICAgICAgICAgICBnLndyaXRlTG4ocHJlZml4LCBsaW5lKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgZy53cml0ZUxuKHByZWZpeCwgJ1wiXCJcIicpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdW5pb25WYXJpYW50VHlwZSh0eXBlOiBEYlR5cGUsIHZhcmlhbnQ6IERiRmllbGQpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gYCR7dHlwZS5uYW1lfSR7dmFyaWFudC5uYW1lfVZhcmlhbnRgO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkdUeXBlRGVjbGFyYXRpb25zRm9yVW5pb25WYXJpYW50cyh0eXBlOiBEYlR5cGUpIHtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgodmFyaWFudCkgPT4ge1xuICAgICAgICAgICAgZy53cml0ZUJsb2NrTG4oYFxuICAgICAgICB0eXBlICR7dW5pb25WYXJpYW50VHlwZSh0eXBlLCB2YXJpYW50KX0ge1xuICAgICAgICAgICAgJHt2YXJpYW50Lm5hbWV9OiAke3ZhcmlhbnQudHlwZS5uYW1lfVxuICAgICAgICB9XG5cbiAgICAgICAgYCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkdFbnVtVHlwZXMoKSB7XG4gICAgICAgIGZvciAoY29uc3QgZW51bURlZjogSW50RW51bURlZiBvZiBlbnVtVHlwZXMudmFsdWVzKCkpIHtcbiAgICAgICAgICAgIGcud3JpdGVMbihgZW51bSAke2VudW1EZWYubmFtZX1FbnVtIHtgKTtcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKGVudW1EZWYudmFsdWVzKS5mb3JFYWNoKChuYW1lKSA9PiB7XG4gICAgICAgICAgICAgICAgZy53cml0ZUxuKGAgICAgJHt0b0VudW1TdHlsZShuYW1lKX1gKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgZy53cml0ZUxuKGB9YCk7XG4gICAgICAgICAgICBnLndyaXRlTG4oKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkdUeXBlRGVjbGFyYXRpb24odHlwZTogRGJUeXBlKSB7XG4gICAgICAgIGlmICh0eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS51bmlvbikge1xuICAgICAgICAgICAgZ2VuR1R5cGVEZWNsYXJhdGlvbnNGb3JVbmlvblZhcmlhbnRzKHR5cGUpO1xuICAgICAgICAgICAgZy53cml0ZUxuKGB1bmlvbiAke3R5cGUubmFtZX0gPSBgKTtcbiAgICAgICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2godmFyaWFudCA9PiB7XG4gICAgICAgICAgICAgICAgZy53cml0ZUxuKGBcXHR8ICR7dW5pb25WYXJpYW50VHlwZSh0eXBlLCB2YXJpYW50KX1gKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgZy53cml0ZUxuKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBnZW5HRG9jKCcnLCB0eXBlLmRvYyk7XG4gICAgICAgICAgICBnLndyaXRlTG4oYHR5cGUgJHt0eXBlLm5hbWV9IHtgKTtcbiAgICAgICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goZmllbGQgPT4ge1xuICAgICAgICAgICAgICAgIGdlbkdEb2MoJ1xcdCcsIGZpZWxkLmRvYyk7XG4gICAgICAgICAgICAgICAgY29uc3QgdHlwZURlY2xhcmF0aW9uID1cbiAgICAgICAgICAgICAgICAgICAgJ1snLnJlcGVhdChmaWVsZC5hcnJheURlcHRoKSArXG4gICAgICAgICAgICAgICAgICAgIGZpZWxkLnR5cGUubmFtZSArXG4gICAgICAgICAgICAgICAgICAgICddJy5yZXBlYXQoZmllbGQuYXJyYXlEZXB0aCk7XG4gICAgICAgICAgICAgICAgbGV0IHBhcmFtcyA9ICcnO1xuICAgICAgICAgICAgICAgIGlmIChpc0JpZ0ludChmaWVsZC50eXBlKSkge1xuICAgICAgICAgICAgICAgICAgICBwYXJhbXMgPSAnKGZvcm1hdDogQmlnSW50Rm9ybWF0KSc7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC5qb2luKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhcmFtcyA9IGAodGltZW91dDogSW50LCB3aGVuOiAke3R5cGUubmFtZX1GaWx0ZXIpYDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBnLndyaXRlTG4oYFxcdCR7ZmllbGQubmFtZX0ke3BhcmFtc306ICR7dHlwZURlY2xhcmF0aW9ufWApO1xuICAgICAgICAgICAgICAgIGNvbnN0IGVudW1EZWYgPSBmaWVsZC5lbnVtRGVmO1xuICAgICAgICAgICAgICAgIGlmIChlbnVtRGVmKSB7XG4gICAgICAgICAgICAgICAgICAgIGcud3JpdGVMbihgXFx0JHtmaWVsZC5uYW1lfV9uYW1lOiAke2VudW1EZWYubmFtZX1FbnVtYCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChmaWVsZC5mb3JtYXR0ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgZy53cml0ZUxuKGBcXHQke2ZpZWxkLm5hbWV9X3N0cmluZzogU3RyaW5nYCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBnLndyaXRlTG4oYH1gKTtcbiAgICAgICAgfVxuICAgICAgICBnLndyaXRlTG4oKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwcmV2ZW50VHdpY2UobmFtZTogc3RyaW5nLCBuYW1lczogU2V0PHN0cmluZz4sIHdvcms6ICgpID0+IHZvaWQpIHtcbiAgICAgICAgaWYgKCFuYW1lcy5oYXMobmFtZSkpIHtcbiAgICAgICAgICAgIG5hbWVzLmFkZChuYW1lKTtcbiAgICAgICAgICAgIHdvcmsoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkdGaWx0ZXJzRm9yQXJyYXlGaWVsZHModHlwZTogRGJUeXBlLCBnTmFtZXM6IFNldDxzdHJpbmc+KSB7XG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBsZXQgaXRlbVR5cGVOYW1lID0gZmllbGQudHlwZS5uYW1lO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmaWVsZC5hcnJheURlcHRoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWx0ZXJOYW1lID0gYCR7aXRlbVR5cGVOYW1lfUFycmF5RmlsdGVyYDtcbiAgICAgICAgICAgICAgICBwcmV2ZW50VHdpY2UoZmlsdGVyTmFtZSwgZ05hbWVzLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGcud3JpdGVMbihgaW5wdXQgJHtmaWx0ZXJOYW1lfSB7YCk7XG4gICAgICAgICAgICAgICAgICAgIFsnYW55JywgJ2FsbCddLmZvckVhY2goKG9wKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBnLndyaXRlTG4oYFxcdCR7b3B9OiAke2l0ZW1UeXBlTmFtZX1GaWx0ZXJgKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGcud3JpdGVMbignfScpO1xuICAgICAgICAgICAgICAgICAgICBnLndyaXRlTG4oKTtcblxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGl0ZW1UeXBlTmFtZSArPSAnQXJyYXknO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5HRmlsdGVyc0ZvckVudW1OYW1lRmllbGRzKHR5cGU6IERiVHlwZSwgZ05hbWVzOiBTZXQ8c3RyaW5nPikge1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgZW51bURlZiA9IGZpZWxkLmVudW1EZWY7XG4gICAgICAgICAgICBpZiAoZW51bURlZikge1xuICAgICAgICAgICAgICAgIHByZXZlbnRUd2ljZShgJHtlbnVtRGVmLm5hbWV9RW51bUZpbHRlcmAsIGdOYW1lcywgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBnZW5HU2NhbGFyVHlwZXNGaWx0ZXIoYCR7ZW51bURlZi5uYW1lfUVudW1gKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuR0ZpbHRlcih0eXBlOiBEYlR5cGUsIGdOYW1lczogU2V0PHN0cmluZz4pIHtcbiAgICAgICAgaWYgKHR5cGUuZmllbGRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGdlbkdGaWx0ZXJzRm9yQXJyYXlGaWVsZHModHlwZSwgZ05hbWVzKTtcbiAgICAgICAgZ2VuR0ZpbHRlcnNGb3JFbnVtTmFtZUZpZWxkcyh0eXBlLCBnTmFtZXMpO1xuICAgICAgICBnZW5HRG9jKCcnLCB0eXBlLmRvYyk7XG4gICAgICAgIGcud3JpdGVMbihgaW5wdXQgJHt0eXBlLm5hbWV9RmlsdGVyIHtgKTtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGdlbkdEb2MoJ1xcdCcsIGZpZWxkLmRvYyk7XG4gICAgICAgICAgICBjb25zdCB0eXBlRGVjbGFyYXRpb24gPSBmaWVsZC50eXBlLm5hbWUgKyBcIkFycmF5XCIucmVwZWF0KGZpZWxkLmFycmF5RGVwdGgpO1xuICAgICAgICAgICAgZy53cml0ZUxuKGBcXHQke2ZpZWxkLm5hbWV9OiAke3R5cGVEZWNsYXJhdGlvbn1GaWx0ZXJgKTtcbiAgICAgICAgICAgIGNvbnN0IGVudW1EZWYgPSBmaWVsZC5lbnVtRGVmO1xuICAgICAgICAgICAgaWYgKGVudW1EZWYpIHtcbiAgICAgICAgICAgICAgICBnLndyaXRlTG4oYFxcdCR7ZmllbGQubmFtZX1fbmFtZTogJHtlbnVtRGVmLm5hbWV9RW51bUZpbHRlcmApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgZy53cml0ZUxuKGAgICAgT1I6ICR7dHlwZS5uYW1lfUZpbHRlcmApO1xuICAgICAgICBnLndyaXRlTG4oYH1gKTtcbiAgICAgICAgZy53cml0ZUxuKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuR1NjYWxhclR5cGVzRmlsdGVyKG5hbWU6IHN0cmluZykge1xuICAgICAgICBnLndyaXRlTG4oYGlucHV0ICR7bmFtZX1GaWx0ZXIge2ApO1xuICAgICAgICBbJ2VxJywgJ25lJywgJ2d0JywgJ2x0JywgJ2dlJywgJ2xlJ10uZm9yRWFjaCgob3ApID0+IHtcbiAgICAgICAgICAgIGcud3JpdGVMbihgXFx0JHtvcH06ICR7bmFtZX1gKTtcbiAgICAgICAgfSk7XG4gICAgICAgIFsnaW4nLCAnbm90SW4nXS5mb3JFYWNoKChvcCkgPT4ge1xuICAgICAgICAgICAgZy53cml0ZUxuKGBcXHQke29wfTogWyR7bmFtZX1dYCk7XG4gICAgICAgIH0pO1xuICAgICAgICBnLndyaXRlTG4oJ30nKTtcbiAgICAgICAgZy53cml0ZUxuKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuR1F1ZXJpZXModHlwZXM6IERiVHlwZVtdKSB7XG4gICAgICAgIGcud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgXCJTcGVjaWZ5IHNvcnQgb3JkZXIgZGlyZWN0aW9uXCJcbiAgICAgICAgZW51bSBRdWVyeU9yZGVyQnlEaXJlY3Rpb24ge1xuICAgICAgICAgICAgXCJEb2N1bWVudHMgd2lsbCBiZSBzb3J0ZWQgaW4gYXNjZW5kZWQgb3JkZXIgKGUuZy4gZnJvbSBBIHRvIFopXCJcbiAgICAgICAgICAgIEFTQ1xuICAgICAgICAgICAgXCJEb2N1bWVudHMgd2lsbCBiZSBzb3J0ZWQgaW4gZGVzY2VuZGFudCBvcmRlciAoZS5nLiBmcm9tIFogdG8gQSlcIlxuICAgICAgICAgICAgREVTQ1xuICAgICAgICB9XG5cbiAgICAgICAgXG4gICAgICAgIFwiXCJcIlxuICAgICAgICBTcGVjaWZ5IGhvdyB0byBzb3J0IHJlc3VsdHMuXG4gICAgICAgIFlvdSBjYW4gc29ydCBkb2N1bWVudHMgaW4gcmVzdWx0IHNldCB1c2luZyBtb3JlIHRoYW4gb25lIGZpZWxkLlxuICAgICAgICBcIlwiXCJcbiAgICAgICAgaW5wdXQgUXVlcnlPcmRlckJ5IHtcbiAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgICAgUGF0aCB0byBmaWVsZCB3aGljaCBtdXN0IGJlIHVzZWQgYXMgYSBzb3J0IGNyaXRlcmlhLlxuICAgICAgICAgICAgSWYgZmllbGQgcmVzaWRlcyBkZWVwIGluIHN0cnVjdHVyZSBwYXRoIGl0ZW1zIG11c3QgYmUgc2VwYXJhdGVkIHdpdGggZG90IChlLmcuICdmb28uYmFyLmJheicpLlxuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgICBwYXRoOiBTdHJpbmdcbiAgICAgICAgICAgIFwiU29ydCBvcmRlciBkaXJlY3Rpb25cIlxuICAgICAgICAgICAgZGlyZWN0aW9uOiBRdWVyeU9yZGVyQnlEaXJlY3Rpb25cbiAgICAgICAgfVxuXG4gICAgICAgIHR5cGUgUXVlcnkge1xuICAgICAgICBgKTtcblxuICAgICAgICB0eXBlcy5mb3JFYWNoKCh0eXBlOiBEYlR5cGUpID0+IHtcbiAgICAgICAgICAgIGcud3JpdGVMbihgXFx0JHt0eXBlLmNvbGxlY3Rpb24gfHwgJyd9KGZpbHRlcjogJHt0eXBlLm5hbWV9RmlsdGVyLCBvcmRlckJ5OiBbUXVlcnlPcmRlckJ5XSwgbGltaXQ6IEludCwgdGltZW91dDogRmxvYXQsIGFjY2Vzc0tleTogU3RyaW5nLCBvcGVyYXRpb25JZDogU3RyaW5nKTogWyR7dHlwZS5uYW1lfV1gKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgZy53cml0ZUJsb2NrTG4oYFxuICAgICAgICB9XG5cbiAgICAgICAgYCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuR1N1YnNjcmlwdGlvbnModHlwZXM6IERiVHlwZVtdKSB7XG4gICAgICAgIGcud3JpdGVMbigndHlwZSBTdWJzY3JpcHRpb24geycpO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgICAgICAgICBnLndyaXRlTG4oYFxcdCR7dHlwZS5jb2xsZWN0aW9uIHx8ICcnfShmaWx0ZXI6ICR7dHlwZS5uYW1lfUZpbHRlciwgYWNjZXNzS2V5OiBTdHJpbmcpOiAke3R5cGUubmFtZX1gKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGcud3JpdGVMbignfScpO1xuICAgIH1cblxuXG4gICAgZnVuY3Rpb24gZ2V0U2NhbGFyUmVzb2x2ZXJOYW1lKGZpZWxkOiBEYkZpZWxkKTogc3RyaW5nIHtcbiAgICAgICAgaWYgKGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLnVpbnQ2NCkge1xuICAgICAgICAgICAgcmV0dXJuICdiaWdVSW50MSc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLnVpbnQxMDI0KSB7XG4gICAgICAgICAgICByZXR1cm4gJ2JpZ1VJbnQyJztcbiAgICAgICAgfVxuICAgICAgICBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMuc3RyaW5nICYmIGZpZWxkLmxvd2VyRmlsdGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gJ3N0cmluZ0xvd2VyRmlsdGVyJztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJ3NjYWxhcic7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuSlNGaWx0ZXJzRm9yQXJyYXlGaWVsZHModHlwZTogRGJUeXBlLCBqc05hbWVzOiBTZXQ8c3RyaW5nPikge1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgbGV0IGl0ZW1UeXBlTmFtZSA9IGZpZWxkLnR5cGUubmFtZTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZmllbGQuYXJyYXlEZXB0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmlsdGVyTmFtZSA9IGAke2l0ZW1UeXBlTmFtZX1BcnJheWA7XG4gICAgICAgICAgICAgICAgcHJldmVudFR3aWNlKGZpbHRlck5hbWUsIGpzTmFtZXMsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaXRlbVJlc29sdmVyTmFtZSA9IChpID09PSAwICYmIGZpZWxkLnR5cGUuY2F0ZWdvcnkgPT09IERiVHlwZUNhdGVnb3J5LnNjYWxhcilcbiAgICAgICAgICAgICAgICAgICAgICAgID8gZ2V0U2NhbGFyUmVzb2x2ZXJOYW1lKGZpZWxkKVxuICAgICAgICAgICAgICAgICAgICAgICAgOiBpdGVtVHlwZU5hbWU7XG4gICAgICAgICAgICAgICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgICAgICAgICAgY29uc3QgJHtmaWx0ZXJOYW1lfSA9IGFycmF5KCgpID0+ICR7aXRlbVJlc29sdmVyTmFtZX0pO1xuICAgICAgICAgICAgICAgIGApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGl0ZW1UeXBlTmFtZSArPSAnQXJyYXknO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5KU1N0cnVjdEZpbHRlcih0eXBlOiBEYlR5cGUpIHtcbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgY29uc3QgJHt0eXBlLm5hbWV9ID0gc3RydWN0KHtcbiAgICBgKTtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgoZmllbGQ6IERiRmllbGQpID0+IHtcbiAgICAgICAgICAgIGxldCB0eXBlRGVjbGFyYXRpb246ID9zdHJpbmcgPSBudWxsO1xuICAgICAgICAgICAgY29uc3Qgam9pbiA9IGZpZWxkLmpvaW47XG4gICAgICAgICAgICBpZiAoam9pbikge1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1ZmZpeCA9IGZpZWxkLmFycmF5RGVwdGggPiAwID8gJ0FycmF5JyA6ICcnO1xuICAgICAgICAgICAgICAgIHR5cGVEZWNsYXJhdGlvbiA9IGBqb2luJHtzdWZmaXh9KCcke2pvaW4ub259JywgJyR7am9pbi5yZWZPbn0nLCAnJHtmaWVsZC50eXBlLmNvbGxlY3Rpb24gfHwgJyd9JywgKCkgPT4gJHtmaWVsZC50eXBlLm5hbWV9KWA7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLmFycmF5RGVwdGggPiAwKSB7XG4gICAgICAgICAgICAgICAgdHlwZURlY2xhcmF0aW9uID1cbiAgICAgICAgICAgICAgICAgICAgZmllbGQudHlwZS5uYW1lICtcbiAgICAgICAgICAgICAgICAgICAgJ0FycmF5Jy5yZXBlYXQoZmllbGQuYXJyYXlEZXB0aCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLnR5cGUuY2F0ZWdvcnkgPT09IERiVHlwZUNhdGVnb3J5LnNjYWxhcikge1xuICAgICAgICAgICAgICAgIHR5cGVEZWNsYXJhdGlvbiA9IGdldFNjYWxhclJlc29sdmVyTmFtZShmaWVsZCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLnR5cGUuZmllbGRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB0eXBlRGVjbGFyYXRpb24gPSBmaWVsZC50eXBlLm5hbWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodHlwZURlY2xhcmF0aW9uKSB7XG4gICAgICAgICAgICAgICAganMud3JpdGVMbihgICAgICR7ZmllbGQubmFtZX06ICR7dHlwZURlY2xhcmF0aW9ufSxgKTtcbiAgICAgICAgICAgICAgICBjb25zdCBlbnVtRGVmID0gZmllbGQuZW51bURlZjtcbiAgICAgICAgICAgICAgICBpZiAoZW51bURlZikge1xuICAgICAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgJHtmaWVsZC5uYW1lfV9uYW1lOiBlbnVtTmFtZSgnJHtmaWVsZC5uYW1lfScsICR7c3RyaW5naWZ5RW51bVZhbHVlcyhlbnVtRGVmLnZhbHVlcyl9KSxgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGZpZWxkLmZvcm1hdHRlcikge1xuICAgICAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgJHtmaWVsZC5uYW1lfV9zdHJpbmc6IHN0cmluZ0NvbXBhbmlvbignJHtmaWVsZC5uYW1lfScpLGApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIH0ke3R5cGUuY29sbGVjdGlvbiA/ICcsIHRydWUnIDogJyd9KTtcblxuICAgIGApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkpTVW5pb25SZXNvbHZlcih0eXBlOiBEYlR5cGUpIHtcbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgY29uc3QgJHt0eXBlLm5hbWV9UmVzb2x2ZXIgPSB7XG4gICAgICAgICAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xuICAgICAgICBgKTtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgodmFyaWFudCkgPT4ge1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICBpZiAoJyR7dmFyaWFudC5uYW1lfScgaW4gb2JqKSB7YCk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICByZXR1cm4gJyR7dW5pb25WYXJpYW50VHlwZSh0eXBlLCB2YXJpYW50KX0nO2ApO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICB9YCk7XG4gICAgICAgIH0pO1xuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkpTRmlsdGVyKHR5cGU6IERiVHlwZSwganNOYW1lczogU2V0PHN0cmluZz4pIHtcbiAgICAgICAgaWYgKHR5cGUuZmllbGRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS51bmlvbikge1xuICAgICAgICAgICAgLy8gZ2VuSlNGaWx0ZXJzRm9yVW5pb25WYXJpYW50cyh0eXBlLCBqc05hbWVzKTtcbiAgICAgICAgfVxuICAgICAgICBnZW5KU0ZpbHRlcnNGb3JBcnJheUZpZWxkcyh0eXBlLCBqc05hbWVzKTtcbiAgICAgICAgZ2VuSlNTdHJ1Y3RGaWx0ZXIodHlwZSk7XG4gICAgICAgIGlmICh0eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS51bmlvbikge1xuICAgICAgICAgICAgZ2VuSlNVbmlvblJlc29sdmVyKHR5cGUpO1xuICAgICAgICB9XG5cblxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlIGN1c3RvbSByZXNvbHZlcnMgZm9yIHR5cGVzIHdpdGg6XG4gICAgICogLSBpZCBmaWVsZFxuICAgICAqIC0gam9pbiBmaWVsZHNcbiAgICAgKiAtIHU2NCBhbmQgaGlnaGVyIGZpZWxkc1xuICAgICAqIEBwYXJhbSB0eXBlXG4gICAgICovXG4gICAgZnVuY3Rpb24gZ2VuSlNDdXN0b21SZXNvbHZlcnModHlwZTogRGJUeXBlKSB7XG4gICAgICAgIGNvbnN0IGpvaW5GaWVsZHMgPSB0eXBlLmZpZWxkcy5maWx0ZXIoeCA9PiAhIXguam9pbik7XG4gICAgICAgIGNvbnN0IGJpZ1VJbnRGaWVsZHMgPSB0eXBlLmZpZWxkcy5maWx0ZXIoKHg6IERiRmllbGQpID0+IGlzQmlnSW50KHgudHlwZSkpO1xuICAgICAgICBjb25zdCBzdHJpbmdGb3JtYXR0ZWRGaWVsZHMgPSB0eXBlLmZpZWxkcy5maWx0ZXIoKHg6IERiRmllbGQpID0+IHguZm9ybWF0dGVyKTtcbiAgICAgICAgY29uc3QgZW51bUZpZWxkcyA9IHR5cGUuZmllbGRzLmZpbHRlcih4ID0+IHguZW51bURlZik7XG4gICAgICAgIGNvbnN0IGN1c3RvbVJlc29sdmVyUmVxdWlyZWQgPSB0eXBlLmNvbGxlY3Rpb25cbiAgICAgICAgICAgIHx8IGpvaW5GaWVsZHMubGVuZ3RoID4gMFxuICAgICAgICAgICAgfHwgYmlnVUludEZpZWxkcy5sZW5ndGggPiAwXG4gICAgICAgICAgICB8fCBlbnVtRmllbGRzLmxlbmd0aCA+IDA7XG4gICAgICAgIGlmICghY3VzdG9tUmVzb2x2ZXJSZXF1aXJlZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgJHt0eXBlLm5hbWV9OiB7YCk7XG4gICAgICAgIGlmICh0eXBlLmNvbGxlY3Rpb24pIHtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oJyAgICAgICAgICAgIGlkKHBhcmVudCkgeycpO1xuICAgICAgICAgICAganMud3JpdGVMbignICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTsnKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oJyAgICAgICAgICAgIH0sJyk7XG4gICAgICAgIH1cbiAgICAgICAgam9pbkZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgY29uc3Qgam9pbiA9IGZpZWxkLmpvaW47XG4gICAgICAgICAgICBpZiAoIWpvaW4pIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBvbkZpZWxkID0gdHlwZS5maWVsZHMuZmluZCh4ID0+IHgubmFtZSA9PT0gam9pbi5vbik7XG4gICAgICAgICAgICBpZiAoIW9uRmllbGQpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyAnSm9pbiBvbiBmaWVsZCBkb2VzIG5vdCBleGlzdC4nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3Qgb24gPSBqb2luLm9uID09PSAnaWQnID8gJ19rZXknIDogKGpvaW4ub24gfHwgJ19rZXknKTtcbiAgICAgICAgICAgIGNvbnN0IHJlZk9uID0gam9pbi5yZWZPbiA9PT0gJ2lkJyA/ICdfa2V5JyA6IChqb2luLnJlZk9uIHx8ICdfa2V5Jyk7XG4gICAgICAgICAgICBjb25zdCBjb2xsZWN0aW9uID0gZmllbGQudHlwZS5jb2xsZWN0aW9uO1xuICAgICAgICAgICAgaWYgKCFjb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgJ0pvaW5lZCB0eXBlIGlzIG5vdCBhIGNvbGxlY3Rpb24uJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICR7ZmllbGQubmFtZX0ocGFyZW50LCBhcmdzLCBjb250ZXh0KSB7YCk7XG4gICAgICAgICAgICBpZiAoam9pbi5wcmVDb25kaXRpb24pIHtcbiAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAgICAgaWYgKCEoJHtqb2luLnByZUNvbmRpdGlvbn0pKSB7YCk7XG4gICAgICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtgKTtcbiAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAgICAgfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgICAgIGlmIChhcmdzLndoZW4gJiYgISR7dHlwZS5uYW1lfS50ZXN0KG51bGwsIHBhcmVudCwgYXJncy53aGVuKSkge2ApO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtgKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICAgICB9YCk7XG5cbiAgICAgICAgICAgIGlmIChmaWVsZC5hcnJheURlcHRoID09PSAwKSB7XG4gICAgICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgICAgIHJldHVybiBjb250ZXh0LmRhdGEuJHtjb2xsZWN0aW9ufS53YWl0Rm9yRG9jKHBhcmVudC4ke29ufSwgJyR7cmVmT259JywgYXJncywgY29udGV4dCk7YCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLmFycmF5RGVwdGggPT09IDEpIHtcbiAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQuZGF0YS4ke2NvbGxlY3Rpb259LndhaXRGb3JEb2NzKHBhcmVudC4ke29ufSwgJyR7cmVmT259JywgYXJncywgY29udGV4dCk7YCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93ICdKb2lucyBvbiBhIG5lc3RlZCBhcnJheXMgZG9lcyBub3Qgc3VwcG9ydGVkLic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICB9LGApO1xuICAgICAgICB9KTtcbiAgICAgICAgYmlnVUludEZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcHJlZml4TGVuZ3RoID0gZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDY0ID8gMSA6IDI7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAke2ZpZWxkLm5hbWV9KHBhcmVudCwgYXJncykge2ApO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgke3ByZWZpeExlbmd0aH0sIHBhcmVudC4ke2ZpZWxkLm5hbWV9LCBhcmdzKTtgKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgIH0sYCk7XG4gICAgICAgIH0pO1xuICAgICAgICBzdHJpbmdGb3JtYXR0ZWRGaWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICR7ZmllbGQubmFtZX1fc3RyaW5nKHBhcmVudCwgYXJncykge2ApO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgICAgIHJldHVybiAke2ZpZWxkLmZvcm1hdHRlciB8fCAnJ30ocGFyZW50LiR7ZmllbGQubmFtZX0pO2ApO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgfSxgKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGVudW1GaWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGVudW1EZWYgPSBmaWVsZC5lbnVtRGVmO1xuICAgICAgICAgICAgaWYgKGVudW1EZWYpIHtcbiAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAke2ZpZWxkLm5hbWV9X25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJyR7ZmllbGQubmFtZX0nLCAke3N0cmluZ2lmeUVudW1WYWx1ZXMoZW51bURlZi52YWx1ZXMpfSksYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgIH0sYCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuSlNTY2FsYXJGaWVsZHModHlwZTogRGJUeXBlLCBwYXJlbnRQYXRoLCBwYXJlbnREb2NQYXRoOiBzdHJpbmcpIHtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgoZmllbGQ6IERiRmllbGQpID0+IHtcbiAgICAgICAgICAgIGlmIChmaWVsZC5qb2luIHx8IGZpZWxkLmVudW1EZWYpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBkb2NOYW1lID0gKHR5cGUuY29sbGVjdGlvbiAmJiBmaWVsZC5uYW1lID09PSAnaWQnKSA/ICdfa2V5JyA6IGZpZWxkLm5hbWU7XG4gICAgICAgICAgICBjb25zdCBwYXRoID0gYCR7cGFyZW50UGF0aH0uJHtmaWVsZC5uYW1lfWA7XG4gICAgICAgICAgICBsZXQgZG9jUGF0aCA9IGAke3BhcmVudERvY1BhdGh9LiR7ZG9jTmFtZX1gO1xuICAgICAgICAgICAgaWYgKGZpZWxkLmFycmF5RGVwdGggPiAwKSB7XG4gICAgICAgICAgICAgICAgbGV0IHN1ZmZpeCA9ICdbKl0nO1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGRlcHRoID0gMTA7IGRlcHRoID4gMDsgZGVwdGggLT0gMSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzID0gYFskeycqJy5yZXBlYXQoZGVwdGgpfV1gO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZG9jUGF0aC5pbmNsdWRlcyhzKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VmZml4ID0gYFskeycqJy5yZXBlYXQoZGVwdGggKyAxKX1dYDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGRvY1BhdGggPSBgJHtkb2NQYXRofSR7c3VmZml4fWA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzd2l0Y2ggKGZpZWxkLnR5cGUuY2F0ZWdvcnkpIHtcbiAgICAgICAgICAgIGNhc2UgXCJzY2FsYXJcIjpcbiAgICAgICAgICAgICAgICBsZXQgdHlwZU5hbWU7XG4gICAgICAgICAgICAgICAgaWYgKGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLmJvb2xlYW4pIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWUgPSAnYm9vbGVhbic7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC50eXBlID09PSBzY2FsYXJUeXBlcy5mbG9hdCkge1xuICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZSA9ICdudW1iZXInO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMuaW50KSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lID0gJ251bWJlcic7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC50eXBlID09PSBzY2FsYXJUeXBlcy51aW50NjQpIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWUgPSAndWludDY0JztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLnVpbnQxMDI0KSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lID0gJ3VpbnQxMDI0JztcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZSA9ICdzdHJpbmcnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGBzY2FsYXJGaWVsZHMuc2V0KCcke3BhdGh9JywgeyB0eXBlOiAnJHt0eXBlTmFtZX0nLCBwYXRoOiAnJHtkb2NQYXRofScgfSk7YCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwic3RydWN0XCI6XG4gICAgICAgICAgICBjYXNlIFwidW5pb25cIjpcbiAgICAgICAgICAgICAgICBnZW5KU1NjYWxhckZpZWxkcyhmaWVsZC50eXBlLCBwYXRoLCBkb2NQYXRoKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG5cbiAgICBmdW5jdGlvbiBnZW5KU1R5cGVSZXNvbHZlcnNGb3JVbmlvbih0eXBlOiBEYlR5cGUpIHtcbiAgICAgICAgaWYgKHR5cGUuY2F0ZWdvcnkgPT09IERiVHlwZUNhdGVnb3J5LnVuaW9uKSB7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICR7dHlwZS5uYW1lfTogJHt0eXBlLm5hbWV9UmVzb2x2ZXIsYCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5lcmF0ZSh0eXBlczogRGJUeXBlW10pIHtcblxuICAgICAgICAvLyBHXG5cbiAgICAgICAgZy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBcIlwiXCJcbiAgICAgICAgRHVlIHRvIEdyYXBoUUwgbGltaXRhdGlvbnMgYmlnIG51bWJlcnMgYXJlIHJldHVybmVkIGFzIGEgc3RyaW5nLlxuICAgICAgICBZb3UgY2FuIHNwZWNpZnkgZm9ybWF0IHVzZWQgdG8gc3RyaW5nIHJlcHJlc2VudGF0aW9uIGZvciBiaWcgaW50ZWdlcnMuXG4gICAgICAgIFwiXCJcIlxuICAgICAgICBlbnVtIEJpZ0ludEZvcm1hdCB7XG4gICAgICAgICAgICBcIiBIZXhhZGVjaW1hbCByZXByZXNlbnRhdGlvbiBzdGFydGVkIHdpdGggMHggKGRlZmF1bHQpIFwiXG4gICAgICAgICAgICBIRVhcbiAgICAgICAgICAgIFwiIERlY2ltYWwgcmVwcmVzZW50YXRpb24gXCJcbiAgICAgICAgICAgIERFQ1xuICAgICAgICB9XG4gICAgICAgIGApO1xuICAgICAgICBbJ1N0cmluZycsICdCb29sZWFuJywgJ0ludCcsICdGbG9hdCddLmZvckVhY2goZ2VuR1NjYWxhclR5cGVzRmlsdGVyKTtcbiAgICAgICAgZ2VuR0VudW1UeXBlcygpO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKHR5cGUgPT4gZ2VuR1R5cGVEZWNsYXJhdGlvbih0eXBlKSk7XG4gICAgICAgIGNvbnN0IGdBcnJheUZpbHRlcnMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICAgICAgdHlwZXMuZm9yRWFjaCh0eXBlID0+IGdlbkdGaWx0ZXIodHlwZSwgZ0FycmF5RmlsdGVycykpO1xuXG4gICAgICAgIGNvbnN0IGNvbGxlY3Rpb25zID0gdHlwZXMuZmlsdGVyKHQgPT4gISF0LmNvbGxlY3Rpb24pO1xuICAgICAgICBnZW5HUXVlcmllcyhjb2xsZWN0aW9ucyk7XG4gICAgICAgIGdlbkdTdWJzY3JpcHRpb25zKGNvbGxlY3Rpb25zKTtcblxuICAgICAgICAvLyBKU1xuXG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIGNvbnN0IHtcbiAgICAgICAgICAgIHNjYWxhcixcbiAgICAgICAgICAgIGJpZ1VJbnQxLFxuICAgICAgICAgICAgYmlnVUludDIsXG4gICAgICAgICAgICBzdHJpbmdMb3dlckZpbHRlcixcbiAgICAgICAgICAgIHJlc29sdmVCaWdVSW50LFxuICAgICAgICAgICAgc3RydWN0LFxuICAgICAgICAgICAgYXJyYXksXG4gICAgICAgICAgICBqb2luLFxuICAgICAgICAgICAgam9pbkFycmF5LFxuICAgICAgICAgICAgZW51bU5hbWUsXG4gICAgICAgICAgICBzdHJpbmdDb21wYW5pb24sXG4gICAgICAgICAgICBjcmVhdGVFbnVtTmFtZVJlc29sdmVyLFxuICAgICAgICAgICAgdW5peE1pbGxpc2Vjb25kc1RvU3RyaW5nLFxuICAgICAgICAgICAgdW5peFNlY29uZHNUb1N0cmluZyxcbiAgICAgICAgfSA9IHJlcXVpcmUoJy4uL2ZpbHRlci9maWx0ZXJzLmpzJyk7XG4gICAgICAgIGApO1xuICAgICAgICBjb25zdCBqc0FycmF5RmlsdGVycyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKHR5cGUgPT4gZ2VuSlNGaWx0ZXIodHlwZSwganNBcnJheUZpbHRlcnMpKTtcblxuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBmdW5jdGlvbiBjcmVhdGVSZXNvbHZlcnMoZGF0YSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgYCk7XG4gICAgICAgIHR5cGVzLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICAgICAgICAgIGdlbkpTQ3VzdG9tUmVzb2x2ZXJzKHR5cGUpO1xuICAgICAgICAgICAgZ2VuSlNUeXBlUmVzb2x2ZXJzRm9yVW5pb24odHlwZSk7XG4gICAgICAgIH0pO1xuICAgICAgICBqcy53cml0ZUxuKCcgICAgICAgIFF1ZXJ5OiB7Jyk7XG4gICAgICAgIGNvbGxlY3Rpb25zLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICR7dHlwZS5jb2xsZWN0aW9uIHx8ICcnfTogZGF0YS4ke3R5cGUuY29sbGVjdGlvbiB8fCAnJ30ucXVlcnlSZXNvbHZlcigpLGApXG4gICAgICAgIH0pO1xuICAgICAgICBqcy53cml0ZUxuKCcgICAgICAgIH0sJyk7XG4gICAgICAgIGpzLndyaXRlTG4oJyAgICAgICAgU3Vic2NyaXB0aW9uOiB7Jyk7XG4gICAgICAgIGNvbGxlY3Rpb25zLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICR7dHlwZS5jb2xsZWN0aW9uIHx8ICcnfTogZGF0YS4ke3R5cGUuY29sbGVjdGlvbiB8fCAnJ30uc3Vic2NyaXB0aW9uUmVzb2x2ZXIoKSxgKVxuICAgICAgICB9KTtcbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBgKTtcblxuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBjb25zdCBzY2FsYXJGaWVsZHMgPSBuZXcgTWFwKCk7XG4gICAgICAgIGApO1xuICAgICAgICBjb2xsZWN0aW9ucy5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgICAgICAgICBnZW5KU1NjYWxhckZpZWxkcyh0eXBlLCB0eXBlLmNvbGxlY3Rpb24gfHwgJycsICdkb2MnKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgICAgICAgICBzY2FsYXJGaWVsZHMsXG4gICAgICAgICAgICBjcmVhdGVSZXNvbHZlcnMsXG4gICAgICAgIGApO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKHR5cGUgPT4ganMud3JpdGVMbihgICAgICR7dHlwZS5uYW1lfSxgKSk7XG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIH07XG4gICAgICAgIGApO1xuICAgIH1cblxuICAgIGdlbmVyYXRlKGRiVHlwZXMpO1xuXG4gICAgZm9yIChjb25zdCBlOiBJbnRFbnVtRGVmIG9mIGVudW1UeXBlcy52YWx1ZXMoKSkge1xuICAgICAgICBjb25zb2xlLmxvZyhgZXhwb3J0IGNvbnN0IFEke2UubmFtZX0gPSB7YCk7XG4gICAgICAgIGNvbnNvbGUubG9nKE9iamVjdC5lbnRyaWVzKGUudmFsdWVzKS5tYXAoKFtuYW1lLCB2YWx1ZV0pID0+IHtcbiAgICAgICAgICAgIHJldHVybiBgICAgICR7bmFtZX06ICR7KHZhbHVlOiBhbnkpfSxgO1xuICAgICAgICB9KS5qb2luKCdcXG4nKSk7XG4gICAgICAgIGNvbnNvbGUubG9nKGB9O1xcbmApO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIHFsOiBnLmdlbmVyYXRlZCgpLFxuICAgICAgICBqczoganMuZ2VuZXJhdGVkKCksXG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBtYWluO1xuIl19