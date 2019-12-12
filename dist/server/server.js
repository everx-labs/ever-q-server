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

        var config, generatedTypeDefs, customTypeDefs, typeDefs, resolvers, apollo, app, server;
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                config = this.config.server;
                this.db = new _arango["default"](this.config, this.logs);
                generatedTypeDefs = _fs["default"].readFileSync("type-defs-generated.graphql", 'utf-8');
                customTypeDefs = _fs["default"].readFileSync('type-defs-custom.graphql', 'utf-8');
                typeDefs = "".concat(generatedTypeDefs, "\n").concat(customTypeDefs);
                resolvers = (0, _resolversCustom.attachCustomResolvers)((0, _resolversGenerated.createResolvers)(this.db));
                _context.next = 8;
                return this.db.start();

              case 8:
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

              case 14:
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9zZXJ2ZXIuanMiXSwibmFtZXMiOlsiVE9OUVNlcnZlciIsIm9wdGlvbnMiLCJjb25maWciLCJsb2dzIiwibG9nIiwiY3JlYXRlIiwic2hhcmVkIiwiTWFwIiwic2VydmVyIiwiZGIiLCJBcmFuZ28iLCJnZW5lcmF0ZWRUeXBlRGVmcyIsImZzIiwicmVhZEZpbGVTeW5jIiwiY3VzdG9tVHlwZURlZnMiLCJ0eXBlRGVmcyIsInJlc29sdmVycyIsInN0YXJ0IiwiYXBvbGxvIiwiQXBvbGxvU2VydmVyIiwiY29udGV4dCIsImFwcCIsImFwcGx5TWlkZGxld2FyZSIsInBhdGgiLCJodHRwIiwiY3JlYXRlU2VydmVyIiwiaW5zdGFsbFN1YnNjcmlwdGlvbkhhbmRsZXJzIiwibGlzdGVuIiwiaG9zdCIsInBvcnQiLCJ1cmkiLCJkZWJ1ZyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWlCQTs7QUFDQTs7QUFDQTs7QUFFQTs7QUFFQTs7QUFFQTs7QUFDQTs7QUFHQTs7QUE3QkE7Ozs7Ozs7Ozs7Ozs7OztJQXFDcUJBLFU7OztBQU9qQixzQkFBWUMsT0FBWixFQUErQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUMzQixTQUFLQyxNQUFMLEdBQWNELE9BQU8sQ0FBQ0MsTUFBdEI7QUFDQSxTQUFLQyxJQUFMLEdBQVlGLE9BQU8sQ0FBQ0UsSUFBcEI7QUFDQSxTQUFLQyxHQUFMLEdBQVcsS0FBS0QsSUFBTCxDQUFVRSxNQUFWLENBQWlCLFVBQWpCLENBQVg7QUFDQSxTQUFLQyxNQUFMLEdBQWMsSUFBSUMsR0FBSixFQUFkO0FBQ0g7Ozs7Ozs7Ozs7Ozs7OztBQUlTTCxnQkFBQUEsTSxHQUFTLEtBQUtBLE1BQUwsQ0FBWU0sTTtBQUUzQixxQkFBS0MsRUFBTCxHQUFVLElBQUlDLGtCQUFKLENBQVcsS0FBS1IsTUFBaEIsRUFBd0IsS0FBS0MsSUFBN0IsQ0FBVjtBQUNNUSxnQkFBQUEsaUIsR0FBb0JDLGVBQUdDLFlBQUgsZ0NBQStDLE9BQS9DLEM7QUFDcEJDLGdCQUFBQSxjLEdBQWlCRixlQUFHQyxZQUFILENBQWdCLDBCQUFoQixFQUE0QyxPQUE1QyxDO0FBQ2pCRSxnQkFBQUEsUSxhQUFjSixpQixlQUFzQkcsYztBQUNwQ0UsZ0JBQUFBLFMsR0FBWSw0Q0FBc0IseUNBQWdCLEtBQUtQLEVBQXJCLENBQXRCLEM7O3VCQUVaLEtBQUtBLEVBQUwsQ0FBUVEsS0FBUixFOzs7QUFFQUMsZ0JBQUFBLE0sR0FBUyxJQUFJQyxpQ0FBSixDQUFpQjtBQUM1Qkosa0JBQUFBLFFBQVEsRUFBUkEsUUFENEI7QUFFNUJDLGtCQUFBQSxTQUFTLEVBQVRBLFNBRjRCO0FBRzVCSSxrQkFBQUEsT0FBTyxFQUFFO0FBQUEsMkJBQU87QUFDWlgsc0JBQUFBLEVBQUUsRUFBRSxLQUFJLENBQUNBLEVBREc7QUFFWlAsc0JBQUFBLE1BQU0sRUFBRSxLQUFJLENBQUNBLE1BRkQ7QUFHWkksc0JBQUFBLE1BQU0sRUFBRSxLQUFJLENBQUNBO0FBSEQscUJBQVA7QUFBQTtBQUhtQixpQkFBakIsQztBQVVUZSxnQkFBQUEsRyxHQUFNLDBCO0FBQ1pILGdCQUFBQSxNQUFNLENBQUNJLGVBQVAsQ0FBdUI7QUFBRUQsa0JBQUFBLEdBQUcsRUFBSEEsR0FBRjtBQUFPRSxrQkFBQUEsSUFBSSxFQUFFO0FBQWIsaUJBQXZCO0FBRU1mLGdCQUFBQSxNLEdBQVNnQixpQkFBS0MsWUFBTCxDQUFrQkosR0FBbEIsQztBQUNmSCxnQkFBQUEsTUFBTSxDQUFDUSwyQkFBUCxDQUFtQ2xCLE1BQW5DO0FBRUFBLGdCQUFBQSxNQUFNLENBQUNtQixNQUFQLENBQWM7QUFDVkMsa0JBQUFBLElBQUksRUFBRTFCLE1BQU0sQ0FBQzBCLElBREg7QUFFVkMsa0JBQUFBLElBQUksRUFBRTNCLE1BQU0sQ0FBQzJCO0FBRkgsaUJBQWQsRUFHRyxZQUFNO0FBQ0wsc0JBQU1DLEdBQUcsb0JBQWE1QixNQUFNLENBQUMwQixJQUFwQixjQUE0QjFCLE1BQU0sQ0FBQzJCLElBQW5DLGFBQVQ7O0FBQ0Esa0JBQUEsS0FBSSxDQUFDekIsR0FBTCxDQUFTMkIsS0FBVCxzQkFBNkJELEdBQTdCO0FBQ0gsaUJBTkQiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IDIwMTgtMjAxOSBUT04gREVWIFNPTFVUSU9OUyBMVEQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIFNPRlRXQVJFIEVWQUxVQVRJT04gTGljZW5zZSAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlXG4gKiB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGVcbiAqIExpY2Vuc2UgYXQ6XG4gKlxuICogaHR0cDovL3d3dy50b24uZGV2L2xpY2Vuc2VzXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBUT04gREVWIHNvZnR3YXJlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8vIEBmbG93XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IGV4cHJlc3MgZnJvbSAnZXhwcmVzcyc7XG5pbXBvcnQgaHR0cCBmcm9tICdodHRwJztcblxuaW1wb3J0IHsgQXBvbGxvU2VydmVyIH0gZnJvbSAnYXBvbGxvLXNlcnZlci1leHByZXNzJztcblxuaW1wb3J0IEFyYW5nbyBmcm9tICcuL2FyYW5nbyc7XG5cbmltcG9ydCB7IGNyZWF0ZVJlc29sdmVycyB9IGZyb20gJy4vcmVzb2x2ZXJzLWdlbmVyYXRlZCc7XG5pbXBvcnQgeyBhdHRhY2hDdXN0b21SZXNvbHZlcnMgfSBmcm9tIFwiLi9yZXNvbHZlcnMtY3VzdG9tXCI7XG5cbmltcG9ydCB0eXBlIHsgUUNvbmZpZyB9IGZyb20gXCIuL2NvbmZpZ1wiO1xuaW1wb3J0IFFMb2dzIGZyb20gXCIuL2xvZ3NcIjtcbmltcG9ydCB0eXBlIHsgUUxvZyB9IGZyb20gXCIuL2xvZ3NcIjtcblxudHlwZSBRT3B0aW9ucyA9IHtcbiAgICBjb25maWc6IFFDb25maWcsXG4gICAgbG9nczogUUxvZ3MsXG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFRPTlFTZXJ2ZXIge1xuICAgIGNvbmZpZzogUUNvbmZpZztcbiAgICBsb2dzOiBRTG9ncztcbiAgICBsb2c6IFFMb2c7XG4gICAgZGI6IEFyYW5nbztcbiAgICBzaGFyZWQ6IE1hcDxzdHJpbmcsIGFueT47XG5cbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zOiBRT3B0aW9ucykge1xuICAgICAgICB0aGlzLmNvbmZpZyA9IG9wdGlvbnMuY29uZmlnO1xuICAgICAgICB0aGlzLmxvZ3MgPSBvcHRpb25zLmxvZ3M7XG4gICAgICAgIHRoaXMubG9nID0gdGhpcy5sb2dzLmNyZWF0ZSgnUSBTZXJ2ZXInKTtcbiAgICAgICAgdGhpcy5zaGFyZWQgPSBuZXcgTWFwKCk7XG4gICAgfVxuXG5cbiAgICBhc3luYyBzdGFydCgpIHtcbiAgICAgICAgY29uc3QgY29uZmlnID0gdGhpcy5jb25maWcuc2VydmVyO1xuXG4gICAgICAgIHRoaXMuZGIgPSBuZXcgQXJhbmdvKHRoaXMuY29uZmlnLCB0aGlzLmxvZ3MpO1xuICAgICAgICBjb25zdCBnZW5lcmF0ZWRUeXBlRGVmcyA9IGZzLnJlYWRGaWxlU3luYyhgdHlwZS1kZWZzLWdlbmVyYXRlZC5ncmFwaHFsYCwgJ3V0Zi04Jyk7XG4gICAgICAgIGNvbnN0IGN1c3RvbVR5cGVEZWZzID0gZnMucmVhZEZpbGVTeW5jKCd0eXBlLWRlZnMtY3VzdG9tLmdyYXBocWwnLCAndXRmLTgnKTtcbiAgICAgICAgY29uc3QgdHlwZURlZnMgPSBgJHtnZW5lcmF0ZWRUeXBlRGVmc31cXG4ke2N1c3RvbVR5cGVEZWZzfWA7XG4gICAgICAgIGNvbnN0IHJlc29sdmVycyA9IGF0dGFjaEN1c3RvbVJlc29sdmVycyhjcmVhdGVSZXNvbHZlcnModGhpcy5kYikpO1xuXG4gICAgICAgIGF3YWl0IHRoaXMuZGIuc3RhcnQoKTtcblxuICAgICAgICBjb25zdCBhcG9sbG8gPSBuZXcgQXBvbGxvU2VydmVyKHtcbiAgICAgICAgICAgIHR5cGVEZWZzLFxuICAgICAgICAgICAgcmVzb2x2ZXJzLFxuICAgICAgICAgICAgY29udGV4dDogKCkgPT4gKHtcbiAgICAgICAgICAgICAgICBkYjogdGhpcy5kYixcbiAgICAgICAgICAgICAgICBjb25maWc6IHRoaXMuY29uZmlnLFxuICAgICAgICAgICAgICAgIHNoYXJlZDogdGhpcy5zaGFyZWQsXG4gICAgICAgICAgICB9KVxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBhcHAgPSBleHByZXNzKCk7XG4gICAgICAgIGFwb2xsby5hcHBseU1pZGRsZXdhcmUoeyBhcHAsIHBhdGg6ICcvZ3JhcGhxbCcgfSk7XG5cbiAgICAgICAgY29uc3Qgc2VydmVyID0gaHR0cC5jcmVhdGVTZXJ2ZXIoYXBwKTtcbiAgICAgICAgYXBvbGxvLmluc3RhbGxTdWJzY3JpcHRpb25IYW5kbGVycyhzZXJ2ZXIpO1xuXG4gICAgICAgIHNlcnZlci5saXN0ZW4oe1xuICAgICAgICAgICAgaG9zdDogY29uZmlnLmhvc3QsXG4gICAgICAgICAgICBwb3J0OiBjb25maWcucG9ydCxcbiAgICAgICAgfSwgKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgdXJpID0gYGh0dHA6Ly8ke2NvbmZpZy5ob3N0fToke2NvbmZpZy5wb3J0fS9ncmFwaHFsYDtcbiAgICAgICAgICAgIHRoaXMubG9nLmRlYnVnKGBTdGFydGVkIG9uICR7dXJpfWApO1xuICAgICAgICB9KTtcbiAgICB9XG59XG5cbiJdfQ==