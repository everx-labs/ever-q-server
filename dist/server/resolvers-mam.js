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
      queueSize: iter.pushQueue.length + iter.pullQueue.length,
      eventCount: subscription.eventCount
    };
  };

  var db = context.db;
  return {
    collections: db.collections.map(function (collection) {
      return {
        name: collection.name,
        subscriptionCount: collection.subscriptions.items.size,
        waitForCount: collection.waitFor.items.size,
        maxQueueSize: collection.maxQueueSize,
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9yZXNvbHZlcnMtbWFtLmpzIl0sIm5hbWVzIjpbImluZm8iLCJwa2ciLCJKU09OIiwicGFyc2UiLCJmcyIsInJlYWRGaWxlU3luYyIsInBhdGgiLCJyZXNvbHZlIiwiX19kaXJuYW1lIiwidmVyc2lvbiIsInN0YXQiLCJfcGFyZW50IiwiX2FyZ3MiLCJjb250ZXh0Iiwic3Vic2NyaXB0aW9uVG9TdGF0Iiwic3Vic2NyaXB0aW9uIiwiaXRlciIsImZpbHRlciIsInN0cmluZ2lmeSIsInF1ZXVlU2l6ZSIsInB1c2hRdWV1ZSIsImxlbmd0aCIsInB1bGxRdWV1ZSIsImV2ZW50Q291bnQiLCJkYiIsImNvbGxlY3Rpb25zIiwibWFwIiwiY29sbGVjdGlvbiIsIm5hbWUiLCJzdWJzY3JpcHRpb25Db3VudCIsInN1YnNjcmlwdGlvbnMiLCJpdGVtcyIsInNpemUiLCJ3YWl0Rm9yQ291bnQiLCJ3YWl0Rm9yIiwibWF4UXVldWVTaXplIiwidmFsdWVzIiwiZ2V0Q2hhbmdlTG9nIiwiYXJncyIsImNoYW5nZUxvZyIsImdldCIsImlkIiwiZ2V0Q29sbGVjdGlvbnMiLCJpbmRleGVzIiwiZGJDb2xsZWN0aW9uIiwiaW5kZXgiLCJwdXNoIiwiZmllbGRzIiwiam9pbiIsImNvdW50Iiwic2V0Q2hhbmdlTG9nIiwib3AiLCJjbGVhciIsImVuYWJsZWQiLCJyZXNvbHZlcnNNYW0iLCJRdWVyeSIsIk11dGF0aW9uIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFFQTs7QUFDQTs7QUFFQTs7QUFFQTs7QUFvQ0E7QUFFQSxTQUFTQSxJQUFULEdBQXNCO0FBQ2xCLE1BQU1DLEdBQUcsR0FBR0MsSUFBSSxDQUFDQyxLQUFMLENBQVlDLGVBQUdDLFlBQUgsQ0FBZ0JDLGlCQUFLQyxPQUFMLENBQWFDLFNBQWIsRUFBd0IsSUFBeEIsRUFBOEIsSUFBOUIsRUFBb0MsY0FBcEMsQ0FBaEIsQ0FBWixDQUFaO0FBQ0EsU0FBTztBQUNIQyxJQUFBQSxPQUFPLEVBQUVSLEdBQUcsQ0FBQ1E7QUFEVixHQUFQO0FBR0g7O0FBRUQsU0FBU0MsSUFBVCxDQUFjQyxPQUFkLEVBQTRCQyxLQUE1QixFQUF3Q0MsT0FBeEMsRUFBZ0U7QUFDNUQsTUFBTUMsa0JBQWtCLEdBQUcsU0FBckJBLGtCQUFxQixDQUFDQyxZQUFELEVBQTREO0FBQ25GLFFBQU1DLElBQUksR0FBR0QsWUFBWSxDQUFDQyxJQUExQjtBQUNBLFdBQU87QUFDSEMsTUFBQUEsTUFBTSxFQUFFZixJQUFJLENBQUNnQixTQUFMLENBQWVILFlBQVksQ0FBQ0UsTUFBNUIsQ0FETDtBQUVIRSxNQUFBQSxTQUFTLEVBQUVILElBQUksQ0FBQ0ksU0FBTCxDQUFlQyxNQUFmLEdBQXdCTCxJQUFJLENBQUNNLFNBQUwsQ0FBZUQsTUFGL0M7QUFHSEUsTUFBQUEsVUFBVSxFQUFFUixZQUFZLENBQUNRO0FBSHRCLEtBQVA7QUFLSCxHQVBEOztBQVFBLE1BQU1DLEVBQVUsR0FBR1gsT0FBTyxDQUFDVyxFQUEzQjtBQUNBLFNBQU87QUFDSEMsSUFBQUEsV0FBVyxFQUFFRCxFQUFFLENBQUNDLFdBQUgsQ0FBZUMsR0FBZixDQUFtQixVQUFDQyxVQUFELEVBQTRCO0FBQ3hELGFBQU87QUFDSEMsUUFBQUEsSUFBSSxFQUFFRCxVQUFVLENBQUNDLElBRGQ7QUFFSEMsUUFBQUEsaUJBQWlCLEVBQUVGLFVBQVUsQ0FBQ0csYUFBWCxDQUF5QkMsS0FBekIsQ0FBK0JDLElBRi9DO0FBR0hDLFFBQUFBLFlBQVksRUFBRU4sVUFBVSxDQUFDTyxPQUFYLENBQW1CSCxLQUFuQixDQUF5QkMsSUFIcEM7QUFJSEcsUUFBQUEsWUFBWSxFQUFFUixVQUFVLENBQUNRLFlBSnRCO0FBS0hMLFFBQUFBLGFBQWEsRUFBRSxvQ0FBSUgsVUFBVSxDQUFDRyxhQUFYLENBQXlCTSxNQUF6QixFQUFKLEVBQXVDVixHQUF2QyxDQUEyQ1osa0JBQTNDO0FBTFosT0FBUDtBQU9ILEtBUlk7QUFEVixHQUFQO0FBV0g7O0FBRUQsU0FBU3VCLFlBQVQsQ0FBc0IxQixPQUF0QixFQUFvQzJCLElBQXBDLEVBQTBEekIsT0FBMUQsRUFBc0Y7QUFDbEYsU0FBT0EsT0FBTyxDQUFDVyxFQUFSLENBQVdlLFNBQVgsQ0FBcUJDLEdBQXJCLENBQXlCRixJQUFJLENBQUNHLEVBQTlCLENBQVA7QUFDSDs7U0FFY0MsYzs7RUFrQmY7Ozs7OzsrQkFsQkEsaUJBQThCL0IsT0FBOUIsRUFBNENDLEtBQTVDLEVBQXdEQyxPQUF4RDtBQUFBOztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQ1VXLFlBQUFBLEVBRFYsR0FDdUJYLE9BQU8sQ0FBQ1csRUFEL0I7QUFFVUMsWUFBQUEsV0FGVixHQUU2QyxFQUY3QztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsd0JBRzZCRCxFQUFFLENBQUNDLFdBSGhDOztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7O0FBR2VFLFlBQUFBLFdBSGY7QUFJY2dCLFlBQUFBLFFBSmQsR0FJa0MsRUFKbEM7QUFLY0MsWUFBQUEsYUFMZCxHQUs2QmpCLFdBQVUsQ0FBQ2lCLFlBQVgsRUFMN0I7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsbUJBTWtDQSxhQUFZLENBQUNELE9BQWIsRUFObEM7O0FBQUE7QUFBQTtBQUFBOztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7O0FBTW1CRSxZQUFBQSxNQU5uQjs7QUFPWUYsWUFBQUEsUUFBTyxDQUFDRyxJQUFSLENBQWFELE1BQUssQ0FBQ0UsTUFBTixDQUFhQyxJQUFiLENBQWtCLElBQWxCLENBQWI7O0FBUFo7QUFBQTtBQUFBO0FBQUE7O0FBQUE7QUFBQTtBQUFBOztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7O0FBQUE7QUFBQTtBQUFBOztBQUFBO0FBQUE7QUFBQTs7QUFBQTtBQUFBOztBQUFBO0FBQUE7QUFBQTtBQUFBOztBQUFBOztBQUFBO0FBQUE7O0FBQUE7QUFBQTs7QUFBQTtBQUFBLDBCQVNRdkIsV0FUUjtBQUFBLDBCQVV3QkUsV0FBVSxDQUFDQyxJQVZuQztBQUFBO0FBQUEsbUJBVzBCZ0IsYUFBWSxDQUFDSyxLQUFiLEVBWDFCOztBQUFBO0FBQUEsd0NBV2dEQSxLQVhoRDtBQUFBLDBCQVlZTixRQVpaO0FBQUE7QUFVWWhCLGNBQUFBLFVBVlo7QUFXWXNCLGNBQUFBLEtBWFo7QUFZWU4sY0FBQUEsT0FaWjtBQUFBOztBQUFBLHdCQVNvQkcsSUFUcEI7O0FBQUE7QUFBQTtBQUFBO0FBQUE7O0FBQUE7QUFBQTtBQUFBOztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7O0FBQUE7QUFBQTtBQUFBOztBQUFBO0FBQUE7QUFBQTs7QUFBQTtBQUFBOztBQUFBO0FBQUE7QUFBQTtBQUFBOztBQUFBOztBQUFBO0FBQUE7O0FBQUE7QUFBQTs7QUFBQTtBQUFBLDZDQWVXckIsV0FmWDs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxHOzs7O0FBb0JBLFNBQVN5QixZQUFULENBQXNCdkMsT0FBdEIsRUFBb0MyQixJQUFwQyxFQUEwRHpCLE9BQTFELEVBQW9GO0FBQ2hGLE1BQUl5QixJQUFJLENBQUNhLEVBQUwsS0FBWSxPQUFoQixFQUF5QjtBQUNyQnRDLElBQUFBLE9BQU8sQ0FBQ1csRUFBUixDQUFXZSxTQUFYLENBQXFCYSxLQUFyQjtBQUNILEdBRkQsTUFFTyxJQUFJZCxJQUFJLENBQUNhLEVBQUwsS0FBWSxJQUFoQixFQUFzQjtBQUN6QnRDLElBQUFBLE9BQU8sQ0FBQ1csRUFBUixDQUFXZSxTQUFYLENBQXFCYyxPQUFyQixHQUErQixJQUEvQjtBQUNILEdBRk0sTUFFQSxJQUFJZixJQUFJLENBQUNhLEVBQUwsS0FBWSxLQUFoQixFQUF1QjtBQUMxQnRDLElBQUFBLE9BQU8sQ0FBQ1csRUFBUixDQUFXZSxTQUFYLENBQXFCYyxPQUFyQixHQUErQixLQUEvQjtBQUNIOztBQUNELFNBQU8sQ0FBUDtBQUNIOztBQUVNLElBQU1DLFlBQVksR0FBRztBQUN4QkMsRUFBQUEsS0FBSyxFQUFFO0FBQ0h2RCxJQUFBQSxJQUFJLEVBQUpBLElBREc7QUFFSHFDLElBQUFBLFlBQVksRUFBWkEsWUFGRztBQUdISyxJQUFBQSxjQUFjLEVBQWRBLGNBSEc7QUFJSGhDLElBQUFBLElBQUksRUFBSkE7QUFKRyxHQURpQjtBQU94QjhDLEVBQUFBLFFBQVEsRUFBRTtBQUNOTixJQUFBQSxZQUFZLEVBQVpBO0FBRE07QUFQYyxDQUFyQiIsInNvdXJjZXNDb250ZW50IjpbIi8vIEBmbG93XG5cbmltcG9ydCBmcyBmcm9tIFwiZnNcIjtcbmltcG9ydCBBcmFuZ28gZnJvbSBcIi4vYXJhbmdvXCI7XG5pbXBvcnQgdHlwZSB7IENvbGxlY3Rpb25TdWJzY3JpcHRpb24gfSBmcm9tIFwiLi9hcmFuZ28tY29sbGVjdGlvblwiO1xuaW1wb3J0IHsgQ29sbGVjdGlvbiB9IGZyb20gXCIuL2FyYW5nby1jb2xsZWN0aW9uXCI7XG5pbXBvcnQgdHlwZSB7IFFDb25maWcgfSBmcm9tIFwiLi9jb25maWdcIjtcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuXG50eXBlIENvbnRleHQgPSB7XG4gICAgZGI6IEFyYW5nbyxcbiAgICBjb25maWc6IFFDb25maWcsXG4gICAgc2hhcmVkOiBNYXA8c3RyaW5nLCBhbnk+LFxufVxuXG50eXBlIEluZm8gPSB7XG4gICAgdmVyc2lvbjogc3RyaW5nLFxufVxuXG50eXBlIFN1YnNjcmlwdGlvblN0YXQgPSB7XG4gICAgZmlsdGVyOiBzdHJpbmcsXG4gICAgcXVldWVTaXplOiBudW1iZXIsXG4gICAgZXZlbnRDb3VudDogbnVtYmVyLFxufVxuXG50eXBlIENvbGxlY3Rpb25TdGF0ID0ge1xuICAgIG5hbWU6IHN0cmluZyxcbiAgICBzdWJzY3JpcHRpb25Db3VudDogbnVtYmVyLFxuICAgIHdhaXRGb3JDb3VudDogbnVtYmVyLFxuICAgIG1heFF1ZXVlU2l6ZTogbnVtYmVyLFxuICAgIHN1YnNjcmlwdGlvbnM6IFN1YnNjcmlwdGlvblN0YXRbXSxcbn1cblxudHlwZSBTdGF0ID0ge1xuICAgIGNvbGxlY3Rpb25zOiBDb2xsZWN0aW9uU3RhdFtdXG59XG5cbnR5cGUgQ29sbGVjdGlvblN1bW1hcnkgPSB7XG4gICAgY29sbGVjdGlvbjogc3RyaW5nLFxuICAgIGNvdW50OiBudW1iZXIsXG4gICAgaW5kZXhlczogc3RyaW5nW10sXG59XG5cbi8vIFF1ZXJ5XG5cbmZ1bmN0aW9uIGluZm8oKTogSW5mbyB7XG4gICAgY29uc3QgcGtnID0gSlNPTi5wYXJzZSgoZnMucmVhZEZpbGVTeW5jKHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuLicsICcuLicsICdwYWNrYWdlLmpzb24nKSk6IGFueSkpO1xuICAgIHJldHVybiB7XG4gICAgICAgIHZlcnNpb246IHBrZy52ZXJzaW9uLFxuICAgIH07XG59XG5cbmZ1bmN0aW9uIHN0YXQoX3BhcmVudDogYW55LCBfYXJnczogYW55LCBjb250ZXh0OiBDb250ZXh0KTogU3RhdCB7XG4gICAgY29uc3Qgc3Vic2NyaXB0aW9uVG9TdGF0ID0gKHN1YnNjcmlwdGlvbjogQ29sbGVjdGlvblN1YnNjcmlwdGlvbik6IFN1YnNjcmlwdGlvblN0YXQgPT4ge1xuICAgICAgICBjb25zdCBpdGVyID0gc3Vic2NyaXB0aW9uLml0ZXI7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBmaWx0ZXI6IEpTT04uc3RyaW5naWZ5KHN1YnNjcmlwdGlvbi5maWx0ZXIpLFxuICAgICAgICAgICAgcXVldWVTaXplOiBpdGVyLnB1c2hRdWV1ZS5sZW5ndGggKyBpdGVyLnB1bGxRdWV1ZS5sZW5ndGgsXG4gICAgICAgICAgICBldmVudENvdW50OiBzdWJzY3JpcHRpb24uZXZlbnRDb3VudCxcbiAgICAgICAgfTtcbiAgICB9O1xuICAgIGNvbnN0IGRiOiBBcmFuZ28gPSBjb250ZXh0LmRiO1xuICAgIHJldHVybiB7XG4gICAgICAgIGNvbGxlY3Rpb25zOiBkYi5jb2xsZWN0aW9ucy5tYXAoKGNvbGxlY3Rpb246IENvbGxlY3Rpb24pID0+IHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgbmFtZTogY29sbGVjdGlvbi5uYW1lLFxuICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbkNvdW50OiBjb2xsZWN0aW9uLnN1YnNjcmlwdGlvbnMuaXRlbXMuc2l6ZSxcbiAgICAgICAgICAgICAgICB3YWl0Rm9yQ291bnQ6IGNvbGxlY3Rpb24ud2FpdEZvci5pdGVtcy5zaXplLFxuICAgICAgICAgICAgICAgIG1heFF1ZXVlU2l6ZTogY29sbGVjdGlvbi5tYXhRdWV1ZVNpemUsXG4gICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uczogWy4uLmNvbGxlY3Rpb24uc3Vic2NyaXB0aW9ucy52YWx1ZXMoKV0ubWFwKHN1YnNjcmlwdGlvblRvU3RhdCksXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfVxufVxuXG5mdW5jdGlvbiBnZXRDaGFuZ2VMb2coX3BhcmVudDogYW55LCBhcmdzOiB7IGlkOiBzdHJpbmcgfSwgY29udGV4dDogQ29udGV4dCk6IG51bWJlcltdIHtcbiAgICByZXR1cm4gY29udGV4dC5kYi5jaGFuZ2VMb2cuZ2V0KGFyZ3MuaWQpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBnZXRDb2xsZWN0aW9ucyhfcGFyZW50OiBhbnksIF9hcmdzOiBhbnksIGNvbnRleHQ6IENvbnRleHQpOiBQcm9taXNlPENvbGxlY3Rpb25TdW1tYXJ5W10+IHtcbiAgICBjb25zdCBkYjogQXJhbmdvID0gY29udGV4dC5kYjtcbiAgICBjb25zdCBjb2xsZWN0aW9uczogQ29sbGVjdGlvblN1bW1hcnlbXSA9IFtdO1xuICAgIGZvciAoY29uc3QgY29sbGVjdGlvbiBvZiBkYi5jb2xsZWN0aW9ucykge1xuICAgICAgICBjb25zdCBpbmRleGVzOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICBjb25zdCBkYkNvbGxlY3Rpb24gPSBjb2xsZWN0aW9uLmRiQ29sbGVjdGlvbigpO1xuICAgICAgICBmb3IgKGNvbnN0IGluZGV4IG9mIGF3YWl0IGRiQ29sbGVjdGlvbi5pbmRleGVzKCkpIHtcbiAgICAgICAgICAgIGluZGV4ZXMucHVzaChpbmRleC5maWVsZHMuam9pbignLCAnKSk7XG4gICAgICAgIH1cbiAgICAgICAgY29sbGVjdGlvbnMucHVzaCh7XG4gICAgICAgICAgICBjb2xsZWN0aW9uOiBjb2xsZWN0aW9uLm5hbWUsXG4gICAgICAgICAgICBjb3VudDogKGF3YWl0IGRiQ29sbGVjdGlvbi5jb3VudCgpKS5jb3VudCxcbiAgICAgICAgICAgIGluZGV4ZXMsXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gY29sbGVjdGlvbnM7XG59XG5cbi8vIE11dGF0aW9uXG5cbmZ1bmN0aW9uIHNldENoYW5nZUxvZyhfcGFyZW50OiBhbnksIGFyZ3M6IHsgb3A6IHN0cmluZyB9LCBjb250ZXh0OiBDb250ZXh0KTogbnVtYmVyIHtcbiAgICBpZiAoYXJncy5vcCA9PT0gJ0NMRUFSJykge1xuICAgICAgICBjb250ZXh0LmRiLmNoYW5nZUxvZy5jbGVhcigpO1xuICAgIH0gZWxzZSBpZiAoYXJncy5vcCA9PT0gJ09OJykge1xuICAgICAgICBjb250ZXh0LmRiLmNoYW5nZUxvZy5lbmFibGVkID0gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKGFyZ3Mub3AgPT09ICdPRkYnKSB7XG4gICAgICAgIGNvbnRleHQuZGIuY2hhbmdlTG9nLmVuYWJsZWQgPSBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIDE7XG59XG5cbmV4cG9ydCBjb25zdCByZXNvbHZlcnNNYW0gPSB7XG4gICAgUXVlcnk6IHtcbiAgICAgICAgaW5mbyxcbiAgICAgICAgZ2V0Q2hhbmdlTG9nLFxuICAgICAgICBnZXRDb2xsZWN0aW9ucyxcbiAgICAgICAgc3RhdFxuICAgIH0sXG4gICAgTXV0YXRpb246IHtcbiAgICAgICAgc2V0Q2hhbmdlTG9nLFxuICAgIH0sXG59O1xuIl19