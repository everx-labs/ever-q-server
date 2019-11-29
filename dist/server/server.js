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

var _qResolvers = require("./q-resolvers.v1");

var _qResolvers2 = require("./q-resolvers.v2");

var _customResolvers = require("./custom-resolvers.v1");

var _customResolvers2 = require("./custom-resolvers.v2");

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
    key: "start",
    value: function () {
      var _start = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee() {
        var _this = this;

        var config, ver, generatedTypeDefs, customTypeDefs, typeDefs, createResolvers, attachCustomResolvers, resolvers, apollo, app, server;
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                config = this.config.server;
                this.db = new _arango["default"](this.config, this.logs);
                ver = this.config.database.version;
                generatedTypeDefs = _fs["default"].readFileSync("type-defs.v".concat(ver, ".graphql"), 'utf-8');
                customTypeDefs = _fs["default"].readFileSync('custom-type-defs.graphql', 'utf-8');
                typeDefs = "".concat(generatedTypeDefs, "\n").concat(customTypeDefs);
                createResolvers = ver === '1' ? _qResolvers.createResolvers : _qResolvers2.createResolvers;
                attachCustomResolvers = ver === '1' ? _customResolvers.attachCustomResolvers : _customResolvers2.attachCustomResolvers;
                resolvers = attachCustomResolvers(createResolvers(this.db));
                _context.next = 11;
                return this.db.start();

              case 11:
                apollo = new _apolloServerExpress.ApolloServer({
                  typeDefs: typeDefs,
                  resolvers: resolvers,
                  context: function context() {
                    return {
                      db: _this.db,
                      config: _this.config,
                      shared: _this.shared
                    };
                  }
                });
                app = (0, _express["default"])();
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

                  _this.log.debug("Started on ".concat(uri));
                });

              case 17:
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9zZXJ2ZXIuanMiXSwibmFtZXMiOlsiVE9OUVNlcnZlciIsIm9wdGlvbnMiLCJjb25maWciLCJsb2dzIiwibG9nIiwiY3JlYXRlIiwic2hhcmVkIiwiTWFwIiwic2VydmVyIiwiZGIiLCJBcmFuZ28iLCJ2ZXIiLCJkYXRhYmFzZSIsInZlcnNpb24iLCJnZW5lcmF0ZWRUeXBlRGVmcyIsImZzIiwicmVhZEZpbGVTeW5jIiwiY3VzdG9tVHlwZURlZnMiLCJ0eXBlRGVmcyIsImNyZWF0ZVJlc29sdmVycyIsImNyZWF0ZVJlc29sdmVyc1YxIiwiY3JlYXRlUmVzb2x2ZXJzVjIiLCJhdHRhY2hDdXN0b21SZXNvbHZlcnMiLCJhdHRhY2hDdXN0b21SZXNvbHZlcnNWMSIsImF0dGFjaEN1c3RvbVJlc29sdmVyc1YyIiwicmVzb2x2ZXJzIiwic3RhcnQiLCJhcG9sbG8iLCJBcG9sbG9TZXJ2ZXIiLCJjb250ZXh0IiwiYXBwIiwiYXBwbHlNaWRkbGV3YXJlIiwicGF0aCIsImh0dHAiLCJjcmVhdGVTZXJ2ZXIiLCJpbnN0YWxsU3Vic2NyaXB0aW9uSGFuZGxlcnMiLCJsaXN0ZW4iLCJob3N0IiwicG9ydCIsInVyaSIsImRlYnVnIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBaUJBOztBQUNBOztBQUNBOztBQUVBOztBQUVBOztBQUVBOztBQUNBOztBQUNBOztBQUNBOztBQUdBOztBQS9CQTs7Ozs7Ozs7Ozs7Ozs7O0lBdUNxQkEsVTs7O0FBT2pCLHNCQUFZQyxPQUFaLEVBQStCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQzNCLFNBQUtDLE1BQUwsR0FBY0QsT0FBTyxDQUFDQyxNQUF0QjtBQUNBLFNBQUtDLElBQUwsR0FBWUYsT0FBTyxDQUFDRSxJQUFwQjtBQUNBLFNBQUtDLEdBQUwsR0FBVyxLQUFLRCxJQUFMLENBQVVFLE1BQVYsQ0FBaUIsVUFBakIsQ0FBWDtBQUNBLFNBQUtDLE1BQUwsR0FBYyxJQUFJQyxHQUFKLEVBQWQ7QUFDSDs7Ozs7Ozs7Ozs7Ozs7O0FBSVNMLGdCQUFBQSxNLEdBQVMsS0FBS0EsTUFBTCxDQUFZTSxNO0FBRTNCLHFCQUFLQyxFQUFMLEdBQVUsSUFBSUMsa0JBQUosQ0FBVyxLQUFLUixNQUFoQixFQUF3QixLQUFLQyxJQUE3QixDQUFWO0FBQ01RLGdCQUFBQSxHLEdBQU0sS0FBS1QsTUFBTCxDQUFZVSxRQUFaLENBQXFCQyxPO0FBQzNCQyxnQkFBQUEsaUIsR0FBb0JDLGVBQUdDLFlBQUgsc0JBQThCTCxHQUE5QixlQUE2QyxPQUE3QyxDO0FBQ3BCTSxnQkFBQUEsYyxHQUFpQkYsZUFBR0MsWUFBSCxDQUFnQiwwQkFBaEIsRUFBNEMsT0FBNUMsQztBQUNqQkUsZ0JBQUFBLFEsYUFBY0osaUIsZUFBc0JHLGM7QUFDcENFLGdCQUFBQSxlLEdBQWtCUixHQUFHLEtBQUssR0FBUixHQUFjUywyQkFBZCxHQUFrQ0MsNEI7QUFDcERDLGdCQUFBQSxxQixHQUF3QlgsR0FBRyxLQUFLLEdBQVIsR0FBY1ksc0NBQWQsR0FBd0NDLHVDO0FBQ2hFQyxnQkFBQUEsUyxHQUFZSCxxQkFBcUIsQ0FBQ0gsZUFBZSxDQUFDLEtBQUtWLEVBQU4sQ0FBaEIsQzs7dUJBRWpDLEtBQUtBLEVBQUwsQ0FBUWlCLEtBQVIsRTs7O0FBRUFDLGdCQUFBQSxNLEdBQVMsSUFBSUMsaUNBQUosQ0FBaUI7QUFDNUJWLGtCQUFBQSxRQUFRLEVBQVJBLFFBRDRCO0FBRTVCTyxrQkFBQUEsU0FBUyxFQUFUQSxTQUY0QjtBQUc1Qkksa0JBQUFBLE9BQU8sRUFBRTtBQUFBLDJCQUFPO0FBQ1pwQixzQkFBQUEsRUFBRSxFQUFFLEtBQUksQ0FBQ0EsRUFERztBQUVaUCxzQkFBQUEsTUFBTSxFQUFFLEtBQUksQ0FBQ0EsTUFGRDtBQUdaSSxzQkFBQUEsTUFBTSxFQUFFLEtBQUksQ0FBQ0E7QUFIRCxxQkFBUDtBQUFBO0FBSG1CLGlCQUFqQixDO0FBVVR3QixnQkFBQUEsRyxHQUFNLDBCO0FBQ1pILGdCQUFBQSxNQUFNLENBQUNJLGVBQVAsQ0FBdUI7QUFBRUQsa0JBQUFBLEdBQUcsRUFBSEEsR0FBRjtBQUFPRSxrQkFBQUEsSUFBSSxFQUFFO0FBQWIsaUJBQXZCO0FBRU14QixnQkFBQUEsTSxHQUFTeUIsaUJBQUtDLFlBQUwsQ0FBa0JKLEdBQWxCLEM7QUFDZkgsZ0JBQUFBLE1BQU0sQ0FBQ1EsMkJBQVAsQ0FBbUMzQixNQUFuQztBQUVBQSxnQkFBQUEsTUFBTSxDQUFDNEIsTUFBUCxDQUFjO0FBQ1ZDLGtCQUFBQSxJQUFJLEVBQUVuQyxNQUFNLENBQUNtQyxJQURIO0FBRVZDLGtCQUFBQSxJQUFJLEVBQUVwQyxNQUFNLENBQUNvQztBQUZILGlCQUFkLEVBR0csWUFBTTtBQUNMLHNCQUFNQyxHQUFHLG9CQUFhckMsTUFBTSxDQUFDbUMsSUFBcEIsY0FBNEJuQyxNQUFNLENBQUNvQyxJQUFuQyxhQUFUOztBQUNBLGtCQUFBLEtBQUksQ0FBQ2xDLEdBQUwsQ0FBU29DLEtBQVQsc0JBQTZCRCxHQUE3QjtBQUNILGlCQU5EIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE4LTIwMTkgVE9OIERFViBTT0xVVElPTlMgTFRELlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBTT0ZUV0FSRSBFVkFMVUFUSU9OIExpY2Vuc2UgKHRoZSBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZVxuICogdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlXG4gKiBMaWNlbnNlIGF0OlxuICpcbiAqIGh0dHA6Ly93d3cudG9uLmRldi9saWNlbnNlc1xuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgVE9OIERFViBzb2Z0d2FyZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vLyBAZmxvd1xuaW1wb3J0IGZzIGZyb20gJ2ZzJztcbmltcG9ydCBleHByZXNzIGZyb20gJ2V4cHJlc3MnO1xuaW1wb3J0IGh0dHAgZnJvbSAnaHR0cCc7XG5cbmltcG9ydCB7IEFwb2xsb1NlcnZlciB9IGZyb20gJ2Fwb2xsby1zZXJ2ZXItZXhwcmVzcyc7XG5cbmltcG9ydCBBcmFuZ28gZnJvbSAnLi9hcmFuZ28nO1xuXG5pbXBvcnQgeyBjcmVhdGVSZXNvbHZlcnMgYXMgY3JlYXRlUmVzb2x2ZXJzVjEgfSBmcm9tICcuL3EtcmVzb2x2ZXJzLnYxJztcbmltcG9ydCB7IGNyZWF0ZVJlc29sdmVycyBhcyBjcmVhdGVSZXNvbHZlcnNWMiB9IGZyb20gJy4vcS1yZXNvbHZlcnMudjInO1xuaW1wb3J0IHsgYXR0YWNoQ3VzdG9tUmVzb2x2ZXJzIGFzIGF0dGFjaEN1c3RvbVJlc29sdmVyc1YxIH0gZnJvbSBcIi4vY3VzdG9tLXJlc29sdmVycy52MVwiO1xuaW1wb3J0IHsgYXR0YWNoQ3VzdG9tUmVzb2x2ZXJzIGFzIGF0dGFjaEN1c3RvbVJlc29sdmVyc1YyIH0gZnJvbSBcIi4vY3VzdG9tLXJlc29sdmVycy52MlwiO1xuXG5pbXBvcnQgdHlwZSB7IFFDb25maWcgfSBmcm9tIFwiLi9jb25maWdcIjtcbmltcG9ydCBRTG9ncyBmcm9tIFwiLi9sb2dzXCI7XG5pbXBvcnQgdHlwZSB7IFFMb2cgfSBmcm9tIFwiLi9sb2dzXCI7XG5cbnR5cGUgUU9wdGlvbnMgPSB7XG4gICAgY29uZmlnOiBRQ29uZmlnLFxuICAgIGxvZ3M6IFFMb2dzLFxufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBUT05RU2VydmVyIHtcbiAgICBjb25maWc6IFFDb25maWc7XG4gICAgbG9nczogUUxvZ3M7XG4gICAgbG9nOiBRTG9nO1xuICAgIGRiOiBBcmFuZ287XG4gICAgc2hhcmVkOiBNYXA8c3RyaW5nLCBhbnk+O1xuXG4gICAgY29uc3RydWN0b3Iob3B0aW9uczogUU9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5jb25maWcgPSBvcHRpb25zLmNvbmZpZztcbiAgICAgICAgdGhpcy5sb2dzID0gb3B0aW9ucy5sb2dzO1xuICAgICAgICB0aGlzLmxvZyA9IHRoaXMubG9ncy5jcmVhdGUoJ1EgU2VydmVyJyk7XG4gICAgICAgIHRoaXMuc2hhcmVkID0gbmV3IE1hcCgpO1xuICAgIH1cblxuXG4gICAgYXN5bmMgc3RhcnQoKSB7XG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IHRoaXMuY29uZmlnLnNlcnZlcjtcblxuICAgICAgICB0aGlzLmRiID0gbmV3IEFyYW5nbyh0aGlzLmNvbmZpZywgdGhpcy5sb2dzKTtcbiAgICAgICAgY29uc3QgdmVyID0gdGhpcy5jb25maWcuZGF0YWJhc2UudmVyc2lvbjtcbiAgICAgICAgY29uc3QgZ2VuZXJhdGVkVHlwZURlZnMgPSBmcy5yZWFkRmlsZVN5bmMoYHR5cGUtZGVmcy52JHt2ZXJ9LmdyYXBocWxgLCAndXRmLTgnKTtcbiAgICAgICAgY29uc3QgY3VzdG9tVHlwZURlZnMgPSBmcy5yZWFkRmlsZVN5bmMoJ2N1c3RvbS10eXBlLWRlZnMuZ3JhcGhxbCcsICd1dGYtOCcpO1xuICAgICAgICBjb25zdCB0eXBlRGVmcyA9IGAke2dlbmVyYXRlZFR5cGVEZWZzfVxcbiR7Y3VzdG9tVHlwZURlZnN9YDtcbiAgICAgICAgY29uc3QgY3JlYXRlUmVzb2x2ZXJzID0gdmVyID09PSAnMScgPyBjcmVhdGVSZXNvbHZlcnNWMSA6IGNyZWF0ZVJlc29sdmVyc1YyO1xuICAgICAgICBjb25zdCBhdHRhY2hDdXN0b21SZXNvbHZlcnMgPSB2ZXIgPT09ICcxJyA/IGF0dGFjaEN1c3RvbVJlc29sdmVyc1YxIDogYXR0YWNoQ3VzdG9tUmVzb2x2ZXJzVjI7XG4gICAgICAgIGNvbnN0IHJlc29sdmVycyA9IGF0dGFjaEN1c3RvbVJlc29sdmVycyhjcmVhdGVSZXNvbHZlcnModGhpcy5kYikpO1xuXG4gICAgICAgIGF3YWl0IHRoaXMuZGIuc3RhcnQoKTtcblxuICAgICAgICBjb25zdCBhcG9sbG8gPSBuZXcgQXBvbGxvU2VydmVyKHtcbiAgICAgICAgICAgIHR5cGVEZWZzLFxuICAgICAgICAgICAgcmVzb2x2ZXJzLFxuICAgICAgICAgICAgY29udGV4dDogKCkgPT4gKHtcbiAgICAgICAgICAgICAgICBkYjogdGhpcy5kYixcbiAgICAgICAgICAgICAgICBjb25maWc6IHRoaXMuY29uZmlnLFxuICAgICAgICAgICAgICAgIHNoYXJlZDogdGhpcy5zaGFyZWQsXG4gICAgICAgICAgICB9KVxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBhcHAgPSBleHByZXNzKCk7XG4gICAgICAgIGFwb2xsby5hcHBseU1pZGRsZXdhcmUoeyBhcHAsIHBhdGg6ICcvZ3JhcGhxbCcgfSk7XG5cbiAgICAgICAgY29uc3Qgc2VydmVyID0gaHR0cC5jcmVhdGVTZXJ2ZXIoYXBwKTtcbiAgICAgICAgYXBvbGxvLmluc3RhbGxTdWJzY3JpcHRpb25IYW5kbGVycyhzZXJ2ZXIpO1xuXG4gICAgICAgIHNlcnZlci5saXN0ZW4oe1xuICAgICAgICAgICAgaG9zdDogY29uZmlnLmhvc3QsXG4gICAgICAgICAgICBwb3J0OiBjb25maWcucG9ydCxcbiAgICAgICAgfSwgKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgdXJpID0gYGh0dHA6Ly8ke2NvbmZpZy5ob3N0fToke2NvbmZpZy5wb3J0fS9ncmFwaHFsYDtcbiAgICAgICAgICAgIHRoaXMubG9nLmRlYnVnKGBTdGFydGVkIG9uICR7dXJpfWApO1xuICAgICAgICB9KTtcbiAgICB9XG59XG5cbiJdfQ==