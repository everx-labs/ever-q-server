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

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

var TONQServer =
/*#__PURE__*/
function () {
  function TONQServer(options) {
    var _this = this;

    (0, _classCallCheck2["default"])(this, TONQServer);
    (0, _defineProperty2["default"])(this, "config", void 0);
    (0, _defineProperty2["default"])(this, "logs", void 0);
    (0, _defineProperty2["default"])(this, "log", void 0);
    (0, _defineProperty2["default"])(this, "app", void 0);
    (0, _defineProperty2["default"])(this, "server", void 0);
    (0, _defineProperty2["default"])(this, "endPoints", void 0);
    (0, _defineProperty2["default"])(this, "db", void 0);
    (0, _defineProperty2["default"])(this, "tracer", void 0);
    (0, _defineProperty2["default"])(this, "shared", void 0);
    this.config = options.config;
    this.logs = options.logs;
    this.log = this.logs.create('server');
    this.shared = new Map();
    this.tracer = new _tracer.Tracer(options.config);
    this.endPoints = [];
    this.app = (0, _express["default"])();
    this.server = _http["default"].createServer(this.app);
    this.db = new _arango["default"](this.config, this.logs, this.tracer);
    this.addEndPoint({
      path: '/graphql/mam',
      resolvers: _resolversMam.resolversMam,
      typeDefFileNames: ['type-defs-mam.graphql'],
      supportSubscriptions: false,
      extraContext: function extraContext() {
        return {};
      }
    });
    this.addEndPoint({
      path: '/graphql',
      resolvers: (0, _resolversCustom.attachCustomResolvers)((0, _resolversGenerated.createResolvers)(this.db)),
      typeDefFileNames: ['type-defs-generated.graphql', 'type-defs-custom.graphql'],
      supportSubscriptions: true,
      extraContext: function extraContext(req) {
        return _this.tracer.getContext(req);
      }
    });
  }

  (0, _createClass2["default"])(TONQServer, [{
    key: "start",
    value: function () {
      var _start = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee() {
        var _this2 = this;

        var _this$config$server, host, port;

        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return this.db.start();

              case 2:
                _this$config$server = this.config.server, host = _this$config$server.host, port = _this$config$server.port;
                this.server.listen({
                  host: host,
                  port: port
                }, function () {
                  _this2.endPoints.forEach(function (endPoint) {
                    _this2.log.debug('GRAPHQL', "http://".concat(host, ":").concat(port).concat(endPoint.path));
                  });
                });

              case 4:
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
  }, {
    key: "addEndPoint",
    value: function addEndPoint(endPoint) {
      var _this3 = this;

      var typeDefs = endPoint.typeDefFileNames.map(function (x) {
        return _fs["default"].readFileSync(x, 'utf-8');
      }).join('\n');
      var apollo = new _apolloServerExpress.ApolloServer({
        typeDefs: typeDefs,
        resolvers: endPoint.resolvers,
        context: function context(_ref) {
          var req = _ref.req;
          return _objectSpread({
            db: _this3.db,
            config: _this3.config,
            shared: _this3.shared
          }, endPoint.extraContext(req));
        }
      });
      apollo.applyMiddleware({
        app: this.app,
        path: endPoint.path
      });

      if (endPoint.supportSubscriptions) {
        apollo.installSubscriptionHandlers(this.server);
      }

      this.endPoints.push(endPoint);
    }
  }]);
  return TONQServer;
}();

exports["default"] = TONQServer;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9zZXJ2ZXIuanMiXSwibmFtZXMiOlsiVE9OUVNlcnZlciIsIm9wdGlvbnMiLCJjb25maWciLCJsb2dzIiwibG9nIiwiY3JlYXRlIiwic2hhcmVkIiwiTWFwIiwidHJhY2VyIiwiVHJhY2VyIiwiZW5kUG9pbnRzIiwiYXBwIiwic2VydmVyIiwiaHR0cCIsImNyZWF0ZVNlcnZlciIsImRiIiwiQXJhbmdvIiwiYWRkRW5kUG9pbnQiLCJwYXRoIiwicmVzb2x2ZXJzIiwicmVzb2x2ZXJzTWFtIiwidHlwZURlZkZpbGVOYW1lcyIsInN1cHBvcnRTdWJzY3JpcHRpb25zIiwiZXh0cmFDb250ZXh0IiwicmVxIiwiZ2V0Q29udGV4dCIsInN0YXJ0IiwiaG9zdCIsInBvcnQiLCJsaXN0ZW4iLCJmb3JFYWNoIiwiZW5kUG9pbnQiLCJkZWJ1ZyIsInR5cGVEZWZzIiwibWFwIiwieCIsImZzIiwicmVhZEZpbGVTeW5jIiwiam9pbiIsImFwb2xsbyIsIkFwb2xsb1NlcnZlciIsImNvbnRleHQiLCJhcHBseU1pZGRsZXdhcmUiLCJpbnN0YWxsU3Vic2NyaXB0aW9uSGFuZGxlcnMiLCJwdXNoIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBaUJBOztBQUNBOztBQUNBOztBQUVBOztBQUVBOztBQUVBOztBQUNBOztBQUNBOztBQUdBOztBQUVBOzs7Ozs7SUFlcUJBLFU7OztBQVlqQixzQkFBWUMsT0FBWixFQUErQjtBQUFBOztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQzNCLFNBQUtDLE1BQUwsR0FBY0QsT0FBTyxDQUFDQyxNQUF0QjtBQUNBLFNBQUtDLElBQUwsR0FBWUYsT0FBTyxDQUFDRSxJQUFwQjtBQUNBLFNBQUtDLEdBQUwsR0FBVyxLQUFLRCxJQUFMLENBQVVFLE1BQVYsQ0FBaUIsUUFBakIsQ0FBWDtBQUNBLFNBQUtDLE1BQUwsR0FBYyxJQUFJQyxHQUFKLEVBQWQ7QUFDQSxT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LEVBQUVhLFFBQVEsQ0FBQ2I7QUFBaEMsT0FBdkI7O0FBQ0EsVUFBSWEsUUFBUSxDQUFDVCxvQkFBYixFQUFtQztBQUMvQmlCLFFBQUFBLE1BQU0sQ0FBQ0ksMkJBQVAsQ0FBbUMsS0FBSy9CLE1BQXhDO0FBQ0g7O0FBQ0QsV0FBS0YsU0FBTCxDQUFla0MsSUFBZixDQUFvQmIsUUFBcEI7QUFDSCIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgMjAxOC0yMDE5IFRPTiBERVYgU09MVVRJT05TIExURC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgU09GVFdBUkUgRVZBTFVBVElPTiBMaWNlbnNlICh0aGUgXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2VcbiAqIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZVxuICogTGljZW5zZSBhdDpcbiAqXG4gKiBodHRwOi8vd3d3LnRvbi5kZXYvbGljZW5zZXNcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIFRPTiBERVYgc29mdHdhcmUgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLy8gQGZsb3dcbmltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQgZXhwcmVzcyBmcm9tICdleHByZXNzJztcbmltcG9ydCBodHRwIGZyb20gJ2h0dHAnO1xuXG5pbXBvcnQgeyBBcG9sbG9TZXJ2ZXIgfSBmcm9tICdhcG9sbG8tc2VydmVyLWV4cHJlc3MnO1xuXG5pbXBvcnQgQXJhbmdvIGZyb20gJy4vYXJhbmdvJztcblxuaW1wb3J0IHsgY3JlYXRlUmVzb2x2ZXJzIH0gZnJvbSAnLi9yZXNvbHZlcnMtZ2VuZXJhdGVkJztcbmltcG9ydCB7IGF0dGFjaEN1c3RvbVJlc29sdmVycyB9IGZyb20gXCIuL3Jlc29sdmVycy1jdXN0b21cIjtcbmltcG9ydCB7IHJlc29sdmVyc01hbSB9IGZyb20gXCIuL3Jlc29sdmVycy1tYW1cIjtcblxuaW1wb3J0IHR5cGUgeyBRQ29uZmlnIH0gZnJvbSAnLi9jb25maWcnO1xuaW1wb3J0IFFMb2dzIGZyb20gJy4vbG9ncyc7XG5pbXBvcnQgdHlwZSB7IFFMb2cgfSBmcm9tICcuL2xvZ3MnO1xuaW1wb3J0IHsgVHJhY2VyIH0gZnJvbSBcIi4vdHJhY2VyXCI7XG5cbnR5cGUgUU9wdGlvbnMgPSB7XG4gICAgY29uZmlnOiBRQ29uZmlnLFxuICAgIGxvZ3M6IFFMb2dzLFxufVxuXG50eXBlIEVuZFBvaW50ID0ge1xuICAgIHBhdGg6IHN0cmluZyxcbiAgICByZXNvbHZlcnM6IGFueSxcbiAgICB0eXBlRGVmRmlsZU5hbWVzOiBzdHJpbmdbXSxcbiAgICBzdXBwb3J0U3Vic2NyaXB0aW9uczogYm9vbGVhbixcbiAgICBleHRyYUNvbnRleHQ6IChyZXE6IGV4cHJlc3MuUmVxdWVzdCkgPT4gYW55LFxufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBUT05RU2VydmVyIHtcbiAgICBjb25maWc6IFFDb25maWc7XG4gICAgbG9nczogUUxvZ3M7XG4gICAgbG9nOiBRTG9nO1xuICAgIGFwcDogZXhwcmVzcy5BcHBsaWNhdGlvbjtcbiAgICBzZXJ2ZXI6IGFueTtcbiAgICBlbmRQb2ludHM6IEVuZFBvaW50W107XG4gICAgZGI6IEFyYW5nbztcbiAgICB0cmFjZXI6IFRyYWNlcjtcbiAgICBzaGFyZWQ6IE1hcDxzdHJpbmcsIGFueT47XG5cblxuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnM6IFFPcHRpb25zKSB7XG4gICAgICAgIHRoaXMuY29uZmlnID0gb3B0aW9ucy5jb25maWc7XG4gICAgICAgIHRoaXMubG9ncyA9IG9wdGlvbnMubG9ncztcbiAgICAgICAgdGhpcy5sb2cgPSB0aGlzLmxvZ3MuY3JlYXRlKCdzZXJ2ZXInKTtcbiAgICAgICAgdGhpcy5zaGFyZWQgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMudHJhY2VyID0gbmV3IFRyYWNlcihvcHRpb25zLmNvbmZpZyk7XG4gICAgICAgIHRoaXMuZW5kUG9pbnRzID0gW107XG4gICAgICAgIHRoaXMuYXBwID0gZXhwcmVzcygpO1xuICAgICAgICB0aGlzLnNlcnZlciA9IGh0dHAuY3JlYXRlU2VydmVyKHRoaXMuYXBwKTtcbiAgICAgICAgdGhpcy5kYiA9IG5ldyBBcmFuZ28odGhpcy5jb25maWcsIHRoaXMubG9ncywgdGhpcy50cmFjZXIpO1xuICAgICAgICB0aGlzLmFkZEVuZFBvaW50KHtcbiAgICAgICAgICAgIHBhdGg6ICcvZ3JhcGhxbC9tYW0nLFxuICAgICAgICAgICAgcmVzb2x2ZXJzOiByZXNvbHZlcnNNYW0sXG4gICAgICAgICAgICB0eXBlRGVmRmlsZU5hbWVzOiBbJ3R5cGUtZGVmcy1tYW0uZ3JhcGhxbCddLFxuICAgICAgICAgICAgc3VwcG9ydFN1YnNjcmlwdGlvbnM6IGZhbHNlLFxuICAgICAgICAgICAgZXh0cmFDb250ZXh0OiAoKSA9PiAoe30pLFxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5hZGRFbmRQb2ludCh7XG4gICAgICAgICAgICBwYXRoOiAnL2dyYXBocWwnLFxuICAgICAgICAgICAgcmVzb2x2ZXJzOiBhdHRhY2hDdXN0b21SZXNvbHZlcnMoY3JlYXRlUmVzb2x2ZXJzKHRoaXMuZGIpKSxcbiAgICAgICAgICAgIHR5cGVEZWZGaWxlTmFtZXM6IFsndHlwZS1kZWZzLWdlbmVyYXRlZC5ncmFwaHFsJywgJ3R5cGUtZGVmcy1jdXN0b20uZ3JhcGhxbCddLFxuICAgICAgICAgICAgc3VwcG9ydFN1YnNjcmlwdGlvbnM6IHRydWUsXG4gICAgICAgICAgICBleHRyYUNvbnRleHQ6IChyZXEpID0+IHRoaXMudHJhY2VyLmdldENvbnRleHQocmVxKVxuICAgICAgICB9KTtcbiAgICB9XG5cblxuICAgIGFzeW5jIHN0YXJ0KCkge1xuICAgICAgICBhd2FpdCB0aGlzLmRiLnN0YXJ0KCk7XG4gICAgICAgIGNvbnN0IHsgaG9zdCwgcG9ydCB9ID0gdGhpcy5jb25maWcuc2VydmVyO1xuICAgICAgICB0aGlzLnNlcnZlci5saXN0ZW4oeyBob3N0LCBwb3J0IH0sICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuZW5kUG9pbnRzLmZvckVhY2goKGVuZFBvaW50OiBFbmRQb2ludCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMubG9nLmRlYnVnKCdHUkFQSFFMJywgYGh0dHA6Ly8ke2hvc3R9OiR7cG9ydH0ke2VuZFBvaW50LnBhdGh9YCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG5cbiAgICBhZGRFbmRQb2ludChlbmRQb2ludDogRW5kUG9pbnQpIHtcbiAgICAgICAgY29uc3QgdHlwZURlZnMgPSBlbmRQb2ludC50eXBlRGVmRmlsZU5hbWVzXG4gICAgICAgICAgICAubWFwKHggPT4gZnMucmVhZEZpbGVTeW5jKHgsICd1dGYtOCcpKVxuICAgICAgICAgICAgLmpvaW4oJ1xcbicpO1xuICAgICAgICBjb25zdCBhcG9sbG8gPSBuZXcgQXBvbGxvU2VydmVyKHtcbiAgICAgICAgICAgIHR5cGVEZWZzLFxuICAgICAgICAgICAgcmVzb2x2ZXJzOiBlbmRQb2ludC5yZXNvbHZlcnMsXG4gICAgICAgICAgICBjb250ZXh0OiAoeyByZXEgfSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIGRiOiB0aGlzLmRiLFxuICAgICAgICAgICAgICAgICAgICBjb25maWc6IHRoaXMuY29uZmlnLFxuICAgICAgICAgICAgICAgICAgICBzaGFyZWQ6IHRoaXMuc2hhcmVkLFxuICAgICAgICAgICAgICAgICAgICAuLi5lbmRQb2ludC5leHRyYUNvbnRleHQocmVxKSxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSk7XG4gICAgICAgIGFwb2xsby5hcHBseU1pZGRsZXdhcmUoeyBhcHA6IHRoaXMuYXBwLCBwYXRoOiBlbmRQb2ludC5wYXRoIH0pO1xuICAgICAgICBpZiAoZW5kUG9pbnQuc3VwcG9ydFN1YnNjcmlwdGlvbnMpIHtcbiAgICAgICAgICAgIGFwb2xsby5pbnN0YWxsU3Vic2NyaXB0aW9uSGFuZGxlcnModGhpcy5zZXJ2ZXIpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZW5kUG9pbnRzLnB1c2goZW5kUG9pbnQpO1xuICAgIH1cblxuXG59XG5cbiJdfQ==