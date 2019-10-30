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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9zZXJ2ZXIuanMiXSwibmFtZXMiOlsiVE9OUVNlcnZlciIsIm9wdGlvbnMiLCJjb25maWciLCJsb2dzIiwibG9nIiwiY3JlYXRlIiwic2VydmVyIiwic3NsIiwiZGIiLCJBcmFuZ28iLCJ0eXBlRGVmcyIsImZzIiwicmVhZEZpbGVTeW5jIiwicmVzb2x2ZXJzIiwic3RhcnQiLCJhcG9sbG8iLCJBcG9sbG9TZXJ2ZXIiLCJhcHAiLCJhcHBseU1pZGRsZXdhcmUiLCJwYXRoIiwiaHR0cHMiLCJjcmVhdGVTZXJ2ZXIiLCJrZXkiLCJjZXJ0IiwiaHR0cCIsImluc3RhbGxTdWJzY3JpcHRpb25IYW5kbGVycyIsImxpc3RlbiIsImhvc3QiLCJwb3J0IiwidXJpIiwiZGVidWciXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFpQkE7O0FBRUE7O0FBQ0E7O0FBQ0E7O0FBRUE7O0FBRUE7O0FBRUE7O0FBRUE7O0FBQ0E7O0FBOUJBOzs7Ozs7Ozs7Ozs7Ozs7SUFzQ3FCQSxVOzs7QUFNakIsc0JBQVlDLE9BQVosRUFBK0I7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQzNCLFNBQUtDLE1BQUwsR0FBY0QsT0FBTyxDQUFDQyxNQUF0QjtBQUNBLFNBQUtDLElBQUwsR0FBWUYsT0FBTyxDQUFDRSxJQUFwQjtBQUNBLFNBQUtDLEdBQUwsR0FBVyxLQUFLRCxJQUFMLENBQVVFLE1BQVYsQ0FBaUIsVUFBakIsQ0FBWDtBQUNIOzs7Ozs7Ozs7Ozs7Ozs7QUFJU0gsZ0JBQUFBLE0sR0FBUyxLQUFLQSxNQUFMLENBQVlJLE07QUFDckJDLGdCQUFBQSxHLEdBQU1MLE1BQU0sQ0FBQ0ssRztBQUVuQixxQkFBS0MsRUFBTCxHQUFVLElBQUlDLGtCQUFKLENBQVcsS0FBS1AsTUFBaEIsRUFBd0IsS0FBS0MsSUFBN0IsQ0FBVjtBQUNNTyxnQkFBQUEsUSxHQUFXQyxlQUFHQyxZQUFILENBQWdCLG1CQUFoQixFQUFxQyxPQUFyQyxDO0FBQ1hDLGdCQUFBQSxTLEdBQVksNENBQXNCLHNDQUFnQixLQUFLTCxFQUFyQixDQUF0QixDOzt1QkFDWixLQUFLQSxFQUFMLENBQVFNLEtBQVIsRTs7O0FBRUFDLGdCQUFBQSxNLEdBQVMsSUFBSUMsaUNBQUosQ0FBaUI7QUFDNUJOLGtCQUFBQSxRQUFRLEVBQVJBLFFBRDRCO0FBRTVCRyxrQkFBQUEsU0FBUyxFQUFUQTtBQUY0QixpQkFBakIsQztBQUtUSSxnQkFBQUEsRyxHQUFNLDBCO0FBQ1pGLGdCQUFBQSxNQUFNLENBQUNHLGVBQVAsQ0FBdUI7QUFBRUQsa0JBQUFBLEdBQUcsRUFBSEEsR0FBRjtBQUFPRSxrQkFBQUEsSUFBSSxFQUFFO0FBQWIsaUJBQXZCOztBQUdBLG9CQUFJWixHQUFKLEVBQVM7QUFDTEQsa0JBQUFBLE1BQU0sR0FBR2Msa0JBQU1DLFlBQU4sQ0FDTDtBQUNJQyxvQkFBQUEsR0FBRyxFQUFFWCxlQUFHQyxZQUFILENBQWdCTCxHQUFHLENBQUNlLEdBQXBCLENBRFQ7QUFFSUMsb0JBQUFBLElBQUksRUFBRVosZUFBR0MsWUFBSCxDQUFnQkwsR0FBRyxDQUFDZ0IsSUFBcEI7QUFGVixtQkFESyxFQUtMTixHQUxLLENBQVQ7QUFPSCxpQkFSRCxNQVFPO0FBQ0hYLGtCQUFBQSxNQUFNLEdBQUdrQixpQkFBS0gsWUFBTCxDQUFrQkosR0FBbEIsQ0FBVDtBQUNIOztBQUNERixnQkFBQUEsTUFBTSxDQUFDVSwyQkFBUCxDQUFtQ25CLE1BQW5DO0FBRUFBLGdCQUFBQSxNQUFNLENBQUNvQixNQUFQLENBQWM7QUFDVkMsa0JBQUFBLElBQUksRUFBRXpCLE1BQU0sQ0FBQ3lCLElBREg7QUFFVkMsa0JBQUFBLElBQUksRUFBRXJCLEdBQUcsR0FBR0EsR0FBRyxDQUFDcUIsSUFBUCxHQUFjMUIsTUFBTSxDQUFDMEI7QUFGcEIsaUJBQWQsRUFHRyxZQUFNO0FBQ0wsc0JBQU1DLEdBQUcsaUJBQVV0QixHQUFHLEdBQUcsR0FBSCxHQUFTLEVBQXRCLGdCQUE4QkwsTUFBTSxDQUFDeUIsSUFBckMsY0FBNkNwQixHQUFHLEdBQUdBLEdBQUcsQ0FBQ3FCLElBQVAsR0FBYzFCLE1BQU0sQ0FBQzBCLElBQXJFLGFBQVQ7O0FBQ0Esa0JBQUEsS0FBSSxDQUFDeEIsR0FBTCxDQUFTMEIsS0FBVCxzQkFBNkJELEdBQTdCO0FBQ0gsaUJBTkQiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxyXG4gKiBDb3B5cmlnaHQgMjAxOC0yMDE5IFRPTiBERVYgU09MVVRJT05TIExURC5cclxuICpcclxuICogTGljZW5zZWQgdW5kZXIgdGhlIFNPRlRXQVJFIEVWQUxVQVRJT04gTGljZW5zZSAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlXHJcbiAqIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZVxyXG4gKiBMaWNlbnNlIGF0OlxyXG4gKlxyXG4gKiBodHRwOi8vd3d3LnRvbi5kZXYvbGljZW5zZXNcclxuICpcclxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxyXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXHJcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxyXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBUT04gREVWIHNvZnR3YXJlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcclxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXHJcbiAqL1xyXG5cclxuLy8gQGZsb3dcclxuaW1wb3J0IGZzIGZyb20gJ2ZzJztcclxuXHJcbmltcG9ydCBleHByZXNzIGZyb20gJ2V4cHJlc3MnO1xyXG5pbXBvcnQgaHR0cCBmcm9tICdodHRwJztcclxuaW1wb3J0IGh0dHBzIGZyb20gJ2h0dHBzJztcclxuXHJcbmltcG9ydCB7IEFwb2xsb1NlcnZlciB9IGZyb20gJ2Fwb2xsby1zZXJ2ZXItZXhwcmVzcyc7XHJcblxyXG5pbXBvcnQgQXJhbmdvIGZyb20gJy4vYXJhbmdvJztcclxuXHJcbmltcG9ydCB7IGNyZWF0ZVJlc29sdmVycyB9IGZyb20gJy4vYXJhbmdvLXJlc29sdmVycyc7XHJcbmltcG9ydCB0eXBlIHsgUUNvbmZpZyB9IGZyb20gXCIuL2NvbmZpZ1wiO1xyXG5pbXBvcnQgeyBhdHRhY2hDdXN0b21SZXNvbHZlcnMgfSBmcm9tIFwiLi9jdXN0b20tcmVzb2x2ZXJzXCI7XHJcbmltcG9ydCBRTG9ncyBmcm9tIFwiLi9sb2dzXCI7XHJcbmltcG9ydCB0eXBlIHsgUUxvZyB9IGZyb20gXCIuL2xvZ3NcIjtcclxuXHJcbnR5cGUgUU9wdGlvbnMgPSB7XHJcbiAgICBjb25maWc6IFFDb25maWcsXHJcbiAgICBsb2dzOiBRTG9ncyxcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVE9OUVNlcnZlciB7XHJcbiAgICBjb25maWc6IFFDb25maWc7XHJcbiAgICBsb2dzOiBRTG9ncztcclxuICAgIGxvZzogUUxvZztcclxuICAgIGRiOiBBcmFuZ287XHJcblxyXG4gICAgY29uc3RydWN0b3Iob3B0aW9uczogUU9wdGlvbnMpIHtcclxuICAgICAgICB0aGlzLmNvbmZpZyA9IG9wdGlvbnMuY29uZmlnO1xyXG4gICAgICAgIHRoaXMubG9ncyA9IG9wdGlvbnMubG9ncztcclxuICAgICAgICB0aGlzLmxvZyA9IHRoaXMubG9ncy5jcmVhdGUoJ1EgU2VydmVyJyk7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIGFzeW5jIHN0YXJ0KCkge1xyXG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IHRoaXMuY29uZmlnLnNlcnZlcjtcclxuICAgICAgICBjb25zdCBzc2wgPSBjb25maWcuc3NsO1xyXG5cclxuICAgICAgICB0aGlzLmRiID0gbmV3IEFyYW5nbyh0aGlzLmNvbmZpZywgdGhpcy5sb2dzKTtcclxuICAgICAgICBjb25zdCB0eXBlRGVmcyA9IGZzLnJlYWRGaWxlU3luYygndHlwZS1kZWZzLmdyYXBocWwnLCAndXRmLTgnKTtcclxuICAgICAgICBjb25zdCByZXNvbHZlcnMgPSBhdHRhY2hDdXN0b21SZXNvbHZlcnMoY3JlYXRlUmVzb2x2ZXJzKHRoaXMuZGIpKTtcclxuICAgICAgICBhd2FpdCB0aGlzLmRiLnN0YXJ0KCk7XHJcblxyXG4gICAgICAgIGNvbnN0IGFwb2xsbyA9IG5ldyBBcG9sbG9TZXJ2ZXIoe1xyXG4gICAgICAgICAgICB0eXBlRGVmcyxcclxuICAgICAgICAgICAgcmVzb2x2ZXJzLFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBjb25zdCBhcHAgPSBleHByZXNzKCk7XHJcbiAgICAgICAgYXBvbGxvLmFwcGx5TWlkZGxld2FyZSh7IGFwcCwgcGF0aDogJy9ncmFwaHFsJyB9KTtcclxuXHJcbiAgICAgICAgbGV0IHNlcnZlcjtcclxuICAgICAgICBpZiAoc3NsKSB7XHJcbiAgICAgICAgICAgIHNlcnZlciA9IGh0dHBzLmNyZWF0ZVNlcnZlcihcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBrZXk6IGZzLnJlYWRGaWxlU3luYyhzc2wua2V5KSxcclxuICAgICAgICAgICAgICAgICAgICBjZXJ0OiBmcy5yZWFkRmlsZVN5bmMoc3NsLmNlcnQpXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgYXBwXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBzZXJ2ZXIgPSBodHRwLmNyZWF0ZVNlcnZlcihhcHApXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGFwb2xsby5pbnN0YWxsU3Vic2NyaXB0aW9uSGFuZGxlcnMoc2VydmVyKTtcclxuXHJcbiAgICAgICAgc2VydmVyLmxpc3Rlbih7XHJcbiAgICAgICAgICAgIGhvc3Q6IGNvbmZpZy5ob3N0LFxyXG4gICAgICAgICAgICBwb3J0OiBzc2wgPyBzc2wucG9ydCA6IGNvbmZpZy5wb3J0XHJcbiAgICAgICAgfSwgKCkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCB1cmkgPSBgaHR0cCR7c3NsID8gJ3MnIDogJyd9Oi8vJHtjb25maWcuaG9zdH06JHtzc2wgPyBzc2wucG9ydCA6IGNvbmZpZy5wb3J0fS9ncmFwaHFsYDtcclxuICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoYFN0YXJ0ZWQgb24gJHt1cml9YCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbiJdfQ==