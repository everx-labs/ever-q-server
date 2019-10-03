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

var _customResolvers = require("./custom-resolvers");

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
                resolvers = (0, _customResolvers.attachCustomResolvers)((0, _arangoResolvers.createResolvers)(this.db));
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9zZXJ2ZXIuanMiXSwibmFtZXMiOlsiVE9OUVNlcnZlciIsIm9wdGlvbnMiLCJjb25maWciLCJsb2dzIiwibG9nIiwiY3JlYXRlIiwic2VydmVyIiwic3NsIiwiZGIiLCJBcmFuZ28iLCJ0eXBlRGVmcyIsImZzIiwicmVhZEZpbGVTeW5jIiwicmVzb2x2ZXJzIiwic3RhcnQiLCJhcG9sbG8iLCJBcG9sbG9TZXJ2ZXIiLCJhcHAiLCJhcHBseU1pZGRsZXdhcmUiLCJwYXRoIiwiaHR0cHMiLCJjcmVhdGVTZXJ2ZXIiLCJrZXkiLCJjZXJ0IiwiaHR0cCIsImluc3RhbGxTdWJzY3JpcHRpb25IYW5kbGVycyIsImxpc3RlbiIsImhvc3QiLCJwb3J0IiwidXJpIiwiZGVidWciXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFpQkE7O0FBRUE7O0FBQ0E7O0FBQ0E7O0FBRUE7O0FBRUE7O0FBRUE7O0FBRUE7O0FBQ0E7O0FBOUJBOzs7Ozs7Ozs7Ozs7Ozs7SUFzQ3FCQSxVOzs7QUFNakIsc0JBQVlDLE9BQVosRUFBK0I7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQzNCLFNBQUtDLE1BQUwsR0FBY0QsT0FBTyxDQUFDQyxNQUF0QjtBQUNBLFNBQUtDLElBQUwsR0FBWUYsT0FBTyxDQUFDRSxJQUFwQjtBQUNBLFNBQUtDLEdBQUwsR0FBVyxLQUFLRCxJQUFMLENBQVVFLE1BQVYsQ0FBaUIsVUFBakIsQ0FBWDtBQUNIOzs7Ozs7Ozs7Ozs7Ozs7QUFJU0gsZ0JBQUFBLE0sR0FBUyxLQUFLQSxNQUFMLENBQVlJLE07QUFDckJDLGdCQUFBQSxHLEdBQU1MLE1BQU0sQ0FBQ0ssRztBQUVuQixxQkFBS0MsRUFBTCxHQUFVLElBQUlDLGtCQUFKLENBQVcsS0FBS1AsTUFBaEIsRUFBd0IsS0FBS0MsSUFBN0IsQ0FBVjtBQUNNTyxnQkFBQUEsUSxHQUFXQyxlQUFHQyxZQUFILENBQWdCLG1CQUFoQixFQUFxQyxPQUFyQyxDO0FBQ1hDLGdCQUFBQSxTLEdBQVksNENBQXNCLHNDQUFnQixLQUFLTCxFQUFyQixDQUF0QixDOzt1QkFDWixLQUFLQSxFQUFMLENBQVFNLEtBQVIsRTs7O0FBRUFDLGdCQUFBQSxNLEdBQVMsSUFBSUMsaUNBQUosQ0FBaUI7QUFDNUJOLGtCQUFBQSxRQUFRLEVBQVJBLFFBRDRCO0FBRTVCRyxrQkFBQUEsU0FBUyxFQUFUQTtBQUY0QixpQkFBakIsQztBQUtUSSxnQkFBQUEsRyxHQUFNLDBCO0FBQ1pGLGdCQUFBQSxNQUFNLENBQUNHLGVBQVAsQ0FBdUI7QUFBRUQsa0JBQUFBLEdBQUcsRUFBSEEsR0FBRjtBQUFPRSxrQkFBQUEsSUFBSSxFQUFFO0FBQWIsaUJBQXZCOztBQUdBLG9CQUFJWixHQUFKLEVBQVM7QUFDTEQsa0JBQUFBLE1BQU0sR0FBR2Msa0JBQU1DLFlBQU4sQ0FDTDtBQUNJQyxvQkFBQUEsR0FBRyxFQUFFWCxlQUFHQyxZQUFILENBQWdCTCxHQUFHLENBQUNlLEdBQXBCLENBRFQ7QUFFSUMsb0JBQUFBLElBQUksRUFBRVosZUFBR0MsWUFBSCxDQUFnQkwsR0FBRyxDQUFDZ0IsSUFBcEI7QUFGVixtQkFESyxFQUtMTixHQUxLLENBQVQ7QUFPSCxpQkFSRCxNQVFPO0FBQ0hYLGtCQUFBQSxNQUFNLEdBQUdrQixpQkFBS0gsWUFBTCxDQUFrQkosR0FBbEIsQ0FBVDtBQUNIOztBQUNERixnQkFBQUEsTUFBTSxDQUFDVSwyQkFBUCxDQUFtQ25CLE1BQW5DO0FBRUFBLGdCQUFBQSxNQUFNLENBQUNvQixNQUFQLENBQWM7QUFDVkMsa0JBQUFBLElBQUksRUFBRXpCLE1BQU0sQ0FBQ3lCLElBREg7QUFFVkMsa0JBQUFBLElBQUksRUFBRXJCLEdBQUcsR0FBR0EsR0FBRyxDQUFDcUIsSUFBUCxHQUFjMUIsTUFBTSxDQUFDMEI7QUFGcEIsaUJBQWQsRUFHRyxZQUFNO0FBQ0wsc0JBQU1DLEdBQUcsaUJBQVV0QixHQUFHLEdBQUcsR0FBSCxHQUFTLEVBQXRCLGdCQUE4QkwsTUFBTSxDQUFDeUIsSUFBckMsY0FBNkNwQixHQUFHLEdBQUdBLEdBQUcsQ0FBQ3FCLElBQVAsR0FBYzFCLE1BQU0sQ0FBQzBCLElBQXJFLGFBQVQ7O0FBQ0Esa0JBQUEsS0FBSSxDQUFDeEIsR0FBTCxDQUFTMEIsS0FBVCxzQkFBNkJELEdBQTdCO0FBQ0gsaUJBTkQiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IDIwMTgtMjAxOSBUT04gREVWIFNPTFVUSU9OUyBMVEQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIFNPRlRXQVJFIEVWQUxVQVRJT04gTGljZW5zZSAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlXG4gKiB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGVcbiAqIExpY2Vuc2UgYXQ6XG4gKlxuICogaHR0cDovL3d3dy50b24uZGV2L2xpY2Vuc2VzXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBUT04gREVWIHNvZnR3YXJlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8vIEBmbG93XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuXG5pbXBvcnQgZXhwcmVzcyBmcm9tICdleHByZXNzJztcbmltcG9ydCBodHRwIGZyb20gJ2h0dHAnO1xuaW1wb3J0IGh0dHBzIGZyb20gJ2h0dHBzJztcblxuaW1wb3J0IHsgQXBvbGxvU2VydmVyIH0gZnJvbSAnYXBvbGxvLXNlcnZlci1leHByZXNzJztcblxuaW1wb3J0IEFyYW5nbyBmcm9tICcuL2FyYW5nbyc7XG5cbmltcG9ydCB7IGNyZWF0ZVJlc29sdmVycyB9IGZyb20gJy4vYXJhbmdvLXJlc29sdmVycyc7XG5pbXBvcnQgdHlwZSB7IFFDb25maWcgfSBmcm9tIFwiLi9jb25maWdcIjtcbmltcG9ydCB7IGF0dGFjaEN1c3RvbVJlc29sdmVycyB9IGZyb20gXCIuL2N1c3RvbS1yZXNvbHZlcnNcIjtcbmltcG9ydCBRTG9ncyBmcm9tIFwiLi9sb2dzXCI7XG5pbXBvcnQgdHlwZSB7IFFMb2cgfSBmcm9tIFwiLi9sb2dzXCI7XG5cbnR5cGUgUU9wdGlvbnMgPSB7XG4gICAgY29uZmlnOiBRQ29uZmlnLFxuICAgIGxvZ3M6IFFMb2dzLFxufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBUT05RU2VydmVyIHtcbiAgICBjb25maWc6IFFDb25maWc7XG4gICAgbG9nczogUUxvZ3M7XG4gICAgbG9nOiBRTG9nO1xuICAgIGRiOiBBcmFuZ287XG5cbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zOiBRT3B0aW9ucykge1xuICAgICAgICB0aGlzLmNvbmZpZyA9IG9wdGlvbnMuY29uZmlnO1xuICAgICAgICB0aGlzLmxvZ3MgPSBvcHRpb25zLmxvZ3M7XG4gICAgICAgIHRoaXMubG9nID0gdGhpcy5sb2dzLmNyZWF0ZSgnUSBTZXJ2ZXInKTtcbiAgICB9XG5cblxuICAgIGFzeW5jIHN0YXJ0KCkge1xuICAgICAgICBjb25zdCBjb25maWcgPSB0aGlzLmNvbmZpZy5zZXJ2ZXI7XG4gICAgICAgIGNvbnN0IHNzbCA9IGNvbmZpZy5zc2w7XG5cbiAgICAgICAgdGhpcy5kYiA9IG5ldyBBcmFuZ28odGhpcy5jb25maWcsIHRoaXMubG9ncyk7XG4gICAgICAgIGNvbnN0IHR5cGVEZWZzID0gZnMucmVhZEZpbGVTeW5jKCd0eXBlLWRlZnMuZ3JhcGhxbCcsICd1dGYtOCcpO1xuICAgICAgICBjb25zdCByZXNvbHZlcnMgPSBhdHRhY2hDdXN0b21SZXNvbHZlcnMoY3JlYXRlUmVzb2x2ZXJzKHRoaXMuZGIpKTtcbiAgICAgICAgYXdhaXQgdGhpcy5kYi5zdGFydCgpO1xuXG4gICAgICAgIGNvbnN0IGFwb2xsbyA9IG5ldyBBcG9sbG9TZXJ2ZXIoe1xuICAgICAgICAgICAgdHlwZURlZnMsXG4gICAgICAgICAgICByZXNvbHZlcnMsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IGFwcCA9IGV4cHJlc3MoKTtcbiAgICAgICAgYXBvbGxvLmFwcGx5TWlkZGxld2FyZSh7IGFwcCwgcGF0aDogJy9ncmFwaHFsJyB9KTtcblxuICAgICAgICBsZXQgc2VydmVyO1xuICAgICAgICBpZiAoc3NsKSB7XG4gICAgICAgICAgICBzZXJ2ZXIgPSBodHRwcy5jcmVhdGVTZXJ2ZXIoXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBrZXk6IGZzLnJlYWRGaWxlU3luYyhzc2wua2V5KSxcbiAgICAgICAgICAgICAgICAgICAgY2VydDogZnMucmVhZEZpbGVTeW5jKHNzbC5jZXJ0KVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgYXBwXG4gICAgICAgICAgICApXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZXJ2ZXIgPSBodHRwLmNyZWF0ZVNlcnZlcihhcHApXG4gICAgICAgIH1cbiAgICAgICAgYXBvbGxvLmluc3RhbGxTdWJzY3JpcHRpb25IYW5kbGVycyhzZXJ2ZXIpO1xuXG4gICAgICAgIHNlcnZlci5saXN0ZW4oe1xuICAgICAgICAgICAgaG9zdDogY29uZmlnLmhvc3QsXG4gICAgICAgICAgICBwb3J0OiBzc2wgPyBzc2wucG9ydCA6IGNvbmZpZy5wb3J0XG4gICAgICAgIH0sICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHVyaSA9IGBodHRwJHtzc2wgPyAncycgOiAnJ306Ly8ke2NvbmZpZy5ob3N0fToke3NzbCA/IHNzbC5wb3J0IDogY29uZmlnLnBvcnR9L2dyYXBocWxgO1xuICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoYFN0YXJ0ZWQgb24gJHt1cml9YCk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuIl19