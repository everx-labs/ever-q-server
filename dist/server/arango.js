"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _arangochair = _interopRequireDefault(require("arangochair"));

var _arangojs = require("arangojs");

var _arangoCollection = require("./arango-collection");

var _config = require("./config");

var _logs = _interopRequireDefault(require("./logs"));

var _resolversGenerated = require("./resolvers-generated");

var _tracer = require("./tracer");

/*
 * Copyright 2018-2019 TON DEV SOLUTIONS LTD.
 *
 * Licensed under the SOFTWARE EVALUATION License (the "License"); you may not use
 * this file except in compliance with the License.  You may obtain a copy of the
 * License at:
 *
 * http://www.ton.dev/licenses
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific TON DEV software governing permissions and
 * limitations under the License.
 */
var Arango =
/*#__PURE__*/
function () {
  function Arango(config, logs, tracer) {
    var _this = this;

    (0, _classCallCheck2["default"])(this, Arango);
    (0, _defineProperty2["default"])(this, "config", void 0);
    (0, _defineProperty2["default"])(this, "log", void 0);
    (0, _defineProperty2["default"])(this, "serverAddress", void 0);
    (0, _defineProperty2["default"])(this, "databaseName", void 0);
    (0, _defineProperty2["default"])(this, "db", void 0);
    (0, _defineProperty2["default"])(this, "slowDb", void 0);
    (0, _defineProperty2["default"])(this, "changeLog", void 0);
    (0, _defineProperty2["default"])(this, "tracer", void 0);
    (0, _defineProperty2["default"])(this, "transactions", void 0);
    (0, _defineProperty2["default"])(this, "messages", void 0);
    (0, _defineProperty2["default"])(this, "accounts", void 0);
    (0, _defineProperty2["default"])(this, "blocks", void 0);
    (0, _defineProperty2["default"])(this, "blocks_signatures", void 0);
    (0, _defineProperty2["default"])(this, "collections", void 0);
    (0, _defineProperty2["default"])(this, "collectionsByName", void 0);
    (0, _defineProperty2["default"])(this, "listener", void 0);
    this.config = config;
    this.log = logs.create('db');
    this.changeLog = new _arangoCollection.ChangeLog();
    this.serverAddress = config.database.server;
    this.databaseName = config.database.name;
    this.tracer = tracer;

    var createDb = function createDb(config) {
      var db = new _arangojs.Database({
        url: "".concat((0, _config.ensureProtocol)(config.server, 'http')),
        agentOptions: {
          maxSockets: config.maxSockets
        }
      });
      db.useDatabase(config.name);

      if (config.auth) {
        var authParts = config.auth.split(':');
        db.useBasicAuth(authParts[0], authParts.slice(1).join(':'));
      }

      return db;
    };

    this.db = createDb(config.database);
    var slowDb = createDb(config.slowDatabase);
    this.collections = [];
    this.collectionsByName = new Map();

    var addCollection = function addCollection(name, docType) {
      var collection = new _arangoCollection.Collection(name, docType, logs, _this.changeLog, _this.tracer, _this.db, slowDb);

      _this.collections.push(collection);

      _this.collectionsByName.set(name, collection);

      return collection;
    };

    this.transactions = addCollection('transactions', _resolversGenerated.Transaction);
    this.messages = addCollection('messages', _resolversGenerated.Message);
    this.accounts = addCollection('accounts', _resolversGenerated.Account);
    this.blocks = addCollection('blocks', _resolversGenerated.Block);
    this.blocks_signatures = addCollection('blocks_signatures', _resolversGenerated.BlockSignatures);
  }

  (0, _createClass2["default"])(Arango, [{
    key: "start",
    value: function start() {
      var _this2 = this;

      var listenerUrl = "".concat((0, _config.ensureProtocol)(this.serverAddress, 'http'), "/").concat(this.databaseName);
      this.listener = new _arangochair["default"](listenerUrl);

      if (this.config.database.auth) {
        var userPassword = Buffer.from(this.config.database.auth).toString('base64');
        this.listener.req.opts.headers['Authorization'] = "Basic ".concat(userPassword);
      }

      this.collections.forEach(function (collection) {
        var name = collection.name;

        _this2.listener.subscribe({
          collection: name
        });

        _this2.listener.on(name, function (docJson, type) {
          if (type === 'insert/update') {
            _this2.onDocumentInsertOrUpdate(name, JSON.parse(docJson));
          }
        });
      });
      this.listener.start();
      this.log.debug('LISTEN', listenerUrl);
      this.listener.on('error', function (err) {
        _this2.log.error('FAILED', 'LISTEN', "".concat(err));

        setTimeout(function () {
          return _this2.listener.start();
        }, _this2.config.listener.restartTimeout);
      });
    }
  }, {
    key: "onDocumentInsertOrUpdate",
    value: function onDocumentInsertOrUpdate(name, doc) {
      if (this.changeLog.enabled) {
        this.changeLog.log(doc._key, Date.now());
      }

      var collection = this.collectionsByName.get(name);

      if (collection) {
        collection.onDocumentInsertOrUpdate(doc);
      }
    }
  }, {
    key: "fetchQuery",
    value: function () {
      var _fetchQuery = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee2(query, bindVars, context) {
        var _this3 = this;

        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                return _context2.abrupt("return", (0, _arangoCollection.wrap)(this.log, 'QUERY', {
                  query: query,
                  bindVars: bindVars
                },
                /*#__PURE__*/
                (0, _asyncToGenerator2["default"])(
                /*#__PURE__*/
                _regenerator["default"].mark(function _callee() {
                  var span, cursor, res;
                  return _regenerator["default"].wrap(function _callee$(_context) {
                    while (1) {
                      switch (_context.prev = _context.next) {
                        case 0:
                          _context.next = 2;
                          return _this3.tracer.startSpanLog(context, 'arango.js:fetchQuery', 'new query', query);

                        case 2:
                          span = _context.sent;
                          _context.next = 5;
                          return _this3.db.query({
                            query: query,
                            bindVars: bindVars
                          });

                        case 5:
                          cursor = _context.sent;
                          res = cursor.all();
                          _context.next = 9;
                          return span.finish();

                        case 9:
                          return _context.abrupt("return", res);

                        case 10:
                        case "end":
                          return _context.stop();
                      }
                    }
                  }, _callee);
                }))));

              case 1:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function fetchQuery(_x, _x2, _x3) {
        return _fetchQuery.apply(this, arguments);
      }

      return fetchQuery;
    }()
  }]);
  return Arango;
}();

exports["default"] = Arango;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28uanMiXSwibmFtZXMiOlsiQXJhbmdvIiwiY29uZmlnIiwibG9ncyIsInRyYWNlciIsImxvZyIsImNyZWF0ZSIsImNoYW5nZUxvZyIsIkNoYW5nZUxvZyIsInNlcnZlckFkZHJlc3MiLCJkYXRhYmFzZSIsInNlcnZlciIsImRhdGFiYXNlTmFtZSIsIm5hbWUiLCJjcmVhdGVEYiIsImRiIiwiRGF0YWJhc2UiLCJ1cmwiLCJhZ2VudE9wdGlvbnMiLCJtYXhTb2NrZXRzIiwidXNlRGF0YWJhc2UiLCJhdXRoIiwiYXV0aFBhcnRzIiwic3BsaXQiLCJ1c2VCYXNpY0F1dGgiLCJzbGljZSIsImpvaW4iLCJzbG93RGIiLCJzbG93RGF0YWJhc2UiLCJjb2xsZWN0aW9ucyIsImNvbGxlY3Rpb25zQnlOYW1lIiwiTWFwIiwiYWRkQ29sbGVjdGlvbiIsImRvY1R5cGUiLCJjb2xsZWN0aW9uIiwiQ29sbGVjdGlvbiIsInB1c2giLCJzZXQiLCJ0cmFuc2FjdGlvbnMiLCJUcmFuc2FjdGlvbiIsIm1lc3NhZ2VzIiwiTWVzc2FnZSIsImFjY291bnRzIiwiQWNjb3VudCIsImJsb2NrcyIsIkJsb2NrIiwiYmxvY2tzX3NpZ25hdHVyZXMiLCJCbG9ja1NpZ25hdHVyZXMiLCJsaXN0ZW5lclVybCIsImxpc3RlbmVyIiwiYXJhbmdvY2hhaXIiLCJ1c2VyUGFzc3dvcmQiLCJCdWZmZXIiLCJmcm9tIiwidG9TdHJpbmciLCJyZXEiLCJvcHRzIiwiaGVhZGVycyIsImZvckVhY2giLCJzdWJzY3JpYmUiLCJvbiIsImRvY0pzb24iLCJ0eXBlIiwib25Eb2N1bWVudEluc2VydE9yVXBkYXRlIiwiSlNPTiIsInBhcnNlIiwic3RhcnQiLCJkZWJ1ZyIsImVyciIsImVycm9yIiwic2V0VGltZW91dCIsInJlc3RhcnRUaW1lb3V0IiwiZG9jIiwiZW5hYmxlZCIsIl9rZXkiLCJEYXRlIiwibm93IiwiZ2V0IiwicXVlcnkiLCJiaW5kVmFycyIsImNvbnRleHQiLCJzdGFydFNwYW5Mb2ciLCJzcGFuIiwiY3Vyc29yIiwicmVzIiwiYWxsIiwiZmluaXNoIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBa0JBOztBQUNBOztBQUNBOztBQUVBOztBQUVBOztBQUVBOztBQUNBOztBQTNCQTs7Ozs7Ozs7Ozs7Ozs7O0lBOEJxQkEsTTs7O0FBc0JqQixrQkFBWUMsTUFBWixFQUE2QkMsSUFBN0IsRUFBMENDLE1BQTFDLEVBQTBEO0FBQUE7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUN0RCxTQUFLRixNQUFMLEdBQWNBLE1BQWQ7QUFDQSxTQUFLRyxHQUFMLEdBQVdGLElBQUksQ0FBQ0csTUFBTCxDQUFZLElBQVosQ0FBWDtBQUNBLFNBQUtDLFNBQUwsR0FBaUIsSUFBSUMsMkJBQUosRUFBakI7QUFDQSxTQUFLQyxhQUFMLEdBQXFCUCxNQUFNLENBQUNRLFFBQVAsQ0FBZ0JDLE1BQXJDO0FBQ0EsU0FBS0MsWUFBTCxHQUFvQlYsTUFBTSxDQUFDUSxRQUFQLENBQWdCRyxJQUFwQztBQUNBLFNBQUtULE1BQUwsR0FBY0EsTUFBZDs7QUFFQSxRQUFNVSxRQUFRLEdBQUcsU0FBWEEsUUFBVyxDQUFDWixNQUFELEVBQWlDO0FBQzlDLFVBQU1hLEVBQUUsR0FBRyxJQUFJQyxrQkFBSixDQUFhO0FBQ3BCQyxRQUFBQSxHQUFHLFlBQUssNEJBQWVmLE1BQU0sQ0FBQ1MsTUFBdEIsRUFBOEIsTUFBOUIsQ0FBTCxDQURpQjtBQUVwQk8sUUFBQUEsWUFBWSxFQUFFO0FBQ1ZDLFVBQUFBLFVBQVUsRUFBRWpCLE1BQU0sQ0FBQ2lCO0FBRFQ7QUFGTSxPQUFiLENBQVg7QUFNQUosTUFBQUEsRUFBRSxDQUFDSyxXQUFILENBQWVsQixNQUFNLENBQUNXLElBQXRCOztBQUNBLFVBQUlYLE1BQU0sQ0FBQ21CLElBQVgsRUFBaUI7QUFDYixZQUFNQyxTQUFTLEdBQUdwQixNQUFNLENBQUNtQixJQUFQLENBQVlFLEtBQVosQ0FBa0IsR0FBbEIsQ0FBbEI7QUFDQVIsUUFBQUEsRUFBRSxDQUFDUyxZQUFILENBQWdCRixTQUFTLENBQUMsQ0FBRCxDQUF6QixFQUE4QkEsU0FBUyxDQUFDRyxLQUFWLENBQWdCLENBQWhCLEVBQW1CQyxJQUFuQixDQUF3QixHQUF4QixDQUE5QjtBQUNIOztBQUNELGFBQU9YLEVBQVA7QUFDSCxLQWJEOztBQWVBLFNBQUtBLEVBQUwsR0FBVUQsUUFBUSxDQUFDWixNQUFNLENBQUNRLFFBQVIsQ0FBbEI7QUFDQSxRQUFNaUIsTUFBTSxHQUFHYixRQUFRLENBQUNaLE1BQU0sQ0FBQzBCLFlBQVIsQ0FBdkI7QUFFQSxTQUFLQyxXQUFMLEdBQW1CLEVBQW5CO0FBQ0EsU0FBS0MsaUJBQUwsR0FBeUIsSUFBSUMsR0FBSixFQUF6Qjs7QUFFQSxRQUFNQyxhQUFhLEdBQUcsU0FBaEJBLGFBQWdCLENBQUNuQixJQUFELEVBQWVvQixPQUFmLEVBQWtDO0FBQ3BELFVBQU1DLFVBQVUsR0FBRyxJQUFJQyw0QkFBSixDQUNmdEIsSUFEZSxFQUVmb0IsT0FGZSxFQUdmOUIsSUFIZSxFQUlmLEtBQUksQ0FBQ0ksU0FKVSxFQUtmLEtBQUksQ0FBQ0gsTUFMVSxFQU1mLEtBQUksQ0FBQ1csRUFOVSxFQU9mWSxNQVBlLENBQW5COztBQVNBLE1BQUEsS0FBSSxDQUFDRSxXQUFMLENBQWlCTyxJQUFqQixDQUFzQkYsVUFBdEI7O0FBQ0EsTUFBQSxLQUFJLENBQUNKLGlCQUFMLENBQXVCTyxHQUF2QixDQUEyQnhCLElBQTNCLEVBQWlDcUIsVUFBakM7O0FBQ0EsYUFBT0EsVUFBUDtBQUNILEtBYkQ7O0FBZUEsU0FBS0ksWUFBTCxHQUFvQk4sYUFBYSxDQUFDLGNBQUQsRUFBaUJPLCtCQUFqQixDQUFqQztBQUNBLFNBQUtDLFFBQUwsR0FBZ0JSLGFBQWEsQ0FBQyxVQUFELEVBQWFTLDJCQUFiLENBQTdCO0FBQ0EsU0FBS0MsUUFBTCxHQUFnQlYsYUFBYSxDQUFDLFVBQUQsRUFBYVcsMkJBQWIsQ0FBN0I7QUFDQSxTQUFLQyxNQUFMLEdBQWNaLGFBQWEsQ0FBQyxRQUFELEVBQVdhLHlCQUFYLENBQTNCO0FBQ0EsU0FBS0MsaUJBQUwsR0FBeUJkLGFBQWEsQ0FBQyxtQkFBRCxFQUFzQmUsbUNBQXRCLENBQXRDO0FBQ0g7Ozs7NEJBRU87QUFBQTs7QUFDSixVQUFNQyxXQUFXLGFBQU0sNEJBQWUsS0FBS3ZDLGFBQXBCLEVBQW1DLE1BQW5DLENBQU4sY0FBb0QsS0FBS0csWUFBekQsQ0FBakI7QUFDQSxXQUFLcUMsUUFBTCxHQUFnQixJQUFJQyx1QkFBSixDQUFnQkYsV0FBaEIsQ0FBaEI7O0FBRUEsVUFBSSxLQUFLOUMsTUFBTCxDQUFZUSxRQUFaLENBQXFCVyxJQUF6QixFQUErQjtBQUMzQixZQUFNOEIsWUFBWSxHQUFHQyxNQUFNLENBQUNDLElBQVAsQ0FBWSxLQUFLbkQsTUFBTCxDQUFZUSxRQUFaLENBQXFCVyxJQUFqQyxFQUF1Q2lDLFFBQXZDLENBQWdELFFBQWhELENBQXJCO0FBQ0EsYUFBS0wsUUFBTCxDQUFjTSxHQUFkLENBQWtCQyxJQUFsQixDQUF1QkMsT0FBdkIsQ0FBK0IsZUFBL0Isb0JBQTJETixZQUEzRDtBQUNIOztBQUVELFdBQUt0QixXQUFMLENBQWlCNkIsT0FBakIsQ0FBeUIsVUFBQXhCLFVBQVUsRUFBSTtBQUNuQyxZQUFNckIsSUFBSSxHQUFHcUIsVUFBVSxDQUFDckIsSUFBeEI7O0FBQ0EsUUFBQSxNQUFJLENBQUNvQyxRQUFMLENBQWNVLFNBQWQsQ0FBd0I7QUFBRXpCLFVBQUFBLFVBQVUsRUFBRXJCO0FBQWQsU0FBeEI7O0FBQ0EsUUFBQSxNQUFJLENBQUNvQyxRQUFMLENBQWNXLEVBQWQsQ0FBaUIvQyxJQUFqQixFQUF1QixVQUFDZ0QsT0FBRCxFQUFVQyxJQUFWLEVBQW1CO0FBQ3RDLGNBQUlBLElBQUksS0FBSyxlQUFiLEVBQThCO0FBQzFCLFlBQUEsTUFBSSxDQUFDQyx3QkFBTCxDQUE4QmxELElBQTlCLEVBQW9DbUQsSUFBSSxDQUFDQyxLQUFMLENBQVdKLE9BQVgsQ0FBcEM7QUFDSDtBQUNKLFNBSkQ7QUFLSCxPQVJEO0FBU0EsV0FBS1osUUFBTCxDQUFjaUIsS0FBZDtBQUNBLFdBQUs3RCxHQUFMLENBQVM4RCxLQUFULENBQWUsUUFBZixFQUF5Qm5CLFdBQXpCO0FBQ0EsV0FBS0MsUUFBTCxDQUFjVyxFQUFkLENBQWlCLE9BQWpCLEVBQTBCLFVBQUNRLEdBQUQsRUFBUztBQUMvQixRQUFBLE1BQUksQ0FBQy9ELEdBQUwsQ0FBU2dFLEtBQVQsQ0FBZSxRQUFmLEVBQXlCLFFBQXpCLFlBQXNDRCxHQUF0Qzs7QUFDQUUsUUFBQUEsVUFBVSxDQUFDO0FBQUEsaUJBQU0sTUFBSSxDQUFDckIsUUFBTCxDQUFjaUIsS0FBZCxFQUFOO0FBQUEsU0FBRCxFQUE4QixNQUFJLENBQUNoRSxNQUFMLENBQVkrQyxRQUFaLENBQXFCc0IsY0FBbkQsQ0FBVjtBQUNILE9BSEQ7QUFJSDs7OzZDQUV3QjFELEksRUFBYzJELEcsRUFBVTtBQUM3QyxVQUFJLEtBQUtqRSxTQUFMLENBQWVrRSxPQUFuQixFQUE0QjtBQUN4QixhQUFLbEUsU0FBTCxDQUFlRixHQUFmLENBQW1CbUUsR0FBRyxDQUFDRSxJQUF2QixFQUE2QkMsSUFBSSxDQUFDQyxHQUFMLEVBQTdCO0FBQ0g7O0FBQ0QsVUFBTTFDLFVBQTJDLEdBQUcsS0FBS0osaUJBQUwsQ0FBdUIrQyxHQUF2QixDQUEyQmhFLElBQTNCLENBQXBEOztBQUNBLFVBQUlxQixVQUFKLEVBQWdCO0FBQ1pBLFFBQUFBLFVBQVUsQ0FBQzZCLHdCQUFYLENBQW9DUyxHQUFwQztBQUNIO0FBQ0o7Ozs7OztxREFHZ0JNLEssRUFBWUMsUSxFQUFlQyxPOzs7Ozs7O2tEQUNqQyw0QkFBSyxLQUFLM0UsR0FBVixFQUFlLE9BQWYsRUFBd0I7QUFBRXlFLGtCQUFBQSxLQUFLLEVBQUxBLEtBQUY7QUFBU0Msa0JBQUFBLFFBQVEsRUFBUkE7QUFBVCxpQkFBeEI7QUFBQTtBQUFBO0FBQUE7QUFBQSw2Q0FBNkM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxpQ0FDN0IsTUFBSSxDQUFDM0UsTUFBTCxDQUFZNkUsWUFBWixDQUNmRCxPQURlLEVBRWYsc0JBRmUsRUFHZixXQUhlLEVBSWZGLEtBSmUsQ0FENkI7O0FBQUE7QUFDMUNJLDBCQUFBQSxJQUQwQztBQUFBO0FBQUEsaUNBTzNCLE1BQUksQ0FBQ25FLEVBQUwsQ0FBUStELEtBQVIsQ0FBYztBQUFFQSw0QkFBQUEsS0FBSyxFQUFMQSxLQUFGO0FBQVNDLDRCQUFBQSxRQUFRLEVBQVJBO0FBQVQsMkJBQWQsQ0FQMkI7O0FBQUE7QUFPMUNJLDBCQUFBQSxNQVAwQztBQVExQ0MsMEJBQUFBLEdBUjBDLEdBUXBDRCxNQUFNLENBQUNFLEdBQVAsRUFSb0M7QUFBQTtBQUFBLGlDQVMxQ0gsSUFBSSxDQUFDSSxNQUFMLEVBVDBDOztBQUFBO0FBQUEsMkRBVXpDRixHQVZ5Qzs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxpQkFBN0MsRyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgMjAxOC0yMDE5IFRPTiBERVYgU09MVVRJT05TIExURC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgU09GVFdBUkUgRVZBTFVBVElPTiBMaWNlbnNlICh0aGUgXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2VcbiAqIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZVxuICogTGljZW5zZSBhdDpcbiAqXG4gKiBodHRwOi8vd3d3LnRvbi5kZXYvbGljZW5zZXNcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIFRPTiBERVYgc29mdHdhcmUgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLy8gQGZsb3dcblxuaW1wb3J0IGFyYW5nb2NoYWlyIGZyb20gJ2FyYW5nb2NoYWlyJztcbmltcG9ydCB7IERhdGFiYXNlIH0gZnJvbSAnYXJhbmdvanMnO1xuaW1wb3J0IHsgQ2hhbmdlTG9nLCBDb2xsZWN0aW9uLCB3cmFwIH0gZnJvbSBcIi4vYXJhbmdvLWNvbGxlY3Rpb25cIjtcbmltcG9ydCB0eXBlIHsgUUNvbmZpZywgUURiQ29uZmlnIH0gZnJvbSAnLi9jb25maWcnXG5pbXBvcnQgeyBlbnN1cmVQcm90b2NvbCB9IGZyb20gJy4vY29uZmlnJztcbmltcG9ydCB0eXBlIHsgUUxvZyB9IGZyb20gJy4vbG9ncyc7XG5pbXBvcnQgUUxvZ3MgZnJvbSAnLi9sb2dzJ1xuaW1wb3J0IHR5cGUgeyBRVHlwZSB9IGZyb20gJy4vcS10eXBlcyc7XG5pbXBvcnQgeyBBY2NvdW50LCBCbG9jaywgQmxvY2tTaWduYXR1cmVzLCBNZXNzYWdlLCBUcmFuc2FjdGlvbiB9IGZyb20gJy4vcmVzb2x2ZXJzLWdlbmVyYXRlZCc7XG5pbXBvcnQgeyBUcmFjZXIgfSBmcm9tIFwiLi90cmFjZXJcIjtcblxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBBcmFuZ28ge1xuICAgIGNvbmZpZzogUUNvbmZpZztcbiAgICBsb2c6IFFMb2c7XG4gICAgc2VydmVyQWRkcmVzczogc3RyaW5nO1xuICAgIGRhdGFiYXNlTmFtZTogc3RyaW5nO1xuICAgIGRiOiBEYXRhYmFzZTtcbiAgICBzbG93RGI6IERhdGFiYXNlO1xuXG4gICAgY2hhbmdlTG9nOiBDaGFuZ2VMb2c7XG4gICAgdHJhY2VyOiBUcmFjZXI7XG5cbiAgICB0cmFuc2FjdGlvbnM6IENvbGxlY3Rpb247XG4gICAgbWVzc2FnZXM6IENvbGxlY3Rpb247XG4gICAgYWNjb3VudHM6IENvbGxlY3Rpb247XG4gICAgYmxvY2tzOiBDb2xsZWN0aW9uO1xuICAgIGJsb2Nrc19zaWduYXR1cmVzOiBDb2xsZWN0aW9uO1xuXG4gICAgY29sbGVjdGlvbnM6IENvbGxlY3Rpb25bXTtcbiAgICBjb2xsZWN0aW9uc0J5TmFtZTogTWFwPHN0cmluZywgQ29sbGVjdGlvbj47XG5cbiAgICBsaXN0ZW5lcjogYW55O1xuXG4gICAgY29uc3RydWN0b3IoY29uZmlnOiBRQ29uZmlnLCBsb2dzOiBRTG9ncywgdHJhY2VyOiBUcmFjZXIpIHtcbiAgICAgICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgICAgIHRoaXMubG9nID0gbG9ncy5jcmVhdGUoJ2RiJyk7XG4gICAgICAgIHRoaXMuY2hhbmdlTG9nID0gbmV3IENoYW5nZUxvZygpO1xuICAgICAgICB0aGlzLnNlcnZlckFkZHJlc3MgPSBjb25maWcuZGF0YWJhc2Uuc2VydmVyO1xuICAgICAgICB0aGlzLmRhdGFiYXNlTmFtZSA9IGNvbmZpZy5kYXRhYmFzZS5uYW1lO1xuICAgICAgICB0aGlzLnRyYWNlciA9IHRyYWNlcjtcblxuICAgICAgICBjb25zdCBjcmVhdGVEYiA9IChjb25maWc6IFFEYkNvbmZpZyk6IERhdGFiYXNlID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGRiID0gbmV3IERhdGFiYXNlKHtcbiAgICAgICAgICAgICAgICB1cmw6IGAke2Vuc3VyZVByb3RvY29sKGNvbmZpZy5zZXJ2ZXIsICdodHRwJyl9YCxcbiAgICAgICAgICAgICAgICBhZ2VudE9wdGlvbnM6IHtcbiAgICAgICAgICAgICAgICAgICAgbWF4U29ja2V0czogY29uZmlnLm1heFNvY2tldHMsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgZGIudXNlRGF0YWJhc2UoY29uZmlnLm5hbWUpO1xuICAgICAgICAgICAgaWYgKGNvbmZpZy5hdXRoKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYXV0aFBhcnRzID0gY29uZmlnLmF1dGguc3BsaXQoJzonKTtcbiAgICAgICAgICAgICAgICBkYi51c2VCYXNpY0F1dGgoYXV0aFBhcnRzWzBdLCBhdXRoUGFydHMuc2xpY2UoMSkuam9pbignOicpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBkYjtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmRiID0gY3JlYXRlRGIoY29uZmlnLmRhdGFiYXNlKTtcbiAgICAgICAgY29uc3Qgc2xvd0RiID0gY3JlYXRlRGIoY29uZmlnLnNsb3dEYXRhYmFzZSk7XG5cbiAgICAgICAgdGhpcy5jb2xsZWN0aW9ucyA9IFtdO1xuICAgICAgICB0aGlzLmNvbGxlY3Rpb25zQnlOYW1lID0gbmV3IE1hcCgpO1xuXG4gICAgICAgIGNvbnN0IGFkZENvbGxlY3Rpb24gPSAobmFtZTogc3RyaW5nLCBkb2NUeXBlOiBRVHlwZSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgY29sbGVjdGlvbiA9IG5ldyBDb2xsZWN0aW9uKFxuICAgICAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICAgICAgZG9jVHlwZSxcbiAgICAgICAgICAgICAgICBsb2dzLFxuICAgICAgICAgICAgICAgIHRoaXMuY2hhbmdlTG9nLFxuICAgICAgICAgICAgICAgIHRoaXMudHJhY2VyLFxuICAgICAgICAgICAgICAgIHRoaXMuZGIsXG4gICAgICAgICAgICAgICAgc2xvd0RiLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHRoaXMuY29sbGVjdGlvbnMucHVzaChjb2xsZWN0aW9uKTtcbiAgICAgICAgICAgIHRoaXMuY29sbGVjdGlvbnNCeU5hbWUuc2V0KG5hbWUsIGNvbGxlY3Rpb24pO1xuICAgICAgICAgICAgcmV0dXJuIGNvbGxlY3Rpb247XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy50cmFuc2FjdGlvbnMgPSBhZGRDb2xsZWN0aW9uKCd0cmFuc2FjdGlvbnMnLCBUcmFuc2FjdGlvbik7XG4gICAgICAgIHRoaXMubWVzc2FnZXMgPSBhZGRDb2xsZWN0aW9uKCdtZXNzYWdlcycsIE1lc3NhZ2UpO1xuICAgICAgICB0aGlzLmFjY291bnRzID0gYWRkQ29sbGVjdGlvbignYWNjb3VudHMnLCBBY2NvdW50KTtcbiAgICAgICAgdGhpcy5ibG9ja3MgPSBhZGRDb2xsZWN0aW9uKCdibG9ja3MnLCBCbG9jayk7XG4gICAgICAgIHRoaXMuYmxvY2tzX3NpZ25hdHVyZXMgPSBhZGRDb2xsZWN0aW9uKCdibG9ja3Nfc2lnbmF0dXJlcycsIEJsb2NrU2lnbmF0dXJlcyk7XG4gICAgfVxuXG4gICAgc3RhcnQoKSB7XG4gICAgICAgIGNvbnN0IGxpc3RlbmVyVXJsID0gYCR7ZW5zdXJlUHJvdG9jb2wodGhpcy5zZXJ2ZXJBZGRyZXNzLCAnaHR0cCcpfS8ke3RoaXMuZGF0YWJhc2VOYW1lfWA7XG4gICAgICAgIHRoaXMubGlzdGVuZXIgPSBuZXcgYXJhbmdvY2hhaXIobGlzdGVuZXJVcmwpO1xuXG4gICAgICAgIGlmICh0aGlzLmNvbmZpZy5kYXRhYmFzZS5hdXRoKSB7XG4gICAgICAgICAgICBjb25zdCB1c2VyUGFzc3dvcmQgPSBCdWZmZXIuZnJvbSh0aGlzLmNvbmZpZy5kYXRhYmFzZS5hdXRoKS50b1N0cmluZygnYmFzZTY0Jyk7XG4gICAgICAgICAgICB0aGlzLmxpc3RlbmVyLnJlcS5vcHRzLmhlYWRlcnNbJ0F1dGhvcml6YXRpb24nXSA9IGBCYXNpYyAke3VzZXJQYXNzd29yZH1gO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jb2xsZWN0aW9ucy5mb3JFYWNoKGNvbGxlY3Rpb24gPT4ge1xuICAgICAgICAgICAgY29uc3QgbmFtZSA9IGNvbGxlY3Rpb24ubmFtZTtcbiAgICAgICAgICAgIHRoaXMubGlzdGVuZXIuc3Vic2NyaWJlKHsgY29sbGVjdGlvbjogbmFtZSB9KTtcbiAgICAgICAgICAgIHRoaXMubGlzdGVuZXIub24obmFtZSwgKGRvY0pzb24sIHR5cGUpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZSA9PT0gJ2luc2VydC91cGRhdGUnKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub25Eb2N1bWVudEluc2VydE9yVXBkYXRlKG5hbWUsIEpTT04ucGFyc2UoZG9jSnNvbikpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5saXN0ZW5lci5zdGFydCgpO1xuICAgICAgICB0aGlzLmxvZy5kZWJ1ZygnTElTVEVOJywgbGlzdGVuZXJVcmwpO1xuICAgICAgICB0aGlzLmxpc3RlbmVyLm9uKCdlcnJvcicsIChlcnIpID0+IHtcbiAgICAgICAgICAgIHRoaXMubG9nLmVycm9yKCdGQUlMRUQnLCAnTElTVEVOJywgYCR7ZXJyfWApO1xuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLmxpc3RlbmVyLnN0YXJ0KCksIHRoaXMuY29uZmlnLmxpc3RlbmVyLnJlc3RhcnRUaW1lb3V0KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgb25Eb2N1bWVudEluc2VydE9yVXBkYXRlKG5hbWU6IHN0cmluZywgZG9jOiBhbnkpIHtcbiAgICAgICAgaWYgKHRoaXMuY2hhbmdlTG9nLmVuYWJsZWQpIHtcbiAgICAgICAgICAgIHRoaXMuY2hhbmdlTG9nLmxvZyhkb2MuX2tleSwgRGF0ZS5ub3coKSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY29sbGVjdGlvbjogKENvbGxlY3Rpb24gfCB0eXBlb2YgdW5kZWZpbmVkKSA9IHRoaXMuY29sbGVjdGlvbnNCeU5hbWUuZ2V0KG5hbWUpO1xuICAgICAgICBpZiAoY29sbGVjdGlvbikge1xuICAgICAgICAgICAgY29sbGVjdGlvbi5vbkRvY3VtZW50SW5zZXJ0T3JVcGRhdGUoZG9jKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgYXN5bmMgZmV0Y2hRdWVyeShxdWVyeTogYW55LCBiaW5kVmFyczogYW55LCBjb250ZXh0OiBhbnkpIHtcbiAgICAgICAgcmV0dXJuIHdyYXAodGhpcy5sb2csICdRVUVSWScsIHsgcXVlcnksIGJpbmRWYXJzIH0sIGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHNwYW4gPSBhd2FpdCB0aGlzLnRyYWNlci5zdGFydFNwYW5Mb2coXG4gICAgICAgICAgICAgICAgY29udGV4dCxcbiAgICAgICAgICAgICAgICAnYXJhbmdvLmpzOmZldGNoUXVlcnknLFxuICAgICAgICAgICAgICAgICduZXcgcXVlcnknLFxuICAgICAgICAgICAgICAgIHF1ZXJ5LFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGNvbnN0IGN1cnNvciA9IGF3YWl0IHRoaXMuZGIucXVlcnkoeyBxdWVyeSwgYmluZFZhcnMgfSk7XG4gICAgICAgICAgICBjb25zdCByZXMgPSBjdXJzb3IuYWxsKCk7XG4gICAgICAgICAgICBhd2FpdCBzcGFuLmZpbmlzaCgpO1xuICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgfSk7XG4gICAgfVxufVxuIl19