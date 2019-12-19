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
    (0, _defineProperty2["default"])(this, "shared", void 0);
    this.config = options.config;
    this.logs = options.logs;
    this.log = this.logs.create('Q Server');
    this.shared = new Map();
  }

  (0, _createClass2["default"])(TONQServer, [{
    key: "startMam",
    value: function () {
      var _startMam = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee(app) {
        var _this = this;

        var typeDefs, apollo;
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                typeDefs = _fs["default"].readFileSync('type-defs-mam.graphql', 'utf-8');
                apollo = new _apolloServerExpress.ApolloServer({
                  typeDefs: typeDefs,
                  resolversMam: _resolversMam.resolversMam,
                  context: function context() {
                    return {
                      db: _this.db,
                      config: _this.config,
                      shared: _this.shared
                    };
                  }
                });
                apollo.applyMiddleware({
                  app: app,
                  path: '/graphql/mam'
                });

              case 3:
              case "end":
                return _context.stop();
            }
          }
        }, _callee);
      }));

      function startMam(_x) {
        return _startMam.apply(this, arguments);
      }

      return startMam;
    }()
  }, {
    key: "start",
    value: function () {
      var _start = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee2() {
        var _this2 = this;

        var config, generatedTypeDefs, customTypeDefs, typeDefs, resolvers, apollo, app, server;
        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                config = this.config.server;
                this.db = new _arango["default"](this.config, this.logs);
                generatedTypeDefs = _fs["default"].readFileSync("type-defs-generated.graphql", 'utf-8');
                customTypeDefs = _fs["default"].readFileSync('type-defs-custom.graphql', 'utf-8');
                typeDefs = "".concat(generatedTypeDefs, "\n").concat(customTypeDefs);
                resolvers = (0, _resolversCustom.attachCustomResolvers)((0, _resolversGenerated.createResolvers)(this.db));
                _context2.next = 8;
                return this.db.start();

              case 8:
                apollo = new _apolloServerExpress.ApolloServer({
                  typeDefs: typeDefs,
                  resolvers: resolvers,
                  context: function context() {
                    return {
                      db: _this2.db,
                      config: _this2.config,
                      shared: _this2.shared
                    };
                  }
                });
                app = (0, _express["default"])();
                _context2.next = 12;
                return this.startMam(app);

              case 12:
                apollo.applyMiddleware({
                  app: app,
                  path: '/graphql'
                });
                server = _http["default"].createServer(app);
                apollo.installSubscriptionHandlers(server);
                server.listen({
                  host: config.host,
                  port: config.port
                }, function () {
                  var uri = "http://".concat(config.host, ":").concat(config.port, "/graphql");

                  _this2.log.debug("Started on ".concat(uri));
                });

              case 16:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9zZXJ2ZXIuanMiXSwibmFtZXMiOlsiVE9OUVNlcnZlciIsIm9wdGlvbnMiLCJjb25maWciLCJsb2dzIiwibG9nIiwiY3JlYXRlIiwic2hhcmVkIiwiTWFwIiwiYXBwIiwidHlwZURlZnMiLCJmcyIsInJlYWRGaWxlU3luYyIsImFwb2xsbyIsIkFwb2xsb1NlcnZlciIsInJlc29sdmVyc01hbSIsImNvbnRleHQiLCJkYiIsImFwcGx5TWlkZGxld2FyZSIsInBhdGgiLCJzZXJ2ZXIiLCJBcmFuZ28iLCJnZW5lcmF0ZWRUeXBlRGVmcyIsImN1c3RvbVR5cGVEZWZzIiwicmVzb2x2ZXJzIiwic3RhcnQiLCJzdGFydE1hbSIsImh0dHAiLCJjcmVhdGVTZXJ2ZXIiLCJpbnN0YWxsU3Vic2NyaXB0aW9uSGFuZGxlcnMiLCJsaXN0ZW4iLCJob3N0IiwicG9ydCIsInVyaSIsImRlYnVnIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBaUJBOztBQUNBOztBQUNBOztBQUVBOztBQUVBOztBQUVBOztBQUNBOztBQUNBOztBQUdBOztBQTlCQTs7Ozs7Ozs7Ozs7Ozs7O0lBc0NxQkEsVTs7O0FBT2pCLHNCQUFZQyxPQUFaLEVBQStCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQzNCLFNBQUtDLE1BQUwsR0FBY0QsT0FBTyxDQUFDQyxNQUF0QjtBQUNBLFNBQUtDLElBQUwsR0FBWUYsT0FBTyxDQUFDRSxJQUFwQjtBQUNBLFNBQUtDLEdBQUwsR0FBVyxLQUFLRCxJQUFMLENBQVVFLE1BQVYsQ0FBaUIsVUFBakIsQ0FBWDtBQUNBLFNBQUtDLE1BQUwsR0FBYyxJQUFJQyxHQUFKLEVBQWQ7QUFDSDs7Ozs7OztvREFHY0MsRzs7Ozs7Ozs7QUFDTEMsZ0JBQUFBLFEsR0FBV0MsZUFBR0MsWUFBSCxDQUFnQix1QkFBaEIsRUFBeUMsT0FBekMsQztBQUVYQyxnQkFBQUEsTSxHQUFTLElBQUlDLGlDQUFKLENBQWlCO0FBQzVCSixrQkFBQUEsUUFBUSxFQUFSQSxRQUQ0QjtBQUU1Qkssa0JBQUFBLFlBQVksRUFBWkEsMEJBRjRCO0FBRzVCQyxrQkFBQUEsT0FBTyxFQUFFO0FBQUEsMkJBQU87QUFDWkMsc0JBQUFBLEVBQUUsRUFBRSxLQUFJLENBQUNBLEVBREc7QUFFWmQsc0JBQUFBLE1BQU0sRUFBRSxLQUFJLENBQUNBLE1BRkQ7QUFHWkksc0JBQUFBLE1BQU0sRUFBRSxLQUFJLENBQUNBO0FBSEQscUJBQVA7QUFBQTtBQUhtQixpQkFBakIsQztBQVVmTSxnQkFBQUEsTUFBTSxDQUFDSyxlQUFQLENBQXVCO0FBQUVULGtCQUFBQSxHQUFHLEVBQUhBLEdBQUY7QUFBT1Usa0JBQUFBLElBQUksRUFBRTtBQUFiLGlCQUF2Qjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFJTWhCLGdCQUFBQSxNLEdBQVMsS0FBS0EsTUFBTCxDQUFZaUIsTTtBQUUzQixxQkFBS0gsRUFBTCxHQUFVLElBQUlJLGtCQUFKLENBQVcsS0FBS2xCLE1BQWhCLEVBQXdCLEtBQUtDLElBQTdCLENBQVY7QUFDTWtCLGdCQUFBQSxpQixHQUFvQlgsZUFBR0MsWUFBSCxnQ0FBK0MsT0FBL0MsQztBQUNwQlcsZ0JBQUFBLGMsR0FBaUJaLGVBQUdDLFlBQUgsQ0FBZ0IsMEJBQWhCLEVBQTRDLE9BQTVDLEM7QUFDakJGLGdCQUFBQSxRLGFBQWNZLGlCLGVBQXNCQyxjO0FBQ3BDQyxnQkFBQUEsUyxHQUFZLDRDQUFzQix5Q0FBZ0IsS0FBS1AsRUFBckIsQ0FBdEIsQzs7dUJBRVosS0FBS0EsRUFBTCxDQUFRUSxLQUFSLEU7OztBQUVBWixnQkFBQUEsTSxHQUFTLElBQUlDLGlDQUFKLENBQWlCO0FBQzVCSixrQkFBQUEsUUFBUSxFQUFSQSxRQUQ0QjtBQUU1QmMsa0JBQUFBLFNBQVMsRUFBVEEsU0FGNEI7QUFHNUJSLGtCQUFBQSxPQUFPLEVBQUU7QUFBQSwyQkFBTztBQUNaQyxzQkFBQUEsRUFBRSxFQUFFLE1BQUksQ0FBQ0EsRUFERztBQUVaZCxzQkFBQUEsTUFBTSxFQUFFLE1BQUksQ0FBQ0EsTUFGRDtBQUdaSSxzQkFBQUEsTUFBTSxFQUFFLE1BQUksQ0FBQ0E7QUFIRCxxQkFBUDtBQUFBO0FBSG1CLGlCQUFqQixDO0FBVVRFLGdCQUFBQSxHLEdBQU0sMEI7O3VCQUNOLEtBQUtpQixRQUFMLENBQWNqQixHQUFkLEM7OztBQUNOSSxnQkFBQUEsTUFBTSxDQUFDSyxlQUFQLENBQXVCO0FBQUVULGtCQUFBQSxHQUFHLEVBQUhBLEdBQUY7QUFBT1Usa0JBQUFBLElBQUksRUFBRTtBQUFiLGlCQUF2QjtBQUVNQyxnQkFBQUEsTSxHQUFTTyxpQkFBS0MsWUFBTCxDQUFrQm5CLEdBQWxCLEM7QUFDZkksZ0JBQUFBLE1BQU0sQ0FBQ2dCLDJCQUFQLENBQW1DVCxNQUFuQztBQUVBQSxnQkFBQUEsTUFBTSxDQUFDVSxNQUFQLENBQWM7QUFDVkMsa0JBQUFBLElBQUksRUFBRTVCLE1BQU0sQ0FBQzRCLElBREg7QUFFVkMsa0JBQUFBLElBQUksRUFBRTdCLE1BQU0sQ0FBQzZCO0FBRkgsaUJBQWQsRUFHRyxZQUFNO0FBQ0wsc0JBQU1DLEdBQUcsb0JBQWE5QixNQUFNLENBQUM0QixJQUFwQixjQUE0QjVCLE1BQU0sQ0FBQzZCLElBQW5DLGFBQVQ7O0FBQ0Esa0JBQUEsTUFBSSxDQUFDM0IsR0FBTCxDQUFTNkIsS0FBVCxzQkFBNkJELEdBQTdCO0FBQ0gsaUJBTkQiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IDIwMTgtMjAxOSBUT04gREVWIFNPTFVUSU9OUyBMVEQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIFNPRlRXQVJFIEVWQUxVQVRJT04gTGljZW5zZSAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlXG4gKiB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGVcbiAqIExpY2Vuc2UgYXQ6XG4gKlxuICogaHR0cDovL3d3dy50b24uZGV2L2xpY2Vuc2VzXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBUT04gREVWIHNvZnR3YXJlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8vIEBmbG93XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IGV4cHJlc3MgZnJvbSAnZXhwcmVzcyc7XG5pbXBvcnQgaHR0cCBmcm9tICdodHRwJztcblxuaW1wb3J0IHsgQXBvbGxvU2VydmVyIH0gZnJvbSAnYXBvbGxvLXNlcnZlci1leHByZXNzJztcblxuaW1wb3J0IEFyYW5nbyBmcm9tICcuL2FyYW5nbyc7XG5cbmltcG9ydCB7IGNyZWF0ZVJlc29sdmVycyB9IGZyb20gJy4vcmVzb2x2ZXJzLWdlbmVyYXRlZCc7XG5pbXBvcnQgeyBhdHRhY2hDdXN0b21SZXNvbHZlcnMgfSBmcm9tIFwiLi9yZXNvbHZlcnMtY3VzdG9tXCI7XG5pbXBvcnQgeyByZXNvbHZlcnNNYW0gfSBmcm9tIFwiLi9yZXNvbHZlcnMtbWFtXCI7XG5cbmltcG9ydCB0eXBlIHsgUUNvbmZpZyB9IGZyb20gXCIuL2NvbmZpZ1wiO1xuaW1wb3J0IFFMb2dzIGZyb20gXCIuL2xvZ3NcIjtcbmltcG9ydCB0eXBlIHsgUUxvZyB9IGZyb20gXCIuL2xvZ3NcIjtcblxudHlwZSBRT3B0aW9ucyA9IHtcbiAgICBjb25maWc6IFFDb25maWcsXG4gICAgbG9nczogUUxvZ3MsXG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFRPTlFTZXJ2ZXIge1xuICAgIGNvbmZpZzogUUNvbmZpZztcbiAgICBsb2dzOiBRTG9ncztcbiAgICBsb2c6IFFMb2c7XG4gICAgZGI6IEFyYW5nbztcbiAgICBzaGFyZWQ6IE1hcDxzdHJpbmcsIGFueT47XG5cbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zOiBRT3B0aW9ucykge1xuICAgICAgICB0aGlzLmNvbmZpZyA9IG9wdGlvbnMuY29uZmlnO1xuICAgICAgICB0aGlzLmxvZ3MgPSBvcHRpb25zLmxvZ3M7XG4gICAgICAgIHRoaXMubG9nID0gdGhpcy5sb2dzLmNyZWF0ZSgnUSBTZXJ2ZXInKTtcbiAgICAgICAgdGhpcy5zaGFyZWQgPSBuZXcgTWFwKCk7XG4gICAgfVxuXG5cbiAgICBhc3luYyBzdGFydE1hbShhcHA6IGV4cHJlc3MuQXBwbGljYXRpb24pIHtcbiAgICAgICAgY29uc3QgdHlwZURlZnMgPSBmcy5yZWFkRmlsZVN5bmMoJ3R5cGUtZGVmcy1tYW0uZ3JhcGhxbCcsICd1dGYtOCcpO1xuXG4gICAgICAgIGNvbnN0IGFwb2xsbyA9IG5ldyBBcG9sbG9TZXJ2ZXIoe1xuICAgICAgICAgICAgdHlwZURlZnMsXG4gICAgICAgICAgICByZXNvbHZlcnNNYW0sXG4gICAgICAgICAgICBjb250ZXh0OiAoKSA9PiAoe1xuICAgICAgICAgICAgICAgIGRiOiB0aGlzLmRiLFxuICAgICAgICAgICAgICAgIGNvbmZpZzogdGhpcy5jb25maWcsXG4gICAgICAgICAgICAgICAgc2hhcmVkOiB0aGlzLnNoYXJlZCxcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGFwb2xsby5hcHBseU1pZGRsZXdhcmUoeyBhcHAsIHBhdGg6ICcvZ3JhcGhxbC9tYW0nIH0pO1xuICAgIH1cblxuICAgIGFzeW5jIHN0YXJ0KCkge1xuICAgICAgICBjb25zdCBjb25maWcgPSB0aGlzLmNvbmZpZy5zZXJ2ZXI7XG5cbiAgICAgICAgdGhpcy5kYiA9IG5ldyBBcmFuZ28odGhpcy5jb25maWcsIHRoaXMubG9ncyk7XG4gICAgICAgIGNvbnN0IGdlbmVyYXRlZFR5cGVEZWZzID0gZnMucmVhZEZpbGVTeW5jKGB0eXBlLWRlZnMtZ2VuZXJhdGVkLmdyYXBocWxgLCAndXRmLTgnKTtcbiAgICAgICAgY29uc3QgY3VzdG9tVHlwZURlZnMgPSBmcy5yZWFkRmlsZVN5bmMoJ3R5cGUtZGVmcy1jdXN0b20uZ3JhcGhxbCcsICd1dGYtOCcpO1xuICAgICAgICBjb25zdCB0eXBlRGVmcyA9IGAke2dlbmVyYXRlZFR5cGVEZWZzfVxcbiR7Y3VzdG9tVHlwZURlZnN9YDtcbiAgICAgICAgY29uc3QgcmVzb2x2ZXJzID0gYXR0YWNoQ3VzdG9tUmVzb2x2ZXJzKGNyZWF0ZVJlc29sdmVycyh0aGlzLmRiKSk7XG5cbiAgICAgICAgYXdhaXQgdGhpcy5kYi5zdGFydCgpO1xuXG4gICAgICAgIGNvbnN0IGFwb2xsbyA9IG5ldyBBcG9sbG9TZXJ2ZXIoe1xuICAgICAgICAgICAgdHlwZURlZnMsXG4gICAgICAgICAgICByZXNvbHZlcnMsXG4gICAgICAgICAgICBjb250ZXh0OiAoKSA9PiAoe1xuICAgICAgICAgICAgICAgIGRiOiB0aGlzLmRiLFxuICAgICAgICAgICAgICAgIGNvbmZpZzogdGhpcy5jb25maWcsXG4gICAgICAgICAgICAgICAgc2hhcmVkOiB0aGlzLnNoYXJlZCxcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IGFwcCA9IGV4cHJlc3MoKTtcbiAgICAgICAgYXdhaXQgdGhpcy5zdGFydE1hbShhcHApO1xuICAgICAgICBhcG9sbG8uYXBwbHlNaWRkbGV3YXJlKHsgYXBwLCBwYXRoOiAnL2dyYXBocWwnIH0pO1xuXG4gICAgICAgIGNvbnN0IHNlcnZlciA9IGh0dHAuY3JlYXRlU2VydmVyKGFwcCk7XG4gICAgICAgIGFwb2xsby5pbnN0YWxsU3Vic2NyaXB0aW9uSGFuZGxlcnMoc2VydmVyKTtcblxuICAgICAgICBzZXJ2ZXIubGlzdGVuKHtcbiAgICAgICAgICAgIGhvc3Q6IGNvbmZpZy5ob3N0LFxuICAgICAgICAgICAgcG9ydDogY29uZmlnLnBvcnQsXG4gICAgICAgIH0sICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHVyaSA9IGBodHRwOi8vJHtjb25maWcuaG9zdH06JHtjb25maWcucG9ydH0vZ3JhcGhxbGA7XG4gICAgICAgICAgICB0aGlzLmxvZy5kZWJ1ZyhgU3RhcnRlZCBvbiAke3VyaX1gKTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG4iXX0=