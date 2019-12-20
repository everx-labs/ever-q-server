"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.resolversMam = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _fs = _interopRequireDefault(require("fs"));

var _arango = _interopRequireDefault(require("./arango"));

var _arangoCollection = require("./arango-collection");

var _path = _interopRequireDefault(require("path"));

// Query
function info() {
  var pkg = JSON.parse(_fs["default"].readFileSync(_path["default"].resolve(__dirname, '..', '..', 'package.json')));
  return {
    version: pkg.version
  };
}

function stat(_parent, _args, context) {
  var db = context.db;
  return {
    collections: db.collections.map(function (collection) {
      return {
        name: collection.name,
        subscriptions: collection.subscriptions.items.size,
        waitFor: collection.waitFor.items.size
      };
    })
  };
}

function getChangeLog(_parent, args, context) {
  return context.db.changeLog.get(args.id);
}

function getCollections(_x, _x2, _x3) {
  return _getCollections.apply(this, arguments);
} // Mutation


function _getCollections() {
  _getCollections = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee(_parent, _args, context) {
    var db, collections, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, _collection, _indexes, _dbCollection, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, _index;

    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            db = context.db;
            collections = [];
            _iteratorNormalCompletion = true;
            _didIteratorError = false;
            _iteratorError = undefined;
            _context.prev = 5;
            _iterator = db.collections[Symbol.iterator]();

          case 7:
            if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
              _context.next = 50;
              break;
            }

            _collection = _step.value;
            _indexes = [];
            _dbCollection = _collection.dbCollection();
            _iteratorNormalCompletion2 = true;
            _didIteratorError2 = false;
            _iteratorError2 = undefined;
            _context.prev = 14;
            _context.next = 17;
            return _dbCollection.indexes();

          case 17:
            _context.t0 = Symbol.iterator;
            _iterator2 = _context.sent[_context.t0]();

          case 19:
            if (_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) {
              _context.next = 25;
              break;
            }

            _index = _step2.value;

            _indexes.push(_index.fields.join(', '));

          case 22:
            _iteratorNormalCompletion2 = true;
            _context.next = 19;
            break;

          case 25:
            _context.next = 31;
            break;

          case 27:
            _context.prev = 27;
            _context.t1 = _context["catch"](14);
            _didIteratorError2 = true;
            _iteratorError2 = _context.t1;

          case 31:
            _context.prev = 31;
            _context.prev = 32;

            if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
              _iterator2["return"]();
            }

          case 34:
            _context.prev = 34;

            if (!_didIteratorError2) {
              _context.next = 37;
              break;
            }

            throw _iteratorError2;

          case 37:
            return _context.finish(34);

          case 38:
            return _context.finish(31);

          case 39:
            _context.t2 = collections;
            _context.t3 = _collection.name;
            _context.next = 43;
            return _dbCollection.count();

          case 43:
            _context.t4 = _context.sent.count;
            _context.t5 = _indexes;
            _context.t6 = {
              collection: _context.t3,
              count: _context.t4,
              indexes: _context.t5
            };

            _context.t2.push.call(_context.t2, _context.t6);

          case 47:
            _iteratorNormalCompletion = true;
            _context.next = 7;
            break;

          case 50:
            _context.next = 56;
            break;

          case 52:
            _context.prev = 52;
            _context.t7 = _context["catch"](5);
            _didIteratorError = true;
            _iteratorError = _context.t7;

          case 56:
            _context.prev = 56;
            _context.prev = 57;

            if (!_iteratorNormalCompletion && _iterator["return"] != null) {
              _iterator["return"]();
            }

          case 59:
            _context.prev = 59;

            if (!_didIteratorError) {
              _context.next = 62;
              break;
            }

            throw _iteratorError;

          case 62:
            return _context.finish(59);

          case 63:
            return _context.finish(56);

          case 64:
            return _context.abrupt("return", collections);

          case 65:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[5, 52, 56, 64], [14, 27, 31, 39], [32,, 34, 38], [57,, 59, 63]]);
  }));
  return _getCollections.apply(this, arguments);
}

