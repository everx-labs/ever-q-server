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
      extraContext: function extraContext(req) {
        return _this.tracer.getContext(req);
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
          var req = _ref.req,
              connection = _ref.connection;
          return _objectSpread({
            db: _this3.db,
            config: _this3.config,
            shared: _this3.shared
          }, endPoint.extraContext(connection ? connection : req));
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9zZXJ2ZXIuanMiXSwibmFtZXMiOlsiVE9OUVNlcnZlciIsIm9wdGlvbnMiLCJjb25maWciLCJsb2dzIiwibG9nIiwiY3JlYXRlIiwic2hhcmVkIiwiTWFwIiwidHJhY2VyIiwiVHJhY2VyIiwiZW5kUG9pbnRzIiwiYXBwIiwic2VydmVyIiwiaHR0cCIsImNyZWF0ZVNlcnZlciIsImRiIiwiQXJhbmdvIiwiYWRkRW5kUG9pbnQiLCJwYXRoIiwicmVzb2x2ZXJzIiwicmVzb2x2ZXJzTWFtIiwidHlwZURlZkZpbGVOYW1lcyIsInN1cHBvcnRTdWJzY3JpcHRpb25zIiwiZXh0cmFDb250ZXh0IiwicmVxIiwiZ2V0Q29udGV4dCIsInN0YXJ0IiwiaG9zdCIsInBvcnQiLCJsaXN0ZW4iLCJmb3JFYWNoIiwiZW5kUG9pbnQiLCJkZWJ1ZyIsInR5cGVEZWZzIiwibWFwIiwieCIsImZzIiwicmVhZEZpbGVTeW5jIiwiam9pbiIsImFwb2xsbyIsIkFwb2xsb1NlcnZlciIsImNvbnRleHQiLCJjb25uZWN0aW9uIiwiYXBwbHlNaWRkbGV3YXJlIiwiaW5zdGFsbFN1YnNjcmlwdGlvbkhhbmRsZXJzIiwicHVzaCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWlCQTs7QUFDQTs7QUFDQTs7QUFFQTs7QUFFQTs7QUFFQTs7QUFDQTs7QUFDQTs7QUFHQTs7QUFFQTs7Ozs7O0lBZXFCQSxVOzs7QUFZakIsc0JBQVlDLE9BQVosRUFBK0I7QUFBQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUMzQixTQUFLQyxNQUFMLEdBQWNELE9BQU8sQ0FBQ0MsTUFBdEI7QUFDQSxTQUFLQyxJQUFMLEdBQVlGLE9BQU8sQ0FBQ0UsSUFBcEI7QUFDQSxTQUFLQyxHQUFMLEdBQVcsS0FBS0QsSUFBTCxDQUFVRSxNQUFWLENBQWlCLFFBQWpCLENBQVg7QUFDQSxTQUFLQyxNQUFMLEdBQWMsSUFBSUMsR0FB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QUFILEdBQWdCbEIsR0FBaEQsQ0FKUDtBQU1IO0FBVjJCLE9BQWpCLENBQWY7QUFZQWUsTUFBQUEsTUFBTSxDQUFDSSxlQUFQLENBQXVCO0FBQUVoQyxRQUFBQSxHQUFHLEVBQUUsS0FBS0EsR0FBWjtBQUFpQk8sUUFBQUEsSUFBSSxFQUFFYSxRQUFRLENBQUNiO0FBQWhDLE9BQXZCOztBQUNBLFVBQUlhLFFBQVEsQ0FBQ1Qsb0JBQWIsRUFBbUM7QUFDL0JpQixRQUFBQSxNQUFNLENBQUNLLDJCQUFQLENBQW1DLEtBQUtoQyxNQUF4QztBQUNIOztBQUNELFdBQUtGLFNBQUwsQ0FBZW1DLElBQWYsQ0FBb0JkLFFBQXBCO0FBQ0giLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IDIwMTgtMjAyMCBUT04gREVWIFNPTFVUSU9OUyBMVEQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIFNPRlRXQVJFIEVWQUxVQVRJT04gTGljZW5zZSAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlXG4gKiB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGVcbiAqIExpY2Vuc2UgYXQ6XG4gKlxuICogaHR0cDovL3d3dy50b24uZGV2L2xpY2Vuc2VzXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBUT04gREVWIHNvZnR3YXJlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8vIEBmbG93XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IGV4cHJlc3MgZnJvbSAnZXhwcmVzcyc7XG5pbXBvcnQgaHR0cCBmcm9tICdodHRwJztcblxuaW1wb3J0IHsgQXBvbGxvU2VydmVyIH0gZnJvbSAnYXBvbGxvLXNlcnZlci1leHByZXNzJztcblxuaW1wb3J0IEFyYW5nbyBmcm9tICcuL2FyYW5nbyc7XG5cbmltcG9ydCB7IGNyZWF0ZVJlc29sdmVycyB9IGZyb20gJy4vcmVzb2x2ZXJzLWdlbmVyYXRlZCc7XG5pbXBvcnQgeyBhdHRhY2hDdXN0b21SZXNvbHZlcnMgfSBmcm9tIFwiLi9yZXNvbHZlcnMtY3VzdG9tXCI7XG5pbXBvcnQgeyByZXNvbHZlcnNNYW0gfSBmcm9tIFwiLi9yZXNvbHZlcnMtbWFtXCI7XG5cbmltcG9ydCB0eXBlIHsgUUNvbmZpZyB9IGZyb20gJy4vY29uZmlnJztcbmltcG9ydCBRTG9ncyBmcm9tICcuL2xvZ3MnO1xuaW1wb3J0IHR5cGUgeyBRTG9nIH0gZnJvbSAnLi9sb2dzJztcbmltcG9ydCB7IFRyYWNlciB9IGZyb20gXCIuL3RyYWNlclwiO1xuXG50eXBlIFFPcHRpb25zID0ge1xuICAgIGNvbmZpZzogUUNvbmZpZyxcbiAgICBsb2dzOiBRTG9ncyxcbn1cblxudHlwZSBFbmRQb2ludCA9IHtcbiAgICBwYXRoOiBzdHJpbmcsXG4gICAgcmVzb2x2ZXJzOiBhbnksXG4gICAgdHlwZURlZkZpbGVOYW1lczogc3RyaW5nW10sXG4gICAgc3VwcG9ydFN1YnNjcmlwdGlvbnM6IGJvb2xlYW4sXG4gICAgZXh0cmFDb250ZXh0OiAocmVxOiBleHByZXNzLlJlcXVlc3QpID0+IGFueSxcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVE9OUVNlcnZlciB7XG4gICAgY29uZmlnOiBRQ29uZmlnO1xuICAgIGxvZ3M6IFFMb2dzO1xuICAgIGxvZzogUUxvZztcbiAgICBhcHA6IGV4cHJlc3MuQXBwbGljYXRpb247XG4gICAgc2VydmVyOiBhbnk7XG4gICAgZW5kUG9pbnRzOiBFbmRQb2ludFtdO1xuICAgIGRiOiBBcmFuZ287XG4gICAgdHJhY2VyOiBUcmFjZXI7XG4gICAgc2hhcmVkOiBNYXA8c3RyaW5nLCBhbnk+O1xuXG5cbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zOiBRT3B0aW9ucykge1xuICAgICAgICB0aGlzLmNvbmZpZyA9IG9wdGlvbnMuY29uZmlnO1xuICAgICAgICB0aGlzLmxvZ3MgPSBvcHRpb25zLmxvZ3M7XG4gICAgICAgIHRoaXMubG9nID0gdGhpcy5sb2dzLmNyZWF0ZSgnc2VydmVyJyk7XG4gICAgICAgIHRoaXMuc2hhcmVkID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLnRyYWNlciA9IG5ldyBUcmFjZXIob3B0aW9ucy5jb25maWcpO1xuICAgICAgICB0aGlzLmVuZFBvaW50cyA9IFtdO1xuICAgICAgICB0aGlzLmFwcCA9IGV4cHJlc3MoKTtcbiAgICAgICAgdGhpcy5zZXJ2ZXIgPSBodHRwLmNyZWF0ZVNlcnZlcih0aGlzLmFwcCk7XG4gICAgICAgIHRoaXMuZGIgPSBuZXcgQXJhbmdvKHRoaXMuY29uZmlnLCB0aGlzLmxvZ3MsIHRoaXMudHJhY2VyKTtcbiAgICAgICAgdGhpcy5hZGRFbmRQb2ludCh7XG4gICAgICAgICAgICBwYXRoOiAnL2dyYXBocWwvbWFtJyxcbiAgICAgICAgICAgIHJlc29sdmVyczogcmVzb2x2ZXJzTWFtLFxuICAgICAgICAgICAgdHlwZURlZkZpbGVOYW1lczogWyd0eXBlLWRlZnMtbWFtLmdyYXBocWwnXSxcbiAgICAgICAgICAgIHN1cHBvcnRTdWJzY3JpcHRpb25zOiBmYWxzZSxcbiAgICAgICAgICAgIGV4dHJhQ29udGV4dDogKHJlcSkgPT4gdGhpcy50cmFjZXIuZ2V0Q29udGV4dChyZXEpLFxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5hZGRFbmRQb2ludCh7XG4gICAgICAgICAgICBwYXRoOiAnL2dyYXBocWwnLFxuICAgICAgICAgICAgcmVzb2x2ZXJzOiBhdHRhY2hDdXN0b21SZXNvbHZlcnMoY3JlYXRlUmVzb2x2ZXJzKHRoaXMuZGIpKSxcbiAgICAgICAgICAgIHR5cGVEZWZGaWxlTmFtZXM6IFsndHlwZS1kZWZzLWdlbmVyYXRlZC5ncmFwaHFsJywgJ3R5cGUtZGVmcy1jdXN0b20uZ3JhcGhxbCddLFxuICAgICAgICAgICAgc3VwcG9ydFN1YnNjcmlwdGlvbnM6IHRydWUsXG4gICAgICAgICAgICBleHRyYUNvbnRleHQ6IChyZXEpID0+IHRoaXMudHJhY2VyLmdldENvbnRleHQocmVxKVxuICAgICAgICB9KTtcbiAgICB9XG5cblxuICAgIGFzeW5jIHN0YXJ0KCkge1xuICAgICAgICBhd2FpdCB0aGlzLmRiLnN0YXJ0KCk7XG4gICAgICAgIGNvbnN0IHsgaG9zdCwgcG9ydCB9ID0gdGhpcy5jb25maWcuc2VydmVyO1xuICAgICAgICB0aGlzLnNlcnZlci5saXN0ZW4oeyBob3N0LCBwb3J0IH0sICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuZW5kUG9pbnRzLmZvckVhY2goKGVuZFBvaW50OiBFbmRQb2ludCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMubG9nLmRlYnVnKCdHUkFQSFFMJywgYGh0dHA6Ly8ke2hvc3R9OiR7cG9ydH0ke2VuZFBvaW50LnBhdGh9YCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG5cbiAgICBhZGRFbmRQb2ludChlbmRQb2ludDogRW5kUG9pbnQpIHtcbiAgICAgICAgY29uc3QgdHlwZURlZnMgPSBlbmRQb2ludC50eXBlRGVmRmlsZU5hbWVzXG4gICAgICAgICAgICAubWFwKHggPT4gZnMucmVhZEZpbGVTeW5jKHgsICd1dGYtOCcpKVxuICAgICAgICAgICAgLmpvaW4oJ1xcbicpO1xuICAgICAgICBjb25zdCBhcG9sbG8gPSBuZXcgQXBvbGxvU2VydmVyKHtcbiAgICAgICAgICAgIHR5cGVEZWZzLFxuICAgICAgICAgICAgcmVzb2x2ZXJzOiBlbmRQb2ludC5yZXNvbHZlcnMsXG4gICAgICAgICAgICBjb250ZXh0OiAoeyByZXEsIGNvbm5lY3Rpb24gfSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIGRiOiB0aGlzLmRiLFxuICAgICAgICAgICAgICAgICAgICBjb25maWc6IHRoaXMuY29uZmlnLFxuICAgICAgICAgICAgICAgICAgICBzaGFyZWQ6IHRoaXMuc2hhcmVkLFxuICAgICAgICAgICAgICAgICAgICAuLi5lbmRQb2ludC5leHRyYUNvbnRleHQoY29ubmVjdGlvbiA/IGNvbm5lY3Rpb24gOiByZXEpLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9LFxuICAgICAgICB9KTtcbiAgICAgICAgYXBvbGxvLmFwcGx5TWlkZGxld2FyZSh7IGFwcDogdGhpcy5hcHAsIHBhdGg6IGVuZFBvaW50LnBhdGggfSk7XG4gICAgICAgIGlmIChlbmRQb2ludC5zdXBwb3J0U3Vic2NyaXB0aW9ucykge1xuICAgICAgICAgICAgYXBvbGxvLmluc3RhbGxTdWJzY3JpcHRpb25IYW5kbGVycyh0aGlzLnNlcnZlcik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5lbmRQb2ludHMucHVzaChlbmRQb2ludCk7XG4gICAgfVxuXG5cbn1cblxuIl19