"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _gen = require("ton-labs-dev-ops/dist/src/gen.js");

var _schema = require("ton-labs-dev-ops/dist/src/schema.js");

var DbTypeCategory = {
  unresolved: 'unresolved',
  scalar: 'scalar',
  union: 'union',
  struct: 'struct'
};

function scalarType(name) {
  return {
    name: name,
    category: DbTypeCategory.scalar,
    fields: []
  };
}

var scalarTypes = {
  "int": scalarType('Int'),
  uint64: scalarType('String'),
  uint1024: scalarType('String'),
  "float": scalarType('Float'),
  "boolean": scalarType('Boolean'),
  string: scalarType('String')
};

function unresolvedType(name) {
  return {
    name: name,
    category: DbTypeCategory.unresolved,
    fields: []
  };
}

function main(schemaDef) {
  var dbTypes = [];
  var lastReportedType = '';

  function reportType(name, field, type) {
    if (name !== lastReportedType) {
      console.log(name);
      lastReportedType = name;
    }

    console.log("    ".concat(field, ": ").concat(type));
  }

  function getIntType(t) {
    if (t["int"] && t["int"].unsigned) {
      return "u".concat(t["int"].unsigned);
    } else if (t["int"] && t["int"].signed) {
      return "i".concat(t["int"].signed);
    } else {
      return 'i32';
    }
  }

  function parseDbField(typeName, schemaField) {
    var schemaType = schemaField;
    var field = {
      name: schemaField.name,
      arrayDepth: 0,
      type: scalarTypes.string
    };

    while (schemaType.array) {
      field.arrayDepth += 1;
      schemaType = schemaType.array;
    }

    var join = schemaType._.join;

    if (join) {
      field.join = join;
    }

    if (schemaType.union || schemaType.struct) {
      field.type = unresolvedType((0, _gen.makeFieldTypeName)(typeName, schemaField.name));
    } else if (schemaType.ref) {
      field.type = unresolvedType(schemaType.ref.name);
    } else if (schemaType.bool) {
      field.type = scalarTypes["boolean"];
    } else if (schemaType["int"]) {
      var uintSize = schemaType["int"].unsigned;

      if (uintSize) {
        if (uintSize >= 128) {
          reportType(typeName, field.name, 'u1024');
          field.type = scalarTypes.uint1024;
        } else if (uintSize >= 64) {
          reportType(typeName, field.name, 'u64');
          field.type = scalarTypes.uint64;
        } else if (uintSize >= 32) {
          reportType(typeName, field.name, 'u32');
          field.type = scalarTypes["float"];
        } else {
          reportType(typeName, field.name, "u".concat(uintSize));
          field.type = scalarTypes["int"];
        }
      } else {
        var intSize = schemaType["int"].signed;

        if (intSize && intSize > 32) {
          throw new Error("Integer type with size ".concat(intSize, " bit does not supported"));
        } else {
          reportType(typeName, field.name, 'i32');
          field.type = scalarTypes["int"];
        }
      }
    } else if (schemaType["float"]) {
      reportType(typeName, field.name, 'float');
      field.type = scalarTypes["float"];
    } else if (schemaType.string) {
      field.type = scalarTypes.string;
    } else {
      field.type = scalarTypes.string;
      console.log('>>> Invalid field type: ', JSON.stringify(schemaType));
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
    var struct = schemaType.union || schemaType.struct;

    if (!struct) {
      console.log('>>>', "?? ".concat(name, ": ").concat(JSON.stringify(schemaType).substr(0, 20)));
      return;
    }

    var type = {
      name: name,
      category: schemaType.union ? DbTypeCategory.union : DbTypeCategory.struct,
      fields: [],
      collection: schemaType._.collection
    };

    if (type.collection) {
      type.fields.push({
        name: 'id',
        arrayDepth: 0,
        type: scalarTypes.string
      });
    }

    struct.forEach(function (field) {
      type.fields.push(parseDbField(name, field));
      var unwrapped = unwrapArrays(field);
      var ownType = unwrapped.struct || unwrapped.union ? unwrapped : null;

      if (ownType) {
        parseDbType((0, _gen.makeFieldTypeName)(name, field.name), ownType);
      }
    });
    dbTypes.push(type);
  }

  function parseDbTypes(types) {
    types.forEach(function (type) {
      parseDbType(type.name, type);
    });
    var unresolved = new Map();
    var resolving = new Set();
    var resolved = new Map();
    var orderedResolved = [];
    dbTypes.forEach(function (t) {
      return unresolved.set(t.name, t);
    });

    var resolveType = function resolveType(type) {
      if (resolved.has(type.name)) {
        return;
      }

      if (resolving.has(type.name)) {
        console.log('>>>', "Circular reference to type ".concat(type.name));
        process.exit(1);
      }

      resolving.add(type.name);
      type.fields.forEach(function (field) {
        if (field.type.category === DbTypeCategory.unresolved) {
          var _type = resolved.get(field.type.name);

          if (!_type) {
            _type = unresolved.get(field.type.name);

            if (_type) {
              resolveType(_type);
            } else {
              console.log('>>>', "Referenced type not found: ".concat(field.type.name));
              process.exit(1);
            }
          }

          if (_type) {
            field.type = _type;
          }
        }
      });
      resolving["delete"](type.name);
      orderedResolved.push(type);
      unresolved["delete"](type.name);
      resolved.set(type.name, type);
    };

    dbTypes.forEach(resolveType);
    dbTypes = orderedResolved;
  } // Generators


  var ql = new _gen.Writer();
  var js = new _gen.Writer();

  function unionVariantType(type, variant) {
    return "".concat(type.name).concat(variant.name, "Variant");
  }

  function genQLTypeDeclarationsForUnionVariants(type) {
    type.fields.forEach(function (variant) {
      ql.writeBlockLn("\n        type ".concat(unionVariantType(type, variant), " {\n            ").concat(variant.name, ": ").concat(variant.type.name, "\n        }\n\n        "));
    });
  }

  function genQLTypeDeclaration(type) {
    if (type.category === DbTypeCategory.union) {
      genQLTypeDeclarationsForUnionVariants(type);
      ql.writeLn("union ".concat(type.name, " = "));
      type.fields.forEach(function (variant) {
        ql.writeLn("\t| ".concat(unionVariantType(type, variant)));
      });
      ql.writeLn();
    } else {
      ql.writeLn("type ".concat(type.name, " {"));
      type.fields.forEach(function (field) {
        var typeDeclaration = '['.repeat(field.arrayDepth) + field.type.name + ']'.repeat(field.arrayDepth);
        ql.writeLn("\t".concat(field.name, ": ").concat(typeDeclaration));
      });
      ql.writeLn("}");
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
    type.fields.forEach(function (field) {
      var itemTypeName = field.type.name;

      var _loop = function _loop(i) {
        var filterName = "".concat(itemTypeName, "ArrayFilter");
        preventTwice(filterName, qlNames, function () {
          ql.writeLn("input ".concat(filterName, " {"));
          ['any', 'all'].forEach(function (op) {
            ql.writeLn("\t".concat(op, ": ").concat(itemTypeName, "Filter"));
          });
          ql.writeLn('}');
          ql.writeLn();
        });
        itemTypeName += 'Array';
      };

      for (var i = 0; i < field.arrayDepth; i += 1) {
        _loop(i);
      }
    });
  }

  function genQLFilter(type, qlNames) {
    if (type.fields.length === 0) {
      return;
    }

    genQLFiltersForArrayFields(type, qlNames);
    ql.writeLn("input ".concat(type.name, "Filter {"));
    type.fields.forEach(function (field) {
      var typeDeclaration = field.type.name + "Array".repeat(field.arrayDepth);
      ql.writeLn("\t".concat(field.name, ": ").concat(typeDeclaration, "Filter"));
    });
    ql.writeLn("}");
    ql.writeLn();
  }

  function genQLScalarTypesFilter(name) {
    ql.writeLn("input ".concat(name, "Filter {"));
    ['eq', 'ne', 'gt', 'lt', 'ge', 'le'].forEach(function (op) {
      ql.writeLn("\t".concat(op, ": ").concat(name));
    });
    ['in', 'notIn'].forEach(function (op) {
      ql.writeLn("\t".concat(op, ": [").concat(name, "]"));
    });
    ql.writeLn('}');
    ql.writeLn();
  }

  function genQLQueries(types) {
    ql.writeBlockLn("\n        enum QueryOrderByDirection {\n            ASC\n            DESC\n        }\n\n        input QueryOrderBy {\n            path: String\n            direction: QueryOrderByDirection\n        }\n\n        type Query {\n        ");
    types.forEach(function (type) {
      ql.writeLn("\t".concat(type.collection || '', "(filter: ").concat(type.name, "Filter, orderBy: [QueryOrderBy], limit: Int): [").concat(type.name, "]"));
    });
    ql.writeBlockLn("\n            select(query: String!, bindVarsJson: String!): String!\n        }\n\n        ");
  }

  function genQLSubscriptions(types) {
    ql.writeLn('type Subscription {');
    types.forEach(function (type) {
      ql.writeLn("\t".concat(type.collection || '', "(filter: ").concat(type.name, "Filter): ").concat(type.name));
    });
    ql.writeLn('}');
  }

  function genJSFiltersForArrayFields(type, jsNames) {
    type.fields.forEach(function (field) {
      var itemTypeName = field.type.name;

      var _loop2 = function _loop2(i) {
        var filterName = "".concat(itemTypeName, "Array");
        preventTwice(filterName, jsNames, function () {
          js.writeBlockLn("\n                const ".concat(filterName, " = array(").concat(itemTypeName, ");\n                "));
        });
        itemTypeName += 'Array';
      };

      for (var i = 0; i < field.arrayDepth; i += 1) {
        _loop2(i);
      }
    });
  }

  function genJSStructFilter(type) {
    js.writeBlockLn("\n        const ".concat(type.name, " = struct({\n    "));
    type.fields.forEach(function (field) {
      var typeDeclaration = null;
      var join = field.join;

      if (join) {
        typeDeclaration = "join".concat(field.arrayDepth > 0 ? 'Array' : '', "('").concat(join.on, "', '").concat(field.type.collection || '', "', ").concat(field.type.name, ")");
      } else if (field.arrayDepth > 0) {
        typeDeclaration = field.type.name + 'Array'.repeat(field.arrayDepth);
      } else if (field.type.category === DbTypeCategory.scalar) {
        if (field.type === scalarTypes.uint64) {
          typeDeclaration = 'bigUInt1';
        } else if (field.type === scalarTypes.uint1024) {
          typeDeclaration = 'bigUInt2';
        } else {
          typeDeclaration = 'scalar';
        }
      } else if (field.type.fields.length > 0) {
        typeDeclaration = field.type.name;
      }

      if (typeDeclaration) {
        js.writeLn("    ".concat(field.name, ": ").concat(typeDeclaration, ","));
      }
    });
    js.writeBlockLn("\n        }".concat(type.collection ? ', true' : '', ");\n\n    "));
  }

  function genJSUnionResolver(type) {
    js.writeBlockLn("\n        const ".concat(type.name, "Resolver = {\n            __resolveType(obj, context, info) {\n        "));
    type.fields.forEach(function (variant) {
      js.writeLn("        if ('".concat(variant.name, "' in obj) {"));
      js.writeLn("            return '".concat(unionVariantType(type, variant), "';"));
      js.writeLn("        }");
    });
    js.writeBlockLn("\n                return null;\n            }\n        };\n\n        ");
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
    var joinFields = type.fields.filter(function (x) {
      return !!x.join;
    });
    var bigUIntFields = type.fields.filter(function (x) {
      return x.type === scalarTypes.uint64 || x.type === scalarTypes.uint1024;
    });
    var customResolverRequired = type.collection || joinFields.length > 0 || bigUIntFields.length > 0;

    if (!customResolverRequired) {
      return;
    }

    js.writeLn("        ".concat(type.name, ": {"));

    if (type.collection) {
      js.writeLn('            id(parent) {');
      js.writeLn('                return parent._key;');
      js.writeLn('            },');
    }

    joinFields.forEach(function (field) {
      var onField = type.fields.find(function (x) {
        return x.name === (field.join && field.join.on) || '';
      });

      if (!onField) {
        throw 'Join on field does not exist.';
      }

      var collection = field.type.collection;

      if (!collection) {
        throw 'Joined type is not a collection.';
      }

      js.writeLn("            ".concat(field.name, "(parent) {"));

      if (field.arrayDepth === 0) {
        js.writeLn("                return db.fetchDocByKey(db.".concat(collection, ", parent.").concat(onField.name, ");"));
      } else if (field.arrayDepth === 1) {
        js.writeLn("                return db.fetchDocsByKeys(db.".concat(collection, ", parent.").concat(onField.name, ");"));
      } else {
        throw 'Joins on a nested arrays does not supported.';
      }

      js.writeLn("            },");
    });
    bigUIntFields.forEach(function (field) {
      var prefixLength = field.type === scalarTypes.uint64 ? 1 : 2;
      js.writeLn("            ".concat(field.name, "(parent) {"));
      js.writeLn("                return resolveBigUInt(".concat(prefixLength, ", parent.").concat(field.name, ");"));
      js.writeLn("            },");
    });
    js.writeLn("        },");
  }

  function genJSTypeResolversForUnion(type) {
    if (type.category === DbTypeCategory.union) {
      js.writeLn("        ".concat(type.name, ": ").concat(type.name, "Resolver,"));
    }
  }

  function generate(types) {
    // QL
    ['String', 'Boolean', 'Int', 'Float'].forEach(genQLScalarTypesFilter);
    types.forEach(function (type) {
      return genQLTypeDeclaration(type);
    });
    var qlArrayFilters = new Set();
    types.forEach(function (type) {
      return genQLFilter(type, qlArrayFilters);
    });
    var collections = types.filter(function (t) {
      return !!t.collection;
    });
    genQLQueries(collections);
    genQLSubscriptions(collections); // JS

    js.writeBlockLn("\n        const { scalar, bigUInt1, bigUInt2, resolveBigUInt, struct, array, join, joinArray } = require('./arango-types.js');\n        ");
    var jsArrayFilters = new Set();
    types.forEach(function (type) {
      return genJSFilter(type, jsArrayFilters);
    });
    js.writeBlockLn("\n        function createResolvers(db) {\n            return {\n        ");
    types.forEach(function (type) {
      genJSCustomResolvers(type);
      genJSTypeResolversForUnion(type);
    });
    js.writeLn('        Query: {');
    collections.forEach(function (type) {
      js.writeLn("            ".concat(type.collection || '', ": db.collectionQuery(db.").concat(type.collection || '', ", ").concat(type.name, "),"));
    });
    js.writeLn('            select: db.selectQuery(),');
    js.writeLn('        },');
    js.writeLn('        Subscription: {');
    collections.forEach(function (type) {
      js.writeLn("            ".concat(type.collection || '', ": db.collectionSubscription(db.").concat(type.collection || '', ", ").concat(type.name, "),"));
    });
    js.writeBlockLn("\n                }\n            }\n        }\n        ");
    js.writeBlockLn("\n        module.exports = {\n            createResolvers\n        };\n        ");
  }

  var schema = (0, _schema.parseTypeDef)(schemaDef);

  if (schema["class"]) {
    parseDbTypes(schema["class"].types);
    generate(dbTypes);
  }

  return {
    ql: ql.generated(),
    js: js.generated()
  };
}

var _default = main;
exports["default"] = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9nZW4tcWwtanMuanMiXSwibmFtZXMiOlsiRGJUeXBlQ2F0ZWdvcnkiLCJ1bnJlc29sdmVkIiwic2NhbGFyIiwidW5pb24iLCJzdHJ1Y3QiLCJzY2FsYXJUeXBlIiwibmFtZSIsImNhdGVnb3J5IiwiZmllbGRzIiwic2NhbGFyVHlwZXMiLCJ1aW50NjQiLCJ1aW50MTAyNCIsInN0cmluZyIsInVucmVzb2x2ZWRUeXBlIiwibWFpbiIsInNjaGVtYURlZiIsImRiVHlwZXMiLCJsYXN0UmVwb3J0ZWRUeXBlIiwicmVwb3J0VHlwZSIsImZpZWxkIiwidHlwZSIsImNvbnNvbGUiLCJsb2ciLCJnZXRJbnRUeXBlIiwidCIsInVuc2lnbmVkIiwic2lnbmVkIiwicGFyc2VEYkZpZWxkIiwidHlwZU5hbWUiLCJzY2hlbWFGaWVsZCIsInNjaGVtYVR5cGUiLCJhcnJheURlcHRoIiwiYXJyYXkiLCJqb2luIiwiXyIsInJlZiIsImJvb2wiLCJ1aW50U2l6ZSIsImludFNpemUiLCJFcnJvciIsIkpTT04iLCJzdHJpbmdpZnkiLCJwcm9jZXNzIiwiZXhpdCIsInVud3JhcEFycmF5cyIsInBhcnNlRGJUeXBlIiwic3Vic3RyIiwiY29sbGVjdGlvbiIsInB1c2giLCJmb3JFYWNoIiwidW53cmFwcGVkIiwib3duVHlwZSIsInBhcnNlRGJUeXBlcyIsInR5cGVzIiwiTWFwIiwicmVzb2x2aW5nIiwiU2V0IiwicmVzb2x2ZWQiLCJvcmRlcmVkUmVzb2x2ZWQiLCJzZXQiLCJyZXNvbHZlVHlwZSIsImhhcyIsImFkZCIsImdldCIsInFsIiwiV3JpdGVyIiwianMiLCJ1bmlvblZhcmlhbnRUeXBlIiwidmFyaWFudCIsImdlblFMVHlwZURlY2xhcmF0aW9uc0ZvclVuaW9uVmFyaWFudHMiLCJ3cml0ZUJsb2NrTG4iLCJnZW5RTFR5cGVEZWNsYXJhdGlvbiIsIndyaXRlTG4iLCJ0eXBlRGVjbGFyYXRpb24iLCJyZXBlYXQiLCJwcmV2ZW50VHdpY2UiLCJuYW1lcyIsIndvcmsiLCJnZW5RTEZpbHRlcnNGb3JBcnJheUZpZWxkcyIsInFsTmFtZXMiLCJpdGVtVHlwZU5hbWUiLCJpIiwiZmlsdGVyTmFtZSIsIm9wIiwiZ2VuUUxGaWx0ZXIiLCJsZW5ndGgiLCJnZW5RTFNjYWxhclR5cGVzRmlsdGVyIiwiZ2VuUUxRdWVyaWVzIiwiZ2VuUUxTdWJzY3JpcHRpb25zIiwiZ2VuSlNGaWx0ZXJzRm9yQXJyYXlGaWVsZHMiLCJqc05hbWVzIiwiZ2VuSlNTdHJ1Y3RGaWx0ZXIiLCJvbiIsImdlbkpTVW5pb25SZXNvbHZlciIsImdlbkpTRmlsdGVyIiwiZ2VuSlNDdXN0b21SZXNvbHZlcnMiLCJqb2luRmllbGRzIiwiZmlsdGVyIiwieCIsImJpZ1VJbnRGaWVsZHMiLCJjdXN0b21SZXNvbHZlclJlcXVpcmVkIiwib25GaWVsZCIsImZpbmQiLCJwcmVmaXhMZW5ndGgiLCJnZW5KU1R5cGVSZXNvbHZlcnNGb3JVbmlvbiIsImdlbmVyYXRlIiwicWxBcnJheUZpbHRlcnMiLCJjb2xsZWN0aW9ucyIsImpzQXJyYXlGaWx0ZXJzIiwic2NoZW1hIiwiZ2VuZXJhdGVkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBRUE7O0FBRUE7O0FBRUEsSUFBTUEsY0FBYyxHQUFHO0FBQ25CQyxFQUFBQSxVQUFVLEVBQUUsWUFETztBQUVuQkMsRUFBQUEsTUFBTSxFQUFFLFFBRlc7QUFHbkJDLEVBQUFBLEtBQUssRUFBRSxPQUhZO0FBSW5CQyxFQUFBQSxNQUFNLEVBQUU7QUFKVyxDQUF2Qjs7QUEwQkEsU0FBU0MsVUFBVCxDQUFvQkMsSUFBcEIsRUFBMEM7QUFDdEMsU0FBTztBQUNIQSxJQUFBQSxJQUFJLEVBQUpBLElBREc7QUFFSEMsSUFBQUEsUUFBUSxFQUFFUCxjQUFjLENBQUNFLE1BRnRCO0FBR0hNLElBQUFBLE1BQU0sRUFBRTtBQUhMLEdBQVA7QUFLSDs7QUFFRCxJQUFNQyxXQUFXLEdBQUc7QUFDaEIsU0FBS0osVUFBVSxDQUFDLEtBQUQsQ0FEQztBQUVoQkssRUFBQUEsTUFBTSxFQUFFTCxVQUFVLENBQUMsUUFBRCxDQUZGO0FBR2hCTSxFQUFBQSxRQUFRLEVBQUVOLFVBQVUsQ0FBQyxRQUFELENBSEo7QUFJaEIsV0FBT0EsVUFBVSxDQUFDLE9BQUQsQ0FKRDtBQUtoQixhQUFTQSxVQUFVLENBQUMsU0FBRCxDQUxIO0FBTWhCTyxFQUFBQSxNQUFNLEVBQUVQLFVBQVUsQ0FBQyxRQUFEO0FBTkYsQ0FBcEI7O0FBU0EsU0FBU1EsY0FBVCxDQUF3QlAsSUFBeEIsRUFBOEM7QUFDMUMsU0FBTztBQUNIQSxJQUFBQSxJQUFJLEVBQUpBLElBREc7QUFFSEMsSUFBQUEsUUFBUSxFQUFFUCxjQUFjLENBQUNDLFVBRnRCO0FBR0hPLElBQUFBLE1BQU0sRUFBRTtBQUhMLEdBQVA7QUFLSDs7QUFFRCxTQUFTTSxJQUFULENBQWNDLFNBQWQsRUFBa0M7QUFFOUIsTUFBSUMsT0FBaUIsR0FBRyxFQUF4QjtBQUNBLE1BQUlDLGdCQUF3QixHQUFHLEVBQS9COztBQUVBLFdBQVNDLFVBQVQsQ0FBb0JaLElBQXBCLEVBQWtDYSxLQUFsQyxFQUFpREMsSUFBakQsRUFBK0Q7QUFDM0QsUUFBSWQsSUFBSSxLQUFLVyxnQkFBYixFQUErQjtBQUMzQkksTUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVloQixJQUFaO0FBQ0FXLE1BQUFBLGdCQUFnQixHQUFHWCxJQUFuQjtBQUNIOztBQUNEZSxJQUFBQSxPQUFPLENBQUNDLEdBQVIsZUFBbUJILEtBQW5CLGVBQTZCQyxJQUE3QjtBQUVIOztBQUVELFdBQVNHLFVBQVQsQ0FBb0JDLENBQXBCLEVBQTJDO0FBQ3ZDLFFBQUlBLENBQUMsT0FBRCxJQUFTQSxDQUFDLE9BQUQsQ0FBTUMsUUFBbkIsRUFBNkI7QUFDekIsd0JBQVlELENBQUMsT0FBRCxDQUFNQyxRQUFsQjtBQUNILEtBRkQsTUFFTyxJQUFJRCxDQUFDLE9BQUQsSUFBU0EsQ0FBQyxPQUFELENBQU1FLE1BQW5CLEVBQTJCO0FBQzlCLHdCQUFZRixDQUFDLE9BQUQsQ0FBTUUsTUFBbEI7QUFDSCxLQUZNLE1BRUE7QUFDSCxhQUFPLEtBQVA7QUFDSDtBQUNKOztBQUVELFdBQVNDLFlBQVQsQ0FDSUMsUUFESixFQUVJQyxXQUZKLEVBR1c7QUFDUCxRQUFJQyxVQUFVLEdBQUdELFdBQWpCO0FBQ0EsUUFBTVYsS0FBYyxHQUFHO0FBQ25CYixNQUFBQSxJQUFJLEVBQUV1QixXQUFXLENBQUN2QixJQURDO0FBRW5CeUIsTUFBQUEsVUFBVSxFQUFFLENBRk87QUFHbkJYLE1BQUFBLElBQUksRUFBRVgsV0FBVyxDQUFDRztBQUhDLEtBQXZCOztBQUtBLFdBQU9rQixVQUFVLENBQUNFLEtBQWxCLEVBQXlCO0FBQ3JCYixNQUFBQSxLQUFLLENBQUNZLFVBQU4sSUFBb0IsQ0FBcEI7QUFDQUQsTUFBQUEsVUFBVSxHQUFHQSxVQUFVLENBQUNFLEtBQXhCO0FBQ0g7O0FBQ0QsUUFBTUMsSUFBSSxHQUFJSCxVQUFELENBQWtCSSxDQUFsQixDQUFvQkQsSUFBakM7O0FBQ0EsUUFBSUEsSUFBSixFQUFVO0FBQ05kLE1BQUFBLEtBQUssQ0FBQ2MsSUFBTixHQUFhQSxJQUFiO0FBQ0g7O0FBQ0QsUUFBSUgsVUFBVSxDQUFDM0IsS0FBWCxJQUFvQjJCLFVBQVUsQ0FBQzFCLE1BQW5DLEVBQTJDO0FBQ3ZDZSxNQUFBQSxLQUFLLENBQUNDLElBQU4sR0FBYVAsY0FBYyxDQUFDLDRCQUFrQmUsUUFBbEIsRUFBNEJDLFdBQVcsQ0FBQ3ZCLElBQXhDLENBQUQsQ0FBM0I7QUFDSCxLQUZELE1BRU8sSUFBSXdCLFVBQVUsQ0FBQ0ssR0FBZixFQUFvQjtBQUN2QmhCLE1BQUFBLEtBQUssQ0FBQ0MsSUFBTixHQUFhUCxjQUFjLENBQUNpQixVQUFVLENBQUNLLEdBQVgsQ0FBZTdCLElBQWhCLENBQTNCO0FBQ0gsS0FGTSxNQUVBLElBQUl3QixVQUFVLENBQUNNLElBQWYsRUFBcUI7QUFDeEJqQixNQUFBQSxLQUFLLENBQUNDLElBQU4sR0FBYVgsV0FBVyxXQUF4QjtBQUNILEtBRk0sTUFFQSxJQUFJcUIsVUFBVSxPQUFkLEVBQW9CO0FBQ3ZCLFVBQU1PLFFBQWdCLEdBQUlQLFVBQVUsT0FBWCxDQUFzQkwsUUFBL0M7O0FBQ0EsVUFBSVksUUFBSixFQUFjO0FBQ1YsWUFBSUEsUUFBUSxJQUFJLEdBQWhCLEVBQXFCO0FBQ2pCbkIsVUFBQUEsVUFBVSxDQUFDVSxRQUFELEVBQVdULEtBQUssQ0FBQ2IsSUFBakIsRUFBdUIsT0FBdkIsQ0FBVjtBQUNBYSxVQUFBQSxLQUFLLENBQUNDLElBQU4sR0FBYVgsV0FBVyxDQUFDRSxRQUF6QjtBQUNILFNBSEQsTUFHTyxJQUFJMEIsUUFBUSxJQUFJLEVBQWhCLEVBQW9CO0FBQ3ZCbkIsVUFBQUEsVUFBVSxDQUFDVSxRQUFELEVBQVdULEtBQUssQ0FBQ2IsSUFBakIsRUFBdUIsS0FBdkIsQ0FBVjtBQUNBYSxVQUFBQSxLQUFLLENBQUNDLElBQU4sR0FBYVgsV0FBVyxDQUFDQyxNQUF6QjtBQUNILFNBSE0sTUFHQSxJQUFJMkIsUUFBUSxJQUFJLEVBQWhCLEVBQW9CO0FBQ3ZCbkIsVUFBQUEsVUFBVSxDQUFDVSxRQUFELEVBQVdULEtBQUssQ0FBQ2IsSUFBakIsRUFBdUIsS0FBdkIsQ0FBVjtBQUNBYSxVQUFBQSxLQUFLLENBQUNDLElBQU4sR0FBYVgsV0FBVyxTQUF4QjtBQUNILFNBSE0sTUFHQTtBQUNIUyxVQUFBQSxVQUFVLENBQUNVLFFBQUQsRUFBV1QsS0FBSyxDQUFDYixJQUFqQixhQUEyQitCLFFBQTNCLEVBQVY7QUFDQWxCLFVBQUFBLEtBQUssQ0FBQ0MsSUFBTixHQUFhWCxXQUFXLE9BQXhCO0FBQ0g7QUFDSixPQWRELE1BY087QUFDSCxZQUFNNkIsT0FBZSxHQUFJUixVQUFVLE9BQVgsQ0FBc0JKLE1BQTlDOztBQUNBLFlBQUlZLE9BQU8sSUFBSUEsT0FBTyxHQUFHLEVBQXpCLEVBQTZCO0FBQ3pCLGdCQUFNLElBQUlDLEtBQUosa0NBQW9DRCxPQUFwQyw2QkFBTjtBQUNILFNBRkQsTUFFTztBQUNIcEIsVUFBQUEsVUFBVSxDQUFDVSxRQUFELEVBQVdULEtBQUssQ0FBQ2IsSUFBakIsRUFBdUIsS0FBdkIsQ0FBVjtBQUNBYSxVQUFBQSxLQUFLLENBQUNDLElBQU4sR0FBYVgsV0FBVyxPQUF4QjtBQUNIO0FBQ0o7QUFDSixLQXpCTSxNQXlCQSxJQUFJcUIsVUFBVSxTQUFkLEVBQXNCO0FBQ3pCWixNQUFBQSxVQUFVLENBQUNVLFFBQUQsRUFBV1QsS0FBSyxDQUFDYixJQUFqQixFQUF1QixPQUF2QixDQUFWO0FBQ0FhLE1BQUFBLEtBQUssQ0FBQ0MsSUFBTixHQUFhWCxXQUFXLFNBQXhCO0FBQ0gsS0FITSxNQUdBLElBQUlxQixVQUFVLENBQUNsQixNQUFmLEVBQXVCO0FBQzFCTyxNQUFBQSxLQUFLLENBQUNDLElBQU4sR0FBYVgsV0FBVyxDQUFDRyxNQUF6QjtBQUNILEtBRk0sTUFFQTtBQUNITyxNQUFBQSxLQUFLLENBQUNDLElBQU4sR0FBYVgsV0FBVyxDQUFDRyxNQUF6QjtBQUNBUyxNQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSwwQkFBWixFQUF3Q2tCLElBQUksQ0FBQ0MsU0FBTCxDQUFlWCxVQUFmLENBQXhDO0FBQ0FZLE1BQUFBLE9BQU8sQ0FBQ0MsSUFBUixDQUFhLENBQWI7QUFDSDs7QUFDRCxXQUFPeEIsS0FBUDtBQUNIOztBQUVELFdBQVN5QixZQUFULENBQXNCeEIsSUFBdEIsRUFBb0Q7QUFDaEQsUUFBSUEsSUFBSSxDQUFDWSxLQUFULEVBQWdCO0FBQ1osYUFBT1ksWUFBWSxDQUFDeEIsSUFBSSxDQUFDWSxLQUFOLENBQW5CO0FBQ0g7O0FBQ0QsV0FBT1osSUFBUDtBQUNIOztBQUVELFdBQVN5QixXQUFULENBQ0l2QyxJQURKLEVBRUl3QixVQUZKLEVBR0U7QUFDRSxRQUFNMUIsTUFBTSxHQUFHMEIsVUFBVSxDQUFDM0IsS0FBWCxJQUFvQjJCLFVBQVUsQ0FBQzFCLE1BQTlDOztBQUNBLFFBQUksQ0FBQ0EsTUFBTCxFQUFhO0FBQ1RpQixNQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSxLQUFaLGVBQXlCaEIsSUFBekIsZUFBa0NrQyxJQUFJLENBQUNDLFNBQUwsQ0FBZVgsVUFBZixFQUEyQmdCLE1BQTNCLENBQWtDLENBQWxDLEVBQXFDLEVBQXJDLENBQWxDO0FBQ0E7QUFDSDs7QUFDRCxRQUFNMUIsSUFBWSxHQUFHO0FBQ2pCZCxNQUFBQSxJQUFJLEVBQUpBLElBRGlCO0FBRWpCQyxNQUFBQSxRQUFRLEVBQUV1QixVQUFVLENBQUMzQixLQUFYLEdBQW1CSCxjQUFjLENBQUNHLEtBQWxDLEdBQTBDSCxjQUFjLENBQUNJLE1BRmxEO0FBR2pCSSxNQUFBQSxNQUFNLEVBQUUsRUFIUztBQUlqQnVDLE1BQUFBLFVBQVUsRUFBR2pCLFVBQUQsQ0FBa0JJLENBQWxCLENBQW9CYTtBQUpmLEtBQXJCOztBQU9BLFFBQUkzQixJQUFJLENBQUMyQixVQUFULEVBQXFCO0FBQ2pCM0IsTUFBQUEsSUFBSSxDQUFDWixNQUFMLENBQVl3QyxJQUFaLENBQWlCO0FBQ2IxQyxRQUFBQSxJQUFJLEVBQUUsSUFETztBQUVieUIsUUFBQUEsVUFBVSxFQUFFLENBRkM7QUFHYlgsUUFBQUEsSUFBSSxFQUFFWCxXQUFXLENBQUNHO0FBSEwsT0FBakI7QUFLSDs7QUFDRFIsSUFBQUEsTUFBTSxDQUFDNkMsT0FBUCxDQUFlLFVBQUM5QixLQUFELEVBQVc7QUFDdEJDLE1BQUFBLElBQUksQ0FBQ1osTUFBTCxDQUFZd0MsSUFBWixDQUFpQnJCLFlBQVksQ0FBQ3JCLElBQUQsRUFBT2EsS0FBUCxDQUE3QjtBQUNBLFVBQU0rQixTQUFTLEdBQUdOLFlBQVksQ0FBQ3pCLEtBQUQsQ0FBOUI7QUFDQSxVQUFNZ0MsT0FBTyxHQUFJRCxTQUFTLENBQUM5QyxNQUFWLElBQW9COEMsU0FBUyxDQUFDL0MsS0FBL0IsR0FBd0MrQyxTQUF4QyxHQUFvRCxJQUFwRTs7QUFDQSxVQUFJQyxPQUFKLEVBQWE7QUFDVE4sUUFBQUEsV0FBVyxDQUFDLDRCQUFrQnZDLElBQWxCLEVBQXdCYSxLQUFLLENBQUNiLElBQTlCLENBQUQsRUFBc0M2QyxPQUF0QyxDQUFYO0FBQ0g7QUFDSixLQVBEO0FBUUFuQyxJQUFBQSxPQUFPLENBQUNnQyxJQUFSLENBQWE1QixJQUFiO0FBQ0g7O0FBRUQsV0FBU2dDLFlBQVQsQ0FBc0JDLEtBQXRCLEVBQXlEO0FBQ3JEQSxJQUFBQSxLQUFLLENBQUNKLE9BQU4sQ0FBYyxVQUFDN0IsSUFBRCxFQUFvQztBQUM5Q3lCLE1BQUFBLFdBQVcsQ0FBQ3pCLElBQUksQ0FBQ2QsSUFBTixFQUFZYyxJQUFaLENBQVg7QUFDSCxLQUZEO0FBR0EsUUFBTW5CLFVBQStCLEdBQUcsSUFBSXFELEdBQUosRUFBeEM7QUFDQSxRQUFNQyxTQUFzQixHQUFHLElBQUlDLEdBQUosRUFBL0I7QUFDQSxRQUFNQyxRQUE2QixHQUFHLElBQUlILEdBQUosRUFBdEM7QUFDQSxRQUFNSSxlQUF5QixHQUFHLEVBQWxDO0FBQ0ExQyxJQUFBQSxPQUFPLENBQUNpQyxPQUFSLENBQWdCLFVBQUF6QixDQUFDO0FBQUEsYUFBSXZCLFVBQVUsQ0FBQzBELEdBQVgsQ0FBZW5DLENBQUMsQ0FBQ2xCLElBQWpCLEVBQXVCa0IsQ0FBdkIsQ0FBSjtBQUFBLEtBQWpCOztBQUNBLFFBQU1vQyxXQUFXLEdBQUcsU0FBZEEsV0FBYyxDQUFDeEMsSUFBRCxFQUFrQjtBQUNsQyxVQUFJcUMsUUFBUSxDQUFDSSxHQUFULENBQWF6QyxJQUFJLENBQUNkLElBQWxCLENBQUosRUFBNkI7QUFDekI7QUFDSDs7QUFDRCxVQUFJaUQsU0FBUyxDQUFDTSxHQUFWLENBQWN6QyxJQUFJLENBQUNkLElBQW5CLENBQUosRUFBOEI7QUFDMUJlLFFBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLEtBQVosdUNBQWlERixJQUFJLENBQUNkLElBQXREO0FBQ0FvQyxRQUFBQSxPQUFPLENBQUNDLElBQVIsQ0FBYSxDQUFiO0FBQ0g7O0FBQ0RZLE1BQUFBLFNBQVMsQ0FBQ08sR0FBVixDQUFjMUMsSUFBSSxDQUFDZCxJQUFuQjtBQUNBYyxNQUFBQSxJQUFJLENBQUNaLE1BQUwsQ0FBWXlDLE9BQVosQ0FBb0IsVUFBQzlCLEtBQUQsRUFBVztBQUMzQixZQUFJQSxLQUFLLENBQUNDLElBQU4sQ0FBV2IsUUFBWCxLQUF3QlAsY0FBYyxDQUFDQyxVQUEzQyxFQUF1RDtBQUNuRCxjQUFJbUIsS0FBSSxHQUFHcUMsUUFBUSxDQUFDTSxHQUFULENBQWE1QyxLQUFLLENBQUNDLElBQU4sQ0FBV2QsSUFBeEIsQ0FBWDs7QUFDQSxjQUFJLENBQUNjLEtBQUwsRUFBVztBQUNQQSxZQUFBQSxLQUFJLEdBQUduQixVQUFVLENBQUM4RCxHQUFYLENBQWU1QyxLQUFLLENBQUNDLElBQU4sQ0FBV2QsSUFBMUIsQ0FBUDs7QUFDQSxnQkFBSWMsS0FBSixFQUFVO0FBQ053QyxjQUFBQSxXQUFXLENBQUN4QyxLQUFELENBQVg7QUFDSCxhQUZELE1BRU87QUFDSEMsY0FBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVksS0FBWix1Q0FBaURILEtBQUssQ0FBQ0MsSUFBTixDQUFXZCxJQUE1RDtBQUNBb0MsY0FBQUEsT0FBTyxDQUFDQyxJQUFSLENBQWEsQ0FBYjtBQUNIO0FBQ0o7O0FBQ0QsY0FBSXZCLEtBQUosRUFBVTtBQUNORCxZQUFBQSxLQUFLLENBQUNDLElBQU4sR0FBYUEsS0FBYjtBQUNIO0FBQ0o7QUFDSixPQWhCRDtBQWlCQW1DLE1BQUFBLFNBQVMsVUFBVCxDQUFpQm5DLElBQUksQ0FBQ2QsSUFBdEI7QUFDQW9ELE1BQUFBLGVBQWUsQ0FBQ1YsSUFBaEIsQ0FBcUI1QixJQUFyQjtBQUNBbkIsTUFBQUEsVUFBVSxVQUFWLENBQWtCbUIsSUFBSSxDQUFDZCxJQUF2QjtBQUNBbUQsTUFBQUEsUUFBUSxDQUFDRSxHQUFULENBQWF2QyxJQUFJLENBQUNkLElBQWxCLEVBQXdCYyxJQUF4QjtBQUNILEtBOUJEOztBQStCQUosSUFBQUEsT0FBTyxDQUFDaUMsT0FBUixDQUFnQlcsV0FBaEI7QUFDQTVDLElBQUFBLE9BQU8sR0FBRzBDLGVBQVY7QUFDSCxHQXpLNkIsQ0EyS2xDOzs7QUFFSSxNQUFNTSxFQUFFLEdBQUcsSUFBSUMsV0FBSixFQUFYO0FBQ0EsTUFBTUMsRUFBRSxHQUFHLElBQUlELFdBQUosRUFBWDs7QUFFQSxXQUFTRSxnQkFBVCxDQUEwQi9DLElBQTFCLEVBQXdDZ0QsT0FBeEMsRUFBa0U7QUFDOUQscUJBQVVoRCxJQUFJLENBQUNkLElBQWYsU0FBc0I4RCxPQUFPLENBQUM5RCxJQUE5QjtBQUNIOztBQUVELFdBQVMrRCxxQ0FBVCxDQUErQ2pELElBQS9DLEVBQTZEO0FBQ3pEQSxJQUFBQSxJQUFJLENBQUNaLE1BQUwsQ0FBWXlDLE9BQVosQ0FBb0IsVUFBQ21CLE9BQUQsRUFBYTtBQUM3QkosTUFBQUEsRUFBRSxDQUFDTSxZQUFILDBCQUNHSCxnQkFBZ0IsQ0FBQy9DLElBQUQsRUFBT2dELE9BQVAsQ0FEbkIsNkJBRUVBLE9BQU8sQ0FBQzlELElBRlYsZUFFbUI4RCxPQUFPLENBQUNoRCxJQUFSLENBQWFkLElBRmhDO0FBTUgsS0FQRDtBQVFIOztBQUVELFdBQVNpRSxvQkFBVCxDQUE4Qm5ELElBQTlCLEVBQTRDO0FBQ3hDLFFBQUlBLElBQUksQ0FBQ2IsUUFBTCxLQUFrQlAsY0FBYyxDQUFDRyxLQUFyQyxFQUE0QztBQUN4Q2tFLE1BQUFBLHFDQUFxQyxDQUFDakQsSUFBRCxDQUFyQztBQUNBNEMsTUFBQUEsRUFBRSxDQUFDUSxPQUFILGlCQUFvQnBELElBQUksQ0FBQ2QsSUFBekI7QUFDQWMsTUFBQUEsSUFBSSxDQUFDWixNQUFMLENBQVl5QyxPQUFaLENBQW9CLFVBQUFtQixPQUFPLEVBQUk7QUFDM0JKLFFBQUFBLEVBQUUsQ0FBQ1EsT0FBSCxlQUFrQkwsZ0JBQWdCLENBQUMvQyxJQUFELEVBQU9nRCxPQUFQLENBQWxDO0FBQ0gsT0FGRDtBQUdBSixNQUFBQSxFQUFFLENBQUNRLE9BQUg7QUFDSCxLQVBELE1BT087QUFDSFIsTUFBQUEsRUFBRSxDQUFDUSxPQUFILGdCQUFtQnBELElBQUksQ0FBQ2QsSUFBeEI7QUFDQWMsTUFBQUEsSUFBSSxDQUFDWixNQUFMLENBQVl5QyxPQUFaLENBQW9CLFVBQUE5QixLQUFLLEVBQUk7QUFDekIsWUFBTXNELGVBQWUsR0FDakIsSUFBSUMsTUFBSixDQUFXdkQsS0FBSyxDQUFDWSxVQUFqQixJQUNBWixLQUFLLENBQUNDLElBQU4sQ0FBV2QsSUFEWCxHQUVBLElBQUlvRSxNQUFKLENBQVd2RCxLQUFLLENBQUNZLFVBQWpCLENBSEo7QUFJQWlDLFFBQUFBLEVBQUUsQ0FBQ1EsT0FBSCxhQUFnQnJELEtBQUssQ0FBQ2IsSUFBdEIsZUFBK0JtRSxlQUEvQjtBQUNILE9BTkQ7QUFPQVQsTUFBQUEsRUFBRSxDQUFDUSxPQUFIO0FBQ0g7O0FBQ0RSLElBQUFBLEVBQUUsQ0FBQ1EsT0FBSDtBQUNIOztBQUVELFdBQVNHLFlBQVQsQ0FBc0JyRSxJQUF0QixFQUFvQ3NFLEtBQXBDLEVBQXdEQyxJQUF4RCxFQUEwRTtBQUN0RSxRQUFJLENBQUNELEtBQUssQ0FBQ2YsR0FBTixDQUFVdkQsSUFBVixDQUFMLEVBQXNCO0FBQ2xCc0UsTUFBQUEsS0FBSyxDQUFDZCxHQUFOLENBQVV4RCxJQUFWO0FBQ0F1RSxNQUFBQSxJQUFJO0FBQ1A7QUFDSjs7QUFFRCxXQUFTQywwQkFBVCxDQUFvQzFELElBQXBDLEVBQWtEMkQsT0FBbEQsRUFBd0U7QUFDcEUzRCxJQUFBQSxJQUFJLENBQUNaLE1BQUwsQ0FBWXlDLE9BQVosQ0FBb0IsVUFBQzlCLEtBQUQsRUFBVztBQUMzQixVQUFJNkQsWUFBWSxHQUFHN0QsS0FBSyxDQUFDQyxJQUFOLENBQVdkLElBQTlCOztBQUQyQixpQ0FFbEIyRSxDQUZrQjtBQUd2QixZQUFNQyxVQUFVLGFBQU1GLFlBQU4sZ0JBQWhCO0FBQ0FMLFFBQUFBLFlBQVksQ0FBQ08sVUFBRCxFQUFhSCxPQUFiLEVBQXNCLFlBQU07QUFDcENmLFVBQUFBLEVBQUUsQ0FBQ1EsT0FBSCxpQkFBb0JVLFVBQXBCO0FBQ0EsV0FBQyxLQUFELEVBQVEsS0FBUixFQUFlakMsT0FBZixDQUF1QixVQUFDa0MsRUFBRCxFQUFRO0FBQzNCbkIsWUFBQUEsRUFBRSxDQUFDUSxPQUFILGFBQWdCVyxFQUFoQixlQUF1QkgsWUFBdkI7QUFDSCxXQUZEO0FBR0FoQixVQUFBQSxFQUFFLENBQUNRLE9BQUgsQ0FBVyxHQUFYO0FBQ0FSLFVBQUFBLEVBQUUsQ0FBQ1EsT0FBSDtBQUVILFNBUlcsQ0FBWjtBQVNBUSxRQUFBQSxZQUFZLElBQUksT0FBaEI7QUFidUI7O0FBRTNCLFdBQUssSUFBSUMsQ0FBQyxHQUFHLENBQWIsRUFBZ0JBLENBQUMsR0FBRzlELEtBQUssQ0FBQ1ksVUFBMUIsRUFBc0NrRCxDQUFDLElBQUksQ0FBM0MsRUFBOEM7QUFBQSxjQUFyQ0EsQ0FBcUM7QUFZN0M7QUFDSixLQWZEO0FBZ0JIOztBQUVELFdBQVNHLFdBQVQsQ0FBcUJoRSxJQUFyQixFQUFtQzJELE9BQW5DLEVBQXlEO0FBQ3JELFFBQUkzRCxJQUFJLENBQUNaLE1BQUwsQ0FBWTZFLE1BQVosS0FBdUIsQ0FBM0IsRUFBOEI7QUFDMUI7QUFDSDs7QUFDRFAsSUFBQUEsMEJBQTBCLENBQUMxRCxJQUFELEVBQU8yRCxPQUFQLENBQTFCO0FBQ0FmLElBQUFBLEVBQUUsQ0FBQ1EsT0FBSCxpQkFBb0JwRCxJQUFJLENBQUNkLElBQXpCO0FBQ0FjLElBQUFBLElBQUksQ0FBQ1osTUFBTCxDQUFZeUMsT0FBWixDQUFvQixVQUFDOUIsS0FBRCxFQUFXO0FBQzNCLFVBQU1zRCxlQUFlLEdBQUd0RCxLQUFLLENBQUNDLElBQU4sQ0FBV2QsSUFBWCxHQUFrQixRQUFRb0UsTUFBUixDQUFldkQsS0FBSyxDQUFDWSxVQUFyQixDQUExQztBQUNBaUMsTUFBQUEsRUFBRSxDQUFDUSxPQUFILGFBQWdCckQsS0FBSyxDQUFDYixJQUF0QixlQUErQm1FLGVBQS9CO0FBQ0gsS0FIRDtBQUlBVCxJQUFBQSxFQUFFLENBQUNRLE9BQUg7QUFDQVIsSUFBQUEsRUFBRSxDQUFDUSxPQUFIO0FBQ0g7O0FBRUQsV0FBU2Msc0JBQVQsQ0FBZ0NoRixJQUFoQyxFQUE4QztBQUMxQzBELElBQUFBLEVBQUUsQ0FBQ1EsT0FBSCxpQkFBb0JsRSxJQUFwQjtBQUNBLEtBQUMsSUFBRCxFQUFPLElBQVAsRUFBYSxJQUFiLEVBQW1CLElBQW5CLEVBQXlCLElBQXpCLEVBQStCLElBQS9CLEVBQXFDMkMsT0FBckMsQ0FBNkMsVUFBQ2tDLEVBQUQsRUFBUTtBQUNqRG5CLE1BQUFBLEVBQUUsQ0FBQ1EsT0FBSCxhQUFnQlcsRUFBaEIsZUFBdUI3RSxJQUF2QjtBQUNILEtBRkQ7QUFHQSxLQUFDLElBQUQsRUFBTyxPQUFQLEVBQWdCMkMsT0FBaEIsQ0FBd0IsVUFBQ2tDLEVBQUQsRUFBUTtBQUM1Qm5CLE1BQUFBLEVBQUUsQ0FBQ1EsT0FBSCxhQUFnQlcsRUFBaEIsZ0JBQXdCN0UsSUFBeEI7QUFDSCxLQUZEO0FBR0EwRCxJQUFBQSxFQUFFLENBQUNRLE9BQUgsQ0FBVyxHQUFYO0FBQ0FSLElBQUFBLEVBQUUsQ0FBQ1EsT0FBSDtBQUNIOztBQUVELFdBQVNlLFlBQVQsQ0FBc0JsQyxLQUF0QixFQUF1QztBQUNuQ1csSUFBQUEsRUFBRSxDQUFDTSxZQUFIO0FBY0FqQixJQUFBQSxLQUFLLENBQUNKLE9BQU4sQ0FBYyxVQUFDN0IsSUFBRCxFQUFrQjtBQUM1QjRDLE1BQUFBLEVBQUUsQ0FBQ1EsT0FBSCxhQUFnQnBELElBQUksQ0FBQzJCLFVBQUwsSUFBbUIsRUFBbkMsc0JBQWlEM0IsSUFBSSxDQUFDZCxJQUF0RCw0REFBNEdjLElBQUksQ0FBQ2QsSUFBakg7QUFDSCxLQUZEO0FBSUEwRCxJQUFBQSxFQUFFLENBQUNNLFlBQUg7QUFLSDs7QUFFRCxXQUFTa0Isa0JBQVQsQ0FBNEJuQyxLQUE1QixFQUE2QztBQUN6Q1csSUFBQUEsRUFBRSxDQUFDUSxPQUFILENBQVcscUJBQVg7QUFDQW5CLElBQUFBLEtBQUssQ0FBQ0osT0FBTixDQUFjLFVBQUM3QixJQUFELEVBQVU7QUFDcEI0QyxNQUFBQSxFQUFFLENBQUNRLE9BQUgsYUFBZ0JwRCxJQUFJLENBQUMyQixVQUFMLElBQW1CLEVBQW5DLHNCQUFpRDNCLElBQUksQ0FBQ2QsSUFBdEQsc0JBQXNFYyxJQUFJLENBQUNkLElBQTNFO0FBQ0gsS0FGRDtBQUdBMEQsSUFBQUEsRUFBRSxDQUFDUSxPQUFILENBQVcsR0FBWDtBQUNIOztBQUdELFdBQVNpQiwwQkFBVCxDQUFvQ3JFLElBQXBDLEVBQWtEc0UsT0FBbEQsRUFBd0U7QUFDcEV0RSxJQUFBQSxJQUFJLENBQUNaLE1BQUwsQ0FBWXlDLE9BQVosQ0FBb0IsVUFBQzlCLEtBQUQsRUFBVztBQUMzQixVQUFJNkQsWUFBWSxHQUFHN0QsS0FBSyxDQUFDQyxJQUFOLENBQVdkLElBQTlCOztBQUQyQixtQ0FFbEIyRSxDQUZrQjtBQUd2QixZQUFNQyxVQUFVLGFBQU1GLFlBQU4sVUFBaEI7QUFDQUwsUUFBQUEsWUFBWSxDQUFDTyxVQUFELEVBQWFRLE9BQWIsRUFBc0IsWUFBTTtBQUNwQ3hCLFVBQUFBLEVBQUUsQ0FBQ0ksWUFBSCxtQ0FDSVksVUFESixzQkFDMEJGLFlBRDFCO0FBR0gsU0FKVyxDQUFaO0FBS0FBLFFBQUFBLFlBQVksSUFBSSxPQUFoQjtBQVR1Qjs7QUFFM0IsV0FBSyxJQUFJQyxDQUFDLEdBQUcsQ0FBYixFQUFnQkEsQ0FBQyxHQUFHOUQsS0FBSyxDQUFDWSxVQUExQixFQUFzQ2tELENBQUMsSUFBSSxDQUEzQyxFQUE4QztBQUFBLGVBQXJDQSxDQUFxQztBQVE3QztBQUNKLEtBWEQ7QUFZSDs7QUFFRCxXQUFTVSxpQkFBVCxDQUEyQnZFLElBQTNCLEVBQXlDO0FBQ3JDOEMsSUFBQUEsRUFBRSxDQUFDSSxZQUFILDJCQUNRbEQsSUFBSSxDQUFDZCxJQURiO0FBR0FjLElBQUFBLElBQUksQ0FBQ1osTUFBTCxDQUFZeUMsT0FBWixDQUFvQixVQUFDOUIsS0FBRCxFQUFXO0FBQzNCLFVBQUlzRCxlQUF3QixHQUFHLElBQS9CO0FBQ0EsVUFBTXhDLElBQUksR0FBR2QsS0FBSyxDQUFDYyxJQUFuQjs7QUFDQSxVQUFJQSxJQUFKLEVBQVU7QUFDTndDLFFBQUFBLGVBQWUsaUJBQVV0RCxLQUFLLENBQUNZLFVBQU4sR0FBbUIsQ0FBbkIsR0FBdUIsT0FBdkIsR0FBaUMsRUFBM0MsZUFBa0RFLElBQUksQ0FBQzJELEVBQXZELGlCQUFnRXpFLEtBQUssQ0FBQ0MsSUFBTixDQUFXMkIsVUFBWCxJQUF5QixFQUF6RixnQkFBaUc1QixLQUFLLENBQUNDLElBQU4sQ0FBV2QsSUFBNUcsTUFBZjtBQUNILE9BRkQsTUFFTyxJQUFJYSxLQUFLLENBQUNZLFVBQU4sR0FBbUIsQ0FBdkIsRUFBMEI7QUFDN0IwQyxRQUFBQSxlQUFlLEdBQ1h0RCxLQUFLLENBQUNDLElBQU4sQ0FBV2QsSUFBWCxHQUNBLFFBQVFvRSxNQUFSLENBQWV2RCxLQUFLLENBQUNZLFVBQXJCLENBRko7QUFHSCxPQUpNLE1BSUEsSUFBSVosS0FBSyxDQUFDQyxJQUFOLENBQVdiLFFBQVgsS0FBd0JQLGNBQWMsQ0FBQ0UsTUFBM0MsRUFBbUQ7QUFDdEQsWUFBSWlCLEtBQUssQ0FBQ0MsSUFBTixLQUFlWCxXQUFXLENBQUNDLE1BQS9CLEVBQXVDO0FBQ25DK0QsVUFBQUEsZUFBZSxHQUFHLFVBQWxCO0FBQ0gsU0FGRCxNQUVPLElBQUl0RCxLQUFLLENBQUNDLElBQU4sS0FBZVgsV0FBVyxDQUFDRSxRQUEvQixFQUF5QztBQUM1QzhELFVBQUFBLGVBQWUsR0FBRyxVQUFsQjtBQUNILFNBRk0sTUFFQTtBQUNIQSxVQUFBQSxlQUFlLEdBQUcsUUFBbEI7QUFDSDtBQUNKLE9BUk0sTUFRQSxJQUFJdEQsS0FBSyxDQUFDQyxJQUFOLENBQVdaLE1BQVgsQ0FBa0I2RSxNQUFsQixHQUEyQixDQUEvQixFQUFrQztBQUNyQ1osUUFBQUEsZUFBZSxHQUFHdEQsS0FBSyxDQUFDQyxJQUFOLENBQVdkLElBQTdCO0FBQ0g7O0FBQ0QsVUFBSW1FLGVBQUosRUFBcUI7QUFDakJQLFFBQUFBLEVBQUUsQ0FBQ00sT0FBSCxlQUFrQnJELEtBQUssQ0FBQ2IsSUFBeEIsZUFBaUNtRSxlQUFqQztBQUNIO0FBQ0osS0F2QkQ7QUF3QkFQLElBQUFBLEVBQUUsQ0FBQ0ksWUFBSCxzQkFDR2xELElBQUksQ0FBQzJCLFVBQUwsR0FBa0IsUUFBbEIsR0FBNkIsRUFEaEM7QUFJSDs7QUFFRCxXQUFTOEMsa0JBQVQsQ0FBNEJ6RSxJQUE1QixFQUEwQztBQUN0QzhDLElBQUFBLEVBQUUsQ0FBQ0ksWUFBSCwyQkFDUWxELElBQUksQ0FBQ2QsSUFEYjtBQUlBYyxJQUFBQSxJQUFJLENBQUNaLE1BQUwsQ0FBWXlDLE9BQVosQ0FBb0IsVUFBQ21CLE9BQUQsRUFBYTtBQUM3QkYsTUFBQUEsRUFBRSxDQUFDTSxPQUFILHdCQUEyQkosT0FBTyxDQUFDOUQsSUFBbkM7QUFDQTRELE1BQUFBLEVBQUUsQ0FBQ00sT0FBSCwrQkFBa0NMLGdCQUFnQixDQUFDL0MsSUFBRCxFQUFPZ0QsT0FBUCxDQUFsRDtBQUNBRixNQUFBQSxFQUFFLENBQUNNLE9BQUg7QUFDSCxLQUpEO0FBS0FOLElBQUFBLEVBQUUsQ0FBQ0ksWUFBSDtBQU1IOztBQUVELFdBQVN3QixXQUFULENBQXFCMUUsSUFBckIsRUFBbUNzRSxPQUFuQyxFQUF5RDtBQUNyRCxRQUFJdEUsSUFBSSxDQUFDWixNQUFMLENBQVk2RSxNQUFaLEtBQXVCLENBQTNCLEVBQThCO0FBQzFCO0FBQ0g7O0FBQ0QsUUFBSWpFLElBQUksQ0FBQ2IsUUFBTCxLQUFrQlAsY0FBYyxDQUFDRyxLQUFyQyxFQUE0QyxDQUN4QztBQUNIOztBQUNEc0YsSUFBQUEsMEJBQTBCLENBQUNyRSxJQUFELEVBQU9zRSxPQUFQLENBQTFCO0FBQ0FDLElBQUFBLGlCQUFpQixDQUFDdkUsSUFBRCxDQUFqQjs7QUFDQSxRQUFJQSxJQUFJLENBQUNiLFFBQUwsS0FBa0JQLGNBQWMsQ0FBQ0csS0FBckMsRUFBNEM7QUFDeEMwRixNQUFBQSxrQkFBa0IsQ0FBQ3pFLElBQUQsQ0FBbEI7QUFDSDtBQUdKO0FBRUQ7Ozs7Ozs7OztBQU9BLFdBQVMyRSxvQkFBVCxDQUE4QjNFLElBQTlCLEVBQTRDO0FBQ3hDLFFBQU00RSxVQUFVLEdBQUc1RSxJQUFJLENBQUNaLE1BQUwsQ0FBWXlGLE1BQVosQ0FBbUIsVUFBQUMsQ0FBQztBQUFBLGFBQUksQ0FBQyxDQUFDQSxDQUFDLENBQUNqRSxJQUFSO0FBQUEsS0FBcEIsQ0FBbkI7QUFDQSxRQUFNa0UsYUFBYSxHQUFHL0UsSUFBSSxDQUFDWixNQUFMLENBQVl5RixNQUFaLENBQW1CLFVBQUNDLENBQUQ7QUFBQSxhQUFpQkEsQ0FBQyxDQUFDOUUsSUFBRixLQUFXWCxXQUFXLENBQUNDLE1BQXhCLElBQW9Dd0YsQ0FBQyxDQUFDOUUsSUFBRixLQUFXWCxXQUFXLENBQUNFLFFBQTNFO0FBQUEsS0FBbkIsQ0FBdEI7QUFDQSxRQUFNeUYsc0JBQXNCLEdBQUdoRixJQUFJLENBQUMyQixVQUFMLElBQ3hCaUQsVUFBVSxDQUFDWCxNQUFYLEdBQW9CLENBREksSUFFeEJjLGFBQWEsQ0FBQ2QsTUFBZCxHQUF1QixDQUY5Qjs7QUFHQSxRQUFJLENBQUNlLHNCQUFMLEVBQTZCO0FBQ3pCO0FBQ0g7O0FBQ0RsQyxJQUFBQSxFQUFFLENBQUNNLE9BQUgsbUJBQXNCcEQsSUFBSSxDQUFDZCxJQUEzQjs7QUFDQSxRQUFJYyxJQUFJLENBQUMyQixVQUFULEVBQXFCO0FBQ2pCbUIsTUFBQUEsRUFBRSxDQUFDTSxPQUFILENBQVcsMEJBQVg7QUFDQU4sTUFBQUEsRUFBRSxDQUFDTSxPQUFILENBQVcscUNBQVg7QUFDQU4sTUFBQUEsRUFBRSxDQUFDTSxPQUFILENBQVcsZ0JBQVg7QUFDSDs7QUFDRHdCLElBQUFBLFVBQVUsQ0FBQy9DLE9BQVgsQ0FBbUIsVUFBQzlCLEtBQUQsRUFBVztBQUMxQixVQUFNa0YsT0FBTyxHQUFHakYsSUFBSSxDQUFDWixNQUFMLENBQVk4RixJQUFaLENBQWlCLFVBQUFKLENBQUM7QUFBQSxlQUFJQSxDQUFDLENBQUM1RixJQUFGLE1BQVlhLEtBQUssQ0FBQ2MsSUFBTixJQUFjZCxLQUFLLENBQUNjLElBQU4sQ0FBVzJELEVBQXJDLEtBQTRDLEVBQWhEO0FBQUEsT0FBbEIsQ0FBaEI7O0FBQ0EsVUFBSSxDQUFDUyxPQUFMLEVBQWM7QUFDVixjQUFNLCtCQUFOO0FBQ0g7O0FBQ0QsVUFBTXRELFVBQVUsR0FBRzVCLEtBQUssQ0FBQ0MsSUFBTixDQUFXMkIsVUFBOUI7O0FBQ0EsVUFBSSxDQUFDQSxVQUFMLEVBQWlCO0FBQ2IsY0FBTSxrQ0FBTjtBQUNIOztBQUNEbUIsTUFBQUEsRUFBRSxDQUFDTSxPQUFILHVCQUEwQnJELEtBQUssQ0FBQ2IsSUFBaEM7O0FBQ0EsVUFBSWEsS0FBSyxDQUFDWSxVQUFOLEtBQXFCLENBQXpCLEVBQTRCO0FBQ3hCbUMsUUFBQUEsRUFBRSxDQUFDTSxPQUFILHNEQUF5RHpCLFVBQXpELHNCQUErRXNELE9BQU8sQ0FBQy9GLElBQXZGO0FBQ0gsT0FGRCxNQUVPLElBQUlhLEtBQUssQ0FBQ1ksVUFBTixLQUFxQixDQUF6QixFQUE0QjtBQUMvQm1DLFFBQUFBLEVBQUUsQ0FBQ00sT0FBSCx3REFBMkR6QixVQUEzRCxzQkFBaUZzRCxPQUFPLENBQUMvRixJQUF6RjtBQUNILE9BRk0sTUFFQTtBQUNILGNBQU0sOENBQU47QUFDSDs7QUFDRDRELE1BQUFBLEVBQUUsQ0FBQ00sT0FBSDtBQUNILEtBbEJEO0FBbUJBMkIsSUFBQUEsYUFBYSxDQUFDbEQsT0FBZCxDQUFzQixVQUFDOUIsS0FBRCxFQUFXO0FBQzdCLFVBQU1vRixZQUFZLEdBQUdwRixLQUFLLENBQUNDLElBQU4sS0FBZVgsV0FBVyxDQUFDQyxNQUEzQixHQUFvQyxDQUFwQyxHQUF3QyxDQUE3RDtBQUNBd0QsTUFBQUEsRUFBRSxDQUFDTSxPQUFILHVCQUEwQnJELEtBQUssQ0FBQ2IsSUFBaEM7QUFDQTRELE1BQUFBLEVBQUUsQ0FBQ00sT0FBSCxpREFBb0QrQixZQUFwRCxzQkFBNEVwRixLQUFLLENBQUNiLElBQWxGO0FBQ0E0RCxNQUFBQSxFQUFFLENBQUNNLE9BQUg7QUFDSCxLQUxEO0FBTUFOLElBQUFBLEVBQUUsQ0FBQ00sT0FBSDtBQUNIOztBQUdELFdBQVNnQywwQkFBVCxDQUFvQ3BGLElBQXBDLEVBQWtEO0FBQzlDLFFBQUlBLElBQUksQ0FBQ2IsUUFBTCxLQUFrQlAsY0FBYyxDQUFDRyxLQUFyQyxFQUE0QztBQUN4QytELE1BQUFBLEVBQUUsQ0FBQ00sT0FBSCxtQkFBc0JwRCxJQUFJLENBQUNkLElBQTNCLGVBQW9DYyxJQUFJLENBQUNkLElBQXpDO0FBQ0g7QUFDSjs7QUFFRCxXQUFTbUcsUUFBVCxDQUFrQnBELEtBQWxCLEVBQW1DO0FBRS9CO0FBRUEsS0FBQyxRQUFELEVBQVcsU0FBWCxFQUFzQixLQUF0QixFQUE2QixPQUE3QixFQUFzQ0osT0FBdEMsQ0FBOENxQyxzQkFBOUM7QUFDQWpDLElBQUFBLEtBQUssQ0FBQ0osT0FBTixDQUFjLFVBQUE3QixJQUFJO0FBQUEsYUFBSW1ELG9CQUFvQixDQUFDbkQsSUFBRCxDQUF4QjtBQUFBLEtBQWxCO0FBQ0EsUUFBTXNGLGNBQWMsR0FBRyxJQUFJbEQsR0FBSixFQUF2QjtBQUNBSCxJQUFBQSxLQUFLLENBQUNKLE9BQU4sQ0FBYyxVQUFBN0IsSUFBSTtBQUFBLGFBQUlnRSxXQUFXLENBQUNoRSxJQUFELEVBQU9zRixjQUFQLENBQWY7QUFBQSxLQUFsQjtBQUVBLFFBQU1DLFdBQVcsR0FBR3RELEtBQUssQ0FBQzRDLE1BQU4sQ0FBYSxVQUFBekUsQ0FBQztBQUFBLGFBQUksQ0FBQyxDQUFDQSxDQUFDLENBQUN1QixVQUFSO0FBQUEsS0FBZCxDQUFwQjtBQUNBd0MsSUFBQUEsWUFBWSxDQUFDb0IsV0FBRCxDQUFaO0FBQ0FuQixJQUFBQSxrQkFBa0IsQ0FBQ21CLFdBQUQsQ0FBbEIsQ0FYK0IsQ0FhL0I7O0FBRUF6QyxJQUFBQSxFQUFFLENBQUNJLFlBQUg7QUFHQSxRQUFNc0MsY0FBYyxHQUFHLElBQUlwRCxHQUFKLEVBQXZCO0FBQ0FILElBQUFBLEtBQUssQ0FBQ0osT0FBTixDQUFjLFVBQUE3QixJQUFJO0FBQUEsYUFBSTBFLFdBQVcsQ0FBQzFFLElBQUQsRUFBT3dGLGNBQVAsQ0FBZjtBQUFBLEtBQWxCO0FBRUExQyxJQUFBQSxFQUFFLENBQUNJLFlBQUg7QUFJQWpCLElBQUFBLEtBQUssQ0FBQ0osT0FBTixDQUFjLFVBQUM3QixJQUFELEVBQVU7QUFDcEIyRSxNQUFBQSxvQkFBb0IsQ0FBQzNFLElBQUQsQ0FBcEI7QUFDQW9GLE1BQUFBLDBCQUEwQixDQUFDcEYsSUFBRCxDQUExQjtBQUNILEtBSEQ7QUFJQThDLElBQUFBLEVBQUUsQ0FBQ00sT0FBSCxDQUFXLGtCQUFYO0FBQ0FtQyxJQUFBQSxXQUFXLENBQUMxRCxPQUFaLENBQW9CLFVBQUM3QixJQUFELEVBQVU7QUFDMUI4QyxNQUFBQSxFQUFFLENBQUNNLE9BQUgsdUJBQTBCcEQsSUFBSSxDQUFDMkIsVUFBTCxJQUFtQixFQUE3QyxxQ0FBMEUzQixJQUFJLENBQUMyQixVQUFMLElBQW1CLEVBQTdGLGVBQW9HM0IsSUFBSSxDQUFDZCxJQUF6RztBQUNILEtBRkQ7QUFHQTRELElBQUFBLEVBQUUsQ0FBQ00sT0FBSCxDQUFXLHVDQUFYO0FBQ0FOLElBQUFBLEVBQUUsQ0FBQ00sT0FBSCxDQUFXLFlBQVg7QUFDQU4sSUFBQUEsRUFBRSxDQUFDTSxPQUFILENBQVcseUJBQVg7QUFDQW1DLElBQUFBLFdBQVcsQ0FBQzFELE9BQVosQ0FBb0IsVUFBQzdCLElBQUQsRUFBVTtBQUMxQjhDLE1BQUFBLEVBQUUsQ0FBQ00sT0FBSCx1QkFBMEJwRCxJQUFJLENBQUMyQixVQUFMLElBQW1CLEVBQTdDLDRDQUFpRjNCLElBQUksQ0FBQzJCLFVBQUwsSUFBbUIsRUFBcEcsZUFBMkczQixJQUFJLENBQUNkLElBQWhIO0FBQ0gsS0FGRDtBQUdBNEQsSUFBQUEsRUFBRSxDQUFDSSxZQUFIO0FBTUFKLElBQUFBLEVBQUUsQ0FBQ0ksWUFBSDtBQUtIOztBQUVELE1BQU11QyxNQUFNLEdBQUcsMEJBQWE5RixTQUFiLENBQWY7O0FBRUEsTUFBSThGLE1BQU0sU0FBVixFQUFrQjtBQUNkekQsSUFBQUEsWUFBWSxDQUFDeUQsTUFBTSxTQUFOLENBQWF4RCxLQUFkLENBQVo7QUFDQW9ELElBQUFBLFFBQVEsQ0FBQ3pGLE9BQUQsQ0FBUjtBQUNIOztBQUVELFNBQU87QUFDSGdELElBQUFBLEVBQUUsRUFBRUEsRUFBRSxDQUFDOEMsU0FBSCxFQUREO0FBRUg1QyxJQUFBQSxFQUFFLEVBQUVBLEVBQUUsQ0FBQzRDLFNBQUg7QUFGRCxHQUFQO0FBSUg7O2VBRWNoRyxJIiwic291cmNlc0NvbnRlbnQiOlsiLy9AZmxvd1xuXG5pbXBvcnQgeyBtYWtlRmllbGRUeXBlTmFtZSwgV3JpdGVyIH0gZnJvbSAndG9uLWxhYnMtZGV2LW9wcy9kaXN0L3NyYy9nZW4uanMnO1xuaW1wb3J0IHR5cGUgeyBTY2hlbWFNZW1iZXIsIFNjaGVtYVR5cGUsIFR5cGVEZWYgfSBmcm9tICd0b24tbGFicy1kZXYtb3BzL3NyYy9zY2hlbWEuanMnO1xuaW1wb3J0IHsgcGFyc2VUeXBlRGVmIH0gZnJvbSAndG9uLWxhYnMtZGV2LW9wcy9kaXN0L3NyYy9zY2hlbWEuanMnO1xuXG5jb25zdCBEYlR5cGVDYXRlZ29yeSA9IHtcbiAgICB1bnJlc29sdmVkOiAndW5yZXNvbHZlZCcsXG4gICAgc2NhbGFyOiAnc2NhbGFyJyxcbiAgICB1bmlvbjogJ3VuaW9uJyxcbiAgICBzdHJ1Y3Q6ICdzdHJ1Y3QnLFxufTtcblxudHlwZSBEYkpvaW4gPSB7XG4gICAgY29sbGVjdGlvbjogc3RyaW5nLFxuICAgIG9uOiBzdHJpbmcsXG59XG5cbnR5cGUgRGJUeXBlID0ge1xuICAgIG5hbWU6IHN0cmluZyxcbiAgICBjYXRlZ29yeTogJEtleXM8dHlwZW9mIERiVHlwZUNhdGVnb3J5PixcbiAgICBjb2xsZWN0aW9uPzogc3RyaW5nLFxuICAgIGZpZWxkczogRGJGaWVsZFtdLFxufVxuXG50eXBlIERiRmllbGQgPSB7XG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGFycmF5RGVwdGg6IG51bWJlcixcbiAgICBqb2luPzogRGJKb2luLFxuICAgIHR5cGU6IERiVHlwZSxcbn1cblxuZnVuY3Rpb24gc2NhbGFyVHlwZShuYW1lOiBzdHJpbmcpOiBEYlR5cGUge1xuICAgIHJldHVybiB7XG4gICAgICAgIG5hbWUsXG4gICAgICAgIGNhdGVnb3J5OiBEYlR5cGVDYXRlZ29yeS5zY2FsYXIsXG4gICAgICAgIGZpZWxkczogW11cbiAgICB9XG59XG5cbmNvbnN0IHNjYWxhclR5cGVzID0ge1xuICAgIGludDogc2NhbGFyVHlwZSgnSW50JyksXG4gICAgdWludDY0OiBzY2FsYXJUeXBlKCdTdHJpbmcnKSxcbiAgICB1aW50MTAyNDogc2NhbGFyVHlwZSgnU3RyaW5nJyksXG4gICAgZmxvYXQ6IHNjYWxhclR5cGUoJ0Zsb2F0JyksXG4gICAgYm9vbGVhbjogc2NhbGFyVHlwZSgnQm9vbGVhbicpLFxuICAgIHN0cmluZzogc2NhbGFyVHlwZSgnU3RyaW5nJyksXG59O1xuXG5mdW5jdGlvbiB1bnJlc29sdmVkVHlwZShuYW1lOiBzdHJpbmcpOiBEYlR5cGUge1xuICAgIHJldHVybiB7XG4gICAgICAgIG5hbWUsXG4gICAgICAgIGNhdGVnb3J5OiBEYlR5cGVDYXRlZ29yeS51bnJlc29sdmVkLFxuICAgICAgICBmaWVsZHM6IFtdLFxuICAgIH1cbn1cblxuZnVuY3Rpb24gbWFpbihzY2hlbWFEZWY6IFR5cGVEZWYpIHtcblxuICAgIGxldCBkYlR5cGVzOiBEYlR5cGVbXSA9IFtdO1xuICAgIGxldCBsYXN0UmVwb3J0ZWRUeXBlOiBzdHJpbmcgPSAnJztcblxuICAgIGZ1bmN0aW9uIHJlcG9ydFR5cGUobmFtZTogc3RyaW5nLCBmaWVsZDogc3RyaW5nLCB0eXBlOiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKG5hbWUgIT09IGxhc3RSZXBvcnRlZFR5cGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKG5hbWUpO1xuICAgICAgICAgICAgbGFzdFJlcG9ydGVkVHlwZSA9IG5hbWU7XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5sb2coYCAgICAke2ZpZWxkfTogJHt0eXBlfWApO1xuXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0SW50VHlwZSh0OiBTY2hlbWFUeXBlKTogc3RyaW5nIHtcbiAgICAgICAgaWYgKHQuaW50ICYmIHQuaW50LnVuc2lnbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gYHUkeyh0LmludC51bnNpZ25lZDogYW55KX1gO1xuICAgICAgICB9IGVsc2UgaWYgKHQuaW50ICYmIHQuaW50LnNpZ25lZCkge1xuICAgICAgICAgICAgcmV0dXJuIGBpJHsodC5pbnQuc2lnbmVkOiBhbnkpfWA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gJ2kzMic7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZURiRmllbGQoXG4gICAgICAgIHR5cGVOYW1lOiBzdHJpbmcsXG4gICAgICAgIHNjaGVtYUZpZWxkOiBTY2hlbWFNZW1iZXI8U2NoZW1hVHlwZT4sXG4gICAgKTogRGJGaWVsZCB7XG4gICAgICAgIGxldCBzY2hlbWFUeXBlID0gc2NoZW1hRmllbGQ7XG4gICAgICAgIGNvbnN0IGZpZWxkOiBEYkZpZWxkID0ge1xuICAgICAgICAgICAgbmFtZTogc2NoZW1hRmllbGQubmFtZSxcbiAgICAgICAgICAgIGFycmF5RGVwdGg6IDAsXG4gICAgICAgICAgICB0eXBlOiBzY2FsYXJUeXBlcy5zdHJpbmcsXG4gICAgICAgIH07XG4gICAgICAgIHdoaWxlIChzY2hlbWFUeXBlLmFycmF5KSB7XG4gICAgICAgICAgICBmaWVsZC5hcnJheURlcHRoICs9IDE7XG4gICAgICAgICAgICBzY2hlbWFUeXBlID0gc2NoZW1hVHlwZS5hcnJheTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBqb2luID0gKHNjaGVtYVR5cGU6IGFueSkuXy5qb2luO1xuICAgICAgICBpZiAoam9pbikge1xuICAgICAgICAgICAgZmllbGQuam9pbiA9IGpvaW47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNjaGVtYVR5cGUudW5pb24gfHwgc2NoZW1hVHlwZS5zdHJ1Y3QpIHtcbiAgICAgICAgICAgIGZpZWxkLnR5cGUgPSB1bnJlc29sdmVkVHlwZShtYWtlRmllbGRUeXBlTmFtZSh0eXBlTmFtZSwgc2NoZW1hRmllbGQubmFtZSkpO1xuICAgICAgICB9IGVsc2UgaWYgKHNjaGVtYVR5cGUucmVmKSB7XG4gICAgICAgICAgICBmaWVsZC50eXBlID0gdW5yZXNvbHZlZFR5cGUoc2NoZW1hVHlwZS5yZWYubmFtZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoc2NoZW1hVHlwZS5ib29sKSB7XG4gICAgICAgICAgICBmaWVsZC50eXBlID0gc2NhbGFyVHlwZXMuYm9vbGVhbjtcbiAgICAgICAgfSBlbHNlIGlmIChzY2hlbWFUeXBlLmludCkge1xuICAgICAgICAgICAgY29uc3QgdWludFNpemU6IG51bWJlciA9IChzY2hlbWFUeXBlLmludDogYW55KS51bnNpZ25lZDtcbiAgICAgICAgICAgIGlmICh1aW50U2l6ZSkge1xuICAgICAgICAgICAgICAgIGlmICh1aW50U2l6ZSA+PSAxMjgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVwb3J0VHlwZSh0eXBlTmFtZSwgZmllbGQubmFtZSwgJ3UxMDI0Jyk7XG4gICAgICAgICAgICAgICAgICAgIGZpZWxkLnR5cGUgPSBzY2FsYXJUeXBlcy51aW50MTAyNDtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHVpbnRTaXplID49IDY0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcG9ydFR5cGUodHlwZU5hbWUsIGZpZWxkLm5hbWUsICd1NjQnKTtcbiAgICAgICAgICAgICAgICAgICAgZmllbGQudHlwZSA9IHNjYWxhclR5cGVzLnVpbnQ2NDtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHVpbnRTaXplID49IDMyKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcG9ydFR5cGUodHlwZU5hbWUsIGZpZWxkLm5hbWUsICd1MzInKTtcbiAgICAgICAgICAgICAgICAgICAgZmllbGQudHlwZSA9IHNjYWxhclR5cGVzLmZsb2F0O1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcG9ydFR5cGUodHlwZU5hbWUsIGZpZWxkLm5hbWUsIGB1JHt1aW50U2l6ZX1gKTtcbiAgICAgICAgICAgICAgICAgICAgZmllbGQudHlwZSA9IHNjYWxhclR5cGVzLmludDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnN0IGludFNpemU6IG51bWJlciA9IChzY2hlbWFUeXBlLmludDogYW55KS5zaWduZWQ7XG4gICAgICAgICAgICAgICAgaWYgKGludFNpemUgJiYgaW50U2l6ZSA+IDMyKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSW50ZWdlciB0eXBlIHdpdGggc2l6ZSAke2ludFNpemV9IGJpdCBkb2VzIG5vdCBzdXBwb3J0ZWRgKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXBvcnRUeXBlKHR5cGVOYW1lLCBmaWVsZC5uYW1lLCAnaTMyJyk7XG4gICAgICAgICAgICAgICAgICAgIGZpZWxkLnR5cGUgPSBzY2FsYXJUeXBlcy5pbnQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHNjaGVtYVR5cGUuZmxvYXQpIHtcbiAgICAgICAgICAgIHJlcG9ydFR5cGUodHlwZU5hbWUsIGZpZWxkLm5hbWUsICdmbG9hdCcpO1xuICAgICAgICAgICAgZmllbGQudHlwZSA9IHNjYWxhclR5cGVzLmZsb2F0O1xuICAgICAgICB9IGVsc2UgaWYgKHNjaGVtYVR5cGUuc3RyaW5nKSB7XG4gICAgICAgICAgICBmaWVsZC50eXBlID0gc2NhbGFyVHlwZXMuc3RyaW5nO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZmllbGQudHlwZSA9IHNjYWxhclR5cGVzLnN0cmluZztcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+Pj4gSW52YWxpZCBmaWVsZCB0eXBlOiAnLCBKU09OLnN0cmluZ2lmeShzY2hlbWFUeXBlKSk7XG4gICAgICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZpZWxkO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHVud3JhcEFycmF5cyh0eXBlOiBTY2hlbWFUeXBlKTogU2NoZW1hVHlwZSB7XG4gICAgICAgIGlmICh0eXBlLmFycmF5KSB7XG4gICAgICAgICAgICByZXR1cm4gdW53cmFwQXJyYXlzKHR5cGUuYXJyYXkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0eXBlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlRGJUeXBlKFxuICAgICAgICBuYW1lOiBzdHJpbmcsXG4gICAgICAgIHNjaGVtYVR5cGU6IFNjaGVtYVR5cGVcbiAgICApIHtcbiAgICAgICAgY29uc3Qgc3RydWN0ID0gc2NoZW1hVHlwZS51bmlvbiB8fCBzY2hlbWFUeXBlLnN0cnVjdDtcbiAgICAgICAgaWYgKCFzdHJ1Y3QpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+Pj4nLCBgPz8gJHtuYW1lfTogJHtKU09OLnN0cmluZ2lmeShzY2hlbWFUeXBlKS5zdWJzdHIoMCwgMjApfWApO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHR5cGU6IERiVHlwZSA9IHtcbiAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICBjYXRlZ29yeTogc2NoZW1hVHlwZS51bmlvbiA/IERiVHlwZUNhdGVnb3J5LnVuaW9uIDogRGJUeXBlQ2F0ZWdvcnkuc3RydWN0LFxuICAgICAgICAgICAgZmllbGRzOiBbXSxcbiAgICAgICAgICAgIGNvbGxlY3Rpb246IChzY2hlbWFUeXBlOiBhbnkpLl8uY29sbGVjdGlvbixcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAodHlwZS5jb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICB0eXBlLmZpZWxkcy5wdXNoKHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnaWQnLFxuICAgICAgICAgICAgICAgIGFycmF5RGVwdGg6IDAsXG4gICAgICAgICAgICAgICAgdHlwZTogc2NhbGFyVHlwZXMuc3RyaW5nLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgc3RydWN0LmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICB0eXBlLmZpZWxkcy5wdXNoKHBhcnNlRGJGaWVsZChuYW1lLCBmaWVsZCkpO1xuICAgICAgICAgICAgY29uc3QgdW53cmFwcGVkID0gdW53cmFwQXJyYXlzKGZpZWxkKTtcbiAgICAgICAgICAgIGNvbnN0IG93blR5cGUgPSAodW53cmFwcGVkLnN0cnVjdCB8fCB1bndyYXBwZWQudW5pb24pID8gdW53cmFwcGVkIDogbnVsbDtcbiAgICAgICAgICAgIGlmIChvd25UeXBlKSB7XG4gICAgICAgICAgICAgICAgcGFyc2VEYlR5cGUobWFrZUZpZWxkVHlwZU5hbWUobmFtZSwgZmllbGQubmFtZSksIG93blR5cGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgZGJUeXBlcy5wdXNoKHR5cGUpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlRGJUeXBlcyh0eXBlczogU2NoZW1hTWVtYmVyPFNjaGVtYVR5cGU+W10pIHtcbiAgICAgICAgdHlwZXMuZm9yRWFjaCgodHlwZTogU2NoZW1hTWVtYmVyPFNjaGVtYVR5cGU+KSA9PiB7XG4gICAgICAgICAgICBwYXJzZURiVHlwZSh0eXBlLm5hbWUsIHR5cGUpO1xuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgdW5yZXNvbHZlZDogTWFwPHN0cmluZywgRGJUeXBlPiA9IG5ldyBNYXA8c3RyaW5nLCBEYlR5cGU+KCk7XG4gICAgICAgIGNvbnN0IHJlc29sdmluZzogU2V0PHN0cmluZz4gPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICAgICAgY29uc3QgcmVzb2x2ZWQ6IE1hcDxzdHJpbmcsIERiVHlwZT4gPSBuZXcgTWFwPHN0cmluZywgRGJUeXBlPigpO1xuICAgICAgICBjb25zdCBvcmRlcmVkUmVzb2x2ZWQ6IERiVHlwZVtdID0gW107XG4gICAgICAgIGRiVHlwZXMuZm9yRWFjaCh0ID0+IHVucmVzb2x2ZWQuc2V0KHQubmFtZSwgdCkpO1xuICAgICAgICBjb25zdCByZXNvbHZlVHlwZSA9ICh0eXBlOiBEYlR5cGUpID0+IHtcbiAgICAgICAgICAgIGlmIChyZXNvbHZlZC5oYXModHlwZS5uYW1lKSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChyZXNvbHZpbmcuaGFzKHR5cGUubmFtZSkpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnPj4+JywgYENpcmN1bGFyIHJlZmVyZW5jZSB0byB0eXBlICR7dHlwZS5uYW1lfWApO1xuICAgICAgICAgICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlc29sdmluZy5hZGQodHlwZS5uYW1lKTtcbiAgICAgICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGZpZWxkLnR5cGUuY2F0ZWdvcnkgPT09IERiVHlwZUNhdGVnb3J5LnVucmVzb2x2ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHR5cGUgPSByZXNvbHZlZC5nZXQoZmllbGQudHlwZS5uYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlID0gdW5yZXNvbHZlZC5nZXQoZmllbGQudHlwZS5uYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZVR5cGUodHlwZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+Pj4nLCBgUmVmZXJlbmNlZCB0eXBlIG5vdCBmb3VuZDogJHtmaWVsZC50eXBlLm5hbWV9YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlID0gdHlwZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmVzb2x2aW5nLmRlbGV0ZSh0eXBlLm5hbWUpO1xuICAgICAgICAgICAgb3JkZXJlZFJlc29sdmVkLnB1c2godHlwZSk7XG4gICAgICAgICAgICB1bnJlc29sdmVkLmRlbGV0ZSh0eXBlLm5hbWUpO1xuICAgICAgICAgICAgcmVzb2x2ZWQuc2V0KHR5cGUubmFtZSwgdHlwZSk7XG4gICAgICAgIH07XG4gICAgICAgIGRiVHlwZXMuZm9yRWFjaChyZXNvbHZlVHlwZSk7XG4gICAgICAgIGRiVHlwZXMgPSBvcmRlcmVkUmVzb2x2ZWQ7XG4gICAgfVxuXG4vLyBHZW5lcmF0b3JzXG5cbiAgICBjb25zdCBxbCA9IG5ldyBXcml0ZXIoKTtcbiAgICBjb25zdCBqcyA9IG5ldyBXcml0ZXIoKTtcblxuICAgIGZ1bmN0aW9uIHVuaW9uVmFyaWFudFR5cGUodHlwZTogRGJUeXBlLCB2YXJpYW50OiBEYkZpZWxkKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIGAke3R5cGUubmFtZX0ke3ZhcmlhbnQubmFtZX1WYXJpYW50YDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5RTFR5cGVEZWNsYXJhdGlvbnNGb3JVbmlvblZhcmlhbnRzKHR5cGU6IERiVHlwZSkge1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKCh2YXJpYW50KSA9PiB7XG4gICAgICAgICAgICBxbC53cml0ZUJsb2NrTG4oYFxuICAgICAgICB0eXBlICR7dW5pb25WYXJpYW50VHlwZSh0eXBlLCB2YXJpYW50KX0ge1xuICAgICAgICAgICAgJHt2YXJpYW50Lm5hbWV9OiAke3ZhcmlhbnQudHlwZS5uYW1lfVxuICAgICAgICB9XG5cbiAgICAgICAgYCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlblFMVHlwZURlY2xhcmF0aW9uKHR5cGU6IERiVHlwZSkge1xuICAgICAgICBpZiAodHlwZS5jYXRlZ29yeSA9PT0gRGJUeXBlQ2F0ZWdvcnkudW5pb24pIHtcbiAgICAgICAgICAgIGdlblFMVHlwZURlY2xhcmF0aW9uc0ZvclVuaW9uVmFyaWFudHModHlwZSk7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGB1bmlvbiAke3R5cGUubmFtZX0gPSBgKTtcbiAgICAgICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2godmFyaWFudCA9PiB7XG4gICAgICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0fCAke3VuaW9uVmFyaWFudFR5cGUodHlwZSwgdmFyaWFudCl9YCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oYHR5cGUgJHt0eXBlLm5hbWV9IHtgKTtcbiAgICAgICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goZmllbGQgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHR5cGVEZWNsYXJhdGlvbiA9XG4gICAgICAgICAgICAgICAgICAgICdbJy5yZXBlYXQoZmllbGQuYXJyYXlEZXB0aCkgK1xuICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlLm5hbWUgK1xuICAgICAgICAgICAgICAgICAgICAnXScucmVwZWF0KGZpZWxkLmFycmF5RGVwdGgpO1xuICAgICAgICAgICAgICAgIHFsLndyaXRlTG4oYFxcdCR7ZmllbGQubmFtZX06ICR7dHlwZURlY2xhcmF0aW9ufWApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGB9YCk7XG4gICAgICAgIH1cbiAgICAgICAgcWwud3JpdGVMbigpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHByZXZlbnRUd2ljZShuYW1lOiBzdHJpbmcsIG5hbWVzOiBTZXQ8c3RyaW5nPiwgd29yazogKCkgPT4gdm9pZCkge1xuICAgICAgICBpZiAoIW5hbWVzLmhhcyhuYW1lKSkge1xuICAgICAgICAgICAgbmFtZXMuYWRkKG5hbWUpO1xuICAgICAgICAgICAgd29yaygpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuUUxGaWx0ZXJzRm9yQXJyYXlGaWVsZHModHlwZTogRGJUeXBlLCBxbE5hbWVzOiBTZXQ8c3RyaW5nPikge1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgbGV0IGl0ZW1UeXBlTmFtZSA9IGZpZWxkLnR5cGUubmFtZTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZmllbGQuYXJyYXlEZXB0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmlsdGVyTmFtZSA9IGAke2l0ZW1UeXBlTmFtZX1BcnJheUZpbHRlcmA7XG4gICAgICAgICAgICAgICAgcHJldmVudFR3aWNlKGZpbHRlck5hbWUsIHFsTmFtZXMsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcWwud3JpdGVMbihgaW5wdXQgJHtmaWx0ZXJOYW1lfSB7YCk7XG4gICAgICAgICAgICAgICAgICAgIFsnYW55JywgJ2FsbCddLmZvckVhY2goKG9wKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBxbC53cml0ZUxuKGBcXHQke29wfTogJHtpdGVtVHlwZU5hbWV9RmlsdGVyYCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBxbC53cml0ZUxuKCd9Jyk7XG4gICAgICAgICAgICAgICAgICAgIHFsLndyaXRlTG4oKTtcblxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGl0ZW1UeXBlTmFtZSArPSAnQXJyYXknO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5RTEZpbHRlcih0eXBlOiBEYlR5cGUsIHFsTmFtZXM6IFNldDxzdHJpbmc+KSB7XG4gICAgICAgIGlmICh0eXBlLmZpZWxkcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBnZW5RTEZpbHRlcnNGb3JBcnJheUZpZWxkcyh0eXBlLCBxbE5hbWVzKTtcbiAgICAgICAgcWwud3JpdGVMbihgaW5wdXQgJHt0eXBlLm5hbWV9RmlsdGVyIHtgKTtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHR5cGVEZWNsYXJhdGlvbiA9IGZpZWxkLnR5cGUubmFtZSArIFwiQXJyYXlcIi5yZXBlYXQoZmllbGQuYXJyYXlEZXB0aCk7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGBcXHQke2ZpZWxkLm5hbWV9OiAke3R5cGVEZWNsYXJhdGlvbn1GaWx0ZXJgKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHFsLndyaXRlTG4oYH1gKTtcbiAgICAgICAgcWwud3JpdGVMbigpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlblFMU2NhbGFyVHlwZXNGaWx0ZXIobmFtZTogc3RyaW5nKSB7XG4gICAgICAgIHFsLndyaXRlTG4oYGlucHV0ICR7bmFtZX1GaWx0ZXIge2ApO1xuICAgICAgICBbJ2VxJywgJ25lJywgJ2d0JywgJ2x0JywgJ2dlJywgJ2xlJ10uZm9yRWFjaCgob3ApID0+IHtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oYFxcdCR7b3B9OiAke25hbWV9YCk7XG4gICAgICAgIH0pO1xuICAgICAgICBbJ2luJywgJ25vdEluJ10uZm9yRWFjaCgob3ApID0+IHtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oYFxcdCR7b3B9OiBbJHtuYW1lfV1gKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHFsLndyaXRlTG4oJ30nKTtcbiAgICAgICAgcWwud3JpdGVMbigpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlblFMUXVlcmllcyh0eXBlczogRGJUeXBlW10pIHtcbiAgICAgICAgcWwud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgZW51bSBRdWVyeU9yZGVyQnlEaXJlY3Rpb24ge1xuICAgICAgICAgICAgQVNDXG4gICAgICAgICAgICBERVNDXG4gICAgICAgIH1cblxuICAgICAgICBpbnB1dCBRdWVyeU9yZGVyQnkge1xuICAgICAgICAgICAgcGF0aDogU3RyaW5nXG4gICAgICAgICAgICBkaXJlY3Rpb246IFF1ZXJ5T3JkZXJCeURpcmVjdGlvblxuICAgICAgICB9XG5cbiAgICAgICAgdHlwZSBRdWVyeSB7XG4gICAgICAgIGApO1xuXG4gICAgICAgIHR5cGVzLmZvckVhY2goKHR5cGU6IERiVHlwZSkgPT4ge1xuICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0JHt0eXBlLmNvbGxlY3Rpb24gfHwgJyd9KGZpbHRlcjogJHt0eXBlLm5hbWV9RmlsdGVyLCBvcmRlckJ5OiBbUXVlcnlPcmRlckJ5XSwgbGltaXQ6IEludCk6IFske3R5cGUubmFtZX1dYCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHFsLndyaXRlQmxvY2tMbihgXG4gICAgICAgICAgICBzZWxlY3QocXVlcnk6IFN0cmluZyEsIGJpbmRWYXJzSnNvbjogU3RyaW5nISk6IFN0cmluZyFcbiAgICAgICAgfVxuXG4gICAgICAgIGApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlblFMU3Vic2NyaXB0aW9ucyh0eXBlczogRGJUeXBlW10pIHtcbiAgICAgICAgcWwud3JpdGVMbigndHlwZSBTdWJzY3JpcHRpb24geycpO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGBcXHQke3R5cGUuY29sbGVjdGlvbiB8fCAnJ30oZmlsdGVyOiAke3R5cGUubmFtZX1GaWx0ZXIpOiAke3R5cGUubmFtZX1gKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHFsLndyaXRlTG4oJ30nKTtcbiAgICB9XG5cblxuICAgIGZ1bmN0aW9uIGdlbkpTRmlsdGVyc0ZvckFycmF5RmllbGRzKHR5cGU6IERiVHlwZSwganNOYW1lczogU2V0PHN0cmluZz4pIHtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGxldCBpdGVtVHlwZU5hbWUgPSBmaWVsZC50eXBlLm5hbWU7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZpZWxkLmFycmF5RGVwdGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpbHRlck5hbWUgPSBgJHtpdGVtVHlwZU5hbWV9QXJyYXlgO1xuICAgICAgICAgICAgICAgIHByZXZlbnRUd2ljZShmaWx0ZXJOYW1lLCBqc05hbWVzLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgICAgICAgICAgY29uc3QgJHtmaWx0ZXJOYW1lfSA9IGFycmF5KCR7aXRlbVR5cGVOYW1lfSk7XG4gICAgICAgICAgICAgICAgYCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaXRlbVR5cGVOYW1lICs9ICdBcnJheSc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkpTU3RydWN0RmlsdGVyKHR5cGU6IERiVHlwZSkge1xuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBjb25zdCAke3R5cGUubmFtZX0gPSBzdHJ1Y3Qoe1xuICAgIGApO1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgbGV0IHR5cGVEZWNsYXJhdGlvbjogP3N0cmluZyA9IG51bGw7XG4gICAgICAgICAgICBjb25zdCBqb2luID0gZmllbGQuam9pbjtcbiAgICAgICAgICAgIGlmIChqb2luKSB7XG4gICAgICAgICAgICAgICAgdHlwZURlY2xhcmF0aW9uID0gYGpvaW4ke2ZpZWxkLmFycmF5RGVwdGggPiAwID8gJ0FycmF5JyA6ICcnfSgnJHtqb2luLm9ufScsICcke2ZpZWxkLnR5cGUuY29sbGVjdGlvbiB8fCAnJ30nLCAke2ZpZWxkLnR5cGUubmFtZX0pYDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQuYXJyYXlEZXB0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB0eXBlRGVjbGFyYXRpb24gPVxuICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlLm5hbWUgK1xuICAgICAgICAgICAgICAgICAgICAnQXJyYXknLnJlcGVhdChmaWVsZC5hcnJheURlcHRoKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZS5jYXRlZ29yeSA9PT0gRGJUeXBlQ2F0ZWdvcnkuc2NhbGFyKSB7XG4gICAgICAgICAgICAgICAgaWYgKGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLnVpbnQ2NCkge1xuICAgICAgICAgICAgICAgICAgICB0eXBlRGVjbGFyYXRpb24gPSAnYmlnVUludDEnO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDEwMjQpIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZURlY2xhcmF0aW9uID0gJ2JpZ1VJbnQyJztcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0eXBlRGVjbGFyYXRpb24gPSAnc2NhbGFyJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLnR5cGUuZmllbGRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB0eXBlRGVjbGFyYXRpb24gPSBmaWVsZC50eXBlLm5hbWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodHlwZURlY2xhcmF0aW9uKSB7XG4gICAgICAgICAgICAgICAganMud3JpdGVMbihgICAgICR7ZmllbGQubmFtZX06ICR7dHlwZURlY2xhcmF0aW9ufSxgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIH0ke3R5cGUuY29sbGVjdGlvbiA/ICcsIHRydWUnIDogJyd9KTtcblxuICAgIGApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkpTVW5pb25SZXNvbHZlcih0eXBlOiBEYlR5cGUpIHtcbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgY29uc3QgJHt0eXBlLm5hbWV9UmVzb2x2ZXIgPSB7XG4gICAgICAgICAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xuICAgICAgICBgKTtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgodmFyaWFudCkgPT4ge1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICBpZiAoJyR7dmFyaWFudC5uYW1lfScgaW4gb2JqKSB7YCk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICByZXR1cm4gJyR7dW5pb25WYXJpYW50VHlwZSh0eXBlLCB2YXJpYW50KX0nO2ApO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICB9YCk7XG4gICAgICAgIH0pO1xuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkpTRmlsdGVyKHR5cGU6IERiVHlwZSwganNOYW1lczogU2V0PHN0cmluZz4pIHtcbiAgICAgICAgaWYgKHR5cGUuZmllbGRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS51bmlvbikge1xuICAgICAgICAgICAgLy8gZ2VuSlNGaWx0ZXJzRm9yVW5pb25WYXJpYW50cyh0eXBlLCBqc05hbWVzKTtcbiAgICAgICAgfVxuICAgICAgICBnZW5KU0ZpbHRlcnNGb3JBcnJheUZpZWxkcyh0eXBlLCBqc05hbWVzKTtcbiAgICAgICAgZ2VuSlNTdHJ1Y3RGaWx0ZXIodHlwZSk7XG4gICAgICAgIGlmICh0eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS51bmlvbikge1xuICAgICAgICAgICAgZ2VuSlNVbmlvblJlc29sdmVyKHR5cGUpO1xuICAgICAgICB9XG5cblxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlIGN1c3RvbSByZXNvbHZlcnMgZm9yIHR5cGVzIHdpdGg6XG4gICAgICogLSBpZCBmaWVsZFxuICAgICAqIC0gam9pbiBmaWVsZHNcbiAgICAgKiAtIHU2NCBhbmQgaGlnaGVyIGZpZWxkc1xuICAgICAqIEBwYXJhbSB0eXBlXG4gICAgICovXG4gICAgZnVuY3Rpb24gZ2VuSlNDdXN0b21SZXNvbHZlcnModHlwZTogRGJUeXBlKSB7XG4gICAgICAgIGNvbnN0IGpvaW5GaWVsZHMgPSB0eXBlLmZpZWxkcy5maWx0ZXIoeCA9PiAhIXguam9pbik7XG4gICAgICAgIGNvbnN0IGJpZ1VJbnRGaWVsZHMgPSB0eXBlLmZpZWxkcy5maWx0ZXIoKHg6IERiRmllbGQpID0+ICh4LnR5cGUgPT09IHNjYWxhclR5cGVzLnVpbnQ2NCkgfHwgKHgudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDEwMjQpKTtcbiAgICAgICAgY29uc3QgY3VzdG9tUmVzb2x2ZXJSZXF1aXJlZCA9IHR5cGUuY29sbGVjdGlvblxuICAgICAgICAgICAgfHwgam9pbkZpZWxkcy5sZW5ndGggPiAwXG4gICAgICAgICAgICB8fCBiaWdVSW50RmllbGRzLmxlbmd0aCA+IDA7XG4gICAgICAgIGlmICghY3VzdG9tUmVzb2x2ZXJSZXF1aXJlZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgJHt0eXBlLm5hbWV9OiB7YCk7XG4gICAgICAgIGlmICh0eXBlLmNvbGxlY3Rpb24pIHtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oJyAgICAgICAgICAgIGlkKHBhcmVudCkgeycpO1xuICAgICAgICAgICAganMud3JpdGVMbignICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTsnKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oJyAgICAgICAgICAgIH0sJyk7XG4gICAgICAgIH1cbiAgICAgICAgam9pbkZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgY29uc3Qgb25GaWVsZCA9IHR5cGUuZmllbGRzLmZpbmQoeCA9PiB4Lm5hbWUgPT09IChmaWVsZC5qb2luICYmIGZpZWxkLmpvaW4ub24pIHx8ICcnKTtcbiAgICAgICAgICAgIGlmICghb25GaWVsZCkge1xuICAgICAgICAgICAgICAgIHRocm93ICdKb2luIG9uIGZpZWxkIGRvZXMgbm90IGV4aXN0Lic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBjb2xsZWN0aW9uID0gZmllbGQudHlwZS5jb2xsZWN0aW9uO1xuICAgICAgICAgICAgaWYgKCFjb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgJ0pvaW5lZCB0eXBlIGlzIG5vdCBhIGNvbGxlY3Rpb24uJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICR7ZmllbGQubmFtZX0ocGFyZW50KSB7YCk7XG4gICAgICAgICAgICBpZiAoZmllbGQuYXJyYXlEZXB0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICAgICByZXR1cm4gZGIuZmV0Y2hEb2NCeUtleShkYi4ke2NvbGxlY3Rpb259LCBwYXJlbnQuJHtvbkZpZWxkLm5hbWV9KTtgKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQuYXJyYXlEZXB0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICAgICByZXR1cm4gZGIuZmV0Y2hEb2NzQnlLZXlzKGRiLiR7Y29sbGVjdGlvbn0sIHBhcmVudC4ke29uRmllbGQubmFtZX0pO2ApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyAnSm9pbnMgb24gYSBuZXN0ZWQgYXJyYXlzIGRvZXMgbm90IHN1cHBvcnRlZC4nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgfSxgKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGJpZ1VJbnRGaWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHByZWZpeExlbmd0aCA9IGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLnVpbnQ2NCA/IDEgOiAyO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgJHtmaWVsZC5uYW1lfShwYXJlbnQpIHtgKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoJHtwcmVmaXhMZW5ndGh9LCBwYXJlbnQuJHtmaWVsZC5uYW1lfSk7YCk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICB9LGApO1xuICAgICAgICB9KTtcbiAgICAgICAganMud3JpdGVMbihgICAgICAgICB9LGApO1xuICAgIH1cblxuXG4gICAgZnVuY3Rpb24gZ2VuSlNUeXBlUmVzb2x2ZXJzRm9yVW5pb24odHlwZTogRGJUeXBlKSB7XG4gICAgICAgIGlmICh0eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS51bmlvbikge1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAke3R5cGUubmFtZX06ICR7dHlwZS5uYW1lfVJlc29sdmVyLGApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuZXJhdGUodHlwZXM6IERiVHlwZVtdKSB7XG5cbiAgICAgICAgLy8gUUxcblxuICAgICAgICBbJ1N0cmluZycsICdCb29sZWFuJywgJ0ludCcsICdGbG9hdCddLmZvckVhY2goZ2VuUUxTY2FsYXJUeXBlc0ZpbHRlcik7XG4gICAgICAgIHR5cGVzLmZvckVhY2godHlwZSA9PiBnZW5RTFR5cGVEZWNsYXJhdGlvbih0eXBlKSk7XG4gICAgICAgIGNvbnN0IHFsQXJyYXlGaWx0ZXJzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgICAgIHR5cGVzLmZvckVhY2godHlwZSA9PiBnZW5RTEZpbHRlcih0eXBlLCBxbEFycmF5RmlsdGVycykpO1xuXG4gICAgICAgIGNvbnN0IGNvbGxlY3Rpb25zID0gdHlwZXMuZmlsdGVyKHQgPT4gISF0LmNvbGxlY3Rpb24pO1xuICAgICAgICBnZW5RTFF1ZXJpZXMoY29sbGVjdGlvbnMpO1xuICAgICAgICBnZW5RTFN1YnNjcmlwdGlvbnMoY29sbGVjdGlvbnMpO1xuXG4gICAgICAgIC8vIEpTXG5cbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgY29uc3QgeyBzY2FsYXIsIGJpZ1VJbnQxLCBiaWdVSW50MiwgcmVzb2x2ZUJpZ1VJbnQsIHN0cnVjdCwgYXJyYXksIGpvaW4sIGpvaW5BcnJheSB9ID0gcmVxdWlyZSgnLi9hcmFuZ28tdHlwZXMuanMnKTtcbiAgICAgICAgYCk7XG4gICAgICAgIGNvbnN0IGpzQXJyYXlGaWx0ZXJzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgICAgIHR5cGVzLmZvckVhY2godHlwZSA9PiBnZW5KU0ZpbHRlcih0eXBlLCBqc0FycmF5RmlsdGVycykpO1xuXG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIGZ1bmN0aW9uIGNyZWF0ZVJlc29sdmVycyhkYikge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgYCk7XG4gICAgICAgIHR5cGVzLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICAgICAgICAgIGdlbkpTQ3VzdG9tUmVzb2x2ZXJzKHR5cGUpO1xuICAgICAgICAgICAgZ2VuSlNUeXBlUmVzb2x2ZXJzRm9yVW5pb24odHlwZSk7XG4gICAgICAgIH0pO1xuICAgICAgICBqcy53cml0ZUxuKCcgICAgICAgIFF1ZXJ5OiB7Jyk7XG4gICAgICAgIGNvbGxlY3Rpb25zLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICR7dHlwZS5jb2xsZWN0aW9uIHx8ICcnfTogZGIuY29sbGVjdGlvblF1ZXJ5KGRiLiR7dHlwZS5jb2xsZWN0aW9uIHx8ICcnfSwgJHt0eXBlLm5hbWV9KSxgKVxuICAgICAgICB9KTtcbiAgICAgICAganMud3JpdGVMbignICAgICAgICAgICAgc2VsZWN0OiBkYi5zZWxlY3RRdWVyeSgpLCcpO1xuICAgICAgICBqcy53cml0ZUxuKCcgICAgICAgIH0sJyk7XG4gICAgICAgIGpzLndyaXRlTG4oJyAgICAgICAgU3Vic2NyaXB0aW9uOiB7Jyk7XG4gICAgICAgIGNvbGxlY3Rpb25zLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICR7dHlwZS5jb2xsZWN0aW9uIHx8ICcnfTogZGIuY29sbGVjdGlvblN1YnNjcmlwdGlvbihkYi4ke3R5cGUuY29sbGVjdGlvbiB8fCAnJ30sICR7dHlwZS5uYW1lfSksYClcbiAgICAgICAgfSk7XG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGApO1xuXG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0ge1xuICAgICAgICAgICAgY3JlYXRlUmVzb2x2ZXJzXG4gICAgICAgIH07XG4gICAgICAgIGApO1xuICAgIH1cblxuICAgIGNvbnN0IHNjaGVtYSA9IHBhcnNlVHlwZURlZihzY2hlbWFEZWYpO1xuXG4gICAgaWYgKHNjaGVtYS5jbGFzcykge1xuICAgICAgICBwYXJzZURiVHlwZXMoc2NoZW1hLmNsYXNzLnR5cGVzKTtcbiAgICAgICAgZ2VuZXJhdGUoZGJUeXBlcyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcWw6IHFsLmdlbmVyYXRlZCgpLFxuICAgICAgICBqczoganMuZ2VuZXJhdGVkKCksXG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBtYWluO1xuIl19