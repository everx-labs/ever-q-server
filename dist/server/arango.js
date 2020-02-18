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

var _auth = require("./auth");

var _config = require("./config");

var _logs = _interopRequireDefault(require("./logs"));

var _resolversGenerated = require("./resolvers-generated");

var _opentracing = require("opentracing");

var _utils = require("./utils");

/*
 * Copyright 2018-2020 TON DEV SOLUTIONS LTD.
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
  function Arango(config, logs, auth, tracer) {
    var _this = this;

    (0, _classCallCheck2["default"])(this, Arango);
    (0, _defineProperty2["default"])(this, "config", void 0);
    (0, _defineProperty2["default"])(this, "log", void 0);
    (0, _defineProperty2["default"])(this, "serverAddress", void 0);
    (0, _defineProperty2["default"])(this, "databaseName", void 0);
    (0, _defineProperty2["default"])(this, "db", void 0);
    (0, _defineProperty2["default"])(this, "slowDb", void 0);
    (0, _defineProperty2["default"])(this, "auth", void 0);
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
    this.auth = auth;
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
      var collection = new _arangoCollection.Collection(name, docType, logs, _this.auth, _this.tracer, _this.db, slowDb);

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
      var collection = this.collectionsByName.get(name);

      if (collection) {
        collection.onDocumentInsertOrUpdate(doc);
      }
    }
  }, {
    key: "query",
    value: function () {
      var _query2 = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee2(_query, bindVars) {
        var _this3 = this;

        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                return _context2.abrupt("return", (0, _utils.wrap)(this.log, 'QUERY', {
                  query: _query,
                  bindVars: bindVars
                },
                /*#__PURE__*/
                (0, _asyncToGenerator2["default"])(
                /*#__PURE__*/
                _regenerator["default"].mark(function _callee() {
                  var cursor;
                  return _regenerator["default"].wrap(function _callee$(_context) {
                    while (1) {
                      switch (_context.prev = _context.next) {
                        case 0:
                          _context.next = 2;
                          return _this3.db.query({
                            query: _query,
                            bindVars: bindVars
                          });

                        case 2:
                          cursor = _context.sent;
                          return _context.abrupt("return", cursor.all());

                        case 4:
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

      function query(_x, _x2) {
        return _query2.apply(this, arguments);
      }

      return query;
    }()
  }]);
  return Arango;
}();

exports["default"] = Arango;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28uanMiXSwibmFtZXMiOlsiQXJhbmdvIiwiY29uZmlnIiwibG9ncyIsImF1dGgiLCJ0cmFjZXIiLCJsb2ciLCJjcmVhdGUiLCJzZXJ2ZXJBZGRyZXNzIiwiZGF0YWJhc2UiLCJzZXJ2ZXIiLCJkYXRhYmFzZU5hbWUiLCJuYW1lIiwiY3JlYXRlRGIiLCJkYiIsIkRhdGFiYXNlIiwidXJsIiwiYWdlbnRPcHRpb25zIiwibWF4U29ja2V0cyIsInVzZURhdGFiYXNlIiwiYXV0aFBhcnRzIiwic3BsaXQiLCJ1c2VCYXNpY0F1dGgiLCJzbGljZSIsImpvaW4iLCJzbG93RGIiLCJzbG93RGF0YWJhc2UiLCJjb2xsZWN0aW9ucyIsImNvbGxlY3Rpb25zQnlOYW1lIiwiTWFwIiwiYWRkQ29sbGVjdGlvbiIsImRvY1R5cGUiLCJjb2xsZWN0aW9uIiwiQ29sbGVjdGlvbiIsInB1c2giLCJzZXQiLCJ0cmFuc2FjdGlvbnMiLCJUcmFuc2FjdGlvbiIsIm1lc3NhZ2VzIiwiTWVzc2FnZSIsImFjY291bnRzIiwiQWNjb3VudCIsImJsb2NrcyIsIkJsb2NrIiwiYmxvY2tzX3NpZ25hdHVyZXMiLCJCbG9ja1NpZ25hdHVyZXMiLCJsaXN0ZW5lclVybCIsImxpc3RlbmVyIiwiYXJhbmdvY2hhaXIiLCJ1c2VyUGFzc3dvcmQiLCJCdWZmZXIiLCJmcm9tIiwidG9TdHJpbmciLCJyZXEiLCJvcHRzIiwiaGVhZGVycyIsImZvckVhY2giLCJzdWJzY3JpYmUiLCJvbiIsImRvY0pzb24iLCJ0eXBlIiwib25Eb2N1bWVudEluc2VydE9yVXBkYXRlIiwiSlNPTiIsInBhcnNlIiwic3RhcnQiLCJkZWJ1ZyIsImVyciIsImVycm9yIiwic2V0VGltZW91dCIsInJlc3RhcnRUaW1lb3V0IiwiZG9jIiwiZ2V0IiwicXVlcnkiLCJiaW5kVmFycyIsImN1cnNvciIsImFsbCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWtCQTs7QUFDQTs7QUFDQTs7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b3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IDIwMTgtMjAyMCBUT04gREVWIFNPTFVUSU9OUyBMVEQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIFNPRlRXQVJFIEVWQUxVQVRJT04gTGljZW5zZSAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlXG4gKiB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGVcbiAqIExpY2Vuc2UgYXQ6XG4gKlxuICogaHR0cDovL3d3dy50b24uZGV2L2xpY2Vuc2VzXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBUT04gREVWIHNvZnR3YXJlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8vIEBmbG93XG5cbmltcG9ydCBhcmFuZ29jaGFpciBmcm9tICdhcmFuZ29jaGFpcic7XG5pbXBvcnQgeyBEYXRhYmFzZSB9IGZyb20gJ2FyYW5nb2pzJztcbmltcG9ydCB7IENvbGxlY3Rpb259IGZyb20gXCIuL2FyYW5nby1jb2xsZWN0aW9uXCI7XG5pbXBvcnQgeyBBdXRoIH0gZnJvbSBcIi4vYXV0aFwiO1xuaW1wb3J0IHR5cGUgeyBRQ29uZmlnLCBRRGJDb25maWcgfSBmcm9tICcuL2NvbmZpZydcbmltcG9ydCB7IGVuc3VyZVByb3RvY29sIH0gZnJvbSAnLi9jb25maWcnO1xuaW1wb3J0IHR5cGUgeyBRTG9nIH0gZnJvbSAnLi9sb2dzJztcbmltcG9ydCBRTG9ncyBmcm9tICcuL2xvZ3MnXG5pbXBvcnQgdHlwZSB7IFFUeXBlIH0gZnJvbSAnLi9kYi10eXBlcyc7XG5pbXBvcnQgeyBBY2NvdW50LCBCbG9jaywgQmxvY2tTaWduYXR1cmVzLCBNZXNzYWdlLCBUcmFuc2FjdGlvbiB9IGZyb20gJy4vcmVzb2x2ZXJzLWdlbmVyYXRlZCc7XG5pbXBvcnQgeyBUcmFjZXIgfSBmcm9tIFwib3BlbnRyYWNpbmdcIjtcbmltcG9ydCB7IHdyYXAgfSBmcm9tIFwiLi91dGlsc1wiO1xuXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEFyYW5nbyB7XG4gICAgY29uZmlnOiBRQ29uZmlnO1xuICAgIGxvZzogUUxvZztcbiAgICBzZXJ2ZXJBZGRyZXNzOiBzdHJpbmc7XG4gICAgZGF0YWJhc2VOYW1lOiBzdHJpbmc7XG4gICAgZGI6IERhdGFiYXNlO1xuICAgIHNsb3dEYjogRGF0YWJhc2U7XG5cbiAgICBhdXRoOiBBdXRoO1xuICAgIHRyYWNlcjogVHJhY2VyO1xuXG4gICAgdHJhbnNhY3Rpb25zOiBDb2xsZWN0aW9uO1xuICAgIG1lc3NhZ2VzOiBDb2xsZWN0aW9uO1xuICAgIGFjY291bnRzOiBDb2xsZWN0aW9uO1xuICAgIGJsb2NrczogQ29sbGVjdGlvbjtcbiAgICBibG9ja3Nfc2lnbmF0dXJlczogQ29sbGVjdGlvbjtcblxuICAgIGNvbGxlY3Rpb25zOiBDb2xsZWN0aW9uW107XG4gICAgY29sbGVjdGlvbnNCeU5hbWU6IE1hcDxzdHJpbmcsIENvbGxlY3Rpb24+O1xuXG4gICAgbGlzdGVuZXI6IGFueTtcblxuICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICBjb25maWc6IFFDb25maWcsXG4gICAgICAgIGxvZ3M6IFFMb2dzLFxuICAgICAgICBhdXRoOiBBdXRoLFxuICAgICAgICB0cmFjZXI6IFRyYWNlcixcbiAgICApIHtcbiAgICAgICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgICAgIHRoaXMubG9nID0gbG9ncy5jcmVhdGUoJ2RiJyk7XG4gICAgICAgIHRoaXMuYXV0aCA9IGF1dGg7XG4gICAgICAgIHRoaXMuc2VydmVyQWRkcmVzcyA9IGNvbmZpZy5kYXRhYmFzZS5zZXJ2ZXI7XG4gICAgICAgIHRoaXMuZGF0YWJhc2VOYW1lID0gY29uZmlnLmRhdGFiYXNlLm5hbWU7XG4gICAgICAgIHRoaXMudHJhY2VyID0gdHJhY2VyO1xuXG4gICAgICAgIGNvbnN0IGNyZWF0ZURiID0gKGNvbmZpZzogUURiQ29uZmlnKTogRGF0YWJhc2UgPT4ge1xuICAgICAgICAgICAgY29uc3QgZGIgPSBuZXcgRGF0YWJhc2Uoe1xuICAgICAgICAgICAgICAgIHVybDogYCR7ZW5zdXJlUHJvdG9jb2woY29uZmlnLnNlcnZlciwgJ2h0dHAnKX1gLFxuICAgICAgICAgICAgICAgIGFnZW50T3B0aW9uczoge1xuICAgICAgICAgICAgICAgICAgICBtYXhTb2NrZXRzOiBjb25maWcubWF4U29ja2V0cyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBkYi51c2VEYXRhYmFzZShjb25maWcubmFtZSk7XG4gICAgICAgICAgICBpZiAoY29uZmlnLmF1dGgpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBhdXRoUGFydHMgPSBjb25maWcuYXV0aC5zcGxpdCgnOicpO1xuICAgICAgICAgICAgICAgIGRiLnVzZUJhc2ljQXV0aChhdXRoUGFydHNbMF0sIGF1dGhQYXJ0cy5zbGljZSgxKS5qb2luKCc6JykpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGRiO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZGIgPSBjcmVhdGVEYihjb25maWcuZGF0YWJhc2UpO1xuICAgICAgICBjb25zdCBzbG93RGIgPSBjcmVhdGVEYihjb25maWcuc2xvd0RhdGFiYXNlKTtcblxuICAgICAgICB0aGlzLmNvbGxlY3Rpb25zID0gW107XG4gICAgICAgIHRoaXMuY29sbGVjdGlvbnNCeU5hbWUgPSBuZXcgTWFwKCk7XG5cbiAgICAgICAgY29uc3QgYWRkQ29sbGVjdGlvbiA9IChuYW1lOiBzdHJpbmcsIGRvY1R5cGU6IFFUeXBlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBjb2xsZWN0aW9uID0gbmV3IENvbGxlY3Rpb24oXG4gICAgICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgICAgICBkb2NUeXBlLFxuICAgICAgICAgICAgICAgIGxvZ3MsXG4gICAgICAgICAgICAgICAgdGhpcy5hdXRoLFxuICAgICAgICAgICAgICAgIHRoaXMudHJhY2VyLFxuICAgICAgICAgICAgICAgIHRoaXMuZGIsXG4gICAgICAgICAgICAgICAgc2xvd0RiLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHRoaXMuY29sbGVjdGlvbnMucHVzaChjb2xsZWN0aW9uKTtcbiAgICAgICAgICAgIHRoaXMuY29sbGVjdGlvbnNCeU5hbWUuc2V0KG5hbWUsIGNvbGxlY3Rpb24pO1xuICAgICAgICAgICAgcmV0dXJuIGNvbGxlY3Rpb247XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy50cmFuc2FjdGlvbnMgPSBhZGRDb2xsZWN0aW9uKCd0cmFuc2FjdGlvbnMnLCBUcmFuc2FjdGlvbik7XG4gICAgICAgIHRoaXMubWVzc2FnZXMgPSBhZGRDb2xsZWN0aW9uKCdtZXNzYWdlcycsIE1lc3NhZ2UpO1xuICAgICAgICB0aGlzLmFjY291bnRzID0gYWRkQ29sbGVjdGlvbignYWNjb3VudHMnLCBBY2NvdW50KTtcbiAgICAgICAgdGhpcy5ibG9ja3MgPSBhZGRDb2xsZWN0aW9uKCdibG9ja3MnLCBCbG9jayk7XG4gICAgICAgIHRoaXMuYmxvY2tzX3NpZ25hdHVyZXMgPSBhZGRDb2xsZWN0aW9uKCdibG9ja3Nfc2lnbmF0dXJlcycsIEJsb2NrU2lnbmF0dXJlcyk7XG4gICAgfVxuXG4gICAgc3RhcnQoKSB7XG4gICAgICAgIGNvbnN0IGxpc3RlbmVyVXJsID0gYCR7ZW5zdXJlUHJvdG9jb2wodGhpcy5zZXJ2ZXJBZGRyZXNzLCAnaHR0cCcpfS8ke3RoaXMuZGF0YWJhc2VOYW1lfWA7XG4gICAgICAgIHRoaXMubGlzdGVuZXIgPSBuZXcgYXJhbmdvY2hhaXIobGlzdGVuZXJVcmwpO1xuXG4gICAgICAgIGlmICh0aGlzLmNvbmZpZy5kYXRhYmFzZS5hdXRoKSB7XG4gICAgICAgICAgICBjb25zdCB1c2VyUGFzc3dvcmQgPSBCdWZmZXIuZnJvbSh0aGlzLmNvbmZpZy5kYXRhYmFzZS5hdXRoKS50b1N0cmluZygnYmFzZTY0Jyk7XG4gICAgICAgICAgICB0aGlzLmxpc3RlbmVyLnJlcS5vcHRzLmhlYWRlcnNbJ0F1dGhvcml6YXRpb24nXSA9IGBCYXNpYyAke3VzZXJQYXNzd29yZH1gO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jb2xsZWN0aW9ucy5mb3JFYWNoKGNvbGxlY3Rpb24gPT4ge1xuICAgICAgICAgICAgY29uc3QgbmFtZSA9IGNvbGxlY3Rpb24ubmFtZTtcbiAgICAgICAgICAgIHRoaXMubGlzdGVuZXIuc3Vic2NyaWJlKHsgY29sbGVjdGlvbjogbmFtZSB9KTtcbiAgICAgICAgICAgIHRoaXMubGlzdGVuZXIub24obmFtZSwgKGRvY0pzb24sIHR5cGUpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZSA9PT0gJ2luc2VydC91cGRhdGUnKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub25Eb2N1bWVudEluc2VydE9yVXBkYXRlKG5hbWUsIEpTT04ucGFyc2UoZG9jSnNvbikpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5saXN0ZW5lci5zdGFydCgpO1xuICAgICAgICB0aGlzLmxvZy5kZWJ1ZygnTElTVEVOJywgbGlzdGVuZXJVcmwpO1xuICAgICAgICB0aGlzLmxpc3RlbmVyLm9uKCdlcnJvcicsIChlcnIpID0+IHtcbiAgICAgICAgICAgIHRoaXMubG9nLmVycm9yKCdGQUlMRUQnLCAnTElTVEVOJywgYCR7ZXJyfWApO1xuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLmxpc3RlbmVyLnN0YXJ0KCksIHRoaXMuY29uZmlnLmxpc3RlbmVyLnJlc3RhcnRUaW1lb3V0KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgb25Eb2N1bWVudEluc2VydE9yVXBkYXRlKG5hbWU6IHN0cmluZywgZG9jOiBhbnkpIHtcbiAgICAgICAgY29uc3QgY29sbGVjdGlvbjogKENvbGxlY3Rpb24gfCB0eXBlb2YgdW5kZWZpbmVkKSA9IHRoaXMuY29sbGVjdGlvbnNCeU5hbWUuZ2V0KG5hbWUpO1xuICAgICAgICBpZiAoY29sbGVjdGlvbikge1xuICAgICAgICAgICAgY29sbGVjdGlvbi5vbkRvY3VtZW50SW5zZXJ0T3JVcGRhdGUoZG9jKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgYXN5bmMgcXVlcnkocXVlcnk6IGFueSwgYmluZFZhcnM6IGFueSkge1xuICAgICAgICByZXR1cm4gd3JhcCh0aGlzLmxvZywgJ1FVRVJZJywgeyBxdWVyeSwgYmluZFZhcnMgfSwgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgY3Vyc29yID0gYXdhaXQgdGhpcy5kYi5xdWVyeSh7IHF1ZXJ5LCBiaW5kVmFycyB9KTtcbiAgICAgICAgICAgIHJldHVybiBjdXJzb3IuYWxsKCk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbiJdfQ==