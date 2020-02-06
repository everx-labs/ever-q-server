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
    key: "createContext",
    value: function createContext(tracer, req) {
      var ctx_src, ctx_frm;

      if (req.headers) {
        ctx_src = req.headers;
        ctx_frm = _opentracing.FORMAT_TEXT_MAP;
      } else {
        ctx_src = req.context;
        ctx_frm = _opentracing.FORMAT_BINARY;
      }

      return {
        tracer: tracer.extract(ctx_frm, ctx_src)
      };
    }
  }, {
    key: "getParentSpan",
    value: function getParentSpan(tracer, context) {
      return context.tracer;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci90cmFjZXIuanMiXSwibmFtZXMiOlsiUVRyYWNlciIsImNvbmZpZyIsImVuZHBvaW50IiwiamFlZ2VyIiwibm9vcFRyYWNlciIsInNlcnZpY2VOYW1lIiwic2FtcGxlciIsInR5cGUiLCJwYXJhbSIsInJlcG9ydGVyIiwiY29sbGVjdG9yRW5kcG9pbnQiLCJsb2dTcGFucyIsImxvZ2dlciIsImluZm8iLCJtc2ciLCJjb25zb2xlIiwibG9nIiwiZXJyb3IiLCJ0cmFjZXIiLCJyZXEiLCJjdHhfc3JjIiwiY3R4X2ZybSIsImhlYWRlcnMiLCJGT1JNQVRfVEVYVF9NQVAiLCJjb250ZXh0IiwiRk9STUFUX0JJTkFSWSIsImV4dHJhY3QiLCJuYW1lIiwiZiIsInBhcmVudFNwYW4iLCJzcGFuIiwic3RhcnRTcGFuIiwiY2hpbGRPZiIsInNldFRhZyIsIlRhZ3MiLCJTUEFOX0tJTkQiLCJyZXN1bHQiLCJ1bmRlZmluZWQiLCJmaW5pc2giLCJsb2dFdmVudCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFHQTs7QUFDQTs7QUFFQTs7SUFFYUEsTzs7Ozs7Ozs7OzJCQUNLQyxNLEVBQXlCO0FBQ25DLFVBQU1DLFFBQVEsR0FBR0QsTUFBTSxDQUFDRSxNQUFQLENBQWNELFFBQS9COztBQUNBLFVBQUksQ0FBQ0EsUUFBTCxFQUFlO0FBQ1gsZUFBT0UsWUFBUDtBQUNIOztBQUNELGFBQU8scUNBQWlCO0FBQ3BCQyxRQUFBQSxXQUFXLEVBQUUsVUFETztBQUVwQkMsUUFBQUEsT0FBTyxFQUFFO0FBQ0xDLFVBQUFBLElBQUksRUFBRSxPQUREO0FBRUxDLFVBQUFBLEtBQUssRUFBRTtBQUZGLFNBRlc7QUFNcEJDLFFBQUFBLFFBQVEsRUFBRTtBQUNOQyxVQUFBQSxpQkFBaUIsRUFBRVIsUUFEYjtBQUVOUyxVQUFBQSxRQUFRLEVBQUU7QUFGSjtBQU5VLE9BQWpCLEVBVUo7QUFDQ0MsUUFBQUEsTUFBTSxFQUFFO0FBQ0pDLFVBQUFBLElBREksZ0JBQ0NDLEdBREQsRUFDTTtBQUNOQyxZQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSxPQUFaLEVBQXFCRixHQUFyQjtBQUNILFdBSEc7QUFJSkcsVUFBQUEsS0FKSSxpQkFJRUgsR0FKRixFQUlPO0FBQ1BDLFlBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLE9BQVosRUFBcUJGLEdBQXJCO0FBQ0g7QUFORztBQURULE9BVkksQ0FBUDtBQW9CSDs7O2tDQUVvQkksTSxFQUFnQkMsRyxFQUFlO0FBQ2hELFVBQUlDLE9BQUosRUFBYUMsT0FBYjs7QUFDQSxVQUFJRixHQUFHLENBQUNHLE9BQVIsRUFBaUI7QUFDYkYsUUFBQUEsT0FBTyxHQUFHRCxHQUFHLENBQUNHLE9BQWQ7QUFDQUQsUUFBQUEsT0FBTyxHQUFHRSw0QkFBVjtBQUNILE9BSEQsTUFHTztBQUNISCxRQUFBQSxPQUFPLEdBQUdELEdBQUcsQ0FBQ0ssT0FBZDtBQUNBSCxRQUFBQSxPQUFPLEdBQUdJLDBCQUFWO0FBQ0g7O0FBQ0QsYUFBTztBQUNIUCxRQUFBQSxNQUFNLEVBQUVBLE1BQU0sQ0FBQ1EsT0FBUCxDQUFlTCxPQUFmLEVBQXdCRCxPQUF4QjtBQURMLE9BQVA7QUFHSDs7O2tDQUVvQkYsTSxFQUFnQk0sTyxFQUFnRDtBQUNqRixhQUFPQSxPQUFPLENBQUNOLE1BQWY7QUFDSDs7Ozs7O29EQUdHQSxNLEVBQ0FTLEksRUFDQUMsQyxFQUNBQyxVOzs7Ozs7QUFFTUMsZ0JBQUFBLEksR0FBT1osTUFBTSxDQUFDYSxTQUFQLENBQWlCSixJQUFqQixFQUF1QjtBQUFFSyxrQkFBQUEsT0FBTyxFQUFFSDtBQUFYLGlCQUF2QixDOztBQUVUQyxnQkFBQUEsSUFBSSxDQUFDRyxNQUFMLENBQVlDLGtCQUFLQyxTQUFqQixFQUE0QixRQUE1Qjs7dUJBQ3FCUCxDQUFDLENBQUNFLElBQUQsQzs7O0FBQWhCTSxnQkFBQUEsTTs7QUFDTixvQkFBSUEsTUFBTSxLQUFLQyxTQUFmLEVBQTBCO0FBQ3RCUCxrQkFBQUEsSUFBSSxDQUFDRyxNQUFMLENBQVksUUFBWixFQUFzQkcsTUFBdEI7QUFDSDs7QUFDRE4sZ0JBQUFBLElBQUksQ0FBQ1EsTUFBTDtpREFDT0YsTTs7Ozs7QUFFUE4sZ0JBQUFBLElBQUksQ0FBQ1MsUUFBTCxDQUFjLFFBQWQ7QUFDQVQsZ0JBQUFBLElBQUksQ0FBQ1EsTUFBTCIsInNvdXJjZXNDb250ZW50IjpbIi8vIEBmbG93XG5cbmltcG9ydCB0eXBlIHsgUUNvbmZpZyB9IGZyb20gXCIuL2NvbmZpZ1wiO1xuaW1wb3J0IHsgdHJhY2VyIGFzIG5vb3BUcmFjZXIgfSBmcm9tIFwib3BlbnRyYWNpbmcvbGliL25vb3BcIjtcbmltcG9ydCB7IFRyYWNlciwgVGFncywgRk9STUFUX1RFWFRfTUFQLCBGT1JNQVRfQklOQVJZLCBTcGFuLCBTcGFuQ29udGV4dCB9IGZyb20gXCJvcGVudHJhY2luZ1wiO1xuXG5pbXBvcnQgeyBpbml0VHJhY2VyRnJvbUVudiBhcyBpbml0SmFlZ2VyVHJhY2VyIH0gZnJvbSAnamFlZ2VyLWNsaWVudCc7XG5cbmV4cG9ydCBjbGFzcyBRVHJhY2VyIHtcbiAgICBzdGF0aWMgY3JlYXRlKGNvbmZpZzogUUNvbmZpZyk6IFRyYWNlciB7XG4gICAgICAgIGNvbnN0IGVuZHBvaW50ID0gY29uZmlnLmphZWdlci5lbmRwb2ludDtcbiAgICAgICAgaWYgKCFlbmRwb2ludCkge1xuICAgICAgICAgICAgcmV0dXJuIG5vb3BUcmFjZXI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGluaXRKYWVnZXJUcmFjZXIoe1xuICAgICAgICAgICAgc2VydmljZU5hbWU6ICdRIFNlcnZlcicsXG4gICAgICAgICAgICBzYW1wbGVyOiB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ2NvbnN0JyxcbiAgICAgICAgICAgICAgICBwYXJhbTogMSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZXBvcnRlcjoge1xuICAgICAgICAgICAgICAgIGNvbGxlY3RvckVuZHBvaW50OiBlbmRwb2ludCxcbiAgICAgICAgICAgICAgICBsb2dTcGFuczogdHJ1ZSxcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwge1xuICAgICAgICAgICAgbG9nZ2VyOiB7XG4gICAgICAgICAgICAgICAgaW5mbyhtc2cpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0lORk8gJywgbXNnKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGVycm9yKG1zZykge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnRVJST1InLCBtc2cpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBzdGF0aWMgY3JlYXRlQ29udGV4dCh0cmFjZXI6IFRyYWNlciwgcmVxOiBhbnkpOiBhbnkge1xuICAgICAgICBsZXQgY3R4X3NyYywgY3R4X2ZybTtcbiAgICAgICAgaWYgKHJlcS5oZWFkZXJzKSB7XG4gICAgICAgICAgICBjdHhfc3JjID0gcmVxLmhlYWRlcnM7XG4gICAgICAgICAgICBjdHhfZnJtID0gRk9STUFUX1RFWFRfTUFQO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY3R4X3NyYyA9IHJlcS5jb250ZXh0O1xuICAgICAgICAgICAgY3R4X2ZybSA9IEZPUk1BVF9CSU5BUlk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHRyYWNlcjogdHJhY2VyLmV4dHJhY3QoY3R4X2ZybSwgY3R4X3NyYyksXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0UGFyZW50U3Bhbih0cmFjZXI6IFRyYWNlciwgY29udGV4dDogYW55KTogKFNwYW5Db250ZXh0IHwgdHlwZW9mIHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gY29udGV4dC50cmFjZXI7XG4gICAgfVxuXG4gICAgc3RhdGljIGFzeW5jIHRyYWNlPFQ+KFxuICAgICAgICB0cmFjZXI6IFRyYWNlcixcbiAgICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgICBmOiAoc3BhbjogU3BhbikgPT4gUHJvbWlzZTxUPixcbiAgICAgICAgcGFyZW50U3Bhbj86IChTcGFuIHwgU3BhbkNvbnRleHQpXG4gICAgKTogUHJvbWlzZTxUPiB7XG4gICAgICAgIGNvbnN0IHNwYW4gPSB0cmFjZXIuc3RhcnRTcGFuKG5hbWUsIHsgY2hpbGRPZjogcGFyZW50U3BhbiB9KTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHNwYW4uc2V0VGFnKFRhZ3MuU1BBTl9LSU5ELCAnc2VydmVyJyk7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBmKHNwYW4pO1xuICAgICAgICAgICAgaWYgKHJlc3VsdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgc3Bhbi5zZXRUYWcoJ3Jlc3VsdCcsIHJlc3VsdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzcGFuLmZpbmlzaCgpO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIHNwYW4ubG9nRXZlbnQoJ2ZhaWxlZCcsIGVycm9yKTtcbiAgICAgICAgICAgIHNwYW4uZmluaXNoKCk7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfVxuICAgIH1cbn1cbiJdfQ==