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

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NlcnZlci9zY2hlbWEvZGItc2NoZW1hLXR5cGVzLmpzIl0sIm5hbWVzIjpbInJlZiIsIkRlZiIsImFycmF5T2YiLCJqb2luIiwicmVmRGVmIiwib24iLCJfIiwid2l0aERvYyIsImRlZiIsImRvYyIsIl9kb2MiLCJyZXF1aXJlZCIsInVpbnQiLCJzaXplIiwiX2ludCIsInVuc2lnbmVkIiwiaW50IiwiaTgiLCJpMzIiLCJ1OCIsInUxNiIsInUzMiIsInU2NCIsInUxMjgiLCJ1MjU2IiwiZ3JhbXMiLCJ1OGVudW0iLCJuYW1lIiwidmFsdWVzIiwidmFsdWVzRG9jIiwiT2JqZWN0IiwiZW50cmllcyIsIm1hcCIsInZhbHVlIiwiZWZmZWN0aXZlRG9jIiwiT3RoZXJDdXJyZW5jeSIsImN1cnJlbmN5Iiwib3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBQ0E7Ozs7OztJQUVRQSxHLEdBQWlCQyxXLENBQWpCRCxHO0lBQUtFLE8sR0FBWUQsVyxDQUFaQyxPOztBQUVOLElBQU1DLElBQUksR0FBRyxTQUFQQSxJQUFPLENBQUNDLE1BQUQsRUFBZ0NDLEVBQWhDLEVBQXdEO0FBQ3hFLDJCQUFZTCxHQUFHLENBQUNJLE1BQUQsQ0FBZjtBQUF5QkUsSUFBQUEsQ0FBQyxFQUFFO0FBQUVILE1BQUFBLElBQUksRUFBRTtBQUFFRSxRQUFBQSxFQUFFLEVBQUZBO0FBQUY7QUFBUjtBQUE1QjtBQUNILENBRk07Ozs7QUFJQSxJQUFNRSxPQUFPLEdBQUcsU0FBVkEsT0FBVSxDQUFDQyxHQUFELEVBQWVDLEdBQWY7QUFBQSwyQkFDaEJELEdBRGdCLE1BRWZDLEdBQUcsR0FBRztBQUFFQyxJQUFBQSxJQUFJLEVBQUVEO0FBQVIsR0FBSCxHQUFtQixFQUZQO0FBQUEsQ0FBaEI7Ozs7QUFLQSxJQUFNRSxRQUFRLEdBQUcsU0FBWEEsUUFBVyxDQUFDSCxHQUFEO0FBQUEsU0FBa0JBLEdBQWxCO0FBQUEsQ0FBakI7Ozs7QUFFUCxJQUFNSSxJQUFJLEdBQUcsU0FBUEEsSUFBTyxDQUFDQyxJQUFELEVBQW9CSixHQUFwQjtBQUFBLFNBQXFDRixPQUFPLENBQUM7QUFDdERPLElBQUFBLElBQUksRUFBRTtBQUFFQyxNQUFBQSxRQUFRLEVBQUUsSUFBWjtBQUFrQkYsTUFBQUEsSUFBSSxFQUFKQTtBQUFsQjtBQURnRCxHQUFELEVBRXRESixHQUZzRCxDQUE1QztBQUFBLENBQWI7O0FBSUEsSUFBTU8sSUFBRyxHQUFHLFNBQU5BLElBQU0sQ0FBQ0gsSUFBRCxFQUFvQkosR0FBcEI7QUFBQSxTQUFxQ0YsT0FBTyxDQUFDO0FBQ3JETyxJQUFBQSxJQUFJLEVBQUU7QUFBRUMsTUFBQUEsUUFBUSxFQUFFLEtBQVo7QUFBbUJGLE1BQUFBLElBQUksRUFBSkE7QUFBbkI7QUFEK0MsR0FBRCxFQUVyREosR0FGcUQsQ0FBNUM7QUFBQSxDQUFaOztBQUlPLElBQU1RLEVBQUUsR0FBRyxTQUFMQSxFQUFLLENBQUNSLEdBQUQ7QUFBQSxTQUFrQk8sSUFBRyxDQUFDLENBQUQsRUFBSVAsR0FBSixDQUFyQjtBQUFBLENBQVg7Ozs7QUFDQSxJQUFNUyxHQUFHLEdBQUcsU0FBTkEsR0FBTSxDQUFDVCxHQUFEO0FBQUEsU0FBa0JPLElBQUcsQ0FBQyxFQUFELEVBQUtQLEdBQUwsQ0FBckI7QUFBQSxDQUFaOzs7O0FBQ0EsSUFBTVUsRUFBRSxHQUFHLFNBQUxBLEVBQUssQ0FBQ1YsR0FBRDtBQUFBLFNBQWtCRyxJQUFJLENBQUMsQ0FBRCxFQUFJSCxHQUFKLENBQXRCO0FBQUEsQ0FBWDs7OztBQUNBLElBQU1XLEdBQUcsR0FBRyxTQUFOQSxHQUFNLENBQUNYLEdBQUQ7QUFBQSxTQUFrQkcsSUFBSSxDQUFDLEVBQUQsRUFBS0gsR0FBTCxDQUF0QjtBQUFBLENBQVo7Ozs7QUFDQSxJQUFNWSxHQUFHLEdBQUcsU0FBTkEsR0FBTSxDQUFDWixHQUFEO0FBQUEsU0FBa0JHLElBQUksQ0FBQyxFQUFELEVBQUtILEdBQUwsQ0FBdEI7QUFBQSxDQUFaOzs7O0FBQ0EsSUFBTWEsR0FBRyxHQUFHLFNBQU5BLEdBQU0sQ0FBQ2IsR0FBRDtBQUFBLFNBQWtCRyxJQUFJLENBQUMsRUFBRCxFQUFLSCxHQUFMLENBQXRCO0FBQUEsQ0FBWjs7OztBQUNQLElBQU1jLElBQUksR0FBRyxTQUFQQSxJQUFPLENBQUNkLEdBQUQ7QUFBQSxTQUFrQkcsSUFBSSxDQUFDLEdBQUQsRUFBTUgsR0FBTixDQUF0QjtBQUFBLENBQWI7O0FBQ0EsSUFBTWUsSUFBSSxHQUFHLFNBQVBBLElBQU8sQ0FBQ2YsR0FBRDtBQUFBLFNBQWtCRyxJQUFJLENBQUMsR0FBRCxFQUFNSCxHQUFOLENBQXRCO0FBQUEsQ0FBYjs7QUFFTyxJQUFNZ0IsS0FBSyxHQUFHRixJQUFkOzs7QUFNQSxTQUFTRyxNQUFULENBQWdCQyxJQUFoQixFQUE4QkMsTUFBOUIsRUFBcUQ7QUFDeEQsU0FBTyxVQUFDbkIsR0FBRCxFQUEyQjtBQUM5QixRQUFNb0IsU0FBUyxHQUFHQyxNQUFNLENBQUNDLE9BQVAsQ0FBZUgsTUFBZixFQUF1QkksR0FBdkIsQ0FBMkIsZ0JBQW1CO0FBQUE7QUFBQSxVQUFqQkwsSUFBaUI7QUFBQSxVQUFYTSxLQUFXOztBQUM1RCx5QkFBYUEsS0FBYixxQkFBOEJOLElBQTlCO0FBQ0gsS0FGaUIsRUFFZnhCLElBRmUsQ0FFVixJQUZVLENBQWxCO0FBR0EsUUFBTStCLFlBQVksYUFBTXpCLEdBQUcsYUFBTUEsR0FBTixVQUFnQixFQUF6QixTQUE4Qm9CLFNBQTlCLENBQWxCO0FBQ0EsV0FBT3RCLE9BQU8sQ0FBQztBQUNYTyxNQUFBQSxJQUFJLEVBQUU7QUFDRkMsUUFBQUEsUUFBUSxFQUFFLElBRFI7QUFFRkYsUUFBQUEsSUFBSSxFQUFFO0FBRkosT0FESztBQUtYUCxNQUFBQSxDQUFDLEVBQUU7QUFDQyxnQkFBTTtBQUNGcUIsVUFBQUEsSUFBSSxFQUFKQSxJQURFO0FBRUZDLFVBQUFBLE1BQU0sRUFBTkE7QUFGRTtBQURQO0FBTFEsS0FBRCxFQVdYTSxZQVhXLENBQWQ7QUFZSCxHQWpCRDtBQWtCSDs7QUFFTSxJQUFNQyxhQUFzQixHQUFHO0FBQ2xDQyxFQUFBQSxRQUFRLEVBQUVmLEdBQUcsRUFEcUI7QUFFbENZLEVBQUFBLEtBQUssRUFBRVQsSUFBSTtBQUZ1QixDQUEvQjs7O0FBS0EsSUFBTWEsdUJBQXVCLEdBQUcsU0FBMUJBLHVCQUEwQixDQUFDNUIsR0FBRDtBQUFBLFNBQTJCUCxPQUFPLENBQUNGLEdBQUcsQ0FBQztBQUFFbUMsSUFBQUEsYUFBYSxFQUFiQTtBQUFGLEdBQUQsQ0FBSixFQUF5QjFCLEdBQXpCLENBQWxDO0FBQUEsQ0FBaEMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBAZmxvd1xuaW1wb3J0IHsgRGVmIH0gZnJvbSBcInRvbi1sYWJzLWRldi1vcHMvZGlzdC9zcmMvc2NoZW1hXCI7XG5pbXBvcnQgdHlwZSB7IEludFNpemVUeXBlLCBUeXBlRGVmIH0gZnJvbSBcInRvbi1sYWJzLWRldi1vcHMvc3JjL3NjaGVtYVwiO1xuY29uc3QgeyByZWYsIGFycmF5T2YgfSA9IERlZjtcblxuZXhwb3J0IGNvbnN0IGpvaW4gPSAocmVmRGVmOiB7IFtzdHJpbmddOiBUeXBlRGVmIH0sIG9uOiBzdHJpbmcpOiBUeXBlRGVmID0+IHtcbiAgICByZXR1cm4geyAuLi5yZWYocmVmRGVmKSwgXzogeyBqb2luOiB7IG9uIH0gfSB9XG59O1xuXG5leHBvcnQgY29uc3Qgd2l0aERvYyA9IChkZWY6IFR5cGVEZWYsIGRvYz86IHN0cmluZykgPT4gKHtcbiAgICAuLi5kZWYsXG4gICAgLi4uKGRvYyA/IHsgX2RvYzogZG9jIH0gOiB7fSlcbn0pO1xuXG5leHBvcnQgY29uc3QgcmVxdWlyZWQgPSAoZGVmOiBUeXBlRGVmKSA9PiBkZWY7XG5cbmNvbnN0IHVpbnQgPSAoc2l6ZTogSW50U2l6ZVR5cGUsIGRvYz86IHN0cmluZykgPT4gd2l0aERvYyh7XG4gICAgX2ludDogeyB1bnNpZ25lZDogdHJ1ZSwgc2l6ZSB9XG59LCBkb2MpO1xuXG5jb25zdCBpbnQgPSAoc2l6ZTogSW50U2l6ZVR5cGUsIGRvYz86IHN0cmluZykgPT4gd2l0aERvYyh7XG4gICAgX2ludDogeyB1bnNpZ25lZDogZmFsc2UsIHNpemUgfVxufSwgZG9jKTtcblxuZXhwb3J0IGNvbnN0IGk4ID0gKGRvYz86IHN0cmluZykgPT4gaW50KDgsIGRvYyk7XG5leHBvcnQgY29uc3QgaTMyID0gKGRvYz86IHN0cmluZykgPT4gaW50KDMyLCBkb2MpO1xuZXhwb3J0IGNvbnN0IHU4ID0gKGRvYz86IHN0cmluZykgPT4gdWludCg4LCBkb2MpO1xuZXhwb3J0IGNvbnN0IHUxNiA9IChkb2M/OiBzdHJpbmcpID0+IHVpbnQoMTYsIGRvYyk7XG5leHBvcnQgY29uc3QgdTMyID0gKGRvYz86IHN0cmluZykgPT4gdWludCgzMiwgZG9jKTtcbmV4cG9ydCBjb25zdCB1NjQgPSAoZG9jPzogc3RyaW5nKSA9PiB1aW50KDY0LCBkb2MpO1xuY29uc3QgdTEyOCA9IChkb2M/OiBzdHJpbmcpID0+IHVpbnQoMTI4LCBkb2MpO1xuY29uc3QgdTI1NiA9IChkb2M/OiBzdHJpbmcpID0+IHVpbnQoMjU2LCBkb2MpO1xuXG5leHBvcnQgY29uc3QgZ3JhbXMgPSB1MTI4O1xuXG50eXBlIEludEVudW1WYWx1ZXMgPSB7XG4gICAgW3N0cmluZ106IG51bWJlclxufTtcblxuZXhwb3J0IGZ1bmN0aW9uIHU4ZW51bShuYW1lOiBzdHJpbmcsIHZhbHVlczogSW50RW51bVZhbHVlcykge1xuICAgIHJldHVybiAoZG9jPzogc3RyaW5nKTogVHlwZURlZiA9PiB7XG4gICAgICAgIGNvbnN0IHZhbHVlc0RvYyA9IE9iamVjdC5lbnRyaWVzKHZhbHVlcykubWFwKChbbmFtZSwgdmFsdWVdKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gYC0gJHsodmFsdWU6IGFueSl9IOKAkyAke25hbWV9YDtcbiAgICAgICAgfSkuam9pbignXFxuJyk7XG4gICAgICAgIGNvbnN0IGVmZmVjdGl2ZURvYyA9IGAke2RvYyA/IGAke2RvY31cXG5gIDogJyd9JHt2YWx1ZXNEb2N9YDtcbiAgICAgICAgcmV0dXJuIHdpdGhEb2Moe1xuICAgICAgICAgICAgX2ludDoge1xuICAgICAgICAgICAgICAgIHVuc2lnbmVkOiB0cnVlLFxuICAgICAgICAgICAgICAgIHNpemU6IDgsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXzoge1xuICAgICAgICAgICAgICAgIGVudW06IHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVzXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LCBlZmZlY3RpdmVEb2MpO1xuICAgIH1cbn1cblxuZXhwb3J0IGNvbnN0IE90aGVyQ3VycmVuY3k6IFR5cGVEZWYgPSB7XG4gICAgY3VycmVuY3k6IHUzMigpLFxuICAgIHZhbHVlOiB1MjU2KCksXG59O1xuXG5leHBvcnQgY29uc3Qgb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24gPSAoZG9jPzogc3RyaW5nKTogVHlwZURlZiA9PiBhcnJheU9mKHJlZih7IE90aGVyQ3VycmVuY3kgfSksIGRvYyk7XG4iXX0=