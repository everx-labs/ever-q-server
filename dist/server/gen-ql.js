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
    ql.writeBlockLn("\n        enum QueryOrderByDirection {\n            ASC\n            DESC\n        }\n\n        input QueryOrderBy {\n            path: String\n            direction: QueryOrderByDirection\n        }\n\n        type Query {\n        ");
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
    ql.writeLn('');
    ql.writeLn('type Mutation {');
    ql.writeLn('\tpostMessage(id: String, body: String): Boolean');
    ql.writeLn('}');
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
    js.writeBlockLn("\n        function createResolvers(db) {\n            return {\n        ");
    types.forEach(function (type) {
      genJSCustomResolvers(type);
      genJSTypeResolversForUnion(type);
    });
    js.writeLn('        Query: {');
    collections.forEach(function (type) {
      js.writeLn("            ".concat(type.collection || '', ": db.collectionQuery(db.").concat(type.collection || '', ", ").concat(type.name, "),"));
    });
    js.writeLn('        },');
    js.writeLn('        Subscription: {');
    collections.forEach(function (type) {
      js.writeLn("            ".concat(type.collection || '', ": db.collectionSubscription(db.").concat(type.collection || '', ", ").concat(type.name, "),"));
    });
    js.writeBlockLn("\n                },\n                Mutation: {\n                }\n            }\n        }\n\n        ");
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9nZW4tcWwuanMiXSwibmFtZXMiOlsiRGJUeXBlQ2F0ZWdvcnkiLCJ1bnJlc29sdmVkIiwic2NhbGFyIiwidW5pb24iLCJzdHJ1Y3QiLCJzY2FsYXJUeXBlIiwibmFtZSIsImNhdGVnb3J5IiwiZmllbGRzIiwic2NhbGFyVHlwZXMiLCJ1aW50NjQiLCJ1aW50MTAyNCIsInN0cmluZyIsInVucmVzb2x2ZWRUeXBlIiwiaXNMb3dlckNhc2VkIiwicyIsImwiLCJ0b0xvd2VyQ2FzZSIsInUiLCJ0b1VwcGVyQ2FzZSIsImlzVXBwZXJDYXNlZCIsInRvQWxsQ2FwcyIsInJlc3VsdCIsImkiLCJsZW5ndGgiLCJ0b0VudW1TdHlsZSIsInN1YnN0ciIsInN0cmluZ2lmeUVudW1WYWx1ZXMiLCJ2YWx1ZXMiLCJPYmplY3QiLCJlbnRyaWVzIiwibWFwIiwidmFsdWUiLCJqb2luIiwibWFpbiIsInNjaGVtYURlZiIsImRiVHlwZXMiLCJsYXN0UmVwb3J0ZWRUeXBlIiwiZW51bVR5cGVzIiwiTWFwIiwicmVwb3J0VHlwZSIsImZpZWxkIiwidHlwZSIsImNvbnNvbGUiLCJsb2ciLCJwYXJzZURiRmllbGQiLCJ0eXBlTmFtZSIsInNjaGVtYUZpZWxkIiwic2NoZW1hVHlwZSIsImFycmF5RGVwdGgiLCJhcnJheSIsImVudW1EZWYiLCJfIiwic2V0IiwicmVmIiwiYm9vbCIsInVuc2lnbmVkIiwic2l6ZSIsIkVycm9yIiwiSlNPTiIsInN0cmluZ2lmeSIsInByb2Nlc3MiLCJleGl0IiwidW53cmFwQXJyYXlzIiwicGFyc2VEYlR5cGUiLCJjb2xsZWN0aW9uIiwicHVzaCIsImZvckVhY2giLCJ1bndyYXBwZWQiLCJvd25UeXBlIiwicGFyc2VEYlR5cGVzIiwidHlwZXMiLCJyZXNvbHZpbmciLCJTZXQiLCJyZXNvbHZlZCIsIm9yZGVyZWRSZXNvbHZlZCIsInQiLCJyZXNvbHZlVHlwZSIsImhhcyIsImFkZCIsImdldCIsInFsIiwiV3JpdGVyIiwianMiLCJ1bmlvblZhcmlhbnRUeXBlIiwidmFyaWFudCIsImdlblFMVHlwZURlY2xhcmF0aW9uc0ZvclVuaW9uVmFyaWFudHMiLCJ3cml0ZUJsb2NrTG4iLCJnZW5RTEVudW1UeXBlcyIsIndyaXRlTG4iLCJrZXlzIiwiZ2VuUUxUeXBlRGVjbGFyYXRpb24iLCJ0eXBlRGVjbGFyYXRpb24iLCJyZXBlYXQiLCJwcmV2ZW50VHdpY2UiLCJuYW1lcyIsIndvcmsiLCJnZW5RTEZpbHRlcnNGb3JBcnJheUZpZWxkcyIsInFsTmFtZXMiLCJpdGVtVHlwZU5hbWUiLCJmaWx0ZXJOYW1lIiwib3AiLCJnZW5RTEZpbHRlcnNGb3JFbnVtTmFtZUZpZWxkcyIsImdlblFMU2NhbGFyVHlwZXNGaWx0ZXIiLCJnZW5RTEZpbHRlciIsImdlblFMUXVlcmllcyIsImdlblFMU3Vic2NyaXB0aW9ucyIsImdlblFMTXV0YXRpb24iLCJnZXRTY2FsYXJSZXNvbHZlck5hbWUiLCJnZW5KU0ZpbHRlcnNGb3JBcnJheUZpZWxkcyIsImpzTmFtZXMiLCJpdGVtUmVzb2x2ZXJOYW1lIiwiZ2VuSlNTdHJ1Y3RGaWx0ZXIiLCJvbiIsImdlbkpTVW5pb25SZXNvbHZlciIsImdlbkpTRmlsdGVyIiwiZ2VuSlNDdXN0b21SZXNvbHZlcnMiLCJqb2luRmllbGRzIiwiZmlsdGVyIiwieCIsImJpZ1VJbnRGaWVsZHMiLCJlbnVtRmllbGRzIiwiY3VzdG9tUmVzb2x2ZXJSZXF1aXJlZCIsIm9uRmllbGQiLCJmaW5kIiwicHJlZml4TGVuZ3RoIiwiZ2VuSlNUeXBlUmVzb2x2ZXJzRm9yVW5pb24iLCJnZW5lcmF0ZSIsInFsQXJyYXlGaWx0ZXJzIiwiY29sbGVjdGlvbnMiLCJqc0FycmF5RmlsdGVycyIsInNjaGVtYSIsImUiLCJnZW5lcmF0ZWQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBRUE7O0FBRUE7O0FBRUEsSUFBTUEsY0FBYyxHQUFHO0FBQ25CQyxFQUFBQSxVQUFVLEVBQUUsWUFETztBQUVuQkMsRUFBQUEsTUFBTSxFQUFFLFFBRlc7QUFHbkJD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QUksQ0FBQ3BDLElBQXZCLE9BQUo7QUFBQSxLQUFsQjtBQUNBNkUsSUFBQUEsRUFBRSxDQUFDSSxZQUFIO0FBR0g7O0FBRUQsTUFBTTRDLE1BQU0sR0FBRywwQkFBYWhHLFNBQWIsQ0FBZjs7QUFFQSxNQUFJZ0csTUFBTSxTQUFWLEVBQWtCO0FBQ2Q3RCxJQUFBQSxZQUFZLENBQUM2RCxNQUFNLFNBQU4sQ0FBYTVELEtBQWQsQ0FBWjtBQUNBd0QsSUFBQUEsUUFBUSxDQUFDM0YsT0FBRCxDQUFSO0FBQ0g7O0FBeGpCNkI7QUFBQTtBQUFBOztBQUFBO0FBMGpCOUIsMEJBQTRCRSxTQUFTLENBQUNWLE1BQVYsRUFBNUIsbUlBQWdEO0FBQUEsVUFBckN3RyxFQUFxQztBQUM1Q3pGLE1BQUFBLE9BQU8sQ0FBQ0MsR0FBUix5QkFBNkJ3RixFQUFDLENBQUM5SCxJQUEvQjtBQUNBcUMsTUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVlmLE1BQU0sQ0FBQ0MsT0FBUCxDQUFlc0csRUFBQyxDQUFDeEcsTUFBakIsRUFBeUJHLEdBQXpCLENBQTZCLGlCQUFtQjtBQUFBO0FBQUEsWUFBakJ6QixJQUFpQjtBQUFBLFlBQVgwQixLQUFXOztBQUN4RCw2QkFBYzFCLElBQWQsZUFBd0IwQixLQUF4QjtBQUNILE9BRlcsRUFFVEMsSUFGUyxDQUVKLElBRkksQ0FBWjtBQUdBVSxNQUFBQSxPQUFPLENBQUNDLEdBQVI7QUFDSDtBQWhrQjZCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7O0FBa2tCOUIsU0FBTztBQUNIcUMsSUFBQUEsRUFBRSxFQUFFQSxFQUFFLENBQUNvRCxTQUFILEVBREQ7QUFFSGxELElBQUFBLEVBQUUsRUFBRUEsRUFBRSxDQUFDa0QsU0FBSDtBQUZELEdBQVA7QUFJSDs7ZUFFY25HLEkiLCJzb3VyY2VzQ29udGVudCI6WyIvL0BmbG93XG5cbmltcG9ydCB7IG1ha2VGaWVsZFR5cGVOYW1lLCBXcml0ZXIgfSBmcm9tICd0b24tbGFicy1kZXYtb3BzL2Rpc3Qvc3JjL2dlbi5qcyc7XG5pbXBvcnQgdHlwZSB7IFNjaGVtYU1lbWJlciwgU2NoZW1hVHlwZSwgVHlwZURlZiB9IGZyb20gJ3Rvbi1sYWJzLWRldi1vcHMvc3JjL3NjaGVtYS5qcyc7XG5pbXBvcnQgeyBwYXJzZVR5cGVEZWYgfSBmcm9tICd0b24tbGFicy1kZXYtb3BzL2Rpc3Qvc3JjL3NjaGVtYS5qcyc7XG5cbmNvbnN0IERiVHlwZUNhdGVnb3J5ID0ge1xuICAgIHVucmVzb2x2ZWQ6ICd1bnJlc29sdmVkJyxcbiAgICBzY2FsYXI6ICdzY2FsYXInLFxuICAgIHVuaW9uOiAndW5pb24nLFxuICAgIHN0cnVjdDogJ3N0cnVjdCcsXG59O1xuXG50eXBlIERiSm9pbiA9IHtcbiAgICBjb2xsZWN0aW9uOiBzdHJpbmcsXG4gICAgb246IHN0cmluZyxcbn1cblxudHlwZSBEYlR5cGUgPSB7XG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGZpZWxkczogRGJGaWVsZFtdLFxuICAgIGNhdGVnb3J5OiAndW5yZXNvbHZlZCcgfCAnc2NhbGFyJyB8ICd1bmlvbicgfCAnc3RydWN0JyxcbiAgICBjb2xsZWN0aW9uPzogc3RyaW5nLFxufVxuXG50eXBlIEludEVudW1EZWYgPSB7XG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHZhbHVlczogeyBbc3RyaW5nXTogbnVtYmVyIH0sXG59XG5cbnR5cGUgRGJGaWVsZCA9IHtcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgdHlwZTogRGJUeXBlLFxuICAgIGFycmF5RGVwdGg6IG51bWJlcixcbiAgICBqb2luPzogRGJKb2luLFxuICAgIGVudW1EZWY/OiBJbnRFbnVtRGVmLFxufVxuXG5mdW5jdGlvbiBzY2FsYXJUeXBlKG5hbWU6IHN0cmluZyk6IERiVHlwZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgbmFtZSxcbiAgICAgICAgY2F0ZWdvcnk6IERiVHlwZUNhdGVnb3J5LnNjYWxhcixcbiAgICAgICAgZmllbGRzOiBbXVxuICAgIH1cbn1cblxuY29uc3Qgc2NhbGFyVHlwZXMgPSB7XG4gICAgaW50OiBzY2FsYXJUeXBlKCdJbnQnKSxcbiAgICB1aW50NjQ6IHNjYWxhclR5cGUoJ1N0cmluZycpLFxuICAgIHVpbnQxMDI0OiBzY2FsYXJUeXBlKCdTdHJpbmcnKSxcbiAgICBmbG9hdDogc2NhbGFyVHlwZSgnRmxvYXQnKSxcbiAgICBib29sZWFuOiBzY2FsYXJUeXBlKCdCb29sZWFuJyksXG4gICAgc3RyaW5nOiBzY2FsYXJUeXBlKCdTdHJpbmcnKSxcbn07XG5cbmZ1bmN0aW9uIHVucmVzb2x2ZWRUeXBlKG5hbWU6IHN0cmluZyk6IERiVHlwZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgbmFtZSxcbiAgICAgICAgY2F0ZWdvcnk6IERiVHlwZUNhdGVnb3J5LnVucmVzb2x2ZWQsXG4gICAgICAgIGZpZWxkczogW10sXG4gICAgfVxufVxuXG5mdW5jdGlvbiBpc0xvd2VyQ2FzZWQoczogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgY29uc3QgbCA9IHMudG9Mb3dlckNhc2UoKTtcbiAgICBjb25zdCB1ID0gcy50b1VwcGVyQ2FzZSgpO1xuICAgIHJldHVybiAodSAhPT0gbCkgJiYgKHMgPT09IGwpO1xufVxuXG5mdW5jdGlvbiBpc1VwcGVyQ2FzZWQoczogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgY29uc3QgbCA9IHMudG9Mb3dlckNhc2UoKTtcbiAgICBjb25zdCB1ID0gcy50b1VwcGVyQ2FzZSgpO1xuICAgIHJldHVybiAodSAhPT0gbCkgJiYgKHMgPT09IHUpO1xufVxuXG5mdW5jdGlvbiB0b0FsbENhcHMoczogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBsZXQgcmVzdWx0ID0gJyc7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGlmICgoaSA+IDApICYmIChzW2kgLSAxXSAhPT0gJ18nKSAmJiBpc0xvd2VyQ2FzZWQoc1tpIC0gMV0pICYmIGlzVXBwZXJDYXNlZChzW2ldKSkge1xuICAgICAgICAgICAgcmVzdWx0ICs9ICdfJztcbiAgICAgICAgfVxuICAgICAgICByZXN1bHQgKz0gc1tpXTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdC50b1VwcGVyQ2FzZSgpO1xufVxuXG5mdW5jdGlvbiB0b0VudW1TdHlsZShzOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiBgJHtzLnN1YnN0cigwLCAxKS50b1VwcGVyQ2FzZSgpfSR7cy5zdWJzdHIoMSl9YDtcbn1cblxuZnVuY3Rpb24gc3RyaW5naWZ5RW51bVZhbHVlcyh2YWx1ZXM6IHsgW3N0cmluZ106IG51bWJlciB9KTogc3RyaW5nIHtcbiAgICBjb25zdCBmaWVsZHMgPSBPYmplY3QuZW50cmllcyh2YWx1ZXMpLm1hcCgoW25hbWUsIHZhbHVlXSkgPT4ge1xuICAgICAgICByZXR1cm4gYCR7dG9FbnVtU3R5bGUobmFtZSl9OiAkeyh2YWx1ZTogYW55KX1gO1xuICAgIH0pO1xuICAgIHJldHVybiBgeyAke2ZpZWxkcy5qb2luKCcsICcpfSB9YDtcbn1cblxuZnVuY3Rpb24gbWFpbihzY2hlbWFEZWY6IFR5cGVEZWYpIHtcblxuICAgIGxldCBkYlR5cGVzOiBEYlR5cGVbXSA9IFtdO1xuICAgIGxldCBsYXN0UmVwb3J0ZWRUeXBlOiBzdHJpbmcgPSAnJztcbiAgICBsZXQgZW51bVR5cGVzOiBNYXA8c3RyaW5nLCBJbnRFbnVtRGVmPiA9IG5ldyBNYXAoKTtcblxuICAgIGZ1bmN0aW9uIHJlcG9ydFR5cGUobmFtZTogc3RyaW5nLCBmaWVsZDogc3RyaW5nLCB0eXBlOiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKG5hbWUgIT09IGxhc3RSZXBvcnRlZFR5cGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKG5hbWUpO1xuICAgICAgICAgICAgbGFzdFJlcG9ydGVkVHlwZSA9IG5hbWU7XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5sb2coYCAgICAke2ZpZWxkfTogJHt0eXBlfWApO1xuXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VEYkZpZWxkKFxuICAgICAgICB0eXBlTmFtZTogc3RyaW5nLFxuICAgICAgICBzY2hlbWFGaWVsZDogU2NoZW1hTWVtYmVyPFNjaGVtYVR5cGU+LFxuICAgICk6IERiRmllbGQge1xuICAgICAgICBsZXQgc2NoZW1hVHlwZSA9IHNjaGVtYUZpZWxkO1xuICAgICAgICBjb25zdCBmaWVsZDogRGJGaWVsZCA9IHtcbiAgICAgICAgICAgIG5hbWU6IHNjaGVtYUZpZWxkLm5hbWUsXG4gICAgICAgICAgICBhcnJheURlcHRoOiAwLFxuICAgICAgICAgICAgdHlwZTogc2NhbGFyVHlwZXMuc3RyaW5nLFxuICAgICAgICB9O1xuICAgICAgICB3aGlsZSAoc2NoZW1hVHlwZS5hcnJheSkge1xuICAgICAgICAgICAgZmllbGQuYXJyYXlEZXB0aCArPSAxO1xuICAgICAgICAgICAgc2NoZW1hVHlwZSA9IHNjaGVtYVR5cGUuYXJyYXk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZW51bURlZjogP0ludEVudW1EZWYgPSAoc2NoZW1hVHlwZS5fICYmIHNjaGVtYVR5cGUuXy5lbnVtKSB8fCBudWxsO1xuICAgICAgICBpZiAoZW51bURlZikge1xuICAgICAgICAgICAgZmllbGQuZW51bURlZiA9IGVudW1EZWY7XG4gICAgICAgICAgICBlbnVtVHlwZXMuc2V0KGVudW1EZWYubmFtZSwgZW51bURlZik7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgam9pbiA9IChzY2hlbWFUeXBlOiBhbnkpLl8uam9pbjtcbiAgICAgICAgaWYgKGpvaW4pIHtcbiAgICAgICAgICAgIGZpZWxkLmpvaW4gPSBqb2luO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzY2hlbWFUeXBlLnVuaW9uIHx8IHNjaGVtYVR5cGUuc3RydWN0KSB7XG4gICAgICAgICAgICBmaWVsZC50eXBlID0gdW5yZXNvbHZlZFR5cGUobWFrZUZpZWxkVHlwZU5hbWUodHlwZU5hbWUsIHNjaGVtYUZpZWxkLm5hbWUpKTtcbiAgICAgICAgfSBlbHNlIGlmIChzY2hlbWFUeXBlLnJlZikge1xuICAgICAgICAgICAgZmllbGQudHlwZSA9IHVucmVzb2x2ZWRUeXBlKHNjaGVtYVR5cGUucmVmLm5hbWUpO1xuICAgICAgICB9IGVsc2UgaWYgKHNjaGVtYVR5cGUuYm9vbCkge1xuICAgICAgICAgICAgZmllbGQudHlwZSA9IHNjYWxhclR5cGVzLmJvb2xlYW47XG4gICAgICAgIH0gZWxzZSBpZiAoc2NoZW1hVHlwZS5pbnQpIHtcbiAgICAgICAgICAgIGNvbnN0IHVuc2lnbmVkOiBib29sZWFuID0gKHNjaGVtYVR5cGUuaW50ICYmIHNjaGVtYVR5cGUuaW50LnVuc2lnbmVkKSB8fCBmYWxzZTtcbiAgICAgICAgICAgIGNvbnN0IHNpemU6IG51bWJlciA9IChzY2hlbWFUeXBlLmludCAmJiBzY2hlbWFUeXBlLmludC5zaXplKSB8fCAzMjtcbiAgICAgICAgICAgIGlmICh1bnNpZ25lZCkge1xuICAgICAgICAgICAgICAgIGlmIChzaXplID49IDEyOCkge1xuICAgICAgICAgICAgICAgICAgICByZXBvcnRUeXBlKHR5cGVOYW1lLCBmaWVsZC5uYW1lLCAndTEwMjQnKTtcbiAgICAgICAgICAgICAgICAgICAgZmllbGQudHlwZSA9IHNjYWxhclR5cGVzLnVpbnQxMDI0O1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc2l6ZSA+PSA2NCkge1xuICAgICAgICAgICAgICAgICAgICByZXBvcnRUeXBlKHR5cGVOYW1lLCBmaWVsZC5uYW1lLCAndTY0Jyk7XG4gICAgICAgICAgICAgICAgICAgIGZpZWxkLnR5cGUgPSBzY2FsYXJUeXBlcy51aW50NjQ7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzaXplID49IDMyKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcG9ydFR5cGUodHlwZU5hbWUsIGZpZWxkLm5hbWUsICd1MzInKTtcbiAgICAgICAgICAgICAgICAgICAgZmllbGQudHlwZSA9IHNjYWxhclR5cGVzLmZsb2F0O1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcG9ydFR5cGUodHlwZU5hbWUsIGZpZWxkLm5hbWUsIGB1JHtzaXplfWApO1xuICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlID0gc2NhbGFyVHlwZXMuaW50O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKHNpemUgPiAzMikge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludGVnZXIgdHlwZSB3aXRoIHNpemUgJHtzaXplfSBiaXQgZG9lcyBub3Qgc3VwcG9ydGVkYCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVwb3J0VHlwZSh0eXBlTmFtZSwgZmllbGQubmFtZSwgJ2kzMicpO1xuICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlID0gc2NhbGFyVHlwZXMuaW50O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChzY2hlbWFUeXBlLmZsb2F0KSB7XG4gICAgICAgICAgICByZXBvcnRUeXBlKHR5cGVOYW1lLCBmaWVsZC5uYW1lLCAnZmxvYXQnKTtcbiAgICAgICAgICAgIGZpZWxkLnR5cGUgPSBzY2FsYXJUeXBlcy5mbG9hdDtcbiAgICAgICAgfSBlbHNlIGlmIChzY2hlbWFUeXBlLnN0cmluZykge1xuICAgICAgICAgICAgZmllbGQudHlwZSA9IHNjYWxhclR5cGVzLnN0cmluZztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZpZWxkLnR5cGUgPSBzY2FsYXJUeXBlcy5zdHJpbmc7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnPj4+IEludmFsaWQgZmllbGQgdHlwZTogJywgSlNPTi5zdHJpbmdpZnkoc2NoZW1hVHlwZSkpO1xuICAgICAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmaWVsZDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB1bndyYXBBcnJheXModHlwZTogU2NoZW1hVHlwZSk6IFNjaGVtYVR5cGUge1xuICAgICAgICBpZiAodHlwZS5hcnJheSkge1xuICAgICAgICAgICAgcmV0dXJuIHVud3JhcEFycmF5cyh0eXBlLmFycmF5KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHlwZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZURiVHlwZShcbiAgICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgICBzY2hlbWFUeXBlOiBTY2hlbWFUeXBlXG4gICAgKSB7XG4gICAgICAgIGNvbnN0IHN0cnVjdCA9IHNjaGVtYVR5cGUudW5pb24gfHwgc2NoZW1hVHlwZS5zdHJ1Y3Q7XG4gICAgICAgIGlmICghc3RydWN0KSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnPj4+JywgYD8/ICR7bmFtZX06ICR7SlNPTi5zdHJpbmdpZnkoc2NoZW1hVHlwZSkuc3Vic3RyKDAsIDIwMCl9YCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdHlwZTogRGJUeXBlID0ge1xuICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgIGNhdGVnb3J5OiBzY2hlbWFUeXBlLnVuaW9uID8gRGJUeXBlQ2F0ZWdvcnkudW5pb24gOiBEYlR5cGVDYXRlZ29yeS5zdHJ1Y3QsXG4gICAgICAgICAgICBmaWVsZHM6IFtdLFxuICAgICAgICAgICAgY29sbGVjdGlvbjogKHNjaGVtYVR5cGU6IGFueSkuXy5jb2xsZWN0aW9uLFxuICAgICAgICB9O1xuXG4gICAgICAgIGlmICh0eXBlLmNvbGxlY3Rpb24pIHtcbiAgICAgICAgICAgIHR5cGUuZmllbGRzLnB1c2goe1xuICAgICAgICAgICAgICAgIG5hbWU6ICdpZCcsXG4gICAgICAgICAgICAgICAgYXJyYXlEZXB0aDogMCxcbiAgICAgICAgICAgICAgICB0eXBlOiBzY2FsYXJUeXBlcy5zdHJpbmcsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBzdHJ1Y3QuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIHR5cGUuZmllbGRzLnB1c2gocGFyc2VEYkZpZWxkKG5hbWUsIGZpZWxkKSk7XG4gICAgICAgICAgICBjb25zdCB1bndyYXBwZWQgPSB1bndyYXBBcnJheXMoZmllbGQpO1xuICAgICAgICAgICAgY29uc3Qgb3duVHlwZSA9ICh1bndyYXBwZWQuc3RydWN0IHx8IHVud3JhcHBlZC51bmlvbikgPyB1bndyYXBwZWQgOiBudWxsO1xuICAgICAgICAgICAgaWYgKG93blR5cGUpIHtcbiAgICAgICAgICAgICAgICBwYXJzZURiVHlwZShtYWtlRmllbGRUeXBlTmFtZShuYW1lLCBmaWVsZC5uYW1lKSwgb3duVHlwZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBkYlR5cGVzLnB1c2godHlwZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VEYlR5cGVzKHR5cGVzOiBTY2hlbWFNZW1iZXI8U2NoZW1hVHlwZT5bXSkge1xuICAgICAgICB0eXBlcy5mb3JFYWNoKCh0eXBlOiBTY2hlbWFNZW1iZXI8U2NoZW1hVHlwZT4pID0+IHtcbiAgICAgICAgICAgIHBhcnNlRGJUeXBlKHR5cGUubmFtZSwgdHlwZSk7XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCB1bnJlc29sdmVkOiBNYXA8c3RyaW5nLCBEYlR5cGU+ID0gbmV3IE1hcDxzdHJpbmcsIERiVHlwZT4oKTtcbiAgICAgICAgY29uc3QgcmVzb2x2aW5nOiBTZXQ8c3RyaW5nPiA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgICAgICBjb25zdCByZXNvbHZlZDogTWFwPHN0cmluZywgRGJUeXBlPiA9IG5ldyBNYXA8c3RyaW5nLCBEYlR5cGU+KCk7XG4gICAgICAgIGNvbnN0IG9yZGVyZWRSZXNvbHZlZDogRGJUeXBlW10gPSBbXTtcbiAgICAgICAgZGJUeXBlcy5mb3JFYWNoKHQgPT4gdW5yZXNvbHZlZC5zZXQodC5uYW1lLCB0KSk7XG4gICAgICAgIGNvbnN0IHJlc29sdmVUeXBlID0gKHR5cGU6IERiVHlwZSkgPT4ge1xuICAgICAgICAgICAgaWYgKHJlc29sdmVkLmhhcyh0eXBlLm5hbWUpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHJlc29sdmluZy5oYXModHlwZS5uYW1lKSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+Pj4nLCBgQ2lyY3VsYXIgcmVmZXJlbmNlIHRvIHR5cGUgJHt0eXBlLm5hbWV9YCk7XG4gICAgICAgICAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVzb2x2aW5nLmFkZCh0eXBlLm5hbWUpO1xuICAgICAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZmllbGQudHlwZS5jYXRlZ29yeSA9PT0gRGJUeXBlQ2F0ZWdvcnkudW5yZXNvbHZlZCkge1xuICAgICAgICAgICAgICAgICAgICBsZXQgdHlwZSA9IHJlc29sdmVkLmdldChmaWVsZC50eXBlLm5hbWUpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgPSB1bnJlc29sdmVkLmdldChmaWVsZC50eXBlLm5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlVHlwZSh0eXBlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJz4+PicsIGBSZWZlcmVuY2VkIHR5cGUgbm90IGZvdW5kOiAke2ZpZWxkLnR5cGUubmFtZX1gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpZWxkLnR5cGUgPSB0eXBlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXNvbHZpbmcuZGVsZXRlKHR5cGUubmFtZSk7XG4gICAgICAgICAgICBvcmRlcmVkUmVzb2x2ZWQucHVzaCh0eXBlKTtcbiAgICAgICAgICAgIHVucmVzb2x2ZWQuZGVsZXRlKHR5cGUubmFtZSk7XG4gICAgICAgICAgICByZXNvbHZlZC5zZXQodHlwZS5uYW1lLCB0eXBlKTtcbiAgICAgICAgfTtcbiAgICAgICAgZGJUeXBlcy5mb3JFYWNoKHJlc29sdmVUeXBlKTtcbiAgICAgICAgZGJUeXBlcyA9IG9yZGVyZWRSZXNvbHZlZDtcbiAgICB9XG5cbi8vIEdlbmVyYXRvcnNcblxuICAgIGNvbnN0IHFsID0gbmV3IFdyaXRlcigpO1xuICAgIGNvbnN0IGpzID0gbmV3IFdyaXRlcigpO1xuXG4gICAgZnVuY3Rpb24gdW5pb25WYXJpYW50VHlwZSh0eXBlOiBEYlR5cGUsIHZhcmlhbnQ6IERiRmllbGQpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gYCR7dHlwZS5uYW1lfSR7dmFyaWFudC5uYW1lfVZhcmlhbnRgO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlblFMVHlwZURlY2xhcmF0aW9uc0ZvclVuaW9uVmFyaWFudHModHlwZTogRGJUeXBlKSB7XG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKHZhcmlhbnQpID0+IHtcbiAgICAgICAgICAgIHFsLndyaXRlQmxvY2tMbihgXG4gICAgICAgIHR5cGUgJHt1bmlvblZhcmlhbnRUeXBlKHR5cGUsIHZhcmlhbnQpfSB7XG4gICAgICAgICAgICAke3ZhcmlhbnQubmFtZX06ICR7dmFyaWFudC50eXBlLm5hbWV9XG4gICAgICAgIH1cblxuICAgICAgICBgKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuUUxFbnVtVHlwZXMoKSB7XG4gICAgICAgIGZvciAoY29uc3QgZW51bURlZjogSW50RW51bURlZiBvZiBlbnVtVHlwZXMudmFsdWVzKCkpIHtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oYGVudW0gJHtlbnVtRGVmLm5hbWV9RW51bSB7YCk7XG4gICAgICAgICAgICBPYmplY3Qua2V5cyhlbnVtRGVmLnZhbHVlcykuZm9yRWFjaCgobmFtZSkgPT4ge1xuICAgICAgICAgICAgICAgIHFsLndyaXRlTG4oYCAgICAke3RvRW51bVN0eWxlKG5hbWUpfWApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGB9YCk7XG4gICAgICAgICAgICBxbC53cml0ZUxuKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5RTFR5cGVEZWNsYXJhdGlvbih0eXBlOiBEYlR5cGUpIHtcbiAgICAgICAgaWYgKHR5cGUuY2F0ZWdvcnkgPT09IERiVHlwZUNhdGVnb3J5LnVuaW9uKSB7XG4gICAgICAgICAgICBnZW5RTFR5cGVEZWNsYXJhdGlvbnNGb3JVbmlvblZhcmlhbnRzKHR5cGUpO1xuICAgICAgICAgICAgcWwud3JpdGVMbihgdW5pb24gJHt0eXBlLm5hbWV9ID0gYCk7XG4gICAgICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKHZhcmlhbnQgPT4ge1xuICAgICAgICAgICAgICAgIHFsLndyaXRlTG4oYFxcdHwgJHt1bmlvblZhcmlhbnRUeXBlKHR5cGUsIHZhcmlhbnQpfWApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBxbC53cml0ZUxuKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGB0eXBlICR7dHlwZS5uYW1lfSB7YCk7XG4gICAgICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKGZpZWxkID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCB0eXBlRGVjbGFyYXRpb24gPVxuICAgICAgICAgICAgICAgICAgICAnWycucmVwZWF0KGZpZWxkLmFycmF5RGVwdGgpICtcbiAgICAgICAgICAgICAgICAgICAgZmllbGQudHlwZS5uYW1lICtcbiAgICAgICAgICAgICAgICAgICAgJ10nLnJlcGVhdChmaWVsZC5hcnJheURlcHRoKTtcbiAgICAgICAgICAgICAgICBxbC53cml0ZUxuKGBcXHQke2ZpZWxkLm5hbWV9OiAke3R5cGVEZWNsYXJhdGlvbn1gKTtcbiAgICAgICAgICAgICAgICBjb25zdCBlbnVtRGVmID0gZmllbGQuZW51bURlZjtcbiAgICAgICAgICAgICAgICBpZiAoZW51bURlZikge1xuICAgICAgICAgICAgICAgICAgICBxbC53cml0ZUxuKGBcXHQke2ZpZWxkLm5hbWV9X25hbWU6ICR7ZW51bURlZi5uYW1lfUVudW1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oYH1gKTtcbiAgICAgICAgfVxuICAgICAgICBxbC53cml0ZUxuKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcHJldmVudFR3aWNlKG5hbWU6IHN0cmluZywgbmFtZXM6IFNldDxzdHJpbmc+LCB3b3JrOiAoKSA9PiB2b2lkKSB7XG4gICAgICAgIGlmICghbmFtZXMuaGFzKG5hbWUpKSB7XG4gICAgICAgICAgICBuYW1lcy5hZGQobmFtZSk7XG4gICAgICAgICAgICB3b3JrKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5RTEZpbHRlcnNGb3JBcnJheUZpZWxkcyh0eXBlOiBEYlR5cGUsIHFsTmFtZXM6IFNldDxzdHJpbmc+KSB7XG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBsZXQgaXRlbVR5cGVOYW1lID0gZmllbGQudHlwZS5uYW1lO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmaWVsZC5hcnJheURlcHRoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWx0ZXJOYW1lID0gYCR7aXRlbVR5cGVOYW1lfUFycmF5RmlsdGVyYDtcbiAgICAgICAgICAgICAgICBwcmV2ZW50VHdpY2UoZmlsdGVyTmFtZSwgcWxOYW1lcywgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBxbC53cml0ZUxuKGBpbnB1dCAke2ZpbHRlck5hbWV9IHtgKTtcbiAgICAgICAgICAgICAgICAgICAgWydhbnknLCAnYWxsJ10uZm9yRWFjaCgob3ApID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHFsLndyaXRlTG4oYFxcdCR7b3B9OiAke2l0ZW1UeXBlTmFtZX1GaWx0ZXJgKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHFsLndyaXRlTG4oJ30nKTtcbiAgICAgICAgICAgICAgICAgICAgcWwud3JpdGVMbigpO1xuXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaXRlbVR5cGVOYW1lICs9ICdBcnJheSc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlblFMRmlsdGVyc0ZvckVudW1OYW1lRmllbGRzKHR5cGU6IERiVHlwZSwgcWxOYW1lczogU2V0PHN0cmluZz4pIHtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGVudW1EZWYgPSBmaWVsZC5lbnVtRGVmO1xuICAgICAgICAgICAgaWYgKGVudW1EZWYpIHtcbiAgICAgICAgICAgICAgICBwcmV2ZW50VHdpY2UoYCR7ZW51bURlZi5uYW1lfUVudW1GaWx0ZXJgLCBxbE5hbWVzLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGdlblFMU2NhbGFyVHlwZXNGaWx0ZXIoYCR7ZW51bURlZi5uYW1lfUVudW1gKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuUUxGaWx0ZXIodHlwZTogRGJUeXBlLCBxbE5hbWVzOiBTZXQ8c3RyaW5nPikge1xuICAgICAgICBpZiAodHlwZS5maWVsZHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgZ2VuUUxGaWx0ZXJzRm9yQXJyYXlGaWVsZHModHlwZSwgcWxOYW1lcyk7XG4gICAgICAgIGdlblFMRmlsdGVyc0ZvckVudW1OYW1lRmllbGRzKHR5cGUsIHFsTmFtZXMpO1xuICAgICAgICBxbC53cml0ZUxuKGBpbnB1dCAke3R5cGUubmFtZX1GaWx0ZXIge2ApO1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgdHlwZURlY2xhcmF0aW9uID0gZmllbGQudHlwZS5uYW1lICsgXCJBcnJheVwiLnJlcGVhdChmaWVsZC5hcnJheURlcHRoKTtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oYFxcdCR7ZmllbGQubmFtZX06ICR7dHlwZURlY2xhcmF0aW9ufUZpbHRlcmApO1xuICAgICAgICAgICAgY29uc3QgZW51bURlZiA9IGZpZWxkLmVudW1EZWY7XG4gICAgICAgICAgICBpZiAoZW51bURlZikge1xuICAgICAgICAgICAgICAgIHFsLndyaXRlTG4oYFxcdCR7ZmllbGQubmFtZX1fbmFtZTogJHtlbnVtRGVmLm5hbWV9RW51bUZpbHRlcmApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcWwud3JpdGVMbihgfWApO1xuICAgICAgICBxbC53cml0ZUxuKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuUUxTY2FsYXJUeXBlc0ZpbHRlcihuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgcWwud3JpdGVMbihgaW5wdXQgJHtuYW1lfUZpbHRlciB7YCk7XG4gICAgICAgIFsnZXEnLCAnbmUnLCAnZ3QnLCAnbHQnLCAnZ2UnLCAnbGUnXS5mb3JFYWNoKChvcCkgPT4ge1xuICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0JHtvcH06ICR7bmFtZX1gKTtcbiAgICAgICAgfSk7XG4gICAgICAgIFsnaW4nLCAnbm90SW4nXS5mb3JFYWNoKChvcCkgPT4ge1xuICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0JHtvcH06IFske25hbWV9XWApO1xuICAgICAgICB9KTtcbiAgICAgICAgcWwud3JpdGVMbignfScpO1xuICAgICAgICBxbC53cml0ZUxuKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuUUxRdWVyaWVzKHR5cGVzOiBEYlR5cGVbXSkge1xuICAgICAgICBxbC53cml0ZUJsb2NrTG4oYFxuICAgICAgICBlbnVtIFF1ZXJ5T3JkZXJCeURpcmVjdGlvbiB7XG4gICAgICAgICAgICBBU0NcbiAgICAgICAgICAgIERFU0NcbiAgICAgICAgfVxuXG4gICAgICAgIGlucHV0IFF1ZXJ5T3JkZXJCeSB7XG4gICAgICAgICAgICBwYXRoOiBTdHJpbmdcbiAgICAgICAgICAgIGRpcmVjdGlvbjogUXVlcnlPcmRlckJ5RGlyZWN0aW9uXG4gICAgICAgIH1cblxuICAgICAgICB0eXBlIFF1ZXJ5IHtcbiAgICAgICAgYCk7XG5cbiAgICAgICAgdHlwZXMuZm9yRWFjaCgodHlwZTogRGJUeXBlKSA9PiB7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGBcXHQke3R5cGUuY29sbGVjdGlvbiB8fCAnJ30oZmlsdGVyOiAke3R5cGUubmFtZX1GaWx0ZXIsIG9yZGVyQnk6IFtRdWVyeU9yZGVyQnldLCBsaW1pdDogSW50KTogWyR7dHlwZS5uYW1lfV1gKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcWwud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgfVxuXG4gICAgICAgIGApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlblFMU3Vic2NyaXB0aW9ucyh0eXBlczogRGJUeXBlW10pIHtcbiAgICAgICAgcWwud3JpdGVMbigndHlwZSBTdWJzY3JpcHRpb24geycpO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGBcXHQke3R5cGUuY29sbGVjdGlvbiB8fCAnJ30oZmlsdGVyOiAke3R5cGUubmFtZX1GaWx0ZXIpOiAke3R5cGUubmFtZX1gKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHFsLndyaXRlTG4oJ30nKTtcbiAgICB9XG5cblxuICAgIGZ1bmN0aW9uIGdlblFMTXV0YXRpb24oKSB7XG4gICAgICAgIHFsLndyaXRlTG4oJycpO1xuICAgICAgICBxbC53cml0ZUxuKCd0eXBlIE11dGF0aW9uIHsnKTtcbiAgICAgICAgcWwud3JpdGVMbignXFx0cG9zdE1lc3NhZ2UoaWQ6IFN0cmluZywgYm9keTogU3RyaW5nKTogQm9vbGVhbicpO1xuICAgICAgICBxbC53cml0ZUxuKCd9Jyk7XG4gICAgfVxuXG5cbiAgICBmdW5jdGlvbiBnZXRTY2FsYXJSZXNvbHZlck5hbWUoZmllbGQ6IERiRmllbGQpOiBzdHJpbmcge1xuICAgICAgICBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDY0KSB7XG4gICAgICAgICAgICByZXR1cm4gJ2JpZ1VJbnQxJztcbiAgICAgICAgfVxuICAgICAgICBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDEwMjQpIHtcbiAgICAgICAgICAgIHJldHVybiAnYmlnVUludDInO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnc2NhbGFyJztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5KU0ZpbHRlcnNGb3JBcnJheUZpZWxkcyh0eXBlOiBEYlR5cGUsIGpzTmFtZXM6IFNldDxzdHJpbmc+KSB7XG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBsZXQgaXRlbVR5cGVOYW1lID0gZmllbGQudHlwZS5uYW1lO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmaWVsZC5hcnJheURlcHRoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWx0ZXJOYW1lID0gYCR7aXRlbVR5cGVOYW1lfUFycmF5YDtcbiAgICAgICAgICAgICAgICBwcmV2ZW50VHdpY2UoZmlsdGVyTmFtZSwganNOYW1lcywgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpdGVtUmVzb2x2ZXJOYW1lID0gKGkgPT09IDAgJiYgZmllbGQudHlwZS5jYXRlZ29yeSA9PT0gRGJUeXBlQ2F0ZWdvcnkuc2NhbGFyKVxuICAgICAgICAgICAgICAgICAgICAgICAgPyBnZXRTY2FsYXJSZXNvbHZlck5hbWUoZmllbGQpXG4gICAgICAgICAgICAgICAgICAgICAgICA6IGl0ZW1UeXBlTmFtZTtcbiAgICAgICAgICAgICAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgICAgICAgICBjb25zdCAke2ZpbHRlck5hbWV9ID0gYXJyYXkoJHtpdGVtUmVzb2x2ZXJOYW1lfSk7XG4gICAgICAgICAgICAgICAgYCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaXRlbVR5cGVOYW1lICs9ICdBcnJheSc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkpTU3RydWN0RmlsdGVyKHR5cGU6IERiVHlwZSkge1xuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBjb25zdCAke3R5cGUubmFtZX0gPSBzdHJ1Y3Qoe1xuICAgIGApO1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgbGV0IHR5cGVEZWNsYXJhdGlvbjogP3N0cmluZyA9IG51bGw7XG4gICAgICAgICAgICBjb25zdCBqb2luID0gZmllbGQuam9pbjtcbiAgICAgICAgICAgIGlmIChqb2luKSB7XG4gICAgICAgICAgICAgICAgdHlwZURlY2xhcmF0aW9uID0gYGpvaW4ke2ZpZWxkLmFycmF5RGVwdGggPiAwID8gJ0FycmF5JyA6ICcnfSgnJHtqb2luLm9ufScsICcke2ZpZWxkLnR5cGUuY29sbGVjdGlvbiB8fCAnJ30nLCAke2ZpZWxkLnR5cGUubmFtZX0pYDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQuYXJyYXlEZXB0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB0eXBlRGVjbGFyYXRpb24gPVxuICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlLm5hbWUgK1xuICAgICAgICAgICAgICAgICAgICAnQXJyYXknLnJlcGVhdChmaWVsZC5hcnJheURlcHRoKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZS5jYXRlZ29yeSA9PT0gRGJUeXBlQ2F0ZWdvcnkuc2NhbGFyKSB7XG4gICAgICAgICAgICAgICAgdHlwZURlY2xhcmF0aW9uID0gZ2V0U2NhbGFyUmVzb2x2ZXJOYW1lKGZpZWxkKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZS5maWVsZHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHR5cGVEZWNsYXJhdGlvbiA9IGZpZWxkLnR5cGUubmFtZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0eXBlRGVjbGFyYXRpb24pIHtcbiAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgJHtmaWVsZC5uYW1lfTogJHt0eXBlRGVjbGFyYXRpb259LGApO1xuICAgICAgICAgICAgICAgIGNvbnN0IGVudW1EZWYgPSBmaWVsZC5lbnVtRGVmO1xuICAgICAgICAgICAgICAgIGlmIChlbnVtRGVmKSB7XG4gICAgICAgICAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAke2ZpZWxkLm5hbWV9X25hbWU6IGVudW1OYW1lKCcke2ZpZWxkLm5hbWV9JywgJHtzdHJpbmdpZnlFbnVtVmFsdWVzKGVudW1EZWYudmFsdWVzKX0pLGApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIH0ke3R5cGUuY29sbGVjdGlvbiA/ICcsIHRydWUnIDogJyd9KTtcblxuICAgIGApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkpTVW5pb25SZXNvbHZlcih0eXBlOiBEYlR5cGUpIHtcbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgY29uc3QgJHt0eXBlLm5hbWV9UmVzb2x2ZXIgPSB7XG4gICAgICAgICAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xuICAgICAgICBgKTtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgodmFyaWFudCkgPT4ge1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICBpZiAoJyR7dmFyaWFudC5uYW1lfScgaW4gb2JqKSB7YCk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICByZXR1cm4gJyR7dW5pb25WYXJpYW50VHlwZSh0eXBlLCB2YXJpYW50KX0nO2ApO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICB9YCk7XG4gICAgICAgIH0pO1xuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkpTRmlsdGVyKHR5cGU6IERiVHlwZSwganNOYW1lczogU2V0PHN0cmluZz4pIHtcbiAgICAgICAgaWYgKHR5cGUuZmllbGRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS51bmlvbikge1xuICAgICAgICAgICAgLy8gZ2VuSlNGaWx0ZXJzRm9yVW5pb25WYXJpYW50cyh0eXBlLCBqc05hbWVzKTtcbiAgICAgICAgfVxuICAgICAgICBnZW5KU0ZpbHRlcnNGb3JBcnJheUZpZWxkcyh0eXBlLCBqc05hbWVzKTtcbiAgICAgICAgZ2VuSlNTdHJ1Y3RGaWx0ZXIodHlwZSk7XG4gICAgICAgIGlmICh0eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS51bmlvbikge1xuICAgICAgICAgICAgZ2VuSlNVbmlvblJlc29sdmVyKHR5cGUpO1xuICAgICAgICB9XG5cblxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlIGN1c3RvbSByZXNvbHZlcnMgZm9yIHR5cGVzIHdpdGg6XG4gICAgICogLSBpZCBmaWVsZFxuICAgICAqIC0gam9pbiBmaWVsZHNcbiAgICAgKiAtIHU2NCBhbmQgaGlnaGVyIGZpZWxkc1xuICAgICAqIEBwYXJhbSB0eXBlXG4gICAgICovXG4gICAgZnVuY3Rpb24gZ2VuSlNDdXN0b21SZXNvbHZlcnModHlwZTogRGJUeXBlKSB7XG4gICAgICAgIGNvbnN0IGpvaW5GaWVsZHMgPSB0eXBlLmZpZWxkcy5maWx0ZXIoeCA9PiAhIXguam9pbik7XG4gICAgICAgIGNvbnN0IGJpZ1VJbnRGaWVsZHMgPSB0eXBlLmZpZWxkcy5maWx0ZXIoKHg6IERiRmllbGQpID0+ICh4LnR5cGUgPT09IHNjYWxhclR5cGVzLnVpbnQ2NCkgfHwgKHgudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDEwMjQpKTtcbiAgICAgICAgY29uc3QgZW51bUZpZWxkcyA9IHR5cGUuZmllbGRzLmZpbHRlcih4ID0+IHguZW51bURlZik7XG4gICAgICAgIGNvbnN0IGN1c3RvbVJlc29sdmVyUmVxdWlyZWQgPSB0eXBlLmNvbGxlY3Rpb25cbiAgICAgICAgICAgIHx8IGpvaW5GaWVsZHMubGVuZ3RoID4gMFxuICAgICAgICAgICAgfHwgYmlnVUludEZpZWxkcy5sZW5ndGggPiAwXG4gICAgICAgICAgICB8fCBlbnVtRmllbGRzLmxlbmd0aCA+IDA7XG4gICAgICAgIGlmICghY3VzdG9tUmVzb2x2ZXJSZXF1aXJlZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgJHt0eXBlLm5hbWV9OiB7YCk7XG4gICAgICAgIGlmICh0eXBlLmNvbGxlY3Rpb24pIHtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oJyAgICAgICAgICAgIGlkKHBhcmVudCkgeycpO1xuICAgICAgICAgICAganMud3JpdGVMbignICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTsnKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oJyAgICAgICAgICAgIH0sJyk7XG4gICAgICAgIH1cbiAgICAgICAgam9pbkZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgY29uc3Qgb25GaWVsZCA9IHR5cGUuZmllbGRzLmZpbmQoeCA9PiB4Lm5hbWUgPT09IChmaWVsZC5qb2luICYmIGZpZWxkLmpvaW4ub24pIHx8ICcnKTtcbiAgICAgICAgICAgIGlmICghb25GaWVsZCkge1xuICAgICAgICAgICAgICAgIHRocm93ICdKb2luIG9uIGZpZWxkIGRvZXMgbm90IGV4aXN0Lic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBjb2xsZWN0aW9uID0gZmllbGQudHlwZS5jb2xsZWN0aW9uO1xuICAgICAgICAgICAgaWYgKCFjb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgJ0pvaW5lZCB0eXBlIGlzIG5vdCBhIGNvbGxlY3Rpb24uJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICR7ZmllbGQubmFtZX0ocGFyZW50KSB7YCk7XG4gICAgICAgICAgICBpZiAoZmllbGQuYXJyYXlEZXB0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICAgICByZXR1cm4gZGIuZmV0Y2hEb2NCeUtleShkYi4ke2NvbGxlY3Rpb259LCBwYXJlbnQuJHtvbkZpZWxkLm5hbWV9KTtgKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQuYXJyYXlEZXB0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICAgICByZXR1cm4gZGIuZmV0Y2hEb2NzQnlLZXlzKGRiLiR7Y29sbGVjdGlvbn0sIHBhcmVudC4ke29uRmllbGQubmFtZX0pO2ApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyAnSm9pbnMgb24gYSBuZXN0ZWQgYXJyYXlzIGRvZXMgbm90IHN1cHBvcnRlZC4nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgfSxgKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGJpZ1VJbnRGaWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHByZWZpeExlbmd0aCA9IGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLnVpbnQ2NCA/IDEgOiAyO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgJHtmaWVsZC5uYW1lfShwYXJlbnQpIHtgKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoJHtwcmVmaXhMZW5ndGh9LCBwYXJlbnQuJHtmaWVsZC5uYW1lfSk7YCk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICB9LGApO1xuICAgICAgICB9KTtcbiAgICAgICAgZW51bUZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgZW51bURlZiA9IGZpZWxkLmVudW1EZWY7XG4gICAgICAgICAgICBpZiAoZW51bURlZikge1xuICAgICAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICR7ZmllbGQubmFtZX1fbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignJHtmaWVsZC5uYW1lfScsICR7c3RyaW5naWZ5RW51bVZhbHVlcyhlbnVtRGVmLnZhbHVlcyl9KSxgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgfSxgKTtcbiAgICB9XG5cblxuICAgIGZ1bmN0aW9uIGdlbkpTVHlwZVJlc29sdmVyc0ZvclVuaW9uKHR5cGU6IERiVHlwZSkge1xuICAgICAgICBpZiAodHlwZS5jYXRlZ29yeSA9PT0gRGJUeXBlQ2F0ZWdvcnkudW5pb24pIHtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgJHt0eXBlLm5hbWV9OiAke3R5cGUubmFtZX1SZXNvbHZlcixgKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbmVyYXRlKHR5cGVzOiBEYlR5cGVbXSkge1xuXG4gICAgICAgIC8vIFFMXG5cbiAgICAgICAgWydTdHJpbmcnLCAnQm9vbGVhbicsICdJbnQnLCAnRmxvYXQnXS5mb3JFYWNoKGdlblFMU2NhbGFyVHlwZXNGaWx0ZXIpO1xuICAgICAgICBnZW5RTEVudW1UeXBlcygpO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKHR5cGUgPT4gZ2VuUUxUeXBlRGVjbGFyYXRpb24odHlwZSkpO1xuICAgICAgICBjb25zdCBxbEFycmF5RmlsdGVycyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKHR5cGUgPT4gZ2VuUUxGaWx0ZXIodHlwZSwgcWxBcnJheUZpbHRlcnMpKTtcblxuICAgICAgICBjb25zdCBjb2xsZWN0aW9ucyA9IHR5cGVzLmZpbHRlcih0ID0+ICEhdC5jb2xsZWN0aW9uKTtcbiAgICAgICAgZ2VuUUxRdWVyaWVzKGNvbGxlY3Rpb25zKTtcbiAgICAgICAgZ2VuUUxTdWJzY3JpcHRpb25zKGNvbGxlY3Rpb25zKTtcbiAgICAgICAgZ2VuUUxNdXRhdGlvbigpO1xuXG4gICAgICAgIC8vIEpTXG5cbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgY29uc3Qge1xuICAgICAgICAgICAgc2NhbGFyLFxuICAgICAgICAgICAgYmlnVUludDEsXG4gICAgICAgICAgICBiaWdVSW50MixcbiAgICAgICAgICAgIHJlc29sdmVCaWdVSW50LFxuICAgICAgICAgICAgc3RydWN0LFxuICAgICAgICAgICAgYXJyYXksXG4gICAgICAgICAgICBqb2luLFxuICAgICAgICAgICAgam9pbkFycmF5LFxuICAgICAgICAgICAgZW51bU5hbWUsXG4gICAgICAgICAgICBjcmVhdGVFbnVtTmFtZVJlc29sdmVyLFxuICAgICAgICB9ID0gcmVxdWlyZSgnLi9xLXR5cGVzLmpzJyk7XG4gICAgICAgIGApO1xuICAgICAgICBjb25zdCBqc0FycmF5RmlsdGVycyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKHR5cGUgPT4gZ2VuSlNGaWx0ZXIodHlwZSwganNBcnJheUZpbHRlcnMpKTtcblxuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBmdW5jdGlvbiBjcmVhdGVSZXNvbHZlcnMoZGIpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgIGApO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgICAgICAgICBnZW5KU0N1c3RvbVJlc29sdmVycyh0eXBlKTtcbiAgICAgICAgICAgIGdlbkpTVHlwZVJlc29sdmVyc0ZvclVuaW9uKHR5cGUpO1xuICAgICAgICB9KTtcbiAgICAgICAganMud3JpdGVMbignICAgICAgICBRdWVyeTogeycpO1xuICAgICAgICBjb2xsZWN0aW9ucy5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAke3R5cGUuY29sbGVjdGlvbiB8fCAnJ306IGRiLmNvbGxlY3Rpb25RdWVyeShkYi4ke3R5cGUuY29sbGVjdGlvbiB8fCAnJ30sICR7dHlwZS5uYW1lfSksYClcbiAgICAgICAgfSk7XG4gICAgICAgIGpzLndyaXRlTG4oJyAgICAgICAgfSwnKTtcbiAgICAgICAganMud3JpdGVMbignICAgICAgICBTdWJzY3JpcHRpb246IHsnKTtcbiAgICAgICAgY29sbGVjdGlvbnMuZm9yRWFjaCgodHlwZSkgPT4ge1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgJHt0eXBlLmNvbGxlY3Rpb24gfHwgJyd9OiBkYi5jb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGRiLiR7dHlwZS5jb2xsZWN0aW9uIHx8ICcnfSwgJHt0eXBlLm5hbWV9KSxgKVxuICAgICAgICB9KTtcbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIE11dGF0aW9uOiB7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgYCk7XG5cbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgICAgICAgICBjcmVhdGVSZXNvbHZlcnMsXG4gICAgICAgIGApO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKHR5cGUgPT4ganMud3JpdGVMbihgICAgICR7dHlwZS5uYW1lfSxgKSk7XG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIH07XG4gICAgICAgIGApO1xuICAgIH1cblxuICAgIGNvbnN0IHNjaGVtYSA9IHBhcnNlVHlwZURlZihzY2hlbWFEZWYpO1xuXG4gICAgaWYgKHNjaGVtYS5jbGFzcykge1xuICAgICAgICBwYXJzZURiVHlwZXMoc2NoZW1hLmNsYXNzLnR5cGVzKTtcbiAgICAgICAgZ2VuZXJhdGUoZGJUeXBlcyk7XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBlOiBJbnRFbnVtRGVmIG9mIGVudW1UeXBlcy52YWx1ZXMoKSkge1xuICAgICAgICBjb25zb2xlLmxvZyhgZXhwb3J0IGNvbnN0IFEke2UubmFtZX0gPSB7YCk7XG4gICAgICAgIGNvbnNvbGUubG9nKE9iamVjdC5lbnRyaWVzKGUudmFsdWVzKS5tYXAoKFtuYW1lLCB2YWx1ZV0pID0+IHtcbiAgICAgICAgICAgIHJldHVybiBgICAgICR7bmFtZX06ICR7KHZhbHVlOiBhbnkpfSxgO1xuICAgICAgICB9KS5qb2luKCdcXG4nKSk7XG4gICAgICAgIGNvbnNvbGUubG9nKGB9O1xcbmApO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIHFsOiBxbC5nZW5lcmF0ZWQoKSxcbiAgICAgICAganM6IGpzLmdlbmVyYXRlZCgpLFxuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgbWFpbjtcbiJdfQ==