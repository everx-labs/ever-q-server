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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9nZW4tcWwuanMiXSwibmFtZXMiOlsiRGJUeXBlQ2F0ZWdvcnkiLCJ1bnJlc29sdmVkIiwic2NhbGFyIiwidW5pb24iLCJzdHJ1Y3QiLCJzY2FsYXJUeXBlIiwibmFtZSIsImNhdGVnb3J5IiwiZmllbGRzIiwiZG9jIiwic2NhbGFyVHlwZXMiLCJ1aW50NjQiLCJ1aW50MTAyNCIsInN0cmluZyIsInVucmVzb2x2ZWRUeXBlIiwiaXNMb3dlckNhc2VkIiwicyIsImwiLCJ0b0xvd2VyQ2FzZSIsInUiLCJ0b1VwcGVyQ2FzZSIsImlzVXBwZXJDYXNlZCIsInRvQWxsQ2FwcyIsInJlc3VsdCIsImkiLCJsZW5ndGgiLCJ0b0VudW1TdHlsZSIsInN1YnN0ciIsInN0cmluZ2lmeUVudW1WYWx1ZXMiLCJ2YWx1ZXMiLCJPYmplY3QiLCJlbnRyaWVzIiwibWFwIiwidmFsdWUiLCJqb2luIiwiZ2V0RG9jTUQiLCJzY2hlbWEiLCJtZCIsIm1haW4iLCJzY2hlbWFEZWYiLCJkYlR5cGVzIiwibGFzdFJlcG9ydGVkVHlwZSIsImVudW1UeXBlcyIsIk1hcCIsInJlcG9ydFR5cGUiLCJmaWVsZCIsInR5cGUiLCJjb25zb2xlIiwibG9nIiwicGFyc2VEYkZpZWxkIiwidHlwZU5hbWUiLCJzY2hlbWFGaWVsZCIsInNjaGVtYVR5cGUiLCJhcnJheURlcHRoIiwiYXJyYXkiLCJlbnVtRGVmIiwiXyIsInNldCIsInJlZiIsImJvb2wiLCJ1bnNpZ25lZCIsInNpemUiLCJFcnJvciIsIkpTT04iLCJzdHJpbmdpZnkiLCJwcm9jZXNzIiwiZXhpdCIsInVud3JhcEFycmF5cyIsInBhcnNlRGJUeXBlIiwiY29sbGVjdGlvbiIsInB1c2giLCJmb3JFYWNoIiwidW53cmFwcGVkIiwib3duVHlwZSIsInBhcnNlRGJUeXBlcyIsInR5cGVzIiwicmVzb2x2aW5nIiwiU2V0IiwicmVzb2x2ZWQiLCJvcmRlcmVkUmVzb2x2ZWQiLCJ0IiwicmVzb2x2ZVR5cGUiLCJoYXMiLCJhZGQiLCJnZXQiLCJxbCIsIldyaXRlciIsImpzIiwiZ2VuUUxEb2MiLCJwcmVmaXgiLCJ0cmltIiwibGluZXMiLCJzcGxpdCIsImluY2x1ZGVzIiwid3JpdGVMbiIsImxpbmUiLCJ1bmlvblZhcmlhbnRUeXBlIiwidmFyaWFudCIsImdlblFMVHlwZURlY2xhcmF0aW9uc0ZvclVuaW9uVmFyaWFudHMiLCJ3cml0ZUJsb2NrTG4iLCJnZW5RTEVudW1UeXBlcyIsImtleXMiLCJnZW5RTFR5cGVEZWNsYXJhdGlvbiIsInR5cGVEZWNsYXJhdGlvbiIsInJlcGVhdCIsInByZXZlbnRUd2ljZSIsIm5hbWVzIiwid29yayIsImdlblFMRmlsdGVyc0ZvckFycmF5RmllbGRzIiwicWxOYW1lcyIsIml0ZW1UeXBlTmFtZSIsImZpbHRlck5hbWUiLCJvcCIsImdlblFMRmlsdGVyc0ZvckVudW1OYW1lRmllbGRzIiwiZ2VuUUxTY2FsYXJUeXBlc0ZpbHRlciIsImdlblFMRmlsdGVyIiwiZ2VuUUxRdWVyaWVzIiwiZ2VuUUxTdWJzY3JpcHRpb25zIiwiZ2V0U2NhbGFyUmVzb2x2ZXJOYW1lIiwiZ2VuSlNGaWx0ZXJzRm9yQXJyYXlGaWVsZHMiLCJqc05hbWVzIiwiaXRlbVJlc29sdmVyTmFtZSIsImdlbkpTU3RydWN0RmlsdGVyIiwib24iLCJnZW5KU1VuaW9uUmVzb2x2ZXIiLCJnZW5KU0ZpbHRlciIsImdlbkpTQ3VzdG9tUmVzb2x2ZXJzIiwiam9pbkZpZWxkcyIsImZpbHRlciIsIngiLCJiaWdVSW50RmllbGRzIiwiZW51bUZpZWxkcyIsImN1c3RvbVJlc29sdmVyUmVxdWlyZWQiLCJvbkZpZWxkIiwiZmluZCIsInByZWZpeExlbmd0aCIsImdlbkpTVHlwZVJlc29sdmVyc0ZvclVuaW9uIiwiZ2VuZXJhdGUiLCJxbEFycmF5RmlsdGVycyIsImNvbGxlY3Rpb25zIiwianNBcnJheUZpbHRlcnMiLCJlIiwiZ2VuZXJhdGVkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUVBOztBQUVBOztBQUVBLElBQU1BLGNBQWMs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QUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7O0FBMmxCOUIsU0FBTztBQUNIcUMsSUFBQUEsRUFBRSxFQUFFQSxFQUFFLENBQUN5RCxTQUFILEVBREQ7QUFFSHZELElBQUFBLEVBQUUsRUFBRUEsRUFBRSxDQUFDdUQsU0FBSDtBQUZELEdBQVA7QUFJSDs7ZUFFY3hHLEkiLCJzb3VyY2VzQ29udGVudCI6WyIvL0BmbG93XG5cbmltcG9ydCB7IG1ha2VGaWVsZFR5cGVOYW1lLCBXcml0ZXIgfSBmcm9tICd0b24tbGFicy1kZXYtb3BzL2Rpc3Qvc3JjL2dlbi5qcyc7XG5pbXBvcnQgdHlwZSB7IFNjaGVtYURvYywgU2NoZW1hTWVtYmVyLCBTY2hlbWFUeXBlLCBUeXBlRGVmIH0gZnJvbSAndG9uLWxhYnMtZGV2LW9wcy9zcmMvc2NoZW1hLmpzJztcbmltcG9ydCB7IHBhcnNlVHlwZURlZiB9IGZyb20gJ3Rvbi1sYWJzLWRldi1vcHMvZGlzdC9zcmMvc2NoZW1hLmpzJztcblxuY29uc3QgRGJUeXBlQ2F0ZWdvcnkgPSB7XG4gICAgdW5yZXNvbHZlZDogJ3VucmVzb2x2ZWQnLFxuICAgIHNjYWxhcjogJ3NjYWxhcicsXG4gICAgdW5pb246ICd1bmlvbicsXG4gICAgc3RydWN0OiAnc3RydWN0Jyxcbn07XG5cbnR5cGUgRGJKb2luID0ge1xuICAgIGNvbGxlY3Rpb246IHN0cmluZyxcbiAgICBvbjogc3RyaW5nLFxufVxuXG50eXBlIERiVHlwZSA9IHtcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgZmllbGRzOiBEYkZpZWxkW10sXG4gICAgY2F0ZWdvcnk6ICd1bnJlc29sdmVkJyB8ICdzY2FsYXInIHwgJ3VuaW9uJyB8ICdzdHJ1Y3QnLFxuICAgIGNvbGxlY3Rpb24/OiBzdHJpbmcsXG4gICAgZG9jOiBzdHJpbmcsXG59XG5cbnR5cGUgSW50RW51bURlZiA9IHtcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgdmFsdWVzOiB7XG4gICAgICAgIFtzdHJpbmddOiBudW1iZXJcbiAgICB9LFxufVxuXG50eXBlIERiRmllbGQgPSB7XG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHR5cGU6IERiVHlwZSxcbiAgICBhcnJheURlcHRoOiBudW1iZXIsXG4gICAgam9pbj86IERiSm9pbixcbiAgICBlbnVtRGVmPzogSW50RW51bURlZixcbiAgICBkb2M6IHN0cmluZyxcbn1cblxuZnVuY3Rpb24gc2NhbGFyVHlwZShuYW1lOiBzdHJpbmcpOiBEYlR5cGUge1xuICAgIHJldHVybiB7XG4gICAgICAgIG5hbWUsXG4gICAgICAgIGNhdGVnb3J5OiBEYlR5cGVDYXRlZ29yeS5zY2FsYXIsXG4gICAgICAgIGZpZWxkczogW10sXG4gICAgICAgIGRvYzogJycsXG4gICAgfVxufVxuXG5jb25zdCBzY2FsYXJUeXBlcyA9IHtcbiAgICBpbnQ6IHNjYWxhclR5cGUoJ0ludCcpLFxuICAgIHVpbnQ2NDogc2NhbGFyVHlwZSgnU3RyaW5nJyksXG4gICAgdWludDEwMjQ6IHNjYWxhclR5cGUoJ1N0cmluZycpLFxuICAgIGZsb2F0OiBzY2FsYXJUeXBlKCdGbG9hdCcpLFxuICAgIGJvb2xlYW46IHNjYWxhclR5cGUoJ0Jvb2xlYW4nKSxcbiAgICBzdHJpbmc6IHNjYWxhclR5cGUoJ1N0cmluZycpLFxufTtcblxuZnVuY3Rpb24gdW5yZXNvbHZlZFR5cGUobmFtZTogc3RyaW5nKTogRGJUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBuYW1lLFxuICAgICAgICBjYXRlZ29yeTogRGJUeXBlQ2F0ZWdvcnkudW5yZXNvbHZlZCxcbiAgICAgICAgZmllbGRzOiBbXSxcbiAgICAgICAgZG9jOiAnJyxcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGlzTG93ZXJDYXNlZChzOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBjb25zdCBsID0gcy50b0xvd2VyQ2FzZSgpO1xuICAgIGNvbnN0IHUgPSBzLnRvVXBwZXJDYXNlKCk7XG4gICAgcmV0dXJuICh1ICE9PSBsKSAmJiAocyA9PT0gbCk7XG59XG5cbmZ1bmN0aW9uIGlzVXBwZXJDYXNlZChzOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBjb25zdCBsID0gcy50b0xvd2VyQ2FzZSgpO1xuICAgIGNvbnN0IHUgPSBzLnRvVXBwZXJDYXNlKCk7XG4gICAgcmV0dXJuICh1ICE9PSBsKSAmJiAocyA9PT0gdSk7XG59XG5cbmZ1bmN0aW9uIHRvQWxsQ2FwcyhzOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGxldCByZXN1bHQgPSAnJztcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgaWYgKChpID4gMCkgJiYgKHNbaSAtIDFdICE9PSAnXycpICYmIGlzTG93ZXJDYXNlZChzW2kgLSAxXSkgJiYgaXNVcHBlckNhc2VkKHNbaV0pKSB7XG4gICAgICAgICAgICByZXN1bHQgKz0gJ18nO1xuICAgICAgICB9XG4gICAgICAgIHJlc3VsdCArPSBzW2ldO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0LnRvVXBwZXJDYXNlKCk7XG59XG5cbmZ1bmN0aW9uIHRvRW51bVN0eWxlKHM6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGAke3Muc3Vic3RyKDAsIDEpLnRvVXBwZXJDYXNlKCl9JHtzLnN1YnN0cigxKX1gO1xufVxuXG5mdW5jdGlvbiBzdHJpbmdpZnlFbnVtVmFsdWVzKHZhbHVlczogeyBbc3RyaW5nXTogbnVtYmVyIH0pOiBzdHJpbmcge1xuICAgIGNvbnN0IGZpZWxkcyA9IE9iamVjdC5lbnRyaWVzKHZhbHVlcykubWFwKChbbmFtZSwgdmFsdWVdKSA9PiB7XG4gICAgICAgIHJldHVybiBgJHt0b0VudW1TdHlsZShuYW1lKX06ICR7KHZhbHVlOiBhbnkpfWA7XG4gICAgfSk7XG4gICAgcmV0dXJuIGB7ICR7ZmllbGRzLmpvaW4oJywgJyl9IH1gO1xufVxuXG5mdW5jdGlvbiBnZXREb2NNRChzY2hlbWE6IFNjaGVtYURvYyk6IHN0cmluZyB7XG4gICAgY29uc3QgZG9jID0gc2NoZW1hLmRvYztcbiAgICBpZiAoIWRvYykge1xuICAgICAgICByZXR1cm4gJyc7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgZG9jID09PSAnc3RyaW5nJykge1xuICAgICAgICByZXR1cm4gZG9jO1xuICAgIH1cbiAgICBpZiAoZG9jLm1kKSB7XG4gICAgICAgIHJldHVybiAoZG9jLm1kOiBhbnkpO1xuICAgIH1cbiAgICByZXR1cm4gJyc7XG59XG5cbmZ1bmN0aW9uIG1haW4oc2NoZW1hRGVmOiBUeXBlRGVmKSB7XG5cbiAgICBsZXQgZGJUeXBlczogRGJUeXBlW10gPSBbXTtcbiAgICBsZXQgbGFzdFJlcG9ydGVkVHlwZTogc3RyaW5nID0gJyc7XG4gICAgbGV0IGVudW1UeXBlczogTWFwPHN0cmluZywgSW50RW51bURlZj4gPSBuZXcgTWFwKCk7XG5cbiAgICBmdW5jdGlvbiByZXBvcnRUeXBlKG5hbWU6IHN0cmluZywgZmllbGQ6IHN0cmluZywgdHlwZTogc3RyaW5nKSB7XG4gICAgICAgIGlmIChuYW1lICE9PSBsYXN0UmVwb3J0ZWRUeXBlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhuYW1lKTtcbiAgICAgICAgICAgIGxhc3RSZXBvcnRlZFR5cGUgPSBuYW1lO1xuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUubG9nKGAgICAgJHtmaWVsZH06ICR7dHlwZX1gKTtcblxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlRGJGaWVsZChcbiAgICAgICAgdHlwZU5hbWU6IHN0cmluZyxcbiAgICAgICAgc2NoZW1hRmllbGQ6IFNjaGVtYU1lbWJlcjxTY2hlbWFUeXBlPixcbiAgICApOiBEYkZpZWxkIHtcbiAgICAgICAgbGV0IHNjaGVtYVR5cGUgPSBzY2hlbWFGaWVsZDtcbiAgICAgICAgY29uc3QgZmllbGQ6IERiRmllbGQgPSB7XG4gICAgICAgICAgICBuYW1lOiBzY2hlbWFGaWVsZC5uYW1lLFxuICAgICAgICAgICAgYXJyYXlEZXB0aDogMCxcbiAgICAgICAgICAgIHR5cGU6IHNjYWxhclR5cGVzLnN0cmluZyxcbiAgICAgICAgICAgIGRvYzogZ2V0RG9jTUQoc2NoZW1hRmllbGQpLFxuICAgICAgICB9O1xuICAgICAgICB3aGlsZSAoc2NoZW1hVHlwZS5hcnJheSkge1xuICAgICAgICAgICAgZmllbGQuYXJyYXlEZXB0aCArPSAxO1xuICAgICAgICAgICAgc2NoZW1hVHlwZSA9IHNjaGVtYVR5cGUuYXJyYXk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZW51bURlZjogP0ludEVudW1EZWYgPSAoc2NoZW1hVHlwZS5fICYmIHNjaGVtYVR5cGUuXy5lbnVtKSB8fCBudWxsO1xuICAgICAgICBpZiAoZW51bURlZikge1xuICAgICAgICAgICAgZmllbGQuZW51bURlZiA9IGVudW1EZWY7XG4gICAgICAgICAgICBlbnVtVHlwZXMuc2V0KGVudW1EZWYubmFtZSwgZW51bURlZik7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgam9pbiA9IChzY2hlbWFUeXBlOiBhbnkpLl8uam9pbjtcbiAgICAgICAgaWYgKGpvaW4pIHtcbiAgICAgICAgICAgIGZpZWxkLmpvaW4gPSBqb2luO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzY2hlbWFUeXBlLnVuaW9uIHx8IHNjaGVtYVR5cGUuc3RydWN0KSB7XG4gICAgICAgICAgICBmaWVsZC50eXBlID0gdW5yZXNvbHZlZFR5cGUobWFrZUZpZWxkVHlwZU5hbWUodHlwZU5hbWUsIHNjaGVtYUZpZWxkLm5hbWUpKTtcbiAgICAgICAgfSBlbHNlIGlmIChzY2hlbWFUeXBlLnJlZikge1xuICAgICAgICAgICAgZmllbGQudHlwZSA9IHVucmVzb2x2ZWRUeXBlKHNjaGVtYVR5cGUucmVmLm5hbWUpO1xuICAgICAgICB9IGVsc2UgaWYgKHNjaGVtYVR5cGUuYm9vbCkge1xuICAgICAgICAgICAgZmllbGQudHlwZSA9IHNjYWxhclR5cGVzLmJvb2xlYW47XG4gICAgICAgIH0gZWxzZSBpZiAoc2NoZW1hVHlwZS5pbnQpIHtcbiAgICAgICAgICAgIGNvbnN0IHVuc2lnbmVkOiBib29sZWFuID0gKHNjaGVtYVR5cGUuaW50ICYmIHNjaGVtYVR5cGUuaW50LnVuc2lnbmVkKSB8fCBmYWxzZTtcbiAgICAgICAgICAgIGNvbnN0IHNpemU6IG51bWJlciA9IChzY2hlbWFUeXBlLmludCAmJiBzY2hlbWFUeXBlLmludC5zaXplKSB8fCAzMjtcbiAgICAgICAgICAgIGlmICh1bnNpZ25lZCkge1xuICAgICAgICAgICAgICAgIGlmIChzaXplID49IDEyOCkge1xuICAgICAgICAgICAgICAgICAgICByZXBvcnRUeXBlKHR5cGVOYW1lLCBmaWVsZC5uYW1lLCAndTEwMjQnKTtcbiAgICAgICAgICAgICAgICAgICAgZmllbGQudHlwZSA9IHNjYWxhclR5cGVzLnVpbnQxMDI0O1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc2l6ZSA+PSA2NCkge1xuICAgICAgICAgICAgICAgICAgICByZXBvcnRUeXBlKHR5cGVOYW1lLCBmaWVsZC5uYW1lLCAndTY0Jyk7XG4gICAgICAgICAgICAgICAgICAgIGZpZWxkLnR5cGUgPSBzY2FsYXJUeXBlcy51aW50NjQ7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzaXplID49IDMyKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcG9ydFR5cGUodHlwZU5hbWUsIGZpZWxkLm5hbWUsICd1MzInKTtcbiAgICAgICAgICAgICAgICAgICAgZmllbGQudHlwZSA9IHNjYWxhclR5cGVzLmZsb2F0O1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcG9ydFR5cGUodHlwZU5hbWUsIGZpZWxkLm5hbWUsIGB1JHtzaXplfWApO1xuICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlID0gc2NhbGFyVHlwZXMuaW50O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKHNpemUgPiAzMikge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludGVnZXIgdHlwZSB3aXRoIHNpemUgJHtzaXplfSBiaXQgZG9lcyBub3Qgc3VwcG9ydGVkYCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVwb3J0VHlwZSh0eXBlTmFtZSwgZmllbGQubmFtZSwgJ2kzMicpO1xuICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlID0gc2NhbGFyVHlwZXMuaW50O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChzY2hlbWFUeXBlLmZsb2F0KSB7XG4gICAgICAgICAgICByZXBvcnRUeXBlKHR5cGVOYW1lLCBmaWVsZC5uYW1lLCAnZmxvYXQnKTtcbiAgICAgICAgICAgIGZpZWxkLnR5cGUgPSBzY2FsYXJUeXBlcy5mbG9hdDtcbiAgICAgICAgfSBlbHNlIGlmIChzY2hlbWFUeXBlLnN0cmluZykge1xuICAgICAgICAgICAgZmllbGQudHlwZSA9IHNjYWxhclR5cGVzLnN0cmluZztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZpZWxkLnR5cGUgPSBzY2FsYXJUeXBlcy5zdHJpbmc7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnPj4+IEludmFsaWQgZmllbGQgdHlwZTogJywgSlNPTi5zdHJpbmdpZnkoc2NoZW1hVHlwZSkpO1xuICAgICAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmaWVsZDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB1bndyYXBBcnJheXModHlwZTogU2NoZW1hVHlwZSk6IFNjaGVtYVR5cGUge1xuICAgICAgICBpZiAodHlwZS5hcnJheSkge1xuICAgICAgICAgICAgcmV0dXJuIHVud3JhcEFycmF5cyh0eXBlLmFycmF5KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHlwZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZURiVHlwZShcbiAgICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgICBzY2hlbWFUeXBlOiBTY2hlbWFUeXBlXG4gICAgKSB7XG4gICAgICAgIGNvbnN0IHN0cnVjdCA9IHNjaGVtYVR5cGUudW5pb24gfHwgc2NoZW1hVHlwZS5zdHJ1Y3Q7XG4gICAgICAgIGlmICghc3RydWN0KSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnPj4+JywgYD8/ICR7bmFtZX06ICR7SlNPTi5zdHJpbmdpZnkoc2NoZW1hVHlwZSkuc3Vic3RyKDAsIDIwMCl9YCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdHlwZTogRGJUeXBlID0ge1xuICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgIGNhdGVnb3J5OiBzY2hlbWFUeXBlLnVuaW9uID8gRGJUeXBlQ2F0ZWdvcnkudW5pb24gOiBEYlR5cGVDYXRlZ29yeS5zdHJ1Y3QsXG4gICAgICAgICAgICBmaWVsZHM6IFtdLFxuICAgICAgICAgICAgY29sbGVjdGlvbjogKHNjaGVtYVR5cGU6IGFueSkuXy5jb2xsZWN0aW9uLFxuICAgICAgICAgICAgZG9jOiBnZXREb2NNRChzY2hlbWFUeXBlKSxcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAodHlwZS5jb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICB0eXBlLmZpZWxkcy5wdXNoKHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnaWQnLFxuICAgICAgICAgICAgICAgIGFycmF5RGVwdGg6IDAsXG4gICAgICAgICAgICAgICAgdHlwZTogc2NhbGFyVHlwZXMuc3RyaW5nLFxuICAgICAgICAgICAgICAgIGRvYzogJycsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBzdHJ1Y3QuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIHR5cGUuZmllbGRzLnB1c2gocGFyc2VEYkZpZWxkKG5hbWUsIGZpZWxkKSk7XG4gICAgICAgICAgICBjb25zdCB1bndyYXBwZWQgPSB1bndyYXBBcnJheXMoZmllbGQpO1xuICAgICAgICAgICAgY29uc3Qgb3duVHlwZSA9ICh1bndyYXBwZWQuc3RydWN0IHx8IHVud3JhcHBlZC51bmlvbikgPyB1bndyYXBwZWQgOiBudWxsO1xuICAgICAgICAgICAgaWYgKG93blR5cGUpIHtcbiAgICAgICAgICAgICAgICBwYXJzZURiVHlwZShtYWtlRmllbGRUeXBlTmFtZShuYW1lLCBmaWVsZC5uYW1lKSwgb3duVHlwZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBkYlR5cGVzLnB1c2godHlwZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VEYlR5cGVzKHR5cGVzOiBTY2hlbWFNZW1iZXI8U2NoZW1hVHlwZT5bXSkge1xuICAgICAgICB0eXBlcy5mb3JFYWNoKCh0eXBlOiBTY2hlbWFNZW1iZXI8U2NoZW1hVHlwZT4pID0+IHtcbiAgICAgICAgICAgIHBhcnNlRGJUeXBlKHR5cGUubmFtZSwgdHlwZSk7XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCB1bnJlc29sdmVkOiBNYXA8c3RyaW5nLCBEYlR5cGU+ID0gbmV3IE1hcDxzdHJpbmcsIERiVHlwZT4oKTtcbiAgICAgICAgY29uc3QgcmVzb2x2aW5nOiBTZXQ8c3RyaW5nPiA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgICAgICBjb25zdCByZXNvbHZlZDogTWFwPHN0cmluZywgRGJUeXBlPiA9IG5ldyBNYXA8c3RyaW5nLCBEYlR5cGU+KCk7XG4gICAgICAgIGNvbnN0IG9yZGVyZWRSZXNvbHZlZDogRGJUeXBlW10gPSBbXTtcbiAgICAgICAgZGJUeXBlcy5mb3JFYWNoKHQgPT4gdW5yZXNvbHZlZC5zZXQodC5uYW1lLCB0KSk7XG4gICAgICAgIGNvbnN0IHJlc29sdmVUeXBlID0gKHR5cGU6IERiVHlwZSkgPT4ge1xuICAgICAgICAgICAgaWYgKHJlc29sdmVkLmhhcyh0eXBlLm5hbWUpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHJlc29sdmluZy5oYXModHlwZS5uYW1lKSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+Pj4nLCBgQ2lyY3VsYXIgcmVmZXJlbmNlIHRvIHR5cGUgJHt0eXBlLm5hbWV9YCk7XG4gICAgICAgICAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVzb2x2aW5nLmFkZCh0eXBlLm5hbWUpO1xuICAgICAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZmllbGQudHlwZS5jYXRlZ29yeSA9PT0gRGJUeXBlQ2F0ZWdvcnkudW5yZXNvbHZlZCkge1xuICAgICAgICAgICAgICAgICAgICBsZXQgdHlwZSA9IHJlc29sdmVkLmdldChmaWVsZC50eXBlLm5hbWUpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgPSB1bnJlc29sdmVkLmdldChmaWVsZC50eXBlLm5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlVHlwZSh0eXBlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJz4+PicsIGBSZWZlcmVuY2VkIHR5cGUgbm90IGZvdW5kOiAke2ZpZWxkLnR5cGUubmFtZX1gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpZWxkLnR5cGUgPSB0eXBlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXNvbHZpbmcuZGVsZXRlKHR5cGUubmFtZSk7XG4gICAgICAgICAgICBvcmRlcmVkUmVzb2x2ZWQucHVzaCh0eXBlKTtcbiAgICAgICAgICAgIHVucmVzb2x2ZWQuZGVsZXRlKHR5cGUubmFtZSk7XG4gICAgICAgICAgICByZXNvbHZlZC5zZXQodHlwZS5uYW1lLCB0eXBlKTtcbiAgICAgICAgfTtcbiAgICAgICAgZGJUeXBlcy5mb3JFYWNoKHJlc29sdmVUeXBlKTtcbiAgICAgICAgZGJUeXBlcyA9IG9yZGVyZWRSZXNvbHZlZDtcbiAgICB9XG5cbi8vIEdlbmVyYXRvcnNcblxuICAgIGNvbnN0IHFsID0gbmV3IFdyaXRlcigpO1xuICAgIGNvbnN0IGpzID0gbmV3IFdyaXRlcigpO1xuXG4gICAgZnVuY3Rpb24gZ2VuUUxEb2MocHJlZml4OiBzdHJpbmcsIGRvYzogc3RyaW5nKSB7XG4gICAgICAgIGlmIChkb2MudHJpbSgpID09PSAnJykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGxpbmVzID0gZG9jLnNwbGl0KC9cXG5cXHI/fFxcclxcbj8vKTtcbiAgICAgICAgaWYgKGxpbmVzLmxlbmd0aCA9PT0gMSAmJiAhbGluZXNbMF0uaW5jbHVkZXMoJ1wiJykpIHtcbiAgICAgICAgICAgIHFsLndyaXRlTG4ocHJlZml4LCAnXCInLCBsaW5lc1swXSwgJ1wiJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBxbC53cml0ZUxuKHByZWZpeCwgJ1wiXCJcIicpO1xuICAgICAgICAgICAgbGluZXMuZm9yRWFjaCgobGluZSkgPT4ge1xuICAgICAgICAgICAgICAgIHFsLndyaXRlTG4ocHJlZml4LCBsaW5lKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcWwud3JpdGVMbihwcmVmaXgsICdcIlwiXCInKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHVuaW9uVmFyaWFudFR5cGUodHlwZTogRGJUeXBlLCB2YXJpYW50OiBEYkZpZWxkKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIGAke3R5cGUubmFtZX0ke3ZhcmlhbnQubmFtZX1WYXJpYW50YDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5RTFR5cGVEZWNsYXJhdGlvbnNGb3JVbmlvblZhcmlhbnRzKHR5cGU6IERiVHlwZSkge1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKCh2YXJpYW50KSA9PiB7XG4gICAgICAgICAgICBxbC53cml0ZUJsb2NrTG4oYFxuICAgICAgICB0eXBlICR7dW5pb25WYXJpYW50VHlwZSh0eXBlLCB2YXJpYW50KX0ge1xuICAgICAgICAgICAgJHt2YXJpYW50Lm5hbWV9OiAke3ZhcmlhbnQudHlwZS5uYW1lfVxuICAgICAgICB9XG5cbiAgICAgICAgYCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlblFMRW51bVR5cGVzKCkge1xuICAgICAgICBmb3IgKGNvbnN0IGVudW1EZWY6IEludEVudW1EZWYgb2YgZW51bVR5cGVzLnZhbHVlcygpKSB7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGBlbnVtICR7ZW51bURlZi5uYW1lfUVudW0ge2ApO1xuICAgICAgICAgICAgT2JqZWN0LmtleXMoZW51bURlZi52YWx1ZXMpLmZvckVhY2goKG5hbWUpID0+IHtcbiAgICAgICAgICAgICAgICBxbC53cml0ZUxuKGAgICAgJHt0b0VudW1TdHlsZShuYW1lKX1gKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcWwud3JpdGVMbihgfWApO1xuICAgICAgICAgICAgcWwud3JpdGVMbigpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuUUxUeXBlRGVjbGFyYXRpb24odHlwZTogRGJUeXBlKSB7XG4gICAgICAgIGlmICh0eXBlLmNhdGVnb3J5ID09PSBEYlR5cGVDYXRlZ29yeS51bmlvbikge1xuICAgICAgICAgICAgZ2VuUUxUeXBlRGVjbGFyYXRpb25zRm9yVW5pb25WYXJpYW50cyh0eXBlKTtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oYHVuaW9uICR7dHlwZS5uYW1lfSA9IGApO1xuICAgICAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCh2YXJpYW50ID0+IHtcbiAgICAgICAgICAgICAgICBxbC53cml0ZUxuKGBcXHR8ICR7dW5pb25WYXJpYW50VHlwZSh0eXBlLCB2YXJpYW50KX1gKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcWwud3JpdGVMbigpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZ2VuUUxEb2MoJycsIHR5cGUuZG9jKTtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oYHR5cGUgJHt0eXBlLm5hbWV9IHtgKTtcbiAgICAgICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goZmllbGQgPT4ge1xuICAgICAgICAgICAgICAgIGdlblFMRG9jKCdcXHQnLCBmaWVsZC5kb2MpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHR5cGVEZWNsYXJhdGlvbiA9XG4gICAgICAgICAgICAgICAgICAgICdbJy5yZXBlYXQoZmllbGQuYXJyYXlEZXB0aCkgK1xuICAgICAgICAgICAgICAgICAgICBmaWVsZC50eXBlLm5hbWUgK1xuICAgICAgICAgICAgICAgICAgICAnXScucmVwZWF0KGZpZWxkLmFycmF5RGVwdGgpO1xuICAgICAgICAgICAgICAgIHFsLndyaXRlTG4oYFxcdCR7ZmllbGQubmFtZX06ICR7dHlwZURlY2xhcmF0aW9ufWApO1xuICAgICAgICAgICAgICAgIGNvbnN0IGVudW1EZWYgPSBmaWVsZC5lbnVtRGVmO1xuICAgICAgICAgICAgICAgIGlmIChlbnVtRGVmKSB7XG4gICAgICAgICAgICAgICAgICAgIHFsLndyaXRlTG4oYFxcdCR7ZmllbGQubmFtZX1fbmFtZTogJHtlbnVtRGVmLm5hbWV9RW51bWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcWwud3JpdGVMbihgfWApO1xuICAgICAgICB9XG4gICAgICAgIHFsLndyaXRlTG4oKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwcmV2ZW50VHdpY2UobmFtZTogc3RyaW5nLCBuYW1lczogU2V0PHN0cmluZz4sIHdvcms6ICgpID0+IHZvaWQpIHtcbiAgICAgICAgaWYgKCFuYW1lcy5oYXMobmFtZSkpIHtcbiAgICAgICAgICAgIG5hbWVzLmFkZChuYW1lKTtcbiAgICAgICAgICAgIHdvcmsoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlblFMRmlsdGVyc0ZvckFycmF5RmllbGRzKHR5cGU6IERiVHlwZSwgcWxOYW1lczogU2V0PHN0cmluZz4pIHtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGxldCBpdGVtVHlwZU5hbWUgPSBmaWVsZC50eXBlLm5hbWU7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZpZWxkLmFycmF5RGVwdGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpbHRlck5hbWUgPSBgJHtpdGVtVHlwZU5hbWV9QXJyYXlGaWx0ZXJgO1xuICAgICAgICAgICAgICAgIHByZXZlbnRUd2ljZShmaWx0ZXJOYW1lLCBxbE5hbWVzLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHFsLndyaXRlTG4oYGlucHV0ICR7ZmlsdGVyTmFtZX0ge2ApO1xuICAgICAgICAgICAgICAgICAgICBbJ2FueScsICdhbGwnXS5mb3JFYWNoKChvcCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcWwud3JpdGVMbihgXFx0JHtvcH06ICR7aXRlbVR5cGVOYW1lfUZpbHRlcmApO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgcWwud3JpdGVMbignfScpO1xuICAgICAgICAgICAgICAgICAgICBxbC53cml0ZUxuKCk7XG5cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBpdGVtVHlwZU5hbWUgKz0gJ0FycmF5JztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuUUxGaWx0ZXJzRm9yRW51bU5hbWVGaWVsZHModHlwZTogRGJUeXBlLCBxbE5hbWVzOiBTZXQ8c3RyaW5nPikge1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgZW51bURlZiA9IGZpZWxkLmVudW1EZWY7XG4gICAgICAgICAgICBpZiAoZW51bURlZikge1xuICAgICAgICAgICAgICAgIHByZXZlbnRUd2ljZShgJHtlbnVtRGVmLm5hbWV9RW51bUZpbHRlcmAsIHFsTmFtZXMsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgZ2VuUUxTY2FsYXJUeXBlc0ZpbHRlcihgJHtlbnVtRGVmLm5hbWV9RW51bWApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5RTEZpbHRlcih0eXBlOiBEYlR5cGUsIHFsTmFtZXM6IFNldDxzdHJpbmc+KSB7XG4gICAgICAgIGlmICh0eXBlLmZpZWxkcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBnZW5RTEZpbHRlcnNGb3JBcnJheUZpZWxkcyh0eXBlLCBxbE5hbWVzKTtcbiAgICAgICAgZ2VuUUxGaWx0ZXJzRm9yRW51bU5hbWVGaWVsZHModHlwZSwgcWxOYW1lcyk7XG4gICAgICAgIGdlblFMRG9jKCcnLCB0eXBlLmRvYyk7XG4gICAgICAgIHFsLndyaXRlTG4oYGlucHV0ICR7dHlwZS5uYW1lfUZpbHRlciB7YCk7XG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBnZW5RTERvYygnXFx0JywgZmllbGQuZG9jKTtcbiAgICAgICAgICAgIGNvbnN0IHR5cGVEZWNsYXJhdGlvbiA9IGZpZWxkLnR5cGUubmFtZSArIFwiQXJyYXlcIi5yZXBlYXQoZmllbGQuYXJyYXlEZXB0aCk7XG4gICAgICAgICAgICBxbC53cml0ZUxuKGBcXHQke2ZpZWxkLm5hbWV9OiAke3R5cGVEZWNsYXJhdGlvbn1GaWx0ZXJgKTtcbiAgICAgICAgICAgIGNvbnN0IGVudW1EZWYgPSBmaWVsZC5lbnVtRGVmO1xuICAgICAgICAgICAgaWYgKGVudW1EZWYpIHtcbiAgICAgICAgICAgICAgICBxbC53cml0ZUxuKGBcXHQke2ZpZWxkLm5hbWV9X25hbWU6ICR7ZW51bURlZi5uYW1lfUVudW1GaWx0ZXJgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHFsLndyaXRlTG4oYH1gKTtcbiAgICAgICAgcWwud3JpdGVMbigpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlblFMU2NhbGFyVHlwZXNGaWx0ZXIobmFtZTogc3RyaW5nKSB7XG4gICAgICAgIHFsLndyaXRlTG4oYGlucHV0ICR7bmFtZX1GaWx0ZXIge2ApO1xuICAgICAgICBbJ2VxJywgJ25lJywgJ2d0JywgJ2x0JywgJ2dlJywgJ2xlJ10uZm9yRWFjaCgob3ApID0+IHtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oYFxcdCR7b3B9OiAke25hbWV9YCk7XG4gICAgICAgIH0pO1xuICAgICAgICBbJ2luJywgJ25vdEluJ10uZm9yRWFjaCgob3ApID0+IHtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oYFxcdCR7b3B9OiBbJHtuYW1lfV1gKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHFsLndyaXRlTG4oJ30nKTtcbiAgICAgICAgcWwud3JpdGVMbigpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlblFMUXVlcmllcyh0eXBlczogRGJUeXBlW10pIHtcbiAgICAgICAgcWwud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgXCJTcGVjaWZ5IHNvcnQgb3JkZXIgZGlyZWN0aW9uXCJcbiAgICAgICAgZW51bSBRdWVyeU9yZGVyQnlEaXJlY3Rpb24ge1xuICAgICAgICAgICAgXCJEb2N1bWVudHMgd2lsbCBiZSBzb3J0ZWQgaW4gYXNjZW5kZWQgb3JkZXIgKGUuZy4gZnJvbSBBIHRvIFopXCJcbiAgICAgICAgICAgIEFTQ1xuICAgICAgICAgICAgXCJEb2N1bWVudHMgd2lsbCBiZSBzb3J0ZWQgaW4gZGVzY2VuZGFudCBvcmRlciAoZS5nLiBmcm9tIFogdG8gQSlcIlxuICAgICAgICAgICAgREVTQ1xuICAgICAgICB9XG5cbiAgICAgICAgXG4gICAgICAgIFwiXCJcIlxuICAgICAgICBTcGVjaWZ5IGhvdyB0byBzb3J0IHJlc3VsdHMuXG4gICAgICAgIFlvdSBjYW4gc29ydCBkb2N1bWVudHMgaW4gcmVzdWx0IHNldCB1c2luZyBtb3JlIHRoYW4gb25lIGZpZWxkLlxuICAgICAgICBcIlwiXCJcbiAgICAgICAgaW5wdXQgUXVlcnlPcmRlckJ5IHtcbiAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgICAgUGF0aCB0byBmaWVsZCB3aGljaCBtdXN0IGJlIHVzZWQgYXMgYSBzb3J0IGNyaXRlcmlhLlxuICAgICAgICAgICAgSWYgZmllbGQgcmVzaWRlcyBkZWVwIGluIHN0cnVjdHVyZSBwYXRoIGl0ZW1zIG11c3QgYmUgc2VwYXJhdGVkIHdpdGggZG90IChlLmcuICdmb28uYmFyLmJheicpLlxuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgICBwYXRoOiBTdHJpbmdcbiAgICAgICAgICAgIFwiU29ydCBvcmRlciBkaXJlY3Rpb25cIlxuICAgICAgICAgICAgZGlyZWN0aW9uOiBRdWVyeU9yZGVyQnlEaXJlY3Rpb25cbiAgICAgICAgfVxuXG4gICAgICAgIHR5cGUgUXVlcnkge1xuICAgICAgICBgKTtcblxuICAgICAgICB0eXBlcy5mb3JFYWNoKCh0eXBlOiBEYlR5cGUpID0+IHtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oYFxcdCR7dHlwZS5jb2xsZWN0aW9uIHx8ICcnfShmaWx0ZXI6ICR7dHlwZS5uYW1lfUZpbHRlciwgb3JkZXJCeTogW1F1ZXJ5T3JkZXJCeV0sIGxpbWl0OiBJbnQpOiBbJHt0eXBlLm5hbWV9XWApO1xuICAgICAgICB9KTtcblxuICAgICAgICBxbC53cml0ZUJsb2NrTG4oYFxuICAgICAgICB9XG5cbiAgICAgICAgYCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuUUxTdWJzY3JpcHRpb25zKHR5cGVzOiBEYlR5cGVbXSkge1xuICAgICAgICBxbC53cml0ZUxuKCd0eXBlIFN1YnNjcmlwdGlvbiB7Jyk7XG4gICAgICAgIHR5cGVzLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICAgICAgICAgIHFsLndyaXRlTG4oYFxcdCR7dHlwZS5jb2xsZWN0aW9uIHx8ICcnfShmaWx0ZXI6ICR7dHlwZS5uYW1lfUZpbHRlcik6ICR7dHlwZS5uYW1lfWApO1xuICAgICAgICB9KTtcbiAgICAgICAgcWwud3JpdGVMbignfScpO1xuICAgIH1cblxuXG4gICAgZnVuY3Rpb24gZ2V0U2NhbGFyUmVzb2x2ZXJOYW1lKGZpZWxkOiBEYkZpZWxkKTogc3RyaW5nIHtcbiAgICAgICAgaWYgKGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLnVpbnQ2NCkge1xuICAgICAgICAgICAgcmV0dXJuICdiaWdVSW50MSc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLnVpbnQxMDI0KSB7XG4gICAgICAgICAgICByZXR1cm4gJ2JpZ1VJbnQyJztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJ3NjYWxhcic7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuSlNGaWx0ZXJzRm9yQXJyYXlGaWVsZHModHlwZTogRGJUeXBlLCBqc05hbWVzOiBTZXQ8c3RyaW5nPikge1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgbGV0IGl0ZW1UeXBlTmFtZSA9IGZpZWxkLnR5cGUubmFtZTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZmllbGQuYXJyYXlEZXB0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmlsdGVyTmFtZSA9IGAke2l0ZW1UeXBlTmFtZX1BcnJheWA7XG4gICAgICAgICAgICAgICAgcHJldmVudFR3aWNlKGZpbHRlck5hbWUsIGpzTmFtZXMsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaXRlbVJlc29sdmVyTmFtZSA9IChpID09PSAwICYmIGZpZWxkLnR5cGUuY2F0ZWdvcnkgPT09IERiVHlwZUNhdGVnb3J5LnNjYWxhcilcbiAgICAgICAgICAgICAgICAgICAgICAgID8gZ2V0U2NhbGFyUmVzb2x2ZXJOYW1lKGZpZWxkKVxuICAgICAgICAgICAgICAgICAgICAgICAgOiBpdGVtVHlwZU5hbWU7XG4gICAgICAgICAgICAgICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgICAgICAgICAgY29uc3QgJHtmaWx0ZXJOYW1lfSA9IGFycmF5KCR7aXRlbVJlc29sdmVyTmFtZX0pO1xuICAgICAgICAgICAgICAgIGApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGl0ZW1UeXBlTmFtZSArPSAnQXJyYXknO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5KU1N0cnVjdEZpbHRlcih0eXBlOiBEYlR5cGUpIHtcbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgY29uc3QgJHt0eXBlLm5hbWV9ID0gc3RydWN0KHtcbiAgICBgKTtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGxldCB0eXBlRGVjbGFyYXRpb246ID9zdHJpbmcgPSBudWxsO1xuICAgICAgICAgICAgY29uc3Qgam9pbiA9IGZpZWxkLmpvaW47XG4gICAgICAgICAgICBpZiAoam9pbikge1xuICAgICAgICAgICAgICAgIHR5cGVEZWNsYXJhdGlvbiA9IGBqb2luJHtmaWVsZC5hcnJheURlcHRoID4gMCA/ICdBcnJheScgOiAnJ30oJyR7am9pbi5vbn0nLCAnJHtmaWVsZC50eXBlLmNvbGxlY3Rpb24gfHwgJyd9JywgJHtmaWVsZC50eXBlLm5hbWV9KWA7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLmFycmF5RGVwdGggPiAwKSB7XG4gICAgICAgICAgICAgICAgdHlwZURlY2xhcmF0aW9uID1cbiAgICAgICAgICAgICAgICAgICAgZmllbGQudHlwZS5uYW1lICtcbiAgICAgICAgICAgICAgICAgICAgJ0FycmF5Jy5yZXBlYXQoZmllbGQuYXJyYXlEZXB0aCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLnR5cGUuY2F0ZWdvcnkgPT09IERiVHlwZUNhdGVnb3J5LnNjYWxhcikge1xuICAgICAgICAgICAgICAgIHR5cGVEZWNsYXJhdGlvbiA9IGdldFNjYWxhclJlc29sdmVyTmFtZShmaWVsZCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLnR5cGUuZmllbGRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB0eXBlRGVjbGFyYXRpb24gPSBmaWVsZC50eXBlLm5hbWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodHlwZURlY2xhcmF0aW9uKSB7XG4gICAgICAgICAgICAgICAganMud3JpdGVMbihgICAgICR7ZmllbGQubmFtZX06ICR7dHlwZURlY2xhcmF0aW9ufSxgKTtcbiAgICAgICAgICAgICAgICBjb25zdCBlbnVtRGVmID0gZmllbGQuZW51bURlZjtcbiAgICAgICAgICAgICAgICBpZiAoZW51bURlZikge1xuICAgICAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgJHtmaWVsZC5uYW1lfV9uYW1lOiBlbnVtTmFtZSgnJHtmaWVsZC5uYW1lfScsICR7c3RyaW5naWZ5RW51bVZhbHVlcyhlbnVtRGVmLnZhbHVlcyl9KSxgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICB9JHt0eXBlLmNvbGxlY3Rpb24gPyAnLCB0cnVlJyA6ICcnfSk7XG5cbiAgICBgKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5KU1VuaW9uUmVzb2x2ZXIodHlwZTogRGJUeXBlKSB7XG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIGNvbnN0ICR7dHlwZS5uYW1lfVJlc29sdmVyID0ge1xuICAgICAgICAgICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgYCk7XG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKHZhcmlhbnQpID0+IHtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgaWYgKCcke3ZhcmlhbnQubmFtZX0nIGluIG9iaikge2ApO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgcmV0dXJuICcke3VuaW9uVmFyaWFudFR5cGUodHlwZSwgdmFyaWFudCl9JztgKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgfWApO1xuICAgICAgICB9KTtcbiAgICAgICAganMud3JpdGVCbG9ja0xuKGBcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBgKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5KU0ZpbHRlcih0eXBlOiBEYlR5cGUsIGpzTmFtZXM6IFNldDxzdHJpbmc+KSB7XG4gICAgICAgIGlmICh0eXBlLmZpZWxkcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZS5jYXRlZ29yeSA9PT0gRGJUeXBlQ2F0ZWdvcnkudW5pb24pIHtcbiAgICAgICAgICAgIC8vIGdlbkpTRmlsdGVyc0ZvclVuaW9uVmFyaWFudHModHlwZSwganNOYW1lcyk7XG4gICAgICAgIH1cbiAgICAgICAgZ2VuSlNGaWx0ZXJzRm9yQXJyYXlGaWVsZHModHlwZSwganNOYW1lcyk7XG4gICAgICAgIGdlbkpTU3RydWN0RmlsdGVyKHR5cGUpO1xuICAgICAgICBpZiAodHlwZS5jYXRlZ29yeSA9PT0gRGJUeXBlQ2F0ZWdvcnkudW5pb24pIHtcbiAgICAgICAgICAgIGdlbkpTVW5pb25SZXNvbHZlcih0eXBlKTtcbiAgICAgICAgfVxuXG5cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZW5lcmF0ZSBjdXN0b20gcmVzb2x2ZXJzIGZvciB0eXBlcyB3aXRoOlxuICAgICAqIC0gaWQgZmllbGRcbiAgICAgKiAtIGpvaW4gZmllbGRzXG4gICAgICogLSB1NjQgYW5kIGhpZ2hlciBmaWVsZHNcbiAgICAgKiBAcGFyYW0gdHlwZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGdlbkpTQ3VzdG9tUmVzb2x2ZXJzKHR5cGU6IERiVHlwZSkge1xuICAgICAgICBjb25zdCBqb2luRmllbGRzID0gdHlwZS5maWVsZHMuZmlsdGVyKHggPT4gISF4LmpvaW4pO1xuICAgICAgICBjb25zdCBiaWdVSW50RmllbGRzID0gdHlwZS5maWVsZHMuZmlsdGVyKCh4OiBEYkZpZWxkKSA9PiAoeC50eXBlID09PSBzY2FsYXJUeXBlcy51aW50NjQpIHx8ICh4LnR5cGUgPT09IHNjYWxhclR5cGVzLnVpbnQxMDI0KSk7XG4gICAgICAgIGNvbnN0IGVudW1GaWVsZHMgPSB0eXBlLmZpZWxkcy5maWx0ZXIoeCA9PiB4LmVudW1EZWYpO1xuICAgICAgICBjb25zdCBjdXN0b21SZXNvbHZlclJlcXVpcmVkID0gdHlwZS5jb2xsZWN0aW9uXG4gICAgICAgICAgICB8fCBqb2luRmllbGRzLmxlbmd0aCA+IDBcbiAgICAgICAgICAgIHx8IGJpZ1VJbnRGaWVsZHMubGVuZ3RoID4gMFxuICAgICAgICAgICAgfHwgZW51bUZpZWxkcy5sZW5ndGggPiAwO1xuICAgICAgICBpZiAoIWN1c3RvbVJlc29sdmVyUmVxdWlyZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICR7dHlwZS5uYW1lfToge2ApO1xuICAgICAgICBpZiAodHlwZS5jb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICBqcy53cml0ZUxuKCcgICAgICAgICAgICBpZChwYXJlbnQpIHsnKTtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oJyAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7Jyk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKCcgICAgICAgICAgICB9LCcpO1xuICAgICAgICB9XG4gICAgICAgIGpvaW5GaWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG9uRmllbGQgPSB0eXBlLmZpZWxkcy5maW5kKHggPT4geC5uYW1lID09PSAoZmllbGQuam9pbiAmJiBmaWVsZC5qb2luLm9uKSB8fCAnJyk7XG4gICAgICAgICAgICBpZiAoIW9uRmllbGQpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyAnSm9pbiBvbiBmaWVsZCBkb2VzIG5vdCBleGlzdC4nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgY29sbGVjdGlvbiA9IGZpZWxkLnR5cGUuY29sbGVjdGlvbjtcbiAgICAgICAgICAgIGlmICghY29sbGVjdGlvbikge1xuICAgICAgICAgICAgICAgIHRocm93ICdKb2luZWQgdHlwZSBpcyBub3QgYSBjb2xsZWN0aW9uLic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAke2ZpZWxkLm5hbWV9KHBhcmVudCwgX2FyZ3MsIGNvbnRleHQpIHtgKTtcbiAgICAgICAgICAgIGlmIChmaWVsZC5hcnJheURlcHRoID09PSAwKSB7XG4gICAgICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgICAgIHJldHVybiBjb250ZXh0LmRiLmZldGNoRG9jQnlLZXkoY29udGV4dC5kYi4ke2NvbGxlY3Rpb259LCBwYXJlbnQuJHtvbkZpZWxkLm5hbWV9KTtgKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQuYXJyYXlEZXB0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICAgICByZXR1cm4gY29udGV4dC5kYi5mZXRjaERvY3NCeUtleXMoY29udGV4dC5kYi4ke2NvbGxlY3Rpb259LCBwYXJlbnQuJHtvbkZpZWxkLm5hbWV9KTtgKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgJ0pvaW5zIG9uIGEgbmVzdGVkIGFycmF5cyBkb2VzIG5vdCBzdXBwb3J0ZWQuJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgIH0sYCk7XG4gICAgICAgIH0pO1xuICAgICAgICBiaWdVSW50RmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwcmVmaXhMZW5ndGggPSBmaWVsZC50eXBlID09PSBzY2FsYXJUeXBlcy51aW50NjQgPyAxIDogMjtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICR7ZmllbGQubmFtZX0ocGFyZW50KSB7YCk7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KCR7cHJlZml4TGVuZ3RofSwgcGFyZW50LiR7ZmllbGQubmFtZX0pO2ApO1xuICAgICAgICAgICAganMud3JpdGVMbihgICAgICAgICAgICAgfSxgKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGVudW1GaWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGVudW1EZWYgPSBmaWVsZC5lbnVtRGVmO1xuICAgICAgICAgICAgaWYgKGVudW1EZWYpIHtcbiAgICAgICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAke2ZpZWxkLm5hbWV9X25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJyR7ZmllbGQubmFtZX0nLCAke3N0cmluZ2lmeUVudW1WYWx1ZXMoZW51bURlZi52YWx1ZXMpfSksYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgIH0sYCk7XG4gICAgfVxuXG5cbiAgICBmdW5jdGlvbiBnZW5KU1R5cGVSZXNvbHZlcnNGb3JVbmlvbih0eXBlOiBEYlR5cGUpIHtcbiAgICAgICAgaWYgKHR5cGUuY2F0ZWdvcnkgPT09IERiVHlwZUNhdGVnb3J5LnVuaW9uKSB7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICR7dHlwZS5uYW1lfTogJHt0eXBlLm5hbWV9UmVzb2x2ZXIsYCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5lcmF0ZSh0eXBlczogRGJUeXBlW10pIHtcblxuICAgICAgICAvLyBRTFxuXG4gICAgICAgIFsnU3RyaW5nJywgJ0Jvb2xlYW4nLCAnSW50JywgJ0Zsb2F0J10uZm9yRWFjaChnZW5RTFNjYWxhclR5cGVzRmlsdGVyKTtcbiAgICAgICAgZ2VuUUxFbnVtVHlwZXMoKTtcbiAgICAgICAgdHlwZXMuZm9yRWFjaCh0eXBlID0+IGdlblFMVHlwZURlY2xhcmF0aW9uKHR5cGUpKTtcbiAgICAgICAgY29uc3QgcWxBcnJheUZpbHRlcnMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICAgICAgdHlwZXMuZm9yRWFjaCh0eXBlID0+IGdlblFMRmlsdGVyKHR5cGUsIHFsQXJyYXlGaWx0ZXJzKSk7XG5cbiAgICAgICAgY29uc3QgY29sbGVjdGlvbnMgPSB0eXBlcy5maWx0ZXIodCA9PiAhIXQuY29sbGVjdGlvbik7XG4gICAgICAgIGdlblFMUXVlcmllcyhjb2xsZWN0aW9ucyk7XG4gICAgICAgIGdlblFMU3Vic2NyaXB0aW9ucyhjb2xsZWN0aW9ucyk7XG5cbiAgICAgICAgLy8gSlNcblxuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICBjb25zdCB7XG4gICAgICAgICAgICBzY2FsYXIsXG4gICAgICAgICAgICBiaWdVSW50MSxcbiAgICAgICAgICAgIGJpZ1VJbnQyLFxuICAgICAgICAgICAgcmVzb2x2ZUJpZ1VJbnQsXG4gICAgICAgICAgICBzdHJ1Y3QsXG4gICAgICAgICAgICBhcnJheSxcbiAgICAgICAgICAgIGpvaW4sXG4gICAgICAgICAgICBqb2luQXJyYXksXG4gICAgICAgICAgICBlbnVtTmFtZSxcbiAgICAgICAgICAgIGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIsXG4gICAgICAgIH0gPSByZXF1aXJlKCcuL3EtdHlwZXMuanMnKTtcbiAgICAgICAgYCk7XG4gICAgICAgIGNvbnN0IGpzQXJyYXlGaWx0ZXJzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgICAgIHR5cGVzLmZvckVhY2godHlwZSA9PiBnZW5KU0ZpbHRlcih0eXBlLCBqc0FycmF5RmlsdGVycykpO1xuXG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIGZ1bmN0aW9uIGNyZWF0ZVJlc29sdmVycyhkYikge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgYCk7XG4gICAgICAgIHR5cGVzLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICAgICAgICAgIGdlbkpTQ3VzdG9tUmVzb2x2ZXJzKHR5cGUpO1xuICAgICAgICAgICAgZ2VuSlNUeXBlUmVzb2x2ZXJzRm9yVW5pb24odHlwZSk7XG4gICAgICAgIH0pO1xuICAgICAgICBqcy53cml0ZUxuKCcgICAgICAgIFF1ZXJ5OiB7Jyk7XG4gICAgICAgIGNvbGxlY3Rpb25zLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICAgICAgICAgIGpzLndyaXRlTG4oYCAgICAgICAgICAgICR7dHlwZS5jb2xsZWN0aW9uIHx8ICcnfTogZGIuY29sbGVjdGlvblF1ZXJ5KGRiLiR7dHlwZS5jb2xsZWN0aW9uIHx8ICcnfSwgJHt0eXBlLm5hbWV9KSxgKVxuICAgICAgICB9KTtcbiAgICAgICAganMud3JpdGVMbignICAgICAgICB9LCcpO1xuICAgICAgICBqcy53cml0ZUxuKCcgICAgICAgIFN1YnNjcmlwdGlvbjogeycpO1xuICAgICAgICBjb2xsZWN0aW9ucy5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgICAgICAgICBqcy53cml0ZUxuKGAgICAgICAgICAgICAke3R5cGUuY29sbGVjdGlvbiB8fCAnJ306IGRiLmNvbGxlY3Rpb25TdWJzY3JpcHRpb24oZGIuJHt0eXBlLmNvbGxlY3Rpb24gfHwgJyd9LCAke3R5cGUubmFtZX0pLGApXG4gICAgICAgIH0pO1xuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGApO1xuXG4gICAgICAgIGpzLndyaXRlQmxvY2tMbihgXG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0ge1xuICAgICAgICAgICAgY3JlYXRlUmVzb2x2ZXJzLFxuICAgICAgICBgKTtcbiAgICAgICAgdHlwZXMuZm9yRWFjaCh0eXBlID0+IGpzLndyaXRlTG4oYCAgICAke3R5cGUubmFtZX0sYCkpO1xuICAgICAgICBqcy53cml0ZUJsb2NrTG4oYFxuICAgICAgICB9O1xuICAgICAgICBgKTtcbiAgICB9XG5cbiAgICBjb25zdCBzY2hlbWEgPSBwYXJzZVR5cGVEZWYoc2NoZW1hRGVmKTtcblxuICAgIGlmIChzY2hlbWEuY2xhc3MpIHtcbiAgICAgICAgcGFyc2VEYlR5cGVzKHNjaGVtYS5jbGFzcy50eXBlcyk7XG4gICAgICAgIGdlbmVyYXRlKGRiVHlwZXMpO1xuICAgIH1cblxuICAgIGZvciAoY29uc3QgZTogSW50RW51bURlZiBvZiBlbnVtVHlwZXMudmFsdWVzKCkpIHtcbiAgICAgICAgY29uc29sZS5sb2coYGV4cG9ydCBjb25zdCBRJHtlLm5hbWV9ID0ge2ApO1xuICAgICAgICBjb25zb2xlLmxvZyhPYmplY3QuZW50cmllcyhlLnZhbHVlcykubWFwKChbbmFtZSwgdmFsdWVdKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gYCAgICAke25hbWV9OiAkeyh2YWx1ZTogYW55KX0sYDtcbiAgICAgICAgfSkuam9pbignXFxuJykpO1xuICAgICAgICBjb25zb2xlLmxvZyhgfTtcXG5gKTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBxbDogcWwuZ2VuZXJhdGVkKCksXG4gICAgICAgIGpzOiBqcy5nZW5lcmF0ZWQoKSxcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IG1haW47XG4iXX0=