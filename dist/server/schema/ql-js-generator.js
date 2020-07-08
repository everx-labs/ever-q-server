"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _gen = require("./gen.js");

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NlcnZlci9zY2hlbWEvcWwtanMtZ2VuZXJhdG9yLmpzIl0sIm5hbWVzIjpbIm1haW4iLCJzY2hlbWFEZWYiLCJ0eXBlcyIsImRiVHlwZXMiLCJlbnVtVHlwZXMiLCJnIiwiV3JpdGVyIiwianMiLCJnZW5HRG9jIiwicHJlZml4IiwiZG9jIiwidHJpbSIsImxpbmVzIiwic3BsaXQiLCJsZW5ndGgiLCJpbmNsdWRlcyIsIndyaXRlTG4iLCJmb3JFYWNoIiwibGluZSIsInVuaW9uVmFyaWFudFR5cGUiLCJ0eXBlIiwidmFyaWFudCIsIm5hbWUiLCJnZW5HVHlwZURlY2xhcmF0aW9uc0ZvclVuaW9uVmFyaWFudHMiLCJmaWVsZHMiLCJ3cml0ZUJsb2NrTG4iLCJnZW5HRW51bVR5cGVzIiwiZW51bURlZiIsInZhbHVlcyIsIk9iamVjdCIsImtleXMiLCJnZW5HVHlwZURlY2xhcmF0aW9uIiwiY2F0ZWdvcnkiLCJEYlR5cGVDYXRlZ29yeSIsInVuaW9uIiwiZmllbGQiLCJ0eXBlRGVjbGFyYXRpb24iLCJyZXBlYXQiLCJhcnJheURlcHRoIiwicGFyYW1zIiwiam9pbiIsImZvcm1hdHRlciIsInByZXZlbnRUd2ljZSIsIm5hbWVzIiwid29yayIsImhhcyIsImFkZCIsImdlbkdGaWx0ZXJzRm9yQXJyYXlGaWVsZHMiLCJnTmFtZXMiLCJpdGVtVHlwZU5hbWUiLCJpIiwiZmlsdGVyTmFtZSIsIm9wIiwiZ2VuR0ZpbHRlcnNGb3JFbnVtTmFtZUZpZWxkcyIsImdlbkdTY2FsYXJUeXBlc0ZpbHRlciIsImdlbkdGaWx0ZXIiLCJnZW5HUXVlcmllcyIsImNvbGxlY3Rpb24iLCJnZW5HU3Vic2NyaXB0aW9ucyIsImdldFNjYWxhclJlc29sdmVyTmFtZSIsInNjYWxhclR5cGVzIiwidWludDY0IiwidWludDEwMjQiLCJnZW5KU0ZpbHRlcnNGb3JBcnJheUZpZWxkcyIsImpzTmFtZXMiLCJpdGVtUmVzb2x2ZXJOYW1lIiwic2NhbGFyIiwiZ2VuSlNTdHJ1Y3RGaWx0ZXIiLCJzdWZmaXgiLCJvbiIsInJlZk9uIiwiZ2VuSlNVbmlvblJlc29sdmVyIiwiZ2VuSlNGaWx0ZXIiLCJnZW5KU0N1c3RvbVJlc29sdmVycyIsImpvaW5GaWVsZHMiLCJmaWx0ZXIiLCJ4IiwiYmlnVUludEZpZWxkcyIsInN0cmluZ0Zvcm1hdHRlZEZpZWxkcyIsImVudW1GaWVsZHMiLCJjdXN0b21SZXNvbHZlclJlcXVpcmVkIiwib25GaWVsZCIsImZpbmQiLCJwcmVDb25kaXRpb24iLCJwcmVmaXhMZW5ndGgiLCJnZW5KU1NjYWxhckZpZWxkcyIsInBhcmVudFBhdGgiLCJwYXJlbnREb2NQYXRoIiwiZG9jTmFtZSIsInBhdGgiLCJkb2NQYXRoIiwiZGVwdGgiLCJzIiwidHlwZU5hbWUiLCJib29sZWFuIiwiZmxvYXQiLCJpbnQiLCJnZW5KU1R5cGVSZXNvbHZlcnNGb3JVbmlvbiIsImdlbmVyYXRlIiwiZ0FycmF5RmlsdGVycyIsIlNldCIsImNvbGxlY3Rpb25zIiwidCIsImpzQXJyYXlGaWx0ZXJzIiwiZSIsImNvbnNvbGUiLCJsb2ciLCJlbnRyaWVzIiwibWFwIiwidmFsdWUiLCJxbCIsImdlbmVyYXRlZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUVBOztBQUdBOztBQVFBLFNBQVNBLElBQVQsQ0FBY0MsU0FBZCxFQUFrQztBQUM5QixRQUFNO0FBQUVDLElBQUFBLEtBQUssRUFBRUMsT0FBVDtBQUFrQkMsSUFBQUE7QUFBbEIsTUFBK0Isa0NBQWNILFNBQWQsQ0FBckMsQ0FEOEIsQ0FHbEM7O0FBRUksUUFBTUksQ0FBQyxHQUFHLElBQUlDLFdBQUosRUFBVjtBQUNBLFFBQU1DLEVBQUUsR0FBRyxJQUFJRCxXQUFKLEVBQVg7O0FBRUEsV0FBU0UsT0FBVCxDQUFpQkMsTUFBakIsRUFBaUNDLEdBQWpDLEVBQThDO0FBQzFDLFFBQUlBLEdBQUcsQ0FBQ0MsSUFBSixPQUFlLEVBQW5CLEVBQXVCO0FBQ25CO0FBQ0g7O0FBQ0QsVUFBTUMsS0FBSyxHQUFHRixHQUFHLENBQUNHLEtBQUosQ0FB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LEtBRkQ7QUFJQWxELElBQUFBLEVBQUUsQ0FBQ2tCLFlBQUgsQ0FBaUI7Ozs7U0FBakI7QUFLQXZCLElBQUFBLEtBQUssQ0FBQ2UsT0FBTixDQUFjRyxJQUFJLElBQUliLEVBQUUsQ0FBQ1MsT0FBSCxDQUFZLE9BQU1JLElBQUksQ0FBQ0UsSUFBSyxHQUE1QixDQUF0QjtBQUNBZixJQUFBQSxFQUFFLENBQUNrQixZQUFILENBQWlCOztTQUFqQjtBQUdIOztBQUVEeUUsRUFBQUEsUUFBUSxDQUFDL0YsT0FBRCxDQUFSOztBQUVBLE9BQUssTUFBTXFHLENBQVgsSUFBNEJwRyxTQUFTLENBQUN3QixNQUFWLEVBQTVCLEVBQWdEO0FBQzVDNkUsSUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQWEsaUJBQWdCRixDQUFDLENBQUNsRixJQUFLLE1BQXBDO0FBQ0FtRixJQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWTdFLE1BQU0sQ0FBQzhFLE9BQVAsQ0FBZUgsQ0FBQyxDQUFDNUUsTUFBakIsRUFBeUJnRixHQUF6QixDQUE2QixDQUFDLENBQUN0RixJQUFELEVBQU91RixLQUFQLENBQUQsS0FBbUI7QUFDeEQsYUFBUSxPQUFNdkYsSUFBSyxLQUFLdUYsS0FBWSxHQUFwQztBQUNILEtBRlcsRUFFVHJFLElBRlMsQ0FFSixJQUZJLENBQVo7QUFHQWlFLElBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFhLE1BQWI7QUFDSDs7QUFFRCxTQUFPO0FBQ0hJLElBQUFBLEVBQUUsRUFBRXpHLENBQUMsQ0FBQzBHLFNBQUYsRUFERDtBQUVIeEcsSUFBQUEsRUFBRSxFQUFFQSxFQUFFLENBQUN3RyxTQUFIO0FBRkQsR0FBUDtBQUlIOztlQUVjL0csSSIsInNvdXJjZXNDb250ZW50IjpbIi8vQGZsb3dcblxuaW1wb3J0IHtXcml0ZXJ9IGZyb20gJy4vZ2VuLmpzJztcbmltcG9ydCB0eXBlIHtUeXBlRGVmfSBmcm9tICcuL3NjaGVtYS5qcyc7XG5pbXBvcnQgdHlwZSB7RGJGaWVsZCwgRGJUeXBlLCBJbnRFbnVtRGVmfSBmcm9tICcuL2RiLXNjaGVtYS10eXBlcyc7XG5pbXBvcnQge1xuICAgIERiVHlwZUNhdGVnb3J5LFxuICAgIGlzQmlnSW50LCBwYXJzZURiU2NoZW1hLFxuICAgIHNjYWxhclR5cGVzLFxuICAgIHN0cmluZ2lmeUVudW1WYWx1ZXMsXG4gICAgdG9FbnVtU3R5bGUsXG59IGZyb20gJy4vZGItc2NoZW1hLXR5cGVzJztcblxuZnVuY3Rpb24gbWFpbihzY2hlbWFEZWY6IFR5cGVEZWYpIHtcbiAgICBjb25zdCB7IHR5cGVzOiBkYlR5cGVzLCBlbnVtVHlwZXN9ID0gcGFyc2VEYlNjaGVtYShzY2hlbWFEZWYpO1xuXG4vLyBHZW5lcmF0b3JzXG5cbiAgICBjb25zdCBnID0gbmV3IFdyaXRlcigpO1xuICAgIGNvbnN0IGpzID0gbmV3IFdyaXRlcigpO1xuXG4gICAgZnVuY3Rpb24gZ2VuR0RvYyhwcmVmaXg6IHN0cmluZywgZG9jOiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKGRvYy50cmltKCkgPT09ICcnKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbGluZXMgPSBkb2Muc3BsaXQoL1xcblxccj98XFxyXFxuPy8pO1xuICAgICAgICBpZiAobGluZXMubGVuZ3RoID09PSAxICYmICFsaW5lc1swXS5pbmNsdWRlcygnXCInKSkge1xuICAgICAgICAgICAgZy53cml0ZUxuKHByZWZpeCwgJ1wiJywgbGluZXNbMF0sICdcIicpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZy53cml0ZUxuKHByZWZpeCwgJ1wiXCJcIicpO1xuICAgICAgICAgICAgbGluZXMuZm9yRWFjaCgobGluZSkgPT4ge1xuICAgICAgICAgICAgICAgIGcud3JpdGVMbihwcmVmaXgsIGxpbmUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBnLndyaXRlTG4ocHJlZml4LCAnXCJcIlwiJyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiB1bmlvblZhcmlhbnRUeXBlKHR5cGU6IERiVHlwZSwgdmFyaWFudDogRGJGaWVsZCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiBgJHt0eXBlLm5hbWV9JHt2YXJpYW50Lm5hbWV9VmFyaWFudGA7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuR1R5cGVEZWNsYXJhdGlvbnNGb3JVbmlvblZhcmlhbnRzKHR5cGU6IERiVHlwZSkge1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKCh2YXJpYW50KSA9PiB7XG4gICAgICAgICAgICBnLndyaXRlQmxvY2tMbihgXG4gICAgICAgIHR5cGUgJHt1bmlvblZhcmlhbnRUeXBlKHR5cGUsIHZhcmlhbnQpfSB7XG4gICAgICAgICAgICAke3ZhcmlhbnQubmFtZX06ICR7dmFyaWFudC50eXBlLm5hbWV9XG4gICAgICAgIH1cblxuICAgICAgICBgKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuR0VudW1UeXBlcygpIHtcbiAgICAgICAgZm9yIChjb25zdCBlbnVtRGVmOiBJbnRFbnVtRGVmIG9mIGVudW1UeXBlcy52YWx1ZXMoKSkge1xuICAgICAgICAgICAgZy53cml0ZUxuKGBlbnVtICR7ZW51bURlZi5uYW1lfUVudW0ge2ApO1xuICAgICAgICAgICAgT2JqZWN0LmtleXMoZW51bURlZi52YWx1ZXMpLmZvckVhY2goKG5hbWUpID0+IHtcbiAgICAgICAgICAgICAgICBnLndyaXRlTG4oYCAgICAke3RvRW51bVN0eWxlKG5hbWUpfWApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBnLndyaXRlTG4oYH1gKTtcbiAgICAgICAgICAgIGcud3JpdGVMbigpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuR1R5cGVEZWNsYXJhdGlvbih0eXBlOiBEYlR5cGUpIHtcbiAgICAgICAgaWYgKHR5cGUuY2F0ZWdvcnkgPT09IERiVHlwZUNhdGVnb3J5LnVuaW9uKSB7XG4gICAgICAgICAgICBnZW5HVHlwZURlY2xhcmF0aW9uc0ZvclVuaW9uVmFyaWFudHModHlwZSk7XG4gICAgICAgICAgICBnLndyaXRlTG4oYHVuaW9uICR7dHlwZS5uYW1lfSA9IGApO1xuICAgICAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCh2YXJpYW50ID0+IHtcbiAgICAgICAgICAgICAgICBnLndyaXRlTG4oYFxcdHwgJHt1bmlvblZhcmlhbnRUeXBlKHR5cGUsIHZhcmlhbnQpfWApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBnLndyaXRlTG4oKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGdlbkdEb2MoJycsIHR5cGUuZG9jKTtcbiAgICAgICAgICAgIGcud3JpdGVMbihgdHlwZSAke3R5cGUubmFtZX0ge2ApO1xuICAgICAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaChmaWVsZCA9PiB7XG4gICAgICAgICAgICAgICAgZ2VuR0RvYygnXFx0JywgZmllbGQuZG9jKTtcbiAgICAgICAgICAgICAgICBjb25zdCB0eXBlRGVjbGFyYXRpb24gPVxuICAgICAgICAgICAgICAgICAgICAnWycucmVwZWF0KGZpZWxkLmFycmF5RGVwdGgpICtcbiAgICAgICAgICAgICAgICAgICAgZmllbGQudHlwZS5uYW1lICtcbiAgICAgICAgICAgICAgICAgICAgJ10nLnJlcGVhdChmaWVsZC5hcnJheURlcHRoKTtcbiAgICAgICAgICAgICAgICBsZXQgcGFyYW1zID0gJyc7XG4gICAgICAgICAgICAgICAgaWYgKGlzQmlnSW50KGZpZWxkLnR5cGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhcmFtcyA9ICcoZm9ybWF0OiBCaWdJbnRGb3JtYXQpJztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLmpvaW4pIHtcbiAgICAgICAgICAgICAgICAgICAgcGFyYW1zID0gYCh0aW1lb3V0OiBJbnQsIHdoZW46ICR7dHlwZS5uYW1lfUZpbHRlcilgO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGcud3JpdGVMbihgXFx0JHtmaWVsZC5uYW1lfSR7cGFyYW1zfTogJHt0eXBlRGVjbGFyYXRpb259YCk7XG4gICAgICAgICAgICAgICAgY29uc3QgZW51bURlZiA9IGZpZWxkLmVudW1EZWY7XG4gICAgICAgICAgICAgICAgaWYgKGVudW1EZWYpIHtcbiAgICAgICAgICAgICAgICAgICAgZy53cml0ZUxuKGBcXHQke2ZpZWxkLm5hbWV9X25hbWU6ICR7ZW51bURlZi5uYW1lfUVudW1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGZpZWxkLmZvcm1hdHRlcikge1xuICAgICAgICAgICAgICAgICAgICBnLndyaXRlTG4oYFxcdCR7ZmllbGQubmFtZX1fc3RyaW5nOiBTdHJpbmdgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGcud3JpdGVMbihgfWApO1xuICAgICAgICB9XG4gICAgICAgIGcud3JpdGVMbigpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHByZXZlbnRUd2ljZShuYW1lOiBzdHJpbmcsIG5hbWVzOiBTZXQ8c3RyaW5nPiwgd29yazogKCkgPT4gdm9pZCkge1xuICAgICAgICBpZiAoIW5hbWVzLmhhcyhuYW1lKSkge1xuICAgICAgICAgICAgbmFtZXMuYWRkKG5hbWUpO1xuICAgICAgICAgICAgd29yaygpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuR0ZpbHRlcnNGb3JBcnJheUZpZWxkcyh0eXBlOiBEYlR5cGUsIGdOYW1lczogU2V0PHN0cmluZz4pIHtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGxldCBpdGVtVHlwZU5hbWUgPSBmaWVsZC50eXBlLm5hbWU7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZpZWxkLmFycmF5RGVwdGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpbHRlck5hbWUgPSBgJHtpdGVtVHlwZU5hbWV9QXJyYXlGaWx0ZXJgO1xuICAgICAgICAgICAgICAgIHByZXZlbnRUd2ljZShmaWx0ZXJOYW1lLCBnTmFtZXMsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgZy53cml0ZUxuKGBpbnB1dCAke2ZpbHRlck5hbWV9IHtgKTtcbiAgICAgICAgICAgICAgICAgICAgWydhbnknLCAnYWxsJ10uZm9yRWFjaCgob3ApID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGcud3JpdGVMbihgXFx0JHtvcH06ICR7aXRlbVR5cGVOYW1lfUZpbHRlcmApO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgZy53cml0ZUxuKCd9Jyk7XG4gICAgICAgICAgICAgICAgICAgIGcud3JpdGVMbigpO1xuXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaXRlbVR5cGVOYW1lICs9ICdBcnJheSc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkdGaWx0ZXJzRm9yRW51bU5hbWVGaWVsZHModHlwZTogRGJUeXBlLCBnTmFtZXM6IFNldDxzdHJpbmc+KSB7XG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBlbnVtRGVmID0gZmllbGQuZW51bURlZjtcbiAgICAgICAgICAgIGlmIChlbnVtRGVmKSB7XG4gICAgICAgICAgICAgICAgcHJldmVudFR3aWNlKGAke2VudW1EZWYubmFtZX1FbnVtRmlsdGVyYCwgZ05hbWVzLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGdlbkdTY2FsYXJUeXBlc0ZpbHRlcihgJHtlbnVtRGVmLm5hbWV9RW51bWApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5HRmlsdGVyKHR5cGU6IERiVHlwZSwgZ05hbWVzOiBTZXQ8c3RyaW5nPikge1xuICAgICAgICBpZiAodHlwZS5maWVsZHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgZ2VuR0ZpbHRlcnNGb3JBcnJheUZpZWxkcyh0eXBlLCBnTmFtZXMpO1xuICAgICAgICBnZW5HRmlsdGVyc0ZvckVudW1OYW1lRmllbGRzKHR5cGUsIGdOYW1lcyk7XG4gICAgICAgIGdlbkdEb2MoJycsIHR5cGUuZG9jKTtcbiAgICAgICAgZy53cml0ZUxuKGBpbnB1dCAke3R5cGUubmFtZX1GaWx0ZXIge2ApO1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgZ2VuR0RvYygnXFx0JywgZmllbGQuZG9jKTtcbiAgICAgICAgICAgIGNvbnN0IHR5cGVEZWNsYXJhdGlvbiA9IGZpZWxkLnR5cGUubmFtZSArIFwiQXJyYXlcIi5yZXBlYXQoZmllbGQuYXJyYXlEZXB0aCk7XG4gICAgICAgICAgICBnLndyaXRlTG4oYFxcdCR7ZmllbGQubmFtZX06ICR7dHlwZURlY2xhcmF0aW9ufUZpbHRlcmApO1xuICAgICAgICAgICAgY29uc3QgZW51bURlZiA9IGZpZWxkLmVudW1EZWY7XG4gICAgICAgICAgICBpZiAoZW51bURlZikge1xuICAgICAgICAgICAgICAgIGcud3JpdGVMbihgXFx0JHtmaWVsZC5uYW1lfV9uYW1lOiAke2VudW1EZWYubmFtZX1FbnVtRmlsdGVyYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBnLndyaXRlTG4oYCAgICBPUjogJHt0eXBlLm5hbWV9RmlsdGVyYCk7XG4gICAgICAgIGcud3JpdGVMbihgfWApO1xuICAgICAgICBnLndyaXRlTG4oKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5HU2NhbGFyVHlwZXNGaWx0ZXIobmFtZTogc3RyaW5nKSB7XG4gICAgICAgIGcud3JpdGVMbihgaW5wdXQgJHtuYW1lfUZpbHRlciB7YCk7XG4gICAgICAgIFsnZXEnLCAnbmUnLCAnZ3QnLCAnbHQnLCAnZ2UnLCAnbGUnXS5mb3JFYWNoKChvcCkgPT4ge1xuICAgICAgICAgICAgZy53cml0ZUxuKGBcXHQke29wfTogJHtuYW1lfWApO1xuICAgICAgICB9KTtcbiAgICAgICAgWydpbicsICdub3RJbiddLmZvckVhY2goKG9wKSA9PiB7XG4gICAgICAgICAgICBnLndyaXRlTG4oYFxcdCR7b3B9OiBbJHtuYW1lfV1gKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGcud3JpdGVMbignfScpO1xuICAgICAgICBnLndyaXRlTG4oKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5HUXVlcmllcyh0eXBlczogRGJUeXBlW10pIHtcbiAgICAgICAgZy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBcIlNwZWNpZnkgc29ydCBvcmRlciBkaXJlY3Rpb25cIlxuICAgICAgICBlbnVtIFF1ZXJ5T3JkZXJCeURpcmVjdGlvbiB7XG4gICAgICAgICAgICBcIkRvY3VtZW50cyB3aWxsIGJlIHNvcnRlZCBpbiBhc2NlbmRlZCBvcmRlciAoZS5nLiBmcm9tIEEgdG8gWilcIlxuICAgICAgICAgICAgQVNDXG4gICAgICAgICAgICBcIkRvY3VtZW50cyB3aWxsIGJlIHNvcnRlZCBpbiBkZXNjZW5kYW50IG9yZGVyIChlLmcuIGZyb20gWiB0byBBKVwiXG4gICAgICAgICAgICBERVNDXG4gICAgICAgIH1cblxuICAgICAgICBcbiAgICAgICAgXCJcIlwiXG4gICAgICAgIFNwZWNpZnkgaG93IHRvIHNvcnQgcmVzdWx0cy5cbiAgICAgICAgWW91IGNhbiBzb3J0IGRvY3VtZW50cyBpbiByZXN1bHQgc2V0IHVzaW5nIG1vcmUgdGhhbiBvbmUgZmllbGQuXG4gICAgICAgIFwiXCJcIlxuICAgICAgICBpbnB1dCBRdWVyeU9yZGVyQnkge1xuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgICBQYXRoIHRvIGZpZWxkIHdoaWNoIG11c3QgYmUgdXNlZCBhcyBhIHNvcnQgY3JpdGVyaWEuXG4gICAgICAgICAgICBJZiBmaWVsZCByZXNpZGVzIGRlZXAgaW4gc3RydWN0dXJlIHBhdGggaXRlbXMgbXVzdCBiZSBzZXBhcmF0ZWQgd2l0aCBkb3QgKGUuZy4gJ2Zvby5iYXIuYmF6JykuXG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICAgIHBhdGg6IFN0cmluZ1xuICAgICAgICAgICAgXCJTb3J0IG9yZGVyIGRpcmVjdGlvblwiXG4gICAgICAgICAgICBkaXJlY3Rpb246IFF1ZXJ5T3JkZXJCeURpcmVjdGlvblxuICAgICAgICB9XG5cbiAgICAgICAgdHlwZSBRdWVyeSB7XG4gICAgICAgIGApO1xuXG4gICAgICAgIHR5cGVzLmZvckVhY2goKHR5cGU6IERiVHlwZSkgPT4ge1xuICAgICAgICAgICAgZy53cml0ZUxuKGBcXHQke3R5cGUuY29sbGVjdGlvbiB8fCAnJ30oZmlsdGVyOiAke3R5cGUubmFtZX1GaWx0ZXIsIG9yZGVyQnk6IFtRdWVyeU9yZGVyQnldLCBsaW1pdDogSW50LCB0aW1lb3V0OiBGbG9hdCwgYWNjZXNzS2V5OiBTdHJpbmcsIG9wZXJhdGlvbklkOiBTdHJpbmcpOiBbJHt0eXBlLm5hbWV9XWApO1xuICAgICAgICB9KTtcblxuICAgICAgICBnLndyaXRlQmxvY2tMbihgXG4gICAgICAgIH1cblxuICAgICAgICBgKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5HU3Vic2NyaXB0aW9ucyh0eXBlczogRGJUeXBlW10pIHtcbiAgICAgICAgZy53cml0ZUxuKCd0eXBlIFN1YnNjcmlwdGlvbiB7Jyk7XG4gICAgICAgIHR5cGVzLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICAgICAgICAgIGcud3JpdGVMbihgXFx0JHt0eXBlLmNvbGxlY3Rpb24gfHwgJyd9KGZpbHRlcjogJHt0eXBlLm5hbWV9RmlsdGVyLCBhY2Nlc3NLZXk6IFN0cmluZyk6ICR7dHlwZS5uYW1lfWApO1xuICAgICAgICB9KTtcbiAgICAgICAgZy53cml0ZUxuKCd9Jyk7XG4gICAgfVxuXG5cbiAgICBmdW5jdGlvbiBnZXRTY2FsYXJSZXNvbHZlck5hbWUoZmllbGQ6IERiRmllbGQpOiBzdHJpbmcge1xuICAgICAgICBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDY0KSB7XG4gICAgICAgICAgICByZXR1cm4gJ2JpZ1VJbnQxJztcbiAgICAgICAgfVxuICAgICAgICBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDEwMjQpIHtcbiAgICAgICAgICAgIHJldHVybiAnYmlnVUludDInO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnc2NhbGFyJztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5KU0ZpbHRlcnNGb3JBcnJheUZpZWxkcyh0eXBlOiBEYlR5cGUsIGpzTmFtZXM6IFNldDxzdHJpbmc+KSB7XG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBsZXQgaXRlbVR5cGVOYW1lID0gZmllbGQudHlwZS5uYW1lO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmaWVsZC5hcnJheURlcHRoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWx0ZXJOYW1lID0gYCR7aXRlbVR5cGVOYW1lfUFycmF5YDtcbiAgICAgICAgICAgICAgICBwcmV2ZW50VHdpY2UoZmlsdGVyTmFtZSwganNOYW1lcywgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpdGVtUmVzb2x2ZXJOYW1lID0gKGkgPT09IDAgJiYgZmllbGQudHlwZS5jYXRlZ29yeSA9PT0gRGJUeXBlQ2F0ZWdvcnkuc2NhbGFyKVxuICAgICAgICAgICAgICAgICAgICAgICAgPyBnZXRTY2FsYXJSZXNvbHZlck5hbWUoZmllbGQpXG4gICAgICAgICAgICAgICAgICAgICAgICA6IGl0ZW1UeXBlTmFtZTtcbiAgICAgICAgICAgICAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgICAgICAgICBjb25zdCAke2ZpbHRlck5hbWV9ID0gYXJyYXkoKCkgPT4gJHtpdGVtUmVzb2x2ZXJOYW1lfSk7XG4gICAgICAgICAgICAgICAgYCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaXRlbVR5cGVOYW1lICs9ICdBcnJheSc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkpTU3RydWN0RmlsdGVyKHR5cGU6IERiVHlwZSkge1xuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBjb25zdCAke3R5cGUubmFtZX0gPSBzdHJ1Y3Qoe1xuICAgIGApO1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZDogRGJGaWVsZCkgPT4ge1xuICAgICAgICAgICAgbGV0IHR5cGVEZWNsYXJhdGlvbjogP3N0cmluZyA9IG51bGw7XG4gICAgICAgICAgICBjb25zdCBqb2luID0gZmllbGQuam9pbjtcbiAgICAgICAgICAgIGlmIChqb2luKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3VmZml4ID0gZmllbGQuYXJyYXlEZXB0aCA+IDAgPyAnQXJyYXknIDogJyc7XG4gICAgICAgICAgICAgICAgdHlwZURlY2xhcmF0aW9uID0gYGpvaW4ke3N1ZmZpeH0oJyR7am9pbi5vbn0nLCAnJHtqb2luLnJlZk9ufScsICcke2ZpZWxkLnR5cGUuY29sbGVjdGlvbiB8fCAnJ30nLCAoKSA9PiAke2ZpZWxkLnR5cGUubmFtZX0pYDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQuYXJyYXlEZXB0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB0eXBlRGVjbGFyYXRpb24gPVxuICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlLm5hbWUgK1xuICAgICAgICAgICAgICAgICAgICAnQXJyYXknLnJlcGVhdChmaWVsZC5hcnJheURlcHRoKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZS5jYXRlZ29yeSA9PT0gRGJUeXBlQ2F0ZWdvcnkuc2NhbGFyKSB7XG4gICAgICAgICAgICAgICAgdHlwZURlY2xhcmF0aW9uID0gZ2V0U2NhbGFyUmVzb2x2ZXJOYW1lKGZpZWxkKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZS5maWVsZHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHR5cGVEZWNsYXJhdGlvbiA9IGZpZWxkLnR5cGUubmFtZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0eXBlRGVjbGFyYXRpb24pIHtcbiAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgJHtmaWVsZC5uYW1lfTogJHt0eXBlRGVjbGFyYXRpb259LGApO1xuICAgICAgICAgICAgICAgIGNvbnN0IGVudW1EZWYgPSBmaWVsZC5lbnVtRGVmO1xuICAgICAgICAgICAgICAgIGlmIChlbnVtRGVmKSB7XG4gICAgICAgICAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAke2ZpZWxkLm5hbWV9X25hbWU6IGVudW1OYW1lKCcke2ZpZWxkLm5hbWV9JywgJHtzdHJpbmdpZnlFbnVtVmFsdWVzKGVudW1EZWYudmFsdWVzKX0pLGApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZmllbGQuZm9ybWF0dGVyKSB7XG4gICAgICAgICAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAke2ZpZWxkLm5hbWV9X3N0cmluZzogc3RyaW5nQ29tcGFuaW9uKCcke2ZpZWxkLm5hbWV9JyksYCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgfSR7dHlwZS5jb2xsZWN0aW9uID8gJywgdHJ1ZScgOiAnJ30pO1xuXG4gICAgYCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuSlNVbmlvblJlc29sdmVyKHR5cGU6IERiVHlwZSkge1xuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBjb25zdCAke3R5cGUubmFtZX1SZXNvbHZlciA9IHtcbiAgICAgICAgICAgIF9fcmVzb2x2ZVR5cGUob2JqLCBjb250ZXh0LCBpbmZvKSB7XG4gICAgICAgIGApO1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKCh2YXJpYW50KSA9PiB7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgIGlmICgnJHt2YXJpYW50Lm5hbWV9JyBpbiBvYmopIHtgKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgIHJldHVybiAnJHt1bmlvblZhcmlhbnRUeXBlKHR5cGUsIHZhcmlhbnQpfSc7YCk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgIH1gKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgYCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuSlNGaWx0ZXIodHlwZTogRGJUeXBlLCBqc05hbWVzOiBTZXQ8c3RyaW5nPikge1xuICAgICAgICBpZiAodHlwZS5maWVsZHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGUuY2F0ZWdvcnkgPT09IERiVHlwZUNhdGVnb3J5LnVuaW9uKSB7XG4gICAgICAgICAgICAvLyBnZW5KU0ZpbHRlcnNGb3JVbmlvblZhcmlhbnRzKHR5cGUsIGpzTmFtZXMpO1xuICAgICAgICB9XG4gICAgICAgIGdlbkpTRmlsdGVyc0ZvckFycmF5RmllbGRzKHR5cGUsIGpzTmFtZXMpO1xuICAgICAgICBnZW5KU1N0cnVjdEZpbHRlcih0eXBlKTtcbiAgICAgICAgaWYgKHR5cGUuY2F0ZWdvcnkgPT09IERiVHlwZUNhdGVnb3J5LnVuaW9uKSB7XG4gICAgICAgICAgICBnZW5KU1VuaW9uUmVzb2x2ZXIodHlwZSk7XG4gICAgICAgIH1cblxuXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2VuZXJhdGUgY3VzdG9tIHJlc29sdmVycyBmb3IgdHlwZXMgd2l0aDpcbiAgICAgKiAtIGlkIGZpZWxkXG4gICAgICogLSBqb2luIGZpZWxkc1xuICAgICAqIC0gdTY0IGFuZCBoaWdoZXIgZmllbGRzXG4gICAgICogQHBhcmFtIHR5cGVcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBnZW5KU0N1c3RvbVJlc29sdmVycyh0eXBlOiBEYlR5cGUpIHtcbiAgICAgICAgY29uc3Qgam9pbkZpZWxkcyA9IHR5cGUuZmllbGRzLmZpbHRlcih4ID0+ICEheC5qb2luKTtcbiAgICAgICAgY29uc3QgYmlnVUludEZpZWxkcyA9IHR5cGUuZmllbGRzLmZpbHRlcigoeDogRGJGaWVsZCkgPT4gaXNCaWdJbnQoeC50eXBlKSk7XG4gICAgICAgIGNvbnN0IHN0cmluZ0Zvcm1hdHRlZEZpZWxkcyA9IHR5cGUuZmllbGRzLmZpbHRlcigoeDogRGJGaWVsZCkgPT4geC5mb3JtYXR0ZXIpO1xuICAgICAgICBjb25zdCBlbnVtRmllbGRzID0gdHlwZS5maWVsZHMuZmlsdGVyKHggPT4geC5lbnVtRGVmKTtcbiAgICAgICAgY29uc3QgY3VzdG9tUmVzb2x2ZXJSZXF1aXJlZCA9IHR5cGUuY29sbGVjdGlvblxuICAgICAgICAgICAgfHwgam9pbkZpZWxkcy5sZW5ndGggPiAwXG4gICAgICAgICAgICB8fCBiaWdVSW50RmllbGRzLmxlbmd0aCA+IDBcbiAgICAgICAgICAgIHx8IGVudW1GaWVsZHMubGVuZ3RoID4gMDtcbiAgICAgICAgaWYgKCFjdXN0b21SZXNvbHZlclJlcXVpcmVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAganMud3JpdGVMbihgICAgICAgICAke3R5cGUubmFtZX06IHtgKTtcbiAgICAgICAgaWYgKHR5cGUuY29sbGVjdGlvbikge1xuICAgICAgICAgICAganMud3JpdGVMbignICAgICAgICAgICAgaWQocGFyZW50KSB7Jyk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKCcgICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5OycpO1xuICAgICAgICAgICAganMud3JpdGVMbignICAgICAgICAgICAgfSwnKTtcbiAgICAgICAgfVxuICAgICAgICBqb2luRmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBqb2luID0gZmllbGQuam9pbjtcbiAgICAgICAgICAgIGlmICgham9pbikge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IG9uRmllbGQgPSB0eXBlLmZpZWxkcy5maW5kKHggPT4geC5uYW1lID09PSBqb2luLm9uKTtcbiAgICAgICAgICAgIGlmICghb25GaWVsZCkge1xuICAgICAgICAgICAgICAgIHRocm93ICdKb2luIG9uIGZpZWxkIGRvZXMgbm90IGV4aXN0Lic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBvbiA9IGpvaW4ub24gPT09ICdpZCcgPyAnX2tleScgOiAoam9pbi5vbiB8fCAnX2tleScpO1xuICAgICAgICAgICAgY29uc3QgcmVmT24gPSBqb2luLnJlZk9uID09PSAnaWQnID8gJ19rZXknIDogKGpvaW4ucmVmT24gfHwgJ19rZXknKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbGxlY3Rpb24gPSBmaWVsZC50eXBlLmNvbGxlY3Rpb247XG4gICAgICAgICAgICBpZiAoIWNvbGxlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICB0aHJvdyAnSm9pbmVkIHR5cGUgaXMgbm90IGEgY29sbGVjdGlvbi4nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgJHtmaWVsZC5uYW1lfShwYXJlbnQsIGFyZ3MsIGNvbnRleHQpIHtgKTtcbiAgICAgICAgICAgIGlmIChqb2luLnByZUNvbmRpdGlvbikge1xuICAgICAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICAgICBpZiAoISgke2pvaW4ucHJlQ29uZGl0aW9ufSkpIHtgKTtcbiAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO2ApO1xuICAgICAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICAgICB9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAgICAgaWYgKGFyZ3Mud2hlbiAmJiAhJHt0eXBlLm5hbWV9LnRlc3QobnVsbCwgcGFyZW50LCBhcmdzLndoZW4pKSB7YCk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO2ApO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgICAgIH1gKTtcblxuICAgICAgICAgICAgaWYgKGZpZWxkLmFycmF5RGVwdGggPT09IDApIHtcbiAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQuZGIuJHtjb2xsZWN0aW9ufS53YWl0Rm9yRG9jKHBhcmVudC4ke29ufSwgJyR7cmVmT259JywgYXJncyk7YCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLmFycmF5RGVwdGggPT09IDEpIHtcbiAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQuZGIuJHtjb2xsZWN0aW9ufS53YWl0Rm9yRG9jcyhwYXJlbnQuJHtvbn0sICcke3JlZk9ufScsIGFyZ3MpO2ApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyAnSm9pbnMgb24gYSBuZXN0ZWQgYXJyYXlzIGRvZXMgbm90IHN1cHBvcnRlZC4nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgfSxgKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGJpZ1VJbnRGaWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHByZWZpeExlbmd0aCA9IGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLnVpbnQ2NCA/IDEgOiAyO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgJHtmaWVsZC5uYW1lfShwYXJlbnQsIGFyZ3MpIHtgKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoJHtwcmVmaXhMZW5ndGh9LCBwYXJlbnQuJHtmaWVsZC5uYW1lfSwgYXJncyk7YCk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICB9LGApO1xuICAgICAgICB9KTtcbiAgICAgICAgc3RyaW5nRm9ybWF0dGVkRmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAke2ZpZWxkLm5hbWV9X3N0cmluZyhwYXJlbnQsIGFyZ3MpIHtgKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICAgICByZXR1cm4gJHtmaWVsZC5mb3JtYXR0ZXIgfHwgJyd9KHBhcmVudC4ke2ZpZWxkLm5hbWV9KTtgKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgIH0sYCk7XG4gICAgICAgIH0pO1xuICAgICAgICBlbnVtRmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBlbnVtRGVmID0gZmllbGQuZW51bURlZjtcbiAgICAgICAgICAgIGlmIChlbnVtRGVmKSB7XG4gICAgICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgJHtmaWVsZC5uYW1lfV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCcke2ZpZWxkLm5hbWV9JywgJHtzdHJpbmdpZnlFbnVtVmFsdWVzKGVudW1EZWYudmFsdWVzKX0pLGApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAganMud3JpdGVMbihgICAgICAgICB9LGApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkpTU2NhbGFyRmllbGRzKHR5cGU6IERiVHlwZSwgcGFyZW50UGF0aCwgcGFyZW50RG9jUGF0aDogc3RyaW5nKSB7XG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKGZpZWxkOiBEYkZpZWxkKSA9PiB7XG4gICAgICAgICAgICBpZiAoZmllbGQuam9pbiB8fCBmaWVsZC5lbnVtRGVmKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgZG9jTmFtZSA9IGZpZWxkLm5hbWUgPT09ICdpZCcgPyAnX2tleScgOiBmaWVsZC5uYW1lO1xuICAgICAgICAgICAgY29uc3QgcGF0aCA9IGAke3BhcmVudFBhdGh9LiR7ZmllbGQubmFtZX1gO1xuICAgICAgICAgICAgbGV0IGRvY1BhdGggPSBgJHtwYXJlbnREb2NQYXRofS4ke2RvY05hbWV9YDtcbiAgICAgICAgICAgIGlmIChmaWVsZC5hcnJheURlcHRoID4gMCkge1xuICAgICAgICAgICAgICAgIGxldCBzdWZmaXggPSAnWypdJztcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBkZXB0aCA9IDEwOyBkZXB0aCA+IDA7IGRlcHRoIC09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcyA9IGBbJHsnKicucmVwZWF0KGRlcHRoKX1dYDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRvY1BhdGguaW5jbHVkZXMocykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1ZmZpeCA9IGBbJHsnKicucmVwZWF0KGRlcHRoICsgMSl9XWA7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBkb2NQYXRoID0gYCR7ZG9jUGF0aH0ke3N1ZmZpeH1gO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3dpdGNoKGZpZWxkLnR5cGUuY2F0ZWdvcnkpIHtcbiAgICAgICAgICAgIGNhc2UgXCJzY2FsYXJcIjpcbiAgICAgICAgICAgICAgICBsZXQgdHlwZU5hbWU7XG4gICAgICAgICAgICAgICAgaWYgKGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLmJvb2xlYW4pIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWUgPSAnYm9vbGVhbic7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC50eXBlID09PSBzY2FsYXJUeXBlcy5mbG9hdCkge1xuICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZSA9ICdudW1iZXInO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMuaW50KSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lID0gJ251bWJlcic7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC50eXBlID09PSBzY2FsYXJUeXBlcy51aW50NjQpIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWUgPSAndWludDY0JztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLnVpbnQxMDI0KSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lID0gJ3VpbnQxMDI0JztcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZSA9ICdzdHJpbmcnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGBzY2FsYXJGaWVsZHMuc2V0KCcke3BhdGh9JywgeyB0eXBlOiAnJHt0eXBlTmFtZX0nLCBwYXRoOiAnJHtkb2NQYXRofScgfSk7YCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwic3RydWN0XCI6XG4gICAgICAgICAgICBjYXNlIFwidW5pb25cIjpcbiAgICAgICAgICAgICAgICBnZW5KU1NjYWxhckZpZWxkcyhmaWVsZC50eXBlLCBwYXRoLCBkb2NQYXRoKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG5cbiAgICBmdW5jdGlvbiBnZW5KU1R5cGVSZXNvbHZlcnNGb3JVbmlvbih0eXBlOiBEYlR5cGUpIHtcbiAgICAgICAgaWYgKHR5cGUuY2F0ZWdvcnkgPT09IERiVHlwZUNhdGVnb3J5LnVuaW9uKSB7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICR7dHlwZS5uYW1lfTogJHt0eXBlLm5hbWV9UmVzb2x2ZXIsYCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5lcmF0ZSh0eXBlczogRGJUeXBlW10pIHtcblxuICAgICAgICAvLyBHXG5cbiAgICAgICAgZy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBcIlwiXCJcbiAgICAgICAgRHVlIHRvIEdyYXBoUUwgbGltaXRhdGlvbnMgYmlnIG51bWJlcnMgYXJlIHJldHVybmVkIGFzIGEgc3RyaW5nLlxuICAgICAgICBZb3UgY2FuIHNwZWNpZnkgZm9ybWF0IHVzZWQgdG8gc3RyaW5nIHJlcHJlc2VudGF0aW9uIGZvciBiaWcgaW50ZWdlcnMuXG4gICAgICAgIFwiXCJcIlxuICAgICAgICBlbnVtIEJpZ0ludEZvcm1hdCB7XG4gICAgICAgICAgICBcIiBIZXhhZGVjaW1hbCByZXByZXNlbnRhdGlvbiBzdGFydGVkIHdpdGggMHggKGRlZmF1bHQpIFwiXG4gICAgICAgICAgICBIRVhcbiAgICAgICAgICAgIFwiIERlY2ltYWwgcmVwcmVzZW50YXRpb24gXCJcbiAgICAgICAgICAgIERFQ1xuICAgICAgICB9XG4gICAgICAgIGApO1xuICAgICAgICBbJ1N0cmluZycsICdCb29sZWFuJywgJ0ludCcsICdGbG9hdCddLmZvckVhY2goZ2VuR1NjYWxhclR5cGVzRmlsdGVyKTtcbiAgICAgICAgZ2VuR0VudW1UeXBlcygpO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKHR5cGUgPT4gZ2VuR1R5cGVEZWNsYXJhdGlvbih0eXBlKSk7XG4gICAgICAgIGNvbnN0IGdBcnJheUZpbHRlcnMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICAgICAgdHlwZXMuZm9yRWFjaCh0eXBlID0+IGdlbkdGaWx0ZXIodHlwZSwgZ0FycmF5RmlsdGVycykpO1xuXG4gICAgICAgIGNvbnN0IGNvbGxlY3Rpb25zID0gdHlwZXMuZmlsdGVyKHQgPT4gISF0LmNvbGxlY3Rpb24pO1xuICAgICAgICBnZW5HUXVlcmllcyhjb2xsZWN0aW9ucyk7XG4gICAgICAgIGdlbkdTdWJzY3JpcHRpb25zKGNvbGxlY3Rpb25zKTtcblxuICAgICAgICAvLyBKU1xuXG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIGNvbnN0IHtcbiAgICAgICAgICAgIHNjYWxhcixcbiAgICAgICAgICAgIGJpZ1VJbnQxLFxuICAgICAgICAgICAgYmlnVUludDIsXG4gICAgICAgICAgICByZXNvbHZlQmlnVUludCxcbiAgICAgICAgICAgIHN0cnVjdCxcbiAgICAgICAgICAgIGFycmF5LFxuICAgICAgICAgICAgam9pbixcbiAgICAgICAgICAgIGpvaW5BcnJheSxcbiAgICAgICAgICAgIGVudW1OYW1lLFxuICAgICAgICAgICAgc3RyaW5nQ29tcGFuaW9uLFxuICAgICAgICAgICAgY3JlYXRlRW51bU5hbWVSZXNvbHZlcixcbiAgICAgICAgICAgIHVuaXhNaWxsaXNlY29uZHNUb1N0cmluZyxcbiAgICAgICAgICAgIHVuaXhTZWNvbmRzVG9TdHJpbmcsXG4gICAgICAgIH0gPSByZXF1aXJlKCcuL2RiLXR5cGVzLmpzJyk7XG4gICAgICAgIGApO1xuICAgICAgICBjb25zdCBqc0FycmF5RmlsdGVycyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKHR5cGUgPT4gZ2VuSlNGaWx0ZXIodHlwZSwganNBcnJheUZpbHRlcnMpKTtcblxuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBmdW5jdGlvbiBjcmVhdGVSZXNvbHZlcnMoZGIpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgIGApO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgICAgICAgICBnZW5KU0N1c3RvbVJlc29sdmVycyh0eXBlKTtcbiAgICAgICAgICAgIGdlbkpTVHlwZVJlc29sdmVyc0ZvclVuaW9uKHR5cGUpO1xuICAgICAgICB9KTtcbiAgICAgICAganMud3JpdGVMbignICAgICAgICBRdWVyeTogeycpO1xuICAgICAgICBjb2xsZWN0aW9ucy5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAke3R5cGUuY29sbGVjdGlvbiB8fCAnJ306IGRiLiR7dHlwZS5jb2xsZWN0aW9uIHx8ICcnfS5xdWVyeVJlc29sdmVyKCksYClcbiAgICAgICAgfSk7XG4gICAgICAgIGpzLndyaXRlTG4oJyAgICAgICAgfSwnKTtcbiAgICAgICAganMud3JpdGVMbignICAgICAgICBTdWJzY3JpcHRpb246IHsnKTtcbiAgICAgICAgY29sbGVjdGlvbnMuZm9yRWFjaCgodHlwZSkgPT4ge1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgJHt0eXBlLmNvbGxlY3Rpb24gfHwgJyd9OiBkYi4ke3R5cGUuY29sbGVjdGlvbiB8fCAnJ30uc3Vic2NyaXB0aW9uUmVzb2x2ZXIoKSxgKVxuICAgICAgICB9KTtcbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBgKTtcblxuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBjb25zdCBzY2FsYXJGaWVsZHMgPSBuZXcgTWFwKCk7XG4gICAgICAgIGApO1xuICAgICAgICBjb2xsZWN0aW9ucy5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgICAgICAgICBnZW5KU1NjYWxhckZpZWxkcyh0eXBlLCB0eXBlLmNvbGxlY3Rpb24gfHwgJycsICdkb2MnKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgICAgICAgICBzY2FsYXJGaWVsZHMsXG4gICAgICAgICAgICBjcmVhdGVSZXNvbHZlcnMsXG4gICAgICAgIGApO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKHR5cGUgPT4ganMud3JpdGVMbihgICAgICR7dHlwZS5uYW1lfSxgKSk7XG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIH07XG4gICAgICAgIGApO1xuICAgIH1cblxuICAgIGdlbmVyYXRlKGRiVHlwZXMpO1xuXG4gICAgZm9yIChjb25zdCBlOiBJbnRFbnVtRGVmIG9mIGVudW1UeXBlcy52YWx1ZXMoKSkge1xuICAgICAgICBjb25zb2xlLmxvZyhgZXhwb3J0IGNvbnN0IFEke2UubmFtZX0gPSB7YCk7XG4gICAgICAgIGNvbnNvbGUubG9nKE9iamVjdC5lbnRyaWVzKGUudmFsdWVzKS5tYXAoKFtuYW1lLCB2YWx1ZV0pID0+IHtcbiAgICAgICAgICAgIHJldHVybiBgICAgICR7bmFtZX06ICR7KHZhbHVlOiBhbnkpfSxgO1xuICAgICAgICB9KS5qb2luKCdcXG4nKSk7XG4gICAgICAgIGNvbnNvbGUubG9nKGB9O1xcbmApO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIHFsOiBnLmdlbmVyYXRlZCgpLFxuICAgICAgICBqczoganMuZ2VuZXJhdGVkKCksXG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBtYWluO1xuIl19