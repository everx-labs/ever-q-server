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
      var unsigned = schemaType["int"] && schemaType["int"].unsigned || false;
      var size = schemaType["int"] && schemaType["int"].size || 32;

      if (unsigned) {
        if (size >= 128) {
          reportType(typeName, field.name, 'u1024');
          field.type = scalarTypes.uint1024;
        } else if (size >= 64) {
          reportType(typeName, field.name, 'u64');
          field.type = scalarTypes.uint64;
        } else if (size >= 32) {
          reportType(typeName, field.name, 'u32');
          field.type = scalarTypes["float"];
        } else {
          reportType(typeName, field.name, "u".concat(size));
          field.type = scalarTypes["int"];
        }
      } else {
        if (size > 32) {
          throw new Error("Integer type with size ".concat(size, " bit does not supported"));
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
    js.writeBlockLn("\n        module.exports = {\n            createResolvers,\n        ");
    types.forEach(function (type) {
      return js.writeLn("    ".concat(type.name, ","));
    });
    js.writeBlockLn("\n        };\n        ");
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9nZW4tcWwtanMuanMiXSwibmFtZXMiOlsiRGJUeXBlQ2F0ZWdvcnkiLCJ1bnJlc29sdmVkIiwic2NhbGFyIiwidW5pb24iLCJzdHJ1Y3QiLCJzY2FsYXJUeXBlIiwibmFtZSIsImNhdGVnb3J5IiwiZmllbGRzIiwic2NhbGFyVHlwZXMiLCJ1aW50NjQiLCJ1aW50MTAyNCIsInN0cmluZyIsInVucmVzb2x2ZWRUeXBlIiwibWFpbiIsInNjaGVtYURlZiIsImRiVHlwZXMiLCJsYXN0UmVwb3J0ZWRUeXBlIiwicmVwb3J0VHlwZSIsImZpZWxkIiwidHlwZSIsImNvbnNvbGUiLCJsb2ciLCJwYXJzZURiRmllbGQiLCJ0eXBlTmFtZSIsInNjaGVtYUZpZWxkIiwic2NoZW1hVHlwZSIsImFycmF5RGVwdGgiLCJhcnJheSIsImpvaW4iLCJfIiwicmVmIiwiYm9vbCIsInVuc2lnbmVkIiwic2l6ZSIsIkVycm9yIiwiSlNPTiIsInN0cmluZ2lmeSIsInByb2Nlc3MiLCJleGl0IiwidW53cmFwQXJyYXlzIiwicGFyc2VEYlR5cGUiLCJzdWJzdHIiLCJjb2xsZWN0aW9uIiwicHVzaCIsImZvckVhY2giLCJ1bndyYXBwZWQiLCJvd25UeXBlIiwicGFyc2VEYlR5cGVzIiwidHlwZXMiLCJNYXAiLCJyZXNvbHZpbmciLCJTZXQiLCJyZXNvbHZlZCIsIm9yZGVyZWRSZXNvbHZlZCIsInQiLCJzZXQiLCJyZXNvbHZlVHlwZSIsImhhcyIsImFkZCIsImdldCIsInFsIiwiV3JpdGVyIiwianMiLCJ1bmlvblZhcmlhbnRUeXBlIiwidmFyaWFudCIsImdlblFMVHlwZURlY2xhcmF0aW9uc0ZvclVuaW9uVmFyaWFudHMiLCJ3cml0ZUJsb2NrTG4iLCJnZW5RTFR5cGVEZWNsYXJhdGlvbiIsIndyaXRlTG4iLCJ0eXBlRGVjbGFyYXRpb24iLCJyZXBlYXQiLCJwcmV2ZW50VHdpY2UiLCJuYW1lcyIsIndvcmsiLCJnZW5RTEZpbHRlcnNGb3JBcnJheUZpZWxkcyIsInFsTmFtZXMiLCJpdGVtVHlwZU5hbWUiLCJpIiwiZmlsdGVyTmFtZSIsIm9wIiwiZ2VuUUxGaWx0ZXIiLCJsZW5ndGgiLCJnZW5RTFNjYWxhclR5cGVzRmlsdGVyIiwiZ2VuUUxRdWVyaWVzIiwiZ2VuUUxTdWJzY3JpcHRpb25zIiwiZ2VuSlNGaWx0ZXJzRm9yQXJyYXlGaWVsZHMiLCJqc05hbWVzIiwiZ2VuSlNTdHJ1Y3RGaWx0ZXIiLCJvbiIsImdlbkpTVW5pb25SZXNvbHZlciIsImdlbkpTRmlsdGVyIiwiZ2VuSlNDdXN0b21SZXNvbHZlcnMiLCJqb2luRmllbGRzIiwiZmlsdGVyIiwieCIsImJpZ1VJbnRGaWVsZHMiLCJjdXN0b21SZXNvbHZlclJlcXVpcmVkIiwib25GaWVsZCIsImZpbmQiLCJwcmVmaXhMZW5ndGgiLCJnZW5KU1R5cGVSZXNvbHZlcnNGb3JVbmlvbiIsImdlbmVyYXRlIiwicWxBcnJheUZpbHRlcnMiLCJjb2xsZWN0aW9ucyIsImpzQXJyYXlGaWx0ZXJzIiwic2NoZW1hIiwiZ2VuZXJhdGVkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBRUE7O0FBRUE7O0FBRUEsSUFBTUEsY0FBYyxHQUFHO0FBQ25CQyxFQUFBQSxVQUFVLEVBQUUsWUFETztBQUVuQkMsRUFBQUEsTUFBTSxFQUFFLFFBRlc7QUFHbkJDLEVBQUFBLEtBQUssRUFBRSxPQUhZO0FBSW5CQyxFQUFBQSxNQUFNLEVBQUU7QUFKVyxDQUF2Qjs7QUEwQkEsU0FBU0MsVUFBVCxDQUFvQkMsSUFBcEIsRUFBMEM7QUFDdEMsU0FBTztBQUNIQSxJQUFBQSxJQUFJLEVBQUpBLElBREc7QUFFSEMsSUFBQUEsUUFBUSxFQUFFUCxjQUFjLENBQUNFLE1BRnRCO0FBR0hNLElBQUFBLE1BQU0sRUFBRTtBQUhMLEdBQVA7QUFLSDs7QUFFRCxJQUFNQyxXQUFXLEdBQUc7QUFDaEIsU0FBS0osVUFBVSxDQUFDLEtBQUQsQ0FEQztBQUVoQkssRUFBQUEsTUFBTSxFQUFFTCxVQUFVLENBQUMsUUFBRCxDQUZGO0FBR2hCTSxFQUFBQSxRQUFR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QVg7QUFDQU4sSUFBQUEsRUFBRSxDQUFDTSxPQUFILENBQVcsWUFBWDtBQUNBTixJQUFBQSxFQUFFLENBQUNNLE9BQUgsQ0FBVyx5QkFBWDtBQUNBbUMsSUFBQUEsV0FBVyxDQUFDM0QsT0FBWixDQUFvQixVQUFDekIsSUFBRCxFQUFVO0FBQzFCMkMsTUFBQUEsRUFBRSxDQUFDTSxPQUFILHVCQUEwQmpELElBQUksQ0FBQ3VCLFVBQUwsSUFBbUIsRUFBN0MsNENBQWlGdkIsSUFBSSxDQUFDdUIsVUFBTCxJQUFtQixFQUFwRyxlQUEyR3ZCLElBQUksQ0FBQ2QsSUFBaEg7QUFDSCxLQUZEO0FBR0F5RCxJQUFBQSxFQUFFLENBQUNJLFlBQUg7QUFNQUosSUFBQUEsRUFBRSxDQUFDSSxZQUFIO0FBSUFsQixJQUFBQSxLQUFLLENBQUNKLE9BQU4sQ0FBYyxVQUFBekIsSUFBSTtBQUFBLGFBQUkyQyxFQUFFLENBQUNNLE9BQUgsZUFBa0JqRCxJQUFJLENBQUNkLElBQXZCLE9BQUo7QUFBQSxLQUFsQjtBQUNBeUQsSUFBQUEsRUFBRSxDQUFDSSxZQUFIO0FBR0g7O0FBRUQsTUFBTXVDLE1BQU0sR0FBRywwQkFBYTNGLFNBQWIsQ0FBZjs7QUFFQSxNQUFJMkYsTUFBTSxTQUFWLEVBQWtCO0FBQ2QxRCxJQUFBQSxZQUFZLENBQUMwRCxNQUFNLFNBQU4sQ0FBYXpELEtBQWQsQ0FBWjtBQUNBcUQsSUFBQUEsUUFBUSxDQUFDdEYsT0FBRCxDQUFSO0FBQ0g7O0FBRUQsU0FBTztBQUNINkMsSUFBQUEsRUFBRSxFQUFFQSxFQUFFLENBQUM4QyxTQUFILEVBREQ7QUFFSDVDLElBQUFBLEVBQUUsRUFBRUEsRUFBRSxDQUFDNEMsU0FBSDtBQUZELEdBQVA7QUFJSDs7ZUFFYzdGLEkiLCJzb3VyY2VzQ29udGVudCI6WyIvL0BmbG93XG5cbmltcG9ydCB7IG1ha2VGaWVsZFR5cGVOYW1lLCBXcml0ZXIgfSBmcm9tICd0b24tbGFicy1kZXYtb3BzL2Rpc3Qvc3JjL2dlbi5qcyc7XG5pbXBvcnQgdHlwZSB7IFNjaGVtYU1lbWJlciwgU2NoZW1hVHlwZSwgVHlwZURlZiB9IGZyb20gJ3Rvbi1sYWJzLWRldi1vcHMvc3JjL3NjaGVtYS5qcyc7XG5pbXBvcnQgeyBwYXJzZVR5cGVEZWYgfSBmcm9tICd0b24tbGFicy1kZXYtb3BzL2Rpc3Qvc3JjL3NjaGVtYS5qcyc7XG5cbmNvbnN0IERiVHlwZUNhdGVnb3J5ID0ge1xuICAgIHVucmVzb2x2ZWQ6ICd1bnJlc29sdmVkJyxcbiAgICBzY2FsYXI6ICdzY2FsYXInLFxuICAgIHVuaW9uOiAndW5pb24nLFxuICAgIHN0cnVjdDogJ3N0cnVjdCcsXG59O1xuXG50eXBlIERiSm9pbiA9IHtcbiAgICBjb2xsZWN0aW9uOiBzdHJpbmcsXG4gICAgb246IHN0cmluZyxcbn1cblxudHlwZSBEYlR5cGUgPSB7XG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGNhdGVnb3J5OiAkS2V5czx0eXBlb2YgRGJUeXBlQ2F0ZWdvcnk+LFxuICAgIGNvbGxlY3Rpb24/OiBzdHJpbmcsXG4gICAgZmllbGRzOiBEYkZpZWxkW10sXG59XG5cbnR5cGUgRGJGaWVsZCA9IHtcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgYXJyYXlEZXB0aDogbnVtYmVyLFxuICAgIGpvaW4/OiBEYkpvaW4sXG4gICAgdHlwZTogRGJUeXBlLFxufVxuXG5mdW5jdGlvbiBzY2FsYXJUeXBlKG5hbWU6IHN0cmluZyk6IERiVHlwZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgbmFtZSxcbiAgICAgICAgY2F0ZWdvcnk6IERiVHlwZUNhdGVnb3J5LnNjYWxhcixcbiAgICAgICAgZmllbGRzOiBbXVxuICAgIH1cbn1cblxuY29uc3Qgc2NhbGFyVHlwZXMgPSB7XG4gICAgaW50OiBzY2FsYXJUeXBlKCdJbnQnKSxcbiAgICB1aW50NjQ6IHNjYWxhclR5cGUoJ1N0cmluZycpLFxuICAgIHVpbnQxMDI0OiBzY2FsYXJUeXBlKCdTdHJpbmcnKSxcbiAgICBmbG9hdDogc2NhbGFyVHlwZSgnRmxvYXQnKSxcbiAgICBib29sZWFuOiBzY2FsYXJUeXBlKCdCb29sZWFuJyksXG4gICAgc3RyaW5nOiBzY2FsYXJUeXBlKCdTdHJpbmcnKSxcbn07XG5cbmZ1bmN0aW9uIHVucmVzb2x2ZWRUeXBlKG5hbWU6IHN0cmluZyk6IERiVHlwZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgbmFtZSxcbiAgICAgICAgY2F0ZWdvcnk6IERiVHlwZUNhdGVnb3J5LnVucmVzb2x2ZWQsXG4gICAgICAgIGZpZWxkczogW10sXG4gICAgfVxufVxuXG5mdW5jdGlvbiBtYWluKHNjaGVtYURlZjogVHlwZURlZikge1xuXG4gICAgbGV0IGRiVHlwZXM6IERiVHlwZVtdID0gW107XG4gICAgbGV0IGxhc3RSZXBvcnRlZFR5cGU6IHN0cmluZyA9ICcnO1xuXG4gICAgZnVuY3Rpb24gcmVwb3J0VHlwZShuYW1lOiBzdHJpbmcsIGZpZWxkOiBzdHJpbmcsIHR5cGU6IHN0cmluZykge1xuICAgICAgICBpZiAobmFtZSAhPT0gbGFzdFJlcG9ydGVkVHlwZSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2cobmFtZSk7XG4gICAgICAgICAgICBsYXN0UmVwb3J0ZWRUeXBlID0gbmFtZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmxvZyhgICAgICR7ZmllbGR9OiAke3R5cGV9YCk7XG5cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZURiRmllbGQoXG4gICAgICAgIHR5cGVOYW1lOiBzdHJpbmcsXG4gICAgICAgIHNjaGVtYUZpZWxkOiBTY2hlbWFNZW1iZXI8U2NoZW1hVHlwZT4sXG4gICAgKTogRGJGaWVsZCB7XG4gICAgICAgIGxldCBzY2hlbWFUeXBlID0gc2NoZW1hRmllbGQ7XG4gICAgICAgIGNvbnN0IGZpZWxkOiBEYkZpZWxkID0ge1xuICAgICAgICAgICAgbmFtZTogc2NoZW1hRmllbGQubmFtZSxcbiAgICAgICAgICAgIGFycmF5RGVwdGg6IDAsXG4gICAgICAgICAgICB0eXBlOiBzY2FsYXJUeXBlcy5zdHJpbmcsXG4gICAgICAgIH07XG4gICAgICAgIHdoaWxlIChzY2hlbWFUeXBlLmFycmF5KSB7XG4gICAgICAgICAgICBmaWVsZC5hcnJheURlcHRoICs9IDE7XG4gICAgICAgICAgICBzY2hlbWFUeXBlID0gc2NoZW1hVHlwZS5hcnJheTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBqb2luID0gKHNjaGVtYVR5cGU6IGFueSkuXy5qb2luO1xuICAgICAgICBpZiAoam9pbikge1xuICAgICAgICAgICAgZmllbGQuam9pbiA9IGpvaW47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNjaGVtYVR5cGUudW5pb24gfHwgc2NoZW1hVHlwZS5zdHJ1Y3QpIHtcbiAgICAgICAgICAgIGZpZWxkLnR5cGUgPSB1bnJlc29sdmVkVHlwZShtYWtlRmllbGRUeXBlTmFtZSh0eXBlTmFtZSwgc2NoZW1hRmllbGQubmFtZSkpO1xuICAgICAgICB9IGVsc2UgaWYgKHNjaGVtYVR5cGUucmVmKSB7XG4gICAgICAgICAgICBmaWVsZC50eXBlID0gdW5yZXNvbHZlZFR5cGUoc2NoZW1hVHlwZS5yZWYubmFtZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoc2NoZW1hVHlwZS5ib29sKSB7XG4gICAgICAgICAgICBmaWVsZC50eXBlID0gc2NhbGFyVHlwZXMuYm9vbGVhbjtcbiAgICAgICAgfSBlbHNlIGlmIChzY2hlbWFUeXBlLmludCkge1xuICAgICAgICAgICAgY29uc3QgdW5zaWduZWQ6IGJvb2xlYW4gPSAoc2NoZW1hVHlwZS5pbnQgJiYgc2NoZW1hVHlwZS5pbnQudW5zaWduZWQpIHx8IGZhbHNlO1xuICAgICAgICAgICAgY29uc3Qgc2l6ZTogbnVtYmVyID0gKHNjaGVtYVR5cGUuaW50ICYmIHNjaGVtYVR5cGUuaW50LnNpemUpIHx8IDMyO1xuICAgICAgICAgICAgaWYgKHVuc2lnbmVkKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNpemUgPj0gMTI4KSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcG9ydFR5cGUodHlwZU5hbWUsIGZpZWxkLm5hbWUsICd1MTAyNCcpO1xuICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlID0gc2NhbGFyVHlwZXMudWludDEwMjQ7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzaXplID49IDY0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcG9ydFR5cGUodHlwZU5hbWUsIGZpZWxkLm5hbWUsICd1NjQnKTtcbiAgICAgICAgICAgICAgICAgICAgZmllbGQudHlwZSA9IHNjYWxhclR5cGVzLnVpbnQ2NDtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHNpemUgPj0gMzIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVwb3J0VHlwZSh0eXBlTmFtZSwgZmllbGQubmFtZSwgJ3UzMicpO1xuICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlID0gc2NhbGFyVHlwZXMuZmxvYXQ7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVwb3J0VHlwZSh0eXBlTmFtZSwgZmllbGQubmFtZSwgYHUke3NpemV9YCk7XG4gICAgICAgICAgICAgICAgICAgIGZpZWxkLnR5cGUgPSBzY2FsYXJUeXBlcy5pbnQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoc2l6ZSA+IDMyKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSW50ZWdlciB0eXBlIHdpdGggc2l6ZSAke3NpemV9IGJpdCBkb2VzIG5vdCBzdXBwb3J0ZWRgKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXBvcnRUeXBlKHR5cGVOYW1lLCBmaWVsZC5uYW1lLCAnaTMyJyk7XG4gICAgICAgICAgICAgICAgICAgIGZpZWxkLnR5cGUgPSBzY2FsYXJUeXBlcy5pbnQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHNjaGVtYVR5cGUuZmxvYXQpIHtcbiAgICAgICAgICAgIHJlcG9ydFR5cGUodHlwZU5hbWUsIGZpZWxkLm5hbWUsICdmbG9hdCcpO1xuICAgICAgICAgICAgZmllbGQudHlwZSA9IHNjYWxhclR5cGVzLmZsb2F0O1xuICAgICAgICB9IGVsc2UgaWYgKHNjaGVtYVR5cGUuc3RyaW5nKSB7XG4gICAgICAgICAgICBmaWVsZC50eXBlID0gc2NhbGFyVHlwZXMuc3RyaW5nO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZmllbGQudHlwZSA9IHNjYWxhclR5cGVzLnN0cmluZztcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+Pj4gSW52YWxpZCBmaWVsZCB0eXBlOiAnLCBKU09OLnN0cmluZ2lmeShzY2hlbWFUeXBlKSk7XG4gICAgICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZpZWxkO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHVud3JhcEFycmF5cyh0eXBlOiBTY2hlbWFUeXBlKTogU2NoZW1hVHlwZSB7XG4gICAgICAgIGlmICh0eXBlLmFycmF5KSB7XG4gICAgICAgICAgICByZXR1cm4gdW53cmFwQXJyYXlzKHR5cGUuYXJyYXkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0eXBlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlRGJUeXBlKFxuICAgICAgICBuYW1lOiBzdHJpbmcsXG4gICAgICAgIHNjaGVtYVR5cGU6IFNjaGVtYVR5cGVcbiAgICApIHtcbiAgICAgICAgY29uc3Qgc3RydWN0ID0gc2NoZW1hVHlwZS51bmlvbiB8fCBzY2hlbWFUeXBlLnN0cnVjdDtcbiAgICAgICAgaWYgKCFzdHJ1Y3QpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+Pj4nLCBgPz8gJHtuYW1lfTogJHtKU09OLnN0cmluZ2lmeShzY2hlbWFUeXBlKS5zdWJzdHIoMCwgMjApfWApO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHR5cGU6IERiVHlwZSA9IHtcbiAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICBjYXRlZ29yeTogc2NoZW1hVHlwZS51bmlvbiA/IERiVHlwZUNhdGVnb3J5LnVuaW9uIDogRGJUeXBlQ2F0ZWdvcnkuc3RydWN0LFxuICAgICAgICAgICAgZmllbGRzOiBbXSxcbiAgICAgICAgICAgIGNvbGxlY3Rpb246IChzY2hlbWFUeXBlOiBhbnkpLl8uY29sbGVjdGlvbixcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAodHlwZS5jb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICB0eXBlLmZpZWxkcy5wdXNoKHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnaWQnLFxuICAgICAgICAgICAgICAgIGFycmF5RGVwdGg6IDAsXG4gICAgICAgICAgICAgICAgdHlwZTogc2NhbGFyVHlwZXMuc3RyaW5nLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgc3RydWN0LmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICB0eXBlLmZpZWxkcy5wdXNoKHBhcnNlRGJGaWVsZChuYW1lLCBmaWVsZCkpO1xuICAgICAgICAgICAgY29uc3QgdW53cmFwcGVkID0gdW53cmFwQXJyYXlzKGZpZWxkKTtcbiAgICAgICAgICAgIGNvbnN0IG93blR5cGUgPSAodW53cmFwcGVkLnN0cnVjdCB8fCB1bndyYXBwZWQudW5pb24pID8gdW53cmFwcGVkIDogbnVsbDtcbiAgICAgICAgICAgIGlmIChvd25UeXBlKSB7XG4gICAgICAgICAgICAgICAgcGFyc2VEYlR5cGUobWFrZUZpZWxkVHlwZU5hbWUobmFtZSwgZmllbGQubmFtZSksIG93blR5cGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgZGJUeXBlcy5wdXNoKHR5cGUpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlRGJUeXBlcyh0eXBlczogU2NoZW1hTWVtYmVyPFNjaGVtYVR5cGU+W10pIHtcbiAgICAgICAgdHlwZXMuZm9yRWFjaCgodHlwZTogU2NoZW1hTWVtYmVyPFNjaGVtYVR5cGU+KSA9PiB7XG4gICAgICAgICAgICBwYXJzZURiVHlwZSh0eXBlLm5hbWUsIHR5cGUpO1xuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgdW5yZXNvbHZlZDogTWFwPHN0cmluZywgRGJUeXBlPiA9IG5ldyBNYXA8c3RyaW5nLCBEYlR5cGU+KCk7XG4gICAgICAgIGNvbnN0IHJlc29sdmluZzogU2V0PHN0cmluZz4gPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICAgICAgY29uc3QgcmVzb2x2ZWQ6IE1hcDxzdHJpbmcsIERiVHlwZT4gPSBuZXcgTWFwPHN0cmluZywgRGJUeXBlPigpO1xuICAgICAgICBjb25zdCBvcmRlcmVkUmVzb2x2ZWQ6IERiVHlwZVtdID0gW107XG4gICAgICAgIGRiVHlwZXMuZm9yRWFjaCh0ID0+IHVucmVzb2x2ZWQuc2V0KHQubmFtZSwgdCkpO1xuICAgICAgICBjb25zdCByZXNvbHZlVHlwZSA9ICh0eXBlOiBEYlR5cGUpID0+IHtcbiAgICAgICAgICAgIGlmIChyZXNvbHZlZC5oYXModHlwZS5uYW1lKSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChyZXNvbHZpbmcuaGFzKHR5cGUubmFtZSkpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnPj4+JywgYENpcmN1bGFyIHJlZmVyZW5jZSB0byB0eXBlICR7dHlwZS5uYW1lfWApO1xuICAgICAgICAgICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlc29sdmluZy5hZGQodHlwZS5uYW1lKTtcbiAgICAgICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGZpZWxkLnR5cGUuY2F0ZWdvcnkgPT09IERiVHlwZUNhdGVnb3J5LnVucmVzb2x2ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHR5cGUgPSByZXNvbHZlZC5nZXQoZmllbGQudHlwZS5uYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlID0gdW5yZXNvbHZlZC5nZXQoZmllbGQudHlwZS5uYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZVR5cGUodHlwZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+Pj4nLCBgUmVmZXJlbmNlZCB0eXBlIG5vdCBmb3VuZDogJHtmaWVsZC50eXBlLm5hbWV9YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlID0gdHlwZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmVzb2x2aW5nLmRlbGV0ZSh0eXBlLm5hbWUpO1xuICAgICAgICAgICAgb3JkZXJlZFJlc29sdmVkLnB1c2godHlwZSk7XG4gICAgICAgICAgICB1bnJlc29sdmVkLmRlbGV0ZSh0eXBlLm5hbWUpO1xuICAgICAgICAgICAgcmVzb2x2ZWQuc2V0KHR5cGUubmFtZSwgdHlwZSk7XG4gICAgICAgIH07XG4gICAgICAgIGRiVHlwZXMuZm9yRWFjaChyZXNvbHZlVHlwZSk7XG4gICAgICAgIGRiVHlwZXMgPSBvcmRlcmVkUmVzb2x2ZWQ7XG4gICAgfVxuXG4vLyBHZW5lcmF0b3JzXG5cbiAgICBjb25zdCBxbCA9IG5ldyBXcml0ZXIoKTtcbiAgICBjb25zdCBqcyA9IG5ldyBXcml0ZXIoKTtcblxuICAgIGZ1bmN0aW9uIHVuaW9uVmFyaWFudFR5cGUodHlwZTogRGJUeXBlLCB2YXJpYW50OiBEYkZpZWxkKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIGAke3R5cGUubmFtZX0ke3ZhcmlhbnQubmFtZX1WYXJpYW50YDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5RTFR5cGVEZWNsYXJhdGlvbnNGb3JVbmlvblZhcmlhbnRzKHR5cGU6IERiVHlwZSkge1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKCh2YXJpYW50KSA9PiB7XG4gICAgICAgICAgICBxbC53cml0ZUJsb2NrTG4oYFxuICAgICAgICB0eXBlICR7dW5pb25WYXJpYW50VHlwZSh0eXBlLCB2YXJpYW50KX0ge1xuICAgICAgICAgICAgJHt2YXJpYW50Lm5hbWV9OiAke3ZhcmlhbnQudHlwZS5uYW1lfVxuICAgICAgICB9XG5cbiAgICAgICAgYCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlblFMVHlwZURlY2xhcmF0aW9uKHR5cGU6IERiVHlwZSkge1xuICAgICAgICBpZiAodHlwZS5jYXRlZ29yeSA9PT0gRGJUeXBlQ2F0ZWdvcnkudW5pb24pIHtcbiAgICAgICAgICAgIGdlblFMVHlwZURlY2xhcmF0aW9uc0ZvclVuaW9uVmFyaWFudHModHlwZSk7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGB1bmlvbiAke3R5cGUubmFtZX0gPSBgKTtcbiAgICAgICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2godmFyaWFudCA9PiB7XG4gICAgICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0fCAke3VuaW9uVmFyaWFudFR5cGUodHlwZSwgdmFyaWFudCl9YCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oYHR5cGUgJHt0eXBlLm5hbWV9IHtgKTtcbiAgICAgICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goZmllbGQgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHR5cGVEZWNsYXJhdGlvbiA9XG4gICAgICAgICAgICAgICAgICAgICdbJy5yZXBlYXQoZmllbGQuYXJyYXlEZXB0aCkgK1xuICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlLm5hbWUgK1xuICAgICAgICAgICAgICAgICAgICAnXScucmVwZWF0KGZpZWxkLmFycmF5RGVwdGgpO1xuICAgICAgICAgICAgICAgIHFsLndyaXRlTG4oYFxcdCR7ZmllbGQubmFtZX06ICR7dHlwZURlY2xhcmF0aW9ufWApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGB9YCk7XG4gICAgICAgIH1cbiAgICAgICAgcWwud3JpdGVMbigpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHByZXZlbnRUd2ljZShuYW1lOiBzdHJpbmcsIG5hbWVzOiBTZXQ8c3RyaW5nPiwgd29yazogKCkgPT4gdm9pZCkge1xuICAgICAgICBpZiAoIW5hbWVzLmhhcyhuYW1lKSkge1xuICAgICAgICAgICAgbmFtZXMuYWRkKG5hbWUpO1xuICAgICAgICAgICAgd29yaygpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuUUxGaWx0ZXJzRm9yQXJyYXlGaWVsZHModHlwZTogRGJUeXBlLCBxbE5hbWVzOiBTZXQ8c3RyaW5nPikge1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgbGV0IGl0ZW1UeXBlTmFtZSA9IGZpZWxkLnR5cGUubmFtZTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZmllbGQuYXJyYXlEZXB0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmlsdGVyTmFtZSA9IGAke2l0ZW1UeXBlTmFtZX1BcnJheUZpbHRlcmA7XG4gICAgICAgICAgICAgICAgcHJldmVudFR3aWNlKGZpbHRlck5hbWUsIHFsTmFtZXMsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcWwud3JpdGVMbihgaW5wdXQgJHtmaWx0ZXJOYW1lfSB7YCk7XG4gICAgICAgICAgICAgICAgICAgIFsnYW55JywgJ2FsbCddLmZvckVhY2goKG9wKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBxbC53cml0ZUxuKGBcXHQke29wfTogJHtpdGVtVHlwZU5hbWV9RmlsdGVyYCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBxbC53cml0ZUxuKCd9Jyk7XG4gICAgICAgICAgICAgICAgICAgIHFsLndyaXRlTG4oKTtcblxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGl0ZW1UeXBlTmFtZSArPSAnQXJyYXknO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5RTEZpbHRlcih0eXBlOiBEYlR5cGUsIHFsTmFtZXM6IFNldDxzdHJpbmc+KSB7XG4gICAgICAgIGlmICh0eXBlLmZpZWxkcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBnZW5RTEZpbHRlcnNGb3JBcnJheUZpZWxkcyh0eXBlLCBxbE5hbWVzKTtcbiAgICAgICAgcWwud3JpdGVMbihgaW5wdXQgJHt0eXBlLm5hbWV9RmlsdGVyIHtgKTtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHR5cGVEZWNsYXJhdGlvbiA9IGZpZWxkLnR5cGUubmFtZSArIFwiQXJyYXlcIi5yZXBlYXQoZmllbGQuYXJyYXlEZXB0aCk7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGBcXHQke2ZpZWxkLm5hbWV9OiAke3R5cGVEZWNsYXJhdGlvbn1GaWx0ZXJgKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHFsLndyaXRlTG4oYH1gKTtcbiAgICAgICAgcWwud3JpdGVMbigpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlblFMU2NhbGFyVHlwZXNGaWx0ZXIobmFtZTogc3RyaW5nKSB7XG4gICAgICAgIHFsLndyaXRlTG4oYGlucHV0ICR7bmFtZX1GaWx0ZXIge2ApO1xuICAgICAgICBbJ2VxJywgJ25lJywgJ2d0JywgJ2x0JywgJ2dlJywgJ2xlJ10uZm9yRWFjaCgob3ApID0+IHtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oYFxcdCR7b3B9OiAke25hbWV9YCk7XG4gICAgICAgIH0pO1xuICAgICAgICBbJ2luJywgJ25vdEluJ10uZm9yRWFjaCgob3ApID0+IHtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oYFxcdCR7b3B9OiBbJHtuYW1lfV1gKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHFsLndyaXRlTG4oJ30nKTtcbiAgICAgICAgcWwud3JpdGVMbigpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlblFMUXVlcmllcyh0eXBlczogRGJUeXBlW10pIHtcbiAgICAgICAgcWwud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgZW51bSBRdWVyeU9yZGVyQnlEaXJlY3Rpb24ge1xuICAgICAgICAgICAgQVNDXG4gICAgICAgICAgICBERVNDXG4gICAgICAgIH1cblxuICAgICAgICBpbnB1dCBRdWVyeU9yZGVyQnkge1xuICAgICAgICAgICAgcGF0aDogU3RyaW5nXG4gICAgICAgICAgICBkaXJlY3Rpb246IFF1ZXJ5T3JkZXJCeURpcmVjdGlvblxuICAgICAgICB9XG5cbiAgICAgICAgdHlwZSBRdWVyeSB7XG4gICAgICAgIGApO1xuXG4gICAgICAgIHR5cGVzLmZvckVhY2goKHR5cGU6IERiVHlwZSkgPT4ge1xuICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0JHt0eXBlLmNvbGxlY3Rpb24gfHwgJyd9KGZpbHRlcjogJHt0eXBlLm5hbWV9RmlsdGVyLCBvcmRlckJ5OiBbUXVlcnlPcmRlckJ5XSwgbGltaXQ6IEludCk6IFske3R5cGUubmFtZX1dYCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHFsLndyaXRlQmxvY2tMbihgXG4gICAgICAgICAgICBzZWxlY3QocXVlcnk6IFN0cmluZyEsIGJpbmRWYXJzSnNvbjogU3RyaW5nISk6IFN0cmluZyFcbiAgICAgICAgfVxuXG4gICAgICAgIGApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlblFMU3Vic2NyaXB0aW9ucyh0eXBlczogRGJUeXBlW10pIHtcbiAgICAgICAgcWwud3JpdGVMbigndHlwZSBTdWJzY3JpcHRpb24geycpO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGBcXHQke3R5cGUuY29sbGVjdGlvbiB8fCAnJ30oZmlsdGVyOiAke3R5cGUubmFtZX1GaWx0ZXIpOiAke3R5cGUubmFtZX1gKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHFsLndyaXRlTG4oJ30nKTtcbiAgICB9XG5cblxuICAgIGZ1bmN0aW9uIGdlbkpTRmlsdGVyc0ZvckFycmF5RmllbGRzKHR5cGU6IERiVHlwZSwganNOYW1lczogU2V0PHN0cmluZz4pIHtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGxldCBpdGVtVHlwZU5hbWUgPSBmaWVsZC50eXBlLm5hbWU7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZpZWxkLmFycmF5RGVwdGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpbHRlck5hbWUgPSBgJHtpdGVtVHlwZU5hbWV9QXJyYXlgO1xuICAgICAgICAgICAgICAgIHByZXZlbnRUd2ljZShmaWx0ZXJOYW1lLCBqc05hbWVzLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgICAgICAgICAgY29uc3QgJHtmaWx0ZXJOYW1lfSA9IGFycmF5KCR7aXRlbVR5cGVOYW1lfSk7XG4gICAgICAgICAgICAgICAgYCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaXRlbVR5cGVOYW1lICs9ICdBcnJheSc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkpTU3RydWN0RmlsdGVyKHR5cGU6IERiVHlwZSkge1xuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBjb25zdCAke3R5cGUubmFtZX0gPSBzdHJ1Y3Qoe1xuICAgIGApO1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgbGV0IHR5cGVEZWNsYXJhdGlvbjogP3N0cmluZyA9IG51bGw7XG4gICAgICAgICAgICBjb25zdCBqb2luID0gZmllbGQuam9pbjtcbiAgICAgICAgICAgIGlmIChqb2luKSB7XG4gICAgICAgICAgICAgICAgdHlwZURlY2xhcmF0aW9uID0gYGpvaW4ke2ZpZWxkLmFycmF5RGVwdGggPiAwID8gJ0FycmF5JyA6ICcnfSgnJHtqb2luLm9ufScsICcke2ZpZWxkLnR5cGUuY29sbGVjdGlvbiB8fCAnJ30nLCAke2ZpZWxkLnR5cGUubmFtZX0pYDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQuYXJyYXlEZXB0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB0eXBlRGVjbGFyYXRpb24gPVxuICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlLm5hbWUgK1xuICAgICAgICAgICAgICAgICAgICAnQXJyYXknLnJlcGVhdChmaWVsZC5hcnJheURlcHRoKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZS5jYXRlZ29yeSA9PT0gRGJUeXBlQ2F0ZWdvcnkuc2NhbGFyKSB7XG4gICAgICAgICAgICAgICAgaWYgKGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLnVpbnQ2NCkge1xuICAgICAgICAgICAgICAgICAgICB0eXBlRGVjbGFyYXRpb24gPSAnYmlnVUludDEnO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDEwMjQpIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZURlY2xhcmF0aW9uID0gJ2JpZ1VJbnQyJztcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0eXBlRGVjbGFyYXRpb24gPSAnc2NhbGFyJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLnR5cGUuZmllbGRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB0eXBlRGVjbGFyYXRpb24gPSBmaWVsZC50eXBlLm5hbWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodHlwZURlY2xhcmF0aW9uKSB7XG4gICAgICAgICAgICAgICAganMud3JpdGVMbihgICAgICR7ZmllbGQubmFtZX06ICR7dHlwZURlY2xhcmF0aW9ufSxgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIH0ke3R5cGUuY29sbGVjdGlvbiA/ICcsIHRydWUnIDogJyd9KTtcblxuICAgIGApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkpTVW5pb25SZXNvbHZlcih0eXBlOiBEYlR5cGUpIHtcbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgY29uc3QgJHt0eXBlLm5hbWV9UmVzb2x2ZXIgPSB7XG4gICAgICAgICAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xuICAgICAgICBgKTtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgodmFyaWFudCkgPT4ge1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICBpZiAoJyR7dmFyaWFudC5uYW1lfScgaW4gb2JqKSB7YCk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICByZXR1cm4gJyR7dW5pb25WYXJpYW50VHlwZSh0eXBlLCB2YXJpYW50KX0nO2ApO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICB9YCk7XG4gICAgICAgIH0pO1xuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkpTRmlsdGVyKHR5cGU6IERiVHlwZSwganNOYW1lczogU2V0PHN0cmluZz4pIHtcbiAgICAgICAgaWYgKHR5cGUuZmllbGRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS51bmlvbikge1xuICAgICAgICAgICAgLy8gZ2VuSlNGaWx0ZXJzRm9yVW5pb25WYXJpYW50cyh0eXBlLCBqc05hbWVzKTtcbiAgICAgICAgfVxuICAgICAgICBnZW5KU0ZpbHRlcnNGb3JBcnJheUZpZWxkcyh0eXBlLCBqc05hbWVzKTtcbiAgICAgICAgZ2VuSlNTdHJ1Y3RGaWx0ZXIodHlwZSk7XG4gICAgICAgIGlmICh0eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS51bmlvbikge1xuICAgICAgICAgICAgZ2VuSlNVbmlvblJlc29sdmVyKHR5cGUpO1xuICAgICAgICB9XG5cblxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlIGN1c3RvbSByZXNvbHZlcnMgZm9yIHR5cGVzIHdpdGg6XG4gICAgICogLSBpZCBmaWVsZFxuICAgICAqIC0gam9pbiBmaWVsZHNcbiAgICAgKiAtIHU2NCBhbmQgaGlnaGVyIGZpZWxkc1xuICAgICAqIEBwYXJhbSB0eXBlXG4gICAgICovXG4gICAgZnVuY3Rpb24gZ2VuSlNDdXN0b21SZXNvbHZlcnModHlwZTogRGJUeXBlKSB7XG4gICAgICAgIGNvbnN0IGpvaW5GaWVsZHMgPSB0eXBlLmZpZWxkcy5maWx0ZXIoeCA9PiAhIXguam9pbik7XG4gICAgICAgIGNvbnN0IGJpZ1VJbnRGaWVsZHMgPSB0eXBlLmZpZWxkcy5maWx0ZXIoKHg6IERiRmllbGQpID0+ICh4LnR5cGUgPT09IHNjYWxhclR5cGVzLnVpbnQ2NCkgfHwgKHgudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDEwMjQpKTtcbiAgICAgICAgY29uc3QgY3VzdG9tUmVzb2x2ZXJSZXF1aXJlZCA9IHR5cGUuY29sbGVjdGlvblxuICAgICAgICAgICAgfHwgam9pbkZpZWxkcy5sZW5ndGggPiAwXG4gICAgICAgICAgICB8fCBiaWdVSW50RmllbGRzLmxlbmd0aCA+IDA7XG4gICAgICAgIGlmICghY3VzdG9tUmVzb2x2ZXJSZXF1aXJlZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgJHt0eXBlLm5hbWV9OiB7YCk7XG4gICAgICAgIGlmICh0eXBlLmNvbGxlY3Rpb24pIHtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oJyAgICAgICAgICAgIGlkKHBhcmVudCkgeycpO1xuICAgICAgICAgICAganMud3JpdGVMbignICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTsnKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oJyAgICAgICAgICAgIH0sJyk7XG4gICAgICAgIH1cbiAgICAgICAgam9pbkZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgY29uc3Qgb25GaWVsZCA9IHR5cGUuZmllbGRzLmZpbmQoeCA9PiB4Lm5hbWUgPT09IChmaWVsZC5qb2luICYmIGZpZWxkLmpvaW4ub24pIHx8ICcnKTtcbiAgICAgICAgICAgIGlmICghb25GaWVsZCkge1xuICAgICAgICAgICAgICAgIHRocm93ICdKb2luIG9uIGZpZWxkIGRvZXMgbm90IGV4aXN0Lic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBjb2xsZWN0aW9uID0gZmllbGQudHlwZS5jb2xsZWN0aW9uO1xuICAgICAgICAgICAgaWYgKCFjb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgJ0pvaW5lZCB0eXBlIGlzIG5vdCBhIGNvbGxlY3Rpb24uJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICR7ZmllbGQubmFtZX0ocGFyZW50KSB7YCk7XG4gICAgICAgICAgICBpZiAoZmllbGQuYXJyYXlEZXB0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICAgICByZXR1cm4gZGIuZmV0Y2hEb2NCeUtleShkYi4ke2NvbGxlY3Rpb259LCBwYXJlbnQuJHtvbkZpZWxkLm5hbWV9KTtgKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQuYXJyYXlEZXB0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICAgICByZXR1cm4gZGIuZmV0Y2hEb2NzQnlLZXlzKGRiLiR7Y29sbGVjdGlvbn0sIHBhcmVudC4ke29uRmllbGQubmFtZX0pO2ApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyAnSm9pbnMgb24gYSBuZXN0ZWQgYXJyYXlzIGRvZXMgbm90IHN1cHBvcnRlZC4nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgfSxgKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGJpZ1VJbnRGaWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHByZWZpeExlbmd0aCA9IGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLnVpbnQ2NCA/IDEgOiAyO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgJHtmaWVsZC5uYW1lfShwYXJlbnQpIHtgKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoJHtwcmVmaXhMZW5ndGh9LCBwYXJlbnQuJHtmaWVsZC5uYW1lfSk7YCk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICB9LGApO1xuICAgICAgICB9KTtcbiAgICAgICAganMud3JpdGVMbihgICAgICAgICB9LGApO1xuICAgIH1cblxuXG4gICAgZnVuY3Rpb24gZ2VuSlNUeXBlUmVzb2x2ZXJzRm9yVW5pb24odHlwZTogRGJUeXBlKSB7XG4gICAgICAgIGlmICh0eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS51bmlvbikge1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAke3R5cGUubmFtZX06ICR7dHlwZS5uYW1lfVJlc29sdmVyLGApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuZXJhdGUodHlwZXM6IERiVHlwZVtdKSB7XG5cbiAgICAgICAgLy8gUUxcblxuICAgICAgICBbJ1N0cmluZycsICdCb29sZWFuJywgJ0ludCcsICdGbG9hdCddLmZvckVhY2goZ2VuUUxTY2FsYXJUeXBlc0ZpbHRlcik7XG4gICAgICAgIHR5cGVzLmZvckVhY2godHlwZSA9PiBnZW5RTFR5cGVEZWNsYXJhdGlvbih0eXBlKSk7XG4gICAgICAgIGNvbnN0IHFsQXJyYXlGaWx0ZXJzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgICAgIHR5cGVzLmZvckVhY2godHlwZSA9PiBnZW5RTEZpbHRlcih0eXBlLCBxbEFycmF5RmlsdGVycykpO1xuXG4gICAgICAgIGNvbnN0IGNvbGxlY3Rpb25zID0gdHlwZXMuZmlsdGVyKHQgPT4gISF0LmNvbGxlY3Rpb24pO1xuICAgICAgICBnZW5RTFF1ZXJpZXMoY29sbGVjdGlvbnMpO1xuICAgICAgICBnZW5RTFN1YnNjcmlwdGlvbnMoY29sbGVjdGlvbnMpO1xuXG4gICAgICAgIC8vIEpTXG5cbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgY29uc3QgeyBzY2FsYXIsIGJpZ1VJbnQxLCBiaWdVSW50MiwgcmVzb2x2ZUJpZ1VJbnQsIHN0cnVjdCwgYXJyYXksIGpvaW4sIGpvaW5BcnJheSB9ID0gcmVxdWlyZSgnLi9hcmFuZ28tdHlwZXMuanMnKTtcbiAgICAgICAgYCk7XG4gICAgICAgIGNvbnN0IGpzQXJyYXlGaWx0ZXJzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgICAgIHR5cGVzLmZvckVhY2godHlwZSA9PiBnZW5KU0ZpbHRlcih0eXBlLCBqc0FycmF5RmlsdGVycykpO1xuXG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIGZ1bmN0aW9uIGNyZWF0ZVJlc29sdmVycyhkYikge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgYCk7XG4gICAgICAgIHR5cGVzLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICAgICAgICAgIGdlbkpTQ3VzdG9tUmVzb2x2ZXJzKHR5cGUpO1xuICAgICAgICAgICAgZ2VuSlNUeXBlUmVzb2x2ZXJzRm9yVW5pb24odHlwZSk7XG4gICAgICAgIH0pO1xuICAgICAgICBqcy53cml0ZUxuKCcgICAgICAgIFF1ZXJ5OiB7Jyk7XG4gICAgICAgIGNvbGxlY3Rpb25zLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICR7dHlwZS5jb2xsZWN0aW9uIHx8ICcnfTogZGIuY29sbGVjdGlvblF1ZXJ5KGRiLiR7dHlwZS5jb2xsZWN0aW9uIHx8ICcnfSwgJHt0eXBlLm5hbWV9KSxgKVxuICAgICAgICB9KTtcbiAgICAgICAganMud3JpdGVMbignICAgICAgICAgICAgc2VsZWN0OiBkYi5zZWxlY3RRdWVyeSgpLCcpO1xuICAgICAgICBqcy53cml0ZUxuKCcgICAgICAgIH0sJyk7XG4gICAgICAgIGpzLndyaXRlTG4oJyAgICAgICAgU3Vic2NyaXB0aW9uOiB7Jyk7XG4gICAgICAgIGNvbGxlY3Rpb25zLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICR7dHlwZS5jb2xsZWN0aW9uIHx8ICcnfTogZGIuY29sbGVjdGlvblN1YnNjcmlwdGlvbihkYi4ke3R5cGUuY29sbGVjdGlvbiB8fCAnJ30sICR7dHlwZS5uYW1lfSksYClcbiAgICAgICAgfSk7XG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGApO1xuXG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0ge1xuICAgICAgICAgICAgY3JlYXRlUmVzb2x2ZXJzLFxuICAgICAgICBgKTtcbiAgICAgICAgdHlwZXMuZm9yRWFjaCh0eXBlID0+IGpzLndyaXRlTG4oYCAgICAke3R5cGUubmFtZX0sYCkpO1xuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICB9O1xuICAgICAgICBgKTtcbiAgICB9XG5cbiAgICBjb25zdCBzY2hlbWEgPSBwYXJzZVR5cGVEZWYoc2NoZW1hRGVmKTtcblxuICAgIGlmIChzY2hlbWEuY2xhc3MpIHtcbiAgICAgICAgcGFyc2VEYlR5cGVzKHNjaGVtYS5jbGFzcy50eXBlcyk7XG4gICAgICAgIGdlbmVyYXRlKGRiVHlwZXMpO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIHFsOiBxbC5nZW5lcmF0ZWQoKSxcbiAgICAgICAganM6IGpzLmdlbmVyYXRlZCgpLFxuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgbWFpbjtcbiJdfQ==