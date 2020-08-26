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
        js.writeLn(`                return context.db.${collection}.waitForDoc(parent.${on}, '${refOn}', args, context);`);
      } else if (field.arrayDepth === 1) {
        js.writeLn(`                return context.db.${collection}.waitForDocs(parent.${on}, '${refOn}', args, context);`);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NlcnZlci9zY2hlbWEvcWwtanMtZ2VuZXJhdG9yLmpzIl0sIm5hbWVzIjpbIm1haW4iLCJzY2hlbWFEZWYiLCJ0eXBlcyIsImRiVHlwZXMiLCJlbnVtVHlwZXMiLCJnIiwiV3JpdGVyIiwianMiLCJnZW5HRG9jIiwicHJlZml4IiwiZG9jIiwidHJpbSIsImxpbmVzIiwic3BsaXQiLCJsZW5ndGgiLCJpbmNsdWRlcyIsIndyaXRlTG4iLCJmb3JFYWNoIiwibGluZSIsInVuaW9uVmFyaWFudFR5cGUiLCJ0eXBlIiwidmFyaWFudCIsIm5hbWUiLCJnZW5HVHlwZURlY2xhcmF0aW9uc0ZvclVuaW9uVmFyaWFudHMiLCJmaWVsZHMiLCJ3cml0ZUJsb2NrTG4iLCJnZW5HRW51bVR5cGVzIiwiZW51bURlZiIsInZhbHVlcyIsIk9iamVjdCIsImtleXMiLCJnZW5HVHlwZURlY2xhcmF0aW9uIiwiY2F0ZWdvcnkiLCJEYlR5cGVDYXRlZ29yeSIsInVuaW9uIiwiZmllbGQiLCJ0eXBlRGVjbGFyYXRpb24iLCJyZXBlYXQiLCJhcnJheURlcHRoIiwicGFyYW1zIiwiam9pbiIsImZvcm1hdHRlciIsInByZXZlbnRUd2ljZSIsIm5hbWVzIiwid29yayIsImhhcyIsImFkZCIsImdlbkdGaWx0ZXJzRm9yQXJyYXlGaWVsZHMiLCJnTmFtZXMiLCJpdGVtVHlwZU5hbWUiLCJpIiwiZmlsdGVyTmFtZSIsIm9wIiwiZ2VuR0ZpbHRlcnNGb3JFbnVtTmFtZUZpZWxkcyIsImdlbkdTY2FsYXJUeXBlc0ZpbHRlciIsImdlbkdGaWx0ZXIiLCJnZW5HUXVlcmllcyIsImNvbGxlY3Rpb24iLCJnZW5HU3Vic2NyaXB0aW9ucyIsImdldFNjYWxhclJlc29sdmVyTmFtZSIsInNjYWxhclR5cGVzIiwidWludDY0IiwidWludDEwMjQiLCJnZW5KU0ZpbHRlcnNGb3JBcnJheUZpZWxkcyIsImpzTmFtZXMiLCJpdGVtUmVzb2x2ZXJOYW1lIiwic2NhbGFyIiwiZ2VuSlNTdHJ1Y3RGaWx0ZXIiLCJzdWZmaXgiLCJvbiIsInJlZk9uIiwiZ2VuSlNVbmlvblJlc29sdmVyIiwiZ2VuSlNGaWx0ZXIiLCJnZW5KU0N1c3RvbVJlc29sdmVycyIsImpvaW5GaWVsZHMiLCJmaWx0ZXIiLCJ4IiwiYmlnVUludEZpZWxkcyIsInN0cmluZ0Zvcm1hdHRlZEZpZWxkcyIsImVudW1GaWVsZHMiLCJjdXN0b21SZXNvbHZlclJlcXVpcmVkIiwib25GaWVsZCIsImZpbmQiLCJwcmVDb25kaXRpb24iLCJwcmVmaXhMZW5ndGgiLCJnZW5KU1NjYWxhckZpZWxkcyIsInBhcmVudFBhdGgiLCJwYXJlbnREb2NQYXRoIiwiZG9jTmFtZSIsInBhdGgiLCJkb2NQYXRoIiwiZGVwdGgiLCJzIiwidHlwZU5hbWUiLCJib29sZWFuIiwiZmxvYXQiLCJpbnQiLCJnZW5KU1R5cGVSZXNvbHZlcnNGb3JVbmlvbiIsImdlbmVyYXRlIiwiZ0FycmF5RmlsdGVycyIsIlNldCIsImNvbGxlY3Rpb25zIiwidCIsImpzQXJyYXlGaWx0ZXJzIiwiZSIsImNvbnNvbGUiLCJsb2ciLCJlbnRyaWVzIiwibWFwIiwidmFsdWUiLCJxbCIsImdlbmVyYXRlZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUVBOztBQUdBOztBQVFBLFNBQVNBLElBQVQsQ0FBY0MsU0FBZCxFQUFrQztBQUM5QixRQUFNO0FBQUVDLElBQUFBLEtBQUssRUFBRUMsT0FBVDtBQUFrQkMsSUFBQUE7QUFBbEIsTUFBK0Isa0NBQWNILFNBQWQsQ0FBckMsQ0FEOEIsQ0FHbEM7O0FBRUksUUFBTUksQ0FBQyxHQUFHLElBQUlDLFdBQUosRUFBVjtBQUNBLFFBQU1DLEVBQUUsR0FBRyxJQUFJRCxXQUFKLEVBQVg7O0FBRUEsV0FBU0UsT0FBVCxDQUFpQkMsTUFBakIsRUFBaUNDLEdBQWpDLEVBQThDO0FBQzFDLFFBQUlBLEdBQUcsQ0FBQ0MsSUFBSixPQUFlLEVBQW5CLEVBQXVCO0FBQ25CO0FBQ0g7O0FBQ0QsVUFBTUMsS0FBSyxHQUFHRixHQUFHLENBQUNHLEtBQUosQ0FB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Q0gsS0FGRDtBQUlBbEQsSUFBQUEsRUFBRSxDQUFDa0IsWUFBSCxDQUFpQjs7OztTQUFqQjtBQUtBdkIsSUFBQUEsS0FBSyxDQUFDZSxPQUFOLENBQWNHLElBQUksSUFBSWIsRUFBRSxDQUFDUyxPQUFILENBQVksT0FBTUksSUFBSSxDQUFDRSxJQUFLLEdBQTVCLENBQXRCO0FBQ0FmLElBQUFBLEVBQUUsQ0FBQ2tCLFlBQUgsQ0FBaUI7O1NBQWpCO0FBR0g7O0FBRUR5RSxFQUFBQSxRQUFRLENBQUMvRixPQUFELENBQVI7O0FBRUEsT0FBSyxNQUFNcUcsQ0FBWCxJQUE0QnBHLFNBQVMsQ0FBQ3dCLE1BQVYsRUFBNUIsRUFBZ0Q7QUFDNUM2RSxJQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBYSxpQkFBZ0JGLENBQUMsQ0FBQ2xGLElBQUssTUFBcEM7QUFDQW1GLElBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZN0UsTUFBTSxDQUFDOEUsT0FBUCxDQUFlSCxDQUFDLENBQUM1RSxNQUFqQixFQUF5QmdGLEdBQXpCLENBQTZCLENBQUMsQ0FBQ3RGLElBQUQsRUFBT3VGLEtBQVAsQ0FBRCxLQUFtQjtBQUN4RCxhQUFRLE9BQU12RixJQUFLLEtBQUt1RixLQUFZLEdBQXBDO0FBQ0gsS0FGVyxFQUVUckUsSUFGUyxDQUVKLElBRkksQ0FBWjtBQUdBaUUsSUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQWEsTUFBYjtBQUNIOztBQUVELFNBQU87QUFDSEksSUFBQUEsRUFBRSxFQUFFekcsQ0FBQyxDQUFDMEcsU0FBRixFQUREO0FBRUh4RyxJQUFBQSxFQUFFLEVBQUVBLEVBQUUsQ0FBQ3dHLFNBQUg7QUFGRCxHQUFQO0FBSUg7O2VBRWMvRyxJIiwic291cmNlc0NvbnRlbnQiOlsiLy9AZmxvd1xyXG5cclxuaW1wb3J0IHtXcml0ZXJ9IGZyb20gJy4vZ2VuLmpzJztcclxuaW1wb3J0IHR5cGUge1R5cGVEZWZ9IGZyb20gJy4vc2NoZW1hLmpzJztcclxuaW1wb3J0IHR5cGUge0RiRmllbGQsIERiVHlwZSwgSW50RW51bURlZn0gZnJvbSAnLi9kYi1zY2hlbWEtdHlwZXMnO1xyXG5pbXBvcnQge1xyXG4gICAgRGJUeXBlQ2F0ZWdvcnksXHJcbiAgICBpc0JpZ0ludCwgcGFyc2VEYlNjaGVtYSxcclxuICAgIHNjYWxhclR5cGVzLFxyXG4gICAgc3RyaW5naWZ5RW51bVZhbHVlcyxcclxuICAgIHRvRW51bVN0eWxlLFxyXG59IGZyb20gJy4vZGItc2NoZW1hLXR5cGVzJztcclxuXHJcbmZ1bmN0aW9uIG1haW4oc2NoZW1hRGVmOiBUeXBlRGVmKSB7XHJcbiAgICBjb25zdCB7IHR5cGVzOiBkYlR5cGVzLCBlbnVtVHlwZXN9ID0gcGFyc2VEYlNjaGVtYShzY2hlbWFEZWYpO1xyXG5cclxuLy8gR2VuZXJhdG9yc1xyXG5cclxuICAgIGNvbnN0IGcgPSBuZXcgV3JpdGVyKCk7XHJcbiAgICBjb25zdCBqcyA9IG5ldyBXcml0ZXIoKTtcclxuXHJcbiAgICBmdW5jdGlvbiBnZW5HRG9jKHByZWZpeDogc3RyaW5nLCBkb2M6IHN0cmluZykge1xyXG4gICAgICAgIGlmIChkb2MudHJpbSgpID09PSAnJykge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGxpbmVzID0gZG9jLnNwbGl0KC9cXG5cXHI/fFxcclxcbj8vKTtcclxuICAgICAgICBpZiAobGluZXMubGVuZ3RoID09PSAxICYmICFsaW5lc1swXS5pbmNsdWRlcygnXCInKSkge1xyXG4gICAgICAgICAgICBnLndyaXRlTG4ocHJlZml4LCAnXCInLCBsaW5lc1swXSwgJ1wiJyk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZy53cml0ZUxuKHByZWZpeCwgJ1wiXCJcIicpO1xyXG4gICAgICAgICAgICBsaW5lcy5mb3JFYWNoKChsaW5lKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBnLndyaXRlTG4ocHJlZml4LCBsaW5lKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGcud3JpdGVMbihwcmVmaXgsICdcIlwiXCInKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gdW5pb25WYXJpYW50VHlwZSh0eXBlOiBEYlR5cGUsIHZhcmlhbnQ6IERiRmllbGQpOiBzdHJpbmcge1xyXG4gICAgICAgIHJldHVybiBgJHt0eXBlLm5hbWV9JHt2YXJpYW50Lm5hbWV9VmFyaWFudGA7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZ2VuR1R5cGVEZWNsYXJhdGlvbnNGb3JVbmlvblZhcmlhbnRzKHR5cGU6IERiVHlwZSkge1xyXG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKHZhcmlhbnQpID0+IHtcclxuICAgICAgICAgICAgZy53cml0ZUJsb2NrTG4oYFxyXG4gICAgICAgIHR5cGUgJHt1bmlvblZhcmlhbnRUeXBlKHR5cGUsIHZhcmlhbnQpfSB7XHJcbiAgICAgICAgICAgICR7dmFyaWFudC5uYW1lfTogJHt2YXJpYW50LnR5cGUubmFtZX1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGApO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGdlbkdFbnVtVHlwZXMoKSB7XHJcbiAgICAgICAgZm9yIChjb25zdCBlbnVtRGVmOiBJbnRFbnVtRGVmIG9mIGVudW1UeXBlcy52YWx1ZXMoKSkge1xyXG4gICAgICAgICAgICBnLndyaXRlTG4oYGVudW0gJHtlbnVtRGVmLm5hbWV9RW51bSB7YCk7XHJcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKGVudW1EZWYudmFsdWVzKS5mb3JFYWNoKChuYW1lKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBnLndyaXRlTG4oYCAgICAke3RvRW51bVN0eWxlKG5hbWUpfWApO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgZy53cml0ZUxuKGB9YCk7XHJcbiAgICAgICAgICAgIGcud3JpdGVMbigpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBnZW5HVHlwZURlY2xhcmF0aW9uKHR5cGU6IERiVHlwZSkge1xyXG4gICAgICAgIGlmICh0eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS51bmlvbikge1xyXG4gICAgICAgICAgICBnZW5HVHlwZURlY2xhcmF0aW9uc0ZvclVuaW9uVmFyaWFudHModHlwZSk7XHJcbiAgICAgICAgICAgIGcud3JpdGVMbihgdW5pb24gJHt0eXBlLm5hbWV9ID0gYCk7XHJcbiAgICAgICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2godmFyaWFudCA9PiB7XHJcbiAgICAgICAgICAgICAgICBnLndyaXRlTG4oYFxcdHwgJHt1bmlvblZhcmlhbnRUeXBlKHR5cGUsIHZhcmlhbnQpfWApO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgZy53cml0ZUxuKCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZ2VuR0RvYygnJywgdHlwZS5kb2MpO1xyXG4gICAgICAgICAgICBnLndyaXRlTG4oYHR5cGUgJHt0eXBlLm5hbWV9IHtgKTtcclxuICAgICAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaChmaWVsZCA9PiB7XHJcbiAgICAgICAgICAgICAgICBnZW5HRG9jKCdcXHQnLCBmaWVsZC5kb2MpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdHlwZURlY2xhcmF0aW9uID1cclxuICAgICAgICAgICAgICAgICAgICAnWycucmVwZWF0KGZpZWxkLmFycmF5RGVwdGgpICtcclxuICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlLm5hbWUgK1xyXG4gICAgICAgICAgICAgICAgICAgICddJy5yZXBlYXQoZmllbGQuYXJyYXlEZXB0aCk7XHJcbiAgICAgICAgICAgICAgICBsZXQgcGFyYW1zID0gJyc7XHJcbiAgICAgICAgICAgICAgICBpZiAoaXNCaWdJbnQoZmllbGQudHlwZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICBwYXJhbXMgPSAnKGZvcm1hdDogQmlnSW50Rm9ybWF0KSc7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLmpvaW4pIHtcclxuICAgICAgICAgICAgICAgICAgICBwYXJhbXMgPSBgKHRpbWVvdXQ6IEludCwgd2hlbjogJHt0eXBlLm5hbWV9RmlsdGVyKWA7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgZy53cml0ZUxuKGBcXHQke2ZpZWxkLm5hbWV9JHtwYXJhbXN9OiAke3R5cGVEZWNsYXJhdGlvbn1gKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGVudW1EZWYgPSBmaWVsZC5lbnVtRGVmO1xyXG4gICAgICAgICAgICAgICAgaWYgKGVudW1EZWYpIHtcclxuICAgICAgICAgICAgICAgICAgICBnLndyaXRlTG4oYFxcdCR7ZmllbGQubmFtZX1fbmFtZTogJHtlbnVtRGVmLm5hbWV9RW51bWApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKGZpZWxkLmZvcm1hdHRlcikge1xyXG4gICAgICAgICAgICAgICAgICAgIGcud3JpdGVMbihgXFx0JHtmaWVsZC5uYW1lfV9zdHJpbmc6IFN0cmluZ2ApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgZy53cml0ZUxuKGB9YCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGcud3JpdGVMbigpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHByZXZlbnRUd2ljZShuYW1lOiBzdHJpbmcsIG5hbWVzOiBTZXQ8c3RyaW5nPiwgd29yazogKCkgPT4gdm9pZCkge1xyXG4gICAgICAgIGlmICghbmFtZXMuaGFzKG5hbWUpKSB7XHJcbiAgICAgICAgICAgIG5hbWVzLmFkZChuYW1lKTtcclxuICAgICAgICAgICAgd29yaygpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBnZW5HRmlsdGVyc0ZvckFycmF5RmllbGRzKHR5cGU6IERiVHlwZSwgZ05hbWVzOiBTZXQ8c3RyaW5nPikge1xyXG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XHJcbiAgICAgICAgICAgIGxldCBpdGVtVHlwZU5hbWUgPSBmaWVsZC50eXBlLm5hbWU7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZmllbGQuYXJyYXlEZXB0aDsgaSArPSAxKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBmaWx0ZXJOYW1lID0gYCR7aXRlbVR5cGVOYW1lfUFycmF5RmlsdGVyYDtcclxuICAgICAgICAgICAgICAgIHByZXZlbnRUd2ljZShmaWx0ZXJOYW1lLCBnTmFtZXMsICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBnLndyaXRlTG4oYGlucHV0ICR7ZmlsdGVyTmFtZX0ge2ApO1xyXG4gICAgICAgICAgICAgICAgICAgIFsnYW55JywgJ2FsbCddLmZvckVhY2goKG9wKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGcud3JpdGVMbihgXFx0JHtvcH06ICR7aXRlbVR5cGVOYW1lfUZpbHRlcmApO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGcud3JpdGVMbignfScpO1xyXG4gICAgICAgICAgICAgICAgICAgIGcud3JpdGVMbigpO1xyXG5cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgaXRlbVR5cGVOYW1lICs9ICdBcnJheSc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBnZW5HRmlsdGVyc0ZvckVudW1OYW1lRmllbGRzKHR5cGU6IERiVHlwZSwgZ05hbWVzOiBTZXQ8c3RyaW5nPikge1xyXG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGVudW1EZWYgPSBmaWVsZC5lbnVtRGVmO1xyXG4gICAgICAgICAgICBpZiAoZW51bURlZikge1xyXG4gICAgICAgICAgICAgICAgcHJldmVudFR3aWNlKGAke2VudW1EZWYubmFtZX1FbnVtRmlsdGVyYCwgZ05hbWVzLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgZ2VuR1NjYWxhclR5cGVzRmlsdGVyKGAke2VudW1EZWYubmFtZX1FbnVtYCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGdlbkdGaWx0ZXIodHlwZTogRGJUeXBlLCBnTmFtZXM6IFNldDxzdHJpbmc+KSB7XHJcbiAgICAgICAgaWYgKHR5cGUuZmllbGRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGdlbkdGaWx0ZXJzRm9yQXJyYXlGaWVsZHModHlwZSwgZ05hbWVzKTtcclxuICAgICAgICBnZW5HRmlsdGVyc0ZvckVudW1OYW1lRmllbGRzKHR5cGUsIGdOYW1lcyk7XHJcbiAgICAgICAgZ2VuR0RvYygnJywgdHlwZS5kb2MpO1xyXG4gICAgICAgIGcud3JpdGVMbihgaW5wdXQgJHt0eXBlLm5hbWV9RmlsdGVyIHtgKTtcclxuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xyXG4gICAgICAgICAgICBnZW5HRG9jKCdcXHQnLCBmaWVsZC5kb2MpO1xyXG4gICAgICAgICAgICBjb25zdCB0eXBlRGVjbGFyYXRpb24gPSBmaWVsZC50eXBlLm5hbWUgKyBcIkFycmF5XCIucmVwZWF0KGZpZWxkLmFycmF5RGVwdGgpO1xyXG4gICAgICAgICAgICBnLndyaXRlTG4oYFxcdCR7ZmllbGQubmFtZX06ICR7dHlwZURlY2xhcmF0aW9ufUZpbHRlcmApO1xyXG4gICAgICAgICAgICBjb25zdCBlbnVtRGVmID0gZmllbGQuZW51bURlZjtcclxuICAgICAgICAgICAgaWYgKGVudW1EZWYpIHtcclxuICAgICAgICAgICAgICAgIGcud3JpdGVMbihgXFx0JHtmaWVsZC5uYW1lfV9uYW1lOiAke2VudW1EZWYubmFtZX1FbnVtRmlsdGVyYCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICBnLndyaXRlTG4oYCAgICBPUjogJHt0eXBlLm5hbWV9RmlsdGVyYCk7XHJcbiAgICAgICAgZy53cml0ZUxuKGB9YCk7XHJcbiAgICAgICAgZy53cml0ZUxuKCk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZ2VuR1NjYWxhclR5cGVzRmlsdGVyKG5hbWU6IHN0cmluZykge1xyXG4gICAgICAgIGcud3JpdGVMbihgaW5wdXQgJHtuYW1lfUZpbHRlciB7YCk7XHJcbiAgICAgICAgWydlcScsICduZScsICdndCcsICdsdCcsICdnZScsICdsZSddLmZvckVhY2goKG9wKSA9PiB7XHJcbiAgICAgICAgICAgIGcud3JpdGVMbihgXFx0JHtvcH06ICR7bmFtZX1gKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICBbJ2luJywgJ25vdEluJ10uZm9yRWFjaCgob3ApID0+IHtcclxuICAgICAgICAgICAgZy53cml0ZUxuKGBcXHQke29wfTogWyR7bmFtZX1dYCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgZy53cml0ZUxuKCd9Jyk7XHJcbiAgICAgICAgZy53cml0ZUxuKCk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZ2VuR1F1ZXJpZXModHlwZXM6IERiVHlwZVtdKSB7XHJcbiAgICAgICAgZy53cml0ZUJsb2NrTG4oYFxyXG4gICAgICAgIFwiU3BlY2lmeSBzb3J0IG9yZGVyIGRpcmVjdGlvblwiXHJcbiAgICAgICAgZW51bSBRdWVyeU9yZGVyQnlEaXJlY3Rpb24ge1xyXG4gICAgICAgICAgICBcIkRvY3VtZW50cyB3aWxsIGJlIHNvcnRlZCBpbiBhc2NlbmRlZCBvcmRlciAoZS5nLiBmcm9tIEEgdG8gWilcIlxyXG4gICAgICAgICAgICBBU0NcclxuICAgICAgICAgICAgXCJEb2N1bWVudHMgd2lsbCBiZSBzb3J0ZWQgaW4gZGVzY2VuZGFudCBvcmRlciAoZS5nLiBmcm9tIFogdG8gQSlcIlxyXG4gICAgICAgICAgICBERVNDXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBcclxuICAgICAgICBcIlwiXCJcclxuICAgICAgICBTcGVjaWZ5IGhvdyB0byBzb3J0IHJlc3VsdHMuXHJcbiAgICAgICAgWW91IGNhbiBzb3J0IGRvY3VtZW50cyBpbiByZXN1bHQgc2V0IHVzaW5nIG1vcmUgdGhhbiBvbmUgZmllbGQuXHJcbiAgICAgICAgXCJcIlwiXHJcbiAgICAgICAgaW5wdXQgUXVlcnlPcmRlckJ5IHtcclxuICAgICAgICAgICAgXCJcIlwiXHJcbiAgICAgICAgICAgIFBhdGggdG8gZmllbGQgd2hpY2ggbXVzdCBiZSB1c2VkIGFzIGEgc29ydCBjcml0ZXJpYS5cclxuICAgICAgICAgICAgSWYgZmllbGQgcmVzaWRlcyBkZWVwIGluIHN0cnVjdHVyZSBwYXRoIGl0ZW1zIG11c3QgYmUgc2VwYXJhdGVkIHdpdGggZG90IChlLmcuICdmb28uYmFyLmJheicpLlxyXG4gICAgICAgICAgICBcIlwiXCJcclxuICAgICAgICAgICAgcGF0aDogU3RyaW5nXHJcbiAgICAgICAgICAgIFwiU29ydCBvcmRlciBkaXJlY3Rpb25cIlxyXG4gICAgICAgICAgICBkaXJlY3Rpb246IFF1ZXJ5T3JkZXJCeURpcmVjdGlvblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdHlwZSBRdWVyeSB7XHJcbiAgICAgICAgYCk7XHJcblxyXG4gICAgICAgIHR5cGVzLmZvckVhY2goKHR5cGU6IERiVHlwZSkgPT4ge1xyXG4gICAgICAgICAgICBnLndyaXRlTG4oYFxcdCR7dHlwZS5jb2xsZWN0aW9uIHx8ICcnfShmaWx0ZXI6ICR7dHlwZS5uYW1lfUZpbHRlciwgb3JkZXJCeTogW1F1ZXJ5T3JkZXJCeV0sIGxpbWl0OiBJbnQsIHRpbWVvdXQ6IEZsb2F0LCBhY2Nlc3NLZXk6IFN0cmluZywgb3BlcmF0aW9uSWQ6IFN0cmluZyk6IFske3R5cGUubmFtZX1dYCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGcud3JpdGVCbG9ja0xuKGBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGApO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGdlbkdTdWJzY3JpcHRpb25zKHR5cGVzOiBEYlR5cGVbXSkge1xyXG4gICAgICAgIGcud3JpdGVMbigndHlwZSBTdWJzY3JpcHRpb24geycpO1xyXG4gICAgICAgIHR5cGVzLmZvckVhY2goKHR5cGUpID0+IHtcclxuICAgICAgICAgICAgZy53cml0ZUxuKGBcXHQke3R5cGUuY29sbGVjdGlvbiB8fCAnJ30oZmlsdGVyOiAke3R5cGUubmFtZX1GaWx0ZXIsIGFjY2Vzc0tleTogU3RyaW5nKTogJHt0eXBlLm5hbWV9YCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgZy53cml0ZUxuKCd9Jyk7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIGZ1bmN0aW9uIGdldFNjYWxhclJlc29sdmVyTmFtZShmaWVsZDogRGJGaWVsZCk6IHN0cmluZyB7XHJcbiAgICAgICAgaWYgKGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLnVpbnQ2NCkge1xyXG4gICAgICAgICAgICByZXR1cm4gJ2JpZ1VJbnQxJztcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLnVpbnQxMDI0KSB7XHJcbiAgICAgICAgICAgIHJldHVybiAnYmlnVUludDInO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gJ3NjYWxhcic7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZ2VuSlNGaWx0ZXJzRm9yQXJyYXlGaWVsZHModHlwZTogRGJUeXBlLCBqc05hbWVzOiBTZXQ8c3RyaW5nPikge1xyXG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XHJcbiAgICAgICAgICAgIGxldCBpdGVtVHlwZU5hbWUgPSBmaWVsZC50eXBlLm5hbWU7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZmllbGQuYXJyYXlEZXB0aDsgaSArPSAxKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBmaWx0ZXJOYW1lID0gYCR7aXRlbVR5cGVOYW1lfUFycmF5YDtcclxuICAgICAgICAgICAgICAgIHByZXZlbnRUd2ljZShmaWx0ZXJOYW1lLCBqc05hbWVzLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaXRlbVJlc29sdmVyTmFtZSA9IChpID09PSAwICYmIGZpZWxkLnR5cGUuY2F0ZWdvcnkgPT09IERiVHlwZUNhdGVnb3J5LnNjYWxhcilcclxuICAgICAgICAgICAgICAgICAgICAgICAgPyBnZXRTY2FsYXJSZXNvbHZlck5hbWUoZmllbGQpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDogaXRlbVR5cGVOYW1lO1xyXG4gICAgICAgICAgICAgICAgICAgIGpzLndyaXRlQmxvY2tMbihgXHJcbiAgICAgICAgICAgICAgICBjb25zdCAke2ZpbHRlck5hbWV9ID0gYXJyYXkoKCkgPT4gJHtpdGVtUmVzb2x2ZXJOYW1lfSk7XHJcbiAgICAgICAgICAgICAgICBgKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgaXRlbVR5cGVOYW1lICs9ICdBcnJheSc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBnZW5KU1N0cnVjdEZpbHRlcih0eXBlOiBEYlR5cGUpIHtcclxuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxyXG4gICAgICAgIGNvbnN0ICR7dHlwZS5uYW1lfSA9IHN0cnVjdCh7XHJcbiAgICBgKTtcclxuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZDogRGJGaWVsZCkgPT4ge1xyXG4gICAgICAgICAgICBsZXQgdHlwZURlY2xhcmF0aW9uOiA/c3RyaW5nID0gbnVsbDtcclxuICAgICAgICAgICAgY29uc3Qgam9pbiA9IGZpZWxkLmpvaW47XHJcbiAgICAgICAgICAgIGlmIChqb2luKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBzdWZmaXggPSBmaWVsZC5hcnJheURlcHRoID4gMCA/ICdBcnJheScgOiAnJztcclxuICAgICAgICAgICAgICAgIHR5cGVEZWNsYXJhdGlvbiA9IGBqb2luJHtzdWZmaXh9KCcke2pvaW4ub259JywgJyR7am9pbi5yZWZPbn0nLCAnJHtmaWVsZC50eXBlLmNvbGxlY3Rpb24gfHwgJyd9JywgKCkgPT4gJHtmaWVsZC50eXBlLm5hbWV9KWA7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQuYXJyYXlEZXB0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgIHR5cGVEZWNsYXJhdGlvbiA9XHJcbiAgICAgICAgICAgICAgICAgICAgZmllbGQudHlwZS5uYW1lICtcclxuICAgICAgICAgICAgICAgICAgICAnQXJyYXknLnJlcGVhdChmaWVsZC5hcnJheURlcHRoKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC50eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS5zY2FsYXIpIHtcclxuICAgICAgICAgICAgICAgIHR5cGVEZWNsYXJhdGlvbiA9IGdldFNjYWxhclJlc29sdmVyTmFtZShmaWVsZCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZS5maWVsZHMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgdHlwZURlY2xhcmF0aW9uID0gZmllbGQudHlwZS5uYW1lO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0eXBlRGVjbGFyYXRpb24pIHtcclxuICAgICAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAke2ZpZWxkLm5hbWV9OiAke3R5cGVEZWNsYXJhdGlvbn0sYCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBlbnVtRGVmID0gZmllbGQuZW51bURlZjtcclxuICAgICAgICAgICAgICAgIGlmIChlbnVtRGVmKSB7XHJcbiAgICAgICAgICAgICAgICAgICAganMud3JpdGVMbihgICAgICR7ZmllbGQubmFtZX1fbmFtZTogZW51bU5hbWUoJyR7ZmllbGQubmFtZX0nLCAke3N0cmluZ2lmeUVudW1WYWx1ZXMoZW51bURlZi52YWx1ZXMpfSksYCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoZmllbGQuZm9ybWF0dGVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAganMud3JpdGVMbihgICAgICR7ZmllbGQubmFtZX1fc3RyaW5nOiBzdHJpbmdDb21wYW5pb24oJyR7ZmllbGQubmFtZX0nKSxgKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXHJcbiAgICAgICAgfSR7dHlwZS5jb2xsZWN0aW9uID8gJywgdHJ1ZScgOiAnJ30pO1xyXG5cclxuICAgIGApO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGdlbkpTVW5pb25SZXNvbHZlcih0eXBlOiBEYlR5cGUpIHtcclxuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxyXG4gICAgICAgIGNvbnN0ICR7dHlwZS5uYW1lfVJlc29sdmVyID0ge1xyXG4gICAgICAgICAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xyXG4gICAgICAgIGApO1xyXG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKHZhcmlhbnQpID0+IHtcclxuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICBpZiAoJyR7dmFyaWFudC5uYW1lfScgaW4gb2JqKSB7YCk7XHJcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgIHJldHVybiAnJHt1bmlvblZhcmlhbnRUeXBlKHR5cGUsIHZhcmlhbnQpfSc7YCk7XHJcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgfWApO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGApO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGdlbkpTRmlsdGVyKHR5cGU6IERiVHlwZSwganNOYW1lczogU2V0PHN0cmluZz4pIHtcclxuICAgICAgICBpZiAodHlwZS5maWVsZHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHR5cGUuY2F0ZWdvcnkgPT09IERiVHlwZUNhdGVnb3J5LnVuaW9uKSB7XHJcbiAgICAgICAgICAgIC8vIGdlbkpTRmlsdGVyc0ZvclVuaW9uVmFyaWFudHModHlwZSwganNOYW1lcyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGdlbkpTRmlsdGVyc0ZvckFycmF5RmllbGRzKHR5cGUsIGpzTmFtZXMpO1xyXG4gICAgICAgIGdlbkpTU3RydWN0RmlsdGVyKHR5cGUpO1xyXG4gICAgICAgIGlmICh0eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS51bmlvbikge1xyXG4gICAgICAgICAgICBnZW5KU1VuaW9uUmVzb2x2ZXIodHlwZSk7XHJcbiAgICAgICAgfVxyXG5cclxuXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZW5lcmF0ZSBjdXN0b20gcmVzb2x2ZXJzIGZvciB0eXBlcyB3aXRoOlxyXG4gICAgICogLSBpZCBmaWVsZFxyXG4gICAgICogLSBqb2luIGZpZWxkc1xyXG4gICAgICogLSB1NjQgYW5kIGhpZ2hlciBmaWVsZHNcclxuICAgICAqIEBwYXJhbSB0eXBlXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIGdlbkpTQ3VzdG9tUmVzb2x2ZXJzKHR5cGU6IERiVHlwZSkge1xyXG4gICAgICAgIGNvbnN0IGpvaW5GaWVsZHMgPSB0eXBlLmZpZWxkcy5maWx0ZXIoeCA9PiAhIXguam9pbik7XHJcbiAgICAgICAgY29uc3QgYmlnVUludEZpZWxkcyA9IHR5cGUuZmllbGRzLmZpbHRlcigoeDogRGJGaWVsZCkgPT4gaXNCaWdJbnQoeC50eXBlKSk7XHJcbiAgICAgICAgY29uc3Qgc3RyaW5nRm9ybWF0dGVkRmllbGRzID0gdHlwZS5maWVsZHMuZmlsdGVyKCh4OiBEYkZpZWxkKSA9PiB4LmZvcm1hdHRlcik7XHJcbiAgICAgICAgY29uc3QgZW51bUZpZWxkcyA9IHR5cGUuZmllbGRzLmZpbHRlcih4ID0+IHguZW51bURlZik7XHJcbiAgICAgICAgY29uc3QgY3VzdG9tUmVzb2x2ZXJSZXF1aXJlZCA9IHR5cGUuY29sbGVjdGlvblxyXG4gICAgICAgICAgICB8fCBqb2luRmllbGRzLmxlbmd0aCA+IDBcclxuICAgICAgICAgICAgfHwgYmlnVUludEZpZWxkcy5sZW5ndGggPiAwXHJcbiAgICAgICAgICAgIHx8IGVudW1GaWVsZHMubGVuZ3RoID4gMDtcclxuICAgICAgICBpZiAoIWN1c3RvbVJlc29sdmVyUmVxdWlyZWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICR7dHlwZS5uYW1lfToge2ApO1xyXG4gICAgICAgIGlmICh0eXBlLmNvbGxlY3Rpb24pIHtcclxuICAgICAgICAgICAganMud3JpdGVMbignICAgICAgICAgICAgaWQocGFyZW50KSB7Jyk7XHJcbiAgICAgICAgICAgIGpzLndyaXRlTG4oJyAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7Jyk7XHJcbiAgICAgICAgICAgIGpzLndyaXRlTG4oJyAgICAgICAgICAgIH0sJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGpvaW5GaWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcclxuICAgICAgICAgICAgY29uc3Qgam9pbiA9IGZpZWxkLmpvaW47XHJcbiAgICAgICAgICAgIGlmICgham9pbikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnN0IG9uRmllbGQgPSB0eXBlLmZpZWxkcy5maW5kKHggPT4geC5uYW1lID09PSBqb2luLm9uKTtcclxuICAgICAgICAgICAgaWYgKCFvbkZpZWxkKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyAnSm9pbiBvbiBmaWVsZCBkb2VzIG5vdCBleGlzdC4nO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnN0IG9uID0gam9pbi5vbiA9PT0gJ2lkJyA/ICdfa2V5JyA6IChqb2luLm9uIHx8ICdfa2V5Jyk7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlZk9uID0gam9pbi5yZWZPbiA9PT0gJ2lkJyA/ICdfa2V5JyA6IChqb2luLnJlZk9uIHx8ICdfa2V5Jyk7XHJcbiAgICAgICAgICAgIGNvbnN0IGNvbGxlY3Rpb24gPSBmaWVsZC50eXBlLmNvbGxlY3Rpb247XHJcbiAgICAgICAgICAgIGlmICghY29sbGVjdGlvbikge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgJ0pvaW5lZCB0eXBlIGlzIG5vdCBhIGNvbGxlY3Rpb24uJztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAke2ZpZWxkLm5hbWV9KHBhcmVudCwgYXJncywgY29udGV4dCkge2ApO1xyXG4gICAgICAgICAgICBpZiAoam9pbi5wcmVDb25kaXRpb24pIHtcclxuICAgICAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICAgICBpZiAoISgke2pvaW4ucHJlQ29uZGl0aW9ufSkpIHtgKTtcclxuICAgICAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7YCk7XHJcbiAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAgICAgfWApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICAgICBpZiAoYXJncy53aGVuICYmICEke3R5cGUubmFtZX0udGVzdChudWxsLCBwYXJlbnQsIGFyZ3Mud2hlbikpIHtgKTtcclxuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtgKTtcclxuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgICAgIH1gKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChmaWVsZC5hcnJheURlcHRoID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQuZGIuJHtjb2xsZWN0aW9ufS53YWl0Rm9yRG9jKHBhcmVudC4ke29ufSwgJyR7cmVmT259JywgYXJncywgY29udGV4dCk7YCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQuYXJyYXlEZXB0aCA9PT0gMSkge1xyXG4gICAgICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgICAgIHJldHVybiBjb250ZXh0LmRiLiR7Y29sbGVjdGlvbn0ud2FpdEZvckRvY3MocGFyZW50LiR7b259LCAnJHtyZWZPbn0nLCBhcmdzLCBjb250ZXh0KTtgKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRocm93ICdKb2lucyBvbiBhIG5lc3RlZCBhcnJheXMgZG9lcyBub3Qgc3VwcG9ydGVkLic7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgfSxgKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICBiaWdVSW50RmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IHByZWZpeExlbmd0aCA9IGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLnVpbnQ2NCA/IDEgOiAyO1xyXG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAke2ZpZWxkLm5hbWV9KHBhcmVudCwgYXJncykge2ApO1xyXG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KCR7cHJlZml4TGVuZ3RofSwgcGFyZW50LiR7ZmllbGQubmFtZX0sIGFyZ3MpO2ApO1xyXG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICB9LGApO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHN0cmluZ0Zvcm1hdHRlZEZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xyXG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAke2ZpZWxkLm5hbWV9X3N0cmluZyhwYXJlbnQsIGFyZ3MpIHtgKTtcclxuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgICAgIHJldHVybiAke2ZpZWxkLmZvcm1hdHRlciB8fCAnJ30ocGFyZW50LiR7ZmllbGQubmFtZX0pO2ApO1xyXG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICB9LGApO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGVudW1GaWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgZW51bURlZiA9IGZpZWxkLmVudW1EZWY7XHJcbiAgICAgICAgICAgIGlmIChlbnVtRGVmKSB7XHJcbiAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAke2ZpZWxkLm5hbWV9X25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJyR7ZmllbGQubmFtZX0nLCAke3N0cmluZ2lmeUVudW1WYWx1ZXMoZW51bURlZi52YWx1ZXMpfSksYCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgIH0sYCk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZ2VuSlNTY2FsYXJGaWVsZHModHlwZTogRGJUeXBlLCBwYXJlbnRQYXRoLCBwYXJlbnREb2NQYXRoOiBzdHJpbmcpIHtcclxuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZDogRGJGaWVsZCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAoZmllbGQuam9pbiB8fCBmaWVsZC5lbnVtRGVmKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc3QgZG9jTmFtZSA9IGZpZWxkLm5hbWUgPT09ICdpZCcgPyAnX2tleScgOiBmaWVsZC5uYW1lO1xyXG4gICAgICAgICAgICBjb25zdCBwYXRoID0gYCR7cGFyZW50UGF0aH0uJHtmaWVsZC5uYW1lfWA7XHJcbiAgICAgICAgICAgIGxldCBkb2NQYXRoID0gYCR7cGFyZW50RG9jUGF0aH0uJHtkb2NOYW1lfWA7XHJcbiAgICAgICAgICAgIGlmIChmaWVsZC5hcnJheURlcHRoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgbGV0IHN1ZmZpeCA9ICdbKl0nO1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgZGVwdGggPSAxMDsgZGVwdGggPiAwOyBkZXB0aCAtPSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcyA9IGBbJHsnKicucmVwZWF0KGRlcHRoKX1dYDtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZG9jUGF0aC5pbmNsdWRlcyhzKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdWZmaXggPSBgWyR7JyonLnJlcGVhdChkZXB0aCArIDEpfV1gO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBkb2NQYXRoID0gYCR7ZG9jUGF0aH0ke3N1ZmZpeH1gO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHN3aXRjaChmaWVsZC50eXBlLmNhdGVnb3J5KSB7XHJcbiAgICAgICAgICAgIGNhc2UgXCJzY2FsYXJcIjpcclxuICAgICAgICAgICAgICAgIGxldCB0eXBlTmFtZTtcclxuICAgICAgICAgICAgICAgIGlmIChmaWVsZC50eXBlID09PSBzY2FsYXJUeXBlcy5ib29sZWFuKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWUgPSAnYm9vbGVhbic7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLmZsb2F0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWUgPSAnbnVtYmVyJztcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMuaW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWUgPSAnbnVtYmVyJztcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDY0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWUgPSAndWludDY0JztcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDEwMjQpIHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZSA9ICd1aW50MTAyNCc7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lID0gJ3N0cmluZyc7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGBzY2FsYXJGaWVsZHMuc2V0KCcke3BhdGh9JywgeyB0eXBlOiAnJHt0eXBlTmFtZX0nLCBwYXRoOiAnJHtkb2NQYXRofScgfSk7YCk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBcInN0cnVjdFwiOlxyXG4gICAgICAgICAgICBjYXNlIFwidW5pb25cIjpcclxuICAgICAgICAgICAgICAgIGdlbkpTU2NhbGFyRmllbGRzKGZpZWxkLnR5cGUsIHBhdGgsIGRvY1BhdGgpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgZnVuY3Rpb24gZ2VuSlNUeXBlUmVzb2x2ZXJzRm9yVW5pb24odHlwZTogRGJUeXBlKSB7XHJcbiAgICAgICAgaWYgKHR5cGUuY2F0ZWdvcnkgPT09IERiVHlwZUNhdGVnb3J5LnVuaW9uKSB7XHJcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgJHt0eXBlLm5hbWV9OiAke3R5cGUubmFtZX1SZXNvbHZlcixgKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZ2VuZXJhdGUodHlwZXM6IERiVHlwZVtdKSB7XHJcblxyXG4gICAgICAgIC8vIEdcclxuXHJcbiAgICAgICAgZy53cml0ZUJsb2NrTG4oYFxyXG4gICAgICAgIFwiXCJcIlxyXG4gICAgICAgIER1ZSB0byBHcmFwaFFMIGxpbWl0YXRpb25zIGJpZyBudW1iZXJzIGFyZSByZXR1cm5lZCBhcyBhIHN0cmluZy5cclxuICAgICAgICBZb3UgY2FuIHNwZWNpZnkgZm9ybWF0IHVzZWQgdG8gc3RyaW5nIHJlcHJlc2VudGF0aW9uIGZvciBiaWcgaW50ZWdlcnMuXHJcbiAgICAgICAgXCJcIlwiXHJcbiAgICAgICAgZW51bSBCaWdJbnRGb3JtYXQge1xyXG4gICAgICAgICAgICBcIiBIZXhhZGVjaW1hbCByZXByZXNlbnRhdGlvbiBzdGFydGVkIHdpdGggMHggKGRlZmF1bHQpIFwiXHJcbiAgICAgICAgICAgIEhFWFxyXG4gICAgICAgICAgICBcIiBEZWNpbWFsIHJlcHJlc2VudGF0aW9uIFwiXHJcbiAgICAgICAgICAgIERFQ1xyXG4gICAgICAgIH1cclxuICAgICAgICBgKTtcclxuICAgICAgICBbJ1N0cmluZycsICdCb29sZWFuJywgJ0ludCcsICdGbG9hdCddLmZvckVhY2goZ2VuR1NjYWxhclR5cGVzRmlsdGVyKTtcclxuICAgICAgICBnZW5HRW51bVR5cGVzKCk7XHJcbiAgICAgICAgdHlwZXMuZm9yRWFjaCh0eXBlID0+IGdlbkdUeXBlRGVjbGFyYXRpb24odHlwZSkpO1xyXG4gICAgICAgIGNvbnN0IGdBcnJheUZpbHRlcnMgPSBuZXcgU2V0PHN0cmluZz4oKTtcclxuICAgICAgICB0eXBlcy5mb3JFYWNoKHR5cGUgPT4gZ2VuR0ZpbHRlcih0eXBlLCBnQXJyYXlGaWx0ZXJzKSk7XHJcblxyXG4gICAgICAgIGNvbnN0IGNvbGxlY3Rpb25zID0gdHlwZXMuZmlsdGVyKHQgPT4gISF0LmNvbGxlY3Rpb24pO1xyXG4gICAgICAgIGdlbkdRdWVyaWVzKGNvbGxlY3Rpb25zKTtcclxuICAgICAgICBnZW5HU3Vic2NyaXB0aW9ucyhjb2xsZWN0aW9ucyk7XHJcblxyXG4gICAgICAgIC8vIEpTXHJcblxyXG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXHJcbiAgICAgICAgY29uc3Qge1xyXG4gICAgICAgICAgICBzY2FsYXIsXHJcbiAgICAgICAgICAgIGJpZ1VJbnQxLFxyXG4gICAgICAgICAgICBiaWdVSW50MixcclxuICAgICAgICAgICAgcmVzb2x2ZUJpZ1VJbnQsXHJcbiAgICAgICAgICAgIHN0cnVjdCxcclxuICAgICAgICAgICAgYXJyYXksXHJcbiAgICAgICAgICAgIGpvaW4sXHJcbiAgICAgICAgICAgIGpvaW5BcnJheSxcclxuICAgICAgICAgICAgZW51bU5hbWUsXHJcbiAgICAgICAgICAgIHN0cmluZ0NvbXBhbmlvbixcclxuICAgICAgICAgICAgY3JlYXRlRW51bU5hbWVSZXNvbHZlcixcclxuICAgICAgICAgICAgdW5peE1pbGxpc2Vjb25kc1RvU3RyaW5nLFxyXG4gICAgICAgICAgICB1bml4U2Vjb25kc1RvU3RyaW5nLFxyXG4gICAgICAgIH0gPSByZXF1aXJlKCcuL2RiLXR5cGVzLmpzJyk7XHJcbiAgICAgICAgYCk7XHJcbiAgICAgICAgY29uc3QganNBcnJheUZpbHRlcnMgPSBuZXcgU2V0PHN0cmluZz4oKTtcclxuICAgICAgICB0eXBlcy5mb3JFYWNoKHR5cGUgPT4gZ2VuSlNGaWx0ZXIodHlwZSwganNBcnJheUZpbHRlcnMpKTtcclxuXHJcbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcclxuICAgICAgICBmdW5jdGlvbiBjcmVhdGVSZXNvbHZlcnMoZGIpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICBgKTtcclxuICAgICAgICB0eXBlcy5mb3JFYWNoKCh0eXBlKSA9PiB7XHJcbiAgICAgICAgICAgIGdlbkpTQ3VzdG9tUmVzb2x2ZXJzKHR5cGUpO1xyXG4gICAgICAgICAgICBnZW5KU1R5cGVSZXNvbHZlcnNGb3JVbmlvbih0eXBlKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICBqcy53cml0ZUxuKCcgICAgICAgIFF1ZXJ5OiB7Jyk7XHJcbiAgICAgICAgY29sbGVjdGlvbnMuZm9yRWFjaCgodHlwZSkgPT4ge1xyXG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAke3R5cGUuY29sbGVjdGlvbiB8fCAnJ306IGRiLiR7dHlwZS5jb2xsZWN0aW9uIHx8ICcnfS5xdWVyeVJlc29sdmVyKCksYClcclxuICAgICAgICB9KTtcclxuICAgICAgICBqcy53cml0ZUxuKCcgICAgICAgIH0sJyk7XHJcbiAgICAgICAganMud3JpdGVMbignICAgICAgICBTdWJzY3JpcHRpb246IHsnKTtcclxuICAgICAgICBjb2xsZWN0aW9ucy5mb3JFYWNoKCh0eXBlKSA9PiB7XHJcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICR7dHlwZS5jb2xsZWN0aW9uIHx8ICcnfTogZGIuJHt0eXBlLmNvbGxlY3Rpb24gfHwgJyd9LnN1YnNjcmlwdGlvblJlc29sdmVyKCksYClcclxuICAgICAgICB9KTtcclxuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBgKTtcclxuXHJcbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcclxuICAgICAgICBjb25zdCBzY2FsYXJGaWVsZHMgPSBuZXcgTWFwKCk7XHJcbiAgICAgICAgYCk7XHJcbiAgICAgICAgY29sbGVjdGlvbnMuZm9yRWFjaCgodHlwZSkgPT4ge1xyXG4gICAgICAgICAgICBnZW5KU1NjYWxhckZpZWxkcyh0eXBlLCB0eXBlLmNvbGxlY3Rpb24gfHwgJycsICdkb2MnKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcclxuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICAgICAgc2NhbGFyRmllbGRzLFxyXG4gICAgICAgICAgICBjcmVhdGVSZXNvbHZlcnMsXHJcbiAgICAgICAgYCk7XHJcbiAgICAgICAgdHlwZXMuZm9yRWFjaCh0eXBlID0+IGpzLndyaXRlTG4oYCAgICAke3R5cGUubmFtZX0sYCkpO1xyXG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXHJcbiAgICAgICAgfTtcclxuICAgICAgICBgKTtcclxuICAgIH1cclxuXHJcbiAgICBnZW5lcmF0ZShkYlR5cGVzKTtcclxuXHJcbiAgICBmb3IgKGNvbnN0IGU6IEludEVudW1EZWYgb2YgZW51bVR5cGVzLnZhbHVlcygpKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coYGV4cG9ydCBjb25zdCBRJHtlLm5hbWV9ID0ge2ApO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKE9iamVjdC5lbnRyaWVzKGUudmFsdWVzKS5tYXAoKFtuYW1lLCB2YWx1ZV0pID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIGAgICAgJHtuYW1lfTogJHsodmFsdWU6IGFueSl9LGA7XHJcbiAgICAgICAgfSkuam9pbignXFxuJykpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGB9O1xcbmApO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgcWw6IGcuZ2VuZXJhdGVkKCksXHJcbiAgICAgICAganM6IGpzLmdlbmVyYXRlZCgpLFxyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBtYWluO1xyXG4iXX0=