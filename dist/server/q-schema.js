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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9xLXNjaGVtYS5qcyJdLCJuYW1lcyI6WyJyZWYiLCJEZWYiLCJhcnJheU9mIiwiam9pbiIsInJlZkRlZiIsIm9uIiwiXyIsIndpdGhEb2MiLCJkZWYiLCJkb2MiLCJfZG9jIiwicmVxdWlyZWQiLCJ1aW50Iiwic2l6ZSIsIl9pbnQiLCJ1bnNpZ25lZCIsImludCIsImk4IiwiaTMyIiwidTgiLCJ1MTYiLCJ1MzIiLCJ1NjQiLCJ1MTI4IiwidTI1NiIsImdyYW1zIiwidThlbnVtIiwibmFtZSIsInZhbHVlcyIsInZhbHVlc0RvYyIsIk9iamVjdCIsImVudHJpZXMiLCJtYXAiLCJ2YWx1ZSIsImVmZmVjdGl2ZURvYyIsIk90aGVyQ3VycmVuY3kiLCJjdXJyZW5jeSIsIm90aGVyQ3VycmVuY3lDb2xsZWN0aW9uIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUNBOzs7Ozs7SUFFUUEsRyxHQUFpQkMsVyxDQUFqQkQsRztJQUFLRSxPLEdBQVlELFcsQ0FBWkMsTzs7QUFFTixJQUFNQyxJQUFJLEdBQUcsU0FBUEEsSUFBTyxDQUFDQyxNQUFELEVBQWdDQyxFQUFoQyxFQUF3RDtBQUN4RSwyQkFBWUwsR0FBRyxDQUFDSSxNQUFELENBQWY7QUFBeUJFLElBQUFBLENBQUMsRUFBRTtBQUFFSCxNQUFBQSxJQUFJLEVBQUU7QUFBRUUsUUFBQUEsRUFBRSxFQUFGQTtBQUFGO0FBQVI7QUFBNUI7QUFDSCxDQUZNOzs7O0FBSUEsSUFBTUUsT0FBTyxHQUFHLFNBQVZBLE9BQVUsQ0FBQ0MsR0FBRCxFQUFlQyxHQUFmO0FBQUEsMkJBQ2hCRCxHQURnQixNQUVmQyxHQUFHLEdBQUc7QUFBRUMsSUFBQUEsSUFBSSxFQUFFRDtBQUFSLEdBQUgsR0FBbUIsRUFGUDtBQUFBLENBQWhCOzs7O0FBS0EsSUFBTUUsUUFBUSxHQUFHLFNBQVhBLFFBQVcsQ0FBQ0gsR0FBRDtBQUFBLFNBQWtCQSxHQUFsQjtBQUFBLENBQWpCOzs7O0FBRVAsSUFBTUksSUFBSSxH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c0IsR0FBRztBQUNsQ0MsRUFBQUEsUUFBUSxFQUFFZixHQUFHLEVBRHFCO0FBRWxDWSxFQUFBQSxLQUFLLEVBQUVULElBQUk7QUFGdUIsQ0FBL0I7OztBQUtBLElBQU1hLHVCQUF1QixHQUFHLFNBQTFCQSx1QkFBMEIsQ0FBQzVCLEdBQUQ7QUFBQSxTQUEyQlAsT0FBTyxDQUFDRixHQUFHLENBQUM7QUFBRW1DLElBQUFBLGFBQWEsRUFBYkE7QUFBRixHQUFELENBQUosRUFBeUIxQixHQUF6QixDQUFsQztBQUFBLENBQWhDIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQGZsb3dcbmltcG9ydCB7IERlZiB9IGZyb20gXCJ0b24tbGFicy1kZXYtb3BzL2Rpc3Qvc3JjL3NjaGVtYVwiO1xuaW1wb3J0IHR5cGUgeyBJbnRTaXplVHlwZSwgVHlwZURlZiB9IGZyb20gXCJ0b24tbGFicy1kZXYtb3BzL3NyYy9zY2hlbWFcIjtcbmNvbnN0IHsgcmVmLCBhcnJheU9mIH0gPSBEZWY7XG5cbmV4cG9ydCBjb25zdCBqb2luID0gKHJlZkRlZjogeyBbc3RyaW5nXTogVHlwZURlZiB9LCBvbjogc3RyaW5nKTogVHlwZURlZiA9PiB7XG4gICAgcmV0dXJuIHsgLi4ucmVmKHJlZkRlZiksIF86IHsgam9pbjogeyBvbiB9IH0gfVxufTtcblxuZXhwb3J0IGNvbnN0IHdpdGhEb2MgPSAoZGVmOiBUeXBlRGVmLCBkb2M/OiBzdHJpbmcpID0+ICh7XG4gICAgLi4uZGVmLFxuICAgIC4uLihkb2MgPyB7IF9kb2M6IGRvYyB9IDoge30pXG59KTtcblxuZXhwb3J0IGNvbnN0IHJlcXVpcmVkID0gKGRlZjogVHlwZURlZikgPT4gZGVmO1xuXG5jb25zdCB1aW50ID0gKHNpemU6IEludFNpemVUeXBlLCBkb2M/OiBzdHJpbmcpID0+IHdpdGhEb2Moe1xuICAgIF9pbnQ6IHsgdW5zaWduZWQ6IHRydWUsIHNpemUgfVxufSwgZG9jKTtcblxuY29uc3QgaW50ID0gKHNpemU6IEludFNpemVUeXBlLCBkb2M/OiBzdHJpbmcpID0+IHdpdGhEb2Moe1xuICAgIF9pbnQ6IHsgdW5zaWduZWQ6IGZhbHNlLCBzaXplIH1cbn0sIGRvYyk7XG5cbmV4cG9ydCBjb25zdCBpOCA9IChkb2M/OiBzdHJpbmcpID0+IGludCg4LCBkb2MpO1xuZXhwb3J0IGNvbnN0IGkzMiA9IChkb2M/OiBzdHJpbmcpID0+IGludCgzMiwgZG9jKTtcbmV4cG9ydCBjb25zdCB1OCA9IChkb2M/OiBzdHJpbmcpID0+IHVpbnQoOCwgZG9jKTtcbmV4cG9ydCBjb25zdCB1MTYgPSAoZG9jPzogc3RyaW5nKSA9PiB1aW50KDE2LCBkb2MpO1xuZXhwb3J0IGNvbnN0IHUzMiA9IChkb2M/OiBzdHJpbmcpID0+IHVpbnQoMzIsIGRvYyk7XG5leHBvcnQgY29uc3QgdTY0ID0gKGRvYz86IHN0cmluZykgPT4gdWludCg2NCwgZG9jKTtcbmNvbnN0IHUxMjggPSAoZG9jPzogc3RyaW5nKSA9PiB1aW50KDEyOCwgZG9jKTtcbmNvbnN0IHUyNTYgPSAoZG9jPzogc3RyaW5nKSA9PiB1aW50KDI1NiwgZG9jKTtcblxuZXhwb3J0IGNvbnN0IGdyYW1zID0gdTEyODtcblxudHlwZSBJbnRFbnVtVmFsdWVzID0ge1xuICAgIFtzdHJpbmddOiBudW1iZXJcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiB1OGVudW0obmFtZTogc3RyaW5nLCB2YWx1ZXM6IEludEVudW1WYWx1ZXMpIHtcbiAgICByZXR1cm4gKGRvYz86IHN0cmluZyk6IFR5cGVEZWYgPT4ge1xuICAgICAgICBjb25zdCB2YWx1ZXNEb2MgPSBPYmplY3QuZW50cmllcyh2YWx1ZXMpLm1hcCgoW25hbWUsIHZhbHVlXSkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGAtICR7KHZhbHVlOiBhbnkpfSDigJMgJHtuYW1lfWA7XG4gICAgICAgIH0pLmpvaW4oJ1xcbicpO1xuICAgICAgICBjb25zdCBlZmZlY3RpdmVEb2MgPSBgJHtkb2MgPyBgJHtkb2N9XFxuYCA6ICcnfSR7dmFsdWVzRG9jfWA7XG4gICAgICAgIHJldHVybiB3aXRoRG9jKHtcbiAgICAgICAgICAgIF9pbnQ6IHtcbiAgICAgICAgICAgICAgICB1bnNpZ25lZDogdHJ1ZSxcbiAgICAgICAgICAgICAgICBzaXplOiA4LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF86IHtcbiAgICAgICAgICAgICAgICBlbnVtOiB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlc1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgZWZmZWN0aXZlRG9jKTtcbiAgICB9XG59XG5cbmV4cG9ydCBjb25zdCBPdGhlckN1cnJlbmN5OiBUeXBlRGVmID0ge1xuICAgIGN1cnJlbmN5OiB1MzIoKSxcbiAgICB2YWx1ZTogdTI1NigpLFxufTtcblxuZXhwb3J0IGNvbnN0IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uID0gKGRvYz86IHN0cmluZyk6IFR5cGVEZWYgPT4gYXJyYXlPZihyZWYoeyBPdGhlckN1cnJlbmN5IH0pLCBkb2MpO1xuIl19