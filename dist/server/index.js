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
var program = require('commander');

function getIp() {
  var ipv4 = Object.values(_os["default"].networkInterfaces()).flatMap(function (x) {
    return x;
  }).find(function (x) {
    return x.family === 'IPv4' && !x.internal;
  });
  return ipv4 && ipv4.address;
}

program.option('-h, --host <host>', 'listening address', process.env.Q_SERVER_HOST || getIp()).option('-p, --port <port>', 'listening port', process.env.Q_SERVER_PORT || '4000').option('-m, --requests-mode <mode>', 'Requests mode (kafka | rest)', process.env.Q_REQUESTS_MODE || 'kafka').option('-r, --requests-server <url>', 'Requests server url', process.env.Q_REQUESTS_SERVER || 'kafka:9092').option('-t, --requests-topic <name>', 'Requests topic name', process.env.Q_REQUESTS_TOPIC || 'requests').option('-d, --db-server <address>', 'database server:port', process.env.Q_DATABASE_SERVER || 'arangodb:8529').option('-n, --db-name <name>', 'database name', process.env.Q_DATABASE_NAME || 'blockchain').option('-a, --db-auth <name>', 'database auth in form "user:password', process.env.Q_DATABASE_AUTH || '').option('--db-max-sockets <number>', 'database max sockets', process.env.Q_DATABASE_MAX_SOCKETS || '100').option('--slow-db-server <address>', 'slow queries database server:port', process.env.Q_SLOW_DATABASE_SERVER || '').option('--slow-db-name <name>', 'slow database name', process.env.Q_SLOW_DATABASE_NAME || '').option('--slow-db-auth <name>', 'slow database auth in form "user:password', process.env.Q_SLOW_DATABASE_AUTH || '').option('--slow-db-max-sockets <number>', 'slow database max sockets', process.env.Q_SLOW_DATABASE_MAX_SOCKETS || '3').option('--auth-server <address>', 'auth-service address', process.env.AUTH_SERVER || '127.0.0.1').option('--auth-port <port>', 'auth-service port', process.env.AUTH_PORT || '8888').option('--q-server-id <name>', 'This server id', process.env.Q_SERVER_ID || '1').option('-j, --jaeger-endpoint <host>', 'jaeger collector host', process.env.JAEGER_ENDPOINT || '').parse(process.argv);
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
    maxSockets: Number(options.dbMaxSockets)
  },
  slowDatabase: {
    server: options.slowDbServer || options.dbServer,
    name: options.slowDbName || options.dbName,
    auth: options.slowDbAuth || options.dbAuth,
    maxSockets: Number(options.slowDbMaxSockets)
  },
  listener: {
    restartTimeout: 1000
  },
  authorization: {
    server: options.authServer,
    port: options.authPort,
    this_server_id: options.qServerId
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