"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.resolversMam = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _arangojs = require("arangojs");

var _fs = _interopRequireDefault(require("fs"));

var _arango = _interopRequireDefault(require("./arango"));

var _path = _interopRequireDefault(require("path"));

// Query
function info() {
  var pkg = JSON.parse(_fs["default"].readFileSync(_path["default"].resolve(__dirname, '..', '..', 'package.json')));
  return {
    version: pkg.version
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
    getCollections: getCollections
  },
  Mutation: {
    setChangeLog: setChangeLog
  }
};
exports.resolversMam = resolversMam;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9yZXNvbHZlcnMtbWFtLmpzIl0sIm5hbWVzIjpbImluZm8iLCJwa2ciLCJKU09OIiwicGFyc2UiLCJmcyIsInJlYWRGaWxlU3luYyIsInBhdGgiLCJyZXNvbHZlIiwiX19kaXJuYW1lIiwidmVyc2lvbiIsImdldENoYW5nZUxvZyIsIl9wYXJlbnQiLCJhcmdzIiwiY29udGV4dCIsImRiIiwiY2hhbmdlTG9nIiwiZ2V0IiwiaWQiLCJnZXRDb2xsZWN0aW9ucyIsIl9hcmdzIiwiY29sbGVjdGlvbnMiLCJjb2xsZWN0aW9uIiwiaW5kZXhlcyIsImRiQ29sbGVjdGlvbiIsImluZGV4IiwicHVzaCIsImZpZWxkcyIsImpvaW4iLCJuYW1lIiwiY291bnQiLCJzZXRDaGFuZ2VMb2ciLCJvcCIsImNsZWFyIiwiZW5hYmxlZCIsInJlc29sdmVyc01hbSIsIlF1ZXJ5IiwiTXV0YXRpb24iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7QUFFQTs7QUFDQTs7QUFDQTs7QUFFQTs7QUFrQkE7QUFFQSxTQUFTQSxJQUFULEdBQXNCO0FBQ2xCLE1BQU1DLEdBQUcsR0FBR0MsSUFBSSxDQUFDQyxLQUFMLENBQVlDLGVBQUdDLFlBQUgsQ0FBZ0JDLGlCQUFLQyxPQUFMLENBQWFDLFNBQWIsRUFBd0IsSUFBeEIsRUFBOEIsSUFBOUIsRUFBb0MsY0FBcEMsQ0FBaEIsQ0FBWixDQUFaO0FBQ0EsU0FBTztBQUNIQyxJQUFBQSxPQUFPLEVBQUVSLEdBQUcsQ0FBQ1E7QUFEVixHQUFQO0FBR0g7O0FBRUQsU0FBU0MsWUFBVCxDQUFzQkMsT0FBdEIsRUFBb0NDLElBQXBDLEVBQTBEQyxPQUExRCxFQUFzRjtBQUNsRixTQUFPQSxPQUFPLENBQUNDLEVBQVIsQ0FBV0MsU0FBWCxDQUFxQkMsR0FBckIsQ0FBeUJKLElBQUksQ0FBQ0ssRUFBOUIsQ0FBUDtBQUNIOztTQUVjQyxjOztFQWtCZjs7Ozs7OytCQWxCQSxpQkFBOEJQLE9BQTlCLEVBQTRDUSxLQUE1QyxFQUF3RE4sT0FBeEQ7QUFBQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUNVQyxZQUFBQSxFQURWLEdBQ3VCRCxPQUFPLENBQUNDLEVBRC9CO0FBRVVNLFlBQUFBLFdBRlYsR0FFNkMsRUFGN0M7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLHdCQUc2Qk4sRUFBRSxDQUFDTSxXQUhoQzs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOztBQUdlQyxZQUFBQSxXQUhmO0FBSWNDLFlBQUFBLFFBSmQsR0FJa0MsRUFKbEM7QUFLY0MsWUFBQUEsYUFMZCxHQUs2QkYsV0FBVSxDQUFDRSxZQUFYLEVBTDdCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLG1CQU1rQ0EsYUFBWSxDQUFDRCxPQUFiLEVBTmxDOztBQUFBO0FBQUE7QUFBQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOztBQU1tQkUsWUFBQUEsTUFObkI7O0FBT1lGLFlBQUFBLFFBQU8sQ0FBQ0csSUFBUixDQUFhRCxNQUFLLENBQUNFLE1BQU4sQ0FBYUMsSUFBYixDQUFrQixJQUFsQixDQUFiOztBQVBaO0FBQUE7QUFBQTtBQUFBOztBQUFBO0FBQUE7QUFBQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOztBQUFBO0FBQUE7QUFBQTs7QUFBQTtBQUFBO0FBQUE7O0FBQUE7QUFBQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFBQTs7QUFBQTtBQUFBOztBQUFBO0FBQUE7O0FBQUE7QUFBQSwwQkFTUVAsV0FUUjtBQUFBLDBCQVV3QkMsV0FBVSxDQUFDTyxJQVZuQztBQUFBO0FBQUEsbUJBVzBCTCxhQUFZLENBQUNNLEtBQWIsRUFYMUI7O0FBQUE7QUFBQSx3Q0FXZ0RBLEtBWGhEO0FBQUEsMEJBWVlQLFFBWlo7QUFBQTtBQVVZRCxjQUFBQSxVQVZaO0FBV1lRLGNBQUFBLEtBWFo7QUFZWVAsY0FBQUEsT0FaWjtBQUFBOztBQUFBLHdCQVNvQkcsSUFUcEI7O0FBQUE7QUFBQTtBQUFBO0FBQUE7O0FBQUE7QUFBQTtBQUFBOztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7O0FBQUE7QUFBQTtBQUFBOztBQUFBO0FBQUE7QUFBQTs7QUFBQTtBQUFBOztBQUFBO0FBQUE7QUFBQTtBQUFBOztBQUFBOztBQUFBO0FBQUE7O0FBQUE7QUFBQTs7QUFBQTtBQUFBLDZDQWVXTCxXQWZYOztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEc7Ozs7QUFvQkEsU0FBU1UsWUFBVCxDQUFzQm5CLE9BQXRCLEVBQW9DQyxJQUFwQyxFQUEwREMsT0FBMUQsRUFBb0Y7QUFDaEYsTUFBSUQsSUFBSSxDQUFDbUIsRUFBTCxLQUFZLE9BQWhCLEVBQXlCO0FBQ3JCbEIsSUFBQUEsT0FBTyxDQUFDQyxFQUFSLENBQVdDLFNBQVgsQ0FBcUJpQixLQUFyQjtBQUNILEdBRkQsTUFFTyxJQUFJcEIsSUFBSSxDQUFDbUIsRUFBTCxLQUFZLElBQWhCLEVBQXNCO0FBQ3pCbEIsSUFBQUEsT0FBTyxDQUFDQyxFQUFSLENBQVdDLFNBQVgsQ0FBcUJrQixPQUFyQixHQUErQixJQUEvQjtBQUNILEdBRk0sTUFFQSxJQUFJckIsSUFBSSxDQUFDbUIsRUFBTCxLQUFZLEtBQWhCLEVBQXVCO0FBQzFCbEIsSUFBQUEsT0FBTyxDQUFDQyxFQUFSLENBQVdDLFNBQVgsQ0FBcUJrQixPQUFyQixHQUErQixLQUEvQjtBQUNIOztBQUNELFNBQU8sQ0FBUDtBQUNIOztBQUVNLElBQU1DLFlBQVksR0FBRztBQUN4QkMsRUFBQUEsS0FBSyxFQUFFO0FBQ0huQyxJQUFBQSxJQUFJLEVBQUpBLElBREc7QUFFSFUsSUFBQUEsWUFBWSxFQUFaQSxZQUZHO0FBR0hRLElBQUFBLGNBQWMsRUFBZEE7QUFIRyxHQURpQjtBQU14QmtCLEVBQUFBLFFBQVEsRUFBRTtBQUNOTixJQUFBQSxZQUFZLEVBQVpBO0FBRE07QUFOYyxDQUFyQiIsInNvdXJjZXNDb250ZW50IjpbIi8vIEBmbG93XG5cbmltcG9ydCB7IERhdGFiYXNlIH0gZnJvbSBcImFyYW5nb2pzXCI7XG5pbXBvcnQgZnMgZnJvbSBcImZzXCI7XG5pbXBvcnQgQXJhbmdvIGZyb20gXCIuL2FyYW5nb1wiO1xuaW1wb3J0IHR5cGUgeyBRQ29uZmlnIH0gZnJvbSBcIi4vY29uZmlnXCI7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcblxudHlwZSBDb250ZXh0ID0ge1xuICAgIGRiOiBBcmFuZ28sXG4gICAgY29uZmlnOiBRQ29uZmlnLFxuICAgIHNoYXJlZDogTWFwPHN0cmluZywgYW55Pixcbn1cblxudHlwZSBJbmZvID0ge1xuICAgIHZlcnNpb246IHN0cmluZyxcbn1cblxudHlwZSBDb2xsZWN0aW9uU3VtbWFyeSA9IHtcbiAgICBjb2xsZWN0aW9uOiBzdHJpbmcsXG4gICAgY291bnQ6IG51bWJlcixcbiAgICBpbmRleGVzOiBzdHJpbmdbXSxcbn1cblxuLy8gUXVlcnlcblxuZnVuY3Rpb24gaW5mbygpOiBJbmZvIHtcbiAgICBjb25zdCBwa2cgPSBKU09OLnBhcnNlKChmcy5yZWFkRmlsZVN5bmMocGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4uJywgJy4uJywgJ3BhY2thZ2UuanNvbicpKTogYW55KSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdmVyc2lvbjogcGtnLnZlcnNpb24sXG4gICAgfTtcbn1cblxuZnVuY3Rpb24gZ2V0Q2hhbmdlTG9nKF9wYXJlbnQ6IGFueSwgYXJnczogeyBpZDogc3RyaW5nIH0sIGNvbnRleHQ6IENvbnRleHQpOiBudW1iZXJbXSB7XG4gICAgcmV0dXJuIGNvbnRleHQuZGIuY2hhbmdlTG9nLmdldChhcmdzLmlkKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZ2V0Q29sbGVjdGlvbnMoX3BhcmVudDogYW55LCBfYXJnczogYW55LCBjb250ZXh0OiBDb250ZXh0KTogUHJvbWlzZTxDb2xsZWN0aW9uU3VtbWFyeVtdPiB7XG4gICAgY29uc3QgZGI6IEFyYW5nbyA9IGNvbnRleHQuZGI7XG4gICAgY29uc3QgY29sbGVjdGlvbnM6IENvbGxlY3Rpb25TdW1tYXJ5W10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IGNvbGxlY3Rpb24gb2YgZGIuY29sbGVjdGlvbnMpIHtcbiAgICAgICAgY29uc3QgaW5kZXhlczogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgY29uc3QgZGJDb2xsZWN0aW9uID0gY29sbGVjdGlvbi5kYkNvbGxlY3Rpb24oKTtcbiAgICAgICAgZm9yIChjb25zdCBpbmRleCBvZiBhd2FpdCBkYkNvbGxlY3Rpb24uaW5kZXhlcygpKSB7XG4gICAgICAgICAgICBpbmRleGVzLnB1c2goaW5kZXguZmllbGRzLmpvaW4oJywgJykpO1xuICAgICAgICB9XG4gICAgICAgIGNvbGxlY3Rpb25zLnB1c2goe1xuICAgICAgICAgICAgY29sbGVjdGlvbjogY29sbGVjdGlvbi5uYW1lLFxuICAgICAgICAgICAgY291bnQ6IChhd2FpdCBkYkNvbGxlY3Rpb24uY291bnQoKSkuY291bnQsXG4gICAgICAgICAgICBpbmRleGVzLFxuICAgICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbGxlY3Rpb25zO1xufVxuXG4vLyBNdXRhdGlvblxuXG5mdW5jdGlvbiBzZXRDaGFuZ2VMb2coX3BhcmVudDogYW55LCBhcmdzOiB7IG9wOiBzdHJpbmcgfSwgY29udGV4dDogQ29udGV4dCk6IG51bWJlciB7XG4gICAgaWYgKGFyZ3Mub3AgPT09ICdDTEVBUicpIHtcbiAgICAgICAgY29udGV4dC5kYi5jaGFuZ2VMb2cuY2xlYXIoKTtcbiAgICB9IGVsc2UgaWYgKGFyZ3Mub3AgPT09ICdPTicpIHtcbiAgICAgICAgY29udGV4dC5kYi5jaGFuZ2VMb2cuZW5hYmxlZCA9IHRydWU7XG4gICAgfSBlbHNlIGlmIChhcmdzLm9wID09PSAnT0ZGJykge1xuICAgICAgICBjb250ZXh0LmRiLmNoYW5nZUxvZy5lbmFibGVkID0gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiAxO1xufVxuXG5leHBvcnQgY29uc3QgcmVzb2x2ZXJzTWFtID0ge1xuICAgIFF1ZXJ5OiB7XG4gICAgICAgIGluZm8sXG4gICAgICAgIGdldENoYW5nZUxvZyxcbiAgICAgICAgZ2V0Q29sbGVjdGlvbnMsXG4gICAgfSxcbiAgICBNdXRhdGlvbjoge1xuICAgICAgICBzZXRDaGFuZ2VMb2csXG4gICAgfSxcbn07XG4iXX0=