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

var _arangoResolvers = require("./arango-resolvers.v1");

var _arangoResolvers2 = require("./arango-resolvers.v2");

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

        var config, ssl, typeDefs, createResolvers, attachCustomResolvers, resolvers, apollo, app, server;
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                config = this.config.server;
                ssl = config.ssl;
                this.db = new _arango["default"](this.config, this.logs);
                typeDefs = _fs["default"].readFileSync("type-defs.v".concat(this.config.database.version, ".graphql"), 'utf-8');
                createResolvers = this.config.database.version === '1' ? _arangoResolvers.createResolvers : _arangoResolvers2.createResolvers;
                attachCustomResolvers = this.config.database.version === '1' ? _customResolvers.attachCustomResolvers : _customResolvers2.attachCustomResolvers;
                resolvers = attachCustomResolvers(createResolvers(this.db));
                _context.next = 9;
                return this.db.start();

              case 9:
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

              case 15:
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9zZXJ2ZXIuanMiXSwibmFtZXMiOlsiVE9OUVNlcnZlciIsIm9wdGlvbnMiLCJjb25maWciLCJsb2dzIiwibG9nIiwiY3JlYXRlIiwic2VydmVyIiwic3NsIiwiZGIiLCJBcmFuZ28iLCJ0eXBlRGVmcyIsImZzIiwicmVhZEZpbGVTeW5jIiwiZGF0YWJhc2UiLCJ2ZXJzaW9uIiwiY3JlYXRlUmVzb2x2ZXJzIiwiY3JlYXRlUmVzb2x2ZXJzVjEiLCJjcmVhdGVSZXNvbHZlcnNWMiIsImF0dGFjaEN1c3RvbVJlc29sdmVycyIsImF0dGFjaEN1c3RvbVJlc29sdmVyc1YxIiwiYXR0YWNoQ3VzdG9tUmVzb2x2ZXJzVjIiLCJyZXNvbHZlcnMiLCJzdGFydCIsImFwb2xsbyIsIkFwb2xsb1NlcnZlciIsImFwcCIsImFwcGx5TWlkZGxld2FyZSIsInBhdGgiLCJodHRwcyIsImNyZWF0ZVNlcnZlciIsImtleSIsImNlcnQiLCJodHRwIiwiaW5zdGFsbFN1YnNjcmlwdGlvbkhhbmRsZXJzIiwibGlzdGVuIiwiaG9zdCIsInBvcnQiLCJ1cmkiLCJkZWJ1ZyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWlCQTs7QUFFQTs7QUFDQTs7QUFDQTs7QUFFQTs7QUFFQTs7QUFFQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFHQTs7QUFqQ0E7Ozs7Ozs7Ozs7Ozs7OztJQXlDcUJBLFU7OztBQU1qQixzQkFBWUMsT0FBWixFQUErQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFDM0IsU0FBS0MsTUFBTCxHQUFjRCxPQUFPLENBQUNDLE1BQXRCO0FBQ0EsU0FBS0MsSUFBTCxHQUFZRixPQUFPLENBQUNFLElBQXBCO0FBQ0EsU0FBS0MsR0FBTCxHQUFXLEtBQUtELElBQUwsQ0FBVUUsTUFBVixDQUFpQixVQUFqQixDQUFYO0FBQ0g7Ozs7Ozs7Ozs7Ozs7OztBQUlTSCxnQkFBQUEsTSxHQUFTLEtBQUtBLE1BQUwsQ0FBWUksTTtBQUNyQkMsZ0JBQUFBLEcsR0FBTUwsTUFBTSxDQUFDSyxHO0FBRW5CLHFCQUFLQyxFQUFMLEdBQVUsSUFBSUMsa0JBQUosQ0FBVyxLQUFLUCxNQUFoQixFQUF3QixLQUFLQyxJQUE3QixDQUFWO0FBQ01PLGdCQUFBQSxRLEdBQVdDLGVBQUdDLFlBQUgsc0JBQThCLEtBQUtWLE1BQUwsQ0FBWVcsUUFBWixDQUFxQkMsT0FBbkQsZUFBc0UsT0FBdEUsQztBQUNYQyxnQkFBQUEsZSxHQUFrQixLQUFLYixNQUFMLENBQVlXLFFBQVosQ0FBcUJDLE9BQXJCLEtBQWlDLEdBQWpDLEdBQXVDRSxnQ0FBdkMsR0FBMkRDLGlDO0FBQzdFQyxnQkFBQUEscUIsR0FBd0IsS0FBS2hCLE1BQUwsQ0FBWVcsUUFBWixDQUFxQkMsT0FBckIsS0FBaUMsR0FBakMsR0FBdUNLLHNDQUF2QyxHQUFpRUMsdUM7QUFDekZDLGdCQUFBQSxTLEdBQVlILHFCQUFxQixDQUFDSCxlQUFlLENBQUMsS0FBS1AsRUFBTixDQUFoQixDOzt1QkFDakMsS0FBS0EsRUFBTCxDQUFRYyxLQUFSLEU7OztBQUVBQyxnQkFBQUEsTSxHQUFTLElBQUlDLGlDQUFKLENBQWlCO0FBQzVCZCxrQkFBQUEsUUFBUSxFQUFSQSxRQUQ0QjtBQUU1Qlcsa0JBQUFBLFNBQVMsRUFBVEE7QUFGNEIsaUJBQWpCLEM7QUFLVEksZ0JBQUFBLEcsR0FBTSwwQjtBQUNaRixnQkFBQUEsTUFBTSxDQUFDRyxlQUFQLENBQXVCO0FBQUVELGtCQUFBQSxHQUFHLEVBQUhBLEdBQUY7QUFBT0Usa0JBQUFBLElBQUksRUFBRTtBQUFiLGlCQUF2Qjs7QUFHQSxvQkFBSXBCLEdBQUosRUFBUztBQUNMRCxrQkFBQUEsTUFBTSxHQUFHc0Isa0JBQU1DLFlBQU4sQ0FDTDtBQUNJQyxvQkFBQUEsR0FBRyxFQUFFbkIsZUFBR0MsWUFBSCxDQUFnQkwsR0FBRyxDQUFDdUIsR0FBcEIsQ0FEVDtBQUVJQyxvQkFBQUEsSUFBSSxFQUFFcEIsZUFBR0MsWUFBSCxDQUFnQkwsR0FBRyxDQUFDd0IsSUFBcEI7QUFGVixtQkFESyxFQUtMTixHQUxLLENBQVQ7QUFPSCxpQkFSRCxNQVFPO0FBQ0huQixrQkFBQUEsTUFBTSxHQUFHMEIsaUJBQUtILFlBQUwsQ0FBa0JKLEdBQWxCLENBQVQ7QUFDSDs7QUFDREYsZ0JBQUFBLE1BQU0sQ0FBQ1UsMkJBQVAsQ0FBbUMzQixNQUFuQztBQUVBQSxnQkFBQUEsTUFBTSxDQUFDNEIsTUFBUCxDQUFjO0FBQ1ZDLGtCQUFBQSxJQUFJLEVBQUVqQyxNQUFNLENBQUNpQyxJQURIO0FBRVZDLGtCQUFBQSxJQUFJLEVBQUU3QixHQUFHLEdBQUdBLEdBQUcsQ0FBQzZCLElBQVAsR0FBY2xDLE1BQU0sQ0FBQ2tDO0FBRnBCLGlCQUFkLEVBR0csWUFBTTtBQUNMLHNCQUFNQyxHQUFHLGlCQUFVOUIsR0FBRyxHQUFHLEdBQUgsR0FBUyxFQUF0QixnQkFBOEJMLE1BQU0sQ0FBQ2lDLElBQXJDLGNBQTZDNUIsR0FBRyxHQUFHQSxHQUFHLENBQUM2QixJQUFQLEdBQWNsQyxNQUFNLENBQUNrQyxJQUFyRSxhQUFUOztBQUNBLGtCQUFBLEtBQUksQ0FBQ2hDLEdBQUwsQ0FBU2tDLEtBQVQsc0JBQTZCRCxHQUE3QjtBQUNILGlCQU5EIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE4LTIwMTkgVE9OIERFViBTT0xVVElPTlMgTFRELlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBTT0ZUV0FSRSBFVkFMVUFUSU9OIExpY2Vuc2UgKHRoZSBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZVxuICogdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlXG4gKiBMaWNlbnNlIGF0OlxuICpcbiAqIGh0dHA6Ly93d3cudG9uLmRldi9saWNlbnNlc1xuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgVE9OIERFViBzb2Z0d2FyZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vLyBAZmxvd1xuaW1wb3J0IGZzIGZyb20gJ2ZzJztcblxuaW1wb3J0IGV4cHJlc3MgZnJvbSAnZXhwcmVzcyc7XG5pbXBvcnQgaHR0cCBmcm9tICdodHRwJztcbmltcG9ydCBodHRwcyBmcm9tICdodHRwcyc7XG5cbmltcG9ydCB7IEFwb2xsb1NlcnZlciB9IGZyb20gJ2Fwb2xsby1zZXJ2ZXItZXhwcmVzcyc7XG5cbmltcG9ydCBBcmFuZ28gZnJvbSAnLi9hcmFuZ28nO1xuXG5pbXBvcnQgeyBjcmVhdGVSZXNvbHZlcnMgYXMgY3JlYXRlUmVzb2x2ZXJzVjEgfSBmcm9tICcuL2FyYW5nby1yZXNvbHZlcnMudjEnO1xuaW1wb3J0IHsgY3JlYXRlUmVzb2x2ZXJzIGFzIGNyZWF0ZVJlc29sdmVyc1YyIH0gZnJvbSAnLi9hcmFuZ28tcmVzb2x2ZXJzLnYyJztcbmltcG9ydCB7IGF0dGFjaEN1c3RvbVJlc29sdmVycyBhcyBhdHRhY2hDdXN0b21SZXNvbHZlcnNWMSB9IGZyb20gXCIuL2N1c3RvbS1yZXNvbHZlcnMudjFcIjtcbmltcG9ydCB7IGF0dGFjaEN1c3RvbVJlc29sdmVycyBhcyBhdHRhY2hDdXN0b21SZXNvbHZlcnNWMiB9IGZyb20gXCIuL2N1c3RvbS1yZXNvbHZlcnMudjJcIjtcblxuaW1wb3J0IHR5cGUgeyBRQ29uZmlnIH0gZnJvbSBcIi4vY29uZmlnXCI7XG5pbXBvcnQgUUxvZ3MgZnJvbSBcIi4vbG9nc1wiO1xuaW1wb3J0IHR5cGUgeyBRTG9nIH0gZnJvbSBcIi4vbG9nc1wiO1xuXG50eXBlIFFPcHRpb25zID0ge1xuICAgIGNvbmZpZzogUUNvbmZpZyxcbiAgICBsb2dzOiBRTG9ncyxcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVE9OUVNlcnZlciB7XG4gICAgY29uZmlnOiBRQ29uZmlnO1xuICAgIGxvZ3M6IFFMb2dzO1xuICAgIGxvZzogUUxvZztcbiAgICBkYjogQXJhbmdvO1xuXG4gICAgY29uc3RydWN0b3Iob3B0aW9uczogUU9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5jb25maWcgPSBvcHRpb25zLmNvbmZpZztcbiAgICAgICAgdGhpcy5sb2dzID0gb3B0aW9ucy5sb2dzO1xuICAgICAgICB0aGlzLmxvZyA9IHRoaXMubG9ncy5jcmVhdGUoJ1EgU2VydmVyJyk7XG4gICAgfVxuXG5cbiAgICBhc3luYyBzdGFydCgpIHtcbiAgICAgICAgY29uc3QgY29uZmlnID0gdGhpcy5jb25maWcuc2VydmVyO1xuICAgICAgICBjb25zdCBzc2wgPSBjb25maWcuc3NsO1xuXG4gICAgICAgIHRoaXMuZGIgPSBuZXcgQXJhbmdvKHRoaXMuY29uZmlnLCB0aGlzLmxvZ3MpO1xuICAgICAgICBjb25zdCB0eXBlRGVmcyA9IGZzLnJlYWRGaWxlU3luYyhgdHlwZS1kZWZzLnYke3RoaXMuY29uZmlnLmRhdGFiYXNlLnZlcnNpb259LmdyYXBocWxgLCAndXRmLTgnKTtcbiAgICAgICAgY29uc3QgY3JlYXRlUmVzb2x2ZXJzID0gdGhpcy5jb25maWcuZGF0YWJhc2UudmVyc2lvbiA9PT0gJzEnID8gY3JlYXRlUmVzb2x2ZXJzVjEgOiBjcmVhdGVSZXNvbHZlcnNWMjtcbiAgICAgICAgY29uc3QgYXR0YWNoQ3VzdG9tUmVzb2x2ZXJzID0gdGhpcy5jb25maWcuZGF0YWJhc2UudmVyc2lvbiA9PT0gJzEnID8gYXR0YWNoQ3VzdG9tUmVzb2x2ZXJzVjEgOiBhdHRhY2hDdXN0b21SZXNvbHZlcnNWMjtcbiAgICAgICAgY29uc3QgcmVzb2x2ZXJzID0gYXR0YWNoQ3VzdG9tUmVzb2x2ZXJzKGNyZWF0ZVJlc29sdmVycyh0aGlzLmRiKSk7XG4gICAgICAgIGF3YWl0IHRoaXMuZGIuc3RhcnQoKTtcblxuICAgICAgICBjb25zdCBhcG9sbG8gPSBuZXcgQXBvbGxvU2VydmVyKHtcbiAgICAgICAgICAgIHR5cGVEZWZzLFxuICAgICAgICAgICAgcmVzb2x2ZXJzLFxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBhcHAgPSBleHByZXNzKCk7XG4gICAgICAgIGFwb2xsby5hcHBseU1pZGRsZXdhcmUoeyBhcHAsIHBhdGg6ICcvZ3JhcGhxbCcgfSk7XG5cbiAgICAgICAgbGV0IHNlcnZlcjtcbiAgICAgICAgaWYgKHNzbCkge1xuICAgICAgICAgICAgc2VydmVyID0gaHR0cHMuY3JlYXRlU2VydmVyKFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAga2V5OiBmcy5yZWFkRmlsZVN5bmMoc3NsLmtleSksXG4gICAgICAgICAgICAgICAgICAgIGNlcnQ6IGZzLnJlYWRGaWxlU3luYyhzc2wuY2VydClcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGFwcFxuICAgICAgICAgICAgKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2VydmVyID0gaHR0cC5jcmVhdGVTZXJ2ZXIoYXBwKVxuICAgICAgICB9XG4gICAgICAgIGFwb2xsby5pbnN0YWxsU3Vic2NyaXB0aW9uSGFuZGxlcnMoc2VydmVyKTtcblxuICAgICAgICBzZXJ2ZXIubGlzdGVuKHtcbiAgICAgICAgICAgIGhvc3Q6IGNvbmZpZy5ob3N0LFxuICAgICAgICAgICAgcG9ydDogc3NsID8gc3NsLnBvcnQgOiBjb25maWcucG9ydFxuICAgICAgICB9LCAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCB1cmkgPSBgaHR0cCR7c3NsID8gJ3MnIDogJyd9Oi8vJHtjb25maWcuaG9zdH06JHtzc2wgPyBzc2wucG9ydCA6IGNvbmZpZy5wb3J0fS9ncmFwaHFsYDtcbiAgICAgICAgICAgIHRoaXMubG9nLmRlYnVnKGBTdGFydGVkIG9uICR7dXJpfWApO1xuICAgICAgICB9KTtcbiAgICB9XG59XG5cbiJdfQ==