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
                typeDefs = _fs["default"].readFileSync('server/type-defs.graphql', 'utf-8');
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9zZXJ2ZXIuanMiXSwibmFtZXMiOlsiVE9OUVNlcnZlciIsIm9wdGlvbnMiLCJjb25maWciLCJsb2dzIiwibG9nIiwiY3JlYXRlIiwic2VydmVyIiwic3NsIiwiZGIiLCJBcmFuZ28iLCJ0eXBlRGVmcyIsImZzIiwicmVhZEZpbGVTeW5jIiwicmVzb2x2ZXJzIiwic3RhcnQiLCJhcG9sbG8iLCJBcG9sbG9TZXJ2ZXIiLCJhcHAiLCJhcHBseU1pZGRsZXdhcmUiLCJwYXRoIiwiaHR0cHMiLCJjcmVhdGVTZXJ2ZXIiLCJrZXkiLCJjZXJ0IiwiaHR0cCIsImluc3RhbGxTdWJzY3JpcHRpb25IYW5kbGVycyIsImxpc3RlbiIsImhvc3QiLCJwb3J0IiwidXJpIiwiZGVidWciXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQTs7QUFFQTs7QUFDQTs7QUFDQTs7QUFFQTs7QUFFQTs7QUFFQTs7QUFFQTs7SUFRcUJBLFU7OztBQU1qQixzQkFBWUMsT0FBWixFQUErQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFDM0IsU0FBS0MsTUFBTCxHQUFjRCxPQUFPLENBQUNDLE1BQXRCO0FBQ0EsU0FBS0MsSUFBTCxHQUFZRixPQUFPLENBQUNFLElBQXBCO0FBQ0EsU0FBS0MsR0FBTCxHQUFXLEtBQUtELElBQUwsQ0FBVUUsTUFBVixDQUFpQixVQUFqQixDQUFYO0FBQ0g7Ozs7Ozs7Ozs7Ozs7OztBQUlTSCxnQkFBQUEsTSxHQUFTLEtBQUtBLE1BQUwsQ0FBWUksTTtBQUNyQkMsZ0JBQUFBLEcsR0FBTUwsTUFBTSxDQUFDSyxHO0FBRW5CLHFCQUFLQyxFQUFMLEdBQVUsSUFBSUMsa0JBQUosQ0FBVyxLQUFLUCxNQUFoQixFQUF3QixLQUFLQyxJQUE3QixDQUFWO0FBQ01PLGdCQUFBQSxRLEdBQVdDLGVBQUdDLFlBQUgsQ0FBZ0IsMEJBQWhCLEVBQTRDLE9BQTVDLEM7QUFDWEMsZ0JBQUFBLFMsR0FBWSxzQ0FBZ0IsS0FBS0wsRUFBckIsQzs7dUJBQ1osS0FBS0EsRUFBTCxDQUFRTSxLQUFSLEU7OztBQUVBQyxnQkFBQUEsTSxHQUFTLElBQUlDLGlDQUFKLENBQWlCO0FBQzVCTixrQkFBQUEsUUFBUSxFQUFSQSxRQUQ0QjtBQUU1Qkcsa0JBQUFBLFNBQVMsRUFBVEE7QUFGNEIsaUJBQWpCLEM7QUFLVEksZ0JBQUFBLEcsR0FBTSwwQjtBQUNaRixnQkFBQUEsTUFBTSxDQUFDRyxlQUFQLENBQXVCO0FBQUVELGtCQUFBQSxHQUFHLEVBQUhBLEdBQUY7QUFBT0Usa0JBQUFBLElBQUksRUFBRTtBQUFiLGlCQUF2Qjs7QUFHQSxvQkFBSVosR0FBSixFQUFTO0FBQ0xELGtCQUFBQSxNQUFNLEdBQUdjLGtCQUFNQyxZQUFOLENBQ0w7QUFDSUMsb0JBQUFBLEdBQUcsRUFBRVgsZUFBR0MsWUFBSCxDQUFnQkwsR0FBRyxDQUFDZSxHQUFwQixDQURUO0FBRUlDLG9CQUFBQSxJQUFJLEVBQUVaLGVBQUdDLFlBQUgsQ0FBZ0JMLEdBQUcsQ0FBQ2dCLElBQXBCO0FBRlYsbUJBREssRUFLTE4sR0FMSyxDQUFUO0FBT0gsaUJBUkQsTUFRTztBQUNIWCxrQkFBQUEsTUFBTSxHQUFHa0IsaUJBQUtILFlBQUwsQ0FBa0JKLEdBQWxCLENBQVQ7QUFDSDs7QUFDREYsZ0JBQUFBLE1BQU0sQ0FBQ1UsMkJBQVAsQ0FBbUNuQixNQUFuQztBQUVBQSxnQkFBQUEsTUFBTSxDQUFDb0IsTUFBUCxDQUFjO0FBQ1ZDLGtCQUFBQSxJQUFJLEVBQUV6QixNQUFNLENBQUN5QixJQURIO0FBRVZDLGtCQUFBQSxJQUFJLEVBQUVyQixHQUFHLEdBQUdBLEdBQUcsQ0FBQ3FCLElBQVAsR0FBYzFCLE1BQU0sQ0FBQzBCO0FBRnBCLGlCQUFkLEVBR0csWUFBTTtBQUNMLHNCQUFNQyxHQUFHLGlCQUFVdEIsR0FBRyxHQUFHLEdBQUgsR0FBUyxFQUF0QixnQkFBOEJMLE1BQU0sQ0FBQ3lCLElBQXJDLGNBQTZDcEIsR0FBRyxHQUFHQSxHQUFHLENBQUNxQixJQUFQLEdBQWMxQixNQUFNLENBQUMwQixJQUFyRSxhQUFUOztBQUNBLGtCQUFBLEtBQUksQ0FBQ3hCLEdBQUwsQ0FBUzBCLEtBQVQsc0JBQTZCRCxHQUE3QjtBQUNILGlCQU5EIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQGZsb3dcbmltcG9ydCBmcyBmcm9tICdmcyc7XG5cbmltcG9ydCBleHByZXNzIGZyb20gJ2V4cHJlc3MnO1xuaW1wb3J0IGh0dHAgZnJvbSAnaHR0cCc7XG5pbXBvcnQgaHR0cHMgZnJvbSAnaHR0cHMnO1xuXG5pbXBvcnQgeyBBcG9sbG9TZXJ2ZXIgfSBmcm9tICdhcG9sbG8tc2VydmVyLWV4cHJlc3MnO1xuXG5pbXBvcnQgQXJhbmdvIGZyb20gJy4vYXJhbmdvJztcblxuaW1wb3J0IHsgY3JlYXRlUmVzb2x2ZXJzIH0gZnJvbSAnLi9hcmFuZ28tcmVzb2x2ZXJzJztcbmltcG9ydCB0eXBlIHsgUUNvbmZpZyB9IGZyb20gXCIuL2NvbmZpZ1wiO1xuaW1wb3J0IFFMb2dzIGZyb20gXCIuL2xvZ3NcIjtcbmltcG9ydCB0eXBlIHsgUUxvZyB9IGZyb20gXCIuL2xvZ3NcIjtcblxudHlwZSBRT3B0aW9ucyA9IHtcbiAgICBjb25maWc6IFFDb25maWcsXG4gICAgbG9nczogUUxvZ3MsXG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFRPTlFTZXJ2ZXIge1xuICAgIGNvbmZpZzogUUNvbmZpZztcbiAgICBsb2dzOiBRTG9ncztcbiAgICBsb2c6IFFMb2c7XG4gICAgZGI6IEFyYW5nbztcblxuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnM6IFFPcHRpb25zKSB7XG4gICAgICAgIHRoaXMuY29uZmlnID0gb3B0aW9ucy5jb25maWc7XG4gICAgICAgIHRoaXMubG9ncyA9IG9wdGlvbnMubG9ncztcbiAgICAgICAgdGhpcy5sb2cgPSB0aGlzLmxvZ3MuY3JlYXRlKCdRIFNlcnZlcicpO1xuICAgIH1cblxuXG4gICAgYXN5bmMgc3RhcnQoKSB7XG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IHRoaXMuY29uZmlnLnNlcnZlcjtcbiAgICAgICAgY29uc3Qgc3NsID0gY29uZmlnLnNzbDtcblxuICAgICAgICB0aGlzLmRiID0gbmV3IEFyYW5nbyh0aGlzLmNvbmZpZywgdGhpcy5sb2dzKTtcbiAgICAgICAgY29uc3QgdHlwZURlZnMgPSBmcy5yZWFkRmlsZVN5bmMoJ3NlcnZlci90eXBlLWRlZnMuZ3JhcGhxbCcsICd1dGYtOCcpO1xuICAgICAgICBjb25zdCByZXNvbHZlcnMgPSBjcmVhdGVSZXNvbHZlcnModGhpcy5kYik7XG4gICAgICAgIGF3YWl0IHRoaXMuZGIuc3RhcnQoKTtcblxuICAgICAgICBjb25zdCBhcG9sbG8gPSBuZXcgQXBvbGxvU2VydmVyKHtcbiAgICAgICAgICAgIHR5cGVEZWZzLFxuICAgICAgICAgICAgcmVzb2x2ZXJzLFxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBhcHAgPSBleHByZXNzKCk7XG4gICAgICAgIGFwb2xsby5hcHBseU1pZGRsZXdhcmUoeyBhcHAsIHBhdGg6ICcvZ3JhcGhxbCcgfSk7XG5cbiAgICAgICAgbGV0IHNlcnZlcjtcbiAgICAgICAgaWYgKHNzbCkge1xuICAgICAgICAgICAgc2VydmVyID0gaHR0cHMuY3JlYXRlU2VydmVyKFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAga2V5OiBmcy5yZWFkRmlsZVN5bmMoc3NsLmtleSksXG4gICAgICAgICAgICAgICAgICAgIGNlcnQ6IGZzLnJlYWRGaWxlU3luYyhzc2wuY2VydClcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGFwcFxuICAgICAgICAgICAgKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2VydmVyID0gaHR0cC5jcmVhdGVTZXJ2ZXIoYXBwKVxuICAgICAgICB9XG4gICAgICAgIGFwb2xsby5pbnN0YWxsU3Vic2NyaXB0aW9uSGFuZGxlcnMoc2VydmVyKTtcblxuICAgICAgICBzZXJ2ZXIubGlzdGVuKHtcbiAgICAgICAgICAgIGhvc3Q6IGNvbmZpZy5ob3N0LFxuICAgICAgICAgICAgcG9ydDogc3NsID8gc3NsLnBvcnQgOiBjb25maWcucG9ydFxuICAgICAgICB9LCAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCB1cmkgPSBgaHR0cCR7c3NsID8gJ3MnIDogJyd9Oi8vJHtjb25maWcuaG9zdH06JHtzc2wgPyBzc2wucG9ydCA6IGNvbmZpZy5wb3J0fS9ncmFwaHFsYDtcbiAgICAgICAgICAgIHRoaXMubG9nLmRlYnVnKGBTdGFydGVkIG9uICR7dXJpfWApO1xuICAgICAgICB9KTtcbiAgICB9XG59XG5cbiJdfQ==