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
      var collection = new _arangoCollection.Collection(name, docType, logs, _this.changeLog, _this.tracer, _this.db);

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28uanMiXSwibmFtZXMiOlsiQXJhbmdvIiwiY29uZmlnIiwibG9ncyIsInRyYWNlciIsImxvZyIsImNyZWF0ZSIsImNoYW5nZUxvZyIsIkNoYW5nZUxvZyIsInNlcnZlckFkZHJlc3MiLCJkYXRhYmFzZSIsInNlcnZlciIsImRhdGFiYXNlTmFtZSIsIm5hbWUiLCJkYiIsIkRhdGFiYXNlIiwidXJsIiwidXNlRGF0YWJhc2UiLCJhdXRoIiwiYXV0aFBhcnRzIiwic3BsaXQiLCJ1c2VCYXNpY0F1dGgiLCJzbGljZSIsImpvaW4iLCJjb2xsZWN0aW9ucyIsImNvbGxlY3Rpb25zQnlOYW1lIiwiTWFwIiwiYWRkQ29sbGVjdGlvbiIsImRvY1R5cGUiLCJjb2xsZWN0aW9uIiwiQ29sbGVjdGlvbiIsInB1c2giLCJzZXQiLCJ0cmFuc2FjdGlvbnMiLCJUcmFuc2FjdGlvbiIsIm1lc3NhZ2VzIiwiTWVzc2FnZSIsImFjY291bnRzIiwiQWNjb3VudCIsImJsb2NrcyIsIkJsb2NrIiwiYmxvY2tzX3NpZ25hdHVyZXMiLCJCbG9ja1NpZ25hdHVyZXMiLCJsaXN0ZW5lclVybCIsImxpc3RlbmVyIiwiYXJhbmdvY2hhaXIiLCJ1c2VyUGFzc3dvcmQiLCJCdWZmZXIiLCJmcm9tIiwidG9TdHJpbmciLCJyZXEiLCJvcHRzIiwiaGVhZGVycyIsImZvckVhY2giLCJzdWJzY3JpYmUiLCJvbiIsImRvY0pzb24iLCJ0eXBlIiwib25Eb2N1bWVudEluc2VydE9yVXBkYXRlIiwiSlNPTiIsInBhcnNlIiwic3RhcnQiLCJkZWJ1ZyIsImVyciIsImVycm9yIiwic2V0VGltZW91dCIsInJlc3RhcnRUaW1lb3V0IiwiZG9jIiwiZW5hYmxlZCIsIl9rZXkiLCJEYXRlIiwibm93IiwiZ2V0IiwicXVlcnkiLCJiaW5kVmFycyIsImNvbnRleHQiLCJzdGFydFNwYW5Mb2ciLCJzcGFuIiwiY3Vyc29yIiwicmVzIiwiYWxsIiwiZmluaXNoIl0sIm1hcHBpbmdzIjoi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RUFSb0M7QUFBQTtBQUFBLGlDQVMxQ0gsSUFBSSxDQUFDSSxNQUFMLEVBVDBDOztBQUFBO0FBQUEsMkRBVXpDRixHQVZ5Qzs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxpQkFBN0MsRyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgMjAxOC0yMDE5IFRPTiBERVYgU09MVVRJT05TIExURC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgU09GVFdBUkUgRVZBTFVBVElPTiBMaWNlbnNlICh0aGUgXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2VcbiAqIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZVxuICogTGljZW5zZSBhdDpcbiAqXG4gKiBodHRwOi8vd3d3LnRvbi5kZXYvbGljZW5zZXNcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIFRPTiBERVYgc29mdHdhcmUgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLy8gQGZsb3dcblxuaW1wb3J0IGFyYW5nb2NoYWlyIGZyb20gJ2FyYW5nb2NoYWlyJztcbmltcG9ydCB7IERhdGFiYXNlIH0gZnJvbSAnYXJhbmdvanMnO1xuaW1wb3J0IHsgQ2hhbmdlTG9nLCBDb2xsZWN0aW9uLCB3cmFwIH0gZnJvbSBcIi4vYXJhbmdvLWNvbGxlY3Rpb25cIjtcbmltcG9ydCB0eXBlIHsgUUNvbmZpZyB9IGZyb20gJy4vY29uZmlnJ1xuaW1wb3J0IHsgZW5zdXJlUHJvdG9jb2wgfSBmcm9tICcuL2NvbmZpZyc7XG5pbXBvcnQgdHlwZSB7IFFMb2cgfSBmcm9tICcuL2xvZ3MnO1xuaW1wb3J0IFFMb2dzIGZyb20gJy4vbG9ncydcbmltcG9ydCB0eXBlIHsgUVR5cGUgfSBmcm9tICcuL3EtdHlwZXMnO1xuaW1wb3J0IHsgQWNjb3VudCwgQmxvY2ssIEJsb2NrU2lnbmF0dXJlcywgTWVzc2FnZSwgVHJhbnNhY3Rpb24gfSBmcm9tICcuL3Jlc29sdmVycy1nZW5lcmF0ZWQnO1xuaW1wb3J0IHsgVHJhY2VyIH0gZnJvbSBcIi4vdHJhY2VyXCI7XG5cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQXJhbmdvIHtcbiAgICBjb25maWc6IFFDb25maWc7XG4gICAgbG9nOiBRTG9nO1xuICAgIHNlcnZlckFkZHJlc3M6IHN0cmluZztcbiAgICBkYXRhYmFzZU5hbWU6IHN0cmluZztcbiAgICBkYjogRGF0YWJhc2U7XG5cbiAgICBjaGFuZ2VMb2c6IENoYW5nZUxvZztcbiAgICB0cmFjZXI6IFRyYWNlcjtcblxuICAgIHRyYW5zYWN0aW9uczogQ29sbGVjdGlvbjtcbiAgICBtZXNzYWdlczogQ29sbGVjdGlvbjtcbiAgICBhY2NvdW50czogQ29sbGVjdGlvbjtcbiAgICBibG9ja3M6IENvbGxlY3Rpb247XG4gICAgYmxvY2tzX3NpZ25hdHVyZXM6IENvbGxlY3Rpb247XG5cbiAgICBjb2xsZWN0aW9uczogQ29sbGVjdGlvbltdO1xuICAgIGNvbGxlY3Rpb25zQnlOYW1lOiBNYXA8c3RyaW5nLCBDb2xsZWN0aW9uPjtcblxuICAgIGxpc3RlbmVyOiBhbnk7XG5cbiAgICBjb25zdHJ1Y3Rvcihjb25maWc6IFFDb25maWcsIGxvZ3M6IFFMb2dzLCB0cmFjZXI6IFRyYWNlcikge1xuICAgICAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgICAgICAgdGhpcy5sb2cgPSBsb2dzLmNyZWF0ZSgnZGInKTtcbiAgICAgICAgdGhpcy5jaGFuZ2VMb2cgPSBuZXcgQ2hhbmdlTG9nKCk7XG4gICAgICAgIHRoaXMuc2VydmVyQWRkcmVzcyA9IGNvbmZpZy5kYXRhYmFzZS5zZXJ2ZXI7XG4gICAgICAgIHRoaXMuZGF0YWJhc2VOYW1lID0gY29uZmlnLmRhdGFiYXNlLm5hbWU7XG4gICAgICAgIHRoaXMudHJhY2VyID0gdHJhY2VyO1xuXG4gICAgICAgIHRoaXMuZGIgPSBuZXcgRGF0YWJhc2Uoe1xuICAgICAgICAgICAgdXJsOiBgJHtlbnN1cmVQcm90b2NvbCh0aGlzLnNlcnZlckFkZHJlc3MsICdodHRwJyl9YCxcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuZGIudXNlRGF0YWJhc2UodGhpcy5kYXRhYmFzZU5hbWUpO1xuICAgICAgICBpZiAodGhpcy5jb25maWcuZGF0YWJhc2UuYXV0aCkge1xuICAgICAgICAgICAgY29uc3QgYXV0aFBhcnRzID0gdGhpcy5jb25maWcuZGF0YWJhc2UuYXV0aC5zcGxpdCgnOicpO1xuICAgICAgICAgICAgdGhpcy5kYi51c2VCYXNpY0F1dGgoYXV0aFBhcnRzWzBdLCBhdXRoUGFydHMuc2xpY2UoMSkuam9pbignOicpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY29sbGVjdGlvbnMgPSBbXTtcbiAgICAgICAgdGhpcy5jb2xsZWN0aW9uc0J5TmFtZSA9IG5ldyBNYXAoKTtcblxuICAgICAgICBjb25zdCBhZGRDb2xsZWN0aW9uID0gKG5hbWU6IHN0cmluZywgZG9jVHlwZTogUVR5cGUpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbGxlY3Rpb24gPSBuZXcgQ29sbGVjdGlvbihcbiAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgICAgIGRvY1R5cGUsXG4gICAgICAgICAgICAgICAgbG9ncyxcbiAgICAgICAgICAgICAgICB0aGlzLmNoYW5nZUxvZyxcbiAgICAgICAgICAgICAgICB0aGlzLnRyYWNlcixcbiAgICAgICAgICAgICAgICB0aGlzLmRiXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgdGhpcy5jb2xsZWN0aW9ucy5wdXNoKGNvbGxlY3Rpb24pO1xuICAgICAgICAgICAgdGhpcy5jb2xsZWN0aW9uc0J5TmFtZS5zZXQobmFtZSwgY29sbGVjdGlvbik7XG4gICAgICAgICAgICByZXR1cm4gY29sbGVjdGlvbjtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnRyYW5zYWN0aW9ucyA9IGFkZENvbGxlY3Rpb24oJ3RyYW5zYWN0aW9ucycsIFRyYW5zYWN0aW9uKTtcbiAgICAgICAgdGhpcy5tZXNzYWdlcyA9IGFkZENvbGxlY3Rpb24oJ21lc3NhZ2VzJywgTWVzc2FnZSk7XG4gICAgICAgIHRoaXMuYWNjb3VudHMgPSBhZGRDb2xsZWN0aW9uKCdhY2NvdW50cycsIEFjY291bnQpO1xuICAgICAgICB0aGlzLmJsb2NrcyA9IGFkZENvbGxlY3Rpb24oJ2Jsb2NrcycsIEJsb2NrKTtcbiAgICAgICAgdGhpcy5ibG9ja3Nfc2lnbmF0dXJlcyA9IGFkZENvbGxlY3Rpb24oJ2Jsb2Nrc19zaWduYXR1cmVzJywgQmxvY2tTaWduYXR1cmVzKTtcbiAgICB9XG5cbiAgICBzdGFydCgpIHtcbiAgICAgICAgY29uc3QgbGlzdGVuZXJVcmwgPSBgJHtlbnN1cmVQcm90b2NvbCh0aGlzLnNlcnZlckFkZHJlc3MsICdodHRwJyl9LyR7dGhpcy5kYXRhYmFzZU5hbWV9YDtcbiAgICAgICAgdGhpcy5saXN0ZW5lciA9IG5ldyBhcmFuZ29jaGFpcihsaXN0ZW5lclVybCk7XG5cbiAgICAgICAgaWYgKHRoaXMuY29uZmlnLmRhdGFiYXNlLmF1dGgpIHtcbiAgICAgICAgICAgIGNvbnN0IHVzZXJQYXNzd29yZCA9IEJ1ZmZlci5mcm9tKHRoaXMuY29uZmlnLmRhdGFiYXNlLmF1dGgpLnRvU3RyaW5nKCdiYXNlNjQnKTtcbiAgICAgICAgICAgIHRoaXMubGlzdGVuZXIucmVxLm9wdHMuaGVhZGVyc1snQXV0aG9yaXphdGlvbiddID0gYEJhc2ljICR7dXNlclBhc3N3b3JkfWA7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNvbGxlY3Rpb25zLmZvckVhY2goY29sbGVjdGlvbiA9PiB7XG4gICAgICAgICAgICBjb25zdCBuYW1lID0gY29sbGVjdGlvbi5uYW1lO1xuICAgICAgICAgICAgdGhpcy5saXN0ZW5lci5zdWJzY3JpYmUoeyBjb2xsZWN0aW9uOiBuYW1lIH0pO1xuICAgICAgICAgICAgdGhpcy5saXN0ZW5lci5vbihuYW1lLCAoZG9jSnNvbiwgdHlwZSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlID09PSAnaW5zZXJ0L3VwZGF0ZScpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vbkRvY3VtZW50SW5zZXJ0T3JVcGRhdGUobmFtZSwgSlNPTi5wYXJzZShkb2NKc29uKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmxpc3RlbmVyLnN0YXJ0KCk7XG4gICAgICAgIHRoaXMubG9nLmRlYnVnKCdMSVNURU4nLCBsaXN0ZW5lclVybCk7XG4gICAgICAgIHRoaXMubGlzdGVuZXIub24oJ2Vycm9yJywgKGVycikgPT4ge1xuICAgICAgICAgICAgdGhpcy5sb2cuZXJyb3IoJ0ZBSUxFRCcsICdMSVNURU4nLCBgJHtlcnJ9YCk7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHRoaXMubGlzdGVuZXIuc3RhcnQoKSwgdGhpcy5jb25maWcubGlzdGVuZXIucmVzdGFydFRpbWVvdXQpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBvbkRvY3VtZW50SW5zZXJ0T3JVcGRhdGUobmFtZTogc3RyaW5nLCBkb2M6IGFueSkge1xuICAgICAgICBpZiAodGhpcy5jaGFuZ2VMb2cuZW5hYmxlZCkge1xuICAgICAgICAgICAgdGhpcy5jaGFuZ2VMb2cubG9nKGRvYy5fa2V5LCBEYXRlLm5vdygpKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjb2xsZWN0aW9uOiAoQ29sbGVjdGlvbiB8IHR5cGVvZiB1bmRlZmluZWQpID0gdGhpcy5jb2xsZWN0aW9uc0J5TmFtZS5nZXQobmFtZSk7XG4gICAgICAgIGlmIChjb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICBjb2xsZWN0aW9uLm9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZShkb2MpO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBhc3luYyBmZXRjaFF1ZXJ5KHF1ZXJ5OiBhbnksIGJpbmRWYXJzOiBhbnksIGNvbnRleHQ6IGFueSkge1xuICAgICAgICByZXR1cm4gd3JhcCh0aGlzLmxvZywgJ1FVRVJZJywgeyBxdWVyeSwgYmluZFZhcnMgfSwgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgY29uc3Qgc3BhbiA9IGF3YWl0IHRoaXMudHJhY2VyLnN0YXJ0U3BhbkxvZyhcbiAgICAgICAgICAgICAgICBjb250ZXh0LFxuICAgICAgICAgICAgICAgICdhcmFuZ28uanM6ZmV0Y2hRdWVyeScsXG4gICAgICAgICAgICAgICAgJ25ldyBxdWVyeScsXG4gICAgICAgICAgICAgICAgcXVlcnksXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgY29uc3QgY3Vyc29yID0gYXdhaXQgdGhpcy5kYi5xdWVyeSh7IHF1ZXJ5LCBiaW5kVmFycyB9KTtcbiAgICAgICAgICAgIGNvbnN0IHJlcyA9IGN1cnNvci5hbGwoKTtcbiAgICAgICAgICAgIGF3YWl0IHNwYW4uZmluaXNoKCk7XG4gICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICB9KTtcbiAgICB9XG59XG4iXX0=