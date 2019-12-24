"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.main = main;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _server = _interopRequireDefault(require("./server"));

var _logs = _interopRequireDefault(require("./logs"));

var _os = _interopRequireDefault(require("os"));

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
var program = require('commander');

function getIp() {
  var ipv4 = Object.values(_os["default"].networkInterfaces()).flatMap(function (x) {
    return x;
  }).find(function (x) {
    return x.family === 'IPv4' && !x.internal;
  });
  return ipv4 && ipv4.address;
}

program.option('-h, --host <host>', 'listening address', process.env.Q_SERVER_HOST || getIp()).option('-p, --port <port>', 'listening port', process.env.Q_SERVER_PORT || '4000').option('-m, --requests-mode <mode>', 'Requests mode (kafka | rest)', process.env.Q_REQUESTS_MODE || 'kafka').option('-r, --requests-server <url>', 'Requests server url', process.env.Q_REQUESTS_SERVER || 'kafka:9092').option('-t, --requests-topic <name>', 'Requests topic name', process.env.Q_REQUESTS_TOPIC || 'requests').option('-d, --db-server <address>', 'database server:port', process.env.Q_DATABASE_SERVER || 'arangodb:8529').option('-n, --db-name <name>', 'database name', process.env.Q_DATABASE_NAME || 'blockchain').option('-a, --db-auth <name>', 'database auth in form "user:password', process.env.Q_DATABASE_AUTH || '').option('-n, --db-version <version>', 'database schema version', process.env.Q_DATABASE_VERSION || '2').option('-j, --jaeger-endpoint <host>', 'jaeger collector host', process.env.JAEGER_ENDPOINT || '').parse(process.argv);
var options = program;
var config = {
  server: {
    host: options.host,
    port: Number.parseInt(options.port)
  },
  requests: {
    mode: options.requestsMode,
    server: options.requestsServer,
    topic: options.requestsTopic
  },
  database: {
    server: options.dbServer,
    name: options.dbName,
    auth: options.dbAuth,
    version: options.dbVersion
  },
  listener: {
    restartTimeout: 1000
  },
  jaeger: {
    endpoint: options.jaegerEndpoint
  }
};
var logs = new _logs["default"]();
var configLog = logs.create('config');
configLog.debug('USE', config);
var server = new _server["default"]({
  config: config,
  logs: logs
});

