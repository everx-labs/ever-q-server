"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _express = _interopRequireDefault(require("express"));

var _http = _interopRequireDefault(require("http"));

var _apolloServerExpress = require("apollo-server-express");

var _subscriptionsTransportWs = require("subscriptions-transport-ws");

var _tonClientNodeJs = require("ton-client-node-js");

var _arango = _interopRequireDefault(require("./arango"));

var _qRpcServer = require("./q-rpc-server");

var _resolversGenerated = require("./resolvers-generated");

var _resolversCustom = require("./resolvers-custom");

var _resolversMam = require("./resolvers-mam");

var _logs = _interopRequireDefault(require("./logs"));

var _tracer = require("./tracer");

var _opentracing = require("opentracing");

var _auth = require("./auth");

var _utils = require("./utils");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
const v8 = require('v8');

class MemStats {
  constructor(stats) {
    this.stats = stats;
  }

  report() {
    v8.getHeapSpaceStatistics().forEach(space => {
      const spaceName = space.space_name.replace('space_', '').replace('_space', '');

      const gauge = (metric, value) => {
        this.stats.gauge(`heap.space.${spaceName}.${metric}`, value);
      };

      gauge('physical_size', space.physical_space_size);
      gauge('available_size', space.space_available_size);
      gauge('size', space.space_size);
      gauge('used_size', space.space_used_size);
    });
  }

  start() {
    this.checkMemReport(); //TODO: this.checkGc();
  }

  checkMemReport() {
    setTimeout(() => {
      this.report();
      this.checkMemReport();
    }, 5000);
  }

  checkGc() {
    setTimeout(() => {
      global.gc();
      this.checkGc();
    }, 60000);
  }

}

