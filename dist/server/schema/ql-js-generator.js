"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _gen = require("ton-labs-dev-ops/dist/src/gen.js");

var _dbSchemaTypes = require("./db-schema-types");

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
        js.writeLn(`                return context.db.${collection}.waitForDoc(parent.${on}, '${refOn}', args);`);
      } else if (field.arrayDepth === 1) {
        js.writeLn(`                return context.db.${collection}.waitForDocs(parent.${on}, '${refOn}', args);`);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NlcnZlci9zY2hlbWEvcWwtanMtZ2VuZXJhdG9yLmpzIl0sIm5hbWVzIjpbIm1haW4iLCJzY2hlbWFEZWYiLCJ0eXBlcyIsImRiVHlwZXMiLCJlbnVtVHlwZXMiLCJnIiwiV3JpdGVyIiwianMiLCJnZW5HRG9jIiwicHJlZml4IiwiZG9jIiwidHJpbSIsImxpbmVzIiwic3BsaXQiLCJsZW5ndGgiLCJpbmNsdWRlcyIsIndyaXRlTG4iLCJmb3JFYWNoIiwibGluZSIsInVuaW9uVmFyaWFudFR5cGUiLCJ0eXBlIiwidmFyaWFudCIsIm5hbWUiLCJnZW5HVHlwZURlY2xhcmF0aW9uc0ZvclVuaW9uVmFyaWFudHMiLCJmaWVsZHMiLCJ3cml0ZUJsb2NrTG4iLCJnZW5HRW51bVR5cGVzIiwiZW51bURlZiIsInZhbHVlcyIsIk9iamVjdCIsImtleXMiLCJnZW5HVHlwZURlY2xhcmF0aW9uIiwiY2F0ZWdvcnkiLCJEYlR5cGVDYXRlZ29yeSIsInVuaW9uIiwiZmllbGQiLCJ0eXBlRGVjbGFyYXRpb24iLCJyZXBlYXQiLCJhcnJheURlcHRoIiwicGFyYW1zIiwiam9pbiIsImZvcm1hdHRlciIsInByZXZlbnRUd2ljZSIsIm5hbWVzIiwid29yayIsImhhcyIsImFkZCIsImdlbkdGaWx0ZXJzRm9yQXJyYXlGaWVsZHMiLCJnTmFtZXMiLCJpdGVtVHlwZU5hbWUiLCJpIiwiZmlsdGVyTmFtZSIsIm9wIiwiZ2VuR0ZpbHRlcnNGb3JFbnVtTmFtZUZpZWxkcyIsImdlbkdTY2FsYXJUeXBlc0ZpbHRlciIsImdlbkdGaWx0ZXIiLCJnZW5HUXVlcmllcyIsImNvbGxlY3Rpb24iLCJnZW5HU3Vic2NyaXB0aW9ucyIsImdldFNjYWxhclJlc29sdmVyTmFtZSIsInNjYWxhclR5cGVzIiwidWludDY0IiwidWludDEwMjQiLCJnZW5KU0ZpbHRlcnNGb3JBcnJheUZpZWxkcyIsImpzTmFtZXMiLCJpdGVtUmVzb2x2ZXJOYW1lIiwic2NhbGFyIiwiZ2VuSlNTdHJ1Y3RGaWx0ZXIiLCJzdWZmaXgiLCJvbiIsInJlZk9uIiwiZ2VuSlNVbmlvblJlc29sdmVyIiwiZ2VuSlNGaWx0ZXIiLCJnZW5KU0N1c3RvbVJlc29sdmVycyIsImpvaW5GaWVsZHMiLCJmaWx0ZXIiLCJ4IiwiYmlnVUludEZpZWxkcyIsInN0cmluZ0Zvcm1hdHRlZEZpZWxkcyIsImVudW1GaWVsZHMiLCJjdXN0b21SZXNvbHZlclJlcXVpcmVkIiwib25GaWVsZCIsImZpbmQiLCJwcmVDb25kaXRpb24iLCJwcmVmaXhMZW5ndGgiLCJnZW5KU1NjYWxhckZpZWxkcyIsInBhcmVudFBhdGgiLCJwYXJlbnREb2NQYXRoIiwiZG9jTmFtZSIsInBhdGgiLCJkb2NQYXRoIiwiZGVwdGgiLCJzIiwidHlwZU5hbWUiLCJib29sZWFuIiwiZmxvYXQiLCJpbnQiLCJnZW5KU1R5cGVSZXNvbHZlcnNGb3JVbmlvbiIsImdlbmVyYXRlIiwiZ0FycmF5RmlsdGVycyIsIlNldCIsImNvbGxlY3Rpb25zIiwidCIsImpzQXJyYXlGaWx0ZXJzIiwiZSIsImNvbnNvbGUiLCJsb2ciLCJlbnRyaWVzIiwibWFwIiwidmFsdWUiLCJxbCIsImdlbmVyYXRlZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUVBOztBQUdBOztBQVFBLFNBQVNBLElBQVQsQ0FBY0MsU0FBZCxFQUFrQztBQUM5QixRQUFNO0FBQUVDLElBQUFBLEtBQUssRUFBRUMsT0FBVDtBQUFrQkMsSUFBQUE7QUFBbEIsTUFBK0Isa0NBQWNILFNBQWQsQ0FBckMsQ0FEOEIsQ0FHbEM7O0FBRUksUUFBTUksQ0FBQyxHQUFHLElBQUlDLFdBQUosRUFBVjtBQUNBLFFBQU1DLEVBQUUsR0FBRyxJQUFJRCxXQUFKLEVBQVg7O0FBRUEsV0FBU0UsT0FBVCxDQUFpQkMsTUFBakIsRUFBaUNDLEdBQWpDLEVBQThDO0FBQzFDLFFBQUlBLEdBQUcsQ0FBQ0MsSUFBSixPQUFlLEVBQW5CLEVBQXVCO0FBQ25CO0FBQ0g7O0FBQ0QsVUFBTUMsS0FBSyxHQUFHRixHQUFHLENBQUNHLEtBQUosQ0FB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LEtBRkQ7QUFJQWxELElBQUFBLEVBQUUsQ0FBQ2tCLFlBQUgsQ0FBaUI7Ozs7U0FBakI7QUFLQXZCLElBQUFBLEtBQUssQ0FBQ2UsT0FBTixDQUFjRyxJQUFJLElBQUliLEVBQUUsQ0FBQ1MsT0FBSCxDQUFZLE9BQU1JLElBQUksQ0FBQ0UsSUFBSyxHQUE1QixDQUF0QjtBQUNBZixJQUFBQSxFQUFFLENBQUNrQixZQUFILENBQWlCOztTQUFqQjtBQUdIOztBQUVEeUUsRUFBQUEsUUFBUSxDQUFDL0YsT0FBRCxDQUFSOztBQUVBLE9BQUssTUFBTXFHLENBQVgsSUFBNEJwRyxTQUFTLENBQUN3QixNQUFWLEVBQTVCLEVBQWdEO0FBQzVDNkUsSUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQWEsaUJBQWdCRixDQUFDLENBQUNsRixJQUFLLE1BQXBDO0FBQ0FtRixJQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWTdFLE1BQU0sQ0FBQzhFLE9BQVAsQ0FBZUgsQ0FBQyxDQUFDNUUsTUFBakIsRUFBeUJnRixHQUF6QixDQUE2QixDQUFDLENBQUN0RixJQUFELEVBQU91RixLQUFQLENBQUQsS0FBbUI7QUFDeEQsYUFBUSxPQUFNdkYsSUFBSyxLQUFLdUYsS0FBWSxHQUFwQztBQUNILEtBRlcsRUFFVHJFLElBRlMsQ0FFSixJQUZJLENBQVo7QUFHQWlFLElBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFhLE1BQWI7QUFDSDs7QUFFRCxTQUFPO0FBQ0hJLElBQUFBLEVBQUUsRUFBRXpHLENBQUMsQ0FBQzBHLFNBQUYsRUFERDtBQUVIeEcsSUFBQUEsRUFBRSxFQUFFQSxFQUFFLENBQUN3RyxTQUFIO0FBRkQsR0FBUDtBQUlIOztlQUVjL0csSSIsInNvdXJjZXNDb250ZW50IjpbIi8vQGZsb3dcblxuaW1wb3J0IHtXcml0ZXJ9IGZyb20gJ3Rvbi1sYWJzLWRldi1vcHMvZGlzdC9zcmMvZ2VuLmpzJztcbmltcG9ydCB0eXBlIHtUeXBlRGVmfSBmcm9tICd0b24tbGFicy1kZXYtb3BzL3NyYy9zY2hlbWEuanMnO1xuaW1wb3J0IHR5cGUge0RiRmllbGQsIERiVHlwZSwgSW50RW51bURlZn0gZnJvbSAnLi9kYi1zY2hlbWEtdHlwZXMnO1xuaW1wb3J0IHtcbiAgICBEYlR5cGVDYXRlZ29yeSxcbiAgICBpc0JpZ0ludCwgcGFyc2VEYlNjaGVtYSxcbiAgICBzY2FsYXJUeXBlcyxcbiAgICBzdHJpbmdpZnlFbnVtVmFsdWVzLFxuICAgIHRvRW51bVN0eWxlLFxufSBmcm9tICcuL2RiLXNjaGVtYS10eXBlcyc7XG5cbmZ1bmN0aW9uIG1haW4oc2NoZW1hRGVmOiBUeXBlRGVmKSB7XG4gICAgY29uc3QgeyB0eXBlczogZGJUeXBlcywgZW51bVR5cGVzfSA9IHBhcnNlRGJTY2hlbWEoc2NoZW1hRGVmKTtcblxuLy8gR2VuZXJhdG9yc1xuXG4gICAgY29uc3QgZyA9IG5ldyBXcml0ZXIoKTtcbiAgICBjb25zdCBqcyA9IG5ldyBXcml0ZXIoKTtcblxuICAgIGZ1bmN0aW9uIGdlbkdEb2MocHJlZml4OiBzdHJpbmcsIGRvYzogc3RyaW5nKSB7XG4gICAgICAgIGlmIChkb2MudHJpbSgpID09PSAnJykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGxpbmVzID0gZG9jLnNwbGl0KC9cXG5cXHI/fFxcclxcbj8vKTtcbiAgICAgICAgaWYgKGxpbmVzLmxlbmd0aCA9PT0gMSAmJiAhbGluZXNbMF0uaW5jbHVkZXMoJ1wiJykpIHtcbiAgICAgICAgICAgIGcud3JpdGVMbihwcmVmaXgsICdcIicsIGxpbmVzWzBdLCAnXCInKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGcud3JpdGVMbihwcmVmaXgsICdcIlwiXCInKTtcbiAgICAgICAgICAgIGxpbmVzLmZvckVhY2goKGxpbmUpID0+IHtcbiAgICAgICAgICAgICAgICBnLndyaXRlTG4ocHJlZml4LCBsaW5lKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgZy53cml0ZUxuKHByZWZpeCwgJ1wiXCJcIicpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdW5pb25WYXJpYW50VHlwZSh0eXBlOiBEYlR5cGUsIHZhcmlhbnQ6IERiRmllbGQpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gYCR7dHlwZS5uYW1lfSR7dmFyaWFudC5uYW1lfVZhcmlhbnRgO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkdUeXBlRGVjbGFyYXRpb25zRm9yVW5pb25WYXJpYW50cyh0eXBlOiBEYlR5cGUpIHtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgodmFyaWFudCkgPT4ge1xuICAgICAgICAgICAgZy53cml0ZUJsb2NrTG4oYFxuICAgICAgICB0eXBlICR7dW5pb25WYXJpYW50VHlwZSh0eXBlLCB2YXJpYW50KX0ge1xuICAgICAgICAgICAgJHt2YXJpYW50Lm5hbWV9OiAke3ZhcmlhbnQudHlwZS5uYW1lfVxuICAgICAgICB9XG5cbiAgICAgICAgYCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkdFbnVtVHlwZXMoKSB7XG4gICAgICAgIGZvciAoY29uc3QgZW51bURlZjogSW50RW51bURlZiBvZiBlbnVtVHlwZXMudmFsdWVzKCkpIHtcbiAgICAgICAgICAgIGcud3JpdGVMbihgZW51bSAke2VudW1EZWYubmFtZX1FbnVtIHtgKTtcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKGVudW1EZWYudmFsdWVzKS5mb3JFYWNoKChuYW1lKSA9PiB7XG4gICAgICAgICAgICAgICAgZy53cml0ZUxuKGAgICAgJHt0b0VudW1TdHlsZShuYW1lKX1gKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgZy53cml0ZUxuKGB9YCk7XG4gICAgICAgICAgICBnLndyaXRlTG4oKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkdUeXBlRGVjbGFyYXRpb24odHlwZTogRGJUeXBlKSB7XG4gICAgICAgIGlmICh0eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS51bmlvbikge1xuICAgICAgICAgICAgZ2VuR1R5cGVEZWNsYXJhdGlvbnNGb3JVbmlvblZhcmlhbnRzKHR5cGUpO1xuICAgICAgICAgICAgZy53cml0ZUxuKGB1bmlvbiAke3R5cGUubmFtZX0gPSBgKTtcbiAgICAgICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2godmFyaWFudCA9PiB7XG4gICAgICAgICAgICAgICAgZy53cml0ZUxuKGBcXHR8ICR7dW5pb25WYXJpYW50VHlwZSh0eXBlLCB2YXJpYW50KX1gKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgZy53cml0ZUxuKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBnZW5HRG9jKCcnLCB0eXBlLmRvYyk7XG4gICAgICAgICAgICBnLndyaXRlTG4oYHR5cGUgJHt0eXBlLm5hbWV9IHtgKTtcbiAgICAgICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goZmllbGQgPT4ge1xuICAgICAgICAgICAgICAgIGdlbkdEb2MoJ1xcdCcsIGZpZWxkLmRvYyk7XG4gICAgICAgICAgICAgICAgY29uc3QgdHlwZURlY2xhcmF0aW9uID1cbiAgICAgICAgICAgICAgICAgICAgJ1snLnJlcGVhdChmaWVsZC5hcnJheURlcHRoKSArXG4gICAgICAgICAgICAgICAgICAgIGZpZWxkLnR5cGUubmFtZSArXG4gICAgICAgICAgICAgICAgICAgICddJy5yZXBlYXQoZmllbGQuYXJyYXlEZXB0aCk7XG4gICAgICAgICAgICAgICAgbGV0IHBhcmFtcyA9ICcnO1xuICAgICAgICAgICAgICAgIGlmIChpc0JpZ0ludChmaWVsZC50eXBlKSkge1xuICAgICAgICAgICAgICAgICAgICBwYXJhbXMgPSAnKGZvcm1hdDogQmlnSW50Rm9ybWF0KSc7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC5qb2luKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhcmFtcyA9IGAodGltZW91dDogSW50LCB3aGVuOiAke3R5cGUubmFtZX1GaWx0ZXIpYDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBnLndyaXRlTG4oYFxcdCR7ZmllbGQubmFtZX0ke3BhcmFtc306ICR7dHlwZURlY2xhcmF0aW9ufWApO1xuICAgICAgICAgICAgICAgIGNvbnN0IGVudW1EZWYgPSBmaWVsZC5lbnVtRGVmO1xuICAgICAgICAgICAgICAgIGlmIChlbnVtRGVmKSB7XG4gICAgICAgICAgICAgICAgICAgIGcud3JpdGVMbihgXFx0JHtmaWVsZC5uYW1lfV9uYW1lOiAke2VudW1EZWYubmFtZX1FbnVtYCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChmaWVsZC5mb3JtYXR0ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgZy53cml0ZUxuKGBcXHQke2ZpZWxkLm5hbWV9X3N0cmluZzogU3RyaW5nYCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBnLndyaXRlTG4oYH1gKTtcbiAgICAgICAgfVxuICAgICAgICBnLndyaXRlTG4oKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwcmV2ZW50VHdpY2UobmFtZTogc3RyaW5nLCBuYW1lczogU2V0PHN0cmluZz4sIHdvcms6ICgpID0+IHZvaWQpIHtcbiAgICAgICAgaWYgKCFuYW1lcy5oYXMobmFtZSkpIHtcbiAgICAgICAgICAgIG5hbWVzLmFkZChuYW1lKTtcbiAgICAgICAgICAgIHdvcmsoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkdGaWx0ZXJzRm9yQXJyYXlGaWVsZHModHlwZTogRGJUeXBlLCBnTmFtZXM6IFNldDxzdHJpbmc+KSB7XG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBsZXQgaXRlbVR5cGVOYW1lID0gZmllbGQudHlwZS5uYW1lO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmaWVsZC5hcnJheURlcHRoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWx0ZXJOYW1lID0gYCR7aXRlbVR5cGVOYW1lfUFycmF5RmlsdGVyYDtcbiAgICAgICAgICAgICAgICBwcmV2ZW50VHdpY2UoZmlsdGVyTmFtZSwgZ05hbWVzLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGcud3JpdGVMbihgaW5wdXQgJHtmaWx0ZXJOYW1lfSB7YCk7XG4gICAgICAgICAgICAgICAgICAgIFsnYW55JywgJ2FsbCddLmZvckVhY2goKG9wKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBnLndyaXRlTG4oYFxcdCR7b3B9OiAke2l0ZW1UeXBlTmFtZX1GaWx0ZXJgKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGcud3JpdGVMbignfScpO1xuICAgICAgICAgICAgICAgICAgICBnLndyaXRlTG4oKTtcblxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGl0ZW1UeXBlTmFtZSArPSAnQXJyYXknO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5HRmlsdGVyc0ZvckVudW1OYW1lRmllbGRzKHR5cGU6IERiVHlwZSwgZ05hbWVzOiBTZXQ8c3RyaW5nPikge1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgZW51bURlZiA9IGZpZWxkLmVudW1EZWY7XG4gICAgICAgICAgICBpZiAoZW51bURlZikge1xuICAgICAgICAgICAgICAgIHByZXZlbnRUd2ljZShgJHtlbnVtRGVmLm5hbWV9RW51bUZpbHRlcmAsIGdOYW1lcywgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBnZW5HU2NhbGFyVHlwZXNGaWx0ZXIoYCR7ZW51bURlZi5uYW1lfUVudW1gKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuR0ZpbHRlcih0eXBlOiBEYlR5cGUsIGdOYW1lczogU2V0PHN0cmluZz4pIHtcbiAgICAgICAgaWYgKHR5cGUuZmllbGRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGdlbkdGaWx0ZXJzRm9yQXJyYXlGaWVsZHModHlwZSwgZ05hbWVzKTtcbiAgICAgICAgZ2VuR0ZpbHRlcnNGb3JFbnVtTmFtZUZpZWxkcyh0eXBlLCBnTmFtZXMpO1xuICAgICAgICBnZW5HRG9jKCcnLCB0eXBlLmRvYyk7XG4gICAgICAgIGcud3JpdGVMbihgaW5wdXQgJHt0eXBlLm5hbWV9RmlsdGVyIHtgKTtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGdlbkdEb2MoJ1xcdCcsIGZpZWxkLmRvYyk7XG4gICAgICAgICAgICBjb25zdCB0eXBlRGVjbGFyYXRpb24gPSBmaWVsZC50eXBlLm5hbWUgKyBcIkFycmF5XCIucmVwZWF0KGZpZWxkLmFycmF5RGVwdGgpO1xuICAgICAgICAgICAgZy53cml0ZUxuKGBcXHQke2ZpZWxkLm5hbWV9OiAke3R5cGVEZWNsYXJhdGlvbn1GaWx0ZXJgKTtcbiAgICAgICAgICAgIGNvbnN0IGVudW1EZWYgPSBmaWVsZC5lbnVtRGVmO1xuICAgICAgICAgICAgaWYgKGVudW1EZWYpIHtcbiAgICAgICAgICAgICAgICBnLndyaXRlTG4oYFxcdCR7ZmllbGQubmFtZX1fbmFtZTogJHtlbnVtRGVmLm5hbWV9RW51bUZpbHRlcmApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgZy53cml0ZUxuKGAgICAgT1I6ICR7dHlwZS5uYW1lfUZpbHRlcmApO1xuICAgICAgICBnLndyaXRlTG4oYH1gKTtcbiAgICAgICAgZy53cml0ZUxuKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuR1NjYWxhclR5cGVzRmlsdGVyKG5hbWU6IHN0cmluZykge1xuICAgICAgICBnLndyaXRlTG4oYGlucHV0ICR7bmFtZX1GaWx0ZXIge2ApO1xuICAgICAgICBbJ2VxJywgJ25lJywgJ2d0JywgJ2x0JywgJ2dlJywgJ2xlJ10uZm9yRWFjaCgob3ApID0+IHtcbiAgICAgICAgICAgIGcud3JpdGVMbihgXFx0JHtvcH06ICR7bmFtZX1gKTtcbiAgICAgICAgfSk7XG4gICAgICAgIFsnaW4nLCAnbm90SW4nXS5mb3JFYWNoKChvcCkgPT4ge1xuICAgICAgICAgICAgZy53cml0ZUxuKGBcXHQke29wfTogWyR7bmFtZX1dYCk7XG4gICAgICAgIH0pO1xuICAgICAgICBnLndyaXRlTG4oJ30nKTtcbiAgICAgICAgZy53cml0ZUxuKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuR1F1ZXJpZXModHlwZXM6IERiVHlwZVtdKSB7XG4gICAgICAgIGcud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgXCJTcGVjaWZ5IHNvcnQgb3JkZXIgZGlyZWN0aW9uXCJcbiAgICAgICAgZW51bSBRdWVyeU9yZGVyQnlEaXJlY3Rpb24ge1xuICAgICAgICAgICAgXCJEb2N1bWVudHMgd2lsbCBiZSBzb3J0ZWQgaW4gYXNjZW5kZWQgb3JkZXIgKGUuZy4gZnJvbSBBIHRvIFopXCJcbiAgICAgICAgICAgIEFTQ1xuICAgICAgICAgICAgXCJEb2N1bWVudHMgd2lsbCBiZSBzb3J0ZWQgaW4gZGVzY2VuZGFudCBvcmRlciAoZS5nLiBmcm9tIFogdG8gQSlcIlxuICAgICAgICAgICAgREVTQ1xuICAgICAgICB9XG5cbiAgICAgICAgXG4gICAgICAgIFwiXCJcIlxuICAgICAgICBTcGVjaWZ5IGhvdyB0byBzb3J0IHJlc3VsdHMuXG4gICAgICAgIFlvdSBjYW4gc29ydCBkb2N1bWVudHMgaW4gcmVzdWx0IHNldCB1c2luZyBtb3JlIHRoYW4gb25lIGZpZWxkLlxuICAgICAgICBcIlwiXCJcbiAgICAgICAgaW5wdXQgUXVlcnlPcmRlckJ5IHtcbiAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgICAgUGF0aCB0byBmaWVsZCB3aGljaCBtdXN0IGJlIHVzZWQgYXMgYSBzb3J0IGNyaXRlcmlhLlxuICAgICAgICAgICAgSWYgZmllbGQgcmVzaWRlcyBkZWVwIGluIHN0cnVjdHVyZSBwYXRoIGl0ZW1zIG11c3QgYmUgc2VwYXJhdGVkIHdpdGggZG90IChlLmcuICdmb28uYmFyLmJheicpLlxuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgICBwYXRoOiBTdHJpbmdcbiAgICAgICAgICAgIFwiU29ydCBvcmRlciBkaXJlY3Rpb25cIlxuICAgICAgICAgICAgZGlyZWN0aW9uOiBRdWVyeU9yZGVyQnlEaXJlY3Rpb25cbiAgICAgICAgfVxuXG4gICAgICAgIHR5cGUgUXVlcnkge1xuICAgICAgICBgKTtcblxuICAgICAgICB0eXBlcy5mb3JFYWNoKCh0eXBlOiBEYlR5cGUpID0+IHtcbiAgICAgICAgICAgIGcud3JpdGVMbihgXFx0JHt0eXBlLmNvbGxlY3Rpb24gfHwgJyd9KGZpbHRlcjogJHt0eXBlLm5hbWV9RmlsdGVyLCBvcmRlckJ5OiBbUXVlcnlPcmRlckJ5XSwgbGltaXQ6IEludCwgdGltZW91dDogRmxvYXQsIGFjY2Vzc0tleTogU3RyaW5nLCBvcGVyYXRpb25JZDogU3RyaW5nKTogWyR7dHlwZS5uYW1lfV1gKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgZy53cml0ZUJsb2NrTG4oYFxuICAgICAgICB9XG5cbiAgICAgICAgYCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuR1N1YnNjcmlwdGlvbnModHlwZXM6IERiVHlwZVtdKSB7XG4gICAgICAgIGcud3JpdGVMbigndHlwZSBTdWJzY3JpcHRpb24geycpO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgICAgICAgICBnLndyaXRlTG4oYFxcdCR7dHlwZS5jb2xsZWN0aW9uIHx8ICcnfShmaWx0ZXI6ICR7dHlwZS5uYW1lfUZpbHRlciwgYWNjZXNzS2V5OiBTdHJpbmcpOiAke3R5cGUubmFtZX1gKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGcud3JpdGVMbignfScpO1xuICAgIH1cblxuXG4gICAgZnVuY3Rpb24gZ2V0U2NhbGFyUmVzb2x2ZXJOYW1lKGZpZWxkOiBEYkZpZWxkKTogc3RyaW5nIHtcbiAgICAgICAgaWYgKGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLnVpbnQ2NCkge1xuICAgICAgICAgICAgcmV0dXJuICdiaWdVSW50MSc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLnVpbnQxMDI0KSB7XG4gICAgICAgICAgICByZXR1cm4gJ2JpZ1VJbnQyJztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJ3NjYWxhcic7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuSlNGaWx0ZXJzRm9yQXJyYXlGaWVsZHModHlwZTogRGJUeXBlLCBqc05hbWVzOiBTZXQ8c3RyaW5nPikge1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgbGV0IGl0ZW1UeXBlTmFtZSA9IGZpZWxkLnR5cGUubmFtZTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZmllbGQuYXJyYXlEZXB0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmlsdGVyTmFtZSA9IGAke2l0ZW1UeXBlTmFtZX1BcnJheWA7XG4gICAgICAgICAgICAgICAgcHJldmVudFR3aWNlKGZpbHRlck5hbWUsIGpzTmFtZXMsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaXRlbVJlc29sdmVyTmFtZSA9IChpID09PSAwICYmIGZpZWxkLnR5cGUuY2F0ZWdvcnkgPT09IERiVHlwZUNhdGVnb3J5LnNjYWxhcilcbiAgICAgICAgICAgICAgICAgICAgICAgID8gZ2V0U2NhbGFyUmVzb2x2ZXJOYW1lKGZpZWxkKVxuICAgICAgICAgICAgICAgICAgICAgICAgOiBpdGVtVHlwZU5hbWU7XG4gICAgICAgICAgICAgICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgICAgICAgICAgY29uc3QgJHtmaWx0ZXJOYW1lfSA9IGFycmF5KCgpID0+ICR7aXRlbVJlc29sdmVyTmFtZX0pO1xuICAgICAgICAgICAgICAgIGApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGl0ZW1UeXBlTmFtZSArPSAnQXJyYXknO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5KU1N0cnVjdEZpbHRlcih0eXBlOiBEYlR5cGUpIHtcbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgY29uc3QgJHt0eXBlLm5hbWV9ID0gc3RydWN0KHtcbiAgICBgKTtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgoZmllbGQ6IERiRmllbGQpID0+IHtcbiAgICAgICAgICAgIGxldCB0eXBlRGVjbGFyYXRpb246ID9zdHJpbmcgPSBudWxsO1xuICAgICAgICAgICAgY29uc3Qgam9pbiA9IGZpZWxkLmpvaW47XG4gICAgICAgICAgICBpZiAoam9pbikge1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1ZmZpeCA9IGZpZWxkLmFycmF5RGVwdGggPiAwID8gJ0FycmF5JyA6ICcnO1xuICAgICAgICAgICAgICAgIHR5cGVEZWNsYXJhdGlvbiA9IGBqb2luJHtzdWZmaXh9KCcke2pvaW4ub259JywgJyR7am9pbi5yZWZPbn0nLCAnJHtmaWVsZC50eXBlLmNvbGxlY3Rpb24gfHwgJyd9JywgKCkgPT4gJHtmaWVsZC50eXBlLm5hbWV9KWA7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLmFycmF5RGVwdGggPiAwKSB7XG4gICAgICAgICAgICAgICAgdHlwZURlY2xhcmF0aW9uID1cbiAgICAgICAgICAgICAgICAgICAgZmllbGQudHlwZS5uYW1lICtcbiAgICAgICAgICAgICAgICAgICAgJ0FycmF5Jy5yZXBlYXQoZmllbGQuYXJyYXlEZXB0aCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLnR5cGUuY2F0ZWdvcnkgPT09IERiVHlwZUNhdGVnb3J5LnNjYWxhcikge1xuICAgICAgICAgICAgICAgIHR5cGVEZWNsYXJhdGlvbiA9IGdldFNjYWxhclJlc29sdmVyTmFtZShmaWVsZCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLnR5cGUuZmllbGRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB0eXBlRGVjbGFyYXRpb24gPSBmaWVsZC50eXBlLm5hbWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodHlwZURlY2xhcmF0aW9uKSB7XG4gICAgICAgICAgICAgICAganMud3JpdGVMbihgICAgICR7ZmllbGQubmFtZX06ICR7dHlwZURlY2xhcmF0aW9ufSxgKTtcbiAgICAgICAgICAgICAgICBjb25zdCBlbnVtRGVmID0gZmllbGQuZW51bURlZjtcbiAgICAgICAgICAgICAgICBpZiAoZW51bURlZikge1xuICAgICAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgJHtmaWVsZC5uYW1lfV9uYW1lOiBlbnVtTmFtZSgnJHtmaWVsZC5uYW1lfScsICR7c3RyaW5naWZ5RW51bVZhbHVlcyhlbnVtRGVmLnZhbHVlcyl9KSxgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGZpZWxkLmZvcm1hdHRlcikge1xuICAgICAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgJHtmaWVsZC5uYW1lfV9zdHJpbmc6IHN0cmluZ0NvbXBhbmlvbignJHtmaWVsZC5uYW1lfScpLGApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIH0ke3R5cGUuY29sbGVjdGlvbiA/ICcsIHRydWUnIDogJyd9KTtcblxuICAgIGApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkpTVW5pb25SZXNvbHZlcih0eXBlOiBEYlR5cGUpIHtcbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgY29uc3QgJHt0eXBlLm5hbWV9UmVzb2x2ZXIgPSB7XG4gICAgICAgICAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xuICAgICAgICBgKTtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgodmFyaWFudCkgPT4ge1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICBpZiAoJyR7dmFyaWFudC5uYW1lfScgaW4gb2JqKSB7YCk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICByZXR1cm4gJyR7dW5pb25WYXJpYW50VHlwZSh0eXBlLCB2YXJpYW50KX0nO2ApO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICB9YCk7XG4gICAgICAgIH0pO1xuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkpTRmlsdGVyKHR5cGU6IERiVHlwZSwganNOYW1lczogU2V0PHN0cmluZz4pIHtcbiAgICAgICAgaWYgKHR5cGUuZmllbGRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS51bmlvbikge1xuICAgICAgICAgICAgLy8gZ2VuSlNGaWx0ZXJzRm9yVW5pb25WYXJpYW50cyh0eXBlLCBqc05hbWVzKTtcbiAgICAgICAgfVxuICAgICAgICBnZW5KU0ZpbHRlcnNGb3JBcnJheUZpZWxkcyh0eXBlLCBqc05hbWVzKTtcbiAgICAgICAgZ2VuSlNTdHJ1Y3RGaWx0ZXIodHlwZSk7XG4gICAgICAgIGlmICh0eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS51bmlvbikge1xuICAgICAgICAgICAgZ2VuSlNVbmlvblJlc29sdmVyKHR5cGUpO1xuICAgICAgICB9XG5cblxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlIGN1c3RvbSByZXNvbHZlcnMgZm9yIHR5cGVzIHdpdGg6XG4gICAgICogLSBpZCBmaWVsZFxuICAgICAqIC0gam9pbiBmaWVsZHNcbiAgICAgKiAtIHU2NCBhbmQgaGlnaGVyIGZpZWxkc1xuICAgICAqIEBwYXJhbSB0eXBlXG4gICAgICovXG4gICAgZnVuY3Rpb24gZ2VuSlNDdXN0b21SZXNvbHZlcnModHlwZTogRGJUeXBlKSB7XG4gICAgICAgIGNvbnN0IGpvaW5GaWVsZHMgPSB0eXBlLmZpZWxkcy5maWx0ZXIoeCA9PiAhIXguam9pbik7XG4gICAgICAgIGNvbnN0IGJpZ1VJbnRGaWVsZHMgPSB0eXBlLmZpZWxkcy5maWx0ZXIoKHg6IERiRmllbGQpID0+IGlzQmlnSW50KHgudHlwZSkpO1xuICAgICAgICBjb25zdCBzdHJpbmdGb3JtYXR0ZWRGaWVsZHMgPSB0eXBlLmZpZWxkcy5maWx0ZXIoKHg6IERiRmllbGQpID0+IHguZm9ybWF0dGVyKTtcbiAgICAgICAgY29uc3QgZW51bUZpZWxkcyA9IHR5cGUuZmllbGRzLmZpbHRlcih4ID0+IHguZW51bURlZik7XG4gICAgICAgIGNvbnN0IGN1c3RvbVJlc29sdmVyUmVxdWlyZWQgPSB0eXBlLmNvbGxlY3Rpb25cbiAgICAgICAgICAgIHx8IGpvaW5GaWVsZHMubGVuZ3RoID4gMFxuICAgICAgICAgICAgfHwgYmlnVUludEZpZWxkcy5sZW5ndGggPiAwXG4gICAgICAgICAgICB8fCBlbnVtRmllbGRzLmxlbmd0aCA+IDA7XG4gICAgICAgIGlmICghY3VzdG9tUmVzb2x2ZXJSZXF1aXJlZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgJHt0eXBlLm5hbWV9OiB7YCk7XG4gICAgICAgIGlmICh0eXBlLmNvbGxlY3Rpb24pIHtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oJyAgICAgICAgICAgIGlkKHBhcmVudCkgeycpO1xuICAgICAgICAgICAganMud3JpdGVMbignICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTsnKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oJyAgICAgICAgICAgIH0sJyk7XG4gICAgICAgIH1cbiAgICAgICAgam9pbkZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgY29uc3Qgam9pbiA9IGZpZWxkLmpvaW47XG4gICAgICAgICAgICBpZiAoIWpvaW4pIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBvbkZpZWxkID0gdHlwZS5maWVsZHMuZmluZCh4ID0+IHgubmFtZSA9PT0gam9pbi5vbik7XG4gICAgICAgICAgICBpZiAoIW9uRmllbGQpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyAnSm9pbiBvbiBmaWVsZCBkb2VzIG5vdCBleGlzdC4nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3Qgb24gPSBqb2luLm9uID09PSAnaWQnID8gJ19rZXknIDogKGpvaW4ub24gfHwgJ19rZXknKTtcbiAgICAgICAgICAgIGNvbnN0IHJlZk9uID0gam9pbi5yZWZPbiA9PT0gJ2lkJyA/ICdfa2V5JyA6IChqb2luLnJlZk9uIHx8ICdfa2V5Jyk7XG4gICAgICAgICAgICBjb25zdCBjb2xsZWN0aW9uID0gZmllbGQudHlwZS5jb2xsZWN0aW9uO1xuICAgICAgICAgICAgaWYgKCFjb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgJ0pvaW5lZCB0eXBlIGlzIG5vdCBhIGNvbGxlY3Rpb24uJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICR7ZmllbGQubmFtZX0ocGFyZW50LCBhcmdzLCBjb250ZXh0KSB7YCk7XG4gICAgICAgICAgICBpZiAoam9pbi5wcmVDb25kaXRpb24pIHtcbiAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAgICAgaWYgKCEoJHtqb2luLnByZUNvbmRpdGlvbn0pKSB7YCk7XG4gICAgICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtgKTtcbiAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAgICAgfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgICAgIGlmIChhcmdzLndoZW4gJiYgISR7dHlwZS5uYW1lfS50ZXN0KG51bGwsIHBhcmVudCwgYXJncy53aGVuKSkge2ApO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtgKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICAgICB9YCk7XG5cbiAgICAgICAgICAgIGlmIChmaWVsZC5hcnJheURlcHRoID09PSAwKSB7XG4gICAgICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgICAgIHJldHVybiBjb250ZXh0LmRiLiR7Y29sbGVjdGlvbn0ud2FpdEZvckRvYyhwYXJlbnQuJHtvbn0sICcke3JlZk9ufScsIGFyZ3MpO2ApO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC5hcnJheURlcHRoID09PSAxKSB7XG4gICAgICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgICAgIHJldHVybiBjb250ZXh0LmRiLiR7Y29sbGVjdGlvbn0ud2FpdEZvckRvY3MocGFyZW50LiR7b259LCAnJHtyZWZPbn0nLCBhcmdzKTtgKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgJ0pvaW5zIG9uIGEgbmVzdGVkIGFycmF5cyBkb2VzIG5vdCBzdXBwb3J0ZWQuJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgIH0sYCk7XG4gICAgICAgIH0pO1xuICAgICAgICBiaWdVSW50RmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwcmVmaXhMZW5ndGggPSBmaWVsZC50eXBlID09PSBzY2FsYXJUeXBlcy51aW50NjQgPyAxIDogMjtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICR7ZmllbGQubmFtZX0ocGFyZW50LCBhcmdzKSB7YCk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KCR7cHJlZml4TGVuZ3RofSwgcGFyZW50LiR7ZmllbGQubmFtZX0sIGFyZ3MpO2ApO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgfSxgKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHN0cmluZ0Zvcm1hdHRlZEZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgJHtmaWVsZC5uYW1lfV9zdHJpbmcocGFyZW50LCBhcmdzKSB7YCk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAgICAgcmV0dXJuICR7ZmllbGQuZm9ybWF0dGVyIHx8ICcnfShwYXJlbnQuJHtmaWVsZC5uYW1lfSk7YCk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICB9LGApO1xuICAgICAgICB9KTtcbiAgICAgICAgZW51bUZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgZW51bURlZiA9IGZpZWxkLmVudW1EZWY7XG4gICAgICAgICAgICBpZiAoZW51bURlZikge1xuICAgICAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICR7ZmllbGQubmFtZX1fbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignJHtmaWVsZC5uYW1lfScsICR7c3RyaW5naWZ5RW51bVZhbHVlcyhlbnVtRGVmLnZhbHVlcyl9KSxgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgfSxgKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5KU1NjYWxhckZpZWxkcyh0eXBlOiBEYlR5cGUsIHBhcmVudFBhdGgsIHBhcmVudERvY1BhdGg6IHN0cmluZykge1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZDogRGJGaWVsZCkgPT4ge1xuICAgICAgICAgICAgaWYgKGZpZWxkLmpvaW4gfHwgZmllbGQuZW51bURlZikge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGRvY05hbWUgPSBmaWVsZC5uYW1lID09PSAnaWQnID8gJ19rZXknIDogZmllbGQubmFtZTtcbiAgICAgICAgICAgIGNvbnN0IHBhdGggPSBgJHtwYXJlbnRQYXRofS4ke2ZpZWxkLm5hbWV9YDtcbiAgICAgICAgICAgIGxldCBkb2NQYXRoID0gYCR7cGFyZW50RG9jUGF0aH0uJHtkb2NOYW1lfWA7XG4gICAgICAgICAgICBpZiAoZmllbGQuYXJyYXlEZXB0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBsZXQgc3VmZml4ID0gJ1sqXSc7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgZGVwdGggPSAxMDsgZGVwdGggPiAwOyBkZXB0aCAtPSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHMgPSBgWyR7JyonLnJlcGVhdChkZXB0aCl9XWA7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkb2NQYXRoLmluY2x1ZGVzKHMpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWZmaXggPSBgWyR7JyonLnJlcGVhdChkZXB0aCArIDEpfV1gO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZG9jUGF0aCA9IGAke2RvY1BhdGh9JHtzdWZmaXh9YDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN3aXRjaChmaWVsZC50eXBlLmNhdGVnb3J5KSB7XG4gICAgICAgICAgICBjYXNlIFwic2NhbGFyXCI6XG4gICAgICAgICAgICAgICAgbGV0IHR5cGVOYW1lO1xuICAgICAgICAgICAgICAgIGlmIChmaWVsZC50eXBlID09PSBzY2FsYXJUeXBlcy5ib29sZWFuKSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lID0gJ2Jvb2xlYW4nO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMuZmxvYXQpIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWUgPSAnbnVtYmVyJztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLmludCkge1xuICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZSA9ICdudW1iZXInO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDY0KSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lID0gJ3VpbnQ2NCc7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC50eXBlID09PSBzY2FsYXJUeXBlcy51aW50MTAyNCkge1xuICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZSA9ICd1aW50MTAyNCc7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWUgPSAnc3RyaW5nJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAganMud3JpdGVMbihgc2NhbGFyRmllbGRzLnNldCgnJHtwYXRofScsIHsgdHlwZTogJyR7dHlwZU5hbWV9JywgcGF0aDogJyR7ZG9jUGF0aH0nIH0pO2ApO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcInN0cnVjdFwiOlxuICAgICAgICAgICAgY2FzZSBcInVuaW9uXCI6XG4gICAgICAgICAgICAgICAgZ2VuSlNTY2FsYXJGaWVsZHMoZmllbGQudHlwZSwgcGF0aCwgZG9jUGF0aCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuXG4gICAgZnVuY3Rpb24gZ2VuSlNUeXBlUmVzb2x2ZXJzRm9yVW5pb24odHlwZTogRGJUeXBlKSB7XG4gICAgICAgIGlmICh0eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS51bmlvbikge1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAke3R5cGUubmFtZX06ICR7dHlwZS5uYW1lfVJlc29sdmVyLGApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuZXJhdGUodHlwZXM6IERiVHlwZVtdKSB7XG5cbiAgICAgICAgLy8gR1xuXG4gICAgICAgIGcud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgXCJcIlwiXG4gICAgICAgIER1ZSB0byBHcmFwaFFMIGxpbWl0YXRpb25zIGJpZyBudW1iZXJzIGFyZSByZXR1cm5lZCBhcyBhIHN0cmluZy5cbiAgICAgICAgWW91IGNhbiBzcGVjaWZ5IGZvcm1hdCB1c2VkIHRvIHN0cmluZyByZXByZXNlbnRhdGlvbiBmb3IgYmlnIGludGVnZXJzLlxuICAgICAgICBcIlwiXCJcbiAgICAgICAgZW51bSBCaWdJbnRGb3JtYXQge1xuICAgICAgICAgICAgXCIgSGV4YWRlY2ltYWwgcmVwcmVzZW50YXRpb24gc3RhcnRlZCB3aXRoIDB4IChkZWZhdWx0KSBcIlxuICAgICAgICAgICAgSEVYXG4gICAgICAgICAgICBcIiBEZWNpbWFsIHJlcHJlc2VudGF0aW9uIFwiXG4gICAgICAgICAgICBERUNcbiAgICAgICAgfVxuICAgICAgICBgKTtcbiAgICAgICAgWydTdHJpbmcnLCAnQm9vbGVhbicsICdJbnQnLCAnRmxvYXQnXS5mb3JFYWNoKGdlbkdTY2FsYXJUeXBlc0ZpbHRlcik7XG4gICAgICAgIGdlbkdFbnVtVHlwZXMoKTtcbiAgICAgICAgdHlwZXMuZm9yRWFjaCh0eXBlID0+IGdlbkdUeXBlRGVjbGFyYXRpb24odHlwZSkpO1xuICAgICAgICBjb25zdCBnQXJyYXlGaWx0ZXJzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgICAgIHR5cGVzLmZvckVhY2godHlwZSA9PiBnZW5HRmlsdGVyKHR5cGUsIGdBcnJheUZpbHRlcnMpKTtcblxuICAgICAgICBjb25zdCBjb2xsZWN0aW9ucyA9IHR5cGVzLmZpbHRlcih0ID0+ICEhdC5jb2xsZWN0aW9uKTtcbiAgICAgICAgZ2VuR1F1ZXJpZXMoY29sbGVjdGlvbnMpO1xuICAgICAgICBnZW5HU3Vic2NyaXB0aW9ucyhjb2xsZWN0aW9ucyk7XG5cbiAgICAgICAgLy8gSlNcblxuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBjb25zdCB7XG4gICAgICAgICAgICBzY2FsYXIsXG4gICAgICAgICAgICBiaWdVSW50MSxcbiAgICAgICAgICAgIGJpZ1VJbnQyLFxuICAgICAgICAgICAgcmVzb2x2ZUJpZ1VJbnQsXG4gICAgICAgICAgICBzdHJ1Y3QsXG4gICAgICAgICAgICBhcnJheSxcbiAgICAgICAgICAgIGpvaW4sXG4gICAgICAgICAgICBqb2luQXJyYXksXG4gICAgICAgICAgICBlbnVtTmFtZSxcbiAgICAgICAgICAgIHN0cmluZ0NvbXBhbmlvbixcbiAgICAgICAgICAgIGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIsXG4gICAgICAgICAgICB1bml4TWlsbGlzZWNvbmRzVG9TdHJpbmcsXG4gICAgICAgICAgICB1bml4U2Vjb25kc1RvU3RyaW5nLFxuICAgICAgICB9ID0gcmVxdWlyZSgnLi9kYi10eXBlcy5qcycpO1xuICAgICAgICBgKTtcbiAgICAgICAgY29uc3QganNBcnJheUZpbHRlcnMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICAgICAgdHlwZXMuZm9yRWFjaCh0eXBlID0+IGdlbkpTRmlsdGVyKHR5cGUsIGpzQXJyYXlGaWx0ZXJzKSk7XG5cbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgZnVuY3Rpb24gY3JlYXRlUmVzb2x2ZXJzKGRiKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICBgKTtcbiAgICAgICAgdHlwZXMuZm9yRWFjaCgodHlwZSkgPT4ge1xuICAgICAgICAgICAgZ2VuSlNDdXN0b21SZXNvbHZlcnModHlwZSk7XG4gICAgICAgICAgICBnZW5KU1R5cGVSZXNvbHZlcnNGb3JVbmlvbih0eXBlKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGpzLndyaXRlTG4oJyAgICAgICAgUXVlcnk6IHsnKTtcbiAgICAgICAgY29sbGVjdGlvbnMuZm9yRWFjaCgodHlwZSkgPT4ge1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgJHt0eXBlLmNvbGxlY3Rpb24gfHwgJyd9OiBkYi4ke3R5cGUuY29sbGVjdGlvbiB8fCAnJ30ucXVlcnlSZXNvbHZlcigpLGApXG4gICAgICAgIH0pO1xuICAgICAgICBqcy53cml0ZUxuKCcgICAgICAgIH0sJyk7XG4gICAgICAgIGpzLndyaXRlTG4oJyAgICAgICAgU3Vic2NyaXB0aW9uOiB7Jyk7XG4gICAgICAgIGNvbGxlY3Rpb25zLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICR7dHlwZS5jb2xsZWN0aW9uIHx8ICcnfTogZGIuJHt0eXBlLmNvbGxlY3Rpb24gfHwgJyd9LnN1YnNjcmlwdGlvblJlc29sdmVyKCksYClcbiAgICAgICAgfSk7XG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgYCk7XG5cbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgY29uc3Qgc2NhbGFyRmllbGRzID0gbmV3IE1hcCgpO1xuICAgICAgICBgKTtcbiAgICAgICAgY29sbGVjdGlvbnMuZm9yRWFjaCgodHlwZSkgPT4ge1xuICAgICAgICAgICAgZ2VuSlNTY2FsYXJGaWVsZHModHlwZSwgdHlwZS5jb2xsZWN0aW9uIHx8ICcnLCAnZG9jJyk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0ge1xuICAgICAgICAgICAgc2NhbGFyRmllbGRzLFxuICAgICAgICAgICAgY3JlYXRlUmVzb2x2ZXJzLFxuICAgICAgICBgKTtcbiAgICAgICAgdHlwZXMuZm9yRWFjaCh0eXBlID0+IGpzLndyaXRlTG4oYCAgICAke3R5cGUubmFtZX0sYCkpO1xuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICB9O1xuICAgICAgICBgKTtcbiAgICB9XG5cbiAgICBnZW5lcmF0ZShkYlR5cGVzKTtcblxuICAgIGZvciAoY29uc3QgZTogSW50RW51bURlZiBvZiBlbnVtVHlwZXMudmFsdWVzKCkpIHtcbiAgICAgICAgY29uc29sZS5sb2coYGV4cG9ydCBjb25zdCBRJHtlLm5hbWV9ID0ge2ApO1xuICAgICAgICBjb25zb2xlLmxvZyhPYmplY3QuZW50cmllcyhlLnZhbHVlcykubWFwKChbbmFtZSwgdmFsdWVdKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gYCAgICAke25hbWV9OiAkeyh2YWx1ZTogYW55KX0sYDtcbiAgICAgICAgfSkuam9pbignXFxuJykpO1xuICAgICAgICBjb25zb2xlLmxvZyhgfTtcXG5gKTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBxbDogZy5nZW5lcmF0ZWQoKSxcbiAgICAgICAganM6IGpzLmdlbmVyYXRlZCgpLFxuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgbWFpbjtcbiJdfQ==