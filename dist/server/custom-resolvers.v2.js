"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.attachCustomResolvers = attachCustomResolvers;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var customResolvers = {};

function attachCustomResolvers(resolvers) {
  var attached = Object.assign({}, resolvers);
  Object.entries(customResolvers).forEach(function (_ref) {
    var _ref2 = (0, _slicedToArray2["default"])(_ref, 2),
        name = _ref2[0],
        fields = _ref2[1];

    var resolver = attached[name];

    if (!resolver) {
      resolver = {};
      attached[name] = resolver;
    }

    fields.forEach(function (field) {
      resolver[field] = function (parent) {
        var value = parent[field];
        return typeof value === 'string' ? (0, _defineProperty2["default"])({}, value, {}) : value;
      };
    });
  });
  return attached;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9jdXN0b20tcmVzb2x2ZXJzLnYyLmpzIl0sIm5hbWVzIjpbImN1c3RvbVJlc29sdmVycyIsImF0dGFjaEN1c3RvbVJlc29sdmVycyIsInJlc29sdmVycyIsImF0dGFjaGVkIiwiT2JqZWN0IiwiYXNzaWduIiwiZW50cmllcyIsImZvckVhY2giLCJuYW1lIiwiZmllbGRzIiwicmVzb2x2ZXIiLCJmaWVsZCIsInBhcmVudCIsInZhbHVlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0FBQUEsSUFBTUEsZUFBZSxHQUFHLEVBQXhCOztBQUlBLFNBQVNDLHFCQUFULENBQStCQyxTQUEvQixFQUEwQztBQUN0QyxNQUFNQyxRQUFRLEdBQUdDLE1BQU0sQ0FBQ0MsTUFBUCxDQUFjLEVBQWQsRUFBa0JILFNBQWxCLENBQWpCO0FBQ0FFLEVBQUFBLE1BQU0sQ0FBQ0UsT0FBUCxDQUFlTixlQUFmLEVBQWdDTyxPQUFoQyxDQUF3QyxnQkFBb0I7QUFBQTtBQUFBLFFBQWxCQyxJQUFrQjtBQUFBLFFBQVpDLE1BQVk7O0FBQ3hELFFBQUlDLFFBQVEsR0FBR1AsUUFBUSxDQUFDSyxJQUFELENBQXZCOztBQUNBLFFBQUksQ0FBQ0UsUUFBTCxFQUFlO0FBQ1hBLE1BQUFBLFFBQVEsR0FBRyxFQUFYO0FBQ0FQLE1BQUFBLFFBQVEsQ0FBQ0ssSUFBRCxDQUFSLEdBQWlCRSxRQUFqQjtBQUNIOztBQUNERCxJQUFBQSxNQUFNLENBQUNGLE9BQVAsQ0FBZSxVQUFDSSxLQUFELEVBQVc7QUFDdEJELE1BQUFBLFFBQVEsQ0FBQ0MsS0FBRCxDQUFSLEdBQWtCLFVBQUNDLE1BQUQsRUFBWTtBQUMxQixZQUFNQyxLQUFLLEdBQUdELE1BQU0sQ0FBQ0QsS0FBRCxDQUFwQjtBQUNBLGVBQU8sT0FBT0UsS0FBUCxLQUFpQixRQUFqQix3Q0FBK0JBLEtBQS9CLEVBQXVDLEVBQXZDLElBQThDQSxLQUFyRDtBQUNILE9BSEQ7QUFJSCxLQUxEO0FBTUgsR0FaRDtBQWFBLFNBQU9WLFFBQVA7QUFDSCIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IGN1c3RvbVJlc29sdmVycyA9IHtcbn07XG5cblxuZnVuY3Rpb24gYXR0YWNoQ3VzdG9tUmVzb2x2ZXJzKHJlc29sdmVycykge1xuICAgIGNvbnN0IGF0dGFjaGVkID0gT2JqZWN0LmFzc2lnbih7fSwgcmVzb2x2ZXJzKTtcbiAgICBPYmplY3QuZW50cmllcyhjdXN0b21SZXNvbHZlcnMpLmZvckVhY2goKFtuYW1lLCBmaWVsZHNdKSA9PiB7XG4gICAgICAgIGxldCByZXNvbHZlciA9IGF0dGFjaGVkW25hbWVdO1xuICAgICAgICBpZiAoIXJlc29sdmVyKSB7XG4gICAgICAgICAgICByZXNvbHZlciA9IHt9O1xuICAgICAgICAgICAgYXR0YWNoZWRbbmFtZV0gPSByZXNvbHZlcjtcbiAgICAgICAgfVxuICAgICAgICBmaWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgIHJlc29sdmVyW2ZpZWxkXSA9IChwYXJlbnQpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZSA9IHBhcmVudFtmaWVsZF07XG4gICAgICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgPyB7IFt2YWx1ZV06IHt9IH0gOiB2YWx1ZTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICAgIHJldHVybiBhdHRhY2hlZDtcbn1cblxuZXhwb3J0IHtcbiAgICBhdHRhY2hDdXN0b21SZXNvbHZlcnNcbn1cbiJdfQ==