function main() {
  (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee() {
    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;
            _context.next = 3;
            return server.start();

          case 3:
            _context.next = 9;
            break;

          case 5:
            _context.prev = 5;
            _context.t0 = _context["catch"](0);
            server.log.error('FAILED', 'START', _context.t0);
            process.exit(1);

          case 9:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[0, 5]]);
  }))();
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9pbmRleC5qcyJdLCJuYW1lcyI6WyJwcm9ncmFtIiwicmVxdWlyZSIsImdldElwIiwiaXB2NCIsIk9iamVjdCIsInZhbHVlcyIsIm9zIiwibmV0d29ya0ludGVyZmFjZXMiLCJmbGF0TWFwIiwieCIsImZpbmQiLCJmYW1pbHkiLCJpbnRlcm5hbCIsImFkZHJlc3MiLCJvcHRpb24iLCJwcm9jZXNzIiwiZW52IiwiUV9TRVJWRVJfSE9TVCIsIlFfU0VSVkVSX1BPUlQiLCJRX1JFUVVFU1RTX01PREUiLCJRX1JFUVVFU1RTX1NFUlZFUiIsIlFfUkVRVUVTVFNfVE9QSUMiLCJRX0RBVEFCQVNFX1NFUlZFUiIsIlFfREFUQUJBU0VfTkFNRSIsIlFfREFUQUJBU0VfQVVUSCIsIlFfREFUQUJBU0VfVkVSU0lPTiIsIkpBRUdFUl9FTkRQT0lOVCIsInBhcnNlIiwiYXJndiIsIm9wdGlvbnMiLCJjb25maWciLCJzZXJ2ZXIiLCJob3N0IiwicG9ydCIsIk51bWJlciIsInBhcnNlSW50IiwicmVxdWVzdHMiLCJtb2RlIiwicmVxdWVzdHNNb2RlIiwicmVxdWVzdHNTZXJ2ZXIiLCJ0b3BpYyIsInJlcXVlc3RzVG9waWMiLCJkYXRhYmFzZSIsImRiU2VydmVyIiwibmFtZSIsImRiTmFtZSIsImF1dGgiLCJkYkF1dGgiLCJ2ZXJzaW9uIiwiZGJWZXJzaW9uIiwibGlzdGVuZXIiLCJyZXN0YXJ0VGltZW91dCIsImphZWdlciIsImVuZHBvaW50IiwiamFlZ2VyRW5kcG9pbnQiLCJsb2dzIiwiUUxvZ3MiLCJjb25maWdMb2ciLCJjcmVhdGUiLCJkZWJ1ZyIsIlRPTlFTZXJ2ZXIiLCJtYWluIiwic3RhcnQiLCJsb2ciLCJlcnJvciIsImV4aXQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7QUFtQkE7O0FBQ0E7O0FBRUE7O0FBdEJBOzs7Ozs7Ozs7Ozs7Ozs7QUF3QkEsSUFBTUEsT0FBTyxHQUFHQyxPQUFPLENBQUMsV0FBRCxDQUF2Qjs7QUFFQSxTQUFT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QU8sQ0FBQ3lCO0FBRGQ7QUFuQlksQ0FBeEI7QUF3QkEsSUFBTUMsSUFBSSxHQUFHLElBQUlDLGdCQUFKLEVBQWI7QUFDQSxJQUFNQyxTQUFTLEdBQUdGLElBQUksQ0FBQ0csTUFBTCxDQUFZLFFBQVosQ0FBbEI7QUFDQUQsU0FBUyxDQUFDRSxLQUFWLENBQWdCLEtBQWhCLEVBQXVCN0IsTUFBdkI7QUFFQSxJQUFNQyxNQUFNLEdBQUcsSUFBSTZCLGtCQUFKLENBQWU7QUFDMUI5QixFQUFBQSxNQUFNLEVBQU5BLE1BRDBCO0FBRTFCeUIsRUFBQUEsSUFBSSxFQUFKQTtBQUYwQixDQUFmLENBQWY7O0FBS08sU0FBU00sSUFBVCxHQUFnQjtBQUNuQjtBQUFBO0FBQUEsK0JBQUM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxtQkFFYTlCLE1BQU0sQ0FBQytCLEtBQVAsRUFGYjs7QUFBQTtBQUFBO0FBQUE7O0FBQUE7QUFBQTtBQUFBO0FBSU8vQixZQUFBQSxNQUFNLENBQUNnQyxHQUFQLENBQVdDLEtBQVgsQ0FBaUIsUUFBakIsRUFBMkIsT0FBM0I7QUFDQWpELFlBQUFBLE9BQU8sQ0FBQ2tELElBQVIsQ0FBYSxDQUFiOztBQUxQO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEdBQUQ7QUFRSCIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgMjAxOC0yMDE5IFRPTiBERVYgU09MVVRJT05TIExURC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgU09GVFdBUkUgRVZBTFVBVElPTiBMaWNlbnNlICh0aGUgXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2VcbiAqIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZVxuICogTGljZW5zZSBhdDpcbiAqXG4gKiBodHRwOi8vd3d3LnRvbi5kZXYvbGljZW5zZXNcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIFRPTiBERVYgc29mdHdhcmUgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLy8gQGZsb3dcblxuaW1wb3J0IHR5cGUgeyBRQ29uZmlnIH0gZnJvbSBcIi4vY29uZmlnXCI7XG5pbXBvcnQgVE9OUVNlcnZlciBmcm9tICcuL3NlcnZlcic7XG5pbXBvcnQgUUxvZ3MgZnJvbSAnLi9sb2dzJztcblxuaW1wb3J0IG9zIGZyb20gJ29zJztcblxuY29uc3QgcHJvZ3JhbSA9IHJlcXVpcmUoJ2NvbW1hbmRlcicpO1xuXG5mdW5jdGlvbiBnZXRJcCgpOiBzdHJpbmcge1xuICAgIGNvbnN0IGlwdjQgPSAoT2JqZWN0LnZhbHVlcyhvcy5uZXR3b3JrSW50ZXJmYWNlcygpKTogYW55KVxuICAgICAgICAuZmxhdE1hcCh4ID0+IHgpXG4gICAgICAgIC5maW5kKHggPT4geC5mYW1pbHkgPT09ICdJUHY0JyAmJiAheC5pbnRlcm5hbCk7XG4gICAgcmV0dXJuIGlwdjQgJiYgaXB2NC5hZGRyZXNzO1xufVxuXG50eXBlIFByb2dyYW1PcHRpb25zID0ge1xuICAgIHJlcXVlc3RzTW9kZTogJ2thZmthJyB8ICdyZXN0JyxcbiAgICByZXF1ZXN0c1NlcnZlcjogc3RyaW5nLFxuICAgIHJlcXVlc3RzVG9waWM6IHN0cmluZyxcbiAgICBkYk5hbWU6IHN0cmluZyxcbiAgICBkYlNlcnZlcjogc3RyaW5nLFxuICAgIGRiTmFtZTogc3RyaW5nLFxuICAgIGRiQXV0aDogc3RyaW5nLFxuICAgIGRiVmVyc2lvbjogc3RyaW5nLFxuICAgIGhvc3Q6IHN0cmluZyxcbiAgICBwb3J0OiBzdHJpbmcsXG4gICAgamFlZ2VyRW5kcG9pbnQ6IHN0cmluZyxcbn1cblxucHJvZ3JhbVxuICAgIC5vcHRpb24oJy1oLCAtLWhvc3QgPGhvc3Q+JywgJ2xpc3RlbmluZyBhZGRyZXNzJyxcbiAgICAgICAgcHJvY2Vzcy5lbnYuUV9TRVJWRVJfSE9TVCB8fCBnZXRJcCgpKVxuICAgIC5vcHRpb24oJy1wLCAtLXBvcnQgPHBvcnQ+JywgJ2xpc3RlbmluZyBwb3J0JyxcbiAgICAgICAgcHJvY2Vzcy5lbnYuUV9TRVJWRVJfUE9SVCB8fCAnNDAwMCcpXG5cbiAgICAub3B0aW9uKCctbSwgLS1yZXF1ZXN0cy1tb2RlIDxtb2RlPicsICdSZXF1ZXN0cyBtb2RlIChrYWZrYSB8IHJlc3QpJyxcbiAgICAgICAgcHJvY2Vzcy5lbnYuUV9SRVFVRVNUU19NT0RFIHx8ICdrYWZrYScpXG4gICAgLm9wdGlvbignLXIsIC0tcmVxdWVzdHMtc2VydmVyIDx1cmw+JywgJ1JlcXVlc3RzIHNlcnZlciB1cmwnLFxuICAgICAgICBwcm9jZXNzLmVudi5RX1JFUVVFU1RTX1NFUlZFUiB8fCAna2Fma2E6OTA5MicpXG4gICAgLm9wdGlvbignLXQsIC0tcmVxdWVzdHMtdG9waWMgPG5hbWU+JywgJ1JlcXVlc3RzIHRvcGljIG5hbWUnLFxuICAgICAgICBwcm9jZXNzLmVudi5RX1JFUVVFU1RTX1RPUElDIHx8ICdyZXF1ZXN0cycpXG5cbiAgICAub3B0aW9uKCctZCwgLS1kYi1zZXJ2ZXIgPGFkZHJlc3M+JywgJ2RhdGFiYXNlIHNlcnZlcjpwb3J0JyxcbiAgICAgICAgcHJvY2Vzcy5lbnYuUV9EQVRBQkFTRV9TRVJWRVIgfHwgJ2FyYW5nb2RiOjg1MjknKVxuICAgIC5vcHRpb24oJy1uLCAtLWRiLW5hbWUgPG5hbWU+JywgJ2RhdGFiYXNlIG5hbWUnLFxuICAgICAgICBwcm9jZXNzLmVudi5RX0RBVEFCQVNFX05BTUUgfHwgJ2Jsb2NrY2hhaW4nKVxuICAgIC5vcHRpb24oJy1hLCAtLWRiLWF1dGggPG5hbWU+JywgJ2RhdGFiYXNlIGF1dGggaW4gZm9ybSBcInVzZXI6cGFzc3dvcmQnLFxuICAgICAgICBwcm9jZXNzLmVudi5RX0RBVEFCQVNFX0FVVEggfHwgJycpXG4gICAgLm9wdGlvbignLW4sIC0tZGItdmVyc2lvbiA8dmVyc2lvbj4nLCAnZGF0YWJhc2Ugc2NoZW1hIHZlcnNpb24nLFxuICAgICAgICBwcm9jZXNzLmVudi5RX0RBVEFCQVNFX1ZFUlNJT04gfHwgJzInKVxuICAgIC5vcHRpb24oJy1qLCAtLWphZWdlci1lbmRwb2ludCA8aG9zdD4nLCAnamFlZ2VyIGNvbGxlY3RvciBob3N0JyxcbiAgICAgICAgcHJvY2Vzcy5lbnYuSkFFR0VSX0VORFBPSU5UIHx8ICcnKVxuICAgIC5wYXJzZShwcm9jZXNzLmFyZ3YpO1xuXG5jb25zdCBvcHRpb25zOiBQcm9ncmFtT3B0aW9ucyA9IHByb2dyYW07XG5cbmNvbnN0IGNvbmZpZzogUUNvbmZpZyA9IHtcbiAgICBzZXJ2ZXI6IHtcbiAgICAgICAgaG9zdDogb3B0aW9ucy5ob3N0LFxuICAgICAgICBwb3J0OiBOdW1iZXIucGFyc2VJbnQob3B0aW9ucy5wb3J0KSxcbiAgICB9LFxuICAgIHJlcXVlc3RzOiB7XG4gICAgICAgIG1vZGU6IG9wdGlvbnMucmVxdWVzdHNNb2RlLFxuICAgICAgICBzZXJ2ZXI6IG9wdGlvbnMucmVxdWVzdHNTZXJ2ZXIsXG4gICAgICAgIHRvcGljOiBvcHRpb25zLnJlcXVlc3RzVG9waWMsXG4gICAgfSxcbiAgICBkYXRhYmFzZToge1xuICAgICAgICBzZXJ2ZXI6IG9wdGlvbnMuZGJTZXJ2ZXIsXG4gICAgICAgIG5hbWU6IG9wdGlvbnMuZGJOYW1lLFxuICAgICAgICBhdXRoOiBvcHRpb25zLmRiQXV0aCxcbiAgICAgICAgdmVyc2lvbjogb3B0aW9ucy5kYlZlcnNpb24sXG4gICAgfSxcbiAgICBsaXN0ZW5lcjoge1xuICAgICAgICByZXN0YXJ0VGltZW91dDogMTAwMFxuICAgIH0sXG4gICAgamFlZ2VyOiB7XG4gICAgICAgIGVuZHBvaW50OiBvcHRpb25zLmphZWdlckVuZHBvaW50XG4gICAgfVxufTtcblxuY29uc3QgbG9ncyA9IG5ldyBRTG9ncygpO1xuY29uc3QgY29uZmlnTG9nID0gbG9ncy5jcmVhdGUoJ2NvbmZpZycpO1xuY29uZmlnTG9nLmRlYnVnKCdVU0UnLCBjb25maWcpO1xuXG5jb25zdCBzZXJ2ZXIgPSBuZXcgVE9OUVNlcnZlcih7XG4gICAgY29uZmlnLFxuICAgIGxvZ3MsXG59KTtcblxuZXhwb3J0IGZ1bmN0aW9uIG1haW4oKSB7XG4gICAgKGFzeW5jICgpID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IHNlcnZlci5zdGFydCgpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgc2VydmVyLmxvZy5lcnJvcignRkFJTEVEJywgJ1NUQVJUJywgZXJyb3IpO1xuICAgICAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgICAgICB9XG4gICAgfSkoKTtcbn1cbiJdfQ==