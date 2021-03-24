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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9tYWludGFuYW5jZS9nZW4tZ3JhcGhxbC9xbC1qcy1nZW5lcmF0b3IuanMiXSwibmFtZXMiOlsiY29tcGFyZUZpZWxkcyIsImEiLCJiIiwibmFtZSIsIm1haW4iLCJzY2hlbWFEZWYiLCJ0eXBlcyIsImRiVHlwZXMiLCJlbnVtVHlwZXMiLCJmb3JFYWNoIiwiZGJUeXBlIiwiZmllbGRzIiwic29ydCIsImciLCJXcml0ZXIiLCJqcyIsImdlbkdEb2MiLCJwcmVmaXgiLCJkb2MiLCJ0cmltIiwibGluZXMiLCJzcGxpdCIsImxlbmd0aCIsImluY2x1ZGVzIiwid3JpdGVMbiIsImxpbmUiLCJ1bmlvblZhcmlhbnRUeXBlIiwidHlwZSIsInZhcmlhbnQiLCJnZW5HVHlwZURlY2xhcmF0aW9uc0ZvclVuaW9uVmFyaWFudHMiLCJ3cml0ZUJsb2NrTG4iLCJnZW5HRW51bVR5cGVzIiwiZW51bURlZiIsInZhbHVlcyIsIk9iamVjdCIsImtleXMiLCJnZW5HVHlwZURlY2xhcmF0aW9uIiwiY2F0ZWdvcnkiLCJEYlR5cGVDYXRlZ29yeSIsInVuaW9uIiwiZmllbGQiLCJ0eXBlRGVjbGFyYXRpb24iLCJyZXBlYXQiLCJhcnJheURlcHRoIiwicGFyYW1zIiwiam9pbiIsImZvcm1hdHRlciIsInByZXZlbnRUd2ljZSIsIm5hbWVzIiwid29yayIsImhhcyIsImFkZCIsImdlbkdGaWx0ZXJzRm9yQXJyYXlGaWVsZHMiLCJnTmFtZXMiLCJpdGVtVHlwZU5hbWUiLCJpIiwiZmlsdGVyTmFtZSIsIm9wIiwiZ2VuR0ZpbHRlcnNGb3JFbnVtTmFtZUZpZWxkcyIsImdlbkdTY2FsYXJUeXBlc0ZpbHRlciIsImdlbkdGaWx0ZXIiLCJnZW5HUXVlcmllcyIsImNvbGxlY3Rpb24iLCJnZW5HU3Vic2NyaXB0aW9ucyIsImdldFNjYWxhclJlc29sdmVyTmFtZSIsInNjYWxhclR5cGVzIiwidWludDY0IiwidWludDEwMjQiLCJzdHJpbmciLCJsb3dlckZpbHRlciIsImdlbkpTRmlsdGVyc0ZvckFycmF5RmllbGRzIiwianNOYW1lcyIsIml0ZW1SZXNvbHZlck5hbWUiLCJzY2FsYXIiLCJnZW5KU1N0cnVjdEZpbHRlciIsInN1ZmZpeCIsIm9uIiwicmVmT24iLCJnZW5KU1VuaW9uUmVzb2x2ZXIiLCJnZW5KU0ZpbHRlciIsImdlbkpTQ3VzdG9tUmVzb2x2ZXJzIiwiam9pbkZpZWxkcyIsImZpbHRlciIsIngiLCJiaWdVSW50RmllbGRzIiwic3RyaW5nRm9ybWF0dGVkRmllbGRzIiwiZW51bUZpZWxkcyIsImN1c3RvbVJlc29sdmVyUmVxdWlyZWQiLCJvbkZpZWxkIiwiZmluZCIsInByZUNvbmRpdGlvbiIsInByZWZpeExlbmd0aCIsImdlbkpTU2NhbGFyRmllbGRzIiwicGFyZW50UGF0aCIsInBhcmVudERvY1BhdGgiLCJkb2NOYW1lIiwicGF0aCIsImRvY1BhdGgiLCJkZXB0aCIsInMiLCJ0eXBlTmFtZSIsImJvb2xlYW4iLCJmbG9hdCIsImludCIsImdlbkpTVHlwZVJlc29sdmVyc0ZvclVuaW9uIiwiZ2VuZXJhdGUiLCJnQXJyYXlGaWx0ZXJzIiwiU2V0IiwiY29sbGVjdGlvbnMiLCJ0IiwianNBcnJheUZpbHRlcnMiLCJlIiwiY29uc29sZSIsImxvZyIsImVudHJpZXMiLCJtYXAiLCJ2YWx1ZSIsInFsIiwiZ2VuZXJhdGVkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBRUE7O0FBR0E7O0FBUUEsU0FBU0EsYUFBVCxDQUF1QkMsQ0FBdkIsRUFBbUNDLENBQW5DLEVBQXVEO0FBQ25ELE1BQUlELENBQUMsQ0FBQ0UsSUFBRixLQUFXLElBQWYsRUFBcUI7QUFDakIsV0FBT0QsQ0FBQyxDQUFDQyxJQUFGLEtBQVcsSUFBWCxHQUFrQixDQUFsQixHQUFzQixDQUFDLENBQTlCO0FBQ0g7O0FBQ0QsTUFBSUQsQ0FBQyxDQUFDQyxJQUFGLEtBQVcsSUFBZixFQUFxQjtBQUNqQixXQUFPLENBQVA7QUFDSDs7QUFDRCxTQUFRRixDQUFDLENBQUNFLElBQUYsS0FBV0QsQ0FBQyxDQUFD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T0FBTyxDQUFDQyxHQUFSLENBQWEsTUFBYjtBQUNIOztBQUVELFNBQU87QUFDSEksSUFBQUEsRUFBRSxFQUFFeEcsQ0FBQyxDQUFDeUcsU0FBRixFQUREO0FBRUh2RyxJQUFBQSxFQUFFLEVBQUVBLEVBQUUsQ0FBQ3VHLFNBQUg7QUFGRCxHQUFQO0FBSUg7O2VBRWNsSCxJIiwic291cmNlc0NvbnRlbnQiOlsiLy9AZmxvd1xuXG5pbXBvcnQgeyBXcml0ZXIgfSBmcm9tICcuL2dlbi5qcyc7XG5pbXBvcnQgdHlwZSB7IFR5cGVEZWYgfSBmcm9tICcuLi8uLi9zZXJ2ZXIvc2NoZW1hL3NjaGVtYS5qcyc7XG5pbXBvcnQgdHlwZSB7IERiRmllbGQsIERiVHlwZSwgSW50RW51bURlZiB9IGZyb20gJy4uLy4uL3NlcnZlci9zY2hlbWEvZGItc2NoZW1hLXR5cGVzJztcbmltcG9ydCB7XG4gICAgRGJUeXBlQ2F0ZWdvcnksXG4gICAgaXNCaWdJbnQsIHBhcnNlRGJTY2hlbWEsXG4gICAgc2NhbGFyVHlwZXMsXG4gICAgc3RyaW5naWZ5RW51bVZhbHVlcyxcbiAgICB0b0VudW1TdHlsZSxcbn0gZnJvbSAnLi4vLi4vc2VydmVyL3NjaGVtYS9kYi1zY2hlbWEtdHlwZXMnO1xuXG5mdW5jdGlvbiBjb21wYXJlRmllbGRzKGE6IERiRmllbGQsIGI6IERiRmllbGQpOiBudW1iZXIge1xuICAgIGlmIChhLm5hbWUgPT09IFwiaWRcIikge1xuICAgICAgICByZXR1cm4gYi5uYW1lID09PSBcImlkXCIgPyAwIDogLTE7XG4gICAgfVxuICAgIGlmIChiLm5hbWUgPT09IFwiaWRcIikge1xuICAgICAgICByZXR1cm4gMTtcbiAgICB9XG4gICAgcmV0dXJuIChhLm5hbWUgPT09IGIubmFtZSkgPyAwIDogKGEubmFtZSA8IGIubmFtZSA/IC0xIDogMSk7XG59XG5cbmZ1bmN0aW9uIG1haW4oc2NoZW1hRGVmOiBUeXBlRGVmKSB7XG4gICAgY29uc3QgeyB0eXBlczogZGJUeXBlcywgZW51bVR5cGVzIH0gPSBwYXJzZURiU2NoZW1hKHNjaGVtYURlZik7XG4gICAgZGJUeXBlcy5mb3JFYWNoKChkYlR5cGU6IERiVHlwZSkgPT4ge1xuICAgICAgICBkYlR5cGUuZmllbGRzLnNvcnQoY29tcGFyZUZpZWxkcyk7XG4gICAgfSk7XG5cbi8vIEdlbmVyYXRvcnNcblxuICAgIGNvbnN0IGcgPSBuZXcgV3JpdGVyKCk7XG4gICAgY29uc3QganMgPSBuZXcgV3JpdGVyKCk7XG5cbiAgICBmdW5jdGlvbiBnZW5HRG9jKHByZWZpeDogc3RyaW5nLCBkb2M6IHN0cmluZykge1xuICAgICAgICBpZiAoZG9jLnRyaW0oKSA9PT0gJycpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBsaW5lcyA9IGRvYy5zcGxpdCgvXFxuXFxyP3xcXHJcXG4/Lyk7XG4gICAgICAgIGlmIChsaW5lcy5sZW5ndGggPT09IDEgJiYgIWxpbmVzWzBdLmluY2x1ZGVzKCdcIicpKSB7XG4gICAgICAgICAgICBnLndyaXRlTG4ocHJlZml4LCAnXCInLCBsaW5lc1swXSwgJ1wiJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBnLndyaXRlTG4ocHJlZml4LCAnXCJcIlwiJyk7XG4gICAgICAgICAgICBsaW5lcy5mb3JFYWNoKChsaW5lKSA9PiB7XG4gICAgICAgICAgICAgICAgZy53cml0ZUxuKHByZWZpeCwgbGluZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGcud3JpdGVMbihwcmVmaXgsICdcIlwiXCInKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHVuaW9uVmFyaWFudFR5cGUodHlwZTogRGJUeXBlLCB2YXJpYW50OiBEYkZpZWxkKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIGAke3R5cGUubmFtZX0ke3ZhcmlhbnQubmFtZX1WYXJpYW50YDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5HVHlwZURlY2xhcmF0aW9uc0ZvclVuaW9uVmFyaWFudHModHlwZTogRGJUeXBlKSB7XG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKHZhcmlhbnQpID0+IHtcbiAgICAgICAgICAgIGcud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgdHlwZSAke3VuaW9uVmFyaWFudFR5cGUodHlwZSwgdmFyaWFudCl9IHtcbiAgICAgICAgICAgICR7dmFyaWFudC5uYW1lfTogJHt2YXJpYW50LnR5cGUubmFtZX1cbiAgICAgICAgfVxuXG4gICAgICAgIGApO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5HRW51bVR5cGVzKCkge1xuICAgICAgICBmb3IgKGNvbnN0IGVudW1EZWY6IEludEVudW1EZWYgb2YgZW51bVR5cGVzLnZhbHVlcygpKSB7XG4gICAgICAgICAgICBnLndyaXRlTG4oYGVudW0gJHtlbnVtRGVmLm5hbWV9RW51bSB7YCk7XG4gICAgICAgICAgICBPYmplY3Qua2V5cyhlbnVtRGVmLnZhbHVlcykuZm9yRWFjaCgobmFtZSkgPT4ge1xuICAgICAgICAgICAgICAgIGcud3JpdGVMbihgICAgICR7dG9FbnVtU3R5bGUobmFtZSl9YCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGcud3JpdGVMbihgfWApO1xuICAgICAgICAgICAgZy53cml0ZUxuKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5HVHlwZURlY2xhcmF0aW9uKHR5cGU6IERiVHlwZSkge1xuICAgICAgICBpZiAodHlwZS5jYXRlZ29yeSA9PT0gRGJUeXBlQ2F0ZWdvcnkudW5pb24pIHtcbiAgICAgICAgICAgIGdlbkdUeXBlRGVjbGFyYXRpb25zRm9yVW5pb25WYXJpYW50cyh0eXBlKTtcbiAgICAgICAgICAgIGcud3JpdGVMbihgdW5pb24gJHt0eXBlLm5hbWV9ID0gYCk7XG4gICAgICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKHZhcmlhbnQgPT4ge1xuICAgICAgICAgICAgICAgIGcud3JpdGVMbihgXFx0fCAke3VuaW9uVmFyaWFudFR5cGUodHlwZSwgdmFyaWFudCl9YCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGcud3JpdGVMbigpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZ2VuR0RvYygnJywgdHlwZS5kb2MpO1xuICAgICAgICAgICAgZy53cml0ZUxuKGB0eXBlICR7dHlwZS5uYW1lfSB7YCk7XG4gICAgICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKGZpZWxkID0+IHtcbiAgICAgICAgICAgICAgICBnZW5HRG9jKCdcXHQnLCBmaWVsZC5kb2MpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHR5cGVEZWNsYXJhdGlvbiA9XG4gICAgICAgICAgICAgICAgICAgICdbJy5yZXBlYXQoZmllbGQuYXJyYXlEZXB0aCkgK1xuICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlLm5hbWUgK1xuICAgICAgICAgICAgICAgICAgICAnXScucmVwZWF0KGZpZWxkLmFycmF5RGVwdGgpO1xuICAgICAgICAgICAgICAgIGxldCBwYXJhbXMgPSAnJztcbiAgICAgICAgICAgICAgICBpZiAoaXNCaWdJbnQoZmllbGQudHlwZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcGFyYW1zID0gJyhmb3JtYXQ6IEJpZ0ludEZvcm1hdCknO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQuam9pbikge1xuICAgICAgICAgICAgICAgICAgICBwYXJhbXMgPSBgKHRpbWVvdXQ6IEludCwgd2hlbjogJHt0eXBlLm5hbWV9RmlsdGVyKWA7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZy53cml0ZUxuKGBcXHQke2ZpZWxkLm5hbWV9JHtwYXJhbXN9OiAke3R5cGVEZWNsYXJhdGlvbn1gKTtcbiAgICAgICAgICAgICAgICBjb25zdCBlbnVtRGVmID0gZmllbGQuZW51bURlZjtcbiAgICAgICAgICAgICAgICBpZiAoZW51bURlZikge1xuICAgICAgICAgICAgICAgICAgICBnLndyaXRlTG4oYFxcdCR7ZmllbGQubmFtZX1fbmFtZTogJHtlbnVtRGVmLm5hbWV9RW51bWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZmllbGQuZm9ybWF0dGVyKSB7XG4gICAgICAgICAgICAgICAgICAgIGcud3JpdGVMbihgXFx0JHtmaWVsZC5uYW1lfV9zdHJpbmc6IFN0cmluZ2ApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgZy53cml0ZUxuKGB9YCk7XG4gICAgICAgIH1cbiAgICAgICAgZy53cml0ZUxuKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcHJldmVudFR3aWNlKG5hbWU6IHN0cmluZywgbmFtZXM6IFNldDxzdHJpbmc+LCB3b3JrOiAoKSA9PiB2b2lkKSB7XG4gICAgICAgIGlmICghbmFtZXMuaGFzKG5hbWUpKSB7XG4gICAgICAgICAgICBuYW1lcy5hZGQobmFtZSk7XG4gICAgICAgICAgICB3b3JrKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5HRmlsdGVyc0ZvckFycmF5RmllbGRzKHR5cGU6IERiVHlwZSwgZ05hbWVzOiBTZXQ8c3RyaW5nPikge1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgbGV0IGl0ZW1UeXBlTmFtZSA9IGZpZWxkLnR5cGUubmFtZTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZmllbGQuYXJyYXlEZXB0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmlsdGVyTmFtZSA9IGAke2l0ZW1UeXBlTmFtZX1BcnJheUZpbHRlcmA7XG4gICAgICAgICAgICAgICAgcHJldmVudFR3aWNlKGZpbHRlck5hbWUsIGdOYW1lcywgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBnLndyaXRlTG4oYGlucHV0ICR7ZmlsdGVyTmFtZX0ge2ApO1xuICAgICAgICAgICAgICAgICAgICBbJ2FueScsICdhbGwnXS5mb3JFYWNoKChvcCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgZy53cml0ZUxuKGBcXHQke29wfTogJHtpdGVtVHlwZU5hbWV9RmlsdGVyYCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBnLndyaXRlTG4oJ30nKTtcbiAgICAgICAgICAgICAgICAgICAgZy53cml0ZUxuKCk7XG5cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBpdGVtVHlwZU5hbWUgKz0gJ0FycmF5JztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuR0ZpbHRlcnNGb3JFbnVtTmFtZUZpZWxkcyh0eXBlOiBEYlR5cGUsIGdOYW1lczogU2V0PHN0cmluZz4pIHtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGVudW1EZWYgPSBmaWVsZC5lbnVtRGVmO1xuICAgICAgICAgICAgaWYgKGVudW1EZWYpIHtcbiAgICAgICAgICAgICAgICBwcmV2ZW50VHdpY2UoYCR7ZW51bURlZi5uYW1lfUVudW1GaWx0ZXJgLCBnTmFtZXMsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgZ2VuR1NjYWxhclR5cGVzRmlsdGVyKGAke2VudW1EZWYubmFtZX1FbnVtYCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkdGaWx0ZXIodHlwZTogRGJUeXBlLCBnTmFtZXM6IFNldDxzdHJpbmc+KSB7XG4gICAgICAgIGlmICh0eXBlLmZpZWxkcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBnZW5HRmlsdGVyc0ZvckFycmF5RmllbGRzKHR5cGUsIGdOYW1lcyk7XG4gICAgICAgIGdlbkdGaWx0ZXJzRm9yRW51bU5hbWVGaWVsZHModHlwZSwgZ05hbWVzKTtcbiAgICAgICAgZ2VuR0RvYygnJywgdHlwZS5kb2MpO1xuICAgICAgICBnLndyaXRlTG4oYGlucHV0ICR7dHlwZS5uYW1lfUZpbHRlciB7YCk7XG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBnZW5HRG9jKCdcXHQnLCBmaWVsZC5kb2MpO1xuICAgICAgICAgICAgY29uc3QgdHlwZURlY2xhcmF0aW9uID0gZmllbGQudHlwZS5uYW1lICsgXCJBcnJheVwiLnJlcGVhdChmaWVsZC5hcnJheURlcHRoKTtcbiAgICAgICAgICAgIGcud3JpdGVMbihgXFx0JHtmaWVsZC5uYW1lfTogJHt0eXBlRGVjbGFyYXRpb259RmlsdGVyYCk7XG4gICAgICAgICAgICBjb25zdCBlbnVtRGVmID0gZmllbGQuZW51bURlZjtcbiAgICAgICAgICAgIGlmIChlbnVtRGVmKSB7XG4gICAgICAgICAgICAgICAgZy53cml0ZUxuKGBcXHQke2ZpZWxkLm5hbWV9X25hbWU6ICR7ZW51bURlZi5uYW1lfUVudW1GaWx0ZXJgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGcud3JpdGVMbihgICAgIE9SOiAke3R5cGUubmFtZX1GaWx0ZXJgKTtcbiAgICAgICAgZy53cml0ZUxuKGB9YCk7XG4gICAgICAgIGcud3JpdGVMbigpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkdTY2FsYXJUeXBlc0ZpbHRlcihuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgZy53cml0ZUxuKGBpbnB1dCAke25hbWV9RmlsdGVyIHtgKTtcbiAgICAgICAgWydlcScsICduZScsICdndCcsICdsdCcsICdnZScsICdsZSddLmZvckVhY2goKG9wKSA9PiB7XG4gICAgICAgICAgICBnLndyaXRlTG4oYFxcdCR7b3B9OiAke25hbWV9YCk7XG4gICAgICAgIH0pO1xuICAgICAgICBbJ2luJywgJ25vdEluJ10uZm9yRWFjaCgob3ApID0+IHtcbiAgICAgICAgICAgIGcud3JpdGVMbihgXFx0JHtvcH06IFske25hbWV9XWApO1xuICAgICAgICB9KTtcbiAgICAgICAgZy53cml0ZUxuKCd9Jyk7XG4gICAgICAgIGcud3JpdGVMbigpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkdRdWVyaWVzKHR5cGVzOiBEYlR5cGVbXSkge1xuICAgICAgICBnLndyaXRlQmxvY2tMbihgXG4gICAgICAgIFwiU3BlY2lmeSBzb3J0IG9yZGVyIGRpcmVjdGlvblwiXG4gICAgICAgIGVudW0gUXVlcnlPcmRlckJ5RGlyZWN0aW9uIHtcbiAgICAgICAgICAgIFwiRG9jdW1lbnRzIHdpbGwgYmUgc29ydGVkIGluIGFzY2VuZGVkIG9yZGVyIChlLmcuIGZyb20gQSB0byBaKVwiXG4gICAgICAgICAgICBBU0NcbiAgICAgICAgICAgIFwiRG9jdW1lbnRzIHdpbGwgYmUgc29ydGVkIGluIGRlc2NlbmRhbnQgb3JkZXIgKGUuZy4gZnJvbSBaIHRvIEEpXCJcbiAgICAgICAgICAgIERFU0NcbiAgICAgICAgfVxuXG4gICAgICAgIFxuICAgICAgICBcIlwiXCJcbiAgICAgICAgU3BlY2lmeSBob3cgdG8gc29ydCByZXN1bHRzLlxuICAgICAgICBZb3UgY2FuIHNvcnQgZG9jdW1lbnRzIGluIHJlc3VsdCBzZXQgdXNpbmcgbW9yZSB0aGFuIG9uZSBmaWVsZC5cbiAgICAgICAgXCJcIlwiXG4gICAgICAgIGlucHV0IFF1ZXJ5T3JkZXJCeSB7XG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICAgIFBhdGggdG8gZmllbGQgd2hpY2ggbXVzdCBiZSB1c2VkIGFzIGEgc29ydCBjcml0ZXJpYS5cbiAgICAgICAgICAgIElmIGZpZWxkIHJlc2lkZXMgZGVlcCBpbiBzdHJ1Y3R1cmUgcGF0aCBpdGVtcyBtdXN0IGJlIHNlcGFyYXRlZCB3aXRoIGRvdCAoZS5nLiAnZm9vLmJhci5iYXonKS5cbiAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgICAgcGF0aDogU3RyaW5nXG4gICAgICAgICAgICBcIlNvcnQgb3JkZXIgZGlyZWN0aW9uXCJcbiAgICAgICAgICAgIGRpcmVjdGlvbjogUXVlcnlPcmRlckJ5RGlyZWN0aW9uXG4gICAgICAgIH1cblxuICAgICAgICB0eXBlIFF1ZXJ5IHtcbiAgICAgICAgYCk7XG5cbiAgICAgICAgdHlwZXMuZm9yRWFjaCgodHlwZTogRGJUeXBlKSA9PiB7XG4gICAgICAgICAgICBnLndyaXRlTG4oYFxcdCR7dHlwZS5jb2xsZWN0aW9uIHx8ICcnfShmaWx0ZXI6ICR7dHlwZS5uYW1lfUZpbHRlciwgb3JkZXJCeTogW1F1ZXJ5T3JkZXJCeV0sIGxpbWl0OiBJbnQsIHRpbWVvdXQ6IEZsb2F0LCBhY2Nlc3NLZXk6IFN0cmluZywgb3BlcmF0aW9uSWQ6IFN0cmluZyk6IFske3R5cGUubmFtZX1dYCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGcud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgfVxuXG4gICAgICAgIGApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkdTdWJzY3JpcHRpb25zKHR5cGVzOiBEYlR5cGVbXSkge1xuICAgICAgICBnLndyaXRlTG4oJ3R5cGUgU3Vic2NyaXB0aW9uIHsnKTtcbiAgICAgICAgdHlwZXMuZm9yRWFjaCgodHlwZSkgPT4ge1xuICAgICAgICAgICAgZy53cml0ZUxuKGBcXHQke3R5cGUuY29sbGVjdGlvbiB8fCAnJ30oZmlsdGVyOiAke3R5cGUubmFtZX1GaWx0ZXIsIGFjY2Vzc0tleTogU3RyaW5nKTogJHt0eXBlLm5hbWV9YCk7XG4gICAgICAgIH0pO1xuICAgICAgICBnLndyaXRlTG4oJ30nKTtcbiAgICB9XG5cblxuICAgIGZ1bmN0aW9uIGdldFNjYWxhclJlc29sdmVyTmFtZShmaWVsZDogRGJGaWVsZCk6IHN0cmluZyB7XG4gICAgICAgIGlmIChmaWVsZC50eXBlID09PSBzY2FsYXJUeXBlcy51aW50NjQpIHtcbiAgICAgICAgICAgIHJldHVybiAnYmlnVUludDEnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChmaWVsZC50eXBlID09PSBzY2FsYXJUeXBlcy51aW50MTAyNCkge1xuICAgICAgICAgICAgcmV0dXJuICdiaWdVSW50Mic7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLnN0cmluZyAmJiBmaWVsZC5sb3dlckZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuICdzdHJpbmdMb3dlckZpbHRlcic7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICdzY2FsYXInO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkpTRmlsdGVyc0ZvckFycmF5RmllbGRzKHR5cGU6IERiVHlwZSwganNOYW1lczogU2V0PHN0cmluZz4pIHtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGxldCBpdGVtVHlwZU5hbWUgPSBmaWVsZC50eXBlLm5hbWU7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZpZWxkLmFycmF5RGVwdGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpbHRlck5hbWUgPSBgJHtpdGVtVHlwZU5hbWV9QXJyYXlgO1xuICAgICAgICAgICAgICAgIHByZXZlbnRUd2ljZShmaWx0ZXJOYW1lLCBqc05hbWVzLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1SZXNvbHZlck5hbWUgPSAoaSA9PT0gMCAmJiBmaWVsZC50eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS5zY2FsYXIpXG4gICAgICAgICAgICAgICAgICAgICAgICA/IGdldFNjYWxhclJlc29sdmVyTmFtZShmaWVsZClcbiAgICAgICAgICAgICAgICAgICAgICAgIDogaXRlbVR5cGVOYW1lO1xuICAgICAgICAgICAgICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICAgICAgICAgIGNvbnN0ICR7ZmlsdGVyTmFtZX0gPSBhcnJheSgoKSA9PiAke2l0ZW1SZXNvbHZlck5hbWV9KTtcbiAgICAgICAgICAgICAgICBgKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBpdGVtVHlwZU5hbWUgKz0gJ0FycmF5JztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuSlNTdHJ1Y3RGaWx0ZXIodHlwZTogRGJUeXBlKSB7XG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIGNvbnN0ICR7dHlwZS5uYW1lfSA9IHN0cnVjdCh7XG4gICAgYCk7XG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKGZpZWxkOiBEYkZpZWxkKSA9PiB7XG4gICAgICAgICAgICBsZXQgdHlwZURlY2xhcmF0aW9uOiA/c3RyaW5nID0gbnVsbDtcbiAgICAgICAgICAgIGNvbnN0IGpvaW4gPSBmaWVsZC5qb2luO1xuICAgICAgICAgICAgaWYgKGpvaW4pIHtcbiAgICAgICAgICAgICAgICBjb25zdCBzdWZmaXggPSBmaWVsZC5hcnJheURlcHRoID4gMCA/ICdBcnJheScgOiAnJztcbiAgICAgICAgICAgICAgICB0eXBlRGVjbGFyYXRpb24gPSBgam9pbiR7c3VmZml4fSgnJHtqb2luLm9ufScsICcke2pvaW4ucmVmT259JywgJyR7ZmllbGQudHlwZS5jb2xsZWN0aW9uIHx8ICcnfScsICgpID0+ICR7ZmllbGQudHlwZS5uYW1lfSlgO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC5hcnJheURlcHRoID4gMCkge1xuICAgICAgICAgICAgICAgIHR5cGVEZWNsYXJhdGlvbiA9XG4gICAgICAgICAgICAgICAgICAgIGZpZWxkLnR5cGUubmFtZSArXG4gICAgICAgICAgICAgICAgICAgICdBcnJheScucmVwZWF0KGZpZWxkLmFycmF5RGVwdGgpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC50eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS5zY2FsYXIpIHtcbiAgICAgICAgICAgICAgICB0eXBlRGVjbGFyYXRpb24gPSBnZXRTY2FsYXJSZXNvbHZlck5hbWUoZmllbGQpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC50eXBlLmZpZWxkcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgdHlwZURlY2xhcmF0aW9uID0gZmllbGQudHlwZS5uYW1lO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHR5cGVEZWNsYXJhdGlvbikge1xuICAgICAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAke2ZpZWxkLm5hbWV9OiAke3R5cGVEZWNsYXJhdGlvbn0sYCk7XG4gICAgICAgICAgICAgICAgY29uc3QgZW51bURlZiA9IGZpZWxkLmVudW1EZWY7XG4gICAgICAgICAgICAgICAgaWYgKGVudW1EZWYpIHtcbiAgICAgICAgICAgICAgICAgICAganMud3JpdGVMbihgICAgICR7ZmllbGQubmFtZX1fbmFtZTogZW51bU5hbWUoJyR7ZmllbGQubmFtZX0nLCAke3N0cmluZ2lmeUVudW1WYWx1ZXMoZW51bURlZi52YWx1ZXMpfSksYCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChmaWVsZC5mb3JtYXR0ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAganMud3JpdGVMbihgICAgICR7ZmllbGQubmFtZX1fc3RyaW5nOiBzdHJpbmdDb21wYW5pb24oJyR7ZmllbGQubmFtZX0nKSxgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICB9JHt0eXBlLmNvbGxlY3Rpb24gPyAnLCB0cnVlJyA6ICcnfSk7XG5cbiAgICBgKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5KU1VuaW9uUmVzb2x2ZXIodHlwZTogRGJUeXBlKSB7XG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIGNvbnN0ICR7dHlwZS5uYW1lfVJlc29sdmVyID0ge1xuICAgICAgICAgICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgYCk7XG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKHZhcmlhbnQpID0+IHtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgaWYgKCcke3ZhcmlhbnQubmFtZX0nIGluIG9iaikge2ApO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgcmV0dXJuICcke3VuaW9uVmFyaWFudFR5cGUodHlwZSwgdmFyaWFudCl9JztgKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgfWApO1xuICAgICAgICB9KTtcbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBgKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5KU0ZpbHRlcih0eXBlOiBEYlR5cGUsIGpzTmFtZXM6IFNldDxzdHJpbmc+KSB7XG4gICAgICAgIGlmICh0eXBlLmZpZWxkcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZS5jYXRlZ29yeSA9PT0gRGJUeXBlQ2F0ZWdvcnkudW5pb24pIHtcbiAgICAgICAgICAgIC8vIGdlbkpTRmlsdGVyc0ZvclVuaW9uVmFyaWFudHModHlwZSwganNOYW1lcyk7XG4gICAgICAgIH1cbiAgICAgICAgZ2VuSlNGaWx0ZXJzRm9yQXJyYXlGaWVsZHModHlwZSwganNOYW1lcyk7XG4gICAgICAgIGdlbkpTU3RydWN0RmlsdGVyKHR5cGUpO1xuICAgICAgICBpZiAodHlwZS5jYXRlZ29yeSA9PT0gRGJUeXBlQ2F0ZWdvcnkudW5pb24pIHtcbiAgICAgICAgICAgIGdlbkpTVW5pb25SZXNvbHZlcih0eXBlKTtcbiAgICAgICAgfVxuXG5cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZW5lcmF0ZSBjdXN0b20gcmVzb2x2ZXJzIGZvciB0eXBlcyB3aXRoOlxuICAgICAqIC0gaWQgZmllbGRcbiAgICAgKiAtIGpvaW4gZmllbGRzXG4gICAgICogLSB1NjQgYW5kIGhpZ2hlciBmaWVsZHNcbiAgICAgKiBAcGFyYW0gdHlwZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGdlbkpTQ3VzdG9tUmVzb2x2ZXJzKHR5cGU6IERiVHlwZSkge1xuICAgICAgICBjb25zdCBqb2luRmllbGRzID0gdHlwZS5maWVsZHMuZmlsdGVyKHggPT4gISF4LmpvaW4pO1xuICAgICAgICBjb25zdCBiaWdVSW50RmllbGRzID0gdHlwZS5maWVsZHMuZmlsdGVyKCh4OiBEYkZpZWxkKSA9PiBpc0JpZ0ludCh4LnR5cGUpKTtcbiAgICAgICAgY29uc3Qgc3RyaW5nRm9ybWF0dGVkRmllbGRzID0gdHlwZS5maWVsZHMuZmlsdGVyKCh4OiBEYkZpZWxkKSA9PiB4LmZvcm1hdHRlcik7XG4gICAgICAgIGNvbnN0IGVudW1GaWVsZHMgPSB0eXBlLmZpZWxkcy5maWx0ZXIoeCA9PiB4LmVudW1EZWYpO1xuICAgICAgICBjb25zdCBjdXN0b21SZXNvbHZlclJlcXVpcmVkID0gdHlwZS5jb2xsZWN0aW9uXG4gICAgICAgICAgICB8fCBqb2luRmllbGRzLmxlbmd0aCA+IDBcbiAgICAgICAgICAgIHx8IGJpZ1VJbnRGaWVsZHMubGVuZ3RoID4gMFxuICAgICAgICAgICAgfHwgZW51bUZpZWxkcy5sZW5ndGggPiAwO1xuICAgICAgICBpZiAoIWN1c3RvbVJlc29sdmVyUmVxdWlyZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICR7dHlwZS5uYW1lfToge2ApO1xuICAgICAgICBpZiAodHlwZS5jb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICBqcy53cml0ZUxuKCcgICAgICAgICAgICBpZChwYXJlbnQpIHsnKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oJyAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7Jyk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKCcgICAgICAgICAgICB9LCcpO1xuICAgICAgICB9XG4gICAgICAgIGpvaW5GaWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGpvaW4gPSBmaWVsZC5qb2luO1xuICAgICAgICAgICAgaWYgKCFqb2luKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3Qgb25GaWVsZCA9IHR5cGUuZmllbGRzLmZpbmQoeCA9PiB4Lm5hbWUgPT09IGpvaW4ub24pO1xuICAgICAgICAgICAgaWYgKCFvbkZpZWxkKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgJ0pvaW4gb24gZmllbGQgZG9lcyBub3QgZXhpc3QuJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IG9uID0gam9pbi5vbiA9PT0gJ2lkJyA/ICdfa2V5JyA6IChqb2luLm9uIHx8ICdfa2V5Jyk7XG4gICAgICAgICAgICBjb25zdCByZWZPbiA9IGpvaW4ucmVmT24gPT09ICdpZCcgPyAnX2tleScgOiAoam9pbi5yZWZPbiB8fCAnX2tleScpO1xuICAgICAgICAgICAgY29uc3QgY29sbGVjdGlvbiA9IGZpZWxkLnR5cGUuY29sbGVjdGlvbjtcbiAgICAgICAgICAgIGlmICghY29sbGVjdGlvbikge1xuICAgICAgICAgICAgICAgIHRocm93ICdKb2luZWQgdHlwZSBpcyBub3QgYSBjb2xsZWN0aW9uLic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAke2ZpZWxkLm5hbWV9KHBhcmVudCwgYXJncywgY29udGV4dCkge2ApO1xuICAgICAgICAgICAgaWYgKGpvaW4ucHJlQ29uZGl0aW9uKSB7XG4gICAgICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgICAgIGlmICghKCR7am9pbi5wcmVDb25kaXRpb259KSkge2ApO1xuICAgICAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7YCk7XG4gICAgICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgICAgIH1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICAgICBpZiAoYXJncy53aGVuICYmICEke3R5cGUubmFtZX0udGVzdChudWxsLCBwYXJlbnQsIGFyZ3Mud2hlbikpIHtgKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7YCk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAgICAgfWApO1xuXG4gICAgICAgICAgICBpZiAoZmllbGQuYXJyYXlEZXB0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICAgICByZXR1cm4gY29udGV4dC5kYXRhLiR7Y29sbGVjdGlvbn0ud2FpdEZvckRvYyhwYXJlbnQuJHtvbn0sICcke3JlZk9ufScsIGFyZ3MsIGNvbnRleHQpO2ApO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC5hcnJheURlcHRoID09PSAxKSB7XG4gICAgICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgICAgIHJldHVybiBjb250ZXh0LmRhdGEuJHtjb2xsZWN0aW9ufS53YWl0Rm9yRG9jcyhwYXJlbnQuJHtvbn0sICcke3JlZk9ufScsIGFyZ3MsIGNvbnRleHQpO2ApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyAnSm9pbnMgb24gYSBuZXN0ZWQgYXJyYXlzIGRvZXMgbm90IHN1cHBvcnRlZC4nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgfSxgKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGJpZ1VJbnRGaWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHByZWZpeExlbmd0aCA9IGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLnVpbnQ2NCA/IDEgOiAyO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgJHtmaWVsZC5uYW1lfShwYXJlbnQsIGFyZ3MpIHtgKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoJHtwcmVmaXhMZW5ndGh9LCBwYXJlbnQuJHtmaWVsZC5uYW1lfSwgYXJncyk7YCk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICB9LGApO1xuICAgICAgICB9KTtcbiAgICAgICAgc3RyaW5nRm9ybWF0dGVkRmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAke2ZpZWxkLm5hbWV9X3N0cmluZyhwYXJlbnQsIGFyZ3MpIHtgKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICAgICByZXR1cm4gJHtmaWVsZC5mb3JtYXR0ZXIgfHwgJyd9KHBhcmVudC4ke2ZpZWxkLm5hbWV9KTtgKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgIH0sYCk7XG4gICAgICAgIH0pO1xuICAgICAgICBlbnVtRmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBlbnVtRGVmID0gZmllbGQuZW51bURlZjtcbiAgICAgICAgICAgIGlmIChlbnVtRGVmKSB7XG4gICAgICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgJHtmaWVsZC5uYW1lfV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCcke2ZpZWxkLm5hbWV9JywgJHtzdHJpbmdpZnlFbnVtVmFsdWVzKGVudW1EZWYudmFsdWVzKX0pLGApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAganMud3JpdGVMbihgICAgICAgICB9LGApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkpTU2NhbGFyRmllbGRzKHR5cGU6IERiVHlwZSwgcGFyZW50UGF0aCwgcGFyZW50RG9jUGF0aDogc3RyaW5nKSB7XG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKGZpZWxkOiBEYkZpZWxkKSA9PiB7XG4gICAgICAgICAgICBpZiAoZmllbGQuam9pbiB8fCBmaWVsZC5lbnVtRGVmKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgZG9jTmFtZSA9ICh0eXBlLmNvbGxlY3Rpb24gJiYgZmllbGQubmFtZSA9PT0gJ2lkJykgPyAnX2tleScgOiBmaWVsZC5uYW1lO1xuICAgICAgICAgICAgY29uc3QgcGF0aCA9IGAke3BhcmVudFBhdGh9LiR7ZmllbGQubmFtZX1gO1xuICAgICAgICAgICAgbGV0IGRvY1BhdGggPSBgJHtwYXJlbnREb2NQYXRofS4ke2RvY05hbWV9YDtcbiAgICAgICAgICAgIGlmIChmaWVsZC5hcnJheURlcHRoID4gMCkge1xuICAgICAgICAgICAgICAgIGxldCBzdWZmaXggPSAnWypdJztcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBkZXB0aCA9IDEwOyBkZXB0aCA+IDA7IGRlcHRoIC09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcyA9IGBbJHsnKicucmVwZWF0KGRlcHRoKX1dYDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRvY1BhdGguaW5jbHVkZXMocykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1ZmZpeCA9IGBbJHsnKicucmVwZWF0KGRlcHRoICsgMSl9XWA7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBkb2NQYXRoID0gYCR7ZG9jUGF0aH0ke3N1ZmZpeH1gO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3dpdGNoIChmaWVsZC50eXBlLmNhdGVnb3J5KSB7XG4gICAgICAgICAgICBjYXNlIFwic2NhbGFyXCI6XG4gICAgICAgICAgICAgICAgbGV0IHR5cGVOYW1lO1xuICAgICAgICAgICAgICAgIGlmIChmaWVsZC50eXBlID09PSBzY2FsYXJUeXBlcy5ib29sZWFuKSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lID0gJ2Jvb2xlYW4nO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMuZmxvYXQpIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWUgPSAnbnVtYmVyJztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLmludCkge1xuICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZSA9ICdudW1iZXInO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDY0KSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lID0gJ3VpbnQ2NCc7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC50eXBlID09PSBzY2FsYXJUeXBlcy51aW50MTAyNCkge1xuICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZSA9ICd1aW50MTAyNCc7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWUgPSAnc3RyaW5nJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAganMud3JpdGVMbihgc2NhbGFyRmllbGRzLnNldCgnJHtwYXRofScsIHsgdHlwZTogJyR7dHlwZU5hbWV9JywgcGF0aDogJyR7ZG9jUGF0aH0nIH0pO2ApO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcInN0cnVjdFwiOlxuICAgICAgICAgICAgY2FzZSBcInVuaW9uXCI6XG4gICAgICAgICAgICAgICAgZ2VuSlNTY2FsYXJGaWVsZHMoZmllbGQudHlwZSwgcGF0aCwgZG9jUGF0aCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuXG4gICAgZnVuY3Rpb24gZ2VuSlNUeXBlUmVzb2x2ZXJzRm9yVW5pb24odHlwZTogRGJUeXBlKSB7XG4gICAgICAgIGlmICh0eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS51bmlvbikge1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAke3R5cGUubmFtZX06ICR7dHlwZS5uYW1lfVJlc29sdmVyLGApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuZXJhdGUodHlwZXM6IERiVHlwZVtdKSB7XG5cbiAgICAgICAgLy8gR1xuXG4gICAgICAgIGcud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgXCJcIlwiXG4gICAgICAgIER1ZSB0byBHcmFwaFFMIGxpbWl0YXRpb25zIGJpZyBudW1iZXJzIGFyZSByZXR1cm5lZCBhcyBhIHN0cmluZy5cbiAgICAgICAgWW91IGNhbiBzcGVjaWZ5IGZvcm1hdCB1c2VkIHRvIHN0cmluZyByZXByZXNlbnRhdGlvbiBmb3IgYmlnIGludGVnZXJzLlxuICAgICAgICBcIlwiXCJcbiAgICAgICAgZW51bSBCaWdJbnRGb3JtYXQge1xuICAgICAgICAgICAgXCIgSGV4YWRlY2ltYWwgcmVwcmVzZW50YXRpb24gc3RhcnRlZCB3aXRoIDB4IChkZWZhdWx0KSBcIlxuICAgICAgICAgICAgSEVYXG4gICAgICAgICAgICBcIiBEZWNpbWFsIHJlcHJlc2VudGF0aW9uIFwiXG4gICAgICAgICAgICBERUNcbiAgICAgICAgfVxuICAgICAgICBgKTtcbiAgICAgICAgWydTdHJpbmcnLCAnQm9vbGVhbicsICdJbnQnLCAnRmxvYXQnXS5mb3JFYWNoKGdlbkdTY2FsYXJUeXBlc0ZpbHRlcik7XG4gICAgICAgIGdlbkdFbnVtVHlwZXMoKTtcbiAgICAgICAgdHlwZXMuZm9yRWFjaCh0eXBlID0+IGdlbkdUeXBlRGVjbGFyYXRpb24odHlwZSkpO1xuICAgICAgICBjb25zdCBnQXJyYXlGaWx0ZXJzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgICAgIHR5cGVzLmZvckVhY2godHlwZSA9PiBnZW5HRmlsdGVyKHR5cGUsIGdBcnJheUZpbHRlcnMpKTtcblxuICAgICAgICBjb25zdCBjb2xsZWN0aW9ucyA9IHR5cGVzLmZpbHRlcih0ID0+ICEhdC5jb2xsZWN0aW9uKTtcbiAgICAgICAgZ2VuR1F1ZXJpZXMoY29sbGVjdGlvbnMpO1xuICAgICAgICBnZW5HU3Vic2NyaXB0aW9ucyhjb2xsZWN0aW9ucyk7XG5cbiAgICAgICAgLy8gSlNcblxuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBjb25zdCB7XG4gICAgICAgICAgICBzY2FsYXIsXG4gICAgICAgICAgICBiaWdVSW50MSxcbiAgICAgICAgICAgIGJpZ1VJbnQyLFxuICAgICAgICAgICAgc3RyaW5nTG93ZXJGaWx0ZXIsXG4gICAgICAgICAgICByZXNvbHZlQmlnVUludCxcbiAgICAgICAgICAgIHN0cnVjdCxcbiAgICAgICAgICAgIGFycmF5LFxuICAgICAgICAgICAgam9pbixcbiAgICAgICAgICAgIGpvaW5BcnJheSxcbiAgICAgICAgICAgIGVudW1OYW1lLFxuICAgICAgICAgICAgc3RyaW5nQ29tcGFuaW9uLFxuICAgICAgICAgICAgY3JlYXRlRW51bU5hbWVSZXNvbHZlcixcbiAgICAgICAgICAgIHVuaXhNaWxsaXNlY29uZHNUb1N0cmluZyxcbiAgICAgICAgICAgIHVuaXhTZWNvbmRzVG9TdHJpbmcsXG4gICAgICAgIH0gPSByZXF1aXJlKCcuLi9maWx0ZXIvZmlsdGVycy5qcycpO1xuICAgICAgICBgKTtcbiAgICAgICAgY29uc3QganNBcnJheUZpbHRlcnMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICAgICAgdHlwZXMuZm9yRWFjaCh0eXBlID0+IGdlbkpTRmlsdGVyKHR5cGUsIGpzQXJyYXlGaWx0ZXJzKSk7XG5cbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgZnVuY3Rpb24gY3JlYXRlUmVzb2x2ZXJzKGRhdGEpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgIGApO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgICAgICAgICBnZW5KU0N1c3RvbVJlc29sdmVycyh0eXBlKTtcbiAgICAgICAgICAgIGdlbkpTVHlwZVJlc29sdmVyc0ZvclVuaW9uKHR5cGUpO1xuICAgICAgICB9KTtcbiAgICAgICAganMud3JpdGVMbignICAgICAgICBRdWVyeTogeycpO1xuICAgICAgICBjb2xsZWN0aW9ucy5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAke3R5cGUuY29sbGVjdGlvbiB8fCAnJ306IGRhdGEuJHt0eXBlLmNvbGxlY3Rpb24gfHwgJyd9LnF1ZXJ5UmVzb2x2ZXIoKSxgKVxuICAgICAgICB9KTtcbiAgICAgICAganMud3JpdGVMbignICAgICAgICB9LCcpO1xuICAgICAgICBqcy53cml0ZUxuKCcgICAgICAgIFN1YnNjcmlwdGlvbjogeycpO1xuICAgICAgICBjb2xsZWN0aW9ucy5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAke3R5cGUuY29sbGVjdGlvbiB8fCAnJ306IGRhdGEuJHt0eXBlLmNvbGxlY3Rpb24gfHwgJyd9LnN1YnNjcmlwdGlvblJlc29sdmVyKCksYClcbiAgICAgICAgfSk7XG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgYCk7XG5cbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgY29uc3Qgc2NhbGFyRmllbGRzID0gbmV3IE1hcCgpO1xuICAgICAgICBgKTtcbiAgICAgICAgY29sbGVjdGlvbnMuZm9yRWFjaCgodHlwZSkgPT4ge1xuICAgICAgICAgICAgZ2VuSlNTY2FsYXJGaWVsZHModHlwZSwgdHlwZS5jb2xsZWN0aW9uIHx8ICcnLCAnZG9jJyk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0ge1xuICAgICAgICAgICAgc2NhbGFyRmllbGRzLFxuICAgICAgICAgICAgY3JlYXRlUmVzb2x2ZXJzLFxuICAgICAgICBgKTtcbiAgICAgICAgdHlwZXMuZm9yRWFjaCh0eXBlID0+IGpzLndyaXRlTG4oYCAgICAke3R5cGUubmFtZX0sYCkpO1xuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICB9O1xuICAgICAgICBgKTtcbiAgICB9XG5cbiAgICBnZW5lcmF0ZShkYlR5cGVzKTtcblxuICAgIGZvciAoY29uc3QgZTogSW50RW51bURlZiBvZiBlbnVtVHlwZXMudmFsdWVzKCkpIHtcbiAgICAgICAgY29uc29sZS5sb2coYGV4cG9ydCBjb25zdCBRJHtlLm5hbWV9ID0ge2ApO1xuICAgICAgICBjb25zb2xlLmxvZyhPYmplY3QuZW50cmllcyhlLnZhbHVlcykubWFwKChbbmFtZSwgdmFsdWVdKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gYCAgICAke25hbWV9OiAkeyh2YWx1ZTogYW55KX0sYDtcbiAgICAgICAgfSkuam9pbignXFxuJykpO1xuICAgICAgICBjb25zb2xlLmxvZyhgfTtcXG5gKTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBxbDogZy5nZW5lcmF0ZWQoKSxcbiAgICAgICAganM6IGpzLmdlbmVyYXRlZCgpLFxuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgbWFpbjtcbiJdfQ==