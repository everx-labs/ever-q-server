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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9nZW4tcWwtanMuanMiXSwibmFtZXMiOlsiRGJUeXBlQ2F0ZWdvcnkiLCJ1bnJlc29sdmVkIiwic2NhbGFyIiwidW5pb24iLCJzdHJ1Y3QiLCJzY2FsYXJUeXBlIiwibmFtZSIsImNhdGVnb3J5IiwiZmllbGRzIiwic2NhbGFyVHlwZXMiLCJ1aW50NjQiLCJ1aW50MTAyNCIsInN0cmluZyIsInVucmVzb2x2ZWRUeXBlIiwibWFpbiIsInNjaGVtYURlZiIsImRiVHlwZXMiLCJsYXN0UmVwb3J0ZWRUeXBlIiwiZW51bVR5cGVzIiwiTWFwIiwicmVwb3J0RW51bVR5cGUiLCJzY2hlbWFUeXBlIiwiXyIsImVudW1EZWYiLCJzZXQiLCJyZXBvcnRUeXBlIiwiZmllbGQiLCJ0eXBlIiwiY29uc29sZSIsImxvZyIsInBhcnNlRGJGaWVsZCIsInR5cGVOYW1lIiwic2NoZW1hRmllbGQiLCJhcnJheURlcHRoIiwiYXJyYXkiLCJqb2luIiwicmVmIiwiYm9vbCIsInVuc2lnbmVkIiwic2l6ZSIsIkVycm9yIiwiSlNPTiIsInN0cmluZ2lmeSIsInByb2Nlc3MiLCJleGl0IiwidW53cmFwQXJyYXlzIiwicGFyc2VEYlR5cGUiLCJzdWJzdHIiLCJjb2xsZWN0aW9uIiwicHVzaCIsImZvckVhY2giLCJ1bndyYXBwZWQiLCJvd25UeXBlIiwicGFyc2VEYlR5cGVzIiwidHlwZXMiLCJyZXNvbHZpbmciLCJTZXQiLCJyZXNvbHZlZCIsIm9yZGVyZWRSZXNvbHZlZCIsInQiLCJyZXNvbHZlVHlwZSIsImhhcyIsImFkZCIsImdldCIsInFsIiwiV3JpdGVyIiwianMiLCJ1bmlvblZhcmlhbnRUeXBlIiwidmFyaWFudCIsImdlblFMVHlwZURlY2xhcmF0aW9uc0ZvclVuaW9uVmFyaWFudHMiLCJ3cml0ZUJsb2NrTG4iLCJnZW5RTFR5cGVEZWNsYXJhdGlvbiIsIndyaXRlTG4iLCJ0eXBlRGVjbGFyYXRpb24iLCJyZXBlYXQiLCJwcmV2ZW50VHdpY2UiLCJuYW1lcyIsIndvcmsiLCJnZW5RTEZpbHRlcnNGb3JBcnJheUZpZWxkcyIsInFsTmFtZXMiLCJpdGVtVHlwZU5hbWUiLCJpIiwiZmlsdGVyTmFtZSIsIm9wIiwiZ2VuUUxGaWx0ZXIiLCJsZW5ndGgiLCJnZW5RTFNjYWxhclR5cGVzRmlsdGVyIiwiZ2VuUUxRdWVyaWVzIiwiZ2VuUUxTdWJzY3JpcHRpb25zIiwiZ2VuSlNGaWx0ZXJzRm9yQXJyYXlGaWVsZHMiLCJqc05hbWVzIiwiZ2VuSlNTdHJ1Y3RGaWx0ZXIiLCJvbiIsImdlbkpTVW5pb25SZXNvbHZlciIsImdlbkpTRmlsdGVyIiwiZ2VuSlNDdXN0b21SZXNvbHZlcnMiLCJqb2luRmllbGRzIiwiZmlsdGVyIiwieCIsImJpZ1VJbnRGaWVsZHMiLCJjdXN0b21SZXNvbHZlclJlcXVpcmVkIiwib25GaWVsZCIsImZpbmQiLCJwcmVmaXhMZW5ndGgiLCJnZW5KU1R5cGVSZXNvbHZlcnNGb3JVbmlvbiIsImdlbmVyYXRlIiwicWxBcnJheUZpbHRlcnMiLCJjb2xsZWN0aW9ucyIsImpzQXJyYXlGaWx0ZXJzIiwic2NoZW1hIiwidmFsdWVzIiwiZSIsIk9iamVjdCIsImVudHJpZXMiLCJtYXAiLCJ2YWx1ZSIsImdlbmVyYXRlZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFFQTs7QUFFQTs7QUFFQSxJQUFNQSxjQUFjLEdBQUc7QUFDbkJDLEVBQUFBLFVBQVUsRUFBRSxZQURPO0FBRW5CQyxFQUFBQSxNQUFNLEVBQUUsUUFGVztBQUduQkMsRUFBQUEsS0FBSyxFQUFFLE9BSFk7QUFJbkJDLEVBQUFBLE1BQU0sRUFBRTtBQUpXLENBQXZCOztBQTBCQSxTQUFTQyxVQUFULENBQW9CQyxJQUFwQixFQUEwQztBQUN0QyxTQUFPO0FBQ0hBLElBQUFBLElBQUksRUFBSkEsSUFERztBQUVIQyxJQUFBQSxRQUFRLEVBQUVQLGNBQWMsQ0FBQ0UsTUFGdEI7QUFHSE0sSUFBQUEsTUFBTSxFQUFFO0FBSEwsR0FBUDtBQUtIOztBQUVELElBQU1DLFdBQVcsR0FBRztBQUNoQixTQUFLSixVQUFVLENBQUMsS0FBRCxDQURDO0FBRWhCSyxFQUFBQSxNQUFNLEVBQUVMLFVBQVUsQ0FBQyxRQUFELENBRkY7QUFHaEJNLEVBQUFBLFFBQVEsRUFBRU4sVUFBVSxDQUFDLFFBQUQsQ0FISjtBQUloQixXQUFPQSxVQUFVLENBQUMsT0FBRCxDQUpEO0FBS2hCLGFBQVNBLFVBQVUsQ0FBQyxTQUFELENBTEg7QUFNaEJPLEVBQUFBLE1BQU0sRUFBRVAsVUFBVSxDQUFDLFFBQUQ7QUFORixDQUFwQjs7QUFTQSxTQUFTUSxjQUFULENBQXdCUCxJQUF4QixFQUE4QztBQUMxQyxTQUFPO0FBQ0hBLElBQUFBLElBQUksRUFBSkEsSUFERztBQUVIQyxJQUFBQSxRQUFRLEVBQUVQLGNBQWMsQ0FBQ0MsVUFGdEI7QUFHSE8sSUFBQUEsTUFBTSxFQUFFO0FBSEwsR0FBUDtBQUtIOztBQU9ELFNBQVNNLElBQVQsQ0FBY0MsU0FBZCxFQUFrQztBQUU5QixNQUFJQyxPQUFpQixHQUFHLEVBQXhCO0FBQ0EsTUFBSUMsZ0JBQXdCLEdBQUcsRUFBL0I7QUFDQSxNQUFJQyxTQUFrQyxHQUFHLElBQUlDLEdBQUosRUFBekM7O0FBRUEsV0FBU0MsY0FBVCxDQUF3QkMsVUFBeEIsRUFBZ0Q7QUFDNUMsUUFBSSxFQUFFQSxVQUFVLENBQUNDLENBQVgsSUFBZ0JELFVBQVUsQ0FBQ0MsQ0FBWCxRQUFsQixDQUFKLEVBQTBDO0FBQ3RDO0FBQ0g7O0FBQ0QsUUFBTUMsT0FBbUIsR0FBR0YsVUFBVSxDQUFDQyxDQUFYLFFBQTVCO0FBQ0FKLElBQUFBLFNBQVMsQ0FBQ00sR0FBVixDQUFjRCxPQUFPLENBQUNqQixJQUF0QixFQUE0QmlCLE9BQTVCO0FBQ0g7O0FBRUQsV0FBU0UsVUFBVCxDQUFvQm5CLElBQXBCLEVBQWtDb0IsS0FBbEMsRUFBaURDLElBQWpELEVBQStEO0FBQzNELFFBQUlyQixJQUFJLEtBQUtXLGdCQUFiLEVBQStCO0FBQzNCVyxNQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWXZCLElBQVo7QUFDQVcsTUFBQUEsZ0JBQWdCLEdBQUdYLElBQW5CO0FBQ0g7O0FBQ0RzQixJQUFBQSxPQUFPLENBQUNDLEdBQVIsZUFBbUJILEtBQW5CLGVBQTZCQyxJQUE3QjtBQUVIOztBQUVELFdBQVNHLFlBQVQsQ0FDSUMsUUFESixFQUVJQyxXQUZKLEVBR1c7QUFDUCxRQUFJWCxVQUFVLEdBQUdXLFdBQWpCO0FBQ0FaLElBQUFBLGNBQWMsQ0FBQ0MsVUFBRCxDQUFkO0FBQ0EsUUFBTUssS0FBYyxHQUFHO0FBQ25CcEIsTUFBQUEsSUFBSSxFQUFFMEIsV0FBVyxDQUFDMUIsSUFEQztBQUVuQjJCLE1BQUFBLFVBQVUsRUFBRSxDQUZPO0FBR25CTixNQUFBQSxJQUFJLEVBQUVsQixXQUFXLENBQUNHO0FBSEMsS0FBdkI7O0FBS0EsV0FBT1MsVUFBVSxDQUFDYSxLQUFsQixFQUF5QjtBQUNyQlIsTUFBQUEsS0FBSyxDQUFDTyxVQUFOLElBQW9CLENBQXBCO0FBQ0FaLE1BQUFBLFVBQVUsR0FBR0EsVUFBVSxDQUFDYSxLQUF4QjtBQUNIOztBQUNELFFBQU1DLElBQUksR0FBSWQsVUFBRCxDQUFrQkMsQ0FBbEIsQ0FBb0JhLElBQWpDOztBQUNBLFFBQUlBLElBQUosRUFBVTtBQUNOVCxNQUFBQSxLQUFLLENBQUNTLElBQU4sR0FBYUEsSUFBYjtBQUNIOztBQUNELFFBQUlkLFVBQVUsQ0FBQ2xCLEtBQVgsSUFBb0JrQixVQUFVLENBQUNqQixNQUFuQyxFQUEyQztBQUN2Q3NCLE1BQUFBLEtBQUssQ0FBQ0MsSUFBTixHQUFhZCxjQUFjLENBQUMsNEJBQWtCa0IsUUFBbEIsRUFBNEJDLFdBQVcsQ0FBQzFCLElBQXhDLENBQUQsQ0FBM0I7QUFDSCxLQUZELE1BRU8sSUFBSWUsVUFBVSxDQUFDZSxHQUFmLEVBQW9CO0FBQ3ZCVixNQUFBQSxLQUFLLENBQUNDLElBQU4sR0FBYWQsY0FBYyxDQUFDUSxVQUFVLENBQUNlLEdBQVgsQ0FBZTlCLElBQWhCLENBQTNCO0FBQ0gsS0FGTSxNQUVBLElBQUllLFVBQVUsQ0FBQ2dCLElBQWYsRUFBcUI7QUFDeEJYLE1BQUFBLEtBQUssQ0FBQ0MsSUFBTixHQUFhbEIsV0FBVyxXQUF4QjtBQUNILEtBRk0sTUFFQSxJQUFJWSxVQUFVLE9BQWQsRUFBb0I7QUFDdkIsVUFBTWlCLFFBQWlCLEdBQUlqQixVQUFVLE9BQVYsSUFBa0JBLFVBQVUsT0FBVixDQUFlaUIsUUFBbEMsSUFBK0MsS0FBekU7QUFDQSxVQUFNQyxJQUFZLEdBQUlsQixVQUFVLE9BQVYsSUFBa0JBLFVBQVUsT0FBVixDQUFla0IsSUFBbEMsSUFBMkMsRUFBaEU7O0FBQ0EsVUFBSUQsUUFBSixFQUFjO0FBQ1YsWUFBSUMsSUFBSSxJQUFJLEdBQVosRUFBaUI7QUFDYmQsVUFBQUEsVUFBVSxDQUFDTSxRQUFELEVBQVdMLEtBQUssQ0FBQ3BCLElBQWpCLEVBQXVCLE9BQXZCLENBQVY7QUFDQW9CLFVBQUFBLEtBQUssQ0FBQ0MsSUFBTixHQUFhbEIsV0FBVyxDQUFDRSxRQUF6QjtBQUNILFNBSEQsTUFHTyxJQUFJNEIsSUFBSSxJQUFJLEVBQVosRUFBZ0I7QUFDbkJkLFVBQUFBLFVBQVUsQ0FBQ00sUUFBRCxFQUFXTCxLQUFLLENBQUNwQixJQUFqQixFQUF1QixLQUF2QixDQUFWO0FBQ0FvQixVQUFBQSxLQUFLLENBQUNDLElBQU4sR0FBYWxCLFdBQVcsQ0FBQ0MsTUFBekI7QUFDSCxTQUhNLE1BR0EsSUFBSTZCLElBQUksSUFBSSxFQUFaLEVBQWdCO0FBQ25CZCxVQUFBQSxVQUFVLENBQUNNLFFBQUQsRUFBV0wsS0FBSyxDQUFDcEIsSUFBakIsRUFBdUIsS0FBdkIsQ0FBVjtBQUNBb0IsVUFBQUEsS0FBSyxDQUFDQyxJQUFOLEdBQWFsQixXQUFXLFNBQXhCO0FBQ0gsU0FITSxNQUdBO0FBQ0hnQixVQUFBQSxVQUFVLENBQUNNLFFBQUQsRUFBV0wsS0FBSyxDQUFDcEIsSUFBakIsYUFBMkJpQyxJQUEzQixFQUFWO0FBQ0FiLFVBQUFBLEtBQUssQ0FBQ0MsSUFBTixHQUFhbEIsV0FBVyxPQUF4QjtBQUNIO0FBQ0osT0FkRCxNQWNPO0FBQ0gsWUFBSThCLElBQUksR0FBRyxFQUFYLEVBQWU7QUFDWCxnQkFBTSxJQUFJQyxLQUFKLGtDQUFvQ0QsSUFBcEMsNkJBQU47QUFDSCxTQUZELE1BRU87QUFDSGQsVUFBQUEsVUFBVSxDQUFDTSxRQUFELEVBQVdMLEtBQUssQ0FBQ3BCLElBQWpCLEVBQXVCLEtBQXZCLENBQVY7QUFDQW9CLFVBQUFBLEtBQUssQ0FBQ0MsSUFBTixHQUFhbEIsV0FBVyxPQUF4QjtBQUNIO0FBQ0o7QUFDSixLQXpCTSxNQXlCQSxJQUFJWSxVQUFVLFNBQWQsRUFBc0I7QUFDekJJLE1BQUFBLFVBQVUsQ0FBQ00sUUFBRCxFQUFXTCxLQUFLLENBQUNwQixJQUFqQixFQUF1QixPQUF2QixDQUFWO0FBQ0FvQixNQUFBQSxLQUFLLENBQUNDLElBQU4sR0FBYWxCLFdBQVcsU0FBeEI7QUFDSCxLQUhNLE1BR0EsSUFBSVksVUFBVSxDQUFDVCxNQUFmLEVBQXVCO0FBQzFCYyxNQUFBQSxLQUFLLENBQUNDLElBQU4sR0FBYWxCLFdBQVcsQ0FBQ0csTUFBekI7QUFDSCxLQUZNLE1BRUE7QUFDSGMsTUFBQUEsS0FBSyxDQUFDQyxJQUFOLEdBQWFsQixXQUFXLENBQUNHLE1BQXpCO0FBQ0FnQixNQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSwwQkFBWixFQUF3Q1ksSUFBSSxDQUFDQyxTQUFMLENBQWVyQixVQUFmLENBQXhDO0FBQ0FzQixNQUFBQSxPQUFPLENBQUNDLElBQVIsQ0FBYSxDQUFiO0FBQ0g7O0FBQ0QsV0FBT2xCLEtBQVA7QUFDSDs7QUFFRCxXQUFTbUIsWUFBVCxDQUFzQmxCLElBQXRCLEVBQW9EO0FBQ2hELFFBQUlBLElBQUksQ0FBQ08sS0FBVCxFQUFnQjtBQUNaLGFBQU9XLFlBQVksQ0FBQ2xCLElBQUksQ0FBQ08sS0FBTixDQUFuQjtBQUNIOztBQUNELFdBQU9QLElBQVA7QUFDSDs7QUFFRCxXQUFTbUIsV0FBVCxDQUNJeEMsSUFESixFQUVJZSxVQUZKLEVBR0U7QUFDRSxRQUFNakIsTUFBTSxHQUFHaUIsVUFBVSxDQUFDbEIsS0FBWCxJQUFvQmtCLFVBQVUsQ0FBQ2pCLE1BQTlDOztBQUNBLFFBQUksQ0FBQ0EsTUFBTCxFQUFhO0FBQ1R3QixNQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSxLQUFaLGVBQXlCdkIsSUFBekIsZUFBa0NtQyxJQUFJLENBQUNDLFNBQUwsQ0FBZXJCLFVBQWYsRUFBMkIwQixNQUEzQixDQUFrQyxDQUFsQyxFQUFxQyxFQUFyQyxDQUFsQztBQUNBO0FBQ0g7O0FBQ0QsUUFBTXBCLElBQVksR0FBRztBQUNqQnJCLE1BQUFBLElBQUksRUFBSkEsSUFEaUI7QUFFakJDLE1BQUFBLFFBQVEsRUFBRWMsVUFBVSxDQUFDbEIsS0FBWCxHQUFtQkgsY0FBYyxDQUFDRyxLQUFsQyxHQUEwQ0gsY0FBYyxDQUFDSSxNQUZsRDtBQUdqQkksTUFBQUEsTUFBTSxFQUFFLEVBSFM7QUFJakJ3QyxNQUFBQSxVQUFVLEVBQUczQixVQUFELENBQWtCQyxDQUFsQixDQUFvQjBCO0FBSmYsS0FBckI7O0FBT0EsUUFBSXJCLElBQUksQ0FBQ3FCLFVBQVQsRUFBcUI7QUFDakJyQixNQUFBQSxJQUFJLENBQUNuQixNQUFMLENBQVl5QyxJQUFaLENBQWlCO0FBQ2IzQyxRQUFBQSxJQUFJLEVBQUUsSUFETztBQUViMkIsUUFBQUEsVUFBVSxFQUFFLENBRkM7QUFHYk4sUUFBQUEsSUFBSSxFQUFFbEIsV0FBVyxDQUFDRztBQUhMLE9BQWpCO0FBS0g7O0FBQ0RSLElBQUFBLE1BQU0sQ0FBQzhDLE9BQVAsQ0FBZSxVQUFDeEIsS0FBRCxFQUFXO0FBQ3RCQyxNQUFBQSxJQUFJLENBQUNuQixNQUFMLENBQVl5QyxJQUFaLENBQWlCbkIsWUFBWSxDQUFDeEIsSUFBRCxFQUFPb0IsS0FBUCxDQUE3QjtBQUNBLFVBQU15QixTQUFTLEdBQUdOLFlBQVksQ0FBQ25CLEtBQUQsQ0FBOUI7QUFDQSxVQUFNMEIsT0FBTyxHQUFJRCxTQUFTLENBQUMvQyxNQUFWLElBQW9CK0MsU0FBUyxDQUFDaEQsS0FBL0IsR0FBd0NnRCxTQUF4QyxHQUFvRCxJQUFwRTs7QUFDQSxVQUFJQyxPQUFKLEVBQWE7QUFDVE4sUUFBQUEsV0FBVyxDQUFDLDRCQUFrQnhDLElBQWxCLEVBQXdCb0IsS0FBSyxDQUFDcEIsSUFBOUIsQ0FBRCxFQUFzQzhDLE9BQXRDLENBQVg7QUFDSDtBQUNKLEtBUEQ7QUFRQXBDLElBQUFBLE9BQU8sQ0FBQ2lDLElBQVIsQ0FBYXRCLElBQWI7QUFDSDs7QUFFRCxXQUFTMEIsWUFBVCxDQUFzQkMsS0FBdEIsRUFBeUQ7QUFDckRBLElBQUFBLEtBQUssQ0FBQ0osT0FBTixDQUFjLFVBQUN2QixJQUFELEVBQW9DO0FBQzlDbUIsTUFBQUEsV0FBVyxDQUFDbkIsSUFBSSxDQUFDckIsSUFBTixFQUFZcUIsSUFBWixDQUFYO0FBQ0gsS0FGRDtBQUdBLFFBQU0xQixVQUErQixHQUFHLElBQUlrQixHQUFKLEVBQXhDO0FBQ0EsUUFBTW9DLFNBQXNCLEdBQUcsSUFBSUMsR0FBSixFQUEvQjtBQUNBLFFBQU1DLFFBQTZCLEdBQUcsSUFBSXRDLEdBQUosRUFBdEM7QUFDQSxRQUFNdUMsZUFBeUIsR0FBRyxFQUFsQztBQUNBMUMsSUFBQUEsT0FBTyxDQUFDa0MsT0FBUixDQUFnQixVQUFBUyxDQUFDO0FBQUEsYUFBSTFELFVBQVUsQ0FBQ3VCLEdBQVgsQ0FBZW1DLENBQUMsQ0FBQ3JELElBQWpCLEVBQXVCcUQsQ0FBdkIsQ0FBSjtBQUFBLEtBQWpCOztBQUNBLFFBQU1DLFdBQVcsR0FBRyxTQUFkQSxXQUFjLENBQUNqQyxJQUFELEVBQWtCO0FBQ2xDLFVBQUk4QixRQUFRLENBQUNJLEdBQVQsQ0FBYWxDLElBQUksQ0FBQ3JCLElBQWxCLENBQUosRUFBNkI7QUFDekI7QUFDSDs7QUFDRCxVQUFJaUQsU0FBUyxDQUFDTSxHQUFWLENBQWNsQyxJQUFJLENBQUNyQixJQUFuQixDQUFKLEVBQThCO0FBQzFCc0IsUUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVksS0FBWix1Q0FBaURGLElBQUksQ0FBQ3JCLElBQXREO0FBQ0FxQyxRQUFBQSxPQUFPLENBQUNDLElBQVIsQ0FBYSxDQUFiO0FBQ0g7O0FBQ0RXLE1BQUFBLFNBQVMsQ0FBQ08sR0FBVixDQUFjbkMsSUFBSSxDQUFDckIsSUFBbkI7QUFDQXFCLE1BQUFBLElBQUksQ0FBQ25CLE1BQUwsQ0FBWTBDLE9BQVosQ0FBb0IsVUFBQ3hCLEtBQUQsRUFBVztBQUMzQixZQUFJQSxLQUFLLENBQUNDLElBQU4sQ0FBV3BCLFFBQVgsS0FBd0JQLGNBQWMsQ0FBQ0MsVUFBM0MsRUFBdUQ7QUFDbkQsY0FBSTBCLEtBQUksR0FBRzhCLFFBQVEsQ0FBQ00sR0FBVCxDQUFhckMsS0FBSyxDQUFDQyxJQUFOLENBQVdyQixJQUF4QixDQUFYOztBQUNBLGNBQUksQ0FBQ3FCLEtBQUwsRUFBVztBQUNQQSxZQUFBQSxLQUFJLEdBQUcxQixVQUFVLENBQUM4RCxHQUFYLENBQWVyQyxLQUFLLENBQUNDLElBQU4sQ0FBV3JCLElBQTFCLENBQVA7O0FBQ0EsZ0JBQUlxQixLQUFKLEVBQVU7QUFDTmlDLGNBQUFBLFdBQVcsQ0FBQ2pDLEtBQUQsQ0FBWDtBQUNILGFBRkQsTUFFTztBQUNIQyxjQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSxLQUFaLHVDQUFpREgsS0FBSyxDQUFDQyxJQUFOLENBQVdyQixJQUE1RDtBQUNBcUMsY0FBQUEsT0FBTyxDQUFDQyxJQUFSLENBQWEsQ0FBYjtBQUNIO0FBQ0o7O0FBQ0QsY0FBSWpCLEtBQUosRUFBVTtBQUNORCxZQUFBQSxLQUFLLENBQUNDLElBQU4sR0FBYUEsS0FBYjtBQUNIO0FBQ0o7QUFDSixPQWhCRDtBQWlCQTRCLE1BQUFBLFNBQVMsVUFBVCxDQUFpQjVCLElBQUksQ0FBQ3JCLElBQXRCO0FBQ0FvRCxNQUFBQSxlQUFlLENBQUNULElBQWhCLENBQXFCdEIsSUFBckI7QUFDQTFCLE1BQUFBLFVBQVUsVUFBVixDQUFrQjBCLElBQUksQ0FBQ3JCLElBQXZCO0FBQ0FtRCxNQUFBQSxRQUFRLENBQUNqQyxHQUFULENBQWFHLElBQUksQ0FBQ3JCLElBQWxCLEVBQXdCcUIsSUFBeEI7QUFDSCxLQTlCRDs7QUErQkFYLElBQUFBLE9BQU8sQ0FBQ2tDLE9BQVIsQ0FBZ0JVLFdBQWhCO0FBQ0E1QyxJQUFBQSxPQUFPLEdBQUcwQyxlQUFWO0FBQ0gsR0F6SzZCLENBMktsQzs7O0FBRUksTUFBTU0sRUFBRSxHQUFHLElBQUlDLFdBQUosRUFBWDtBQUNBLE1BQU1DLEVBQUUsR0FBRyxJQUFJRCxXQUFKLEVBQVg7O0FBRUEsV0FBU0UsZ0JBQVQsQ0FBMEJ4QyxJQUExQixFQUF3Q3lDLE9BQXhDLEVBQWtFO0FBQzlELHFCQUFVekMsSUFBSSxDQUFDckIsSUFBZixTQUFzQjhELE9BQU8sQ0FBQzlELElBQTlCO0FBQ0g7O0FBRUQsV0FBUytELHFDQUFULENBQStDMUMsSUFBL0MsRUFBNkQ7QUFDekRBLElBQUFBLElBQUksQ0FBQ25CLE1BQUwsQ0FBWTBDLE9BQVosQ0FBb0IsVUFBQ2tCLE9BQUQsRUFBYTtBQUM3QkosTUFBQUEsRUFBRSxDQUFDTSxZQUFILDBCQUNHSCxnQkFBZ0IsQ0FBQ3hDLElBQUQsRUFBT3lDLE9BQVAsQ0FEbkIsNkJBRUVBLE9BQU8sQ0FBQzlELElBRlYsZUFFbUI4RCxPQUFPLENBQUN6QyxJQUFSLENBQWFyQixJQUZoQztBQU1ILEtBUEQ7QUFRSDs7QUFFRCxXQUFTaUUsb0JBQVQsQ0FBOEI1QyxJQUE5QixFQUE0QztBQUN4QyxRQUFJQSxJQUFJLENBQUNwQixRQUFMLEtBQWtCUCxjQUFjLENBQUNHLEtBQXJDLEVBQTRDO0FBQ3hDa0UsTUFBQUEscUNBQXFDLENBQUMxQyxJQUFELENBQXJDO0FBQ0FxQyxNQUFBQSxFQUFFLENBQUNRLE9BQUgsaUJBQW9CN0MsSUFBSSxDQUFDckIsSUFBekI7QUFDQXFCLE1BQUFBLElBQUksQ0FBQ25CLE1BQUwsQ0FBWTBDLE9BQVosQ0FBb0IsVUFBQWtCLE9BQU8sRUFBSTtBQUMzQkosUUFBQUEsRUFBRSxDQUFDUSxPQUFILGVBQWtCTCxnQkFBZ0IsQ0FBQ3hDLElBQUQsRUFBT3lDLE9BQVAsQ0FBbEM7QUFDSCxPQUZEO0FBR0FKLE1BQUFBLEVBQUUsQ0FBQ1EsT0FBSDtBQUNILEtBUEQsTUFPTztBQUNIUixNQUFBQSxFQUFFLENBQUNRLE9BQUgsZ0JBQW1CN0MsSUFBSSxDQUFDckIsSUFBeEI7QUFDQXFCLE1BQUFBLElBQUksQ0FBQ25CLE1BQUwsQ0FBWTBDLE9BQVosQ0FBb0IsVUFBQXhCLEtBQUssRUFBSTtBQUN6QixZQUFNK0MsZUFBZSxHQUNqQixJQUFJQyxNQUFKLENBQVdoRCxLQUFLLENBQUNPLFVBQWpCLElBQ0FQLEtBQUssQ0FBQ0MsSUFBTixDQUFXckIsSUFEWCxHQUVBLElBQUlvRSxNQUFKLENBQVdoRCxLQUFLLENBQUNPLFVBQWpCLENBSEo7QUFJQStCLFFBQUFBLEVBQUUsQ0FBQ1EsT0FBSCxhQUFnQjlDLEtBQUssQ0FBQ3BCLElBQXRCLGVBQStCbUUsZUFBL0I7QUFDSCxPQU5EO0FBT0FULE1BQUFBLEVBQUUsQ0FBQ1EsT0FBSDtBQUNIOztBQUNEUixJQUFBQSxFQUFFLENBQUNRLE9BQUg7QUFDSDs7QUFFRCxXQUFTRyxZQUFULENBQXNCckUsSUFBdEIsRUFBb0NzRSxLQUFwQyxFQUF3REMsSUFBeEQsRUFBMEU7QUFDdEUsUUFBSSxDQUFDRCxLQUFLLENBQUNmLEdBQU4sQ0FBVXZELElBQVYsQ0FBTCxFQUFzQjtBQUNsQnNFLE1BQUFBLEtBQUssQ0FBQ2QsR0FBTixDQUFVeEQsSUFBVjtBQUNBdUUsTUFBQUEsSUFBSTtBQUNQO0FBQ0o7O0FBRUQsV0FBU0MsMEJBQVQsQ0FBb0NuRCxJQUFwQyxFQUFrRG9ELE9BQWxELEVBQXdFO0FBQ3BFcEQsSUFBQUEsSUFBSSxDQUFDbkIsTUFBTCxDQUFZMEMsT0FBWixDQUFvQixVQUFDeEIsS0FBRCxFQUFXO0FBQzNCLFVBQUlzRCxZQUFZLEdBQUd0RCxLQUFLLENBQUNDLElBQU4sQ0FBV3JCLElBQTlCOztBQUQyQixpQ0FFbEIyRSxDQUZrQjtBQUd2QixZQUFNQyxVQUFVLGFBQU1GLFlBQU4sZ0JBQWhCO0FBQ0FMLFFBQUFBLFlBQVksQ0FBQ08sVUFBRCxFQUFhSCxPQUFiLEVBQXNCLFlBQU07QUFDcENmLFVBQUFBLEVBQUUsQ0FBQ1EsT0FBSCxpQkFBb0JVLFVBQXBCO0FBQ0EsV0FBQyxLQUFELEVBQVEsS0FBUixFQUFlaEMsT0FBZixDQUF1QixVQUFDaUMsRUFBRCxFQUFRO0FBQzNCbkIsWUFBQUEsRUFBRSxDQUFDUSxPQUFILGFBQWdCVyxFQUFoQixlQUF1QkgsWUFBdkI7QUFDSCxXQUZEO0FBR0FoQixVQUFBQSxFQUFFLENBQUNRLE9BQUgsQ0FBVyxHQUFYO0FBQ0FSLFVBQUFBLEVBQUUsQ0FBQ1EsT0FBSDtBQUVILFNBUlcsQ0FBWjtBQVNBUSxRQUFBQSxZQUFZLElBQUksT0FBaEI7QUFidUI7O0FBRTNCLFdBQUssSUFBSUMsQ0FBQyxHQUFHLENBQWIsRUFBZ0JBLENBQUMsR0FBR3ZELEtBQUssQ0FBQ08sVUFBMUIsRUFBc0NnRCxDQUFDLElBQUksQ0FBM0MsRUFBOEM7QUFBQSxjQUFyQ0EsQ0FBcUM7QUFZN0M7QUFDSixLQWZEO0FBZ0JIOztBQUVELFdBQVNHLFdBQVQsQ0FBcUJ6RCxJQUFyQixFQUFtQ29ELE9BQW5DLEVBQXlEO0FBQ3JELFFBQUlwRCxJQUFJLENBQUNuQixNQUFMLENBQVk2RSxNQUFaLEtBQXVCLENBQTNCLEVBQThCO0FBQzFCO0FBQ0g7O0FBQ0RQLElBQUFBLDBCQUEwQixDQUFDbkQsSUFBRCxFQUFPb0QsT0FBUCxDQUExQjtBQUNBZixJQUFBQSxFQUFFLENBQUNRLE9BQUgsaUJBQW9CN0MsSUFBSSxDQUFDckIsSUFBekI7QUFDQXFCLElBQUFBLElBQUksQ0FBQ25CLE1BQUwsQ0FBWTBDLE9BQVosQ0FBb0IsVUFBQ3hCLEtBQUQsRUFBVztBQUMzQixVQUFNK0MsZUFBZSxHQUFHL0MsS0FBSyxDQUFDQyxJQUFOLENBQVdyQixJQUFYLEdBQWtCLFFBQVFvRSxNQUFSLENBQWVoRCxLQUFLLENBQUNPLFVBQXJCLENBQTFDO0FBQ0ErQixNQUFBQSxFQUFFLENBQUNRLE9BQUgsYUFBZ0I5QyxLQUFLLENBQUNwQixJQUF0QixlQUErQm1FLGVBQS9CO0FBQ0gsS0FIRDtBQUlBVCxJQUFBQSxFQUFFLENBQUNRLE9BQUg7QUFDQVIsSUFBQUEsRUFBRSxDQUFDUSxPQUFIO0FBQ0g7O0FBRUQsV0FBU2Msc0JBQVQsQ0FBZ0NoRixJQUFoQyxFQUE4QztBQUMxQzBELElBQUFBLEVBQUUsQ0FBQ1EsT0FBSCxpQkFBb0JsRSxJQUFwQjtBQUNBLEtBQUMsSUFBRCxFQUFPLElBQVAsRUFBYSxJQUFiLEVBQW1CLElBQW5CLEVBQXlCLElBQXpCLEVBQStCLElBQS9CLEVBQXFDNEMsT0FBckMsQ0FBNkMsVUFBQ2lDLEVBQUQsRUFBUTtBQUNqRG5CLE1BQUFBLEVBQUUsQ0FBQ1EsT0FBSCxhQUFnQlcsRUFBaEIsZUFBdUI3RSxJQUF2QjtBQUNILEtBRkQ7QUFHQSxLQUFDLElBQUQsRUFBTyxPQUFQLEVBQWdCNEMsT0FBaEIsQ0FBd0IsVUFBQ2lDLEVBQUQsRUFBUTtBQUM1Qm5CLE1BQUFBLEVBQUUsQ0FBQ1EsT0FBSCxhQUFnQlcsRUFBaEIsZ0JBQXdCN0UsSUFBeEI7QUFDSCxLQUZEO0FBR0EwRCxJQUFBQSxFQUFFLENBQUNRLE9BQUgsQ0FBVyxHQUFYO0FBQ0FSLElBQUFBLEVBQUUsQ0FBQ1EsT0FBSDtBQUNIOztBQUVELFdBQVNlLFlBQVQsQ0FBc0JqQyxLQUF0QixFQUF1QztBQUNuQ1UsSUFBQUEsRUFBRSxDQUFDTSxZQUFIO0FBY0FoQixJQUFBQSxLQUFLLENBQUNKLE9BQU4sQ0FBYyxVQUFDdkIsSUFBRCxFQUFrQjtBQUM1QnFDLE1BQUFBLEVBQUUsQ0FBQ1EsT0FBSCxhQUFnQjdDLElBQUksQ0FBQ3FCLFVBQUwsSUFBbUIsRUFBbkMsc0JBQWlEckIsSUFBSSxDQUFDckIsSUFBdEQsNERBQTRHcUIsSUFBSSxDQUFDckIsSUFBakg7QUFDSCxLQUZEO0FBSUEwRCxJQUFBQSxFQUFFLENBQUNNLFlBQUg7QUFLSDs7QUFFRCxXQUFTa0Isa0JBQVQsQ0FBNEJsQyxLQUE1QixFQUE2QztBQUN6Q1UsSUFBQUEsRUFBRSxDQUFDUSxPQUFILENBQVcscUJBQVg7QUFDQWxCLElBQUFBLEtBQUssQ0FBQ0osT0FBTixDQUFjLFVBQUN2QixJQUFELEVBQVU7QUFDcEJxQyxNQUFBQSxFQUFFLENBQUNRLE9BQUgsYUFBZ0I3QyxJQUFJLENBQUNxQixVQUFMLElBQW1CLEVBQW5DLHNCQUFpRHJCLElBQUksQ0FBQ3JCLElBQXRELHNCQUFzRXFCLElBQUksQ0FBQ3JCLElBQTNFO0FBQ0gsS0FGRDtBQUdBMEQsSUFBQUEsRUFBRSxDQUFDUSxPQUFILENBQVcsR0FBWDtBQUNIOztBQUdELFdBQVNpQiwwQkFBVCxDQUFvQzlELElBQXBDLEVBQWtEK0QsT0FBbEQsRUFBd0U7QUFDcEUvRCxJQUFBQSxJQUFJLENBQUNuQixNQUFMLENBQVkwQyxPQUFaLENBQW9CLFVBQUN4QixLQUFELEVBQVc7QUFDM0IsVUFBSXNELFlBQVksR0FBR3RELEtBQUssQ0FBQ0MsSUFBTixDQUFXckIsSUFBOUI7O0FBRDJCLG1DQUVsQjJFLENBRmtCO0FBR3ZCLFlBQU1DLFVBQVUsYUFBTUYsWUFBTixVQUFoQjtBQUNBTCxRQUFBQSxZQUFZLENBQUNPLFVBQUQsRUFBYVEsT0FBYixFQUFzQixZQUFNO0FBQ3BDeEIsVUFBQUEsRUFBRSxDQUFDSSxZQUFILG1DQUNJWSxVQURKLHNCQUMwQkYsWUFEMUI7QUFHSCxTQUpXLENBQVo7QUFLQUEsUUFBQUEsWUFBWSxJQUFJLE9BQWhCO0FBVHVCOztBQUUzQixXQUFLLElBQUlDLENBQUMsR0FBRyxDQUFiLEVBQWdCQSxDQUFDLEdBQUd2RCxLQUFLLENBQUNPLFVBQTFCLEVBQXNDZ0QsQ0FBQyxJQUFJLENBQTNDLEVBQThDO0FBQUEsZUFBckNBLENBQXFDO0FBUTdDO0FBQ0osS0FYRDtBQVlIOztBQUVELFdBQVNVLGlCQUFULENBQTJCaEUsSUFBM0IsRUFBeUM7QUFDckN1QyxJQUFBQSxFQUFFLENBQUNJLFlBQUgsMkJBQ1EzQyxJQUFJLENBQUNyQixJQURiO0FBR0FxQixJQUFBQSxJQUFJLENBQUNuQixNQUFMLENBQVkwQyxPQUFaLENBQW9CLFVBQUN4QixLQUFELEVBQVc7QUFDM0IsVUFBSStDLGVBQXdCLEdBQUcsSUFBL0I7QUFDQSxVQUFNdEMsSUFBSSxHQUFHVCxLQUFLLENBQUNTLElBQW5COztBQUNBLFVBQUlBLElBQUosRUFBVTtBQUNOc0MsUUFBQUEsZUFBZSxpQkFBVS9DLEtBQUssQ0FBQ08sVUFBTixHQUFtQixDQUFuQixHQUF1QixPQUF2QixHQUFpQyxFQUEzQyxlQUFrREUsSUFBSSxDQUFDeUQsRUFBdkQsaUJBQWdFbEUsS0FBSyxDQUFDQyxJQUFOLENBQVdxQixVQUFYLElBQXlCLEVBQXpGLGdCQUFpR3RCLEtBQUssQ0FBQ0MsSUFBTixDQUFXckIsSUFBNUcsTUFBZjtBQUNILE9BRkQsTUFFTyxJQUFJb0IsS0FBSyxDQUFDTyxVQUFOLEdBQW1CLENBQXZCLEVBQTBCO0FBQzdCd0MsUUFBQUEsZUFBZSxHQUNYL0MsS0FBSyxDQUFDQyxJQUFOLENBQVdyQixJQUFYLEdBQ0EsUUFBUW9FLE1BQVIsQ0FBZWhELEtBQUssQ0FBQ08sVUFBckIsQ0FGSjtBQUdILE9BSk0sTUFJQSxJQUFJUCxLQUFLLENBQUNDLElBQU4sQ0FBV3BCLFFBQVgsS0FBd0JQLGNBQWMsQ0FBQ0UsTUFBM0MsRUFBbUQ7QUFDdEQsWUFBSXdCLEtBQUssQ0FBQ0MsSUFBTixLQUFlbEIsV0FBVyxDQUFDQyxNQUEvQixFQUF1QztBQUNuQytELFVBQUFBLGVBQWUsR0FBRyxVQUFsQjtBQUNILFNBRkQsTUFFTyxJQUFJL0MsS0FBSyxDQUFDQyxJQUFOLEtBQWVsQixXQUFXLENBQUNFLFFBQS9CLEVBQXlDO0FBQzVDOEQsVUFBQUEsZUFBZSxHQUFHLFVBQWxCO0FBQ0gsU0FGTSxNQUVBO0FBQ0hBLFVBQUFBLGVBQWUsR0FBRyxRQUFsQjtBQUNIO0FBQ0osT0FSTSxNQVFBLElBQUkvQyxLQUFLLENBQUNDLElBQU4sQ0FBV25CLE1BQVgsQ0FBa0I2RSxNQUFsQixHQUEyQixDQUEvQixFQUFrQztBQUNyQ1osUUFBQUEsZUFBZSxHQUFHL0MsS0FBSyxDQUFDQyxJQUFOLENBQVdyQixJQUE3QjtBQUNIOztBQUNELFVBQUltRSxlQUFKLEVBQXFCO0FBQ2pCUCxRQUFBQSxFQUFFLENBQUNNLE9BQUgsZUFBa0I5QyxLQUFLLENBQUNwQixJQUF4QixlQUFpQ21FLGVBQWpDO0FBQ0g7QUFDSixLQXZCRDtBQXdCQVAsSUFBQUEsRUFBRSxDQUFDSSxZQUFILHNCQUNHM0MsSUFBSSxDQUFDcUIsVUFBTCxHQUFrQixRQUFsQixHQUE2QixFQURoQztBQUlIOztBQUVELFdBQVM2QyxrQkFBVCxDQUE0QmxFLElBQTVCLEVBQTBDO0FBQ3RDdUMsSUFBQUEsRUFBRSxDQUFDSSxZQUFILDJCQUNRM0MsSUFBSSxDQUFDckIsSUFEYjtBQUlBcUIsSUFBQUEsSUFBSSxDQUFDbkIsTUFBTCxDQUFZMEMsT0FBWixDQUFvQixVQUFDa0IsT0FBRCxFQUFhO0FBQzdCRixNQUFBQSxFQUFFLENBQUNNLE9BQUgsd0JBQTJCSixPQUFPLENBQUM5RCxJQUFuQztBQUNBNEQsTUFBQUEsRUFBRSxDQUFDTSxPQUFILCtCQUFrQ0wsZ0JBQWdCLENBQUN4QyxJQUFELEVBQU95QyxPQUFQLENBQWxEO0FBQ0FGLE1BQUFBLEVBQUUsQ0FBQ00sT0FBSDtBQUNILEtBSkQ7QUFLQU4sSUFBQUEsRUFBRSxDQUFDSSxZQUFIO0FBTUg7O0FBRUQsV0FBU3dCLFdBQVQsQ0FBcUJuRSxJQUFyQixFQUFtQytELE9BQW5DLEVBQXlEO0FBQ3JELFFBQUkvRCxJQUFJLENBQUNuQixNQUFMLENBQVk2RSxNQUFaLEtBQXVCLENBQTNCLEVBQThCO0FBQzFCO0FBQ0g7O0FBQ0QsUUFBSTFELElBQUksQ0FBQ3BCLFFBQUwsS0FBa0JQLGNBQWMsQ0FBQ0csS0FBckMsRUFBNEMsQ0FDeEM7QUFDSDs7QUFDRHNGLElBQUFBLDBCQUEwQixDQUFDOUQsSUFBRCxFQUFPK0QsT0FBUCxDQUExQjtBQUNBQyxJQUFBQSxpQkFBaUIsQ0FBQ2hFLElBQUQsQ0FBakI7O0FBQ0EsUUFBSUEsSUFBSSxDQUFDcEIsUUFBTCxLQUFrQlAsY0FBYyxDQUFDRyxLQUFyQyxFQUE0QztBQUN4QzBGLE1BQUFBLGtCQUFrQixDQUFDbEUsSUFBRCxDQUFsQjtBQUNIO0FBR0o7QUFFRDs7Ozs7Ozs7O0FBT0EsV0FBU29FLG9CQUFULENBQThCcEUsSUFBOUIsRUFBNEM7QUFDeEMsUUFBTXFFLFVBQVUsR0FBR3JFLElBQUksQ0FBQ25CLE1BQUwsQ0FBWXlGLE1BQVosQ0FBbUIsVUFBQUMsQ0FBQztBQUFBLGFBQUksQ0FBQyxDQUFDQSxDQUFDLENBQUMvRCxJQUFSO0FBQUEsS0FBcEIsQ0FBbkI7QUFDQSxRQUFNZ0UsYUFBYSxHQUFHeEUsSUFBSSxDQUFDbkIsTUFBTCxDQUFZeUYsTUFBWixDQUFtQixVQUFDQyxDQUFEO0FBQUEsYUFBaUJBLENBQUMsQ0FBQ3ZFLElBQUYsS0FBV2xCLFdBQVcsQ0FBQ0MsTUFBeEIsSUFBb0N3RixDQUFDLENBQUN2RSxJQUFGLEtBQVdsQixXQUFXLENBQUNFLFFBQTNFO0FBQUEsS0FBbkIsQ0FBdEI7QUFDQSxRQUFNeUYsc0JBQXNCLEdBQUd6RSxJQUFJLENBQUNxQixVQUFMLElBQ3hCZ0QsVUFBVSxDQUFDWCxNQUFYLEdBQW9CLENBREksSUFFeEJjLGFBQWEsQ0FBQ2QsTUFBZCxHQUF1QixDQUY5Qjs7QUFHQSxRQUFJLENBQUNlLHNCQUFMLEVBQTZCO0FBQ3pCO0FBQ0g7O0FBQ0RsQyxJQUFBQSxFQUFFLENBQUNNLE9BQUgsbUJBQXNCN0MsSUFBSSxDQUFDckIsSUFBM0I7O0FBQ0EsUUFBSXFCLElBQUksQ0FBQ3FCLFVBQVQsRUFBcUI7QUFDakJrQixNQUFBQSxFQUFFLENBQUNNLE9BQUgsQ0FBVywwQkFBWDtBQUNBTixNQUFBQSxFQUFFLENBQUNNLE9BQUgsQ0FBVyxxQ0FBWDtBQUNBTixNQUFBQSxFQUFFLENBQUNNLE9BQUgsQ0FBVyxnQkFBWDtBQUNIOztBQUNEd0IsSUFBQUEsVUFBVSxDQUFDOUMsT0FBWCxDQUFtQixVQUFDeEIsS0FBRCxFQUFXO0FBQzFCLFVBQU0yRSxPQUFPLEdBQUcxRSxJQUFJLENBQUNuQixNQUFMLENBQVk4RixJQUFaLENBQWlCLFVBQUFKLENBQUM7QUFBQSxlQUFJQSxDQUFDLENBQUM1RixJQUFGLE1BQVlvQixLQUFLLENBQUNTLElBQU4sSUFBY1QsS0FBSyxDQUFDUyxJQUFOLENBQVd5RCxFQUFyQyxLQUE0QyxFQUFoRDtBQUFBLE9BQWxCLENBQWhCOztBQUNBLFVBQUksQ0FBQ1MsT0FBTCxFQUFjO0FBQ1YsY0FBTSwrQkFBTjtBQUNIOztBQUNELFVBQU1yRCxVQUFVLEdBQUd0QixLQUFLLENBQUNDLElBQU4sQ0FBV3FCLFVBQTlCOztBQUNBLFVBQUksQ0FBQ0EsVUFBTCxFQUFpQjtBQUNiLGNBQU0sa0NBQU47QUFDSDs7QUFDRGtCLE1BQUFBLEVBQUUsQ0FBQ00sT0FBSCx1QkFBMEI5QyxLQUFLLENBQUNwQixJQUFoQzs7QUFDQSxVQUFJb0IsS0FBSyxDQUFDTyxVQUFOLEtBQXFCLENBQXpCLEVBQTRCO0FBQ3hCaUMsUUFBQUEsRUFBRSxDQUFDTSxPQUFILHNEQUF5RHhCLFVBQXpELHNCQUErRXFELE9BQU8sQ0FBQy9GLElBQXZGO0FBQ0gsT0FGRCxNQUVPLElBQUlvQixLQUFLLENBQUNPLFVBQU4sS0FBcUIsQ0FBekIsRUFBNEI7QUFDL0JpQyxRQUFBQSxFQUFFLENBQUNNLE9BQUgsd0RBQTJEeEIsVUFBM0Qsc0JBQWlGcUQsT0FBTyxDQUFDL0YsSUFBekY7QUFDSCxPQUZNLE1BRUE7QUFDSCxjQUFNLDhDQUFOO0FBQ0g7O0FBQ0Q0RCxNQUFBQSxFQUFFLENBQUNNLE9BQUg7QUFDSCxLQWxCRDtBQW1CQTJCLElBQUFBLGFBQWEsQ0FBQ2pELE9BQWQsQ0FBc0IsVUFBQ3hCLEtBQUQsRUFBVztBQUM3QixVQUFNNkUsWUFBWSxHQUFHN0UsS0FBSyxDQUFDQyxJQUFOLEtBQWVsQixXQUFXLENBQUNDLE1BQTNCLEdBQW9DLENBQXBDLEdBQXdDLENBQTdEO0FBQ0F3RCxNQUFBQSxFQUFFLENBQUNNLE9BQUgsdUJBQTBCOUMsS0FBSyxDQUFDcEIsSUFBaEM7QUFDQTRELE1BQUFBLEVBQUUsQ0FBQ00sT0FBSCxpREFBb0QrQixZQUFwRCxzQkFBNEU3RSxLQUFLLENBQUNwQixJQUFsRjtBQUNBNEQsTUFBQUEsRUFBRSxDQUFDTSxPQUFIO0FBQ0gsS0FMRDtBQU1BTixJQUFBQSxFQUFFLENBQUNNLE9BQUg7QUFDSDs7QUFHRCxXQUFTZ0MsMEJBQVQsQ0FBb0M3RSxJQUFwQyxFQUFrRDtBQUM5QyxRQUFJQSxJQUFJLENBQUNwQixRQUFMLEtBQWtCUCxjQUFjLENBQUNHLEtBQXJDLEVBQTRDO0FBQ3hDK0QsTUFBQUEsRUFBRSxDQUFDTSxPQUFILG1CQUFzQjdDLElBQUksQ0FBQ3JCLElBQTNCLGVBQW9DcUIsSUFBSSxDQUFDckIsSUFBekM7QUFDSDtBQUNKOztBQUVELFdBQVNtRyxRQUFULENBQWtCbkQsS0FBbEIsRUFBbUM7QUFFL0I7QUFFQSxLQUFDLFFBQUQsRUFBVyxTQUFYLEVBQXNCLEtBQXRCLEVBQTZCLE9BQTdCLEVBQXNDSixPQUF0QyxDQUE4Q29DLHNCQUE5QztBQUNBaEMsSUFBQUEsS0FBSyxDQUFDSixPQUFOLENBQWMsVUFBQXZCLElBQUk7QUFBQSxhQUFJNEMsb0JBQW9CLENBQUM1QyxJQUFELENBQXhCO0FBQUEsS0FBbEI7QUFDQSxRQUFNK0UsY0FBYyxHQUFHLElBQUlsRCxHQUFKLEVBQXZCO0FBQ0FGLElBQUFBLEtBQUssQ0FBQ0osT0FBTixDQUFjLFVBQUF2QixJQUFJO0FBQUEsYUFBSXlELFdBQVcsQ0FBQ3pELElBQUQsRUFBTytFLGNBQVAsQ0FBZjtBQUFBLEtBQWxCO0FBRUEsUUFBTUMsV0FBVyxHQUFHckQsS0FBSyxDQUFDMkMsTUFBTixDQUFhLFVBQUF0QyxDQUFDO0FBQUEsYUFBSSxDQUFDLENBQUNBLENBQUMsQ0FBQ1gsVUFBUjtBQUFBLEtBQWQsQ0FBcEI7QUFDQXVDLElBQUFBLFlBQVksQ0FBQ29CLFdBQUQsQ0FBWjtBQUNBbkIsSUFBQUEsa0JBQWtCLENBQUNtQixXQUFELENBQWxCLENBWCtCLENBYS9COztBQUVBekMsSUFBQUEsRUFBRSxDQUFDSSxZQUFIO0FBR0EsUUFBTXNDLGNBQWMsR0FBRyxJQUFJcEQsR0FBSixFQUF2QjtBQUNBRixJQUFBQSxLQUFLLENBQUNKLE9BQU4sQ0FBYyxVQUFBdkIsSUFBSTtBQUFBLGFBQUltRSxXQUFXLENBQUNuRSxJQUFELEVBQU9pRixjQUFQLENBQWY7QUFBQSxLQUFsQjtBQUVBMUMsSUFBQUEsRUFBRSxDQUFDSSxZQUFIO0FBSUFoQixJQUFBQSxLQUFLLENBQUNKLE9BQU4sQ0FBYyxVQUFDdkIsSUFBRCxFQUFVO0FBQ3BCb0UsTUFBQUEsb0JBQW9CLENBQUNwRSxJQUFELENBQXBCO0FBQ0E2RSxNQUFBQSwwQkFBMEIsQ0FBQzdFLElBQUQsQ0FBMUI7QUFDSCxLQUhEO0FBSUF1QyxJQUFBQSxFQUFFLENBQUNNLE9BQUgsQ0FBVyxrQkFBWDtBQUNBbUMsSUFBQUEsV0FBVyxDQUFDekQsT0FBWixDQUFvQixVQUFDdkIsSUFBRCxFQUFVO0FBQzFCdUMsTUFBQUEsRUFBRSxDQUFDTSxPQUFILHVCQUEwQjdDLElBQUksQ0FBQ3FCLFVBQUwsSUFBbUIsRUFBN0MscUNBQTBFckIsSUFBSSxDQUFDcUIsVUFBTCxJQUFtQixFQUE3RixlQUFvR3JCLElBQUksQ0FBQ3JCLElBQXpHO0FBQ0gsS0FGRDtBQUdBNEQsSUFBQUEsRUFBRSxDQUFDTSxPQUFILENBQVcsdUNBQVg7QUFDQU4sSUFBQUEsRUFBRSxDQUFDTSxPQUFILENBQVcsWUFBWDtBQUNBTixJQUFBQSxFQUFFLENBQUNNLE9BQUgsQ0FBVyx5QkFBWDtBQUNBbUMsSUFBQUEsV0FBVyxDQUFDekQsT0FBWixDQUFvQixVQUFDdkIsSUFBRCxFQUFVO0FBQzFCdUMsTUFBQUEsRUFBRSxDQUFDTSxPQUFILHVCQUEwQjdDLElBQUksQ0FBQ3FCLFVBQUwsSUFBbUIsRUFBN0MsNENBQWlGckIsSUFBSSxDQUFDcUIsVUFBTCxJQUFtQixFQUFwRyxlQUEyR3JCLElBQUksQ0FBQ3JCLElBQWhIO0FBQ0gsS0FGRDtBQUdBNEQsSUFBQUEsRUFBRSxDQUFDSSxZQUFIO0FBTUFKLElBQUFBLEVBQUUsQ0FBQ0ksWUFBSDtBQUlBaEIsSUFBQUEsS0FBSyxDQUFDSixPQUFOLENBQWMsVUFBQXZCLElBQUk7QUFBQSxhQUFJdUMsRUFBRSxDQUFDTSxPQUFILGVBQWtCN0MsSUFBSSxDQUFDckIsSUFBdkIsT0FBSjtBQUFBLEtBQWxCO0FBQ0E0RCxJQUFBQSxFQUFFLENBQUNJLFlBQUg7QUFHSDs7QUFFRCxNQUFNdUMsTUFBTSxHQUFHLDBCQUFhOUYsU0FBYixDQUFmOztBQUVBLE1BQUk4RixNQUFNLFNBQVYsRUFBa0I7QUFDZHhELElBQUFBLFlBQVksQ0FBQ3dELE1BQU0sU0FBTixDQUFhdkQsS0FBZCxDQUFaO0FBQ0FtRCxJQUFBQSxRQUFRLENBQUN6RixPQUFELENBQVI7QUFDSDs7QUFwZjZCO0FBQUE7QUFBQTs7QUFBQTtBQXNmOUIseUJBQTRCRSxTQUFTLENBQUM0RixNQUFWLEVBQTVCLDhIQUFnRDtBQUFBLFVBQXJDQyxFQUFxQztBQUM1Q25GLE1BQUFBLE9BQU8sQ0FBQ0MsR0FBUix5QkFBNkJrRixFQUFDLENBQUN6RyxJQUEvQjtBQUNBc0IsTUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVltRixNQUFNLENBQUNDLE9BQVAsQ0FBZUYsRUFBQyxDQUFDRCxNQUFqQixFQUF5QkksR0FBekIsQ0FBNkIsZ0JBQW1CO0FBQUE7QUFBQSxZQUFqQjVHLElBQWlCO0FBQUEsWUFBWDZHLEtBQVc7O0FBQ3hELDZCQUFjN0csSUFBZCxlQUF3QjZHLEtBQXhCO0FBQ0gsT0FGVyxFQUVUaEYsSUFGUyxDQUVKLElBRkksQ0FBWjtBQUdBUCxNQUFBQSxPQUFPLENBQUNDLEdBQVI7QUFDSDtBQTVmNkI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUE4ZjlCLFNBQU87QUFDSG1DLElBQUFBLEVBQUUsRUFBRUEsRUFBRSxDQUFDb0QsU0FBSCxFQUREO0FBRUhsRCxJQUFBQSxFQUFFLEVBQUVBLEVBQUUsQ0FBQ2tELFNBQUg7QUFGRCxHQUFQO0FBSUg7O2VBRWN0RyxJIiwic291cmNlc0NvbnRlbnQiOlsiLy9AZmxvd1xuXG5pbXBvcnQgeyBtYWtlRmllbGRUeXBlTmFtZSwgV3JpdGVyIH0gZnJvbSAndG9uLWxhYnMtZGV2LW9wcy9kaXN0L3NyYy9nZW4uanMnO1xuaW1wb3J0IHR5cGUgeyBTY2hlbWFNZW1iZXIsIFNjaGVtYVR5cGUsIFR5cGVEZWYgfSBmcm9tICd0b24tbGFicy1kZXYtb3BzL3NyYy9zY2hlbWEuanMnO1xuaW1wb3J0IHsgcGFyc2VUeXBlRGVmIH0gZnJvbSAndG9uLWxhYnMtZGV2LW9wcy9kaXN0L3NyYy9zY2hlbWEuanMnO1xuXG5jb25zdCBEYlR5cGVDYXRlZ29yeSA9IHtcbiAgICB1bnJlc29sdmVkOiAndW5yZXNvbHZlZCcsXG4gICAgc2NhbGFyOiAnc2NhbGFyJyxcbiAgICB1bmlvbjogJ3VuaW9uJyxcbiAgICBzdHJ1Y3Q6ICdzdHJ1Y3QnLFxufTtcblxudHlwZSBEYkpvaW4gPSB7XG4gICAgY29sbGVjdGlvbjogc3RyaW5nLFxuICAgIG9uOiBzdHJpbmcsXG59XG5cbnR5cGUgRGJUeXBlID0ge1xuICAgIG5hbWU6IHN0cmluZyxcbiAgICBjYXRlZ29yeTogJEtleXM8dHlwZW9mIERiVHlwZUNhdGVnb3J5PixcbiAgICBjb2xsZWN0aW9uPzogc3RyaW5nLFxuICAgIGZpZWxkczogRGJGaWVsZFtdLFxufVxuXG50eXBlIERiRmllbGQgPSB7XG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGFycmF5RGVwdGg6IG51bWJlcixcbiAgICBqb2luPzogRGJKb2luLFxuICAgIHR5cGU6IERiVHlwZSxcbn1cblxuZnVuY3Rpb24gc2NhbGFyVHlwZShuYW1lOiBzdHJpbmcpOiBEYlR5cGUge1xuICAgIHJldHVybiB7XG4gICAgICAgIG5hbWUsXG4gICAgICAgIGNhdGVnb3J5OiBEYlR5cGVDYXRlZ29yeS5zY2FsYXIsXG4gICAgICAgIGZpZWxkczogW11cbiAgICB9XG59XG5cbmNvbnN0IHNjYWxhclR5cGVzID0ge1xuICAgIGludDogc2NhbGFyVHlwZSgnSW50JyksXG4gICAgdWludDY0OiBzY2FsYXJUeXBlKCdTdHJpbmcnKSxcbiAgICB1aW50MTAyNDogc2NhbGFyVHlwZSgnU3RyaW5nJyksXG4gICAgZmxvYXQ6IHNjYWxhclR5cGUoJ0Zsb2F0JyksXG4gICAgYm9vbGVhbjogc2NhbGFyVHlwZSgnQm9vbGVhbicpLFxuICAgIHN0cmluZzogc2NhbGFyVHlwZSgnU3RyaW5nJyksXG59O1xuXG5mdW5jdGlvbiB1bnJlc29sdmVkVHlwZShuYW1lOiBzdHJpbmcpOiBEYlR5cGUge1xuICAgIHJldHVybiB7XG4gICAgICAgIG5hbWUsXG4gICAgICAgIGNhdGVnb3J5OiBEYlR5cGVDYXRlZ29yeS51bnJlc29sdmVkLFxuICAgICAgICBmaWVsZHM6IFtdLFxuICAgIH1cbn1cblxudHlwZSBJbnRFbnVtRGVmID0ge1xuICAgIG5hbWU6IHN0cmluZyxcbiAgICB2YWx1ZXM6IHsgW3N0cmluZ106IG51bWJlciB9LFxufVxuXG5mdW5jdGlvbiBtYWluKHNjaGVtYURlZjogVHlwZURlZikge1xuXG4gICAgbGV0IGRiVHlwZXM6IERiVHlwZVtdID0gW107XG4gICAgbGV0IGxhc3RSZXBvcnRlZFR5cGU6IHN0cmluZyA9ICcnO1xuICAgIGxldCBlbnVtVHlwZXM6IE1hcDxzdHJpbmcsIEludEVudW1EZWY+ID0gbmV3IE1hcCgpO1xuXG4gICAgZnVuY3Rpb24gcmVwb3J0RW51bVR5cGUoc2NoZW1hVHlwZTogU2NoZW1hVHlwZSkge1xuICAgICAgICBpZiAoIShzY2hlbWFUeXBlLl8gJiYgc2NoZW1hVHlwZS5fLmVudW0pKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZW51bURlZjogSW50RW51bURlZiA9IHNjaGVtYVR5cGUuXy5lbnVtO1xuICAgICAgICBlbnVtVHlwZXMuc2V0KGVudW1EZWYubmFtZSwgZW51bURlZik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmVwb3J0VHlwZShuYW1lOiBzdHJpbmcsIGZpZWxkOiBzdHJpbmcsIHR5cGU6IHN0cmluZykge1xuICAgICAgICBpZiAobmFtZSAhPT0gbGFzdFJlcG9ydGVkVHlwZSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2cobmFtZSk7XG4gICAgICAgICAgICBsYXN0UmVwb3J0ZWRUeXBlID0gbmFtZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmxvZyhgICAgICR7ZmllbGR9OiAke3R5cGV9YCk7XG5cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZURiRmllbGQoXG4gICAgICAgIHR5cGVOYW1lOiBzdHJpbmcsXG4gICAgICAgIHNjaGVtYUZpZWxkOiBTY2hlbWFNZW1iZXI8U2NoZW1hVHlwZT4sXG4gICAgKTogRGJGaWVsZCB7XG4gICAgICAgIGxldCBzY2hlbWFUeXBlID0gc2NoZW1hRmllbGQ7XG4gICAgICAgIHJlcG9ydEVudW1UeXBlKHNjaGVtYVR5cGUpO1xuICAgICAgICBjb25zdCBmaWVsZDogRGJGaWVsZCA9IHtcbiAgICAgICAgICAgIG5hbWU6IHNjaGVtYUZpZWxkLm5hbWUsXG4gICAgICAgICAgICBhcnJheURlcHRoOiAwLFxuICAgICAgICAgICAgdHlwZTogc2NhbGFyVHlwZXMuc3RyaW5nLFxuICAgICAgICB9O1xuICAgICAgICB3aGlsZSAoc2NoZW1hVHlwZS5hcnJheSkge1xuICAgICAgICAgICAgZmllbGQuYXJyYXlEZXB0aCArPSAxO1xuICAgICAgICAgICAgc2NoZW1hVHlwZSA9IHNjaGVtYVR5cGUuYXJyYXk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgam9pbiA9IChzY2hlbWFUeXBlOiBhbnkpLl8uam9pbjtcbiAgICAgICAgaWYgKGpvaW4pIHtcbiAgICAgICAgICAgIGZpZWxkLmpvaW4gPSBqb2luO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzY2hlbWFUeXBlLnVuaW9uIHx8IHNjaGVtYVR5cGUuc3RydWN0KSB7XG4gICAgICAgICAgICBmaWVsZC50eXBlID0gdW5yZXNvbHZlZFR5cGUobWFrZUZpZWxkVHlwZU5hbWUodHlwZU5hbWUsIHNjaGVtYUZpZWxkLm5hbWUpKTtcbiAgICAgICAgfSBlbHNlIGlmIChzY2hlbWFUeXBlLnJlZikge1xuICAgICAgICAgICAgZmllbGQudHlwZSA9IHVucmVzb2x2ZWRUeXBlKHNjaGVtYVR5cGUucmVmLm5hbWUpO1xuICAgICAgICB9IGVsc2UgaWYgKHNjaGVtYVR5cGUuYm9vbCkge1xuICAgICAgICAgICAgZmllbGQudHlwZSA9IHNjYWxhclR5cGVzLmJvb2xlYW47XG4gICAgICAgIH0gZWxzZSBpZiAoc2NoZW1hVHlwZS5pbnQpIHtcbiAgICAgICAgICAgIGNvbnN0IHVuc2lnbmVkOiBib29sZWFuID0gKHNjaGVtYVR5cGUuaW50ICYmIHNjaGVtYVR5cGUuaW50LnVuc2lnbmVkKSB8fCBmYWxzZTtcbiAgICAgICAgICAgIGNvbnN0IHNpemU6IG51bWJlciA9IChzY2hlbWFUeXBlLmludCAmJiBzY2hlbWFUeXBlLmludC5zaXplKSB8fCAzMjtcbiAgICAgICAgICAgIGlmICh1bnNpZ25lZCkge1xuICAgICAgICAgICAgICAgIGlmIChzaXplID49IDEyOCkge1xuICAgICAgICAgICAgICAgICAgICByZXBvcnRUeXBlKHR5cGVOYW1lLCBmaWVsZC5uYW1lLCAndTEwMjQnKTtcbiAgICAgICAgICAgICAgICAgICAgZmllbGQudHlwZSA9IHNjYWxhclR5cGVzLnVpbnQxMDI0O1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc2l6ZSA+PSA2NCkge1xuICAgICAgICAgICAgICAgICAgICByZXBvcnRUeXBlKHR5cGVOYW1lLCBmaWVsZC5uYW1lLCAndTY0Jyk7XG4gICAgICAgICAgICAgICAgICAgIGZpZWxkLnR5cGUgPSBzY2FsYXJUeXBlcy51aW50NjQ7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzaXplID49IDMyKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcG9ydFR5cGUodHlwZU5hbWUsIGZpZWxkLm5hbWUsICd1MzInKTtcbiAgICAgICAgICAgICAgICAgICAgZmllbGQudHlwZSA9IHNjYWxhclR5cGVzLmZsb2F0O1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcG9ydFR5cGUodHlwZU5hbWUsIGZpZWxkLm5hbWUsIGB1JHtzaXplfWApO1xuICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlID0gc2NhbGFyVHlwZXMuaW50O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKHNpemUgPiAzMikge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludGVnZXIgdHlwZSB3aXRoIHNpemUgJHtzaXplfSBiaXQgZG9lcyBub3Qgc3VwcG9ydGVkYCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVwb3J0VHlwZSh0eXBlTmFtZSwgZmllbGQubmFtZSwgJ2kzMicpO1xuICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlID0gc2NhbGFyVHlwZXMuaW50O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChzY2hlbWFUeXBlLmZsb2F0KSB7XG4gICAgICAgICAgICByZXBvcnRUeXBlKHR5cGVOYW1lLCBmaWVsZC5uYW1lLCAnZmxvYXQnKTtcbiAgICAgICAgICAgIGZpZWxkLnR5cGUgPSBzY2FsYXJUeXBlcy5mbG9hdDtcbiAgICAgICAgfSBlbHNlIGlmIChzY2hlbWFUeXBlLnN0cmluZykge1xuICAgICAgICAgICAgZmllbGQudHlwZSA9IHNjYWxhclR5cGVzLnN0cmluZztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZpZWxkLnR5cGUgPSBzY2FsYXJUeXBlcy5zdHJpbmc7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnPj4+IEludmFsaWQgZmllbGQgdHlwZTogJywgSlNPTi5zdHJpbmdpZnkoc2NoZW1hVHlwZSkpO1xuICAgICAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmaWVsZDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB1bndyYXBBcnJheXModHlwZTogU2NoZW1hVHlwZSk6IFNjaGVtYVR5cGUge1xuICAgICAgICBpZiAodHlwZS5hcnJheSkge1xuICAgICAgICAgICAgcmV0dXJuIHVud3JhcEFycmF5cyh0eXBlLmFycmF5KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHlwZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZURiVHlwZShcbiAgICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgICBzY2hlbWFUeXBlOiBTY2hlbWFUeXBlXG4gICAgKSB7XG4gICAgICAgIGNvbnN0IHN0cnVjdCA9IHNjaGVtYVR5cGUudW5pb24gfHwgc2NoZW1hVHlwZS5zdHJ1Y3Q7XG4gICAgICAgIGlmICghc3RydWN0KSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnPj4+JywgYD8/ICR7bmFtZX06ICR7SlNPTi5zdHJpbmdpZnkoc2NoZW1hVHlwZSkuc3Vic3RyKDAsIDIwKX1gKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0eXBlOiBEYlR5cGUgPSB7XG4gICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgY2F0ZWdvcnk6IHNjaGVtYVR5cGUudW5pb24gPyBEYlR5cGVDYXRlZ29yeS51bmlvbiA6IERiVHlwZUNhdGVnb3J5LnN0cnVjdCxcbiAgICAgICAgICAgIGZpZWxkczogW10sXG4gICAgICAgICAgICBjb2xsZWN0aW9uOiAoc2NoZW1hVHlwZTogYW55KS5fLmNvbGxlY3Rpb24sXG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKHR5cGUuY29sbGVjdGlvbikge1xuICAgICAgICAgICAgdHlwZS5maWVsZHMucHVzaCh7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2lkJyxcbiAgICAgICAgICAgICAgICBhcnJheURlcHRoOiAwLFxuICAgICAgICAgICAgICAgIHR5cGU6IHNjYWxhclR5cGVzLnN0cmluZyxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHN0cnVjdC5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgdHlwZS5maWVsZHMucHVzaChwYXJzZURiRmllbGQobmFtZSwgZmllbGQpKTtcbiAgICAgICAgICAgIGNvbnN0IHVud3JhcHBlZCA9IHVud3JhcEFycmF5cyhmaWVsZCk7XG4gICAgICAgICAgICBjb25zdCBvd25UeXBlID0gKHVud3JhcHBlZC5zdHJ1Y3QgfHwgdW53cmFwcGVkLnVuaW9uKSA/IHVud3JhcHBlZCA6IG51bGw7XG4gICAgICAgICAgICBpZiAob3duVHlwZSkge1xuICAgICAgICAgICAgICAgIHBhcnNlRGJUeXBlKG1ha2VGaWVsZFR5cGVOYW1lKG5hbWUsIGZpZWxkLm5hbWUpLCBvd25UeXBlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGRiVHlwZXMucHVzaCh0eXBlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZURiVHlwZXModHlwZXM6IFNjaGVtYU1lbWJlcjxTY2hlbWFUeXBlPltdKSB7XG4gICAgICAgIHR5cGVzLmZvckVhY2goKHR5cGU6IFNjaGVtYU1lbWJlcjxTY2hlbWFUeXBlPikgPT4ge1xuICAgICAgICAgICAgcGFyc2VEYlR5cGUodHlwZS5uYW1lLCB0eXBlKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IHVucmVzb2x2ZWQ6IE1hcDxzdHJpbmcsIERiVHlwZT4gPSBuZXcgTWFwPHN0cmluZywgRGJUeXBlPigpO1xuICAgICAgICBjb25zdCByZXNvbHZpbmc6IFNldDxzdHJpbmc+ID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgICAgIGNvbnN0IHJlc29sdmVkOiBNYXA8c3RyaW5nLCBEYlR5cGU+ID0gbmV3IE1hcDxzdHJpbmcsIERiVHlwZT4oKTtcbiAgICAgICAgY29uc3Qgb3JkZXJlZFJlc29sdmVkOiBEYlR5cGVbXSA9IFtdO1xuICAgICAgICBkYlR5cGVzLmZvckVhY2godCA9PiB1bnJlc29sdmVkLnNldCh0Lm5hbWUsIHQpKTtcbiAgICAgICAgY29uc3QgcmVzb2x2ZVR5cGUgPSAodHlwZTogRGJUeXBlKSA9PiB7XG4gICAgICAgICAgICBpZiAocmVzb2x2ZWQuaGFzKHR5cGUubmFtZSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocmVzb2x2aW5nLmhhcyh0eXBlLm5hbWUpKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJz4+PicsIGBDaXJjdWxhciByZWZlcmVuY2UgdG8gdHlwZSAke3R5cGUubmFtZX1gKTtcbiAgICAgICAgICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXNvbHZpbmcuYWRkKHR5cGUubmFtZSk7XG4gICAgICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChmaWVsZC50eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS51bnJlc29sdmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCB0eXBlID0gcmVzb2x2ZWQuZ2V0KGZpZWxkLnR5cGUubmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghdHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSA9IHVucmVzb2x2ZWQuZ2V0KGZpZWxkLnR5cGUubmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmVUeXBlKHR5cGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnPj4+JywgYFJlZmVyZW5jZWQgdHlwZSBub3QgZm91bmQ6ICR7ZmllbGQudHlwZS5uYW1lfWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZmllbGQudHlwZSA9IHR5cGU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJlc29sdmluZy5kZWxldGUodHlwZS5uYW1lKTtcbiAgICAgICAgICAgIG9yZGVyZWRSZXNvbHZlZC5wdXNoKHR5cGUpO1xuICAgICAgICAgICAgdW5yZXNvbHZlZC5kZWxldGUodHlwZS5uYW1lKTtcbiAgICAgICAgICAgIHJlc29sdmVkLnNldCh0eXBlLm5hbWUsIHR5cGUpO1xuICAgICAgICB9O1xuICAgICAgICBkYlR5cGVzLmZvckVhY2gocmVzb2x2ZVR5cGUpO1xuICAgICAgICBkYlR5cGVzID0gb3JkZXJlZFJlc29sdmVkO1xuICAgIH1cblxuLy8gR2VuZXJhdG9yc1xuXG4gICAgY29uc3QgcWwgPSBuZXcgV3JpdGVyKCk7XG4gICAgY29uc3QganMgPSBuZXcgV3JpdGVyKCk7XG5cbiAgICBmdW5jdGlvbiB1bmlvblZhcmlhbnRUeXBlKHR5cGU6IERiVHlwZSwgdmFyaWFudDogRGJGaWVsZCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiBgJHt0eXBlLm5hbWV9JHt2YXJpYW50Lm5hbWV9VmFyaWFudGA7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuUUxUeXBlRGVjbGFyYXRpb25zRm9yVW5pb25WYXJpYW50cyh0eXBlOiBEYlR5cGUpIHtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgodmFyaWFudCkgPT4ge1xuICAgICAgICAgICAgcWwud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgdHlwZSAke3VuaW9uVmFyaWFudFR5cGUodHlwZSwgdmFyaWFudCl9IHtcbiAgICAgICAgICAgICR7dmFyaWFudC5uYW1lfTogJHt2YXJpYW50LnR5cGUubmFtZX1cbiAgICAgICAgfVxuXG4gICAgICAgIGApO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5RTFR5cGVEZWNsYXJhdGlvbih0eXBlOiBEYlR5cGUpIHtcbiAgICAgICAgaWYgKHR5cGUuY2F0ZWdvcnkgPT09IERiVHlwZUNhdGVnb3J5LnVuaW9uKSB7XG4gICAgICAgICAgICBnZW5RTFR5cGVEZWNsYXJhdGlvbnNGb3JVbmlvblZhcmlhbnRzKHR5cGUpO1xuICAgICAgICAgICAgcWwud3JpdGVMbihgdW5pb24gJHt0eXBlLm5hbWV9ID0gYCk7XG4gICAgICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKHZhcmlhbnQgPT4ge1xuICAgICAgICAgICAgICAgIHFsLndyaXRlTG4oYFxcdHwgJHt1bmlvblZhcmlhbnRUeXBlKHR5cGUsIHZhcmlhbnQpfWApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBxbC53cml0ZUxuKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGB0eXBlICR7dHlwZS5uYW1lfSB7YCk7XG4gICAgICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKGZpZWxkID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCB0eXBlRGVjbGFyYXRpb24gPVxuICAgICAgICAgICAgICAgICAgICAnWycucmVwZWF0KGZpZWxkLmFycmF5RGVwdGgpICtcbiAgICAgICAgICAgICAgICAgICAgZmllbGQudHlwZS5uYW1lICtcbiAgICAgICAgICAgICAgICAgICAgJ10nLnJlcGVhdChmaWVsZC5hcnJheURlcHRoKTtcbiAgICAgICAgICAgICAgICBxbC53cml0ZUxuKGBcXHQke2ZpZWxkLm5hbWV9OiAke3R5cGVEZWNsYXJhdGlvbn1gKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcWwud3JpdGVMbihgfWApO1xuICAgICAgICB9XG4gICAgICAgIHFsLndyaXRlTG4oKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwcmV2ZW50VHdpY2UobmFtZTogc3RyaW5nLCBuYW1lczogU2V0PHN0cmluZz4sIHdvcms6ICgpID0+IHZvaWQpIHtcbiAgICAgICAgaWYgKCFuYW1lcy5oYXMobmFtZSkpIHtcbiAgICAgICAgICAgIG5hbWVzLmFkZChuYW1lKTtcbiAgICAgICAgICAgIHdvcmsoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlblFMRmlsdGVyc0ZvckFycmF5RmllbGRzKHR5cGU6IERiVHlwZSwgcWxOYW1lczogU2V0PHN0cmluZz4pIHtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGxldCBpdGVtVHlwZU5hbWUgPSBmaWVsZC50eXBlLm5hbWU7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZpZWxkLmFycmF5RGVwdGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpbHRlck5hbWUgPSBgJHtpdGVtVHlwZU5hbWV9QXJyYXlGaWx0ZXJgO1xuICAgICAgICAgICAgICAgIHByZXZlbnRUd2ljZShmaWx0ZXJOYW1lLCBxbE5hbWVzLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHFsLndyaXRlTG4oYGlucHV0ICR7ZmlsdGVyTmFtZX0ge2ApO1xuICAgICAgICAgICAgICAgICAgICBbJ2FueScsICdhbGwnXS5mb3JFYWNoKChvcCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0JHtvcH06ICR7aXRlbVR5cGVOYW1lfUZpbHRlcmApO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgcWwud3JpdGVMbignfScpO1xuICAgICAgICAgICAgICAgICAgICBxbC53cml0ZUxuKCk7XG5cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBpdGVtVHlwZU5hbWUgKz0gJ0FycmF5JztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuUUxGaWx0ZXIodHlwZTogRGJUeXBlLCBxbE5hbWVzOiBTZXQ8c3RyaW5nPikge1xuICAgICAgICBpZiAodHlwZS5maWVsZHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgZ2VuUUxGaWx0ZXJzRm9yQXJyYXlGaWVsZHModHlwZSwgcWxOYW1lcyk7XG4gICAgICAgIHFsLndyaXRlTG4oYGlucHV0ICR7dHlwZS5uYW1lfUZpbHRlciB7YCk7XG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBjb25zdCB0eXBlRGVjbGFyYXRpb24gPSBmaWVsZC50eXBlLm5hbWUgKyBcIkFycmF5XCIucmVwZWF0KGZpZWxkLmFycmF5RGVwdGgpO1xuICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0JHtmaWVsZC5uYW1lfTogJHt0eXBlRGVjbGFyYXRpb259RmlsdGVyYCk7XG4gICAgICAgIH0pO1xuICAgICAgICBxbC53cml0ZUxuKGB9YCk7XG4gICAgICAgIHFsLndyaXRlTG4oKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5RTFNjYWxhclR5cGVzRmlsdGVyKG5hbWU6IHN0cmluZykge1xuICAgICAgICBxbC53cml0ZUxuKGBpbnB1dCAke25hbWV9RmlsdGVyIHtgKTtcbiAgICAgICAgWydlcScsICduZScsICdndCcsICdsdCcsICdnZScsICdsZSddLmZvckVhY2goKG9wKSA9PiB7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGBcXHQke29wfTogJHtuYW1lfWApO1xuICAgICAgICB9KTtcbiAgICAgICAgWydpbicsICdub3RJbiddLmZvckVhY2goKG9wKSA9PiB7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGBcXHQke29wfTogWyR7bmFtZX1dYCk7XG4gICAgICAgIH0pO1xuICAgICAgICBxbC53cml0ZUxuKCd9Jyk7XG4gICAgICAgIHFsLndyaXRlTG4oKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5RTFF1ZXJpZXModHlwZXM6IERiVHlwZVtdKSB7XG4gICAgICAgIHFsLndyaXRlQmxvY2tMbihgXG4gICAgICAgIGVudW0gUXVlcnlPcmRlckJ5RGlyZWN0aW9uIHtcbiAgICAgICAgICAgIEFTQ1xuICAgICAgICAgICAgREVTQ1xuICAgICAgICB9XG5cbiAgICAgICAgaW5wdXQgUXVlcnlPcmRlckJ5IHtcbiAgICAgICAgICAgIHBhdGg6IFN0cmluZ1xuICAgICAgICAgICAgZGlyZWN0aW9uOiBRdWVyeU9yZGVyQnlEaXJlY3Rpb25cbiAgICAgICAgfVxuXG4gICAgICAgIHR5cGUgUXVlcnkge1xuICAgICAgICBgKTtcblxuICAgICAgICB0eXBlcy5mb3JFYWNoKCh0eXBlOiBEYlR5cGUpID0+IHtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oYFxcdCR7dHlwZS5jb2xsZWN0aW9uIHx8ICcnfShmaWx0ZXI6ICR7dHlwZS5uYW1lfUZpbHRlciwgb3JkZXJCeTogW1F1ZXJ5T3JkZXJCeV0sIGxpbWl0OiBJbnQpOiBbJHt0eXBlLm5hbWV9XWApO1xuICAgICAgICB9KTtcblxuICAgICAgICBxbC53cml0ZUJsb2NrTG4oYFxuICAgICAgICAgICAgc2VsZWN0KHF1ZXJ5OiBTdHJpbmchLCBiaW5kVmFyc0pzb246IFN0cmluZyEpOiBTdHJpbmchXG4gICAgICAgIH1cblxuICAgICAgICBgKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5RTFN1YnNjcmlwdGlvbnModHlwZXM6IERiVHlwZVtdKSB7XG4gICAgICAgIHFsLndyaXRlTG4oJ3R5cGUgU3Vic2NyaXB0aW9uIHsnKTtcbiAgICAgICAgdHlwZXMuZm9yRWFjaCgodHlwZSkgPT4ge1xuICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0JHt0eXBlLmNvbGxlY3Rpb24gfHwgJyd9KGZpbHRlcjogJHt0eXBlLm5hbWV9RmlsdGVyKTogJHt0eXBlLm5hbWV9YCk7XG4gICAgICAgIH0pO1xuICAgICAgICBxbC53cml0ZUxuKCd9Jyk7XG4gICAgfVxuXG5cbiAgICBmdW5jdGlvbiBnZW5KU0ZpbHRlcnNGb3JBcnJheUZpZWxkcyh0eXBlOiBEYlR5cGUsIGpzTmFtZXM6IFNldDxzdHJpbmc+KSB7XG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBsZXQgaXRlbVR5cGVOYW1lID0gZmllbGQudHlwZS5uYW1lO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmaWVsZC5hcnJheURlcHRoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWx0ZXJOYW1lID0gYCR7aXRlbVR5cGVOYW1lfUFycmF5YDtcbiAgICAgICAgICAgICAgICBwcmV2ZW50VHdpY2UoZmlsdGVyTmFtZSwganNOYW1lcywgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICAgICAgICAgIGNvbnN0ICR7ZmlsdGVyTmFtZX0gPSBhcnJheSgke2l0ZW1UeXBlTmFtZX0pO1xuICAgICAgICAgICAgICAgIGApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGl0ZW1UeXBlTmFtZSArPSAnQXJyYXknO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5KU1N0cnVjdEZpbHRlcih0eXBlOiBEYlR5cGUpIHtcbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgY29uc3QgJHt0eXBlLm5hbWV9ID0gc3RydWN0KHtcbiAgICBgKTtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGxldCB0eXBlRGVjbGFyYXRpb246ID9zdHJpbmcgPSBudWxsO1xuICAgICAgICAgICAgY29uc3Qgam9pbiA9IGZpZWxkLmpvaW47XG4gICAgICAgICAgICBpZiAoam9pbikge1xuICAgICAgICAgICAgICAgIHR5cGVEZWNsYXJhdGlvbiA9IGBqb2luJHtmaWVsZC5hcnJheURlcHRoID4gMCA/ICdBcnJheScgOiAnJ30oJyR7am9pbi5vbn0nLCAnJHtmaWVsZC50eXBlLmNvbGxlY3Rpb24gfHwgJyd9JywgJHtmaWVsZC50eXBlLm5hbWV9KWA7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLmFycmF5RGVwdGggPiAwKSB7XG4gICAgICAgICAgICAgICAgdHlwZURlY2xhcmF0aW9uID1cbiAgICAgICAgICAgICAgICAgICAgZmllbGQudHlwZS5uYW1lICtcbiAgICAgICAgICAgICAgICAgICAgJ0FycmF5Jy5yZXBlYXQoZmllbGQuYXJyYXlEZXB0aCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLnR5cGUuY2F0ZWdvcnkgPT09IERiVHlwZUNhdGVnb3J5LnNjYWxhcikge1xuICAgICAgICAgICAgICAgIGlmIChmaWVsZC50eXBlID09PSBzY2FsYXJUeXBlcy51aW50NjQpIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZURlY2xhcmF0aW9uID0gJ2JpZ1VJbnQxJztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLnVpbnQxMDI0KSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGVEZWNsYXJhdGlvbiA9ICdiaWdVSW50Mic7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZURlY2xhcmF0aW9uID0gJ3NjYWxhcic7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC50eXBlLmZpZWxkcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgdHlwZURlY2xhcmF0aW9uID0gZmllbGQudHlwZS5uYW1lO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHR5cGVEZWNsYXJhdGlvbikge1xuICAgICAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAke2ZpZWxkLm5hbWV9OiAke3R5cGVEZWNsYXJhdGlvbn0sYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICB9JHt0eXBlLmNvbGxlY3Rpb24gPyAnLCB0cnVlJyA6ICcnfSk7XG5cbiAgICBgKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5KU1VuaW9uUmVzb2x2ZXIodHlwZTogRGJUeXBlKSB7XG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIGNvbnN0ICR7dHlwZS5uYW1lfVJlc29sdmVyID0ge1xuICAgICAgICAgICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgYCk7XG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKHZhcmlhbnQpID0+IHtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgaWYgKCcke3ZhcmlhbnQubmFtZX0nIGluIG9iaikge2ApO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgcmV0dXJuICcke3VuaW9uVmFyaWFudFR5cGUodHlwZSwgdmFyaWFudCl9JztgKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgfWApO1xuICAgICAgICB9KTtcbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBgKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5KU0ZpbHRlcih0eXBlOiBEYlR5cGUsIGpzTmFtZXM6IFNldDxzdHJpbmc+KSB7XG4gICAgICAgIGlmICh0eXBlLmZpZWxkcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZS5jYXRlZ29yeSA9PT0gRGJUeXBlQ2F0ZWdvcnkudW5pb24pIHtcbiAgICAgICAgICAgIC8vIGdlbkpTRmlsdGVyc0ZvclVuaW9uVmFyaWFudHModHlwZSwganNOYW1lcyk7XG4gICAgICAgIH1cbiAgICAgICAgZ2VuSlNGaWx0ZXJzRm9yQXJyYXlGaWVsZHModHlwZSwganNOYW1lcyk7XG4gICAgICAgIGdlbkpTU3RydWN0RmlsdGVyKHR5cGUpO1xuICAgICAgICBpZiAodHlwZS5jYXRlZ29yeSA9PT0gRGJUeXBlQ2F0ZWdvcnkudW5pb24pIHtcbiAgICAgICAgICAgIGdlbkpTVW5pb25SZXNvbHZlcih0eXBlKTtcbiAgICAgICAgfVxuXG5cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZW5lcmF0ZSBjdXN0b20gcmVzb2x2ZXJzIGZvciB0eXBlcyB3aXRoOlxuICAgICAqIC0gaWQgZmllbGRcbiAgICAgKiAtIGpvaW4gZmllbGRzXG4gICAgICogLSB1NjQgYW5kIGhpZ2hlciBmaWVsZHNcbiAgICAgKiBAcGFyYW0gdHlwZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGdlbkpTQ3VzdG9tUmVzb2x2ZXJzKHR5cGU6IERiVHlwZSkge1xuICAgICAgICBjb25zdCBqb2luRmllbGRzID0gdHlwZS5maWVsZHMuZmlsdGVyKHggPT4gISF4LmpvaW4pO1xuICAgICAgICBjb25zdCBiaWdVSW50RmllbGRzID0gdHlwZS5maWVsZHMuZmlsdGVyKCh4OiBEYkZpZWxkKSA9PiAoeC50eXBlID09PSBzY2FsYXJUeXBlcy51aW50NjQpIHx8ICh4LnR5cGUgPT09IHNjYWxhclR5cGVzLnVpbnQxMDI0KSk7XG4gICAgICAgIGNvbnN0IGN1c3RvbVJlc29sdmVyUmVxdWlyZWQgPSB0eXBlLmNvbGxlY3Rpb25cbiAgICAgICAgICAgIHx8IGpvaW5GaWVsZHMubGVuZ3RoID4gMFxuICAgICAgICAgICAgfHwgYmlnVUludEZpZWxkcy5sZW5ndGggPiAwO1xuICAgICAgICBpZiAoIWN1c3RvbVJlc29sdmVyUmVxdWlyZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICR7dHlwZS5uYW1lfToge2ApO1xuICAgICAgICBpZiAodHlwZS5jb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICBqcy53cml0ZUxuKCcgICAgICAgICAgICBpZChwYXJlbnQpIHsnKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oJyAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7Jyk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKCcgICAgICAgICAgICB9LCcpO1xuICAgICAgICB9XG4gICAgICAgIGpvaW5GaWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG9uRmllbGQgPSB0eXBlLmZpZWxkcy5maW5kKHggPT4geC5uYW1lID09PSAoZmllbGQuam9pbiAmJiBmaWVsZC5qb2luLm9uKSB8fCAnJyk7XG4gICAgICAgICAgICBpZiAoIW9uRmllbGQpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyAnSm9pbiBvbiBmaWVsZCBkb2VzIG5vdCBleGlzdC4nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgY29sbGVjdGlvbiA9IGZpZWxkLnR5cGUuY29sbGVjdGlvbjtcbiAgICAgICAgICAgIGlmICghY29sbGVjdGlvbikge1xuICAgICAgICAgICAgICAgIHRocm93ICdKb2luZWQgdHlwZSBpcyBub3QgYSBjb2xsZWN0aW9uLic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAke2ZpZWxkLm5hbWV9KHBhcmVudCkge2ApO1xuICAgICAgICAgICAgaWYgKGZpZWxkLmFycmF5RGVwdGggPT09IDApIHtcbiAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAgICAgcmV0dXJuIGRiLmZldGNoRG9jQnlLZXkoZGIuJHtjb2xsZWN0aW9ufSwgcGFyZW50LiR7b25GaWVsZC5uYW1lfSk7YCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLmFycmF5RGVwdGggPT09IDEpIHtcbiAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAgICAgcmV0dXJuIGRiLmZldGNoRG9jc0J5S2V5cyhkYi4ke2NvbGxlY3Rpb259LCBwYXJlbnQuJHtvbkZpZWxkLm5hbWV9KTtgKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgJ0pvaW5zIG9uIGEgbmVzdGVkIGFycmF5cyBkb2VzIG5vdCBzdXBwb3J0ZWQuJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgIH0sYCk7XG4gICAgICAgIH0pO1xuICAgICAgICBiaWdVSW50RmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwcmVmaXhMZW5ndGggPSBmaWVsZC50eXBlID09PSBzY2FsYXJUeXBlcy51aW50NjQgPyAxIDogMjtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICR7ZmllbGQubmFtZX0ocGFyZW50KSB7YCk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KCR7cHJlZml4TGVuZ3RofSwgcGFyZW50LiR7ZmllbGQubmFtZX0pO2ApO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgfSxgKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgfSxgKTtcbiAgICB9XG5cblxuICAgIGZ1bmN0aW9uIGdlbkpTVHlwZVJlc29sdmVyc0ZvclVuaW9uKHR5cGU6IERiVHlwZSkge1xuICAgICAgICBpZiAodHlwZS5jYXRlZ29yeSA9PT0gRGJUeXBlQ2F0ZWdvcnkudW5pb24pIHtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgJHt0eXBlLm5hbWV9OiAke3R5cGUubmFtZX1SZXNvbHZlcixgKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbmVyYXRlKHR5cGVzOiBEYlR5cGVbXSkge1xuXG4gICAgICAgIC8vIFFMXG5cbiAgICAgICAgWydTdHJpbmcnLCAnQm9vbGVhbicsICdJbnQnLCAnRmxvYXQnXS5mb3JFYWNoKGdlblFMU2NhbGFyVHlwZXNGaWx0ZXIpO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKHR5cGUgPT4gZ2VuUUxUeXBlRGVjbGFyYXRpb24odHlwZSkpO1xuICAgICAgICBjb25zdCBxbEFycmF5RmlsdGVycyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKHR5cGUgPT4gZ2VuUUxGaWx0ZXIodHlwZSwgcWxBcnJheUZpbHRlcnMpKTtcblxuICAgICAgICBjb25zdCBjb2xsZWN0aW9ucyA9IHR5cGVzLmZpbHRlcih0ID0+ICEhdC5jb2xsZWN0aW9uKTtcbiAgICAgICAgZ2VuUUxRdWVyaWVzKGNvbGxlY3Rpb25zKTtcbiAgICAgICAgZ2VuUUxTdWJzY3JpcHRpb25zKGNvbGxlY3Rpb25zKTtcblxuICAgICAgICAvLyBKU1xuXG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIGNvbnN0IHsgc2NhbGFyLCBiaWdVSW50MSwgYmlnVUludDIsIHJlc29sdmVCaWdVSW50LCBzdHJ1Y3QsIGFycmF5LCBqb2luLCBqb2luQXJyYXkgfSA9IHJlcXVpcmUoJy4vYXJhbmdvLXR5cGVzLmpzJyk7XG4gICAgICAgIGApO1xuICAgICAgICBjb25zdCBqc0FycmF5RmlsdGVycyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKHR5cGUgPT4gZ2VuSlNGaWx0ZXIodHlwZSwganNBcnJheUZpbHRlcnMpKTtcblxuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBmdW5jdGlvbiBjcmVhdGVSZXNvbHZlcnMoZGIpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgIGApO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgICAgICAgICBnZW5KU0N1c3RvbVJlc29sdmVycyh0eXBlKTtcbiAgICAgICAgICAgIGdlbkpTVHlwZVJlc29sdmVyc0ZvclVuaW9uKHR5cGUpO1xuICAgICAgICB9KTtcbiAgICAgICAganMud3JpdGVMbignICAgICAgICBRdWVyeTogeycpO1xuICAgICAgICBjb2xsZWN0aW9ucy5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAke3R5cGUuY29sbGVjdGlvbiB8fCAnJ306IGRiLmNvbGxlY3Rpb25RdWVyeShkYi4ke3R5cGUuY29sbGVjdGlvbiB8fCAnJ30sICR7dHlwZS5uYW1lfSksYClcbiAgICAgICAgfSk7XG4gICAgICAgIGpzLndyaXRlTG4oJyAgICAgICAgICAgIHNlbGVjdDogZGIuc2VsZWN0UXVlcnkoKSwnKTtcbiAgICAgICAganMud3JpdGVMbignICAgICAgICB9LCcpO1xuICAgICAgICBqcy53cml0ZUxuKCcgICAgICAgIFN1YnNjcmlwdGlvbjogeycpO1xuICAgICAgICBjb2xsZWN0aW9ucy5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAke3R5cGUuY29sbGVjdGlvbiB8fCAnJ306IGRiLmNvbGxlY3Rpb25TdWJzY3JpcHRpb24oZGIuJHt0eXBlLmNvbGxlY3Rpb24gfHwgJyd9LCAke3R5cGUubmFtZX0pLGApXG4gICAgICAgIH0pO1xuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBgKTtcblxuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAgICAgICAgIGNyZWF0ZVJlc29sdmVycyxcbiAgICAgICAgYCk7XG4gICAgICAgIHR5cGVzLmZvckVhY2godHlwZSA9PiBqcy53cml0ZUxuKGAgICAgJHt0eXBlLm5hbWV9LGApKTtcbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgfTtcbiAgICAgICAgYCk7XG4gICAgfVxuXG4gICAgY29uc3Qgc2NoZW1hID0gcGFyc2VUeXBlRGVmKHNjaGVtYURlZik7XG5cbiAgICBpZiAoc2NoZW1hLmNsYXNzKSB7XG4gICAgICAgIHBhcnNlRGJUeXBlcyhzY2hlbWEuY2xhc3MudHlwZXMpO1xuICAgICAgICBnZW5lcmF0ZShkYlR5cGVzKTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IGU6IEludEVudW1EZWYgb2YgZW51bVR5cGVzLnZhbHVlcygpKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBleHBvcnQgY29uc3QgUSR7ZS5uYW1lfSA9IHtgKTtcbiAgICAgICAgY29uc29sZS5sb2coT2JqZWN0LmVudHJpZXMoZS52YWx1ZXMpLm1hcCgoW25hbWUsIHZhbHVlXSkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGAgICAgJHtuYW1lfTogJHsodmFsdWU6IGFueSl9LGA7XG4gICAgICAgIH0pLmpvaW4oJ1xcbicpKTtcbiAgICAgICAgY29uc29sZS5sb2coYH07XFxuYCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcWw6IHFsLmdlbmVyYXRlZCgpLFxuICAgICAgICBqczoganMuZ2VuZXJhdGVkKCksXG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBtYWluO1xuIl19