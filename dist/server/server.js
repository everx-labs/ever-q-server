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

var _fs = _interopRequireDefault(require("fs"));

var _express = _interopRequireDefault(require("express"));

var _http = _interopRequireDefault(require("http"));

var _apolloServerExpress = require("apollo-server-express");

var _subscriptionsTransportWs = require("subscriptions-transport-ws");

var _arango = _interopRequireDefault(require("./arango"));

var _resolversGenerated = require("./resolvers-generated");

var _resolversCustom = require("./resolvers-custom");

var _resolversMam = require("./resolvers-mam");

var _logs = _interopRequireDefault(require("./logs"));

var _tracer = require("./tracer");

var _opentracing = require("opentracing");

var _auth = require("./auth");

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
var TONQServer =
/*#__PURE__*/
function () {
  function TONQServer(options) {
    (0, _classCallCheck2["default"])(this, TONQServer);
    (0, _defineProperty2["default"])(this, "config", void 0);
    (0, _defineProperty2["default"])(this, "logs", void 0);
    (0, _defineProperty2["default"])(this, "log", void 0);
    (0, _defineProperty2["default"])(this, "app", void 0);
    (0, _defineProperty2["default"])(this, "server", void 0);
    (0, _defineProperty2["default"])(this, "endPoints", void 0);
    (0, _defineProperty2["default"])(this, "db", void 0);
    (0, _defineProperty2["default"])(this, "tracer", void 0);
    (0, _defineProperty2["default"])(this, "auth", void 0);
    (0, _defineProperty2["default"])(this, "shared", void 0);
    this.config = options.config;
    this.logs = options.logs;
    this.log = this.logs.create('server');
    this.shared = new Map();
    this.tracer = _tracer.QTracer.create(options.config);
    this.auth = new _auth.Auth(options.config);
    this.endPoints = [];
    this.app = (0, _express["default"])();
    this.server = _http["default"].createServer(this.app);
    this.db = new _arango["default"](this.config, this.logs, this.auth, this.tracer);
    this.addEndPoint({
      path: '/graphql/mam',
      resolvers: _resolversMam.resolversMam,
      typeDefFileNames: ['type-defs-mam.graphql'],
      supportSubscriptions: false
    });
    this.addEndPoint({
      path: '/graphql',
      resolvers: (0, _resolversCustom.attachCustomResolvers)((0, _resolversGenerated.createResolvers)(this.db)),
      typeDefFileNames: ['type-defs-generated.graphql', 'type-defs-custom.graphql'],
      supportSubscriptions: true
    });
  }

  (0, _createClass2["default"])(TONQServer, [{
    key: "start",
    value: function () {
      var _start = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee() {
        var _this = this;

        var _this$config$server, host, port;

        return _regenerator["default"].wrap(function _callee$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return this.db.start();

              case 2:
                _this$config$server = this.config.server, host = _this$config$server.host, port = _this$config$server.port;
                this.server.listen({
                  host: host,
                  port: port
                }, function () {
                  _this.endPoints.forEach(function (endPoint) {
                    _this.log.debug('GRAPHQL', "http://".concat(host, ":").concat(port).concat(endPoint.path));
                  });
                });

              case 4:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee, this);
      }));

      function start() {
        return _start.apply(this, arguments);
      }

      return start;
    }()
  }, {
    key: "addEndPoint",
    value: function addEndPoint(endPoint) {
      var _this2 = this;

      var typeDefs = endPoint.typeDefFileNames.map(function (x) {
        return _fs["default"].readFileSync(x, 'utf-8');
      }).join('\n');
      var config = {
        typeDefs: typeDefs,
        resolvers: endPoint.resolvers,
        subscriptions: {
          onConnect: function onConnect(connectionParams, _websocket, _context) {
            return {
              accessKey: connectionParams.accessKey || connectionParams.accesskey
            };
          }
        },
        context: function context(_ref) {
          var req = _ref.req,
              connection = _ref.connection;
          return {
            db: _this2.db,
            tracer: _this2.tracer,
            auth: _this2.auth,
            config: _this2.config,
            shared: _this2.shared,
            remoteAddress: req && req.socket && req.socket.remoteAddress || '',
            accessKey: _auth.Auth.extractAccessKey(req, connection),
            parentSpan: _tracer.QTracer.extractParentSpan(_this2.tracer, connection ? connection : req)
          };
        }
      };
      var apollo = new _apolloServerExpress.ApolloServer(config);
      apollo.applyMiddleware({
        app: this.app,
        path: endPoint.path
      });

      if (endPoint.supportSubscriptions) {
        apollo.installSubscriptionHandlers(this.server);
      }

      this.endPoints.push(endPoint);
    }
  }]);
  return TONQServer;
}();

