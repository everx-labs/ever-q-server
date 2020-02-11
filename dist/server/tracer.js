"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.QTracer = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

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
      QTracer.config = config;
      var endpoint = config.jaeger.endpoint;

      if (!endpoint) {
        return _noop.tracer;
      }

      return (0, _jaegerClient.initTracerFromEnv)({
        serviceName: config.jaeger.service,
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
    key: "failed",
    value: function failed(tracer, span, error) {
      span.log({
        event: 'failed',
        payload: error
      });
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
                Object.entries(QTracer.config.jaeger.tags).forEach(function (_ref) {
                  var _ref2 = (0, _slicedToArray2["default"])(_ref, 2),
                      name = _ref2[0],
                      value = _ref2[1];

                  span.setTag(name, value);
                });
                _context.next = 6;
                return f(span);

              case 6:
                result = _context.sent;

                if (result !== undefined) {
                  span.setTag('result', result);
                }

                span.finish();
                return _context.abrupt("return", result);

              case 12:
                _context.prev = 12;
                _context.t0 = _context["catch"](1);
                QTracer.failed(tracer, span, _context.t0);
                span.finish();
                throw _context.t0;

              case 17:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, null, [[1, 12]]);
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
(0, _defineProperty2["default"])(QTracer, "config", void 0);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci90cmFjZXIuanMiXSwibmFtZXMiOlsiUVRyYWNlciIsImNvbmZpZyIsImVuZHBvaW50IiwiamFlZ2VyIiwibm9vcFRyYWNlciIsInNlcnZpY2VOYW1lIiwic2VydmljZSIsInNhbXBsZXIiLCJ0eXBlIiwicGFyYW0iLCJyZXBvcnRlciIsImNvbGxlY3RvckVuZHBvaW50IiwibG9nU3BhbnMiLCJsb2dnZXIiLCJpbmZvIiwibXNnIiwiY29uc29sZSIsImxvZyIsImVycm9yIiwidHJhY2VyIiwicmVxIiwiY3R4X3NyYyIsImN0eF9mcm0iLCJoZWFkZXJzIiwiRk9STUFUX1RFWFRfTUFQIiwiY29udGV4dCIsIkZPUk1BVF9CSU5BUlkiLCJleHRyYWN0IiwidHJhY2VyUGFyZW50U3BhbiIsInNwYW4iLCJldmVudCIsInBheWxvYWQiLCJuYW1lIiwiZiIsInBhcmVudFNwYW4iLCJzdGFydFNwYW4iLCJjaGlsZE9mIiwic2V0VGFnIiwiVGFncyIsIlNQQU5fS0lORCIsIk9iamVjdCIsImVudHJpZXMiLCJ0YWdzIiwiZm9yRWFjaCIsInZhbHVlIiwicmVzdWx0IiwidW5kZWZpbmVkIiwiZmluaXNoIiwiZmFpbGVkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFHQTs7QUFDQTs7QUFFQTs7SUFFYUEsTzs7Ozs7Ozs7OzJCQUVLQyxNLEVBQXlCO0FBQ25DRCxNQUFBQSxPQUFPLENBQUNDLE1BQVIsR0FBaUJBLE1BQWpCO0FBQ0EsVUFBTUMsUUFBUSxHQUFHRCxNQUFNLENBQUNFLE1BQVAsQ0FBY0QsUUFBL0I7O0FBQ0EsVUFBSSxDQUFDQSxRQUFMLEVBQWU7QUFDWCxlQUFPRSxZQUFQO0FBQ0g7O0FBQ0QsYUFBTyxxQ0FBaUI7QUFDcEJDLFFBQUFBLFdBQVcsRUFBRUosTUFBTSxDQUFDRSxNQUFQLENBQWNHLE9BRFA7QUFFcEJDLFFBQUFBLE9BQU8sRUFBRTtBQUNMQyxVQUFBQSxJQUFJLEVBQUUsT0FERDtBQUVMQyxVQUFBQSxLQUFLLEVBQUU7QUFGRixTQUZXO0FBTXBCQyxRQUFBQSxRQUFRLEVBQUU7QUFDTkMsVUFBQUEsaUJBQWlCLEVBQUVULFFBRGI7QUFFTlUsVUFBQUEsUUFBUSxFQUFFO0FBRko7QUFOVSxPQUFqQixFQVVKO0FBQ0NDLFFBQUFBLE1BQU0sRUFBRTtBQUNKQyxVQUFBQSxJQURJLGdCQUNDQyxHQURELEVBQ007QUFDTkMsWUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVksT0FBWixFQUFxQkYsR0FBckI7QUFDSCxXQUhHO0FBSUpHLFVBQUFBLEtBSkksaUJBSUVILEdBSkYsRUFJTztBQUNQQyxZQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSxPQUFaLEVBQXFCRixHQUFyQjtBQUNIO0FBTkc7QUFEVCxPQVZJLENBQVA7QUFvQkg7OztzQ0FFd0JJLE0sRUFBZ0JDLEcsRUFBZTtBQUNwRCxVQUFJQyxPQUFKLEVBQWFDLE9BQWI7O0FBQ0EsVUFBSUYsR0FBRyxDQUFDRyxPQUFSLEVBQWlCO0FBQ2JGLFFBQUFBLE9BQU8sR0FBR0QsR0FBRyxDQUFDRyxPQUFkO0FBQ0FELFFBQUFBLE9BQU8sR0FBR0UsNEJBQVY7QUFDSCxPQUhELE1BR087QUFDSEgsUUFBQUEsT0FBTyxHQUFHRCxHQUFHLENBQUNLLE9BQWQ7QUFDQUgsUUFBQUEsT0FBTyxHQUFHSSwwQkFBVjtBQUNIOztBQUNELGFBQU9QLE1BQU0sQ0FBQ1EsT0FBUCxDQUFlTCxPQUFmLEVBQXdCRCxPQUF4QixDQUFQO0FBQ0g7OztrQ0FFb0JGLE0sRUFBZ0JNLE8sRUFBZ0Q7QUFDakYsYUFBT0EsT0FBTyxDQUFDRyxnQkFBZjtBQUNIOzs7MkJBRWFULE0sRUFBZ0JVLEksRUFBWVgsSyxFQUFZO0FBQ2xEVyxNQUFBQSxJQUFJLENBQUNaLEdBQUwsQ0FBUztBQUFFYSxRQUFBQSxLQUFLLEVBQUUsUUFBVDtBQUFtQkMsUUFBQUEsT0FBTyxFQUFFYjtBQUE1QixPQUFUO0FBQ0g7Ozs7OztvREFHR0MsTSxFQUNBYSxJLEVBQ0FDLEMsRUFDQUMsVTs7Ozs7O0FBRU1MLGdCQUFBQSxJLEdBQU9WLE1BQU0sQ0FBQ2dCLFNBQVAsQ0FBaUJILElBQWpCLEVBQXVCO0FBQUVJLGtCQUFBQSxPQUFPLEVBQUVGO0FBQVgsaUJBQXZCLEM7O0FBRVRMLGdCQUFBQSxJQUFJLENBQUNRLE1BQUwsQ0FBWUMsa0JBQUtDLFNBQWpCLEVBQTRCLFFBQTVCO0FBQ0FDLGdCQUFBQSxNQUFNLENBQUNDLE9BQVAsQ0FBZXpDLE9BQU8sQ0FBQ0MsTUFBUixDQUFlRSxNQUFmLENBQXNCdUMsSUFBckMsRUFBMkNDLE9BQTNDLENBQW1ELGdCQUFtQjtBQUFBO0FBQUEsc0JBQWpCWCxJQUFpQjtBQUFBLHNCQUFYWSxLQUFXOztBQUNsRWYsa0JBQUFBLElBQUksQ0FBQ1EsTUFBTCxDQUFZTCxJQUFaLEVBQWtCWSxLQUFsQjtBQUNILGlCQUZEOzt1QkFHcUJYLENBQUMsQ0FBQ0osSUFBRCxDOzs7QUFBaEJnQixnQkFBQUEsTTs7QUFDTixvQkFBSUEsTUFBTSxLQUFLQyxTQUFmLEVBQTBCO0FBQ3RCakIsa0JBQUFBLElBQUksQ0FBQ1EsTUFBTCxDQUFZLFFBQVosRUFBc0JRLE1BQXRCO0FBQ0g7O0FBQ0RoQixnQkFBQUEsSUFBSSxDQUFDa0IsTUFBTDtpREFDT0YsTTs7Ozs7QUFFUDdDLGdCQUFBQSxPQUFPLENBQUNnRCxNQUFSLENBQWU3QixNQUFmLEVBQXVCVSxJQUF2QjtBQUNBQSxnQkFBQUEsSUFBSSxDQUFDa0IsTUFBTDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztpQ0F0RUMvQyxPIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQGZsb3dcblxuaW1wb3J0IHR5cGUgeyBRQ29uZmlnIH0gZnJvbSBcIi4vY29uZmlnXCI7XG5pbXBvcnQgeyB0cmFjZXIgYXMgbm9vcFRyYWNlciB9IGZyb20gXCJvcGVudHJhY2luZy9saWIvbm9vcFwiO1xuaW1wb3J0IHsgVHJhY2VyLCBUYWdzLCBGT1JNQVRfVEVYVF9NQVAsIEZPUk1BVF9CSU5BUlksIFNwYW4sIFNwYW5Db250ZXh0IH0gZnJvbSBcIm9wZW50cmFjaW5nXCI7XG5cbmltcG9ydCB7IGluaXRUcmFjZXJGcm9tRW52IGFzIGluaXRKYWVnZXJUcmFjZXIgfSBmcm9tICdqYWVnZXItY2xpZW50JztcblxuZXhwb3J0IGNsYXNzIFFUcmFjZXIge1xuICAgIHN0YXRpYyBjb25maWc6IFFDb25maWc7XG4gICAgc3RhdGljIGNyZWF0ZShjb25maWc6IFFDb25maWcpOiBUcmFjZXIge1xuICAgICAgICBRVHJhY2VyLmNvbmZpZyA9IGNvbmZpZztcbiAgICAgICAgY29uc3QgZW5kcG9pbnQgPSBjb25maWcuamFlZ2VyLmVuZHBvaW50O1xuICAgICAgICBpZiAoIWVuZHBvaW50KSB7XG4gICAgICAgICAgICByZXR1cm4gbm9vcFRyYWNlcjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaW5pdEphZWdlclRyYWNlcih7XG4gICAgICAgICAgICBzZXJ2aWNlTmFtZTogY29uZmlnLmphZWdlci5zZXJ2aWNlLFxuICAgICAgICAgICAgc2FtcGxlcjoge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdjb25zdCcsXG4gICAgICAgICAgICAgICAgcGFyYW06IDEsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVwb3J0ZXI6IHtcbiAgICAgICAgICAgICAgICBjb2xsZWN0b3JFbmRwb2ludDogZW5kcG9pbnQsXG4gICAgICAgICAgICAgICAgbG9nU3BhbnM6IHRydWUsXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHtcbiAgICAgICAgICAgIGxvZ2dlcjoge1xuICAgICAgICAgICAgICAgIGluZm8obXNnKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdJTkZPICcsIG1zZyk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBlcnJvcihtc2cpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0VSUk9SJywgbXNnKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgc3RhdGljIGV4dHJhY3RQYXJlbnRTcGFuKHRyYWNlcjogVHJhY2VyLCByZXE6IGFueSk6IGFueSB7XG4gICAgICAgIGxldCBjdHhfc3JjLCBjdHhfZnJtO1xuICAgICAgICBpZiAocmVxLmhlYWRlcnMpIHtcbiAgICAgICAgICAgIGN0eF9zcmMgPSByZXEuaGVhZGVycztcbiAgICAgICAgICAgIGN0eF9mcm0gPSBGT1JNQVRfVEVYVF9NQVA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjdHhfc3JjID0gcmVxLmNvbnRleHQ7XG4gICAgICAgICAgICBjdHhfZnJtID0gRk9STUFUX0JJTkFSWTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJhY2VyLmV4dHJhY3QoY3R4X2ZybSwgY3R4X3NyYyk7XG4gICAgfVxuXG4gICAgc3RhdGljIGdldFBhcmVudFNwYW4odHJhY2VyOiBUcmFjZXIsIGNvbnRleHQ6IGFueSk6IChTcGFuQ29udGV4dCB8IHR5cGVvZiB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIGNvbnRleHQudHJhY2VyUGFyZW50U3BhbjtcbiAgICB9XG5cbiAgICBzdGF0aWMgZmFpbGVkKHRyYWNlcjogVHJhY2VyLCBzcGFuOiBTcGFuLCBlcnJvcjogYW55KSB7XG4gICAgICAgIHNwYW4ubG9nKHsgZXZlbnQ6ICdmYWlsZWQnLCBwYXlsb2FkOiBlcnJvciB9KTtcbiAgICB9XG5cbiAgICBzdGF0aWMgYXN5bmMgdHJhY2U8VD4oXG4gICAgICAgIHRyYWNlcjogVHJhY2VyLFxuICAgICAgICBuYW1lOiBzdHJpbmcsXG4gICAgICAgIGY6IChzcGFuOiBTcGFuKSA9PiBQcm9taXNlPFQ+LFxuICAgICAgICBwYXJlbnRTcGFuPzogKFNwYW4gfCBTcGFuQ29udGV4dClcbiAgICApOiBQcm9taXNlPFQ+IHtcbiAgICAgICAgY29uc3Qgc3BhbiA9IHRyYWNlci5zdGFydFNwYW4obmFtZSwgeyBjaGlsZE9mOiBwYXJlbnRTcGFuIH0pO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgc3Bhbi5zZXRUYWcoVGFncy5TUEFOX0tJTkQsICdzZXJ2ZXInKTtcbiAgICAgICAgICAgIE9iamVjdC5lbnRyaWVzKFFUcmFjZXIuY29uZmlnLmphZWdlci50YWdzKS5mb3JFYWNoKChbbmFtZSwgdmFsdWVdKSA9PiB7XG4gICAgICAgICAgICAgICAgc3Bhbi5zZXRUYWcobmFtZSwgdmFsdWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBmKHNwYW4pO1xuICAgICAgICAgICAgaWYgKHJlc3VsdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgc3Bhbi5zZXRUYWcoJ3Jlc3VsdCcsIHJlc3VsdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzcGFuLmZpbmlzaCgpO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIFFUcmFjZXIuZmFpbGVkKHRyYWNlciwgc3BhbiwgZXJyb3IpO1xuICAgICAgICAgICAgc3Bhbi5maW5pc2goKTtcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9XG4gICAgfVxufVxuIl19