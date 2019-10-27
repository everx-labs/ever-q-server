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
      var uintSize = schemaType["int"].unsigned || 0;

      if (uintSize >= 128) {
        field.type = scalarTypes.uint1024;
      } else if (uintSize >= 64) {
        field.type = scalarTypes.uint64;
      } else {
        field.type = scalarTypes["int"];
      }
    } else if (schemaType["float"]) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9nZW4tcWwtanMuanMiXSwibmFtZXMiOlsiRGJUeXBlQ2F0ZWdvcnkiLCJ1bnJlc29sdmVkIiwic2NhbGFyIiwidW5pb24iLCJzdHJ1Y3QiLCJzY2FsYXJUeXBlIiwibmFtZSIsImNhdGVnb3J5IiwiZmllbGRzIiwic2NhbGFyVHlwZXMiLCJ1aW50NjQiLCJ1aW50MTAyNCIsInN0cmluZyIsInVucmVzb2x2ZWRUeXBlIiwibWFpbiIsInNjaGVtYURlZiIsImRiVHlwZXMiLCJwYXJzZURiRmllbGQiLCJ0eXBlTmFtZSIsInNjaGVtYUZpZWxkIiwic2NoZW1hVHlwZSIsImZpZWxkIiwiYXJyYXlEZXB0aCIsInR5cGUiLCJhcnJheSIsImpvaW4iLCJfIiwicmVmIiwiYm9vbCIsInVpbnRTaXplIiwidW5zaWduZWQiLCJjb25zb2xlIiwibG9nIiwiSlNPTiIsInN0cmluZ2lmeSIsInByb2Nlc3MiLCJleGl0IiwidW53cmFwQXJyYXlzIiwicGFyc2VEYlR5cGUiLCJzdWJzdHIiLCJjb2xsZWN0aW9uIiwicHVzaCIsImZvckVhY2giLCJ1bndyYXBwZWQiLCJvd25UeXBlIiwicGFyc2VEYlR5cGVzIiwidHlwZXMiLCJNYXAiLCJyZXNvbHZpbmciLCJTZXQiLCJyZXNvbHZlZCIsIm9yZGVyZWRSZXNvbHZlZCIsInQiLCJzZXQiLCJyZXNvbHZlVHlwZSIsImhhcyIsImFkZCIsImdldCIsInFsIiwiV3JpdGVyIiwianMiLCJ1bmlvblZhcmlhbnRUeXBlIiwidmFyaWFudCIsImdlblFMVHlwZURlY2xhcmF0aW9uc0ZvclVuaW9uVmFyaWFudHMiLCJ3cml0ZUJsb2NrTG4iLCJnZW5RTFR5cGVEZWNsYXJhdGlvbiIsIndyaXRlTG4iLCJ0eXBlRGVjbGFyYXRpb24iLCJyZXBlYXQiLCJwcmV2ZW50VHdpY2UiLCJuYW1lcyIsIndvcmsiLCJnZW5RTEZpbHRlcnNGb3JBcnJheUZpZWxkcyIsInFsTmFtZXMiLCJpdGVtVHlwZU5hbWUiLCJpIiwiZmlsdGVyTmFtZSIsIm9wIiwiZ2VuUUxGaWx0ZXIiLCJsZW5ndGgiLCJnZW5RTFNjYWxhclR5cGVzRmlsdGVyIiwiZ2VuUUxRdWVyaWVzIiwiZ2VuUUxTdWJzY3JpcHRpb25zIiwiZ2VuSlNGaWx0ZXJzRm9yQXJyYXlGaWVsZHMiLCJqc05hbWVzIiwiZ2VuSlNTdHJ1Y3RGaWx0ZXIiLCJvbiIsImdlbkpTVW5pb25SZXNvbHZlciIsImdlbkpTRmlsdGVyIiwiZ2VuSlNDdXN0b21SZXNvbHZlcnMiLCJqb2luRmllbGRzIiwiZmlsdGVyIiwieCIsImJpZ1VJbnRGaWVsZHMiLCJjdXN0b21SZXNvbHZlclJlcXVpcmVkIiwib25GaWVsZCIsImZpbmQiLCJwcmVmaXhMZW5ndGgiLCJnZW5KU1R5cGVSZXNvbHZlcnNGb3JVbmlvbiIsImdlbmVyYXRlIiwicWxBcnJheUZpbHRlcnMiLCJjb2xsZWN0aW9ucyIsImpzQXJyYXlGaWx0ZXJzIiwic2NoZW1hIiwiZ2VuZXJhdGVkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBRUE7O0FBRUE7O0FBRUEsSUFBTUEsY0FBYyxHQUFHO0FBQ25CQyxFQUFBQSxVQUFVLEVBQUUsWUFETztBQUVuQkMsRUFBQUEsTUFBTSxFQUFFLFFBRlc7QUFHbkJDLEVBQUFBLEtBQUssRUFBRSxPQUhZO0FBSW5CQyxFQUFBQSxNQUFNLEVBQUU7QUFKVyxDQUF2Qjs7QUEwQkEsU0FBU0MsVUFBVCxDQUFvQkMsSUFBcEIsRUFBMEM7QUFDdEMsU0FBTztBQUNIQSxJQUFBQSxJQUFJLEVBQUpBLElBREc7QUFFSEMsSUFBQUEsUUFBUSxFQUFFUCxjQUFjLENBQUNFLE1BRnRCO0FBR0hNLElBQUFBLE1BQU0sRUFBRTtBQUhMLEdBQVA7QUFLSDs7QUFFRCxJQUFNQyxXQUFXLEdBQUc7QUFDaEIsU0FBS0osVUFBVSxDQUFDLEtBQUQsQ0FEQztBQUVoQkssRUFBQUEsTUFBTSxFQUFFTCxVQUFVLENBQUMsUUFBRCxDQUZGO0FBR2hCTSxFQUFBQSxRQUFRLEVBQUVOLFVBQVUsQ0FBQyxRQUFELENBSEo7QUFJaEIsV0FB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VTtBQUMxQnFDLE1BQUFBLEVBQUUsQ0FBQ00sT0FBSCx1QkFBMEIzQyxJQUFJLENBQUNpQixVQUFMLElBQW1CLEVBQTdDLDRDQUFpRmpCLElBQUksQ0FBQ2lCLFVBQUwsSUFBbUIsRUFBcEcsZUFBMkdqQixJQUFJLENBQUNqQixJQUFoSDtBQUNILEtBRkQ7QUFHQXNELElBQUFBLEVBQUUsQ0FBQ0ksWUFBSDtBQU1BSixJQUFBQSxFQUFFLENBQUNJLFlBQUg7QUFLSDs7QUFFRCxNQUFNdUMsTUFBTSxHQUFHLDBCQUFheEYsU0FBYixDQUFmOztBQUVBLE1BQUl3RixNQUFNLFNBQVYsRUFBa0I7QUFDZDFELElBQUFBLFlBQVksQ0FBQzBELE1BQU0sU0FBTixDQUFhekQsS0FBZCxDQUFaO0FBQ0FxRCxJQUFBQSxRQUFRLENBQUNuRixPQUFELENBQVI7QUFDSDs7QUFFRCxTQUFPO0FBQ0gwQyxJQUFBQSxFQUFFLEVBQUVBLEVBQUUsQ0FBQzhDLFNBQUgsRUFERDtBQUVINUMsSUFBQUEsRUFBRSxFQUFFQSxFQUFFLENBQUM0QyxTQUFIO0FBRkQsR0FBUDtBQUlIOztlQUVjMUYsSSIsInNvdXJjZXNDb250ZW50IjpbIi8vQGZsb3dcblxuaW1wb3J0IHsgbWFrZUZpZWxkVHlwZU5hbWUsIFdyaXRlciB9IGZyb20gJ3Rvbi1sYWJzLWRldi1vcHMvZGlzdC9zcmMvZ2VuLmpzJztcbmltcG9ydCB0eXBlIHsgU2NoZW1hTWVtYmVyLCBTY2hlbWFUeXBlLCBUeXBlRGVmIH0gZnJvbSAndG9uLWxhYnMtZGV2LW9wcy9zcmMvc2NoZW1hLmpzJztcbmltcG9ydCB7IHBhcnNlVHlwZURlZiB9IGZyb20gJ3Rvbi1sYWJzLWRldi1vcHMvZGlzdC9zcmMvc2NoZW1hLmpzJztcblxuY29uc3QgRGJUeXBlQ2F0ZWdvcnkgPSB7XG4gICAgdW5yZXNvbHZlZDogJ3VucmVzb2x2ZWQnLFxuICAgIHNjYWxhcjogJ3NjYWxhcicsXG4gICAgdW5pb246ICd1bmlvbicsXG4gICAgc3RydWN0OiAnc3RydWN0Jyxcbn07XG5cbnR5cGUgRGJKb2luID0ge1xuICAgIGNvbGxlY3Rpb246IHN0cmluZyxcbiAgICBvbjogc3RyaW5nLFxufVxuXG50eXBlIERiVHlwZSA9IHtcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgY2F0ZWdvcnk6ICRLZXlzPHR5cGVvZiBEYlR5cGVDYXRlZ29yeT4sXG4gICAgY29sbGVjdGlvbj86IHN0cmluZyxcbiAgICBmaWVsZHM6IERiRmllbGRbXSxcbn1cblxudHlwZSBEYkZpZWxkID0ge1xuICAgIG5hbWU6IHN0cmluZyxcbiAgICBhcnJheURlcHRoOiBudW1iZXIsXG4gICAgam9pbj86IERiSm9pbixcbiAgICB0eXBlOiBEYlR5cGUsXG59XG5cbmZ1bmN0aW9uIHNjYWxhclR5cGUobmFtZTogc3RyaW5nKTogRGJUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBuYW1lLFxuICAgICAgICBjYXRlZ29yeTogRGJUeXBlQ2F0ZWdvcnkuc2NhbGFyLFxuICAgICAgICBmaWVsZHM6IFtdXG4gICAgfVxufVxuXG5jb25zdCBzY2FsYXJUeXBlcyA9IHtcbiAgICBpbnQ6IHNjYWxhclR5cGUoJ0ludCcpLFxuICAgIHVpbnQ2NDogc2NhbGFyVHlwZSgnU3RyaW5nJyksXG4gICAgdWludDEwMjQ6IHNjYWxhclR5cGUoJ1N0cmluZycpLFxuICAgIGZsb2F0OiBzY2FsYXJUeXBlKCdGbG9hdCcpLFxuICAgIGJvb2xlYW46IHNjYWxhclR5cGUoJ0Jvb2xlYW4nKSxcbiAgICBzdHJpbmc6IHNjYWxhclR5cGUoJ1N0cmluZycpLFxufTtcblxuZnVuY3Rpb24gdW5yZXNvbHZlZFR5cGUobmFtZTogc3RyaW5nKTogRGJUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBuYW1lLFxuICAgICAgICBjYXRlZ29yeTogRGJUeXBlQ2F0ZWdvcnkudW5yZXNvbHZlZCxcbiAgICAgICAgZmllbGRzOiBbXSxcbiAgICB9XG59XG5cbmZ1bmN0aW9uIG1haW4oc2NoZW1hRGVmOiBUeXBlRGVmKSB7XG5cbiAgICBsZXQgZGJUeXBlczogRGJUeXBlW10gPSBbXTtcblxuICAgIGZ1bmN0aW9uIHBhcnNlRGJGaWVsZChcbiAgICAgICAgdHlwZU5hbWU6IHN0cmluZyxcbiAgICAgICAgc2NoZW1hRmllbGQ6IFNjaGVtYU1lbWJlcjxTY2hlbWFUeXBlPixcbiAgICApOiBEYkZpZWxkIHtcbiAgICAgICAgbGV0IHNjaGVtYVR5cGUgPSBzY2hlbWFGaWVsZDtcbiAgICAgICAgY29uc3QgZmllbGQ6IERiRmllbGQgPSB7XG4gICAgICAgICAgICBuYW1lOiBzY2hlbWFGaWVsZC5uYW1lLFxuICAgICAgICAgICAgYXJyYXlEZXB0aDogMCxcbiAgICAgICAgICAgIHR5cGU6IHNjYWxhclR5cGVzLnN0cmluZyxcbiAgICAgICAgfTtcbiAgICAgICAgd2hpbGUgKHNjaGVtYVR5cGUuYXJyYXkpIHtcbiAgICAgICAgICAgIGZpZWxkLmFycmF5RGVwdGggKz0gMTtcbiAgICAgICAgICAgIHNjaGVtYVR5cGUgPSBzY2hlbWFUeXBlLmFycmF5O1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGpvaW4gPSAoc2NoZW1hVHlwZTogYW55KS5fLmpvaW47XG4gICAgICAgIGlmIChqb2luKSB7XG4gICAgICAgICAgICBmaWVsZC5qb2luID0gam9pbjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc2NoZW1hVHlwZS51bmlvbiB8fCBzY2hlbWFUeXBlLnN0cnVjdCkge1xuICAgICAgICAgICAgZmllbGQudHlwZSA9IHVucmVzb2x2ZWRUeXBlKG1ha2VGaWVsZFR5cGVOYW1lKHR5cGVOYW1lLCBzY2hlbWFGaWVsZC5uYW1lKSk7XG4gICAgICAgIH0gZWxzZSBpZiAoc2NoZW1hVHlwZS5yZWYpIHtcbiAgICAgICAgICAgIGZpZWxkLnR5cGUgPSB1bnJlc29sdmVkVHlwZShzY2hlbWFUeXBlLnJlZi5uYW1lKTtcbiAgICAgICAgfSBlbHNlIGlmIChzY2hlbWFUeXBlLmJvb2wpIHtcbiAgICAgICAgICAgIGZpZWxkLnR5cGUgPSBzY2FsYXJUeXBlcy5ib29sZWFuO1xuICAgICAgICB9IGVsc2UgaWYgKHNjaGVtYVR5cGUuaW50KSB7XG4gICAgICAgICAgICBjb25zdCB1aW50U2l6ZTogbnVtYmVyID0gKHNjaGVtYVR5cGUuaW50OiBhbnkpLnVuc2lnbmVkIHx8IDA7XG4gICAgICAgICAgICBpZiAodWludFNpemUgPj0gMTI4KSB7XG4gICAgICAgICAgICAgICAgZmllbGQudHlwZSA9IHNjYWxhclR5cGVzLnVpbnQxMDI0O1xuICAgICAgICAgICAgfSBlbHNlIGlmICh1aW50U2l6ZSA+PSA2NCkge1xuICAgICAgICAgICAgICAgIGZpZWxkLnR5cGUgPSBzY2FsYXJUeXBlcy51aW50NjQ7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGZpZWxkLnR5cGUgPSBzY2FsYXJUeXBlcy5pbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoc2NoZW1hVHlwZS5mbG9hdCkge1xuICAgICAgICAgICAgZmllbGQudHlwZSA9IHNjYWxhclR5cGVzLmZsb2F0O1xuICAgICAgICB9IGVsc2UgaWYgKHNjaGVtYVR5cGUuc3RyaW5nKSB7XG4gICAgICAgICAgICBmaWVsZC50eXBlID0gc2NhbGFyVHlwZXMuc3RyaW5nO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZmllbGQudHlwZSA9IHNjYWxhclR5cGVzLnN0cmluZztcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+Pj4gSW52YWxpZCBmaWVsZCB0eXBlOiAnLCBKU09OLnN0cmluZ2lmeShzY2hlbWFUeXBlKSk7XG4gICAgICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZpZWxkO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHVud3JhcEFycmF5cyh0eXBlOiBTY2hlbWFUeXBlKTogU2NoZW1hVHlwZSB7XG4gICAgICAgIGlmICh0eXBlLmFycmF5KSB7XG4gICAgICAgICAgICByZXR1cm4gdW53cmFwQXJyYXlzKHR5cGUuYXJyYXkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0eXBlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlRGJUeXBlKFxuICAgICAgICBuYW1lOiBzdHJpbmcsXG4gICAgICAgIHNjaGVtYVR5cGU6IFNjaGVtYVR5cGVcbiAgICApIHtcbiAgICAgICAgY29uc3Qgc3RydWN0ID0gc2NoZW1hVHlwZS51bmlvbiB8fCBzY2hlbWFUeXBlLnN0cnVjdDtcbiAgICAgICAgaWYgKCFzdHJ1Y3QpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+Pj4nLCBgPz8gJHtuYW1lfTogJHtKU09OLnN0cmluZ2lmeShzY2hlbWFUeXBlKS5zdWJzdHIoMCwgMjApfWApO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHR5cGU6IERiVHlwZSA9IHtcbiAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICBjYXRlZ29yeTogc2NoZW1hVHlwZS51bmlvbiA/IERiVHlwZUNhdGVnb3J5LnVuaW9uIDogRGJUeXBlQ2F0ZWdvcnkuc3RydWN0LFxuICAgICAgICAgICAgZmllbGRzOiBbXSxcbiAgICAgICAgICAgIGNvbGxlY3Rpb246IChzY2hlbWFUeXBlOiBhbnkpLl8uY29sbGVjdGlvbixcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAodHlwZS5jb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICB0eXBlLmZpZWxkcy5wdXNoKHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnaWQnLFxuICAgICAgICAgICAgICAgIGFycmF5RGVwdGg6IDAsXG4gICAgICAgICAgICAgICAgdHlwZTogc2NhbGFyVHlwZXMuc3RyaW5nLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgc3RydWN0LmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICB0eXBlLmZpZWxkcy5wdXNoKHBhcnNlRGJGaWVsZChuYW1lLCBmaWVsZCkpO1xuICAgICAgICAgICAgY29uc3QgdW53cmFwcGVkID0gdW53cmFwQXJyYXlzKGZpZWxkKTtcbiAgICAgICAgICAgIGNvbnN0IG93blR5cGUgPSAodW53cmFwcGVkLnN0cnVjdCB8fCB1bndyYXBwZWQudW5pb24pID8gdW53cmFwcGVkIDogbnVsbDtcbiAgICAgICAgICAgIGlmIChvd25UeXBlKSB7XG4gICAgICAgICAgICAgICAgcGFyc2VEYlR5cGUobWFrZUZpZWxkVHlwZU5hbWUobmFtZSwgZmllbGQubmFtZSksIG93blR5cGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgZGJUeXBlcy5wdXNoKHR5cGUpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlRGJUeXBlcyh0eXBlczogU2NoZW1hTWVtYmVyPFNjaGVtYVR5cGU+W10pIHtcbiAgICAgICAgdHlwZXMuZm9yRWFjaCgodHlwZTogU2NoZW1hTWVtYmVyPFNjaGVtYVR5cGU+KSA9PiB7XG4gICAgICAgICAgICBwYXJzZURiVHlwZSh0eXBlLm5hbWUsIHR5cGUpO1xuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgdW5yZXNvbHZlZDogTWFwPHN0cmluZywgRGJUeXBlPiA9IG5ldyBNYXA8c3RyaW5nLCBEYlR5cGU+KCk7XG4gICAgICAgIGNvbnN0IHJlc29sdmluZzogU2V0PHN0cmluZz4gPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICAgICAgY29uc3QgcmVzb2x2ZWQ6IE1hcDxzdHJpbmcsIERiVHlwZT4gPSBuZXcgTWFwPHN0cmluZywgRGJUeXBlPigpO1xuICAgICAgICBjb25zdCBvcmRlcmVkUmVzb2x2ZWQ6IERiVHlwZVtdID0gW107XG4gICAgICAgIGRiVHlwZXMuZm9yRWFjaCh0ID0+IHVucmVzb2x2ZWQuc2V0KHQubmFtZSwgdCkpO1xuICAgICAgICBjb25zdCByZXNvbHZlVHlwZSA9ICh0eXBlOiBEYlR5cGUpID0+IHtcbiAgICAgICAgICAgIGlmIChyZXNvbHZlZC5oYXModHlwZS5uYW1lKSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChyZXNvbHZpbmcuaGFzKHR5cGUubmFtZSkpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnPj4+JywgYENpcmN1bGFyIHJlZmVyZW5jZSB0byB0eXBlICR7dHlwZS5uYW1lfWApO1xuICAgICAgICAgICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlc29sdmluZy5hZGQodHlwZS5uYW1lKTtcbiAgICAgICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGZpZWxkLnR5cGUuY2F0ZWdvcnkgPT09IERiVHlwZUNhdGVnb3J5LnVucmVzb2x2ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHR5cGUgPSByZXNvbHZlZC5nZXQoZmllbGQudHlwZS5uYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlID0gdW5yZXNvbHZlZC5nZXQoZmllbGQudHlwZS5uYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZVR5cGUodHlwZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+Pj4nLCBgUmVmZXJlbmNlZCB0eXBlIG5vdCBmb3VuZDogJHtmaWVsZC50eXBlLm5hbWV9YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlID0gdHlwZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmVzb2x2aW5nLmRlbGV0ZSh0eXBlLm5hbWUpO1xuICAgICAgICAgICAgb3JkZXJlZFJlc29sdmVkLnB1c2godHlwZSk7XG4gICAgICAgICAgICB1bnJlc29sdmVkLmRlbGV0ZSh0eXBlLm5hbWUpO1xuICAgICAgICAgICAgcmVzb2x2ZWQuc2V0KHR5cGUubmFtZSwgdHlwZSk7XG4gICAgICAgIH07XG4gICAgICAgIGRiVHlwZXMuZm9yRWFjaChyZXNvbHZlVHlwZSk7XG4gICAgICAgIGRiVHlwZXMgPSBvcmRlcmVkUmVzb2x2ZWQ7XG4gICAgfVxuXG4vLyBHZW5lcmF0b3JzXG5cbiAgICBjb25zdCBxbCA9IG5ldyBXcml0ZXIoKTtcbiAgICBjb25zdCBqcyA9IG5ldyBXcml0ZXIoKTtcblxuICAgIGZ1bmN0aW9uIHVuaW9uVmFyaWFudFR5cGUodHlwZTogRGJUeXBlLCB2YXJpYW50OiBEYkZpZWxkKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIGAke3R5cGUubmFtZX0ke3ZhcmlhbnQubmFtZX1WYXJpYW50YDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5RTFR5cGVEZWNsYXJhdGlvbnNGb3JVbmlvblZhcmlhbnRzKHR5cGU6IERiVHlwZSkge1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKCh2YXJpYW50KSA9PiB7XG4gICAgICAgICAgICBxbC53cml0ZUJsb2NrTG4oYFxuICAgICAgICB0eXBlICR7dW5pb25WYXJpYW50VHlwZSh0eXBlLCB2YXJpYW50KX0ge1xuICAgICAgICAgICAgJHt2YXJpYW50Lm5hbWV9OiAke3ZhcmlhbnQudHlwZS5uYW1lfVxuICAgICAgICB9XG5cbiAgICAgICAgYCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlblFMVHlwZURlY2xhcmF0aW9uKHR5cGU6IERiVHlwZSkge1xuICAgICAgICBpZiAodHlwZS5jYXRlZ29yeSA9PT0gRGJUeXBlQ2F0ZWdvcnkudW5pb24pIHtcbiAgICAgICAgICAgIGdlblFMVHlwZURlY2xhcmF0aW9uc0ZvclVuaW9uVmFyaWFudHModHlwZSk7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGB1bmlvbiAke3R5cGUubmFtZX0gPSBgKTtcbiAgICAgICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2godmFyaWFudCA9PiB7XG4gICAgICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0fCAke3VuaW9uVmFyaWFudFR5cGUodHlwZSwgdmFyaWFudCl9YCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oYHR5cGUgJHt0eXBlLm5hbWV9IHtgKTtcbiAgICAgICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goZmllbGQgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHR5cGVEZWNsYXJhdGlvbiA9XG4gICAgICAgICAgICAgICAgICAgICdbJy5yZXBlYXQoZmllbGQuYXJyYXlEZXB0aCkgK1xuICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlLm5hbWUgK1xuICAgICAgICAgICAgICAgICAgICAnXScucmVwZWF0KGZpZWxkLmFycmF5RGVwdGgpO1xuICAgICAgICAgICAgICAgIHFsLndyaXRlTG4oYFxcdCR7ZmllbGQubmFtZX06ICR7dHlwZURlY2xhcmF0aW9ufWApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGB9YCk7XG4gICAgICAgIH1cbiAgICAgICAgcWwud3JpdGVMbigpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHByZXZlbnRUd2ljZShuYW1lOiBzdHJpbmcsIG5hbWVzOiBTZXQ8c3RyaW5nPiwgd29yazogKCkgPT4gdm9pZCkge1xuICAgICAgICBpZiAoIW5hbWVzLmhhcyhuYW1lKSkge1xuICAgICAgICAgICAgbmFtZXMuYWRkKG5hbWUpO1xuICAgICAgICAgICAgd29yaygpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuUUxGaWx0ZXJzRm9yQXJyYXlGaWVsZHModHlwZTogRGJUeXBlLCBxbE5hbWVzOiBTZXQ8c3RyaW5nPikge1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgbGV0IGl0ZW1UeXBlTmFtZSA9IGZpZWxkLnR5cGUubmFtZTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZmllbGQuYXJyYXlEZXB0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmlsdGVyTmFtZSA9IGAke2l0ZW1UeXBlTmFtZX1BcnJheUZpbHRlcmA7XG4gICAgICAgICAgICAgICAgcHJldmVudFR3aWNlKGZpbHRlck5hbWUsIHFsTmFtZXMsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcWwud3JpdGVMbihgaW5wdXQgJHtmaWx0ZXJOYW1lfSB7YCk7XG4gICAgICAgICAgICAgICAgICAgIFsnYW55JywgJ2FsbCddLmZvckVhY2goKG9wKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBxbC53cml0ZUxuKGBcXHQke29wfTogJHtpdGVtVHlwZU5hbWV9RmlsdGVyYCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBxbC53cml0ZUxuKCd9Jyk7XG4gICAgICAgICAgICAgICAgICAgIHFsLndyaXRlTG4oKTtcblxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGl0ZW1UeXBlTmFtZSArPSAnQXJyYXknO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5RTEZpbHRlcih0eXBlOiBEYlR5cGUsIHFsTmFtZXM6IFNldDxzdHJpbmc+KSB7XG4gICAgICAgIGlmICh0eXBlLmZpZWxkcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBnZW5RTEZpbHRlcnNGb3JBcnJheUZpZWxkcyh0eXBlLCBxbE5hbWVzKTtcbiAgICAgICAgcWwud3JpdGVMbihgaW5wdXQgJHt0eXBlLm5hbWV9RmlsdGVyIHtgKTtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHR5cGVEZWNsYXJhdGlvbiA9IGZpZWxkLnR5cGUubmFtZSArIFwiQXJyYXlcIi5yZXBlYXQoZmllbGQuYXJyYXlEZXB0aCk7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGBcXHQke2ZpZWxkLm5hbWV9OiAke3R5cGVEZWNsYXJhdGlvbn1GaWx0ZXJgKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHFsLndyaXRlTG4oYH1gKTtcbiAgICAgICAgcWwud3JpdGVMbigpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlblFMU2NhbGFyVHlwZXNGaWx0ZXIobmFtZTogc3RyaW5nKSB7XG4gICAgICAgIHFsLndyaXRlTG4oYGlucHV0ICR7bmFtZX1GaWx0ZXIge2ApO1xuICAgICAgICBbJ2VxJywgJ25lJywgJ2d0JywgJ2x0JywgJ2dlJywgJ2xlJ10uZm9yRWFjaCgob3ApID0+IHtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oYFxcdCR7b3B9OiAke25hbWV9YCk7XG4gICAgICAgIH0pO1xuICAgICAgICBbJ2luJywgJ25vdEluJ10uZm9yRWFjaCgob3ApID0+IHtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oYFxcdCR7b3B9OiBbJHtuYW1lfV1gKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHFsLndyaXRlTG4oJ30nKTtcbiAgICAgICAgcWwud3JpdGVMbigpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlblFMUXVlcmllcyh0eXBlczogRGJUeXBlW10pIHtcbiAgICAgICAgcWwud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgZW51bSBRdWVyeU9yZGVyQnlEaXJlY3Rpb24ge1xuICAgICAgICAgICAgQVNDXG4gICAgICAgICAgICBERVNDXG4gICAgICAgIH1cblxuICAgICAgICBpbnB1dCBRdWVyeU9yZGVyQnkge1xuICAgICAgICAgICAgcGF0aDogU3RyaW5nXG4gICAgICAgICAgICBkaXJlY3Rpb246IFF1ZXJ5T3JkZXJCeURpcmVjdGlvblxuICAgICAgICB9XG5cbiAgICAgICAgdHlwZSBRdWVyeSB7XG4gICAgICAgIGApO1xuXG4gICAgICAgIHR5cGVzLmZvckVhY2goKHR5cGU6IERiVHlwZSkgPT4ge1xuICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0JHt0eXBlLmNvbGxlY3Rpb24gfHwgJyd9KGZpbHRlcjogJHt0eXBlLm5hbWV9RmlsdGVyLCBvcmRlckJ5OiBbUXVlcnlPcmRlckJ5XSwgbGltaXQ6IEludCk6IFske3R5cGUubmFtZX1dYCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHFsLndyaXRlQmxvY2tMbihgXG4gICAgICAgICAgICBzZWxlY3QocXVlcnk6IFN0cmluZyEsIGJpbmRWYXJzSnNvbjogU3RyaW5nISk6IFN0cmluZyFcbiAgICAgICAgfVxuXG4gICAgICAgIGApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlblFMU3Vic2NyaXB0aW9ucyh0eXBlczogRGJUeXBlW10pIHtcbiAgICAgICAgcWwud3JpdGVMbigndHlwZSBTdWJzY3JpcHRpb24geycpO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGBcXHQke3R5cGUuY29sbGVjdGlvbiB8fCAnJ30oZmlsdGVyOiAke3R5cGUubmFtZX1GaWx0ZXIpOiAke3R5cGUubmFtZX1gKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHFsLndyaXRlTG4oJ30nKTtcbiAgICB9XG5cblxuICAgIGZ1bmN0aW9uIGdlbkpTRmlsdGVyc0ZvckFycmF5RmllbGRzKHR5cGU6IERiVHlwZSwganNOYW1lczogU2V0PHN0cmluZz4pIHtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGxldCBpdGVtVHlwZU5hbWUgPSBmaWVsZC50eXBlLm5hbWU7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZpZWxkLmFycmF5RGVwdGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpbHRlck5hbWUgPSBgJHtpdGVtVHlwZU5hbWV9QXJyYXlgO1xuICAgICAgICAgICAgICAgIHByZXZlbnRUd2ljZShmaWx0ZXJOYW1lLCBqc05hbWVzLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgICAgICAgICAgY29uc3QgJHtmaWx0ZXJOYW1lfSA9IGFycmF5KCR7aXRlbVR5cGVOYW1lfSk7XG4gICAgICAgICAgICAgICAgYCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaXRlbVR5cGVOYW1lICs9ICdBcnJheSc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkpTU3RydWN0RmlsdGVyKHR5cGU6IERiVHlwZSkge1xuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBjb25zdCAke3R5cGUubmFtZX0gPSBzdHJ1Y3Qoe1xuICAgIGApO1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgbGV0IHR5cGVEZWNsYXJhdGlvbjogP3N0cmluZyA9IG51bGw7XG4gICAgICAgICAgICBjb25zdCBqb2luID0gZmllbGQuam9pbjtcbiAgICAgICAgICAgIGlmIChqb2luKSB7XG4gICAgICAgICAgICAgICAgdHlwZURlY2xhcmF0aW9uID0gYGpvaW4ke2ZpZWxkLmFycmF5RGVwdGggPiAwID8gJ0FycmF5JyA6ICcnfSgnJHtqb2luLm9ufScsICcke2ZpZWxkLnR5cGUuY29sbGVjdGlvbiB8fCAnJ30nLCAke2ZpZWxkLnR5cGUubmFtZX0pYDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQuYXJyYXlEZXB0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB0eXBlRGVjbGFyYXRpb24gPVxuICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlLm5hbWUgK1xuICAgICAgICAgICAgICAgICAgICAnQXJyYXknLnJlcGVhdChmaWVsZC5hcnJheURlcHRoKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZS5jYXRlZ29yeSA9PT0gRGJUeXBlQ2F0ZWdvcnkuc2NhbGFyKSB7XG4gICAgICAgICAgICAgICAgaWYgKGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLnVpbnQ2NCkge1xuICAgICAgICAgICAgICAgICAgICB0eXBlRGVjbGFyYXRpb24gPSAnYmlnVUludDEnO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDEwMjQpIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZURlY2xhcmF0aW9uID0gJ2JpZ1VJbnQyJztcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0eXBlRGVjbGFyYXRpb24gPSAnc2NhbGFyJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLnR5cGUuZmllbGRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB0eXBlRGVjbGFyYXRpb24gPSBmaWVsZC50eXBlLm5hbWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodHlwZURlY2xhcmF0aW9uKSB7XG4gICAgICAgICAgICAgICAganMud3JpdGVMbihgICAgICR7ZmllbGQubmFtZX06ICR7dHlwZURlY2xhcmF0aW9ufSxgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIH0ke3R5cGUuY29sbGVjdGlvbiA/ICcsIHRydWUnIDogJyd9KTtcblxuICAgIGApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkpTVW5pb25SZXNvbHZlcih0eXBlOiBEYlR5cGUpIHtcbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgY29uc3QgJHt0eXBlLm5hbWV9UmVzb2x2ZXIgPSB7XG4gICAgICAgICAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xuICAgICAgICBgKTtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgodmFyaWFudCkgPT4ge1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICBpZiAoJyR7dmFyaWFudC5uYW1lfScgaW4gb2JqKSB7YCk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICByZXR1cm4gJyR7dW5pb25WYXJpYW50VHlwZSh0eXBlLCB2YXJpYW50KX0nO2ApO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICB9YCk7XG4gICAgICAgIH0pO1xuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkpTRmlsdGVyKHR5cGU6IERiVHlwZSwganNOYW1lczogU2V0PHN0cmluZz4pIHtcbiAgICAgICAgaWYgKHR5cGUuZmllbGRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS51bmlvbikge1xuICAgICAgICAgICAgLy8gZ2VuSlNGaWx0ZXJzRm9yVW5pb25WYXJpYW50cyh0eXBlLCBqc05hbWVzKTtcbiAgICAgICAgfVxuICAgICAgICBnZW5KU0ZpbHRlcnNGb3JBcnJheUZpZWxkcyh0eXBlLCBqc05hbWVzKTtcbiAgICAgICAgZ2VuSlNTdHJ1Y3RGaWx0ZXIodHlwZSk7XG4gICAgICAgIGlmICh0eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS51bmlvbikge1xuICAgICAgICAgICAgZ2VuSlNVbmlvblJlc29sdmVyKHR5cGUpO1xuICAgICAgICB9XG5cblxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlIGN1c3RvbSByZXNvbHZlcnMgZm9yIHR5cGVzIHdpdGg6XG4gICAgICogLSBpZCBmaWVsZFxuICAgICAqIC0gam9pbiBmaWVsZHNcbiAgICAgKiAtIHU2NCBhbmQgaGlnaGVyIGZpZWxkc1xuICAgICAqIEBwYXJhbSB0eXBlXG4gICAgICovXG4gICAgZnVuY3Rpb24gZ2VuSlNDdXN0b21SZXNvbHZlcnModHlwZTogRGJUeXBlKSB7XG4gICAgICAgIGNvbnN0IGpvaW5GaWVsZHMgPSB0eXBlLmZpZWxkcy5maWx0ZXIoeCA9PiAhIXguam9pbik7XG4gICAgICAgIGNvbnN0IGJpZ1VJbnRGaWVsZHMgPSB0eXBlLmZpZWxkcy5maWx0ZXIoKHg6IERiRmllbGQpID0+ICh4LnR5cGUgPT09IHNjYWxhclR5cGVzLnVpbnQ2NCkgfHwgKHgudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDEwMjQpKTtcbiAgICAgICAgY29uc3QgY3VzdG9tUmVzb2x2ZXJSZXF1aXJlZCA9IHR5cGUuY29sbGVjdGlvblxuICAgICAgICAgICAgfHwgam9pbkZpZWxkcy5sZW5ndGggPiAwXG4gICAgICAgICAgICB8fCBiaWdVSW50RmllbGRzLmxlbmd0aCA+IDA7XG4gICAgICAgIGlmICghY3VzdG9tUmVzb2x2ZXJSZXF1aXJlZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgJHt0eXBlLm5hbWV9OiB7YCk7XG4gICAgICAgIGlmICh0eXBlLmNvbGxlY3Rpb24pIHtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oJyAgICAgICAgICAgIGlkKHBhcmVudCkgeycpO1xuICAgICAgICAgICAganMud3JpdGVMbignICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTsnKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oJyAgICAgICAgICAgIH0sJyk7XG4gICAgICAgIH1cbiAgICAgICAgam9pbkZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgY29uc3Qgb25GaWVsZCA9IHR5cGUuZmllbGRzLmZpbmQoeCA9PiB4Lm5hbWUgPT09IChmaWVsZC5qb2luICYmIGZpZWxkLmpvaW4ub24pIHx8ICcnKTtcbiAgICAgICAgICAgIGlmICghb25GaWVsZCkge1xuICAgICAgICAgICAgICAgIHRocm93ICdKb2luIG9uIGZpZWxkIGRvZXMgbm90IGV4aXN0Lic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBjb2xsZWN0aW9uID0gZmllbGQudHlwZS5jb2xsZWN0aW9uO1xuICAgICAgICAgICAgaWYgKCFjb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgJ0pvaW5lZCB0eXBlIGlzIG5vdCBhIGNvbGxlY3Rpb24uJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICR7ZmllbGQubmFtZX0ocGFyZW50KSB7YCk7XG4gICAgICAgICAgICBpZiAoZmllbGQuYXJyYXlEZXB0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICAgICByZXR1cm4gZGIuZmV0Y2hEb2NCeUtleShkYi4ke2NvbGxlY3Rpb259LCBwYXJlbnQuJHtvbkZpZWxkLm5hbWV9KTtgKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQuYXJyYXlEZXB0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICAgICByZXR1cm4gZGIuZmV0Y2hEb2NzQnlLZXlzKGRiLiR7Y29sbGVjdGlvbn0sIHBhcmVudC4ke29uRmllbGQubmFtZX0pO2ApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyAnSm9pbnMgb24gYSBuZXN0ZWQgYXJyYXlzIGRvZXMgbm90IHN1cHBvcnRlZC4nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgfSxgKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGJpZ1VJbnRGaWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHByZWZpeExlbmd0aCA9IGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLnVpbnQ2NCA/IDEgOiAyO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgJHtmaWVsZC5uYW1lfShwYXJlbnQpIHtgKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoJHtwcmVmaXhMZW5ndGh9LCBwYXJlbnQuJHtmaWVsZC5uYW1lfSk7YCk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICB9LGApO1xuICAgICAgICB9KTtcbiAgICAgICAganMud3JpdGVMbihgICAgICAgICB9LGApO1xuICAgIH1cblxuXG4gICAgZnVuY3Rpb24gZ2VuSlNUeXBlUmVzb2x2ZXJzRm9yVW5pb24odHlwZTogRGJUeXBlKSB7XG4gICAgICAgIGlmICh0eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS51bmlvbikge1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAke3R5cGUubmFtZX06ICR7dHlwZS5uYW1lfVJlc29sdmVyLGApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuZXJhdGUodHlwZXM6IERiVHlwZVtdKSB7XG5cbiAgICAgICAgLy8gUUxcblxuICAgICAgICBbJ1N0cmluZycsICdCb29sZWFuJywgJ0ludCcsICdGbG9hdCddLmZvckVhY2goZ2VuUUxTY2FsYXJUeXBlc0ZpbHRlcik7XG4gICAgICAgIHR5cGVzLmZvckVhY2godHlwZSA9PiBnZW5RTFR5cGVEZWNsYXJhdGlvbih0eXBlKSk7XG4gICAgICAgIGNvbnN0IHFsQXJyYXlGaWx0ZXJzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgICAgIHR5cGVzLmZvckVhY2godHlwZSA9PiBnZW5RTEZpbHRlcih0eXBlLCBxbEFycmF5RmlsdGVycykpO1xuXG4gICAgICAgIGNvbnN0IGNvbGxlY3Rpb25zID0gdHlwZXMuZmlsdGVyKHQgPT4gISF0LmNvbGxlY3Rpb24pO1xuICAgICAgICBnZW5RTFF1ZXJpZXMoY29sbGVjdGlvbnMpO1xuICAgICAgICBnZW5RTFN1YnNjcmlwdGlvbnMoY29sbGVjdGlvbnMpO1xuXG4gICAgICAgIC8vIEpTXG5cbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgY29uc3QgeyBzY2FsYXIsIGJpZ1VJbnQxLCBiaWdVSW50MiwgcmVzb2x2ZUJpZ1VJbnQsIHN0cnVjdCwgYXJyYXksIGpvaW4sIGpvaW5BcnJheSB9ID0gcmVxdWlyZSgnLi9hcmFuZ28tdHlwZXMuanMnKTtcbiAgICAgICAgYCk7XG4gICAgICAgIGNvbnN0IGpzQXJyYXlGaWx0ZXJzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgICAgIHR5cGVzLmZvckVhY2godHlwZSA9PiBnZW5KU0ZpbHRlcih0eXBlLCBqc0FycmF5RmlsdGVycykpO1xuXG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIGZ1bmN0aW9uIGNyZWF0ZVJlc29sdmVycyhkYikge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgYCk7XG4gICAgICAgIHR5cGVzLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICAgICAgICAgIGdlbkpTQ3VzdG9tUmVzb2x2ZXJzKHR5cGUpO1xuICAgICAgICAgICAgZ2VuSlNUeXBlUmVzb2x2ZXJzRm9yVW5pb24odHlwZSk7XG4gICAgICAgIH0pO1xuICAgICAgICBqcy53cml0ZUxuKCcgICAgICAgIFF1ZXJ5OiB7Jyk7XG4gICAgICAgIGNvbGxlY3Rpb25zLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICR7dHlwZS5jb2xsZWN0aW9uIHx8ICcnfTogZGIuY29sbGVjdGlvblF1ZXJ5KGRiLiR7dHlwZS5jb2xsZWN0aW9uIHx8ICcnfSwgJHt0eXBlLm5hbWV9KSxgKVxuICAgICAgICB9KTtcbiAgICAgICAganMud3JpdGVMbignICAgICAgICAgICAgc2VsZWN0OiBkYi5zZWxlY3RRdWVyeSgpLCcpO1xuICAgICAgICBqcy53cml0ZUxuKCcgICAgICAgIH0sJyk7XG4gICAgICAgIGpzLndyaXRlTG4oJyAgICAgICAgU3Vic2NyaXB0aW9uOiB7Jyk7XG4gICAgICAgIGNvbGxlY3Rpb25zLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICR7dHlwZS5jb2xsZWN0aW9uIHx8ICcnfTogZGIuY29sbGVjdGlvblN1YnNjcmlwdGlvbihkYi4ke3R5cGUuY29sbGVjdGlvbiB8fCAnJ30sICR7dHlwZS5uYW1lfSksYClcbiAgICAgICAgfSk7XG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGApO1xuXG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0ge1xuICAgICAgICAgICAgY3JlYXRlUmVzb2x2ZXJzXG4gICAgICAgIH07XG4gICAgICAgIGApO1xuICAgIH1cblxuICAgIGNvbnN0IHNjaGVtYSA9IHBhcnNlVHlwZURlZihzY2hlbWFEZWYpO1xuXG4gICAgaWYgKHNjaGVtYS5jbGFzcykge1xuICAgICAgICBwYXJzZURiVHlwZXMoc2NoZW1hLmNsYXNzLnR5cGVzKTtcbiAgICAgICAgZ2VuZXJhdGUoZGJUeXBlcyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcWw6IHFsLmdlbmVyYXRlZCgpLFxuICAgICAgICBqczoganMuZ2VuZXJhdGVkKCksXG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBtYWluO1xuIl19