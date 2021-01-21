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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9tYWludGFuYW5jZS9nZW4tZ3JhcGhxbC9xbC1qcy1nZW5lcmF0b3IuanMiXSwibmFtZXMiOlsiY29tcGFyZUZpZWxkcyIsImEiLCJiIiwibmFtZSIsIm1haW4iLCJzY2hlbWFEZWYiLCJ0eXBlcyIsImRiVHlwZXMiLCJlbnVtVHlwZXMiLCJmb3JFYWNoIiwiZGJUeXBlIiwiZmllbGRzIiwic29ydCIsImciLCJXcml0ZXIiLCJqcyIsImdlbkdEb2MiLCJwcmVmaXgiLCJkb2MiLCJ0cmltIiwibGluZXMiLCJzcGxpdCIsImxlbmd0aCIsImluY2x1ZGVzIiwid3JpdGVMbiIsImxpbmUiLCJ1bmlvblZhcmlhbnRUeXBlIiwidHlwZSIsInZhcmlhbnQiLCJnZW5HVHlwZURlY2xhcmF0aW9uc0ZvclVuaW9uVmFyaWFudHMiLCJ3cml0ZUJsb2NrTG4iLCJnZW5HRW51bVR5cGVzIiwiZW51bURlZiIsInZhbHVlcyIsIk9iamVjdCIsImtleXMiLCJnZW5HVHlwZURlY2xhcmF0aW9uIiwiY2F0ZWdvcnkiLCJEYlR5cGVDYXRlZ29yeSIsInVuaW9uIiwiZmllbGQiLCJ0eXBlRGVjbGFyYXRpb24iLCJyZXBlYXQiLCJhcnJheURlcHRoIiwicGFyYW1zIiwiam9pbiIsImZvcm1hdHRlciIsInByZXZlbnRUd2ljZSIsIm5hbWVzIiwid29yayIsImhhcyIsImFkZCIsImdlbkdGaWx0ZXJzRm9yQXJyYXlGaWVsZHMiLCJnTmFtZXMiLCJpdGVtVHlwZU5hbWUiLCJpIiwiZmlsdGVyTmFtZSIsIm9wIiwiZ2VuR0ZpbHRlcnNGb3JFbnVtTmFtZUZpZWxkcyIsImdlbkdTY2FsYXJUeXBlc0ZpbHRlciIsImdlbkdGaWx0ZXIiLCJnZW5HUXVlcmllcyIsImNvbGxlY3Rpb24iLCJnZW5HU3Vic2NyaXB0aW9ucyIsImdldFNjYWxhclJlc29sdmVyTmFtZSIsInNjYWxhclR5cGVzIiwidWludDY0IiwidWludDEwMjQiLCJnZW5KU0ZpbHRlcnNGb3JBcnJheUZpZWxkcyIsImpzTmFtZXMiLCJpdGVtUmVzb2x2ZXJOYW1lIiwic2NhbGFyIiwiZ2VuSlNTdHJ1Y3RGaWx0ZXIiLCJzdWZmaXgiLCJvbiIsInJlZk9uIiwiZ2VuSlNVbmlvblJlc29sdmVyIiwiZ2VuSlNGaWx0ZXIiLCJnZW5KU0N1c3RvbVJlc29sdmVycyIsImpvaW5GaWVsZHMiLCJmaWx0ZXIiLCJ4IiwiYmlnVUludEZpZWxkcyIsInN0cmluZ0Zvcm1hdHRlZEZpZWxkcyIsImVudW1GaWVsZHMiLCJjdXN0b21SZXNvbHZlclJlcXVpcmVkIiwib25GaWVsZCIsImZpbmQiLCJwcmVDb25kaXRpb24iLCJwcmVmaXhMZW5ndGgiLCJnZW5KU1NjYWxhckZpZWxkcyIsInBhcmVudFBhdGgiLCJwYXJlbnREb2NQYXRoIiwiZG9jTmFtZSIsInBhdGgiLCJkb2NQYXRoIiwiZGVwdGgiLCJzIiwidHlwZU5hbWUiLCJib29sZWFuIiwiZmxvYXQiLCJpbnQiLCJnZW5KU1R5cGVSZXNvbHZlcnNGb3JVbmlvbiIsImdlbmVyYXRlIiwiZ0FycmF5RmlsdGVycyIsIlNldCIsImNvbGxlY3Rpb25zIiwidCIsImpzQXJyYXlGaWx0ZXJzIiwiZSIsImNvbnNvbGUiLCJsb2ciLCJlbnRyaWVzIiwibWFwIiwidmFsdWUiLCJxbCIsImdlbmVyYXRlZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUVBOztBQUdBOztBQVFBLFNBQVNBLGFBQVQsQ0FBdUJDLENBQXZCLEVBQW1DQyxDQUFuQyxFQUF1RDtBQUNuRCxNQUFJRCxDQUFDLENBQUNFLElBQUYsS0FBVyxJQUFmLEVBQXFCO0FBQ2pCLFdBQU9ELENBQUMsQ0FBQ0MsSUFBRixLQUFXLElBQVgsR0FBa0IsQ0FBbEIsR0FBc0IsQ0FBQyxDQUE5QjtBQUNIOztBQUNELE1BQUlELENBQUMsQ0FBQ0MsSUFBRixLQUFXLElBQWYsRUFBcUI7QUFDakIsV0FBTyxDQUFQO0FBQ0g7O0FBQ0QsU0FBUUYsQ0FBQyxDQUFDRSxJQUFGLEtBQVdELENBQUMsQ0FBQ0MsSUFBZCxHQUFzQixDQUF0QixHQUEy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R0FBUDtBQUlIOztlQUVjaEgsSSIsInNvdXJjZXNDb250ZW50IjpbIi8vQGZsb3dcblxuaW1wb3J0IHsgV3JpdGVyIH0gZnJvbSAnLi9nZW4uanMnO1xuaW1wb3J0IHR5cGUgeyBUeXBlRGVmIH0gZnJvbSAnLi4vLi4vc2VydmVyL3NjaGVtYS9zY2hlbWEuanMnO1xuaW1wb3J0IHR5cGUgeyBEYkZpZWxkLCBEYlR5cGUsIEludEVudW1EZWYgfSBmcm9tICcuLi8uLi9zZXJ2ZXIvc2NoZW1hL2RiLXNjaGVtYS10eXBlcyc7XG5pbXBvcnQge1xuICAgIERiVHlwZUNhdGVnb3J5LFxuICAgIGlzQmlnSW50LCBwYXJzZURiU2NoZW1hLFxuICAgIHNjYWxhclR5cGVzLFxuICAgIHN0cmluZ2lmeUVudW1WYWx1ZXMsXG4gICAgdG9FbnVtU3R5bGUsXG59IGZyb20gJy4uLy4uL3NlcnZlci9zY2hlbWEvZGItc2NoZW1hLXR5cGVzJztcblxuZnVuY3Rpb24gY29tcGFyZUZpZWxkcyhhOiBEYkZpZWxkLCBiOiBEYkZpZWxkKTogbnVtYmVyIHtcbiAgICBpZiAoYS5uYW1lID09PSBcImlkXCIpIHtcbiAgICAgICAgcmV0dXJuIGIubmFtZSA9PT0gXCJpZFwiID8gMCA6IC0xO1xuICAgIH1cbiAgICBpZiAoYi5uYW1lID09PSBcImlkXCIpIHtcbiAgICAgICAgcmV0dXJuIDE7XG4gICAgfVxuICAgIHJldHVybiAoYS5uYW1lID09PSBiLm5hbWUpID8gMCA6IChhLm5hbWUgPCBiLm5hbWUgPyAtMSA6IDEpO1xufVxuXG5mdW5jdGlvbiBtYWluKHNjaGVtYURlZjogVHlwZURlZikge1xuICAgIGNvbnN0IHsgdHlwZXM6IGRiVHlwZXMsIGVudW1UeXBlcyB9ID0gcGFyc2VEYlNjaGVtYShzY2hlbWFEZWYpO1xuICAgIGRiVHlwZXMuZm9yRWFjaCgoZGJUeXBlOiBEYlR5cGUpID0+IHtcbiAgICAgICAgZGJUeXBlLmZpZWxkcy5zb3J0KGNvbXBhcmVGaWVsZHMpO1xuICAgIH0pO1xuXG4vLyBHZW5lcmF0b3JzXG5cbiAgICBjb25zdCBnID0gbmV3IFdyaXRlcigpO1xuICAgIGNvbnN0IGpzID0gbmV3IFdyaXRlcigpO1xuXG4gICAgZnVuY3Rpb24gZ2VuR0RvYyhwcmVmaXg6IHN0cmluZywgZG9jOiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKGRvYy50cmltKCkgPT09ICcnKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbGluZXMgPSBkb2Muc3BsaXQoL1xcblxccj98XFxyXFxuPy8pO1xuICAgICAgICBpZiAobGluZXMubGVuZ3RoID09PSAxICYmICFsaW5lc1swXS5pbmNsdWRlcygnXCInKSkge1xuICAgICAgICAgICAgZy53cml0ZUxuKHByZWZpeCwgJ1wiJywgbGluZXNbMF0sICdcIicpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZy53cml0ZUxuKHByZWZpeCwgJ1wiXCJcIicpO1xuICAgICAgICAgICAgbGluZXMuZm9yRWFjaCgobGluZSkgPT4ge1xuICAgICAgICAgICAgICAgIGcud3JpdGVMbihwcmVmaXgsIGxpbmUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBnLndyaXRlTG4ocHJlZml4LCAnXCJcIlwiJyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiB1bmlvblZhcmlhbnRUeXBlKHR5cGU6IERiVHlwZSwgdmFyaWFudDogRGJGaWVsZCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiBgJHt0eXBlLm5hbWV9JHt2YXJpYW50Lm5hbWV9VmFyaWFudGA7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuR1R5cGVEZWNsYXJhdGlvbnNGb3JVbmlvblZhcmlhbnRzKHR5cGU6IERiVHlwZSkge1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKCh2YXJpYW50KSA9PiB7XG4gICAgICAgICAgICBnLndyaXRlQmxvY2tMbihgXG4gICAgICAgIHR5cGUgJHt1bmlvblZhcmlhbnRUeXBlKHR5cGUsIHZhcmlhbnQpfSB7XG4gICAgICAgICAgICAke3ZhcmlhbnQubmFtZX06ICR7dmFyaWFudC50eXBlLm5hbWV9XG4gICAgICAgIH1cblxuICAgICAgICBgKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuR0VudW1UeXBlcygpIHtcbiAgICAgICAgZm9yIChjb25zdCBlbnVtRGVmOiBJbnRFbnVtRGVmIG9mIGVudW1UeXBlcy52YWx1ZXMoKSkge1xuICAgICAgICAgICAgZy53cml0ZUxuKGBlbnVtICR7ZW51bURlZi5uYW1lfUVudW0ge2ApO1xuICAgICAgICAgICAgT2JqZWN0LmtleXMoZW51bURlZi52YWx1ZXMpLmZvckVhY2goKG5hbWUpID0+IHtcbiAgICAgICAgICAgICAgICBnLndyaXRlTG4oYCAgICAke3RvRW51bVN0eWxlKG5hbWUpfWApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBnLndyaXRlTG4oYH1gKTtcbiAgICAgICAgICAgIGcud3JpdGVMbigpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuR1R5cGVEZWNsYXJhdGlvbih0eXBlOiBEYlR5cGUpIHtcbiAgICAgICAgaWYgKHR5cGUuY2F0ZWdvcnkgPT09IERiVHlwZUNhdGVnb3J5LnVuaW9uKSB7XG4gICAgICAgICAgICBnZW5HVHlwZURlY2xhcmF0aW9uc0ZvclVuaW9uVmFyaWFudHModHlwZSk7XG4gICAgICAgICAgICBnLndyaXRlTG4oYHVuaW9uICR7dHlwZS5uYW1lfSA9IGApO1xuICAgICAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCh2YXJpYW50ID0+IHtcbiAgICAgICAgICAgICAgICBnLndyaXRlTG4oYFxcdHwgJHt1bmlvblZhcmlhbnRUeXBlKHR5cGUsIHZhcmlhbnQpfWApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBnLndyaXRlTG4oKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGdlbkdEb2MoJycsIHR5cGUuZG9jKTtcbiAgICAgICAgICAgIGcud3JpdGVMbihgdHlwZSAke3R5cGUubmFtZX0ge2ApO1xuICAgICAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaChmaWVsZCA9PiB7XG4gICAgICAgICAgICAgICAgZ2VuR0RvYygnXFx0JywgZmllbGQuZG9jKTtcbiAgICAgICAgICAgICAgICBjb25zdCB0eXBlRGVjbGFyYXRpb24gPVxuICAgICAgICAgICAgICAgICAgICAnWycucmVwZWF0KGZpZWxkLmFycmF5RGVwdGgpICtcbiAgICAgICAgICAgICAgICAgICAgZmllbGQudHlwZS5uYW1lICtcbiAgICAgICAgICAgICAgICAgICAgJ10nLnJlcGVhdChmaWVsZC5hcnJheURlcHRoKTtcbiAgICAgICAgICAgICAgICBsZXQgcGFyYW1zID0gJyc7XG4gICAgICAgICAgICAgICAgaWYgKGlzQmlnSW50KGZpZWxkLnR5cGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhcmFtcyA9ICcoZm9ybWF0OiBCaWdJbnRGb3JtYXQpJztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLmpvaW4pIHtcbiAgICAgICAgICAgICAgICAgICAgcGFyYW1zID0gYCh0aW1lb3V0OiBJbnQsIHdoZW46ICR7dHlwZS5uYW1lfUZpbHRlcilgO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGcud3JpdGVMbihgXFx0JHtmaWVsZC5uYW1lfSR7cGFyYW1zfTogJHt0eXBlRGVjbGFyYXRpb259YCk7XG4gICAgICAgICAgICAgICAgY29uc3QgZW51bURlZiA9IGZpZWxkLmVudW1EZWY7XG4gICAgICAgICAgICAgICAgaWYgKGVudW1EZWYpIHtcbiAgICAgICAgICAgICAgICAgICAgZy53cml0ZUxuKGBcXHQke2ZpZWxkLm5hbWV9X25hbWU6ICR7ZW51bURlZi5uYW1lfUVudW1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGZpZWxkLmZvcm1hdHRlcikge1xuICAgICAgICAgICAgICAgICAgICBnLndyaXRlTG4oYFxcdCR7ZmllbGQubmFtZX1fc3RyaW5nOiBTdHJpbmdgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGcud3JpdGVMbihgfWApO1xuICAgICAgICB9XG4gICAgICAgIGcud3JpdGVMbigpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHByZXZlbnRUd2ljZShuYW1lOiBzdHJpbmcsIG5hbWVzOiBTZXQ8c3RyaW5nPiwgd29yazogKCkgPT4gdm9pZCkge1xuICAgICAgICBpZiAoIW5hbWVzLmhhcyhuYW1lKSkge1xuICAgICAgICAgICAgbmFtZXMuYWRkKG5hbWUpO1xuICAgICAgICAgICAgd29yaygpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuR0ZpbHRlcnNGb3JBcnJheUZpZWxkcyh0eXBlOiBEYlR5cGUsIGdOYW1lczogU2V0PHN0cmluZz4pIHtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGxldCBpdGVtVHlwZU5hbWUgPSBmaWVsZC50eXBlLm5hbWU7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZpZWxkLmFycmF5RGVwdGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpbHRlck5hbWUgPSBgJHtpdGVtVHlwZU5hbWV9QXJyYXlGaWx0ZXJgO1xuICAgICAgICAgICAgICAgIHByZXZlbnRUd2ljZShmaWx0ZXJOYW1lLCBnTmFtZXMsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgZy53cml0ZUxuKGBpbnB1dCAke2ZpbHRlck5hbWV9IHtgKTtcbiAgICAgICAgICAgICAgICAgICAgWydhbnknLCAnYWxsJ10uZm9yRWFjaCgob3ApID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGcud3JpdGVMbihgXFx0JHtvcH06ICR7aXRlbVR5cGVOYW1lfUZpbHRlcmApO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgZy53cml0ZUxuKCd9Jyk7XG4gICAgICAgICAgICAgICAgICAgIGcud3JpdGVMbigpO1xuXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaXRlbVR5cGVOYW1lICs9ICdBcnJheSc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkdGaWx0ZXJzRm9yRW51bU5hbWVGaWVsZHModHlwZTogRGJUeXBlLCBnTmFtZXM6IFNldDxzdHJpbmc+KSB7XG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBlbnVtRGVmID0gZmllbGQuZW51bURlZjtcbiAgICAgICAgICAgIGlmIChlbnVtRGVmKSB7XG4gICAgICAgICAgICAgICAgcHJldmVudFR3aWNlKGAke2VudW1EZWYubmFtZX1FbnVtRmlsdGVyYCwgZ05hbWVzLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGdlbkdTY2FsYXJUeXBlc0ZpbHRlcihgJHtlbnVtRGVmLm5hbWV9RW51bWApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5HRmlsdGVyKHR5cGU6IERiVHlwZSwgZ05hbWVzOiBTZXQ8c3RyaW5nPikge1xuICAgICAgICBpZiAodHlwZS5maWVsZHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgZ2VuR0ZpbHRlcnNGb3JBcnJheUZpZWxkcyh0eXBlLCBnTmFtZXMpO1xuICAgICAgICBnZW5HRmlsdGVyc0ZvckVudW1OYW1lRmllbGRzKHR5cGUsIGdOYW1lcyk7XG4gICAgICAgIGdlbkdEb2MoJycsIHR5cGUuZG9jKTtcbiAgICAgICAgZy53cml0ZUxuKGBpbnB1dCAke3R5cGUubmFtZX1GaWx0ZXIge2ApO1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgZ2VuR0RvYygnXFx0JywgZmllbGQuZG9jKTtcbiAgICAgICAgICAgIGNvbnN0IHR5cGVEZWNsYXJhdGlvbiA9IGZpZWxkLnR5cGUubmFtZSArIFwiQXJyYXlcIi5yZXBlYXQoZmllbGQuYXJyYXlEZXB0aCk7XG4gICAgICAgICAgICBnLndyaXRlTG4oYFxcdCR7ZmllbGQubmFtZX06ICR7dHlwZURlY2xhcmF0aW9ufUZpbHRlcmApO1xuICAgICAgICAgICAgY29uc3QgZW51bURlZiA9IGZpZWxkLmVudW1EZWY7XG4gICAgICAgICAgICBpZiAoZW51bURlZikge1xuICAgICAgICAgICAgICAgIGcud3JpdGVMbihgXFx0JHtmaWVsZC5uYW1lfV9uYW1lOiAke2VudW1EZWYubmFtZX1FbnVtRmlsdGVyYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBnLndyaXRlTG4oYCAgICBPUjogJHt0eXBlLm5hbWV9RmlsdGVyYCk7XG4gICAgICAgIGcud3JpdGVMbihgfWApO1xuICAgICAgICBnLndyaXRlTG4oKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5HU2NhbGFyVHlwZXNGaWx0ZXIobmFtZTogc3RyaW5nKSB7XG4gICAgICAgIGcud3JpdGVMbihgaW5wdXQgJHtuYW1lfUZpbHRlciB7YCk7XG4gICAgICAgIFsnZXEnLCAnbmUnLCAnZ3QnLCAnbHQnLCAnZ2UnLCAnbGUnXS5mb3JFYWNoKChvcCkgPT4ge1xuICAgICAgICAgICAgZy53cml0ZUxuKGBcXHQke29wfTogJHtuYW1lfWApO1xuICAgICAgICB9KTtcbiAgICAgICAgWydpbicsICdub3RJbiddLmZvckVhY2goKG9wKSA9PiB7XG4gICAgICAgICAgICBnLndyaXRlTG4oYFxcdCR7b3B9OiBbJHtuYW1lfV1gKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGcud3JpdGVMbignfScpO1xuICAgICAgICBnLndyaXRlTG4oKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5HUXVlcmllcyh0eXBlczogRGJUeXBlW10pIHtcbiAgICAgICAgZy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBcIlNwZWNpZnkgc29ydCBvcmRlciBkaXJlY3Rpb25cIlxuICAgICAgICBlbnVtIFF1ZXJ5T3JkZXJCeURpcmVjdGlvbiB7XG4gICAgICAgICAgICBcIkRvY3VtZW50cyB3aWxsIGJlIHNvcnRlZCBpbiBhc2NlbmRlZCBvcmRlciAoZS5nLiBmcm9tIEEgdG8gWilcIlxuICAgICAgICAgICAgQVNDXG4gICAgICAgICAgICBcIkRvY3VtZW50cyB3aWxsIGJlIHNvcnRlZCBpbiBkZXNjZW5kYW50IG9yZGVyIChlLmcuIGZyb20gWiB0byBBKVwiXG4gICAgICAgICAgICBERVNDXG4gICAgICAgIH1cblxuICAgICAgICBcbiAgICAgICAgXCJcIlwiXG4gICAgICAgIFNwZWNpZnkgaG93IHRvIHNvcnQgcmVzdWx0cy5cbiAgICAgICAgWW91IGNhbiBzb3J0IGRvY3VtZW50cyBpbiByZXN1bHQgc2V0IHVzaW5nIG1vcmUgdGhhbiBvbmUgZmllbGQuXG4gICAgICAgIFwiXCJcIlxuICAgICAgICBpbnB1dCBRdWVyeU9yZGVyQnkge1xuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgICBQYXRoIHRvIGZpZWxkIHdoaWNoIG11c3QgYmUgdXNlZCBhcyBhIHNvcnQgY3JpdGVyaWEuXG4gICAgICAgICAgICBJZiBmaWVsZCByZXNpZGVzIGRlZXAgaW4gc3RydWN0dXJlIHBhdGggaXRlbXMgbXVzdCBiZSBzZXBhcmF0ZWQgd2l0aCBkb3QgKGUuZy4gJ2Zvby5iYXIuYmF6JykuXG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICAgIHBhdGg6IFN0cmluZ1xuICAgICAgICAgICAgXCJTb3J0IG9yZGVyIGRpcmVjdGlvblwiXG4gICAgICAgICAgICBkaXJlY3Rpb246IFF1ZXJ5T3JkZXJCeURpcmVjdGlvblxuICAgICAgICB9XG5cbiAgICAgICAgdHlwZSBRdWVyeSB7XG4gICAgICAgIGApO1xuXG4gICAgICAgIHR5cGVzLmZvckVhY2goKHR5cGU6IERiVHlwZSkgPT4ge1xuICAgICAgICAgICAgZy53cml0ZUxuKGBcXHQke3R5cGUuY29sbGVjdGlvbiB8fCAnJ30oZmlsdGVyOiAke3R5cGUubmFtZX1GaWx0ZXIsIG9yZGVyQnk6IFtRdWVyeU9yZGVyQnldLCBsaW1pdDogSW50LCB0aW1lb3V0OiBGbG9hdCwgYWNjZXNzS2V5OiBTdHJpbmcsIG9wZXJhdGlvbklkOiBTdHJpbmcpOiBbJHt0eXBlLm5hbWV9XWApO1xuICAgICAgICB9KTtcblxuICAgICAgICBnLndyaXRlQmxvY2tMbihgXG4gICAgICAgIH1cblxuICAgICAgICBgKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5HU3Vic2NyaXB0aW9ucyh0eXBlczogRGJUeXBlW10pIHtcbiAgICAgICAgZy53cml0ZUxuKCd0eXBlIFN1YnNjcmlwdGlvbiB7Jyk7XG4gICAgICAgIHR5cGVzLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICAgICAgICAgIGcud3JpdGVMbihgXFx0JHt0eXBlLmNvbGxlY3Rpb24gfHwgJyd9KGZpbHRlcjogJHt0eXBlLm5hbWV9RmlsdGVyLCBhY2Nlc3NLZXk6IFN0cmluZyk6ICR7dHlwZS5uYW1lfWApO1xuICAgICAgICB9KTtcbiAgICAgICAgZy53cml0ZUxuKCd9Jyk7XG4gICAgfVxuXG5cbiAgICBmdW5jdGlvbiBnZXRTY2FsYXJSZXNvbHZlck5hbWUoZmllbGQ6IERiRmllbGQpOiBzdHJpbmcge1xuICAgICAgICBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDY0KSB7XG4gICAgICAgICAgICByZXR1cm4gJ2JpZ1VJbnQxJztcbiAgICAgICAgfVxuICAgICAgICBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDEwMjQpIHtcbiAgICAgICAgICAgIHJldHVybiAnYmlnVUludDInO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnc2NhbGFyJztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5KU0ZpbHRlcnNGb3JBcnJheUZpZWxkcyh0eXBlOiBEYlR5cGUsIGpzTmFtZXM6IFNldDxzdHJpbmc+KSB7XG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBsZXQgaXRlbVR5cGVOYW1lID0gZmllbGQudHlwZS5uYW1lO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmaWVsZC5hcnJheURlcHRoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWx0ZXJOYW1lID0gYCR7aXRlbVR5cGVOYW1lfUFycmF5YDtcbiAgICAgICAgICAgICAgICBwcmV2ZW50VHdpY2UoZmlsdGVyTmFtZSwganNOYW1lcywgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpdGVtUmVzb2x2ZXJOYW1lID0gKGkgPT09IDAgJiYgZmllbGQudHlwZS5jYXRlZ29yeSA9PT0gRGJUeXBlQ2F0ZWdvcnkuc2NhbGFyKVxuICAgICAgICAgICAgICAgICAgICAgICAgPyBnZXRTY2FsYXJSZXNvbHZlck5hbWUoZmllbGQpXG4gICAgICAgICAgICAgICAgICAgICAgICA6IGl0ZW1UeXBlTmFtZTtcbiAgICAgICAgICAgICAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgICAgICAgICBjb25zdCAke2ZpbHRlck5hbWV9ID0gYXJyYXkoKCkgPT4gJHtpdGVtUmVzb2x2ZXJOYW1lfSk7XG4gICAgICAgICAgICAgICAgYCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaXRlbVR5cGVOYW1lICs9ICdBcnJheSc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkpTU3RydWN0RmlsdGVyKHR5cGU6IERiVHlwZSkge1xuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBjb25zdCAke3R5cGUubmFtZX0gPSBzdHJ1Y3Qoe1xuICAgIGApO1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZDogRGJGaWVsZCkgPT4ge1xuICAgICAgICAgICAgbGV0IHR5cGVEZWNsYXJhdGlvbjogP3N0cmluZyA9IG51bGw7XG4gICAgICAgICAgICBjb25zdCBqb2luID0gZmllbGQuam9pbjtcbiAgICAgICAgICAgIGlmIChqb2luKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3VmZml4ID0gZmllbGQuYXJyYXlEZXB0aCA+IDAgPyAnQXJyYXknIDogJyc7XG4gICAgICAgICAgICAgICAgdHlwZURlY2xhcmF0aW9uID0gYGpvaW4ke3N1ZmZpeH0oJyR7am9pbi5vbn0nLCAnJHtqb2luLnJlZk9ufScsICcke2ZpZWxkLnR5cGUuY29sbGVjdGlvbiB8fCAnJ30nLCAoKSA9PiAke2ZpZWxkLnR5cGUubmFtZX0pYDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQuYXJyYXlEZXB0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB0eXBlRGVjbGFyYXRpb24gPVxuICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlLm5hbWUgK1xuICAgICAgICAgICAgICAgICAgICAnQXJyYXknLnJlcGVhdChmaWVsZC5hcnJheURlcHRoKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZS5jYXRlZ29yeSA9PT0gRGJUeXBlQ2F0ZWdvcnkuc2NhbGFyKSB7XG4gICAgICAgICAgICAgICAgdHlwZURlY2xhcmF0aW9uID0gZ2V0U2NhbGFyUmVzb2x2ZXJOYW1lKGZpZWxkKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZS5maWVsZHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHR5cGVEZWNsYXJhdGlvbiA9IGZpZWxkLnR5cGUubmFtZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0eXBlRGVjbGFyYXRpb24pIHtcbiAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgJHtmaWVsZC5uYW1lfTogJHt0eXBlRGVjbGFyYXRpb259LGApO1xuICAgICAgICAgICAgICAgIGNvbnN0IGVudW1EZWYgPSBmaWVsZC5lbnVtRGVmO1xuICAgICAgICAgICAgICAgIGlmIChlbnVtRGVmKSB7XG4gICAgICAgICAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAke2ZpZWxkLm5hbWV9X25hbWU6IGVudW1OYW1lKCcke2ZpZWxkLm5hbWV9JywgJHtzdHJpbmdpZnlFbnVtVmFsdWVzKGVudW1EZWYudmFsdWVzKX0pLGApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZmllbGQuZm9ybWF0dGVyKSB7XG4gICAgICAgICAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAke2ZpZWxkLm5hbWV9X3N0cmluZzogc3RyaW5nQ29tcGFuaW9uKCcke2ZpZWxkLm5hbWV9JyksYCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgfSR7dHlwZS5jb2xsZWN0aW9uID8gJywgdHJ1ZScgOiAnJ30pO1xuXG4gICAgYCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuSlNVbmlvblJlc29sdmVyKHR5cGU6IERiVHlwZSkge1xuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBjb25zdCAke3R5cGUubmFtZX1SZXNvbHZlciA9IHtcbiAgICAgICAgICAgIF9fcmVzb2x2ZVR5cGUob2JqLCBjb250ZXh0LCBpbmZvKSB7XG4gICAgICAgIGApO1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKCh2YXJpYW50KSA9PiB7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgIGlmICgnJHt2YXJpYW50Lm5hbWV9JyBpbiBvYmopIHtgKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgIHJldHVybiAnJHt1bmlvblZhcmlhbnRUeXBlKHR5cGUsIHZhcmlhbnQpfSc7YCk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgIH1gKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgYCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuSlNGaWx0ZXIodHlwZTogRGJUeXBlLCBqc05hbWVzOiBTZXQ8c3RyaW5nPikge1xuICAgICAgICBpZiAodHlwZS5maWVsZHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGUuY2F0ZWdvcnkgPT09IERiVHlwZUNhdGVnb3J5LnVuaW9uKSB7XG4gICAgICAgICAgICAvLyBnZW5KU0ZpbHRlcnNGb3JVbmlvblZhcmlhbnRzKHR5cGUsIGpzTmFtZXMpO1xuICAgICAgICB9XG4gICAgICAgIGdlbkpTRmlsdGVyc0ZvckFycmF5RmllbGRzKHR5cGUsIGpzTmFtZXMpO1xuICAgICAgICBnZW5KU1N0cnVjdEZpbHRlcih0eXBlKTtcbiAgICAgICAgaWYgKHR5cGUuY2F0ZWdvcnkgPT09IERiVHlwZUNhdGVnb3J5LnVuaW9uKSB7XG4gICAgICAgICAgICBnZW5KU1VuaW9uUmVzb2x2ZXIodHlwZSk7XG4gICAgICAgIH1cblxuXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2VuZXJhdGUgY3VzdG9tIHJlc29sdmVycyBmb3IgdHlwZXMgd2l0aDpcbiAgICAgKiAtIGlkIGZpZWxkXG4gICAgICogLSBqb2luIGZpZWxkc1xuICAgICAqIC0gdTY0IGFuZCBoaWdoZXIgZmllbGRzXG4gICAgICogQHBhcmFtIHR5cGVcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBnZW5KU0N1c3RvbVJlc29sdmVycyh0eXBlOiBEYlR5cGUpIHtcbiAgICAgICAgY29uc3Qgam9pbkZpZWxkcyA9IHR5cGUuZmllbGRzLmZpbHRlcih4ID0+ICEheC5qb2luKTtcbiAgICAgICAgY29uc3QgYmlnVUludEZpZWxkcyA9IHR5cGUuZmllbGRzLmZpbHRlcigoeDogRGJGaWVsZCkgPT4gaXNCaWdJbnQoeC50eXBlKSk7XG4gICAgICAgIGNvbnN0IHN0cmluZ0Zvcm1hdHRlZEZpZWxkcyA9IHR5cGUuZmllbGRzLmZpbHRlcigoeDogRGJGaWVsZCkgPT4geC5mb3JtYXR0ZXIpO1xuICAgICAgICBjb25zdCBlbnVtRmllbGRzID0gdHlwZS5maWVsZHMuZmlsdGVyKHggPT4geC5lbnVtRGVmKTtcbiAgICAgICAgY29uc3QgY3VzdG9tUmVzb2x2ZXJSZXF1aXJlZCA9IHR5cGUuY29sbGVjdGlvblxuICAgICAgICAgICAgfHwgam9pbkZpZWxkcy5sZW5ndGggPiAwXG4gICAgICAgICAgICB8fCBiaWdVSW50RmllbGRzLmxlbmd0aCA+IDBcbiAgICAgICAgICAgIHx8IGVudW1GaWVsZHMubGVuZ3RoID4gMDtcbiAgICAgICAgaWYgKCFjdXN0b21SZXNvbHZlclJlcXVpcmVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAganMud3JpdGVMbihgICAgICAgICAke3R5cGUubmFtZX06IHtgKTtcbiAgICAgICAgaWYgKHR5cGUuY29sbGVjdGlvbikge1xuICAgICAgICAgICAganMud3JpdGVMbignICAgICAgICAgICAgaWQocGFyZW50KSB7Jyk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKCcgICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5OycpO1xuICAgICAgICAgICAganMud3JpdGVMbignICAgICAgICAgICAgfSwnKTtcbiAgICAgICAgfVxuICAgICAgICBqb2luRmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBqb2luID0gZmllbGQuam9pbjtcbiAgICAgICAgICAgIGlmICgham9pbikge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IG9uRmllbGQgPSB0eXBlLmZpZWxkcy5maW5kKHggPT4geC5uYW1lID09PSBqb2luLm9uKTtcbiAgICAgICAgICAgIGlmICghb25GaWVsZCkge1xuICAgICAgICAgICAgICAgIHRocm93ICdKb2luIG9uIGZpZWxkIGRvZXMgbm90IGV4aXN0Lic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBvbiA9IGpvaW4ub24gPT09ICdpZCcgPyAnX2tleScgOiAoam9pbi5vbiB8fCAnX2tleScpO1xuICAgICAgICAgICAgY29uc3QgcmVmT24gPSBqb2luLnJlZk9uID09PSAnaWQnID8gJ19rZXknIDogKGpvaW4ucmVmT24gfHwgJ19rZXknKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbGxlY3Rpb24gPSBmaWVsZC50eXBlLmNvbGxlY3Rpb247XG4gICAgICAgICAgICBpZiAoIWNvbGxlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICB0aHJvdyAnSm9pbmVkIHR5cGUgaXMgbm90IGEgY29sbGVjdGlvbi4nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgJHtmaWVsZC5uYW1lfShwYXJlbnQsIGFyZ3MsIGNvbnRleHQpIHtgKTtcbiAgICAgICAgICAgIGlmIChqb2luLnByZUNvbmRpdGlvbikge1xuICAgICAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICAgICBpZiAoISgke2pvaW4ucHJlQ29uZGl0aW9ufSkpIHtgKTtcbiAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO2ApO1xuICAgICAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICAgICB9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAgICAgaWYgKGFyZ3Mud2hlbiAmJiAhJHt0eXBlLm5hbWV9LnRlc3QobnVsbCwgcGFyZW50LCBhcmdzLndoZW4pKSB7YCk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO2ApO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgICAgIH1gKTtcblxuICAgICAgICAgICAgaWYgKGZpZWxkLmFycmF5RGVwdGggPT09IDApIHtcbiAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQuZGF0YS4ke2NvbGxlY3Rpb259LndhaXRGb3JEb2MocGFyZW50LiR7b259LCAnJHtyZWZPbn0nLCBhcmdzLCBjb250ZXh0KTtgKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQuYXJyYXlEZXB0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICAgICByZXR1cm4gY29udGV4dC5kYXRhLiR7Y29sbGVjdGlvbn0ud2FpdEZvckRvY3MocGFyZW50LiR7b259LCAnJHtyZWZPbn0nLCBhcmdzLCBjb250ZXh0KTtgKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgJ0pvaW5zIG9uIGEgbmVzdGVkIGFycmF5cyBkb2VzIG5vdCBzdXBwb3J0ZWQuJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgIH0sYCk7XG4gICAgICAgIH0pO1xuICAgICAgICBiaWdVSW50RmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwcmVmaXhMZW5ndGggPSBmaWVsZC50eXBlID09PSBzY2FsYXJUeXBlcy51aW50NjQgPyAxIDogMjtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICR7ZmllbGQubmFtZX0ocGFyZW50LCBhcmdzKSB7YCk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KCR7cHJlZml4TGVuZ3RofSwgcGFyZW50LiR7ZmllbGQubmFtZX0sIGFyZ3MpO2ApO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgfSxgKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHN0cmluZ0Zvcm1hdHRlZEZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgJHtmaWVsZC5uYW1lfV9zdHJpbmcocGFyZW50LCBhcmdzKSB7YCk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAgICAgcmV0dXJuICR7ZmllbGQuZm9ybWF0dGVyIHx8ICcnfShwYXJlbnQuJHtmaWVsZC5uYW1lfSk7YCk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICB9LGApO1xuICAgICAgICB9KTtcbiAgICAgICAgZW51bUZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgZW51bURlZiA9IGZpZWxkLmVudW1EZWY7XG4gICAgICAgICAgICBpZiAoZW51bURlZikge1xuICAgICAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICR7ZmllbGQubmFtZX1fbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignJHtmaWVsZC5uYW1lfScsICR7c3RyaW5naWZ5RW51bVZhbHVlcyhlbnVtRGVmLnZhbHVlcyl9KSxgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgfSxgKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5KU1NjYWxhckZpZWxkcyh0eXBlOiBEYlR5cGUsIHBhcmVudFBhdGgsIHBhcmVudERvY1BhdGg6IHN0cmluZykge1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZDogRGJGaWVsZCkgPT4ge1xuICAgICAgICAgICAgaWYgKGZpZWxkLmpvaW4gfHwgZmllbGQuZW51bURlZikge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGRvY05hbWUgPSAodHlwZS5jb2xsZWN0aW9uICYmIGZpZWxkLm5hbWUgPT09ICdpZCcpID8gJ19rZXknIDogZmllbGQubmFtZTtcbiAgICAgICAgICAgIGNvbnN0IHBhdGggPSBgJHtwYXJlbnRQYXRofS4ke2ZpZWxkLm5hbWV9YDtcbiAgICAgICAgICAgIGxldCBkb2NQYXRoID0gYCR7cGFyZW50RG9jUGF0aH0uJHtkb2NOYW1lfWA7XG4gICAgICAgICAgICBpZiAoZmllbGQuYXJyYXlEZXB0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBsZXQgc3VmZml4ID0gJ1sqXSc7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgZGVwdGggPSAxMDsgZGVwdGggPiAwOyBkZXB0aCAtPSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHMgPSBgWyR7JyonLnJlcGVhdChkZXB0aCl9XWA7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkb2NQYXRoLmluY2x1ZGVzKHMpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWZmaXggPSBgWyR7JyonLnJlcGVhdChkZXB0aCArIDEpfV1gO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZG9jUGF0aCA9IGAke2RvY1BhdGh9JHtzdWZmaXh9YDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN3aXRjaCAoZmllbGQudHlwZS5jYXRlZ29yeSkge1xuICAgICAgICAgICAgY2FzZSBcInNjYWxhclwiOlxuICAgICAgICAgICAgICAgIGxldCB0eXBlTmFtZTtcbiAgICAgICAgICAgICAgICBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMuYm9vbGVhbikge1xuICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZSA9ICdib29sZWFuJztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLmZsb2F0KSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lID0gJ251bWJlcic7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC50eXBlID09PSBzY2FsYXJUeXBlcy5pbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWUgPSAnbnVtYmVyJztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLnVpbnQ2NCkge1xuICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZSA9ICd1aW50NjQnO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDEwMjQpIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWUgPSAndWludDEwMjQnO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lID0gJ3N0cmluZyc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGpzLndyaXRlTG4oYHNjYWxhckZpZWxkcy5zZXQoJyR7cGF0aH0nLCB7IHR5cGU6ICcke3R5cGVOYW1lfScsIHBhdGg6ICcke2RvY1BhdGh9JyB9KTtgKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJzdHJ1Y3RcIjpcbiAgICAgICAgICAgIGNhc2UgXCJ1bmlvblwiOlxuICAgICAgICAgICAgICAgIGdlbkpTU2NhbGFyRmllbGRzKGZpZWxkLnR5cGUsIHBhdGgsIGRvY1BhdGgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cblxuICAgIGZ1bmN0aW9uIGdlbkpTVHlwZVJlc29sdmVyc0ZvclVuaW9uKHR5cGU6IERiVHlwZSkge1xuICAgICAgICBpZiAodHlwZS5jYXRlZ29yeSA9PT0gRGJUeXBlQ2F0ZWdvcnkudW5pb24pIHtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgJHt0eXBlLm5hbWV9OiAke3R5cGUubmFtZX1SZXNvbHZlcixgKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbmVyYXRlKHR5cGVzOiBEYlR5cGVbXSkge1xuXG4gICAgICAgIC8vIEdcblxuICAgICAgICBnLndyaXRlQmxvY2tMbihgXG4gICAgICAgIFwiXCJcIlxuICAgICAgICBEdWUgdG8gR3JhcGhRTCBsaW1pdGF0aW9ucyBiaWcgbnVtYmVycyBhcmUgcmV0dXJuZWQgYXMgYSBzdHJpbmcuXG4gICAgICAgIFlvdSBjYW4gc3BlY2lmeSBmb3JtYXQgdXNlZCB0byBzdHJpbmcgcmVwcmVzZW50YXRpb24gZm9yIGJpZyBpbnRlZ2Vycy5cbiAgICAgICAgXCJcIlwiXG4gICAgICAgIGVudW0gQmlnSW50Rm9ybWF0IHtcbiAgICAgICAgICAgIFwiIEhleGFkZWNpbWFsIHJlcHJlc2VudGF0aW9uIHN0YXJ0ZWQgd2l0aCAweCAoZGVmYXVsdCkgXCJcbiAgICAgICAgICAgIEhFWFxuICAgICAgICAgICAgXCIgRGVjaW1hbCByZXByZXNlbnRhdGlvbiBcIlxuICAgICAgICAgICAgREVDXG4gICAgICAgIH1cbiAgICAgICAgYCk7XG4gICAgICAgIFsnU3RyaW5nJywgJ0Jvb2xlYW4nLCAnSW50JywgJ0Zsb2F0J10uZm9yRWFjaChnZW5HU2NhbGFyVHlwZXNGaWx0ZXIpO1xuICAgICAgICBnZW5HRW51bVR5cGVzKCk7XG4gICAgICAgIHR5cGVzLmZvckVhY2godHlwZSA9PiBnZW5HVHlwZURlY2xhcmF0aW9uKHR5cGUpKTtcbiAgICAgICAgY29uc3QgZ0FycmF5RmlsdGVycyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKHR5cGUgPT4gZ2VuR0ZpbHRlcih0eXBlLCBnQXJyYXlGaWx0ZXJzKSk7XG5cbiAgICAgICAgY29uc3QgY29sbGVjdGlvbnMgPSB0eXBlcy5maWx0ZXIodCA9PiAhIXQuY29sbGVjdGlvbik7XG4gICAgICAgIGdlbkdRdWVyaWVzKGNvbGxlY3Rpb25zKTtcbiAgICAgICAgZ2VuR1N1YnNjcmlwdGlvbnMoY29sbGVjdGlvbnMpO1xuXG4gICAgICAgIC8vIEpTXG5cbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgY29uc3Qge1xuICAgICAgICAgICAgc2NhbGFyLFxuICAgICAgICAgICAgYmlnVUludDEsXG4gICAgICAgICAgICBiaWdVSW50MixcbiAgICAgICAgICAgIHJlc29sdmVCaWdVSW50LFxuICAgICAgICAgICAgc3RydWN0LFxuICAgICAgICAgICAgYXJyYXksXG4gICAgICAgICAgICBqb2luLFxuICAgICAgICAgICAgam9pbkFycmF5LFxuICAgICAgICAgICAgZW51bU5hbWUsXG4gICAgICAgICAgICBzdHJpbmdDb21wYW5pb24sXG4gICAgICAgICAgICBjcmVhdGVFbnVtTmFtZVJlc29sdmVyLFxuICAgICAgICAgICAgdW5peE1pbGxpc2Vjb25kc1RvU3RyaW5nLFxuICAgICAgICAgICAgdW5peFNlY29uZHNUb1N0cmluZyxcbiAgICAgICAgfSA9IHJlcXVpcmUoJy4uL2ZpbHRlci9maWx0ZXJzLmpzJyk7XG4gICAgICAgIGApO1xuICAgICAgICBjb25zdCBqc0FycmF5RmlsdGVycyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKHR5cGUgPT4gZ2VuSlNGaWx0ZXIodHlwZSwganNBcnJheUZpbHRlcnMpKTtcblxuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBmdW5jdGlvbiBjcmVhdGVSZXNvbHZlcnMoZGF0YSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgYCk7XG4gICAgICAgIHR5cGVzLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICAgICAgICAgIGdlbkpTQ3VzdG9tUmVzb2x2ZXJzKHR5cGUpO1xuICAgICAgICAgICAgZ2VuSlNUeXBlUmVzb2x2ZXJzRm9yVW5pb24odHlwZSk7XG4gICAgICAgIH0pO1xuICAgICAgICBqcy53cml0ZUxuKCcgICAgICAgIFF1ZXJ5OiB7Jyk7XG4gICAgICAgIGNvbGxlY3Rpb25zLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICR7dHlwZS5jb2xsZWN0aW9uIHx8ICcnfTogZGF0YS4ke3R5cGUuY29sbGVjdGlvbiB8fCAnJ30ucXVlcnlSZXNvbHZlcigpLGApXG4gICAgICAgIH0pO1xuICAgICAgICBqcy53cml0ZUxuKCcgICAgICAgIH0sJyk7XG4gICAgICAgIGpzLndyaXRlTG4oJyAgICAgICAgU3Vic2NyaXB0aW9uOiB7Jyk7XG4gICAgICAgIGNvbGxlY3Rpb25zLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICR7dHlwZS5jb2xsZWN0aW9uIHx8ICcnfTogZGF0YS4ke3R5cGUuY29sbGVjdGlvbiB8fCAnJ30uc3Vic2NyaXB0aW9uUmVzb2x2ZXIoKSxgKVxuICAgICAgICB9KTtcbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBgKTtcblxuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBjb25zdCBzY2FsYXJGaWVsZHMgPSBuZXcgTWFwKCk7XG4gICAgICAgIGApO1xuICAgICAgICBjb2xsZWN0aW9ucy5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgICAgICAgICBnZW5KU1NjYWxhckZpZWxkcyh0eXBlLCB0eXBlLmNvbGxlY3Rpb24gfHwgJycsICdkb2MnKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgICAgICAgICBzY2FsYXJGaWVsZHMsXG4gICAgICAgICAgICBjcmVhdGVSZXNvbHZlcnMsXG4gICAgICAgIGApO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKHR5cGUgPT4ganMud3JpdGVMbihgICAgICR7dHlwZS5uYW1lfSxgKSk7XG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIH07XG4gICAgICAgIGApO1xuICAgIH1cblxuICAgIGdlbmVyYXRlKGRiVHlwZXMpO1xuXG4gICAgZm9yIChjb25zdCBlOiBJbnRFbnVtRGVmIG9mIGVudW1UeXBlcy52YWx1ZXMoKSkge1xuICAgICAgICBjb25zb2xlLmxvZyhgZXhwb3J0IGNvbnN0IFEke2UubmFtZX0gPSB7YCk7XG4gICAgICAgIGNvbnNvbGUubG9nKE9iamVjdC5lbnRyaWVzKGUudmFsdWVzKS5tYXAoKFtuYW1lLCB2YWx1ZV0pID0+IHtcbiAgICAgICAgICAgIHJldHVybiBgICAgICR7bmFtZX06ICR7KHZhbHVlOiBhbnkpfSxgO1xuICAgICAgICB9KS5qb2luKCdcXG4nKSk7XG4gICAgICAgIGNvbnNvbGUubG9nKGB9O1xcbmApO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIHFsOiBnLmdlbmVyYXRlZCgpLFxuICAgICAgICBqczoganMuZ2VuZXJhdGVkKCksXG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBtYWluO1xuIl19