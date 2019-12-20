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
      extraContext: function extraContext() {
        return {};
      }
    });
    this.addEndPoint({
      path: '/graphql',
      resolvers: (0, _resolversCustom.attachCustomResolvers)((0, _resolversGenerated.createResolvers)(this.db)),
      typeDefFileNames: ['type-defs-generated.graphql', 'type-defs-custom.graphql'],
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
      apollo.installSubscriptionHandlers(this.server);
      this.endPoints.push(endPoint);
    }
  }]);
  return TONQServer;
}();

exports["default"] = TONQServer;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9zZXJ2ZXIuanMiXSwibmFtZXMiOlsiVE9OUVNlcnZlciIsIm9wdGlvbnMiLCJjb25maWciLCJsb2dzIiwibG9nIiwiY3JlYXRlIiwic2hhcmVkIiwiTWFwIiwidHJhY2VyIiwiVHJhY2VyIiwiZW5kUG9pbnRzIiwiYXBwIiwic2VydmVyIiwiaHR0cCIsImNyZWF0ZVNlcnZlciIsImRiIiwiQXJhbmdvIiwiYWRkRW5kUG9pbnQiLCJwYXRoIiwicmVzb2x2ZXJzIiwicmVzb2x2ZXJzTWFtIiwidHlwZURlZkZpbGVOYW1lcyIsImV4dHJhQ29udGV4dCIsInJlcSIsImdldENvbnRleHQiLCJzdGFydCIsImhvc3QiLCJwb3J0IiwibGlzdGVuIiwiZm9yRWFjaCIsImVuZFBvaW50IiwiZGVidWciLCJ0eXBlRGVmcyIsIm1hcCIsIngiLCJmcyIsInJlYWRGaWxlU3luYyIsImpvaW4iLCJhcG9sbG8iLCJBcG9sbG9TZXJ2ZXIiLCJjb250ZXh0IiwiYXBwbHlNaWRkbGV3YXJlIiwiaW5zdGFsbFN1YnNjcmlwdGlvbkhhbmRsZXJzIiwicHVzaCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWlCQTs7QUFDQTs7QUFDQTs7QUFFQTs7QUFFQTs7QUFFQTs7QUFDQTs7QUFDQTs7QUFHQTs7QUFFQTs7Ozs7O0lBY3FCQSxVOzs7QUFZakIsc0JBQVlDLE9BQVosRUFBK0I7QUFBQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUMzQixTQUFLQyxNQUFMLEdBQWNELE9BQU8sQ0FBQ0MsTUFBdEI7QUFDQSxTQUFLQyxJQUFMLEdBQVlGLE9BQU8sQ0FBQ0UsSUFBcEI7QUFDQSxTQUFLQyxHQUFMLEdBQVcsS0FBS0QsSUFBTCxDQUFVRSxNQUFWLENBQWlCLFFBQWpCLENBQVg7QUFDQSxTQUFLQyxNQUFMLEdBQWMsSUFBSUMsR0FBSixFQUFkO0FBQ0EsU0FBS0MsTUFBTCxHQUFjLElBQUlDLGNB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LFdBQUtGLFNBQUwsQ0FBZWlDLElBQWYsQ0FBb0JiLFFBQXBCO0FBQ0giLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IDIwMTgtMjAxOSBUT04gREVWIFNPTFVUSU9OUyBMVEQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIFNPRlRXQVJFIEVWQUxVQVRJT04gTGljZW5zZSAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlXG4gKiB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGVcbiAqIExpY2Vuc2UgYXQ6XG4gKlxuICogaHR0cDovL3d3dy50b24uZGV2L2xpY2Vuc2VzXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBUT04gREVWIHNvZnR3YXJlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8vIEBmbG93XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IGV4cHJlc3MgZnJvbSAnZXhwcmVzcyc7XG5pbXBvcnQgaHR0cCBmcm9tICdodHRwJztcblxuaW1wb3J0IHsgQXBvbGxvU2VydmVyIH0gZnJvbSAnYXBvbGxvLXNlcnZlci1leHByZXNzJztcblxuaW1wb3J0IEFyYW5nbyBmcm9tICcuL2FyYW5nbyc7XG5cbmltcG9ydCB7IGNyZWF0ZVJlc29sdmVycyB9IGZyb20gJy4vcmVzb2x2ZXJzLWdlbmVyYXRlZCc7XG5pbXBvcnQgeyBhdHRhY2hDdXN0b21SZXNvbHZlcnMgfSBmcm9tIFwiLi9yZXNvbHZlcnMtY3VzdG9tXCI7XG5pbXBvcnQgeyByZXNvbHZlcnNNYW0gfSBmcm9tIFwiLi9yZXNvbHZlcnMtbWFtXCI7XG5cbmltcG9ydCB0eXBlIHsgUUNvbmZpZyB9IGZyb20gJy4vY29uZmlnJztcbmltcG9ydCBRTG9ncyBmcm9tICcuL2xvZ3MnO1xuaW1wb3J0IHR5cGUgeyBRTG9nIH0gZnJvbSAnLi9sb2dzJztcbmltcG9ydCB7IFRyYWNlciB9IGZyb20gXCIuL3RyYWNlclwiO1xuXG50eXBlIFFPcHRpb25zID0ge1xuICAgIGNvbmZpZzogUUNvbmZpZyxcbiAgICBsb2dzOiBRTG9ncyxcbn1cblxudHlwZSBFbmRQb2ludCA9IHtcbiAgICBwYXRoOiBzdHJpbmcsXG4gICAgcmVzb2x2ZXJzOiBhbnksXG4gICAgdHlwZURlZkZpbGVOYW1lczogc3RyaW5nW10sXG4gICAgZXh0cmFDb250ZXh0OiAocmVxOiBleHByZXNzLlJlcXVlc3QpID0+IGFueSxcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVE9OUVNlcnZlciB7XG4gICAgY29uZmlnOiBRQ29uZmlnO1xuICAgIGxvZ3M6IFFMb2dzO1xuICAgIGxvZzogUUxvZztcbiAgICBhcHA6IGV4cHJlc3MuQXBwbGljYXRpb247XG4gICAgc2VydmVyOiBhbnk7XG4gICAgZW5kUG9pbnRzOiBFbmRQb2ludFtdO1xuICAgIGRiOiBBcmFuZ287XG4gICAgdHJhY2VyOiBUcmFjZXI7XG4gICAgc2hhcmVkOiBNYXA8c3RyaW5nLCBhbnk+O1xuXG5cbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zOiBRT3B0aW9ucykge1xuICAgICAgICB0aGlzLmNvbmZpZyA9IG9wdGlvbnMuY29uZmlnO1xuICAgICAgICB0aGlzLmxvZ3MgPSBvcHRpb25zLmxvZ3M7XG4gICAgICAgIHRoaXMubG9nID0gdGhpcy5sb2dzLmNyZWF0ZSgnc2VydmVyJyk7XG4gICAgICAgIHRoaXMuc2hhcmVkID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLnRyYWNlciA9IG5ldyBUcmFjZXIob3B0aW9ucy5jb25maWcpO1xuICAgICAgICB0aGlzLmVuZFBvaW50cyA9IFtdO1xuICAgICAgICB0aGlzLmFwcCA9IGV4cHJlc3MoKTtcbiAgICAgICAgdGhpcy5zZXJ2ZXIgPSBodHRwLmNyZWF0ZVNlcnZlcih0aGlzLmFwcCk7XG4gICAgICAgIHRoaXMuZGIgPSBuZXcgQXJhbmdvKHRoaXMuY29uZmlnLCB0aGlzLmxvZ3MsIHRoaXMudHJhY2VyKTtcbiAgICAgICAgdGhpcy5hZGRFbmRQb2ludCh7XG4gICAgICAgICAgICBwYXRoOiAnL2dyYXBocWwvbWFtJyxcbiAgICAgICAgICAgIHJlc29sdmVyczogcmVzb2x2ZXJzTWFtLFxuICAgICAgICAgICAgdHlwZURlZkZpbGVOYW1lczogWyd0eXBlLWRlZnMtbWFtLmdyYXBocWwnXSxcbiAgICAgICAgICAgIGV4dHJhQ29udGV4dDogKCkgPT4gKHt9KSxcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuYWRkRW5kUG9pbnQoe1xuICAgICAgICAgICAgcGF0aDogJy9ncmFwaHFsJyxcbiAgICAgICAgICAgIHJlc29sdmVyczogYXR0YWNoQ3VzdG9tUmVzb2x2ZXJzKGNyZWF0ZVJlc29sdmVycyh0aGlzLmRiKSksXG4gICAgICAgICAgICB0eXBlRGVmRmlsZU5hbWVzOiBbJ3R5cGUtZGVmcy1nZW5lcmF0ZWQuZ3JhcGhxbCcsICd0eXBlLWRlZnMtY3VzdG9tLmdyYXBocWwnXSxcbiAgICAgICAgICAgIGV4dHJhQ29udGV4dDogKHJlcSkgPT4gdGhpcy50cmFjZXIuZ2V0Q29udGV4dChyZXEpXG4gICAgICAgIH0pO1xuICAgIH1cblxuXG4gICAgYXN5bmMgc3RhcnQoKSB7XG4gICAgICAgIGF3YWl0IHRoaXMuZGIuc3RhcnQoKTtcbiAgICAgICAgY29uc3QgeyBob3N0LCBwb3J0IH0gPSB0aGlzLmNvbmZpZy5zZXJ2ZXI7XG4gICAgICAgIHRoaXMuc2VydmVyLmxpc3Rlbih7IGhvc3QsIHBvcnQgfSwgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5lbmRQb2ludHMuZm9yRWFjaCgoZW5kUG9pbnQ6IEVuZFBvaW50KSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoJ0dSQVBIUUwnLCBgaHR0cDovLyR7aG9zdH06JHtwb3J0fSR7ZW5kUG9pbnQucGF0aH1gKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cblxuICAgIGFkZEVuZFBvaW50KGVuZFBvaW50OiBFbmRQb2ludCkge1xuICAgICAgICBjb25zdCB0eXBlRGVmcyA9IGVuZFBvaW50LnR5cGVEZWZGaWxlTmFtZXNcbiAgICAgICAgICAgIC5tYXAoeCA9PiBmcy5yZWFkRmlsZVN5bmMoeCwgJ3V0Zi04JykpXG4gICAgICAgICAgICAuam9pbignXFxuJyk7XG4gICAgICAgIGNvbnN0IGFwb2xsbyA9IG5ldyBBcG9sbG9TZXJ2ZXIoe1xuICAgICAgICAgICAgdHlwZURlZnMsXG4gICAgICAgICAgICByZXNvbHZlcnM6IGVuZFBvaW50LnJlc29sdmVycyxcbiAgICAgICAgICAgIGNvbnRleHQ6ICh7IHJlcSB9KSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgZGI6IHRoaXMuZGIsXG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZzogdGhpcy5jb25maWcsXG4gICAgICAgICAgICAgICAgICAgIHNoYXJlZDogdGhpcy5zaGFyZWQsXG4gICAgICAgICAgICAgICAgICAgIC4uLmVuZFBvaW50LmV4dHJhQ29udGV4dChyZXEpLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9LFxuICAgICAgICB9KTtcbiAgICAgICAgYXBvbGxvLmFwcGx5TWlkZGxld2FyZSh7IGFwcDogdGhpcy5hcHAsIHBhdGg6IGVuZFBvaW50LnBhdGggfSk7XG4gICAgICAgIGFwb2xsby5pbnN0YWxsU3Vic2NyaXB0aW9uSGFuZGxlcnModGhpcy5zZXJ2ZXIpO1xuICAgICAgICB0aGlzLmVuZFBvaW50cy5wdXNoKGVuZFBvaW50KTtcbiAgICB9XG5cblxufVxuXG4iXX0=