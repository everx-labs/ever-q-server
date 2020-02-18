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

var _path = _interopRequireDefault(require("path"));

var _arango = _interopRequireDefault(require("./arango"));

var _arangoCollection = require("./arango-collection");

var _arangoListeners = require("./arango-listeners");

var _utils = require("./utils");

// Query
function info() {
  var pkg = JSON.parse(_fs["default"].readFileSync(_path["default"].resolve(__dirname, '..', '..', 'package.json')));
  return {
    version: pkg.version
  };
}

function stat(_parent, _args, context) {
  var listenerToStat = function listenerToStat(listener) {
    return {
      filter: JSON.stringify(listener.filter),
      selection: (0, _utils.selectionToString)(listener.selection),
      queueSize: 0,
      eventCount: listener.getEventCount(),
      secondsActive: (Date.now() - listener.startTime) / 1000
    };
  };

  var isSubscription = function isSubscription(listener) {
    return listener instanceof _arangoListeners.SubscriptionListener;
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

var resolversMam = {
  Query: {
    info: info,
    getCollections: getCollections,
    stat: stat
  },
  Mutation: {}
};
exports.resolversMam = resolversMam;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9yZXNvbHZlcnMtbWFtLmpzIl0sIm5hbWVzIjpbImluZm8iLCJwa2ciLCJKU09OIiwicGFyc2UiLCJmcyIsInJlYWRGaWxlU3luYyIsInBhdGgiLCJyZXNvbHZlIiwiX19kaXJuYW1lIiwidmVyc2lvbiIsInN0YXQiLCJfcGFyZW50IiwiX2FyZ3MiLCJjb250ZXh0IiwibGlzdGVuZXJUb1N0YXQiLCJsaXN0ZW5lciIsImZpbHRlciIsInN0cmluZ2lmeSIsInNlbGVjdGlvbiIsInF1ZXVlU2l6ZSIsImV2ZW50Q291bnQiLCJnZXRFdmVudENvdW50Iiwic2Vjb25kc0FjdGl2ZSIsIkRhdGUiLCJub3ciLCJzdGFydFRpbWUiLCJpc1N1YnNjcmlwdGlvbiIsIlN1YnNjcmlwdGlvbkxpc3RlbmVyIiwiZGIiLCJjb2xsZWN0aW9ucyIsIm1hcCIsImNvbGxlY3Rpb24iLCJsaXN0ZW5lcnMiLCJ2YWx1ZXMiLCJ3YWl0Rm9yIiwieCIsInN1YnNjcmlwdGlvbnMiLCJuYW1lIiwic3Vic2NyaXB0aW9uQ291bnQiLCJsZW5ndGgiLCJ3YWl0Rm9yQ291bnQiLCJtYXhRdWV1ZVNpemUiLCJnZXRDb2xsZWN0aW9ucyIsImluZGV4ZXMiLCJkYkNvbGxlY3Rpb24iLCJpbmRleCIsInB1c2giLCJmaWVsZHMiLCJqb2luIiwiY291bnQiLCJyZXNvbHZlcnNNYW0iLCJRdWVyeSIsIk11dGF0aW9uIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFFQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFFQTs7QUF1Q0E7QUFFQSxTQUFTQSxJQUFULEdBQXNCO0FBQ2xCLE1BQU1DLEdBQUcsR0FBR0MsSUFBSSxDQUFDQyxLQUFMLENBQVlDLGVBQUdDLFlBQUgsQ0FBZ0JDLGlCQUFLQyxPQUFMLENBQWFDLFNBQWIsRUFBd0IsSUFBeEIsRUFBOEIsSUFBOUIsRUFBb0MsY0FBcEMsQ0FBaEIsQ0FBWixDQUFaO0FBQ0EsU0FBTztBQUNIQyxJQUFBQSxPQUFPLEVB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O0FBQUE7QUFBQTtBQUFBOztBQUFBO0FBQUE7QUFBQTs7QUFBQTtBQUFBOztBQUFBO0FBQUE7QUFBQTtBQUFBOztBQUFBOztBQUFBO0FBQUE7O0FBQUE7QUFBQTs7QUFBQTtBQUFBLDBCQVNRbkIsV0FUUjtBQUFBLDBCQVV3QkUsV0FBVSxDQUFDTSxJQVZuQztBQUFBO0FBQUEsbUJBVzBCTyxhQUFZLENBQUNLLEtBQWIsRUFYMUI7O0FBQUE7QUFBQSx3Q0FXZ0RBLEtBWGhEO0FBQUEsMEJBWVlOLFFBWlo7QUFBQTtBQVVZWixjQUFBQSxVQVZaO0FBV1lrQixjQUFBQSxLQVhaO0FBWVlOLGNBQUFBLE9BWlo7QUFBQTs7QUFBQSx3QkFTb0JHLElBVHBCOztBQUFBO0FBQUE7QUFBQTtBQUFBOztBQUFBO0FBQUE7QUFBQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOztBQUFBO0FBQUE7QUFBQTs7QUFBQTtBQUFBO0FBQUE7O0FBQUE7QUFBQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFBQTs7QUFBQTtBQUFBOztBQUFBO0FBQUE7O0FBQUE7QUFBQSw2Q0FlV2pCLFdBZlg7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRzs7OztBQW9CTyxJQUFNcUIsWUFBWSxHQUFHO0FBQ3hCQyxFQUFBQSxLQUFLLEVBQUU7QUFDSG5ELElBQUFBLElBQUksRUFBSkEsSUFERztBQUVIMEMsSUFBQUEsY0FBYyxFQUFkQSxjQUZHO0FBR0hoQyxJQUFBQSxJQUFJLEVBQUpBO0FBSEcsR0FEaUI7QUFNeEIwQyxFQUFBQSxRQUFRLEVBQUU7QUFOYyxDQUFyQiIsInNvdXJjZXNDb250ZW50IjpbIi8vIEBmbG93XG5cbmltcG9ydCBmcyBmcm9tIFwiZnNcIjtcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IEFyYW5nbyBmcm9tIFwiLi9hcmFuZ29cIjtcbmltcG9ydCB7IENvbGxlY3Rpb259IGZyb20gXCIuL2FyYW5nby1jb2xsZWN0aW9uXCI7XG5pbXBvcnQgeyBDb2xsZWN0aW9uTGlzdGVuZXIsIFN1YnNjcmlwdGlvbkxpc3RlbmVyIH0gZnJvbSBcIi4vYXJhbmdvLWxpc3RlbmVyc1wiO1xuaW1wb3J0IHR5cGUgeyBRQ29uZmlnIH0gZnJvbSBcIi4vY29uZmlnXCI7XG5pbXBvcnQgeyBzZWxlY3Rpb25Ub1N0cmluZyB9IGZyb20gXCIuL3V0aWxzXCI7XG5cbnR5cGUgQ29udGV4dCA9IHtcbiAgICBkYjogQXJhbmdvLFxuICAgIGNvbmZpZzogUUNvbmZpZyxcbiAgICBzaGFyZWQ6IE1hcDxzdHJpbmcsIGFueT4sXG59XG5cbnR5cGUgSW5mbyA9IHtcbiAgICB2ZXJzaW9uOiBzdHJpbmcsXG59XG5cbnR5cGUgTGlzdGVuZXJTdGF0ID0ge1xuICAgIGZpbHRlcjogc3RyaW5nLFxuICAgIHNlbGVjdGlvbjogc3RyaW5nLFxuICAgIHF1ZXVlU2l6ZTogbnVtYmVyLFxuICAgIGV2ZW50Q291bnQ6IG51bWJlcixcbiAgICBzZWNvbmRzQWN0aXZlOiBudW1iZXIsXG59XG5cbnR5cGUgQ29sbGVjdGlvblN0YXQgPSB7XG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHN1YnNjcmlwdGlvbkNvdW50OiBudW1iZXIsXG4gICAgd2FpdEZvckNvdW50OiBudW1iZXIsXG4gICAgbWF4UXVldWVTaXplOiBudW1iZXIsXG4gICAgc3Vic2NyaXB0aW9uczogTGlzdGVuZXJTdGF0W10sXG4gICAgd2FpdEZvcjogTGlzdGVuZXJTdGF0W10sXG59XG5cbnR5cGUgU3RhdCA9IHtcbiAgICBjb2xsZWN0aW9uczogQ29sbGVjdGlvblN0YXRbXVxufVxuXG50eXBlIENvbGxlY3Rpb25TdW1tYXJ5ID0ge1xuICAgIGNvbGxlY3Rpb246IHN0cmluZyxcbiAgICBjb3VudDogbnVtYmVyLFxuICAgIGluZGV4ZXM6IHN0cmluZ1tdLFxufVxuXG4vLyBRdWVyeVxuXG5mdW5jdGlvbiBpbmZvKCk6IEluZm8ge1xuICAgIGNvbnN0IHBrZyA9IEpTT04ucGFyc2UoKGZzLnJlYWRGaWxlU3luYyhwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi4nLCAnLi4nLCAncGFja2FnZS5qc29uJykpOiBhbnkpKTtcbiAgICByZXR1cm4ge1xuICAgICAgICB2ZXJzaW9uOiBwa2cudmVyc2lvbixcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBzdGF0KF9wYXJlbnQ6IGFueSwgX2FyZ3M6IGFueSwgY29udGV4dDogQ29udGV4dCk6IFN0YXQge1xuICAgIGNvbnN0IGxpc3RlbmVyVG9TdGF0ID0gKGxpc3RlbmVyOiBDb2xsZWN0aW9uTGlzdGVuZXIgKTogTGlzdGVuZXJTdGF0ID0+IHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGZpbHRlcjogSlNPTi5zdHJpbmdpZnkobGlzdGVuZXIuZmlsdGVyKSxcbiAgICAgICAgICAgIHNlbGVjdGlvbjogc2VsZWN0aW9uVG9TdHJpbmcobGlzdGVuZXIuc2VsZWN0aW9uKSxcbiAgICAgICAgICAgIHF1ZXVlU2l6ZTogMCxcbiAgICAgICAgICAgIGV2ZW50Q291bnQ6IGxpc3RlbmVyLmdldEV2ZW50Q291bnQoKSxcbiAgICAgICAgICAgIHNlY29uZHNBY3RpdmU6IChEYXRlLm5vdygpIC0gbGlzdGVuZXIuc3RhcnRUaW1lKSAvIDEwMDAsXG4gICAgICAgIH07XG4gICAgfTtcbiAgICBjb25zdCBpc1N1YnNjcmlwdGlvbiA9IChsaXN0ZW5lcjogQ29sbGVjdGlvbkxpc3RlbmVyKTogYm9vbCA9PiB7XG4gICAgICAgIHJldHVybiBsaXN0ZW5lciBpbnN0YW5jZW9mIFN1YnNjcmlwdGlvbkxpc3RlbmVyO1xuICAgIH07XG4gICAgY29uc3QgZGI6IEFyYW5nbyA9IGNvbnRleHQuZGI7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgY29sbGVjdGlvbnM6IGRiLmNvbGxlY3Rpb25zLm1hcCgoY29sbGVjdGlvbjogQ29sbGVjdGlvbikgPT4ge1xuICAgICAgICAgICAgY29uc3QgbGlzdGVuZXJzID0gWy4uLmNvbGxlY3Rpb24ubGlzdGVuZXJzLnZhbHVlcygpXTtcbiAgICAgICAgICAgIGNvbnN0IHdhaXRGb3IgPSBsaXN0ZW5lcnMuZmlsdGVyKHggPT4gIWlzU3Vic2NyaXB0aW9uKHgpKTtcbiAgICAgICAgICAgIGNvbnN0IHN1YnNjcmlwdGlvbnMgPSBsaXN0ZW5lcnMuZmlsdGVyKGlzU3Vic2NyaXB0aW9uKTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgbmFtZTogY29sbGVjdGlvbi5uYW1lLFxuICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbkNvdW50OiBzdWJzY3JpcHRpb25zLmxlbmd0aCxcbiAgICAgICAgICAgICAgICB3YWl0Rm9yQ291bnQ6IHdhaXRGb3IubGVuZ3RoLFxuICAgICAgICAgICAgICAgIG1heFF1ZXVlU2l6ZTogY29sbGVjdGlvbi5tYXhRdWV1ZVNpemUsXG4gICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uczogc3Vic2NyaXB0aW9ucy5tYXAobGlzdGVuZXJUb1N0YXQpLFxuICAgICAgICAgICAgICAgIHdhaXRGb3I6IHdhaXRGb3IubWFwKGxpc3RlbmVyVG9TdGF0KSxcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9O1xufVxuXG5hc3luYyBmdW5jdGlvbiBnZXRDb2xsZWN0aW9ucyhfcGFyZW50OiBhbnksIF9hcmdzOiBhbnksIGNvbnRleHQ6IENvbnRleHQpOiBQcm9taXNlPENvbGxlY3Rpb25TdW1tYXJ5W10+IHtcbiAgICBjb25zdCBkYjogQXJhbmdvID0gY29udGV4dC5kYjtcbiAgICBjb25zdCBjb2xsZWN0aW9uczogQ29sbGVjdGlvblN1bW1hcnlbXSA9IFtdO1xuICAgIGZvciAoY29uc3QgY29sbGVjdGlvbiBvZiBkYi5jb2xsZWN0aW9ucykge1xuICAgICAgICBjb25zdCBpbmRleGVzOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICBjb25zdCBkYkNvbGxlY3Rpb24gPSBjb2xsZWN0aW9uLmRiQ29sbGVjdGlvbigpO1xuICAgICAgICBmb3IgKGNvbnN0IGluZGV4IG9mIGF3YWl0IGRiQ29sbGVjdGlvbi5pbmRleGVzKCkpIHtcbiAgICAgICAgICAgIGluZGV4ZXMucHVzaChpbmRleC5maWVsZHMuam9pbignLCAnKSk7XG4gICAgICAgIH1cbiAgICAgICAgY29sbGVjdGlvbnMucHVzaCh7XG4gICAgICAgICAgICBjb2xsZWN0aW9uOiBjb2xsZWN0aW9uLm5hbWUsXG4gICAgICAgICAgICBjb3VudDogKGF3YWl0IGRiQ29sbGVjdGlvbi5jb3VudCgpKS5jb3VudCxcbiAgICAgICAgICAgIGluZGV4ZXMsXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gY29sbGVjdGlvbnM7XG59XG5cbi8vIE11dGF0aW9uXG5cbmV4cG9ydCBjb25zdCByZXNvbHZlcnNNYW0gPSB7XG4gICAgUXVlcnk6IHtcbiAgICAgICAgaW5mbyxcbiAgICAgICAgZ2V0Q29sbGVjdGlvbnMsXG4gICAgICAgIHN0YXRcbiAgICB9LFxuICAgIE11dGF0aW9uOiB7XG4gICAgfSxcbn07XG4iXX0=