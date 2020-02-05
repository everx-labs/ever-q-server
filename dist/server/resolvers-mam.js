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