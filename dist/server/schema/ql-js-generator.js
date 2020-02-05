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
    fields: [],
    doc: ''
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
    fields: [],
    doc: ''
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

function getDocMD(schema) {
  var doc = schema.doc;

  if (!doc) {
    return '';
  }

  if (typeof doc === 'string') {
    return doc;
  }

  if (doc.md) {
    return doc.md;
  }

  return '';
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
      type: scalarTypes.string,
      doc: getDocMD(schemaField)
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
      console.log('Invalid field type: ', JSON.stringify(schemaType));
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
      console.log("?? ".concat(name, ": ").concat(JSON.stringify(schemaType).substr(0, 200)));
      return;
    }

    var type = {
      name: name,
      category: schemaType.union ? DbTypeCategory.union : DbTypeCategory.struct,
      fields: [],
      collection: schemaType._.collection,
      doc: getDocMD(schemaType)
    };

    if (type.collection) {
      type.fields.push({
        name: 'id',
        arrayDepth: 0,
        type: scalarTypes.string,
        doc: ''
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
        console.log("Circular reference to type ".concat(type.name));
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
              console.log("Referenced type not found: ".concat(field.type.name));
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

  function genQLDoc(prefix, doc) {
    if (doc.trim() === '') {
      return;
    }

    var lines = doc.split(/\n\r?|\r\n?/);

    if (lines.length === 1 && !lines[0].includes('"')) {
      ql.writeLn(prefix, '"', lines[0], '"');
    } else {
      ql.writeLn(prefix, '"""');
      lines.forEach(function (line) {
        ql.writeLn(prefix, line);
      });
      ql.writeLn(prefix, '"""');
    }
  }

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
      genQLDoc('', type.doc);
      ql.writeLn("type ".concat(type.name, " {"));
      type.fields.forEach(function (field) {
        genQLDoc('\t', field.doc);
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
    genQLDoc('', type.doc);
    ql.writeLn("input ".concat(type.name, "Filter {"));
    type.fields.forEach(function (field) {
      genQLDoc('\t', field.doc);
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
    ql.writeBlockLn("\n        \"Specify sort order direction\"\n        enum QueryOrderByDirection {\n            \"Documents will be sorted in ascended order (e.g. from A to Z)\"\n            ASC\n            \"Documents will be sorted in descendant order (e.g. from Z to A)\"\n            DESC\n        }\n\n        \n        \"\"\"\n        Specify how to sort results.\n        You can sort documents in result set using more than one field.\n        \"\"\"\n        input QueryOrderBy {\n            \"\"\"\n            Path to field which must be used as a sort criteria.\n            If field resides deep in structure path items must be separated with dot (e.g. 'foo.bar.baz').\n            \"\"\"\n            path: String\n            \"Sort order direction\"\n            direction: QueryOrderByDirection\n        }\n\n        type Query {\n        ");
    types.forEach(function (type) {
      ql.writeLn("\t".concat(type.collection || '', "(filter: ").concat(type.name, "Filter, orderBy: [QueryOrderBy], limit: Int, timeout: Float, auth: String): [").concat(type.name, "]"));
    });
    ql.writeBlockLn("\n        }\n\n        ");
  }

  function genQLSubscriptions(types) {
    ql.writeLn('type Subscription {');
    types.forEach(function (type) {
      ql.writeLn("\t".concat(type.collection || '', "(filter: ").concat(type.name, "Filter, auth: String): ").concat(type.name));
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
        js.writeLn("                return context.db.".concat(collection, ".fetchDocByKey(parent.").concat(onField.name, ");"));
      } else if (field.arrayDepth === 1) {
        js.writeLn("                return context.db.".concat(collection, ".fetchDocsByKeys(parent.").concat(onField.name, ");"));
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
      js.writeLn("            ".concat(type.collection || '', ": db.").concat(type.collection || '', ".queryResolver(),"));
    });
    js.writeLn('        },');
    js.writeLn('        Subscription: {');
    collections.forEach(function (type) {
      js.writeLn("            ".concat(type.collection || '', ": db.").concat(type.collection || '', ".subscriptionResolver(),"));
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NlcnZlci9zY2hlbWEvcWwtanMtZ2VuZXJhdG9yLmpzIl0sIm5hbWVzIjpbIkRiVHlwZUNhdGVnb3J5IiwidW5yZXNvbHZlZCIsInNjYWxhciIsInVuaW9uIiwic3RydWN0Iiwic2NhbGFyVHlwZSIsIm5hbWUiLCJjYXRlZ29yeSIsImZpZWxkcyIsImRvYyIsInNjYWxhclR5cGVzIiwidWludDY0IiwidWludDEwMjQiLCJzdHJpbmciLCJ1bnJlc29sdmVkVHlwZSIsImlzTG93ZXJDYXNlZCIsInMiLCJsIiwidG9Mb3dlckNhc2UiLCJ1IiwidG9VcHBlckNhc2UiLCJpc1VwcGVyQ2FzZWQiLCJ0b0FsbENhcHMiLCJyZXN1bHQiLCJpIiwibGVuZ3RoIiwidG9FbnVtU3R5bGUiLCJzdWJzdHIiLCJzdHJpbmdpZnlFbnVtVmFsdWVzIiwidmFsdWVzIiwiT2JqZWN0IiwiZW50cmllcyIsIm1hcCIsInZhbHVlIiwiam9pbiIsImdldERvY01EIiwic2NoZW1hIiwibWQiLCJtYWluIiwic2NoZW1hRGVmIiwiZGJUeXBlcyIsImxhc3RSZXBvcnRlZFR5cGUiLCJlbnVtVHlwZXMiLCJNYXAiLCJyZXBvcnRUeXBlIiwiZmllbGQiLCJ0eXBlIiwiY29uc29sZSIsImxvZyIsInBhcnNlRGJGaWVsZCIsInR5cGVOYW1lIiwic2NoZW1hRmllbGQiLCJzY2hlbWFUeXBlIiwiYXJyYXlEZXB0aCIsImFycmF5IiwiZW51bURlZiIsIl8iLCJzZXQiLCJyZWYiLCJib29sIiwidW5zaWduZWQiLCJzaXplIiwiRXJyb3IiLCJKU09OIiwic3RyaW5naWZ5IiwicHJvY2VzcyIsImV4aXQiLCJ1bndyYXBBcnJheXMiLCJwYXJzZURiVHlwZSIsImNvbGxlY3Rpb24iLCJwdXNoIiwiZm9yRWFjaCIsInVud3JhcHBlZCIsIm93blR5cGUiLCJwYXJzZURiVHlwZXMiLCJ0eXBlcyIsInJlc29sdmluZyIsIlNldCIsInJlc29sdmVkIiwib3JkZXJlZFJlc29sdmVkIiwidCIsInJlc29sdmVUeXBlIiwiaGFzIiwiYWRkIiwiZ2V0IiwicWwiLCJXcml0ZXIiLCJqcyIsImdlblFMRG9jIiwicHJlZml4IiwidHJpbSIsImxpbmVzIiwic3BsaXQiLCJpbmNsdWRlcyIsIndyaXRlTG4iLCJsaW5lIiwidW5pb25WYXJpYW50VHlwZSIsInZhcmlhbnQiLCJnZW5RTFR5cGVEZWNsYXJhdGlvbnNGb3JVbmlvblZhcmlhbnRzIiwid3JpdGVCbG9ja0xuIiwiZ2VuUUxFbnVtVHlwZXMiLCJrZXlzIiwiZ2VuUUxUeXBlRGVjbGFyYXRpb24iLCJ0eXBlRGVjbGFyYXRpb24iLCJyZXBlYXQiLCJwcmV2ZW50VHdpY2UiLCJuYW1lcyIsIndvcmsiLCJnZW5RTEZpbHRlcnNGb3JBcnJheUZpZWxkcyIsInFsTmFtZXMiLCJpdGVtVHlwZU5hbWUiLCJmaWx0ZXJOYW1lIiwib3AiLCJnZW5RTEZpbHRlcnNGb3JFbnVtTmFtZUZpZWxkcyIsImdlblFMU2NhbGFyVHlwZXNGaWx0ZXIiLCJnZW5RTEZpbHRlciIsImdlblFMUXVlcmllcyIsImdlblFMU3Vic2NyaXB0aW9ucyIsImdldFNjYWxhclJlc29sdmVyTmFtZSIsImdlbkpTRmlsdGVyc0ZvckFycmF5RmllbGRzIiwianNOYW1lcyIsIml0ZW1SZXNvbHZlck5hbWUiLCJnZW5KU1N0cnVjdEZpbHRlciIsIm9uIiwiZ2VuSlNVbmlvblJlc29sdmVyIiwiZ2VuSlNGaWx0ZXIiLCJnZW5KU0N1c3RvbVJlc29sdmVycyIsImpvaW5GaWVsZHMiLCJmaWx0ZXIiLCJ4IiwiYmlnVUludEZpZWxkcyIsImVudW1GaWVsZHMiLCJjdXN0b21SZXNvbHZlclJlcXVpcmVkIiwib25GaWVsZCIsImZpbmQiLCJwcmVmaXhMZW5ndGgiLCJnZW5KU1R5cGVSZXNvbHZlcnNGb3JVbmlvbiIsImdlbmVyYXRlIiwicWxBcnJheUZpbHRlcnMiLCJjb2xsZWN0aW9ucyIsImpzQXJyYXlGaWx0ZXJzIiwiZSIsImdlbmVyYXRlZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFFQTs7QUFF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QUNIcUMsSUFBQUEsRUFBRSxFQUFFQSxFQUFFLENBQUN5RCxTQUFILEVBREQ7QUFFSHZELElBQUFBLEVBQUUsRUFBRUEsRUFBRSxDQUFDdUQsU0FBSDtBQUZELEdBQVA7QUFJSDs7ZUFFY3hHLEkiLCJzb3VyY2VzQ29udGVudCI6WyIvL0BmbG93XG5cbmltcG9ydCB7IG1ha2VGaWVsZFR5cGVOYW1lLCBXcml0ZXIgfSBmcm9tICd0b24tbGFicy1kZXYtb3BzL2Rpc3Qvc3JjL2dlbi5qcyc7XG5pbXBvcnQgdHlwZSB7IFNjaGVtYURvYywgU2NoZW1hTWVtYmVyLCBTY2hlbWFUeXBlLCBUeXBlRGVmIH0gZnJvbSAndG9uLWxhYnMtZGV2LW9wcy9zcmMvc2NoZW1hLmpzJztcbmltcG9ydCB7IHBhcnNlVHlwZURlZiB9IGZyb20gJ3Rvbi1sYWJzLWRldi1vcHMvZGlzdC9zcmMvc2NoZW1hLmpzJztcblxuY29uc3QgRGJUeXBlQ2F0ZWdvcnkgPSB7XG4gICAgdW5yZXNvbHZlZDogJ3VucmVzb2x2ZWQnLFxuICAgIHNjYWxhcjogJ3NjYWxhcicsXG4gICAgdW5pb246ICd1bmlvbicsXG4gICAgc3RydWN0OiAnc3RydWN0Jyxcbn07XG5cbnR5cGUgRGJKb2luID0ge1xuICAgIGNvbGxlY3Rpb246IHN0cmluZyxcbiAgICBvbjogc3RyaW5nLFxufVxuXG50eXBlIERiVHlwZSA9IHtcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgZmllbGRzOiBEYkZpZWxkW10sXG4gICAgY2F0ZWdvcnk6ICd1bnJlc29sdmVkJyB8ICdzY2FsYXInIHwgJ3VuaW9uJyB8ICdzdHJ1Y3QnLFxuICAgIGNvbGxlY3Rpb24/OiBzdHJpbmcsXG4gICAgZG9jOiBzdHJpbmcsXG59XG5cbnR5cGUgSW50RW51bURlZiA9IHtcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgdmFsdWVzOiB7XG4gICAgICAgIFtzdHJpbmddOiBudW1iZXJcbiAgICB9LFxufVxuXG50eXBlIERiRmllbGQgPSB7XG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHR5cGU6IERiVHlwZSxcbiAgICBhcnJheURlcHRoOiBudW1iZXIsXG4gICAgam9pbj86IERiSm9pbixcbiAgICBlbnVtRGVmPzogSW50RW51bURlZixcbiAgICBkb2M6IHN0cmluZyxcbn1cblxuZnVuY3Rpb24gc2NhbGFyVHlwZShuYW1lOiBzdHJpbmcpOiBEYlR5cGUge1xuICAgIHJldHVybiB7XG4gICAgICAgIG5hbWUsXG4gICAgICAgIGNhdGVnb3J5OiBEYlR5cGVDYXRlZ29yeS5zY2FsYXIsXG4gICAgICAgIGZpZWxkczogW10sXG4gICAgICAgIGRvYzogJycsXG4gICAgfVxufVxuXG5jb25zdCBzY2FsYXJUeXBlcyA9IHtcbiAgICBpbnQ6IHNjYWxhclR5cGUoJ0ludCcpLFxuICAgIHVpbnQ2NDogc2NhbGFyVHlwZSgnU3RyaW5nJyksXG4gICAgdWludDEwMjQ6IHNjYWxhclR5cGUoJ1N0cmluZycpLFxuICAgIGZsb2F0OiBzY2FsYXJUeXBlKCdGbG9hdCcpLFxuICAgIGJvb2xlYW46IHNjYWxhclR5cGUoJ0Jvb2xlYW4nKSxcbiAgICBzdHJpbmc6IHNjYWxhclR5cGUoJ1N0cmluZycpLFxufTtcblxuZnVuY3Rpb24gdW5yZXNvbHZlZFR5cGUobmFtZTogc3RyaW5nKTogRGJUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBuYW1lLFxuICAgICAgICBjYXRlZ29yeTogRGJUeXBlQ2F0ZWdvcnkudW5yZXNvbHZlZCxcbiAgICAgICAgZmllbGRzOiBbXSxcbiAgICAgICAgZG9jOiAnJyxcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGlzTG93ZXJDYXNlZChzOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBjb25zdCBsID0gcy50b0xvd2VyQ2FzZSgpO1xuICAgIGNvbnN0IHUgPSBzLnRvVXBwZXJDYXNlKCk7XG4gICAgcmV0dXJuICh1ICE9PSBsKSAmJiAocyA9PT0gbCk7XG59XG5cbmZ1bmN0aW9uIGlzVXBwZXJDYXNlZChzOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBjb25zdCBsID0gcy50b0xvd2VyQ2FzZSgpO1xuICAgIGNvbnN0IHUgPSBzLnRvVXBwZXJDYXNlKCk7XG4gICAgcmV0dXJuICh1ICE9PSBsKSAmJiAocyA9PT0gdSk7XG59XG5cbmZ1bmN0aW9uIHRvQWxsQ2FwcyhzOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGxldCByZXN1bHQgPSAnJztcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgaWYgKChpID4gMCkgJiYgKHNbaSAtIDFdICE9PSAnXycpICYmIGlzTG93ZXJDYXNlZChzW2kgLSAxXSkgJiYgaXNVcHBlckNhc2VkKHNbaV0pKSB7XG4gICAgICAgICAgICByZXN1bHQgKz0gJ18nO1xuICAgICAgICB9XG4gICAgICAgIHJlc3VsdCArPSBzW2ldO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0LnRvVXBwZXJDYXNlKCk7XG59XG5cbmZ1bmN0aW9uIHRvRW51bVN0eWxlKHM6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGAke3Muc3Vic3RyKDAsIDEpLnRvVXBwZXJDYXNlKCl9JHtzLnN1YnN0cigxKX1gO1xufVxuXG5mdW5jdGlvbiBzdHJpbmdpZnlFbnVtVmFsdWVzKHZhbHVlczogeyBbc3RyaW5nXTogbnVtYmVyIH0pOiBzdHJpbmcge1xuICAgIGNvbnN0IGZpZWxkcyA9IE9iamVjdC5lbnRyaWVzKHZhbHVlcykubWFwKChbbmFtZSwgdmFsdWVdKSA9PiB7XG4gICAgICAgIHJldHVybiBgJHt0b0VudW1TdHlsZShuYW1lKX06ICR7KHZhbHVlOiBhbnkpfWA7XG4gICAgfSk7XG4gICAgcmV0dXJuIGB7ICR7ZmllbGRzLmpvaW4oJywgJyl9IH1gO1xufVxuXG5mdW5jdGlvbiBnZXREb2NNRChzY2hlbWE6IFNjaGVtYURvYyk6IHN0cmluZyB7XG4gICAgY29uc3QgZG9jID0gc2NoZW1hLmRvYztcbiAgICBpZiAoIWRvYykge1xuICAgICAgICByZXR1cm4gJyc7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgZG9jID09PSAnc3RyaW5nJykge1xuICAgICAgICByZXR1cm4gZG9jO1xuICAgIH1cbiAgICBpZiAoZG9jLm1kKSB7XG4gICAgICAgIHJldHVybiAoZG9jLm1kOiBhbnkpO1xuICAgIH1cbiAgICByZXR1cm4gJyc7XG59XG5cbmZ1bmN0aW9uIG1haW4oc2NoZW1hRGVmOiBUeXBlRGVmKSB7XG5cbiAgICBsZXQgZGJUeXBlczogRGJUeXBlW10gPSBbXTtcbiAgICBsZXQgbGFzdFJlcG9ydGVkVHlwZTogc3RyaW5nID0gJyc7XG4gICAgbGV0IGVudW1UeXBlczogTWFwPHN0cmluZywgSW50RW51bURlZj4gPSBuZXcgTWFwKCk7XG5cbiAgICBmdW5jdGlvbiByZXBvcnRUeXBlKG5hbWU6IHN0cmluZywgZmllbGQ6IHN0cmluZywgdHlwZTogc3RyaW5nKSB7XG4gICAgICAgIGlmIChuYW1lICE9PSBsYXN0UmVwb3J0ZWRUeXBlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhuYW1lKTtcbiAgICAgICAgICAgIGxhc3RSZXBvcnRlZFR5cGUgPSBuYW1lO1xuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUubG9nKGAgICAgJHtmaWVsZH06ICR7dHlwZX1gKTtcblxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlRGJGaWVsZChcbiAgICAgICAgdHlwZU5hbWU6IHN0cmluZyxcbiAgICAgICAgc2NoZW1hRmllbGQ6IFNjaGVtYU1lbWJlcjxTY2hlbWFUeXBlPixcbiAgICApOiBEYkZpZWxkIHtcbiAgICAgICAgbGV0IHNjaGVtYVR5cGUgPSBzY2hlbWFGaWVsZDtcbiAgICAgICAgY29uc3QgZmllbGQ6IERiRmllbGQgPSB7XG4gICAgICAgICAgICBuYW1lOiBzY2hlbWFGaWVsZC5uYW1lLFxuICAgICAgICAgICAgYXJyYXlEZXB0aDogMCxcbiAgICAgICAgICAgIHR5cGU6IHNjYWxhclR5cGVzLnN0cmluZyxcbiAgICAgICAgICAgIGRvYzogZ2V0RG9jTUQoc2NoZW1hRmllbGQpLFxuICAgICAgICB9O1xuICAgICAgICB3aGlsZSAoc2NoZW1hVHlwZS5hcnJheSkge1xuICAgICAgICAgICAgZmllbGQuYXJyYXlEZXB0aCArPSAxO1xuICAgICAgICAgICAgc2NoZW1hVHlwZSA9IHNjaGVtYVR5cGUuYXJyYXk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZW51bURlZjogP0ludEVudW1EZWYgPSAoc2NoZW1hVHlwZS5fICYmIHNjaGVtYVR5cGUuXy5lbnVtKSB8fCBudWxsO1xuICAgICAgICBpZiAoZW51bURlZikge1xuICAgICAgICAgICAgZmllbGQuZW51bURlZiA9IGVudW1EZWY7XG4gICAgICAgICAgICBlbnVtVHlwZXMuc2V0KGVudW1EZWYubmFtZSwgZW51bURlZik7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgam9pbiA9IChzY2hlbWFUeXBlOiBhbnkpLl8uam9pbjtcbiAgICAgICAgaWYgKGpvaW4pIHtcbiAgICAgICAgICAgIGZpZWxkLmpvaW4gPSBqb2luO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzY2hlbWFUeXBlLnVuaW9uIHx8IHNjaGVtYVR5cGUuc3RydWN0KSB7XG4gICAgICAgICAgICBmaWVsZC50eXBlID0gdW5yZXNvbHZlZFR5cGUobWFrZUZpZWxkVHlwZU5hbWUodHlwZU5hbWUsIHNjaGVtYUZpZWxkLm5hbWUpKTtcbiAgICAgICAgfSBlbHNlIGlmIChzY2hlbWFUeXBlLnJlZikge1xuICAgICAgICAgICAgZmllbGQudHlwZSA9IHVucmVzb2x2ZWRUeXBlKHNjaGVtYVR5cGUucmVmLm5hbWUpO1xuICAgICAgICB9IGVsc2UgaWYgKHNjaGVtYVR5cGUuYm9vbCkge1xuICAgICAgICAgICAgZmllbGQudHlwZSA9IHNjYWxhclR5cGVzLmJvb2xlYW47XG4gICAgICAgIH0gZWxzZSBpZiAoc2NoZW1hVHlwZS5pbnQpIHtcbiAgICAgICAgICAgIGNvbnN0IHVuc2lnbmVkOiBib29sZWFuID0gKHNjaGVtYVR5cGUuaW50ICYmIHNjaGVtYVR5cGUuaW50LnVuc2lnbmVkKSB8fCBmYWxzZTtcbiAgICAgICAgICAgIGNvbnN0IHNpemU6IG51bWJlciA9IChzY2hlbWFUeXBlLmludCAmJiBzY2hlbWFUeXBlLmludC5zaXplKSB8fCAzMjtcbiAgICAgICAgICAgIGlmICh1bnNpZ25lZCkge1xuICAgICAgICAgICAgICAgIGlmIChzaXplID49IDEyOCkge1xuICAgICAgICAgICAgICAgICAgICByZXBvcnRUeXBlKHR5cGVOYW1lLCBmaWVsZC5uYW1lLCAndTEwMjQnKTtcbiAgICAgICAgICAgICAgICAgICAgZmllbGQudHlwZSA9IHNjYWxhclR5cGVzLnVpbnQxMDI0O1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc2l6ZSA+PSA2NCkge1xuICAgICAgICAgICAgICAgICAgICByZXBvcnRUeXBlKHR5cGVOYW1lLCBmaWVsZC5uYW1lLCAndTY0Jyk7XG4gICAgICAgICAgICAgICAgICAgIGZpZWxkLnR5cGUgPSBzY2FsYXJUeXBlcy51aW50NjQ7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzaXplID49IDMyKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcG9ydFR5cGUodHlwZU5hbWUsIGZpZWxkLm5hbWUsICd1MzInKTtcbiAgICAgICAgICAgICAgICAgICAgZmllbGQudHlwZSA9IHNjYWxhclR5cGVzLmZsb2F0O1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcG9ydFR5cGUodHlwZU5hbWUsIGZpZWxkLm5hbWUsIGB1JHtzaXplfWApO1xuICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlID0gc2NhbGFyVHlwZXMuaW50O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKHNpemUgPiAzMikge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludGVnZXIgdHlwZSB3aXRoIHNpemUgJHtzaXplfSBiaXQgZG9lcyBub3Qgc3VwcG9ydGVkYCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVwb3J0VHlwZSh0eXBlTmFtZSwgZmllbGQubmFtZSwgJ2kzMicpO1xuICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlID0gc2NhbGFyVHlwZXMuaW50O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChzY2hlbWFUeXBlLmZsb2F0KSB7XG4gICAgICAgICAgICByZXBvcnRUeXBlKHR5cGVOYW1lLCBmaWVsZC5uYW1lLCAnZmxvYXQnKTtcbiAgICAgICAgICAgIGZpZWxkLnR5cGUgPSBzY2FsYXJUeXBlcy5mbG9hdDtcbiAgICAgICAgfSBlbHNlIGlmIChzY2hlbWFUeXBlLnN0cmluZykge1xuICAgICAgICAgICAgZmllbGQudHlwZSA9IHNjYWxhclR5cGVzLnN0cmluZztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZpZWxkLnR5cGUgPSBzY2FsYXJUeXBlcy5zdHJpbmc7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnSW52YWxpZCBmaWVsZCB0eXBlOiAnLCBKU09OLnN0cmluZ2lmeShzY2hlbWFUeXBlKSk7XG4gICAgICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZpZWxkO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHVud3JhcEFycmF5cyh0eXBlOiBTY2hlbWFUeXBlKTogU2NoZW1hVHlwZSB7XG4gICAgICAgIGlmICh0eXBlLmFycmF5KSB7XG4gICAgICAgICAgICByZXR1cm4gdW53cmFwQXJyYXlzKHR5cGUuYXJyYXkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0eXBlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlRGJUeXBlKFxuICAgICAgICBuYW1lOiBzdHJpbmcsXG4gICAgICAgIHNjaGVtYVR5cGU6IFNjaGVtYVR5cGVcbiAgICApIHtcbiAgICAgICAgY29uc3Qgc3RydWN0ID0gc2NoZW1hVHlwZS51bmlvbiB8fCBzY2hlbWFUeXBlLnN0cnVjdDtcbiAgICAgICAgaWYgKCFzdHJ1Y3QpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGA/PyAke25hbWV9OiAke0pTT04uc3RyaW5naWZ5KHNjaGVtYVR5cGUpLnN1YnN0cigwLCAyMDApfWApO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHR5cGU6IERiVHlwZSA9IHtcbiAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICBjYXRlZ29yeTogc2NoZW1hVHlwZS51bmlvbiA/IERiVHlwZUNhdGVnb3J5LnVuaW9uIDogRGJUeXBlQ2F0ZWdvcnkuc3RydWN0LFxuICAgICAgICAgICAgZmllbGRzOiBbXSxcbiAgICAgICAgICAgIGNvbGxlY3Rpb246IChzY2hlbWFUeXBlOiBhbnkpLl8uY29sbGVjdGlvbixcbiAgICAgICAgICAgIGRvYzogZ2V0RG9jTUQoc2NoZW1hVHlwZSksXG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKHR5cGUuY29sbGVjdGlvbikge1xuICAgICAgICAgICAgdHlwZS5maWVsZHMucHVzaCh7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2lkJyxcbiAgICAgICAgICAgICAgICBhcnJheURlcHRoOiAwLFxuICAgICAgICAgICAgICAgIHR5cGU6IHNjYWxhclR5cGVzLnN0cmluZyxcbiAgICAgICAgICAgICAgICBkb2M6ICcnLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgc3RydWN0LmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICB0eXBlLmZpZWxkcy5wdXNoKHBhcnNlRGJGaWVsZChuYW1lLCBmaWVsZCkpO1xuICAgICAgICAgICAgY29uc3QgdW53cmFwcGVkID0gdW53cmFwQXJyYXlzKGZpZWxkKTtcbiAgICAgICAgICAgIGNvbnN0IG93blR5cGUgPSAodW53cmFwcGVkLnN0cnVjdCB8fCB1bndyYXBwZWQudW5pb24pID8gdW53cmFwcGVkIDogbnVsbDtcbiAgICAgICAgICAgIGlmIChvd25UeXBlKSB7XG4gICAgICAgICAgICAgICAgcGFyc2VEYlR5cGUobWFrZUZpZWxkVHlwZU5hbWUobmFtZSwgZmllbGQubmFtZSksIG93blR5cGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgZGJUeXBlcy5wdXNoKHR5cGUpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlRGJUeXBlcyh0eXBlczogU2NoZW1hTWVtYmVyPFNjaGVtYVR5cGU+W10pIHtcbiAgICAgICAgdHlwZXMuZm9yRWFjaCgodHlwZTogU2NoZW1hTWVtYmVyPFNjaGVtYVR5cGU+KSA9PiB7XG4gICAgICAgICAgICBwYXJzZURiVHlwZSh0eXBlLm5hbWUsIHR5cGUpO1xuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgdW5yZXNvbHZlZDogTWFwPHN0cmluZywgRGJUeXBlPiA9IG5ldyBNYXA8c3RyaW5nLCBEYlR5cGU+KCk7XG4gICAgICAgIGNvbnN0IHJlc29sdmluZzogU2V0PHN0cmluZz4gPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICAgICAgY29uc3QgcmVzb2x2ZWQ6IE1hcDxzdHJpbmcsIERiVHlwZT4gPSBuZXcgTWFwPHN0cmluZywgRGJUeXBlPigpO1xuICAgICAgICBjb25zdCBvcmRlcmVkUmVzb2x2ZWQ6IERiVHlwZVtdID0gW107XG4gICAgICAgIGRiVHlwZXMuZm9yRWFjaCh0ID0+IHVucmVzb2x2ZWQuc2V0KHQubmFtZSwgdCkpO1xuICAgICAgICBjb25zdCByZXNvbHZlVHlwZSA9ICh0eXBlOiBEYlR5cGUpID0+IHtcbiAgICAgICAgICAgIGlmIChyZXNvbHZlZC5oYXModHlwZS5uYW1lKSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChyZXNvbHZpbmcuaGFzKHR5cGUubmFtZSkpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgQ2lyY3VsYXIgcmVmZXJlbmNlIHRvIHR5cGUgJHt0eXBlLm5hbWV9YCk7XG4gICAgICAgICAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVzb2x2aW5nLmFkZCh0eXBlLm5hbWUpO1xuICAgICAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZmllbGQudHlwZS5jYXRlZ29yeSA9PT0gRGJUeXBlQ2F0ZWdvcnkudW5yZXNvbHZlZCkge1xuICAgICAgICAgICAgICAgICAgICBsZXQgdHlwZSA9IHJlc29sdmVkLmdldChmaWVsZC50eXBlLm5hbWUpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgPSB1bnJlc29sdmVkLmdldChmaWVsZC50eXBlLm5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlVHlwZSh0eXBlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFJlZmVyZW5jZWQgdHlwZSBub3QgZm91bmQ6ICR7ZmllbGQudHlwZS5uYW1lfWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZmllbGQudHlwZSA9IHR5cGU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJlc29sdmluZy5kZWxldGUodHlwZS5uYW1lKTtcbiAgICAgICAgICAgIG9yZGVyZWRSZXNvbHZlZC5wdXNoKHR5cGUpO1xuICAgICAgICAgICAgdW5yZXNvbHZlZC5kZWxldGUodHlwZS5uYW1lKTtcbiAgICAgICAgICAgIHJlc29sdmVkLnNldCh0eXBlLm5hbWUsIHR5cGUpO1xuICAgICAgICB9O1xuICAgICAgICBkYlR5cGVzLmZvckVhY2gocmVzb2x2ZVR5cGUpO1xuICAgICAgICBkYlR5cGVzID0gb3JkZXJlZFJlc29sdmVkO1xuICAgIH1cblxuLy8gR2VuZXJhdG9yc1xuXG4gICAgY29uc3QgcWwgPSBuZXcgV3JpdGVyKCk7XG4gICAgY29uc3QganMgPSBuZXcgV3JpdGVyKCk7XG5cbiAgICBmdW5jdGlvbiBnZW5RTERvYyhwcmVmaXg6IHN0cmluZywgZG9jOiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKGRvYy50cmltKCkgPT09ICcnKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbGluZXMgPSBkb2Muc3BsaXQoL1xcblxccj98XFxyXFxuPy8pO1xuICAgICAgICBpZiAobGluZXMubGVuZ3RoID09PSAxICYmICFsaW5lc1swXS5pbmNsdWRlcygnXCInKSkge1xuICAgICAgICAgICAgcWwud3JpdGVMbihwcmVmaXgsICdcIicsIGxpbmVzWzBdLCAnXCInKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHFsLndyaXRlTG4ocHJlZml4LCAnXCJcIlwiJyk7XG4gICAgICAgICAgICBsaW5lcy5mb3JFYWNoKChsaW5lKSA9PiB7XG4gICAgICAgICAgICAgICAgcWwud3JpdGVMbihwcmVmaXgsIGxpbmUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBxbC53cml0ZUxuKHByZWZpeCwgJ1wiXCJcIicpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdW5pb25WYXJpYW50VHlwZSh0eXBlOiBEYlR5cGUsIHZhcmlhbnQ6IERiRmllbGQpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gYCR7dHlwZS5uYW1lfSR7dmFyaWFudC5uYW1lfVZhcmlhbnRgO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlblFMVHlwZURlY2xhcmF0aW9uc0ZvclVuaW9uVmFyaWFudHModHlwZTogRGJUeXBlKSB7XG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKHZhcmlhbnQpID0+IHtcbiAgICAgICAgICAgIHFsLndyaXRlQmxvY2tMbihgXG4gICAgICAgIHR5cGUgJHt1bmlvblZhcmlhbnRUeXBlKHR5cGUsIHZhcmlhbnQpfSB7XG4gICAgICAgICAgICAke3ZhcmlhbnQubmFtZX06ICR7dmFyaWFudC50eXBlLm5hbWV9XG4gICAgICAgIH1cblxuICAgICAgICBgKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuUUxFbnVtVHlwZXMoKSB7XG4gICAgICAgIGZvciAoY29uc3QgZW51bURlZjogSW50RW51bURlZiBvZiBlbnVtVHlwZXMudmFsdWVzKCkpIHtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oYGVudW0gJHtlbnVtRGVmLm5hbWV9RW51bSB7YCk7XG4gICAgICAgICAgICBPYmplY3Qua2V5cyhlbnVtRGVmLnZhbHVlcykuZm9yRWFjaCgobmFtZSkgPT4ge1xuICAgICAgICAgICAgICAgIHFsLndyaXRlTG4oYCAgICAke3RvRW51bVN0eWxlKG5hbWUpfWApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGB9YCk7XG4gICAgICAgICAgICBxbC53cml0ZUxuKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5RTFR5cGVEZWNsYXJhdGlvbih0eXBlOiBEYlR5cGUpIHtcbiAgICAgICAgaWYgKHR5cGUuY2F0ZWdvcnkgPT09IERiVHlwZUNhdGVnb3J5LnVuaW9uKSB7XG4gICAgICAgICAgICBnZW5RTFR5cGVEZWNsYXJhdGlvbnNGb3JVbmlvblZhcmlhbnRzKHR5cGUpO1xuICAgICAgICAgICAgcWwud3JpdGVMbihgdW5pb24gJHt0eXBlLm5hbWV9ID0gYCk7XG4gICAgICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKHZhcmlhbnQgPT4ge1xuICAgICAgICAgICAgICAgIHFsLndyaXRlTG4oYFxcdHwgJHt1bmlvblZhcmlhbnRUeXBlKHR5cGUsIHZhcmlhbnQpfWApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBxbC53cml0ZUxuKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBnZW5RTERvYygnJywgdHlwZS5kb2MpO1xuICAgICAgICAgICAgcWwud3JpdGVMbihgdHlwZSAke3R5cGUubmFtZX0ge2ApO1xuICAgICAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaChmaWVsZCA9PiB7XG4gICAgICAgICAgICAgICAgZ2VuUUxEb2MoJ1xcdCcsIGZpZWxkLmRvYyk7XG4gICAgICAgICAgICAgICAgY29uc3QgdHlwZURlY2xhcmF0aW9uID1cbiAgICAgICAgICAgICAgICAgICAgJ1snLnJlcGVhdChmaWVsZC5hcnJheURlcHRoKSArXG4gICAgICAgICAgICAgICAgICAgIGZpZWxkLnR5cGUubmFtZSArXG4gICAgICAgICAgICAgICAgICAgICddJy5yZXBlYXQoZmllbGQuYXJyYXlEZXB0aCk7XG4gICAgICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0JHtmaWVsZC5uYW1lfTogJHt0eXBlRGVjbGFyYXRpb259YCk7XG4gICAgICAgICAgICAgICAgY29uc3QgZW51bURlZiA9IGZpZWxkLmVudW1EZWY7XG4gICAgICAgICAgICAgICAgaWYgKGVudW1EZWYpIHtcbiAgICAgICAgICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0JHtmaWVsZC5uYW1lfV9uYW1lOiAke2VudW1EZWYubmFtZX1FbnVtYCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGB9YCk7XG4gICAgICAgIH1cbiAgICAgICAgcWwud3JpdGVMbigpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHByZXZlbnRUd2ljZShuYW1lOiBzdHJpbmcsIG5hbWVzOiBTZXQ8c3RyaW5nPiwgd29yazogKCkgPT4gdm9pZCkge1xuICAgICAgICBpZiAoIW5hbWVzLmhhcyhuYW1lKSkge1xuICAgICAgICAgICAgbmFtZXMuYWRkKG5hbWUpO1xuICAgICAgICAgICAgd29yaygpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuUUxGaWx0ZXJzRm9yQXJyYXlGaWVsZHModHlwZTogRGJUeXBlLCBxbE5hbWVzOiBTZXQ8c3RyaW5nPikge1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgbGV0IGl0ZW1UeXBlTmFtZSA9IGZpZWxkLnR5cGUubmFtZTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZmllbGQuYXJyYXlEZXB0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmlsdGVyTmFtZSA9IGAke2l0ZW1UeXBlTmFtZX1BcnJheUZpbHRlcmA7XG4gICAgICAgICAgICAgICAgcHJldmVudFR3aWNlKGZpbHRlck5hbWUsIHFsTmFtZXMsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcWwud3JpdGVMbihgaW5wdXQgJHtmaWx0ZXJOYW1lfSB7YCk7XG4gICAgICAgICAgICAgICAgICAgIFsnYW55JywgJ2FsbCddLmZvckVhY2goKG9wKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBxbC53cml0ZUxuKGBcXHQke29wfTogJHtpdGVtVHlwZU5hbWV9RmlsdGVyYCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBxbC53cml0ZUxuKCd9Jyk7XG4gICAgICAgICAgICAgICAgICAgIHFsLndyaXRlTG4oKTtcblxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGl0ZW1UeXBlTmFtZSArPSAnQXJyYXknO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5RTEZpbHRlcnNGb3JFbnVtTmFtZUZpZWxkcyh0eXBlOiBEYlR5cGUsIHFsTmFtZXM6IFNldDxzdHJpbmc+KSB7XG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBlbnVtRGVmID0gZmllbGQuZW51bURlZjtcbiAgICAgICAgICAgIGlmIChlbnVtRGVmKSB7XG4gICAgICAgICAgICAgICAgcHJldmVudFR3aWNlKGAke2VudW1EZWYubmFtZX1FbnVtRmlsdGVyYCwgcWxOYW1lcywgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBnZW5RTFNjYWxhclR5cGVzRmlsdGVyKGAke2VudW1EZWYubmFtZX1FbnVtYCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlblFMRmlsdGVyKHR5cGU6IERiVHlwZSwgcWxOYW1lczogU2V0PHN0cmluZz4pIHtcbiAgICAgICAgaWYgKHR5cGUuZmllbGRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGdlblFMRmlsdGVyc0ZvckFycmF5RmllbGRzKHR5cGUsIHFsTmFtZXMpO1xuICAgICAgICBnZW5RTEZpbHRlcnNGb3JFbnVtTmFtZUZpZWxkcyh0eXBlLCBxbE5hbWVzKTtcbiAgICAgICAgZ2VuUUxEb2MoJycsIHR5cGUuZG9jKTtcbiAgICAgICAgcWwud3JpdGVMbihgaW5wdXQgJHt0eXBlLm5hbWV9RmlsdGVyIHtgKTtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGdlblFMRG9jKCdcXHQnLCBmaWVsZC5kb2MpO1xuICAgICAgICAgICAgY29uc3QgdHlwZURlY2xhcmF0aW9uID0gZmllbGQudHlwZS5uYW1lICsgXCJBcnJheVwiLnJlcGVhdChmaWVsZC5hcnJheURlcHRoKTtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oYFxcdCR7ZmllbGQubmFtZX06ICR7dHlwZURlY2xhcmF0aW9ufUZpbHRlcmApO1xuICAgICAgICAgICAgY29uc3QgZW51bURlZiA9IGZpZWxkLmVudW1EZWY7XG4gICAgICAgICAgICBpZiAoZW51bURlZikge1xuICAgICAgICAgICAgICAgIHFsLndyaXRlTG4oYFxcdCR7ZmllbGQubmFtZX1fbmFtZTogJHtlbnVtRGVmLm5hbWV9RW51bUZpbHRlcmApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcWwud3JpdGVMbihgfWApO1xuICAgICAgICBxbC53cml0ZUxuKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuUUxTY2FsYXJUeXBlc0ZpbHRlcihuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgcWwud3JpdGVMbihgaW5wdXQgJHtuYW1lfUZpbHRlciB7YCk7XG4gICAgICAgIFsnZXEnLCAnbmUnLCAnZ3QnLCAnbHQnLCAnZ2UnLCAnbGUnXS5mb3JFYWNoKChvcCkgPT4ge1xuICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0JHtvcH06ICR7bmFtZX1gKTtcbiAgICAgICAgfSk7XG4gICAgICAgIFsnaW4nLCAnbm90SW4nXS5mb3JFYWNoKChvcCkgPT4ge1xuICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0JHtvcH06IFske25hbWV9XWApO1xuICAgICAgICB9KTtcbiAgICAgICAgcWwud3JpdGVMbignfScpO1xuICAgICAgICBxbC53cml0ZUxuKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuUUxRdWVyaWVzKHR5cGVzOiBEYlR5cGVbXSkge1xuICAgICAgICBxbC53cml0ZUJsb2NrTG4oYFxuICAgICAgICBcIlNwZWNpZnkgc29ydCBvcmRlciBkaXJlY3Rpb25cIlxuICAgICAgICBlbnVtIFF1ZXJ5T3JkZXJCeURpcmVjdGlvbiB7XG4gICAgICAgICAgICBcIkRvY3VtZW50cyB3aWxsIGJlIHNvcnRlZCBpbiBhc2NlbmRlZCBvcmRlciAoZS5nLiBmcm9tIEEgdG8gWilcIlxuICAgICAgICAgICAgQVNDXG4gICAgICAgICAgICBcIkRvY3VtZW50cyB3aWxsIGJlIHNvcnRlZCBpbiBkZXNjZW5kYW50IG9yZGVyIChlLmcuIGZyb20gWiB0byBBKVwiXG4gICAgICAgICAgICBERVNDXG4gICAgICAgIH1cblxuICAgICAgICBcbiAgICAgICAgXCJcIlwiXG4gICAgICAgIFNwZWNpZnkgaG93IHRvIHNvcnQgcmVzdWx0cy5cbiAgICAgICAgWW91IGNhbiBzb3J0IGRvY3VtZW50cyBpbiByZXN1bHQgc2V0IHVzaW5nIG1vcmUgdGhhbiBvbmUgZmllbGQuXG4gICAgICAgIFwiXCJcIlxuICAgICAgICBpbnB1dCBRdWVyeU9yZGVyQnkge1xuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgICBQYXRoIHRvIGZpZWxkIHdoaWNoIG11c3QgYmUgdXNlZCBhcyBhIHNvcnQgY3JpdGVyaWEuXG4gICAgICAgICAgICBJZiBmaWVsZCByZXNpZGVzIGRlZXAgaW4gc3RydWN0dXJlIHBhdGggaXRlbXMgbXVzdCBiZSBzZXBhcmF0ZWQgd2l0aCBkb3QgKGUuZy4gJ2Zvby5iYXIuYmF6JykuXG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICAgIHBhdGg6IFN0cmluZ1xuICAgICAgICAgICAgXCJTb3J0IG9yZGVyIGRpcmVjdGlvblwiXG4gICAgICAgICAgICBkaXJlY3Rpb246IFF1ZXJ5T3JkZXJCeURpcmVjdGlvblxuICAgICAgICB9XG5cbiAgICAgICAgdHlwZSBRdWVyeSB7XG4gICAgICAgIGApO1xuXG4gICAgICAgIHR5cGVzLmZvckVhY2goKHR5cGU6IERiVHlwZSkgPT4ge1xuICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0JHt0eXBlLmNvbGxlY3Rpb24gfHwgJyd9KGZpbHRlcjogJHt0eXBlLm5hbWV9RmlsdGVyLCBvcmRlckJ5OiBbUXVlcnlPcmRlckJ5XSwgbGltaXQ6IEludCwgdGltZW91dDogRmxvYXQsIGF1dGg6IFN0cmluZyk6IFske3R5cGUubmFtZX1dYCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHFsLndyaXRlQmxvY2tMbihgXG4gICAgICAgIH1cblxuICAgICAgICBgKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5RTFN1YnNjcmlwdGlvbnModHlwZXM6IERiVHlwZVtdKSB7XG4gICAgICAgIHFsLndyaXRlTG4oJ3R5cGUgU3Vic2NyaXB0aW9uIHsnKTtcbiAgICAgICAgdHlwZXMuZm9yRWFjaCgodHlwZSkgPT4ge1xuICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0JHt0eXBlLmNvbGxlY3Rpb24gfHwgJyd9KGZpbHRlcjogJHt0eXBlLm5hbWV9RmlsdGVyLCBhdXRoOiBTdHJpbmcpOiAke3R5cGUubmFtZX1gKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHFsLndyaXRlTG4oJ30nKTtcbiAgICB9XG5cblxuICAgIGZ1bmN0aW9uIGdldFNjYWxhclJlc29sdmVyTmFtZShmaWVsZDogRGJGaWVsZCk6IHN0cmluZyB7XG4gICAgICAgIGlmIChmaWVsZC50eXBlID09PSBzY2FsYXJUeXBlcy51aW50NjQpIHtcbiAgICAgICAgICAgIHJldHVybiAnYmlnVUludDEnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChmaWVsZC50eXBlID09PSBzY2FsYXJUeXBlcy51aW50MTAyNCkge1xuICAgICAgICAgICAgcmV0dXJuICdiaWdVSW50Mic7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICdzY2FsYXInO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkpTRmlsdGVyc0ZvckFycmF5RmllbGRzKHR5cGU6IERiVHlwZSwganNOYW1lczogU2V0PHN0cmluZz4pIHtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGxldCBpdGVtVHlwZU5hbWUgPSBmaWVsZC50eXBlLm5hbWU7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZpZWxkLmFycmF5RGVwdGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpbHRlck5hbWUgPSBgJHtpdGVtVHlwZU5hbWV9QXJyYXlgO1xuICAgICAgICAgICAgICAgIHByZXZlbnRUd2ljZShmaWx0ZXJOYW1lLCBqc05hbWVzLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1SZXNvbHZlck5hbWUgPSAoaSA9PT0gMCAmJiBmaWVsZC50eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS5zY2FsYXIpXG4gICAgICAgICAgICAgICAgICAgICAgICA/IGdldFNjYWxhclJlc29sdmVyTmFtZShmaWVsZClcbiAgICAgICAgICAgICAgICAgICAgICAgIDogaXRlbVR5cGVOYW1lO1xuICAgICAgICAgICAgICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICAgICAgICAgIGNvbnN0ICR7ZmlsdGVyTmFtZX0gPSBhcnJheSgke2l0ZW1SZXNvbHZlck5hbWV9KTtcbiAgICAgICAgICAgICAgICBgKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBpdGVtVHlwZU5hbWUgKz0gJ0FycmF5JztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuSlNTdHJ1Y3RGaWx0ZXIodHlwZTogRGJUeXBlKSB7XG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIGNvbnN0ICR7dHlwZS5uYW1lfSA9IHN0cnVjdCh7XG4gICAgYCk7XG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBsZXQgdHlwZURlY2xhcmF0aW9uOiA/c3RyaW5nID0gbnVsbDtcbiAgICAgICAgICAgIGNvbnN0IGpvaW4gPSBmaWVsZC5qb2luO1xuICAgICAgICAgICAgaWYgKGpvaW4pIHtcbiAgICAgICAgICAgICAgICB0eXBlRGVjbGFyYXRpb24gPSBgam9pbiR7ZmllbGQuYXJyYXlEZXB0aCA+IDAgPyAnQXJyYXknIDogJyd9KCcke2pvaW4ub259JywgJyR7ZmllbGQudHlwZS5jb2xsZWN0aW9uIHx8ICcnfScsICR7ZmllbGQudHlwZS5uYW1lfSlgO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC5hcnJheURlcHRoID4gMCkge1xuICAgICAgICAgICAgICAgIHR5cGVEZWNsYXJhdGlvbiA9XG4gICAgICAgICAgICAgICAgICAgIGZpZWxkLnR5cGUubmFtZSArXG4gICAgICAgICAgICAgICAgICAgICdBcnJheScucmVwZWF0KGZpZWxkLmFycmF5RGVwdGgpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC50eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS5zY2FsYXIpIHtcbiAgICAgICAgICAgICAgICB0eXBlRGVjbGFyYXRpb24gPSBnZXRTY2FsYXJSZXNvbHZlck5hbWUoZmllbGQpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC50eXBlLmZpZWxkcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgdHlwZURlY2xhcmF0aW9uID0gZmllbGQudHlwZS5uYW1lO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHR5cGVEZWNsYXJhdGlvbikge1xuICAgICAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAke2ZpZWxkLm5hbWV9OiAke3R5cGVEZWNsYXJhdGlvbn0sYCk7XG4gICAgICAgICAgICAgICAgY29uc3QgZW51bURlZiA9IGZpZWxkLmVudW1EZWY7XG4gICAgICAgICAgICAgICAgaWYgKGVudW1EZWYpIHtcbiAgICAgICAgICAgICAgICAgICAganMud3JpdGVMbihgICAgICR7ZmllbGQubmFtZX1fbmFtZTogZW51bU5hbWUoJyR7ZmllbGQubmFtZX0nLCAke3N0cmluZ2lmeUVudW1WYWx1ZXMoZW51bURlZi52YWx1ZXMpfSksYCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgfSR7dHlwZS5jb2xsZWN0aW9uID8gJywgdHJ1ZScgOiAnJ30pO1xuXG4gICAgYCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuSlNVbmlvblJlc29sdmVyKHR5cGU6IERiVHlwZSkge1xuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBjb25zdCAke3R5cGUubmFtZX1SZXNvbHZlciA9IHtcbiAgICAgICAgICAgIF9fcmVzb2x2ZVR5cGUob2JqLCBjb250ZXh0LCBpbmZvKSB7XG4gICAgICAgIGApO1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKCh2YXJpYW50KSA9PiB7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgIGlmICgnJHt2YXJpYW50Lm5hbWV9JyBpbiBvYmopIHtgKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgIHJldHVybiAnJHt1bmlvblZhcmlhbnRUeXBlKHR5cGUsIHZhcmlhbnQpfSc7YCk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgIH1gKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgYCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuSlNGaWx0ZXIodHlwZTogRGJUeXBlLCBqc05hbWVzOiBTZXQ8c3RyaW5nPikge1xuICAgICAgICBpZiAodHlwZS5maWVsZHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGUuY2F0ZWdvcnkgPT09IERiVHlwZUNhdGVnb3J5LnVuaW9uKSB7XG4gICAgICAgICAgICAvLyBnZW5KU0ZpbHRlcnNGb3JVbmlvblZhcmlhbnRzKHR5cGUsIGpzTmFtZXMpO1xuICAgICAgICB9XG4gICAgICAgIGdlbkpTRmlsdGVyc0ZvckFycmF5RmllbGRzKHR5cGUsIGpzTmFtZXMpO1xuICAgICAgICBnZW5KU1N0cnVjdEZpbHRlcih0eXBlKTtcbiAgICAgICAgaWYgKHR5cGUuY2F0ZWdvcnkgPT09IERiVHlwZUNhdGVnb3J5LnVuaW9uKSB7XG4gICAgICAgICAgICBnZW5KU1VuaW9uUmVzb2x2ZXIodHlwZSk7XG4gICAgICAgIH1cblxuXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2VuZXJhdGUgY3VzdG9tIHJlc29sdmVycyBmb3IgdHlwZXMgd2l0aDpcbiAgICAgKiAtIGlkIGZpZWxkXG4gICAgICogLSBqb2luIGZpZWxkc1xuICAgICAqIC0gdTY0IGFuZCBoaWdoZXIgZmllbGRzXG4gICAgICogQHBhcmFtIHR5cGVcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBnZW5KU0N1c3RvbVJlc29sdmVycyh0eXBlOiBEYlR5cGUpIHtcbiAgICAgICAgY29uc3Qgam9pbkZpZWxkcyA9IHR5cGUuZmllbGRzLmZpbHRlcih4ID0+ICEheC5qb2luKTtcbiAgICAgICAgY29uc3QgYmlnVUludEZpZWxkcyA9IHR5cGUuZmllbGRzLmZpbHRlcigoeDogRGJGaWVsZCkgPT4gKHgudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDY0KSB8fCAoeC50eXBlID09PSBzY2FsYXJUeXBlcy51aW50MTAyNCkpO1xuICAgICAgICBjb25zdCBlbnVtRmllbGRzID0gdHlwZS5maWVsZHMuZmlsdGVyKHggPT4geC5lbnVtRGVmKTtcbiAgICAgICAgY29uc3QgY3VzdG9tUmVzb2x2ZXJSZXF1aXJlZCA9IHR5cGUuY29sbGVjdGlvblxuICAgICAgICAgICAgfHwgam9pbkZpZWxkcy5sZW5ndGggPiAwXG4gICAgICAgICAgICB8fCBiaWdVSW50RmllbGRzLmxlbmd0aCA+IDBcbiAgICAgICAgICAgIHx8IGVudW1GaWVsZHMubGVuZ3RoID4gMDtcbiAgICAgICAgaWYgKCFjdXN0b21SZXNvbHZlclJlcXVpcmVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAganMud3JpdGVMbihgICAgICAgICAke3R5cGUubmFtZX06IHtgKTtcbiAgICAgICAgaWYgKHR5cGUuY29sbGVjdGlvbikge1xuICAgICAgICAgICAganMud3JpdGVMbignICAgICAgICAgICAgaWQocGFyZW50KSB7Jyk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKCcgICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5OycpO1xuICAgICAgICAgICAganMud3JpdGVMbignICAgICAgICAgICAgfSwnKTtcbiAgICAgICAgfVxuICAgICAgICBqb2luRmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBvbkZpZWxkID0gdHlwZS5maWVsZHMuZmluZCh4ID0+IHgubmFtZSA9PT0gKGZpZWxkLmpvaW4gJiYgZmllbGQuam9pbi5vbikgfHwgJycpO1xuICAgICAgICAgICAgaWYgKCFvbkZpZWxkKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgJ0pvaW4gb24gZmllbGQgZG9lcyBub3QgZXhpc3QuJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGNvbGxlY3Rpb24gPSBmaWVsZC50eXBlLmNvbGxlY3Rpb247XG4gICAgICAgICAgICBpZiAoIWNvbGxlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICB0aHJvdyAnSm9pbmVkIHR5cGUgaXMgbm90IGEgY29sbGVjdGlvbi4nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgJHtmaWVsZC5uYW1lfShwYXJlbnQsIF9hcmdzLCBjb250ZXh0KSB7YCk7XG4gICAgICAgICAgICBpZiAoZmllbGQuYXJyYXlEZXB0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICAgICByZXR1cm4gY29udGV4dC5kYi4ke2NvbGxlY3Rpb259LmZldGNoRG9jQnlLZXkocGFyZW50LiR7b25GaWVsZC5uYW1lfSk7YCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLmFycmF5RGVwdGggPT09IDEpIHtcbiAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQuZGIuJHtjb2xsZWN0aW9ufS5mZXRjaERvY3NCeUtleXMocGFyZW50LiR7b25GaWVsZC5uYW1lfSk7YCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93ICdKb2lucyBvbiBhIG5lc3RlZCBhcnJheXMgZG9lcyBub3Qgc3VwcG9ydGVkLic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICB9LGApO1xuICAgICAgICB9KTtcbiAgICAgICAgYmlnVUludEZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcHJlZml4TGVuZ3RoID0gZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDY0ID8gMSA6IDI7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAke2ZpZWxkLm5hbWV9KHBhcmVudCkge2ApO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgke3ByZWZpeExlbmd0aH0sIHBhcmVudC4ke2ZpZWxkLm5hbWV9KTtgKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgIH0sYCk7XG4gICAgICAgIH0pO1xuICAgICAgICBlbnVtRmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBlbnVtRGVmID0gZmllbGQuZW51bURlZjtcbiAgICAgICAgICAgIGlmIChlbnVtRGVmKSB7XG4gICAgICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgJHtmaWVsZC5uYW1lfV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCcke2ZpZWxkLm5hbWV9JywgJHtzdHJpbmdpZnlFbnVtVmFsdWVzKGVudW1EZWYudmFsdWVzKX0pLGApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAganMud3JpdGVMbihgICAgICAgICB9LGApO1xuICAgIH1cblxuXG4gICAgZnVuY3Rpb24gZ2VuSlNUeXBlUmVzb2x2ZXJzRm9yVW5pb24odHlwZTogRGJUeXBlKSB7XG4gICAgICAgIGlmICh0eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS51bmlvbikge1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAke3R5cGUubmFtZX06ICR7dHlwZS5uYW1lfVJlc29sdmVyLGApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuZXJhdGUodHlwZXM6IERiVHlwZVtdKSB7XG5cbiAgICAgICAgLy8gUUxcblxuICAgICAgICBbJ1N0cmluZycsICdCb29sZWFuJywgJ0ludCcsICdGbG9hdCddLmZvckVhY2goZ2VuUUxTY2FsYXJUeXBlc0ZpbHRlcik7XG4gICAgICAgIGdlblFMRW51bVR5cGVzKCk7XG4gICAgICAgIHR5cGVzLmZvckVhY2godHlwZSA9PiBnZW5RTFR5cGVEZWNsYXJhdGlvbih0eXBlKSk7XG4gICAgICAgIGNvbnN0IHFsQXJyYXlGaWx0ZXJzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgICAgIHR5cGVzLmZvckVhY2godHlwZSA9PiBnZW5RTEZpbHRlcih0eXBlLCBxbEFycmF5RmlsdGVycykpO1xuXG4gICAgICAgIGNvbnN0IGNvbGxlY3Rpb25zID0gdHlwZXMuZmlsdGVyKHQgPT4gISF0LmNvbGxlY3Rpb24pO1xuICAgICAgICBnZW5RTFF1ZXJpZXMoY29sbGVjdGlvbnMpO1xuICAgICAgICBnZW5RTFN1YnNjcmlwdGlvbnMoY29sbGVjdGlvbnMpO1xuXG4gICAgICAgIC8vIEpTXG5cbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgY29uc3Qge1xuICAgICAgICAgICAgc2NhbGFyLFxuICAgICAgICAgICAgYmlnVUludDEsXG4gICAgICAgICAgICBiaWdVSW50MixcbiAgICAgICAgICAgIHJlc29sdmVCaWdVSW50LFxuICAgICAgICAgICAgc3RydWN0LFxuICAgICAgICAgICAgYXJyYXksXG4gICAgICAgICAgICBqb2luLFxuICAgICAgICAgICAgam9pbkFycmF5LFxuICAgICAgICAgICAgZW51bU5hbWUsXG4gICAgICAgICAgICBjcmVhdGVFbnVtTmFtZVJlc29sdmVyLFxuICAgICAgICB9ID0gcmVxdWlyZSgnLi9xLXR5cGVzLmpzJyk7XG4gICAgICAgIGApO1xuICAgICAgICBjb25zdCBqc0FycmF5RmlsdGVycyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKHR5cGUgPT4gZ2VuSlNGaWx0ZXIodHlwZSwganNBcnJheUZpbHRlcnMpKTtcblxuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBmdW5jdGlvbiBjcmVhdGVSZXNvbHZlcnMoZGIpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgIGApO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgICAgICAgICBnZW5KU0N1c3RvbVJlc29sdmVycyh0eXBlKTtcbiAgICAgICAgICAgIGdlbkpTVHlwZVJlc29sdmVyc0ZvclVuaW9uKHR5cGUpO1xuICAgICAgICB9KTtcbiAgICAgICAganMud3JpdGVMbignICAgICAgICBRdWVyeTogeycpO1xuICAgICAgICBjb2xsZWN0aW9ucy5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAke3R5cGUuY29sbGVjdGlvbiB8fCAnJ306IGRiLiR7dHlwZS5jb2xsZWN0aW9uIHx8ICcnfS5xdWVyeVJlc29sdmVyKCksYClcbiAgICAgICAgfSk7XG4gICAgICAgIGpzLndyaXRlTG4oJyAgICAgICAgfSwnKTtcbiAgICAgICAganMud3JpdGVMbignICAgICAgICBTdWJzY3JpcHRpb246IHsnKTtcbiAgICAgICAgY29sbGVjdGlvbnMuZm9yRWFjaCgodHlwZSkgPT4ge1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgJHt0eXBlLmNvbGxlY3Rpb24gfHwgJyd9OiBkYi4ke3R5cGUuY29sbGVjdGlvbiB8fCAnJ30uc3Vic2NyaXB0aW9uUmVzb2x2ZXIoKSxgKVxuICAgICAgICB9KTtcbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBgKTtcblxuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAgICAgICAgIGNyZWF0ZVJlc29sdmVycyxcbiAgICAgICAgYCk7XG4gICAgICAgIHR5cGVzLmZvckVhY2godHlwZSA9PiBqcy53cml0ZUxuKGAgICAgJHt0eXBlLm5hbWV9LGApKTtcbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgfTtcbiAgICAgICAgYCk7XG4gICAgfVxuXG4gICAgY29uc3Qgc2NoZW1hID0gcGFyc2VUeXBlRGVmKHNjaGVtYURlZik7XG5cbiAgICBpZiAoc2NoZW1hLmNsYXNzKSB7XG4gICAgICAgIHBhcnNlRGJUeXBlcyhzY2hlbWEuY2xhc3MudHlwZXMpO1xuICAgICAgICBnZW5lcmF0ZShkYlR5cGVzKTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IGU6IEludEVudW1EZWYgb2YgZW51bVR5cGVzLnZhbHVlcygpKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBleHBvcnQgY29uc3QgUSR7ZS5uYW1lfSA9IHtgKTtcbiAgICAgICAgY29uc29sZS5sb2coT2JqZWN0LmVudHJpZXMoZS52YWx1ZXMpLm1hcCgoW25hbWUsIHZhbHVlXSkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGAgICAgJHtuYW1lfTogJHsodmFsdWU6IGFueSl9LGA7XG4gICAgICAgIH0pLmpvaW4oJ1xcbicpKTtcbiAgICAgICAgY29uc29sZS5sb2coYH07XFxuYCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcWw6IHFsLmdlbmVyYXRlZCgpLFxuICAgICAgICBqczoganMuZ2VuZXJhdGVkKCksXG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBtYWluO1xuIl19