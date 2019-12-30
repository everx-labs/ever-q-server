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
      url: "".concat((0, _config.ensureProtocol)(this.serverAddress, 'http')),
      agentOptions: {
        maxSockets: 100
      }
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28uanMiXSwibmFtZXMiOlsiQXJhbmdvIiwiY29uZmlnIiwibG9ncyIsInRyYWNlciIsImxvZyIsImNyZWF0ZSIsImNoYW5nZUxvZyIsIkNoYW5nZUxvZyIsInNlcnZlckFkZHJlc3MiLCJkYXRhYmFzZSIsInNlcnZlciIsImRhdGFiYXNlTmFtZSIsIm5hbWUiLCJkYiIsIkRhdGFiYXNlIiwidXJsIiwiYWdlbnRPcHRpb25zIiwibWF4U29ja2V0cyIsInVzZURhdGFiYXNlIiwiYXV0aCIsImF1dGhQYXJ0cyIsInNwbGl0IiwidXNlQmFzaWNBdXRoIiwic2xpY2UiLCJqb2luIiwiY29sbGVjdGlvbnMiLCJjb2xsZWN0aW9uc0J5TmFtZSIsIk1hcCIsImFkZENvbGxlY3Rpb24iLCJkb2NUeXBlIiwiY29sbGVjdGlvbiIsIkNvbGxlY3Rpb24iLCJwdXNoIiwic2V0IiwidHJhbnNhY3Rpb25zIiwiVHJhbnNhY3Rpb24iLCJtZXNzYWdlcyIsIk1lc3NhZ2UiLCJhY2NvdW50cyIsIkFjY291bnQiLCJibG9ja3MiLCJCbG9jayIsImJsb2Nrc19zaWduYXR1cmVzIiwiQmxvY2tTaWduYXR1cmVzIiwibGlzdGVuZXJVcmwiLCJsaXN0ZW5lciIsImFyYW5nb2NoYWlyIiwidXNlclBhc3N3b3JkIiwiQnVmZmVyIiwiZnJvbSIsInRvU3RyaW5nIiwicmVxIiwib3B0cyIsImhlYWRlcnMiLCJmb3JFYWNoIiwic3Vic2NyaWJlIiwib24iLCJkb2NKc29uIiwidHlwZSIsIm9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZSIsIkpTT04iLCJwYXJzZSIsInN0YXJ0IiwiZGVidWciLCJlcnIiLCJlcnJvciIsInNldFRpbWVvdXQiLCJyZXN0YXJ0VGltZW91dCIsImRvYyIsImVuYWJsZWQiLCJfa2V5IiwiRGF0ZSIsIm5vdyIsImdldCIsInF1ZXJ5IiwiYmluZFZhcnMiLCJjb250ZXh0Iiwic3RhcnRTcGFuTG9nIiwic3BhbiIsImN1cnNvciIsInJlcyIs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QUFBVCwyQkFBZCxDQVAyQjs7QUFBQTtBQU8xQ0ksMEJBQUFBLE1BUDBDO0FBUTFDQywwQkFBQUEsR0FSMEMsR0FRcENELE1BQU0sQ0FBQ0UsR0FBUCxFQVJvQztBQUFBO0FBQUEsaUNBUzFDSCxJQUFJLENBQUNJLE1BQUwsRUFUMEM7O0FBQUE7QUFBQSwyREFVekNGLEdBVnlDOztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLGlCQUE3QyxHIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE4LTIwMTkgVE9OIERFViBTT0xVVElPTlMgTFRELlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBTT0ZUV0FSRSBFVkFMVUFUSU9OIExpY2Vuc2UgKHRoZSBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZVxuICogdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlXG4gKiBMaWNlbnNlIGF0OlxuICpcbiAqIGh0dHA6Ly93d3cudG9uLmRldi9saWNlbnNlc1xuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgVE9OIERFViBzb2Z0d2FyZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vLyBAZmxvd1xuXG5pbXBvcnQgYXJhbmdvY2hhaXIgZnJvbSAnYXJhbmdvY2hhaXInO1xuaW1wb3J0IHsgRGF0YWJhc2UgfSBmcm9tICdhcmFuZ29qcyc7XG5pbXBvcnQgeyBDaGFuZ2VMb2csIENvbGxlY3Rpb24sIHdyYXAgfSBmcm9tIFwiLi9hcmFuZ28tY29sbGVjdGlvblwiO1xuaW1wb3J0IHR5cGUgeyBRQ29uZmlnIH0gZnJvbSAnLi9jb25maWcnXG5pbXBvcnQgeyBlbnN1cmVQcm90b2NvbCB9IGZyb20gJy4vY29uZmlnJztcbmltcG9ydCB0eXBlIHsgUUxvZyB9IGZyb20gJy4vbG9ncyc7XG5pbXBvcnQgUUxvZ3MgZnJvbSAnLi9sb2dzJ1xuaW1wb3J0IHR5cGUgeyBRVHlwZSB9IGZyb20gJy4vcS10eXBlcyc7XG5pbXBvcnQgeyBBY2NvdW50LCBCbG9jaywgQmxvY2tTaWduYXR1cmVzLCBNZXNzYWdlLCBUcmFuc2FjdGlvbiB9IGZyb20gJy4vcmVzb2x2ZXJzLWdlbmVyYXRlZCc7XG5pbXBvcnQgeyBUcmFjZXIgfSBmcm9tIFwiLi90cmFjZXJcIjtcblxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBBcmFuZ28ge1xuICAgIGNvbmZpZzogUUNvbmZpZztcbiAgICBsb2c6IFFMb2c7XG4gICAgc2VydmVyQWRkcmVzczogc3RyaW5nO1xuICAgIGRhdGFiYXNlTmFtZTogc3RyaW5nO1xuICAgIGRiOiBEYXRhYmFzZTtcblxuICAgIGNoYW5nZUxvZzogQ2hhbmdlTG9nO1xuICAgIHRyYWNlcjogVHJhY2VyO1xuXG4gICAgdHJhbnNhY3Rpb25zOiBDb2xsZWN0aW9uO1xuICAgIG1lc3NhZ2VzOiBDb2xsZWN0aW9uO1xuICAgIGFjY291bnRzOiBDb2xsZWN0aW9uO1xuICAgIGJsb2NrczogQ29sbGVjdGlvbjtcbiAgICBibG9ja3Nfc2lnbmF0dXJlczogQ29sbGVjdGlvbjtcblxuICAgIGNvbGxlY3Rpb25zOiBDb2xsZWN0aW9uW107XG4gICAgY29sbGVjdGlvbnNCeU5hbWU6IE1hcDxzdHJpbmcsIENvbGxlY3Rpb24+O1xuXG4gICAgbGlzdGVuZXI6IGFueTtcblxuICAgIGNvbnN0cnVjdG9yKGNvbmZpZzogUUNvbmZpZywgbG9nczogUUxvZ3MsIHRyYWNlcjogVHJhY2VyKSB7XG4gICAgICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgICAgICB0aGlzLmxvZyA9IGxvZ3MuY3JlYXRlKCdkYicpO1xuICAgICAgICB0aGlzLmNoYW5nZUxvZyA9IG5ldyBDaGFuZ2VMb2coKTtcbiAgICAgICAgdGhpcy5zZXJ2ZXJBZGRyZXNzID0gY29uZmlnLmRhdGFiYXNlLnNlcnZlcjtcbiAgICAgICAgdGhpcy5kYXRhYmFzZU5hbWUgPSBjb25maWcuZGF0YWJhc2UubmFtZTtcbiAgICAgICAgdGhpcy50cmFjZXIgPSB0cmFjZXI7XG5cbiAgICAgICAgdGhpcy5kYiA9IG5ldyBEYXRhYmFzZSh7XG4gICAgICAgICAgICB1cmw6IGAke2Vuc3VyZVByb3RvY29sKHRoaXMuc2VydmVyQWRkcmVzcywgJ2h0dHAnKX1gLFxuICAgICAgICAgICAgYWdlbnRPcHRpb25zOiB7XG4gICAgICAgICAgICAgICAgbWF4U29ja2V0czogMTAwLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuZGIudXNlRGF0YWJhc2UodGhpcy5kYXRhYmFzZU5hbWUpO1xuICAgICAgICBpZiAodGhpcy5jb25maWcuZGF0YWJhc2UuYXV0aCkge1xuICAgICAgICAgICAgY29uc3QgYXV0aFBhcnRzID0gdGhpcy5jb25maWcuZGF0YWJhc2UuYXV0aC5zcGxpdCgnOicpO1xuICAgICAgICAgICAgdGhpcy5kYi51c2VCYXNpY0F1dGgoYXV0aFBhcnRzWzBdLCBhdXRoUGFydHMuc2xpY2UoMSkuam9pbignOicpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY29sbGVjdGlvbnMgPSBbXTtcbiAgICAgICAgdGhpcy5jb2xsZWN0aW9uc0J5TmFtZSA9IG5ldyBNYXAoKTtcblxuICAgICAgICBjb25zdCBhZGRDb2xsZWN0aW9uID0gKG5hbWU6IHN0cmluZywgZG9jVHlwZTogUVR5cGUpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbGxlY3Rpb24gPSBuZXcgQ29sbGVjdGlvbihcbiAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgICAgIGRvY1R5cGUsXG4gICAgICAgICAgICAgICAgbG9ncyxcbiAgICAgICAgICAgICAgICB0aGlzLmNoYW5nZUxvZyxcbiAgICAgICAgICAgICAgICB0aGlzLnRyYWNlcixcbiAgICAgICAgICAgICAgICB0aGlzLmRiXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgdGhpcy5jb2xsZWN0aW9ucy5wdXNoKGNvbGxlY3Rpb24pO1xuICAgICAgICAgICAgdGhpcy5jb2xsZWN0aW9uc0J5TmFtZS5zZXQobmFtZSwgY29sbGVjdGlvbik7XG4gICAgICAgICAgICByZXR1cm4gY29sbGVjdGlvbjtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnRyYW5zYWN0aW9ucyA9IGFkZENvbGxlY3Rpb24oJ3RyYW5zYWN0aW9ucycsIFRyYW5zYWN0aW9uKTtcbiAgICAgICAgdGhpcy5tZXNzYWdlcyA9IGFkZENvbGxlY3Rpb24oJ21lc3NhZ2VzJywgTWVzc2FnZSk7XG4gICAgICAgIHRoaXMuYWNjb3VudHMgPSBhZGRDb2xsZWN0aW9uKCdhY2NvdW50cycsIEFjY291bnQpO1xuICAgICAgICB0aGlzLmJsb2NrcyA9IGFkZENvbGxlY3Rpb24oJ2Jsb2NrcycsIEJsb2NrKTtcbiAgICAgICAgdGhpcy5ibG9ja3Nfc2lnbmF0dXJlcyA9IGFkZENvbGxlY3Rpb24oJ2Jsb2Nrc19zaWduYXR1cmVzJywgQmxvY2tTaWduYXR1cmVzKTtcbiAgICB9XG5cbiAgICBzdGFydCgpIHtcbiAgICAgICAgY29uc3QgbGlzdGVuZXJVcmwgPSBgJHtlbnN1cmVQcm90b2NvbCh0aGlzLnNlcnZlckFkZHJlc3MsICdodHRwJyl9LyR7dGhpcy5kYXRhYmFzZU5hbWV9YDtcbiAgICAgICAgdGhpcy5saXN0ZW5lciA9IG5ldyBhcmFuZ29jaGFpcihsaXN0ZW5lclVybCk7XG5cbiAgICAgICAgaWYgKHRoaXMuY29uZmlnLmRhdGFiYXNlLmF1dGgpIHtcbiAgICAgICAgICAgIGNvbnN0IHVzZXJQYXNzd29yZCA9IEJ1ZmZlci5mcm9tKHRoaXMuY29uZmlnLmRhdGFiYXNlLmF1dGgpLnRvU3RyaW5nKCdiYXNlNjQnKTtcbiAgICAgICAgICAgIHRoaXMubGlzdGVuZXIucmVxLm9wdHMuaGVhZGVyc1snQXV0aG9yaXphdGlvbiddID0gYEJhc2ljICR7dXNlclBhc3N3b3JkfWA7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNvbGxlY3Rpb25zLmZvckVhY2goY29sbGVjdGlvbiA9PiB7XG4gICAgICAgICAgICBjb25zdCBuYW1lID0gY29sbGVjdGlvbi5uYW1lO1xuICAgICAgICAgICAgdGhpcy5saXN0ZW5lci5zdWJzY3JpYmUoeyBjb2xsZWN0aW9uOiBuYW1lIH0pO1xuICAgICAgICAgICAgdGhpcy5saXN0ZW5lci5vbihuYW1lLCAoZG9jSnNvbiwgdHlwZSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlID09PSAnaW5zZXJ0L3VwZGF0ZScpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vbkRvY3VtZW50SW5zZXJ0T3JVcGRhdGUobmFtZSwgSlNPTi5wYXJzZShkb2NKc29uKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmxpc3RlbmVyLnN0YXJ0KCk7XG4gICAgICAgIHRoaXMubG9nLmRlYnVnKCdMSVNURU4nLCBsaXN0ZW5lclVybCk7XG4gICAgICAgIHRoaXMubGlzdGVuZXIub24oJ2Vycm9yJywgKGVycikgPT4ge1xuICAgICAgICAgICAgdGhpcy5sb2cuZXJyb3IoJ0ZBSUxFRCcsICdMSVNURU4nLCBgJHtlcnJ9YCk7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHRoaXMubGlzdGVuZXIuc3RhcnQoKSwgdGhpcy5jb25maWcubGlzdGVuZXIucmVzdGFydFRpbWVvdXQpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBvbkRvY3VtZW50SW5zZXJ0T3JVcGRhdGUobmFtZTogc3RyaW5nLCBkb2M6IGFueSkge1xuICAgICAgICBpZiAodGhpcy5jaGFuZ2VMb2cuZW5hYmxlZCkge1xuICAgICAgICAgICAgdGhpcy5jaGFuZ2VMb2cubG9nKGRvYy5fa2V5LCBEYXRlLm5vdygpKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjb2xsZWN0aW9uOiAoQ29sbGVjdGlvbiB8IHR5cGVvZiB1bmRlZmluZWQpID0gdGhpcy5jb2xsZWN0aW9uc0J5TmFtZS5nZXQobmFtZSk7XG4gICAgICAgIGlmIChjb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICBjb2xsZWN0aW9uLm9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZShkb2MpO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBhc3luYyBmZXRjaFF1ZXJ5KHF1ZXJ5OiBhbnksIGJpbmRWYXJzOiBhbnksIGNvbnRleHQ6IGFueSkge1xuICAgICAgICByZXR1cm4gd3JhcCh0aGlzLmxvZywgJ1FVRVJZJywgeyBxdWVyeSwgYmluZFZhcnMgfSwgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgY29uc3Qgc3BhbiA9IGF3YWl0IHRoaXMudHJhY2VyLnN0YXJ0U3BhbkxvZyhcbiAgICAgICAgICAgICAgICBjb250ZXh0LFxuICAgICAgICAgICAgICAgICdhcmFuZ28uanM6ZmV0Y2hRdWVyeScsXG4gICAgICAgICAgICAgICAgJ25ldyBxdWVyeScsXG4gICAgICAgICAgICAgICAgcXVlcnksXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgY29uc3QgY3Vyc29yID0gYXdhaXQgdGhpcy5kYi5xdWVyeSh7IHF1ZXJ5LCBiaW5kVmFycyB9KTtcbiAgICAgICAgICAgIGNvbnN0IHJlcyA9IGN1cnNvci5hbGwoKTtcbiAgICAgICAgICAgIGF3YWl0IHNwYW4uZmluaXNoKCk7XG4gICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICB9KTtcbiAgICB9XG59XG4iXX0=