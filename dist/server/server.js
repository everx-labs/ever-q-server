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

var _opentracing = require("opentracing");

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
    this.tracer = _tracer.QTracer.create(options.config);
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
        return _tracer.QTracer.createContext(_this.tracer, req);
      }
    });
    this.addEndPoint({
      path: '/graphql',
      resolvers: (0, _resolversCustom.attachCustomResolvers)((0, _resolversGenerated.createResolvers)(this.db)),
      typeDefFileNames: ['type-defs-generated.graphql', 'type-defs-custom.graphql'],
      supportSubscriptions: true,
      extraContext: function extraContext(req) {
        return _tracer.QTracer.createContext(_this.tracer, req);
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
          var remoteAddress = req.socket && req.socket.remoteAddress || '';
          return _objectSpread({
            db: _this3.db,
            config: _this3.config,
            shared: _this3.shared,
            remoteAddress: remoteAddress
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9zZXJ2ZXIuanMiXSwibmFtZXMiOlsiVE9OUVNlcnZlciIsIm9wdGlvbnMiLCJjb25maWciLCJsb2dzIiwibG9nIiwiY3JlYXRlIiwic2hhcmVkIiwiTWFwIiwidHJhY2VyIiwiUVRyYWNlciIsImVuZFBvaW50cyIsImFwcCIsInNlcnZlciIsImh0dHAiLCJjcmVhdGVTZXJ2ZXIiLCJkYiIsIkFyYW5nbyIsImFkZEVuZFBvaW50IiwicGF0aCIsInJlc29sdmVycyIsInJlc29sdmVyc01hbSIsInR5cGVEZWZGaWxlTmFtZXMiLCJzdXBwb3J0U3Vic2NyaXB0aW9ucyIsImV4dHJhQ29udGV4dCIsInJlcSIsImNyZWF0ZUNvbnRleHQiLCJzdGFydCIsImhvc3QiLCJwb3J0IiwibGlzdGVuIiwiZm9yRWFjaCIsImVuZFBvaW50IiwiZGVidWciLCJ0eXBlRGVmcyIsIm1hcCIsIngiLCJmcyIsInJlYWRGaWxlU3luYyIsImpvaW4iLCJhcG9sbG8iLCJBcG9sbG9TZXJ2ZXIiLCJjb250ZXh0IiwiY29ubmVjdGlvbiIsInJlbW90ZUFkZHJlc3MiLCJzb2NrZXQiLCJhcHBseU1pZGRsZXdhcmUiLCJpbnN0YWxsU3Vic2NyaXB0aW9uSGFuZGxlcnMiLCJwdXNoIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBaUJBOztBQUNBOztBQUNBOztBQUVBOztBQUVBOztBQUVBOztBQUNBOztBQUNBOztBQUdBOztBQUVBOztBQUNBOzs7Ozs7SUFlcUJBLFU7OztBQVlqQixzQkFBWUMsT0FBWixFQUErQjtBQUFBOztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQzNCLFNBQUtDLE1BQUwsR0FBY0QsT0FBTyxDQUFDQyxNQUF0QjtBQUNBLFNBQUtDLElBQUwsR0FBWUYsT0FBTyxDQUFDRSxJQUFwQjtBQUNBLFNBQUtDLEdBQUwsR0FBVyxLQUFLRCxJQUFMLENBQVVFLE1BQVYsQ0FBaUIsUUFBakIs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QUUsRUFBRSxNQUFJLENBQUNBLEVBRGI7QUFFSWIsWUFBQUEsTUFBTSxFQUFFLE1BQUksQ0FBQ0EsTUFGakI7QUFHSUksWUFBQUEsTUFBTSxFQUFFLE1BQUksQ0FBQ0EsTUFIakI7QUFJSXFDLFlBQUFBLGFBQWEsRUFBYkE7QUFKSixhQUtPWixRQUFRLENBQUNSLFlBQVQsQ0FBc0JtQixVQUFVLEdBQUdBLFVBQUgsR0FBZ0JsQixHQUFoRCxDQUxQO0FBT0g7QUFaMkIsT0FBakIsQ0FBZjtBQWNBZSxNQUFBQSxNQUFNLENBQUNNLGVBQVAsQ0FBdUI7QUFBRWxDLFFBQUFBLEdBQUcsRUFBRSxLQUFLQSxHQUFaO0FBQWlCTyxRQUFBQSxJQUFJLEVBQUVhLFFBQVEsQ0FBQ2I7QUFBaEMsT0FBdkI7O0FBQ0EsVUFBSWEsUUFBUSxDQUFDVCxvQkFBYixFQUFtQztBQUMvQmlCLFFBQUFBLE1BQU0sQ0FBQ08sMkJBQVAsQ0FBbUMsS0FBS2xDLE1BQXhDO0FBQ0g7O0FBQ0QsV0FBS0YsU0FBTCxDQUFlcUMsSUFBZixDQUFvQmhCLFFBQXBCO0FBQ0giLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IDIwMTgtMjAyMCBUT04gREVWIFNPTFVUSU9OUyBMVEQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIFNPRlRXQVJFIEVWQUxVQVRJT04gTGljZW5zZSAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlXG4gKiB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGVcbiAqIExpY2Vuc2UgYXQ6XG4gKlxuICogaHR0cDovL3d3dy50b24uZGV2L2xpY2Vuc2VzXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBUT04gREVWIHNvZnR3YXJlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8vIEBmbG93XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IGV4cHJlc3MgZnJvbSAnZXhwcmVzcyc7XG5pbXBvcnQgaHR0cCBmcm9tICdodHRwJztcblxuaW1wb3J0IHsgQXBvbGxvU2VydmVyIH0gZnJvbSAnYXBvbGxvLXNlcnZlci1leHByZXNzJztcblxuaW1wb3J0IEFyYW5nbyBmcm9tICcuL2FyYW5nbyc7XG5cbmltcG9ydCB7IGNyZWF0ZVJlc29sdmVycyB9IGZyb20gJy4vcmVzb2x2ZXJzLWdlbmVyYXRlZCc7XG5pbXBvcnQgeyBhdHRhY2hDdXN0b21SZXNvbHZlcnMgfSBmcm9tIFwiLi9yZXNvbHZlcnMtY3VzdG9tXCI7XG5pbXBvcnQgeyByZXNvbHZlcnNNYW0gfSBmcm9tIFwiLi9yZXNvbHZlcnMtbWFtXCI7XG5cbmltcG9ydCB0eXBlIHsgUUNvbmZpZyB9IGZyb20gJy4vY29uZmlnJztcbmltcG9ydCBRTG9ncyBmcm9tICcuL2xvZ3MnO1xuaW1wb3J0IHR5cGUgeyBRTG9nIH0gZnJvbSAnLi9sb2dzJztcbmltcG9ydCB7IFFUcmFjZXIgfSBmcm9tIFwiLi90cmFjZXJcIjtcbmltcG9ydCB7IFRyYWNlciB9IGZyb20gXCJvcGVudHJhY2luZ1wiO1xuXG50eXBlIFFPcHRpb25zID0ge1xuICAgIGNvbmZpZzogUUNvbmZpZyxcbiAgICBsb2dzOiBRTG9ncyxcbn1cblxudHlwZSBFbmRQb2ludCA9IHtcbiAgICBwYXRoOiBzdHJpbmcsXG4gICAgcmVzb2x2ZXJzOiBhbnksXG4gICAgdHlwZURlZkZpbGVOYW1lczogc3RyaW5nW10sXG4gICAgc3VwcG9ydFN1YnNjcmlwdGlvbnM6IGJvb2xlYW4sXG4gICAgZXh0cmFDb250ZXh0OiAocmVxOiBleHByZXNzLlJlcXVlc3QpID0+IGFueSxcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVE9OUVNlcnZlciB7XG4gICAgY29uZmlnOiBRQ29uZmlnO1xuICAgIGxvZ3M6IFFMb2dzO1xuICAgIGxvZzogUUxvZztcbiAgICBhcHA6IGV4cHJlc3MuQXBwbGljYXRpb247XG4gICAgc2VydmVyOiBhbnk7XG4gICAgZW5kUG9pbnRzOiBFbmRQb2ludFtdO1xuICAgIGRiOiBBcmFuZ287XG4gICAgdHJhY2VyOiBUcmFjZXI7XG4gICAgc2hhcmVkOiBNYXA8c3RyaW5nLCBhbnk+O1xuXG5cbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zOiBRT3B0aW9ucykge1xuICAgICAgICB0aGlzLmNvbmZpZyA9IG9wdGlvbnMuY29uZmlnO1xuICAgICAgICB0aGlzLmxvZ3MgPSBvcHRpb25zLmxvZ3M7XG4gICAgICAgIHRoaXMubG9nID0gdGhpcy5sb2dzLmNyZWF0ZSgnc2VydmVyJyk7XG4gICAgICAgIHRoaXMuc2hhcmVkID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLnRyYWNlciA9IFFUcmFjZXIuY3JlYXRlKG9wdGlvbnMuY29uZmlnKTtcbiAgICAgICAgdGhpcy5lbmRQb2ludHMgPSBbXTtcbiAgICAgICAgdGhpcy5hcHAgPSBleHByZXNzKCk7XG4gICAgICAgIHRoaXMuc2VydmVyID0gaHR0cC5jcmVhdGVTZXJ2ZXIodGhpcy5hcHApO1xuICAgICAgICB0aGlzLmRiID0gbmV3IEFyYW5nbyh0aGlzLmNvbmZpZywgdGhpcy5sb2dzLCB0aGlzLnRyYWNlcik7XG4gICAgICAgIHRoaXMuYWRkRW5kUG9pbnQoe1xuICAgICAgICAgICAgcGF0aDogJy9ncmFwaHFsL21hbScsXG4gICAgICAgICAgICByZXNvbHZlcnM6IHJlc29sdmVyc01hbSxcbiAgICAgICAgICAgIHR5cGVEZWZGaWxlTmFtZXM6IFsndHlwZS1kZWZzLW1hbS5ncmFwaHFsJ10sXG4gICAgICAgICAgICBzdXBwb3J0U3Vic2NyaXB0aW9uczogZmFsc2UsXG4gICAgICAgICAgICBleHRyYUNvbnRleHQ6IChyZXEpID0+IFFUcmFjZXIuY3JlYXRlQ29udGV4dCh0aGlzLnRyYWNlciwgcmVxKSxcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuYWRkRW5kUG9pbnQoe1xuICAgICAgICAgICAgcGF0aDogJy9ncmFwaHFsJyxcbiAgICAgICAgICAgIHJlc29sdmVyczogYXR0YWNoQ3VzdG9tUmVzb2x2ZXJzKGNyZWF0ZVJlc29sdmVycyh0aGlzLmRiKSksXG4gICAgICAgICAgICB0eXBlRGVmRmlsZU5hbWVzOiBbJ3R5cGUtZGVmcy1nZW5lcmF0ZWQuZ3JhcGhxbCcsICd0eXBlLWRlZnMtY3VzdG9tLmdyYXBocWwnXSxcbiAgICAgICAgICAgIHN1cHBvcnRTdWJzY3JpcHRpb25zOiB0cnVlLFxuICAgICAgICAgICAgZXh0cmFDb250ZXh0OiAocmVxKSA9PiBRVHJhY2VyLmNyZWF0ZUNvbnRleHQodGhpcy50cmFjZXIsIHJlcSlcbiAgICAgICAgfSk7XG4gICAgfVxuXG5cbiAgICBhc3luYyBzdGFydCgpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5kYi5zdGFydCgpO1xuICAgICAgICBjb25zdCB7IGhvc3QsIHBvcnQgfSA9IHRoaXMuY29uZmlnLnNlcnZlcjtcbiAgICAgICAgdGhpcy5zZXJ2ZXIubGlzdGVuKHsgaG9zdCwgcG9ydCB9LCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmVuZFBvaW50cy5mb3JFYWNoKChlbmRQb2ludDogRW5kUG9pbnQpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmxvZy5kZWJ1ZygnR1JBUEhRTCcsIGBodHRwOi8vJHtob3N0fToke3BvcnR9JHtlbmRQb2ludC5wYXRofWApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuXG4gICAgYWRkRW5kUG9pbnQoZW5kUG9pbnQ6IEVuZFBvaW50KSB7XG4gICAgICAgIGNvbnN0IHR5cGVEZWZzID0gZW5kUG9pbnQudHlwZURlZkZpbGVOYW1lc1xuICAgICAgICAgICAgLm1hcCh4ID0+IGZzLnJlYWRGaWxlU3luYyh4LCAndXRmLTgnKSlcbiAgICAgICAgICAgIC5qb2luKCdcXG4nKTtcbiAgICAgICAgY29uc3QgYXBvbGxvID0gbmV3IEFwb2xsb1NlcnZlcih7XG4gICAgICAgICAgICB0eXBlRGVmcyxcbiAgICAgICAgICAgIHJlc29sdmVyczogZW5kUG9pbnQucmVzb2x2ZXJzLFxuICAgICAgICAgICAgY29udGV4dDogKHsgcmVxLCBjb25uZWN0aW9uIH0pID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCByZW1vdGVBZGRyZXNzID0gKHJlcS5zb2NrZXQgJiYgcmVxLnNvY2tldC5yZW1vdGVBZGRyZXNzKSB8fCAnJztcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBkYjogdGhpcy5kYixcbiAgICAgICAgICAgICAgICAgICAgY29uZmlnOiB0aGlzLmNvbmZpZyxcbiAgICAgICAgICAgICAgICAgICAgc2hhcmVkOiB0aGlzLnNoYXJlZCxcbiAgICAgICAgICAgICAgICAgICAgcmVtb3RlQWRkcmVzcyxcbiAgICAgICAgICAgICAgICAgICAgLi4uZW5kUG9pbnQuZXh0cmFDb250ZXh0KGNvbm5lY3Rpb24gPyBjb25uZWN0aW9uIDogcmVxKSxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSk7XG4gICAgICAgIGFwb2xsby5hcHBseU1pZGRsZXdhcmUoeyBhcHA6IHRoaXMuYXBwLCBwYXRoOiBlbmRQb2ludC5wYXRoIH0pO1xuICAgICAgICBpZiAoZW5kUG9pbnQuc3VwcG9ydFN1YnNjcmlwdGlvbnMpIHtcbiAgICAgICAgICAgIGFwb2xsby5pbnN0YWxsU3Vic2NyaXB0aW9uSGFuZGxlcnModGhpcy5zZXJ2ZXIpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZW5kUG9pbnRzLnB1c2goZW5kUG9pbnQpO1xuICAgIH1cblxuXG59XG5cbiJdfQ==