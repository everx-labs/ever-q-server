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

      js.writeLn("            ".concat(field.name, "(parent, _args, context) {"));

      if (field.arrayDepth === 0) {
        js.writeLn("                return context.db.fetchDocByKey(context.db.".concat(collection, ", parent.").concat(onField.name, ");"));
      } else if (field.arrayDepth === 1) {
        js.writeLn("                return context.db.fetchDocsByKeys(context.db.".concat(collection, ", parent.").concat(onField.name, ");"));
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
    genQLSubscriptions(collections); // JS

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
    js.writeBlockLn("\n                }\n            }\n        }\n\n        ");
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9nZW4tcWwuanMiXSwibmFtZXMiOlsiRGJUeXBlQ2F0ZWdvcnkiLCJ1bnJlc29sdmVkIiwic2NhbGFyIiwidW5pb24iLCJzdHJ1Y3QiLCJzY2FsYXJUeXBlIiwibmFtZSIsImNhdGVnb3J5IiwiZmllbGRzIiwic2NhbGFyVHlwZXMiLCJ1aW50NjQiLCJ1aW50MTAyNCIsInN0cmluZyIsInVucmVzb2x2ZWRUeXBlIiwiaXNMb3dlckNhc2VkIiwicyIsImwiLCJ0b0xvd2VyQ2FzZSIsInUiLCJ0b1VwcGVyQ2FzZSIsImlzVXBwZXJDYXNlZCIsInRvQWxsQ2FwcyIsInJlc3VsdCIsImkiLCJsZW5ndGgiLCJ0b0VudW1TdHlsZSIsInN1YnN0ciIsInN0cmluZ2lmeUVudW1WYWx1ZXMiLCJ2YWx1ZXMiLCJPYmplY3QiLCJlbnRyaWVzIiwibWFwIiwidmFsdWUiLCJqb2luIiwibWFpbiIsInNjaGVtYURlZiIsImRiVHlwZXMiLCJsYXN0UmVwb3J0ZWRUeXBlIiwiZW51bVR5cGVzIiwiTWFwIiwicmVwb3J0VHlwZSIsImZpZWxkIiwidHlwZSIsImNvbnNvbGUiLCJsb2ciLCJwYXJzZURiRmllbGQiLCJ0eXBlTmFtZSIsInNjaGVtYUZpZWxkIiwic2NoZW1hVHlwZSIsImFycmF5RGVwdGgiLCJhcnJheSIsImVudW1EZWYiLCJfIiwic2V0IiwicmVmIiwiYm9vbCIsInVuc2lnbmVkIiwic2l6ZSIsIkVycm9yIiwiSlNPTiIsInN0cmluZ2lmeSIsInByb2Nlc3MiLCJleGl0IiwidW53cmFwQXJyYXlzIiwicGFyc2VEYlR5cGUiLCJjb2xsZWN0aW9uIiwicHVzaCIsImZvckVhY2giLCJ1bndyYXBwZWQiLCJvd25UeXBlIiwicGFyc2VEYlR5cGVzIiwidHlwZXMiLCJyZXNvbHZpbmciLCJTZXQiLCJyZXNvbHZlZCIsIm9yZGVyZWRSZXNvbHZlZCIsInQiLCJyZXNvbHZlVHlwZSIsImhhcyIsImFkZCIsImdldCIsInFsIiwiV3JpdGVyIiwianMiLCJ1bmlvblZhcmlhbnRUeXBlIiwidmFyaWFudCIsImdlblFMVHlwZURlY2xhcmF0aW9uc0ZvclVuaW9uVmFyaWFudHMiLCJ3cml0ZUJsb2NrTG4iLCJnZW5RTEVudW1UeXBlcyIsIndyaXRlTG4iLCJrZXlzIiwiZ2VuUUxUeXBlRGVjbGFyYXRpb24iLCJ0eXBlRGVjbGFyYXRpb24iLCJyZXBlYXQiLCJwcmV2ZW50VHdpY2UiLCJuYW1lcyIsIndvcmsiLCJnZW5RTEZpbHRlcnNGb3JBcnJheUZpZWxkcyIsInFsTmFtZXMiLCJpdGVtVHlwZU5hbWUiLCJmaWx0ZXJOYW1lIiwib3AiLCJnZW5RTEZpbHRlcnNGb3JFbnVtTmFtZUZpZWxkcyIsImdlblFMU2NhbGFyVHlwZXNGaWx0ZXIiLCJnZW5RTEZpbHRlciIsImdlblFMUXVlcmllcyIsImdlblFMU3Vic2NyaXB0aW9ucyIsImdldFNjYWxhclJlc29sdmVyTmFtZSIsImdlbkpTRmlsdGVyc0ZvckFycmF5RmllbGRzIiwianNOYW1lcyIsIml0ZW1SZXNvbHZlck5hbWUiLCJnZW5KU1N0cnVjdEZpbHRlciIsIm9uIiwiZ2VuSlNVbmlvblJlc29sdmVyIiwiZ2VuSlNGaWx0ZXIiLCJnZW5KU0N1c3RvbVJlc29sdmVycyIsImpvaW5GaWVsZHMiLCJmaWx0ZXIiLCJ4IiwiYmlnVUludEZpZWxkcyIsImVudW1GaWVsZHMiLCJjdXN0b21SZXNvbHZlclJlcXVpcmVkIiwib25GaWVsZCIsImZpbmQiLCJwcmVmaXhMZW5ndGgiLCJnZW5KU1R5cGVSZXNvbHZlcnNGb3JVbmlvbiIsImdlbmVyYXRlIiwicWxBcnJheUZpbHRlcnMiLCJjb2xsZWN0aW9ucyIsImpzQXJyYXlGaWx0ZXJzIiwic2NoZW1hIiwiZSIsImdlbmVyYXRlZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFFQTs7QUFFQTs7QUFFQSxJQUFNQSxjQUFjLEdBQUc7QUFDbkJDLEVBQUFBLFVBQVUsRUFBRSxZQURPO0FBRW5CQyxFQUFBQSxNQUFNLEVBQUUsUUFGVztBQUduQkMsRUFBQUEsS0FBSyxFQUFF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QVI7QUFDSDs7QUE3aUI2QjtBQUFBO0FBQUE7O0FBQUE7QUEraUI5QiwwQkFBNEJFLFNBQVMsQ0FBQ1YsTUFBVixFQUE1QixtSUFBZ0Q7QUFBQSxVQUFyQ3VHLEVBQXFDO0FBQzVDeEYsTUFBQUEsT0FBTyxDQUFDQyxHQUFSLHlCQUE2QnVGLEVBQUMsQ0FBQzdILElBQS9CO0FBQ0FxQyxNQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWWYsTUFBTSxDQUFDQyxPQUFQLENBQWVxRyxFQUFDLENBQUN2RyxNQUFqQixFQUF5QkcsR0FBekIsQ0FBNkIsaUJBQW1CO0FBQUE7QUFBQSxZQUFqQnpCLElBQWlCO0FBQUEsWUFBWDBCLEtBQVc7O0FBQ3hELDZCQUFjMUIsSUFBZCxlQUF3QjBCLEtBQXhCO0FBQ0gsT0FGVyxFQUVUQyxJQUZTLENBRUosSUFGSSxDQUFaO0FBR0FVLE1BQUFBLE9BQU8sQ0FBQ0MsR0FBUjtBQUNIO0FBcmpCNkI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUF1akI5QixTQUFPO0FBQ0hxQyxJQUFBQSxFQUFFLEVBQUVBLEVBQUUsQ0FBQ21ELFNBQUgsRUFERDtBQUVIakQsSUFBQUEsRUFBRSxFQUFFQSxFQUFFLENBQUNpRCxTQUFIO0FBRkQsR0FBUDtBQUlIOztlQUVjbEcsSSIsInNvdXJjZXNDb250ZW50IjpbIi8vQGZsb3dcblxuaW1wb3J0IHsgbWFrZUZpZWxkVHlwZU5hbWUsIFdyaXRlciB9IGZyb20gJ3Rvbi1sYWJzLWRldi1vcHMvZGlzdC9zcmMvZ2VuLmpzJztcbmltcG9ydCB0eXBlIHsgU2NoZW1hTWVtYmVyLCBTY2hlbWFUeXBlLCBUeXBlRGVmIH0gZnJvbSAndG9uLWxhYnMtZGV2LW9wcy9zcmMvc2NoZW1hLmpzJztcbmltcG9ydCB7IHBhcnNlVHlwZURlZiB9IGZyb20gJ3Rvbi1sYWJzLWRldi1vcHMvZGlzdC9zcmMvc2NoZW1hLmpzJztcblxuY29uc3QgRGJUeXBlQ2F0ZWdvcnkgPSB7XG4gICAgdW5yZXNvbHZlZDogJ3VucmVzb2x2ZWQnLFxuICAgIHNjYWxhcjogJ3NjYWxhcicsXG4gICAgdW5pb246ICd1bmlvbicsXG4gICAgc3RydWN0OiAnc3RydWN0Jyxcbn07XG5cbnR5cGUgRGJKb2luID0ge1xuICAgIGNvbGxlY3Rpb246IHN0cmluZyxcbiAgICBvbjogc3RyaW5nLFxufVxuXG50eXBlIERiVHlwZSA9IHtcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgZmllbGRzOiBEYkZpZWxkW10sXG4gICAgY2F0ZWdvcnk6ICd1bnJlc29sdmVkJyB8ICdzY2FsYXInIHwgJ3VuaW9uJyB8ICdzdHJ1Y3QnLFxuICAgIGNvbGxlY3Rpb24/OiBzdHJpbmcsXG59XG5cbnR5cGUgSW50RW51bURlZiA9IHtcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgdmFsdWVzOiB7IFtzdHJpbmddOiBudW1iZXIgfSxcbn1cblxudHlwZSBEYkZpZWxkID0ge1xuICAgIG5hbWU6IHN0cmluZyxcbiAgICB0eXBlOiBEYlR5cGUsXG4gICAgYXJyYXlEZXB0aDogbnVtYmVyLFxuICAgIGpvaW4/OiBEYkpvaW4sXG4gICAgZW51bURlZj86IEludEVudW1EZWYsXG59XG5cbmZ1bmN0aW9uIHNjYWxhclR5cGUobmFtZTogc3RyaW5nKTogRGJUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBuYW1lLFxuICAgICAgICBjYXRlZ29yeTogRGJUeXBlQ2F0ZWdvcnkuc2NhbGFyLFxuICAgICAgICBmaWVsZHM6IFtdXG4gICAgfVxufVxuXG5jb25zdCBzY2FsYXJUeXBlcyA9IHtcbiAgICBpbnQ6IHNjYWxhclR5cGUoJ0ludCcpLFxuICAgIHVpbnQ2NDogc2NhbGFyVHlwZSgnU3RyaW5nJyksXG4gICAgdWludDEwMjQ6IHNjYWxhclR5cGUoJ1N0cmluZycpLFxuICAgIGZsb2F0OiBzY2FsYXJUeXBlKCdGbG9hdCcpLFxuICAgIGJvb2xlYW46IHNjYWxhclR5cGUoJ0Jvb2xlYW4nKSxcbiAgICBzdHJpbmc6IHNjYWxhclR5cGUoJ1N0cmluZycpLFxufTtcblxuZnVuY3Rpb24gdW5yZXNvbHZlZFR5cGUobmFtZTogc3RyaW5nKTogRGJUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBuYW1lLFxuICAgICAgICBjYXRlZ29yeTogRGJUeXBlQ2F0ZWdvcnkudW5yZXNvbHZlZCxcbiAgICAgICAgZmllbGRzOiBbXSxcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGlzTG93ZXJDYXNlZChzOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBjb25zdCBsID0gcy50b0xvd2VyQ2FzZSgpO1xuICAgIGNvbnN0IHUgPSBzLnRvVXBwZXJDYXNlKCk7XG4gICAgcmV0dXJuICh1ICE9PSBsKSAmJiAocyA9PT0gbCk7XG59XG5cbmZ1bmN0aW9uIGlzVXBwZXJDYXNlZChzOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBjb25zdCBsID0gcy50b0xvd2VyQ2FzZSgpO1xuICAgIGNvbnN0IHUgPSBzLnRvVXBwZXJDYXNlKCk7XG4gICAgcmV0dXJuICh1ICE9PSBsKSAmJiAocyA9PT0gdSk7XG59XG5cbmZ1bmN0aW9uIHRvQWxsQ2FwcyhzOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGxldCByZXN1bHQgPSAnJztcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgaWYgKChpID4gMCkgJiYgKHNbaSAtIDFdICE9PSAnXycpICYmIGlzTG93ZXJDYXNlZChzW2kgLSAxXSkgJiYgaXNVcHBlckNhc2VkKHNbaV0pKSB7XG4gICAgICAgICAgICByZXN1bHQgKz0gJ18nO1xuICAgICAgICB9XG4gICAgICAgIHJlc3VsdCArPSBzW2ldO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0LnRvVXBwZXJDYXNlKCk7XG59XG5cbmZ1bmN0aW9uIHRvRW51bVN0eWxlKHM6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGAke3Muc3Vic3RyKDAsIDEpLnRvVXBwZXJDYXNlKCl9JHtzLnN1YnN0cigxKX1gO1xufVxuXG5mdW5jdGlvbiBzdHJpbmdpZnlFbnVtVmFsdWVzKHZhbHVlczogeyBbc3RyaW5nXTogbnVtYmVyIH0pOiBzdHJpbmcge1xuICAgIGNvbnN0IGZpZWxkcyA9IE9iamVjdC5lbnRyaWVzKHZhbHVlcykubWFwKChbbmFtZSwgdmFsdWVdKSA9PiB7XG4gICAgICAgIHJldHVybiBgJHt0b0VudW1TdHlsZShuYW1lKX06ICR7KHZhbHVlOiBhbnkpfWA7XG4gICAgfSk7XG4gICAgcmV0dXJuIGB7ICR7ZmllbGRzLmpvaW4oJywgJyl9IH1gO1xufVxuXG5mdW5jdGlvbiBtYWluKHNjaGVtYURlZjogVHlwZURlZikge1xuXG4gICAgbGV0IGRiVHlwZXM6IERiVHlwZVtdID0gW107XG4gICAgbGV0IGxhc3RSZXBvcnRlZFR5cGU6IHN0cmluZyA9ICcnO1xuICAgIGxldCBlbnVtVHlwZXM6IE1hcDxzdHJpbmcsIEludEVudW1EZWY+ID0gbmV3IE1hcCgpO1xuXG4gICAgZnVuY3Rpb24gcmVwb3J0VHlwZShuYW1lOiBzdHJpbmcsIGZpZWxkOiBzdHJpbmcsIHR5cGU6IHN0cmluZykge1xuICAgICAgICBpZiAobmFtZSAhPT0gbGFzdFJlcG9ydGVkVHlwZSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2cobmFtZSk7XG4gICAgICAgICAgICBsYXN0UmVwb3J0ZWRUeXBlID0gbmFtZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmxvZyhgICAgICR7ZmllbGR9OiAke3R5cGV9YCk7XG5cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZURiRmllbGQoXG4gICAgICAgIHR5cGVOYW1lOiBzdHJpbmcsXG4gICAgICAgIHNjaGVtYUZpZWxkOiBTY2hlbWFNZW1iZXI8U2NoZW1hVHlwZT4sXG4gICAgKTogRGJGaWVsZCB7XG4gICAgICAgIGxldCBzY2hlbWFUeXBlID0gc2NoZW1hRmllbGQ7XG4gICAgICAgIGNvbnN0IGZpZWxkOiBEYkZpZWxkID0ge1xuICAgICAgICAgICAgbmFtZTogc2NoZW1hRmllbGQubmFtZSxcbiAgICAgICAgICAgIGFycmF5RGVwdGg6IDAsXG4gICAgICAgICAgICB0eXBlOiBzY2FsYXJUeXBlcy5zdHJpbmcsXG4gICAgICAgIH07XG4gICAgICAgIHdoaWxlIChzY2hlbWFUeXBlLmFycmF5KSB7XG4gICAgICAgICAgICBmaWVsZC5hcnJheURlcHRoICs9IDE7XG4gICAgICAgICAgICBzY2hlbWFUeXBlID0gc2NoZW1hVHlwZS5hcnJheTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBlbnVtRGVmOiA/SW50RW51bURlZiA9IChzY2hlbWFUeXBlLl8gJiYgc2NoZW1hVHlwZS5fLmVudW0pIHx8IG51bGw7XG4gICAgICAgIGlmIChlbnVtRGVmKSB7XG4gICAgICAgICAgICBmaWVsZC5lbnVtRGVmID0gZW51bURlZjtcbiAgICAgICAgICAgIGVudW1UeXBlcy5zZXQoZW51bURlZi5uYW1lLCBlbnVtRGVmKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBqb2luID0gKHNjaGVtYVR5cGU6IGFueSkuXy5qb2luO1xuICAgICAgICBpZiAoam9pbikge1xuICAgICAgICAgICAgZmllbGQuam9pbiA9IGpvaW47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNjaGVtYVR5cGUudW5pb24gfHwgc2NoZW1hVHlwZS5zdHJ1Y3QpIHtcbiAgICAgICAgICAgIGZpZWxkLnR5cGUgPSB1bnJlc29sdmVkVHlwZShtYWtlRmllbGRUeXBlTmFtZSh0eXBlTmFtZSwgc2NoZW1hRmllbGQubmFtZSkpO1xuICAgICAgICB9IGVsc2UgaWYgKHNjaGVtYVR5cGUucmVmKSB7XG4gICAgICAgICAgICBmaWVsZC50eXBlID0gdW5yZXNvbHZlZFR5cGUoc2NoZW1hVHlwZS5yZWYubmFtZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoc2NoZW1hVHlwZS5ib29sKSB7XG4gICAgICAgICAgICBmaWVsZC50eXBlID0gc2NhbGFyVHlwZXMuYm9vbGVhbjtcbiAgICAgICAgfSBlbHNlIGlmIChzY2hlbWFUeXBlLmludCkge1xuICAgICAgICAgICAgY29uc3QgdW5zaWduZWQ6IGJvb2xlYW4gPSAoc2NoZW1hVHlwZS5pbnQgJiYgc2NoZW1hVHlwZS5pbnQudW5zaWduZWQpIHx8IGZhbHNlO1xuICAgICAgICAgICAgY29uc3Qgc2l6ZTogbnVtYmVyID0gKHNjaGVtYVR5cGUuaW50ICYmIHNjaGVtYVR5cGUuaW50LnNpemUpIHx8IDMyO1xuICAgICAgICAgICAgaWYgKHVuc2lnbmVkKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNpemUgPj0gMTI4KSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcG9ydFR5cGUodHlwZU5hbWUsIGZpZWxkLm5hbWUsICd1MTAyNCcpO1xuICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlID0gc2NhbGFyVHlwZXMudWludDEwMjQ7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzaXplID49IDY0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcG9ydFR5cGUodHlwZU5hbWUsIGZpZWxkLm5hbWUsICd1NjQnKTtcbiAgICAgICAgICAgICAgICAgICAgZmllbGQudHlwZSA9IHNjYWxhclR5cGVzLnVpbnQ2NDtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHNpemUgPj0gMzIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVwb3J0VHlwZSh0eXBlTmFtZSwgZmllbGQubmFtZSwgJ3UzMicpO1xuICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlID0gc2NhbGFyVHlwZXMuZmxvYXQ7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVwb3J0VHlwZSh0eXBlTmFtZSwgZmllbGQubmFtZSwgYHUke3NpemV9YCk7XG4gICAgICAgICAgICAgICAgICAgIGZpZWxkLnR5cGUgPSBzY2FsYXJUeXBlcy5pbnQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoc2l6ZSA+IDMyKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSW50ZWdlciB0eXBlIHdpdGggc2l6ZSAke3NpemV9IGJpdCBkb2VzIG5vdCBzdXBwb3J0ZWRgKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXBvcnRUeXBlKHR5cGVOYW1lLCBmaWVsZC5uYW1lLCAnaTMyJyk7XG4gICAgICAgICAgICAgICAgICAgIGZpZWxkLnR5cGUgPSBzY2FsYXJUeXBlcy5pbnQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHNjaGVtYVR5cGUuZmxvYXQpIHtcbiAgICAgICAgICAgIHJlcG9ydFR5cGUodHlwZU5hbWUsIGZpZWxkLm5hbWUsICdmbG9hdCcpO1xuICAgICAgICAgICAgZmllbGQudHlwZSA9IHNjYWxhclR5cGVzLmZsb2F0O1xuICAgICAgICB9IGVsc2UgaWYgKHNjaGVtYVR5cGUuc3RyaW5nKSB7XG4gICAgICAgICAgICBmaWVsZC50eXBlID0gc2NhbGFyVHlwZXMuc3RyaW5nO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZmllbGQudHlwZSA9IHNjYWxhclR5cGVzLnN0cmluZztcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+Pj4gSW52YWxpZCBmaWVsZCB0eXBlOiAnLCBKU09OLnN0cmluZ2lmeShzY2hlbWFUeXBlKSk7XG4gICAgICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZpZWxkO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHVud3JhcEFycmF5cyh0eXBlOiBTY2hlbWFUeXBlKTogU2NoZW1hVHlwZSB7XG4gICAgICAgIGlmICh0eXBlLmFycmF5KSB7XG4gICAgICAgICAgICByZXR1cm4gdW53cmFwQXJyYXlzKHR5cGUuYXJyYXkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0eXBlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlRGJUeXBlKFxuICAgICAgICBuYW1lOiBzdHJpbmcsXG4gICAgICAgIHNjaGVtYVR5cGU6IFNjaGVtYVR5cGVcbiAgICApIHtcbiAgICAgICAgY29uc3Qgc3RydWN0ID0gc2NoZW1hVHlwZS51bmlvbiB8fCBzY2hlbWFUeXBlLnN0cnVjdDtcbiAgICAgICAgaWYgKCFzdHJ1Y3QpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+Pj4nLCBgPz8gJHtuYW1lfTogJHtKU09OLnN0cmluZ2lmeShzY2hlbWFUeXBlKS5zdWJzdHIoMCwgMjAwKX1gKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0eXBlOiBEYlR5cGUgPSB7XG4gICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgY2F0ZWdvcnk6IHNjaGVtYVR5cGUudW5pb24gPyBEYlR5cGVDYXRlZ29yeS51bmlvbiA6IERiVHlwZUNhdGVnb3J5LnN0cnVjdCxcbiAgICAgICAgICAgIGZpZWxkczogW10sXG4gICAgICAgICAgICBjb2xsZWN0aW9uOiAoc2NoZW1hVHlwZTogYW55KS5fLmNvbGxlY3Rpb24sXG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKHR5cGUuY29sbGVjdGlvbikge1xuICAgICAgICAgICAgdHlwZS5maWVsZHMucHVzaCh7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2lkJyxcbiAgICAgICAgICAgICAgICBhcnJheURlcHRoOiAwLFxuICAgICAgICAgICAgICAgIHR5cGU6IHNjYWxhclR5cGVzLnN0cmluZyxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHN0cnVjdC5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgdHlwZS5maWVsZHMucHVzaChwYXJzZURiRmllbGQobmFtZSwgZmllbGQpKTtcbiAgICAgICAgICAgIGNvbnN0IHVud3JhcHBlZCA9IHVud3JhcEFycmF5cyhmaWVsZCk7XG4gICAgICAgICAgICBjb25zdCBvd25UeXBlID0gKHVud3JhcHBlZC5zdHJ1Y3QgfHwgdW53cmFwcGVkLnVuaW9uKSA/IHVud3JhcHBlZCA6IG51bGw7XG4gICAgICAgICAgICBpZiAob3duVHlwZSkge1xuICAgICAgICAgICAgICAgIHBhcnNlRGJUeXBlKG1ha2VGaWVsZFR5cGVOYW1lKG5hbWUsIGZpZWxkLm5hbWUpLCBvd25UeXBlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGRiVHlwZXMucHVzaCh0eXBlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZURiVHlwZXModHlwZXM6IFNjaGVtYU1lbWJlcjxTY2hlbWFUeXBlPltdKSB7XG4gICAgICAgIHR5cGVzLmZvckVhY2goKHR5cGU6IFNjaGVtYU1lbWJlcjxTY2hlbWFUeXBlPikgPT4ge1xuICAgICAgICAgICAgcGFyc2VEYlR5cGUodHlwZS5uYW1lLCB0eXBlKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IHVucmVzb2x2ZWQ6IE1hcDxzdHJpbmcsIERiVHlwZT4gPSBuZXcgTWFwPHN0cmluZywgRGJUeXBlPigpO1xuICAgICAgICBjb25zdCByZXNvbHZpbmc6IFNldDxzdHJpbmc+ID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgICAgIGNvbnN0IHJlc29sdmVkOiBNYXA8c3RyaW5nLCBEYlR5cGU+ID0gbmV3IE1hcDxzdHJpbmcsIERiVHlwZT4oKTtcbiAgICAgICAgY29uc3Qgb3JkZXJlZFJlc29sdmVkOiBEYlR5cGVbXSA9IFtdO1xuICAgICAgICBkYlR5cGVzLmZvckVhY2godCA9PiB1bnJlc29sdmVkLnNldCh0Lm5hbWUsIHQpKTtcbiAgICAgICAgY29uc3QgcmVzb2x2ZVR5cGUgPSAodHlwZTogRGJUeXBlKSA9PiB7XG4gICAgICAgICAgICBpZiAocmVzb2x2ZWQuaGFzKHR5cGUubmFtZSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocmVzb2x2aW5nLmhhcyh0eXBlLm5hbWUpKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJz4+PicsIGBDaXJjdWxhciByZWZlcmVuY2UgdG8gdHlwZSAke3R5cGUubmFtZX1gKTtcbiAgICAgICAgICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXNvbHZpbmcuYWRkKHR5cGUubmFtZSk7XG4gICAgICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChmaWVsZC50eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS51bnJlc29sdmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCB0eXBlID0gcmVzb2x2ZWQuZ2V0KGZpZWxkLnR5cGUubmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghdHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSA9IHVucmVzb2x2ZWQuZ2V0KGZpZWxkLnR5cGUubmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmVUeXBlKHR5cGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnPj4+JywgYFJlZmVyZW5jZWQgdHlwZSBub3QgZm91bmQ6ICR7ZmllbGQudHlwZS5uYW1lfWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZmllbGQudHlwZSA9IHR5cGU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJlc29sdmluZy5kZWxldGUodHlwZS5uYW1lKTtcbiAgICAgICAgICAgIG9yZGVyZWRSZXNvbHZlZC5wdXNoKHR5cGUpO1xuICAgICAgICAgICAgdW5yZXNvbHZlZC5kZWxldGUodHlwZS5uYW1lKTtcbiAgICAgICAgICAgIHJlc29sdmVkLnNldCh0eXBlLm5hbWUsIHR5cGUpO1xuICAgICAgICB9O1xuICAgICAgICBkYlR5cGVzLmZvckVhY2gocmVzb2x2ZVR5cGUpO1xuICAgICAgICBkYlR5cGVzID0gb3JkZXJlZFJlc29sdmVkO1xuICAgIH1cblxuLy8gR2VuZXJhdG9yc1xuXG4gICAgY29uc3QgcWwgPSBuZXcgV3JpdGVyKCk7XG4gICAgY29uc3QganMgPSBuZXcgV3JpdGVyKCk7XG5cbiAgICBmdW5jdGlvbiB1bmlvblZhcmlhbnRUeXBlKHR5cGU6IERiVHlwZSwgdmFyaWFudDogRGJGaWVsZCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiBgJHt0eXBlLm5hbWV9JHt2YXJpYW50Lm5hbWV9VmFyaWFudGA7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuUUxUeXBlRGVjbGFyYXRpb25zRm9yVW5pb25WYXJpYW50cyh0eXBlOiBEYlR5cGUpIHtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgodmFyaWFudCkgPT4ge1xuICAgICAgICAgICAgcWwud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgdHlwZSAke3VuaW9uVmFyaWFudFR5cGUodHlwZSwgdmFyaWFudCl9IHtcbiAgICAgICAgICAgICR7dmFyaWFudC5uYW1lfTogJHt2YXJpYW50LnR5cGUubmFtZX1cbiAgICAgICAgfVxuXG4gICAgICAgIGApO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5RTEVudW1UeXBlcygpIHtcbiAgICAgICAgZm9yIChjb25zdCBlbnVtRGVmOiBJbnRFbnVtRGVmIG9mIGVudW1UeXBlcy52YWx1ZXMoKSkge1xuICAgICAgICAgICAgcWwud3JpdGVMbihgZW51bSAke2VudW1EZWYubmFtZX1FbnVtIHtgKTtcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKGVudW1EZWYudmFsdWVzKS5mb3JFYWNoKChuYW1lKSA9PiB7XG4gICAgICAgICAgICAgICAgcWwud3JpdGVMbihgICAgICR7dG9FbnVtU3R5bGUobmFtZSl9YCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oYH1gKTtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlblFMVHlwZURlY2xhcmF0aW9uKHR5cGU6IERiVHlwZSkge1xuICAgICAgICBpZiAodHlwZS5jYXRlZ29yeSA9PT0gRGJUeXBlQ2F0ZWdvcnkudW5pb24pIHtcbiAgICAgICAgICAgIGdlblFMVHlwZURlY2xhcmF0aW9uc0ZvclVuaW9uVmFyaWFudHModHlwZSk7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGB1bmlvbiAke3R5cGUubmFtZX0gPSBgKTtcbiAgICAgICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2godmFyaWFudCA9PiB7XG4gICAgICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0fCAke3VuaW9uVmFyaWFudFR5cGUodHlwZSwgdmFyaWFudCl9YCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oYHR5cGUgJHt0eXBlLm5hbWV9IHtgKTtcbiAgICAgICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goZmllbGQgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHR5cGVEZWNsYXJhdGlvbiA9XG4gICAgICAgICAgICAgICAgICAgICdbJy5yZXBlYXQoZmllbGQuYXJyYXlEZXB0aCkgK1xuICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlLm5hbWUgK1xuICAgICAgICAgICAgICAgICAgICAnXScucmVwZWF0KGZpZWxkLmFycmF5RGVwdGgpO1xuICAgICAgICAgICAgICAgIHFsLndyaXRlTG4oYFxcdCR7ZmllbGQubmFtZX06ICR7dHlwZURlY2xhcmF0aW9ufWApO1xuICAgICAgICAgICAgICAgIGNvbnN0IGVudW1EZWYgPSBmaWVsZC5lbnVtRGVmO1xuICAgICAgICAgICAgICAgIGlmIChlbnVtRGVmKSB7XG4gICAgICAgICAgICAgICAgICAgIHFsLndyaXRlTG4oYFxcdCR7ZmllbGQubmFtZX1fbmFtZTogJHtlbnVtRGVmLm5hbWV9RW51bWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcWwud3JpdGVMbihgfWApO1xuICAgICAgICB9XG4gICAgICAgIHFsLndyaXRlTG4oKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwcmV2ZW50VHdpY2UobmFtZTogc3RyaW5nLCBuYW1lczogU2V0PHN0cmluZz4sIHdvcms6ICgpID0+IHZvaWQpIHtcbiAgICAgICAgaWYgKCFuYW1lcy5oYXMobmFtZSkpIHtcbiAgICAgICAgICAgIG5hbWVzLmFkZChuYW1lKTtcbiAgICAgICAgICAgIHdvcmsoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlblFMRmlsdGVyc0ZvckFycmF5RmllbGRzKHR5cGU6IERiVHlwZSwgcWxOYW1lczogU2V0PHN0cmluZz4pIHtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGxldCBpdGVtVHlwZU5hbWUgPSBmaWVsZC50eXBlLm5hbWU7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZpZWxkLmFycmF5RGVwdGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpbHRlck5hbWUgPSBgJHtpdGVtVHlwZU5hbWV9QXJyYXlGaWx0ZXJgO1xuICAgICAgICAgICAgICAgIHByZXZlbnRUd2ljZShmaWx0ZXJOYW1lLCBxbE5hbWVzLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHFsLndyaXRlTG4oYGlucHV0ICR7ZmlsdGVyTmFtZX0ge2ApO1xuICAgICAgICAgICAgICAgICAgICBbJ2FueScsICdhbGwnXS5mb3JFYWNoKChvcCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0JHtvcH06ICR7aXRlbVR5cGVOYW1lfUZpbHRlcmApO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgcWwud3JpdGVMbignfScpO1xuICAgICAgICAgICAgICAgICAgICBxbC53cml0ZUxuKCk7XG5cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBpdGVtVHlwZU5hbWUgKz0gJ0FycmF5JztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuUUxGaWx0ZXJzRm9yRW51bU5hbWVGaWVsZHModHlwZTogRGJUeXBlLCBxbE5hbWVzOiBTZXQ8c3RyaW5nPikge1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgZW51bURlZiA9IGZpZWxkLmVudW1EZWY7XG4gICAgICAgICAgICBpZiAoZW51bURlZikge1xuICAgICAgICAgICAgICAgIHByZXZlbnRUd2ljZShgJHtlbnVtRGVmLm5hbWV9RW51bUZpbHRlcmAsIHFsTmFtZXMsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgZ2VuUUxTY2FsYXJUeXBlc0ZpbHRlcihgJHtlbnVtRGVmLm5hbWV9RW51bWApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5RTEZpbHRlcih0eXBlOiBEYlR5cGUsIHFsTmFtZXM6IFNldDxzdHJpbmc+KSB7XG4gICAgICAgIGlmICh0eXBlLmZpZWxkcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBnZW5RTEZpbHRlcnNGb3JBcnJheUZpZWxkcyh0eXBlLCBxbE5hbWVzKTtcbiAgICAgICAgZ2VuUUxGaWx0ZXJzRm9yRW51bU5hbWVGaWVsZHModHlwZSwgcWxOYW1lcyk7XG4gICAgICAgIHFsLndyaXRlTG4oYGlucHV0ICR7dHlwZS5uYW1lfUZpbHRlciB7YCk7XG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBjb25zdCB0eXBlRGVjbGFyYXRpb24gPSBmaWVsZC50eXBlLm5hbWUgKyBcIkFycmF5XCIucmVwZWF0KGZpZWxkLmFycmF5RGVwdGgpO1xuICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0JHtmaWVsZC5uYW1lfTogJHt0eXBlRGVjbGFyYXRpb259RmlsdGVyYCk7XG4gICAgICAgICAgICBjb25zdCBlbnVtRGVmID0gZmllbGQuZW51bURlZjtcbiAgICAgICAgICAgIGlmIChlbnVtRGVmKSB7XG4gICAgICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0JHtmaWVsZC5uYW1lfV9uYW1lOiAke2VudW1EZWYubmFtZX1FbnVtRmlsdGVyYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBxbC53cml0ZUxuKGB9YCk7XG4gICAgICAgIHFsLndyaXRlTG4oKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5RTFNjYWxhclR5cGVzRmlsdGVyKG5hbWU6IHN0cmluZykge1xuICAgICAgICBxbC53cml0ZUxuKGBpbnB1dCAke25hbWV9RmlsdGVyIHtgKTtcbiAgICAgICAgWydlcScsICduZScsICdndCcsICdsdCcsICdnZScsICdsZSddLmZvckVhY2goKG9wKSA9PiB7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGBcXHQke29wfTogJHtuYW1lfWApO1xuICAgICAgICB9KTtcbiAgICAgICAgWydpbicsICdub3RJbiddLmZvckVhY2goKG9wKSA9PiB7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGBcXHQke29wfTogWyR7bmFtZX1dYCk7XG4gICAgICAgIH0pO1xuICAgICAgICBxbC53cml0ZUxuKCd9Jyk7XG4gICAgICAgIHFsLndyaXRlTG4oKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5RTFF1ZXJpZXModHlwZXM6IERiVHlwZVtdKSB7XG4gICAgICAgIHFsLndyaXRlQmxvY2tMbihgXG4gICAgICAgIGVudW0gUXVlcnlPcmRlckJ5RGlyZWN0aW9uIHtcbiAgICAgICAgICAgIEFTQ1xuICAgICAgICAgICAgREVTQ1xuICAgICAgICB9XG5cbiAgICAgICAgaW5wdXQgUXVlcnlPcmRlckJ5IHtcbiAgICAgICAgICAgIHBhdGg6IFN0cmluZ1xuICAgICAgICAgICAgZGlyZWN0aW9uOiBRdWVyeU9yZGVyQnlEaXJlY3Rpb25cbiAgICAgICAgfVxuXG4gICAgICAgIHR5cGUgUXVlcnkge1xuICAgICAgICBgKTtcblxuICAgICAgICB0eXBlcy5mb3JFYWNoKCh0eXBlOiBEYlR5cGUpID0+IHtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oYFxcdCR7dHlwZS5jb2xsZWN0aW9uIHx8ICcnfShmaWx0ZXI6ICR7dHlwZS5uYW1lfUZpbHRlciwgb3JkZXJCeTogW1F1ZXJ5T3JkZXJCeV0sIGxpbWl0OiBJbnQpOiBbJHt0eXBlLm5hbWV9XWApO1xuICAgICAgICB9KTtcblxuICAgICAgICBxbC53cml0ZUJsb2NrTG4oYFxuICAgICAgICB9XG5cbiAgICAgICAgYCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuUUxTdWJzY3JpcHRpb25zKHR5cGVzOiBEYlR5cGVbXSkge1xuICAgICAgICBxbC53cml0ZUxuKCd0eXBlIFN1YnNjcmlwdGlvbiB7Jyk7XG4gICAgICAgIHR5cGVzLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oYFxcdCR7dHlwZS5jb2xsZWN0aW9uIHx8ICcnfShmaWx0ZXI6ICR7dHlwZS5uYW1lfUZpbHRlcik6ICR7dHlwZS5uYW1lfWApO1xuICAgICAgICB9KTtcbiAgICAgICAgcWwud3JpdGVMbignfScpO1xuICAgIH1cblxuXG4gICAgZnVuY3Rpb24gZ2V0U2NhbGFyUmVzb2x2ZXJOYW1lKGZpZWxkOiBEYkZpZWxkKTogc3RyaW5nIHtcbiAgICAgICAgaWYgKGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLnVpbnQ2NCkge1xuICAgICAgICAgICAgcmV0dXJuICdiaWdVSW50MSc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLnVpbnQxMDI0KSB7XG4gICAgICAgICAgICByZXR1cm4gJ2JpZ1VJbnQyJztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJ3NjYWxhcic7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuSlNGaWx0ZXJzRm9yQXJyYXlGaWVsZHModHlwZTogRGJUeXBlLCBqc05hbWVzOiBTZXQ8c3RyaW5nPikge1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgbGV0IGl0ZW1UeXBlTmFtZSA9IGZpZWxkLnR5cGUubmFtZTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZmllbGQuYXJyYXlEZXB0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmlsdGVyTmFtZSA9IGAke2l0ZW1UeXBlTmFtZX1BcnJheWA7XG4gICAgICAgICAgICAgICAgcHJldmVudFR3aWNlKGZpbHRlck5hbWUsIGpzTmFtZXMsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaXRlbVJlc29sdmVyTmFtZSA9IChpID09PSAwICYmIGZpZWxkLnR5cGUuY2F0ZWdvcnkgPT09IERiVHlwZUNhdGVnb3J5LnNjYWxhcilcbiAgICAgICAgICAgICAgICAgICAgICAgID8gZ2V0U2NhbGFyUmVzb2x2ZXJOYW1lKGZpZWxkKVxuICAgICAgICAgICAgICAgICAgICAgICAgOiBpdGVtVHlwZU5hbWU7XG4gICAgICAgICAgICAgICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgICAgICAgICAgY29uc3QgJHtmaWx0ZXJOYW1lfSA9IGFycmF5KCR7aXRlbVJlc29sdmVyTmFtZX0pO1xuICAgICAgICAgICAgICAgIGApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGl0ZW1UeXBlTmFtZSArPSAnQXJyYXknO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5KU1N0cnVjdEZpbHRlcih0eXBlOiBEYlR5cGUpIHtcbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgY29uc3QgJHt0eXBlLm5hbWV9ID0gc3RydWN0KHtcbiAgICBgKTtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGxldCB0eXBlRGVjbGFyYXRpb246ID9zdHJpbmcgPSBudWxsO1xuICAgICAgICAgICAgY29uc3Qgam9pbiA9IGZpZWxkLmpvaW47XG4gICAgICAgICAgICBpZiAoam9pbikge1xuICAgICAgICAgICAgICAgIHR5cGVEZWNsYXJhdGlvbiA9IGBqb2luJHtmaWVsZC5hcnJheURlcHRoID4gMCA/ICdBcnJheScgOiAnJ30oJyR7am9pbi5vbn0nLCAnJHtmaWVsZC50eXBlLmNvbGxlY3Rpb24gfHwgJyd9JywgJHtmaWVsZC50eXBlLm5hbWV9KWA7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLmFycmF5RGVwdGggPiAwKSB7XG4gICAgICAgICAgICAgICAgdHlwZURlY2xhcmF0aW9uID1cbiAgICAgICAgICAgICAgICAgICAgZmllbGQudHlwZS5uYW1lICtcbiAgICAgICAgICAgICAgICAgICAgJ0FycmF5Jy5yZXBlYXQoZmllbGQuYXJyYXlEZXB0aCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLnR5cGUuY2F0ZWdvcnkgPT09IERiVHlwZUNhdGVnb3J5LnNjYWxhcikge1xuICAgICAgICAgICAgICAgIHR5cGVEZWNsYXJhdGlvbiA9IGdldFNjYWxhclJlc29sdmVyTmFtZShmaWVsZCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLnR5cGUuZmllbGRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB0eXBlRGVjbGFyYXRpb24gPSBmaWVsZC50eXBlLm5hbWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodHlwZURlY2xhcmF0aW9uKSB7XG4gICAgICAgICAgICAgICAganMud3JpdGVMbihgICAgICR7ZmllbGQubmFtZX06ICR7dHlwZURlY2xhcmF0aW9ufSxgKTtcbiAgICAgICAgICAgICAgICBjb25zdCBlbnVtRGVmID0gZmllbGQuZW51bURlZjtcbiAgICAgICAgICAgICAgICBpZiAoZW51bURlZikge1xuICAgICAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgJHtmaWVsZC5uYW1lfV9uYW1lOiBlbnVtTmFtZSgnJHtmaWVsZC5uYW1lfScsICR7c3RyaW5naWZ5RW51bVZhbHVlcyhlbnVtRGVmLnZhbHVlcyl9KSxgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICB9JHt0eXBlLmNvbGxlY3Rpb24gPyAnLCB0cnVlJyA6ICcnfSk7XG5cbiAgICBgKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5KU1VuaW9uUmVzb2x2ZXIodHlwZTogRGJUeXBlKSB7XG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIGNvbnN0ICR7dHlwZS5uYW1lfVJlc29sdmVyID0ge1xuICAgICAgICAgICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgYCk7XG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKHZhcmlhbnQpID0+IHtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgaWYgKCcke3ZhcmlhbnQubmFtZX0nIGluIG9iaikge2ApO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgcmV0dXJuICcke3VuaW9uVmFyaWFudFR5cGUodHlwZSwgdmFyaWFudCl9JztgKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgfWApO1xuICAgICAgICB9KTtcbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBgKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5KU0ZpbHRlcih0eXBlOiBEYlR5cGUsIGpzTmFtZXM6IFNldDxzdHJpbmc+KSB7XG4gICAgICAgIGlmICh0eXBlLmZpZWxkcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZS5jYXRlZ29yeSA9PT0gRGJUeXBlQ2F0ZWdvcnkudW5pb24pIHtcbiAgICAgICAgICAgIC8vIGdlbkpTRmlsdGVyc0ZvclVuaW9uVmFyaWFudHModHlwZSwganNOYW1lcyk7XG4gICAgICAgIH1cbiAgICAgICAgZ2VuSlNGaWx0ZXJzRm9yQXJyYXlGaWVsZHModHlwZSwganNOYW1lcyk7XG4gICAgICAgIGdlbkpTU3RydWN0RmlsdGVyKHR5cGUpO1xuICAgICAgICBpZiAodHlwZS5jYXRlZ29yeSA9PT0gRGJUeXBlQ2F0ZWdvcnkudW5pb24pIHtcbiAgICAgICAgICAgIGdlbkpTVW5pb25SZXNvbHZlcih0eXBlKTtcbiAgICAgICAgfVxuXG5cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZW5lcmF0ZSBjdXN0b20gcmVzb2x2ZXJzIGZvciB0eXBlcyB3aXRoOlxuICAgICAqIC0gaWQgZmllbGRcbiAgICAgKiAtIGpvaW4gZmllbGRzXG4gICAgICogLSB1NjQgYW5kIGhpZ2hlciBmaWVsZHNcbiAgICAgKiBAcGFyYW0gdHlwZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGdlbkpTQ3VzdG9tUmVzb2x2ZXJzKHR5cGU6IERiVHlwZSkge1xuICAgICAgICBjb25zdCBqb2luRmllbGRzID0gdHlwZS5maWVsZHMuZmlsdGVyKHggPT4gISF4LmpvaW4pO1xuICAgICAgICBjb25zdCBiaWdVSW50RmllbGRzID0gdHlwZS5maWVsZHMuZmlsdGVyKCh4OiBEYkZpZWxkKSA9PiAoeC50eXBlID09PSBzY2FsYXJUeXBlcy51aW50NjQpIHx8ICh4LnR5cGUgPT09IHNjYWxhclR5cGVzLnVpbnQxMDI0KSk7XG4gICAgICAgIGNvbnN0IGVudW1GaWVsZHMgPSB0eXBlLmZpZWxkcy5maWx0ZXIoeCA9PiB4LmVudW1EZWYpO1xuICAgICAgICBjb25zdCBjdXN0b21SZXNvbHZlclJlcXVpcmVkID0gdHlwZS5jb2xsZWN0aW9uXG4gICAgICAgICAgICB8fCBqb2luRmllbGRzLmxlbmd0aCA+IDBcbiAgICAgICAgICAgIHx8IGJpZ1VJbnRGaWVsZHMubGVuZ3RoID4gMFxuICAgICAgICAgICAgfHwgZW51bUZpZWxkcy5sZW5ndGggPiAwO1xuICAgICAgICBpZiAoIWN1c3RvbVJlc29sdmVyUmVxdWlyZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICR7dHlwZS5uYW1lfToge2ApO1xuICAgICAgICBpZiAodHlwZS5jb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICBqcy53cml0ZUxuKCcgICAgICAgICAgICBpZChwYXJlbnQpIHsnKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oJyAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7Jyk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKCcgICAgICAgICAgICB9LCcpO1xuICAgICAgICB9XG4gICAgICAgIGpvaW5GaWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG9uRmllbGQgPSB0eXBlLmZpZWxkcy5maW5kKHggPT4geC5uYW1lID09PSAoZmllbGQuam9pbiAmJiBmaWVsZC5qb2luLm9uKSB8fCAnJyk7XG4gICAgICAgICAgICBpZiAoIW9uRmllbGQpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyAnSm9pbiBvbiBmaWVsZCBkb2VzIG5vdCBleGlzdC4nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgY29sbGVjdGlvbiA9IGZpZWxkLnR5cGUuY29sbGVjdGlvbjtcbiAgICAgICAgICAgIGlmICghY29sbGVjdGlvbikge1xuICAgICAgICAgICAgICAgIHRocm93ICdKb2luZWQgdHlwZSBpcyBub3QgYSBjb2xsZWN0aW9uLic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAke2ZpZWxkLm5hbWV9KHBhcmVudCwgX2FyZ3MsIGNvbnRleHQpIHtgKTtcbiAgICAgICAgICAgIGlmIChmaWVsZC5hcnJheURlcHRoID09PSAwKSB7XG4gICAgICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgICAgIHJldHVybiBjb250ZXh0LmRiLmZldGNoRG9jQnlLZXkoY29udGV4dC5kYi4ke2NvbGxlY3Rpb259LCBwYXJlbnQuJHtvbkZpZWxkLm5hbWV9KTtgKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQuYXJyYXlEZXB0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICAgICByZXR1cm4gY29udGV4dC5kYi5mZXRjaERvY3NCeUtleXMoY29udGV4dC5kYi4ke2NvbGxlY3Rpb259LCBwYXJlbnQuJHtvbkZpZWxkLm5hbWV9KTtgKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgJ0pvaW5zIG9uIGEgbmVzdGVkIGFycmF5cyBkb2VzIG5vdCBzdXBwb3J0ZWQuJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgIH0sYCk7XG4gICAgICAgIH0pO1xuICAgICAgICBiaWdVSW50RmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwcmVmaXhMZW5ndGggPSBmaWVsZC50eXBlID09PSBzY2FsYXJUeXBlcy51aW50NjQgPyAxIDogMjtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICR7ZmllbGQubmFtZX0ocGFyZW50KSB7YCk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KCR7cHJlZml4TGVuZ3RofSwgcGFyZW50LiR7ZmllbGQubmFtZX0pO2ApO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgfSxgKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGVudW1GaWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGVudW1EZWYgPSBmaWVsZC5lbnVtRGVmO1xuICAgICAgICAgICAgaWYgKGVudW1EZWYpIHtcbiAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAke2ZpZWxkLm5hbWV9X25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJyR7ZmllbGQubmFtZX0nLCAke3N0cmluZ2lmeUVudW1WYWx1ZXMoZW51bURlZi52YWx1ZXMpfSksYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgIH0sYCk7XG4gICAgfVxuXG5cbiAgICBmdW5jdGlvbiBnZW5KU1R5cGVSZXNvbHZlcnNGb3JVbmlvbih0eXBlOiBEYlR5cGUpIHtcbiAgICAgICAgaWYgKHR5cGUuY2F0ZWdvcnkgPT09IERiVHlwZUNhdGVnb3J5LnVuaW9uKSB7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICR7dHlwZS5uYW1lfTogJHt0eXBlLm5hbWV9UmVzb2x2ZXIsYCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5lcmF0ZSh0eXBlczogRGJUeXBlW10pIHtcblxuICAgICAgICAvLyBRTFxuXG4gICAgICAgIFsnU3RyaW5nJywgJ0Jvb2xlYW4nLCAnSW50JywgJ0Zsb2F0J10uZm9yRWFjaChnZW5RTFNjYWxhclR5cGVzRmlsdGVyKTtcbiAgICAgICAgZ2VuUUxFbnVtVHlwZXMoKTtcbiAgICAgICAgdHlwZXMuZm9yRWFjaCh0eXBlID0+IGdlblFMVHlwZURlY2xhcmF0aW9uKHR5cGUpKTtcbiAgICAgICAgY29uc3QgcWxBcnJheUZpbHRlcnMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICAgICAgdHlwZXMuZm9yRWFjaCh0eXBlID0+IGdlblFMRmlsdGVyKHR5cGUsIHFsQXJyYXlGaWx0ZXJzKSk7XG5cbiAgICAgICAgY29uc3QgY29sbGVjdGlvbnMgPSB0eXBlcy5maWx0ZXIodCA9PiAhIXQuY29sbGVjdGlvbik7XG4gICAgICAgIGdlblFMUXVlcmllcyhjb2xsZWN0aW9ucyk7XG4gICAgICAgIGdlblFMU3Vic2NyaXB0aW9ucyhjb2xsZWN0aW9ucyk7XG5cbiAgICAgICAgLy8gSlNcblxuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBjb25zdCB7XG4gICAgICAgICAgICBzY2FsYXIsXG4gICAgICAgICAgICBiaWdVSW50MSxcbiAgICAgICAgICAgIGJpZ1VJbnQyLFxuICAgICAgICAgICAgcmVzb2x2ZUJpZ1VJbnQsXG4gICAgICAgICAgICBzdHJ1Y3QsXG4gICAgICAgICAgICBhcnJheSxcbiAgICAgICAgICAgIGpvaW4sXG4gICAgICAgICAgICBqb2luQXJyYXksXG4gICAgICAgICAgICBlbnVtTmFtZSxcbiAgICAgICAgICAgIGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIsXG4gICAgICAgIH0gPSByZXF1aXJlKCcuL3EtdHlwZXMuanMnKTtcbiAgICAgICAgYCk7XG4gICAgICAgIGNvbnN0IGpzQXJyYXlGaWx0ZXJzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgICAgIHR5cGVzLmZvckVhY2godHlwZSA9PiBnZW5KU0ZpbHRlcih0eXBlLCBqc0FycmF5RmlsdGVycykpO1xuXG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIGZ1bmN0aW9uIGNyZWF0ZVJlc29sdmVycyhkYikge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgYCk7XG4gICAgICAgIHR5cGVzLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICAgICAgICAgIGdlbkpTQ3VzdG9tUmVzb2x2ZXJzKHR5cGUpO1xuICAgICAgICAgICAgZ2VuSlNUeXBlUmVzb2x2ZXJzRm9yVW5pb24odHlwZSk7XG4gICAgICAgIH0pO1xuICAgICAgICBqcy53cml0ZUxuKCcgICAgICAgIFF1ZXJ5OiB7Jyk7XG4gICAgICAgIGNvbGxlY3Rpb25zLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICR7dHlwZS5jb2xsZWN0aW9uIHx8ICcnfTogZGIuY29sbGVjdGlvblF1ZXJ5KGRiLiR7dHlwZS5jb2xsZWN0aW9uIHx8ICcnfSwgJHt0eXBlLm5hbWV9KSxgKVxuICAgICAgICB9KTtcbiAgICAgICAganMud3JpdGVMbignICAgICAgICB9LCcpO1xuICAgICAgICBqcy53cml0ZUxuKCcgICAgICAgIFN1YnNjcmlwdGlvbjogeycpO1xuICAgICAgICBjb2xsZWN0aW9ucy5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAke3R5cGUuY29sbGVjdGlvbiB8fCAnJ306IGRiLmNvbGxlY3Rpb25TdWJzY3JpcHRpb24oZGIuJHt0eXBlLmNvbGxlY3Rpb24gfHwgJyd9LCAke3R5cGUubmFtZX0pLGApXG4gICAgICAgIH0pO1xuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGApO1xuXG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0ge1xuICAgICAgICAgICAgY3JlYXRlUmVzb2x2ZXJzLFxuICAgICAgICBgKTtcbiAgICAgICAgdHlwZXMuZm9yRWFjaCh0eXBlID0+IGpzLndyaXRlTG4oYCAgICAke3R5cGUubmFtZX0sYCkpO1xuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICB9O1xuICAgICAgICBgKTtcbiAgICB9XG5cbiAgICBjb25zdCBzY2hlbWEgPSBwYXJzZVR5cGVEZWYoc2NoZW1hRGVmKTtcblxuICAgIGlmIChzY2hlbWEuY2xhc3MpIHtcbiAgICAgICAgcGFyc2VEYlR5cGVzKHNjaGVtYS5jbGFzcy50eXBlcyk7XG4gICAgICAgIGdlbmVyYXRlKGRiVHlwZXMpO1xuICAgIH1cblxuICAgIGZvciAoY29uc3QgZTogSW50RW51bURlZiBvZiBlbnVtVHlwZXMudmFsdWVzKCkpIHtcbiAgICAgICAgY29uc29sZS5sb2coYGV4cG9ydCBjb25zdCBRJHtlLm5hbWV9ID0ge2ApO1xuICAgICAgICBjb25zb2xlLmxvZyhPYmplY3QuZW50cmllcyhlLnZhbHVlcykubWFwKChbbmFtZSwgdmFsdWVdKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gYCAgICAke25hbWV9OiAkeyh2YWx1ZTogYW55KX0sYDtcbiAgICAgICAgfSkuam9pbignXFxuJykpO1xuICAgICAgICBjb25zb2xlLmxvZyhgfTtcXG5gKTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBxbDogcWwuZ2VuZXJhdGVkKCksXG4gICAgICAgIGpzOiBqcy5nZW5lcmF0ZWQoKSxcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IG1haW47XG4iXX0=