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

var _https = _interopRequireDefault(require("https"));

var _apolloServerExpress = require("apollo-server-express");

var _arango = _interopRequireDefault(require("./arango"));

var _arangoResolvers = require("./arango-resolvers");

var _logs = _interopRequireDefault(require("./logs"));

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
var TONQServer =
/*#__PURE__*/
function () {
  function TONQServer(options) {
    (0, _classCallCheck2["default"])(this, TONQServer);
    (0, _defineProperty2["default"])(this, "config", void 0);
    (0, _defineProperty2["default"])(this, "logs", void 0);
    (0, _defineProperty2["default"])(this, "log", void 0);
    (0, _defineProperty2["default"])(this, "db", void 0);
    this.config = options.config;
    this.logs = options.logs;
    this.log = this.logs.create('Q Server');
  }

  (0, _createClass2["default"])(TONQServer, [{
    key: "start",
    value: function () {
      var _start = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee() {
        var _this = this;

        var config, ssl, typeDefs, resolvers, apollo, app, server;
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                config = this.config.server;
                ssl = config.ssl;
                this.db = new _arango["default"](this.config, this.logs);
                typeDefs = _fs["default"].readFileSync('type-defs.graphql', 'utf-8');
                resolvers = (0, _arangoResolvers.createResolvers)(this.db);
                _context.next = 7;
                return this.db.start();

              case 7:
                apollo = new _apolloServerExpress.ApolloServer({
                  typeDefs: typeDefs,
                  resolvers: resolvers
                });
                app = (0, _express["default"])();
                apollo.applyMiddleware({
                  app: app,
                  path: '/graphql'
                });

                if (ssl) {
                  server = _https["default"].createServer({
                    key: _fs["default"].readFileSync(ssl.key),
                    cert: _fs["default"].readFileSync(ssl.cert)
                  }, app);
                } else {
                  server = _http["default"].createServer(app);
                }

                apollo.installSubscriptionHandlers(server);
                server.listen({
                  host: config.host,
                  port: ssl ? ssl.port : config.port
                }, function () {
                  var uri = "http".concat(ssl ? 's' : '', "://").concat(config.host, ":").concat(ssl ? ssl.port : config.port, "/graphql");

                  _this.log.debug("Started on ".concat(uri));
                });

              case 13:
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
  }]);
  return TONQServer;
}();

exports["default"] = TONQServer;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9zZXJ2ZXIuanMiXSwibmFtZXMiOlsiVE9OUVNlcnZlciIsIm9wdGlvbnMiLCJjb25maWciLCJsb2dzIiwibG9nIiwiY3JlYXRlIiwic2VydmVyIiwic3NsIiwiZGIiLCJBcmFuZ28iLCJ0eXBlRGVmcyIsImZzIiwicmVhZEZpbGVTeW5jIiwicmVzb2x2ZXJzIiwic3RhcnQiLCJhcG9sbG8iLCJBcG9sbG9TZXJ2ZXIiLCJhcHAiLCJhcHBseU1pZGRsZXdhcmUiLCJwYXRoIiwiaHR0cHMiLCJjcmVhdGVTZXJ2ZXIiLCJrZXkiLCJjZXJ0IiwiaHR0cCIsImluc3RhbGxTdWJzY3JpcHRpb25IYW5kbGVycyIsImxpc3RlbiIsImhvc3QiLCJwb3J0IiwidXJpIiwiZGVidWciXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFpQkE7O0FBRUE7O0FBQ0E7O0FBQ0E7O0FBRUE7O0FBRUE7O0FBRUE7O0FBRUE7O0FBN0JBOzs7Ozs7Ozs7Ozs7Ozs7SUFxQ3FCQSxVOzs7QUFNakIsc0JBQVlDLE9BQVosRUFBK0I7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQzNCLFNBQUtDLE1BQUwsR0FBY0QsT0FBTyxDQUFDQyxNQUF0QjtBQUNBLFNBQUtDLElBQUwsR0FBWUYsT0FBTyxDQUFDRSxJQUFwQjtBQUNBLFNBQUtDLEdBQUwsR0FBVyxLQUFLRCxJQUFMLENBQVVFLE1BQVYsQ0FBaUIsVUFBakIsQ0FBWDtBQUNIOzs7Ozs7Ozs7Ozs7Ozs7QUFJU0gsZ0JBQUFBLE0sR0FBUyxLQUFLQSxNQUFMLENBQVlJLE07QUFDckJDLGdCQUFBQSxHLEdBQU1MLE1BQU0sQ0FBQ0ssRztBQUVuQixxQkFBS0MsRUFBTCxHQUFVLElBQUlDLGtCQUFKLENBQVcsS0FBS1AsTUFBaEIsRUFBd0IsS0FBS0MsSUFBN0IsQ0FBVjtBQUNNTyxnQkFBQUEsUSxHQUFXQyxlQUFHQyxZQUFILENBQWdCLG1CQUFoQixFQUFxQyxPQUFyQyxDO0FBQ1hDLGdCQUFBQSxTLEdBQVksc0NBQWdCLEtBQUtMLEVBQXJCLEM7O3VCQUNaLEtBQUtBLEVBQUwsQ0FBUU0sS0FBUixFOzs7QUFFQUMsZ0JBQUFBLE0sR0FBUyxJQUFJQyxpQ0FBSixDQUFpQjtBQUM1Qk4sa0JBQUFBLFFBQVEsRUFBUkEsUUFENEI7QUFFNUJHLGtCQUFBQSxTQUFTLEVBQVRBO0FBRjRCLGlCQUFqQixDO0FBS1RJLGdCQUFBQSxHLEdBQU0sMEI7QUFDWkYsZ0JBQUFBLE1BQU0sQ0FBQ0csZUFBUCxDQUF1QjtBQUFFRCxrQkFBQUEsR0FBRyxFQUFIQSxHQUFGO0FBQU9FLGtCQUFBQSxJQUFJLEVBQUU7QUFBYixpQkFBdkI7O0FBR0Esb0JBQUlaLEdBQUosRUFBUztBQUNMRCxrQkFBQUEsTUFBTSxHQUFHYyxrQkFBTUMsWUFBTixDQUNMO0FBQ0lDLG9CQUFBQSxHQUFHLEVBQUVYLGVBQUdDLFlBQUgsQ0FBZ0JMLEdBQUcsQ0FBQ2UsR0FBcEIsQ0FEVDtBQUVJQyxvQkFBQUEsSUFBSSxFQUFFWixlQUFHQyxZQUFILENBQWdCTCxHQUFHLENBQUNnQixJQUFwQjtBQUZWLG1CQURLLEVBS0xOLEdBTEssQ0FBVDtBQU9ILGlCQVJELE1BUU87QUFDSFgsa0JBQUFBLE1BQU0sR0FBR2tCLGlCQUFLSCxZQUFMLENBQWtCSixHQUFsQixDQUFUO0FBQ0g7O0FBQ0RGLGdCQUFBQSxNQUFNLENBQUNVLDJCQUFQLENBQW1DbkIsTUFBbkM7QUFFQUEsZ0JBQUFBLE1BQU0sQ0FBQ29CLE1BQVAsQ0FBYztBQUNWQyxrQkFBQUEsSUFBSSxFQUFFekIsTUFBTSxDQUFDeUIsSUFESDtBQUVWQyxrQkFBQUEsSUFBSSxFQUFFckIsR0FBRyxHQUFHQSxHQUFHLENBQUNxQixJQUFQLEdBQWMxQixNQUFNLENBQUMwQjtBQUZwQixpQkFBZCxFQUdHLFlBQU07QUFDTCxzQkFBTUMsR0FBRyxpQkFBVXRCLEdBQUcsR0FBRyxHQUFILEdBQVMsRUFBdEIsZ0JBQThCTCxNQUFNLENBQUN5QixJQUFyQyxjQUE2Q3BCLEdBQUcsR0FBR0EsR0FBRyxDQUFDcUIsSUFBUCxHQUFjMUIsTUFBTSxDQUFDMEIsSUFBckUsYUFBVDs7QUFDQSxrQkFBQSxLQUFJLENBQUN4QixHQUFMLENBQVMwQixLQUFULHNCQUE2QkQsR0FBN0I7QUFDSCxpQkFORCIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgMjAxOC0yMDE5IFRPTiBERVYgU09MVVRJT05TIExURC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgU09GVFdBUkUgRVZBTFVBVElPTiBMaWNlbnNlICh0aGUgXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2VcbiAqIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZVxuICogTGljZW5zZSBhdDpcbiAqXG4gKiBodHRwOi8vd3d3LnRvbi5kZXYvbGljZW5zZXNcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIFRPTiBERVYgc29mdHdhcmUgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLy8gQGZsb3dcbmltcG9ydCBmcyBmcm9tICdmcyc7XG5cbmltcG9ydCBleHByZXNzIGZyb20gJ2V4cHJlc3MnO1xuaW1wb3J0IGh0dHAgZnJvbSAnaHR0cCc7XG5pbXBvcnQgaHR0cHMgZnJvbSAnaHR0cHMnO1xuXG5pbXBvcnQgeyBBcG9sbG9TZXJ2ZXIgfSBmcm9tICdhcG9sbG8tc2VydmVyLWV4cHJlc3MnO1xuXG5pbXBvcnQgQXJhbmdvIGZyb20gJy4vYXJhbmdvJztcblxuaW1wb3J0IHsgY3JlYXRlUmVzb2x2ZXJzIH0gZnJvbSAnLi9hcmFuZ28tcmVzb2x2ZXJzJztcbmltcG9ydCB0eXBlIHsgUUNvbmZpZyB9IGZyb20gXCIuL2NvbmZpZ1wiO1xuaW1wb3J0IFFMb2dzIGZyb20gXCIuL2xvZ3NcIjtcbmltcG9ydCB0eXBlIHsgUUxvZyB9IGZyb20gXCIuL2xvZ3NcIjtcblxudHlwZSBRT3B0aW9ucyA9IHtcbiAgICBjb25maWc6IFFDb25maWcsXG4gICAgbG9nczogUUxvZ3MsXG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFRPTlFTZXJ2ZXIge1xuICAgIGNvbmZpZzogUUNvbmZpZztcbiAgICBsb2dzOiBRTG9ncztcbiAgICBsb2c6IFFMb2c7XG4gICAgZGI6IEFyYW5nbztcblxuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnM6IFFPcHRpb25zKSB7XG4gICAgICAgIHRoaXMuY29uZmlnID0gb3B0aW9ucy5jb25maWc7XG4gICAgICAgIHRoaXMubG9ncyA9IG9wdGlvbnMubG9ncztcbiAgICAgICAgdGhpcy5sb2cgPSB0aGlzLmxvZ3MuY3JlYXRlKCdRIFNlcnZlcicpO1xuICAgIH1cblxuXG4gICAgYXN5bmMgc3RhcnQoKSB7XG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IHRoaXMuY29uZmlnLnNlcnZlcjtcbiAgICAgICAgY29uc3Qgc3NsID0gY29uZmlnLnNzbDtcblxuICAgICAgICB0aGlzLmRiID0gbmV3IEFyYW5nbyh0aGlzLmNvbmZpZywgdGhpcy5sb2dzKTtcbiAgICAgICAgY29uc3QgdHlwZURlZnMgPSBmcy5yZWFkRmlsZVN5bmMoJ3R5cGUtZGVmcy5ncmFwaHFsJywgJ3V0Zi04Jyk7XG4gICAgICAgIGNvbnN0IHJlc29sdmVycyA9IGNyZWF0ZVJlc29sdmVycyh0aGlzLmRiKTtcbiAgICAgICAgYXdhaXQgdGhpcy5kYi5zdGFydCgpO1xuXG4gICAgICAgIGNvbnN0IGFwb2xsbyA9IG5ldyBBcG9sbG9TZXJ2ZXIoe1xuICAgICAgICAgICAgdHlwZURlZnMsXG4gICAgICAgICAgICByZXNvbHZlcnMsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IGFwcCA9IGV4cHJlc3MoKTtcbiAgICAgICAgYXBvbGxvLmFwcGx5TWlkZGxld2FyZSh7IGFwcCwgcGF0aDogJy9ncmFwaHFsJyB9KTtcblxuICAgICAgICBsZXQgc2VydmVyO1xuICAgICAgICBpZiAoc3NsKSB7XG4gICAgICAgICAgICBzZXJ2ZXIgPSBodHRwcy5jcmVhdGVTZXJ2ZXIoXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBrZXk6IGZzLnJlYWRGaWxlU3luYyhzc2wua2V5KSxcbiAgICAgICAgICAgICAgICAgICAgY2VydDogZnMucmVhZEZpbGVTeW5jKHNzbC5jZXJ0KVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgYXBwXG4gICAgICAgICAgICApXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZXJ2ZXIgPSBodHRwLmNyZWF0ZVNlcnZlcihhcHApXG4gICAgICAgIH1cbiAgICAgICAgYXBvbGxvLmluc3RhbGxTdWJzY3JpcHRpb25IYW5kbGVycyhzZXJ2ZXIpO1xuXG4gICAgICAgIHNlcnZlci5saXN0ZW4oe1xuICAgICAgICAgICAgaG9zdDogY29uZmlnLmhvc3QsXG4gICAgICAgICAgICBwb3J0OiBzc2wgPyBzc2wucG9ydCA6IGNvbmZpZy5wb3J0XG4gICAgICAgIH0sICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHVyaSA9IGBodHRwJHtzc2wgPyAncycgOiAnJ306Ly8ke2NvbmZpZy5ob3N0fToke3NzbCA/IHNzbC5wb3J0IDogY29uZmlnLnBvcnR9L2dyYXBocWxgO1xuICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoYFN0YXJ0ZWQgb24gJHt1cml9YCk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuIl19