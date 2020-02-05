"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.QTracer = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _noop = require("opentracing/lib/noop");

var _opentracing = require("opentracing");

var _jaegerClient = require("jaeger-client");

var QTracer =
/*#__PURE__*/
function () {
  function QTracer() {
    (0, _classCallCheck2["default"])(this, QTracer);
  }

  (0, _createClass2["default"])(QTracer, null, [{
    key: "create",
    value: function create(config) {
      var endpoint = config.jaeger.endpoint;

      if (!endpoint) {
        return _noop.tracer;
      }

      return (0, _jaegerClient.initTracerFromEnv)({
        serviceName: 'Q Server',
        sampler: {
          type: 'const',
          param: 1
        },
        reporter: {
          collectorEndpoint: endpoint,
          logSpans: true
        }
      }, {
        logger: {
          info: function info(msg) {
            console.log('INFO ', msg);
          },
          error: function error(msg) {
            console.log('ERROR', msg);
          }
        }
      });
    }
  }, {
    key: "extractParentSpan",
    value: function extractParentSpan(tracer, req) {
      var ctx_src, ctx_frm;

      if (req.headers) {
        ctx_src = req.headers;
        ctx_frm = _opentracing.FORMAT_TEXT_MAP;
      } else {
        ctx_src = req.context;
        ctx_frm = _opentracing.FORMAT_BINARY;
      }

      return tracer.extract(ctx_frm, ctx_src);
    }
  }, {
    key: "getParentSpan",
    value: function getParentSpan(tracer, context) {
      return context.tracerParentSpan;
    }
  }, {
    key: "trace",
    value: function () {
      var _trace = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee(tracer, name, f, parentSpan) {
        var span, result;
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                span = tracer.startSpan(name, {
                  childOf: parentSpan
                });
                _context.prev = 1;
                span.setTag(_opentracing.Tags.SPAN_KIND, 'server');
                _context.next = 5;
                return f(span);

              case 5:
                result = _context.sent;

                if (result !== undefined) {
                  span.setTag('result', result);
                }

                span.finish();
                return _context.abrupt("return", result);

              case 11:
                _context.prev = 11;
                _context.t0 = _context["catch"](1);
                span.logEvent('failed', _context.t0);
                span.finish();
                throw _context.t0;

              case 16:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, null, [[1, 11]]);
      }));

      function trace(_x, _x2, _x3, _x4) {
        return _trace.apply(this, arguments);
      }

      return trace;
    }()
  }]);
  return QTracer;
}();

