"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.wrap = wrap;
exports.parseSelectionSet = parseSelectionSet;
exports.selectionToString = selectionToString;
exports.selectFields = selectFields;
exports.RegistryMap = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

function wrap(_x, _x2, _x3, _x4) {
  return _wrap.apply(this, arguments);
}

function _wrap() {
  _wrap = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee(log, op, args, fetch) {
    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;
            _context.next = 3;
            return fetch();

          case 3:
            return _context.abrupt("return", _context.sent);

          case 6:
            _context.prev = 6;
            _context.t0 = _context["catch"](0);
            delete _context.t0.response;
            log.error('FAILED', op, args, _context.t0.message || _context.t0.ArangoError || _context.t0.toString());
            throw _context.t0.ArangoError || _context.t0;

          case 11:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[0, 6]]);
  }));
  return _wrap.apply(this, arguments);
}

var RegistryMap =
/*#__PURE__*/
function () {
  function RegistryMap(name) {
    (0, _classCallCheck2["default"])(this, RegistryMap);
    (0, _defineProperty2["default"])(this, "name", void 0);
    (0, _defineProperty2["default"])(this, "items", void 0);
    (0, _defineProperty2["default"])(this, "lastId", void 0);
    this.name = name;
    this.lastId = 0;
    this.items = new Map();
  }

  (0, _createClass2["default"])(RegistryMap, [{
    key: "add",
    value: function add(item) {
      var id = this.lastId;

      do {
        id = id < Number.MAX_SAFE_INTEGER ? id + 1 : 1;
      } while (this.items.has(id));

      this.lastId = id;
      this.items.set(id, item);
      return id;
    }
  }, {
    key: "remove",
    value: function remove(id) {
      if (!this.items["delete"](id)) {
        console.error("Failed to remove ".concat(this.name, ": item with id [").concat(id, "] does not exists"));
      }
    }
  }, {
    key: "entries",
    value: function entries() {
      return (0, _toConsumableArray2["default"])(this.items.entries());
    }
  }, {
    key: "values",
    value: function values() {
      return (0, _toConsumableArray2["default"])(this.items.values());
    }
  }]);
  return RegistryMap;
}();

exports.RegistryMap = RegistryMap;

