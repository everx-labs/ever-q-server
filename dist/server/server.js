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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9zZXJ2ZXIuanMiXSwibmFtZXMiOlsiVE9OUVNlcnZlciIsIm9wdGlvbnMiLCJjb25maWciLCJsb2dzIiwibG9nIiwiY3JlYXRlIiwic2hhcmVkIiwiTWFwIiwidHJhY2VyIiwiUVRyYWNlciIsImF1dGgiLCJBdXRoIiwiZW5kUG9pbnRzIiwiYXBwIiwic2VydmVyIiwiaHR0cCIsImNyZWF0ZVNlcnZlciIsImRiIiwiQXJhbmdvIiwiYWRkRW5kUG9pbnQiLCJwYXRoIiwicmVzb2x2ZXJzIiwicmVzb2x2ZXJzTWFtIiwidHlwZURlZkZpbGVOYW1lcyIsInN1cHBvcnRTdWJzY3JpcHRpb25zIiwic3RhcnQiLCJob3N0IiwicG9ydCIsImxpc3RlbiIsImZvckVhY2giLCJlbmRQb2ludCIsImRlYnVnIiwidHlwZURlZnMiLCJtYXAiLCJ4IiwiZnMiLCJyZWFkRmlsZVN5bmMiLCJqb2luIiwic3Vic2NyaXB0aW9ucyIsIm9uQ29ubmVjdCIsImNvbm5lY3Rpb25QYXJhbXMiLCJfd2Vic29ja2V0IiwiX2NvbnRleHQiLCJhY2Nlc3NLZXkiLCJhY2Nlc3NrZXkiLCJjb250ZXh0IiwicmVxIiwiY29ubmVjdGlvbiIsInJlbW90ZUFkZHJlc3MiLCJzb2NrZXQiLCJleHRyYWN0QWNjZXNzS2V5IiwicGFyZW50U3BhbiIsImV4dHJhY3RQYXJlbnRTcGFuIiwiYXBvbGxvIiwiQXBvbGxvU2VydmVyIiwiYXBwbHlNaWRkbGV3YXJlIiwiaW5zdGFsbFN1YnNjcmlwdGlvbkhhbmRsZXJzIiwicHVzaCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWlCQTs7QUFDQTs7QUFDQTs7QUFFQTs7QUFDQTs7QUFFQTs7QUFFQTs7QUFDQTs7QUFDQTs7QUFHQTs7QUFFQTs7QUFDQTs7QUFDQTs7QUFuQ0E7Ozs7Ozs7Ozs7Ozs7OztJQWlEcUJBLFU7OztBQWFqQixzQkFBWUMsT0FBWixFQUErQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtB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ICogQ29weXJpZ2h0IDIwMTgtMjAyMCBUT04gREVWIFNPTFVUSU9OUyBMVEQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIFNPRlRXQVJFIEVWQUxVQVRJT04gTGljZW5zZSAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlXG4gKiB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGVcbiAqIExpY2Vuc2UgYXQ6XG4gKlxuICogaHR0cDovL3d3dy50b24uZGV2L2xpY2Vuc2VzXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBUT04gREVWIHNvZnR3YXJlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8vIEBmbG93XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IGV4cHJlc3MgZnJvbSAnZXhwcmVzcyc7XG5pbXBvcnQgaHR0cCBmcm9tICdodHRwJztcblxuaW1wb3J0IHsgQXBvbGxvU2VydmVyLCBBcG9sbG9TZXJ2ZXJFeHByZXNzQ29uZmlnIH0gZnJvbSAnYXBvbGxvLXNlcnZlci1leHByZXNzJztcbmltcG9ydCB7IENvbm5lY3Rpb25Db250ZXh0IH0gZnJvbSBcInN1YnNjcmlwdGlvbnMtdHJhbnNwb3J0LXdzXCI7XG5cbmltcG9ydCBBcmFuZ28gZnJvbSAnLi9hcmFuZ28nO1xuXG5pbXBvcnQgeyBjcmVhdGVSZXNvbHZlcnMgfSBmcm9tICcuL3Jlc29sdmVycy1nZW5lcmF0ZWQnO1xuaW1wb3J0IHsgYXR0YWNoQ3VzdG9tUmVzb2x2ZXJzIH0gZnJvbSBcIi4vcmVzb2x2ZXJzLWN1c3RvbVwiO1xuaW1wb3J0IHsgcmVzb2x2ZXJzTWFtIH0gZnJvbSBcIi4vcmVzb2x2ZXJzLW1hbVwiO1xuXG5pbXBvcnQgdHlwZSB7IFFDb25maWcgfSBmcm9tICcuL2NvbmZpZyc7XG5pbXBvcnQgUUxvZ3MgZnJvbSAnLi9sb2dzJztcbmltcG9ydCB0eXBlIHsgUUxvZyB9IGZyb20gJy4vbG9ncyc7XG5pbXBvcnQgeyBRVHJhY2VyIH0gZnJvbSBcIi4vdHJhY2VyXCI7XG5pbXBvcnQgeyBUcmFjZXIgfSBmcm9tIFwib3BlbnRyYWNpbmdcIjtcbmltcG9ydCB7IEF1dGggfSBmcm9tICcuL2F1dGgnO1xuXG50eXBlIFFPcHRpb25zID0ge1xuICAgIGNvbmZpZzogUUNvbmZpZyxcbiAgICBsb2dzOiBRTG9ncyxcbn1cblxudHlwZSBFbmRQb2ludCA9IHtcbiAgICBwYXRoOiBzdHJpbmcsXG4gICAgcmVzb2x2ZXJzOiBhbnksXG4gICAgdHlwZURlZkZpbGVOYW1lczogc3RyaW5nW10sXG4gICAgc3VwcG9ydFN1YnNjcmlwdGlvbnM6IGJvb2xlYW4sXG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFRPTlFTZXJ2ZXIge1xuICAgIGNvbmZpZzogUUNvbmZpZztcbiAgICBsb2dzOiBRTG9ncztcbiAgICBsb2c6IFFMb2c7XG4gICAgYXBwOiBleHByZXNzLkFwcGxpY2F0aW9uO1xuICAgIHNlcnZlcjogYW55O1xuICAgIGVuZFBvaW50czogRW5kUG9pbnRbXTtcbiAgICBkYjogQXJhbmdvO1xuICAgIHRyYWNlcjogVHJhY2VyO1xuICAgIGF1dGg6IEF1dGg7XG4gICAgc2hhcmVkOiBNYXA8c3RyaW5nLCBhbnk+O1xuXG5cbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zOiBRT3B0aW9ucykge1xuICAgICAgICB0aGlzLmNvbmZpZyA9IG9wdGlvbnMuY29uZmlnO1xuICAgICAgICB0aGlzLmxvZ3MgPSBvcHRpb25zLmxvZ3M7XG4gICAgICAgIHRoaXMubG9nID0gdGhpcy5sb2dzLmNyZWF0ZSgnc2VydmVyJyk7XG4gICAgICAgIHRoaXMuc2hhcmVkID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLnRyYWNlciA9IFFUcmFjZXIuY3JlYXRlKG9wdGlvbnMuY29uZmlnKTtcbiAgICAgICAgdGhpcy5hdXRoID0gbmV3IEF1dGgob3B0aW9ucy5jb25maWcpO1xuICAgICAgICB0aGlzLmVuZFBvaW50cyA9IFtdO1xuICAgICAgICB0aGlzLmFwcCA9IGV4cHJlc3MoKTtcbiAgICAgICAgdGhpcy5zZXJ2ZXIgPSBodHRwLmNyZWF0ZVNlcnZlcih0aGlzLmFwcCk7XG4gICAgICAgIHRoaXMuZGIgPSBuZXcgQXJhbmdvKHRoaXMuY29uZmlnLCB0aGlzLmxvZ3MsIHRoaXMuYXV0aCwgdGhpcy50cmFjZXIpO1xuICAgICAgICB0aGlzLmFkZEVuZFBvaW50KHtcbiAgICAgICAgICAgIHBhdGg6ICcvZ3JhcGhxbC9tYW0nLFxuICAgICAgICAgICAgcmVzb2x2ZXJzOiByZXNvbHZlcnNNYW0sXG4gICAgICAgICAgICB0eXBlRGVmRmlsZU5hbWVzOiBbJ3R5cGUtZGVmcy1tYW0uZ3JhcGhxbCddLFxuICAgICAgICAgICAgc3VwcG9ydFN1YnNjcmlwdGlvbnM6IGZhbHNlLFxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5hZGRFbmRQb2ludCh7XG4gICAgICAgICAgICBwYXRoOiAnL2dyYXBocWwnLFxuICAgICAgICAgICAgcmVzb2x2ZXJzOiBhdHRhY2hDdXN0b21SZXNvbHZlcnMoY3JlYXRlUmVzb2x2ZXJzKHRoaXMuZGIpKSxcbiAgICAgICAgICAgIHR5cGVEZWZGaWxlTmFtZXM6IFsndHlwZS1kZWZzLWdlbmVyYXRlZC5ncmFwaHFsJywgJ3R5cGUtZGVmcy1jdXN0b20uZ3JhcGhxbCddLFxuICAgICAgICAgICAgc3VwcG9ydFN1YnNjcmlwdGlvbnM6IHRydWUsXG4gICAgICAgIH0pO1xuICAgIH1cblxuXG4gICAgYXN5bmMgc3RhcnQoKSB7XG4gICAgICAgIGF3YWl0IHRoaXMuZGIuc3RhcnQoKTtcbiAgICAgICAgY29uc3QgeyBob3N0LCBwb3J0IH0gPSB0aGlzLmNvbmZpZy5zZXJ2ZXI7XG4gICAgICAgIHRoaXMuc2VydmVyLmxpc3Rlbih7IGhvc3QsIHBvcnQgfSwgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5lbmRQb2ludHMuZm9yRWFjaCgoZW5kUG9pbnQ6IEVuZFBvaW50KSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoJ0dSQVBIUUwnLCBgaHR0cDovLyR7aG9zdH06JHtwb3J0fSR7ZW5kUG9pbnQucGF0aH1gKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cblxuICAgIGFkZEVuZFBvaW50KGVuZFBvaW50OiBFbmRQb2ludCkge1xuICAgICAgICBjb25zdCB0eXBlRGVmcyA9IGVuZFBvaW50LnR5cGVEZWZGaWxlTmFtZXNcbiAgICAgICAgICAgIC5tYXAoeCA9PiBmcy5yZWFkRmlsZVN5bmMoeCwgJ3V0Zi04JykpXG4gICAgICAgICAgICAuam9pbignXFxuJyk7XG4gICAgICAgIGNvbnN0IGNvbmZpZzogQXBvbGxvU2VydmVyRXhwcmVzc0NvbmZpZyA9IHtcbiAgICAgICAgICAgIHR5cGVEZWZzLFxuICAgICAgICAgICAgcmVzb2x2ZXJzOiBlbmRQb2ludC5yZXNvbHZlcnMsXG4gICAgICAgICAgICBzdWJzY3JpcHRpb25zOiB7XG4gICAgICAgICAgICAgICAgb25Db25uZWN0KGNvbm5lY3Rpb25QYXJhbXM6IE9iamVjdCwgX3dlYnNvY2tldDogV2ViU29ja2V0LCBfY29udGV4dDogQ29ubmVjdGlvbkNvbnRleHQpOiBhbnkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWNjZXNzS2V5OiBjb25uZWN0aW9uUGFyYW1zLmFjY2Vzc0tleSB8fCBjb25uZWN0aW9uUGFyYW1zLmFjY2Vzc2tleSxcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjb250ZXh0OiAoeyByZXEsIGNvbm5lY3Rpb24gfSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIGRiOiB0aGlzLmRiLFxuICAgICAgICAgICAgICAgICAgICB0cmFjZXI6IHRoaXMudHJhY2VyLFxuICAgICAgICAgICAgICAgICAgICBhdXRoOiB0aGlzLmF1dGgsXG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZzogdGhpcy5jb25maWcsXG4gICAgICAgICAgICAgICAgICAgIHNoYXJlZDogdGhpcy5zaGFyZWQsXG4gICAgICAgICAgICAgICAgICAgIHJlbW90ZUFkZHJlc3M6IChyZXEgJiYgcmVxLnNvY2tldCAmJiByZXEuc29ja2V0LnJlbW90ZUFkZHJlc3MpIHx8ICcnLFxuICAgICAgICAgICAgICAgICAgICBhY2Nlc3NLZXk6IEF1dGguZXh0cmFjdEFjY2Vzc0tleShyZXEsIGNvbm5lY3Rpb24pLFxuICAgICAgICAgICAgICAgICAgICBwYXJlbnRTcGFuOiBRVHJhY2VyLmV4dHJhY3RQYXJlbnRTcGFuKHRoaXMudHJhY2VyLCBjb25uZWN0aW9uID8gY29ubmVjdGlvbiA6IHJlcSksXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IGFwb2xsbyA9IG5ldyBBcG9sbG9TZXJ2ZXIoY29uZmlnKTtcbiAgICAgICAgYXBvbGxvLmFwcGx5TWlkZGxld2FyZSh7IGFwcDogdGhpcy5hcHAsIHBhdGg6IGVuZFBvaW50LnBhdGggfSk7XG4gICAgICAgIGlmIChlbmRQb2ludC5zdXBwb3J0U3Vic2NyaXB0aW9ucykge1xuICAgICAgICAgICAgYXBvbGxvLmluc3RhbGxTdWJzY3JpcHRpb25IYW5kbGVycyh0aGlzLnNlcnZlcik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5lbmRQb2ludHMucHVzaChlbmRQb2ludCk7XG4gICAgfVxuXG5cbn1cblxuIl19