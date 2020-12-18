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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9tYWludGFuYW5jZS9nZW4tZ3JhcGhxbC9xbC1qcy1nZW5lcmF0b3IuanMiXSwibmFtZXMiOlsibWFpbiIsInNjaGVtYURlZiIsInR5cGVzIiwiZGJUeXBlcyIsImVudW1UeXBlcyIsImciLCJXcml0ZXIiLCJqcyIsImdlbkdEb2MiLCJwcmVmaXgiLCJkb2MiLCJ0cmltIiwibGluZXMiLCJzcGxpdCIsImxlbmd0aCIsImluY2x1ZGVzIiwid3JpdGVMbiIsImZvckVhY2giLCJsaW5lIiwidW5pb25WYXJpYW50VHlwZSIsInR5cGUiLCJ2YXJpYW50IiwibmFtZSIsImdlbkdUeXBlRGVjbGFyYXRpb25zRm9yVW5pb25WYXJpYW50cyIsImZpZWxkcyIsIndyaXRlQmxvY2tMbiIsImdlbkdFbnVtVHlwZXMiLCJlbnVtRGVmIiwidmFsdWVzIiwiT2JqZWN0Iiwia2V5cyIsImdlbkdUeXBlRGVjbGFyYXRpb24iLCJjYXRlZ29yeSIsIkRiVHlwZUNhdGVnb3J5IiwidW5pb24iLCJmaWVsZCIsInR5cGVEZWNsYXJhdGlvbiIsInJlcGVhdCIsImFycmF5RGVwdGgiLCJwYXJhbXMiLCJqb2luIiwiZm9ybWF0dGVyIiwicHJldmVudFR3aWNlIiwibmFtZXMiLCJ3b3JrIiwiaGFzIiwiYWRkIiwiZ2VuR0ZpbHRlcnNGb3JBcnJheUZpZWxkcyIsImdOYW1lcyIsIml0ZW1UeXBlTmFtZSIsImkiLCJmaWx0ZXJOYW1lIiwib3AiLCJnZW5HRmlsdGVyc0ZvckVudW1OYW1lRmllbGRzIiwiZ2VuR1NjYWxhclR5cGVzRmlsdGVyIiwiZ2VuR0ZpbHRlciIsImdlbkdRdWVyaWVzIiwiY29sbGVjdGlvbiIsImdlbkdTdWJzY3JpcHRpb25zIiwiZ2V0U2NhbGFyUmVzb2x2ZXJOYW1lIiwic2NhbGFyVHlwZXMiLCJ1aW50NjQiLCJ1aW50MTAyNCIsImdlbkpTRmlsdGVyc0ZvckFycmF5RmllbGRzIiwianNOYW1lcyIsIml0ZW1SZXNvbHZlck5hbWUiLCJzY2FsYXIiLCJnZW5KU1N0cnVjdEZpbHRlciIsInN1ZmZpeCIsIm9uIiwicmVmT24iLCJnZW5KU1VuaW9uUmVzb2x2ZXIiLCJnZW5KU0ZpbHRlciIsImdlbkpTQ3VzdG9tUmVzb2x2ZXJzIiwiam9pbkZpZWxkcyIsImZpbHRlciIsIngiLCJiaWdVSW50RmllbGRzIiwic3RyaW5nRm9ybWF0dGVkRmllbGRzIiwiZW51bUZpZWxkcyIsImN1c3RvbVJlc29sdmVyUmVxdWlyZWQiLCJvbkZpZWxkIiwiZmluZCIsInByZUNvbmRpdGlvbiIsInByZWZpeExlbmd0aCIsImdlbkpTU2NhbGFyRmllbGRzIiwicGFyZW50UGF0aCIsInBhcmVudERvY1BhdGgiLCJkb2NOYW1lIiwicGF0aCIsImRvY1BhdGgiLCJkZXB0aCIsInMiLCJ0eXBlTmFtZSIsImJvb2xlYW4iLCJmbG9hdCIsImludCIsImdlbkpTVHlwZVJlc29sdmVyc0ZvclVuaW9uIiwiZ2VuZXJhdGUiLCJnQXJyYXlGaWx0ZXJzIiwiU2V0IiwiY29sbGVjdGlvbnMiLCJ0IiwianNBcnJheUZpbHRlcnMiLCJlIiwiY29uc29sZSIsImxvZyIsImVudHJpZXMiLCJtYXAiLCJ2YWx1ZSIsInFsIiwiZ2VuZXJhdGVkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBRUE7O0FBR0E7O0FBUUEsU0FBU0EsSUFBVCxDQUFjQyxTQUFkLEVBQWtDO0FBQzlCLFFBQU07QUFBRUMsSUFBQUEsS0FBSyxFQUFFQyxPQUFUO0FBQWtCQyxJQUFBQTtBQUFsQixNQUErQixrQ0FBY0gsU0FBZCxDQUFyQyxDQUQ4QixDQUdsQzs7QUFFSSxRQUFNSSxDQUFDLEdBQUcsSUFBSUMsV0FBSixFQUFWO0FBQ0EsUUFBTUMsRUFBRSxHQUFHLElBQUlELFdBQUosRUFBWDs7QUFFQSxXQUFTRSxPQUFULENBQWlCQyxNQUFqQixFQUFpQ0MsR0FBakMsRUFBOEM7QUFDMUMsUUFBSUEsR0FBRyxDQUFDQyxJQUFKLE9BQWUsRUFBbkIsRUFBdUI7QUFDbkI7QUFDSDs7QUFDRCxVQUFNQyxLQUFLLEdBQUdGLEdBQUcs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RUFBeUJnRixHQUF6QixDQUE2QixDQUFDLENBQUN0RixJQUFELEVBQU91RixLQUFQLENBQUQsS0FBbUI7QUFDeEQsYUFBUSxPQUFNdkYsSUFBSyxLQUFLdUYsS0FBWSxHQUFwQztBQUNILEtBRlcsRUFFVHJFLElBRlMsQ0FFSixJQUZJLENBQVo7QUFHQWlFLElBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFhLE1BQWI7QUFDSDs7QUFFRCxTQUFPO0FBQ0hJLElBQUFBLEVBQUUsRUFBRXpHLENBQUMsQ0FBQzBHLFNBQUYsRUFERDtBQUVIeEcsSUFBQUEsRUFBRSxFQUFFQSxFQUFFLENBQUN3RyxTQUFIO0FBRkQsR0FBUDtBQUlIOztlQUVjL0csSSIsInNvdXJjZXNDb250ZW50IjpbIi8vQGZsb3dcblxuaW1wb3J0IHtXcml0ZXJ9IGZyb20gJy4vZ2VuLmpzJztcbmltcG9ydCB0eXBlIHtUeXBlRGVmfSBmcm9tICcuLi8uLi9zZXJ2ZXIvc2NoZW1hL3NjaGVtYS5qcyc7XG5pbXBvcnQgdHlwZSB7RGJGaWVsZCwgRGJUeXBlLCBJbnRFbnVtRGVmfSBmcm9tICcuLi8uLi9zZXJ2ZXIvc2NoZW1hL2RiLXNjaGVtYS10eXBlcyc7XG5pbXBvcnQge1xuICAgIERiVHlwZUNhdGVnb3J5LFxuICAgIGlzQmlnSW50LCBwYXJzZURiU2NoZW1hLFxuICAgIHNjYWxhclR5cGVzLFxuICAgIHN0cmluZ2lmeUVudW1WYWx1ZXMsXG4gICAgdG9FbnVtU3R5bGUsXG59IGZyb20gJy4uLy4uL3NlcnZlci9zY2hlbWEvZGItc2NoZW1hLXR5cGVzJztcblxuZnVuY3Rpb24gbWFpbihzY2hlbWFEZWY6IFR5cGVEZWYpIHtcbiAgICBjb25zdCB7IHR5cGVzOiBkYlR5cGVzLCBlbnVtVHlwZXN9ID0gcGFyc2VEYlNjaGVtYShzY2hlbWFEZWYpO1xuXG4vLyBHZW5lcmF0b3JzXG5cbiAgICBjb25zdCBnID0gbmV3IFdyaXRlcigpO1xuICAgIGNvbnN0IGpzID0gbmV3IFdyaXRlcigpO1xuXG4gICAgZnVuY3Rpb24gZ2VuR0RvYyhwcmVmaXg6IHN0cmluZywgZG9jOiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKGRvYy50cmltKCkgPT09ICcnKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbGluZXMgPSBkb2Muc3BsaXQoL1xcblxccj98XFxyXFxuPy8pO1xuICAgICAgICBpZiAobGluZXMubGVuZ3RoID09PSAxICYmICFsaW5lc1swXS5pbmNsdWRlcygnXCInKSkge1xuICAgICAgICAgICAgZy53cml0ZUxuKHByZWZpeCwgJ1wiJywgbGluZXNbMF0sICdcIicpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZy53cml0ZUxuKHByZWZpeCwgJ1wiXCJcIicpO1xuICAgICAgICAgICAgbGluZXMuZm9yRWFjaCgobGluZSkgPT4ge1xuICAgICAgICAgICAgICAgIGcud3JpdGVMbihwcmVmaXgsIGxpbmUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBnLndyaXRlTG4ocHJlZml4LCAnXCJcIlwiJyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiB1bmlvblZhcmlhbnRUeXBlKHR5cGU6IERiVHlwZSwgdmFyaWFudDogRGJGaWVsZCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiBgJHt0eXBlLm5hbWV9JHt2YXJpYW50Lm5hbWV9VmFyaWFudGA7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuR1R5cGVEZWNsYXJhdGlvbnNGb3JVbmlvblZhcmlhbnRzKHR5cGU6IERiVHlwZSkge1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKCh2YXJpYW50KSA9PiB7XG4gICAgICAgICAgICBnLndyaXRlQmxvY2tMbihgXG4gICAgICAgIHR5cGUgJHt1bmlvblZhcmlhbnRUeXBlKHR5cGUsIHZhcmlhbnQpfSB7XG4gICAgICAgICAgICAke3ZhcmlhbnQubmFtZX06ICR7dmFyaWFudC50eXBlLm5hbWV9XG4gICAgICAgIH1cblxuICAgICAgICBgKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuR0VudW1UeXBlcygpIHtcbiAgICAgICAgZm9yIChjb25zdCBlbnVtRGVmOiBJbnRFbnVtRGVmIG9mIGVudW1UeXBlcy52YWx1ZXMoKSkge1xuICAgICAgICAgICAgZy53cml0ZUxuKGBlbnVtICR7ZW51bURlZi5uYW1lfUVudW0ge2ApO1xuICAgICAgICAgICAgT2JqZWN0LmtleXMoZW51bURlZi52YWx1ZXMpLmZvckVhY2goKG5hbWUpID0+IHtcbiAgICAgICAgICAgICAgICBnLndyaXRlTG4oYCAgICAke3RvRW51bVN0eWxlKG5hbWUpfWApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBnLndyaXRlTG4oYH1gKTtcbiAgICAgICAgICAgIGcud3JpdGVMbigpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuR1R5cGVEZWNsYXJhdGlvbih0eXBlOiBEYlR5cGUpIHtcbiAgICAgICAgaWYgKHR5cGUuY2F0ZWdvcnkgPT09IERiVHlwZUNhdGVnb3J5LnVuaW9uKSB7XG4gICAgICAgICAgICBnZW5HVHlwZURlY2xhcmF0aW9uc0ZvclVuaW9uVmFyaWFudHModHlwZSk7XG4gICAgICAgICAgICBnLndyaXRlTG4oYHVuaW9uICR7dHlwZS5uYW1lfSA9IGApO1xuICAgICAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCh2YXJpYW50ID0+IHtcbiAgICAgICAgICAgICAgICBnLndyaXRlTG4oYFxcdHwgJHt1bmlvblZhcmlhbnRUeXBlKHR5cGUsIHZhcmlhbnQpfWApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBnLndyaXRlTG4oKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGdlbkdEb2MoJycsIHR5cGUuZG9jKTtcbiAgICAgICAgICAgIGcud3JpdGVMbihgdHlwZSAke3R5cGUubmFtZX0ge2ApO1xuICAgICAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaChmaWVsZCA9PiB7XG4gICAgICAgICAgICAgICAgZ2VuR0RvYygnXFx0JywgZmllbGQuZG9jKTtcbiAgICAgICAgICAgICAgICBjb25zdCB0eXBlRGVjbGFyYXRpb24gPVxuICAgICAgICAgICAgICAgICAgICAnWycucmVwZWF0KGZpZWxkLmFycmF5RGVwdGgpICtcbiAgICAgICAgICAgICAgICAgICAgZmllbGQudHlwZS5uYW1lICtcbiAgICAgICAgICAgICAgICAgICAgJ10nLnJlcGVhdChmaWVsZC5hcnJheURlcHRoKTtcbiAgICAgICAgICAgICAgICBsZXQgcGFyYW1zID0gJyc7XG4gICAgICAgICAgICAgICAgaWYgKGlzQmlnSW50KGZpZWxkLnR5cGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhcmFtcyA9ICcoZm9ybWF0OiBCaWdJbnRGb3JtYXQpJztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLmpvaW4pIHtcbiAgICAgICAgICAgICAgICAgICAgcGFyYW1zID0gYCh0aW1lb3V0OiBJbnQsIHdoZW46ICR7dHlwZS5uYW1lfUZpbHRlcilgO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGcud3JpdGVMbihgXFx0JHtmaWVsZC5uYW1lfSR7cGFyYW1zfTogJHt0eXBlRGVjbGFyYXRpb259YCk7XG4gICAgICAgICAgICAgICAgY29uc3QgZW51bURlZiA9IGZpZWxkLmVudW1EZWY7XG4gICAgICAgICAgICAgICAgaWYgKGVudW1EZWYpIHtcbiAgICAgICAgICAgICAgICAgICAgZy53cml0ZUxuKGBcXHQke2ZpZWxkLm5hbWV9X25hbWU6ICR7ZW51bURlZi5uYW1lfUVudW1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGZpZWxkLmZvcm1hdHRlcikge1xuICAgICAgICAgICAgICAgICAgICBnLndyaXRlTG4oYFxcdCR7ZmllbGQubmFtZX1fc3RyaW5nOiBTdHJpbmdgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGcud3JpdGVMbihgfWApO1xuICAgICAgICB9XG4gICAgICAgIGcud3JpdGVMbigpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHByZXZlbnRUd2ljZShuYW1lOiBzdHJpbmcsIG5hbWVzOiBTZXQ8c3RyaW5nPiwgd29yazogKCkgPT4gdm9pZCkge1xuICAgICAgICBpZiAoIW5hbWVzLmhhcyhuYW1lKSkge1xuICAgICAgICAgICAgbmFtZXMuYWRkKG5hbWUpO1xuICAgICAgICAgICAgd29yaygpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuR0ZpbHRlcnNGb3JBcnJheUZpZWxkcyh0eXBlOiBEYlR5cGUsIGdOYW1lczogU2V0PHN0cmluZz4pIHtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGxldCBpdGVtVHlwZU5hbWUgPSBmaWVsZC50eXBlLm5hbWU7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZpZWxkLmFycmF5RGVwdGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpbHRlck5hbWUgPSBgJHtpdGVtVHlwZU5hbWV9QXJyYXlGaWx0ZXJgO1xuICAgICAgICAgICAgICAgIHByZXZlbnRUd2ljZShmaWx0ZXJOYW1lLCBnTmFtZXMsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgZy53cml0ZUxuKGBpbnB1dCAke2ZpbHRlck5hbWV9IHtgKTtcbiAgICAgICAgICAgICAgICAgICAgWydhbnknLCAnYWxsJ10uZm9yRWFjaCgob3ApID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGcud3JpdGVMbihgXFx0JHtvcH06ICR7aXRlbVR5cGVOYW1lfUZpbHRlcmApO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgZy53cml0ZUxuKCd9Jyk7XG4gICAgICAgICAgICAgICAgICAgIGcud3JpdGVMbigpO1xuXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaXRlbVR5cGVOYW1lICs9ICdBcnJheSc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkdGaWx0ZXJzRm9yRW51bU5hbWVGaWVsZHModHlwZTogRGJUeXBlLCBnTmFtZXM6IFNldDxzdHJpbmc+KSB7XG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBlbnVtRGVmID0gZmllbGQuZW51bURlZjtcbiAgICAgICAgICAgIGlmIChlbnVtRGVmKSB7XG4gICAgICAgICAgICAgICAgcHJldmVudFR3aWNlKGAke2VudW1EZWYubmFtZX1FbnVtRmlsdGVyYCwgZ05hbWVzLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGdlbkdTY2FsYXJUeXBlc0ZpbHRlcihgJHtlbnVtRGVmLm5hbWV9RW51bWApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5HRmlsdGVyKHR5cGU6IERiVHlwZSwgZ05hbWVzOiBTZXQ8c3RyaW5nPikge1xuICAgICAgICBpZiAodHlwZS5maWVsZHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgZ2VuR0ZpbHRlcnNGb3JBcnJheUZpZWxkcyh0eXBlLCBnTmFtZXMpO1xuICAgICAgICBnZW5HRmlsdGVyc0ZvckVudW1OYW1lRmllbGRzKHR5cGUsIGdOYW1lcyk7XG4gICAgICAgIGdlbkdEb2MoJycsIHR5cGUuZG9jKTtcbiAgICAgICAgZy53cml0ZUxuKGBpbnB1dCAke3R5cGUubmFtZX1GaWx0ZXIge2ApO1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgZ2VuR0RvYygnXFx0JywgZmllbGQuZG9jKTtcbiAgICAgICAgICAgIGNvbnN0IHR5cGVEZWNsYXJhdGlvbiA9IGZpZWxkLnR5cGUubmFtZSArIFwiQXJyYXlcIi5yZXBlYXQoZmllbGQuYXJyYXlEZXB0aCk7XG4gICAgICAgICAgICBnLndyaXRlTG4oYFxcdCR7ZmllbGQubmFtZX06ICR7dHlwZURlY2xhcmF0aW9ufUZpbHRlcmApO1xuICAgICAgICAgICAgY29uc3QgZW51bURlZiA9IGZpZWxkLmVudW1EZWY7XG4gICAgICAgICAgICBpZiAoZW51bURlZikge1xuICAgICAgICAgICAgICAgIGcud3JpdGVMbihgXFx0JHtmaWVsZC5uYW1lfV9uYW1lOiAke2VudW1EZWYubmFtZX1FbnVtRmlsdGVyYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBnLndyaXRlTG4oYCAgICBPUjogJHt0eXBlLm5hbWV9RmlsdGVyYCk7XG4gICAgICAgIGcud3JpdGVMbihgfWApO1xuICAgICAgICBnLndyaXRlTG4oKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5HU2NhbGFyVHlwZXNGaWx0ZXIobmFtZTogc3RyaW5nKSB7XG4gICAgICAgIGcud3JpdGVMbihgaW5wdXQgJHtuYW1lfUZpbHRlciB7YCk7XG4gICAgICAgIFsnZXEnLCAnbmUnLCAnZ3QnLCAnbHQnLCAnZ2UnLCAnbGUnXS5mb3JFYWNoKChvcCkgPT4ge1xuICAgICAgICAgICAgZy53cml0ZUxuKGBcXHQke29wfTogJHtuYW1lfWApO1xuICAgICAgICB9KTtcbiAgICAgICAgWydpbicsICdub3RJbiddLmZvckVhY2goKG9wKSA9PiB7XG4gICAgICAgICAgICBnLndyaXRlTG4oYFxcdCR7b3B9OiBbJHtuYW1lfV1gKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGcud3JpdGVMbignfScpO1xuICAgICAgICBnLndyaXRlTG4oKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5HUXVlcmllcyh0eXBlczogRGJUeXBlW10pIHtcbiAgICAgICAgZy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBcIlNwZWNpZnkgc29ydCBvcmRlciBkaXJlY3Rpb25cIlxuICAgICAgICBlbnVtIFF1ZXJ5T3JkZXJCeURpcmVjdGlvbiB7XG4gICAgICAgICAgICBcIkRvY3VtZW50cyB3aWxsIGJlIHNvcnRlZCBpbiBhc2NlbmRlZCBvcmRlciAoZS5nLiBmcm9tIEEgdG8gWilcIlxuICAgICAgICAgICAgQVNDXG4gICAgICAgICAgICBcIkRvY3VtZW50cyB3aWxsIGJlIHNvcnRlZCBpbiBkZXNjZW5kYW50IG9yZGVyIChlLmcuIGZyb20gWiB0byBBKVwiXG4gICAgICAgICAgICBERVNDXG4gICAgICAgIH1cblxuICAgICAgICBcbiAgICAgICAgXCJcIlwiXG4gICAgICAgIFNwZWNpZnkgaG93IHRvIHNvcnQgcmVzdWx0cy5cbiAgICAgICAgWW91IGNhbiBzb3J0IGRvY3VtZW50cyBpbiByZXN1bHQgc2V0IHVzaW5nIG1vcmUgdGhhbiBvbmUgZmllbGQuXG4gICAgICAgIFwiXCJcIlxuICAgICAgICBpbnB1dCBRdWVyeU9yZGVyQnkge1xuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgICBQYXRoIHRvIGZpZWxkIHdoaWNoIG11c3QgYmUgdXNlZCBhcyBhIHNvcnQgY3JpdGVyaWEuXG4gICAgICAgICAgICBJZiBmaWVsZCByZXNpZGVzIGRlZXAgaW4gc3RydWN0dXJlIHBhdGggaXRlbXMgbXVzdCBiZSBzZXBhcmF0ZWQgd2l0aCBkb3QgKGUuZy4gJ2Zvby5iYXIuYmF6JykuXG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICAgIHBhdGg6IFN0cmluZ1xuICAgICAgICAgICAgXCJTb3J0IG9yZGVyIGRpcmVjdGlvblwiXG4gICAgICAgICAgICBkaXJlY3Rpb246IFF1ZXJ5T3JkZXJCeURpcmVjdGlvblxuICAgICAgICB9XG5cbiAgICAgICAgdHlwZSBRdWVyeSB7XG4gICAgICAgIGApO1xuXG4gICAgICAgIHR5cGVzLmZvckVhY2goKHR5cGU6IERiVHlwZSkgPT4ge1xuICAgICAgICAgICAgZy53cml0ZUxuKGBcXHQke3R5cGUuY29sbGVjdGlvbiB8fCAnJ30oZmlsdGVyOiAke3R5cGUubmFtZX1GaWx0ZXIsIG9yZGVyQnk6IFtRdWVyeU9yZGVyQnldLCBsaW1pdDogSW50LCB0aW1lb3V0OiBGbG9hdCwgYWNjZXNzS2V5OiBTdHJpbmcsIG9wZXJhdGlvbklkOiBTdHJpbmcpOiBbJHt0eXBlLm5hbWV9XWApO1xuICAgICAgICB9KTtcblxuICAgICAgICBnLndyaXRlQmxvY2tMbihgXG4gICAgICAgIH1cblxuICAgICAgICBgKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5HU3Vic2NyaXB0aW9ucyh0eXBlczogRGJUeXBlW10pIHtcbiAgICAgICAgZy53cml0ZUxuKCd0eXBlIFN1YnNjcmlwdGlvbiB7Jyk7XG4gICAgICAgIHR5cGVzLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICAgICAgICAgIGcud3JpdGVMbihgXFx0JHt0eXBlLmNvbGxlY3Rpb24gfHwgJyd9KGZpbHRlcjogJHt0eXBlLm5hbWV9RmlsdGVyLCBhY2Nlc3NLZXk6IFN0cmluZyk6ICR7dHlwZS5uYW1lfWApO1xuICAgICAgICB9KTtcbiAgICAgICAgZy53cml0ZUxuKCd9Jyk7XG4gICAgfVxuXG5cbiAgICBmdW5jdGlvbiBnZXRTY2FsYXJSZXNvbHZlck5hbWUoZmllbGQ6IERiRmllbGQpOiBzdHJpbmcge1xuICAgICAgICBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDY0KSB7XG4gICAgICAgICAgICByZXR1cm4gJ2JpZ1VJbnQxJztcbiAgICAgICAgfVxuICAgICAgICBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDEwMjQpIHtcbiAgICAgICAgICAgIHJldHVybiAnYmlnVUludDInO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnc2NhbGFyJztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5KU0ZpbHRlcnNGb3JBcnJheUZpZWxkcyh0eXBlOiBEYlR5cGUsIGpzTmFtZXM6IFNldDxzdHJpbmc+KSB7XG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBsZXQgaXRlbVR5cGVOYW1lID0gZmllbGQudHlwZS5uYW1lO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmaWVsZC5hcnJheURlcHRoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWx0ZXJOYW1lID0gYCR7aXRlbVR5cGVOYW1lfUFycmF5YDtcbiAgICAgICAgICAgICAgICBwcmV2ZW50VHdpY2UoZmlsdGVyTmFtZSwganNOYW1lcywgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpdGVtUmVzb2x2ZXJOYW1lID0gKGkgPT09IDAgJiYgZmllbGQudHlwZS5jYXRlZ29yeSA9PT0gRGJUeXBlQ2F0ZWdvcnkuc2NhbGFyKVxuICAgICAgICAgICAgICAgICAgICAgICAgPyBnZXRTY2FsYXJSZXNvbHZlck5hbWUoZmllbGQpXG4gICAgICAgICAgICAgICAgICAgICAgICA6IGl0ZW1UeXBlTmFtZTtcbiAgICAgICAgICAgICAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgICAgICAgICBjb25zdCAke2ZpbHRlck5hbWV9ID0gYXJyYXkoKCkgPT4gJHtpdGVtUmVzb2x2ZXJOYW1lfSk7XG4gICAgICAgICAgICAgICAgYCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaXRlbVR5cGVOYW1lICs9ICdBcnJheSc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkpTU3RydWN0RmlsdGVyKHR5cGU6IERiVHlwZSkge1xuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBjb25zdCAke3R5cGUubmFtZX0gPSBzdHJ1Y3Qoe1xuICAgIGApO1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZDogRGJGaWVsZCkgPT4ge1xuICAgICAgICAgICAgbGV0IHR5cGVEZWNsYXJhdGlvbjogP3N0cmluZyA9IG51bGw7XG4gICAgICAgICAgICBjb25zdCBqb2luID0gZmllbGQuam9pbjtcbiAgICAgICAgICAgIGlmIChqb2luKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3VmZml4ID0gZmllbGQuYXJyYXlEZXB0aCA+IDAgPyAnQXJyYXknIDogJyc7XG4gICAgICAgICAgICAgICAgdHlwZURlY2xhcmF0aW9uID0gYGpvaW4ke3N1ZmZpeH0oJyR7am9pbi5vbn0nLCAnJHtqb2luLnJlZk9ufScsICcke2ZpZWxkLnR5cGUuY29sbGVjdGlvbiB8fCAnJ30nLCAoKSA9PiAke2ZpZWxkLnR5cGUubmFtZX0pYDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQuYXJyYXlEZXB0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB0eXBlRGVjbGFyYXRpb24gPVxuICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlLm5hbWUgK1xuICAgICAgICAgICAgICAgICAgICAnQXJyYXknLnJlcGVhdChmaWVsZC5hcnJheURlcHRoKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZS5jYXRlZ29yeSA9PT0gRGJUeXBlQ2F0ZWdvcnkuc2NhbGFyKSB7XG4gICAgICAgICAgICAgICAgdHlwZURlY2xhcmF0aW9uID0gZ2V0U2NhbGFyUmVzb2x2ZXJOYW1lKGZpZWxkKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZS5maWVsZHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHR5cGVEZWNsYXJhdGlvbiA9IGZpZWxkLnR5cGUubmFtZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0eXBlRGVjbGFyYXRpb24pIHtcbiAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgJHtmaWVsZC5uYW1lfTogJHt0eXBlRGVjbGFyYXRpb259LGApO1xuICAgICAgICAgICAgICAgIGNvbnN0IGVudW1EZWYgPSBmaWVsZC5lbnVtRGVmO1xuICAgICAgICAgICAgICAgIGlmIChlbnVtRGVmKSB7XG4gICAgICAgICAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAke2ZpZWxkLm5hbWV9X25hbWU6IGVudW1OYW1lKCcke2ZpZWxkLm5hbWV9JywgJHtzdHJpbmdpZnlFbnVtVmFsdWVzKGVudW1EZWYudmFsdWVzKX0pLGApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZmllbGQuZm9ybWF0dGVyKSB7XG4gICAgICAgICAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAke2ZpZWxkLm5hbWV9X3N0cmluZzogc3RyaW5nQ29tcGFuaW9uKCcke2ZpZWxkLm5hbWV9JyksYCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgfSR7dHlwZS5jb2xsZWN0aW9uID8gJywgdHJ1ZScgOiAnJ30pO1xuXG4gICAgYCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuSlNVbmlvblJlc29sdmVyKHR5cGU6IERiVHlwZSkge1xuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBjb25zdCAke3R5cGUubmFtZX1SZXNvbHZlciA9IHtcbiAgICAgICAgICAgIF9fcmVzb2x2ZVR5cGUob2JqLCBjb250ZXh0LCBpbmZvKSB7XG4gICAgICAgIGApO1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKCh2YXJpYW50KSA9PiB7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgIGlmICgnJHt2YXJpYW50Lm5hbWV9JyBpbiBvYmopIHtgKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgIHJldHVybiAnJHt1bmlvblZhcmlhbnRUeXBlKHR5cGUsIHZhcmlhbnQpfSc7YCk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgIH1gKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgYCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuSlNGaWx0ZXIodHlwZTogRGJUeXBlLCBqc05hbWVzOiBTZXQ8c3RyaW5nPikge1xuICAgICAgICBpZiAodHlwZS5maWVsZHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGUuY2F0ZWdvcnkgPT09IERiVHlwZUNhdGVnb3J5LnVuaW9uKSB7XG4gICAgICAgICAgICAvLyBnZW5KU0ZpbHRlcnNGb3JVbmlvblZhcmlhbnRzKHR5cGUsIGpzTmFtZXMpO1xuICAgICAgICB9XG4gICAgICAgIGdlbkpTRmlsdGVyc0ZvckFycmF5RmllbGRzKHR5cGUsIGpzTmFtZXMpO1xuICAgICAgICBnZW5KU1N0cnVjdEZpbHRlcih0eXBlKTtcbiAgICAgICAgaWYgKHR5cGUuY2F0ZWdvcnkgPT09IERiVHlwZUNhdGVnb3J5LnVuaW9uKSB7XG4gICAgICAgICAgICBnZW5KU1VuaW9uUmVzb2x2ZXIodHlwZSk7XG4gICAgICAgIH1cblxuXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2VuZXJhdGUgY3VzdG9tIHJlc29sdmVycyBmb3IgdHlwZXMgd2l0aDpcbiAgICAgKiAtIGlkIGZpZWxkXG4gICAgICogLSBqb2luIGZpZWxkc1xuICAgICAqIC0gdTY0IGFuZCBoaWdoZXIgZmllbGRzXG4gICAgICogQHBhcmFtIHR5cGVcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBnZW5KU0N1c3RvbVJlc29sdmVycyh0eXBlOiBEYlR5cGUpIHtcbiAgICAgICAgY29uc3Qgam9pbkZpZWxkcyA9IHR5cGUuZmllbGRzLmZpbHRlcih4ID0+ICEheC5qb2luKTtcbiAgICAgICAgY29uc3QgYmlnVUludEZpZWxkcyA9IHR5cGUuZmllbGRzLmZpbHRlcigoeDogRGJGaWVsZCkgPT4gaXNCaWdJbnQoeC50eXBlKSk7XG4gICAgICAgIGNvbnN0IHN0cmluZ0Zvcm1hdHRlZEZpZWxkcyA9IHR5cGUuZmllbGRzLmZpbHRlcigoeDogRGJGaWVsZCkgPT4geC5mb3JtYXR0ZXIpO1xuICAgICAgICBjb25zdCBlbnVtRmllbGRzID0gdHlwZS5maWVsZHMuZmlsdGVyKHggPT4geC5lbnVtRGVmKTtcbiAgICAgICAgY29uc3QgY3VzdG9tUmVzb2x2ZXJSZXF1aXJlZCA9IHR5cGUuY29sbGVjdGlvblxuICAgICAgICAgICAgfHwgam9pbkZpZWxkcy5sZW5ndGggPiAwXG4gICAgICAgICAgICB8fCBiaWdVSW50RmllbGRzLmxlbmd0aCA+IDBcbiAgICAgICAgICAgIHx8IGVudW1GaWVsZHMubGVuZ3RoID4gMDtcbiAgICAgICAgaWYgKCFjdXN0b21SZXNvbHZlclJlcXVpcmVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAganMud3JpdGVMbihgICAgICAgICAke3R5cGUubmFtZX06IHtgKTtcbiAgICAgICAgaWYgKHR5cGUuY29sbGVjdGlvbikge1xuICAgICAgICAgICAganMud3JpdGVMbignICAgICAgICAgICAgaWQocGFyZW50KSB7Jyk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKCcgICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5OycpO1xuICAgICAgICAgICAganMud3JpdGVMbignICAgICAgICAgICAgfSwnKTtcbiAgICAgICAgfVxuICAgICAgICBqb2luRmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBqb2luID0gZmllbGQuam9pbjtcbiAgICAgICAgICAgIGlmICgham9pbikge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IG9uRmllbGQgPSB0eXBlLmZpZWxkcy5maW5kKHggPT4geC5uYW1lID09PSBqb2luLm9uKTtcbiAgICAgICAgICAgIGlmICghb25GaWVsZCkge1xuICAgICAgICAgICAgICAgIHRocm93ICdKb2luIG9uIGZpZWxkIGRvZXMgbm90IGV4aXN0Lic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBvbiA9IGpvaW4ub24gPT09ICdpZCcgPyAnX2tleScgOiAoam9pbi5vbiB8fCAnX2tleScpO1xuICAgICAgICAgICAgY29uc3QgcmVmT24gPSBqb2luLnJlZk9uID09PSAnaWQnID8gJ19rZXknIDogKGpvaW4ucmVmT24gfHwgJ19rZXknKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbGxlY3Rpb24gPSBmaWVsZC50eXBlLmNvbGxlY3Rpb247XG4gICAgICAgICAgICBpZiAoIWNvbGxlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICB0aHJvdyAnSm9pbmVkIHR5cGUgaXMgbm90IGEgY29sbGVjdGlvbi4nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgJHtmaWVsZC5uYW1lfShwYXJlbnQsIGFyZ3MsIGNvbnRleHQpIHtgKTtcbiAgICAgICAgICAgIGlmIChqb2luLnByZUNvbmRpdGlvbikge1xuICAgICAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICAgICBpZiAoISgke2pvaW4ucHJlQ29uZGl0aW9ufSkpIHtgKTtcbiAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO2ApO1xuICAgICAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICAgICB9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAgICAgaWYgKGFyZ3Mud2hlbiAmJiAhJHt0eXBlLm5hbWV9LnRlc3QobnVsbCwgcGFyZW50LCBhcmdzLndoZW4pKSB7YCk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO2ApO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgICAgIH1gKTtcblxuICAgICAgICAgICAgaWYgKGZpZWxkLmFycmF5RGVwdGggPT09IDApIHtcbiAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQuZGF0YS4ke2NvbGxlY3Rpb259LndhaXRGb3JEb2MocGFyZW50LiR7b259LCAnJHtyZWZPbn0nLCBhcmdzLCBjb250ZXh0KTtgKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQuYXJyYXlEZXB0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICAgICByZXR1cm4gY29udGV4dC5kYXRhLiR7Y29sbGVjdGlvbn0ud2FpdEZvckRvY3MocGFyZW50LiR7b259LCAnJHtyZWZPbn0nLCBhcmdzLCBjb250ZXh0KTtgKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgJ0pvaW5zIG9uIGEgbmVzdGVkIGFycmF5cyBkb2VzIG5vdCBzdXBwb3J0ZWQuJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgIH0sYCk7XG4gICAgICAgIH0pO1xuICAgICAgICBiaWdVSW50RmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwcmVmaXhMZW5ndGggPSBmaWVsZC50eXBlID09PSBzY2FsYXJUeXBlcy51aW50NjQgPyAxIDogMjtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICR7ZmllbGQubmFtZX0ocGFyZW50LCBhcmdzKSB7YCk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KCR7cHJlZml4TGVuZ3RofSwgcGFyZW50LiR7ZmllbGQubmFtZX0sIGFyZ3MpO2ApO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgfSxgKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHN0cmluZ0Zvcm1hdHRlZEZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgJHtmaWVsZC5uYW1lfV9zdHJpbmcocGFyZW50LCBhcmdzKSB7YCk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAgICAgcmV0dXJuICR7ZmllbGQuZm9ybWF0dGVyIHx8ICcnfShwYXJlbnQuJHtmaWVsZC5uYW1lfSk7YCk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICB9LGApO1xuICAgICAgICB9KTtcbiAgICAgICAgZW51bUZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgZW51bURlZiA9IGZpZWxkLmVudW1EZWY7XG4gICAgICAgICAgICBpZiAoZW51bURlZikge1xuICAgICAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICR7ZmllbGQubmFtZX1fbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignJHtmaWVsZC5uYW1lfScsICR7c3RyaW5naWZ5RW51bVZhbHVlcyhlbnVtRGVmLnZhbHVlcyl9KSxgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgfSxgKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5KU1NjYWxhckZpZWxkcyh0eXBlOiBEYlR5cGUsIHBhcmVudFBhdGgsIHBhcmVudERvY1BhdGg6IHN0cmluZykge1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZDogRGJGaWVsZCkgPT4ge1xuICAgICAgICAgICAgaWYgKGZpZWxkLmpvaW4gfHwgZmllbGQuZW51bURlZikge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGRvY05hbWUgPSAodHlwZS5jb2xsZWN0aW9uICYmIGZpZWxkLm5hbWUgPT09ICdpZCcpID8gJ19rZXknIDogZmllbGQubmFtZTtcbiAgICAgICAgICAgIGNvbnN0IHBhdGggPSBgJHtwYXJlbnRQYXRofS4ke2ZpZWxkLm5hbWV9YDtcbiAgICAgICAgICAgIGxldCBkb2NQYXRoID0gYCR7cGFyZW50RG9jUGF0aH0uJHtkb2NOYW1lfWA7XG4gICAgICAgICAgICBpZiAoZmllbGQuYXJyYXlEZXB0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBsZXQgc3VmZml4ID0gJ1sqXSc7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgZGVwdGggPSAxMDsgZGVwdGggPiAwOyBkZXB0aCAtPSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHMgPSBgWyR7JyonLnJlcGVhdChkZXB0aCl9XWA7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkb2NQYXRoLmluY2x1ZGVzKHMpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWZmaXggPSBgWyR7JyonLnJlcGVhdChkZXB0aCArIDEpfV1gO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZG9jUGF0aCA9IGAke2RvY1BhdGh9JHtzdWZmaXh9YDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN3aXRjaChmaWVsZC50eXBlLmNhdGVnb3J5KSB7XG4gICAgICAgICAgICBjYXNlIFwic2NhbGFyXCI6XG4gICAgICAgICAgICAgICAgbGV0IHR5cGVOYW1lO1xuICAgICAgICAgICAgICAgIGlmIChmaWVsZC50eXBlID09PSBzY2FsYXJUeXBlcy5ib29sZWFuKSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lID0gJ2Jvb2xlYW4nO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMuZmxvYXQpIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWUgPSAnbnVtYmVyJztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLmludCkge1xuICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZSA9ICdudW1iZXInO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDY0KSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lID0gJ3VpbnQ2NCc7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC50eXBlID09PSBzY2FsYXJUeXBlcy51aW50MTAyNCkge1xuICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZSA9ICd1aW50MTAyNCc7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWUgPSAnc3RyaW5nJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAganMud3JpdGVMbihgc2NhbGFyRmllbGRzLnNldCgnJHtwYXRofScsIHsgdHlwZTogJyR7dHlwZU5hbWV9JywgcGF0aDogJyR7ZG9jUGF0aH0nIH0pO2ApO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcInN0cnVjdFwiOlxuICAgICAgICAgICAgY2FzZSBcInVuaW9uXCI6XG4gICAgICAgICAgICAgICAgZ2VuSlNTY2FsYXJGaWVsZHMoZmllbGQudHlwZSwgcGF0aCwgZG9jUGF0aCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuXG4gICAgZnVuY3Rpb24gZ2VuSlNUeXBlUmVzb2x2ZXJzRm9yVW5pb24odHlwZTogRGJUeXBlKSB7XG4gICAgICAgIGlmICh0eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS51bmlvbikge1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAke3R5cGUubmFtZX06ICR7dHlwZS5uYW1lfVJlc29sdmVyLGApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuZXJhdGUodHlwZXM6IERiVHlwZVtdKSB7XG5cbiAgICAgICAgLy8gR1xuXG4gICAgICAgIGcud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgXCJcIlwiXG4gICAgICAgIER1ZSB0byBHcmFwaFFMIGxpbWl0YXRpb25zIGJpZyBudW1iZXJzIGFyZSByZXR1cm5lZCBhcyBhIHN0cmluZy5cbiAgICAgICAgWW91IGNhbiBzcGVjaWZ5IGZvcm1hdCB1c2VkIHRvIHN0cmluZyByZXByZXNlbnRhdGlvbiBmb3IgYmlnIGludGVnZXJzLlxuICAgICAgICBcIlwiXCJcbiAgICAgICAgZW51bSBCaWdJbnRGb3JtYXQge1xuICAgICAgICAgICAgXCIgSGV4YWRlY2ltYWwgcmVwcmVzZW50YXRpb24gc3RhcnRlZCB3aXRoIDB4IChkZWZhdWx0KSBcIlxuICAgICAgICAgICAgSEVYXG4gICAgICAgICAgICBcIiBEZWNpbWFsIHJlcHJlc2VudGF0aW9uIFwiXG4gICAgICAgICAgICBERUNcbiAgICAgICAgfVxuICAgICAgICBgKTtcbiAgICAgICAgWydTdHJpbmcnLCAnQm9vbGVhbicsICdJbnQnLCAnRmxvYXQnXS5mb3JFYWNoKGdlbkdTY2FsYXJUeXBlc0ZpbHRlcik7XG4gICAgICAgIGdlbkdFbnVtVHlwZXMoKTtcbiAgICAgICAgdHlwZXMuZm9yRWFjaCh0eXBlID0+IGdlbkdUeXBlRGVjbGFyYXRpb24odHlwZSkpO1xuICAgICAgICBjb25zdCBnQXJyYXlGaWx0ZXJzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgICAgIHR5cGVzLmZvckVhY2godHlwZSA9PiBnZW5HRmlsdGVyKHR5cGUsIGdBcnJheUZpbHRlcnMpKTtcblxuICAgICAgICBjb25zdCBjb2xsZWN0aW9ucyA9IHR5cGVzLmZpbHRlcih0ID0+ICEhdC5jb2xsZWN0aW9uKTtcbiAgICAgICAgZ2VuR1F1ZXJpZXMoY29sbGVjdGlvbnMpO1xuICAgICAgICBnZW5HU3Vic2NyaXB0aW9ucyhjb2xsZWN0aW9ucyk7XG5cbiAgICAgICAgLy8gSlNcblxuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBjb25zdCB7XG4gICAgICAgICAgICBzY2FsYXIsXG4gICAgICAgICAgICBiaWdVSW50MSxcbiAgICAgICAgICAgIGJpZ1VJbnQyLFxuICAgICAgICAgICAgcmVzb2x2ZUJpZ1VJbnQsXG4gICAgICAgICAgICBzdHJ1Y3QsXG4gICAgICAgICAgICBhcnJheSxcbiAgICAgICAgICAgIGpvaW4sXG4gICAgICAgICAgICBqb2luQXJyYXksXG4gICAgICAgICAgICBlbnVtTmFtZSxcbiAgICAgICAgICAgIHN0cmluZ0NvbXBhbmlvbixcbiAgICAgICAgICAgIGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIsXG4gICAgICAgICAgICB1bml4TWlsbGlzZWNvbmRzVG9TdHJpbmcsXG4gICAgICAgICAgICB1bml4U2Vjb25kc1RvU3RyaW5nLFxuICAgICAgICB9ID0gcmVxdWlyZSgnLi4vZmlsdGVyL2ZpbHRlcnMuanMnKTtcbiAgICAgICAgYCk7XG4gICAgICAgIGNvbnN0IGpzQXJyYXlGaWx0ZXJzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgICAgIHR5cGVzLmZvckVhY2godHlwZSA9PiBnZW5KU0ZpbHRlcih0eXBlLCBqc0FycmF5RmlsdGVycykpO1xuXG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIGZ1bmN0aW9uIGNyZWF0ZVJlc29sdmVycyhkYXRhKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICBgKTtcbiAgICAgICAgdHlwZXMuZm9yRWFjaCgodHlwZSkgPT4ge1xuICAgICAgICAgICAgZ2VuSlNDdXN0b21SZXNvbHZlcnModHlwZSk7XG4gICAgICAgICAgICBnZW5KU1R5cGVSZXNvbHZlcnNGb3JVbmlvbih0eXBlKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGpzLndyaXRlTG4oJyAgICAgICAgUXVlcnk6IHsnKTtcbiAgICAgICAgY29sbGVjdGlvbnMuZm9yRWFjaCgodHlwZSkgPT4ge1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgJHt0eXBlLmNvbGxlY3Rpb24gfHwgJyd9OiBkYXRhLiR7dHlwZS5jb2xsZWN0aW9uIHx8ICcnfS5xdWVyeVJlc29sdmVyKCksYClcbiAgICAgICAgfSk7XG4gICAgICAgIGpzLndyaXRlTG4oJyAgICAgICAgfSwnKTtcbiAgICAgICAganMud3JpdGVMbignICAgICAgICBTdWJzY3JpcHRpb246IHsnKTtcbiAgICAgICAgY29sbGVjdGlvbnMuZm9yRWFjaCgodHlwZSkgPT4ge1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgJHt0eXBlLmNvbGxlY3Rpb24gfHwgJyd9OiBkYXRhLiR7dHlwZS5jb2xsZWN0aW9uIHx8ICcnfS5zdWJzY3JpcHRpb25SZXNvbHZlcigpLGApXG4gICAgICAgIH0pO1xuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGApO1xuXG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIGNvbnN0IHNjYWxhckZpZWxkcyA9IG5ldyBNYXAoKTtcbiAgICAgICAgYCk7XG4gICAgICAgIGNvbGxlY3Rpb25zLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICAgICAgICAgIGdlbkpTU2NhbGFyRmllbGRzKHR5cGUsIHR5cGUuY29sbGVjdGlvbiB8fCAnJywgJ2RvYycpO1xuICAgICAgICB9KTtcblxuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAgICAgICAgIHNjYWxhckZpZWxkcyxcbiAgICAgICAgICAgIGNyZWF0ZVJlc29sdmVycyxcbiAgICAgICAgYCk7XG4gICAgICAgIHR5cGVzLmZvckVhY2godHlwZSA9PiBqcy53cml0ZUxuKGAgICAgJHt0eXBlLm5hbWV9LGApKTtcbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgfTtcbiAgICAgICAgYCk7XG4gICAgfVxuXG4gICAgZ2VuZXJhdGUoZGJUeXBlcyk7XG5cbiAgICBmb3IgKGNvbnN0IGU6IEludEVudW1EZWYgb2YgZW51bVR5cGVzLnZhbHVlcygpKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBleHBvcnQgY29uc3QgUSR7ZS5uYW1lfSA9IHtgKTtcbiAgICAgICAgY29uc29sZS5sb2coT2JqZWN0LmVudHJpZXMoZS52YWx1ZXMpLm1hcCgoW25hbWUsIHZhbHVlXSkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGAgICAgJHtuYW1lfTogJHsodmFsdWU6IGFueSl9LGA7XG4gICAgICAgIH0pLmpvaW4oJ1xcbicpKTtcbiAgICAgICAgY29uc29sZS5sb2coYH07XFxuYCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcWw6IGcuZ2VuZXJhdGVkKCksXG4gICAgICAgIGpzOiBqcy5nZW5lcmF0ZWQoKSxcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IG1haW47XG4iXX0=