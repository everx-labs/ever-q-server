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
      this.listener.on('error', function (err, httpStatus, headers, body) {
        _this2.log.error('FAILED', 'LISTEN', {
          err: err,
          httpStatus: httpStatus,
          headers: headers,
          body: body
        });

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28uanMiXSwibmFtZXMiOlsiQXJhbmdvIiwiY29uZmlnIiwibG9ncyIsInRyYWNlciIsImxvZyIsImNyZWF0ZSIsImNoYW5nZUxvZyIsIkNoYW5nZUxvZyIsInNlcnZlckFkZHJlc3MiLCJkYXRhYmFzZSIsInNlcnZlciIsImRhdGFiYXNlTmFtZSIsIm5hbWUiLCJwdWJzdWIiLCJQdWJTdWIiLCJkYiIsIkRhdGFiYXNlIiwidXJsIiwidXNlRGF0YWJhc2UiLCJhdXRoIiwiYXV0aFBhcnRzIiwic3BsaXQiLCJ1c2VCYXNpY0F1dGgiLCJzbGljZSIsImpvaW4iLCJjb2xsZWN0aW9ucyIsImNvbGxlY3Rpb25zQnlOYW1lIiwiTWFwIiwiYWRkQ29sbGVjdGlvbiIsImRvY1R5cGUiLCJjb2xsZWN0aW9uIiwiQ29sbGVjdGlvbiIsInB1c2giLCJzZXQiLCJ0cmFuc2FjdGlvbnMiLCJUcmFuc2FjdGlvbiIsIm1lc3NhZ2VzIiwiTWVzc2FnZSIsImFjY291bnRzIiwiQWNjb3VudCIsImJsb2NrcyIsIkJsb2NrIiwiYmxvY2tzX3NpZ25hdHVyZXMiLCJCbG9ja1NpZ25hdHVyZXMiLCJsaXN0ZW5lclVybCIsImxpc3RlbmVyIiwiYXJhbmdvY2hhaXIiLCJ1c2VyUGFzc3dvcmQiLCJCdWZmZXIiLCJmcm9tIiwidG9TdHJpbmciLCJyZXEiLCJvcHRzIiwiaGVhZGVycyIsImZvckVhY2giLCJzdWJzY3JpYmUiLCJvbiIsImRvY0pzb24iLCJ0eXBlIiwib25Eb2N1bWVudEluc2VydE9yVXBkYXRlIiwiSlNPTiIsInBhcnNlIiwic3RhcnQiLCJkZWJ1ZyIsImVyciIsImh0dHBTdGF0dXMiLCJib2R5IiwiZXJyb3IiLCJzZXRUaW1lb3V0IiwicmVzdGFydFRpbWVvdXQiLCJkb2MiLCJlbmFibGVkIiwiX2tleSIsIkRhdGUiLCJub3ciLCJnZXQiLCJxdWVyeSIsImJpbmRWYXJzIiwiY29udGV4dCIsInN0YXJ0U3BhbkxvZyIsInNwYW4iLCJjdXJz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QUNmRCxPQURlLEVBRWYsc0JBRmUsRUFHZixXQUhlLEVBSWZGLEtBSmUsQ0FENkI7O0FBQUE7QUFDMUNJLDBCQUFBQSxJQUQwQztBQUFBO0FBQUEsaUNBTzNCLE1BQUksQ0FBQ2pFLEVBQUwsQ0FBUTZELEtBQVIsQ0FBYztBQUFFQSw0QkFBQUEsS0FBSyxFQUFMQSxLQUFGO0FBQVNDLDRCQUFBQSxRQUFRLEVBQVJBO0FBQVQsMkJBQWQsQ0FQMkI7O0FBQUE7QUFPMUNJLDBCQUFBQSxNQVAwQztBQVExQ0MsMEJBQUFBLEdBUjBDLEdBUXBDRCxNQUFNLENBQUNFLEdBQVAsRUFSb0M7QUFBQTtBQUFBLGlDQVMxQ0gsSUFBSSxDQUFDSSxNQUFMLEVBVDBDOztBQUFBO0FBQUEsMkRBVXpDRixHQVZ5Qzs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxpQkFBN0MsRyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgMjAxOC0yMDE5IFRPTiBERVYgU09MVVRJT05TIExURC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgU09GVFdBUkUgRVZBTFVBVElPTiBMaWNlbnNlICh0aGUgXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2VcbiAqIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZVxuICogTGljZW5zZSBhdDpcbiAqXG4gKiBodHRwOi8vd3d3LnRvbi5kZXYvbGljZW5zZXNcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIFRPTiBERVYgc29mdHdhcmUgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLy8gQGZsb3dcblxuaW1wb3J0IHsgUHViU3ViIH0gZnJvbSAnYXBvbGxvLXNlcnZlcic7XG5pbXBvcnQgYXJhbmdvY2hhaXIgZnJvbSAnYXJhbmdvY2hhaXInO1xuaW1wb3J0IHsgRGF0YWJhc2UgfSBmcm9tICdhcmFuZ29qcyc7XG5pbXBvcnQgeyBDaGFuZ2VMb2csIENvbGxlY3Rpb24sIHdyYXAgfSBmcm9tIFwiLi9hcmFuZ28tY29sbGVjdGlvblwiO1xuaW1wb3J0IHR5cGUgeyBRQ29uZmlnIH0gZnJvbSAnLi9jb25maWcnXG5pbXBvcnQgeyBlbnN1cmVQcm90b2NvbCB9IGZyb20gJy4vY29uZmlnJztcbmltcG9ydCB0eXBlIHsgUUxvZyB9IGZyb20gJy4vbG9ncyc7XG5pbXBvcnQgUUxvZ3MgZnJvbSAnLi9sb2dzJ1xuaW1wb3J0IHR5cGUgeyBRVHlwZSB9IGZyb20gJy4vcS10eXBlcyc7XG5pbXBvcnQgeyBBY2NvdW50LCBCbG9jaywgQmxvY2tTaWduYXR1cmVzLCBNZXNzYWdlLCBUcmFuc2FjdGlvbiB9IGZyb20gJy4vcmVzb2x2ZXJzLWdlbmVyYXRlZCc7XG5pbXBvcnQgeyBUcmFjZXIgfSBmcm9tIFwiLi90cmFjZXJcIjtcblxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBBcmFuZ28ge1xuICAgIGNvbmZpZzogUUNvbmZpZztcbiAgICBsb2c6IFFMb2c7XG4gICAgc2VydmVyQWRkcmVzczogc3RyaW5nO1xuICAgIGRhdGFiYXNlTmFtZTogc3RyaW5nO1xuICAgIGRiOiBEYXRhYmFzZTtcblxuICAgIGNoYW5nZUxvZzogQ2hhbmdlTG9nO1xuICAgIHRyYWNlcjogVHJhY2VyO1xuXG4gICAgdHJhbnNhY3Rpb25zOiBDb2xsZWN0aW9uO1xuICAgIG1lc3NhZ2VzOiBDb2xsZWN0aW9uO1xuICAgIGFjY291bnRzOiBDb2xsZWN0aW9uO1xuICAgIGJsb2NrczogQ29sbGVjdGlvbjtcbiAgICBibG9ja3Nfc2lnbmF0dXJlczogQ29sbGVjdGlvbjtcblxuICAgIGNvbGxlY3Rpb25zOiBDb2xsZWN0aW9uW107XG4gICAgY29sbGVjdGlvbnNCeU5hbWU6IE1hcDxzdHJpbmcsIENvbGxlY3Rpb24+O1xuXG4gICAgbGlzdGVuZXI6IGFueTtcbiAgICBwdWJzdWI6IFB1YlN1YjtcblxuICAgIGNvbnN0cnVjdG9yKGNvbmZpZzogUUNvbmZpZywgbG9nczogUUxvZ3MsIHRyYWNlcjogVHJhY2VyKSB7XG4gICAgICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgICAgICB0aGlzLmxvZyA9IGxvZ3MuY3JlYXRlKCdkYicpO1xuICAgICAgICB0aGlzLmNoYW5nZUxvZyA9IG5ldyBDaGFuZ2VMb2coKTtcbiAgICAgICAgdGhpcy5zZXJ2ZXJBZGRyZXNzID0gY29uZmlnLmRhdGFiYXNlLnNlcnZlcjtcbiAgICAgICAgdGhpcy5kYXRhYmFzZU5hbWUgPSBjb25maWcuZGF0YWJhc2UubmFtZTtcbiAgICAgICAgdGhpcy50cmFjZXIgPSB0cmFjZXI7XG5cbiAgICAgICAgdGhpcy5wdWJzdWIgPSBuZXcgUHViU3ViKCk7XG5cbiAgICAgICAgdGhpcy5kYiA9IG5ldyBEYXRhYmFzZSh7XG4gICAgICAgICAgICB1cmw6IGAke2Vuc3VyZVByb3RvY29sKHRoaXMuc2VydmVyQWRkcmVzcywgJ2h0dHAnKX1gLFxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5kYi51c2VEYXRhYmFzZSh0aGlzLmRhdGFiYXNlTmFtZSk7XG4gICAgICAgIGlmICh0aGlzLmNvbmZpZy5kYXRhYmFzZS5hdXRoKSB7XG4gICAgICAgICAgICBjb25zdCBhdXRoUGFydHMgPSB0aGlzLmNvbmZpZy5kYXRhYmFzZS5hdXRoLnNwbGl0KCc6Jyk7XG4gICAgICAgICAgICB0aGlzLmRiLnVzZUJhc2ljQXV0aChhdXRoUGFydHNbMF0sIGF1dGhQYXJ0cy5zbGljZSgxKS5qb2luKCc6JykpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jb2xsZWN0aW9ucyA9IFtdO1xuICAgICAgICB0aGlzLmNvbGxlY3Rpb25zQnlOYW1lID0gbmV3IE1hcCgpO1xuXG4gICAgICAgIGNvbnN0IGFkZENvbGxlY3Rpb24gPSAobmFtZTogc3RyaW5nLCBkb2NUeXBlOiBRVHlwZSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgY29sbGVjdGlvbiA9IG5ldyBDb2xsZWN0aW9uKFxuICAgICAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICAgICAgZG9jVHlwZSxcbiAgICAgICAgICAgICAgICB0aGlzLnB1YnN1YixcbiAgICAgICAgICAgICAgICBsb2dzLFxuICAgICAgICAgICAgICAgIHRoaXMuY2hhbmdlTG9nLFxuICAgICAgICAgICAgICAgIHRoaXMudHJhY2VyLFxuICAgICAgICAgICAgICAgIHRoaXMuZGJcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICB0aGlzLmNvbGxlY3Rpb25zLnB1c2goY29sbGVjdGlvbik7XG4gICAgICAgICAgICB0aGlzLmNvbGxlY3Rpb25zQnlOYW1lLnNldChuYW1lLCBjb2xsZWN0aW9uKTtcbiAgICAgICAgICAgIHJldHVybiBjb2xsZWN0aW9uO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMudHJhbnNhY3Rpb25zID0gYWRkQ29sbGVjdGlvbigndHJhbnNhY3Rpb25zJywgVHJhbnNhY3Rpb24pO1xuICAgICAgICB0aGlzLm1lc3NhZ2VzID0gYWRkQ29sbGVjdGlvbignbWVzc2FnZXMnLCBNZXNzYWdlKTtcbiAgICAgICAgdGhpcy5hY2NvdW50cyA9IGFkZENvbGxlY3Rpb24oJ2FjY291bnRzJywgQWNjb3VudCk7XG4gICAgICAgIHRoaXMuYmxvY2tzID0gYWRkQ29sbGVjdGlvbignYmxvY2tzJywgQmxvY2spO1xuICAgICAgICB0aGlzLmJsb2Nrc19zaWduYXR1cmVzID0gYWRkQ29sbGVjdGlvbignYmxvY2tzX3NpZ25hdHVyZXMnLCBCbG9ja1NpZ25hdHVyZXMpO1xuICAgIH1cblxuICAgIHN0YXJ0KCkge1xuICAgICAgICBjb25zdCBsaXN0ZW5lclVybCA9IGAke2Vuc3VyZVByb3RvY29sKHRoaXMuc2VydmVyQWRkcmVzcywgJ2h0dHAnKX0vJHt0aGlzLmRhdGFiYXNlTmFtZX1gO1xuICAgICAgICB0aGlzLmxpc3RlbmVyID0gbmV3IGFyYW5nb2NoYWlyKGxpc3RlbmVyVXJsKTtcblxuICAgICAgICBpZiAodGhpcy5jb25maWcuZGF0YWJhc2UuYXV0aCkge1xuICAgICAgICAgICAgY29uc3QgdXNlclBhc3N3b3JkID0gQnVmZmVyLmZyb20odGhpcy5jb25maWcuZGF0YWJhc2UuYXV0aCkudG9TdHJpbmcoJ2Jhc2U2NCcpO1xuICAgICAgICAgICAgdGhpcy5saXN0ZW5lci5yZXEub3B0cy5oZWFkZXJzWydBdXRob3JpemF0aW9uJ10gPSBgQmFzaWMgJHt1c2VyUGFzc3dvcmR9YDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY29sbGVjdGlvbnMuZm9yRWFjaChjb2xsZWN0aW9uID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBjb2xsZWN0aW9uLm5hbWU7XG4gICAgICAgICAgICB0aGlzLmxpc3RlbmVyLnN1YnNjcmliZSh7IGNvbGxlY3Rpb246IG5hbWUgfSk7XG4gICAgICAgICAgICB0aGlzLmxpc3RlbmVyLm9uKG5hbWUsIChkb2NKc29uLCB0eXBlKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGUgPT09ICdpbnNlcnQvdXBkYXRlJykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZShuYW1lLCBKU09OLnBhcnNlKGRvY0pzb24pKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMubGlzdGVuZXIuc3RhcnQoKTtcbiAgICAgICAgdGhpcy5sb2cuZGVidWcoJ0xJU1RFTicsIGxpc3RlbmVyVXJsKTtcbiAgICAgICAgdGhpcy5saXN0ZW5lci5vbignZXJyb3InLCAoZXJyLCBodHRwU3RhdHVzLCBoZWFkZXJzLCBib2R5KSA9PiB7XG4gICAgICAgICAgICB0aGlzLmxvZy5lcnJvcignRkFJTEVEJywgJ0xJU1RFTicsIHsgZXJyLCBodHRwU3RhdHVzLCBoZWFkZXJzLCBib2R5IH0pO1xuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLmxpc3RlbmVyLnN0YXJ0KCksIHRoaXMuY29uZmlnLmxpc3RlbmVyLnJlc3RhcnRUaW1lb3V0KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgb25Eb2N1bWVudEluc2VydE9yVXBkYXRlKG5hbWU6IHN0cmluZywgZG9jOiBhbnkpIHtcbiAgICAgICAgaWYgKHRoaXMuY2hhbmdlTG9nLmVuYWJsZWQpIHtcbiAgICAgICAgICAgIHRoaXMuY2hhbmdlTG9nLmxvZyhkb2MuX2tleSwgRGF0ZS5ub3coKSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY29sbGVjdGlvbjogKENvbGxlY3Rpb24gfCB0eXBlb2YgdW5kZWZpbmVkKSA9IHRoaXMuY29sbGVjdGlvbnNCeU5hbWUuZ2V0KG5hbWUpO1xuICAgICAgICBpZiAoY29sbGVjdGlvbikge1xuICAgICAgICAgICAgY29sbGVjdGlvbi5vbkRvY3VtZW50SW5zZXJ0T3JVcGRhdGUoZG9jKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgYXN5bmMgZmV0Y2hRdWVyeShxdWVyeTogYW55LCBiaW5kVmFyczogYW55LCBjb250ZXh0OiBhbnkpIHtcbiAgICAgICAgcmV0dXJuIHdyYXAodGhpcy5sb2csICdRVUVSWScsIHsgcXVlcnksIGJpbmRWYXJzIH0sIGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHNwYW4gPSBhd2FpdCB0aGlzLnRyYWNlci5zdGFydFNwYW5Mb2coXG4gICAgICAgICAgICAgICAgY29udGV4dCxcbiAgICAgICAgICAgICAgICAnYXJhbmdvLmpzOmZldGNoUXVlcnknLFxuICAgICAgICAgICAgICAgICduZXcgcXVlcnknLFxuICAgICAgICAgICAgICAgIHF1ZXJ5LFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGNvbnN0IGN1cnNvciA9IGF3YWl0IHRoaXMuZGIucXVlcnkoeyBxdWVyeSwgYmluZFZhcnMgfSk7XG4gICAgICAgICAgICBjb25zdCByZXMgPSBjdXJzb3IuYWxsKCk7XG4gICAgICAgICAgICBhd2FpdCBzcGFuLmZpbmlzaCgpO1xuICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgfSk7XG4gICAgfVxufVxuIl19