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

var _opentracing = require("opentracing");

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
  function Arango(config, logs, tracer) {
    var _this = this;

    (0, _classCallCheck2["default"])(this, Arango);
    (0, _defineProperty2["default"])(this, "config", void 0);
    (0, _defineProperty2["default"])(this, "log", void 0);
    (0, _defineProperty2["default"])(this, "serverAddress", void 0);
    (0, _defineProperty2["default"])(this, "databaseName", void 0);
    (0, _defineProperty2["default"])(this, "db", void 0);
    (0, _defineProperty2["default"])(this, "slowDb", void 0);
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
      var collection = new _arangoCollection.Collection(name, docType, logs, _this.tracer, _this.db, slowDb);

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
                return _context2.abrupt("return", (0, _arangoCollection.wrap)(this.log, 'QUERY', {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28uanMiXSwibmFtZXMiOlsiQXJhbmdvIiwiY29uZmlnIiwibG9ncyIsInRyYWNlciIsImxvZyIsImNyZWF0ZSIsInNlcnZlckFkZHJlc3MiLCJkYXRhYmFzZSIsInNlcnZlciIsImRhdGFiYXNlTmFtZSIsIm5hbWUiLCJjcmVhdGVEYiIsImRiIiwiRGF0YWJhc2UiLCJ1cmwiLCJhZ2VudE9wdGlvbnMiLCJtYXhTb2NrZXRzIiwidXNlRGF0YWJhc2UiLCJhdXRoIiwiYXV0aFBhcnRzIiwic3BsaXQiLCJ1c2VCYXNpY0F1dGgiLCJzbGljZSIsImpvaW4iLCJzbG93RGIiLCJzbG93RGF0YWJhc2UiLCJjb2xsZWN0aW9ucyIsImNvbGxlY3Rpb25zQnlOYW1lIiwiTWFwIiwiYWRkQ29sbGVjdGlvbiIsImRvY1R5cGUiLCJjb2xsZWN0aW9uIiwiQ29sbGVjdGlvbiIsInB1c2giLCJzZXQiLCJ0cmFuc2FjdGlvbnMiLCJUcmFuc2FjdGlvbiIsIm1lc3NhZ2VzIiwiTWVzc2FnZSIsImFjY291bnRzIiwiQWNjb3VudCIsImJsb2NrcyIsIkJsb2NrIiwiYmxvY2tzX3NpZ25hdHVyZXMiLCJCbG9ja1NpZ25hdHVyZXMiLCJsaXN0ZW5lclVybCIsImxpc3RlbmVyIiwiYXJhbmdvY2hhaXIiLCJ1c2VyUGFzc3dvcmQiLCJCdWZmZXIiLCJmcm9tIiwidG9TdHJpbmciLCJyZXEiLCJvcHRzIiwiaGVhZGVycyIsImZvckVhY2giLCJzdWJzY3JpYmUiLCJvbiIsImRvY0pzb24iLCJ0eXBlIiwib25Eb2N1bWVudEluc2VydE9yVXBkYXRlIiwiSlNPTiIsInBhcnNlIiwic3RhcnQiLCJkZWJ1ZyIsImVyciIsImVycm9yIiwic2V0VGltZW91dCIsInJlc3RhcnRUaW1lb3V0IiwiZG9jIiwiZ2V0IiwicXVlcnkiLCJiaW5kVmFycyIsImN1cnNvciIsImFsbCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWtCQTs7QUFDQTs7QUFDQTs7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VUFBQ1EsR0FBRCxFQUFTO0FBQy9CLFFBQUEsTUFBSSxDQUFDN0QsR0FBTCxDQUFTOEQsS0FBVCxDQUFlLFFBQWYsRUFBeUIsUUFBekIsWUFBc0NELEdBQXRDOztBQUNBRSxRQUFBQSxVQUFVLENBQUM7QUFBQSxpQkFBTSxNQUFJLENBQUNyQixRQUFMLENBQWNpQixLQUFkLEVBQU47QUFBQSxTQUFELEVBQThCLE1BQUksQ0FBQzlELE1BQUwsQ0FBWTZDLFFBQVosQ0FBcUJzQixjQUFuRCxDQUFWO0FBQ0gsT0FIRDtBQUlIOzs7NkNBRXdCMUQsSSxFQUFjMkQsRyxFQUFVO0FBQzdDLFVBQU10QyxVQUEyQyxHQUFHLEtBQUtKLGlCQUFMLENBQXVCMkMsR0FBdkIsQ0FBMkI1RCxJQUEzQixDQUFwRDs7QUFDQSxVQUFJcUIsVUFBSixFQUFnQjtBQUNaQSxRQUFBQSxVQUFVLENBQUM2Qix3QkFBWCxDQUFvQ1MsR0FBcEM7QUFDSDtBQUNKOzs7Ozs7cURBR1dFLE0sRUFBWUMsUTs7Ozs7OztrREFDYiw0QkFBSyxLQUFLcEUsR0FBVixFQUFlLE9BQWYsRUFBd0I7QUFBRW1FLGtCQUFBQSxLQUFLLEVBQUxBLE1BQUY7QUFBU0Msa0JBQUFBLFFBQVEsRUFBUkE7QUFBVCxpQkFBeEI7QUFBQTtBQUFBO0FBQUE7QUFBQSw2Q0FBNkM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxpQ0FDM0IsTUFBSSxDQUFDNUQsRUFBTCxDQUFRMkQsS0FBUixDQUFjO0FBQUVBLDRCQUFBQSxLQUFLLEVBQUxBLE1BQUY7QUFBU0MsNEJBQUFBLFFBQVEsRUFBUkE7QUFBVCwyQkFBZCxDQUQyQjs7QUFBQTtBQUMxQ0MsMEJBQUFBLE1BRDBDO0FBQUEsMkRBRXpDQSxNQUFNLENBQUNDLEdBQVAsRUFGeUM7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsaUJBQTdDLEciLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IDIwMTgtMjAyMCBUT04gREVWIFNPTFVUSU9OUyBMVEQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIFNPRlRXQVJFIEVWQUxVQVRJT04gTGljZW5zZSAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlXG4gKiB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGVcbiAqIExpY2Vuc2UgYXQ6XG4gKlxuICogaHR0cDovL3d3dy50b24uZGV2L2xpY2Vuc2VzXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBUT04gREVWIHNvZnR3YXJlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8vIEBmbG93XG5cbmltcG9ydCBhcmFuZ29jaGFpciBmcm9tICdhcmFuZ29jaGFpcic7XG5pbXBvcnQgeyBEYXRhYmFzZSB9IGZyb20gJ2FyYW5nb2pzJztcbmltcG9ydCB7IENvbGxlY3Rpb24sIHdyYXAgfSBmcm9tIFwiLi9hcmFuZ28tY29sbGVjdGlvblwiO1xuaW1wb3J0IHR5cGUgeyBRQ29uZmlnLCBRRGJDb25maWcgfSBmcm9tICcuL2NvbmZpZydcbmltcG9ydCB7IGVuc3VyZVByb3RvY29sIH0gZnJvbSAnLi9jb25maWcnO1xuaW1wb3J0IHR5cGUgeyBRTG9nIH0gZnJvbSAnLi9sb2dzJztcbmltcG9ydCBRTG9ncyBmcm9tICcuL2xvZ3MnXG5pbXBvcnQgdHlwZSB7IFFUeXBlIH0gZnJvbSAnLi9xLXR5cGVzJztcbmltcG9ydCB7IEFjY291bnQsIEJsb2NrLCBCbG9ja1NpZ25hdHVyZXMsIE1lc3NhZ2UsIFRyYW5zYWN0aW9uIH0gZnJvbSAnLi9yZXNvbHZlcnMtZ2VuZXJhdGVkJztcbmltcG9ydCB7IFRyYWNlciB9IGZyb20gXCJvcGVudHJhY2luZ1wiO1xuXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEFyYW5nbyB7XG4gICAgY29uZmlnOiBRQ29uZmlnO1xuICAgIGxvZzogUUxvZztcbiAgICBzZXJ2ZXJBZGRyZXNzOiBzdHJpbmc7XG4gICAgZGF0YWJhc2VOYW1lOiBzdHJpbmc7XG4gICAgZGI6IERhdGFiYXNlO1xuICAgIHNsb3dEYjogRGF0YWJhc2U7XG5cbiAgICB0cmFjZXI6IFRyYWNlcjtcblxuICAgIHRyYW5zYWN0aW9uczogQ29sbGVjdGlvbjtcbiAgICBtZXNzYWdlczogQ29sbGVjdGlvbjtcbiAgICBhY2NvdW50czogQ29sbGVjdGlvbjtcbiAgICBibG9ja3M6IENvbGxlY3Rpb247XG4gICAgYmxvY2tzX3NpZ25hdHVyZXM6IENvbGxlY3Rpb247XG5cbiAgICBjb2xsZWN0aW9uczogQ29sbGVjdGlvbltdO1xuICAgIGNvbGxlY3Rpb25zQnlOYW1lOiBNYXA8c3RyaW5nLCBDb2xsZWN0aW9uPjtcblxuICAgIGxpc3RlbmVyOiBhbnk7XG5cbiAgICBjb25zdHJ1Y3Rvcihjb25maWc6IFFDb25maWcsIGxvZ3M6IFFMb2dzLCB0cmFjZXI6IFRyYWNlcikge1xuICAgICAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgICAgICAgdGhpcy5sb2cgPSBsb2dzLmNyZWF0ZSgnZGInKTtcbiAgICAgICAgdGhpcy5zZXJ2ZXJBZGRyZXNzID0gY29uZmlnLmRhdGFiYXNlLnNlcnZlcjtcbiAgICAgICAgdGhpcy5kYXRhYmFzZU5hbWUgPSBjb25maWcuZGF0YWJhc2UubmFtZTtcbiAgICAgICAgdGhpcy50cmFjZXIgPSB0cmFjZXI7XG5cbiAgICAgICAgY29uc3QgY3JlYXRlRGIgPSAoY29uZmlnOiBRRGJDb25maWcpOiBEYXRhYmFzZSA9PiB7XG4gICAgICAgICAgICBjb25zdCBkYiA9IG5ldyBEYXRhYmFzZSh7XG4gICAgICAgICAgICAgICAgdXJsOiBgJHtlbnN1cmVQcm90b2NvbChjb25maWcuc2VydmVyLCAnaHR0cCcpfWAsXG4gICAgICAgICAgICAgICAgYWdlbnRPcHRpb25zOiB7XG4gICAgICAgICAgICAgICAgICAgIG1heFNvY2tldHM6IGNvbmZpZy5tYXhTb2NrZXRzLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGRiLnVzZURhdGFiYXNlKGNvbmZpZy5uYW1lKTtcbiAgICAgICAgICAgIGlmIChjb25maWcuYXV0aCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGF1dGhQYXJ0cyA9IGNvbmZpZy5hdXRoLnNwbGl0KCc6Jyk7XG4gICAgICAgICAgICAgICAgZGIudXNlQmFzaWNBdXRoKGF1dGhQYXJ0c1swXSwgYXV0aFBhcnRzLnNsaWNlKDEpLmpvaW4oJzonKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZGI7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5kYiA9IGNyZWF0ZURiKGNvbmZpZy5kYXRhYmFzZSk7XG4gICAgICAgIGNvbnN0IHNsb3dEYiA9IGNyZWF0ZURiKGNvbmZpZy5zbG93RGF0YWJhc2UpO1xuXG4gICAgICAgIHRoaXMuY29sbGVjdGlvbnMgPSBbXTtcbiAgICAgICAgdGhpcy5jb2xsZWN0aW9uc0J5TmFtZSA9IG5ldyBNYXAoKTtcblxuICAgICAgICBjb25zdCBhZGRDb2xsZWN0aW9uID0gKG5hbWU6IHN0cmluZywgZG9jVHlwZTogUVR5cGUpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbGxlY3Rpb24gPSBuZXcgQ29sbGVjdGlvbihcbiAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgICAgIGRvY1R5cGUsXG4gICAgICAgICAgICAgICAgbG9ncyxcbiAgICAgICAgICAgICAgICB0aGlzLnRyYWNlcixcbiAgICAgICAgICAgICAgICB0aGlzLmRiLFxuICAgICAgICAgICAgICAgIHNsb3dEYixcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICB0aGlzLmNvbGxlY3Rpb25zLnB1c2goY29sbGVjdGlvbik7XG4gICAgICAgICAgICB0aGlzLmNvbGxlY3Rpb25zQnlOYW1lLnNldChuYW1lLCBjb2xsZWN0aW9uKTtcbiAgICAgICAgICAgIHJldHVybiBjb2xsZWN0aW9uO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMudHJhbnNhY3Rpb25zID0gYWRkQ29sbGVjdGlvbigndHJhbnNhY3Rpb25zJywgVHJhbnNhY3Rpb24pO1xuICAgICAgICB0aGlzLm1lc3NhZ2VzID0gYWRkQ29sbGVjdGlvbignbWVzc2FnZXMnLCBNZXNzYWdlKTtcbiAgICAgICAgdGhpcy5hY2NvdW50cyA9IGFkZENvbGxlY3Rpb24oJ2FjY291bnRzJywgQWNjb3VudCk7XG4gICAgICAgIHRoaXMuYmxvY2tzID0gYWRkQ29sbGVjdGlvbignYmxvY2tzJywgQmxvY2spO1xuICAgICAgICB0aGlzLmJsb2Nrc19zaWduYXR1cmVzID0gYWRkQ29sbGVjdGlvbignYmxvY2tzX3NpZ25hdHVyZXMnLCBCbG9ja1NpZ25hdHVyZXMpO1xuICAgIH1cblxuICAgIHN0YXJ0KCkge1xuICAgICAgICBjb25zdCBsaXN0ZW5lclVybCA9IGAke2Vuc3VyZVByb3RvY29sKHRoaXMuc2VydmVyQWRkcmVzcywgJ2h0dHAnKX0vJHt0aGlzLmRhdGFiYXNlTmFtZX1gO1xuICAgICAgICB0aGlzLmxpc3RlbmVyID0gbmV3IGFyYW5nb2NoYWlyKGxpc3RlbmVyVXJsKTtcblxuICAgICAgICBpZiAodGhpcy5jb25maWcuZGF0YWJhc2UuYXV0aCkge1xuICAgICAgICAgICAgY29uc3QgdXNlclBhc3N3b3JkID0gQnVmZmVyLmZyb20odGhpcy5jb25maWcuZGF0YWJhc2UuYXV0aCkudG9TdHJpbmcoJ2Jhc2U2NCcpO1xuICAgICAgICAgICAgdGhpcy5saXN0ZW5lci5yZXEub3B0cy5oZWFkZXJzWydBdXRob3JpemF0aW9uJ10gPSBgQmFzaWMgJHt1c2VyUGFzc3dvcmR9YDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY29sbGVjdGlvbnMuZm9yRWFjaChjb2xsZWN0aW9uID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBjb2xsZWN0aW9uLm5hbWU7XG4gICAgICAgICAgICB0aGlzLmxpc3RlbmVyLnN1YnNjcmliZSh7IGNvbGxlY3Rpb246IG5hbWUgfSk7XG4gICAgICAgICAgICB0aGlzLmxpc3RlbmVyLm9uKG5hbWUsIChkb2NKc29uLCB0eXBlKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGUgPT09ICdpbnNlcnQvdXBkYXRlJykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZShuYW1lLCBKU09OLnBhcnNlKGRvY0pzb24pKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMubGlzdGVuZXIuc3RhcnQoKTtcbiAgICAgICAgdGhpcy5sb2cuZGVidWcoJ0xJU1RFTicsIGxpc3RlbmVyVXJsKTtcbiAgICAgICAgdGhpcy5saXN0ZW5lci5vbignZXJyb3InLCAoZXJyKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmxvZy5lcnJvcignRkFJTEVEJywgJ0xJU1RFTicsIGAke2Vycn1gKTtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy5saXN0ZW5lci5zdGFydCgpLCB0aGlzLmNvbmZpZy5saXN0ZW5lci5yZXN0YXJ0VGltZW91dCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIG9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZShuYW1lOiBzdHJpbmcsIGRvYzogYW55KSB7XG4gICAgICAgIGNvbnN0IGNvbGxlY3Rpb246IChDb2xsZWN0aW9uIHwgdHlwZW9mIHVuZGVmaW5lZCkgPSB0aGlzLmNvbGxlY3Rpb25zQnlOYW1lLmdldChuYW1lKTtcbiAgICAgICAgaWYgKGNvbGxlY3Rpb24pIHtcbiAgICAgICAgICAgIGNvbGxlY3Rpb24ub25Eb2N1bWVudEluc2VydE9yVXBkYXRlKGRvYyk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIGFzeW5jIHF1ZXJ5KHF1ZXJ5OiBhbnksIGJpbmRWYXJzOiBhbnkpIHtcbiAgICAgICAgcmV0dXJuIHdyYXAodGhpcy5sb2csICdRVUVSWScsIHsgcXVlcnksIGJpbmRWYXJzIH0sIGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGN1cnNvciA9IGF3YWl0IHRoaXMuZGIucXVlcnkoeyBxdWVyeSwgYmluZFZhcnMgfSk7XG4gICAgICAgICAgICByZXR1cm4gY3Vyc29yLmFsbCgpO1xuICAgICAgICB9KTtcbiAgICB9XG59XG4iXX0=