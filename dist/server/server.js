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

        var config, ver, typeDefs, createResolvers, attachCustomResolvers, resolvers, apollo, app, server;
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                config = this.config.server;
                this.db = new _arango["default"](this.config, this.logs);
                ver = this.config.database.version;
                typeDefs = _fs["default"].readFileSync("type-defs.v".concat(ver, ".graphql"), 'utf-8');
                createResolvers = ver === '1' ? _qResolvers.createResolvers : _qResolvers2.createResolvers;
                attachCustomResolvers = ver === '1' ? _customResolvers.attachCustomResolvers : function (x) {
                  return x;
                };
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
                server = _http["default"].createServer(app);
                apollo.installSubscriptionHandlers(server);
                server.listen({
                  host: config.host,
                  port: config.port
                }, function () {
                  var uri = "http://".concat(config.host, ":").concat(config.port, "/graphql");

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9zZXJ2ZXIuanMiXSwibmFtZXMiOlsiVE9OUVNlcnZlciIsIm9wdGlvbnMiLCJjb25maWciLCJsb2dzIiwibG9nIiwiY3JlYXRlIiwic2VydmVyIiwiZGIiLCJBcmFuZ28iLCJ2ZXIiLCJkYXRhYmFzZSIsInZlcnNpb24iLCJ0eXBlRGVmcyIsImZzIiwicmVhZEZpbGVTeW5jIiwiY3JlYXRlUmVzb2x2ZXJzIiwiY3JlYXRlUmVzb2x2ZXJzVjEiLCJjcmVhdGVSZXNvbHZlcnNWMiIsImF0dGFjaEN1c3RvbVJlc29sdmVycyIsImF0dGFjaEN1c3RvbVJlc29sdmVyc1YxIiwieCIsInJlc29sdmVycyIsInN0YXJ0IiwiYXBvbGxvIiwiQXBvbGxvU2VydmVyIiwiYXBwIiwiYXBwbHlNaWRkbGV3YXJlIiwicGF0aCIsImh0dHAiLCJjcmVhdGVTZXJ2ZXIiLCJpbnN0YWxsU3Vic2NyaXB0aW9uSGFuZGxlcnMiLCJsaXN0ZW4iLCJob3N0IiwicG9ydCIsInVyaSIsImRlYnVnIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBaUJBOztBQUVBOztBQUNBOztBQUVBOztBQUVBOztBQUVBOztBQUNBOztBQUNBOztBQUdBOztBQS9CQTs7Ozs7Ozs7Ozs7Ozs7O0lBdUNxQkEsVTs7O0FBTWpCLHNCQUFZQyxPQUFaLEVBQStCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUMzQixTQUFLQyxNQUFMLEdBQWNELE9BQU8sQ0FBQ0MsTUFBdEI7QUFDQSxTQUFLQyxJQUFMLEdBQVlGLE9BQU8sQ0FBQ0UsSUFBcEI7QUFDQSxTQUFLQyxHQUFMLEdBQVcsS0FBS0QsSUFBTCxDQUFVRSxNQUFWLENBQWlCLFVBQWpCLENBQVg7QUFDSDs7Ozs7Ozs7Ozs7Ozs7O0FBSVNILGdCQUFBQSxNLEdBQVMsS0FBS0EsTUFBTCxDQUFZSSxNO0FBRTNCLHFCQUFLQyxFQUFMLEdBQVUsSUFBSUMsa0JBQUosQ0FBVyxLQUFLTixNQUFoQixFQUF3QixLQUFLQyxJQUE3QixDQUFWO0FBQ01NLGdCQUFBQSxHLEdBQU0sS0FBS1AsTUFBTCxDQUFZUSxRQUFaLENBQXFCQyxPO0FBQzNCQyxnQkFBQUEsUSxHQUFXQyxlQUFHQyxZQUFILHNCQUE4QkwsR0FBOUIsZUFBNkMsT0FBN0MsQztBQUNYTSxnQkFBQUEsZSxHQUFrQk4sR0FBRyxLQUFLLEdBQVIsR0FBY08sMkJBQWQsR0FBa0NDLDRCO0FBQ3BEQyxnQkFBQUEscUIsR0FBd0JULEdBQUcsS0FBSyxHQUFSLEdBQWNVLHNDQUFkLEdBQXdDLFVBQUNDLENBQUQ7QUFBQSx5QkFBT0EsQ0FBUDtBQUFBLGlCO0FBQ2hFQyxnQkFBQUEsUyxHQUFZSCxxQkFBcUIsQ0FBQ0gsZUFBZSxDQUFDLEtBQUtSLEVBQU4sQ0FBaEIsQzs7dUJBRWpDLEtBQUtBLEVBQUwsQ0FBUWUsS0FBUixFOzs7QUFFQUMsZ0JBQUFBLE0sR0FBUyxJQUFJQyxpQ0FBSixDQUFpQjtBQUM1Qlosa0JBQUFBLFFBQVEsRUFBUkEsUUFENEI7QUFFNUJTLGtCQUFBQSxTQUFTLEVBQVRBO0FBRjRCLGlCQUFqQixDO0FBS1RJLGdCQUFBQSxHLEdBQU0sMEI7QUFDWkYsZ0JBQUFBLE1BQU0sQ0FBQ0csZUFBUCxDQUF1QjtBQUFFRCxrQkFBQUEsR0FBRyxFQUFIQSxHQUFGO0FBQU9FLGtCQUFBQSxJQUFJLEVBQUU7QUFBYixpQkFBdkI7QUFFTXJCLGdCQUFBQSxNLEdBQVNzQixpQkFBS0MsWUFBTCxDQUFrQkosR0FBbEIsQztBQUNmRixnQkFBQUEsTUFBTSxDQUFDTywyQkFBUCxDQUFtQ3hCLE1BQW5DO0FBRUFBLGdCQUFBQSxNQUFNLENBQUN5QixNQUFQLENBQWM7QUFDVkMsa0JBQUFBLElBQUksRUFBRTlCLE1BQU0sQ0FBQzhCLElBREg7QUFFVkMsa0JBQUFBLElBQUksRUFBRS9CLE1BQU0sQ0FBQytCO0FBRkgsaUJBQWQsRUFHRyxZQUFNO0FBQ0wsc0JBQU1DLEdBQUcsb0JBQWFoQyxNQUFNLENBQUM4QixJQUFwQixjQUE0QjlCLE1BQU0sQ0FBQytCLElBQW5DLGFBQVQ7O0FBQ0Esa0JBQUEsS0FBSSxDQUFDN0IsR0FBTCxDQUFTK0IsS0FBVCxzQkFBNkJELEdBQTdCO0FBQ0gsaUJBTkQiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IDIwMTgtMjAxOSBUT04gREVWIFNPTFVUSU9OUyBMVEQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIFNPRlRXQVJFIEVWQUxVQVRJT04gTGljZW5zZSAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlXG4gKiB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGVcbiAqIExpY2Vuc2UgYXQ6XG4gKlxuICogaHR0cDovL3d3dy50b24uZGV2L2xpY2Vuc2VzXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBUT04gREVWIHNvZnR3YXJlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8vIEBmbG93XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuXG5pbXBvcnQgZXhwcmVzcyBmcm9tICdleHByZXNzJztcbmltcG9ydCBodHRwIGZyb20gJ2h0dHAnO1xuXG5pbXBvcnQgeyBBcG9sbG9TZXJ2ZXIgfSBmcm9tICdhcG9sbG8tc2VydmVyLWV4cHJlc3MnO1xuXG5pbXBvcnQgQXJhbmdvIGZyb20gJy4vYXJhbmdvJztcblxuaW1wb3J0IHsgY3JlYXRlUmVzb2x2ZXJzIGFzIGNyZWF0ZVJlc29sdmVyc1YxIH0gZnJvbSAnLi9xLXJlc29sdmVycy52MSc7XG5pbXBvcnQgeyBjcmVhdGVSZXNvbHZlcnMgYXMgY3JlYXRlUmVzb2x2ZXJzVjIgfSBmcm9tICcuL3EtcmVzb2x2ZXJzLnYyJztcbmltcG9ydCB7IGF0dGFjaEN1c3RvbVJlc29sdmVycyBhcyBhdHRhY2hDdXN0b21SZXNvbHZlcnNWMSB9IGZyb20gXCIuL2N1c3RvbS1yZXNvbHZlcnMudjFcIjtcblxuaW1wb3J0IHR5cGUgeyBRQ29uZmlnIH0gZnJvbSBcIi4vY29uZmlnXCI7XG5pbXBvcnQgUUxvZ3MgZnJvbSBcIi4vbG9nc1wiO1xuaW1wb3J0IHR5cGUgeyBRTG9nIH0gZnJvbSBcIi4vbG9nc1wiO1xuXG50eXBlIFFPcHRpb25zID0ge1xuICAgIGNvbmZpZzogUUNvbmZpZyxcbiAgICBsb2dzOiBRTG9ncyxcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVE9OUVNlcnZlciB7XG4gICAgY29uZmlnOiBRQ29uZmlnO1xuICAgIGxvZ3M6IFFMb2dzO1xuICAgIGxvZzogUUxvZztcbiAgICBkYjogQXJhbmdvO1xuXG4gICAgY29uc3RydWN0b3Iob3B0aW9uczogUU9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5jb25maWcgPSBvcHRpb25zLmNvbmZpZztcbiAgICAgICAgdGhpcy5sb2dzID0gb3B0aW9ucy5sb2dzO1xuICAgICAgICB0aGlzLmxvZyA9IHRoaXMubG9ncy5jcmVhdGUoJ1EgU2VydmVyJyk7XG4gICAgfVxuXG5cbiAgICBhc3luYyBzdGFydCgpIHtcbiAgICAgICAgY29uc3QgY29uZmlnID0gdGhpcy5jb25maWcuc2VydmVyO1xuXG4gICAgICAgIHRoaXMuZGIgPSBuZXcgQXJhbmdvKHRoaXMuY29uZmlnLCB0aGlzLmxvZ3MpO1xuICAgICAgICBjb25zdCB2ZXIgPSB0aGlzLmNvbmZpZy5kYXRhYmFzZS52ZXJzaW9uO1xuICAgICAgICBjb25zdCB0eXBlRGVmcyA9IGZzLnJlYWRGaWxlU3luYyhgdHlwZS1kZWZzLnYke3Zlcn0uZ3JhcGhxbGAsICd1dGYtOCcpO1xuICAgICAgICBjb25zdCBjcmVhdGVSZXNvbHZlcnMgPSB2ZXIgPT09ICcxJyA/IGNyZWF0ZVJlc29sdmVyc1YxIDogY3JlYXRlUmVzb2x2ZXJzVjI7XG4gICAgICAgIGNvbnN0IGF0dGFjaEN1c3RvbVJlc29sdmVycyA9IHZlciA9PT0gJzEnID8gYXR0YWNoQ3VzdG9tUmVzb2x2ZXJzVjEgOiAoeCkgPT4geDtcbiAgICAgICAgY29uc3QgcmVzb2x2ZXJzID0gYXR0YWNoQ3VzdG9tUmVzb2x2ZXJzKGNyZWF0ZVJlc29sdmVycyh0aGlzLmRiKSk7XG5cbiAgICAgICAgYXdhaXQgdGhpcy5kYi5zdGFydCgpO1xuXG4gICAgICAgIGNvbnN0IGFwb2xsbyA9IG5ldyBBcG9sbG9TZXJ2ZXIoe1xuICAgICAgICAgICAgdHlwZURlZnMsXG4gICAgICAgICAgICByZXNvbHZlcnMsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IGFwcCA9IGV4cHJlc3MoKTtcbiAgICAgICAgYXBvbGxvLmFwcGx5TWlkZGxld2FyZSh7IGFwcCwgcGF0aDogJy9ncmFwaHFsJyB9KTtcblxuICAgICAgICBjb25zdCBzZXJ2ZXIgPSBodHRwLmNyZWF0ZVNlcnZlcihhcHApO1xuICAgICAgICBhcG9sbG8uaW5zdGFsbFN1YnNjcmlwdGlvbkhhbmRsZXJzKHNlcnZlcik7XG5cbiAgICAgICAgc2VydmVyLmxpc3Rlbih7XG4gICAgICAgICAgICBob3N0OiBjb25maWcuaG9zdCxcbiAgICAgICAgICAgIHBvcnQ6IGNvbmZpZy5wb3J0LFxuICAgICAgICB9LCAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCB1cmkgPSBgaHR0cDovLyR7Y29uZmlnLmhvc3R9OiR7Y29uZmlnLnBvcnR9L2dyYXBocWxgO1xuICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoYFN0YXJ0ZWQgb24gJHt1cml9YCk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuIl19