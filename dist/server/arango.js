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

var _apolloServer = require("apollo-server");

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
    (0, _defineProperty2["default"])(this, "pubsub", void 0);
    this.config = config;
    this.log = logs.create('db');
    this.changeLog = new _arangoCollection.ChangeLog();
    this.serverAddress = config.database.server;
    this.databaseName = config.database.name;
    this.tracer = tracer;
    this.pubsub = new _apolloServer.PubSub();
    this.db = new _arangojs.Database({
      url: "".concat((0, _config.ensureProtocol)(this.serverAddress, 'http'))
    });
    this.db.useDatabase(this.databaseName);

    if (this.config.database.auth) {
      var authParts = this.config.database.auth.split(':');
      this.db.useBasicAuth(authParts[0], authParts.slice(1).join(':'));
    }

    this.collections = [];
    this.collectionsByName = new Map();

    var addCollection = function addCollection(name, docType) {
      var collection = new _arangoCollection.Collection(name, docType, _this.pubsub, logs, _this.changeLog, _this.tracer, _this.db);

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28uanMiXSwibmFtZXMiOlsiQXJhbmdvIiwiY29uZmlnIiwibG9ncyIsInRyYWNlciIsImxvZyIsImNyZWF0ZSIsImNoYW5nZUxvZyIsIkNoYW5nZUxvZyIsInNlcnZlckFkZHJlc3MiLCJkYXRhYmFzZSIsInNlcnZlciIsImRhdGFiYXNlTmFtZSIsIm5hbWUiLCJwdWJzdWIiLCJQdWJTdWIiLCJkYiIsIkRhdGFiYXNlIiwidXJsIiwidXNlRGF0YWJhc2UiLCJhdXRoIiwiYXV0aFBhcnRzIiwic3BsaXQiLCJ1c2VCYXNpY0F1dGgiLCJzbGljZSIsImpvaW4iLCJjb2xsZWN0aW9ucyIsImNvbGxlY3Rpb25zQnlOYW1lIiwiTWFwIiwiYWRkQ29sbGVjdGlvbiIsImRvY1R5cGUiLCJjb2xsZWN0aW9uIiwiQ29sbGVjdGlvbiIsInB1c2giLCJzZXQiLCJ0cmFuc2FjdGlvbnMiLCJUcmFuc2FjdGlvbiIsIm1lc3NhZ2VzIiwiTWVzc2FnZSIsImFjY291bnRzIiwiQWNjb3VudCIsImJsb2NrcyIsIkJsb2NrIiwiYmxvY2tzX3NpZ25hdHVyZXMiLCJCbG9ja1NpZ25hdHVyZXMiLCJsaXN0ZW5lclVybCIsImxpc3RlbmVyIiwiYXJhbmdvY2hhaXIiLCJ1c2VyUGFzc3dvcmQiLCJCdWZmZXIiLCJmcm9tIiwidG9TdHJpbmciLCJyZXEiLCJvcHRzIiwiaGVhZGVycyIsImZvckVhY2giLCJzdWJzY3JpYmUiLCJvbiIsImRvY0pzb24iLCJ0eXBlIiwib25Eb2N1bWVudEluc2VydE9yVXBkYXRlIiwiSlNPTiIsInBhcnNlIiwic3RhcnQiLCJkZWJ1ZyIsImVyciIsImVycm9yIiwic2V0VGltZW91dCIsInJlc3RhcnRUaW1lb3V0IiwiZG9jIiwiZW5hYmxlZCIsIl9rZXkiLCJEYXRlIiwibm93IiwiZ2V0IiwicXVlcnkiLCJiaW5kVmFycyIsImNvbnRleHQiLCJzdGFydFNwYW5Mb2ciLCJzcGFuIiwiY3Vyc29yIiwicmVzIiwiYWxsIiwiZmlu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QUFSQTtBQUFULDJCQUFkLENBUDJCOztBQUFBO0FBTzFDSSwwQkFBQUEsTUFQMEM7QUFRMUNDLDBCQUFBQSxHQVIwQyxHQVFwQ0QsTUFBTSxDQUFDRSxHQUFQLEVBUm9DO0FBQUE7QUFBQSxpQ0FTMUNILElBQUksQ0FBQ0ksTUFBTCxFQVQwQzs7QUFBQTtBQUFBLDJEQVV6Q0YsR0FWeUM7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsaUJBQTdDLEciLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IDIwMTgtMjAxOSBUT04gREVWIFNPTFVUSU9OUyBMVEQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIFNPRlRXQVJFIEVWQUxVQVRJT04gTGljZW5zZSAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlXG4gKiB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGVcbiAqIExpY2Vuc2UgYXQ6XG4gKlxuICogaHR0cDovL3d3dy50b24uZGV2L2xpY2Vuc2VzXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBUT04gREVWIHNvZnR3YXJlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8vIEBmbG93XG5cbmltcG9ydCB7IFB1YlN1YiB9IGZyb20gJ2Fwb2xsby1zZXJ2ZXInO1xuaW1wb3J0IGFyYW5nb2NoYWlyIGZyb20gJ2FyYW5nb2NoYWlyJztcbmltcG9ydCB7IERhdGFiYXNlIH0gZnJvbSAnYXJhbmdvanMnO1xuaW1wb3J0IHsgQ2hhbmdlTG9nLCBDb2xsZWN0aW9uLCB3cmFwIH0gZnJvbSBcIi4vYXJhbmdvLWNvbGxlY3Rpb25cIjtcbmltcG9ydCB0eXBlIHsgUUNvbmZpZyB9IGZyb20gJy4vY29uZmlnJ1xuaW1wb3J0IHsgZW5zdXJlUHJvdG9jb2wgfSBmcm9tICcuL2NvbmZpZyc7XG5pbXBvcnQgdHlwZSB7IFFMb2cgfSBmcm9tICcuL2xvZ3MnO1xuaW1wb3J0IFFMb2dzIGZyb20gJy4vbG9ncydcbmltcG9ydCB0eXBlIHsgUVR5cGUgfSBmcm9tICcuL3EtdHlwZXMnO1xuaW1wb3J0IHsgQWNjb3VudCwgQmxvY2ssIEJsb2NrU2lnbmF0dXJlcywgTWVzc2FnZSwgVHJhbnNhY3Rpb24gfSBmcm9tICcuL3Jlc29sdmVycy1nZW5lcmF0ZWQnO1xuaW1wb3J0IHsgVHJhY2VyIH0gZnJvbSBcIi4vdHJhY2VyXCI7XG5cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQXJhbmdvIHtcbiAgICBjb25maWc6IFFDb25maWc7XG4gICAgbG9nOiBRTG9nO1xuICAgIHNlcnZlckFkZHJlc3M6IHN0cmluZztcbiAgICBkYXRhYmFzZU5hbWU6IHN0cmluZztcbiAgICBkYjogRGF0YWJhc2U7XG5cbiAgICBjaGFuZ2VMb2c6IENoYW5nZUxvZztcbiAgICB0cmFjZXI6IFRyYWNlcjtcblxuICAgIHRyYW5zYWN0aW9uczogQ29sbGVjdGlvbjtcbiAgICBtZXNzYWdlczogQ29sbGVjdGlvbjtcbiAgICBhY2NvdW50czogQ29sbGVjdGlvbjtcbiAgICBibG9ja3M6IENvbGxlY3Rpb247XG4gICAgYmxvY2tzX3NpZ25hdHVyZXM6IENvbGxlY3Rpb247XG5cbiAgICBjb2xsZWN0aW9uczogQ29sbGVjdGlvbltdO1xuICAgIGNvbGxlY3Rpb25zQnlOYW1lOiBNYXA8c3RyaW5nLCBDb2xsZWN0aW9uPjtcblxuICAgIGxpc3RlbmVyOiBhbnk7XG4gICAgcHVic3ViOiBQdWJTdWI7XG5cbiAgICBjb25zdHJ1Y3Rvcihjb25maWc6IFFDb25maWcsIGxvZ3M6IFFMb2dzLCB0cmFjZXI6IFRyYWNlcikge1xuICAgICAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgICAgICAgdGhpcy5sb2cgPSBsb2dzLmNyZWF0ZSgnZGInKTtcbiAgICAgICAgdGhpcy5jaGFuZ2VMb2cgPSBuZXcgQ2hhbmdlTG9nKCk7XG4gICAgICAgIHRoaXMuc2VydmVyQWRkcmVzcyA9IGNvbmZpZy5kYXRhYmFzZS5zZXJ2ZXI7XG4gICAgICAgIHRoaXMuZGF0YWJhc2VOYW1lID0gY29uZmlnLmRhdGFiYXNlLm5hbWU7XG4gICAgICAgIHRoaXMudHJhY2VyID0gdHJhY2VyO1xuXG4gICAgICAgIHRoaXMucHVic3ViID0gbmV3IFB1YlN1YigpO1xuXG4gICAgICAgIHRoaXMuZGIgPSBuZXcgRGF0YWJhc2Uoe1xuICAgICAgICAgICAgdXJsOiBgJHtlbnN1cmVQcm90b2NvbCh0aGlzLnNlcnZlckFkZHJlc3MsICdodHRwJyl9YCxcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuZGIudXNlRGF0YWJhc2UodGhpcy5kYXRhYmFzZU5hbWUpO1xuICAgICAgICBpZiAodGhpcy5jb25maWcuZGF0YWJhc2UuYXV0aCkge1xuICAgICAgICAgICAgY29uc3QgYXV0aFBhcnRzID0gdGhpcy5jb25maWcuZGF0YWJhc2UuYXV0aC5zcGxpdCgnOicpO1xuICAgICAgICAgICAgdGhpcy5kYi51c2VCYXNpY0F1dGgoYXV0aFBhcnRzWzBdLCBhdXRoUGFydHMuc2xpY2UoMSkuam9pbignOicpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY29sbGVjdGlvbnMgPSBbXTtcbiAgICAgICAgdGhpcy5jb2xsZWN0aW9uc0J5TmFtZSA9IG5ldyBNYXAoKTtcblxuICAgICAgICBjb25zdCBhZGRDb2xsZWN0aW9uID0gKG5hbWU6IHN0cmluZywgZG9jVHlwZTogUVR5cGUpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbGxlY3Rpb24gPSBuZXcgQ29sbGVjdGlvbihcbiAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgICAgIGRvY1R5cGUsXG4gICAgICAgICAgICAgICAgdGhpcy5wdWJzdWIsXG4gICAgICAgICAgICAgICAgbG9ncyxcbiAgICAgICAgICAgICAgICB0aGlzLmNoYW5nZUxvZyxcbiAgICAgICAgICAgICAgICB0aGlzLnRyYWNlcixcbiAgICAgICAgICAgICAgICB0aGlzLmRiXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgdGhpcy5jb2xsZWN0aW9ucy5wdXNoKGNvbGxlY3Rpb24pO1xuICAgICAgICAgICAgdGhpcy5jb2xsZWN0aW9uc0J5TmFtZS5zZXQobmFtZSwgY29sbGVjdGlvbik7XG4gICAgICAgICAgICByZXR1cm4gY29sbGVjdGlvbjtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnRyYW5zYWN0aW9ucyA9IGFkZENvbGxlY3Rpb24oJ3RyYW5zYWN0aW9ucycsIFRyYW5zYWN0aW9uKTtcbiAgICAgICAgdGhpcy5tZXNzYWdlcyA9IGFkZENvbGxlY3Rpb24oJ21lc3NhZ2VzJywgTWVzc2FnZSk7XG4gICAgICAgIHRoaXMuYWNjb3VudHMgPSBhZGRDb2xsZWN0aW9uKCdhY2NvdW50cycsIEFjY291bnQpO1xuICAgICAgICB0aGlzLmJsb2NrcyA9IGFkZENvbGxlY3Rpb24oJ2Jsb2NrcycsIEJsb2NrKTtcbiAgICAgICAgdGhpcy5ibG9ja3Nfc2lnbmF0dXJlcyA9IGFkZENvbGxlY3Rpb24oJ2Jsb2Nrc19zaWduYXR1cmVzJywgQmxvY2tTaWduYXR1cmVzKTtcbiAgICB9XG5cbiAgICBzdGFydCgpIHtcbiAgICAgICAgY29uc3QgbGlzdGVuZXJVcmwgPSBgJHtlbnN1cmVQcm90b2NvbCh0aGlzLnNlcnZlckFkZHJlc3MsICdodHRwJyl9LyR7dGhpcy5kYXRhYmFzZU5hbWV9YDtcbiAgICAgICAgdGhpcy5saXN0ZW5lciA9IG5ldyBhcmFuZ29jaGFpcihsaXN0ZW5lclVybCk7XG5cbiAgICAgICAgaWYgKHRoaXMuY29uZmlnLmRhdGFiYXNlLmF1dGgpIHtcbiAgICAgICAgICAgIGNvbnN0IHVzZXJQYXNzd29yZCA9IEJ1ZmZlci5mcm9tKHRoaXMuY29uZmlnLmRhdGFiYXNlLmF1dGgpLnRvU3RyaW5nKCdiYXNlNjQnKTtcbiAgICAgICAgICAgIHRoaXMubGlzdGVuZXIucmVxLm9wdHMuaGVhZGVyc1snQXV0aG9yaXphdGlvbiddID0gYEJhc2ljICR7dXNlclBhc3N3b3JkfWA7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNvbGxlY3Rpb25zLmZvckVhY2goY29sbGVjdGlvbiA9PiB7XG4gICAgICAgICAgICBjb25zdCBuYW1lID0gY29sbGVjdGlvbi5uYW1lO1xuICAgICAgICAgICAgdGhpcy5saXN0ZW5lci5zdWJzY3JpYmUoeyBjb2xsZWN0aW9uOiBuYW1lIH0pO1xuICAgICAgICAgICAgdGhpcy5saXN0ZW5lci5vbihuYW1lLCAoZG9jSnNvbiwgdHlwZSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlID09PSAnaW5zZXJ0L3VwZGF0ZScpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vbkRvY3VtZW50SW5zZXJ0T3JVcGRhdGUobmFtZSwgSlNPTi5wYXJzZShkb2NKc29uKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmxpc3RlbmVyLnN0YXJ0KCk7XG4gICAgICAgIHRoaXMubG9nLmRlYnVnKCdMSVNURU4nLCBsaXN0ZW5lclVybCk7XG4gICAgICAgIHRoaXMubGlzdGVuZXIub24oJ2Vycm9yJywgKGVycikgPT4ge1xuICAgICAgICAgICAgdGhpcy5sb2cuZXJyb3IoJ0ZBSUxFRCcsICdMSVNURU4nLCBgJHtlcnJ9YCk7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHRoaXMubGlzdGVuZXIuc3RhcnQoKSwgdGhpcy5jb25maWcubGlzdGVuZXIucmVzdGFydFRpbWVvdXQpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBvbkRvY3VtZW50SW5zZXJ0T3JVcGRhdGUobmFtZTogc3RyaW5nLCBkb2M6IGFueSkge1xuICAgICAgICBpZiAodGhpcy5jaGFuZ2VMb2cuZW5hYmxlZCkge1xuICAgICAgICAgICAgdGhpcy5jaGFuZ2VMb2cubG9nKGRvYy5fa2V5LCBEYXRlLm5vdygpKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjb2xsZWN0aW9uOiAoQ29sbGVjdGlvbiB8IHR5cGVvZiB1bmRlZmluZWQpID0gdGhpcy5jb2xsZWN0aW9uc0J5TmFtZS5nZXQobmFtZSk7XG4gICAgICAgIGlmIChjb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICBjb2xsZWN0aW9uLm9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZShkb2MpO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBhc3luYyBmZXRjaFF1ZXJ5KHF1ZXJ5OiBhbnksIGJpbmRWYXJzOiBhbnksIGNvbnRleHQ6IGFueSkge1xuICAgICAgICByZXR1cm4gd3JhcCh0aGlzLmxvZywgJ1FVRVJZJywgeyBxdWVyeSwgYmluZFZhcnMgfSwgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgY29uc3Qgc3BhbiA9IGF3YWl0IHRoaXMudHJhY2VyLnN0YXJ0U3BhbkxvZyhcbiAgICAgICAgICAgICAgICBjb250ZXh0LFxuICAgICAgICAgICAgICAgICdhcmFuZ28uanM6ZmV0Y2hRdWVyeScsXG4gICAgICAgICAgICAgICAgJ25ldyBxdWVyeScsXG4gICAgICAgICAgICAgICAgcXVlcnksXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgY29uc3QgY3Vyc29yID0gYXdhaXQgdGhpcy5kYi5xdWVyeSh7IHF1ZXJ5LCBiaW5kVmFycyB9KTtcbiAgICAgICAgICAgIGNvbnN0IHJlcyA9IGN1cnNvci5hbGwoKTtcbiAgICAgICAgICAgIGF3YWl0IHNwYW4uZmluaXNoKCk7XG4gICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICB9KTtcbiAgICB9XG59XG4iXX0=