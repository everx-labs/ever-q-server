"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.u8enum = u8enum;
exports.otherCurrencyCollection = exports.OtherCurrency = exports.grams = exports.u64 = exports.u32 = exports.u16 = exports.u8 = exports.i32 = exports.i8 = exports.required = exports.withDoc = exports.join = void 0;

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _schema = require("ton-labs-dev-ops/dist/src/schema");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

var ref = _schema.Def.ref,
    arrayOf = _schema.Def.arrayOf;

var join = function join(refDef, on) {
  return _objectSpread({}, ref(refDef), {
    _: {
      join: {
        on: on
      }
    }
  });
};

exports.join = join;

var withDoc = function withDoc(def, doc) {
  return _objectSpread({}, def, {}, doc ? {
    _doc: doc
  } : {});
};

exports.withDoc = withDoc;

var required = function required(def) {
  return def;
};

exports.required = required;

var uint = function uint(size, doc) {
  return withDoc({
    _int: {
      unsigned: true,
      size: size
    }
  }, doc);
};

var _int = function _int(size, doc) {
  return withDoc({
    _int: {
      unsigned: false,
      size: size
    }
  }, doc);
};

var i8 = function i8(doc) {
  return _int(8, doc);
};

exports.i8 = i8;

var i32 = function i32(doc) {
  return _int(32, doc);
};

exports.i32 = i32;

var u8 = function u8(doc) {
  return uint(8, doc);
};

exports.u8 = u8;

var u16 = function u16(doc) {
  return uint(16, doc);
};

exports.u16 = u16;

var u32 = function u32(doc) {
  return uint(32, doc);
};

exports.u32 = u32;

var u64 = function u64(doc) {
  return uint(64, doc);
};

exports.u64 = u64;

var u128 = function u128(doc) {
  return uint(128, doc);
};

var u256 = function u256(doc) {
  return uint(256, doc);
};

var grams = u128;
exports.grams = grams;

function u8enum(name, values) {
  return function (doc) {
    var valuesDoc = Object.entries(values).map(function (_ref) {
      var _ref2 = (0, _slicedToArray2["default"])(_ref, 2),
          name = _ref2[0],
          value = _ref2[1];

      return "- ".concat(value, " \u2013 ").concat(name);
    }).join('\n');
    var effectiveDoc = "".concat(doc ? "".concat(doc, "\n") : '').concat(valuesDoc);
    return withDoc({
      _int: {
        unsigned: true,
        size: 8
      },
      _: {
        "enum": {
          name: name,
          values: values
        }
      }
    }, effectiveDoc);
  };
}

var OtherCurrency = {
  currency: u32(),
  value: u256()
};
exports.OtherCurrency = OtherCurrency;

var otherCurrencyCollection = function otherCurrencyCollection(doc) {
  return arrayOf(ref({
    OtherCurrency: OtherCurrency
  }), doc);
};

exports.otherCurrencyCollection = otherCurrencyCollection;