exports.QTracer = QTracer;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci90cmFjZXIuanMiXSwibmFtZXMiOlsiUVRyYWNlciIsImNvbmZpZyIsImVuZHBvaW50IiwiamFlZ2VyIiwibm9vcFRyYWNlciIsInNlcnZpY2VOYW1lIiwic2FtcGxlciIsInR5cGUiLCJwYXJhbSIsInJlcG9ydGVyIiwiY29sbGVjdG9yRW5kcG9pbnQiLCJsb2dTcGFucyIsImxvZ2dlciIsImluZm8iLCJtc2ciLCJjb25zb2xlIiwibG9nIiwiZXJyb3IiLCJ0cmFjZXIiLCJyZXEiLCJjdHhfc3JjIiwiY3R4X2ZybSIsImhlYWRlcnMiLCJGT1JNQVRfVEVYVF9NQVAiLCJjb250ZXh0IiwiRk9STUFUX0JJTkFSWSIsImV4dHJhY3QiLCJ0cmFjZXJQYXJlbnRTcGFuIiwibmFtZSIsImYiLCJwYXJlbnRTcGFuIiwic3BhbiIsInN0YXJ0U3BhbiIsImNoaWxkT2YiLCJzZXRUYWciLCJUYWdzIiwiU1BBTl9LSU5EIiwicmVzdWx0IiwidW5kZWZpbmVkIiwiZmluaXNoIiwibG9nRXZlbnQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBR0E7O0FBQ0E7O0FBRUE7O0lBRWFBLE87Ozs7Ozs7OzsyQkFDS0MsTSxFQUF5QjtBQUNuQyxVQUFNQyxRQUFRLEdBQUdELE1BQU0sQ0FBQ0UsTUFBUCxDQUFjRCxRQUEvQjs7QUFDQSxVQUFJLENBQUNBLFFBQUwsRUFBZTtBQUNYLGVBQU9FLFlBQVA7QUFDSDs7QUFDRCxhQUFPLHFDQUFpQjtBQUNwQkMsUUFBQUEsV0FBVyxFQUFFLFVBRE87QUFFcEJDLFFBQUFBLE9BQU8sRUFBRTtBQUNMQyxVQUFBQSxJQUFJLEVBQUUsT0FERDtBQUVMQyxVQUFBQSxLQUFLLEVBQUU7QUFGRixTQUZXO0FBTXBCQyxRQUFBQSxRQUFRLEVBQUU7QUFDTkMsVUFBQUEsaUJBQWlCLEVBQUVSLFFBRGI7QUFFTlMsVUFBQUEsUUFBUSxFQUFFO0FBRko7QUFOVSxPQUFqQixFQVVKO0FBQ0NDLFFBQUFBLE1BQU0sRUFBRTtBQUNKQyxVQUFBQSxJQURJLGdCQUNDQyxHQURELEVBQ007QUFDTkMsWUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVksT0FBWixFQUFxQkYsR0FBckI7QUFDSCxXQUhHO0FBSUpHLFVBQUFBLEtBSkksaUJBSUVILEdBSkYsRUFJTztBQUNQQyxZQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSxPQUFaLEVBQXFCRixHQUFyQjtBQUNIO0FBTkc7QUFEVCxPQVZJLENBQVA7QUFvQkg7OztzQ0FFd0JJLE0sRUFBZ0JDLEcsRUFBZTtBQUNwRCxVQUFJQyxPQUFKLEVBQWFDLE9BQWI7O0FBQ0EsVUFBSUYsR0FBRyxDQUFDRyxPQUFSLEVBQWlCO0FBQ2JGLFFBQUFBLE9BQU8sR0FBR0QsR0FBRyxDQUFDRyxPQUFkO0FBQ0FELFFBQUFBLE9BQU8sR0FBR0UsNEJBQVY7QUFDSCxPQUhELE1BR087QUFDSEgsUUFBQUEsT0FBTyxHQUFHRCxHQUFHLENBQUNLLE9BQWQ7QUFDQUgsUUFBQUEsT0FBTyxHQUFHSSwwQkFBVjtBQUNIOztBQUNELGFBQU9QLE1BQU0sQ0FBQ1EsT0FBUCxDQUFlTCxPQUFmLEVBQXdCRCxPQUF4QixDQUFQO0FBQ0g7OztrQ0FFb0JGLE0sRUFBZ0JNLE8sRUFBZ0Q7QUFDakYsYUFBT0EsT0FBTyxDQUFDRyxnQkFBZjtBQUNIOzs7Ozs7b0RBR0dULE0sRUFDQVUsSSxFQUNBQyxDLEVBQ0FDLFU7Ozs7OztBQUVNQyxnQkFBQUEsSSxHQUFPYixNQUFNLENBQUNjLFNBQVAsQ0FBaUJKLElBQWpCLEVBQXVCO0FBQUVLLGtCQUFBQSxPQUFPLEVBQUVIO0FBQVgsaUJBQXZCLEM7O0FBRVRDLGdCQUFBQSxJQUFJLENBQUNHLE1BQUwsQ0FBWUMsa0JBQUtDLFNBQWpCLEVBQTRCLFFBQTVCOzt1QkFDcUJQLENBQUMsQ0FBQ0UsSUFBRCxDOzs7QUFBaEJNLGdCQUFBQSxNOztBQUNOLG9CQUFJQSxNQUFNLEtBQUtDLFNBQWYsRUFBMEI7QUFDdEJQLGtCQUFBQSxJQUFJLENBQUNHLE1BQUwsQ0FBWSxRQUFaLEVBQXNCRyxNQUF0QjtBQUNIOztBQUNETixnQkFBQUEsSUFBSSxDQUFDUSxNQUFMO2lEQUNPRixNOzs7OztBQUVQTixnQkFBQUEsSUFBSSxDQUFDUyxRQUFMLENBQWMsUUFBZDtBQUNBVCxnQkFBQUEsSUFBSSxDQUFDUSxNQUFMIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQGZsb3dcblxuaW1wb3J0IHR5cGUgeyBRQ29uZmlnIH0gZnJvbSBcIi4vY29uZmlnXCI7XG5pbXBvcnQgeyB0cmFjZXIgYXMgbm9vcFRyYWNlciB9IGZyb20gXCJvcGVudHJhY2luZy9saWIvbm9vcFwiO1xuaW1wb3J0IHsgVHJhY2VyLCBUYWdzLCBGT1JNQVRfVEVYVF9NQVAsIEZPUk1BVF9CSU5BUlksIFNwYW4sIFNwYW5Db250ZXh0IH0gZnJvbSBcIm9wZW50cmFjaW5nXCI7XG5cbmltcG9ydCB7IGluaXRUcmFjZXJGcm9tRW52IGFzIGluaXRKYWVnZXJUcmFjZXIgfSBmcm9tICdqYWVnZXItY2xpZW50JztcblxuZXhwb3J0IGNsYXNzIFFUcmFjZXIge1xuICAgIHN0YXRpYyBjcmVhdGUoY29uZmlnOiBRQ29uZmlnKTogVHJhY2VyIHtcbiAgICAgICAgY29uc3QgZW5kcG9pbnQgPSBjb25maWcuamFlZ2VyLmVuZHBvaW50O1xuICAgICAgICBpZiAoIWVuZHBvaW50KSB7XG4gICAgICAgICAgICByZXR1cm4gbm9vcFRyYWNlcjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaW5pdEphZWdlclRyYWNlcih7XG4gICAgICAgICAgICBzZXJ2aWNlTmFtZTogJ1EgU2VydmVyJyxcbiAgICAgICAgICAgIHNhbXBsZXI6IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnY29uc3QnLFxuICAgICAgICAgICAgICAgIHBhcmFtOiAxLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlcG9ydGVyOiB7XG4gICAgICAgICAgICAgICAgY29sbGVjdG9yRW5kcG9pbnQ6IGVuZHBvaW50LFxuICAgICAgICAgICAgICAgIGxvZ1NwYW5zOiB0cnVlLFxuICAgICAgICAgICAgfVxuICAgICAgICB9LCB7XG4gICAgICAgICAgICBsb2dnZXI6IHtcbiAgICAgICAgICAgICAgICBpbmZvKG1zZykge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnSU5GTyAnLCBtc2cpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZXJyb3IobXNnKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdFUlJPUicsIG1zZyk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHN0YXRpYyBleHRyYWN0UGFyZW50U3Bhbih0cmFjZXI6IFRyYWNlciwgcmVxOiBhbnkpOiBhbnkge1xuICAgICAgICBsZXQgY3R4X3NyYywgY3R4X2ZybTtcbiAgICAgICAgaWYgKHJlcS5oZWFkZXJzKSB7XG4gICAgICAgICAgICBjdHhfc3JjID0gcmVxLmhlYWRlcnM7XG4gICAgICAgICAgICBjdHhfZnJtID0gRk9STUFUX1RFWFRfTUFQO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY3R4X3NyYyA9IHJlcS5jb250ZXh0O1xuICAgICAgICAgICAgY3R4X2ZybSA9IEZPUk1BVF9CSU5BUlk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRyYWNlci5leHRyYWN0KGN0eF9mcm0sIGN0eF9zcmMpO1xuICAgIH1cblxuICAgIHN0YXRpYyBnZXRQYXJlbnRTcGFuKHRyYWNlcjogVHJhY2VyLCBjb250ZXh0OiBhbnkpOiAoU3BhbkNvbnRleHQgfCB0eXBlb2YgdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBjb250ZXh0LnRyYWNlclBhcmVudFNwYW47XG4gICAgfVxuXG4gICAgc3RhdGljIGFzeW5jIHRyYWNlPFQ+KFxuICAgICAgICB0cmFjZXI6IFRyYWNlcixcbiAgICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgICBmOiAoc3BhbjogU3BhbikgPT4gUHJvbWlzZTxUPixcbiAgICAgICAgcGFyZW50U3Bhbj86IChTcGFuIHwgU3BhbkNvbnRleHQpXG4gICAgKTogUHJvbWlzZTxUPiB7XG4gICAgICAgIGNvbnN0IHNwYW4gPSB0cmFjZXIuc3RhcnRTcGFuKG5hbWUsIHsgY2hpbGRPZjogcGFyZW50U3BhbiB9KTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHNwYW4uc2V0VGFnKFRhZ3MuU1BBTl9LSU5ELCAnc2VydmVyJyk7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBmKHNwYW4pO1xuICAgICAgICAgICAgaWYgKHJlc3VsdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgc3Bhbi5zZXRUYWcoJ3Jlc3VsdCcsIHJlc3VsdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzcGFuLmZpbmlzaCgpO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIHNwYW4ubG9nRXZlbnQoJ2ZhaWxlZCcsIGVycm9yKTtcbiAgICAgICAgICAgIHNwYW4uZmluaXNoKCk7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfVxuICAgIH1cbn1cbiJdfQ==