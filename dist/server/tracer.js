"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Tracer = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _opentracing = require("opentracing");

var initJaegerTracer = require('jaeger-client').initTracerFromEnv;

var _require = require('opentracing'),
    Tags = _require.Tags,
    FORMAT_TEXT_MAP = _require.FORMAT_TEXT_MAP;

var missingSpan = {
  log: function log(_options) {
    return Promise.resolve();
  },
  finish: function finish() {
    return Promise.resolve();
  }
};

var Tracer =
/*#__PURE__*/
function () {
  function Tracer(config) {
    (0, _classCallCheck2["default"])(this, Tracer);
    (0, _defineProperty2["default"])(this, "jaeger", void 0);
    var endpoint = config.jaeger.endpoint;

    if (!endpoint) {
      this.jaeger = null;
      return;
    }

    this.jaeger = initJaegerTracer({
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

  (0, _createClass2["default"])(Tracer, [{
    key: "getContext",
    value: function getContext(req) {
      var ctx_src, ctx_frm;

      if (req.headers) {
        ctx_src = req.headers;
        ctx_frm = FORMAT_TEXT_MAP;
      } else {
        ctx_src = req.context;
        ctx_frm = _opentracing.FORMAT_BINARY;
      }

      return this.jaeger ? {
        tracer_ctx: this.jaeger.extract(ctx_frm, ctx_src)
      } : {};
    }
  }, {
    key: "startSpan",
    value: function () {
      var _startSpan = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee(context, name) {
        var jaeger, span;
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                jaeger = this.jaeger;

                if (jaeger) {
                  _context.next = 3;
                  break;
                }

                return _context.abrupt("return", missingSpan);

              case 3:
                _context.next = 5;
                return jaeger.startSpan(name, {
                  childOf: context.tracer_ctx
                });

              case 5:
                span = _context.sent;
                _context.next = 8;
                return span.setTag(Tags.SPAN_KIND, 'server');

              case 8:
                return _context.abrupt("return", span);

              case 9:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function startSpan(_x, _x2) {
        return _startSpan.apply(this, arguments);
      }

      return startSpan;
    }()
  }, {
    key: "startSpanLog",
    value: function () {
      var _startSpanLog = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee2(context, name, event, value) {
        var jaeger, span;
        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                jaeger = this.jaeger;

                if (jaeger) {
                  _context2.next = 3;
                  break;
                }

                return _context2.abrupt("return", missingSpan);

              case 3:
                _context2.next = 5;
                return jaeger.startSpan(name, {
                  childOf: context.tracer_ctx
                });

              case 5:
                span = _context2.sent;
                _context2.next = 8;
                return span.setTag(Tags.SPAN_KIND, 'server');

              case 8:
                _context2.next = 10;
                return span.log({
                  event: event,
                  value: value
                });

              case 10:
                return _context2.abrupt("return", span);

              case 11:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function startSpanLog(_x3, _x4, _x5, _x6) {
        return _startSpanLog.apply(this, arguments);
      }

      return startSpanLog;
    }()
  }]);
  return Tracer;
}();

exports.Tracer = Tracer;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci90cmFjZXIuanMiXSwibmFtZXMiOlsiaW5pdEphZWdlclRyYWNlciIsInJlcXVpcmUiLCJpbml0VHJhY2VyRnJvbUVudiIsIlRhZ3MiLCJGT1JNQVRfVEVYVF9NQVAiLCJtaXNzaW5nU3BhbiIsImxvZyIsIl9vcHRpb25zIiwiUHJvbWlzZSIsInJlc29sdmUiLCJmaW5pc2giLCJUcmFjZXIiLCJjb25maWciLCJlbmRwb2ludCIsImphZWdlciIsInNlcnZpY2VOYW1lIiwic2FtcGxlciIsInR5cGUiLCJwYXJhbSIsInJlcG9ydGVyIiwiY29sbGVjdG9yRW5kcG9pbnQiLCJsb2dTcGFucyIsImxvZ2dlciIsImluZm8iLCJtc2ciLCJjb25zb2xlIiwiZXJyb3IiLCJyZXEiLCJjdHhfc3JjIiwiY3R4X2ZybSIsImhlYWRlcnMiLCJjb250ZXh0IiwiRk9STUFUX0JJTkFSWSIsInRyYWNlcl9jdHgiLCJleHRyYWN0IiwibmFtZSIsInN0YXJ0U3BhbiIsImNoaWxkT2YiLCJzcGFuIiwic2V0VGFnIiwiU1BBTl9LSU5EIiwiZXZlbnQiLCJ2YWx1ZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUdBOztBQUVBLElBQU1BLGdCQUFnQixHQUFHQyxPQUFPLENBQUMsZUFBRCxDQUFQLENBQXlCQyxpQkFBbEQ7O2VBQ2tDRCxPQUFPLENBQUMsYUFBRCxDO0lBQWpDRSxJLFlBQUFBLEk7SUFBTUMsZSxZQUFBQSxlOztBQXFCZCxJQUFNQyxXQUF1QixHQUFHO0FBQzVCQyxFQUFBQSxHQUQ0QixlQUN4QkMsUUFEd0IsRUFDZ0M7QUFDeEQsV0FBT0MsT0FBTyxDQUFDQyxPQUFSLEVBQVA7QUFDSCxHQUgyQjtBQUk1QkMsRUFBQUEsTUFKNEIsb0JBSUo7QUFDcEIsV0FBT0YsT0FBTyxDQUFDQyxPQUFSLEVBQVA7QUFDSDtBQU4yQixDQUFoQzs7SUFTYUUsTTs7O0FBR1Qsa0JBQVlDLE1BQVosRUFBNkI7QUFBQTtBQUFBO0FBQ3pCLFFBQU1DLFFBQVEsR0FBR0QsTUFBTSxDQUFDRSxNQUFQLENBQWNELFFBQS9COztBQUNBLFFBQUksQ0FBQ0EsUUFBTCxFQUFlO0FBQ1gsV0FBS0MsTUFBTCxHQUFjLElBQWQ7QUFDQTtBQUNIOztBQUNELFNBQUtBLE1BQUwsR0FBY2QsZ0JBQWdCLENBQUM7QUFDM0JlLE1BQUFBLFdBQVcsRUFBRSxVQURjO0FBRTNCQyxNQUFBQSxPQUFPLEVBQUU7QUFDTEMsUUFBQUEsSUFBSSxFQUFFLE9BREQ7QUFFTEMsUUFBQUEsS0FBSyxFQUFFO0FBRkYsT0FGa0I7QUFNM0JDLE1BQUFBLFFBQVEsRUFBRTtBQUNOQyxRQUFBQSxpQkFBaUIsRUFBRVAsUUFEYjtBQUVOUSxRQUFBQSxRQUFRLEVBQUU7QUFGSjtBQU5pQixLQUFELEVBVTNCO0FBQ0NDLE1BQUFBLE1BQU0sRUFBRTtBQUNKQyxRQUFBQSxJQURJLGdCQUNDQyxHQURELEVBQ007QUFDTkMsVUFBQUEsT0FBTyxDQUFDbkIsR0FBUixDQUFZLE9BQVosRUFBcUJrQixHQUFyQjtBQUNILFNBSEc7QUFJSkUsUUFBQUEsS0FKSSxpQkFJRUYsR0FKRixFQUlPO0FBQ1BDLFVBQUFBLE9BQU8sQ0FBQ25CLEdBQVIsQ0FBWSxPQUFaLEVBQXFCa0IsR0FBckI7QUFDSDtBQU5HO0FBRFQsS0FWMkIsQ0FBOUI7QUFvQkg7Ozs7K0JBRVVHLEcsRUFBZTtBQUN0QixVQUFJQyxPQUFKLEVBQWFDLE9BQWI7O0FBQ0EsVUFBSUYsR0FBRyxDQUFDRyxPQUFSLEVBQWlCO0FBQ2JGLFFBQUFBLE9BQU8sR0FBR0QsR0FBRyxDQUFDRyxPQUFkO0FBQ0FELFFBQUFBLE9BQU8sR0FBR3pCLGVBQVY7QUFDSCxPQUhELE1BR087QUFDSHdCLFFBQUFBLE9BQU8sR0FBR0QsR0FBRyxDQUFDSSxPQUFkO0FBQ0FGLFFBQUFBLE9BQU8sR0FBR0csMEJBQVY7QUFDSDs7QUFDRCxhQUFPLEtBQUtsQixNQUFMLEdBQ0g7QUFDSW1CLFFBQUFBLFVBQVUsRUFBRSxLQUFLbkIsTUFBTCxDQUFZb0IsT0FBWixDQUFvQkwsT0FBcEIsRUFBNkJELE9BQTdCO0FBRGhCLE9BREcsR0FJRCxFQUpOO0FBS0g7Ozs7OztvREFFZUcsTyxFQUFjSSxJOzs7Ozs7QUFDcEJyQixnQkFBQUEsTSxHQUFTLEtBQUtBLE07O29CQUNmQSxNOzs7OztpREFDTVQsVzs7Ozt1QkFFb0JTLE1BQU0sQ0FBQ3NCLFNBQVAsQ0FBaUJELElBQWpCLEVBQXVCO0FBQ2xERSxrQkFBQUEsT0FBTyxFQUFFTixPQUFPLENBQUNFO0FBRGlDLGlCQUF2QixDOzs7QUFBekJLLGdCQUFBQSxJOzt1QkFHQUEsSUFBSSxDQUFDQyxNQUFMLENBQVlwQyxJQUFJLENBQUNxQyxTQUFqQixFQUE0QixRQUE1QixDOzs7aURBQ0NGLEk7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztxREFHUVAsTyxFQUFjSSxJLEVBQWNNLEssRUFBZUMsSzs7Ozs7O0FBQ3BENUIsZ0JBQUFBLE0sR0FBUyxLQUFLQSxNOztvQkFDZkEsTTs7Ozs7a0RBQ01ULFc7Ozs7dUJBRW9CUyxNQUFNLENBQUNzQixTQUFQLENBQWlCRCxJQUFqQixFQUF1QjtBQUNsREUsa0JBQUFBLE9BQU8sRUFBRU4sT0FBTyxDQUFDRTtBQURpQyxpQkFBdkIsQzs7O0FBQXpCSyxnQkFBQUEsSTs7dUJBR0FBLElBQUksQ0FBQ0MsTUFBTCxDQUFZcEMsSUFBSSxDQUFDcUMsU0FBakIsRUFBNEIsUUFBNUIsQzs7Ozt1QkFDQUYsSUFBSSxDQUFDaEMsR0FBTCxDQUFTO0FBQ1htQyxrQkFBQUEsS0FBSyxFQUFMQSxLQURXO0FBRVhDLGtCQUFBQSxLQUFLLEVBQUxBO0FBRlcsaUJBQVQsQzs7O2tEQUlDSixJIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQGZsb3dcblxuaW1wb3J0IHR5cGUgeyBRQ29uZmlnIH0gZnJvbSBcIi4vY29uZmlnXCI7XG5pbXBvcnQgeyBGT1JNQVRfQklOQVJZIH0gZnJvbSBcIm9wZW50cmFjaW5nXCI7XG5cbmNvbnN0IGluaXRKYWVnZXJUcmFjZXIgPSByZXF1aXJlKCdqYWVnZXItY2xpZW50JykuaW5pdFRyYWNlckZyb21FbnY7XG5jb25zdCB7IFRhZ3MsIEZPUk1BVF9URVhUX01BUCB9ID0gcmVxdWlyZSgnb3BlbnRyYWNpbmcnKTtcblxuXG5leHBvcnQgaW50ZXJmYWNlIFRyYWNlclNwYW4ge1xuICAgIGxvZyhvcHRpb25zOiB7IGV2ZW50OiBzdHJpbmcsIHZhbHVlOiBhbnkgfSk6IFByb21pc2U8dm9pZD4sXG5cbiAgICBmaW5pc2goKTogUHJvbWlzZTx2b2lkPlxufVxuXG5pbnRlcmZhY2UgSmFlZ2VyU3BhbiBleHRlbmRzIFRyYWNlclNwYW4ge1xuICAgIHNldFRhZyhuYW1lOiBzdHJpbmcsIHZhbHVlOiBhbnkpOiBQcm9taXNlPHZvaWQ+LFxufVxuXG5pbnRlcmZhY2UgSmFlZ2VyVHJhY2VyIHtcbiAgICBleHRyYWN0KGtleTogc3RyaW5nLCBoZWFkZXJzOiB7IFtzdHJpbmddOiBhbnkgfSk6IGFueSxcblxuICAgIHN0YXJ0U3BhbihuYW1lOiBzdHJpbmcsIG9wdGlvbnM6IHtcbiAgICAgICAgY2hpbGRPZjogYW55LFxuICAgIH0pOiBQcm9taXNlPEphZWdlclNwYW4+XG59XG5cbmNvbnN0IG1pc3NpbmdTcGFuOiBUcmFjZXJTcGFuID0ge1xuICAgIGxvZyhfb3B0aW9uczogeyBldmVudDogc3RyaW5nLCB2YWx1ZTogYW55IH0pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgIH0sXG4gICAgZmluaXNoKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfVxufTtcblxuZXhwb3J0IGNsYXNzIFRyYWNlciB7XG4gICAgamFlZ2VyOiA/SmFlZ2VyVHJhY2VyO1xuXG4gICAgY29uc3RydWN0b3IoY29uZmlnOiBRQ29uZmlnKSB7XG4gICAgICAgIGNvbnN0IGVuZHBvaW50ID0gY29uZmlnLmphZWdlci5lbmRwb2ludDtcbiAgICAgICAgaWYgKCFlbmRwb2ludCkge1xuICAgICAgICAgICAgdGhpcy5qYWVnZXIgPSBudWxsO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuamFlZ2VyID0gaW5pdEphZWdlclRyYWNlcih7XG4gICAgICAgICAgICBzZXJ2aWNlTmFtZTogJ1EgU2VydmVyJyxcbiAgICAgICAgICAgIHNhbXBsZXI6IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnY29uc3QnLFxuICAgICAgICAgICAgICAgIHBhcmFtOiAxLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlcG9ydGVyOiB7XG4gICAgICAgICAgICAgICAgY29sbGVjdG9yRW5kcG9pbnQ6IGVuZHBvaW50LFxuICAgICAgICAgICAgICAgIGxvZ1NwYW5zOiB0cnVlLFxuICAgICAgICAgICAgfVxuICAgICAgICB9LCB7XG4gICAgICAgICAgICBsb2dnZXI6IHtcbiAgICAgICAgICAgICAgICBpbmZvKG1zZykge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnSU5GTyAnLCBtc2cpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZXJyb3IobXNnKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdFUlJPUicsIG1zZyk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGdldENvbnRleHQocmVxOiBhbnkpOiBhbnkge1xuICAgICAgICBsZXQgY3R4X3NyYywgY3R4X2ZybTtcbiAgICAgICAgaWYgKHJlcS5oZWFkZXJzKSB7XG4gICAgICAgICAgICBjdHhfc3JjID0gcmVxLmhlYWRlcnM7XG4gICAgICAgICAgICBjdHhfZnJtID0gRk9STUFUX1RFWFRfTUFQO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY3R4X3NyYyA9IHJlcS5jb250ZXh0O1xuICAgICAgICAgICAgY3R4X2ZybSA9IEZPUk1BVF9CSU5BUlk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuamFlZ2VyID9cbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0cmFjZXJfY3R4OiB0aGlzLmphZWdlci5leHRyYWN0KGN0eF9mcm0sIGN0eF9zcmMpLFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgOiB7fVxuICAgIH1cblxuICAgIGFzeW5jIHN0YXJ0U3Bhbihjb250ZXh0OiBhbnksIG5hbWU6IHN0cmluZyk6IFByb21pc2U8VHJhY2VyU3Bhbj4ge1xuICAgICAgICBjb25zdCBqYWVnZXIgPSB0aGlzLmphZWdlcjtcbiAgICAgICAgaWYgKCFqYWVnZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBtaXNzaW5nU3BhbjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzcGFuOiBKYWVnZXJTcGFuID0gYXdhaXQgamFlZ2VyLnN0YXJ0U3BhbihuYW1lLCB7XG4gICAgICAgICAgICBjaGlsZE9mOiBjb250ZXh0LnRyYWNlcl9jdHgsXG4gICAgICAgIH0pO1xuICAgICAgICBhd2FpdCBzcGFuLnNldFRhZyhUYWdzLlNQQU5fS0lORCwgJ3NlcnZlcicpO1xuICAgICAgICByZXR1cm4gc3BhbjtcbiAgICB9XG5cbiAgICBhc3luYyBzdGFydFNwYW5Mb2coY29udGV4dDogYW55LCBuYW1lOiBzdHJpbmcsIGV2ZW50OiBzdHJpbmcsIHZhbHVlOiBhbnkpOiBQcm9taXNlPFRyYWNlclNwYW4+IHtcbiAgICAgICAgY29uc3QgamFlZ2VyID0gdGhpcy5qYWVnZXI7XG4gICAgICAgIGlmICghamFlZ2VyKSB7XG4gICAgICAgICAgICByZXR1cm4gbWlzc2luZ1NwYW47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgc3BhbjogSmFlZ2VyU3BhbiA9IGF3YWl0IGphZWdlci5zdGFydFNwYW4obmFtZSwge1xuICAgICAgICAgICAgY2hpbGRPZjogY29udGV4dC50cmFjZXJfY3R4LFxuICAgICAgICB9KTtcbiAgICAgICAgYXdhaXQgc3Bhbi5zZXRUYWcoVGFncy5TUEFOX0tJTkQsICdzZXJ2ZXInKTtcbiAgICAgICAgYXdhaXQgc3Bhbi5sb2coe1xuICAgICAgICAgICAgZXZlbnQsXG4gICAgICAgICAgICB2YWx1ZSxcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBzcGFuO1xuICAgIH1cblxufVxuIl19