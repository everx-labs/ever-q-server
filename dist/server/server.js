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

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

var TONQServer =
/*#__PURE__*/
function () {
  function TONQServer(options) {
    (0, _classCallCheck2["default"])(this, TONQServer);
    (0, _defineProperty2["default"])(this, "config", void 0);
    (0, _defineProperty2["default"])(this, "logs", void 0);
    (0, _defineProperty2["default"])(this, "log", void 0);
    (0, _defineProperty2["default"])(this, "db", void 0);
    (0, _defineProperty2["default"])(this, "tracer", void 0);
    (0, _defineProperty2["default"])(this, "shared", void 0);
    this.config = options.config;
    this.logs = options.logs;
    this.log = this.logs.create('Q Server');
    this.shared = new Map();
    this.tracer = new _tracer.Tracer(options.config);
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
                this.db = new _arango["default"](this.config, this.logs, this.tracer);
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
                  context: function context(_ref) {
                    var req = _ref.req;
                    return _objectSpread({
                      db: _this2.db,
                      config: _this2.config,
                      shared: _this2.shared
                    }, _this2.tracer.getContext(req));
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9zZXJ2ZXIuanMiXSwibmFtZXMiOlsiVE9OUVNlcnZlciIsIm9wdGlvbnMiLCJjb25maWciLCJsb2dzIiwibG9nIiwiY3JlYXRlIiwic2hhcmVkIiwiTWFwIiwidHJhY2VyIiwiVHJhY2VyIiwiYXBwIiwidHlwZURlZnMiLCJmcyIsInJlYWRGaWxlU3luYyIsImFwb2xsbyIsIkFwb2xsb1NlcnZlciIsInJlc29sdmVyc01hbSIsImNvbnRleHQiLCJkYiIsImFwcGx5TWlkZGxld2FyZSIsInBhdGgiLCJzZXJ2ZXIiLCJBcmFuZ28iLCJnZW5lcmF0ZWRUeXBlRGVmcyIsImN1c3RvbVR5cGVEZWZzIiwicmVzb2x2ZXJzIiwic3RhcnQiLCJyZXEiLCJnZXRDb250ZXh0Iiwic3RhcnRNYW0iLCJodHRwIiwiY3JlYXRlU2VydmVyIiwiaW5zdGFsbFN1YnNjcmlwdGlvbkhhbmRsZXJzIiwibGlzdGVuIiwiaG9zdCIsInBvcnQiLCJ1cmkiLCJkZWJ1ZyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWlCQTs7QUFDQTs7QUFDQTs7QUFFQTs7QUFFQTs7QUFFQTs7QUFDQTs7QUFDQTs7QUFHQTs7QUFFQTs7Ozs7O0lBT3FCQSxVOzs7QUFRakIsc0JBQVlDLE9BQVosRUFBK0I7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUMzQixTQUFLQyxNQUFMLEdBQWNELE9BQU8sQ0FBQ0MsTUFBdEI7QUFDQSxTQUFLQyxJQUFMLEdBQVlGLE9BQU8sQ0FBQ0UsSUFBcEI7QUFDQSxTQUFLQyxHQUFMLEdBQVcsS0FBS0QsSUFBTCxDQUFVRSxNQUFWLENBQWlCLFVBQWpCLENBQVg7QUFDQSxTQUFLQyxNQUFMLEdBQWMsSUFBSUMsR0FBSixFQUFkO0FBQ0EsU0FBS0MsTUFBTCxHQUFjLElBQUlDLGNBQUosQ0FBV1IsT0FBTyxDQUFDQyxNQUFuQixDQUFkO0FBQ0g7Ozs7Ozs7b0RBRWNRLEc7Ozs7Ozs7O0FBQ0xDLGdCQUFBQSxRLEdBQVdDLGVBQUdDLFlBQUgsQ0FBZ0IsdUJBQWhCLEVBQXlDLE9BQXpDLEM7QUFFWEMsZ0JBQUFBLE0sR0FBUyxJQUFJQyxpQ0FBSixDQUFpQjtBQUM1Qkosa0JBQUFBLFFBQVEsRUFBUkEsUUFENEI7QUFFNUJLLGtCQUFBQSxZQUFZLEVBQVpBLDBCQUY0QjtBQUc1QkMsa0JBQUFBLE9BQU8sRUFBRTtBQUFBLDJCQUFPO0FBQ1pDLHNCQUFBQSxFQUFFLEVBQUUsS0FBSSxDQUFDQSxFQURHO0FBRVpoQixzQkFBQUEsTUFBTSxFQUFFLEtBQUksQ0FBQ0EsTUFGRDtBQUdaSSxzQkFBQUEsTUFBTSxFQUFFLEtBQUksQ0FBQ0E7QUFIRCxxQkFBUDtBQUFBO0FBSG1CLGlCQUFqQixDO0FBVWZRLGdCQUFBQSxNQUFNLENBQUNLLGVBQVAsQ0FBdUI7QUFBRVQsa0JBQUFBLEdBQUcsRUFBSEEsR0FBRjtBQUFPVSxrQkFBQUEsSUFBSSxFQUFFO0FBQWIsaUJBQXZCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUlNbEIsZ0JBQUFBLE0sR0FBUyxLQUFLQSxNQUFMLENBQVltQixNO0FBRTNCLHFCQUFLSCxFQUFMLEdBQVUsSUFBSUksa0JBQUosQ0FBVyxLQUFLcEIsTUFBaEIsRUFBd0IsS0FBS0MsSUFBN0IsRUFBbUMsS0FBS0ssTUFBeEMsQ0FBVjtBQUNNZSxnQkFBQUEsaUIsR0FBb0JYLGVBQUdDLFlBQUgsZ0NBQStDLE9BQS9DLEM7QUFDcEJXLGdCQUFBQSxjLEdBQWlCWixlQUFHQyxZQUFILENBQWdCLDBCQUFoQixFQUE0QyxPQUE1QyxDO0FBQ2pCRixnQkFBQUEsUSxhQUFjWSxpQixlQUFzQkMsYztBQUNwQ0MsZ0JBQUFBLFMsR0FBWSw0Q0FBc0IseUNBQWdCLEtBQUtQLEVBQXJCLENBQXRCLEM7O3VCQUVaLEtBQUtBLEVBQUwsQ0FBUVEsS0FBUixFOzs7QUFFQVosZ0JBQUFBLE0sR0FBUyxJQUFJQyxpQ0FBSixDQUFpQjtBQUM1Qkosa0JBQUFBLFFBQVEsRUFBUkEsUUFENEI7QUFFNUJjLGtCQUFBQSxTQUFTLEVBQVRBLFNBRjRCO0FBRzVCUixrQkFBQUEsT0FBTyxFQUFFLHVCQUFhO0FBQUEsd0JBQVZVLEdBQVUsUUFBVkEsR0FBVTtBQUNsQjtBQUNJVCxzQkFBQUEsRUFBRSxFQUFFLE1BQUksQ0FBQ0EsRUFEYjtBQUVJaEIsc0JBQUFBLE1BQU0sRUFBRSxNQUFJLENBQUNBLE1BRmpCO0FBR0lJLHNCQUFBQSxNQUFNLEVBQUUsTUFBSSxDQUFDQTtBQUhqQix1QkFJTyxNQUFJLENBQUNFLE1BQUwsQ0FBWW9CLFVBQVosQ0FBdUJELEdBQXZCLENBSlA7QUFNSDtBQVYyQixpQkFBakIsQztBQWFUakIsZ0JBQUFBLEcsR0FBTSwwQjs7dUJBQ04sS0FBS21CLFFBQUwsQ0FBY25CLEdBQWQsQzs7O0FBQ05JLGdCQUFBQSxNQUFNLENBQUNLLGVBQVAsQ0FBdUI7QUFBRVQsa0JBQUFBLEdBQUcsRUFBSEEsR0FBRjtBQUFPVSxrQkFBQUEsSUFBSSxFQUFFO0FBQWIsaUJBQXZCO0FBRU1DLGdCQUFBQSxNLEdBQVNTLGlCQUFLQyxZQUFMLENBQWtCckIsR0FBbEIsQztBQUNmSSxnQkFBQUEsTUFBTSxDQUFDa0IsMkJBQVAsQ0FBbUNYLE1BQW5DO0FBRUFBLGdCQUFBQSxNQUFNLENBQUNZLE1BQVAsQ0FBYztBQUNWQyxrQkFBQUEsSUFBSSxFQUFFaEMsTUFBTSxDQUFDZ0MsSUFESDtBQUVWQyxrQkFBQUEsSUFBSSxFQUFFakMsTUFBTSxDQUFDaUM7QUFGSCxpQkFBZCxFQUdHLFlBQU07QUFDTCxzQkFBTUMsR0FBRyxvQkFBYWxDLE1BQU0sQ0FBQ2dDLElBQXBCLGNBQTRCaEMsTUFBTSxDQUFDaUMsSUFBbkMsYUFBVDs7QUFDQSxrQkFBQSxNQUFJLENBQUMvQixHQUFMLENBQVNpQyxLQUFULHNCQUE2QkQsR0FBN0I7QUFDSCxpQkFORCIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgMjAxOC0yMDE5IFRPTiBERVYgU09MVVRJT05TIExURC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgU09GVFdBUkUgRVZBTFVBVElPTiBMaWNlbnNlICh0aGUgXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2VcbiAqIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZVxuICogTGljZW5zZSBhdDpcbiAqXG4gKiBodHRwOi8vd3d3LnRvbi5kZXYvbGljZW5zZXNcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIFRPTiBERVYgc29mdHdhcmUgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLy8gQGZsb3dcbmltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQgZXhwcmVzcyBmcm9tICdleHByZXNzJztcbmltcG9ydCBodHRwIGZyb20gJ2h0dHAnO1xuXG5pbXBvcnQgeyBBcG9sbG9TZXJ2ZXIgfSBmcm9tICdhcG9sbG8tc2VydmVyLWV4cHJlc3MnO1xuXG5pbXBvcnQgQXJhbmdvIGZyb20gJy4vYXJhbmdvJztcblxuaW1wb3J0IHsgY3JlYXRlUmVzb2x2ZXJzIH0gZnJvbSAnLi9yZXNvbHZlcnMtZ2VuZXJhdGVkJztcbmltcG9ydCB7IGF0dGFjaEN1c3RvbVJlc29sdmVycyB9IGZyb20gXCIuL3Jlc29sdmVycy1jdXN0b21cIjtcbmltcG9ydCB7IHJlc29sdmVyc01hbSB9IGZyb20gXCIuL3Jlc29sdmVycy1tYW1cIjtcblxuaW1wb3J0IHR5cGUgeyBRQ29uZmlnIH0gZnJvbSAnLi9jb25maWcnO1xuaW1wb3J0IFFMb2dzIGZyb20gJy4vbG9ncyc7XG5pbXBvcnQgdHlwZSB7IFFMb2cgfSBmcm9tICcuL2xvZ3MnO1xuaW1wb3J0IHsgVHJhY2VyIH0gZnJvbSBcIi4vdHJhY2VyXCI7XG5cbnR5cGUgUU9wdGlvbnMgPSB7XG4gICAgY29uZmlnOiBRQ29uZmlnLFxuICAgIGxvZ3M6IFFMb2dzLFxufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBUT05RU2VydmVyIHtcbiAgICBjb25maWc6IFFDb25maWc7XG4gICAgbG9nczogUUxvZ3M7XG4gICAgbG9nOiBRTG9nO1xuICAgIGRiOiBBcmFuZ287XG4gICAgdHJhY2VyOiBUcmFjZXI7XG4gICAgc2hhcmVkOiBNYXA8c3RyaW5nLCBhbnk+O1xuXG4gICAgY29uc3RydWN0b3Iob3B0aW9uczogUU9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5jb25maWcgPSBvcHRpb25zLmNvbmZpZztcbiAgICAgICAgdGhpcy5sb2dzID0gb3B0aW9ucy5sb2dzO1xuICAgICAgICB0aGlzLmxvZyA9IHRoaXMubG9ncy5jcmVhdGUoJ1EgU2VydmVyJyk7XG4gICAgICAgIHRoaXMuc2hhcmVkID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLnRyYWNlciA9IG5ldyBUcmFjZXIob3B0aW9ucy5jb25maWcpO1xuICAgIH1cblxuICAgIGFzeW5jIHN0YXJ0TWFtKGFwcDogZXhwcmVzcy5BcHBsaWNhdGlvbikge1xuICAgICAgICBjb25zdCB0eXBlRGVmcyA9IGZzLnJlYWRGaWxlU3luYygndHlwZS1kZWZzLW1hbS5ncmFwaHFsJywgJ3V0Zi04Jyk7XG5cbiAgICAgICAgY29uc3QgYXBvbGxvID0gbmV3IEFwb2xsb1NlcnZlcih7XG4gICAgICAgICAgICB0eXBlRGVmcyxcbiAgICAgICAgICAgIHJlc29sdmVyc01hbSxcbiAgICAgICAgICAgIGNvbnRleHQ6ICgpID0+ICh7XG4gICAgICAgICAgICAgICAgZGI6IHRoaXMuZGIsXG4gICAgICAgICAgICAgICAgY29uZmlnOiB0aGlzLmNvbmZpZyxcbiAgICAgICAgICAgICAgICBzaGFyZWQ6IHRoaXMuc2hhcmVkLFxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSk7XG5cbiAgICAgICAgYXBvbGxvLmFwcGx5TWlkZGxld2FyZSh7IGFwcCwgcGF0aDogJy9ncmFwaHFsL21hbScgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMgc3RhcnQoKSB7XG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IHRoaXMuY29uZmlnLnNlcnZlcjtcblxuICAgICAgICB0aGlzLmRiID0gbmV3IEFyYW5nbyh0aGlzLmNvbmZpZywgdGhpcy5sb2dzLCB0aGlzLnRyYWNlcik7XG4gICAgICAgIGNvbnN0IGdlbmVyYXRlZFR5cGVEZWZzID0gZnMucmVhZEZpbGVTeW5jKGB0eXBlLWRlZnMtZ2VuZXJhdGVkLmdyYXBocWxgLCAndXRmLTgnKTtcbiAgICAgICAgY29uc3QgY3VzdG9tVHlwZURlZnMgPSBmcy5yZWFkRmlsZVN5bmMoJ3R5cGUtZGVmcy1jdXN0b20uZ3JhcGhxbCcsICd1dGYtOCcpO1xuICAgICAgICBjb25zdCB0eXBlRGVmcyA9IGAke2dlbmVyYXRlZFR5cGVEZWZzfVxcbiR7Y3VzdG9tVHlwZURlZnN9YDtcbiAgICAgICAgY29uc3QgcmVzb2x2ZXJzID0gYXR0YWNoQ3VzdG9tUmVzb2x2ZXJzKGNyZWF0ZVJlc29sdmVycyh0aGlzLmRiKSk7XG5cbiAgICAgICAgYXdhaXQgdGhpcy5kYi5zdGFydCgpO1xuXG4gICAgICAgIGNvbnN0IGFwb2xsbyA9IG5ldyBBcG9sbG9TZXJ2ZXIoe1xuICAgICAgICAgICAgdHlwZURlZnMsXG4gICAgICAgICAgICByZXNvbHZlcnMsXG4gICAgICAgICAgICBjb250ZXh0OiAoeyByZXEgfSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIGRiOiB0aGlzLmRiLFxuICAgICAgICAgICAgICAgICAgICBjb25maWc6IHRoaXMuY29uZmlnLFxuICAgICAgICAgICAgICAgICAgICBzaGFyZWQ6IHRoaXMuc2hhcmVkLFxuICAgICAgICAgICAgICAgICAgICAuLi50aGlzLnRyYWNlci5nZXRDb250ZXh0KHJlcSksXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IGFwcCA9IGV4cHJlc3MoKTtcbiAgICAgICAgYXdhaXQgdGhpcy5zdGFydE1hbShhcHApO1xuICAgICAgICBhcG9sbG8uYXBwbHlNaWRkbGV3YXJlKHsgYXBwLCBwYXRoOiAnL2dyYXBocWwnIH0pO1xuXG4gICAgICAgIGNvbnN0IHNlcnZlciA9IGh0dHAuY3JlYXRlU2VydmVyKGFwcCk7XG4gICAgICAgIGFwb2xsby5pbnN0YWxsU3Vic2NyaXB0aW9uSGFuZGxlcnMoc2VydmVyKTtcblxuICAgICAgICBzZXJ2ZXIubGlzdGVuKHtcbiAgICAgICAgICAgIGhvc3Q6IGNvbmZpZy5ob3N0LFxuICAgICAgICAgICAgcG9ydDogY29uZmlnLnBvcnQsXG4gICAgICAgIH0sICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHVyaSA9IGBodHRwOi8vJHtjb25maWcuaG9zdH06JHtjb25maWcucG9ydH0vZ3JhcGhxbGA7XG4gICAgICAgICAgICB0aGlzLmxvZy5kZWJ1ZyhgU3RhcnRlZCBvbiAke3VyaX1gKTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG4iXX0=