class TONQServer {
  constructor(options) {
    this.config = options.config;
    this.logs = options.logs;
    this.log = this.logs.create('server');
    this.shared = new Map();
    this.tracer = _tracer.QTracer.create(options.config);
    this.stats = _tracer.QStats.create(options.config.statsd.server);
    this.auth = new _auth.Auth(options.config);
    this.endPoints = [];
    this.app = (0, _express.default)();
    this.server = _http.default.createServer(this.app);
    this.db = new _arango.default(this.config, this.logs, this.auth, this.tracer, this.stats);
    this.memStats = new MemStats(this.stats);
    this.memStats.start();
    this.rpcServer = new _qRpcServer.QRpcServer({
      auth: this.auth,
      db: this.db,
      port: options.config.server.rpcPort
    });
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

  async start() {
    this.client = await _tonClientNodeJs.TONClient.create({
      servers: ['']
    });
    await this.db.start();
    const {
      host,
      port
    } = this.config.server;
    this.server.listen({
      host,
      port
    }, () => {
      this.endPoints.forEach(endPoint => {
        this.log.debug('GRAPHQL', `http://${host}:${port}${endPoint.path}`);
      });
    });
    this.server.setTimeout(2147483647);

    if (this.rpcServer.port) {
      this.rpcServer.start();
    }
  }

  addEndPoint(endPoint) {
    const typeDefs = endPoint.typeDefFileNames.map(x => _fs.default.readFileSync(x, 'utf-8')).join('\n');
    const config = {
      typeDefs,
      resolvers: endPoint.resolvers,
      subscriptions: {
        onConnect(connectionParams, _websocket, _context) {
          return {
            accessKey: connectionParams.accessKey || connectionParams.accesskey
          };
        }

      },
      context: ({
        req,
        connection
      }) => {
        return {
          db: this.db,
          tracer: this.tracer,
          stats: this.stats,
          auth: this.auth,
          client: this.client,
          config: this.config,
          shared: this.shared,
          remoteAddress: req && req.socket && req.socket.remoteAddress || '',
          accessKey: _auth.Auth.extractAccessKey(req, connection),
          parentSpan: _tracer.QTracer.extractParentSpan(this.tracer, connection ? connection : req)
        };
      },
      plugins: [{
        requestDidStart(_requestContext) {
          return {
            willSendResponse(ctx) {
              const context = ctx.context;

              if (context.multipleAccessKeysDetected) {
                throw (0, _utils.createError)(400, 'Request must use the same access key for all queries and mutations');
              }
            }

          };
        }

      }]
    };
    const apollo = new _apolloServerExpress.ApolloServer(config);
    apollo.applyMiddleware({
      app: this.app,
      path: endPoint.path
    });

    if (endPoint.supportSubscriptions) {
      apollo.installSubscriptionHandlers(this.server);
    }

    this.endPoints.push(endPoint);
  }

}

exports.default = TONQServer;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9zZXJ2ZXIuanMiXSwibmFtZXMiOlsidjgiLCJyZXF1aXJlIiwiTWVtU3RhdHMiLCJjb25zdHJ1Y3RvciIsInN0YXRzIiwicmVwb3J0IiwiZ2V0SGVhcFNwYWNlU3RhdGlzdGljcyIsImZvckVhY2giLCJzcGFjZSIsInNwYWNlTmFtZSIsInNwYWNlX25hbWUiLCJyZXBsYWNlIiwiZ2F1Z2UiLCJtZXRyaWMiLCJ2YWx1ZSIsInBoeXNpY2FsX3NwYWNlX3NpemUiLCJzcGFjZV9hdmFpbGFibGVfc2l6ZSIsInNwYWNlX3NpemUiLCJzcGFjZV91c2VkX3NpemUiLCJzdGFydCIsImNoZWNrTWVtUmVwb3J0Iiwic2V0VGltZW91dCIsImNoZWNrR2MiLCJnbG9iYWwiLCJnYyIsIlRPTlFTZXJ2ZXIiLCJvcHRpb25zIiwiY29uZmlnIiwibG9ncyIsImxvZyIsImNyZWF0ZSIsInNoYXJlZCIsIk1hcCIsInRyYWNlciIsIlFUcmFjZXIiLCJRU3RhdHMiLCJzdGF0c2QiLCJzZXJ2ZXIiLCJhdXRoIiwiQXV0aCIsImVuZFBvaW50cyIsImFwcCIsImh0dHAiLCJjcmVhdGVTZXJ2ZXIiLCJkYiIsIkFyYW5nbyIsIm1lbVN0YXRzIiwicnBjU2VydmVyIiwiUVJwY1NlcnZlciIsInBvcnQiLCJycGNQb3J0IiwiYWRkRW5kUG9pbnQiLCJwYXRoIiwicmVzb2x2ZXJzIiwicmVzb2x2ZXJzTWFtIiwidHlwZURlZkZpbGVOYW1lcyIsInN1cHBvcnRTdWJzY3JpcHRpb25zIiwiY2xpZW50IiwiVE9OQ2xpZW50Tm9kZUpzIiwic2VydmVycyIsImhvc3QiLCJsaXN0ZW4iLCJlbmRQb2ludCIsImRlYnVnIiwidHlwZURlZnMiLCJtYXAiLCJ4IiwiZnMiLCJyZWFkRmlsZVN5bmMiLCJqb2luIiwic3Vic2NyaXB0aW9ucyIsIm9uQ29ubmVjdCIsImNvbm5lY3Rpb25QYXJhbXMiLCJfd2Vic29ja2V0IiwiX2NvbnRleHQiLCJhY2Nlc3NLZXkiLCJhY2Nlc3NrZXkiLCJjb250ZXh0IiwicmVxIiwiY29ubmVjdGlvbiIsInJlbW90ZUFkZHJlc3MiLCJzb2NrZXQiLCJleHRyYWN0QWNjZXNzS2V5IiwicGFyZW50U3BhbiIsImV4dHJhY3RQYXJlbnRTcGFuIiwicGx1Z2lucyIsInJlcXVlc3REaWRTdGFydCIsIl9yZXF1ZXN0Q29udGV4dCIsIndpbGxTZW5kUmVzcG9uc2UiLCJjdHgiLCJtdWx0aXBsZUFjY2Vzc0tleXNEZXRlY3RlZCIsImFwb2xsbyIsIkFwb2xsb1NlcnZlciIsImFwcGx5TWlkZGxld2FyZSIsImluc3RhbGxTdWJzY3JpcHRpb25IYW5kbGVycyIsInB1c2giXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFpQkE7O0FBQ0E7O0FBQ0E7O0FBRUE7O0FBQ0E7O0FBRUE7O0FBQ0E7O0FBRUE7O0FBRUE7O0FBQ0E7O0FBQ0E7O0FBR0E7O0FBR0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7QUF4Q0E7Ozs7Ozs7Ozs7Ozs7OztBQXNEQSxNQUFNQSxFQUFFLEdBQUdDLE9BQU8sQ0FBQyxJQUFELENBQWxCOztBQUVBLE1BQU1DLFFBQU4sQ0FBZTtBQUdYQyxFQUFBQSxXQUFXLENBQUNDLEtBQUQsRUFBZ0I7QUFDdkIsU0FBS0EsS0FBTCxHQUFhQSxLQUFiO0FBQ0g7O0FBRURDLEVBQUFBLE1BQU0sR0FBRztBQUNMTCxJQUFBQSxFQUFFLENBQUNNLHNCQUFILEdBQTRCQyxPQUE1QixDQUFxQ0MsS0FBRCxJQUFXO0FBQzNDLFlBQU1DLFNBQVMsR0FBR0QsS0FBSyxDQUFDRSxVQUFOLENBQ2JDLE9BRGEsQ0FDTCxRQURLLEVBQ0ssRUFETCxFQUViQSxPQUZhLENBRUwsUUFGSyxFQUVLLEVBRkwsQ0FBbEI7O0FBR0EsWUFBTUMsS0FBSyxHQUFHLENBQUNDLE1BQUQsRUFBaUJDLEtBQWpCLEtBQW1DO0FBQzdDLGFBQUtWLEtBQUwsQ0FBV1EsS0FBWCxDQUFrQixjQUFhSCxTQUFVLElBQUdJLE1BQU8sRUFBbkQsRUFBc0RDLEtBQXREO0FBQ0gsT0FGRDs7QUFHQUYsTUFBQUEsS0FBSyxD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QUE4QixHQUFHWSxHQUFHLENBQUNaLE9BQTNDOztBQUNBLGtCQUFJQSxPQUFPLENBQUNhLDBCQUFaLEVBQXdDO0FBQ3BDLHNCQUFNLHdCQUNGLEdBREUsRUFFRixvRUFGRSxDQUFOO0FBSUg7QUFDSjs7QUFURSxXQUFQO0FBV0g7O0FBYkwsT0FESztBQXhCNkIsS0FBMUM7QUEwQ0EsVUFBTUMsTUFBTSxHQUFHLElBQUlDLGlDQUFKLENBQWlCakUsTUFBakIsQ0FBZjtBQUNBZ0UsSUFBQUEsTUFBTSxDQUFDRSxlQUFQLENBQXVCO0FBQ25CcEQsTUFBQUEsR0FBRyxFQUFFLEtBQUtBLEdBRFM7QUFFbkJXLE1BQUFBLElBQUksRUFBRVUsUUFBUSxDQUFDVjtBQUZJLEtBQXZCOztBQUlBLFFBQUlVLFFBQVEsQ0FBQ04sb0JBQWIsRUFBbUM7QUFDL0JtQyxNQUFBQSxNQUFNLENBQUNHLDJCQUFQLENBQW1DLEtBQUt6RCxNQUF4QztBQUNIOztBQUNELFNBQUtHLFNBQUwsQ0FBZXVELElBQWYsQ0FBb0JqQyxRQUFwQjtBQUNIOztBQTlIMkIiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IDIwMTgtMjAyMCBUT04gREVWIFNPTFVUSU9OUyBMVEQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIFNPRlRXQVJFIEVWQUxVQVRJT04gTGljZW5zZSAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlXG4gKiB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGVcbiAqIExpY2Vuc2UgYXQ6XG4gKlxuICogaHR0cDovL3d3dy50b24uZGV2L2xpY2Vuc2VzXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBUT04gREVWIHNvZnR3YXJlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8vIEBmbG93XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IGV4cHJlc3MgZnJvbSAnZXhwcmVzcyc7XG5pbXBvcnQgaHR0cCBmcm9tICdodHRwJztcblxuaW1wb3J0IHtBcG9sbG9TZXJ2ZXIsIEFwb2xsb1NlcnZlckV4cHJlc3NDb25maWd9IGZyb20gJ2Fwb2xsby1zZXJ2ZXItZXhwcmVzcyc7XG5pbXBvcnQge0Nvbm5lY3Rpb25Db250ZXh0fSBmcm9tICdzdWJzY3JpcHRpb25zLXRyYW5zcG9ydC13cyc7XG5pbXBvcnQgdHlwZSB7VE9OQ2xpZW50fSBmcm9tIFwidG9uLWNsaWVudC1qcy90eXBlc1wiO1xuaW1wb3J0IHtUT05DbGllbnQgYXMgVE9OQ2xpZW50Tm9kZUpzfSBmcm9tICd0b24tY2xpZW50LW5vZGUtanMnO1xuaW1wb3J0IEFyYW5nbyBmcm9tICcuL2FyYW5nbyc7XG5pbXBvcnQgdHlwZSB7R3JhcGhRTFJlcXVlc3RDb250ZXh0fSBmcm9tIFwiLi9hcmFuZ28tY29sbGVjdGlvblwiO1xuaW1wb3J0IHtRUnBjU2VydmVyfSBmcm9tICcuL3EtcnBjLXNlcnZlcic7XG5cbmltcG9ydCB7Y3JlYXRlUmVzb2x2ZXJzfSBmcm9tICcuL3Jlc29sdmVycy1nZW5lcmF0ZWQnO1xuaW1wb3J0IHthdHRhY2hDdXN0b21SZXNvbHZlcnN9IGZyb20gXCIuL3Jlc29sdmVycy1jdXN0b21cIjtcbmltcG9ydCB7cmVzb2x2ZXJzTWFtfSBmcm9tIFwiLi9yZXNvbHZlcnMtbWFtXCI7XG5cbmltcG9ydCB0eXBlIHtRQ29uZmlnfSBmcm9tICcuL2NvbmZpZyc7XG5pbXBvcnQgUUxvZ3MgZnJvbSAnLi9sb2dzJztcbmltcG9ydCB0eXBlIHtRTG9nfSBmcm9tICcuL2xvZ3MnO1xuaW1wb3J0IHR5cGUge0lTdGF0c30gZnJvbSAnLi90cmFjZXInO1xuaW1wb3J0IHtRU3RhdHMsIFFUcmFjZXIsIFN0YXRzR2F1Z2V9IGZyb20gXCIuL3RyYWNlclwiO1xuaW1wb3J0IHtUcmFjZXJ9IGZyb20gXCJvcGVudHJhY2luZ1wiO1xuaW1wb3J0IHtBdXRofSBmcm9tICcuL2F1dGgnO1xuaW1wb3J0IHtjcmVhdGVFcnJvcn0gZnJvbSBcIi4vdXRpbHNcIjtcblxudHlwZSBRT3B0aW9ucyA9IHtcbiAgICBjb25maWc6IFFDb25maWcsXG4gICAgbG9nczogUUxvZ3MsXG59XG5cbnR5cGUgRW5kUG9pbnQgPSB7XG4gICAgcGF0aDogc3RyaW5nLFxuICAgIHJlc29sdmVyczogYW55LFxuICAgIHR5cGVEZWZGaWxlTmFtZXM6IHN0cmluZ1tdLFxuICAgIHN1cHBvcnRTdWJzY3JpcHRpb25zOiBib29sZWFuLFxufVxuXG5jb25zdCB2OCA9IHJlcXVpcmUoJ3Y4Jyk7XG5cbmNsYXNzIE1lbVN0YXRzIHtcbiAgICBzdGF0czogSVN0YXRzO1xuXG4gICAgY29uc3RydWN0b3Ioc3RhdHM6IElTdGF0cykge1xuICAgICAgICB0aGlzLnN0YXRzID0gc3RhdHM7XG4gICAgfVxuXG4gICAgcmVwb3J0KCkge1xuICAgICAgICB2OC5nZXRIZWFwU3BhY2VTdGF0aXN0aWNzKCkuZm9yRWFjaCgoc3BhY2UpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHNwYWNlTmFtZSA9IHNwYWNlLnNwYWNlX25hbWVcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgnc3BhY2VfJywgJycpXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoJ19zcGFjZScsICcnKTtcbiAgICAgICAgICAgIGNvbnN0IGdhdWdlID0gKG1ldHJpYzogc3RyaW5nLCB2YWx1ZTogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0cy5nYXVnZShgaGVhcC5zcGFjZS4ke3NwYWNlTmFtZX0uJHttZXRyaWN9YCwgdmFsdWUpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGdhdWdlKCdwaHlzaWNhbF9zaXplJywgc3BhY2UucGh5c2ljYWxfc3BhY2Vfc2l6ZSk7XG4gICAgICAgICAgICBnYXVnZSgnYXZhaWxhYmxlX3NpemUnLCBzcGFjZS5zcGFjZV9hdmFpbGFibGVfc2l6ZSk7XG4gICAgICAgICAgICBnYXVnZSgnc2l6ZScsIHNwYWNlLnNwYWNlX3NpemUpO1xuICAgICAgICAgICAgZ2F1Z2UoJ3VzZWRfc2l6ZScsIHNwYWNlLnNwYWNlX3VzZWRfc2l6ZSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHN0YXJ0KCkge1xuICAgICAgICB0aGlzLmNoZWNrTWVtUmVwb3J0KCk7XG4gICAgICAgIC8vVE9ETzogdGhpcy5jaGVja0djKCk7XG4gICAgfVxuXG4gICAgY2hlY2tNZW1SZXBvcnQoKSB7XG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5yZXBvcnQoKTtcbiAgICAgICAgICAgIHRoaXMuY2hlY2tNZW1SZXBvcnQoKTtcbiAgICAgICAgfSwgNTAwMCk7XG4gICAgfVxuXG4gICAgY2hlY2tHYygpIHtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICBnbG9iYWwuZ2MoKTtcbiAgICAgICAgICAgIHRoaXMuY2hlY2tHYygpO1xuICAgICAgICB9LCA2MDAwMCk7XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBUT05RU2VydmVyIHtcbiAgICBjb25maWc6IFFDb25maWc7XG4gICAgbG9nczogUUxvZ3M7XG4gICAgbG9nOiBRTG9nO1xuICAgIGFwcDogZXhwcmVzcy5BcHBsaWNhdGlvbjtcbiAgICBzZXJ2ZXI6IGFueTtcbiAgICBlbmRQb2ludHM6IEVuZFBvaW50W107XG4gICAgZGI6IEFyYW5nbztcbiAgICB0cmFjZXI6IFRyYWNlcjtcbiAgICBzdGF0czogSVN0YXRzO1xuICAgIGNsaWVudDogVE9OQ2xpZW50O1xuICAgIGF1dGg6IEF1dGg7XG4gICAgbWVtU3RhdHM6IE1lbVN0YXRzO1xuICAgIHNoYXJlZDogTWFwPHN0cmluZywgYW55PjtcbiAgICBycGNTZXJ2ZXI6IFFScGNTZXJ2ZXI7XG5cblxuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnM6IFFPcHRpb25zKSB7XG4gICAgICAgIHRoaXMuY29uZmlnID0gb3B0aW9ucy5jb25maWc7XG4gICAgICAgIHRoaXMubG9ncyA9IG9wdGlvbnMubG9ncztcbiAgICAgICAgdGhpcy5sb2cgPSB0aGlzLmxvZ3MuY3JlYXRlKCdzZXJ2ZXInKTtcbiAgICAgICAgdGhpcy5zaGFyZWQgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMudHJhY2VyID0gUVRyYWNlci5jcmVhdGUob3B0aW9ucy5jb25maWcpO1xuICAgICAgICB0aGlzLnN0YXRzID0gUVN0YXRzLmNyZWF0ZShvcHRpb25zLmNvbmZpZy5zdGF0c2Quc2VydmVyKTtcbiAgICAgICAgdGhpcy5hdXRoID0gbmV3IEF1dGgob3B0aW9ucy5jb25maWcpO1xuICAgICAgICB0aGlzLmVuZFBvaW50cyA9IFtdO1xuICAgICAgICB0aGlzLmFwcCA9IGV4cHJlc3MoKTtcbiAgICAgICAgdGhpcy5zZXJ2ZXIgPSBodHRwLmNyZWF0ZVNlcnZlcih0aGlzLmFwcCk7XG4gICAgICAgIHRoaXMuZGIgPSBuZXcgQXJhbmdvKHRoaXMuY29uZmlnLCB0aGlzLmxvZ3MsIHRoaXMuYXV0aCwgdGhpcy50cmFjZXIsIHRoaXMuc3RhdHMpO1xuICAgICAgICB0aGlzLm1lbVN0YXRzID0gbmV3IE1lbVN0YXRzKHRoaXMuc3RhdHMpO1xuICAgICAgICB0aGlzLm1lbVN0YXRzLnN0YXJ0KCk7XG4gICAgICAgIHRoaXMucnBjU2VydmVyID0gbmV3IFFScGNTZXJ2ZXIoe1xuICAgICAgICAgICAgYXV0aDogdGhpcy5hdXRoLFxuICAgICAgICAgICAgZGI6IHRoaXMuZGIsXG4gICAgICAgICAgICBwb3J0OiBvcHRpb25zLmNvbmZpZy5zZXJ2ZXIucnBjUG9ydCxcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuYWRkRW5kUG9pbnQoe1xuICAgICAgICAgICAgcGF0aDogJy9ncmFwaHFsL21hbScsXG4gICAgICAgICAgICByZXNvbHZlcnM6IHJlc29sdmVyc01hbSxcbiAgICAgICAgICAgIHR5cGVEZWZGaWxlTmFtZXM6IFsndHlwZS1kZWZzLW1hbS5ncmFwaHFsJ10sXG4gICAgICAgICAgICBzdXBwb3J0U3Vic2NyaXB0aW9uczogZmFsc2UsXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmFkZEVuZFBvaW50KHtcbiAgICAgICAgICAgIHBhdGg6ICcvZ3JhcGhxbCcsXG4gICAgICAgICAgICByZXNvbHZlcnM6IGF0dGFjaEN1c3RvbVJlc29sdmVycyhjcmVhdGVSZXNvbHZlcnModGhpcy5kYikpLFxuICAgICAgICAgICAgdHlwZURlZkZpbGVOYW1lczogWyd0eXBlLWRlZnMtZ2VuZXJhdGVkLmdyYXBocWwnLCAndHlwZS1kZWZzLWN1c3RvbS5ncmFwaHFsJ10sXG4gICAgICAgICAgICBzdXBwb3J0U3Vic2NyaXB0aW9uczogdHJ1ZSxcbiAgICAgICAgfSk7XG4gICAgfVxuXG5cbiAgICBhc3luYyBzdGFydCgpIHtcbiAgICAgICAgdGhpcy5jbGllbnQgPSBhd2FpdCBUT05DbGllbnROb2RlSnMuY3JlYXRlKHtzZXJ2ZXJzOiBbJyddfSk7XG4gICAgICAgIGF3YWl0IHRoaXMuZGIuc3RhcnQoKTtcbiAgICAgICAgY29uc3Qge2hvc3QsIHBvcnR9ID0gdGhpcy5jb25maWcuc2VydmVyO1xuICAgICAgICB0aGlzLnNlcnZlci5saXN0ZW4oe1xuICAgICAgICAgICAgaG9zdCxcbiAgICAgICAgICAgIHBvcnQsXG4gICAgICAgIH0sICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuZW5kUG9pbnRzLmZvckVhY2goKGVuZFBvaW50OiBFbmRQb2ludCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMubG9nLmRlYnVnKCdHUkFQSFFMJywgYGh0dHA6Ly8ke2hvc3R9OiR7cG9ydH0ke2VuZFBvaW50LnBhdGh9YCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuc2VydmVyLnNldFRpbWVvdXQoMjE0NzQ4MzY0Nyk7XG5cbiAgICAgICAgaWYgKHRoaXMucnBjU2VydmVyLnBvcnQpIHtcbiAgICAgICAgICAgIHRoaXMucnBjU2VydmVyLnN0YXJ0KCk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIGFkZEVuZFBvaW50KGVuZFBvaW50OiBFbmRQb2ludCkge1xuICAgICAgICBjb25zdCB0eXBlRGVmcyA9IGVuZFBvaW50LnR5cGVEZWZGaWxlTmFtZXNcbiAgICAgICAgICAgIC5tYXAoeCA9PiBmcy5yZWFkRmlsZVN5bmMoeCwgJ3V0Zi04JykpXG4gICAgICAgICAgICAuam9pbignXFxuJyk7XG4gICAgICAgIGNvbnN0IGNvbmZpZzogQXBvbGxvU2VydmVyRXhwcmVzc0NvbmZpZyA9IHtcbiAgICAgICAgICAgIHR5cGVEZWZzLFxuICAgICAgICAgICAgcmVzb2x2ZXJzOiBlbmRQb2ludC5yZXNvbHZlcnMsXG4gICAgICAgICAgICBzdWJzY3JpcHRpb25zOiB7XG4gICAgICAgICAgICAgICAgb25Db25uZWN0KGNvbm5lY3Rpb25QYXJhbXM6IE9iamVjdCwgX3dlYnNvY2tldDogV2ViU29ja2V0LCBfY29udGV4dDogQ29ubmVjdGlvbkNvbnRleHQpOiBhbnkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWNjZXNzS2V5OiBjb25uZWN0aW9uUGFyYW1zLmFjY2Vzc0tleSB8fCBjb25uZWN0aW9uUGFyYW1zLmFjY2Vzc2tleSxcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY29udGV4dDogKHtyZXEsIGNvbm5lY3Rpb259KSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgZGI6IHRoaXMuZGIsXG4gICAgICAgICAgICAgICAgICAgIHRyYWNlcjogdGhpcy50cmFjZXIsXG4gICAgICAgICAgICAgICAgICAgIHN0YXRzOiB0aGlzLnN0YXRzLFxuICAgICAgICAgICAgICAgICAgICBhdXRoOiB0aGlzLmF1dGgsXG4gICAgICAgICAgICAgICAgICAgIGNsaWVudDogdGhpcy5jbGllbnQsXG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZzogdGhpcy5jb25maWcsXG4gICAgICAgICAgICAgICAgICAgIHNoYXJlZDogdGhpcy5zaGFyZWQsXG4gICAgICAgICAgICAgICAgICAgIHJlbW90ZUFkZHJlc3M6IChyZXEgJiYgcmVxLnNvY2tldCAmJiByZXEuc29ja2V0LnJlbW90ZUFkZHJlc3MpIHx8ICcnLFxuICAgICAgICAgICAgICAgICAgICBhY2Nlc3NLZXk6IEF1dGguZXh0cmFjdEFjY2Vzc0tleShyZXEsIGNvbm5lY3Rpb24pLFxuICAgICAgICAgICAgICAgICAgICBwYXJlbnRTcGFuOiBRVHJhY2VyLmV4dHJhY3RQYXJlbnRTcGFuKHRoaXMudHJhY2VyLCBjb25uZWN0aW9uID8gY29ubmVjdGlvbiA6IHJlcSksXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwbHVnaW5zOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICByZXF1ZXN0RGlkU3RhcnQoX3JlcXVlc3RDb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbGxTZW5kUmVzcG9uc2UoY3R4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCA9IGN0eC5jb250ZXh0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29udGV4dC5tdWx0aXBsZUFjY2Vzc0tleXNEZXRlY3RlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgY3JlYXRlRXJyb3IoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgNDAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdSZXF1ZXN0IG11c3QgdXNlIHRoZSBzYW1lIGFjY2VzcyBrZXkgZm9yIGFsbCBxdWVyaWVzIGFuZCBtdXRhdGlvbnMnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IGFwb2xsbyA9IG5ldyBBcG9sbG9TZXJ2ZXIoY29uZmlnKTtcbiAgICAgICAgYXBvbGxvLmFwcGx5TWlkZGxld2FyZSh7XG4gICAgICAgICAgICBhcHA6IHRoaXMuYXBwLFxuICAgICAgICAgICAgcGF0aDogZW5kUG9pbnQucGF0aCxcbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChlbmRQb2ludC5zdXBwb3J0U3Vic2NyaXB0aW9ucykge1xuICAgICAgICAgICAgYXBvbGxvLmluc3RhbGxTdWJzY3JpcHRpb25IYW5kbGVycyh0aGlzLnNlcnZlcik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5lbmRQb2ludHMucHVzaChlbmRQb2ludCk7XG4gICAgfVxuXG5cbn1cblxuIl19