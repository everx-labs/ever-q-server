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

var _path = _interopRequireDefault(require("path"));

var _nodeFetch = _interopRequireDefault(require("node-fetch"));

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
    var _this = this;

    (0, _classCallCheck2["default"])(this, TONQServer);
    (0, _defineProperty2["default"])(this, "config", void 0);
    (0, _defineProperty2["default"])(this, "logs", void 0);
    (0, _defineProperty2["default"])(this, "log", void 0);
    (0, _defineProperty2["default"])(this, "db", void 0);
    (0, _defineProperty2["default"])(this, "postRequests",
    /*#__PURE__*/
    function () {
      var _ref = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee(parent, args) {
        var requests, config, result, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, _request, url, response, message;

        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                requests = args.requests;

                if (requests) {
                  _context.next = 3;
                  break;
                }

                return _context.abrupt("return", []);

              case 3:
                config = _this.config.requests;
                result = [];
                _iteratorNormalCompletion = true;
                _didIteratorError = false;
                _iteratorError = undefined;
                _context.prev = 8;
                _iterator = requests[Symbol.iterator]();

              case 10:
                if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
                  _context.next = 34;
                  break;
                }

                _request = _step.value;
                _context.prev = 12;
                url = "".concat(config.server, "/topics/").concat(config.topic);
                _context.next = 16;
                return (0, _nodeFetch["default"])(url, {
                  method: 'POST',
                  mode: 'cors',
                  cache: 'no-cache',
                  credentials: 'same-origin',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  redirect: 'follow',
                  referrer: 'no-referrer',
                  body: JSON.stringify({
                    records: [{
                      key: _request.id,
                      value: _request.body
                    }]
                  })
                });

              case 16:
                response = _context.sent;

                if (!(response.status !== 200)) {
                  _context.next = 24;
                  break;
                }

                _context.t0 = "Post request failed: ";
                _context.next = 21;
                return response.text();

              case 21:
                _context.t1 = _context.sent;
                message = _context.t0.concat.call(_context.t0, _context.t1);
                throw new Error(message);

              case 24:
                result.push(_request.id);
                _context.next = 31;
                break;

              case 27:
                _context.prev = 27;
                _context.t2 = _context["catch"](12);
                console.log('[Q Server] post request failed]', _context.t2);
                throw _context.t2;

              case 31:
                _iteratorNormalCompletion = true;
                _context.next = 10;
                break;

              case 34:
                _context.next = 40;
                break;

              case 36:
                _context.prev = 36;
                _context.t3 = _context["catch"](8);
                _didIteratorError = true;
                _iteratorError = _context.t3;

              case 40:
                _context.prev = 40;
                _context.prev = 41;

                if (!_iteratorNormalCompletion && _iterator["return"] != null) {
                  _iterator["return"]();
                }

              case 43:
                _context.prev = 43;

                if (!_didIteratorError) {
                  _context.next = 46;
                  break;
                }

                throw _iteratorError;

              case 46:
                return _context.finish(43);

              case 47:
                return _context.finish(40);

              case 48:
                return _context.abrupt("return", result);

              case 49:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, null, [[8, 36, 40, 48], [12, 27], [41,, 43, 47]]);
      }));

      return function (_x, _x2) {
        return _ref.apply(this, arguments);
      };
    }());
    (0, _defineProperty2["default"])(this, "info",
    /*#__PURE__*/
    (0, _asyncToGenerator2["default"])(
    /*#__PURE__*/
    _regenerator["default"].mark(function _callee2() {
      var pkg;
      return _regenerator["default"].wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              pkg = JSON.parse(_fs["default"].readFileSync(_path["default"].resolve(__dirname, '..', '..', 'package.json')));
              return _context2.abrupt("return", {
                version: pkg.version
              });

            case 2:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2);
    })));
    this.config = options.config;
    this.logs = options.logs;
    this.log = this.logs.create('Q Server');
  }

  (0, _createClass2["default"])(TONQServer, [{
    key: "start",
    value: function () {
      var _start = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee3() {
        var _this2 = this;

        var config, ver, typeDefs, createResolvers, attachCustomResolvers, resolvers, apollo, app, server;
        return _regenerator["default"].wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                config = this.config.server;
                this.db = new _arango["default"](this.config, this.logs);
                ver = this.config.database.version;
                typeDefs = _fs["default"].readFileSync("type-defs.v".concat(ver, ".graphql"), 'utf-8');
                createResolvers = ver === '1' ? _qResolvers.createResolvers : _qResolvers2.createResolvers;
                attachCustomResolvers = ver === '1' ? _customResolvers.attachCustomResolvers : function (x) {
                  return x;
                };
                resolvers = attachCustomResolvers(createResolvers(this.db, this.postRequests, this.info));
                _context3.next = 9;
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

                  _this2.log.debug("Started on ".concat(uri));
                });

              case 15:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9zZXJ2ZXIuanMiXSwibmFtZXMiOlsiVE9OUVNlcnZlciIsIm9wdGlvbnMiLCJwYXJlbnQiLCJhcmdzIiwicmVxdWVzdHMiLCJjb25maWciLCJyZXN1bHQiLCJyZXF1ZXN0IiwidXJsIiwic2VydmVyIiwidG9waWMiLCJtZXRob2QiLCJtb2RlIiwiY2FjaGUiLCJjcmVkZW50aWFscyIsImhlYWRlcnMiLCJyZWRpcmVjdCIsInJlZmVycmVyIiwiYm9keSIsIkpTT04iLCJzdHJpbmdpZnkiLCJyZWNvcmRzIiwia2V5IiwiaWQiLCJ2YWx1ZSIsInJlc3BvbnNlIiwic3RhdHVzIiwidGV4dCIsIm1lc3NhZ2UiLCJFcnJvciIsInB1c2giLCJjb25zb2xlIiwibG9nIiwicGtnIiwicGFyc2UiLCJmcyIsInJlYWRGaWxlU3luYyIsInBhdGgiLCJyZXNvbHZlIiwiX19kaXJuYW1lIiwidmVyc2lvbiIsImxvZ3MiLCJjcmVhdGUiLCJkYiIsIkFyYW5nbyIsInZlciIsImRhdGFiYXNlIiwidHlwZURlZnMiLCJjcmVhdGVSZXNvbHZlcnMiLCJjcmVhdGVSZXNvbHZlcnNWMSIsImNyZWF0ZVJlc29sdmVyc1YyIiwiYXR0YWNoQ3VzdG9tUmVzb2x2ZXJzIiwiYXR0YWNoQ3VzdG9tUmVzb2x2ZXJzVjEiLCJ4IiwicmVzb2x2ZXJzIiwicG9zdFJlcXVlc3RzIiwiaW5mbyIsInN0YXJ0IiwiYXBvbGxvIiwiQXBvbGxvU2VydmVyIiwiYXBwIiwiYXBwbHlNaWRkbGV3YXJlIiwiaHR0cCIsImNyZWF0ZVNlcnZlciIsImluc3RhbGxTdWJzY3JpcHRpb25IYW5kbGVycyIsImxpc3RlbiIsImhvc3QiLCJwb3J0IiwidXJpIiwiZGVidWciXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFpQkE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBRUE7O0FBRUE7O0FBRUE7O0FBQ0E7O0FBQ0E7O0FBR0E7O0FBaENBOzs7Ozs7Ozs7Ozs7Ozs7SUFpRHFC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QUEsSUFBSSxFQUFFO0FBQWIsaUJBQXZCO0FBRU01QixnQkFBQUEsTSxHQUFTcUQsaUJBQUtDLFlBQUwsQ0FBa0JILEdBQWxCLEM7QUFDZkYsZ0JBQUFBLE1BQU0sQ0FBQ00sMkJBQVAsQ0FBbUN2RCxNQUFuQztBQUVBQSxnQkFBQUEsTUFBTSxDQUFDd0QsTUFBUCxDQUFjO0FBQ1ZDLGtCQUFBQSxJQUFJLEVBQUU3RCxNQUFNLENBQUM2RCxJQURIO0FBRVZDLGtCQUFBQSxJQUFJLEVBQUU5RCxNQUFNLENBQUM4RDtBQUZILGlCQUFkLEVBR0csWUFBTTtBQUNMLHNCQUFNQyxHQUFHLG9CQUFhL0QsTUFBTSxDQUFDNkQsSUFBcEIsY0FBNEI3RCxNQUFNLENBQUM4RCxJQUFuQyxhQUFUOztBQUNBLGtCQUFBLE1BQUksQ0FBQ25DLEdBQUwsQ0FBU3FDLEtBQVQsc0JBQTZCRCxHQUE3QjtBQUNILGlCQU5EIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE4LTIwMTkgVE9OIERFViBTT0xVVElPTlMgTFRELlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBTT0ZUV0FSRSBFVkFMVUFUSU9OIExpY2Vuc2UgKHRoZSBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZVxuICogdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlXG4gKiBMaWNlbnNlIGF0OlxuICpcbiAqIGh0dHA6Ly93d3cudG9uLmRldi9saWNlbnNlc1xuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgVE9OIERFViBzb2Z0d2FyZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vLyBAZmxvd1xuaW1wb3J0IGZzIGZyb20gJ2ZzJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IGZldGNoIGZyb20gJ25vZGUtZmV0Y2gnO1xuaW1wb3J0IGV4cHJlc3MgZnJvbSAnZXhwcmVzcyc7XG5pbXBvcnQgaHR0cCBmcm9tICdodHRwJztcblxuaW1wb3J0IHsgQXBvbGxvU2VydmVyIH0gZnJvbSAnYXBvbGxvLXNlcnZlci1leHByZXNzJztcblxuaW1wb3J0IEFyYW5nbyBmcm9tICcuL2FyYW5nbyc7XG5cbmltcG9ydCB7IGNyZWF0ZVJlc29sdmVycyBhcyBjcmVhdGVSZXNvbHZlcnNWMSB9IGZyb20gJy4vcS1yZXNvbHZlcnMudjEnO1xuaW1wb3J0IHsgY3JlYXRlUmVzb2x2ZXJzIGFzIGNyZWF0ZVJlc29sdmVyc1YyIH0gZnJvbSAnLi9xLXJlc29sdmVycy52Mic7XG5pbXBvcnQgeyBhdHRhY2hDdXN0b21SZXNvbHZlcnMgYXMgYXR0YWNoQ3VzdG9tUmVzb2x2ZXJzVjEgfSBmcm9tIFwiLi9jdXN0b20tcmVzb2x2ZXJzLnYxXCI7XG5cbmltcG9ydCB0eXBlIHsgUUNvbmZpZyB9IGZyb20gXCIuL2NvbmZpZ1wiO1xuaW1wb3J0IFFMb2dzIGZyb20gXCIuL2xvZ3NcIjtcbmltcG9ydCB0eXBlIHsgUUxvZyB9IGZyb20gXCIuL2xvZ3NcIjtcblxudHlwZSBRT3B0aW9ucyA9IHtcbiAgICBjb25maWc6IFFDb25maWcsXG4gICAgbG9nczogUUxvZ3MsXG59XG5cbnR5cGUgSW5mbyA9IHtcbiAgICB2ZXJzaW9uOiBzdHJpbmcsXG59XG5cbnR5cGUgUmVxdWVzdCA9IHtcbiAgICBpZDogc3RyaW5nLFxuICAgIGJvZHk6IHN0cmluZyxcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVE9OUVNlcnZlciB7XG4gICAgY29uZmlnOiBRQ29uZmlnO1xuICAgIGxvZ3M6IFFMb2dzO1xuICAgIGxvZzogUUxvZztcbiAgICBkYjogQXJhbmdvO1xuXG4gICAgY29uc3RydWN0b3Iob3B0aW9uczogUU9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5jb25maWcgPSBvcHRpb25zLmNvbmZpZztcbiAgICAgICAgdGhpcy5sb2dzID0gb3B0aW9ucy5sb2dzO1xuICAgICAgICB0aGlzLmxvZyA9IHRoaXMubG9ncy5jcmVhdGUoJ1EgU2VydmVyJyk7XG4gICAgfVxuXG5cbiAgICBhc3luYyBzdGFydCgpIHtcbiAgICAgICAgY29uc3QgY29uZmlnID0gdGhpcy5jb25maWcuc2VydmVyO1xuXG4gICAgICAgIHRoaXMuZGIgPSBuZXcgQXJhbmdvKHRoaXMuY29uZmlnLCB0aGlzLmxvZ3MpO1xuICAgICAgICBjb25zdCB2ZXIgPSB0aGlzLmNvbmZpZy5kYXRhYmFzZS52ZXJzaW9uO1xuICAgICAgICBjb25zdCB0eXBlRGVmcyA9IGZzLnJlYWRGaWxlU3luYyhgdHlwZS1kZWZzLnYke3Zlcn0uZ3JhcGhxbGAsICd1dGYtOCcpO1xuICAgICAgICBjb25zdCBjcmVhdGVSZXNvbHZlcnMgPSB2ZXIgPT09ICcxJyA/IGNyZWF0ZVJlc29sdmVyc1YxIDogY3JlYXRlUmVzb2x2ZXJzVjI7XG4gICAgICAgIGNvbnN0IGF0dGFjaEN1c3RvbVJlc29sdmVycyA9IHZlciA9PT0gJzEnID8gYXR0YWNoQ3VzdG9tUmVzb2x2ZXJzVjEgOiAoeCkgPT4geDtcbiAgICAgICAgY29uc3QgcmVzb2x2ZXJzID0gYXR0YWNoQ3VzdG9tUmVzb2x2ZXJzKGNyZWF0ZVJlc29sdmVycyh0aGlzLmRiLCB0aGlzLnBvc3RSZXF1ZXN0cywgdGhpcy5pbmZvKSk7XG5cbiAgICAgICAgYXdhaXQgdGhpcy5kYi5zdGFydCgpO1xuXG4gICAgICAgIGNvbnN0IGFwb2xsbyA9IG5ldyBBcG9sbG9TZXJ2ZXIoe1xuICAgICAgICAgICAgdHlwZURlZnMsXG4gICAgICAgICAgICByZXNvbHZlcnMsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IGFwcCA9IGV4cHJlc3MoKTtcbiAgICAgICAgYXBvbGxvLmFwcGx5TWlkZGxld2FyZSh7IGFwcCwgcGF0aDogJy9ncmFwaHFsJyB9KTtcblxuICAgICAgICBjb25zdCBzZXJ2ZXIgPSBodHRwLmNyZWF0ZVNlcnZlcihhcHApO1xuICAgICAgICBhcG9sbG8uaW5zdGFsbFN1YnNjcmlwdGlvbkhhbmRsZXJzKHNlcnZlcik7XG5cbiAgICAgICAgc2VydmVyLmxpc3Rlbih7XG4gICAgICAgICAgICBob3N0OiBjb25maWcuaG9zdCxcbiAgICAgICAgICAgIHBvcnQ6IGNvbmZpZy5wb3J0LFxuICAgICAgICB9LCAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCB1cmkgPSBgaHR0cDovLyR7Y29uZmlnLmhvc3R9OiR7Y29uZmlnLnBvcnR9L2dyYXBocWxgO1xuICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoYFN0YXJ0ZWQgb24gJHt1cml9YCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHBvc3RSZXF1ZXN0cyA9IGFzeW5jIChwYXJlbnQsIGFyZ3MpOiBQcm9taXNlPHN0cmluZ1tdPiA9PiB7XG4gICAgICAgIGNvbnN0IHJlcXVlc3RzOiA/KFJlcXVlc3RbXSkgPSBhcmdzLnJlcXVlc3RzO1xuICAgICAgICBpZiAoIXJlcXVlc3RzKSB7XG4gICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY29uZmlnID0gdGhpcy5jb25maWcucmVxdWVzdHM7XG4gICAgICAgIGNvbnN0IHJlc3VsdDogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgZm9yIChjb25zdCByZXF1ZXN0OiBSZXF1ZXN0IG9mIHJlcXVlc3RzKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHVybCA9IGAke2NvbmZpZy5zZXJ2ZXJ9L3RvcGljcy8ke2NvbmZpZy50b3BpY31gO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godXJsLCB7XG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgICAgICBtb2RlOiAnY29ycycsXG4gICAgICAgICAgICAgICAgICAgIGNhY2hlOiAnbm8tY2FjaGUnLFxuICAgICAgICAgICAgICAgICAgICBjcmVkZW50aWFsczogJ3NhbWUtb3JpZ2luJyxcbiAgICAgICAgICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcmVkaXJlY3Q6ICdmb2xsb3cnLFxuICAgICAgICAgICAgICAgICAgICByZWZlcnJlcjogJ25vLXJlZmVycmVyJyxcbiAgICAgICAgICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVjb3JkczogW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5OiByZXF1ZXN0LmlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogcmVxdWVzdC5ib2R5LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2Uuc3RhdHVzICE9PSAyMDApIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbWVzc2FnZSA9IGBQb3N0IHJlcXVlc3QgZmFpbGVkOiAke2F3YWl0IHJlc3BvbnNlLnRleHQoKX1gO1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IobWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKHJlcXVlc3QuaWQpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW1EgU2VydmVyXSBwb3N0IHJlcXVlc3QgZmFpbGVkXScsIGVycm9yKTtcbiAgICAgICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG5cbiAgICBpbmZvID0gYXN5bmMgKCk6IFByb21pc2U8SW5mbz4gPT4ge1xuICAgICAgICBjb25zdCBwa2cgPSBKU09OLnBhcnNlKChmcy5yZWFkRmlsZVN5bmMocGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4uJywgJy4uJywgJ3BhY2thZ2UuanNvbicpKTogYW55KSk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB2ZXJzaW9uOiBwa2cudmVyc2lvbixcbiAgICAgICAgfVxuICAgIH07XG59XG5cbiJdfQ==