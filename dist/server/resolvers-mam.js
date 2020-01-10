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

function selectionToString(selection) {
  return selection.filter(function (x) {
    return x.name !== '__typename';
  }).map(function (field) {
    var fieldSelection = selectionToString(field.selection);
    return "".concat(field.name).concat(fieldSelection !== '' ? " { ".concat(fieldSelection, " }") : '');
  }).join(' ');
}

function stat(_parent, _args, context) {
  var listenerToStat = function listenerToStat(listener) {
    return {
      filter: JSON.stringify(listener.filter),
      selection: selectionToString(listener.selection),
      queueSize: 0,
      eventCount: listener.getEventCount(),
      secondsActive: (Date.now() - listener.startTime) / 1000
    };
  };

  var isSubscription = function isSubscription(listener) {
    return listener instanceof _arangoCollection.SubscriptionListener;
  };

  var db = context.db;
  return {
    collections: db.collections.map(function (collection) {
      var listeners = (0, _toConsumableArray2["default"])(collection.listeners.values());
      var waitFor = listeners.filter(function (x) {
        return !isSubscription(x);
      });
      var subscriptions = listeners.filter(isSubscription);
      return {
        name: collection.name,
        subscriptionCount: subscriptions.length,
        waitForCount: waitFor.length,
        maxQueueSize: collection.maxQueueSize,
        subscriptions: subscriptions.map(listenerToStat),
        waitFor: waitFor.map(listenerToStat)
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9yZXNvbHZlcnMtbWFtLmpzIl0sIm5hbWVzIjpbImluZm8iLCJwa2ciLCJKU09OIiwicGFyc2UiLCJmcyIsInJlYWRGaWxlU3luYyIsInBhdGgiLCJyZXNvbHZlIiwiX19kaXJuYW1lIiwidmVyc2lvbiIsInNlbGVjdGlvblRvU3RyaW5nIiwic2VsZWN0aW9uIiwiZmlsdGVyIiwieCIsIm5hbWUiLCJtYXAiLCJmaWVsZCIsImZpZWxkU2VsZWN0aW9uIiwiam9pbiIsInN0YXQiLCJfcGFyZW50IiwiX2FyZ3MiLCJjb250ZXh0IiwibGlzdGVuZXJUb1N0YXQiLCJsaXN0ZW5lciIsInN0cmluZ2lmeSIsInF1ZXVlU2l6ZSIsImV2ZW50Q291bnQiLCJnZXRFdmVudENvdW50Iiwic2Vjb25kc0FjdGl2ZSIsIkRhdGUiLCJub3ciLCJzdGFydFRpbWUiLCJpc1N1YnNjcmlwdGlvbiIsIlN1YnNjcmlwdGlvbkxpc3RlbmVyIiwiZGIiLCJjb2xsZWN0aW9ucyIsImNvbGxlY3Rpb24iLCJsaXN0ZW5lcnMiLCJ2YWx1ZXMiLCJ3YWl0Rm9yIiwic3Vic2NyaXB0aW9ucyIsInN1YnNjcmlwdGlvbkNvdW50IiwibGVuZ3RoIiwid2FpdEZvckNvdW50IiwibWF4UXVldWVTaXplIiwiZ2V0Q2hhbmdlTG9nIiwiYXJncyIsImNoYW5nZUxvZyIsImdldCIsImlkIiwiZ2V0Q29sbGVjdGlvbnMiLCJpbmRleGVzIiwiZGJDb2xsZWN0aW9uIiwiaW5kZXgiLCJwdXNoIiwiZmllbGRzIiwiY291bnQiLCJzZXRDaGFuZ2VMb2ciLCJvcCIsImNsZWFyIiwiZW5hYmxlZCIsInJlc29sdmVyc01hbSIsIlF1ZXJ5IiwiTXV0YXRpb24iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUVBOztBQUNBOztBQUVBOztBQUVBOztBQXVDQTtBQUVBLFNBQVNBLElBQVQsR0FBc0I7QUFDbEIsTUFBTUMsR0FBRyxHQUFHQyxJQUFJLENBQUNDLEtBQUwsQ0FBWUMsZUFBR0Ms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O0FBRE07QUFQYyxDQUFyQiIsInNvdXJjZXNDb250ZW50IjpbIi8vIEBmbG93XG5cbmltcG9ydCBmcyBmcm9tIFwiZnNcIjtcbmltcG9ydCBBcmFuZ28gZnJvbSBcIi4vYXJhbmdvXCI7XG5pbXBvcnQgdHlwZSB7IEZpZWxkU2VsZWN0aW9uIH0gZnJvbSBcIi4vYXJhbmdvLWNvbGxlY3Rpb25cIjtcbmltcG9ydCB7IENvbGxlY3Rpb24sIENvbGxlY3Rpb25MaXN0ZW5lciwgU3Vic2NyaXB0aW9uTGlzdGVuZXIgfSBmcm9tIFwiLi9hcmFuZ28tY29sbGVjdGlvblwiO1xuaW1wb3J0IHR5cGUgeyBRQ29uZmlnIH0gZnJvbSBcIi4vY29uZmlnXCI7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcblxudHlwZSBDb250ZXh0ID0ge1xuICAgIGRiOiBBcmFuZ28sXG4gICAgY29uZmlnOiBRQ29uZmlnLFxuICAgIHNoYXJlZDogTWFwPHN0cmluZywgYW55Pixcbn1cblxudHlwZSBJbmZvID0ge1xuICAgIHZlcnNpb246IHN0cmluZyxcbn1cblxudHlwZSBMaXN0ZW5lclN0YXQgPSB7XG4gICAgZmlsdGVyOiBzdHJpbmcsXG4gICAgc2VsZWN0aW9uOiBzdHJpbmcsXG4gICAgcXVldWVTaXplOiBudW1iZXIsXG4gICAgZXZlbnRDb3VudDogbnVtYmVyLFxuICAgIHNlY29uZHNBY3RpdmU6IG51bWJlcixcbn1cblxudHlwZSBDb2xsZWN0aW9uU3RhdCA9IHtcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgc3Vic2NyaXB0aW9uQ291bnQ6IG51bWJlcixcbiAgICB3YWl0Rm9yQ291bnQ6IG51bWJlcixcbiAgICBtYXhRdWV1ZVNpemU6IG51bWJlcixcbiAgICBzdWJzY3JpcHRpb25zOiBMaXN0ZW5lclN0YXRbXSxcbiAgICB3YWl0Rm9yOiBMaXN0ZW5lclN0YXRbXSxcbn1cblxudHlwZSBTdGF0ID0ge1xuICAgIGNvbGxlY3Rpb25zOiBDb2xsZWN0aW9uU3RhdFtdXG59XG5cbnR5cGUgQ29sbGVjdGlvblN1bW1hcnkgPSB7XG4gICAgY29sbGVjdGlvbjogc3RyaW5nLFxuICAgIGNvdW50OiBudW1iZXIsXG4gICAgaW5kZXhlczogc3RyaW5nW10sXG59XG5cbi8vIFF1ZXJ5XG5cbmZ1bmN0aW9uIGluZm8oKTogSW5mbyB7XG4gICAgY29uc3QgcGtnID0gSlNPTi5wYXJzZSgoZnMucmVhZEZpbGVTeW5jKHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuLicsICcuLicsICdwYWNrYWdlLmpzb24nKSk6IGFueSkpO1xuICAgIHJldHVybiB7XG4gICAgICAgIHZlcnNpb246IHBrZy52ZXJzaW9uLFxuICAgIH07XG59XG5cbmZ1bmN0aW9uIHNlbGVjdGlvblRvU3RyaW5nKHNlbGVjdGlvbjogRmllbGRTZWxlY3Rpb25bXSk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHNlbGVjdGlvblxuICAgICAgICAuZmlsdGVyKHggPT4geC5uYW1lICE9PSAnX190eXBlbmFtZScpXG4gICAgICAgIC5tYXAoKGZpZWxkOiBGaWVsZFNlbGVjdGlvbikgPT4ge1xuICAgICAgICAgICAgY29uc3QgZmllbGRTZWxlY3Rpb24gPSBzZWxlY3Rpb25Ub1N0cmluZyhmaWVsZC5zZWxlY3Rpb24pO1xuICAgICAgICAgICAgcmV0dXJuIGAke2ZpZWxkLm5hbWV9JHtmaWVsZFNlbGVjdGlvbiAhPT0gJycgPyBgIHsgJHtmaWVsZFNlbGVjdGlvbn0gfWAgOiAnJ31gO1xuICAgICAgICB9KS5qb2luKCcgJyk7XG59XG5cbmZ1bmN0aW9uIHN0YXQoX3BhcmVudDogYW55LCBfYXJnczogYW55LCBjb250ZXh0OiBDb250ZXh0KTogU3RhdCB7XG4gICAgY29uc3QgbGlzdGVuZXJUb1N0YXQgPSAobGlzdGVuZXI6IENvbGxlY3Rpb25MaXN0ZW5lcik6IExpc3RlbmVyU3RhdCA9PiB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBmaWx0ZXI6IEpTT04uc3RyaW5naWZ5KGxpc3RlbmVyLmZpbHRlciksXG4gICAgICAgICAgICBzZWxlY3Rpb246IHNlbGVjdGlvblRvU3RyaW5nKGxpc3RlbmVyLnNlbGVjdGlvbiksXG4gICAgICAgICAgICBxdWV1ZVNpemU6IDAsXG4gICAgICAgICAgICBldmVudENvdW50OiBsaXN0ZW5lci5nZXRFdmVudENvdW50KCksXG4gICAgICAgICAgICBzZWNvbmRzQWN0aXZlOiAoRGF0ZS5ub3coKSAtIGxpc3RlbmVyLnN0YXJ0VGltZSkgLyAxMDAwLFxuICAgICAgICB9O1xuICAgIH07XG4gICAgY29uc3QgaXNTdWJzY3JpcHRpb24gPSAobGlzdGVuZXI6IENvbGxlY3Rpb25MaXN0ZW5lcik6IGJvb2wgPT4ge1xuICAgICAgICByZXR1cm4gbGlzdGVuZXIgaW5zdGFuY2VvZiBTdWJzY3JpcHRpb25MaXN0ZW5lcjtcbiAgICB9O1xuICAgIGNvbnN0IGRiOiBBcmFuZ28gPSBjb250ZXh0LmRiO1xuICAgIHJldHVybiB7XG4gICAgICAgIGNvbGxlY3Rpb25zOiBkYi5jb2xsZWN0aW9ucy5tYXAoKGNvbGxlY3Rpb246IENvbGxlY3Rpb24pID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGxpc3RlbmVycyA9IFsuLi5jb2xsZWN0aW9uLmxpc3RlbmVycy52YWx1ZXMoKV07XG4gICAgICAgICAgICBjb25zdCB3YWl0Rm9yID0gbGlzdGVuZXJzLmZpbHRlcih4ID0+ICFpc1N1YnNjcmlwdGlvbih4KSk7XG4gICAgICAgICAgICBjb25zdCBzdWJzY3JpcHRpb25zID0gbGlzdGVuZXJzLmZpbHRlcihpc1N1YnNjcmlwdGlvbik7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIG5hbWU6IGNvbGxlY3Rpb24ubmFtZSxcbiAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb25Db3VudDogc3Vic2NyaXB0aW9ucy5sZW5ndGgsXG4gICAgICAgICAgICAgICAgd2FpdEZvckNvdW50OiB3YWl0Rm9yLmxlbmd0aCxcbiAgICAgICAgICAgICAgICBtYXhRdWV1ZVNpemU6IGNvbGxlY3Rpb24ubWF4UXVldWVTaXplLFxuICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbnM6IHN1YnNjcmlwdGlvbnMubWFwKGxpc3RlbmVyVG9TdGF0KSxcbiAgICAgICAgICAgICAgICB3YWl0Rm9yOiB3YWl0Rm9yLm1hcChsaXN0ZW5lclRvU3RhdCksXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfVxufVxuXG5mdW5jdGlvbiBnZXRDaGFuZ2VMb2coX3BhcmVudDogYW55LCBhcmdzOiB7IGlkOiBzdHJpbmcgfSwgY29udGV4dDogQ29udGV4dCk6IG51bWJlcltdIHtcbiAgICByZXR1cm4gY29udGV4dC5kYi5jaGFuZ2VMb2cuZ2V0KGFyZ3MuaWQpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBnZXRDb2xsZWN0aW9ucyhfcGFyZW50OiBhbnksIF9hcmdzOiBhbnksIGNvbnRleHQ6IENvbnRleHQpOiBQcm9taXNlPENvbGxlY3Rpb25TdW1tYXJ5W10+IHtcbiAgICBjb25zdCBkYjogQXJhbmdvID0gY29udGV4dC5kYjtcbiAgICBjb25zdCBjb2xsZWN0aW9uczogQ29sbGVjdGlvblN1bW1hcnlbXSA9IFtdO1xuICAgIGZvciAoY29uc3QgY29sbGVjdGlvbiBvZiBkYi5jb2xsZWN0aW9ucykge1xuICAgICAgICBjb25zdCBpbmRleGVzOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICBjb25zdCBkYkNvbGxlY3Rpb24gPSBjb2xsZWN0aW9uLmRiQ29sbGVjdGlvbigpO1xuICAgICAgICBmb3IgKGNvbnN0IGluZGV4IG9mIGF3YWl0IGRiQ29sbGVjdGlvbi5pbmRleGVzKCkpIHtcbiAgICAgICAgICAgIGluZGV4ZXMucHVzaChpbmRleC5maWVsZHMuam9pbignLCAnKSk7XG4gICAgICAgIH1cbiAgICAgICAgY29sbGVjdGlvbnMucHVzaCh7XG4gICAgICAgICAgICBjb2xsZWN0aW9uOiBjb2xsZWN0aW9uLm5hbWUsXG4gICAgICAgICAgICBjb3VudDogKGF3YWl0IGRiQ29sbGVjdGlvbi5jb3VudCgpKS5jb3VudCxcbiAgICAgICAgICAgIGluZGV4ZXMsXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gY29sbGVjdGlvbnM7XG59XG5cbi8vIE11dGF0aW9uXG5cbmZ1bmN0aW9uIHNldENoYW5nZUxvZyhfcGFyZW50OiBhbnksIGFyZ3M6IHsgb3A6IHN0cmluZyB9LCBjb250ZXh0OiBDb250ZXh0KTogbnVtYmVyIHtcbiAgICBpZiAoYXJncy5vcCA9PT0gJ0NMRUFSJykge1xuICAgICAgICBjb250ZXh0LmRiLmNoYW5nZUxvZy5jbGVhcigpO1xuICAgIH0gZWxzZSBpZiAoYXJncy5vcCA9PT0gJ09OJykge1xuICAgICAgICBjb250ZXh0LmRiLmNoYW5nZUxvZy5lbmFibGVkID0gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKGFyZ3Mub3AgPT09ICdPRkYnKSB7XG4gICAgICAgIGNvbnRleHQuZGIuY2hhbmdlTG9nLmVuYWJsZWQgPSBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIDE7XG59XG5cbmV4cG9ydCBjb25zdCByZXNvbHZlcnNNYW0gPSB7XG4gICAgUXVlcnk6IHtcbiAgICAgICAgaW5mbyxcbiAgICAgICAgZ2V0Q2hhbmdlTG9nLFxuICAgICAgICBnZXRDb2xsZWN0aW9ucyxcbiAgICAgICAgc3RhdFxuICAgIH0sXG4gICAgTXV0YXRpb246IHtcbiAgICAgICAgc2V0Q2hhbmdlTG9nLFxuICAgIH0sXG59O1xuIl19