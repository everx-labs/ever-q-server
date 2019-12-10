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

program.option('-h, --host <host>', 'listening address', process.env.Q_SERVER_HOST || getIp()).option('-p, --port <port>', 'listening port', process.env.Q_SERVER_PORT || '4000').option('-m, --requests-mode <mode>', 'Requests mode (kafka | rest)', process.env.Q_REQUESTS_MODE || 'kafka').option('-r, --requests-server <url>', 'Requests server url', process.env.Q_REQUESTS_SERVER || 'kafka:9092').option('-t, --requests-topic <name>', 'Requests topic name', process.env.Q_REQUESTS_TOPIC || 'requests').option('-d, --db-server <address>', 'database server:port', process.env.Q_DATABASE_SERVER || 'arangodb:8529').option('-n, --db-name <name>', 'database name', process.env.Q_DATABASE_NAME || 'blockchain').option('-a, --db-auth <name>', 'database auth in form "user:password', process.env.Q_DATABASE_AUTH || '').option('-n, --db-version <version>', 'database schema version', process.env.Q_DATABASE_VERSION || '2').parse(process.argv);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9pbmRleC5qcyJdLCJuYW1lcyI6WyJwcm9ncmFtIiwicmVxdWlyZSIsImdldElwIiwiaXB2NCIsIk9iamVjdCIsInZhbHVlcyIsIm9zIiwibmV0d29ya0ludGVyZmFjZXMiLCJmbGF0TWFwIiwieCIsImZpbmQiLCJmYW1pbHkiLCJpbnRlcm5hbCIsImFkZHJlc3MiLCJvcHRpb24iLCJwcm9jZXNzIiwiZW52IiwiUV9TRVJWRVJfSE9TVCIsIlFfU0VSVkVSX1BPUlQiLCJRX1JFUVVFU1RTX01PREUiLCJRX1JFUVVFU1RTX1NFUlZFUiIsIlFfUkVRVUVTVFNfVE9QSUMiLCJRX0RBVEFCQVNFX1NFUlZFUiIsIlFfREFUQUJBU0VfTkFNRSIsIlFfREFUQUJBU0VfQVVUSCIsIlFfREFUQUJBU0VfVkVSU0lPTiIsInBhcnNlIiwiYXJndiIsIm9wdGlvbnMiLCJjb25maWciLCJzZXJ2ZXIiLCJob3N0IiwicG9ydCIsIk51bWJlciIsInBhcnNlSW50IiwicmVxdWVzdHMiLCJtb2RlIiwicmVxdWVzdHNNb2RlIiwicmVxdWVzdHNTZXJ2ZXIiLCJ0b3BpYyIsInJlcXVlc3RzVG9waWMiLCJkYXRhYmFzZSIsImRiU2VydmVyIiwibmFtZSIsImRiTmFtZSIsImF1dGgiLCJkYkF1dGgiLCJ2ZXJzaW9uIiwiZGJWZXJzaW9uIiwibGlzdGVuZXIiLCJyZXN0YXJ0VGltZW91dCIsImNvbnNvbGUiLCJsb2ciLCJUT05RU2VydmVyIiwibG9ncyIsIlFMb2dzIiwibWFpbiIsInN0YXJ0IiwiZXJyb3IiLCJleGl0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0FBbUJBOztBQUNBOztBQUVBOztBQXRCQTs7Ozs7Ozs7Ozs7Ozs7O0FBd0JBLElBQU1BLE9BQU8sR0FBR0MsT0FBTyxDQUFDLFdBQUQsQ0FBdkI7O0FBRUEsU0FBU0MsS0FBVCxHQUF5QjtBQUNyQixNQUFNQyxJQUFJLEdBQUlDLE1BQU0sQ0FBQ0MsTUFBUCxDQUFjQyxlQUFHQyxpQkFBSCxFQUFkLENBQUQsQ0FDUkMsT0FEUSxDQUNBLFVBQUFDLENBQUM7QUFBQSxXQUFJQSxDQUFKO0FBQUEsR0FERCxFQUVSQyxJQUZRLENBRUgsVUFBQUQsQ0FBQztBQUFBLFdBQUlBLENBQUMsQ0FBQ0UsTUFBRixLQUFhLE1BQWIsSUFBdUIsQ0FBQ0YsQ0FBQyxDQUFDRyxRQUE5QjtBQUFBLEdBRkUsQ0FBYjtBQUdBLFNBQU9ULElBQUksSUFBSUEsSUFBSSxDQUFDVSxPQUFwQjtBQUNIOztBQWVEYixPQUFPLENBQ0ZjLE1BREwsQ0FDWSxtQkFEWixFQUNpQyxtQkFEakMsRUFFUUMsT0FBTyxDQUFDQyxHQUFSLENBQVlDLGFBQVosSUFBNkJmLEtBQUssRUFGMUMsRUFHS1ksTUFITCxDQUdZLG1CQUhaLEVBR2lDLGdCQUhqQyxFQUlRQyxPQUFPLENBQUNDLEdBQVIsQ0FBWUUsYUFBWixJQUE2QixNQUpyQyxFQU1LSixNQU5MLENBTVksNEJBTlosRUFNMEMsOEJBTjFDLEVBT1FDLE9BQU8sQ0FBQ0MsR0FBUixDQUFZRyxlQUFaLElBQStCLE9BUHZDLEVBUUtMLE1BUkwsQ0FRWSw2QkFSWixFQVEyQyxxQkFSM0MsRUFTUUMsT0FBTyxDQUFDQyxHQUFSLENBQVlJLGlCQUFaLElBQWlDLFlBVHpDLEVBVUtOLE1BVkwsQ0FVWSw2QkFWWixFQVUyQyxxQkFWM0MsRUFXUUMsT0FBTyxDQUFDQyxHQUFSLENBQVlLLGdCQUFaLElBQWdDLFVBWHhDLEVBYUtQLE1BYkwsQ0FhWSwyQkFiWixFQWF5QyxzQkFiekMsRUFjUUMsT0FBTyxDQUFDQyxHQUFSLENBQVlNLGlCQUFaLElBQWlDLGVBZHpDLEVBZUtSLE1BZkwsQ0FlWSxzQkFmWixFQWVvQyxlQWZwQyxFQWdCUUMsT0FBTyxDQUFDQyxHQUFSLENBQVlPLGVBQVosSUFBK0IsWUFoQnZDLEVBaUJLVCxNQWpCTCxDQWlCWSxzQkFqQlosRUFpQm9DLHNDQWpCcEMsRUFrQlFDLE9BQU8sQ0FBQ0MsR0FBUixDQUFZUSxlQUFaLElBQStCLEVBbEJ2QyxFQW1CS1YsTUFuQkwsQ0FtQlksNEJBbkJaLEVBbUIwQyx5QkFuQjFDLEVBb0JRQyxPQUFPLENBQUNDLEdBQVIsQ0FBWVMsa0JBQVosSUFBa0MsR0FwQjFDLEVBcUJLQyxLQXJCTCxDQXFCV1gsT0FBTyxDQUFDWSxJQXJCbkI7QUF1QkEsSUFBTUMsT0FBdUIsR0FBRzVCLE9BQWhDO0FBRUEsSUFBTTZCLE1BQWUsR0FBRztBQUNwQkMsRUFBQUEsTUFBTSxFQUFFO0FBQ0pDLElBQUFBLElBQUksRUFBRUgsT0FBTyxDQUFDRyxJQURWO0FBRUpDLElBQUFBLElBQUksRUFBRUMsTUFBTSxDQUFDQyxRQUFQLENBQWdCTixPQUFPLENBQUNJLElBQXhCO0FBRkYsR0FEWTtBQUtwQkcsRUFBQUEsUUFBUSxFQUFFO0FBQ05DLElBQUFBLElBQUksRUFBRVIsT0FBTyxDQUFDUyxZQURSO0FBRU5QLElBQUFBLE1BQU0sRUFBRUYsT0FBTyxDQUFDVSxjQUZWO0FBR05DLElBQUFBLEtBQUssRUFBRVgsT0FBTyxDQUFDWTtBQUhULEdBTFU7QUFVcEJDLEVBQUFBLFFBQVEsRUFBRTtBQUNOWCxJQUFBQSxNQUFNLEVBQUVGLE9BQU8sQ0FBQ2MsUUFEVjtBQUVOQyxJQUFBQSxJQUFJLEVBQUVmLE9BQU8sQ0FBQ2dCLE1BRlI7QUFHTkMsSUFBQUEsSUFBSSxFQUFFakIsT0FBTyxDQUFDa0IsTUFIUjtBQUlOQyxJQUFBQSxPQUFPLEVBQUVuQixPQUFPLENBQUNvQjtBQUpYLEdBVlU7QUFnQnBCQyxFQUFBQSxRQUFRLEVBQUU7QUFDTkMsSUFBQUEsY0FBYyxFQUFFO0FBRFY7QUFoQlUsQ0FBeEI7QUFxQkFDLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLGVBQVosRUFBNkJ2QixNQUE3QjtBQUVBLElBQU1DLE1BQU0sR0FBRyxJQUFJdUIsa0JBQUosQ0FBZTtBQUMxQnhCLEVBQUFBLE1BQU0sRUFBTkEsTUFEMEI7QUFFMUJ5QixFQUFBQSxJQUFJLEVBQUUsSUFBSUMsZ0JBQUo7QUFGb0IsQ0FBZixDQUFmOztBQUtPLFNBQVNDLElBQVQsR0FBZ0I7QUFDbkI7QUFBQTtBQUFBLCtCQUFDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsbUJBRWExQixNQUFNLENBQUMyQixLQUFQLEVBRmI7O0FBQUE7QUFBQTtBQUFBOztBQUFBO0FBQUE7QUFBQTtBQUlPM0IsWUFBQUEsTUFBTSxDQUFDc0IsR0FBUCxDQUFXTSxLQUFYLENBQWlCLGVBQWpCO0FBQ0EzQyxZQUFBQSxPQUFPLENBQUM0QyxJQUFSLENBQWEsQ0FBYjs7QUFMUDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxHQUFEO0FBUUgiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IDIwMTgtMjAxOSBUT04gREVWIFNPTFVUSU9OUyBMVEQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIFNPRlRXQVJFIEVWQUxVQVRJT04gTGljZW5zZSAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlXG4gKiB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGVcbiAqIExpY2Vuc2UgYXQ6XG4gKlxuICogaHR0cDovL3d3dy50b24uZGV2L2xpY2Vuc2VzXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBUT04gREVWIHNvZnR3YXJlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8vIEBmbG93XG5cbmltcG9ydCB0eXBlIHsgUUNvbmZpZyB9IGZyb20gXCIuL2NvbmZpZ1wiO1xuaW1wb3J0IFRPTlFTZXJ2ZXIgZnJvbSAnLi9zZXJ2ZXInO1xuaW1wb3J0IFFMb2dzIGZyb20gJy4vbG9ncyc7XG5cbmltcG9ydCBvcyBmcm9tICdvcyc7XG5cbmNvbnN0IHByb2dyYW0gPSByZXF1aXJlKCdjb21tYW5kZXInKTtcblxuZnVuY3Rpb24gZ2V0SXAoKTogc3RyaW5nIHtcbiAgICBjb25zdCBpcHY0ID0gKE9iamVjdC52YWx1ZXMob3MubmV0d29ya0ludGVyZmFjZXMoKSk6IGFueSlcbiAgICAgICAgLmZsYXRNYXAoeCA9PiB4KVxuICAgICAgICAuZmluZCh4ID0+IHguZmFtaWx5ID09PSAnSVB2NCcgJiYgIXguaW50ZXJuYWwpO1xuICAgIHJldHVybiBpcHY0ICYmIGlwdjQuYWRkcmVzcztcbn1cblxudHlwZSBQcm9ncmFtT3B0aW9ucyA9IHtcbiAgICByZXF1ZXN0c01vZGU6ICdrYWZrYScgfCAncmVzdCcsXG4gICAgcmVxdWVzdHNTZXJ2ZXI6IHN0cmluZyxcbiAgICByZXF1ZXN0c1RvcGljOiBzdHJpbmcsXG4gICAgZGJOYW1lOiBzdHJpbmcsXG4gICAgZGJTZXJ2ZXI6IHN0cmluZyxcbiAgICBkYk5hbWU6IHN0cmluZyxcbiAgICBkYkF1dGg6IHN0cmluZyxcbiAgICBkYlZlcnNpb246IHN0cmluZyxcbiAgICBob3N0OiBzdHJpbmcsXG4gICAgcG9ydDogc3RyaW5nLFxufVxuXG5wcm9ncmFtXG4gICAgLm9wdGlvbignLWgsIC0taG9zdCA8aG9zdD4nLCAnbGlzdGVuaW5nIGFkZHJlc3MnLFxuICAgICAgICBwcm9jZXNzLmVudi5RX1NFUlZFUl9IT1NUIHx8IGdldElwKCkpXG4gICAgLm9wdGlvbignLXAsIC0tcG9ydCA8cG9ydD4nLCAnbGlzdGVuaW5nIHBvcnQnLFxuICAgICAgICBwcm9jZXNzLmVudi5RX1NFUlZFUl9QT1JUIHx8ICc0MDAwJylcblxuICAgIC5vcHRpb24oJy1tLCAtLXJlcXVlc3RzLW1vZGUgPG1vZGU+JywgJ1JlcXVlc3RzIG1vZGUgKGthZmthIHwgcmVzdCknLFxuICAgICAgICBwcm9jZXNzLmVudi5RX1JFUVVFU1RTX01PREUgfHwgJ2thZmthJylcbiAgICAub3B0aW9uKCctciwgLS1yZXF1ZXN0cy1zZXJ2ZXIgPHVybD4nLCAnUmVxdWVzdHMgc2VydmVyIHVybCcsXG4gICAgICAgIHByb2Nlc3MuZW52LlFfUkVRVUVTVFNfU0VSVkVSIHx8ICdrYWZrYTo5MDkyJylcbiAgICAub3B0aW9uKCctdCwgLS1yZXF1ZXN0cy10b3BpYyA8bmFtZT4nLCAnUmVxdWVzdHMgdG9waWMgbmFtZScsXG4gICAgICAgIHByb2Nlc3MuZW52LlFfUkVRVUVTVFNfVE9QSUMgfHwgJ3JlcXVlc3RzJylcblxuICAgIC5vcHRpb24oJy1kLCAtLWRiLXNlcnZlciA8YWRkcmVzcz4nLCAnZGF0YWJhc2Ugc2VydmVyOnBvcnQnLFxuICAgICAgICBwcm9jZXNzLmVudi5RX0RBVEFCQVNFX1NFUlZFUiB8fCAnYXJhbmdvZGI6ODUyOScpXG4gICAgLm9wdGlvbignLW4sIC0tZGItbmFtZSA8bmFtZT4nLCAnZGF0YWJhc2UgbmFtZScsXG4gICAgICAgIHByb2Nlc3MuZW52LlFfREFUQUJBU0VfTkFNRSB8fCAnYmxvY2tjaGFpbicpXG4gICAgLm9wdGlvbignLWEsIC0tZGItYXV0aCA8bmFtZT4nLCAnZGF0YWJhc2UgYXV0aCBpbiBmb3JtIFwidXNlcjpwYXNzd29yZCcsXG4gICAgICAgIHByb2Nlc3MuZW52LlFfREFUQUJBU0VfQVVUSCB8fCAnJylcbiAgICAub3B0aW9uKCctbiwgLS1kYi12ZXJzaW9uIDx2ZXJzaW9uPicsICdkYXRhYmFzZSBzY2hlbWEgdmVyc2lvbicsXG4gICAgICAgIHByb2Nlc3MuZW52LlFfREFUQUJBU0VfVkVSU0lPTiB8fCAnMicpXG4gICAgLnBhcnNlKHByb2Nlc3MuYXJndik7XG5cbmNvbnN0IG9wdGlvbnM6IFByb2dyYW1PcHRpb25zID0gcHJvZ3JhbTtcblxuY29uc3QgY29uZmlnOiBRQ29uZmlnID0ge1xuICAgIHNlcnZlcjoge1xuICAgICAgICBob3N0OiBvcHRpb25zLmhvc3QsXG4gICAgICAgIHBvcnQ6IE51bWJlci5wYXJzZUludChvcHRpb25zLnBvcnQpLFxuICAgIH0sXG4gICAgcmVxdWVzdHM6IHtcbiAgICAgICAgbW9kZTogb3B0aW9ucy5yZXF1ZXN0c01vZGUsXG4gICAgICAgIHNlcnZlcjogb3B0aW9ucy5yZXF1ZXN0c1NlcnZlcixcbiAgICAgICAgdG9waWM6IG9wdGlvbnMucmVxdWVzdHNUb3BpYyxcbiAgICB9LFxuICAgIGRhdGFiYXNlOiB7XG4gICAgICAgIHNlcnZlcjogb3B0aW9ucy5kYlNlcnZlcixcbiAgICAgICAgbmFtZTogb3B0aW9ucy5kYk5hbWUsXG4gICAgICAgIGF1dGg6IG9wdGlvbnMuZGJBdXRoLFxuICAgICAgICB2ZXJzaW9uOiBvcHRpb25zLmRiVmVyc2lvbixcbiAgICB9LFxuICAgIGxpc3RlbmVyOiB7XG4gICAgICAgIHJlc3RhcnRUaW1lb3V0OiAxMDAwXG4gICAgfVxufTtcblxuY29uc29sZS5sb2coJ1VzaW5nIGNvbmZpZzonLCBjb25maWcpO1xuXG5jb25zdCBzZXJ2ZXIgPSBuZXcgVE9OUVNlcnZlcih7XG4gICAgY29uZmlnLFxuICAgIGxvZ3M6IG5ldyBRTG9ncygpLFxufSk7XG5cbmV4cG9ydCBmdW5jdGlvbiBtYWluKCkge1xuICAgIChhc3luYyAoKSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCBzZXJ2ZXIuc3RhcnQoKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIHNlcnZlci5sb2cuZXJyb3IoJ1N0YXJ0IGZhaWxlZDonLCBlcnJvcik7XG4gICAgICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgICAgIH1cbiAgICB9KSgpO1xufVxuIl19