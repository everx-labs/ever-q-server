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
  var subscriptionToStat = function subscriptionToStat(subscription) {
    return {
      filter: JSON.stringify(subscription.filter),
      selection: selectionToString(subscription.selection),
      queueSize: subscription.getQueueSize(),
      eventCount: subscription.eventCount,
      secondsActive: (Date.now() - subscription.startTime) / 1000
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9yZXNvbHZlcnMtbWFtLmpzIl0sIm5hbWVzIjpbImluZm8iLCJwa2ciLCJKU09OIiwicGFyc2UiLCJmcyIsInJlYWRGaWxlU3luYyIsInBhdGgiLCJyZXNvbHZlIiwiX19kaXJuYW1lIiwidmVyc2lvbiIsInNlbGVjdGlvblRvU3RyaW5nIiwic2VsZWN0aW9uIiwiZmlsdGVyIiwieCIsIm5hbWUiLCJtYXAiLCJmaWVsZCIsImZpZWxkU2VsZWN0aW9uIiwiam9pbiIsInN0YXQiLCJfcGFyZW50IiwiX2FyZ3MiLCJjb250ZXh0Iiwic3Vic2NyaXB0aW9uVG9TdGF0Iiwic3Vic2NyaXB0aW9uIiwic3RyaW5naWZ5IiwicXVldWVTaXplIiwiZ2V0UXVldWVTaXplIiwiZXZlbnRDb3VudCIsInNlY29uZHNBY3RpdmUiLCJEYXRlIiwibm93Iiwic3RhcnRUaW1lIiwiZGIiLCJjb2xsZWN0aW9ucyIsImNvbGxlY3Rpb24iLCJzdWJzY3JpcHRpb25Db3VudCIsInN1YnNjcmlwdGlvbnMiLCJpdGVtcyIsInNpemUiLCJ3YWl0Rm9yQ291bnQiLCJ3YWl0Rm9yIiwibWF4UXVldWVTaXplIiwidmFsdWVzIiwiZ2V0Q2hhbmdlTG9nIiwiYXJncyIsImNoYW5nZUxvZyIsImdldCIsImlkIiwiZ2V0Q29sbGVjdGlvbnMiLCJpbmRleGVzIiwiZGJDb2xsZWN0aW9uIiwiaW5kZXgiLCJwdXNoIiwiZmllbGRzIiwiY291bnQiLCJzZXRDaGFuZ2VMb2ciLCJvcCIsImNsZWFyIiwiZW5hYmxlZCIsInJlc29sdmVyc01hbSIsIlF1ZXJ5IiwiTXV0YXRpb24iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUVBOztBQUNBOztBQUVBOztBQUVBOztBQXNDQTtBQUVBLFNBQVNBLElBQVQsR0FBc0I7QUFDbEIsTUFBTUMsR0FBRyxHQUFHQyxJQUFJLENBQUNDLEtBQUwsQ0FBWUMsZUFBR0MsWUFBSCxDQUFnQkMsaUJBQUtDLE9BQUwsQ0FBYUMsU0FBYixFQUF3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b0Y7QUFDaEYsTUFBSXVCLElBQUksQ0FBQ1ksRUFBTCxLQUFZLE9BQWhCLEVBQXlCO0FBQ3JCbkMsSUFBQUEsT0FBTyxDQUFDVyxFQUFSLENBQVdhLFNBQVgsQ0FBcUJZLEtBQXJCO0FBQ0gsR0FGRCxNQUVPLElBQUliLElBQUksQ0FBQ1ksRUFBTCxLQUFZLElBQWhCLEVBQXNCO0FBQ3pCbkMsSUFBQUEsT0FBTyxDQUFDVyxFQUFSLENBQVdhLFNBQVgsQ0FBcUJhLE9BQXJCLEdBQStCLElBQS9CO0FBQ0gsR0FGTSxNQUVBLElBQUlkLElBQUksQ0FBQ1ksRUFBTCxLQUFZLEtBQWhCLEVBQXVCO0FBQzFCbkMsSUFBQUEsT0FBTyxDQUFDVyxFQUFSLENBQVdhLFNBQVgsQ0FBcUJhLE9BQXJCLEdBQStCLEtBQS9CO0FBQ0g7O0FBQ0QsU0FBTyxDQUFQO0FBQ0g7O0FBRU0sSUFBTUMsWUFBWSxHQUFHO0FBQ3hCQyxFQUFBQSxLQUFLLEVBQUU7QUFDSDdELElBQUFBLElBQUksRUFBSkEsSUFERztBQUVINEMsSUFBQUEsWUFBWSxFQUFaQSxZQUZHO0FBR0hLLElBQUFBLGNBQWMsRUFBZEEsY0FIRztBQUlIOUIsSUFBQUEsSUFBSSxFQUFKQTtBQUpHLEdBRGlCO0FBT3hCMkMsRUFBQUEsUUFBUSxFQUFFO0FBQ05OLElBQUFBLFlBQVksRUFBWkE7QUFETTtBQVBjLENBQXJCIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQGZsb3dcblxuaW1wb3J0IGZzIGZyb20gXCJmc1wiO1xuaW1wb3J0IEFyYW5nbyBmcm9tIFwiLi9hcmFuZ29cIjtcbmltcG9ydCB0eXBlIHsgRmllbGRTZWxlY3Rpb24gfSBmcm9tIFwiLi9hcmFuZ28tY29sbGVjdGlvblwiO1xuaW1wb3J0IHsgQ29sbGVjdGlvbiwgQ29sbGVjdGlvblN1YnNjcmlwdGlvbiB9IGZyb20gXCIuL2FyYW5nby1jb2xsZWN0aW9uXCI7XG5pbXBvcnQgdHlwZSB7IFFDb25maWcgfSBmcm9tIFwiLi9jb25maWdcIjtcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuXG50eXBlIENvbnRleHQgPSB7XG4gICAgZGI6IEFyYW5nbyxcbiAgICBjb25maWc6IFFDb25maWcsXG4gICAgc2hhcmVkOiBNYXA8c3RyaW5nLCBhbnk+LFxufVxuXG50eXBlIEluZm8gPSB7XG4gICAgdmVyc2lvbjogc3RyaW5nLFxufVxuXG50eXBlIFN1YnNjcmlwdGlvblN0YXQgPSB7XG4gICAgZmlsdGVyOiBzdHJpbmcsXG4gICAgc2VsZWN0aW9uOiBzdHJpbmcsXG4gICAgcXVldWVTaXplOiBudW1iZXIsXG4gICAgZXZlbnRDb3VudDogbnVtYmVyLFxuICAgIHNlY29uZHNBY3RpdmU6IG51bWJlcixcbn1cblxudHlwZSBDb2xsZWN0aW9uU3RhdCA9IHtcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgc3Vic2NyaXB0aW9uQ291bnQ6IG51bWJlcixcbiAgICB3YWl0Rm9yQ291bnQ6IG51bWJlcixcbiAgICBtYXhRdWV1ZVNpemU6IG51bWJlcixcbiAgICBzdWJzY3JpcHRpb25zOiBTdWJzY3JpcHRpb25TdGF0W10sXG59XG5cbnR5cGUgU3RhdCA9IHtcbiAgICBjb2xsZWN0aW9uczogQ29sbGVjdGlvblN0YXRbXVxufVxuXG50eXBlIENvbGxlY3Rpb25TdW1tYXJ5ID0ge1xuICAgIGNvbGxlY3Rpb246IHN0cmluZyxcbiAgICBjb3VudDogbnVtYmVyLFxuICAgIGluZGV4ZXM6IHN0cmluZ1tdLFxufVxuXG4vLyBRdWVyeVxuXG5mdW5jdGlvbiBpbmZvKCk6IEluZm8ge1xuICAgIGNvbnN0IHBrZyA9IEpTT04ucGFyc2UoKGZzLnJlYWRGaWxlU3luYyhwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi4nLCAnLi4nLCAncGFja2FnZS5qc29uJykpOiBhbnkpKTtcbiAgICByZXR1cm4ge1xuICAgICAgICB2ZXJzaW9uOiBwa2cudmVyc2lvbixcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBzZWxlY3Rpb25Ub1N0cmluZyhzZWxlY3Rpb246IEZpZWxkU2VsZWN0aW9uW10pOiBzdHJpbmcge1xuICAgIHJldHVybiBzZWxlY3Rpb25cbiAgICAgICAgLmZpbHRlcih4ID0+IHgubmFtZSAhPT0gJ19fdHlwZW5hbWUnKVxuICAgICAgICAubWFwKChmaWVsZDogRmllbGRTZWxlY3Rpb24pID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGZpZWxkU2VsZWN0aW9uID0gc2VsZWN0aW9uVG9TdHJpbmcoZmllbGQuc2VsZWN0aW9uKTtcbiAgICAgICAgICAgIHJldHVybiBgJHtmaWVsZC5uYW1lfSR7ZmllbGRTZWxlY3Rpb24gIT09ICcnID8gYCB7ICR7ZmllbGRTZWxlY3Rpb259IH1gIDogJyd9YDtcbiAgICAgICAgfSkuam9pbignICcpO1xufVxuXG5mdW5jdGlvbiBzdGF0KF9wYXJlbnQ6IGFueSwgX2FyZ3M6IGFueSwgY29udGV4dDogQ29udGV4dCk6IFN0YXQge1xuICAgIGNvbnN0IHN1YnNjcmlwdGlvblRvU3RhdCA9IChzdWJzY3JpcHRpb246IENvbGxlY3Rpb25TdWJzY3JpcHRpb24pOiBTdWJzY3JpcHRpb25TdGF0ID0+IHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGZpbHRlcjogSlNPTi5zdHJpbmdpZnkoc3Vic2NyaXB0aW9uLmZpbHRlciksXG4gICAgICAgICAgICBzZWxlY3Rpb246IHNlbGVjdGlvblRvU3RyaW5nKHN1YnNjcmlwdGlvbi5zZWxlY3Rpb24pLFxuICAgICAgICAgICAgcXVldWVTaXplOiBzdWJzY3JpcHRpb24uZ2V0UXVldWVTaXplKCksXG4gICAgICAgICAgICBldmVudENvdW50OiBzdWJzY3JpcHRpb24uZXZlbnRDb3VudCxcbiAgICAgICAgICAgIHNlY29uZHNBY3RpdmU6IChEYXRlLm5vdygpIC0gc3Vic2NyaXB0aW9uLnN0YXJ0VGltZSkgLyAxMDAwLFxuICAgICAgICB9O1xuICAgIH07XG4gICAgY29uc3QgZGI6IEFyYW5nbyA9IGNvbnRleHQuZGI7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgY29sbGVjdGlvbnM6IGRiLmNvbGxlY3Rpb25zLm1hcCgoY29sbGVjdGlvbjogQ29sbGVjdGlvbikgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBuYW1lOiBjb2xsZWN0aW9uLm5hbWUsXG4gICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uQ291bnQ6IGNvbGxlY3Rpb24uc3Vic2NyaXB0aW9ucy5pdGVtcy5zaXplLFxuICAgICAgICAgICAgICAgIHdhaXRGb3JDb3VudDogY29sbGVjdGlvbi53YWl0Rm9yLml0ZW1zLnNpemUsXG4gICAgICAgICAgICAgICAgbWF4UXVldWVTaXplOiBjb2xsZWN0aW9uLm1heFF1ZXVlU2l6ZSxcbiAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb25zOiBbLi4uY29sbGVjdGlvbi5zdWJzY3JpcHRpb25zLnZhbHVlcygpXS5tYXAoc3Vic2NyaXB0aW9uVG9TdGF0KSxcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGdldENoYW5nZUxvZyhfcGFyZW50OiBhbnksIGFyZ3M6IHsgaWQ6IHN0cmluZyB9LCBjb250ZXh0OiBDb250ZXh0KTogbnVtYmVyW10ge1xuICAgIHJldHVybiBjb250ZXh0LmRiLmNoYW5nZUxvZy5nZXQoYXJncy5pZCk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGdldENvbGxlY3Rpb25zKF9wYXJlbnQ6IGFueSwgX2FyZ3M6IGFueSwgY29udGV4dDogQ29udGV4dCk6IFByb21pc2U8Q29sbGVjdGlvblN1bW1hcnlbXT4ge1xuICAgIGNvbnN0IGRiOiBBcmFuZ28gPSBjb250ZXh0LmRiO1xuICAgIGNvbnN0IGNvbGxlY3Rpb25zOiBDb2xsZWN0aW9uU3VtbWFyeVtdID0gW107XG4gICAgZm9yIChjb25zdCBjb2xsZWN0aW9uIG9mIGRiLmNvbGxlY3Rpb25zKSB7XG4gICAgICAgIGNvbnN0IGluZGV4ZXM6IHN0cmluZ1tdID0gW107XG4gICAgICAgIGNvbnN0IGRiQ29sbGVjdGlvbiA9IGNvbGxlY3Rpb24uZGJDb2xsZWN0aW9uKCk7XG4gICAgICAgIGZvciAoY29uc3QgaW5kZXggb2YgYXdhaXQgZGJDb2xsZWN0aW9uLmluZGV4ZXMoKSkge1xuICAgICAgICAgICAgaW5kZXhlcy5wdXNoKGluZGV4LmZpZWxkcy5qb2luKCcsICcpKTtcbiAgICAgICAgfVxuICAgICAgICBjb2xsZWN0aW9ucy5wdXNoKHtcbiAgICAgICAgICAgIGNvbGxlY3Rpb246IGNvbGxlY3Rpb24ubmFtZSxcbiAgICAgICAgICAgIGNvdW50OiAoYXdhaXQgZGJDb2xsZWN0aW9uLmNvdW50KCkpLmNvdW50LFxuICAgICAgICAgICAgaW5kZXhlcyxcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBjb2xsZWN0aW9ucztcbn1cblxuLy8gTXV0YXRpb25cblxuZnVuY3Rpb24gc2V0Q2hhbmdlTG9nKF9wYXJlbnQ6IGFueSwgYXJnczogeyBvcDogc3RyaW5nIH0sIGNvbnRleHQ6IENvbnRleHQpOiBudW1iZXIge1xuICAgIGlmIChhcmdzLm9wID09PSAnQ0xFQVInKSB7XG4gICAgICAgIGNvbnRleHQuZGIuY2hhbmdlTG9nLmNsZWFyKCk7XG4gICAgfSBlbHNlIGlmIChhcmdzLm9wID09PSAnT04nKSB7XG4gICAgICAgIGNvbnRleHQuZGIuY2hhbmdlTG9nLmVuYWJsZWQgPSB0cnVlO1xuICAgIH0gZWxzZSBpZiAoYXJncy5vcCA9PT0gJ09GRicpIHtcbiAgICAgICAgY29udGV4dC5kYi5jaGFuZ2VMb2cuZW5hYmxlZCA9IGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gMTtcbn1cblxuZXhwb3J0IGNvbnN0IHJlc29sdmVyc01hbSA9IHtcbiAgICBRdWVyeToge1xuICAgICAgICBpbmZvLFxuICAgICAgICBnZXRDaGFuZ2VMb2csXG4gICAgICAgIGdldENvbGxlY3Rpb25zLFxuICAgICAgICBzdGF0XG4gICAgfSxcbiAgICBNdXRhdGlvbjoge1xuICAgICAgICBzZXRDaGFuZ2VMb2csXG4gICAgfSxcbn07XG4iXX0=