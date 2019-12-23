"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.resolversMam = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

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
  var subscriptionToStat = function subscriptionToStat(subscription) {
    var iter = subscription.iter;
    return {
      filter: JSON.stringify(subscription.filter),
      queueSize: iter.pushQueue.length + iter.pullQueue.length
    };
  };

  var db = context.db;
  return {
    collections: db.collections.map(function (collection) {
      return {
        name: collection.name,
        subscriptionCount: collection.subscriptions.items.size,
        waitForCount: collection.waitFor.items.size,
        subscriptions: (0, _toConsumableArray2["default"])(collection.subscriptions.values()).map(subscriptionToStat)
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9yZXNvbHZlcnMtbWFtLmpzIl0sIm5hbWVzIjpbImluZm8iLCJwa2ciLCJKU09OIiwicGFyc2UiLCJmcyIsInJlYWRGaWxlU3luYyIsInBhdGgiLCJyZXNvbHZlIiwiX19kaXJuYW1lIiwidmVyc2lvbiIsInN0YXQiLCJfcGFyZW50IiwiX2FyZ3MiLCJjb250ZXh0Iiwic3Vic2NyaXB0aW9uVG9TdGF0Iiwic3Vic2NyaXB0aW9uIiwiaXRlciIsImZpbHRlciIsInN0cmluZ2lmeSIsInF1ZXVlU2l6ZSIsInB1c2hRdWV1ZSIsImxlbmd0aCIsInB1bGxRdWV1ZSIsImRiIiwiY29sbGVjdGlvbnMiLCJtYXAiLCJjb2xsZWN0aW9uIiwibmFtZSIsInN1YnNjcmlwdGlvbkNvdW50Iiwic3Vic2NyaXB0aW9ucyIsIml0ZW1zIiwic2l6ZSIsIndhaXRGb3JDb3VudCIsIndhaXRGb3IiLCJ2YWx1ZXMiLCJnZXRDaGFuZ2VMb2ciLCJhcmdzIiwiY2hhbmdlTG9nIiwiZ2V0IiwiaWQiLCJnZXRDb2xsZWN0aW9ucyIsImluZGV4ZXMiLCJkYkNvbGxlY3Rpb24iLCJpbmRleCIsInB1c2giLCJmaWVsZHMiLCJqb2luIiwiY291bnQiLCJzZXRDaGFuZ2VMb2ciLCJvcCIsImNsZWFyIiwiZW5hYmxlZCIsInJlc29sdmVyc01hbSIsIlF1ZXJ5IiwiTXV0YXRpb24iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUVBOztBQUNBOztBQUVBOztBQUVBOztBQWtDQTtBQUVBLFNBQVNBLElBQVQsR0FBc0I7QUFDbEIsTUFBTUMsR0FBRyxHQUFHQyxJQUFJLENBQUNDLEtBQUwsQ0FBWUMsZUFBR0MsWUFBSCxDQUFnQkMsaUJBQUtDLE9BQUwsQ0FBYUMsU0FBYixFQUF3QixJQUF4QixFQUE4QixJQUE5QixFQUFvQyxjQUFwQyxDQUFoQixDQUFaLENBQVo7QUFDQSxTQUFPO0FBQ0hDLElBQUFBLE9BQU8sRUFBRVIsR0FBRyxDQUFDUTtBQURWLEdBQVA7QUFH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YyxDQUFyQiIsInNvdXJjZXNDb250ZW50IjpbIi8vIEBmbG93XG5cbmltcG9ydCBmcyBmcm9tIFwiZnNcIjtcbmltcG9ydCBBcmFuZ28gZnJvbSBcIi4vYXJhbmdvXCI7XG5pbXBvcnQgdHlwZSB7IENvbGxlY3Rpb25TdWJzY3JpcHRpb24gfSBmcm9tIFwiLi9hcmFuZ28tY29sbGVjdGlvblwiO1xuaW1wb3J0IHsgQ29sbGVjdGlvbiB9IGZyb20gXCIuL2FyYW5nby1jb2xsZWN0aW9uXCI7XG5pbXBvcnQgdHlwZSB7IFFDb25maWcgfSBmcm9tIFwiLi9jb25maWdcIjtcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuXG50eXBlIENvbnRleHQgPSB7XG4gICAgZGI6IEFyYW5nbyxcbiAgICBjb25maWc6IFFDb25maWcsXG4gICAgc2hhcmVkOiBNYXA8c3RyaW5nLCBhbnk+LFxufVxuXG50eXBlIEluZm8gPSB7XG4gICAgdmVyc2lvbjogc3RyaW5nLFxufVxuXG50eXBlIFN1YnNjcmlwdGlvblN0YXQgPSB7XG4gICAgZmlsdGVyOiBzdHJpbmcsXG4gICAgcXVldWVTaXplOiBudW1iZXIsXG59XG5cbnR5cGUgQ29sbGVjdGlvblN0YXQgPSB7XG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHN1YnNjcmlwdGlvbkNvdW50OiBudW1iZXIsXG4gICAgd2FpdEZvckNvdW50OiBudW1iZXIsXG4gICAgc3Vic2NyaXB0aW9uczogU3Vic2NyaXB0aW9uU3RhdFtdLFxufVxuXG50eXBlIFN0YXQgPSB7XG4gICAgY29sbGVjdGlvbnM6IENvbGxlY3Rpb25TdGF0W11cbn1cblxudHlwZSBDb2xsZWN0aW9uU3VtbWFyeSA9IHtcbiAgICBjb2xsZWN0aW9uOiBzdHJpbmcsXG4gICAgY291bnQ6IG51bWJlcixcbiAgICBpbmRleGVzOiBzdHJpbmdbXSxcbn1cblxuLy8gUXVlcnlcblxuZnVuY3Rpb24gaW5mbygpOiBJbmZvIHtcbiAgICBjb25zdCBwa2cgPSBKU09OLnBhcnNlKChmcy5yZWFkRmlsZVN5bmMocGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4uJywgJy4uJywgJ3BhY2thZ2UuanNvbicpKTogYW55KSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdmVyc2lvbjogcGtnLnZlcnNpb24sXG4gICAgfTtcbn1cblxuZnVuY3Rpb24gc3RhdChfcGFyZW50OiBhbnksIF9hcmdzOiBhbnksIGNvbnRleHQ6IENvbnRleHQpOiBTdGF0IHtcbiAgICBjb25zdCBzdWJzY3JpcHRpb25Ub1N0YXQgPSAoc3Vic2NyaXB0aW9uOiBDb2xsZWN0aW9uU3Vic2NyaXB0aW9uKTogU3Vic2NyaXB0aW9uU3RhdCA9PiB7XG4gICAgICAgIGNvbnN0IGl0ZXIgPSBzdWJzY3JpcHRpb24uaXRlcjtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGZpbHRlcjogSlNPTi5zdHJpbmdpZnkoc3Vic2NyaXB0aW9uLmZpbHRlciksXG4gICAgICAgICAgICBxdWV1ZVNpemU6IGl0ZXIucHVzaFF1ZXVlLmxlbmd0aCArIGl0ZXIucHVsbFF1ZXVlLmxlbmd0aCxcbiAgICAgICAgfTtcbiAgICB9O1xuICAgIGNvbnN0IGRiOiBBcmFuZ28gPSBjb250ZXh0LmRiO1xuICAgIHJldHVybiB7XG4gICAgICAgIGNvbGxlY3Rpb25zOiBkYi5jb2xsZWN0aW9ucy5tYXAoKGNvbGxlY3Rpb246IENvbGxlY3Rpb24pID0+IHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgbmFtZTogY29sbGVjdGlvbi5uYW1lLFxuICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbkNvdW50OiBjb2xsZWN0aW9uLnN1YnNjcmlwdGlvbnMuaXRlbXMuc2l6ZSxcbiAgICAgICAgICAgICAgICB3YWl0Rm9yQ291bnQ6IGNvbGxlY3Rpb24ud2FpdEZvci5pdGVtcy5zaXplLFxuICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbnM6IFsuLi5jb2xsZWN0aW9uLnN1YnNjcmlwdGlvbnMudmFsdWVzKCldLm1hcChzdWJzY3JpcHRpb25Ub1N0YXQpLFxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH1cbn1cblxuZnVuY3Rpb24gZ2V0Q2hhbmdlTG9nKF9wYXJlbnQ6IGFueSwgYXJnczogeyBpZDogc3RyaW5nIH0sIGNvbnRleHQ6IENvbnRleHQpOiBudW1iZXJbXSB7XG4gICAgcmV0dXJuIGNvbnRleHQuZGIuY2hhbmdlTG9nLmdldChhcmdzLmlkKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZ2V0Q29sbGVjdGlvbnMoX3BhcmVudDogYW55LCBfYXJnczogYW55LCBjb250ZXh0OiBDb250ZXh0KTogUHJvbWlzZTxDb2xsZWN0aW9uU3VtbWFyeVtdPiB7XG4gICAgY29uc3QgZGI6IEFyYW5nbyA9IGNvbnRleHQuZGI7XG4gICAgY29uc3QgY29sbGVjdGlvbnM6IENvbGxlY3Rpb25TdW1tYXJ5W10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IGNvbGxlY3Rpb24gb2YgZGIuY29sbGVjdGlvbnMpIHtcbiAgICAgICAgY29uc3QgaW5kZXhlczogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgY29uc3QgZGJDb2xsZWN0aW9uID0gY29sbGVjdGlvbi5kYkNvbGxlY3Rpb24oKTtcbiAgICAgICAgZm9yIChjb25zdCBpbmRleCBvZiBhd2FpdCBkYkNvbGxlY3Rpb24uaW5kZXhlcygpKSB7XG4gICAgICAgICAgICBpbmRleGVzLnB1c2goaW5kZXguZmllbGRzLmpvaW4oJywgJykpO1xuICAgICAgICB9XG4gICAgICAgIGNvbGxlY3Rpb25zLnB1c2goe1xuICAgICAgICAgICAgY29sbGVjdGlvbjogY29sbGVjdGlvbi5uYW1lLFxuICAgICAgICAgICAgY291bnQ6IChhd2FpdCBkYkNvbGxlY3Rpb24uY291bnQoKSkuY291bnQsXG4gICAgICAgICAgICBpbmRleGVzLFxuICAgICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbGxlY3Rpb25zO1xufVxuXG4vLyBNdXRhdGlvblxuXG5mdW5jdGlvbiBzZXRDaGFuZ2VMb2coX3BhcmVudDogYW55LCBhcmdzOiB7IG9wOiBzdHJpbmcgfSwgY29udGV4dDogQ29udGV4dCk6IG51bWJlciB7XG4gICAgaWYgKGFyZ3Mub3AgPT09ICdDTEVBUicpIHtcbiAgICAgICAgY29udGV4dC5kYi5jaGFuZ2VMb2cuY2xlYXIoKTtcbiAgICB9IGVsc2UgaWYgKGFyZ3Mub3AgPT09ICdPTicpIHtcbiAgICAgICAgY29udGV4dC5kYi5jaGFuZ2VMb2cuZW5hYmxlZCA9IHRydWU7XG4gICAgfSBlbHNlIGlmIChhcmdzLm9wID09PSAnT0ZGJykge1xuICAgICAgICBjb250ZXh0LmRiLmNoYW5nZUxvZy5lbmFibGVkID0gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiAxO1xufVxuXG5leHBvcnQgY29uc3QgcmVzb2x2ZXJzTWFtID0ge1xuICAgIFF1ZXJ5OiB7XG4gICAgICAgIGluZm8sXG4gICAgICAgIGdldENoYW5nZUxvZyxcbiAgICAgICAgZ2V0Q29sbGVjdGlvbnMsXG4gICAgICAgIHN0YXRcbiAgICB9LFxuICAgIE11dGF0aW9uOiB7XG4gICAgICAgIHNldENoYW5nZUxvZyxcbiAgICB9LFxufTtcbiJdfQ==