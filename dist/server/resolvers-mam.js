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
      selection: (0, _arangoCollection.selectionToString)(listener.selection),
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9yZXNvbHZlcnMtbWFtLmpzIl0sIm5hbWVzIjpbImluZm8iLCJwa2ciLCJKU09OIiwicGFyc2UiLCJmcyIsInJlYWRGaWxlU3luYyIsInBhdGgiLCJyZXNvbHZlIiwiX19kaXJuYW1lIiwidmVyc2lvbiIsInN0YXQiLCJfcGFyZW50IiwiX2FyZ3MiLCJjb250ZXh0IiwibGlzdGVuZXJUb1N0YXQiLCJsaXN0ZW5lciIsImZpbHRlciIsInN0cmluZ2lmeSIsInNlbGVjdGlvbiIsInF1ZXVlU2l6ZSIsImV2ZW50Q291bnQiLCJnZXRFdmVudENvdW50Iiwic2Vjb25kc0FjdGl2ZSIsIkRhdGUiLCJub3ciLCJzdGFydFRpbWUiLCJpc1N1YnNjcmlwdGlvbiIsIlN1YnNjcmlwdGlvbkxpc3RlbmVyIiwiZGIiLCJjb2xsZWN0aW9ucyIsIm1hcCIsImNvbGxlY3Rpb24iLCJsaXN0ZW5lcnMiLCJ2YWx1ZXMiLCJ3YWl0Rm9yIiwieCIsInN1YnNjcmlwdGlvbnMiLCJuYW1lIiwic3Vic2NyaXB0aW9uQ291bnQiLCJsZW5ndGgiLCJ3YWl0Rm9yQ291bnQiLCJtYXhRdWV1ZVNpemUiLCJnZXRDb2xsZWN0aW9ucyIsImluZGV4ZXMiLCJkYkNvbGxlY3Rpb24iLCJpbmRleCIsInB1c2giLCJmaWVsZHMiLCJqb2luIiwiY291bnQiLCJyZXNvbHZlcnNNYW0iLCJRdWVyeSIsIk11dGF0aW9uIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFFQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUF3Q0E7QUFFQSxTQUFTQSxJQUFULEdBQXNCO0FBQ2xCLE1BQU1DLEdBQUcsR0FBR0MsSUFBSSxDQUFDQyxLQUFMLENBQVlDLGVBQUdDLFlBQUgsQ0FBZ0JDLGlCQUFLQyxPQUFMLENBQWFDLFNBQWIsRUFBd0IsSUFBeEIsRUFBOEIsSUFBOUIsRUFBb0MsY0FBcEMsQ0FBaEIsQ0FBWixDQUFaO0FBQ0EsU0FBTztBQUNIQyxJQUFBQSxPQUFPLEVBQUVSLEdBQUcsQ0FB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QUFBOztBQUFBO0FBQUE7QUFBQTs7QUFBQTtBQUFBOztBQUFBO0FBQUE7QUFBQTtBQUFBOztBQUFBOztBQUFBO0FBQUE7O0FBQUE7QUFBQTs7QUFBQTtBQUFBLDBCQVNRbkIsV0FUUjtBQUFBLDBCQVV3QkUsV0FBVSxDQUFDTSxJQVZuQztBQUFBO0FBQUEsbUJBVzBCTyxhQUFZLENBQUNLLEtBQWIsRUFYMUI7O0FBQUE7QUFBQSx3Q0FXZ0RBLEtBWGhEO0FBQUEsMEJBWVlOLFFBWlo7QUFBQTtBQVVZWixjQUFBQSxVQVZaO0FBV1lrQixjQUFBQSxLQVhaO0FBWVlOLGNBQUFBLE9BWlo7QUFBQTs7QUFBQSx3QkFTb0JHLElBVHBCOztBQUFBO0FBQUE7QUFBQTtBQUFBOztBQUFBO0FBQUE7QUFBQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOztBQUFBO0FBQUE7QUFBQTs7QUFBQTtBQUFBO0FBQUE7O0FBQUE7QUFBQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFBQTs7QUFBQTtBQUFBOztBQUFBO0FBQUE7O0FBQUE7QUFBQSw2Q0FlV2pCLFdBZlg7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRzs7OztBQW9CTyxJQUFNcUIsWUFBWSxHQUFHO0FBQ3hCQyxFQUFBQSxLQUFLLEVBQUU7QUFDSG5ELElBQUFBLElBQUksRUFBSkEsSUFERztBQUVIMEMsSUFBQUEsY0FBYyxFQUFkQSxjQUZHO0FBR0hoQyxJQUFBQSxJQUFJLEVBQUpBO0FBSEcsR0FEaUI7QUFNeEIwQyxFQUFBQSxRQUFRLEVBQUU7QUFOYyxDQUFyQiIsInNvdXJjZXNDb250ZW50IjpbIi8vIEBmbG93XG5cbmltcG9ydCBmcyBmcm9tIFwiZnNcIjtcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IEFyYW5nbyBmcm9tIFwiLi9hcmFuZ29cIjtcbmltcG9ydCB7IENvbGxlY3Rpb24sIENvbGxlY3Rpb25MaXN0ZW5lciwgc2VsZWN0aW9uVG9TdHJpbmcsIFN1YnNjcmlwdGlvbkxpc3RlbmVyIH0gZnJvbSBcIi4vYXJhbmdvLWNvbGxlY3Rpb25cIjtcbmltcG9ydCB0eXBlIHsgUUNvbmZpZyB9IGZyb20gXCIuL2NvbmZpZ1wiO1xuXG50eXBlIENvbnRleHQgPSB7XG4gICAgZGI6IEFyYW5nbyxcbiAgICBjb25maWc6IFFDb25maWcsXG4gICAgc2hhcmVkOiBNYXA8c3RyaW5nLCBhbnk+LFxufVxuXG50eXBlIEluZm8gPSB7XG4gICAgdmVyc2lvbjogc3RyaW5nLFxufVxuXG50eXBlIExpc3RlbmVyU3RhdCA9IHtcbiAgICBmaWx0ZXI6IHN0cmluZyxcbiAgICBzZWxlY3Rpb246IHN0cmluZyxcbiAgICBxdWV1ZVNpemU6IG51bWJlcixcbiAgICBldmVudENvdW50OiBudW1iZXIsXG4gICAgc2Vjb25kc0FjdGl2ZTogbnVtYmVyLFxufVxuXG50eXBlIENvbGxlY3Rpb25TdGF0ID0ge1xuICAgIG5hbWU6IHN0cmluZyxcbiAgICBzdWJzY3JpcHRpb25Db3VudDogbnVtYmVyLFxuICAgIHdhaXRGb3JDb3VudDogbnVtYmVyLFxuICAgIG1heFF1ZXVlU2l6ZTogbnVtYmVyLFxuICAgIHN1YnNjcmlwdGlvbnM6IExpc3RlbmVyU3RhdFtdLFxuICAgIHdhaXRGb3I6IExpc3RlbmVyU3RhdFtdLFxufVxuXG50eXBlIFN0YXQgPSB7XG4gICAgY29sbGVjdGlvbnM6IENvbGxlY3Rpb25TdGF0W11cbn1cblxudHlwZSBDb2xsZWN0aW9uU3VtbWFyeSA9IHtcbiAgICBjb2xsZWN0aW9uOiBzdHJpbmcsXG4gICAgY291bnQ6IG51bWJlcixcbiAgICBpbmRleGVzOiBzdHJpbmdbXSxcbn1cblxuLy8gUXVlcnlcblxuZnVuY3Rpb24gaW5mbygpOiBJbmZvIHtcbiAgICBjb25zdCBwa2cgPSBKU09OLnBhcnNlKChmcy5yZWFkRmlsZVN5bmMocGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4uJywgJy4uJywgJ3BhY2thZ2UuanNvbicpKTogYW55KSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdmVyc2lvbjogcGtnLnZlcnNpb24sXG4gICAgfTtcbn1cblxuZnVuY3Rpb24gc3RhdChfcGFyZW50OiBhbnksIF9hcmdzOiBhbnksIGNvbnRleHQ6IENvbnRleHQpOiBTdGF0IHtcbiAgICBjb25zdCBsaXN0ZW5lclRvU3RhdCA9IChsaXN0ZW5lcjogQ29sbGVjdGlvbkxpc3RlbmVyICk6IExpc3RlbmVyU3RhdCA9PiB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBmaWx0ZXI6IEpTT04uc3RyaW5naWZ5KGxpc3RlbmVyLmZpbHRlciksXG4gICAgICAgICAgICBzZWxlY3Rpb246IHNlbGVjdGlvblRvU3RyaW5nKGxpc3RlbmVyLnNlbGVjdGlvbiksXG4gICAgICAgICAgICBxdWV1ZVNpemU6IDAsXG4gICAgICAgICAgICBldmVudENvdW50OiBsaXN0ZW5lci5nZXRFdmVudENvdW50KCksXG4gICAgICAgICAgICBzZWNvbmRzQWN0aXZlOiAoRGF0ZS5ub3coKSAtIGxpc3RlbmVyLnN0YXJ0VGltZSkgLyAxMDAwLFxuICAgICAgICB9O1xuICAgIH07XG4gICAgY29uc3QgaXNTdWJzY3JpcHRpb24gPSAobGlzdGVuZXI6IENvbGxlY3Rpb25MaXN0ZW5lcik6IGJvb2wgPT4ge1xuICAgICAgICByZXR1cm4gbGlzdGVuZXIgaW5zdGFuY2VvZiBTdWJzY3JpcHRpb25MaXN0ZW5lcjtcbiAgICB9O1xuICAgIGNvbnN0IGRiOiBBcmFuZ28gPSBjb250ZXh0LmRiO1xuICAgIHJldHVybiB7XG4gICAgICAgIGNvbGxlY3Rpb25zOiBkYi5jb2xsZWN0aW9ucy5tYXAoKGNvbGxlY3Rpb246IENvbGxlY3Rpb24pID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGxpc3RlbmVycyA9IFsuLi5jb2xsZWN0aW9uLmxpc3RlbmVycy52YWx1ZXMoKV07XG4gICAgICAgICAgICBjb25zdCB3YWl0Rm9yID0gbGlzdGVuZXJzLmZpbHRlcih4ID0+ICFpc1N1YnNjcmlwdGlvbih4KSk7XG4gICAgICAgICAgICBjb25zdCBzdWJzY3JpcHRpb25zID0gbGlzdGVuZXJzLmZpbHRlcihpc1N1YnNjcmlwdGlvbik7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIG5hbWU6IGNvbGxlY3Rpb24ubmFtZSxcbiAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb25Db3VudDogc3Vic2NyaXB0aW9ucy5sZW5ndGgsXG4gICAgICAgICAgICAgICAgd2FpdEZvckNvdW50OiB3YWl0Rm9yLmxlbmd0aCxcbiAgICAgICAgICAgICAgICBtYXhRdWV1ZVNpemU6IGNvbGxlY3Rpb24ubWF4UXVldWVTaXplLFxuICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbnM6IHN1YnNjcmlwdGlvbnMubWFwKGxpc3RlbmVyVG9TdGF0KSxcbiAgICAgICAgICAgICAgICB3YWl0Rm9yOiB3YWl0Rm9yLm1hcChsaXN0ZW5lclRvU3RhdCksXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZ2V0Q29sbGVjdGlvbnMoX3BhcmVudDogYW55LCBfYXJnczogYW55LCBjb250ZXh0OiBDb250ZXh0KTogUHJvbWlzZTxDb2xsZWN0aW9uU3VtbWFyeVtdPiB7XG4gICAgY29uc3QgZGI6IEFyYW5nbyA9IGNvbnRleHQuZGI7XG4gICAgY29uc3QgY29sbGVjdGlvbnM6IENvbGxlY3Rpb25TdW1tYXJ5W10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IGNvbGxlY3Rpb24gb2YgZGIuY29sbGVjdGlvbnMpIHtcbiAgICAgICAgY29uc3QgaW5kZXhlczogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgY29uc3QgZGJDb2xsZWN0aW9uID0gY29sbGVjdGlvbi5kYkNvbGxlY3Rpb24oKTtcbiAgICAgICAgZm9yIChjb25zdCBpbmRleCBvZiBhd2FpdCBkYkNvbGxlY3Rpb24uaW5kZXhlcygpKSB7XG4gICAgICAgICAgICBpbmRleGVzLnB1c2goaW5kZXguZmllbGRzLmpvaW4oJywgJykpO1xuICAgICAgICB9XG4gICAgICAgIGNvbGxlY3Rpb25zLnB1c2goe1xuICAgICAgICAgICAgY29sbGVjdGlvbjogY29sbGVjdGlvbi5uYW1lLFxuICAgICAgICAgICAgY291bnQ6IChhd2FpdCBkYkNvbGxlY3Rpb24uY291bnQoKSkuY291bnQsXG4gICAgICAgICAgICBpbmRleGVzLFxuICAgICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbGxlY3Rpb25zO1xufVxuXG4vLyBNdXRhdGlvblxuXG5leHBvcnQgY29uc3QgcmVzb2x2ZXJzTWFtID0ge1xuICAgIFF1ZXJ5OiB7XG4gICAgICAgIGluZm8sXG4gICAgICAgIGdldENvbGxlY3Rpb25zLFxuICAgICAgICBzdGF0XG4gICAgfSxcbiAgICBNdXRhdGlvbjoge1xuICAgIH0sXG59O1xuIl19