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

program.option('-h, --host <host>', 'listening address', process.env.Q_SERVER_HOST || getIp()).option('-p, --port <port>', 'listening port', process.env.Q_SERVER_PORT || '4000').option('-m, --requests-mode <mode>', 'Requests mode (kafka | rest)', process.env.Q_REQUESTS_MODE || 'kafka').option('-r, --requests-server <url>', 'Requests server url', process.env.Q_REQUESTS_SERVER || 'kafka:9092').option('-t, --requests-topic <name>', 'Requests topic name', process.env.Q_REQUESTS_TOPIC || 'requests').option('-d, --db-server <address>', 'database server:port', process.env.Q_DATABASE_SERVER || 'arangodb:8529').option('-n, --db-name <name>', 'database name', process.env.Q_DATABASE_NAME || 'blockchain').option('-n, --db-version <version>', 'database schema version', process.env.Q_DATABASE_VERSION || '2').parse(process.argv);
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
    version: options.dbVersion
  },
  listener: {
    restartTimeout: 1000
  }
};
console.log('Using config:', config);
var server = new _server["default"]({
  config: config,
  logs: new _logs["default"]()
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
            server.log.error('Start failed:', _context.t0);
            process.exit(1);

          case 9:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[0, 5]]);
  }))();
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9pbmRleC5qcyJdLCJuYW1lcyI6WyJwcm9ncmFtIiwicmVxdWlyZSIsImdldElwIiwiaXB2NCIsIk9iamVjdCIsInZhbHVlcyIsIm9zIiwibmV0d29ya0ludGVyZmFjZXMiLCJmbGF0TWFwIiwieCIsImZpbmQiLCJmYW1pbHkiLCJpbnRlcm5hbCIsImFkZHJlc3MiLCJvcHRpb24iLCJwcm9jZXNzIiwiZW52IiwiUV9TRVJWRVJfSE9TVCIsIlFfU0VSVkVSX1BPUlQiLCJRX1JFUVVFU1RTX01PREUiLCJRX1JFUVVFU1RTX1NFUlZFUiIsIlFfUkVRVUVTVFNfVE9QSUMiLCJRX0RBVEFCQVNFX1NFUlZFUiIsIlFfREFUQUJBU0VfTkFNRSIsIlFfREFUQUJBU0VfVkVSU0lPTiIsInBhcnNlIiwiYXJndiIsIm9wdGlvbnMiLCJjb25maWciLCJzZXJ2ZXIiLCJob3N0IiwicG9ydCIsIk51bWJlciIsInBhcnNlSW50IiwicmVxdWVzdHMiLCJtb2RlIiwicmVxdWVzdHNNb2RlIiwicmVxdWVzdHNTZXJ2ZXIiLCJ0b3BpYyIsInJlcXVlc3RzVG9waWMiLCJkYXRhYmFzZSIsImRiU2VydmVyIiwibmFtZSIsImRiTmFtZSIsInZlcnNpb24iLCJkYlZlcnNpb24iLCJsaXN0ZW5lciIsInJlc3RhcnRUaW1lb3V0IiwiY29uc29sZSIsImxvZyIsIlRPTlFTZXJ2ZXIiLCJsb2dzIiwiUUxvZ3MiLCJtYWluIiwic3RhcnQiLCJlcnJvciIsImV4aXQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7QUFtQkE7O0FBQ0E7O0FBRUE7O0FBdEJBOzs7Ozs7Ozs7Ozs7Ozs7QUF3QkEsSUFBTUEsT0FBTyxHQUFHQyxPQUFPLENBQUMsV0FBRCxDQUF2Qjs7QUFFQSxTQUFTQyxLQUFULEdBQXlCO0FBQ3JCLE1BQU1DLElBQUksR0FBSUMsTUFBTSxDQUFDQyxNQUFQLENBQWNDLGVBQUdDLGlCQUFILEVBQWQsQ0FBRCxDQUNSQyxPQURRLENBQ0EsVUFBQUMsQ0FBQztB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QUFBQSxPQUFPLENBQUN5QyxJQUFSLENBQWEsQ0FBYjs7QUFMUDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxHQUFEO0FBUUgiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IDIwMTgtMjAxOSBUT04gREVWIFNPTFVUSU9OUyBMVEQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIFNPRlRXQVJFIEVWQUxVQVRJT04gTGljZW5zZSAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlXG4gKiB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGVcbiAqIExpY2Vuc2UgYXQ6XG4gKlxuICogaHR0cDovL3d3dy50b24uZGV2L2xpY2Vuc2VzXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBUT04gREVWIHNvZnR3YXJlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8vIEBmbG93XG5cbmltcG9ydCB0eXBlIHsgUUNvbmZpZyB9IGZyb20gXCIuL2NvbmZpZ1wiO1xuaW1wb3J0IFRPTlFTZXJ2ZXIgZnJvbSAnLi9zZXJ2ZXInO1xuaW1wb3J0IFFMb2dzIGZyb20gJy4vbG9ncyc7XG5cbmltcG9ydCBvcyBmcm9tICdvcyc7XG5cbmNvbnN0IHByb2dyYW0gPSByZXF1aXJlKCdjb21tYW5kZXInKTtcblxuZnVuY3Rpb24gZ2V0SXAoKTogc3RyaW5nIHtcbiAgICBjb25zdCBpcHY0ID0gKE9iamVjdC52YWx1ZXMob3MubmV0d29ya0ludGVyZmFjZXMoKSk6IGFueSlcbiAgICAgICAgLmZsYXRNYXAoeCA9PiB4KVxuICAgICAgICAuZmluZCh4ID0+IHguZmFtaWx5ID09PSAnSVB2NCcgJiYgIXguaW50ZXJuYWwpO1xuICAgIHJldHVybiBpcHY0ICYmIGlwdjQuYWRkcmVzcztcbn1cblxudHlwZSBQcm9ncmFtT3B0aW9ucyA9IHtcbiAgICByZXF1ZXN0c01vZGU6ICdrYWZrYScgfCAncmVzdCcsXG4gICAgcmVxdWVzdHNTZXJ2ZXI6IHN0cmluZyxcbiAgICByZXF1ZXN0c1RvcGljOiBzdHJpbmcsXG4gICAgZGJOYW1lOiBzdHJpbmcsXG4gICAgZGJTZXJ2ZXI6IHN0cmluZyxcbiAgICBkYk5hbWU6IHN0cmluZyxcbiAgICBkYlZlcnNpb246IHN0cmluZyxcbiAgICBob3N0OiBzdHJpbmcsXG4gICAgcG9ydDogc3RyaW5nLFxufVxuXG5wcm9ncmFtXG4gICAgLm9wdGlvbignLWgsIC0taG9zdCA8aG9zdD4nLCAnbGlzdGVuaW5nIGFkZHJlc3MnLFxuICAgICAgICBwcm9jZXNzLmVudi5RX1NFUlZFUl9IT1NUIHx8IGdldElwKCkpXG4gICAgLm9wdGlvbignLXAsIC0tcG9ydCA8cG9ydD4nLCAnbGlzdGVuaW5nIHBvcnQnLFxuICAgICAgICBwcm9jZXNzLmVudi5RX1NFUlZFUl9QT1JUIHx8ICc0MDAwJylcblxuICAgIC5vcHRpb24oJy1tLCAtLXJlcXVlc3RzLW1vZGUgPG1vZGU+JywgJ1JlcXVlc3RzIG1vZGUgKGthZmthIHwgcmVzdCknLFxuICAgICAgICBwcm9jZXNzLmVudi5RX1JFUVVFU1RTX01PREUgfHwgJ2thZmthJylcbiAgICAub3B0aW9uKCctciwgLS1yZXF1ZXN0cy1zZXJ2ZXIgPHVybD4nLCAnUmVxdWVzdHMgc2VydmVyIHVybCcsXG4gICAgICAgIHByb2Nlc3MuZW52LlFfUkVRVUVTVFNfU0VSVkVSIHx8ICdrYWZrYTo5MDkyJylcbiAgICAub3B0aW9uKCctdCwgLS1yZXF1ZXN0cy10b3BpYyA8bmFtZT4nLCAnUmVxdWVzdHMgdG9waWMgbmFtZScsXG4gICAgICAgIHByb2Nlc3MuZW52LlFfUkVRVUVTVFNfVE9QSUMgfHwgJ3JlcXVlc3RzJylcblxuICAgIC5vcHRpb24oJy1kLCAtLWRiLXNlcnZlciA8YWRkcmVzcz4nLCAnZGF0YWJhc2Ugc2VydmVyOnBvcnQnLFxuICAgICAgICBwcm9jZXNzLmVudi5RX0RBVEFCQVNFX1NFUlZFUiB8fCAnYXJhbmdvZGI6ODUyOScpXG4gICAgLm9wdGlvbignLW4sIC0tZGItbmFtZSA8bmFtZT4nLCAnZGF0YWJhc2UgbmFtZScsXG4gICAgICAgIHByb2Nlc3MuZW52LlFfREFUQUJBU0VfTkFNRSB8fCAnYmxvY2tjaGFpbicpXG4gICAgLm9wdGlvbignLW4sIC0tZGItdmVyc2lvbiA8dmVyc2lvbj4nLCAnZGF0YWJhc2Ugc2NoZW1hIHZlcnNpb24nLFxuICAgICAgICBwcm9jZXNzLmVudi5RX0RBVEFCQVNFX1ZFUlNJT04gfHwgJzInKVxuICAgIC5wYXJzZShwcm9jZXNzLmFyZ3YpO1xuXG5jb25zdCBvcHRpb25zOiBQcm9ncmFtT3B0aW9ucyA9IHByb2dyYW07XG5cbmNvbnN0IGNvbmZpZzogUUNvbmZpZyA9IHtcbiAgICBzZXJ2ZXI6IHtcbiAgICAgICAgaG9zdDogb3B0aW9ucy5ob3N0LFxuICAgICAgICBwb3J0OiBOdW1iZXIucGFyc2VJbnQob3B0aW9ucy5wb3J0KSxcbiAgICB9LFxuICAgIHJlcXVlc3RzOiB7XG4gICAgICAgIG1vZGU6IG9wdGlvbnMucmVxdWVzdHNNb2RlLFxuICAgICAgICBzZXJ2ZXI6IG9wdGlvbnMucmVxdWVzdHNTZXJ2ZXIsXG4gICAgICAgIHRvcGljOiBvcHRpb25zLnJlcXVlc3RzVG9waWMsXG4gICAgfSxcbiAgICBkYXRhYmFzZToge1xuICAgICAgICBzZXJ2ZXI6IG9wdGlvbnMuZGJTZXJ2ZXIsXG4gICAgICAgIG5hbWU6IG9wdGlvbnMuZGJOYW1lLFxuICAgICAgICB2ZXJzaW9uOiBvcHRpb25zLmRiVmVyc2lvbixcbiAgICB9LFxuICAgIGxpc3RlbmVyOiB7XG4gICAgICAgIHJlc3RhcnRUaW1lb3V0OiAxMDAwXG4gICAgfVxufTtcblxuY29uc29sZS5sb2coJ1VzaW5nIGNvbmZpZzonLCBjb25maWcpO1xuXG5jb25zdCBzZXJ2ZXIgPSBuZXcgVE9OUVNlcnZlcih7XG4gICAgY29uZmlnLFxuICAgIGxvZ3M6IG5ldyBRTG9ncygpLFxufSk7XG5cbmV4cG9ydCBmdW5jdGlvbiBtYWluKCkge1xuICAgIChhc3luYyAoKSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCBzZXJ2ZXIuc3RhcnQoKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIHNlcnZlci5sb2cuZXJyb3IoJ1N0YXJ0IGZhaWxlZDonLCBlcnJvcik7XG4gICAgICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgICAgIH1cbiAgICB9KSgpO1xufVxuIl19