function parseSelectionSet(selectionSet, returnFieldSelection) {
  var fields = [];
  var selections = selectionSet && selectionSet.selections;

  if (selections) {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = selections[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var _item = _step.value;

        var _name = _item.name && _item.name.value || '';

        if (_name) {
          var field = {
            name: _name,
            selection: parseSelectionSet(_item.selectionSet, '')
          };

          if (returnFieldSelection !== '' && field.name === returnFieldSelection) {
            return field.selection;
          }

          fields.push(field);
        }
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

  return fields;
}

function selectionToString(selection) {
  return selection.filter(function (x) {
    return x.name !== '__typename';
  }).map(function (field) {
    var fieldSelection = selectionToString(field.selection);
    return "".concat(field.name).concat(fieldSelection !== '' ? " { ".concat(fieldSelection, " }") : '');
  }).join(' ');
}

function selectFields(doc, selection) {
  var selected = {};

  if (doc._key) {
    selected._key = doc._key;
    selected.id = doc._key;
  }

  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = selection[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var _item2 = _step2.value;
      var _onField = {
        in_message: 'in_msg',
        out_messages: 'out_msg',
        signatures: 'id'
      }[_item2.name];

      if (_onField !== undefined && doc[_onField] !== undefined) {
        selected[_onField] = doc[_onField];
      }

      var _value = doc[_item2.name];

      if (_value !== undefined) {
        selected[_item2.name] = _item2.selection.length > 0 ? selectFields(_value, _item2.selection) : _value;
      }
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

  return selected;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci91dGlscy5qcyJdLCJuYW1lcyI6WyJ3cmFwIiwibG9nIiwib3AiLCJhcmdzIiwiZmV0Y2giLCJyZXNwb25zZSIsImVycm9yIiwibWVzc2FnZSIsIkFyYW5nb0Vycm9yIiwidG9TdHJpbmciLCJSZWdpc3RyeU1hcCIsIm5hbWUiLCJsYXN0SWQiLCJpdGVtcyIsIk1hcCIsIml0ZW0iLCJpZCIsIk51bWJlciIsIk1BWF9TQUZFX0lOVEVHRVIiLCJoYXMiLCJzZXQiLCJjb25zb2xlIiwiZW50cmllcyIsInZhbHVlcyIsInBhcnNlU2VsZWN0aW9uU2V0Iiwic2VsZWN0aW9uU2V0IiwicmV0dXJuRmllbGRTZWxlY3Rpb24iLCJmaWVsZHMiLCJzZWxlY3Rpb25zIiwidmFsdWUiLCJmaWVsZCIsInNlbGVjdGlvbiIsInB1c2giLCJzZWxlY3Rpb25Ub1N0cmluZyIsImZpbHRlciIsIngiLCJtYXAiLCJmaWVsZFNlbGVjdGlvbiIsImpvaW4iLCJzZWxlY3RGaWVsZHMiLCJkb2MiLCJzZWxlY3RlZCIsIl9rZXkiLCJvbkZpZWxkIiwiaW5fbWVzc2FnZSIsIm91dF9tZXNzYWdlcyIsInNpZ25hdHVyZXMiLCJ1bmRlZmluZWQiLCJsZW5ndGgiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7U0FFc0JBLEk7Ozs7Ozs7K0JBQWYsaUJBQXVCQyxHQUF2QixFQUFrQ0MsRUFBbEMsRUFBOENDLElBQTlDLEVBQXlEQyxLQUF6RDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLG1CQUVjQSxLQUFLLEVBRm5COztBQUFBO0FBQUE7O0FBQUE7QUFBQTtBQUFBO0FBSUMsbUJBQU8sWUFBSUMsUUFBWDtBQUNBSixZQUFBQSxHQUFHLENBQUNLLEtBQUosQ0FBVSxRQUFWLEVBQW9CSixFQUFwQixFQUF3QkMsSUFBeEIsRUFBOEIsWUFBSUksT0FBSixJQUFlLFlBQUlDLFdBQW5CLElBQWtDLFlBQUlDLFFBQUosRUFBaEU7QUFMRCxr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QUFBO0FBQUE7QUFBQTs7QUFvQnJFLFNBQU9ZLFFBQVA7QUFDSCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgUUxvZyB9IGZyb20gJy4vbG9ncyc7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB3cmFwPFI+KGxvZzogUUxvZywgb3A6IHN0cmluZywgYXJnczogYW55LCBmZXRjaDogKCkgPT4gUHJvbWlzZTxSPikge1xuICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBhd2FpdCBmZXRjaCgpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBkZWxldGUgZXJyLnJlc3BvbnNlO1xuICAgICAgICBsb2cuZXJyb3IoJ0ZBSUxFRCcsIG9wLCBhcmdzLCBlcnIubWVzc2FnZSB8fCBlcnIuQXJhbmdvRXJyb3IgfHwgZXJyLnRvU3RyaW5nKCkpO1xuICAgICAgICB0aHJvdyBlcnIuQXJhbmdvRXJyb3IgfHwgZXJyO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFJlZ2lzdHJ5TWFwPFQ+IHtcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgaXRlbXM6IE1hcDxudW1iZXIsIFQ+O1xuICAgIGxhc3RJZDogbnVtYmVyO1xuXG4gICAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7XG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgIHRoaXMubGFzdElkID0gMDtcbiAgICAgICAgdGhpcy5pdGVtcyA9IG5ldyBNYXAoKTtcbiAgICB9XG5cbiAgICBhZGQoaXRlbTogVCk6IG51bWJlciB7XG4gICAgICAgIGxldCBpZCA9IHRoaXMubGFzdElkO1xuICAgICAgICBkbyB7XG4gICAgICAgICAgICBpZCA9IGlkIDwgTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVIgPyBpZCArIDEgOiAxO1xuICAgICAgICB9IHdoaWxlICh0aGlzLml0ZW1zLmhhcyhpZCkpO1xuICAgICAgICB0aGlzLmxhc3RJZCA9IGlkO1xuICAgICAgICB0aGlzLml0ZW1zLnNldChpZCwgaXRlbSk7XG4gICAgICAgIHJldHVybiBpZDtcbiAgICB9XG5cbiAgICByZW1vdmUoaWQ6IG51bWJlcikge1xuICAgICAgICBpZiAoIXRoaXMuaXRlbXMuZGVsZXRlKGlkKSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgRmFpbGVkIHRvIHJlbW92ZSAke3RoaXMubmFtZX06IGl0ZW0gd2l0aCBpZCBbJHtpZH1dIGRvZXMgbm90IGV4aXN0c2ApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZW50cmllcygpOiBbbnVtYmVyLCBUXVtdIHtcbiAgICAgICAgcmV0dXJuIFsuLi50aGlzLml0ZW1zLmVudHJpZXMoKV07XG4gICAgfVxuXG4gICAgdmFsdWVzKCk6IFRbXSB7XG4gICAgICAgIHJldHVybiBbLi4udGhpcy5pdGVtcy52YWx1ZXMoKV07XG4gICAgfVxufVxuXG5leHBvcnQgdHlwZSBGaWVsZFNlbGVjdGlvbiA9IHtcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgc2VsZWN0aW9uOiBGaWVsZFNlbGVjdGlvbltdLFxufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VTZWxlY3Rpb25TZXQoc2VsZWN0aW9uU2V0OiBhbnksIHJldHVybkZpZWxkU2VsZWN0aW9uOiBzdHJpbmcpOiBGaWVsZFNlbGVjdGlvbltdIHtcbiAgICBjb25zdCBmaWVsZHM6IEZpZWxkU2VsZWN0aW9uW10gPSBbXTtcbiAgICBjb25zdCBzZWxlY3Rpb25zID0gc2VsZWN0aW9uU2V0ICYmIHNlbGVjdGlvblNldC5zZWxlY3Rpb25zO1xuICAgIGlmIChzZWxlY3Rpb25zKSB7XG4gICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBzZWxlY3Rpb25zKSB7XG4gICAgICAgICAgICBjb25zdCBuYW1lID0gKGl0ZW0ubmFtZSAmJiBpdGVtLm5hbWUudmFsdWUpIHx8ICcnO1xuICAgICAgICAgICAgaWYgKG5hbWUpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWVsZDogRmllbGRTZWxlY3Rpb24gPSB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGlvbjogcGFyc2VTZWxlY3Rpb25TZXQoaXRlbS5zZWxlY3Rpb25TZXQsICcnKSxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGlmIChyZXR1cm5GaWVsZFNlbGVjdGlvbiAhPT0gJycgJiYgZmllbGQubmFtZSA9PT0gcmV0dXJuRmllbGRTZWxlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZpZWxkLnNlbGVjdGlvbjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZmllbGRzLnB1c2goZmllbGQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmaWVsZHM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZWxlY3Rpb25Ub1N0cmluZyhzZWxlY3Rpb246IEZpZWxkU2VsZWN0aW9uW10pOiBzdHJpbmcge1xuICAgIHJldHVybiBzZWxlY3Rpb25cbiAgICAgICAgLmZpbHRlcih4ID0+IHgubmFtZSAhPT0gJ19fdHlwZW5hbWUnKVxuICAgICAgICAubWFwKChmaWVsZDogRmllbGRTZWxlY3Rpb24pID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGZpZWxkU2VsZWN0aW9uID0gc2VsZWN0aW9uVG9TdHJpbmcoZmllbGQuc2VsZWN0aW9uKTtcbiAgICAgICAgICAgIHJldHVybiBgJHtmaWVsZC5uYW1lfSR7ZmllbGRTZWxlY3Rpb24gIT09ICcnID8gYCB7ICR7ZmllbGRTZWxlY3Rpb259IH1gIDogJyd9YDtcbiAgICAgICAgfSkuam9pbignICcpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2VsZWN0RmllbGRzKGRvYzogYW55LCBzZWxlY3Rpb246IEZpZWxkU2VsZWN0aW9uW10pOiBhbnkge1xuICAgIGNvbnN0IHNlbGVjdGVkOiBhbnkgPSB7fTtcbiAgICBpZiAoZG9jLl9rZXkpIHtcbiAgICAgICAgc2VsZWN0ZWQuX2tleSA9IGRvYy5fa2V5O1xuICAgICAgICBzZWxlY3RlZC5pZCA9IGRvYy5fa2V5O1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IGl0ZW0gb2Ygc2VsZWN0aW9uKSB7XG4gICAgICAgIGNvbnN0IG9uRmllbGQgPSB7XG4gICAgICAgICAgICBpbl9tZXNzYWdlOiAnaW5fbXNnJyxcbiAgICAgICAgICAgIG91dF9tZXNzYWdlczogJ291dF9tc2cnLFxuICAgICAgICAgICAgc2lnbmF0dXJlczogJ2lkJyxcbiAgICAgICAgfVtpdGVtLm5hbWVdO1xuICAgICAgICBpZiAob25GaWVsZCAhPT0gdW5kZWZpbmVkICYmIGRvY1tvbkZpZWxkXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBzZWxlY3RlZFtvbkZpZWxkXSA9IGRvY1tvbkZpZWxkXTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB2YWx1ZSA9IGRvY1tpdGVtLm5hbWVdO1xuICAgICAgICBpZiAodmFsdWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgc2VsZWN0ZWRbaXRlbS5uYW1lXSA9IGl0ZW0uc2VsZWN0aW9uLmxlbmd0aCA+IDAgPyBzZWxlY3RGaWVsZHModmFsdWUsIGl0ZW0uc2VsZWN0aW9uKSA6IHZhbHVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzZWxlY3RlZDtcbn1cbiJdfQ==