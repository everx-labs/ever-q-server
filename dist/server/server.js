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

var _qAuth = _interopRequireDefault(require("./q-auth"));

/*
 * Copyright 2018-2020 TON DEV SOLUTIONS LTD.
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
    (0, _defineProperty2["default"])(this, "app", void 0);
    (0, _defineProperty2["default"])(this, "server", void 0);
    (0, _defineProperty2["default"])(this, "endPoints", void 0);
    (0, _defineProperty2["default"])(this, "db", void 0);
    (0, _defineProperty2["default"])(this, "tracer", void 0);
    (0, _defineProperty2["default"])(this, "auth", void 0);
    (0, _defineProperty2["default"])(this, "shared", void 0);
    this.config = options.config;
    this.logs = options.logs;
    this.log = this.logs.create('server');
    this.shared = new Map();
    this.tracer = _tracer.QTracer.create(options.config);
    this.auth = new _qAuth["default"](options.config);
    this.endPoints = [];
    this.app = (0, _express["default"])();
    this.server = _http["default"].createServer(this.app);
    this.db = new _arango["default"](this.config, this.logs, this.tracer);
    this.addEndPoint({
      path: '/graphql/mam',
      resolvers: _resolversMam.resolversMam,
      typeDefFileNames: ['type-defs-mam.graphql'],
      supportSubscriptions: false
    });
    this.addEndPoint({
      path: '/graphql',
      resolvers: (0, _resolversCustom.attachCustomResolvers)((0, _resolversGenerated.createResolvers)(this.db)),
      typeDefFileNames: ['type-defs-generated.graphql', 'type-defs-custom.graphql'],
      supportSubscriptions: true
    });
  }

  (0, _createClass2["default"])(TONQServer, [{
    key: "start",
    value: function () {
      var _start = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee() {
        var _this = this;

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
                  _this.endPoints.forEach(function (endPoint) {
                    _this.log.debug('GRAPHQL', "http://".concat(host, ":").concat(port).concat(endPoint.path));
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
      var _this2 = this;

      var typeDefs = endPoint.typeDefFileNames.map(function (x) {
        return _fs["default"].readFileSync(x, 'utf-8');
      }).join('\n');
      var apollo = new _apolloServerExpress.ApolloServer({
        typeDefs: typeDefs,
        resolvers: endPoint.resolvers,
        context: function context(_ref) {
          var req = _ref.req,
              connection = _ref.connection;
          return {
            db: _this2.db,
            tracer: _this2.tracer,
            auth: _this2.auth,
            config: _this2.config,
            shared: _this2.shared,
            remoteAddress: req && req.socket && req.socket.remoteAddress || '',
            authToken: _qAuth["default"].extractToken(req),
            parentSpan: _tracer.QTracer.extractParentSpan(_this2.tracer, connection ? connection : req)
          };
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9zZXJ2ZXIuanMiXSwibmFtZXMiOlsiVE9OUVNlcnZlciIsIm9wdGlvbnMiLCJjb25maWciLCJsb2dzIiwibG9nIiwiY3JlYXRlIiwic2hhcmVkIiwiTWFwIiwidHJhY2VyIiwiUVRyYWNlciIsImF1dGgiLCJRQXV0aCIsImVuZFBvaW50cyIsImFwcCIsInNlcnZlciIsImh0dHAiLCJjcmVhdGVTZXJ2ZXIiLCJkYiIsIkFyYW5nbyIsImFkZEVuZFBvaW50IiwicGF0aCIsInJlc29sdmVycyIsInJlc29sdmVyc01hbSIsInR5cGVEZWZGaWxlTmFtZXMiLCJzdXBwb3J0U3Vic2NyaXB0aW9ucyIsInN0YXJ0IiwiaG9zdCIsInBvcnQiLCJsaXN0ZW4iLCJmb3JFYWNoIiwiZW5kUG9pbnQiLCJkZWJ1ZyIsInR5cGVEZWZzIiwibWFwIiwieCIsImZzIiwicmVhZEZpbGVTeW5jIiwiam9pbiIsImFwb2xsbyIsIkFwb2xsb1NlcnZlciIsImNvbnRleHQiLCJyZXEiLCJjb25uZWN0aW9uIiwicmVtb3RlQWRkcmVzcyIsInNvY2tldCIsImF1dGhUb2tlbiIsImV4dHJhY3RUb2tlbiIsInBhcmVudFNwYW4iLCJleHRyYWN0UGFyZW50U3BhbiIsImFwcGx5TWlkZGxld2FyZSIsImluc3RhbGxTdWJzY3JpcHRpb25IYW5kbGVycyIsInB1c2giXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFpQkE7O0FBQ0E7O0FBQ0E7O0FBRUE7O0FBRUE7O0FBRUE7O0FBQ0E7O0FBQ0E7O0FBR0E7O0FBRUE7O0FBQ0E7O0FBQ0E7O0FBbENBOzs7Ozs7Ozs7Ozs7Ozs7SUFnRHFCQSxVOzs7QUFhakIsc0JBQVlDLE9BQVosRUFBK0I7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQzNCLFNBQUtDLE1BQUwsR0FBY0QsT0FBTyxDQUFDQyxNQUF0QjtBQUNBLFNBQUtDLElBQUwsR0FBWUYsT0FBTyxD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QyxZQUFBQSxhQUFhLEVBQUdGLEdBQUcsSUFBSUEsR0FBRyxDQUFDRyxNQUFYLElBQXFCSCxHQUFHLENBQUNHLE1BQUosQ0FBV0QsYUFBakMsSUFBbUQsRUFOL0Q7QUFPSEUsWUFBQUEsU0FBUyxFQUFFbEMsa0JBQU1tQyxZQUFOLENBQW1CTCxHQUFuQixDQVBSO0FBUUhNLFlBQUFBLFVBQVUsRUFBRXRDLGdCQUFRdUMsaUJBQVIsQ0FBMEIsTUFBSSxDQUFDeEMsTUFBL0IsRUFBdUNrQyxVQUFVLEdBQUdBLFVBQUgsR0FBZ0JELEdBQWpFO0FBUlQsV0FBUDtBQVVIO0FBZDJCLE9BQWpCLENBQWY7QUFnQkFILE1BQUFBLE1BQU0sQ0FBQ1csZUFBUCxDQUF1QjtBQUFFcEMsUUFBQUEsR0FBRyxFQUFFLEtBQUtBLEdBQVo7QUFBaUJPLFFBQUFBLElBQUksRUFBRVUsUUFBUSxDQUFDVjtBQUFoQyxPQUF2Qjs7QUFDQSxVQUFJVSxRQUFRLENBQUNOLG9CQUFiLEVBQW1DO0FBQy9CYyxRQUFBQSxNQUFNLENBQUNZLDJCQUFQLENBQW1DLEtBQUtwQyxNQUF4QztBQUNIOztBQUNELFdBQUtGLFNBQUwsQ0FBZXVDLElBQWYsQ0FBb0JyQixRQUFwQjtBQUNIIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE4LTIwMjAgVE9OIERFViBTT0xVVElPTlMgTFRELlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBTT0ZUV0FSRSBFVkFMVUFUSU9OIExpY2Vuc2UgKHRoZSBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZVxuICogdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlXG4gKiBMaWNlbnNlIGF0OlxuICpcbiAqIGh0dHA6Ly93d3cudG9uLmRldi9saWNlbnNlc1xuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgVE9OIERFViBzb2Z0d2FyZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vLyBAZmxvd1xuaW1wb3J0IGZzIGZyb20gJ2ZzJztcbmltcG9ydCBleHByZXNzIGZyb20gJ2V4cHJlc3MnO1xuaW1wb3J0IGh0dHAgZnJvbSAnaHR0cCc7XG5cbmltcG9ydCB7IEFwb2xsb1NlcnZlciB9IGZyb20gJ2Fwb2xsby1zZXJ2ZXItZXhwcmVzcyc7XG5cbmltcG9ydCBBcmFuZ28gZnJvbSAnLi9hcmFuZ28nO1xuXG5pbXBvcnQgeyBjcmVhdGVSZXNvbHZlcnMgfSBmcm9tICcuL3Jlc29sdmVycy1nZW5lcmF0ZWQnO1xuaW1wb3J0IHsgYXR0YWNoQ3VzdG9tUmVzb2x2ZXJzIH0gZnJvbSBcIi4vcmVzb2x2ZXJzLWN1c3RvbVwiO1xuaW1wb3J0IHsgcmVzb2x2ZXJzTWFtIH0gZnJvbSBcIi4vcmVzb2x2ZXJzLW1hbVwiO1xuXG5pbXBvcnQgdHlwZSB7IFFDb25maWcgfSBmcm9tICcuL2NvbmZpZyc7XG5pbXBvcnQgUUxvZ3MgZnJvbSAnLi9sb2dzJztcbmltcG9ydCB0eXBlIHsgUUxvZyB9IGZyb20gJy4vbG9ncyc7XG5pbXBvcnQgeyBRVHJhY2VyIH0gZnJvbSBcIi4vdHJhY2VyXCI7XG5pbXBvcnQgeyBUcmFjZXIgfSBmcm9tIFwib3BlbnRyYWNpbmdcIjtcbmltcG9ydCBRQXV0aCBmcm9tICcuL3EtYXV0aCc7XG5cbnR5cGUgUU9wdGlvbnMgPSB7XG4gICAgY29uZmlnOiBRQ29uZmlnLFxuICAgIGxvZ3M6IFFMb2dzLFxufVxuXG50eXBlIEVuZFBvaW50ID0ge1xuICAgIHBhdGg6IHN0cmluZyxcbiAgICByZXNvbHZlcnM6IGFueSxcbiAgICB0eXBlRGVmRmlsZU5hbWVzOiBzdHJpbmdbXSxcbiAgICBzdXBwb3J0U3Vic2NyaXB0aW9uczogYm9vbGVhbixcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVE9OUVNlcnZlciB7XG4gICAgY29uZmlnOiBRQ29uZmlnO1xuICAgIGxvZ3M6IFFMb2dzO1xuICAgIGxvZzogUUxvZztcbiAgICBhcHA6IGV4cHJlc3MuQXBwbGljYXRpb247XG4gICAgc2VydmVyOiBhbnk7XG4gICAgZW5kUG9pbnRzOiBFbmRQb2ludFtdO1xuICAgIGRiOiBBcmFuZ287XG4gICAgdHJhY2VyOiBUcmFjZXI7XG4gICAgYXV0aDogUUF1dGg7XG4gICAgc2hhcmVkOiBNYXA8c3RyaW5nLCBhbnk+O1xuXG5cbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zOiBRT3B0aW9ucykge1xuICAgICAgICB0aGlzLmNvbmZpZyA9IG9wdGlvbnMuY29uZmlnO1xuICAgICAgICB0aGlzLmxvZ3MgPSBvcHRpb25zLmxvZ3M7XG4gICAgICAgIHRoaXMubG9nID0gdGhpcy5sb2dzLmNyZWF0ZSgnc2VydmVyJyk7XG4gICAgICAgIHRoaXMuc2hhcmVkID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLnRyYWNlciA9IFFUcmFjZXIuY3JlYXRlKG9wdGlvbnMuY29uZmlnKTtcbiAgICAgICAgdGhpcy5hdXRoID0gbmV3IFFBdXRoKG9wdGlvbnMuY29uZmlnKTtcbiAgICAgICAgdGhpcy5lbmRQb2ludHMgPSBbXTtcbiAgICAgICAgdGhpcy5hcHAgPSBleHByZXNzKCk7XG4gICAgICAgIHRoaXMuc2VydmVyID0gaHR0cC5jcmVhdGVTZXJ2ZXIodGhpcy5hcHApO1xuICAgICAgICB0aGlzLmRiID0gbmV3IEFyYW5nbyh0aGlzLmNvbmZpZywgdGhpcy5sb2dzLCB0aGlzLnRyYWNlcik7XG4gICAgICAgIHRoaXMuYWRkRW5kUG9pbnQoe1xuICAgICAgICAgICAgcGF0aDogJy9ncmFwaHFsL21hbScsXG4gICAgICAgICAgICByZXNvbHZlcnM6IHJlc29sdmVyc01hbSxcbiAgICAgICAgICAgIHR5cGVEZWZGaWxlTmFtZXM6IFsndHlwZS1kZWZzLW1hbS5ncmFwaHFsJ10sXG4gICAgICAgICAgICBzdXBwb3J0U3Vic2NyaXB0aW9uczogZmFsc2UsXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmFkZEVuZFBvaW50KHtcbiAgICAgICAgICAgIHBhdGg6ICcvZ3JhcGhxbCcsXG4gICAgICAgICAgICByZXNvbHZlcnM6IGF0dGFjaEN1c3RvbVJlc29sdmVycyhjcmVhdGVSZXNvbHZlcnModGhpcy5kYikpLFxuICAgICAgICAgICAgdHlwZURlZkZpbGVOYW1lczogWyd0eXBlLWRlZnMtZ2VuZXJhdGVkLmdyYXBocWwnLCAndHlwZS1kZWZzLWN1c3RvbS5ncmFwaHFsJ10sXG4gICAgICAgICAgICBzdXBwb3J0U3Vic2NyaXB0aW9uczogdHJ1ZSxcbiAgICAgICAgfSk7XG4gICAgfVxuXG5cbiAgICBhc3luYyBzdGFydCgpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5kYi5zdGFydCgpO1xuICAgICAgICBjb25zdCB7IGhvc3QsIHBvcnQgfSA9IHRoaXMuY29uZmlnLnNlcnZlcjtcbiAgICAgICAgdGhpcy5zZXJ2ZXIubGlzdGVuKHsgaG9zdCwgcG9ydCB9LCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmVuZFBvaW50cy5mb3JFYWNoKChlbmRQb2ludDogRW5kUG9pbnQpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmxvZy5kZWJ1ZygnR1JBUEhRTCcsIGBodHRwOi8vJHtob3N0fToke3BvcnR9JHtlbmRQb2ludC5wYXRofWApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuXG4gICAgYWRkRW5kUG9pbnQoZW5kUG9pbnQ6IEVuZFBvaW50KSB7XG4gICAgICAgIGNvbnN0IHR5cGVEZWZzID0gZW5kUG9pbnQudHlwZURlZkZpbGVOYW1lc1xuICAgICAgICAgICAgLm1hcCh4ID0+IGZzLnJlYWRGaWxlU3luYyh4LCAndXRmLTgnKSlcbiAgICAgICAgICAgIC5qb2luKCdcXG4nKTtcbiAgICAgICAgY29uc3QgYXBvbGxvID0gbmV3IEFwb2xsb1NlcnZlcih7XG4gICAgICAgICAgICB0eXBlRGVmcyxcbiAgICAgICAgICAgIHJlc29sdmVyczogZW5kUG9pbnQucmVzb2x2ZXJzLFxuICAgICAgICAgICAgY29udGV4dDogKHsgcmVxLCBjb25uZWN0aW9uIH0pID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBkYjogdGhpcy5kYixcbiAgICAgICAgICAgICAgICAgICAgdHJhY2VyOiB0aGlzLnRyYWNlcixcbiAgICAgICAgICAgICAgICAgICAgYXV0aDogdGhpcy5hdXRoLFxuICAgICAgICAgICAgICAgICAgICBjb25maWc6IHRoaXMuY29uZmlnLFxuICAgICAgICAgICAgICAgICAgICBzaGFyZWQ6IHRoaXMuc2hhcmVkLFxuICAgICAgICAgICAgICAgICAgICByZW1vdGVBZGRyZXNzOiAocmVxICYmIHJlcS5zb2NrZXQgJiYgcmVxLnNvY2tldC5yZW1vdGVBZGRyZXNzKSB8fCAnJyxcbiAgICAgICAgICAgICAgICAgICAgYXV0aFRva2VuOiBRQXV0aC5leHRyYWN0VG9rZW4ocmVxKSxcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50U3BhbjogUVRyYWNlci5leHRyYWN0UGFyZW50U3Bhbih0aGlzLnRyYWNlciwgY29ubmVjdGlvbiA/IGNvbm5lY3Rpb24gOiByZXEpLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9LFxuICAgICAgICB9KTtcbiAgICAgICAgYXBvbGxvLmFwcGx5TWlkZGxld2FyZSh7IGFwcDogdGhpcy5hcHAsIHBhdGg6IGVuZFBvaW50LnBhdGggfSk7XG4gICAgICAgIGlmIChlbmRQb2ludC5zdXBwb3J0U3Vic2NyaXB0aW9ucykge1xuICAgICAgICAgICAgYXBvbGxvLmluc3RhbGxTdWJzY3JpcHRpb25IYW5kbGVycyh0aGlzLnNlcnZlcik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5lbmRQb2ludHMucHVzaChlbmRQb2ludCk7XG4gICAgfVxuXG5cbn1cblxuIl19