exports["default"] = TONQServer;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9zZXJ2ZXIuanMiXSwibmFtZXMiOlsiVE9OUVNlcnZlciIsIm9wdGlvbnMiLCJjb25maWciLCJsb2dzIiwibG9nIiwiY3JlYXRlIiwic2hhcmVkIiwiTWFwIiwidHJhY2VyIiwiUVRyYWNlciIsImF1dGgiLCJBdXRoIiwiZW5kUG9pbnRzIiwiYXBwIiwic2VydmVyIiwiaHR0cCIsImNyZWF0ZVNlcnZlciIsImRiIiwiQXJhbmdvIiwiYWRkRW5kUG9pbnQiLCJwYXRoIiwicmVzb2x2ZXJzIiwicmVzb2x2ZXJzTWFtIiwidHlwZURlZkZpbGVOYW1lcyIsInN1cHBvcnRTdWJzY3JpcHRpb25zIiwic3RhcnQiLCJob3N0IiwicG9ydCIsImxpc3RlbiIsImZvckVhY2giLCJlbmRQb2ludCIsImRlYnVnIiwidHlwZURlZnMiLCJtYXAiLCJ4IiwiZnMiLCJyZWFkRmlsZVN5bmMiLCJqb2luIiwic3Vic2NyaXB0aW9ucyIsIm9uQ29ubmVjdCIsImNvbm5lY3Rpb25QYXJhbXMiLCJfd2Vic29ja2V0IiwiX2NvbnRleHQiLCJhY2Nlc3NLZXkiLCJhY2Nlc3NrZXkiLCJjb250ZXh0IiwicmVxIiwiY29ubmVjdGlvbiIsInJlbW90ZUFkZHJlc3MiLCJzb2NrZXQiLCJleHRyYWN0QWNjZXNzS2V5IiwicGFyZW50U3BhbiIsImV4dHJhY3RQYXJlbnRTcGFuIiwiYXBvbGxvIiwiQXBvbGxvU2VydmVyIiwiYXBwbHlNaWRkbGV3YXJlIiwiaW5zdGFsbFN1YnNjcmlwdGlvbkhhbmRsZXJzIiwicHVzaCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWlCQTs7QUFDQTs7QUFDQTs7QUFFQTs7QUFDQTs7QUFFQTs7QUFFQTs7QUFDQTs7QUFDQTs7QUFHQTs7QUFFQTs7QUFDQTs7QUFDQTs7QUFuQ0E7Ozs7Ozs7Ozs7Ozs7OztJQWlEcUJBLFU7OztBQWFqQixzQkFBWUMsT0FBWixFQUErQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtB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ICogQ29weXJpZ2h0IDIwMTgtMjAyMCBUT04gREVWIFNPTFVUSU9OUyBMVEQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIFNPRlRXQVJFIEVWQUxVQVRJT04gTGljZW5zZSAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlXG4gKiB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGVcbiAqIExpY2Vuc2UgYXQ6XG4gKlxuICogaHR0cDovL3d3dy50b24uZGV2L2xpY2Vuc2VzXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBUT04gREVWIHNvZnR3YXJlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8vIEBmbG93XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IGV4cHJlc3MgZnJvbSAnZXhwcmVzcyc7XG5pbXBvcnQgaHR0cCBmcm9tICdodHRwJztcblxuaW1wb3J0IHsgQXBvbGxvU2VydmVyLCBBcG9sbG9TZXJ2ZXJFeHByZXNzQ29uZmlnIH0gZnJvbSAnYXBvbGxvLXNlcnZlci1leHByZXNzJztcbmltcG9ydCB7IENvbm5lY3Rpb25Db250ZXh0IH0gZnJvbSAnc3Vic2NyaXB0aW9ucy10cmFuc3BvcnQtd3MnO1xuXG5pbXBvcnQgQXJhbmdvIGZyb20gJy4vYXJhbmdvJztcblxuaW1wb3J0IHsgY3JlYXRlUmVzb2x2ZXJzIH0gZnJvbSAnLi9yZXNvbHZlcnMtZ2VuZXJhdGVkJztcbmltcG9ydCB7IGF0dGFjaEN1c3RvbVJlc29sdmVycyB9IGZyb20gXCIuL3Jlc29sdmVycy1jdXN0b21cIjtcbmltcG9ydCB7IHJlc29sdmVyc01hbSB9IGZyb20gXCIuL3Jlc29sdmVycy1tYW1cIjtcblxuaW1wb3J0IHR5cGUgeyBRQ29uZmlnIH0gZnJvbSAnLi9jb25maWcnO1xuaW1wb3J0IFFMb2dzIGZyb20gJy4vbG9ncyc7XG5pbXBvcnQgdHlwZSB7IFFMb2cgfSBmcm9tICcuL2xvZ3MnO1xuaW1wb3J0IHsgUVRyYWNlciB9IGZyb20gXCIuL3RyYWNlclwiO1xuaW1wb3J0IHsgVHJhY2VyIH0gZnJvbSBcIm9wZW50cmFjaW5nXCI7XG5pbXBvcnQgeyBBdXRoIH0gZnJvbSAnLi9hdXRoJztcblxudHlwZSBRT3B0aW9ucyA9IHtcbiAgICBjb25maWc6IFFDb25maWcsXG4gICAgbG9nczogUUxvZ3MsXG59XG5cbnR5cGUgRW5kUG9pbnQgPSB7XG4gICAgcGF0aDogc3RyaW5nLFxuICAgIHJlc29sdmVyczogYW55LFxuICAgIHR5cGVEZWZGaWxlTmFtZXM6IHN0cmluZ1tdLFxuICAgIHN1cHBvcnRTdWJzY3JpcHRpb25zOiBib29sZWFuLFxufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBUT05RU2VydmVyIHtcbiAgICBjb25maWc6IFFDb25maWc7XG4gICAgbG9nczogUUxvZ3M7XG4gICAgbG9nOiBRTG9nO1xuICAgIGFwcDogZXhwcmVzcy5BcHBsaWNhdGlvbjtcbiAgICBzZXJ2ZXI6IGFueTtcbiAgICBlbmRQb2ludHM6IEVuZFBvaW50W107XG4gICAgZGI6IEFyYW5nbztcbiAgICB0cmFjZXI6IFRyYWNlcjtcbiAgICBhdXRoOiBBdXRoO1xuICAgIHNoYXJlZDogTWFwPHN0cmluZywgYW55PjtcblxuXG4gICAgY29uc3RydWN0b3Iob3B0aW9uczogUU9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5jb25maWcgPSBvcHRpb25zLmNvbmZpZztcbiAgICAgICAgdGhpcy5sb2dzID0gb3B0aW9ucy5sb2dzO1xuICAgICAgICB0aGlzLmxvZyA9IHRoaXMubG9ncy5jcmVhdGUoJ3NlcnZlcicpO1xuICAgICAgICB0aGlzLnNoYXJlZCA9IG5ldyBNYXAoKTtcbiAgICAgICAgdGhpcy50cmFjZXIgPSBRVHJhY2VyLmNyZWF0ZShvcHRpb25zLmNvbmZpZyk7XG4gICAgICAgIHRoaXMuYXV0aCA9IG5ldyBBdXRoKG9wdGlvbnMuY29uZmlnKTtcbiAgICAgICAgdGhpcy5lbmRQb2ludHMgPSBbXTtcbiAgICAgICAgdGhpcy5hcHAgPSBleHByZXNzKCk7XG4gICAgICAgIHRoaXMuc2VydmVyID0gaHR0cC5jcmVhdGVTZXJ2ZXIodGhpcy5hcHApO1xuICAgICAgICB0aGlzLmRiID0gbmV3IEFyYW5nbyh0aGlzLmNvbmZpZywgdGhpcy5sb2dzLCB0aGlzLmF1dGgsIHRoaXMudHJhY2VyKTtcbiAgICAgICAgdGhpcy5hZGRFbmRQb2ludCh7XG4gICAgICAgICAgICBwYXRoOiAnL2dyYXBocWwvbWFtJyxcbiAgICAgICAgICAgIHJlc29sdmVyczogcmVzb2x2ZXJzTWFtLFxuICAgICAgICAgICAgdHlwZURlZkZpbGVOYW1lczogWyd0eXBlLWRlZnMtbWFtLmdyYXBocWwnXSxcbiAgICAgICAgICAgIHN1cHBvcnRTdWJzY3JpcHRpb25zOiBmYWxzZSxcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuYWRkRW5kUG9pbnQoe1xuICAgICAgICAgICAgcGF0aDogJy9ncmFwaHFsJyxcbiAgICAgICAgICAgIHJlc29sdmVyczogYXR0YWNoQ3VzdG9tUmVzb2x2ZXJzKGNyZWF0ZVJlc29sdmVycyh0aGlzLmRiKSksXG4gICAgICAgICAgICB0eXBlRGVmRmlsZU5hbWVzOiBbJ3R5cGUtZGVmcy1nZW5lcmF0ZWQuZ3JhcGhxbCcsICd0eXBlLWRlZnMtY3VzdG9tLmdyYXBocWwnXSxcbiAgICAgICAgICAgIHN1cHBvcnRTdWJzY3JpcHRpb25zOiB0cnVlLFxuICAgICAgICB9KTtcbiAgICB9XG5cblxuICAgIGFzeW5jIHN0YXJ0KCkge1xuICAgICAgICBhd2FpdCB0aGlzLmRiLnN0YXJ0KCk7XG4gICAgICAgIGNvbnN0IHsgaG9zdCwgcG9ydCB9ID0gdGhpcy5jb25maWcuc2VydmVyO1xuICAgICAgICB0aGlzLnNlcnZlci5saXN0ZW4oeyBob3N0LCBwb3J0IH0sICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuZW5kUG9pbnRzLmZvckVhY2goKGVuZFBvaW50OiBFbmRQb2ludCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMubG9nLmRlYnVnKCdHUkFQSFFMJywgYGh0dHA6Ly8ke2hvc3R9OiR7cG9ydH0ke2VuZFBvaW50LnBhdGh9YCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG5cbiAgICBhZGRFbmRQb2ludChlbmRQb2ludDogRW5kUG9pbnQpIHtcbiAgICAgICAgY29uc3QgdHlwZURlZnMgPSBlbmRQb2ludC50eXBlRGVmRmlsZU5hbWVzXG4gICAgICAgICAgICAubWFwKHggPT4gZnMucmVhZEZpbGVTeW5jKHgsICd1dGYtOCcpKVxuICAgICAgICAgICAgLmpvaW4oJ1xcbicpO1xuICAgICAgICBjb25zdCBjb25maWc6IEFwb2xsb1NlcnZlckV4cHJlc3NDb25maWcgPSB7XG4gICAgICAgICAgICB0eXBlRGVmcyxcbiAgICAgICAgICAgIHJlc29sdmVyczogZW5kUG9pbnQucmVzb2x2ZXJzLFxuICAgICAgICAgICAgc3Vic2NyaXB0aW9uczoge1xuICAgICAgICAgICAgICAgIG9uQ29ubmVjdChjb25uZWN0aW9uUGFyYW1zOiBPYmplY3QsIF93ZWJzb2NrZXQ6IFdlYlNvY2tldCwgX2NvbnRleHQ6IENvbm5lY3Rpb25Db250ZXh0KTogYW55IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjY2Vzc0tleTogY29ubmVjdGlvblBhcmFtcy5hY2Nlc3NLZXkgfHwgY29ubmVjdGlvblBhcmFtcy5hY2Nlc3NrZXksXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY29udGV4dDogKHsgcmVxLCBjb25uZWN0aW9uIH0pID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBkYjogdGhpcy5kYixcbiAgICAgICAgICAgICAgICAgICAgdHJhY2VyOiB0aGlzLnRyYWNlcixcbiAgICAgICAgICAgICAgICAgICAgYXV0aDogdGhpcy5hdXRoLFxuICAgICAgICAgICAgICAgICAgICBjb25maWc6IHRoaXMuY29uZmlnLFxuICAgICAgICAgICAgICAgICAgICBzaGFyZWQ6IHRoaXMuc2hhcmVkLFxuICAgICAgICAgICAgICAgICAgICByZW1vdGVBZGRyZXNzOiAocmVxICYmIHJlcS5zb2NrZXQgJiYgcmVxLnNvY2tldC5yZW1vdGVBZGRyZXNzKSB8fCAnJyxcbiAgICAgICAgICAgICAgICAgICAgYWNjZXNzS2V5OiBBdXRoLmV4dHJhY3RBY2Nlc3NLZXkocmVxLCBjb25uZWN0aW9uKSxcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50U3BhbjogUVRyYWNlci5leHRyYWN0UGFyZW50U3Bhbih0aGlzLnRyYWNlciwgY29ubmVjdGlvbiA/IGNvbm5lY3Rpb24gOiByZXEpLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9LFxuICAgICAgICB9O1xuICAgICAgICBjb25zdCBhcG9sbG8gPSBuZXcgQXBvbGxvU2VydmVyKGNvbmZpZyk7XG4gICAgICAgIGFwb2xsby5hcHBseU1pZGRsZXdhcmUoeyBhcHA6IHRoaXMuYXBwLCBwYXRoOiBlbmRQb2ludC5wYXRoIH0pO1xuICAgICAgICBpZiAoZW5kUG9pbnQuc3VwcG9ydFN1YnNjcmlwdGlvbnMpIHtcbiAgICAgICAgICAgIGFwb2xsby5pbnN0YWxsU3Vic2NyaXB0aW9uSGFuZGxlcnModGhpcy5zZXJ2ZXIpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZW5kUG9pbnRzLnB1c2goZW5kUG9pbnQpO1xuICAgIH1cblxuXG59XG5cbiJdfQ==