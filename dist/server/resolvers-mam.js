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
    var span, db, collections, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, _collection, _indexes, _dbCollection, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, _index;

    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return context.db.tracer.startSpanLog(context, "resolvers-mam.js:getCollections", 'new getCollections query', _args);

          case 2:
            span = _context.sent;
            db = context.db;
            collections = [];
            _iteratorNormalCompletion = true;
            _didIteratorError = false;
            _iteratorError = undefined;
            _context.prev = 8;
            _iterator = db.collections[Symbol.iterator]();

          case 10:
            if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
              _context.next = 53;
              break;
            }

            _collection = _step.value;
            _indexes = [];
            _dbCollection = _collection.dbCollection();
            _iteratorNormalCompletion2 = true;
            _didIteratorError2 = false;
            _iteratorError2 = undefined;
            _context.prev = 17;
            _context.next = 20;
            return _dbCollection.indexes();

          case 20:
            _context.t0 = Symbol.iterator;
            _iterator2 = _context.sent[_context.t0]();

          case 22:
            if (_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) {
              _context.next = 28;
              break;
            }

            _index = _step2.value;

            _indexes.push(_index.fields.join(', '));

          case 25:
            _iteratorNormalCompletion2 = true;
            _context.next = 22;
            break;

          case 28:
            _context.next = 34;
            break;

          case 30:
            _context.prev = 30;
            _context.t1 = _context["catch"](17);
            _didIteratorError2 = true;
            _iteratorError2 = _context.t1;

          case 34:
            _context.prev = 34;
            _context.prev = 35;

            if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
              _iterator2["return"]();
            }

          case 37:
            _context.prev = 37;

            if (!_didIteratorError2) {
              _context.next = 40;
              break;
            }

            throw _iteratorError2;

          case 40:
            return _context.finish(37);

          case 41:
            return _context.finish(34);

          case 42:
            _context.t2 = collections;
            _context.t3 = _collection.name;
            _context.next = 46;
            return _dbCollection.count();

          case 46:
            _context.t4 = _context.sent.count;
            _context.t5 = _indexes;
            _context.t6 = {
              collection: _context.t3,
              count: _context.t4,
              indexes: _context.t5
            };

            _context.t2.push.call(_context.t2, _context.t6);

          case 50:
            _iteratorNormalCompletion = true;
            _context.next = 10;
            break;

          case 53:
            _context.next = 59;
            break;

          case 55:
            _context.prev = 55;
            _context.t7 = _context["catch"](8);
            _didIteratorError = true;
            _iteratorError = _context.t7;

          case 59:
            _context.prev = 59;
            _context.prev = 60;

            if (!_iteratorNormalCompletion && _iterator["return"] != null) {
              _iterator["return"]();
            }

          case 62:
            _context.prev = 62;

            if (!_didIteratorError) {
              _context.next = 65;
              break;
            }

            throw _iteratorError;

          case 65:
            return _context.finish(62);

          case 66:
            return _context.finish(59);

          case 67:
            _context.next = 69;
            return span.finish();

          case 69:
            return _context.abrupt("return", collections);

          case 70:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[8, 55, 59, 67], [17, 30, 34, 42], [35,, 37, 41], [60,, 62, 66]]);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9yZXNvbHZlcnMtbWFtLmpzIl0sIm5hbWVzIjpbImluZm8iLCJwa2ciLCJKU09OIiwicGFyc2UiLCJmcyIsInJlYWRGaWxlU3luYyIsInBhdGgiLCJyZXNvbHZlIiwiX19kaXJuYW1lIiwidmVyc2lvbiIsInNlbGVjdGlvblRvU3RyaW5nIiwic2VsZWN0aW9uIiwiZmlsdGVyIiwieCIsIm5hbWUiLCJtYXAiLCJmaWVsZCIsImZpZWxkU2VsZWN0aW9uIiwiam9pbiIsInN0YXQiLCJfcGFyZW50IiwiX2FyZ3MiLCJjb250ZXh0IiwibGlzdGVuZXJUb1N0YXQiLCJsaXN0ZW5lciIsInN0cmluZ2lmeSIsInF1ZXVlU2l6ZSIsImV2ZW50Q291bnQiLCJnZXRFdmVudENvdW50Iiwic2Vjb25kc0FjdGl2ZSIsIkRhdGUiLCJub3ciLCJzdGFydFRpbWUiLCJpc1N1YnNjcmlwdGlvbiIsIlN1YnNjcmlwdGlvbkxpc3RlbmVyIiwiZGIiLCJjb2xsZWN0aW9ucyIsImNvbGxlY3Rpb24iLCJsaXN0ZW5lcnMiLCJ2YWx1ZXMiLCJ3YWl0Rm9yIiwic3Vic2NyaXB0aW9ucyIsInN1YnNjcmlwdGlvbkNvdW50IiwibGVuZ3RoIiwid2FpdEZvckNvdW50IiwibWF4UXVldWVTaXplIiwiZ2V0Q2hhbmdlTG9nIiwiYXJncyIsImNoYW5nZUxvZyIsImdldCIsImlkIiwiZ2V0Q29sbGVjdGlvbnMiLCJ0cmFjZXIiLCJzdGFydFNwYW5Mb2ciLCJzcGFuIiwiaW5kZXhlcyIsImRiQ29sbGVjdGlvbiIsImluZGV4IiwicHVzaCIsImZpZWxkcyIsImNvdW50IiwiZmluaXNoIiwic2V0Q2hhbmdlTG9nIiwib3AiLCJjbGVhciIsImVuYWJsZWQiLCJyZXNvbHZlcnNNYW0iLCJRdWVyeSIsIk11dGF0aW9uIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFFQTs7QUFDQTs7QUFFQTs7QUFFQTs7QUF1Q0E7QUFFQSxTQUFTQSxJQUFULEdBQXNCO0FBQ2xCLE1BQU1D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QUNIOztBQUNELFNBQU8sQ0FBUDtBQUNIOztBQUVNLElBQU1DLFlBQVksR0FBRztBQUN4QkMsRUFBQUEsS0FBSyxFQUFFO0FBQ0huRSxJQUFBQSxJQUFJLEVBQUpBLElBREc7QUFFSDhDLElBQUFBLFlBQVksRUFBWkEsWUFGRztBQUdISyxJQUFBQSxjQUFjLEVBQWRBLGNBSEc7QUFJSGhDLElBQUFBLElBQUksRUFBSkE7QUFKRyxHQURpQjtBQU94QmlELEVBQUFBLFFBQVEsRUFBRTtBQUNOTixJQUFBQSxZQUFZLEVBQVpBO0FBRE07QUFQYyxDQUFyQiIsInNvdXJjZXNDb250ZW50IjpbIi8vIEBmbG93XG5cbmltcG9ydCBmcyBmcm9tIFwiZnNcIjtcbmltcG9ydCBBcmFuZ28gZnJvbSBcIi4vYXJhbmdvXCI7XG5pbXBvcnQgdHlwZSB7IEZpZWxkU2VsZWN0aW9uIH0gZnJvbSBcIi4vYXJhbmdvLWNvbGxlY3Rpb25cIjtcbmltcG9ydCB7IENvbGxlY3Rpb24sIENvbGxlY3Rpb25MaXN0ZW5lciwgU3Vic2NyaXB0aW9uTGlzdGVuZXIgfSBmcm9tIFwiLi9hcmFuZ28tY29sbGVjdGlvblwiO1xuaW1wb3J0IHR5cGUgeyBRQ29uZmlnIH0gZnJvbSBcIi4vY29uZmlnXCI7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcblxudHlwZSBDb250ZXh0ID0ge1xuICAgIGRiOiBBcmFuZ28sXG4gICAgY29uZmlnOiBRQ29uZmlnLFxuICAgIHNoYXJlZDogTWFwPHN0cmluZywgYW55Pixcbn1cblxudHlwZSBJbmZvID0ge1xuICAgIHZlcnNpb246IHN0cmluZyxcbn1cblxudHlwZSBMaXN0ZW5lclN0YXQgPSB7XG4gICAgZmlsdGVyOiBzdHJpbmcsXG4gICAgc2VsZWN0aW9uOiBzdHJpbmcsXG4gICAgcXVldWVTaXplOiBudW1iZXIsXG4gICAgZXZlbnRDb3VudDogbnVtYmVyLFxuICAgIHNlY29uZHNBY3RpdmU6IG51bWJlcixcbn1cblxudHlwZSBDb2xsZWN0aW9uU3RhdCA9IHtcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgc3Vic2NyaXB0aW9uQ291bnQ6IG51bWJlcixcbiAgICB3YWl0Rm9yQ291bnQ6IG51bWJlcixcbiAgICBtYXhRdWV1ZVNpemU6IG51bWJlcixcbiAgICBzdWJzY3JpcHRpb25zOiBMaXN0ZW5lclN0YXRbXSxcbiAgICB3YWl0Rm9yOiBMaXN0ZW5lclN0YXRbXSxcbn1cblxudHlwZSBTdGF0ID0ge1xuICAgIGNvbGxlY3Rpb25zOiBDb2xsZWN0aW9uU3RhdFtdXG59XG5cbnR5cGUgQ29sbGVjdGlvblN1bW1hcnkgPSB7XG4gICAgY29sbGVjdGlvbjogc3RyaW5nLFxuICAgIGNvdW50OiBudW1iZXIsXG4gICAgaW5kZXhlczogc3RyaW5nW10sXG59XG5cbi8vIFF1ZXJ5XG5cbmZ1bmN0aW9uIGluZm8oKTogSW5mbyB7XG4gICAgY29uc3QgcGtnID0gSlNPTi5wYXJzZSgoZnMucmVhZEZpbGVTeW5jKHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuLicsICcuLicsICdwYWNrYWdlLmpzb24nKSk6IGFueSkpO1xuICAgIHJldHVybiB7XG4gICAgICAgIHZlcnNpb246IHBrZy52ZXJzaW9uLFxuICAgIH07XG59XG5cbmZ1bmN0aW9uIHNlbGVjdGlvblRvU3RyaW5nKHNlbGVjdGlvbjogRmllbGRTZWxlY3Rpb25bXSk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHNlbGVjdGlvblxuICAgICAgICAuZmlsdGVyKHggPT4geC5uYW1lICE9PSAnX190eXBlbmFtZScpXG4gICAgICAgIC5tYXAoKGZpZWxkOiBGaWVsZFNlbGVjdGlvbikgPT4ge1xuICAgICAgICAgICAgY29uc3QgZmllbGRTZWxlY3Rpb24gPSBzZWxlY3Rpb25Ub1N0cmluZyhmaWVsZC5zZWxlY3Rpb24pO1xuICAgICAgICAgICAgcmV0dXJuIGAke2ZpZWxkLm5hbWV9JHtmaWVsZFNlbGVjdGlvbiAhPT0gJycgPyBgIHsgJHtmaWVsZFNlbGVjdGlvbn0gfWAgOiAnJ31gO1xuICAgICAgICB9KS5qb2luKCcgJyk7XG59XG5cbmZ1bmN0aW9uIHN0YXQoX3BhcmVudDogYW55LCBfYXJnczogYW55LCBjb250ZXh0OiBDb250ZXh0KTogU3RhdCB7XG4gICAgY29uc3QgbGlzdGVuZXJUb1N0YXQgPSAobGlzdGVuZXI6IENvbGxlY3Rpb25MaXN0ZW5lciApOiBMaXN0ZW5lclN0YXQgPT4ge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZmlsdGVyOiBKU09OLnN0cmluZ2lmeShsaXN0ZW5lci5maWx0ZXIpLFxuICAgICAgICAgICAgc2VsZWN0aW9uOiBzZWxlY3Rpb25Ub1N0cmluZyhsaXN0ZW5lci5zZWxlY3Rpb24pLFxuICAgICAgICAgICAgcXVldWVTaXplOiAwLFxuICAgICAgICAgICAgZXZlbnRDb3VudDogbGlzdGVuZXIuZ2V0RXZlbnRDb3VudCgpLFxuICAgICAgICAgICAgc2Vjb25kc0FjdGl2ZTogKERhdGUubm93KCkgLSBsaXN0ZW5lci5zdGFydFRpbWUpIC8gMTAwMCxcbiAgICAgICAgfTtcbiAgICB9O1xuICAgIGNvbnN0IGlzU3Vic2NyaXB0aW9uID0gKGxpc3RlbmVyOiBDb2xsZWN0aW9uTGlzdGVuZXIpOiBib29sID0+IHtcbiAgICAgICAgcmV0dXJuIGxpc3RlbmVyIGluc3RhbmNlb2YgU3Vic2NyaXB0aW9uTGlzdGVuZXI7XG4gICAgfTtcbiAgICBjb25zdCBkYjogQXJhbmdvID0gY29udGV4dC5kYjtcbiAgICByZXR1cm4ge1xuICAgICAgICBjb2xsZWN0aW9uczogZGIuY29sbGVjdGlvbnMubWFwKChjb2xsZWN0aW9uOiBDb2xsZWN0aW9uKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBsaXN0ZW5lcnMgPSBbLi4uY29sbGVjdGlvbi5saXN0ZW5lcnMudmFsdWVzKCldO1xuICAgICAgICAgICAgY29uc3Qgd2FpdEZvciA9IGxpc3RlbmVycy5maWx0ZXIoeCA9PiAhaXNTdWJzY3JpcHRpb24oeCkpO1xuICAgICAgICAgICAgY29uc3Qgc3Vic2NyaXB0aW9ucyA9IGxpc3RlbmVycy5maWx0ZXIoaXNTdWJzY3JpcHRpb24pO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBuYW1lOiBjb2xsZWN0aW9uLm5hbWUsXG4gICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uQ291bnQ6IHN1YnNjcmlwdGlvbnMubGVuZ3RoLFxuICAgICAgICAgICAgICAgIHdhaXRGb3JDb3VudDogd2FpdEZvci5sZW5ndGgsXG4gICAgICAgICAgICAgICAgbWF4UXVldWVTaXplOiBjb2xsZWN0aW9uLm1heFF1ZXVlU2l6ZSxcbiAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb25zOiBzdWJzY3JpcHRpb25zLm1hcChsaXN0ZW5lclRvU3RhdCksXG4gICAgICAgICAgICAgICAgd2FpdEZvcjogd2FpdEZvci5tYXAobGlzdGVuZXJUb1N0YXQpLFxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH07XG59XG5cbmZ1bmN0aW9uIGdldENoYW5nZUxvZyhfcGFyZW50OiBhbnksIGFyZ3M6IHsgaWQ6IHN0cmluZyB9LCBjb250ZXh0OiBDb250ZXh0KTogbnVtYmVyW10ge1xuICAgIHJldHVybiBjb250ZXh0LmRiLmNoYW5nZUxvZy5nZXQoYXJncy5pZCk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGdldENvbGxlY3Rpb25zKF9wYXJlbnQ6IGFueSwgX2FyZ3M6IGFueSwgY29udGV4dDogQ29udGV4dCk6IFByb21pc2U8Q29sbGVjdGlvblN1bW1hcnlbXT4ge1xuICAgIGNvbnN0IHNwYW4gPSBhd2FpdCBjb250ZXh0LmRiLnRyYWNlci5zdGFydFNwYW5Mb2coY29udGV4dCwgXCJyZXNvbHZlcnMtbWFtLmpzOmdldENvbGxlY3Rpb25zXCIsXG4gICAgICAgICduZXcgZ2V0Q29sbGVjdGlvbnMgcXVlcnknLCBfYXJncyk7XG4gICAgY29uc3QgZGI6IEFyYW5nbyA9IGNvbnRleHQuZGI7XG4gICAgY29uc3QgY29sbGVjdGlvbnM6IENvbGxlY3Rpb25TdW1tYXJ5W10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IGNvbGxlY3Rpb24gb2YgZGIuY29sbGVjdGlvbnMpIHtcbiAgICAgICAgY29uc3QgaW5kZXhlczogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgY29uc3QgZGJDb2xsZWN0aW9uID0gY29sbGVjdGlvbi5kYkNvbGxlY3Rpb24oKTtcbiAgICAgICAgZm9yIChjb25zdCBpbmRleCBvZiBhd2FpdCBkYkNvbGxlY3Rpb24uaW5kZXhlcygpKSB7XG4gICAgICAgICAgICBpbmRleGVzLnB1c2goaW5kZXguZmllbGRzLmpvaW4oJywgJykpO1xuICAgICAgICB9XG4gICAgICAgIGNvbGxlY3Rpb25zLnB1c2goe1xuICAgICAgICAgICAgY29sbGVjdGlvbjogY29sbGVjdGlvbi5uYW1lLFxuICAgICAgICAgICAgY291bnQ6IChhd2FpdCBkYkNvbGxlY3Rpb24uY291bnQoKSkuY291bnQsXG4gICAgICAgICAgICBpbmRleGVzLFxuICAgICAgICB9KTtcbiAgICB9XG4gICAgYXdhaXQgc3Bhbi5maW5pc2goKTtcbiAgICByZXR1cm4gY29sbGVjdGlvbnM7XG59XG5cbi8vIE11dGF0aW9uXG5cbmZ1bmN0aW9uIHNldENoYW5nZUxvZyhfcGFyZW50OiBhbnksIGFyZ3M6IHsgb3A6IHN0cmluZyB9LCBjb250ZXh0OiBDb250ZXh0KTogbnVtYmVyIHtcbiAgICBpZiAoYXJncy5vcCA9PT0gJ0NMRUFSJykge1xuICAgICAgICBjb250ZXh0LmRiLmNoYW5nZUxvZy5jbGVhcigpO1xuICAgIH0gZWxzZSBpZiAoYXJncy5vcCA9PT0gJ09OJykge1xuICAgICAgICBjb250ZXh0LmRiLmNoYW5nZUxvZy5lbmFibGVkID0gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKGFyZ3Mub3AgPT09ICdPRkYnKSB7XG4gICAgICAgIGNvbnRleHQuZGIuY2hhbmdlTG9nLmVuYWJsZWQgPSBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIDE7XG59XG5cbmV4cG9ydCBjb25zdCByZXNvbHZlcnNNYW0gPSB7XG4gICAgUXVlcnk6IHtcbiAgICAgICAgaW5mbyxcbiAgICAgICAgZ2V0Q2hhbmdlTG9nLFxuICAgICAgICBnZXRDb2xsZWN0aW9ucyxcbiAgICAgICAgc3RhdFxuICAgIH0sXG4gICAgTXV0YXRpb246IHtcbiAgICAgICAgc2V0Q2hhbmdlTG9nLFxuICAgIH0sXG59O1xuIl19