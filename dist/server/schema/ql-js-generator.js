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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NlcnZlci9zY2hlbWEvcWwtanMtZ2VuZXJhdG9yLmpzIl0sIm5hbWVzIjpbIkRiVHlwZUNhdGVnb3J5IiwidW5yZXNvbHZlZCIsInNjYWxhciIsInVuaW9uIiwic3RydWN0Iiwic2NhbGFyVHlwZSIsIm5hbWUiLCJjYXRlZ29yeSIsImZpZWxkcyIsImRvYyIsInNjYWxhclR5cGVzIiwidWludDY0IiwidWludDEwMjQiLCJzdHJpbmciLCJ1bnJlc29sdmVkVHlwZSIsImlzTG93ZXJDYXNlZCIsInMiLCJsIiwidG9Mb3dlckNhc2UiLCJ1IiwidG9VcHBlckNhc2UiLCJpc1VwcGVyQ2FzZWQiLCJ0b0FsbENhcHMiLCJyZXN1bHQiLCJpIiwibGVuZ3RoIiwidG9FbnVtU3R5bGUiLCJzdWJzdHIiLCJzdHJpbmdpZnlFbnVtVmFsdWVzIiwidmFsdWVzIiwiT2JqZWN0IiwiZW50cmllcyIsIm1hcCIsInZhbHVlIiwiam9pbiIsImdldERvY01EIiwic2NoZW1hIiwibWQiLCJtYWluIiwic2NoZW1hRGVmIiwiZGJUeXBlcyIsImxhc3RSZXBvcnRlZFR5cGUiLCJlbnVtVHlwZXMiLCJNYXAiLCJyZXBvcnRUeXBlIiwiZmllbGQiLCJ0eXBlIiwiY29uc29sZSIsImxvZyIsInBhcnNlRGJGaWVsZCIsInR5cGVOYW1lIiwic2NoZW1hRmllbGQiLCJzY2hlbWFUeXBlIiwiYXJyYXlEZXB0aCIsImFycmF5IiwiZW51bURlZiIsIl8iLCJzZXQiLCJyZWYiLCJib29sIiwidW5zaWduZWQiLCJzaXplIiwiRXJyb3IiLCJKU09OIiwic3RyaW5naWZ5IiwicHJvY2VzcyIsImV4aXQiLCJ1bndyYXBBcnJheXMiLCJwYXJzZURiVHlwZSIsImNvbGxlY3Rpb24iLCJwdXNoIiwiZm9yRWFjaCIsInVud3JhcHBlZCIsIm93blR5cGUiLCJwYXJzZURiVHlwZXMiLCJ0eXBlcyIsInJlc29sdmluZyIsIlNldCIsInJlc29sdmVkIiwib3JkZXJlZFJlc29sdmVkIiwidCIsInJlc29sdmVUeXBlIiwiaGFzIiwiYWRkIiwiZ2V0IiwicWwiLCJXcml0ZXIiLCJqcyIsImdlblFMRG9jIiwicHJlZml4IiwidHJpbSIsImxpbmVzIiwic3BsaXQiLCJpbmNsdWRlcyIsIndyaXRlTG4iLCJsaW5lIiwidW5pb25WYXJpYW50VHlwZSIsInZhcmlhbnQiLCJnZW5RTFR5cGVEZWNsYXJhdGlvbnNGb3JVbmlvblZhcmlhbnRzIiwid3JpdGVCbG9ja0xuIiwiZ2VuUUxFbnVtVHlwZXMiLCJrZXlzIiwiZ2VuUUxUeXBlRGVjbGFyYXRpb24iLCJ0eXBlRGVjbGFyYXRpb24iLCJyZXBlYXQiLCJwcmV2ZW50VHdpY2UiLCJuYW1lcyIsIndvcmsiLCJnZW5RTEZpbHRlcnNGb3JBcnJheUZpZWxkcyIsInFsTmFtZXMiLCJpdGVtVHlwZU5hbWUiLCJmaWx0ZXJOYW1lIiwib3AiLCJnZW5RTEZpbHRlcnNGb3JFbnVtTmFtZUZpZWxkcyIsImdlblFMU2NhbGFyVHlwZXNGaWx0ZXIiLCJnZW5RTEZpbHRlciIsImdlblFMUXVlcmllcyIsImdlblFMU3Vic2NyaXB0aW9ucyIsImdldFNjYWxhclJlc29sdmVyTmFtZSIsImdlbkpTRmlsdGVyc0ZvckFycmF5RmllbGRzIiwianNOYW1lcyIsIml0ZW1SZXNvbHZlck5hbWUiLCJnZW5KU1N0cnVjdEZpbHRlciIsIm9uIiwiZ2VuSlNVbmlvblJlc29sdmVyIiwiZ2VuSlNGaWx0ZXIiLCJnZW5KU0N1c3RvbVJlc29sdmVycyIsImpvaW5GaWVsZHMiLCJmaWx0ZXIiLCJ4IiwiYmlnVUludEZpZWxkcyIsImVudW1GaWVsZHMiLCJjdXN0b21SZXNvbHZlclJlcXVpcmVkIiwib25GaWVsZCIsImZpbmQiLCJwcmVmaXhMZW5ndGgiLCJnZW5KU1R5cGVSZXNvbHZlcnNGb3JVbmlvbiIsImdlbmVyYXRlIiwicWxBcnJheUZpbHRlcnMiLCJjb2xsZWN0aW9ucyIsImpzQXJyYXlGaWx0ZXJzIiwiZSIsImdlbmVyYXRlZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFFQTs7QUFF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QjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOztBQTJsQjlCLFNBQU87QUFDSHFDLElBQUFBLEVBQUUsRUFBRUEsRUFBRSxDQUFDeUQsU0FBSCxFQUREO0FBRUh2RCxJQUFBQSxFQUFFLEVBQUVBLEVBQUUsQ0FBQ3VELFNBQUg7QUFGRCxHQUFQO0FBSUg7O2VBRWN4RyxJIiwic291cmNlc0NvbnRlbnQiOlsiLy9AZmxvd1xuXG5pbXBvcnQgeyBtYWtlRmllbGRUeXBlTmFtZSwgV3JpdGVyIH0gZnJvbSAndG9uLWxhYnMtZGV2LW9wcy9kaXN0L3NyYy9nZW4uanMnO1xuaW1wb3J0IHR5cGUgeyBTY2hlbWFEb2MsIFNjaGVtYU1lbWJlciwgU2NoZW1hVHlwZSwgVHlwZURlZiB9IGZyb20gJ3Rvbi1sYWJzLWRldi1vcHMvc3JjL3NjaGVtYS5qcyc7XG5pbXBvcnQgeyBwYXJzZVR5cGVEZWYgfSBmcm9tICd0b24tbGFicy1kZXYtb3BzL2Rpc3Qvc3JjL3NjaGVtYS5qcyc7XG5cbmNvbnN0IERiVHlwZUNhdGVnb3J5ID0ge1xuICAgIHVucmVzb2x2ZWQ6ICd1bnJlc29sdmVkJyxcbiAgICBzY2FsYXI6ICdzY2FsYXInLFxuICAgIHVuaW9uOiAndW5pb24nLFxuICAgIHN0cnVjdDogJ3N0cnVjdCcsXG59O1xuXG50eXBlIERiSm9pbiA9IHtcbiAgICBjb2xsZWN0aW9uOiBzdHJpbmcsXG4gICAgb246IHN0cmluZyxcbn1cblxudHlwZSBEYlR5cGUgPSB7XG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGZpZWxkczogRGJGaWVsZFtdLFxuICAgIGNhdGVnb3J5OiAndW5yZXNvbHZlZCcgfCAnc2NhbGFyJyB8ICd1bmlvbicgfCAnc3RydWN0JyxcbiAgICBjb2xsZWN0aW9uPzogc3RyaW5nLFxuICAgIGRvYzogc3RyaW5nLFxufVxuXG50eXBlIEludEVudW1EZWYgPSB7XG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHZhbHVlczoge1xuICAgICAgICBbc3RyaW5nXTogbnVtYmVyXG4gICAgfSxcbn1cblxudHlwZSBEYkZpZWxkID0ge1xuICAgIG5hbWU6IHN0cmluZyxcbiAgICB0eXBlOiBEYlR5cGUsXG4gICAgYXJyYXlEZXB0aDogbnVtYmVyLFxuICAgIGpvaW4/OiBEYkpvaW4sXG4gICAgZW51bURlZj86IEludEVudW1EZWYsXG4gICAgZG9jOiBzdHJpbmcsXG59XG5cbmZ1bmN0aW9uIHNjYWxhclR5cGUobmFtZTogc3RyaW5nKTogRGJUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBuYW1lLFxuICAgICAgICBjYXRlZ29yeTogRGJUeXBlQ2F0ZWdvcnkuc2NhbGFyLFxuICAgICAgICBmaWVsZHM6IFtdLFxuICAgICAgICBkb2M6ICcnLFxuICAgIH1cbn1cblxuY29uc3Qgc2NhbGFyVHlwZXMgPSB7XG4gICAgaW50OiBzY2FsYXJUeXBlKCdJbnQnKSxcbiAgICB1aW50NjQ6IHNjYWxhclR5cGUoJ1N0cmluZycpLFxuICAgIHVpbnQxMDI0OiBzY2FsYXJUeXBlKCdTdHJpbmcnKSxcbiAgICBmbG9hdDogc2NhbGFyVHlwZSgnRmxvYXQnKSxcbiAgICBib29sZWFuOiBzY2FsYXJUeXBlKCdCb29sZWFuJyksXG4gICAgc3RyaW5nOiBzY2FsYXJUeXBlKCdTdHJpbmcnKSxcbn07XG5cbmZ1bmN0aW9uIHVucmVzb2x2ZWRUeXBlKG5hbWU6IHN0cmluZyk6IERiVHlwZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgbmFtZSxcbiAgICAgICAgY2F0ZWdvcnk6IERiVHlwZUNhdGVnb3J5LnVucmVzb2x2ZWQsXG4gICAgICAgIGZpZWxkczogW10sXG4gICAgICAgIGRvYzogJycsXG4gICAgfVxufVxuXG5mdW5jdGlvbiBpc0xvd2VyQ2FzZWQoczogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgY29uc3QgbCA9IHMudG9Mb3dlckNhc2UoKTtcbiAgICBjb25zdCB1ID0gcy50b1VwcGVyQ2FzZSgpO1xuICAgIHJldHVybiAodSAhPT0gbCkgJiYgKHMgPT09IGwpO1xufVxuXG5mdW5jdGlvbiBpc1VwcGVyQ2FzZWQoczogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgY29uc3QgbCA9IHMudG9Mb3dlckNhc2UoKTtcbiAgICBjb25zdCB1ID0gcy50b1VwcGVyQ2FzZSgpO1xuICAgIHJldHVybiAodSAhPT0gbCkgJiYgKHMgPT09IHUpO1xufVxuXG5mdW5jdGlvbiB0b0FsbENhcHMoczogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBsZXQgcmVzdWx0ID0gJyc7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGlmICgoaSA+IDApICYmIChzW2kgLSAxXSAhPT0gJ18nKSAmJiBpc0xvd2VyQ2FzZWQoc1tpIC0gMV0pICYmIGlzVXBwZXJDYXNlZChzW2ldKSkge1xuICAgICAgICAgICAgcmVzdWx0ICs9ICdfJztcbiAgICAgICAgfVxuICAgICAgICByZXN1bHQgKz0gc1tpXTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdC50b1VwcGVyQ2FzZSgpO1xufVxuXG5mdW5jdGlvbiB0b0VudW1TdHlsZShzOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiBgJHtzLnN1YnN0cigwLCAxKS50b1VwcGVyQ2FzZSgpfSR7cy5zdWJzdHIoMSl9YDtcbn1cblxuZnVuY3Rpb24gc3RyaW5naWZ5RW51bVZhbHVlcyh2YWx1ZXM6IHsgW3N0cmluZ106IG51bWJlciB9KTogc3RyaW5nIHtcbiAgICBjb25zdCBmaWVsZHMgPSBPYmplY3QuZW50cmllcyh2YWx1ZXMpLm1hcCgoW25hbWUsIHZhbHVlXSkgPT4ge1xuICAgICAgICByZXR1cm4gYCR7dG9FbnVtU3R5bGUobmFtZSl9OiAkeyh2YWx1ZTogYW55KX1gO1xuICAgIH0pO1xuICAgIHJldHVybiBgeyAke2ZpZWxkcy5qb2luKCcsICcpfSB9YDtcbn1cblxuZnVuY3Rpb24gZ2V0RG9jTUQoc2NoZW1hOiBTY2hlbWFEb2MpOiBzdHJpbmcge1xuICAgIGNvbnN0IGRvYyA9IHNjaGVtYS5kb2M7XG4gICAgaWYgKCFkb2MpIHtcbiAgICAgICAgcmV0dXJuICcnO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGRvYyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgcmV0dXJuIGRvYztcbiAgICB9XG4gICAgaWYgKGRvYy5tZCkge1xuICAgICAgICByZXR1cm4gKGRvYy5tZDogYW55KTtcbiAgICB9XG4gICAgcmV0dXJuICcnO1xufVxuXG5mdW5jdGlvbiBtYWluKHNjaGVtYURlZjogVHlwZURlZikge1xuXG4gICAgbGV0IGRiVHlwZXM6IERiVHlwZVtdID0gW107XG4gICAgbGV0IGxhc3RSZXBvcnRlZFR5cGU6IHN0cmluZyA9ICcnO1xuICAgIGxldCBlbnVtVHlwZXM6IE1hcDxzdHJpbmcsIEludEVudW1EZWY+ID0gbmV3IE1hcCgpO1xuXG4gICAgZnVuY3Rpb24gcmVwb3J0VHlwZShuYW1lOiBzdHJpbmcsIGZpZWxkOiBzdHJpbmcsIHR5cGU6IHN0cmluZykge1xuICAgICAgICBpZiAobmFtZSAhPT0gbGFzdFJlcG9ydGVkVHlwZSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2cobmFtZSk7XG4gICAgICAgICAgICBsYXN0UmVwb3J0ZWRUeXBlID0gbmFtZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmxvZyhgICAgICR7ZmllbGR9OiAke3R5cGV9YCk7XG5cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZURiRmllbGQoXG4gICAgICAgIHR5cGVOYW1lOiBzdHJpbmcsXG4gICAgICAgIHNjaGVtYUZpZWxkOiBTY2hlbWFNZW1iZXI8U2NoZW1hVHlwZT4sXG4gICAgKTogRGJGaWVsZCB7XG4gICAgICAgIGxldCBzY2hlbWFUeXBlID0gc2NoZW1hRmllbGQ7XG4gICAgICAgIGNvbnN0IGZpZWxkOiBEYkZpZWxkID0ge1xuICAgICAgICAgICAgbmFtZTogc2NoZW1hRmllbGQubmFtZSxcbiAgICAgICAgICAgIGFycmF5RGVwdGg6IDAsXG4gICAgICAgICAgICB0eXBlOiBzY2FsYXJUeXBlcy5zdHJpbmcsXG4gICAgICAgICAgICBkb2M6IGdldERvY01EKHNjaGVtYUZpZWxkKSxcbiAgICAgICAgfTtcbiAgICAgICAgd2hpbGUgKHNjaGVtYVR5cGUuYXJyYXkpIHtcbiAgICAgICAgICAgIGZpZWxkLmFycmF5RGVwdGggKz0gMTtcbiAgICAgICAgICAgIHNjaGVtYVR5cGUgPSBzY2hlbWFUeXBlLmFycmF5O1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGVudW1EZWY6ID9JbnRFbnVtRGVmID0gKHNjaGVtYVR5cGUuXyAmJiBzY2hlbWFUeXBlLl8uZW51bSkgfHwgbnVsbDtcbiAgICAgICAgaWYgKGVudW1EZWYpIHtcbiAgICAgICAgICAgIGZpZWxkLmVudW1EZWYgPSBlbnVtRGVmO1xuICAgICAgICAgICAgZW51bVR5cGVzLnNldChlbnVtRGVmLm5hbWUsIGVudW1EZWYpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGpvaW4gPSAoc2NoZW1hVHlwZTogYW55KS5fLmpvaW47XG4gICAgICAgIGlmIChqb2luKSB7XG4gICAgICAgICAgICBmaWVsZC5qb2luID0gam9pbjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc2NoZW1hVHlwZS51bmlvbiB8fCBzY2hlbWFUeXBlLnN0cnVjdCkge1xuICAgICAgICAgICAgZmllbGQudHlwZSA9IHVucmVzb2x2ZWRUeXBlKG1ha2VGaWVsZFR5cGVOYW1lKHR5cGVOYW1lLCBzY2hlbWFGaWVsZC5uYW1lKSk7XG4gICAgICAgIH0gZWxzZSBpZiAoc2NoZW1hVHlwZS5yZWYpIHtcbiAgICAgICAgICAgIGZpZWxkLnR5cGUgPSB1bnJlc29sdmVkVHlwZShzY2hlbWFUeXBlLnJlZi5uYW1lKTtcbiAgICAgICAgfSBlbHNlIGlmIChzY2hlbWFUeXBlLmJvb2wpIHtcbiAgICAgICAgICAgIGZpZWxkLnR5cGUgPSBzY2FsYXJUeXBlcy5ib29sZWFuO1xuICAgICAgICB9IGVsc2UgaWYgKHNjaGVtYVR5cGUuaW50KSB7XG4gICAgICAgICAgICBjb25zdCB1bnNpZ25lZDogYm9vbGVhbiA9IChzY2hlbWFUeXBlLmludCAmJiBzY2hlbWFUeXBlLmludC51bnNpZ25lZCkgfHwgZmFsc2U7XG4gICAgICAgICAgICBjb25zdCBzaXplOiBudW1iZXIgPSAoc2NoZW1hVHlwZS5pbnQgJiYgc2NoZW1hVHlwZS5pbnQuc2l6ZSkgfHwgMzI7XG4gICAgICAgICAgICBpZiAodW5zaWduZWQpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2l6ZSA+PSAxMjgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVwb3J0VHlwZSh0eXBlTmFtZSwgZmllbGQubmFtZSwgJ3UxMDI0Jyk7XG4gICAgICAgICAgICAgICAgICAgIGZpZWxkLnR5cGUgPSBzY2FsYXJUeXBlcy51aW50MTAyNDtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHNpemUgPj0gNjQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVwb3J0VHlwZSh0eXBlTmFtZSwgZmllbGQubmFtZSwgJ3U2NCcpO1xuICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlID0gc2NhbGFyVHlwZXMudWludDY0O1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc2l6ZSA+PSAzMikge1xuICAgICAgICAgICAgICAgICAgICByZXBvcnRUeXBlKHR5cGVOYW1lLCBmaWVsZC5uYW1lLCAndTMyJyk7XG4gICAgICAgICAgICAgICAgICAgIGZpZWxkLnR5cGUgPSBzY2FsYXJUeXBlcy5mbG9hdDtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXBvcnRUeXBlKHR5cGVOYW1lLCBmaWVsZC5uYW1lLCBgdSR7c2l6ZX1gKTtcbiAgICAgICAgICAgICAgICAgICAgZmllbGQudHlwZSA9IHNjYWxhclR5cGVzLmludDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChzaXplID4gMzIpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnRlZ2VyIHR5cGUgd2l0aCBzaXplICR7c2l6ZX0gYml0IGRvZXMgbm90IHN1cHBvcnRlZGApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcG9ydFR5cGUodHlwZU5hbWUsIGZpZWxkLm5hbWUsICdpMzInKTtcbiAgICAgICAgICAgICAgICAgICAgZmllbGQudHlwZSA9IHNjYWxhclR5cGVzLmludDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoc2NoZW1hVHlwZS5mbG9hdCkge1xuICAgICAgICAgICAgcmVwb3J0VHlwZSh0eXBlTmFtZSwgZmllbGQubmFtZSwgJ2Zsb2F0Jyk7XG4gICAgICAgICAgICBmaWVsZC50eXBlID0gc2NhbGFyVHlwZXMuZmxvYXQ7XG4gICAgICAgIH0gZWxzZSBpZiAoc2NoZW1hVHlwZS5zdHJpbmcpIHtcbiAgICAgICAgICAgIGZpZWxkLnR5cGUgPSBzY2FsYXJUeXBlcy5zdHJpbmc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmaWVsZC50eXBlID0gc2NhbGFyVHlwZXMuc3RyaW5nO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJz4+PiBJbnZhbGlkIGZpZWxkIHR5cGU6ICcsIEpTT04uc3RyaW5naWZ5KHNjaGVtYVR5cGUpKTtcbiAgICAgICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmllbGQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdW53cmFwQXJyYXlzKHR5cGU6IFNjaGVtYVR5cGUpOiBTY2hlbWFUeXBlIHtcbiAgICAgICAgaWYgKHR5cGUuYXJyYXkpIHtcbiAgICAgICAgICAgIHJldHVybiB1bndyYXBBcnJheXModHlwZS5hcnJheSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHR5cGU7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VEYlR5cGUoXG4gICAgICAgIG5hbWU6IHN0cmluZyxcbiAgICAgICAgc2NoZW1hVHlwZTogU2NoZW1hVHlwZVxuICAgICkge1xuICAgICAgICBjb25zdCBzdHJ1Y3QgPSBzY2hlbWFUeXBlLnVuaW9uIHx8IHNjaGVtYVR5cGUuc3RydWN0O1xuICAgICAgICBpZiAoIXN0cnVjdCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJz4+PicsIGA/PyAke25hbWV9OiAke0pTT04uc3RyaW5naWZ5KHNjaGVtYVR5cGUpLnN1YnN0cigwLCAyMDApfWApO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHR5cGU6IERiVHlwZSA9IHtcbiAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICBjYXRlZ29yeTogc2NoZW1hVHlwZS51bmlvbiA/IERiVHlwZUNhdGVnb3J5LnVuaW9uIDogRGJUeXBlQ2F0ZWdvcnkuc3RydWN0LFxuICAgICAgICAgICAgZmllbGRzOiBbXSxcbiAgICAgICAgICAgIGNvbGxlY3Rpb246IChzY2hlbWFUeXBlOiBhbnkpLl8uY29sbGVjdGlvbixcbiAgICAgICAgICAgIGRvYzogZ2V0RG9jTUQoc2NoZW1hVHlwZSksXG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKHR5cGUuY29sbGVjdGlvbikge1xuICAgICAgICAgICAgdHlwZS5maWVsZHMucHVzaCh7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2lkJyxcbiAgICAgICAgICAgICAgICBhcnJheURlcHRoOiAwLFxuICAgICAgICAgICAgICAgIHR5cGU6IHNjYWxhclR5cGVzLnN0cmluZyxcbiAgICAgICAgICAgICAgICBkb2M6ICcnLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgc3RydWN0LmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICB0eXBlLmZpZWxkcy5wdXNoKHBhcnNlRGJGaWVsZChuYW1lLCBmaWVsZCkpO1xuICAgICAgICAgICAgY29uc3QgdW53cmFwcGVkID0gdW53cmFwQXJyYXlzKGZpZWxkKTtcbiAgICAgICAgICAgIGNvbnN0IG93blR5cGUgPSAodW53cmFwcGVkLnN0cnVjdCB8fCB1bndyYXBwZWQudW5pb24pID8gdW53cmFwcGVkIDogbnVsbDtcbiAgICAgICAgICAgIGlmIChvd25UeXBlKSB7XG4gICAgICAgICAgICAgICAgcGFyc2VEYlR5cGUobWFrZUZpZWxkVHlwZU5hbWUobmFtZSwgZmllbGQubmFtZSksIG93blR5cGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgZGJUeXBlcy5wdXNoKHR5cGUpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlRGJUeXBlcyh0eXBlczogU2NoZW1hTWVtYmVyPFNjaGVtYVR5cGU+W10pIHtcbiAgICAgICAgdHlwZXMuZm9yRWFjaCgodHlwZTogU2NoZW1hTWVtYmVyPFNjaGVtYVR5cGU+KSA9PiB7XG4gICAgICAgICAgICBwYXJzZURiVHlwZSh0eXBlLm5hbWUsIHR5cGUpO1xuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgdW5yZXNvbHZlZDogTWFwPHN0cmluZywgRGJUeXBlPiA9IG5ldyBNYXA8c3RyaW5nLCBEYlR5cGU+KCk7XG4gICAgICAgIGNvbnN0IHJlc29sdmluZzogU2V0PHN0cmluZz4gPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICAgICAgY29uc3QgcmVzb2x2ZWQ6IE1hcDxzdHJpbmcsIERiVHlwZT4gPSBuZXcgTWFwPHN0cmluZywgRGJUeXBlPigpO1xuICAgICAgICBjb25zdCBvcmRlcmVkUmVzb2x2ZWQ6IERiVHlwZVtdID0gW107XG4gICAgICAgIGRiVHlwZXMuZm9yRWFjaCh0ID0+IHVucmVzb2x2ZWQuc2V0KHQubmFtZSwgdCkpO1xuICAgICAgICBjb25zdCByZXNvbHZlVHlwZSA9ICh0eXBlOiBEYlR5cGUpID0+IHtcbiAgICAgICAgICAgIGlmIChyZXNvbHZlZC5oYXModHlwZS5uYW1lKSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChyZXNvbHZpbmcuaGFzKHR5cGUubmFtZSkpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnPj4+JywgYENpcmN1bGFyIHJlZmVyZW5jZSB0byB0eXBlICR7dHlwZS5uYW1lfWApO1xuICAgICAgICAgICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlc29sdmluZy5hZGQodHlwZS5uYW1lKTtcbiAgICAgICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGZpZWxkLnR5cGUuY2F0ZWdvcnkgPT09IERiVHlwZUNhdGVnb3J5LnVucmVzb2x2ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHR5cGUgPSByZXNvbHZlZC5nZXQoZmllbGQudHlwZS5uYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlID0gdW5yZXNvbHZlZC5nZXQoZmllbGQudHlwZS5uYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZVR5cGUodHlwZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+Pj4nLCBgUmVmZXJlbmNlZCB0eXBlIG5vdCBmb3VuZDogJHtmaWVsZC50eXBlLm5hbWV9YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlID0gdHlwZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmVzb2x2aW5nLmRlbGV0ZSh0eXBlLm5hbWUpO1xuICAgICAgICAgICAgb3JkZXJlZFJlc29sdmVkLnB1c2godHlwZSk7XG4gICAgICAgICAgICB1bnJlc29sdmVkLmRlbGV0ZSh0eXBlLm5hbWUpO1xuICAgICAgICAgICAgcmVzb2x2ZWQuc2V0KHR5cGUubmFtZSwgdHlwZSk7XG4gICAgICAgIH07XG4gICAgICAgIGRiVHlwZXMuZm9yRWFjaChyZXNvbHZlVHlwZSk7XG4gICAgICAgIGRiVHlwZXMgPSBvcmRlcmVkUmVzb2x2ZWQ7XG4gICAgfVxuXG4vLyBHZW5lcmF0b3JzXG5cbiAgICBjb25zdCBxbCA9IG5ldyBXcml0ZXIoKTtcbiAgICBjb25zdCBqcyA9IG5ldyBXcml0ZXIoKTtcblxuICAgIGZ1bmN0aW9uIGdlblFMRG9jKHByZWZpeDogc3RyaW5nLCBkb2M6IHN0cmluZykge1xuICAgICAgICBpZiAoZG9jLnRyaW0oKSA9PT0gJycpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBsaW5lcyA9IGRvYy5zcGxpdCgvXFxuXFxyP3xcXHJcXG4/Lyk7XG4gICAgICAgIGlmIChsaW5lcy5sZW5ndGggPT09IDEgJiYgIWxpbmVzWzBdLmluY2x1ZGVzKCdcIicpKSB7XG4gICAgICAgICAgICBxbC53cml0ZUxuKHByZWZpeCwgJ1wiJywgbGluZXNbMF0sICdcIicpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcWwud3JpdGVMbihwcmVmaXgsICdcIlwiXCInKTtcbiAgICAgICAgICAgIGxpbmVzLmZvckVhY2goKGxpbmUpID0+IHtcbiAgICAgICAgICAgICAgICBxbC53cml0ZUxuKHByZWZpeCwgbGluZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHFsLndyaXRlTG4ocHJlZml4LCAnXCJcIlwiJyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiB1bmlvblZhcmlhbnRUeXBlKHR5cGU6IERiVHlwZSwgdmFyaWFudDogRGJGaWVsZCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiBgJHt0eXBlLm5hbWV9JHt2YXJpYW50Lm5hbWV9VmFyaWFudGA7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuUUxUeXBlRGVjbGFyYXRpb25zRm9yVW5pb25WYXJpYW50cyh0eXBlOiBEYlR5cGUpIHtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgodmFyaWFudCkgPT4ge1xuICAgICAgICAgICAgcWwud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgdHlwZSAke3VuaW9uVmFyaWFudFR5cGUodHlwZSwgdmFyaWFudCl9IHtcbiAgICAgICAgICAgICR7dmFyaWFudC5uYW1lfTogJHt2YXJpYW50LnR5cGUubmFtZX1cbiAgICAgICAgfVxuXG4gICAgICAgIGApO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5RTEVudW1UeXBlcygpIHtcbiAgICAgICAgZm9yIChjb25zdCBlbnVtRGVmOiBJbnRFbnVtRGVmIG9mIGVudW1UeXBlcy52YWx1ZXMoKSkge1xuICAgICAgICAgICAgcWwud3JpdGVMbihgZW51bSAke2VudW1EZWYubmFtZX1FbnVtIHtgKTtcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKGVudW1EZWYudmFsdWVzKS5mb3JFYWNoKChuYW1lKSA9PiB7XG4gICAgICAgICAgICAgICAgcWwud3JpdGVMbihgICAgICR7dG9FbnVtU3R5bGUobmFtZSl9YCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oYH1gKTtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlblFMVHlwZURlY2xhcmF0aW9uKHR5cGU6IERiVHlwZSkge1xuICAgICAgICBpZiAodHlwZS5jYXRlZ29yeSA9PT0gRGJUeXBlQ2F0ZWdvcnkudW5pb24pIHtcbiAgICAgICAgICAgIGdlblFMVHlwZURlY2xhcmF0aW9uc0ZvclVuaW9uVmFyaWFudHModHlwZSk7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGB1bmlvbiAke3R5cGUubmFtZX0gPSBgKTtcbiAgICAgICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2godmFyaWFudCA9PiB7XG4gICAgICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0fCAke3VuaW9uVmFyaWFudFR5cGUodHlwZSwgdmFyaWFudCl9YCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGdlblFMRG9jKCcnLCB0eXBlLmRvYyk7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGB0eXBlICR7dHlwZS5uYW1lfSB7YCk7XG4gICAgICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKGZpZWxkID0+IHtcbiAgICAgICAgICAgICAgICBnZW5RTERvYygnXFx0JywgZmllbGQuZG9jKTtcbiAgICAgICAgICAgICAgICBjb25zdCB0eXBlRGVjbGFyYXRpb24gPVxuICAgICAgICAgICAgICAgICAgICAnWycucmVwZWF0KGZpZWxkLmFycmF5RGVwdGgpICtcbiAgICAgICAgICAgICAgICAgICAgZmllbGQudHlwZS5uYW1lICtcbiAgICAgICAgICAgICAgICAgICAgJ10nLnJlcGVhdChmaWVsZC5hcnJheURlcHRoKTtcbiAgICAgICAgICAgICAgICBxbC53cml0ZUxuKGBcXHQke2ZpZWxkLm5hbWV9OiAke3R5cGVEZWNsYXJhdGlvbn1gKTtcbiAgICAgICAgICAgICAgICBjb25zdCBlbnVtRGVmID0gZmllbGQuZW51bURlZjtcbiAgICAgICAgICAgICAgICBpZiAoZW51bURlZikge1xuICAgICAgICAgICAgICAgICAgICBxbC53cml0ZUxuKGBcXHQke2ZpZWxkLm5hbWV9X25hbWU6ICR7ZW51bURlZi5uYW1lfUVudW1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oYH1gKTtcbiAgICAgICAgfVxuICAgICAgICBxbC53cml0ZUxuKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcHJldmVudFR3aWNlKG5hbWU6IHN0cmluZywgbmFtZXM6IFNldDxzdHJpbmc+LCB3b3JrOiAoKSA9PiB2b2lkKSB7XG4gICAgICAgIGlmICghbmFtZXMuaGFzKG5hbWUpKSB7XG4gICAgICAgICAgICBuYW1lcy5hZGQobmFtZSk7XG4gICAgICAgICAgICB3b3JrKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5RTEZpbHRlcnNGb3JBcnJheUZpZWxkcyh0eXBlOiBEYlR5cGUsIHFsTmFtZXM6IFNldDxzdHJpbmc+KSB7XG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBsZXQgaXRlbVR5cGVOYW1lID0gZmllbGQudHlwZS5uYW1lO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmaWVsZC5hcnJheURlcHRoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWx0ZXJOYW1lID0gYCR7aXRlbVR5cGVOYW1lfUFycmF5RmlsdGVyYDtcbiAgICAgICAgICAgICAgICBwcmV2ZW50VHdpY2UoZmlsdGVyTmFtZSwgcWxOYW1lcywgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBxbC53cml0ZUxuKGBpbnB1dCAke2ZpbHRlck5hbWV9IHtgKTtcbiAgICAgICAgICAgICAgICAgICAgWydhbnknLCAnYWxsJ10uZm9yRWFjaCgob3ApID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHFsLndyaXRlTG4oYFxcdCR7b3B9OiAke2l0ZW1UeXBlTmFtZX1GaWx0ZXJgKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHFsLndyaXRlTG4oJ30nKTtcbiAgICAgICAgICAgICAgICAgICAgcWwud3JpdGVMbigpO1xuXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaXRlbVR5cGVOYW1lICs9ICdBcnJheSc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlblFMRmlsdGVyc0ZvckVudW1OYW1lRmllbGRzKHR5cGU6IERiVHlwZSwgcWxOYW1lczogU2V0PHN0cmluZz4pIHtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGVudW1EZWYgPSBmaWVsZC5lbnVtRGVmO1xuICAgICAgICAgICAgaWYgKGVudW1EZWYpIHtcbiAgICAgICAgICAgICAgICBwcmV2ZW50VHdpY2UoYCR7ZW51bURlZi5uYW1lfUVudW1GaWx0ZXJgLCBxbE5hbWVzLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGdlblFMU2NhbGFyVHlwZXNGaWx0ZXIoYCR7ZW51bURlZi5uYW1lfUVudW1gKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuUUxGaWx0ZXIodHlwZTogRGJUeXBlLCBxbE5hbWVzOiBTZXQ8c3RyaW5nPikge1xuICAgICAgICBpZiAodHlwZS5maWVsZHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgZ2VuUUxGaWx0ZXJzRm9yQXJyYXlGaWVsZHModHlwZSwgcWxOYW1lcyk7XG4gICAgICAgIGdlblFMRmlsdGVyc0ZvckVudW1OYW1lRmllbGRzKHR5cGUsIHFsTmFtZXMpO1xuICAgICAgICBnZW5RTERvYygnJywgdHlwZS5kb2MpO1xuICAgICAgICBxbC53cml0ZUxuKGBpbnB1dCAke3R5cGUubmFtZX1GaWx0ZXIge2ApO1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgZ2VuUUxEb2MoJ1xcdCcsIGZpZWxkLmRvYyk7XG4gICAgICAgICAgICBjb25zdCB0eXBlRGVjbGFyYXRpb24gPSBmaWVsZC50eXBlLm5hbWUgKyBcIkFycmF5XCIucmVwZWF0KGZpZWxkLmFycmF5RGVwdGgpO1xuICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0JHtmaWVsZC5uYW1lfTogJHt0eXBlRGVjbGFyYXRpb259RmlsdGVyYCk7XG4gICAgICAgICAgICBjb25zdCBlbnVtRGVmID0gZmllbGQuZW51bURlZjtcbiAgICAgICAgICAgIGlmIChlbnVtRGVmKSB7XG4gICAgICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0JHtmaWVsZC5uYW1lfV9uYW1lOiAke2VudW1EZWYubmFtZX1FbnVtRmlsdGVyYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBxbC53cml0ZUxuKGB9YCk7XG4gICAgICAgIHFsLndyaXRlTG4oKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5RTFNjYWxhclR5cGVzRmlsdGVyKG5hbWU6IHN0cmluZykge1xuICAgICAgICBxbC53cml0ZUxuKGBpbnB1dCAke25hbWV9RmlsdGVyIHtgKTtcbiAgICAgICAgWydlcScsICduZScsICdndCcsICdsdCcsICdnZScsICdsZSddLmZvckVhY2goKG9wKSA9PiB7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGBcXHQke29wfTogJHtuYW1lfWApO1xuICAgICAgICB9KTtcbiAgICAgICAgWydpbicsICdub3RJbiddLmZvckVhY2goKG9wKSA9PiB7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGBcXHQke29wfTogWyR7bmFtZX1dYCk7XG4gICAgICAgIH0pO1xuICAgICAgICBxbC53cml0ZUxuKCd9Jyk7XG4gICAgICAgIHFsLndyaXRlTG4oKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5RTFF1ZXJpZXModHlwZXM6IERiVHlwZVtdKSB7XG4gICAgICAgIHFsLndyaXRlQmxvY2tMbihgXG4gICAgICAgIFwiU3BlY2lmeSBzb3J0IG9yZGVyIGRpcmVjdGlvblwiXG4gICAgICAgIGVudW0gUXVlcnlPcmRlckJ5RGlyZWN0aW9uIHtcbiAgICAgICAgICAgIFwiRG9jdW1lbnRzIHdpbGwgYmUgc29ydGVkIGluIGFzY2VuZGVkIG9yZGVyIChlLmcuIGZyb20gQSB0byBaKVwiXG4gICAgICAgICAgICBBU0NcbiAgICAgICAgICAgIFwiRG9jdW1lbnRzIHdpbGwgYmUgc29ydGVkIGluIGRlc2NlbmRhbnQgb3JkZXIgKGUuZy4gZnJvbSBaIHRvIEEpXCJcbiAgICAgICAgICAgIERFU0NcbiAgICAgICAgfVxuXG4gICAgICAgIFxuICAgICAgICBcIlwiXCJcbiAgICAgICAgU3BlY2lmeSBob3cgdG8gc29ydCByZXN1bHRzLlxuICAgICAgICBZb3UgY2FuIHNvcnQgZG9jdW1lbnRzIGluIHJlc3VsdCBzZXQgdXNpbmcgbW9yZSB0aGFuIG9uZSBmaWVsZC5cbiAgICAgICAgXCJcIlwiXG4gICAgICAgIGlucHV0IFF1ZXJ5T3JkZXJCeSB7XG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICAgIFBhdGggdG8gZmllbGQgd2hpY2ggbXVzdCBiZSB1c2VkIGFzIGEgc29ydCBjcml0ZXJpYS5cbiAgICAgICAgICAgIElmIGZpZWxkIHJlc2lkZXMgZGVlcCBpbiBzdHJ1Y3R1cmUgcGF0aCBpdGVtcyBtdXN0IGJlIHNlcGFyYXRlZCB3aXRoIGRvdCAoZS5nLiAnZm9vLmJhci5iYXonKS5cbiAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgICAgcGF0aDogU3RyaW5nXG4gICAgICAgICAgICBcIlNvcnQgb3JkZXIgZGlyZWN0aW9uXCJcbiAgICAgICAgICAgIGRpcmVjdGlvbjogUXVlcnlPcmRlckJ5RGlyZWN0aW9uXG4gICAgICAgIH1cblxuICAgICAgICB0eXBlIFF1ZXJ5IHtcbiAgICAgICAgYCk7XG5cbiAgICAgICAgdHlwZXMuZm9yRWFjaCgodHlwZTogRGJUeXBlKSA9PiB7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGBcXHQke3R5cGUuY29sbGVjdGlvbiB8fCAnJ30oZmlsdGVyOiAke3R5cGUubmFtZX1GaWx0ZXIsIG9yZGVyQnk6IFtRdWVyeU9yZGVyQnldLCBsaW1pdDogSW50KTogWyR7dHlwZS5uYW1lfV1gKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcWwud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgfVxuXG4gICAgICAgIGApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlblFMU3Vic2NyaXB0aW9ucyh0eXBlczogRGJUeXBlW10pIHtcbiAgICAgICAgcWwud3JpdGVMbigndHlwZSBTdWJzY3JpcHRpb24geycpO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGBcXHQke3R5cGUuY29sbGVjdGlvbiB8fCAnJ30oZmlsdGVyOiAke3R5cGUubmFtZX1GaWx0ZXIpOiAke3R5cGUubmFtZX1gKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHFsLndyaXRlTG4oJ30nKTtcbiAgICB9XG5cblxuICAgIGZ1bmN0aW9uIGdldFNjYWxhclJlc29sdmVyTmFtZShmaWVsZDogRGJGaWVsZCk6IHN0cmluZyB7XG4gICAgICAgIGlmIChmaWVsZC50eXBlID09PSBzY2FsYXJUeXBlcy51aW50NjQpIHtcbiAgICAgICAgICAgIHJldHVybiAnYmlnVUludDEnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChmaWVsZC50eXBlID09PSBzY2FsYXJUeXBlcy51aW50MTAyNCkge1xuICAgICAgICAgICAgcmV0dXJuICdiaWdVSW50Mic7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICdzY2FsYXInO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbkpTRmlsdGVyc0ZvckFycmF5RmllbGRzKHR5cGU6IERiVHlwZSwganNOYW1lczogU2V0PHN0cmluZz4pIHtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGxldCBpdGVtVHlwZU5hbWUgPSBmaWVsZC50eXBlLm5hbWU7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZpZWxkLmFycmF5RGVwdGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpbHRlck5hbWUgPSBgJHtpdGVtVHlwZU5hbWV9QXJyYXlgO1xuICAgICAgICAgICAgICAgIHByZXZlbnRUd2ljZShmaWx0ZXJOYW1lLCBqc05hbWVzLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1SZXNvbHZlck5hbWUgPSAoaSA9PT0gMCAmJiBmaWVsZC50eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS5zY2FsYXIpXG4gICAgICAgICAgICAgICAgICAgICAgICA/IGdldFNjYWxhclJlc29sdmVyTmFtZShmaWVsZClcbiAgICAgICAgICAgICAgICAgICAgICAgIDogaXRlbVR5cGVOYW1lO1xuICAgICAgICAgICAgICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICAgICAgICAgIGNvbnN0ICR7ZmlsdGVyTmFtZX0gPSBhcnJheSgke2l0ZW1SZXNvbHZlck5hbWV9KTtcbiAgICAgICAgICAgICAgICBgKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBpdGVtVHlwZU5hbWUgKz0gJ0FycmF5JztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuSlNTdHJ1Y3RGaWx0ZXIodHlwZTogRGJUeXBlKSB7XG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIGNvbnN0ICR7dHlwZS5uYW1lfSA9IHN0cnVjdCh7XG4gICAgYCk7XG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBsZXQgdHlwZURlY2xhcmF0aW9uOiA/c3RyaW5nID0gbnVsbDtcbiAgICAgICAgICAgIGNvbnN0IGpvaW4gPSBmaWVsZC5qb2luO1xuICAgICAgICAgICAgaWYgKGpvaW4pIHtcbiAgICAgICAgICAgICAgICB0eXBlRGVjbGFyYXRpb24gPSBgam9pbiR7ZmllbGQuYXJyYXlEZXB0aCA+IDAgPyAnQXJyYXknIDogJyd9KCcke2pvaW4ub259JywgJyR7ZmllbGQudHlwZS5jb2xsZWN0aW9uIHx8ICcnfScsICR7ZmllbGQudHlwZS5uYW1lfSlgO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC5hcnJheURlcHRoID4gMCkge1xuICAgICAgICAgICAgICAgIHR5cGVEZWNsYXJhdGlvbiA9XG4gICAgICAgICAgICAgICAgICAgIGZpZWxkLnR5cGUubmFtZSArXG4gICAgICAgICAgICAgICAgICAgICdBcnJheScucmVwZWF0KGZpZWxkLmFycmF5RGVwdGgpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC50eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS5zY2FsYXIpIHtcbiAgICAgICAgICAgICAgICB0eXBlRGVjbGFyYXRpb24gPSBnZXRTY2FsYXJSZXNvbHZlck5hbWUoZmllbGQpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC50eXBlLmZpZWxkcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgdHlwZURlY2xhcmF0aW9uID0gZmllbGQudHlwZS5uYW1lO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHR5cGVEZWNsYXJhdGlvbikge1xuICAgICAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAke2ZpZWxkLm5hbWV9OiAke3R5cGVEZWNsYXJhdGlvbn0sYCk7XG4gICAgICAgICAgICAgICAgY29uc3QgZW51bURlZiA9IGZpZWxkLmVudW1EZWY7XG4gICAgICAgICAgICAgICAgaWYgKGVudW1EZWYpIHtcbiAgICAgICAgICAgICAgICAgICAganMud3JpdGVMbihgICAgICR7ZmllbGQubmFtZX1fbmFtZTogZW51bU5hbWUoJyR7ZmllbGQubmFtZX0nLCAke3N0cmluZ2lmeUVudW1WYWx1ZXMoZW51bURlZi52YWx1ZXMpfSksYCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgfSR7dHlwZS5jb2xsZWN0aW9uID8gJywgdHJ1ZScgOiAnJ30pO1xuXG4gICAgYCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuSlNVbmlvblJlc29sdmVyKHR5cGU6IERiVHlwZSkge1xuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBjb25zdCAke3R5cGUubmFtZX1SZXNvbHZlciA9IHtcbiAgICAgICAgICAgIF9fcmVzb2x2ZVR5cGUob2JqLCBjb250ZXh0LCBpbmZvKSB7XG4gICAgICAgIGApO1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKCh2YXJpYW50KSA9PiB7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgIGlmICgnJHt2YXJpYW50Lm5hbWV9JyBpbiBvYmopIHtgKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgIHJldHVybiAnJHt1bmlvblZhcmlhbnRUeXBlKHR5cGUsIHZhcmlhbnQpfSc7YCk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgIH1gKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgYCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuSlNGaWx0ZXIodHlwZTogRGJUeXBlLCBqc05hbWVzOiBTZXQ8c3RyaW5nPikge1xuICAgICAgICBpZiAodHlwZS5maWVsZHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGUuY2F0ZWdvcnkgPT09IERiVHlwZUNhdGVnb3J5LnVuaW9uKSB7XG4gICAgICAgICAgICAvLyBnZW5KU0ZpbHRlcnNGb3JVbmlvblZhcmlhbnRzKHR5cGUsIGpzTmFtZXMpO1xuICAgICAgICB9XG4gICAgICAgIGdlbkpTRmlsdGVyc0ZvckFycmF5RmllbGRzKHR5cGUsIGpzTmFtZXMpO1xuICAgICAgICBnZW5KU1N0cnVjdEZpbHRlcih0eXBlKTtcbiAgICAgICAgaWYgKHR5cGUuY2F0ZWdvcnkgPT09IERiVHlwZUNhdGVnb3J5LnVuaW9uKSB7XG4gICAgICAgICAgICBnZW5KU1VuaW9uUmVzb2x2ZXIodHlwZSk7XG4gICAgICAgIH1cblxuXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2VuZXJhdGUgY3VzdG9tIHJlc29sdmVycyBmb3IgdHlwZXMgd2l0aDpcbiAgICAgKiAtIGlkIGZpZWxkXG4gICAgICogLSBqb2luIGZpZWxkc1xuICAgICAqIC0gdTY0IGFuZCBoaWdoZXIgZmllbGRzXG4gICAgICogQHBhcmFtIHR5cGVcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBnZW5KU0N1c3RvbVJlc29sdmVycyh0eXBlOiBEYlR5cGUpIHtcbiAgICAgICAgY29uc3Qgam9pbkZpZWxkcyA9IHR5cGUuZmllbGRzLmZpbHRlcih4ID0+ICEheC5qb2luKTtcbiAgICAgICAgY29uc3QgYmlnVUludEZpZWxkcyA9IHR5cGUuZmllbGRzLmZpbHRlcigoeDogRGJGaWVsZCkgPT4gKHgudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDY0KSB8fCAoeC50eXBlID09PSBzY2FsYXJUeXBlcy51aW50MTAyNCkpO1xuICAgICAgICBjb25zdCBlbnVtRmllbGRzID0gdHlwZS5maWVsZHMuZmlsdGVyKHggPT4geC5lbnVtRGVmKTtcbiAgICAgICAgY29uc3QgY3VzdG9tUmVzb2x2ZXJSZXF1aXJlZCA9IHR5cGUuY29sbGVjdGlvblxuICAgICAgICAgICAgfHwgam9pbkZpZWxkcy5sZW5ndGggPiAwXG4gICAgICAgICAgICB8fCBiaWdVSW50RmllbGRzLmxlbmd0aCA+IDBcbiAgICAgICAgICAgIHx8IGVudW1GaWVsZHMubGVuZ3RoID4gMDtcbiAgICAgICAgaWYgKCFjdXN0b21SZXNvbHZlclJlcXVpcmVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAganMud3JpdGVMbihgICAgICAgICAke3R5cGUubmFtZX06IHtgKTtcbiAgICAgICAgaWYgKHR5cGUuY29sbGVjdGlvbikge1xuICAgICAgICAgICAganMud3JpdGVMbignICAgICAgICAgICAgaWQocGFyZW50KSB7Jyk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKCcgICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5OycpO1xuICAgICAgICAgICAganMud3JpdGVMbignICAgICAgICAgICAgfSwnKTtcbiAgICAgICAgfVxuICAgICAgICBqb2luRmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBvbkZpZWxkID0gdHlwZS5maWVsZHMuZmluZCh4ID0+IHgubmFtZSA9PT0gKGZpZWxkLmpvaW4gJiYgZmllbGQuam9pbi5vbikgfHwgJycpO1xuICAgICAgICAgICAgaWYgKCFvbkZpZWxkKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgJ0pvaW4gb24gZmllbGQgZG9lcyBub3QgZXhpc3QuJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGNvbGxlY3Rpb24gPSBmaWVsZC50eXBlLmNvbGxlY3Rpb247XG4gICAgICAgICAgICBpZiAoIWNvbGxlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICB0aHJvdyAnSm9pbmVkIHR5cGUgaXMgbm90IGEgY29sbGVjdGlvbi4nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgJHtmaWVsZC5uYW1lfShwYXJlbnQsIF9hcmdzLCBjb250ZXh0KSB7YCk7XG4gICAgICAgICAgICBpZiAoZmllbGQuYXJyYXlEZXB0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICAgICByZXR1cm4gY29udGV4dC5kYi5mZXRjaERvY0J5S2V5KGNvbnRleHQuZGIuJHtjb2xsZWN0aW9ufSwgcGFyZW50LiR7b25GaWVsZC5uYW1lfSk7YCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLmFycmF5RGVwdGggPT09IDEpIHtcbiAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQuZGIuZmV0Y2hEb2NzQnlLZXlzKGNvbnRleHQuZGIuJHtjb2xsZWN0aW9ufSwgcGFyZW50LiR7b25GaWVsZC5uYW1lfSk7YCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93ICdKb2lucyBvbiBhIG5lc3RlZCBhcnJheXMgZG9lcyBub3Qgc3VwcG9ydGVkLic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICB9LGApO1xuICAgICAgICB9KTtcbiAgICAgICAgYmlnVUludEZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcHJlZml4TGVuZ3RoID0gZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDY0ID8gMSA6IDI7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAke2ZpZWxkLm5hbWV9KHBhcmVudCkge2ApO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgke3ByZWZpeExlbmd0aH0sIHBhcmVudC4ke2ZpZWxkLm5hbWV9KTtgKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgIH0sYCk7XG4gICAgICAgIH0pO1xuICAgICAgICBlbnVtRmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBlbnVtRGVmID0gZmllbGQuZW51bURlZjtcbiAgICAgICAgICAgIGlmIChlbnVtRGVmKSB7XG4gICAgICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgJHtmaWVsZC5uYW1lfV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCcke2ZpZWxkLm5hbWV9JywgJHtzdHJpbmdpZnlFbnVtVmFsdWVzKGVudW1EZWYudmFsdWVzKX0pLGApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAganMud3JpdGVMbihgICAgICAgICB9LGApO1xuICAgIH1cblxuXG4gICAgZnVuY3Rpb24gZ2VuSlNUeXBlUmVzb2x2ZXJzRm9yVW5pb24odHlwZTogRGJUeXBlKSB7XG4gICAgICAgIGlmICh0eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS51bmlvbikge1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAke3R5cGUubmFtZX06ICR7dHlwZS5uYW1lfVJlc29sdmVyLGApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuZXJhdGUodHlwZXM6IERiVHlwZVtdKSB7XG5cbiAgICAgICAgLy8gUUxcblxuICAgICAgICBbJ1N0cmluZycsICdCb29sZWFuJywgJ0ludCcsICdGbG9hdCddLmZvckVhY2goZ2VuUUxTY2FsYXJUeXBlc0ZpbHRlcik7XG4gICAgICAgIGdlblFMRW51bVR5cGVzKCk7XG4gICAgICAgIHR5cGVzLmZvckVhY2godHlwZSA9PiBnZW5RTFR5cGVEZWNsYXJhdGlvbih0eXBlKSk7XG4gICAgICAgIGNvbnN0IHFsQXJyYXlGaWx0ZXJzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgICAgIHR5cGVzLmZvckVhY2godHlwZSA9PiBnZW5RTEZpbHRlcih0eXBlLCBxbEFycmF5RmlsdGVycykpO1xuXG4gICAgICAgIGNvbnN0IGNvbGxlY3Rpb25zID0gdHlwZXMuZmlsdGVyKHQgPT4gISF0LmNvbGxlY3Rpb24pO1xuICAgICAgICBnZW5RTFF1ZXJpZXMoY29sbGVjdGlvbnMpO1xuICAgICAgICBnZW5RTFN1YnNjcmlwdGlvbnMoY29sbGVjdGlvbnMpO1xuXG4gICAgICAgIC8vIEpTXG5cbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgY29uc3Qge1xuICAgICAgICAgICAgc2NhbGFyLFxuICAgICAgICAgICAgYmlnVUludDEsXG4gICAgICAgICAgICBiaWdVSW50MixcbiAgICAgICAgICAgIHJlc29sdmVCaWdVSW50LFxuICAgICAgICAgICAgc3RydWN0LFxuICAgICAgICAgICAgYXJyYXksXG4gICAgICAgICAgICBqb2luLFxuICAgICAgICAgICAgam9pbkFycmF5LFxuICAgICAgICAgICAgZW51bU5hbWUsXG4gICAgICAgICAgICBjcmVhdGVFbnVtTmFtZVJlc29sdmVyLFxuICAgICAgICB9ID0gcmVxdWlyZSgnLi9xLXR5cGVzLmpzJyk7XG4gICAgICAgIGApO1xuICAgICAgICBjb25zdCBqc0FycmF5RmlsdGVycyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKHR5cGUgPT4gZ2VuSlNGaWx0ZXIodHlwZSwganNBcnJheUZpbHRlcnMpKTtcblxuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBmdW5jdGlvbiBjcmVhdGVSZXNvbHZlcnMoZGIpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgIGApO1xuICAgICAgICB0eXBlcy5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgICAgICAgICBnZW5KU0N1c3RvbVJlc29sdmVycyh0eXBlKTtcbiAgICAgICAgICAgIGdlbkpTVHlwZVJlc29sdmVyc0ZvclVuaW9uKHR5cGUpO1xuICAgICAgICB9KTtcbiAgICAgICAganMud3JpdGVMbignICAgICAgICBRdWVyeTogeycpO1xuICAgICAgICBjb2xsZWN0aW9ucy5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAke3R5cGUuY29sbGVjdGlvbiB8fCAnJ306IGRiLmNvbGxlY3Rpb25RdWVyeShkYi4ke3R5cGUuY29sbGVjdGlvbiB8fCAnJ30sICR7dHlwZS5uYW1lfSksYClcbiAgICAgICAgfSk7XG4gICAgICAgIGpzLndyaXRlTG4oJyAgICAgICAgfSwnKTtcbiAgICAgICAganMud3JpdGVMbignICAgICAgICBTdWJzY3JpcHRpb246IHsnKTtcbiAgICAgICAgY29sbGVjdGlvbnMuZm9yRWFjaCgodHlwZSkgPT4ge1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgJHt0eXBlLmNvbGxlY3Rpb24gfHwgJyd9OiBkYi5jb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGRiLiR7dHlwZS5jb2xsZWN0aW9uIHx8ICcnfSwgJHt0eXBlLm5hbWV9KSxgKVxuICAgICAgICB9KTtcbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBgKTtcblxuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAgICAgICAgIGNyZWF0ZVJlc29sdmVycyxcbiAgICAgICAgYCk7XG4gICAgICAgIHR5cGVzLmZvckVhY2godHlwZSA9PiBqcy53cml0ZUxuKGAgICAgJHt0eXBlLm5hbWV9LGApKTtcbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgfTtcbiAgICAgICAgYCk7XG4gICAgfVxuXG4gICAgY29uc3Qgc2NoZW1hID0gcGFyc2VUeXBlRGVmKHNjaGVtYURlZik7XG5cbiAgICBpZiAoc2NoZW1hLmNsYXNzKSB7XG4gICAgICAgIHBhcnNlRGJUeXBlcyhzY2hlbWEuY2xhc3MudHlwZXMpO1xuICAgICAgICBnZW5lcmF0ZShkYlR5cGVzKTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IGU6IEludEVudW1EZWYgb2YgZW51bVR5cGVzLnZhbHVlcygpKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBleHBvcnQgY29uc3QgUSR7ZS5uYW1lfSA9IHtgKTtcbiAgICAgICAgY29uc29sZS5sb2coT2JqZWN0LmVudHJpZXMoZS52YWx1ZXMpLm1hcCgoW25hbWUsIHZhbHVlXSkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGAgICAgJHtuYW1lfTogJHsodmFsdWU6IGFueSl9LGA7XG4gICAgICAgIH0pLmpvaW4oJ1xcbicpKTtcbiAgICAgICAgY29uc29sZS5sb2coYH07XFxuYCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcWw6IHFsLmdlbmVyYXRlZCgpLFxuICAgICAgICBqczoganMuZ2VuZXJhdGVkKCksXG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBtYWluO1xuIl19