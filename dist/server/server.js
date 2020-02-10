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

var _arango = _interopRequireDefault(require("./arango"));

var _resolversGenerated = require("./resolvers-generated");

var _resolversCustom = require("./resolvers-custom");

var _resolversMam = require("./resolvers-mam");

var _logs = _interopRequireDefault(require("./logs"));

var _tracer = require("./tracer");

var _opentracing = require("opentracing");

var _qAuth = _interopRequireDefault(require("./q-auth"));

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
    this.auth = new _qAuth["default"](options.config);
    this.endPoints = [];
    this.app = (0, _express["default"])();
    this.server = _http["default"].createServer(this.app);
    this.db = new _arango["default"](this.config, this.logs, this.tracer);
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

        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
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
                return _context.stop();
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
      var apollo = new _apolloServerExpress.ApolloServer({
        typeDefs: typeDefs,
        resolvers: endPoint.resolvers,
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
            accessKey: _qAuth["default"].extractAccessKey(req),
            parentSpan: _tracer.QTracer.extractParentSpan(_this2.tracer, connection ? connection : req)
          };
        }
      });
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9zZXJ2ZXIuanMiXSwibmFtZXMiOlsiVE9OUVNlcnZlciIsIm9wdGlvbnMiLCJjb25maWciLCJsb2dzIiwibG9nIiwiY3JlYXRlIiwic2hhcmVkIiwiTWFwIiwidHJhY2VyIiwiUVRyYWNlciIsImF1dGgiLCJRQXV0aCIsImVuZFBvaW50cyIsImFwcCIsInNlcnZlciIsImh0dHAiLCJjcmVhdGVTZXJ2ZXIiLCJkYiIsIkFyYW5nbyIsImFkZEVuZFBvaW50IiwicGF0aCIsInJlc29sdmVycyIsInJlc29sdmVyc01hbSIsInR5cGVEZWZGaWxlTmFtZXMiLCJzdXBwb3J0U3Vic2NyaXB0aW9ucyIsInN0YXJ0IiwiaG9zdCIsInBvcnQiLCJsaXN0ZW4iLCJmb3JFYWNoIiwiZW5kUG9pbnQiLCJkZWJ1ZyIsInR5cGVEZWZzIiwibWFwIiwieCIsImZzIiwicmVhZEZpbGVTeW5jIiwiam9pbiIsImFwb2xsbyIsIkFwb2xsb1NlcnZlciIsImNvbnRleHQiLCJyZXEiLCJjb25uZWN0aW9uIiwicmVtb3RlQWRkcmVzcyIsInNvY2tldCIsImFjY2Vzc0tleSIsImV4dHJhY3RBY2Nlc3NLZXkiLCJwYXJlbnRTcGFuIiwiZXh0cmFjdFBhcmVudFNwYW4iLCJhcHBseU1pZGRsZXdhcmUiLCJpbnN0YWxsU3Vic2NyaXB0aW9uSGFuZGxlcnMiLCJwdXNoIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBaUJBOztBQUNBOztBQUNBOztBQUVBOztBQUVBOztBQUVBOztBQUNBOztBQUNBOztBQUdBOztBQUVBOztBQUNBOztBQUNBOztBQWxDQTs7Ozs7Ozs7Ozs7Ozs7O0lBZ0RxQkEsVTs7O0FBYWpCLHNCQUFZQyxPQUFaLEVBQStCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUMzQixTQUFLQyxNQUFMLEdBQWNELE9BQU8sQ0FBQ0MsTUFBdEI7QUFDQSxTQUFLQyxJQUFMLEdBQVlGLE9B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QU1IcUMsWUFBQUEsYUFBYSxFQUFHRixHQUFHLElBQUlBLEdBQUcsQ0FBQ0csTUFBWCxJQUFxQkgsR0FBRyxDQUFDRyxNQUFKLENBQVdELGFBQWpDLElBQW1ELEVBTi9EO0FBT0hFLFlBQUFBLFNBQVMsRUFBRWxDLGtCQUFNbUMsZ0JBQU4sQ0FBdUJMLEdBQXZCLENBUFI7QUFRSE0sWUFBQUEsVUFBVSxFQUFFdEMsZ0JBQVF1QyxpQkFBUixDQUEwQixNQUFJLENBQUN4QyxNQUEvQixFQUF1Q2tDLFVBQVUsR0FBR0EsVUFBSCxHQUFnQkQsR0FBakU7QUFSVCxXQUFQO0FBVUg7QUFkMkIsT0FBakIsQ0FBZjtBQWdCQUgsTUFBQUEsTUFBTSxDQUFDVyxlQUFQLENBQXVCO0FBQUVwQyxRQUFBQSxHQUFHLEVBQUUsS0FBS0EsR0FBWjtBQUFpQk8sUUFBQUEsSUFBSSxFQUFFVSxRQUFRLENBQUNWO0FBQWhDLE9BQXZCOztBQUNBLFVBQUlVLFFBQVEsQ0FBQ04sb0JBQWIsRUFBbUM7QUFDL0JjLFFBQUFBLE1BQU0sQ0FBQ1ksMkJBQVAsQ0FBbUMsS0FBS3BDLE1BQXhDO0FBQ0g7O0FBQ0QsV0FBS0YsU0FBTCxDQUFldUMsSUFBZixDQUFvQnJCLFFBQXBCO0FBQ0giLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IDIwMTgtMjAyMCBUT04gREVWIFNPTFVUSU9OUyBMVEQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIFNPRlRXQVJFIEVWQUxVQVRJT04gTGljZW5zZSAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlXG4gKiB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGVcbiAqIExpY2Vuc2UgYXQ6XG4gKlxuICogaHR0cDovL3d3dy50b24uZGV2L2xpY2Vuc2VzXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBUT04gREVWIHNvZnR3YXJlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8vIEBmbG93XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IGV4cHJlc3MgZnJvbSAnZXhwcmVzcyc7XG5pbXBvcnQgaHR0cCBmcm9tICdodHRwJztcblxuaW1wb3J0IHsgQXBvbGxvU2VydmVyIH0gZnJvbSAnYXBvbGxvLXNlcnZlci1leHByZXNzJztcblxuaW1wb3J0IEFyYW5nbyBmcm9tICcuL2FyYW5nbyc7XG5cbmltcG9ydCB7IGNyZWF0ZVJlc29sdmVycyB9IGZyb20gJy4vcmVzb2x2ZXJzLWdlbmVyYXRlZCc7XG5pbXBvcnQgeyBhdHRhY2hDdXN0b21SZXNvbHZlcnMgfSBmcm9tIFwiLi9yZXNvbHZlcnMtY3VzdG9tXCI7XG5pbXBvcnQgeyByZXNvbHZlcnNNYW0gfSBmcm9tIFwiLi9yZXNvbHZlcnMtbWFtXCI7XG5cbmltcG9ydCB0eXBlIHsgUUNvbmZpZyB9IGZyb20gJy4vY29uZmlnJztcbmltcG9ydCBRTG9ncyBmcm9tICcuL2xvZ3MnO1xuaW1wb3J0IHR5cGUgeyBRTG9nIH0gZnJvbSAnLi9sb2dzJztcbmltcG9ydCB7IFFUcmFjZXIgfSBmcm9tIFwiLi90cmFjZXJcIjtcbmltcG9ydCB7IFRyYWNlciB9IGZyb20gXCJvcGVudHJhY2luZ1wiO1xuaW1wb3J0IFFBdXRoIGZyb20gJy4vcS1hdXRoJztcblxudHlwZSBRT3B0aW9ucyA9IHtcbiAgICBjb25maWc6IFFDb25maWcsXG4gICAgbG9nczogUUxvZ3MsXG59XG5cbnR5cGUgRW5kUG9pbnQgPSB7XG4gICAgcGF0aDogc3RyaW5nLFxuICAgIHJlc29sdmVyczogYW55LFxuICAgIHR5cGVEZWZGaWxlTmFtZXM6IHN0cmluZ1tdLFxuICAgIHN1cHBvcnRTdWJzY3JpcHRpb25zOiBib29sZWFuLFxufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBUT05RU2VydmVyIHtcbiAgICBjb25maWc6IFFDb25maWc7XG4gICAgbG9nczogUUxvZ3M7XG4gICAgbG9nOiBRTG9nO1xuICAgIGFwcDogZXhwcmVzcy5BcHBsaWNhdGlvbjtcbiAgICBzZXJ2ZXI6IGFueTtcbiAgICBlbmRQb2ludHM6IEVuZFBvaW50W107XG4gICAgZGI6IEFyYW5nbztcbiAgICB0cmFjZXI6IFRyYWNlcjtcbiAgICBhdXRoOiBRQXV0aDtcbiAgICBzaGFyZWQ6IE1hcDxzdHJpbmcsIGFueT47XG5cblxuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnM6IFFPcHRpb25zKSB7XG4gICAgICAgIHRoaXMuY29uZmlnID0gb3B0aW9ucy5jb25maWc7XG4gICAgICAgIHRoaXMubG9ncyA9IG9wdGlvbnMubG9ncztcbiAgICAgICAgdGhpcy5sb2cgPSB0aGlzLmxvZ3MuY3JlYXRlKCdzZXJ2ZXInKTtcbiAgICAgICAgdGhpcy5zaGFyZWQgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMudHJhY2VyID0gUVRyYWNlci5jcmVhdGUob3B0aW9ucy5jb25maWcpO1xuICAgICAgICB0aGlzLmF1dGggPSBuZXcgUUF1dGgob3B0aW9ucy5jb25maWcpO1xuICAgICAgICB0aGlzLmVuZFBvaW50cyA9IFtdO1xuICAgICAgICB0aGlzLmFwcCA9IGV4cHJlc3MoKTtcbiAgICAgICAgdGhpcy5zZXJ2ZXIgPSBodHRwLmNyZWF0ZVNlcnZlcih0aGlzLmFwcCk7XG4gICAgICAgIHRoaXMuZGIgPSBuZXcgQXJhbmdvKHRoaXMuY29uZmlnLCB0aGlzLmxvZ3MsIHRoaXMudHJhY2VyKTtcbiAgICAgICAgdGhpcy5hZGRFbmRQb2ludCh7XG4gICAgICAgICAgICBwYXRoOiAnL2dyYXBocWwvbWFtJyxcbiAgICAgICAgICAgIHJlc29sdmVyczogcmVzb2x2ZXJzTWFtLFxuICAgICAgICAgICAgdHlwZURlZkZpbGVOYW1lczogWyd0eXBlLWRlZnMtbWFtLmdyYXBocWwnXSxcbiAgICAgICAgICAgIHN1cHBvcnRTdWJzY3JpcHRpb25zOiBmYWxzZSxcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuYWRkRW5kUG9pbnQoe1xuICAgICAgICAgICAgcGF0aDogJy9ncmFwaHFsJyxcbiAgICAgICAgICAgIHJlc29sdmVyczogYXR0YWNoQ3VzdG9tUmVzb2x2ZXJzKGNyZWF0ZVJlc29sdmVycyh0aGlzLmRiKSksXG4gICAgICAgICAgICB0eXBlRGVmRmlsZU5hbWVzOiBbJ3R5cGUtZGVmcy1nZW5lcmF0ZWQuZ3JhcGhxbCcsICd0eXBlLWRlZnMtY3VzdG9tLmdyYXBocWwnXSxcbiAgICAgICAgICAgIHN1cHBvcnRTdWJzY3JpcHRpb25zOiB0cnVlLFxuICAgICAgICB9KTtcbiAgICB9XG5cblxuICAgIGFzeW5jIHN0YXJ0KCkge1xuICAgICAgICBhd2FpdCB0aGlzLmRiLnN0YXJ0KCk7XG4gICAgICAgIGNvbnN0IHsgaG9zdCwgcG9ydCB9ID0gdGhpcy5jb25maWcuc2VydmVyO1xuICAgICAgICB0aGlzLnNlcnZlci5saXN0ZW4oeyBob3N0LCBwb3J0IH0sICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuZW5kUG9pbnRzLmZvckVhY2goKGVuZFBvaW50OiBFbmRQb2ludCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMubG9nLmRlYnVnKCdHUkFQSFFMJywgYGh0dHA6Ly8ke2hvc3R9OiR7cG9ydH0ke2VuZFBvaW50LnBhdGh9YCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG5cbiAgICBhZGRFbmRQb2ludChlbmRQb2ludDogRW5kUG9pbnQpIHtcbiAgICAgICAgY29uc3QgdHlwZURlZnMgPSBlbmRQb2ludC50eXBlRGVmRmlsZU5hbWVzXG4gICAgICAgICAgICAubWFwKHggPT4gZnMucmVhZEZpbGVTeW5jKHgsICd1dGYtOCcpKVxuICAgICAgICAgICAgLmpvaW4oJ1xcbicpO1xuICAgICAgICBjb25zdCBhcG9sbG8gPSBuZXcgQXBvbGxvU2VydmVyKHtcbiAgICAgICAgICAgIHR5cGVEZWZzLFxuICAgICAgICAgICAgcmVzb2x2ZXJzOiBlbmRQb2ludC5yZXNvbHZlcnMsXG4gICAgICAgICAgICBjb250ZXh0OiAoeyByZXEsIGNvbm5lY3Rpb24gfSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIGRiOiB0aGlzLmRiLFxuICAgICAgICAgICAgICAgICAgICB0cmFjZXI6IHRoaXMudHJhY2VyLFxuICAgICAgICAgICAgICAgICAgICBhdXRoOiB0aGlzLmF1dGgsXG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZzogdGhpcy5jb25maWcsXG4gICAgICAgICAgICAgICAgICAgIHNoYXJlZDogdGhpcy5zaGFyZWQsXG4gICAgICAgICAgICAgICAgICAgIHJlbW90ZUFkZHJlc3M6IChyZXEgJiYgcmVxLnNvY2tldCAmJiByZXEuc29ja2V0LnJlbW90ZUFkZHJlc3MpIHx8ICcnLFxuICAgICAgICAgICAgICAgICAgICBhY2Nlc3NLZXk6IFFBdXRoLmV4dHJhY3RBY2Nlc3NLZXkocmVxKSxcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50U3BhbjogUVRyYWNlci5leHRyYWN0UGFyZW50U3Bhbih0aGlzLnRyYWNlciwgY29ubmVjdGlvbiA/IGNvbm5lY3Rpb24gOiByZXEpLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9LFxuICAgICAgICB9KTtcbiAgICAgICAgYXBvbGxvLmFwcGx5TWlkZGxld2FyZSh7IGFwcDogdGhpcy5hcHAsIHBhdGg6IGVuZFBvaW50LnBhdGggfSk7XG4gICAgICAgIGlmIChlbmRQb2ludC5zdXBwb3J0U3Vic2NyaXB0aW9ucykge1xuICAgICAgICAgICAgYXBvbGxvLmluc3RhbGxTdWJzY3JpcHRpb25IYW5kbGVycyh0aGlzLnNlcnZlcik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5lbmRQb2ludHMucHVzaChlbmRQb2ludCk7XG4gICAgfVxuXG5cbn1cblxuIl19