function setChangeLog(_parent, args, context) {
  if (args.op === 'CLEAR') {
    context.db.changeLog.clear();
  } else if (args.op === 'ON') {
    context.db.changeLog.enabled = true;
  } else if (args.op === 'OFF') {
    context.db.changeLog.enabled = false;
  }

  return 1;
}

var resolversMam = {
  Query: {
    info: info,
    getChangeLog: getChangeLog,
    getCollections: getCollections,
    stat: stat
  },
  Mutation: {
    setChangeLog: setChangeLog
  }
};
exports.resolversMam = resolversMam;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9yZXNvbHZlcnMtbWFtLmpzIl0sIm5hbWVzIjpbImluZm8iLCJwa2ciLCJKU09OIiwicGFyc2UiLCJmcyIsInJlYWRGaWxlU3luYyIsInBhdGgiLCJyZXNvbHZlIiwiX19kaXJuYW1lIiwidmVyc2lvbiIsInN0YXQiLCJfcGFyZW50IiwiX2FyZ3MiLCJjb250ZXh0IiwiZGIiLCJjb2xsZWN0aW9ucyIsIm1hcCIsImNvbGxlY3Rpb24iLCJuYW1lIiwic3Vic2NyaXB0aW9ucyIsIml0ZW1zIiwic2l6ZSIsIndhaXRGb3IiLCJnZXRDaGFuZ2VMb2ciLCJhcmdzIiwiY2hhbmdlTG9nIiwiZ2V0IiwiaWQiLCJnZXRDb2xsZWN0aW9ucyIsImluZGV4ZXMiLCJkYkNvbGxlY3Rpb24iLCJpbmRleCIsInB1c2giLCJmaWVsZHMiLCJqb2luIiwiY291bnQiLCJzZXRDaGFuZ2VMb2ciLCJvcCIsImNsZWFyIiwiZW5hYmxlZCIsInJlc29sdmVyc01hbSIsIlF1ZXJ5IiwiTXV0YXRpb24iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7QUFFQTs7QUFDQTs7QUFDQTs7QUFFQTs7QUE0QkE7QUFFQSxTQUFTQSxJQUFULEdBQXNCO0FBQ2xCLE1BQU1DLEdBQUcsR0FBR0MsSUFBSSxDQUFDQyxLQUFMLENBQVlDLGVBQUdDLFlBQUgsQ0FBZ0JDLGlCQUFLQyxPQUFMLENBQWFDLFNBQWIsRUFBd0IsSUFBeEIsRUFBOEIsSUFBOUIsRUFBb0MsY0FBcEMsQ0FBaEIsQ0FBWixDQUFaO0FBQ0EsU0FBTztBQUNIQyxJQUFBQSxPQUFPLEVBQUVSLEdBQUcsQ0FBQ1E7QUFEVixHQUFQO0FBR0g7O0FBRUQsU0FBU0MsSUFBVCxDQUFjQyxPQUFkLEVBQTRCQyxLQUE1QixFQUF3Q0MsT0FBeEMsRUFBZ0U7QUFDNUQsTUFBTUMsRUFBVSxHQUFHRCxPQUFPLENBQUNDLEVBQTNCO0FBQ0EsU0FBTztBQUNIQyxJQUFBQSxXQUFXLEVBQUVELEVBQUUsQ0FBQ0MsV0FBSCxDQUFl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QUNILEdBRk0sTUFFQSxJQUFJZixJQUFJLENBQUNhLEVBQUwsS0FBWSxLQUFoQixFQUF1QjtBQUMxQnhCLElBQUFBLE9BQU8sQ0FBQ0MsRUFBUixDQUFXVyxTQUFYLENBQXFCYyxPQUFyQixHQUErQixLQUEvQjtBQUNIOztBQUNELFNBQU8sQ0FBUDtBQUNIOztBQUVNLElBQU1DLFlBQVksR0FBRztBQUN4QkMsRUFBQUEsS0FBSyxFQUFFO0FBQ0h6QyxJQUFBQSxJQUFJLEVBQUpBLElBREc7QUFFSHVCLElBQUFBLFlBQVksRUFBWkEsWUFGRztBQUdISyxJQUFBQSxjQUFjLEVBQWRBLGNBSEc7QUFJSGxCLElBQUFBLElBQUksRUFBSkE7QUFKRyxHQURpQjtBQU94QmdDLEVBQUFBLFFBQVEsRUFBRTtBQUNOTixJQUFBQSxZQUFZLEVBQVpBO0FBRE07QUFQYyxDQUFyQiIsInNvdXJjZXNDb250ZW50IjpbIi8vIEBmbG93XG5cbmltcG9ydCBmcyBmcm9tIFwiZnNcIjtcbmltcG9ydCBBcmFuZ28gZnJvbSBcIi4vYXJhbmdvXCI7XG5pbXBvcnQgeyBDb2xsZWN0aW9uIH0gZnJvbSBcIi4vYXJhbmdvLWNvbGxlY3Rpb25cIjtcbmltcG9ydCB0eXBlIHsgUUNvbmZpZyB9IGZyb20gXCIuL2NvbmZpZ1wiO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5cbnR5cGUgQ29udGV4dCA9IHtcbiAgICBkYjogQXJhbmdvLFxuICAgIGNvbmZpZzogUUNvbmZpZyxcbiAgICBzaGFyZWQ6IE1hcDxzdHJpbmcsIGFueT4sXG59XG5cbnR5cGUgSW5mbyA9IHtcbiAgICB2ZXJzaW9uOiBzdHJpbmcsXG59XG5cbnR5cGUgQ29sbGVjdGlvblN0YXQgPSB7XG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHN1YnNjcmlwdGlvbnM6IG51bWJlcixcbiAgICB3YWl0Rm9yOiBudW1iZXIsXG59XG5cbnR5cGUgU3RhdCA9IHtcbiAgICBjb2xsZWN0aW9uczogQ29sbGVjdGlvblN0YXRbXVxufVxuXG50eXBlIENvbGxlY3Rpb25TdW1tYXJ5ID0ge1xuICAgIGNvbGxlY3Rpb246IHN0cmluZyxcbiAgICBjb3VudDogbnVtYmVyLFxuICAgIGluZGV4ZXM6IHN0cmluZ1tdLFxufVxuXG4vLyBRdWVyeVxuXG5mdW5jdGlvbiBpbmZvKCk6IEluZm8ge1xuICAgIGNvbnN0IHBrZyA9IEpTT04ucGFyc2UoKGZzLnJlYWRGaWxlU3luYyhwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi4nLCAnLi4nLCAncGFja2FnZS5qc29uJykpOiBhbnkpKTtcbiAgICByZXR1cm4ge1xuICAgICAgICB2ZXJzaW9uOiBwa2cudmVyc2lvbixcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBzdGF0KF9wYXJlbnQ6IGFueSwgX2FyZ3M6IGFueSwgY29udGV4dDogQ29udGV4dCk6IFN0YXQge1xuICAgIGNvbnN0IGRiOiBBcmFuZ28gPSBjb250ZXh0LmRiO1xuICAgIHJldHVybiB7XG4gICAgICAgIGNvbGxlY3Rpb25zOiBkYi5jb2xsZWN0aW9ucy5tYXAoKGNvbGxlY3Rpb246IENvbGxlY3Rpb24pID0+IHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgbmFtZTogY29sbGVjdGlvbi5uYW1lLFxuICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbnM6IGNvbGxlY3Rpb24uc3Vic2NyaXB0aW9ucy5pdGVtcy5zaXplLFxuICAgICAgICAgICAgICAgIHdhaXRGb3I6IGNvbGxlY3Rpb24ud2FpdEZvci5pdGVtcy5zaXplLFxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH1cbn1cblxuZnVuY3Rpb24gZ2V0Q2hhbmdlTG9nKF9wYXJlbnQ6IGFueSwgYXJnczogeyBpZDogc3RyaW5nIH0sIGNvbnRleHQ6IENvbnRleHQpOiBudW1iZXJbXSB7XG4gICAgcmV0dXJuIGNvbnRleHQuZGIuY2hhbmdlTG9nLmdldChhcmdzLmlkKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZ2V0Q29sbGVjdGlvbnMoX3BhcmVudDogYW55LCBfYXJnczogYW55LCBjb250ZXh0OiBDb250ZXh0KTogUHJvbWlzZTxDb2xsZWN0aW9uU3VtbWFyeVtdPiB7XG4gICAgY29uc3QgZGI6IEFyYW5nbyA9IGNvbnRleHQuZGI7XG4gICAgY29uc3QgY29sbGVjdGlvbnM6IENvbGxlY3Rpb25TdW1tYXJ5W10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IGNvbGxlY3Rpb24gb2YgZGIuY29sbGVjdGlvbnMpIHtcbiAgICAgICAgY29uc3QgaW5kZXhlczogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgY29uc3QgZGJDb2xsZWN0aW9uID0gY29sbGVjdGlvbi5kYkNvbGxlY3Rpb24oKTtcbiAgICAgICAgZm9yIChjb25zdCBpbmRleCBvZiBhd2FpdCBkYkNvbGxlY3Rpb24uaW5kZXhlcygpKSB7XG4gICAgICAgICAgICBpbmRleGVzLnB1c2goaW5kZXguZmllbGRzLmpvaW4oJywgJykpO1xuICAgICAgICB9XG4gICAgICAgIGNvbGxlY3Rpb25zLnB1c2goe1xuICAgICAgICAgICAgY29sbGVjdGlvbjogY29sbGVjdGlvbi5uYW1lLFxuICAgICAgICAgICAgY291bnQ6IChhd2FpdCBkYkNvbGxlY3Rpb24uY291bnQoKSkuY291bnQsXG4gICAgICAgICAgICBpbmRleGVzLFxuICAgICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbGxlY3Rpb25zO1xufVxuXG4vLyBNdXRhdGlvblxuXG5mdW5jdGlvbiBzZXRDaGFuZ2VMb2coX3BhcmVudDogYW55LCBhcmdzOiB7IG9wOiBzdHJpbmcgfSwgY29udGV4dDogQ29udGV4dCk6IG51bWJlciB7XG4gICAgaWYgKGFyZ3Mub3AgPT09ICdDTEVBUicpIHtcbiAgICAgICAgY29udGV4dC5kYi5jaGFuZ2VMb2cuY2xlYXIoKTtcbiAgICB9IGVsc2UgaWYgKGFyZ3Mub3AgPT09ICdPTicpIHtcbiAgICAgICAgY29udGV4dC5kYi5jaGFuZ2VMb2cuZW5hYmxlZCA9IHRydWU7XG4gICAgfSBlbHNlIGlmIChhcmdzLm9wID09PSAnT0ZGJykge1xuICAgICAgICBjb250ZXh0LmRiLmNoYW5nZUxvZy5lbmFibGVkID0gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiAxO1xufVxuXG5leHBvcnQgY29uc3QgcmVzb2x2ZXJzTWFtID0ge1xuICAgIFF1ZXJ5OiB7XG4gICAgICAgIGluZm8sXG4gICAgICAgIGdldENoYW5nZUxvZyxcbiAgICAgICAgZ2V0Q29sbGVjdGlvbnMsXG4gICAgICAgIHN0YXRcbiAgICB9LFxuICAgIE11dGF0aW9uOiB7XG4gICAgICAgIHNldENoYW5nZUxvZyxcbiAgICB9LFxufTtcbiJdfQ==