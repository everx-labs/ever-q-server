"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

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
  var enumTypes = new Map();

  function reportEnumType(schemaType) {
    if (!(schemaType._ && schemaType._["enum"])) {
      return;
    }

    var enumDef = schemaType._["enum"];
    enumTypes.set(enumDef.name, enumDef);
  }

  function reportType(name, field, type) {
    if (name !== lastReportedType) {
      console.log(name);
      lastReportedType = name;
    }

    console.log("    ".concat(field, ": ").concat(type));
  }

  function parseDbField(typeName, schemaField) {
    var schemaType = schemaField;
    reportEnumType(schemaType);
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

  function getScalarResolverName(type) {
    if (type === scalarTypes.uint64) {
      return 'bigUInt1';
    }

    if (type === scalarTypes.uint1024) {
      return 'bigUInt2';
    }

    return 'scalar';
  }

  function genJSFiltersForArrayFields(type, jsNames) {
    type.fields.forEach(function (field) {
      var itemTypeName = field.type.name;

      var _loop2 = function _loop2(i) {
        var filterName = "".concat(itemTypeName, "Array");
        preventTwice(filterName, jsNames, function () {
          var itemResolverName = i === 0 && field.type.category === DbTypeCategory.scalar ? getScalarResolverName(field.type) : itemTypeName;
          js.writeBlockLn("\n                const ".concat(filterName, " = array(").concat(itemResolverName, ");\n                "));
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
        typeDeclaration = getScalarResolverName(field.type);
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

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = enumTypes.values()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var _e = _step.value;
      console.log("export const Q".concat(_e.name, " = {"));
      console.log(Object.entries(_e.values).map(function (_ref) {
        var _ref2 = (0, _slicedToArray2["default"])(_ref, 2),
            name = _ref2[0],
            value = _ref2[1];

        return "    ".concat(name, ": ").concat(value, ",");
      }).join('\n'));
      console.log("};\n");
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator["return"] != null) {
        _iterator["return"]();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return {
    ql: ql.generated(),
    js: js.generated()
  };
}

var _default = main;
exports["default"] = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9nZW4tcWwtanMuanMiXSwibmFtZXMiOlsiRGJUeXBlQ2F0ZWdvcnkiLCJ1bnJlc29sdmVkIiwic2NhbGFyIiwidW5pb24iLCJzdHJ1Y3QiLCJzY2FsYXJUeXBlIiwibmFtZSIsImNhdGVnb3J5IiwiZmllbGRzIiwic2NhbGFyVHlwZXMiLCJ1aW50NjQiLCJ1aW50MTAyNCIsInN0cmluZyIsInVucmVzb2x2ZWRUeXBlIiwibWFpbiIsInNjaGVtYURlZiIsImRiVHlwZXMiLCJsYXN0UmVwb3J0ZWRUeXBlIiwiZW51bVR5cGVzIiwiTWFwIiwicmVwb3J0RW51bVR5cGUiLCJzY2hlbWFUeXBlIiwiXyIsImVudW1EZWYiLCJzZXQiLCJyZXBvcnRUeXBlIiwiZmllbGQiLCJ0eXBlIiwiY29uc29sZSIsImxvZyIsInBhcnNlRGJGaWVsZCIsInR5cGVOYW1lIiwic2NoZW1hRmllbGQiLCJhcnJheURlcHRoIiwiYXJyYXkiLCJqb2luIiwicmVmIiwiYm9vbCIsInVuc2lnbmVkIiwic2l6ZSIsIkVycm9yIiwiSlNPTiIsInN0cmluZ2lmeSIsInByb2Nlc3MiLCJleGl0IiwidW53cmFwQXJyYXlzIiwicGFyc2VEYlR5cGUiLCJzdWJzdHIiLCJjb2xsZWN0aW9uIiwicHVzaCIsImZvckVhY2giLCJ1bndyYXBwZWQiLCJvd25UeXBlIiwicGFyc2VEYlR5cGVzIiwidHlwZXMiLCJyZXNvbHZpbmciLCJTZXQiLCJyZXNvbHZlZCIsIm9yZGVyZWRSZXNvbHZlZCIsInQiLCJyZXNvbHZlVHlwZSIsImhhcyIsImFkZCIsImdldCIsInFsIiwiV3JpdGVyIiwianMiLCJ1bmlvblZhcmlhbnRUeXBlIiwidmFyaWFudCIsImdlblFMVHlwZURlY2xhcmF0aW9uc0ZvclVuaW9uVmFyaWFudHMiLCJ3cml0ZUJsb2NrTG4iLCJnZW5RTFR5cGVEZWNsYXJhdGlvbiIsIndyaXRlTG4iLCJ0eXBlRGVjbGFyYXRpb24iLCJyZXBlYXQiLCJwcmV2ZW50VHdpY2UiLCJuYW1lcyIsIndvcmsiLCJnZW5RTEZpbHRlcnNGb3JBcnJheUZpZWxkcyIsInFsTmFtZXMiLCJpdGVtVHlwZU5hbWUiLCJpIiwiZmlsdGVyTmFtZSIsIm9wIiwiZ2VuUUxGaWx0ZXIiLCJsZW5ndGgiLCJnZW5RTFNjYWxhclR5cGVzRmlsdGVyIiwiZ2VuUUxRdWVyaWVzIiwiZ2VuUUxTdWJzY3JpcHRpb25zIiwiZ2V0U2NhbGFyUmVzb2x2ZXJOYW1lIiwiZ2VuSlNGaWx0ZXJzRm9yQXJyYXlGaWVsZHMiLCJqc05hbWVzIiwiaXRlbVJlc29sdmVyTmFtZSIsImdlbkpTU3RydWN0RmlsdGVyIiwib24iLCJnZW5KU1VuaW9uUmVzb2x2ZXIiLCJnZW5KU0ZpbHRlciIsImdlbkpTQ3VzdG9tUmVzb2x2ZXJzIiwiam9pbkZpZWxkcyIsImZpbHRlciIsIngiLCJiaWdVSW50RmllbGRzIiwiY3VzdG9tUmVzb2x2ZXJSZXF1aXJlZCIsIm9uRmllbGQiLCJmaW5kIiwicHJlZml4TGVuZ3RoIiwiZ2VuSlNUeXBlUmVzb2x2ZXJzRm9yVW5pb24iLCJnZW5lcmF0ZSIsInFsQXJyYXlGaWx0ZXJzIiwiY29sbGVjdGlvbnMiLCJqc0FycmF5RmlsdGVycyIsInNjaGVtYSIsInZhbHVlcyIsImUiLCJPYmplY3QiLCJlbnRyaWVzIiwibWFwIiwidmFsdWUiLCJnZW5lcmF0ZWQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBRUE7O0FBRUE7O0FBRUEsSUFBTUEsY0FBYyxHQUFHO0FBQ25CQyxFQUFBQSxVQUFVLEVBQUUsWUFETztBQUVuQkMsRUFBQUEsTUFBTSxFQUFFLFFBRlc7QUFHbkJDLEVBQUFBLEtBQUssRUFBRSxPQUhZO0FBSW5CQyxFQUFBQSxNQUFNLEVBQUU7QUFKVyxDQUF2Qjs7QUEwQkEsU0FBU0MsVUFBVCxDQUFvQkMsSUFBcEIsRUFBMEM7QUFDdEMsU0FBTztBQUNIQSxJQUFBQSxJQUFJLEVBQUpBLElBREc7QUFFSEMsSUFBQUEsUUFBUSxFQUFFUCxjQUFjLENBQUNFLE1BRnRCO0FBR0hNLElBQUFBLE1BQU0sRUFB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QTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOztBQXFnQjlCLFNBQU87QUFDSG1DLElBQUFBLEVBQUUsRUFBRUEsRUFBRSxDQUFDc0QsU0FBSCxFQUREO0FBRUhwRCxJQUFBQSxFQUFFLEVBQUVBLEVBQUUsQ0FBQ29ELFNBQUg7QUFGRCxHQUFQO0FBSUg7O2VBRWN4RyxJIiwic291cmNlc0NvbnRlbnQiOlsiLy9AZmxvd1xuXG5pbXBvcnQgeyBtYWtlRmllbGRUeXBlTmFtZSwgV3JpdGVyIH0gZnJvbSAndG9uLWxhYnMtZGV2LW9wcy9kaXN0L3NyYy9nZW4uanMnO1xuaW1wb3J0IHR5cGUgeyBTY2hlbWFNZW1iZXIsIFNjaGVtYVR5cGUsIFR5cGVEZWYgfSBmcm9tICd0b24tbGFicy1kZXYtb3BzL3NyYy9zY2hlbWEuanMnO1xuaW1wb3J0IHsgcGFyc2VUeXBlRGVmIH0gZnJvbSAndG9uLWxhYnMtZGV2LW9wcy9kaXN0L3NyYy9zY2hlbWEuanMnO1xuXG5jb25zdCBEYlR5cGVDYXRlZ29yeSA9IHtcbiAgICB1bnJlc29sdmVkOiAndW5yZXNvbHZlZCcsXG4gICAgc2NhbGFyOiAnc2NhbGFyJyxcbiAgICB1bmlvbjogJ3VuaW9uJyxcbiAgICBzdHJ1Y3Q6ICdzdHJ1Y3QnLFxufTtcblxudHlwZSBEYkpvaW4gPSB7XG4gICAgY29sbGVjdGlvbjogc3RyaW5nLFxuICAgIG9uOiBzdHJpbmcsXG59XG5cbnR5cGUgRGJUeXBlID0ge1xuICAgIG5hbWU6IHN0cmluZyxcbiAgICBjYXRlZ29yeTogJEtleXM8dHlwZW9mIERiVHlwZUNhdGVnb3J5PixcbiAgICBjb2xsZWN0aW9uPzogc3RyaW5nLFxuICAgIGZpZWxkczogRGJGaWVsZFtdLFxufVxuXG50eXBlIERiRmllbGQgPSB7XG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGFycmF5RGVwdGg6IG51bWJlcixcbiAgICBqb2luPzogRGJKb2luLFxuICAgIHR5cGU6IERiVHlwZSxcbn1cblxuZnVuY3Rpb24gc2NhbGFyVHlwZShuYW1lOiBzdHJpbmcpOiBEYlR5cGUge1xuICAgIHJldHVybiB7XG4gICAgICAgIG5hbWUsXG4gICAgICAgIGNhdGVnb3J5OiBEYlR5cGVDYXRlZ29yeS5zY2FsYXIsXG4gICAgICAgIGZpZWxkczogW11cbiAgICB9XG59XG5cbmNvbnN0IHNjYWxhclR5cGVzID0ge1xuICAgIGludDogc2NhbGFyVHlwZSgnSW50JyksXG4gICAgdWludDY0OiBzY2FsYXJUeXBlKCdTdHJpbmcnKSxcbiAgICB1aW50MTAyNDogc2NhbGFyVHlwZSgnU3RyaW5nJyksXG4gICAgZmxvYXQ6IHNjYWxhclR5cGUoJ0Zsb2F0JyksXG4gICAgYm9vbGVhbjogc2NhbGFyVHlwZSgnQm9vbGVhbicpLFxuICAgIHN0cmluZzogc2NhbGFyVHlwZSgnU3RyaW5nJyksXG59O1xuXG5mdW5jdGlvbiB1bnJlc29sdmVkVHlwZShuYW1lOiBzdHJpbmcpOiBEYlR5cGUge1xuICAgIHJldHVybiB7XG4gICAgICAgIG5hbWUsXG4gICAgICAgIGNhdGVnb3J5OiBEYlR5cGVDYXRlZ29yeS51bnJlc29sdmVkLFxuICAgICAgICBmaWVsZHM6IFtdLFxuICAgIH1cbn1cblxudHlwZSBJbnRFbnVtRGVmID0ge1xuICAgIG5hbWU6IHN0cmluZyxcbiAgICB2YWx1ZXM6IHsgW3N0cmluZ106IG51bWJlciB9LFxufVxuXG5mdW5jdGlvbiBtYWluKHNjaGVtYURlZjogVHlwZURlZikge1xuXG4gICAgbGV0IGRiVHlwZXM6IERiVHlwZVtdID0gW107XG4gICAgbGV0IGxhc3RSZXBvcnRlZFR5cGU6IHN0cmluZyA9ICcnO1xuICAgIGxldCBlbnVtVHlwZXM6IE1hcDxzdHJpbmcsIEludEVudW1EZWY+ID0gbmV3IE1hcCgpO1xuXG4gICAgZnVuY3Rpb24gcmVwb3J0RW51bVR5cGUoc2NoZW1hVHlwZTogU2NoZW1hVHlwZSkge1xuICAgICAgICBpZiAoIShzY2hlbWFUeXBlLl8gJiYgc2NoZW1hVHlwZS5fLmVudW0pKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZW51bURlZjogSW50RW51bURlZiA9IHNjaGVtYVR5cGUuXy5lbnVtO1xuICAgICAgICBlbnVtVHlwZXMuc2V0KGVudW1EZWYubmFtZSwgZW51bURlZik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmVwb3J0VHlwZShuYW1lOiBzdHJpbmcsIGZpZWxkOiBzdHJpbmcsIHR5cGU6IHN0cmluZykge1xuICAgICAgICBpZiAobmFtZSAhPT0gbGFzdFJlcG9ydGVkVHlwZSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2cobmFtZSk7XG4gICAgICAgICAgICBsYXN0UmVwb3J0ZWRUeXBlID0gbmFtZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmxvZyhgICAgICR7ZmllbGR9OiAke3R5cGV9YCk7XG5cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZURiRmllbGQoXG4gICAgICAgIHR5cGVOYW1lOiBzdHJpbmcsXG4gICAgICAgIHNjaGVtYUZpZWxkOiBTY2hlbWFNZW1iZXI8U2NoZW1hVHlwZT4sXG4gICAgKTogRGJGaWVsZCB7XG4gICAgICAgIGxldCBzY2hlbWFUeXBlID0gc2NoZW1hRmllbGQ7XG4gICAgICAgIHJlcG9ydEVudW1UeXBlKHNjaGVtYVR5cGUpO1xuICAgICAgICBjb25zdCBmaWVsZDogRGJGaWVsZCA9IHtcbiAgICAgICAgICAgIG5hbWU6IHNjaGVtYUZpZWxkLm5hbWUsXG4gICAgICAgICAgICBhcnJheURlcHRoOiAwLFxuICAgICAgICAgICAgdHlwZTogc2NhbGFyVHlwZXMuc3RyaW5nLFxuICAgICAgICB9O1xuICAgICAgICB3aGlsZSAoc2NoZW1hVHlwZS5hcnJheSkge1xuICAgICAgICAgICAgZmllbGQuYXJyYXlEZXB0aCArPSAxO1xuICAgICAgICAgICAgc2NoZW1hVHlwZSA9IHNjaGVtYVR5cGUuYXJyYXk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgam9pbiA9IChzY2hlbWFUeXBlOiBhbnkpLl8uam9pbjtcbiAgICAgICAgaWYgKGpvaW4pIHtcbiAgICAgICAgICAgIGZpZWxkLmpvaW4gPSBqb2luO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzY2hlbWFUeXBlLnVuaW9uIHx8IHNjaGVtYVR5cGUuc3RydWN0KSB7XG4gICAgICAgICAgICBmaWVsZC50eXBlID0gdW5yZXNvbHZlZFR5cGUobWFrZUZpZWxkVHlwZU5hbWUodHlwZU5hbWUsIHNjaGVtYUZpZWxkLm5hbWUpKTtcbiAgICAgICAgfSBlbHNlIGlmIChzY2hlbWFUeXBlLnJlZikge1xuICAgICAgICAgICAgZmllbGQudHlwZSA9IHVucmVzb2x2ZWRUeXBlKHNjaGVtYVR5cGUucmVmLm5hbWUpO1xuICAgICAgICB9IGVsc2UgaWYgKHNjaGVtYVR5cGUuYm9vbCkge1xuICAgICAgICAgICAgZmllbGQudHlwZSA9IHNjYWxhclR5cGVzLmJvb2xlYW47XG4gICAgICAgIH0gZWxzZSBpZiAoc2NoZW1hVHlwZS5pbnQpIHtcbiAgICAgICAgICAgIGNvbnN0IHVuc2lnbmVkOiBib29sZWFuID0gKHNjaGVtYVR5cGUuaW50ICYmIHNjaGVtYVR5cGUuaW50LnVuc2lnbmVkKSB8fCBmYWxzZTtcbiAgICAgICAgICAgIGNvbnN0IHNpemU6IG51bWJlciA9IChzY2hlbWFUeXBlLmludCAmJiBzY2hlbWFUeXBlLmludC5zaXplKSB8fCAzMjtcbiAgICAgICAgICAgIGlmICh1bnNpZ25lZCkge1xuICAgICAgICAgICAgICAgIGlmIChzaXplID49IDEyOCkge1xuICAgICAgICAgICAgICAgICAgICByZXBvcnRUeXBlKHR5cGVOYW1lLCBmaWVsZC5uYW1lLCAndTEwMjQnKTtcbiAgICAgICAgICAgICAgICAgICAgZmllbGQudHlwZSA9IHNjYWxhclR5cGVzLnVpbnQxMDI0O1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc2l6ZSA+PSA2NCkge1xuICAgICAgICAgICAgICAgICAgICByZXBvcnRUeXBlKHR5cGVOYW1lLCBmaWVsZC5uYW1lLCAndTY0Jyk7XG4gICAgICAgICAgICAgICAgICAgIGZpZWxkLnR5cGUgPSBzY2FsYXJUeXBlcy51aW50NjQ7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzaXplID49IDMyKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcG9ydFR5cGUodHlwZU5hbWUsIGZpZWxkLm5hbWUsICd1MzInKTtcbiAgICAgICAgICAgICAgICAgICAgZmllbGQudHlwZSA9IHNjYWxhclR5cGVzLmZsb2F0O1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcG9ydFR5cGUodHlwZU5hbWUsIGZpZWxkLm5hbWUsIGB1JHtzaXplfWApO1xuICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlID0gc2NhbGFyVHlwZXMuaW50O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKHNpemUgPiAzMikge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludGVnZXIgdHlwZSB3aXRoIHNpemUgJHtzaXplfSBiaXQgZG9lcyBub3Qgc3VwcG9ydGVkYCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVwb3J0VHlwZSh0eXBlTmFtZSwgZmllbGQubmFtZSwgJ2kzMicpO1xuICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlID0gc2NhbGFyVHlwZXMuaW50O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChzY2hlbWFUeXBlLmZsb2F0KSB7XG4gICAgICAgICAgICByZXBvcnRUeXBlKHR5cGVOYW1lLCBmaWVsZC5uYW1lLCAnZmxvYXQnKTtcbiAgICAgICAgICAgIGZpZWxkLnR5cGUgPSBzY2FsYXJUeXBlcy5mbG9hdDtcbiAgICAgICAgfSBlbHNlIGlmIChzY2hlbWFUeXBlLnN0cmluZykge1xuICAgICAgICAgICAgZmllbGQudHlwZSA9IHNjYWxhclR5cGVzLnN0cmluZztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZpZWxkLnR5cGUgPSBzY2FsYXJUeXBlcy5zdHJpbmc7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnPj4+IEludmFsaWQgZmllbGQgdHlwZTogJywgSlNPTi5zdHJpbmdpZnkoc2NoZW1hVHlwZSkpO1xuICAgICAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmaWVsZDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB1bndyYXBBcnJheXModHlwZTogU2NoZW1hVHlwZSk6IFNjaGVtYVR5cGUge1xuICAgICAgICBpZiAodHlwZS5hcnJheSkge1xuICAgICAgICAgICAgcmV0dXJuIHVud3JhcEFycmF5cyh0eXBlLmFycmF5KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHlwZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZURiVHlwZShcbiAgICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgICBzY2hlbWFUeXBlOiBTY2hlbWFUeXBlXG4gICAgKSB7XG4gICAgICAgIGNvbnN0IHN0cnVjdCA9IHNjaGVtYVR5cGUudW5pb24gfHwgc2NoZW1hVHlwZS5zdHJ1Y3Q7XG4gICAgICAgIGlmICghc3RydWN0KSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnPj4+JywgYD8/ICR7bmFtZX06ICR7SlNPTi5zdHJpbmdpZnkoc2NoZW1hVHlwZSkuc3Vic3RyKDAsIDIwKX1gKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0eXBlOiBEYlR5cGUgPSB7XG4gICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgY2F0ZWdvcnk6IHNjaGVtYVR5cGUudW5pb24gPyBEYlR5cGVDYXRlZ29yeS51bmlvbiA6IERiVHlwZUNhdGVnb3J5LnN0cnVjdCxcbiAgICAgICAgICAgIGZpZWxkczogW10sXG4gICAgICAgICAgICBjb2xsZWN0aW9uOiAoc2NoZW1hVHlwZTogYW55KS5fLmNvbGxlY3Rpb24sXG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKHR5cGUuY29sbGVjdGlvbikge1xuICAgICAgICAgICAgdHlwZS5maWVsZHMucHVzaCh7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2lkJyxcbiAgICAgICAgICAgICAgICBhcnJheURlcHRoOiAwLFxuICAgICAgICAgICAgICAgIHR5cGU6IHNjYWxhclR5cGVzLnN0cmluZyxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHN0cnVjdC5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgdHlwZS5maWVsZHMucHVzaChwYXJzZURiRmllbGQobmFtZSwgZmllbGQpKTtcbiAgICAgICAgICAgIGNvbnN0IHVud3JhcHBlZCA9IHVud3JhcEFycmF5cyhmaWVsZCk7XG4gICAgICAgICAgICBjb25zdCBvd25UeXBlID0gKHVud3JhcHBlZC5zdHJ1Y3QgfHwgdW53cmFwcGVkLnVuaW9uKSA/IHVud3JhcHBlZCA6IG51bGw7XG4gICAgICAgICAgICBpZiAob3duVHlwZSkge1xuICAgICAgICAgICAgICAgIHBhcnNlRGJUeXBlKG1ha2VGaWVsZFR5cGVOYW1lKG5hbWUsIGZpZWxkLm5hbWUpLCBvd25UeXBlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGRiVHlwZXMucHVzaCh0eXBlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZURiVHlwZXModHlwZXM6IFNjaGVtYU1lbWJlcjxTY2hlbWFUeXBlPltdKSB7XG4gICAgICAgIHR5cGVzLmZvckVhY2goKHR5cGU6IFNjaGVtYU1lbWJlcjxTY2hlbWFUeXBlPikgPT4ge1xuICAgICAgICAgICAgcGFyc2VEYlR5cGUodHlwZS5uYW1lLCB0eXBlKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IHVucmVzb2x2ZWQ6IE1hcDxzdHJpbmcsIERiVHlwZT4gPSBuZXcgTWFwPHN0cmluZywgRGJUeXBlPigpO1xuICAgICAgICBjb25zdCByZXNvbHZpbmc6IFNldDxzdHJpbmc+ID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgICAgIGNvbnN0IHJlc29sdmVkOiBNYXA8c3RyaW5nLCBEYlR5cGU+ID0gbmV3IE1hcDxzdHJpbmcsIERiVHlwZT4oKTtcbiAgICAgICAgY29uc3Qgb3JkZXJlZFJlc29sdmVkOiBEYlR5cGVbXSA9IFtdO1xuICAgICAgICBkYlR5cGVzLmZvckVhY2godCA9PiB1bnJlc29sdmVkLnNldCh0Lm5hbWUsIHQpKTtcbiAgICAgICAgY29uc3QgcmVzb2x2ZVR5cGUgPSAodHlwZTogRGJUeXBlKSA9PiB7XG4gICAgICAgICAgICBpZiAocmVzb2x2ZWQuaGFzKHR5cGUubmFtZSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocmVzb2x2aW5nLmhhcyh0eXBlLm5hbWUpKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJz4+PicsIGBDaXJjdWxhciByZWZlcmVuY2UgdG8gdHlwZSAke3R5cGUubmFtZX1gKTtcbiAgICAgICAgICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXNvbHZpbmcuYWRkKHR5cGUubmFtZSk7XG4gICAgICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChmaWVsZC50eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS51bnJlc29sdmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCB0eXBlID0gcmVzb2x2ZWQuZ2V0KGZpZWxkLnR5cGUubmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghdHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSA9IHVucmVzb2x2ZWQuZ2V0KGZpZWxkLnR5cGUubmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmVUeXBlKHR5cGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnPj4+JywgYFJlZmVyZW5jZWQgdHlwZSBub3QgZm91bmQ6ICR7ZmllbGQudHlwZS5uYW1lfWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZmllbGQudHlwZSA9IHR5cGU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJlc29sdmluZy5kZWxldGUodHlwZS5uYW1lKTtcbiAgICAgICAgICAgIG9yZGVyZWRSZXNvbHZlZC5wdXNoKHR5cGUpO1xuICAgICAgICAgICAgdW5yZXNvbHZlZC5kZWxldGUodHlwZS5uYW1lKTtcbiAgICAgICAgICAgIHJlc29sdmVkLnNldCh0eXBlLm5hbWUsIHR5cGUpO1xuICAgICAgICB9O1xuICAgICAgICBkYlR5cGVzLmZvckVhY2gocmVzb2x2ZVR5cGUpO1xuICAgICAgICBkYlR5cGVzID0gb3JkZXJlZFJlc29sdmVkO1xuICAgIH1cblxuLy8gR2VuZXJhdG9yc1xuXG4gICAgY29uc3QgcWwgPSBuZXcgV3JpdGVyKCk7XG4gICAgY29uc3QganMgPSBuZXcgV3JpdGVyKCk7XG5cbiAgICBmdW5jdGlvbiB1bmlvblZhcmlhbnRUeXBlKHR5cGU6IERiVHlwZSwgdmFyaWFudDogRGJGaWVsZCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiBgJHt0eXBlLm5hbWV9JHt2YXJpYW50Lm5hbWV9VmFyaWFudGA7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuUUxUeXBlRGVjbGFyYXRpb25zRm9yVW5pb25WYXJpYW50cyh0eXBlOiBEYlR5cGUpIHtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgodmFyaWFudCkgPT4ge1xuICAgICAgICAgICAgcWwud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgdHlwZSAke3VuaW9uVmFyaWFudFR5cGUodHlwZSwgdmFyaWFudCl9IHtcbiAgICAgICAgICAgICR7dmFyaWFudC5uYW1lfTogJHt2YXJpYW50LnR5cGUubmFtZX1cbiAgICAgICAgfVxuXG4gICAgICAgIGApO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5RTFR5cGVEZWNsYXJhdGlvbih0eXBlOiBEYlR5cGUpIHtcbiAgICAgICAgaWYgKHR5cGUuY2F0ZWdvcnkgPT09IERiVHlwZUNhdGVnb3J5LnVuaW9uKSB7XG4gICAgICAgICAgICBnZW5RTFR5cGVEZWNsYXJhdGlvbnNGb3JVbmlvblZhcmlhbnRzKHR5cGUpO1xuICAgICAgICAgICAgcWwud3JpdGVMbihgdW5pb24gJHt0eXBlLm5hbWV9ID0gYCk7XG4gICAgICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKHZhcmlhbnQgPT4ge1xuICAgICAgICAgICAgICAgIHFsLndyaXRlTG4oYFxcdHwgJHt1bmlvblZhcmlhbnRUeXBlKHR5cGUsIHZhcmlhbnQpfWApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBxbC53cml0ZUxuKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGB0eXBlICR7dHlwZS5uYW1lfSB7YCk7XG4gICAgICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKGZpZWxkID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCB0eXBlRGVjbGFyYXRpb24gPVxuICAgICAgICAgICAgICAgICAgICAnWycucmVwZWF0KGZpZWxkLmFycmF5RGVwdGgpICtcbiAgICAgICAgICAgICAgICAgICAgZmllbGQudHlwZS5uYW1lICtcbiAgICAgICAgICAgICAgICAgICAgJ10nLnJlcGVhdChmaWVsZC5hcnJheURlcHRoKTtcbiAgICAgICAgICAgICAgICBxbC53cml0ZUxuKGBcXHQke2ZpZWxkLm5hbWV9OiAke3R5cGVEZWNsYXJhdGlvbn1gKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcWwud3JpdGVMbihgfWApO1xuICAgICAgICB9XG4gICAgICAgIHFsLndyaXRlTG4oKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwcmV2ZW50VHdpY2UobmFtZTogc3RyaW5nLCBuYW1lczogU2V0PHN0cmluZz4sIHdvcms6ICgpID0+IHZvaWQpIHtcbiAgICAgICAgaWYgKCFuYW1lcy5oYXMobmFtZSkpIHtcbiAgICAgICAgICAgIG5hbWVzLmFkZChuYW1lKTtcbiAgICAgICAgICAgIHdvcmsoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlblFMRmlsdGVyc0ZvckFycmF5RmllbGRzKHR5cGU6IERiVHlwZSwgcWxOYW1lczogU2V0PHN0cmluZz4pIHtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGxldCBpdGVtVHlwZU5hbWUgPSBmaWVsZC50eXBlLm5hbWU7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZpZWxkLmFycmF5RGVwdGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpbHRlck5hbWUgPSBgJHtpdGVtVHlwZU5hbWV9QXJyYXlGaWx0ZXJgO1xuICAgICAgICAgICAgICAgIHByZXZlbnRUd2ljZShmaWx0ZXJOYW1lLCBxbE5hbWVzLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHFsLndyaXRlTG4oYGlucHV0ICR7ZmlsdGVyTmFtZX0ge2ApO1xuICAgICAgICAgICAgICAgICAgICBbJ2FueScsICdhbGwnXS5mb3JFYWNoKChvcCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0JHtvcH06ICR7aXRlbVR5cGVOYW1lfUZpbHRlcmApO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgcWwud3JpdGVMbignfScpO1xuICAgICAgICAgICAgICAgICAgICBxbC53cml0ZUxuKCk7XG5cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBpdGVtVHlwZU5hbWUgKz0gJ0FycmF5JztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuUUxGaWx0ZXIodHlwZTogRGJUeXBlLCBxbE5hbWVzOiBTZXQ8c3RyaW5nPikge1xuICAgICAgICBpZiAodHlwZS5maWVsZHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgZ2VuUUxGaWx0ZXJzRm9yQXJyYXlGaWVsZHModHlwZSwgcWxOYW1lcyk7XG4gICAgICAgIHFsLndyaXRlTG4oYGlucHV0ICR7dHlwZS5uYW1lfUZpbHRlciB7YCk7XG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBjb25zdCB0eXBlRGVjbGFyYXRpb24gPSBmaWVsZC50eXBlLm5hbWUgKyBcIkFycmF5XCIucmVwZWF0KGZpZWxkLmFycmF5RGVwdGgpO1xuICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0JHtmaWVsZC5uYW1lfTogJHt0eXBlRGVjbGFyYXRpb259RmlsdGVyYCk7XG4gICAgICAgIH0pO1xuICAgICAgICBxbC53cml0ZUxuKGB9YCk7XG4gICAgICAgIHFsLndyaXRlTG4oKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5RTFNjYWxhclR5cGVzRmlsdGVyKG5hbWU6IHN0cmluZykge1xuICAgICAgICBxbC53cml0ZUxuKGBpbnB1dCAke25hbWV9RmlsdGVyIHtgKTtcbiAgICAgICAgWydlcScsICduZScsICdndCcsICdsdCcsICdnZScsICdsZSddLmZvckVhY2goKG9wKSA9PiB7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGBcXHQke29wfTogJHtuYW1lfWApO1xuICAgICAgICB9KTtcbiAgICAgICAgWydpbicsICdub3RJbiddLmZvckVhY2goKG9wKSA9PiB7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGBcXHQke29wfTogWyR7bmFtZX1dYCk7XG4gICAgICAgIH0pO1xuICAgICAgICBxbC53cml0ZUxuKCd9Jyk7XG4gICAgICAgIHFsLndyaXRlTG4oKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5RTFF1ZXJpZXModHlwZXM6IERiVHlwZVtdKSB7XG4gICAgICAgIHFsLndyaXRlQmxvY2tMbihgXG4gICAgICAgIGVudW0gUXVlcnlPcmRlckJ5RGlyZWN0aW9uIHtcbiAgICAgICAgICAgIEFTQ1xuICAgICAgICAgICAgREVTQ1xuICAgICAgICB9XG5cbiAgICAgICAgaW5wdXQgUXVlcnlPcmRlckJ5IHtcbiAgICAgICAgICAgIHBhdGg6IFN0cmluZ1xuICAgICAgICAgICAgZGlyZWN0aW9uOiBRdWVyeU9yZGVyQnlEaXJlY3Rpb25cbiAgICAgICAgfVxuXG4gICAgICAgIHR5cGUgUXVlcnkge1xuICAgICAgICBgKTtcblxuICAgICAgICB0eXBlcy5mb3JFYWNoKCh0eXBlOiBEYlR5cGUpID0+IHtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oYFxcdCR7dHlwZS5jb2xsZWN0aW9uIHx8ICcnfShmaWx0ZXI6ICR7dHlwZS5uYW1lfUZpbHRlciwgb3JkZXJCeTogW1F1ZXJ5T3JkZXJCeV0sIGxpbWl0OiBJbnQpOiBbJHt0eXBlLm5hbWV9XWApO1xuICAgICAgICB9KTtcblxuICAgICAgICBxbC53cml0ZUJsb2NrTG4oYFxuICAgICAgICAgICAgc2VsZWN0KHF1ZXJ5OiBTdHJpbmchLCBiaW5kVmFyc0pzb246IFN0cmluZyEpOiBTdHJpbmchXG4gICAgICAgIH1cblxuICAgICAgICBgKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5RTFN1YnNjcmlwdGlvbnModHlwZXM6IERiVHlwZVtdKSB7XG4gICAgICAgIHFsLndyaXRlTG4oJ3R5cGUgU3Vic2NyaXB0aW9uIHsnKTtcbiAgICAgICAgdHlwZXMuZm9yRWFjaCgodHlwZSkgPT4ge1xuICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0JHt0eXBlLmNvbGxlY3Rpb24gfHwgJyd9KGZpbHRlcjogJHt0eXBlLm5hbWV9RmlsdGVyKTogJHt0eXBlLm5hbWV9YCk7XG4gICAgICAgIH0pO1xuICAgICAgICBxbC53cml0ZUxuKCd9Jyk7XG4gICAgfVxuXG5cbiAgICBmdW5jdGlvbiBnZXRTY2FsYXJSZXNvbHZlck5hbWUodHlwZTogRGJUeXBlKTogc3RyaW5nIHtcbiAgICAgICAgaWYgKHR5cGUgPT09IHNjYWxhclR5cGVzLnVpbnQ2NCkge1xuICAgICAgICAgICAgcmV0dXJuICdiaWdVSW50MSc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGUgPT09IHNjYWxhclR5cGVzLnVpbnQxMDI0KSB7XG4gICAgICAgICAgICByZXR1cm4gJ2JpZ1VJbnQyJztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJ3NjYWxhcic7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuSlNGaWx0ZXJzRm9yQXJyYXlGaWVsZHModHlwZTogRGJUeXBlLCBqc05hbWVzOiBTZXQ8c3RyaW5nPikge1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgbGV0IGl0ZW1UeXBlTmFtZSA9IGZpZWxkLnR5cGUubmFtZTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZmllbGQuYXJyYXlEZXB0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmlsdGVyTmFtZSA9IGAke2l0ZW1UeXBlTmFtZX1BcnJheWA7XG4gICAgICAgICAgICAgICAgcHJldmVudFR3aWNlKGZpbHRlck5hbWUsIGpzTmFtZXMsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaXRlbVJlc29sdmVyTmFtZSA9IChpID09PSAwICYmIGZpZWxkLnR5cGUuY2F0ZWdvcnkgPT09IERiVHlwZUNhdGVnb3J5LnNjYWxhcilcbiAgICAgICAgICAgICAgICAgICAgICAgID8gZ2V0U2NhbGFyUmVzb2x2ZXJOYW1lKGZpZWxkLnR5cGUpXG4gICAgICAgICAgICAgICAgICAgICAgICA6IGl0ZW1UeXBlTmFtZTtcbiAgICAgICAgICAgICAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgICAgICAgICBjb25zdCAke2ZpbHRlck5hbWV9ID0gYXJyYXkoJHtpdGVtUmVzb2x2ZXJOYW1lfSk7XG4gICAgICAgICAgICAgICAgYCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaXRlbVR5cGVOYW1lICs9ICdBcnJheSc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkpTU3RydWN0RmlsdGVyKHR5cGU6IERiVHlwZSkge1xuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBjb25zdCAke3R5cGUubmFtZX0gPSBzdHJ1Y3Qoe1xuICAgIGApO1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgbGV0IHR5cGVEZWNsYXJhdGlvbjogP3N0cmluZyA9IG51bGw7XG4gICAgICAgICAgICBjb25zdCBqb2luID0gZmllbGQuam9pbjtcbiAgICAgICAgICAgIGlmIChqb2luKSB7XG4gICAgICAgICAgICAgICAgdHlwZURlY2xhcmF0aW9uID0gYGpvaW4ke2ZpZWxkLmFycmF5RGVwdGggPiAwID8gJ0FycmF5JyA6ICcnfSgnJHtqb2luLm9ufScsICcke2ZpZWxkLnR5cGUuY29sbGVjdGlvbiB8fCAnJ30nLCAke2ZpZWxkLnR5cGUubmFtZX0pYDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQuYXJyYXlEZXB0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB0eXBlRGVjbGFyYXRpb24gPVxuICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlLm5hbWUgK1xuICAgICAgICAgICAgICAgICAgICAnQXJyYXknLnJlcGVhdChmaWVsZC5hcnJheURlcHRoKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZS5jYXRlZ29yeSA9PT0gRGJUeXBlQ2F0ZWdvcnkuc2NhbGFyKSB7XG4gICAgICAgICAgICAgICAgdHlwZURlY2xhcmF0aW9uID0gZ2V0U2NhbGFyUmVzb2x2ZXJOYW1lKGZpZWxkLnR5cGUpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC50eXBlLmZpZWxkcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgdHlwZURlY2xhcmF0aW9uID0gZmllbGQudHlwZS5uYW1lO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHR5cGVEZWNsYXJhdGlvbikge1xuICAgICAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAke2ZpZWxkLm5hbWV9OiAke3R5cGVEZWNsYXJhdGlvbn0sYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICB9JHt0eXBlLmNvbGxlY3Rpb24gPyAnLCB0cnVlJyA6ICcnfSk7XG5cbiAgICBgKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5KU1VuaW9uUmVzb2x2ZXIodHlwZTogRGJUeXBlKSB7XG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIGNvbnN0ICR7dHlwZS5uYW1lfVJlc29sdmVyID0ge1xuICAgICAgICAgICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgYCk7XG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKHZhcmlhbnQpID0+IHtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgaWYgKCcke3ZhcmlhbnQubmFtZX0nIGluIG9iaikge2ApO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgcmV0dXJuICcke3VuaW9uVmFyaWFudFR5cGUodHlwZSwgdmFyaWFudCl9JztgKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgfWApO1xuICAgICAgICB9KTtcbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBgKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5KU0ZpbHRlcih0eXBlOiBEYlR5cGUsIGpzTmFtZXM6IFNldDxzdHJpbmc+KSB7XG4gICAgICAgIGlmICh0eXBlLmZpZWxkcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZS5jYXRlZ29yeSA9PT0gRGJUeXBlQ2F0ZWdvcnkudW5pb24pIHtcbiAgICAgICAgICAgIC8vIGdlbkpTRmlsdGVyc0ZvclVuaW9uVmFyaWFudHModHlwZSwganNOYW1lcyk7XG4gICAgICAgIH1cbiAgICAgICAgZ2VuSlNGaWx0ZXJzRm9yQXJyYXlGaWVsZHModHlwZSwganNOYW1lcyk7XG4gICAgICAgIGdlbkpTU3RydWN0RmlsdGVyKHR5cGUpO1xuICAgICAgICBpZiAodHlwZS5jYXRlZ29yeSA9PT0gRGJUeXBlQ2F0ZWdvcnkudW5pb24pIHtcbiAgICAgICAgICAgIGdlbkpTVW5pb25SZXNvbHZlcih0eXBlKTtcbiAgICAgICAgfVxuXG5cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZW5lcmF0ZSBjdXN0b20gcmVzb2x2ZXJzIGZvciB0eXBlcyB3aXRoOlxuICAgICAqIC0gaWQgZmllbGRcbiAgICAgKiAtIGpvaW4gZmllbGRzXG4gICAgICogLSB1NjQgYW5kIGhpZ2hlciBmaWVsZHNcbiAgICAgKiBAcGFyYW0gdHlwZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGdlbkpTQ3VzdG9tUmVzb2x2ZXJzKHR5cGU6IERiVHlwZSkge1xuICAgICAgICBjb25zdCBqb2luRmllbGRzID0gdHlwZS5maWVsZHMuZmlsdGVyKHggPT4gISF4LmpvaW4pO1xuICAgICAgICBjb25zdCBiaWdVSW50RmllbGRzID0gdHlwZS5maWVsZHMuZmlsdGVyKCh4OiBEYkZpZWxkKSA9PiAoeC50eXBlID09PSBzY2FsYXJUeXBlcy51aW50NjQpIHx8ICh4LnR5cGUgPT09IHNjYWxhclR5cGVzLnVpbnQxMDI0KSk7XG4gICAgICAgIGNvbnN0IGN1c3RvbVJlc29sdmVyUmVxdWlyZWQgPSB0eXBlLmNvbGxlY3Rpb25cbiAgICAgICAgICAgIHx8IGpvaW5GaWVsZHMubGVuZ3RoID4gMFxuICAgICAgICAgICAgfHwgYmlnVUludEZpZWxkcy5sZW5ndGggPiAwO1xuICAgICAgICBpZiAoIWN1c3RvbVJlc29sdmVyUmVxdWlyZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICR7dHlwZS5uYW1lfToge2ApO1xuICAgICAgICBpZiAodHlwZS5jb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICBqcy53cml0ZUxuKCcgICAgICAgICAgICBpZChwYXJlbnQpIHsnKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oJyAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7Jyk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKCcgICAgICAgICAgICB9LCcpO1xuICAgICAgICB9XG4gICAgICAgIGpvaW5GaWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG9uRmllbGQgPSB0eXBlLmZpZWxkcy5maW5kKHggPT4geC5uYW1lID09PSAoZmllbGQuam9pbiAmJiBmaWVsZC5qb2luLm9uKSB8fCAnJyk7XG4gICAgICAgICAgICBpZiAoIW9uRmllbGQpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyAnSm9pbiBvbiBmaWVsZCBkb2VzIG5vdCBleGlzdC4nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgY29sbGVjdGlvbiA9IGZpZWxkLnR5cGUuY29sbGVjdGlvbjtcbiAgICAgICAgICAgIGlmICghY29sbGVjdGlvbikge1xuICAgICAgICAgICAgICAgIHRocm93ICdKb2luZWQgdHlwZSBpcyBub3QgYSBjb2xsZWN0aW9uLic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAke2ZpZWxkLm5hbWV9KHBhcmVudCkge2ApO1xuICAgICAgICAgICAgaWYgKGZpZWxkLmFycmF5RGVwdGggPT09IDApIHtcbiAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAgICAgcmV0dXJuIGRiLmZldGNoRG9jQnlLZXkoZGIuJHtjb2xsZWN0aW9ufSwgcGFyZW50LiR7b25GaWVsZC5uYW1lfSk7YCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLmFycmF5RGVwdGggPT09IDEpIHtcbiAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAgICAgcmV0dXJuIGRiLmZldGNoRG9jc0J5S2V5cyhkYi4ke2NvbGxlY3Rpb259LCBwYXJlbnQuJHtvbkZpZWxkLm5hbWV9KTtgKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgJ0pvaW5zIG9uIGEgbmVzdGVkIGFycmF5cyBkb2VzIG5vdCBzdXBwb3J0ZWQuJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgIH0sYCk7XG4gICAgICAgIH0pO1xuICAgICAgICBiaWdVSW50RmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwcmVmaXhMZW5ndGggPSBmaWVsZC50eXBlID09PSBzY2FsYXJUeXBlcy51aW50NjQgPyAxIDogMjtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICR7ZmllbGQubmFtZX0ocGFyZW50KSB7YCk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KCR7cHJlZml4TGVuZ3RofSwgcGFyZW50LiR7ZmllbGQubmFtZX0pO2ApO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgfSxgKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgfSxgKTtcbiAgICB9XG5cblxuICAgIGZ1bmN0aW9uIGdlbkpTVHlwZVJlc29sdmVyc0ZvclVuaW9uKHR5cGU6IERiVHlwZSkge1xuICAgICAgICBpZiAodHlwZS5jYXRlZ29yeSA9PT0gRGJUeXBlQ2F0ZWdvcnkudW5pb24pIHtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgJHt0eXBlLm5hbWV9OiAke3R5cGUubmFtZX1SZXNvbHZlcixgKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbmVyYXRlKHR5cGVzOiBEYlR5cGVbXSkge1xuXG4gICAgICAgIC8vIFFMXG5cbiAgICAgICAgWydTdHJpbmcnLCAnQm9vbGVhbicsICdJbnQnLCAnRmxvYXQnXS5mb3JFYWNoKGdlblFMU2NhbGFyVHlwZXNGaWx0ZXIpO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKHR5cGUgPT4gZ2VuUUxUeXBlRGVjbGFyYXRpb24odHlwZSkpO1xuICAgICAgICBjb25zdCBxbEFycmF5RmlsdGVycyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKHR5cGUgPT4gZ2VuUUxGaWx0ZXIodHlwZSwgcWxBcnJheUZpbHRlcnMpKTtcblxuICAgICAgICBjb25zdCBjb2xsZWN0aW9ucyA9IHR5cGVzLmZpbHRlcih0ID0+ICEhdC5jb2xsZWN0aW9uKTtcbiAgICAgICAgZ2VuUUxRdWVyaWVzKGNvbGxlY3Rpb25zKTtcbiAgICAgICAgZ2VuUUxTdWJzY3JpcHRpb25zKGNvbGxlY3Rpb25zKTtcblxuICAgICAgICAvLyBKU1xuXG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIGNvbnN0IHsgc2NhbGFyLCBiaWdVSW50MSwgYmlnVUludDIsIHJlc29sdmVCaWdVSW50LCBzdHJ1Y3QsIGFycmF5LCBqb2luLCBqb2luQXJyYXkgfSA9IHJlcXVpcmUoJy4vYXJhbmdvLXR5cGVzLmpzJyk7XG4gICAgICAgIGApO1xuICAgICAgICBjb25zdCBqc0FycmF5RmlsdGVycyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKHR5cGUgPT4gZ2VuSlNGaWx0ZXIodHlwZSwganNBcnJheUZpbHRlcnMpKTtcblxuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBmdW5jdGlvbiBjcmVhdGVSZXNvbHZlcnMoZGIpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgIGApO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgICAgICAgICBnZW5KU0N1c3RvbVJlc29sdmVycyh0eXBlKTtcbiAgICAgICAgICAgIGdlbkpTVHlwZVJlc29sdmVyc0ZvclVuaW9uKHR5cGUpO1xuICAgICAgICB9KTtcbiAgICAgICAganMud3JpdGVMbignICAgICAgICBRdWVyeTogeycpO1xuICAgICAgICBjb2xsZWN0aW9ucy5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAke3R5cGUuY29sbGVjdGlvbiB8fCAnJ306IGRiLmNvbGxlY3Rpb25RdWVyeShkYi4ke3R5cGUuY29sbGVjdGlvbiB8fCAnJ30sICR7dHlwZS5uYW1lfSksYClcbiAgICAgICAgfSk7XG4gICAgICAgIGpzLndyaXRlTG4oJyAgICAgICAgICAgIHNlbGVjdDogZGIuc2VsZWN0UXVlcnkoKSwnKTtcbiAgICAgICAganMud3JpdGVMbignICAgICAgICB9LCcpO1xuICAgICAgICBqcy53cml0ZUxuKCcgICAgICAgIFN1YnNjcmlwdGlvbjogeycpO1xuICAgICAgICBjb2xsZWN0aW9ucy5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAke3R5cGUuY29sbGVjdGlvbiB8fCAnJ306IGRiLmNvbGxlY3Rpb25TdWJzY3JpcHRpb24oZGIuJHt0eXBlLmNvbGxlY3Rpb24gfHwgJyd9LCAke3R5cGUubmFtZX0pLGApXG4gICAgICAgIH0pO1xuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBgKTtcblxuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAgICAgICAgIGNyZWF0ZVJlc29sdmVycyxcbiAgICAgICAgYCk7XG4gICAgICAgIHR5cGVzLmZvckVhY2godHlwZSA9PiBqcy53cml0ZUxuKGAgICAgJHt0eXBlLm5hbWV9LGApKTtcbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgfTtcbiAgICAgICAgYCk7XG4gICAgfVxuXG4gICAgY29uc3Qgc2NoZW1hID0gcGFyc2VUeXBlRGVmKHNjaGVtYURlZik7XG5cbiAgICBpZiAoc2NoZW1hLmNsYXNzKSB7XG4gICAgICAgIHBhcnNlRGJUeXBlcyhzY2hlbWEuY2xhc3MudHlwZXMpO1xuICAgICAgICBnZW5lcmF0ZShkYlR5cGVzKTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IGU6IEludEVudW1EZWYgb2YgZW51bVR5cGVzLnZhbHVlcygpKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBleHBvcnQgY29uc3QgUSR7ZS5uYW1lfSA9IHtgKTtcbiAgICAgICAgY29uc29sZS5sb2coT2JqZWN0LmVudHJpZXMoZS52YWx1ZXMpLm1hcCgoW25hbWUsIHZhbHVlXSkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGAgICAgJHtuYW1lfTogJHsodmFsdWU6IGFueSl9LGA7XG4gICAgICAgIH0pLmpvaW4oJ1xcbicpKTtcbiAgICAgICAgY29uc29sZS5sb2coYH07XFxuYCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcWw6IHFsLmdlbmVyYXRlZCgpLFxuICAgICAgICBqczoganMuZ2VuZXJhdGVkKCksXG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBtYWluO1xuIl19