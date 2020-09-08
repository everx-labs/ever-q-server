"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _gen = require("./gen.js");

var _dbSchemaTypes = require("../../server/schema/db-schema-types");

function main(schemaDef) {
  const {
    types: dbTypes,
    enumTypes
  } = (0, _dbSchemaTypes.parseDbSchema)(schemaDef); // Generators

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9tYWludGFuYW5jZS9nZW4tZ3JhcGhxbC9xbC1qcy1nZW5lcmF0b3IuanMiXSwibmFtZXMiOlsibWFpbiIsInNjaGVtYURlZiIsInR5cGVzIiwiZGJUeXBlcyIsImVudW1UeXBlcyIsImciLCJXcml0ZXIiLCJqcyIsImdlbkdEb2MiLCJwcmVmaXgiLCJkb2MiLCJ0cmltIiwibGluZXMiLCJzcGxpdCIsImxlbmd0aCIsImluY2x1ZGVzIiwid3JpdGVMbiIsImZvckVhY2giLCJsaW5lIiwidW5pb25WYXJpYW50VHlwZSIsInR5cGUiLCJ2YXJpYW50IiwibmFtZSIsImdlbkdUeXBlRGVjbGFyYXRpb25zRm9yVW5pb25WYXJpYW50cyIsImZpZWxkcyIsIndyaXRlQmxvY2tMbiIsImdlbkdFbnVtVHlwZXMiLCJlbnVtRGVmIiwidmFsdWVzIiwiT2JqZWN0Iiwia2V5cyIsImdlbkdUeXBlRGVjbGFyYXRpb24iLCJjYXRlZ29yeSIsIkRiVHlwZUNhdGVnb3J5IiwidW5pb24iLCJmaWVsZCIsInR5cGVEZWNsYXJhdGlvbiIsInJlcGVhdCIsImFycmF5RGVwdGgiLCJwYXJhbXMiLCJqb2luIiwiZm9ybWF0dGVyIiwicHJldmVudFR3aWNlIiwibmFtZXMiLCJ3b3JrIiwiaGFzIiwiYWRkIiwiZ2VuR0ZpbHRlcnNGb3JBcnJheUZpZWxkcyIsImdOYW1lcyIsIml0ZW1UeXBlTmFtZSIsImkiLCJmaWx0ZXJOYW1lIiwib3AiLCJnZW5HRmlsdGVyc0ZvckVudW1OYW1lRmllbGRzIiwiZ2VuR1NjYWxhclR5cGVzRmlsdGVyIiwiZ2VuR0ZpbHRlciIsImdlbkdRdWVyaWVzIiwiY29sbGVjdGlvbiIsImdlbkdTdWJzY3JpcHRpb25zIiwiZ2V0U2NhbGFyUmVzb2x2ZXJOYW1lIiwic2NhbGFyVHlwZXMiLCJ1aW50NjQiLCJ1aW50MTAyNCIsImdlbkpTRmlsdGVyc0ZvckFycmF5RmllbGRzIiwianNOYW1lcyIsIml0ZW1SZXNvbHZlck5hbWUiLCJzY2FsYXIiLCJnZW5KU1N0cnVjdEZpbHRlciIsInN1ZmZpeCIsIm9uIiwicmVmT24iLCJnZW5KU1VuaW9uUmVzb2x2ZXIiLCJnZW5KU0ZpbHRlciIsImdlbkpTQ3VzdG9tUmVzb2x2ZXJzIiwiam9pbkZpZWxkcyIsImZpbHRlciIsIngiLCJiaWdVSW50RmllbGRzIiwic3RyaW5nRm9ybWF0dGVkRmllbGRzIiwiZW51bUZpZWxkcyIsImN1c3RvbVJlc29sdmVyUmVxdWlyZWQiLCJvbkZpZWxkIiwiZmluZCIsInByZUNvbmRpdGlvbiIsInByZWZpeExlbmd0aCIsImdlbkpTU2NhbGFyRmllbGRzIiwicGFyZW50UGF0aCIsInBhcmVudERvY1BhdGgiLCJkb2NOYW1lIiwicGF0aCIsImRvY1BhdGgiLCJkZXB0aCIsInMiLCJ0eXBlTmFtZSIsImJvb2xlYW4iLCJmbG9hdCIsImludCIsImdlbkpTVHlwZVJlc29sdmVyc0ZvclVuaW9uIiwiZ2VuZXJhdGUiLCJnQXJyYXlGaWx0ZXJzIiwiU2V0IiwiY29sbGVjdGlvbnMiLCJ0IiwianNBcnJheUZpbHRlcnMiLCJlIiwiY29uc29sZSIsImxvZyIsImVudHJpZXMiLCJtYXAiLCJ2YWx1ZSIsInFsIiwiZ2VuZXJhdGVkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBRUE7O0FBR0E7O0FBUUEsU0FBU0EsSUFBVCxDQUFjQyxTQUFkLEVBQWtDO0FBQzlCLFFBQU07QUFBRUMsSUFBQUEsS0FBSyxFQUFFQyxPQUFUO0FBQWtCQyxJQUFBQTtBQUFsQixNQUErQixrQ0FBY0gsU0FBZCxDQUFyQyxDQUQ4QixDQUdsQzs7QUFFSSxRQUFNSSxDQUFDLEdBQUcsSUFBSUMsV0FBSixFQUFWO0FBQ0EsUUFBTUMsRUFBRSxHQUFHLElBQUlELFdBQUosRUFBWDs7QUFFQSxXQUFTRSxPQUFULENBQWlCQyxNQUFqQixFQUFpQ0MsR0FBakMsRUFBOEM7QUFDMUMsUUFBSUEsR0FBRyxDQUFDQyxJQUFKLE9BQWUsRUFBbkIsRUFBdUI7QUFDbkI7QUFDSDs7QUFDRCxVQUFNQyxLQUFLLEdBQUdGLEdBQUcs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S0FBOUIsQ0FBakI7QUFDSCxLQUZEO0FBSUFsRCxJQUFBQSxFQUFFLENBQUNrQixZQUFILENBQWlCOzs7O1NBQWpCO0FBS0F2QixJQUFBQSxLQUFLLENBQUNlLE9BQU4sQ0FBY0csSUFBSSxJQUFJYixFQUFFLENBQUNTLE9BQUgsQ0FBWSxPQUFNSSxJQUFJLENBQUNFLElBQUssR0FBNUIsQ0FBdEI7QUFDQWYsSUFBQUEsRUFBRSxDQUFDa0IsWUFBSCxDQUFpQjs7U0FBakI7QUFHSDs7QUFFRHlFLEVBQUFBLFFBQVEsQ0FBQy9GLE9BQUQsQ0FBUjs7QUFFQSxPQUFLLE1BQU1xRyxDQUFYLElBQTRCcEcsU0FBUyxDQUFDd0IsTUFBVixFQUE1QixFQUFnRDtBQUM1QzZFLElBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFhLGlCQUFnQkYsQ0FBQyxDQUFDbEYsSUFBSyxNQUFwQztBQUNBbUYsSUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVk3RSxNQUFNLENBQUM4RSxPQUFQLENBQWVILENBQUMsQ0FBQzVFLE1BQWpCLEVBQXlCZ0YsR0FBekIsQ0FBNkIsQ0FBQyxDQUFDdEYsSUFBRCxFQUFPdUYsS0FBUCxDQUFELEtBQW1CO0FBQ3hELGFBQVEsT0FBTXZGLElBQUssS0FBS3VGLEtBQVksR0FBcEM7QUFDSCxLQUZXLEVBRVRyRSxJQUZTLENBRUosSUFGSSxDQUFaO0FBR0FpRSxJQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBYSxNQUFiO0FBQ0g7O0FBRUQsU0FBTztBQUNISSxJQUFBQSxFQUFFLEVBQUV6RyxDQUFDLENBQUMwRyxTQUFGLEVBREQ7QUFFSHhHLElBQUFBLEVBQUUsRUFBRUEsRUFBRSxDQUFDd0csU0FBSDtBQUZELEdBQVA7QUFJSDs7ZUFFYy9HLEkiLCJzb3VyY2VzQ29udGVudCI6WyIvL0BmbG93XG5cbmltcG9ydCB7V3JpdGVyfSBmcm9tICcuL2dlbi5qcyc7XG5pbXBvcnQgdHlwZSB7VHlwZURlZn0gZnJvbSAnLi4vLi4vc2VydmVyL3NjaGVtYS9zY2hlbWEuanMnO1xuaW1wb3J0IHR5cGUge0RiRmllbGQsIERiVHlwZSwgSW50RW51bURlZn0gZnJvbSAnLi4vLi4vc2VydmVyL3NjaGVtYS9kYi1zY2hlbWEtdHlwZXMnO1xuaW1wb3J0IHtcbiAgICBEYlR5cGVDYXRlZ29yeSxcbiAgICBpc0JpZ0ludCwgcGFyc2VEYlNjaGVtYSxcbiAgICBzY2FsYXJUeXBlcyxcbiAgICBzdHJpbmdpZnlFbnVtVmFsdWVzLFxuICAgIHRvRW51bVN0eWxlLFxufSBmcm9tICcuLi8uLi9zZXJ2ZXIvc2NoZW1hL2RiLXNjaGVtYS10eXBlcyc7XG5cbmZ1bmN0aW9uIG1haW4oc2NoZW1hRGVmOiBUeXBlRGVmKSB7XG4gICAgY29uc3QgeyB0eXBlczogZGJUeXBlcywgZW51bVR5cGVzfSA9IHBhcnNlRGJTY2hlbWEoc2NoZW1hRGVmKTtcblxuLy8gR2VuZXJhdG9yc1xuXG4gICAgY29uc3QgZyA9IG5ldyBXcml0ZXIoKTtcbiAgICBjb25zdCBqcyA9IG5ldyBXcml0ZXIoKTtcblxuICAgIGZ1bmN0aW9uIGdlbkdEb2MocHJlZml4OiBzdHJpbmcsIGRvYzogc3RyaW5nKSB7XG4gICAgICAgIGlmIChkb2MudHJpbSgpID09PSAnJykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGxpbmVzID0gZG9jLnNwbGl0KC9cXG5cXHI/fFxcclxcbj8vKTtcbiAgICAgICAgaWYgKGxpbmVzLmxlbmd0aCA9PT0gMSAmJiAhbGluZXNbMF0uaW5jbHVkZXMoJ1wiJykpIHtcbiAgICAgICAgICAgIGcud3JpdGVMbihwcmVmaXgsICdcIicsIGxpbmVzWzBdLCAnXCInKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGcud3JpdGVMbihwcmVmaXgsICdcIlwiXCInKTtcbiAgICAgICAgICAgIGxpbmVzLmZvckVhY2goKGxpbmUpID0+IHtcbiAgICAgICAgICAgICAgICBnLndyaXRlTG4ocHJlZml4LCBsaW5lKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgZy53cml0ZUxuKHByZWZpeCwgJ1wiXCJcIicpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdW5pb25WYXJpYW50VHlwZSh0eXBlOiBEYlR5cGUsIHZhcmlhbnQ6IERiRmllbGQpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gYCR7dHlwZS5uYW1lfSR7dmFyaWFudC5uYW1lfVZhcmlhbnRgO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkdUeXBlRGVjbGFyYXRpb25zRm9yVW5pb25WYXJpYW50cyh0eXBlOiBEYlR5cGUpIHtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgodmFyaWFudCkgPT4ge1xuICAgICAgICAgICAgZy53cml0ZUJsb2NrTG4oYFxuICAgICAgICB0eXBlICR7dW5pb25WYXJpYW50VHlwZSh0eXBlLCB2YXJpYW50KX0ge1xuICAgICAgICAgICAgJHt2YXJpYW50Lm5hbWV9OiAke3ZhcmlhbnQudHlwZS5uYW1lfVxuICAgICAgICB9XG5cbiAgICAgICAgYCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkdFbnVtVHlwZXMoKSB7XG4gICAgICAgIGZvciAoY29uc3QgZW51bURlZjogSW50RW51bURlZiBvZiBlbnVtVHlwZXMudmFsdWVzKCkpIHtcbiAgICAgICAgICAgIGcud3JpdGVMbihgZW51bSAke2VudW1EZWYubmFtZX1FbnVtIHtgKTtcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKGVudW1EZWYudmFsdWVzKS5mb3JFYWNoKChuYW1lKSA9PiB7XG4gICAgICAgICAgICAgICAgZy53cml0ZUxuKGAgICAgJHt0b0VudW1TdHlsZShuYW1lKX1gKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgZy53cml0ZUxuKGB9YCk7XG4gICAgICAgICAgICBnLndyaXRlTG4oKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkdUeXBlRGVjbGFyYXRpb24odHlwZTogRGJUeXBlKSB7XG4gICAgICAgIGlmICh0eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS51bmlvbikge1xuICAgICAgICAgICAgZ2VuR1R5cGVEZWNsYXJhdGlvbnNGb3JVbmlvblZhcmlhbnRzKHR5cGUpO1xuICAgICAgICAgICAgZy53cml0ZUxuKGB1bmlvbiAke3R5cGUubmFtZX0gPSBgKTtcbiAgICAgICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2godmFyaWFudCA9PiB7XG4gICAgICAgICAgICAgICAgZy53cml0ZUxuKGBcXHR8ICR7dW5pb25WYXJpYW50VHlwZSh0eXBlLCB2YXJpYW50KX1gKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgZy53cml0ZUxuKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBnZW5HRG9jKCcnLCB0eXBlLmRvYyk7XG4gICAgICAgICAgICBnLndyaXRlTG4oYHR5cGUgJHt0eXBlLm5hbWV9IHtgKTtcbiAgICAgICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goZmllbGQgPT4ge1xuICAgICAgICAgICAgICAgIGdlbkdEb2MoJ1xcdCcsIGZpZWxkLmRvYyk7XG4gICAgICAgICAgICAgICAgY29uc3QgdHlwZURlY2xhcmF0aW9uID1cbiAgICAgICAgICAgICAgICAgICAgJ1snLnJlcGVhdChmaWVsZC5hcnJheURlcHRoKSArXG4gICAgICAgICAgICAgICAgICAgIGZpZWxkLnR5cGUubmFtZSArXG4gICAgICAgICAgICAgICAgICAgICddJy5yZXBlYXQoZmllbGQuYXJyYXlEZXB0aCk7XG4gICAgICAgICAgICAgICAgbGV0IHBhcmFtcyA9ICcnO1xuICAgICAgICAgICAgICAgIGlmIChpc0JpZ0ludChmaWVsZC50eXBlKSkge1xuICAgICAgICAgICAgICAgICAgICBwYXJhbXMgPSAnKGZvcm1hdDogQmlnSW50Rm9ybWF0KSc7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC5qb2luKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhcmFtcyA9IGAodGltZW91dDogSW50LCB3aGVuOiAke3R5cGUubmFtZX1GaWx0ZXIpYDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBnLndyaXRlTG4oYFxcdCR7ZmllbGQubmFtZX0ke3BhcmFtc306ICR7dHlwZURlY2xhcmF0aW9ufWApO1xuICAgICAgICAgICAgICAgIGNvbnN0IGVudW1EZWYgPSBmaWVsZC5lbnVtRGVmO1xuICAgICAgICAgICAgICAgIGlmIChlbnVtRGVmKSB7XG4gICAgICAgICAgICAgICAgICAgIGcud3JpdGVMbihgXFx0JHtmaWVsZC5uYW1lfV9uYW1lOiAke2VudW1EZWYubmFtZX1FbnVtYCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChmaWVsZC5mb3JtYXR0ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgZy53cml0ZUxuKGBcXHQke2ZpZWxkLm5hbWV9X3N0cmluZzogU3RyaW5nYCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBnLndyaXRlTG4oYH1gKTtcbiAgICAgICAgfVxuICAgICAgICBnLndyaXRlTG4oKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwcmV2ZW50VHdpY2UobmFtZTogc3RyaW5nLCBuYW1lczogU2V0PHN0cmluZz4sIHdvcms6ICgpID0+IHZvaWQpIHtcbiAgICAgICAgaWYgKCFuYW1lcy5oYXMobmFtZSkpIHtcbiAgICAgICAgICAgIG5hbWVzLmFkZChuYW1lKTtcbiAgICAgICAgICAgIHdvcmsoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkdGaWx0ZXJzRm9yQXJyYXlGaWVsZHModHlwZTogRGJUeXBlLCBnTmFtZXM6IFNldDxzdHJpbmc+KSB7XG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBsZXQgaXRlbVR5cGVOYW1lID0gZmllbGQudHlwZS5uYW1lO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmaWVsZC5hcnJheURlcHRoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWx0ZXJOYW1lID0gYCR7aXRlbVR5cGVOYW1lfUFycmF5RmlsdGVyYDtcbiAgICAgICAgICAgICAgICBwcmV2ZW50VHdpY2UoZmlsdGVyTmFtZSwgZ05hbWVzLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGcud3JpdGVMbihgaW5wdXQgJHtmaWx0ZXJOYW1lfSB7YCk7XG4gICAgICAgICAgICAgICAgICAgIFsnYW55JywgJ2FsbCddLmZvckVhY2goKG9wKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBnLndyaXRlTG4oYFxcdCR7b3B9OiAke2l0ZW1UeXBlTmFtZX1GaWx0ZXJgKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGcud3JpdGVMbignfScpO1xuICAgICAgICAgICAgICAgICAgICBnLndyaXRlTG4oKTtcblxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGl0ZW1UeXBlTmFtZSArPSAnQXJyYXknO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5HRmlsdGVyc0ZvckVudW1OYW1lRmllbGRzKHR5cGU6IERiVHlwZSwgZ05hbWVzOiBTZXQ8c3RyaW5nPikge1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgZW51bURlZiA9IGZpZWxkLmVudW1EZWY7XG4gICAgICAgICAgICBpZiAoZW51bURlZikge1xuICAgICAgICAgICAgICAgIHByZXZlbnRUd2ljZShgJHtlbnVtRGVmLm5hbWV9RW51bUZpbHRlcmAsIGdOYW1lcywgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBnZW5HU2NhbGFyVHlwZXNGaWx0ZXIoYCR7ZW51bURlZi5uYW1lfUVudW1gKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuR0ZpbHRlcih0eXBlOiBEYlR5cGUsIGdOYW1lczogU2V0PHN0cmluZz4pIHtcbiAgICAgICAgaWYgKHR5cGUuZmllbGRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGdlbkdGaWx0ZXJzRm9yQXJyYXlGaWVsZHModHlwZSwgZ05hbWVzKTtcbiAgICAgICAgZ2VuR0ZpbHRlcnNGb3JFbnVtTmFtZUZpZWxkcyh0eXBlLCBnTmFtZXMpO1xuICAgICAgICBnZW5HRG9jKCcnLCB0eXBlLmRvYyk7XG4gICAgICAgIGcud3JpdGVMbihgaW5wdXQgJHt0eXBlLm5hbWV9RmlsdGVyIHtgKTtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGdlbkdEb2MoJ1xcdCcsIGZpZWxkLmRvYyk7XG4gICAgICAgICAgICBjb25zdCB0eXBlRGVjbGFyYXRpb24gPSBmaWVsZC50eXBlLm5hbWUgKyBcIkFycmF5XCIucmVwZWF0KGZpZWxkLmFycmF5RGVwdGgpO1xuICAgICAgICAgICAgZy53cml0ZUxuKGBcXHQke2ZpZWxkLm5hbWV9OiAke3R5cGVEZWNsYXJhdGlvbn1GaWx0ZXJgKTtcbiAgICAgICAgICAgIGNvbnN0IGVudW1EZWYgPSBmaWVsZC5lbnVtRGVmO1xuICAgICAgICAgICAgaWYgKGVudW1EZWYpIHtcbiAgICAgICAgICAgICAgICBnLndyaXRlTG4oYFxcdCR7ZmllbGQubmFtZX1fbmFtZTogJHtlbnVtRGVmLm5hbWV9RW51bUZpbHRlcmApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgZy53cml0ZUxuKGAgICAgT1I6ICR7dHlwZS5uYW1lfUZpbHRlcmApO1xuICAgICAgICBnLndyaXRlTG4oYH1gKTtcbiAgICAgICAgZy53cml0ZUxuKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuR1NjYWxhclR5cGVzRmlsdGVyKG5hbWU6IHN0cmluZykge1xuICAgICAgICBnLndyaXRlTG4oYGlucHV0ICR7bmFtZX1GaWx0ZXIge2ApO1xuICAgICAgICBbJ2VxJywgJ25lJywgJ2d0JywgJ2x0JywgJ2dlJywgJ2xlJ10uZm9yRWFjaCgob3ApID0+IHtcbiAgICAgICAgICAgIGcud3JpdGVMbihgXFx0JHtvcH06ICR7bmFtZX1gKTtcbiAgICAgICAgfSk7XG4gICAgICAgIFsnaW4nLCAnbm90SW4nXS5mb3JFYWNoKChvcCkgPT4ge1xuICAgICAgICAgICAgZy53cml0ZUxuKGBcXHQke29wfTogWyR7bmFtZX1dYCk7XG4gICAgICAgIH0pO1xuICAgICAgICBnLndyaXRlTG4oJ30nKTtcbiAgICAgICAgZy53cml0ZUxuKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuR1F1ZXJpZXModHlwZXM6IERiVHlwZVtdKSB7XG4gICAgICAgIGcud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgXCJTcGVjaWZ5IHNvcnQgb3JkZXIgZGlyZWN0aW9uXCJcbiAgICAgICAgZW51bSBRdWVyeU9yZGVyQnlEaXJlY3Rpb24ge1xuICAgICAgICAgICAgXCJEb2N1bWVudHMgd2lsbCBiZSBzb3J0ZWQgaW4gYXNjZW5kZWQgb3JkZXIgKGUuZy4gZnJvbSBBIHRvIFopXCJcbiAgICAgICAgICAgIEFTQ1xuICAgICAgICAgICAgXCJEb2N1bWVudHMgd2lsbCBiZSBzb3J0ZWQgaW4gZGVzY2VuZGFudCBvcmRlciAoZS5nLiBmcm9tIFogdG8gQSlcIlxuICAgICAgICAgICAgREVTQ1xuICAgICAgICB9XG5cbiAgICAgICAgXG4gICAgICAgIFwiXCJcIlxuICAgICAgICBTcGVjaWZ5IGhvdyB0byBzb3J0IHJlc3VsdHMuXG4gICAgICAgIFlvdSBjYW4gc29ydCBkb2N1bWVudHMgaW4gcmVzdWx0IHNldCB1c2luZyBtb3JlIHRoYW4gb25lIGZpZWxkLlxuICAgICAgICBcIlwiXCJcbiAgICAgICAgaW5wdXQgUXVlcnlPcmRlckJ5IHtcbiAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgICAgUGF0aCB0byBmaWVsZCB3aGljaCBtdXN0IGJlIHVzZWQgYXMgYSBzb3J0IGNyaXRlcmlhLlxuICAgICAgICAgICAgSWYgZmllbGQgcmVzaWRlcyBkZWVwIGluIHN0cnVjdHVyZSBwYXRoIGl0ZW1zIG11c3QgYmUgc2VwYXJhdGVkIHdpdGggZG90IChlLmcuICdmb28uYmFyLmJheicpLlxuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgICBwYXRoOiBTdHJpbmdcbiAgICAgICAgICAgIFwiU29ydCBvcmRlciBkaXJlY3Rpb25cIlxuICAgICAgICAgICAgZGlyZWN0aW9uOiBRdWVyeU9yZGVyQnlEaXJlY3Rpb25cbiAgICAgICAgfVxuXG4gICAgICAgIHR5cGUgUXVlcnkge1xuICAgICAgICBgKTtcblxuICAgICAgICB0eXBlcy5mb3JFYWNoKCh0eXBlOiBEYlR5cGUpID0+IHtcbiAgICAgICAgICAgIGcud3JpdGVMbihgXFx0JHt0eXBlLmNvbGxlY3Rpb24gfHwgJyd9KGZpbHRlcjogJHt0eXBlLm5hbWV9RmlsdGVyLCBvcmRlckJ5OiBbUXVlcnlPcmRlckJ5XSwgbGltaXQ6IEludCwgdGltZW91dDogRmxvYXQsIGFjY2Vzc0tleTogU3RyaW5nLCBvcGVyYXRpb25JZDogU3RyaW5nKTogWyR7dHlwZS5uYW1lfV1gKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgZy53cml0ZUJsb2NrTG4oYFxuICAgICAgICB9XG5cbiAgICAgICAgYCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuR1N1YnNjcmlwdGlvbnModHlwZXM6IERiVHlwZVtdKSB7XG4gICAgICAgIGcud3JpdGVMbigndHlwZSBTdWJzY3JpcHRpb24geycpO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgICAgICAgICBnLndyaXRlTG4oYFxcdCR7dHlwZS5jb2xsZWN0aW9uIHx8ICcnfShmaWx0ZXI6ICR7dHlwZS5uYW1lfUZpbHRlciwgYWNjZXNzS2V5OiBTdHJpbmcpOiAke3R5cGUubmFtZX1gKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGcud3JpdGVMbignfScpO1xuICAgIH1cblxuXG4gICAgZnVuY3Rpb24gZ2V0U2NhbGFyUmVzb2x2ZXJOYW1lKGZpZWxkOiBEYkZpZWxkKTogc3RyaW5nIHtcbiAgICAgICAgaWYgKGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLnVpbnQ2NCkge1xuICAgICAgICAgICAgcmV0dXJuICdiaWdVSW50MSc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLnVpbnQxMDI0KSB7XG4gICAgICAgICAgICByZXR1cm4gJ2JpZ1VJbnQyJztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJ3NjYWxhcic7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuSlNGaWx0ZXJzRm9yQXJyYXlGaWVsZHModHlwZTogRGJUeXBlLCBqc05hbWVzOiBTZXQ8c3RyaW5nPikge1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgbGV0IGl0ZW1UeXBlTmFtZSA9IGZpZWxkLnR5cGUubmFtZTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZmllbGQuYXJyYXlEZXB0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmlsdGVyTmFtZSA9IGAke2l0ZW1UeXBlTmFtZX1BcnJheWA7XG4gICAgICAgICAgICAgICAgcHJldmVudFR3aWNlKGZpbHRlck5hbWUsIGpzTmFtZXMsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaXRlbVJlc29sdmVyTmFtZSA9IChpID09PSAwICYmIGZpZWxkLnR5cGUuY2F0ZWdvcnkgPT09IERiVHlwZUNhdGVnb3J5LnNjYWxhcilcbiAgICAgICAgICAgICAgICAgICAgICAgID8gZ2V0U2NhbGFyUmVzb2x2ZXJOYW1lKGZpZWxkKVxuICAgICAgICAgICAgICAgICAgICAgICAgOiBpdGVtVHlwZU5hbWU7XG4gICAgICAgICAgICAgICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgICAgICAgICAgY29uc3QgJHtmaWx0ZXJOYW1lfSA9IGFycmF5KCgpID0+ICR7aXRlbVJlc29sdmVyTmFtZX0pO1xuICAgICAgICAgICAgICAgIGApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGl0ZW1UeXBlTmFtZSArPSAnQXJyYXknO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5KU1N0cnVjdEZpbHRlcih0eXBlOiBEYlR5cGUpIHtcbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgY29uc3QgJHt0eXBlLm5hbWV9ID0gc3RydWN0KHtcbiAgICBgKTtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgoZmllbGQ6IERiRmllbGQpID0+IHtcbiAgICAgICAgICAgIGxldCB0eXBlRGVjbGFyYXRpb246ID9zdHJpbmcgPSBudWxsO1xuICAgICAgICAgICAgY29uc3Qgam9pbiA9IGZpZWxkLmpvaW47XG4gICAgICAgICAgICBpZiAoam9pbikge1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1ZmZpeCA9IGZpZWxkLmFycmF5RGVwdGggPiAwID8gJ0FycmF5JyA6ICcnO1xuICAgICAgICAgICAgICAgIHR5cGVEZWNsYXJhdGlvbiA9IGBqb2luJHtzdWZmaXh9KCcke2pvaW4ub259JywgJyR7am9pbi5yZWZPbn0nLCAnJHtmaWVsZC50eXBlLmNvbGxlY3Rpb24gfHwgJyd9JywgKCkgPT4gJHtmaWVsZC50eXBlLm5hbWV9KWA7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLmFycmF5RGVwdGggPiAwKSB7XG4gICAgICAgICAgICAgICAgdHlwZURlY2xhcmF0aW9uID1cbiAgICAgICAgICAgICAgICAgICAgZmllbGQudHlwZS5uYW1lICtcbiAgICAgICAgICAgICAgICAgICAgJ0FycmF5Jy5yZXBlYXQoZmllbGQuYXJyYXlEZXB0aCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLnR5cGUuY2F0ZWdvcnkgPT09IERiVHlwZUNhdGVnb3J5LnNjYWxhcikge1xuICAgICAgICAgICAgICAgIHR5cGVEZWNsYXJhdGlvbiA9IGdldFNjYWxhclJlc29sdmVyTmFtZShmaWVsZCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLnR5cGUuZmllbGRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB0eXBlRGVjbGFyYXRpb24gPSBmaWVsZC50eXBlLm5hbWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodHlwZURlY2xhcmF0aW9uKSB7XG4gICAgICAgICAgICAgICAganMud3JpdGVMbihgICAgICR7ZmllbGQubmFtZX06ICR7dHlwZURlY2xhcmF0aW9ufSxgKTtcbiAgICAgICAgICAgICAgICBjb25zdCBlbnVtRGVmID0gZmllbGQuZW51bURlZjtcbiAgICAgICAgICAgICAgICBpZiAoZW51bURlZikge1xuICAgICAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgJHtmaWVsZC5uYW1lfV9uYW1lOiBlbnVtTmFtZSgnJHtmaWVsZC5uYW1lfScsICR7c3RyaW5naWZ5RW51bVZhbHVlcyhlbnVtRGVmLnZhbHVlcyl9KSxgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGZpZWxkLmZvcm1hdHRlcikge1xuICAgICAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgJHtmaWVsZC5uYW1lfV9zdHJpbmc6IHN0cmluZ0NvbXBhbmlvbignJHtmaWVsZC5uYW1lfScpLGApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIH0ke3R5cGUuY29sbGVjdGlvbiA/ICcsIHRydWUnIDogJyd9KTtcblxuICAgIGApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkpTVW5pb25SZXNvbHZlcih0eXBlOiBEYlR5cGUpIHtcbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgY29uc3QgJHt0eXBlLm5hbWV9UmVzb2x2ZXIgPSB7XG4gICAgICAgICAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xuICAgICAgICBgKTtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgodmFyaWFudCkgPT4ge1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICBpZiAoJyR7dmFyaWFudC5uYW1lfScgaW4gb2JqKSB7YCk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICByZXR1cm4gJyR7dW5pb25WYXJpYW50VHlwZSh0eXBlLCB2YXJpYW50KX0nO2ApO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICB9YCk7XG4gICAgICAgIH0pO1xuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkpTRmlsdGVyKHR5cGU6IERiVHlwZSwganNOYW1lczogU2V0PHN0cmluZz4pIHtcbiAgICAgICAgaWYgKHR5cGUuZmllbGRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS51bmlvbikge1xuICAgICAgICAgICAgLy8gZ2VuSlNGaWx0ZXJzRm9yVW5pb25WYXJpYW50cyh0eXBlLCBqc05hbWVzKTtcbiAgICAgICAgfVxuICAgICAgICBnZW5KU0ZpbHRlcnNGb3JBcnJheUZpZWxkcyh0eXBlLCBqc05hbWVzKTtcbiAgICAgICAgZ2VuSlNTdHJ1Y3RGaWx0ZXIodHlwZSk7XG4gICAgICAgIGlmICh0eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS51bmlvbikge1xuICAgICAgICAgICAgZ2VuSlNVbmlvblJlc29sdmVyKHR5cGUpO1xuICAgICAgICB9XG5cblxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlIGN1c3RvbSByZXNvbHZlcnMgZm9yIHR5cGVzIHdpdGg6XG4gICAgICogLSBpZCBmaWVsZFxuICAgICAqIC0gam9pbiBmaWVsZHNcbiAgICAgKiAtIHU2NCBhbmQgaGlnaGVyIGZpZWxkc1xuICAgICAqIEBwYXJhbSB0eXBlXG4gICAgICovXG4gICAgZnVuY3Rpb24gZ2VuSlNDdXN0b21SZXNvbHZlcnModHlwZTogRGJUeXBlKSB7XG4gICAgICAgIGNvbnN0IGpvaW5GaWVsZHMgPSB0eXBlLmZpZWxkcy5maWx0ZXIoeCA9PiAhIXguam9pbik7XG4gICAgICAgIGNvbnN0IGJpZ1VJbnRGaWVsZHMgPSB0eXBlLmZpZWxkcy5maWx0ZXIoKHg6IERiRmllbGQpID0+IGlzQmlnSW50KHgudHlwZSkpO1xuICAgICAgICBjb25zdCBzdHJpbmdGb3JtYXR0ZWRGaWVsZHMgPSB0eXBlLmZpZWxkcy5maWx0ZXIoKHg6IERiRmllbGQpID0+IHguZm9ybWF0dGVyKTtcbiAgICAgICAgY29uc3QgZW51bUZpZWxkcyA9IHR5cGUuZmllbGRzLmZpbHRlcih4ID0+IHguZW51bURlZik7XG4gICAgICAgIGNvbnN0IGN1c3RvbVJlc29sdmVyUmVxdWlyZWQgPSB0eXBlLmNvbGxlY3Rpb25cbiAgICAgICAgICAgIHx8IGpvaW5GaWVsZHMubGVuZ3RoID4gMFxuICAgICAgICAgICAgfHwgYmlnVUludEZpZWxkcy5sZW5ndGggPiAwXG4gICAgICAgICAgICB8fCBlbnVtRmllbGRzLmxlbmd0aCA+IDA7XG4gICAgICAgIGlmICghY3VzdG9tUmVzb2x2ZXJSZXF1aXJlZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgJHt0eXBlLm5hbWV9OiB7YCk7XG4gICAgICAgIGlmICh0eXBlLmNvbGxlY3Rpb24pIHtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oJyAgICAgICAgICAgIGlkKHBhcmVudCkgeycpO1xuICAgICAgICAgICAganMud3JpdGVMbignICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTsnKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oJyAgICAgICAgICAgIH0sJyk7XG4gICAgICAgIH1cbiAgICAgICAgam9pbkZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgY29uc3Qgam9pbiA9IGZpZWxkLmpvaW47XG4gICAgICAgICAgICBpZiAoIWpvaW4pIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBvbkZpZWxkID0gdHlwZS5maWVsZHMuZmluZCh4ID0+IHgubmFtZSA9PT0gam9pbi5vbik7XG4gICAgICAgICAgICBpZiAoIW9uRmllbGQpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyAnSm9pbiBvbiBmaWVsZCBkb2VzIG5vdCBleGlzdC4nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3Qgb24gPSBqb2luLm9uID09PSAnaWQnID8gJ19rZXknIDogKGpvaW4ub24gfHwgJ19rZXknKTtcbiAgICAgICAgICAgIGNvbnN0IHJlZk9uID0gam9pbi5yZWZPbiA9PT0gJ2lkJyA/ICdfa2V5JyA6IChqb2luLnJlZk9uIHx8ICdfa2V5Jyk7XG4gICAgICAgICAgICBjb25zdCBjb2xsZWN0aW9uID0gZmllbGQudHlwZS5jb2xsZWN0aW9uO1xuICAgICAgICAgICAgaWYgKCFjb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgJ0pvaW5lZCB0eXBlIGlzIG5vdCBhIGNvbGxlY3Rpb24uJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICR7ZmllbGQubmFtZX0ocGFyZW50LCBhcmdzLCBjb250ZXh0KSB7YCk7XG4gICAgICAgICAgICBpZiAoam9pbi5wcmVDb25kaXRpb24pIHtcbiAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAgICAgaWYgKCEoJHtqb2luLnByZUNvbmRpdGlvbn0pKSB7YCk7XG4gICAgICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtgKTtcbiAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAgICAgfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgICAgIGlmIChhcmdzLndoZW4gJiYgISR7dHlwZS5uYW1lfS50ZXN0KG51bGwsIHBhcmVudCwgYXJncy53aGVuKSkge2ApO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtgKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICAgICB9YCk7XG5cbiAgICAgICAgICAgIGlmIChmaWVsZC5hcnJheURlcHRoID09PSAwKSB7XG4gICAgICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgICAgIHJldHVybiBjb250ZXh0LmRhdGEuJHtjb2xsZWN0aW9ufS53YWl0Rm9yRG9jKHBhcmVudC4ke29ufSwgJyR7cmVmT259JywgYXJncywgY29udGV4dCk7YCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLmFycmF5RGVwdGggPT09IDEpIHtcbiAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQuZGF0YS4ke2NvbGxlY3Rpb259LndhaXRGb3JEb2NzKHBhcmVudC4ke29ufSwgJyR7cmVmT259JywgYXJncywgY29udGV4dCk7YCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93ICdKb2lucyBvbiBhIG5lc3RlZCBhcnJheXMgZG9lcyBub3Qgc3VwcG9ydGVkLic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICB9LGApO1xuICAgICAgICB9KTtcbiAgICAgICAgYmlnVUludEZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcHJlZml4TGVuZ3RoID0gZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDY0ID8gMSA6IDI7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAke2ZpZWxkLm5hbWV9KHBhcmVudCwgYXJncykge2ApO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgke3ByZWZpeExlbmd0aH0sIHBhcmVudC4ke2ZpZWxkLm5hbWV9LCBhcmdzKTtgKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgIH0sYCk7XG4gICAgICAgIH0pO1xuICAgICAgICBzdHJpbmdGb3JtYXR0ZWRGaWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICR7ZmllbGQubmFtZX1fc3RyaW5nKHBhcmVudCwgYXJncykge2ApO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgICAgIHJldHVybiAke2ZpZWxkLmZvcm1hdHRlciB8fCAnJ30ocGFyZW50LiR7ZmllbGQubmFtZX0pO2ApO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgfSxgKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGVudW1GaWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGVudW1EZWYgPSBmaWVsZC5lbnVtRGVmO1xuICAgICAgICAgICAgaWYgKGVudW1EZWYpIHtcbiAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAke2ZpZWxkLm5hbWV9X25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJyR7ZmllbGQubmFtZX0nLCAke3N0cmluZ2lmeUVudW1WYWx1ZXMoZW51bURlZi52YWx1ZXMpfSksYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgIH0sYCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuSlNTY2FsYXJGaWVsZHModHlwZTogRGJUeXBlLCBwYXJlbnRQYXRoLCBwYXJlbnREb2NQYXRoOiBzdHJpbmcpIHtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgoZmllbGQ6IERiRmllbGQpID0+IHtcbiAgICAgICAgICAgIGlmIChmaWVsZC5qb2luIHx8IGZpZWxkLmVudW1EZWYpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBkb2NOYW1lID0gZmllbGQubmFtZSA9PT0gJ2lkJyA/ICdfa2V5JyA6IGZpZWxkLm5hbWU7XG4gICAgICAgICAgICBjb25zdCBwYXRoID0gYCR7cGFyZW50UGF0aH0uJHtmaWVsZC5uYW1lfWA7XG4gICAgICAgICAgICBsZXQgZG9jUGF0aCA9IGAke3BhcmVudERvY1BhdGh9LiR7ZG9jTmFtZX1gO1xuICAgICAgICAgICAgaWYgKGZpZWxkLmFycmF5RGVwdGggPiAwKSB7XG4gICAgICAgICAgICAgICAgbGV0IHN1ZmZpeCA9ICdbKl0nO1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGRlcHRoID0gMTA7IGRlcHRoID4gMDsgZGVwdGggLT0gMSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzID0gYFskeycqJy5yZXBlYXQoZGVwdGgpfV1gO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZG9jUGF0aC5pbmNsdWRlcyhzKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VmZml4ID0gYFskeycqJy5yZXBlYXQoZGVwdGggKyAxKX1dYDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGRvY1BhdGggPSBgJHtkb2NQYXRofSR7c3VmZml4fWA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzd2l0Y2goZmllbGQudHlwZS5jYXRlZ29yeSkge1xuICAgICAgICAgICAgY2FzZSBcInNjYWxhclwiOlxuICAgICAgICAgICAgICAgIGxldCB0eXBlTmFtZTtcbiAgICAgICAgICAgICAgICBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMuYm9vbGVhbikge1xuICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZSA9ICdib29sZWFuJztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLmZsb2F0KSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lID0gJ251bWJlcic7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC50eXBlID09PSBzY2FsYXJUeXBlcy5pbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWUgPSAnbnVtYmVyJztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLnVpbnQ2NCkge1xuICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZSA9ICd1aW50NjQnO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDEwMjQpIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWUgPSAndWludDEwMjQnO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lID0gJ3N0cmluZyc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGpzLndyaXRlTG4oYHNjYWxhckZpZWxkcy5zZXQoJyR7cGF0aH0nLCB7IHR5cGU6ICcke3R5cGVOYW1lfScsIHBhdGg6ICcke2RvY1BhdGh9JyB9KTtgKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJzdHJ1Y3RcIjpcbiAgICAgICAgICAgIGNhc2UgXCJ1bmlvblwiOlxuICAgICAgICAgICAgICAgIGdlbkpTU2NhbGFyRmllbGRzKGZpZWxkLnR5cGUsIHBhdGgsIGRvY1BhdGgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cblxuICAgIGZ1bmN0aW9uIGdlbkpTVHlwZVJlc29sdmVyc0ZvclVuaW9uKHR5cGU6IERiVHlwZSkge1xuICAgICAgICBpZiAodHlwZS5jYXRlZ29yeSA9PT0gRGJUeXBlQ2F0ZWdvcnkudW5pb24pIHtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgJHt0eXBlLm5hbWV9OiAke3R5cGUubmFtZX1SZXNvbHZlcixgKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbmVyYXRlKHR5cGVzOiBEYlR5cGVbXSkge1xuXG4gICAgICAgIC8vIEdcblxuICAgICAgICBnLndyaXRlQmxvY2tMbihgXG4gICAgICAgIFwiXCJcIlxuICAgICAgICBEdWUgdG8gR3JhcGhRTCBsaW1pdGF0aW9ucyBiaWcgbnVtYmVycyBhcmUgcmV0dXJuZWQgYXMgYSBzdHJpbmcuXG4gICAgICAgIFlvdSBjYW4gc3BlY2lmeSBmb3JtYXQgdXNlZCB0byBzdHJpbmcgcmVwcmVzZW50YXRpb24gZm9yIGJpZyBpbnRlZ2Vycy5cbiAgICAgICAgXCJcIlwiXG4gICAgICAgIGVudW0gQmlnSW50Rm9ybWF0IHtcbiAgICAgICAgICAgIFwiIEhleGFkZWNpbWFsIHJlcHJlc2VudGF0aW9uIHN0YXJ0ZWQgd2l0aCAweCAoZGVmYXVsdCkgXCJcbiAgICAgICAgICAgIEhFWFxuICAgICAgICAgICAgXCIgRGVjaW1hbCByZXByZXNlbnRhdGlvbiBcIlxuICAgICAgICAgICAgREVDXG4gICAgICAgIH1cbiAgICAgICAgYCk7XG4gICAgICAgIFsnU3RyaW5nJywgJ0Jvb2xlYW4nLCAnSW50JywgJ0Zsb2F0J10uZm9yRWFjaChnZW5HU2NhbGFyVHlwZXNGaWx0ZXIpO1xuICAgICAgICBnZW5HRW51bVR5cGVzKCk7XG4gICAgICAgIHR5cGVzLmZvckVhY2godHlwZSA9PiBnZW5HVHlwZURlY2xhcmF0aW9uKHR5cGUpKTtcbiAgICAgICAgY29uc3QgZ0FycmF5RmlsdGVycyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKHR5cGUgPT4gZ2VuR0ZpbHRlcih0eXBlLCBnQXJyYXlGaWx0ZXJzKSk7XG5cbiAgICAgICAgY29uc3QgY29sbGVjdGlvbnMgPSB0eXBlcy5maWx0ZXIodCA9PiAhIXQuY29sbGVjdGlvbik7XG4gICAgICAgIGdlbkdRdWVyaWVzKGNvbGxlY3Rpb25zKTtcbiAgICAgICAgZ2VuR1N1YnNjcmlwdGlvbnMoY29sbGVjdGlvbnMpO1xuXG4gICAgICAgIC8vIEpTXG5cbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgY29uc3Qge1xuICAgICAgICAgICAgc2NhbGFyLFxuICAgICAgICAgICAgYmlnVUludDEsXG4gICAgICAgICAgICBiaWdVSW50MixcbiAgICAgICAgICAgIHJlc29sdmVCaWdVSW50LFxuICAgICAgICAgICAgc3RydWN0LFxuICAgICAgICAgICAgYXJyYXksXG4gICAgICAgICAgICBqb2luLFxuICAgICAgICAgICAgam9pbkFycmF5LFxuICAgICAgICAgICAgZW51bU5hbWUsXG4gICAgICAgICAgICBzdHJpbmdDb21wYW5pb24sXG4gICAgICAgICAgICBjcmVhdGVFbnVtTmFtZVJlc29sdmVyLFxuICAgICAgICAgICAgdW5peE1pbGxpc2Vjb25kc1RvU3RyaW5nLFxuICAgICAgICAgICAgdW5peFNlY29uZHNUb1N0cmluZyxcbiAgICAgICAgfSA9IHJlcXVpcmUoJy4uL2ZpbHRlci9maWx0ZXJzLmpzJyk7XG4gICAgICAgIGApO1xuICAgICAgICBjb25zdCBqc0FycmF5RmlsdGVycyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKHR5cGUgPT4gZ2VuSlNGaWx0ZXIodHlwZSwganNBcnJheUZpbHRlcnMpKTtcblxuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBmdW5jdGlvbiBjcmVhdGVSZXNvbHZlcnMoZGF0YSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgYCk7XG4gICAgICAgIHR5cGVzLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICAgICAgICAgIGdlbkpTQ3VzdG9tUmVzb2x2ZXJzKHR5cGUpO1xuICAgICAgICAgICAgZ2VuSlNUeXBlUmVzb2x2ZXJzRm9yVW5pb24odHlwZSk7XG4gICAgICAgIH0pO1xuICAgICAgICBqcy53cml0ZUxuKCcgICAgICAgIFF1ZXJ5OiB7Jyk7XG4gICAgICAgIGNvbGxlY3Rpb25zLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICR7dHlwZS5jb2xsZWN0aW9uIHx8ICcnfTogZGF0YS4ke3R5cGUuY29sbGVjdGlvbiB8fCAnJ30ucXVlcnlSZXNvbHZlcigpLGApXG4gICAgICAgIH0pO1xuICAgICAgICBqcy53cml0ZUxuKCcgICAgICAgIH0sJyk7XG4gICAgICAgIGpzLndyaXRlTG4oJyAgICAgICAgU3Vic2NyaXB0aW9uOiB7Jyk7XG4gICAgICAgIGNvbGxlY3Rpb25zLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICR7dHlwZS5jb2xsZWN0aW9uIHx8ICcnfTogZGF0YS4ke3R5cGUuY29sbGVjdGlvbiB8fCAnJ30uc3Vic2NyaXB0aW9uUmVzb2x2ZXIoKSxgKVxuICAgICAgICB9KTtcbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBgKTtcblxuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBjb25zdCBzY2FsYXJGaWVsZHMgPSBuZXcgTWFwKCk7XG4gICAgICAgIGApO1xuICAgICAgICBjb2xsZWN0aW9ucy5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgICAgICAgICBnZW5KU1NjYWxhckZpZWxkcyh0eXBlLCB0eXBlLmNvbGxlY3Rpb24gfHwgJycsICdkb2MnKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgICAgICAgICBzY2FsYXJGaWVsZHMsXG4gICAgICAgICAgICBjcmVhdGVSZXNvbHZlcnMsXG4gICAgICAgIGApO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKHR5cGUgPT4ganMud3JpdGVMbihgICAgICR7dHlwZS5uYW1lfSxgKSk7XG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIH07XG4gICAgICAgIGApO1xuICAgIH1cblxuICAgIGdlbmVyYXRlKGRiVHlwZXMpO1xuXG4gICAgZm9yIChjb25zdCBlOiBJbnRFbnVtRGVmIG9mIGVudW1UeXBlcy52YWx1ZXMoKSkge1xuICAgICAgICBjb25zb2xlLmxvZyhgZXhwb3J0IGNvbnN0IFEke2UubmFtZX0gPSB7YCk7XG4gICAgICAgIGNvbnNvbGUubG9nKE9iamVjdC5lbnRyaWVzKGUudmFsdWVzKS5tYXAoKFtuYW1lLCB2YWx1ZV0pID0+IHtcbiAgICAgICAgICAgIHJldHVybiBgICAgICR7bmFtZX06ICR7KHZhbHVlOiBhbnkpfSxgO1xuICAgICAgICB9KS5qb2luKCdcXG4nKSk7XG4gICAgICAgIGNvbnNvbGUubG9nKGB9O1xcbmApO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIHFsOiBnLmdlbmVyYXRlZCgpLFxuICAgICAgICBqczoganMuZ2VuZXJhdGVkKCksXG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBtYWluO1xuIl19