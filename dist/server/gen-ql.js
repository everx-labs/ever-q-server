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

function isLowerCased(s) {
  var l = s.toLowerCase();
  var u = s.toUpperCase();
  return u !== l && s === l;
}

function isUpperCased(s) {
  var l = s.toLowerCase();
  var u = s.toUpperCase();
  return u !== l && s === u;
}

function toAllCaps(s) {
  var result = '';

  for (var i = 0; i < s.length; i += 1) {
    if (i > 0 && s[i - 1] !== '_' && isLowerCased(s[i - 1]) && isUpperCased(s[i])) {
      result += '_';
    }

    result += s[i];
  }

  return result.toUpperCase();
}

function toEnumStyle(s) {
  return "".concat(s.substr(0, 1).toUpperCase()).concat(s.substr(1));
}

function stringifyEnumValues(values) {
  var fields = Object.entries(values).map(function (_ref) {
    var _ref2 = (0, _slicedToArray2["default"])(_ref, 2),
        name = _ref2[0],
        value = _ref2[1];

    return "".concat(toEnumStyle(name), ": ").concat(value);
  });
  return "{ ".concat(fields.join(', '), " }");
}

function main(schemaDef) {
  var dbTypes = [];
  var lastReportedType = '';
  var enumTypes = new Map();

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

    var enumDef = schemaType._ && schemaType._["enum"] || null;

    if (enumDef) {
      field.enumDef = enumDef;
      enumTypes.set(enumDef.name, enumDef);
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
      console.log('>>>', "?? ".concat(name, ": ").concat(JSON.stringify(schemaType).substr(0, 200)));
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

  function genQLEnumTypes() {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = enumTypes.values()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var _enumDef = _step.value;
        ql.writeLn("enum ".concat(_enumDef.name, "Enum {"));
        Object.keys(_enumDef.values).forEach(function (name) {
          ql.writeLn("    ".concat(toEnumStyle(name)));
        });
        ql.writeLn("}");
        ql.writeLn();
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
        var enumDef = field.enumDef;

        if (enumDef) {
          ql.writeLn("\t".concat(field.name, "_name: ").concat(enumDef.name, "Enum"));
        }
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

  function genQLFiltersForEnumNameFields(type, qlNames) {
    type.fields.forEach(function (field) {
      var enumDef = field.enumDef;

      if (enumDef) {
        preventTwice("".concat(enumDef.name, "EnumFilter"), qlNames, function () {
          genQLScalarTypesFilter("".concat(enumDef.name, "Enum"));
        });
      }
    });
  }

  function genQLFilter(type, qlNames) {
    if (type.fields.length === 0) {
      return;
    }

    genQLFiltersForArrayFields(type, qlNames);
    genQLFiltersForEnumNameFields(type, qlNames);
    ql.writeLn("input ".concat(type.name, "Filter {"));
    type.fields.forEach(function (field) {
      var typeDeclaration = field.type.name + "Array".repeat(field.arrayDepth);
      ql.writeLn("\t".concat(field.name, ": ").concat(typeDeclaration, "Filter"));
      var enumDef = field.enumDef;

      if (enumDef) {
        ql.writeLn("\t".concat(field.name, "_name: ").concat(enumDef.name, "EnumFilter"));
      }
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
    ql.writeBlockLn("\n        enum QueryOrderByDirection {\n            ASC\n            DESC\n        }\n\n        input QueryOrderBy {\n            path: String\n            direction: QueryOrderByDirection\n        }\n\n        type Info {\n            version: String\n        }\n        \n        type Query {\n            info: Info\n        ");
    types.forEach(function (type) {
      ql.writeLn("\t".concat(type.collection || '', "(filter: ").concat(type.name, "Filter, orderBy: [QueryOrderBy], limit: Int): [").concat(type.name, "]"));
    });
    ql.writeBlockLn("\n        }\n\n        ");
  }

  function genQLSubscriptions(types) {
    ql.writeLn('type Subscription {');
    types.forEach(function (type) {
      ql.writeLn("\t".concat(type.collection || '', "(filter: ").concat(type.name, "Filter): ").concat(type.name));
    });
    ql.writeLn('}');
  }

  function genQLMutation() {
    ql.writeBlockLn("\n        \n        input Request {\n            id: String\n            body: String\n        }\n        \n        type Mutation {\n            postRequests(requests: [Request]): [String]\n        }\n        ");
  }

  function getScalarResolverName(field) {
    if (field.type === scalarTypes.uint64) {
      return 'bigUInt1';
    }

    if (field.type === scalarTypes.uint1024) {
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
          var itemResolverName = i === 0 && field.type.category === DbTypeCategory.scalar ? getScalarResolverName(field) : itemTypeName;
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
        typeDeclaration = getScalarResolverName(field);
      } else if (field.type.fields.length > 0) {
        typeDeclaration = field.type.name;
      }

      if (typeDeclaration) {
        js.writeLn("    ".concat(field.name, ": ").concat(typeDeclaration, ","));
        var enumDef = field.enumDef;

        if (enumDef) {
          js.writeLn("    ".concat(field.name, "_name: enumName('").concat(field.name, "', ").concat(stringifyEnumValues(enumDef.values), "),"));
        }
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
    var enumFields = type.fields.filter(function (x) {
      return x.enumDef;
    });
    var customResolverRequired = type.collection || joinFields.length > 0 || bigUIntFields.length > 0 || enumFields.length > 0;

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
    enumFields.forEach(function (field) {
      var enumDef = field.enumDef;

      if (enumDef) {
        js.writeLn("            ".concat(field.name, "_name: createEnumNameResolver('").concat(field.name, "', ").concat(stringifyEnumValues(enumDef.values), "),"));
      }
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
    genQLEnumTypes();
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
    genQLSubscriptions(collections);
    genQLMutation(); // JS

    js.writeBlockLn("\n        const {\n            scalar,\n            bigUInt1,\n            bigUInt2,\n            resolveBigUInt,\n            struct,\n            array,\n            join,\n            joinArray,\n            enumName,\n            createEnumNameResolver,\n        } = require('./q-types.js');\n        ");
    var jsArrayFilters = new Set();
    types.forEach(function (type) {
      return genJSFilter(type, jsArrayFilters);
    });
    js.writeBlockLn("\n        function createResolvers(db, postRequests, info) {\n            return {\n        ");
    types.forEach(function (type) {
      genJSCustomResolvers(type);
      genJSTypeResolversForUnion(type);
    });
    js.writeLn('        Query: {');
    js.writeLn('            info,');
    collections.forEach(function (type) {
      js.writeLn("            ".concat(type.collection || '', ": db.collectionQuery(db.").concat(type.collection || '', ", ").concat(type.name, "),"));
    });
    js.writeLn('        },');
    js.writeLn('        Subscription: {');
    collections.forEach(function (type) {
      js.writeLn("            ".concat(type.collection || '', ": db.collectionSubscription(db.").concat(type.collection || '', ", ").concat(type.name, "),"));
    });
    js.writeBlockLn("\n                },\n                Mutation: {\n                    postRequests,\n                }\n            }\n        }\n\n        ");
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

  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = enumTypes.values()[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var _e = _step2.value;
      console.log("export const Q".concat(_e.name, " = {"));
      console.log(Object.entries(_e.values).map(function (_ref3) {
        var _ref4 = (0, _slicedToArray2["default"])(_ref3, 2),
            name = _ref4[0],
            value = _ref4[1];

        return "    ".concat(name, ": ").concat(value, ",");
      }).join('\n'));
      console.log("};\n");
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
        _iterator2["return"]();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9nZW4tcWwuanMiXSwibmFtZXMiOlsiRGJUeXBlQ2F0ZWdvcnkiLCJ1bnJlc29sdmVkIiwic2NhbGFyIiwidW5pb24iLCJzdHJ1Y3QiLCJzY2FsYXJUeXBlIiwibmFtZSIsImNhdGVnb3J5IiwiZmllbGRzIiwic2NhbGFyVHlwZXMiLCJ1aW50NjQiLCJ1aW50MTAyNCIsInN0cmluZyIsInVucmVzb2x2ZWRUeXBlIiwiaXNMb3dlckNhc2VkIiwicyIsImwiLCJ0b0xvd2VyQ2FzZSIsInUiLCJ0b1VwcGVyQ2FzZSIsImlzVXBwZXJDYXNlZCIsInRvQWxsQ2FwcyIsInJlc3VsdCIsImkiLCJsZW5ndGgiLCJ0b0VudW1TdHlsZSIsInN1YnN0ciIsInN0cmluZ2lmeUVudW1WYWx1ZXMiLCJ2YWx1ZXMiLCJPYmplY3QiLCJlbnRyaWVzIiwibWFwIiwidmFsdWUiLCJqb2luIiwibWFpbiIsInNjaGVtYURlZiIsImRiVHlwZXMiLCJsYXN0UmVwb3J0ZWRUeXBlIiwiZW51bVR5cGVzIiwiTWFwIiwicmVwb3J0VHlwZSIsImZpZWxkIiwidHlwZSIsImNvbnNvbGUiLCJsb2ciLCJwYXJzZURiRmllbGQiLCJ0eXBlTmFtZSIsInNjaGVtYUZpZWxkIiwic2NoZW1hVHlwZSIsImFycmF5RGVwdGgiLCJhcnJheSIsImVudW1EZWYiLCJfIiwic2V0IiwicmVmIiwiYm9vbCIsInVuc2lnbmVkIiwic2l6ZSIsIkVycm9yIiwiSlNPTiIsInN0cmluZ2lmeSIsInByb2Nlc3MiLCJleGl0IiwidW53cmFwQXJyYXlzIiwicGFyc2VEYlR5cGUiLCJjb2xsZWN0aW9uIiwicHVzaCIsImZvckVhY2giLCJ1bndyYXBwZWQiLCJvd25UeXBlIiwicGFyc2VEYlR5cGVzIiwidHlwZXMiLCJyZXNvbHZpbmciLCJTZXQiLCJyZXNvbHZlZCIsIm9yZGVyZWRSZXNvbHZlZCIsInQiLCJyZXNvbHZlVHlwZSIsImhhcyIsImFkZCIsImdldCIsInFsIiwiV3JpdGVyIiwianMiLCJ1bmlvblZhcmlhbnRUeXBlIiwidmFyaWFudCIsImdlblFMVHlwZURlY2xhcmF0aW9uc0ZvclVuaW9uVmFyaWFudHMiLCJ3cml0ZUJsb2NrTG4iLCJnZW5RTEVudW1UeXBlcyIsIndyaXRlTG4iLCJrZXlzIiwiZ2VuUUxUeXBlRGVjbGFyYXRpb24iLCJ0eXBlRGVjbGFyYXRpb24iLCJyZXBlYXQiLCJwcmV2ZW50VHdpY2UiLCJuYW1lcyIsIndvcmsiLCJnZW5RTEZpbHRlcnNGb3JBcnJheUZpZWxkcyIsInFsTmFtZXMiLCJpdGVtVHlwZU5hbWUiLCJmaWx0ZXJOYW1lIiwib3AiLCJnZW5RTEZpbHRlcnNGb3JFbnVtTmFtZUZpZWxkcyIsImdlblFMU2NhbGFyVHlwZXNGaWx0ZXIiLCJnZW5RTEZpbHRlciIsImdlblFMUXVlcmllcyIsImdlblFMU3Vic2NyaXB0aW9ucyIsImdlblFMTXV0YXRpb24iLCJnZXRTY2FsYXJSZXNvbHZlck5hbWUiLCJnZW5KU0ZpbHRlcnNGb3JBcnJheUZpZWxkcyIsImpzTmFtZXMiLCJpdGVtUmVzb2x2ZXJOYW1lIiwiZ2VuSlNTdHJ1Y3RGaWx0ZXIiLCJvbiIsImdlbkpTVW5pb25SZXNvbHZlciIsImdlbkpTRmlsdGVyIiwiZ2VuSlNDdXN0b21SZXNvbHZlcnMiLCJqb2luRmllbGRzIiwiZmlsdGVyIiwieCIsImJpZ1VJbnRGaWVsZHMiLCJlbnVtRmllbGRzIiwiY3VzdG9tUmVzb2x2ZXJSZXF1aXJlZCIsIm9uRmllbGQiLCJmaW5kIiwicHJlZml4TGVuZ3RoIiwiZ2VuSlNUeXBlUmVzb2x2ZXJzRm9yVW5pb24iLCJnZW5lcmF0ZSIsInFsQXJyYXlGaWx0ZXJzIiwiY29sbGVjdGlvbnMiLCJqc0FycmF5RmlsdGVycyIsInNjaGVtYSIsImUiLCJnZW5lcmF0ZWQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBRUE7O0FBRUE7O0FBRUEsSUFBTUEsY0FBYyxHQUFHO0FBQ25CQyxFQUFBQSxVQUFVLEVBQUUsWUFETztBQUVuQkMsRUFBQUEsTUFBTSxFQUFFLFFBRlc7QUFHbkJD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QUcsMEJBQWFoRyxTQUFiLENBQWY7O0FBRUEsTUFBSWdHLE1BQU0sU0FBVixFQUFrQjtBQUNkN0QsSUFBQUEsWUFBWSxDQUFDNkQsTUFBTSxTQUFOLENBQWE1RCxLQUFkLENBQVo7QUFDQXdELElBQUFBLFFBQVEsQ0FBQzNGLE9BQUQsQ0FBUjtBQUNIOztBQXRrQjZCO0FBQUE7QUFBQTs7QUFBQTtBQXdrQjlCLDBCQUE0QkUsU0FBUyxDQUFDVixNQUFWLEVBQTVCLG1JQUFnRDtBQUFBLFVBQXJDd0csRUFBcUM7QUFDNUN6RixNQUFBQSxPQUFPLENBQUNDLEdBQVIseUJBQTZCd0YsRUFBQyxDQUFDOUgsSUFBL0I7QUFDQXFDLE1BQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZZixNQUFNLENBQUNDLE9BQVAsQ0FBZXNHLEVBQUMsQ0FBQ3hHLE1BQWpCLEVBQXlCRyxHQUF6QixDQUE2QixpQkFBbUI7QUFBQTtBQUFBLFlBQWpCekIsSUFBaUI7QUFBQSxZQUFYMEIsS0FBVzs7QUFDeEQsNkJBQWMxQixJQUFkLGVBQXdCMEIsS0FBeEI7QUFDSCxPQUZXLEVBRVRDLElBRlMsQ0FFSixJQUZJLENBQVo7QUFHQVUsTUFBQUEsT0FBTyxDQUFDQyxHQUFSO0FBQ0g7QUE5a0I2QjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOztBQWdsQjlCLFNBQU87QUFDSHFDLElBQUFBLEVBQUUsRUFBRUEsRUFBRSxDQUFDb0QsU0FBSCxFQUREO0FBRUhsRCxJQUFBQSxFQUFFLEVBQUVBLEVBQUUsQ0FBQ2tELFNBQUg7QUFGRCxHQUFQO0FBSUg7O2VBRWNuRyxJIiwic291cmNlc0NvbnRlbnQiOlsiLy9AZmxvd1xuXG5pbXBvcnQgeyBtYWtlRmllbGRUeXBlTmFtZSwgV3JpdGVyIH0gZnJvbSAndG9uLWxhYnMtZGV2LW9wcy9kaXN0L3NyYy9nZW4uanMnO1xuaW1wb3J0IHR5cGUgeyBTY2hlbWFNZW1iZXIsIFNjaGVtYVR5cGUsIFR5cGVEZWYgfSBmcm9tICd0b24tbGFicy1kZXYtb3BzL3NyYy9zY2hlbWEuanMnO1xuaW1wb3J0IHsgcGFyc2VUeXBlRGVmIH0gZnJvbSAndG9uLWxhYnMtZGV2LW9wcy9kaXN0L3NyYy9zY2hlbWEuanMnO1xuXG5jb25zdCBEYlR5cGVDYXRlZ29yeSA9IHtcbiAgICB1bnJlc29sdmVkOiAndW5yZXNvbHZlZCcsXG4gICAgc2NhbGFyOiAnc2NhbGFyJyxcbiAgICB1bmlvbjogJ3VuaW9uJyxcbiAgICBzdHJ1Y3Q6ICdzdHJ1Y3QnLFxufTtcblxudHlwZSBEYkpvaW4gPSB7XG4gICAgY29sbGVjdGlvbjogc3RyaW5nLFxuICAgIG9uOiBzdHJpbmcsXG59XG5cbnR5cGUgRGJUeXBlID0ge1xuICAgIG5hbWU6IHN0cmluZyxcbiAgICBmaWVsZHM6IERiRmllbGRbXSxcbiAgICBjYXRlZ29yeTogJ3VucmVzb2x2ZWQnIHwgJ3NjYWxhcicgfCAndW5pb24nIHwgJ3N0cnVjdCcsXG4gICAgY29sbGVjdGlvbj86IHN0cmluZyxcbn1cblxudHlwZSBJbnRFbnVtRGVmID0ge1xuICAgIG5hbWU6IHN0cmluZyxcbiAgICB2YWx1ZXM6IHsgW3N0cmluZ106IG51bWJlciB9LFxufVxuXG50eXBlIERiRmllbGQgPSB7XG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHR5cGU6IERiVHlwZSxcbiAgICBhcnJheURlcHRoOiBudW1iZXIsXG4gICAgam9pbj86IERiSm9pbixcbiAgICBlbnVtRGVmPzogSW50RW51bURlZixcbn1cblxuZnVuY3Rpb24gc2NhbGFyVHlwZShuYW1lOiBzdHJpbmcpOiBEYlR5cGUge1xuICAgIHJldHVybiB7XG4gICAgICAgIG5hbWUsXG4gICAgICAgIGNhdGVnb3J5OiBEYlR5cGVDYXRlZ29yeS5zY2FsYXIsXG4gICAgICAgIGZpZWxkczogW11cbiAgICB9XG59XG5cbmNvbnN0IHNjYWxhclR5cGVzID0ge1xuICAgIGludDogc2NhbGFyVHlwZSgnSW50JyksXG4gICAgdWludDY0OiBzY2FsYXJUeXBlKCdTdHJpbmcnKSxcbiAgICB1aW50MTAyNDogc2NhbGFyVHlwZSgnU3RyaW5nJyksXG4gICAgZmxvYXQ6IHNjYWxhclR5cGUoJ0Zsb2F0JyksXG4gICAgYm9vbGVhbjogc2NhbGFyVHlwZSgnQm9vbGVhbicpLFxuICAgIHN0cmluZzogc2NhbGFyVHlwZSgnU3RyaW5nJyksXG59O1xuXG5mdW5jdGlvbiB1bnJlc29sdmVkVHlwZShuYW1lOiBzdHJpbmcpOiBEYlR5cGUge1xuICAgIHJldHVybiB7XG4gICAgICAgIG5hbWUsXG4gICAgICAgIGNhdGVnb3J5OiBEYlR5cGVDYXRlZ29yeS51bnJlc29sdmVkLFxuICAgICAgICBmaWVsZHM6IFtdLFxuICAgIH1cbn1cblxuZnVuY3Rpb24gaXNMb3dlckNhc2VkKHM6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGwgPSBzLnRvTG93ZXJDYXNlKCk7XG4gICAgY29uc3QgdSA9IHMudG9VcHBlckNhc2UoKTtcbiAgICByZXR1cm4gKHUgIT09IGwpICYmIChzID09PSBsKTtcbn1cblxuZnVuY3Rpb24gaXNVcHBlckNhc2VkKHM6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGwgPSBzLnRvTG93ZXJDYXNlKCk7XG4gICAgY29uc3QgdSA9IHMudG9VcHBlckNhc2UoKTtcbiAgICByZXR1cm4gKHUgIT09IGwpICYmIChzID09PSB1KTtcbn1cblxuZnVuY3Rpb24gdG9BbGxDYXBzKHM6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgbGV0IHJlc3VsdCA9ICcnO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBpZiAoKGkgPiAwKSAmJiAoc1tpIC0gMV0gIT09ICdfJykgJiYgaXNMb3dlckNhc2VkKHNbaSAtIDFdKSAmJiBpc1VwcGVyQ2FzZWQoc1tpXSkpIHtcbiAgICAgICAgICAgIHJlc3VsdCArPSAnXyc7XG4gICAgICAgIH1cbiAgICAgICAgcmVzdWx0ICs9IHNbaV07XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQudG9VcHBlckNhc2UoKTtcbn1cblxuZnVuY3Rpb24gdG9FbnVtU3R5bGUoczogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYCR7cy5zdWJzdHIoMCwgMSkudG9VcHBlckNhc2UoKX0ke3Muc3Vic3RyKDEpfWA7XG59XG5cbmZ1bmN0aW9uIHN0cmluZ2lmeUVudW1WYWx1ZXModmFsdWVzOiB7IFtzdHJpbmddOiBudW1iZXIgfSk6IHN0cmluZyB7XG4gICAgY29uc3QgZmllbGRzID0gT2JqZWN0LmVudHJpZXModmFsdWVzKS5tYXAoKFtuYW1lLCB2YWx1ZV0pID0+IHtcbiAgICAgICAgcmV0dXJuIGAke3RvRW51bVN0eWxlKG5hbWUpfTogJHsodmFsdWU6IGFueSl9YDtcbiAgICB9KTtcbiAgICByZXR1cm4gYHsgJHtmaWVsZHMuam9pbignLCAnKX0gfWA7XG59XG5cbmZ1bmN0aW9uIG1haW4oc2NoZW1hRGVmOiBUeXBlRGVmKSB7XG5cbiAgICBsZXQgZGJUeXBlczogRGJUeXBlW10gPSBbXTtcbiAgICBsZXQgbGFzdFJlcG9ydGVkVHlwZTogc3RyaW5nID0gJyc7XG4gICAgbGV0IGVudW1UeXBlczogTWFwPHN0cmluZywgSW50RW51bURlZj4gPSBuZXcgTWFwKCk7XG5cbiAgICBmdW5jdGlvbiByZXBvcnRUeXBlKG5hbWU6IHN0cmluZywgZmllbGQ6IHN0cmluZywgdHlwZTogc3RyaW5nKSB7XG4gICAgICAgIGlmIChuYW1lICE9PSBsYXN0UmVwb3J0ZWRUeXBlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhuYW1lKTtcbiAgICAgICAgICAgIGxhc3RSZXBvcnRlZFR5cGUgPSBuYW1lO1xuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUubG9nKGAgICAgJHtmaWVsZH06ICR7dHlwZX1gKTtcblxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlRGJGaWVsZChcbiAgICAgICAgdHlwZU5hbWU6IHN0cmluZyxcbiAgICAgICAgc2NoZW1hRmllbGQ6IFNjaGVtYU1lbWJlcjxTY2hlbWFUeXBlPixcbiAgICApOiBEYkZpZWxkIHtcbiAgICAgICAgbGV0IHNjaGVtYVR5cGUgPSBzY2hlbWFGaWVsZDtcbiAgICAgICAgY29uc3QgZmllbGQ6IERiRmllbGQgPSB7XG4gICAgICAgICAgICBuYW1lOiBzY2hlbWFGaWVsZC5uYW1lLFxuICAgICAgICAgICAgYXJyYXlEZXB0aDogMCxcbiAgICAgICAgICAgIHR5cGU6IHNjYWxhclR5cGVzLnN0cmluZyxcbiAgICAgICAgfTtcbiAgICAgICAgd2hpbGUgKHNjaGVtYVR5cGUuYXJyYXkpIHtcbiAgICAgICAgICAgIGZpZWxkLmFycmF5RGVwdGggKz0gMTtcbiAgICAgICAgICAgIHNjaGVtYVR5cGUgPSBzY2hlbWFUeXBlLmFycmF5O1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGVudW1EZWY6ID9JbnRFbnVtRGVmID0gKHNjaGVtYVR5cGUuXyAmJiBzY2hlbWFUeXBlLl8uZW51bSkgfHwgbnVsbDtcbiAgICAgICAgaWYgKGVudW1EZWYpIHtcbiAgICAgICAgICAgIGZpZWxkLmVudW1EZWYgPSBlbnVtRGVmO1xuICAgICAgICAgICAgZW51bVR5cGVzLnNldChlbnVtRGVmLm5hbWUsIGVudW1EZWYpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGpvaW4gPSAoc2NoZW1hVHlwZTogYW55KS5fLmpvaW47XG4gICAgICAgIGlmIChqb2luKSB7XG4gICAgICAgICAgICBmaWVsZC5qb2luID0gam9pbjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc2NoZW1hVHlwZS51bmlvbiB8fCBzY2hlbWFUeXBlLnN0cnVjdCkge1xuICAgICAgICAgICAgZmllbGQudHlwZSA9IHVucmVzb2x2ZWRUeXBlKG1ha2VGaWVsZFR5cGVOYW1lKHR5cGVOYW1lLCBzY2hlbWFGaWVsZC5uYW1lKSk7XG4gICAgICAgIH0gZWxzZSBpZiAoc2NoZW1hVHlwZS5yZWYpIHtcbiAgICAgICAgICAgIGZpZWxkLnR5cGUgPSB1bnJlc29sdmVkVHlwZShzY2hlbWFUeXBlLnJlZi5uYW1lKTtcbiAgICAgICAgfSBlbHNlIGlmIChzY2hlbWFUeXBlLmJvb2wpIHtcbiAgICAgICAgICAgIGZpZWxkLnR5cGUgPSBzY2FsYXJUeXBlcy5ib29sZWFuO1xuICAgICAgICB9IGVsc2UgaWYgKHNjaGVtYVR5cGUuaW50KSB7XG4gICAgICAgICAgICBjb25zdCB1bnNpZ25lZDogYm9vbGVhbiA9IChzY2hlbWFUeXBlLmludCAmJiBzY2hlbWFUeXBlLmludC51bnNpZ25lZCkgfHwgZmFsc2U7XG4gICAgICAgICAgICBjb25zdCBzaXplOiBudW1iZXIgPSAoc2NoZW1hVHlwZS5pbnQgJiYgc2NoZW1hVHlwZS5pbnQuc2l6ZSkgfHwgMzI7XG4gICAgICAgICAgICBpZiAodW5zaWduZWQpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2l6ZSA+PSAxMjgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVwb3J0VHlwZSh0eXBlTmFtZSwgZmllbGQubmFtZSwgJ3UxMDI0Jyk7XG4gICAgICAgICAgICAgICAgICAgIGZpZWxkLnR5cGUgPSBzY2FsYXJUeXBlcy51aW50MTAyNDtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHNpemUgPj0gNjQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVwb3J0VHlwZSh0eXBlTmFtZSwgZmllbGQubmFtZSwgJ3U2NCcpO1xuICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlID0gc2NhbGFyVHlwZXMudWludDY0O1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc2l6ZSA+PSAzMikge1xuICAgICAgICAgICAgICAgICAgICByZXBvcnRUeXBlKHR5cGVOYW1lLCBmaWVsZC5uYW1lLCAndTMyJyk7XG4gICAgICAgICAgICAgICAgICAgIGZpZWxkLnR5cGUgPSBzY2FsYXJUeXBlcy5mbG9hdDtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXBvcnRUeXBlKHR5cGVOYW1lLCBmaWVsZC5uYW1lLCBgdSR7c2l6ZX1gKTtcbiAgICAgICAgICAgICAgICAgICAgZmllbGQudHlwZSA9IHNjYWxhclR5cGVzLmludDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChzaXplID4gMzIpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnRlZ2VyIHR5cGUgd2l0aCBzaXplICR7c2l6ZX0gYml0IGRvZXMgbm90IHN1cHBvcnRlZGApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcG9ydFR5cGUodHlwZU5hbWUsIGZpZWxkLm5hbWUsICdpMzInKTtcbiAgICAgICAgICAgICAgICAgICAgZmllbGQudHlwZSA9IHNjYWxhclR5cGVzLmludDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoc2NoZW1hVHlwZS5mbG9hdCkge1xuICAgICAgICAgICAgcmVwb3J0VHlwZSh0eXBlTmFtZSwgZmllbGQubmFtZSwgJ2Zsb2F0Jyk7XG4gICAgICAgICAgICBmaWVsZC50eXBlID0gc2NhbGFyVHlwZXMuZmxvYXQ7XG4gICAgICAgIH0gZWxzZSBpZiAoc2NoZW1hVHlwZS5zdHJpbmcpIHtcbiAgICAgICAgICAgIGZpZWxkLnR5cGUgPSBzY2FsYXJUeXBlcy5zdHJpbmc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmaWVsZC50eXBlID0gc2NhbGFyVHlwZXMuc3RyaW5nO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJz4+PiBJbnZhbGlkIGZpZWxkIHR5cGU6ICcsIEpTT04uc3RyaW5naWZ5KHNjaGVtYVR5cGUpKTtcbiAgICAgICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmllbGQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdW53cmFwQXJyYXlzKHR5cGU6IFNjaGVtYVR5cGUpOiBTY2hlbWFUeXBlIHtcbiAgICAgICAgaWYgKHR5cGUuYXJyYXkpIHtcbiAgICAgICAgICAgIHJldHVybiB1bndyYXBBcnJheXModHlwZS5hcnJheSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHR5cGU7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VEYlR5cGUoXG4gICAgICAgIG5hbWU6IHN0cmluZyxcbiAgICAgICAgc2NoZW1hVHlwZTogU2NoZW1hVHlwZVxuICAgICkge1xuICAgICAgICBjb25zdCBzdHJ1Y3QgPSBzY2hlbWFUeXBlLnVuaW9uIHx8IHNjaGVtYVR5cGUuc3RydWN0O1xuICAgICAgICBpZiAoIXN0cnVjdCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJz4+PicsIGA/PyAke25hbWV9OiAke0pTT04uc3RyaW5naWZ5KHNjaGVtYVR5cGUpLnN1YnN0cigwLCAyMDApfWApO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHR5cGU6IERiVHlwZSA9IHtcbiAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICBjYXRlZ29yeTogc2NoZW1hVHlwZS51bmlvbiA/IERiVHlwZUNhdGVnb3J5LnVuaW9uIDogRGJUeXBlQ2F0ZWdvcnkuc3RydWN0LFxuICAgICAgICAgICAgZmllbGRzOiBbXSxcbiAgICAgICAgICAgIGNvbGxlY3Rpb246IChzY2hlbWFUeXBlOiBhbnkpLl8uY29sbGVjdGlvbixcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAodHlwZS5jb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICB0eXBlLmZpZWxkcy5wdXNoKHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnaWQnLFxuICAgICAgICAgICAgICAgIGFycmF5RGVwdGg6IDAsXG4gICAgICAgICAgICAgICAgdHlwZTogc2NhbGFyVHlwZXMuc3RyaW5nLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgc3RydWN0LmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICB0eXBlLmZpZWxkcy5wdXNoKHBhcnNlRGJGaWVsZChuYW1lLCBmaWVsZCkpO1xuICAgICAgICAgICAgY29uc3QgdW53cmFwcGVkID0gdW53cmFwQXJyYXlzKGZpZWxkKTtcbiAgICAgICAgICAgIGNvbnN0IG93blR5cGUgPSAodW53cmFwcGVkLnN0cnVjdCB8fCB1bndyYXBwZWQudW5pb24pID8gdW53cmFwcGVkIDogbnVsbDtcbiAgICAgICAgICAgIGlmIChvd25UeXBlKSB7XG4gICAgICAgICAgICAgICAgcGFyc2VEYlR5cGUobWFrZUZpZWxkVHlwZU5hbWUobmFtZSwgZmllbGQubmFtZSksIG93blR5cGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgZGJUeXBlcy5wdXNoKHR5cGUpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlRGJUeXBlcyh0eXBlczogU2NoZW1hTWVtYmVyPFNjaGVtYVR5cGU+W10pIHtcbiAgICAgICAgdHlwZXMuZm9yRWFjaCgodHlwZTogU2NoZW1hTWVtYmVyPFNjaGVtYVR5cGU+KSA9PiB7XG4gICAgICAgICAgICBwYXJzZURiVHlwZSh0eXBlLm5hbWUsIHR5cGUpO1xuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgdW5yZXNvbHZlZDogTWFwPHN0cmluZywgRGJUeXBlPiA9IG5ldyBNYXA8c3RyaW5nLCBEYlR5cGU+KCk7XG4gICAgICAgIGNvbnN0IHJlc29sdmluZzogU2V0PHN0cmluZz4gPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICAgICAgY29uc3QgcmVzb2x2ZWQ6IE1hcDxzdHJpbmcsIERiVHlwZT4gPSBuZXcgTWFwPHN0cmluZywgRGJUeXBlPigpO1xuICAgICAgICBjb25zdCBvcmRlcmVkUmVzb2x2ZWQ6IERiVHlwZVtdID0gW107XG4gICAgICAgIGRiVHlwZXMuZm9yRWFjaCh0ID0+IHVucmVzb2x2ZWQuc2V0KHQubmFtZSwgdCkpO1xuICAgICAgICBjb25zdCByZXNvbHZlVHlwZSA9ICh0eXBlOiBEYlR5cGUpID0+IHtcbiAgICAgICAgICAgIGlmIChyZXNvbHZlZC5oYXModHlwZS5uYW1lKSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChyZXNvbHZpbmcuaGFzKHR5cGUubmFtZSkpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnPj4+JywgYENpcmN1bGFyIHJlZmVyZW5jZSB0byB0eXBlICR7dHlwZS5uYW1lfWApO1xuICAgICAgICAgICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlc29sdmluZy5hZGQodHlwZS5uYW1lKTtcbiAgICAgICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGZpZWxkLnR5cGUuY2F0ZWdvcnkgPT09IERiVHlwZUNhdGVnb3J5LnVucmVzb2x2ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHR5cGUgPSByZXNvbHZlZC5nZXQoZmllbGQudHlwZS5uYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlID0gdW5yZXNvbHZlZC5nZXQoZmllbGQudHlwZS5uYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZVR5cGUodHlwZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+Pj4nLCBgUmVmZXJlbmNlZCB0eXBlIG5vdCBmb3VuZDogJHtmaWVsZC50eXBlLm5hbWV9YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlID0gdHlwZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmVzb2x2aW5nLmRlbGV0ZSh0eXBlLm5hbWUpO1xuICAgICAgICAgICAgb3JkZXJlZFJlc29sdmVkLnB1c2godHlwZSk7XG4gICAgICAgICAgICB1bnJlc29sdmVkLmRlbGV0ZSh0eXBlLm5hbWUpO1xuICAgICAgICAgICAgcmVzb2x2ZWQuc2V0KHR5cGUubmFtZSwgdHlwZSk7XG4gICAgICAgIH07XG4gICAgICAgIGRiVHlwZXMuZm9yRWFjaChyZXNvbHZlVHlwZSk7XG4gICAgICAgIGRiVHlwZXMgPSBvcmRlcmVkUmVzb2x2ZWQ7XG4gICAgfVxuXG4vLyBHZW5lcmF0b3JzXG5cbiAgICBjb25zdCBxbCA9IG5ldyBXcml0ZXIoKTtcbiAgICBjb25zdCBqcyA9IG5ldyBXcml0ZXIoKTtcblxuICAgIGZ1bmN0aW9uIHVuaW9uVmFyaWFudFR5cGUodHlwZTogRGJUeXBlLCB2YXJpYW50OiBEYkZpZWxkKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIGAke3R5cGUubmFtZX0ke3ZhcmlhbnQubmFtZX1WYXJpYW50YDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5RTFR5cGVEZWNsYXJhdGlvbnNGb3JVbmlvblZhcmlhbnRzKHR5cGU6IERiVHlwZSkge1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKCh2YXJpYW50KSA9PiB7XG4gICAgICAgICAgICBxbC53cml0ZUJsb2NrTG4oYFxuICAgICAgICB0eXBlICR7dW5pb25WYXJpYW50VHlwZSh0eXBlLCB2YXJpYW50KX0ge1xuICAgICAgICAgICAgJHt2YXJpYW50Lm5hbWV9OiAke3ZhcmlhbnQudHlwZS5uYW1lfVxuICAgICAgICB9XG5cbiAgICAgICAgYCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlblFMRW51bVR5cGVzKCkge1xuICAgICAgICBmb3IgKGNvbnN0IGVudW1EZWY6IEludEVudW1EZWYgb2YgZW51bVR5cGVzLnZhbHVlcygpKSB7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGBlbnVtICR7ZW51bURlZi5uYW1lfUVudW0ge2ApO1xuICAgICAgICAgICAgT2JqZWN0LmtleXMoZW51bURlZi52YWx1ZXMpLmZvckVhY2goKG5hbWUpID0+IHtcbiAgICAgICAgICAgICAgICBxbC53cml0ZUxuKGAgICAgJHt0b0VudW1TdHlsZShuYW1lKX1gKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcWwud3JpdGVMbihgfWApO1xuICAgICAgICAgICAgcWwud3JpdGVMbigpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuUUxUeXBlRGVjbGFyYXRpb24odHlwZTogRGJUeXBlKSB7XG4gICAgICAgIGlmICh0eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS51bmlvbikge1xuICAgICAgICAgICAgZ2VuUUxUeXBlRGVjbGFyYXRpb25zRm9yVW5pb25WYXJpYW50cyh0eXBlKTtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oYHVuaW9uICR7dHlwZS5uYW1lfSA9IGApO1xuICAgICAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCh2YXJpYW50ID0+IHtcbiAgICAgICAgICAgICAgICBxbC53cml0ZUxuKGBcXHR8ICR7dW5pb25WYXJpYW50VHlwZSh0eXBlLCB2YXJpYW50KX1gKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcWwud3JpdGVMbigpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcWwud3JpdGVMbihgdHlwZSAke3R5cGUubmFtZX0ge2ApO1xuICAgICAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaChmaWVsZCA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgdHlwZURlY2xhcmF0aW9uID1cbiAgICAgICAgICAgICAgICAgICAgJ1snLnJlcGVhdChmaWVsZC5hcnJheURlcHRoKSArXG4gICAgICAgICAgICAgICAgICAgIGZpZWxkLnR5cGUubmFtZSArXG4gICAgICAgICAgICAgICAgICAgICddJy5yZXBlYXQoZmllbGQuYXJyYXlEZXB0aCk7XG4gICAgICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0JHtmaWVsZC5uYW1lfTogJHt0eXBlRGVjbGFyYXRpb259YCk7XG4gICAgICAgICAgICAgICAgY29uc3QgZW51bURlZiA9IGZpZWxkLmVudW1EZWY7XG4gICAgICAgICAgICAgICAgaWYgKGVudW1EZWYpIHtcbiAgICAgICAgICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0JHtmaWVsZC5uYW1lfV9uYW1lOiAke2VudW1EZWYubmFtZX1FbnVtYCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGB9YCk7XG4gICAgICAgIH1cbiAgICAgICAgcWwud3JpdGVMbigpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHByZXZlbnRUd2ljZShuYW1lOiBzdHJpbmcsIG5hbWVzOiBTZXQ8c3RyaW5nPiwgd29yazogKCkgPT4gdm9pZCkge1xuICAgICAgICBpZiAoIW5hbWVzLmhhcyhuYW1lKSkge1xuICAgICAgICAgICAgbmFtZXMuYWRkKG5hbWUpO1xuICAgICAgICAgICAgd29yaygpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuUUxGaWx0ZXJzRm9yQXJyYXlGaWVsZHModHlwZTogRGJUeXBlLCBxbE5hbWVzOiBTZXQ8c3RyaW5nPikge1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgbGV0IGl0ZW1UeXBlTmFtZSA9IGZpZWxkLnR5cGUubmFtZTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZmllbGQuYXJyYXlEZXB0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmlsdGVyTmFtZSA9IGAke2l0ZW1UeXBlTmFtZX1BcnJheUZpbHRlcmA7XG4gICAgICAgICAgICAgICAgcHJldmVudFR3aWNlKGZpbHRlck5hbWUsIHFsTmFtZXMsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcWwud3JpdGVMbihgaW5wdXQgJHtmaWx0ZXJOYW1lfSB7YCk7XG4gICAgICAgICAgICAgICAgICAgIFsnYW55JywgJ2FsbCddLmZvckVhY2goKG9wKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBxbC53cml0ZUxuKGBcXHQke29wfTogJHtpdGVtVHlwZU5hbWV9RmlsdGVyYCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBxbC53cml0ZUxuKCd9Jyk7XG4gICAgICAgICAgICAgICAgICAgIHFsLndyaXRlTG4oKTtcblxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGl0ZW1UeXBlTmFtZSArPSAnQXJyYXknO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5RTEZpbHRlcnNGb3JFbnVtTmFtZUZpZWxkcyh0eXBlOiBEYlR5cGUsIHFsTmFtZXM6IFNldDxzdHJpbmc+KSB7XG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBlbnVtRGVmID0gZmllbGQuZW51bURlZjtcbiAgICAgICAgICAgIGlmIChlbnVtRGVmKSB7XG4gICAgICAgICAgICAgICAgcHJldmVudFR3aWNlKGAke2VudW1EZWYubmFtZX1FbnVtRmlsdGVyYCwgcWxOYW1lcywgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBnZW5RTFNjYWxhclR5cGVzRmlsdGVyKGAke2VudW1EZWYubmFtZX1FbnVtYCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlblFMRmlsdGVyKHR5cGU6IERiVHlwZSwgcWxOYW1lczogU2V0PHN0cmluZz4pIHtcbiAgICAgICAgaWYgKHR5cGUuZmllbGRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGdlblFMRmlsdGVyc0ZvckFycmF5RmllbGRzKHR5cGUsIHFsTmFtZXMpO1xuICAgICAgICBnZW5RTEZpbHRlcnNGb3JFbnVtTmFtZUZpZWxkcyh0eXBlLCBxbE5hbWVzKTtcbiAgICAgICAgcWwud3JpdGVMbihgaW5wdXQgJHt0eXBlLm5hbWV9RmlsdGVyIHtgKTtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHR5cGVEZWNsYXJhdGlvbiA9IGZpZWxkLnR5cGUubmFtZSArIFwiQXJyYXlcIi5yZXBlYXQoZmllbGQuYXJyYXlEZXB0aCk7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGBcXHQke2ZpZWxkLm5hbWV9OiAke3R5cGVEZWNsYXJhdGlvbn1GaWx0ZXJgKTtcbiAgICAgICAgICAgIGNvbnN0IGVudW1EZWYgPSBmaWVsZC5lbnVtRGVmO1xuICAgICAgICAgICAgaWYgKGVudW1EZWYpIHtcbiAgICAgICAgICAgICAgICBxbC53cml0ZUxuKGBcXHQke2ZpZWxkLm5hbWV9X25hbWU6ICR7ZW51bURlZi5uYW1lfUVudW1GaWx0ZXJgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHFsLndyaXRlTG4oYH1gKTtcbiAgICAgICAgcWwud3JpdGVMbigpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlblFMU2NhbGFyVHlwZXNGaWx0ZXIobmFtZTogc3RyaW5nKSB7XG4gICAgICAgIHFsLndyaXRlTG4oYGlucHV0ICR7bmFtZX1GaWx0ZXIge2ApO1xuICAgICAgICBbJ2VxJywgJ25lJywgJ2d0JywgJ2x0JywgJ2dlJywgJ2xlJ10uZm9yRWFjaCgob3ApID0+IHtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oYFxcdCR7b3B9OiAke25hbWV9YCk7XG4gICAgICAgIH0pO1xuICAgICAgICBbJ2luJywgJ25vdEluJ10uZm9yRWFjaCgob3ApID0+IHtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oYFxcdCR7b3B9OiBbJHtuYW1lfV1gKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHFsLndyaXRlTG4oJ30nKTtcbiAgICAgICAgcWwud3JpdGVMbigpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlblFMUXVlcmllcyh0eXBlczogRGJUeXBlW10pIHtcbiAgICAgICAgcWwud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgZW51bSBRdWVyeU9yZGVyQnlEaXJlY3Rpb24ge1xuICAgICAgICAgICAgQVNDXG4gICAgICAgICAgICBERVNDXG4gICAgICAgIH1cblxuICAgICAgICBpbnB1dCBRdWVyeU9yZGVyQnkge1xuICAgICAgICAgICAgcGF0aDogU3RyaW5nXG4gICAgICAgICAgICBkaXJlY3Rpb246IFF1ZXJ5T3JkZXJCeURpcmVjdGlvblxuICAgICAgICB9XG5cbiAgICAgICAgdHlwZSBJbmZvIHtcbiAgICAgICAgICAgIHZlcnNpb246IFN0cmluZ1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0eXBlIFF1ZXJ5IHtcbiAgICAgICAgICAgIGluZm86IEluZm9cbiAgICAgICAgYCk7XG5cbiAgICAgICAgdHlwZXMuZm9yRWFjaCgodHlwZTogRGJUeXBlKSA9PiB7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGBcXHQke3R5cGUuY29sbGVjdGlvbiB8fCAnJ30oZmlsdGVyOiAke3R5cGUubmFtZX1GaWx0ZXIsIG9yZGVyQnk6IFtRdWVyeU9yZGVyQnldLCBsaW1pdDogSW50KTogWyR7dHlwZS5uYW1lfV1gKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcWwud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgfVxuXG4gICAgICAgIGApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlblFMU3Vic2NyaXB0aW9ucyh0eXBlczogRGJUeXBlW10pIHtcbiAgICAgICAgcWwud3JpdGVMbigndHlwZSBTdWJzY3JpcHRpb24geycpO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGBcXHQke3R5cGUuY29sbGVjdGlvbiB8fCAnJ30oZmlsdGVyOiAke3R5cGUubmFtZX1GaWx0ZXIpOiAke3R5cGUubmFtZX1gKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHFsLndyaXRlTG4oJ30nKTtcbiAgICB9XG5cblxuICAgIGZ1bmN0aW9uIGdlblFMTXV0YXRpb24oKSB7XG4gICAgICAgIHFsLndyaXRlQmxvY2tMbihgXG4gICAgICAgIFxuICAgICAgICBpbnB1dCBSZXF1ZXN0IHtcbiAgICAgICAgICAgIGlkOiBTdHJpbmdcbiAgICAgICAgICAgIGJvZHk6IFN0cmluZ1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0eXBlIE11dGF0aW9uIHtcbiAgICAgICAgICAgIHBvc3RSZXF1ZXN0cyhyZXF1ZXN0czogW1JlcXVlc3RdKTogW1N0cmluZ11cbiAgICAgICAgfVxuICAgICAgICBgKTtcbiAgICB9XG5cblxuICAgIGZ1bmN0aW9uIGdldFNjYWxhclJlc29sdmVyTmFtZShmaWVsZDogRGJGaWVsZCk6IHN0cmluZyB7XG4gICAgICAgIGlmIChmaWVsZC50eXBlID09PSBzY2FsYXJUeXBlcy51aW50NjQpIHtcbiAgICAgICAgICAgIHJldHVybiAnYmlnVUludDEnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChmaWVsZC50eXBlID09PSBzY2FsYXJUeXBlcy51aW50MTAyNCkge1xuICAgICAgICAgICAgcmV0dXJuICdiaWdVSW50Mic7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICdzY2FsYXInO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkpTRmlsdGVyc0ZvckFycmF5RmllbGRzKHR5cGU6IERiVHlwZSwganNOYW1lczogU2V0PHN0cmluZz4pIHtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGxldCBpdGVtVHlwZU5hbWUgPSBmaWVsZC50eXBlLm5hbWU7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZpZWxkLmFycmF5RGVwdGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpbHRlck5hbWUgPSBgJHtpdGVtVHlwZU5hbWV9QXJyYXlgO1xuICAgICAgICAgICAgICAgIHByZXZlbnRUd2ljZShmaWx0ZXJOYW1lLCBqc05hbWVzLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1SZXNvbHZlck5hbWUgPSAoaSA9PT0gMCAmJiBmaWVsZC50eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS5zY2FsYXIpXG4gICAgICAgICAgICAgICAgICAgICAgICA/IGdldFNjYWxhclJlc29sdmVyTmFtZShmaWVsZClcbiAgICAgICAgICAgICAgICAgICAgICAgIDogaXRlbVR5cGVOYW1lO1xuICAgICAgICAgICAgICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICAgICAgICAgIGNvbnN0ICR7ZmlsdGVyTmFtZX0gPSBhcnJheSgke2l0ZW1SZXNvbHZlck5hbWV9KTtcbiAgICAgICAgICAgICAgICBgKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBpdGVtVHlwZU5hbWUgKz0gJ0FycmF5JztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuSlNTdHJ1Y3RGaWx0ZXIodHlwZTogRGJUeXBlKSB7XG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIGNvbnN0ICR7dHlwZS5uYW1lfSA9IHN0cnVjdCh7XG4gICAgYCk7XG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBsZXQgdHlwZURlY2xhcmF0aW9uOiA/c3RyaW5nID0gbnVsbDtcbiAgICAgICAgICAgIGNvbnN0IGpvaW4gPSBmaWVsZC5qb2luO1xuICAgICAgICAgICAgaWYgKGpvaW4pIHtcbiAgICAgICAgICAgICAgICB0eXBlRGVjbGFyYXRpb24gPSBgam9pbiR7ZmllbGQuYXJyYXlEZXB0aCA+IDAgPyAnQXJyYXknIDogJyd9KCcke2pvaW4ub259JywgJyR7ZmllbGQudHlwZS5jb2xsZWN0aW9uIHx8ICcnfScsICR7ZmllbGQudHlwZS5uYW1lfSlgO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC5hcnJheURlcHRoID4gMCkge1xuICAgICAgICAgICAgICAgIHR5cGVEZWNsYXJhdGlvbiA9XG4gICAgICAgICAgICAgICAgICAgIGZpZWxkLnR5cGUubmFtZSArXG4gICAgICAgICAgICAgICAgICAgICdBcnJheScucmVwZWF0KGZpZWxkLmFycmF5RGVwdGgpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC50eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS5zY2FsYXIpIHtcbiAgICAgICAgICAgICAgICB0eXBlRGVjbGFyYXRpb24gPSBnZXRTY2FsYXJSZXNvbHZlck5hbWUoZmllbGQpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC50eXBlLmZpZWxkcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgdHlwZURlY2xhcmF0aW9uID0gZmllbGQudHlwZS5uYW1lO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHR5cGVEZWNsYXJhdGlvbikge1xuICAgICAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAke2ZpZWxkLm5hbWV9OiAke3R5cGVEZWNsYXJhdGlvbn0sYCk7XG4gICAgICAgICAgICAgICAgY29uc3QgZW51bURlZiA9IGZpZWxkLmVudW1EZWY7XG4gICAgICAgICAgICAgICAgaWYgKGVudW1EZWYpIHtcbiAgICAgICAgICAgICAgICAgICAganMud3JpdGVMbihgICAgICR7ZmllbGQubmFtZX1fbmFtZTogZW51bU5hbWUoJyR7ZmllbGQubmFtZX0nLCAke3N0cmluZ2lmeUVudW1WYWx1ZXMoZW51bURlZi52YWx1ZXMpfSksYCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgfSR7dHlwZS5jb2xsZWN0aW9uID8gJywgdHJ1ZScgOiAnJ30pO1xuXG4gICAgYCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuSlNVbmlvblJlc29sdmVyKHR5cGU6IERiVHlwZSkge1xuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBjb25zdCAke3R5cGUubmFtZX1SZXNvbHZlciA9IHtcbiAgICAgICAgICAgIF9fcmVzb2x2ZVR5cGUob2JqLCBjb250ZXh0LCBpbmZvKSB7XG4gICAgICAgIGApO1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKCh2YXJpYW50KSA9PiB7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgIGlmICgnJHt2YXJpYW50Lm5hbWV9JyBpbiBvYmopIHtgKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgIHJldHVybiAnJHt1bmlvblZhcmlhbnRUeXBlKHR5cGUsIHZhcmlhbnQpfSc7YCk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgIH1gKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgYCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuSlNGaWx0ZXIodHlwZTogRGJUeXBlLCBqc05hbWVzOiBTZXQ8c3RyaW5nPikge1xuICAgICAgICBpZiAodHlwZS5maWVsZHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGUuY2F0ZWdvcnkgPT09IERiVHlwZUNhdGVnb3J5LnVuaW9uKSB7XG4gICAgICAgICAgICAvLyBnZW5KU0ZpbHRlcnNGb3JVbmlvblZhcmlhbnRzKHR5cGUsIGpzTmFtZXMpO1xuICAgICAgICB9XG4gICAgICAgIGdlbkpTRmlsdGVyc0ZvckFycmF5RmllbGRzKHR5cGUsIGpzTmFtZXMpO1xuICAgICAgICBnZW5KU1N0cnVjdEZpbHRlcih0eXBlKTtcbiAgICAgICAgaWYgKHR5cGUuY2F0ZWdvcnkgPT09IERiVHlwZUNhdGVnb3J5LnVuaW9uKSB7XG4gICAgICAgICAgICBnZW5KU1VuaW9uUmVzb2x2ZXIodHlwZSk7XG4gICAgICAgIH1cblxuXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2VuZXJhdGUgY3VzdG9tIHJlc29sdmVycyBmb3IgdHlwZXMgd2l0aDpcbiAgICAgKiAtIGlkIGZpZWxkXG4gICAgICogLSBqb2luIGZpZWxkc1xuICAgICAqIC0gdTY0IGFuZCBoaWdoZXIgZmllbGRzXG4gICAgICogQHBhcmFtIHR5cGVcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBnZW5KU0N1c3RvbVJlc29sdmVycyh0eXBlOiBEYlR5cGUpIHtcbiAgICAgICAgY29uc3Qgam9pbkZpZWxkcyA9IHR5cGUuZmllbGRzLmZpbHRlcih4ID0+ICEheC5qb2luKTtcbiAgICAgICAgY29uc3QgYmlnVUludEZpZWxkcyA9IHR5cGUuZmllbGRzLmZpbHRlcigoeDogRGJGaWVsZCkgPT4gKHgudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDY0KSB8fCAoeC50eXBlID09PSBzY2FsYXJUeXBlcy51aW50MTAyNCkpO1xuICAgICAgICBjb25zdCBlbnVtRmllbGRzID0gdHlwZS5maWVsZHMuZmlsdGVyKHggPT4geC5lbnVtRGVmKTtcbiAgICAgICAgY29uc3QgY3VzdG9tUmVzb2x2ZXJSZXF1aXJlZCA9IHR5cGUuY29sbGVjdGlvblxuICAgICAgICAgICAgfHwgam9pbkZpZWxkcy5sZW5ndGggPiAwXG4gICAgICAgICAgICB8fCBiaWdVSW50RmllbGRzLmxlbmd0aCA+IDBcbiAgICAgICAgICAgIHx8IGVudW1GaWVsZHMubGVuZ3RoID4gMDtcbiAgICAgICAgaWYgKCFjdXN0b21SZXNvbHZlclJlcXVpcmVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAganMud3JpdGVMbihgICAgICAgICAke3R5cGUubmFtZX06IHtgKTtcbiAgICAgICAgaWYgKHR5cGUuY29sbGVjdGlvbikge1xuICAgICAgICAgICAganMud3JpdGVMbignICAgICAgICAgICAgaWQocGFyZW50KSB7Jyk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKCcgICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5OycpO1xuICAgICAgICAgICAganMud3JpdGVMbignICAgICAgICAgICAgfSwnKTtcbiAgICAgICAgfVxuICAgICAgICBqb2luRmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBvbkZpZWxkID0gdHlwZS5maWVsZHMuZmluZCh4ID0+IHgubmFtZSA9PT0gKGZpZWxkLmpvaW4gJiYgZmllbGQuam9pbi5vbikgfHwgJycpO1xuICAgICAgICAgICAgaWYgKCFvbkZpZWxkKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgJ0pvaW4gb24gZmllbGQgZG9lcyBub3QgZXhpc3QuJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGNvbGxlY3Rpb24gPSBmaWVsZC50eXBlLmNvbGxlY3Rpb247XG4gICAgICAgICAgICBpZiAoIWNvbGxlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICB0aHJvdyAnSm9pbmVkIHR5cGUgaXMgbm90IGEgY29sbGVjdGlvbi4nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgJHtmaWVsZC5uYW1lfShwYXJlbnQpIHtgKTtcbiAgICAgICAgICAgIGlmIChmaWVsZC5hcnJheURlcHRoID09PSAwKSB7XG4gICAgICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgICAgIHJldHVybiBkYi5mZXRjaERvY0J5S2V5KGRiLiR7Y29sbGVjdGlvbn0sIHBhcmVudC4ke29uRmllbGQubmFtZX0pO2ApO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC5hcnJheURlcHRoID09PSAxKSB7XG4gICAgICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgICAgIHJldHVybiBkYi5mZXRjaERvY3NCeUtleXMoZGIuJHtjb2xsZWN0aW9ufSwgcGFyZW50LiR7b25GaWVsZC5uYW1lfSk7YCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93ICdKb2lucyBvbiBhIG5lc3RlZCBhcnJheXMgZG9lcyBub3Qgc3VwcG9ydGVkLic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICB9LGApO1xuICAgICAgICB9KTtcbiAgICAgICAgYmlnVUludEZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcHJlZml4TGVuZ3RoID0gZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDY0ID8gMSA6IDI7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAke2ZpZWxkLm5hbWV9KHBhcmVudCkge2ApO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgke3ByZWZpeExlbmd0aH0sIHBhcmVudC4ke2ZpZWxkLm5hbWV9KTtgKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgIH0sYCk7XG4gICAgICAgIH0pO1xuICAgICAgICBlbnVtRmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBlbnVtRGVmID0gZmllbGQuZW51bURlZjtcbiAgICAgICAgICAgIGlmIChlbnVtRGVmKSB7XG4gICAgICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgJHtmaWVsZC5uYW1lfV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCcke2ZpZWxkLm5hbWV9JywgJHtzdHJpbmdpZnlFbnVtVmFsdWVzKGVudW1EZWYudmFsdWVzKX0pLGApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAganMud3JpdGVMbihgICAgICAgICB9LGApO1xuICAgIH1cblxuXG4gICAgZnVuY3Rpb24gZ2VuSlNUeXBlUmVzb2x2ZXJzRm9yVW5pb24odHlwZTogRGJUeXBlKSB7XG4gICAgICAgIGlmICh0eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS51bmlvbikge1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAke3R5cGUubmFtZX06ICR7dHlwZS5uYW1lfVJlc29sdmVyLGApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuZXJhdGUodHlwZXM6IERiVHlwZVtdKSB7XG5cbiAgICAgICAgLy8gUUxcblxuICAgICAgICBbJ1N0cmluZycsICdCb29sZWFuJywgJ0ludCcsICdGbG9hdCddLmZvckVhY2goZ2VuUUxTY2FsYXJUeXBlc0ZpbHRlcik7XG4gICAgICAgIGdlblFMRW51bVR5cGVzKCk7XG4gICAgICAgIHR5cGVzLmZvckVhY2godHlwZSA9PiBnZW5RTFR5cGVEZWNsYXJhdGlvbih0eXBlKSk7XG4gICAgICAgIGNvbnN0IHFsQXJyYXlGaWx0ZXJzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgICAgIHR5cGVzLmZvckVhY2godHlwZSA9PiBnZW5RTEZpbHRlcih0eXBlLCBxbEFycmF5RmlsdGVycykpO1xuXG4gICAgICAgIGNvbnN0IGNvbGxlY3Rpb25zID0gdHlwZXMuZmlsdGVyKHQgPT4gISF0LmNvbGxlY3Rpb24pO1xuICAgICAgICBnZW5RTFF1ZXJpZXMoY29sbGVjdGlvbnMpO1xuICAgICAgICBnZW5RTFN1YnNjcmlwdGlvbnMoY29sbGVjdGlvbnMpO1xuICAgICAgICBnZW5RTE11dGF0aW9uKCk7XG5cbiAgICAgICAgLy8gSlNcblxuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBjb25zdCB7XG4gICAgICAgICAgICBzY2FsYXIsXG4gICAgICAgICAgICBiaWdVSW50MSxcbiAgICAgICAgICAgIGJpZ1VJbnQyLFxuICAgICAgICAgICAgcmVzb2x2ZUJpZ1VJbnQsXG4gICAgICAgICAgICBzdHJ1Y3QsXG4gICAgICAgICAgICBhcnJheSxcbiAgICAgICAgICAgIGpvaW4sXG4gICAgICAgICAgICBqb2luQXJyYXksXG4gICAgICAgICAgICBlbnVtTmFtZSxcbiAgICAgICAgICAgIGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIsXG4gICAgICAgIH0gPSByZXF1aXJlKCcuL3EtdHlwZXMuanMnKTtcbiAgICAgICAgYCk7XG4gICAgICAgIGNvbnN0IGpzQXJyYXlGaWx0ZXJzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgICAgIHR5cGVzLmZvckVhY2godHlwZSA9PiBnZW5KU0ZpbHRlcih0eXBlLCBqc0FycmF5RmlsdGVycykpO1xuXG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIGZ1bmN0aW9uIGNyZWF0ZVJlc29sdmVycyhkYiwgcG9zdFJlcXVlc3RzLCBpbmZvKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICBgKTtcbiAgICAgICAgdHlwZXMuZm9yRWFjaCgodHlwZSkgPT4ge1xuICAgICAgICAgICAgZ2VuSlNDdXN0b21SZXNvbHZlcnModHlwZSk7XG4gICAgICAgICAgICBnZW5KU1R5cGVSZXNvbHZlcnNGb3JVbmlvbih0eXBlKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGpzLndyaXRlTG4oJyAgICAgICAgUXVlcnk6IHsnKTtcbiAgICAgICAganMud3JpdGVMbignICAgICAgICAgICAgaW5mbywnKTtcbiAgICAgICAgY29sbGVjdGlvbnMuZm9yRWFjaCgodHlwZSkgPT4ge1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgJHt0eXBlLmNvbGxlY3Rpb24gfHwgJyd9OiBkYi5jb2xsZWN0aW9uUXVlcnkoZGIuJHt0eXBlLmNvbGxlY3Rpb24gfHwgJyd9LCAke3R5cGUubmFtZX0pLGApXG4gICAgICAgIH0pO1xuICAgICAgICBqcy53cml0ZUxuKCcgICAgICAgIH0sJyk7XG4gICAgICAgIGpzLndyaXRlTG4oJyAgICAgICAgU3Vic2NyaXB0aW9uOiB7Jyk7XG4gICAgICAgIGNvbGxlY3Rpb25zLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICR7dHlwZS5jb2xsZWN0aW9uIHx8ICcnfTogZGIuY29sbGVjdGlvblN1YnNjcmlwdGlvbihkYi4ke3R5cGUuY29sbGVjdGlvbiB8fCAnJ30sICR7dHlwZS5uYW1lfSksYClcbiAgICAgICAgfSk7XG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBNdXRhdGlvbjoge1xuICAgICAgICAgICAgICAgICAgICBwb3N0UmVxdWVzdHMsXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgYCk7XG5cbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgICAgICAgICBjcmVhdGVSZXNvbHZlcnMsXG4gICAgICAgIGApO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKHR5cGUgPT4ganMud3JpdGVMbihgICAgICR7dHlwZS5uYW1lfSxgKSk7XG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIH07XG4gICAgICAgIGApO1xuICAgIH1cblxuICAgIGNvbnN0IHNjaGVtYSA9IHBhcnNlVHlwZURlZihzY2hlbWFEZWYpO1xuXG4gICAgaWYgKHNjaGVtYS5jbGFzcykge1xuICAgICAgICBwYXJzZURiVHlwZXMoc2NoZW1hLmNsYXNzLnR5cGVzKTtcbiAgICAgICAgZ2VuZXJhdGUoZGJUeXBlcyk7XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBlOiBJbnRFbnVtRGVmIG9mIGVudW1UeXBlcy52YWx1ZXMoKSkge1xuICAgICAgICBjb25zb2xlLmxvZyhgZXhwb3J0IGNvbnN0IFEke2UubmFtZX0gPSB7YCk7XG4gICAgICAgIGNvbnNvbGUubG9nKE9iamVjdC5lbnRyaWVzKGUudmFsdWVzKS5tYXAoKFtuYW1lLCB2YWx1ZV0pID0+IHtcbiAgICAgICAgICAgIHJldHVybiBgICAgICR7bmFtZX06ICR7KHZhbHVlOiBhbnkpfSxgO1xuICAgICAgICB9KS5qb2luKCdcXG4nKSk7XG4gICAgICAgIGNvbnNvbGUubG9nKGB9O1xcbmApO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIHFsOiBxbC5nZW5lcmF0ZWQoKSxcbiAgICAgICAganM6IGpzLmdlbmVyYXRlZCgpLFxuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgbWFpbjtcbiJdfQ==