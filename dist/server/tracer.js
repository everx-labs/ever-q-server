"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

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

var express = _interopRequireWildcard(require("express"));

var initJaegerTracer = require('jaeger-client').initTracerFromEnv;

var _require = require('opentracing'),
    Tags = _require.Tags,
    FORMAT_TEXT_MAP = _require.FORMAT_TEXT_MAP;

var missingSpan = {
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
      return this.jaeger ? {
        tracer: this.jaeger.extract(FORMAT_TEXT_MAP, req.headers)
      } : {};
    }
  }, {
    key: "startSpanLog",
    value: function () {
      var _startSpanLog = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee(context, name, event, value) {
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
                  childOf: context.tracer
                });

              case 5:
                span = _context.sent;
                _context.next = 8;
                return span.setTag(Tags.SPAN_KIND, 'server');

              case 8:
                _context.next = 10;
                return span.log({
                  event: event,
                  value: value
                });

              case 10:
                return _context.abrupt("return", span);

              case 11:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function startSpanLog(_x, _x2, _x3, _x4) {
        return _startSpanLog.apply(this, arguments);
      }

      return startSpanLog;
    }()
  }]);
  return Tracer;
}();

exports.Tracer = Tracer;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci90cmFjZXIuanMiXSwibmFtZXMiOlsiaW5pdEphZWdlclRyYWNlciIsInJlcXVpcmUiLCJpbml0VHJhY2VyRnJvbUVudiIsIlRhZ3MiLCJGT1JNQVRfVEVYVF9NQVAiLCJtaXNzaW5nU3BhbiIsImZpbmlzaCIsIlByb21pc2UiLCJyZXNvbHZlIiwiVHJhY2VyIiwiY29uZmlnIiwiZW5kcG9pbnQiLCJqYWVnZXIiLCJzZXJ2aWNlTmFtZSIsInNhbXBsZXIiLCJ0eXBlIiwicGFyYW0iLCJyZXBvcnRlciIsImNvbGxlY3RvckVuZHBvaW50IiwibG9nU3BhbnMiLCJsb2dnZXIiLCJpbmZvIiwibXNnIiwiY29uc29sZSIsImxvZyIsImVycm9yIiwicmVxIiwidHJhY2VyIiwiZXh0cmFjdCIsImhlYWRlcnMiLCJjb250ZXh0IiwibmFtZSIsImV2ZW50IiwidmFsdWUiLCJzdGFydFNwYW4iLCJjaGlsZE9mIiwic3BhbiIsInNldFRhZyIsIlNQQU5fS0lORCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUE7O0FBR0EsSUFBTUEsZ0JBQWdCLEdBQUdDLE9BQU8sQ0FBQyxlQUFELENBQVAsQ0FBeUJDLGlCQUFsRDs7ZUFDa0NELE9BQU8sQ0FBQyxhQUFELEM7SUFBakNFLEksWUFBQUEsSTtJQUFNQyxlLFlBQUFBLGU7O0FBcUJkLElBQU1DLFdBQXVCLEdBQUc7QUFDNUJDLEVBQUFBLE1BRDRCLG9CQUNKO0FBQ3BCLFdBQU9DLE9BQU8sQ0FBQ0MsT0FBUixFQUFQO0FBQ0g7QUFIMkIsQ0FBaEM7O0lBTWFDLE07OztBQUdULGtCQUFZQyxNQUFaLEVBQTZCO0FBQUE7QUFBQTtBQUN6QixRQUFNQyxRQUFRLEdBQUdELE1BQU0sQ0FBQ0UsTUFBUCxDQUFjRCxRQUEvQjs7QUFDQSxRQUFJLENBQUNBLFFBQUwsRUFBZTtBQUNYLFdBQUtDLE1BQUwsR0FBYyxJQUFkO0FBQ0E7QUFDSDs7QUFDRCxTQUFLQSxNQUFMLEdBQWNaLGdCQUFnQixDQUFDO0FBQzNCYSxNQUFBQSxXQUFXLEVBQUUsVUFEYztBQUUzQkMsTUFBQUEsT0FBTyxFQUFFO0FBQ0xDLFFBQUFBLElBQUksRUFBRSxPQUREO0FBRUxDLFFBQUFBLEtBQUssRUFBRTtBQUZGLE9BRmtCO0FBTTNCQyxNQUFBQSxRQUFRLEVBQUU7QUFDTkMsUUFBQUEsaUJBQWlCLEVBQUVQLFFBRGI7QUFFTlEsUUFBQUEsUUFBUSxFQUFFO0FBRko7QUFOaUIsS0FBRCxFQVUzQjtBQUNDQyxNQUFBQSxNQUFNLEVBQUU7QUFDSkMsUUFBQUEsSUFESSxnQkFDQ0MsR0FERCxFQUNNO0FBQ05DLFVBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLE9BQVosRUFBcUJGLEdBQXJCO0FBQ0gsU0FIRztBQUlKRyxRQUFBQSxLQUpJLGlCQUlFSCxHQUpGLEVBSU87QUFDUEMsVUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVksT0FBWixFQUFxQkYsR0FBckI7QUFDSDtBQU5HO0FBRFQsS0FWMkIsQ0FBOUI7QUFvQkg7Ozs7K0JBRVVJLEcsRUFBMkI7QUFDbEMsYUFBTyxLQUFLZCxNQUFMLEdBQ0Q7QUFDRWUsUUFBQUEsTUFBTSxFQUFFLEtBQUtmLE1BQUwsQ0FBWWdCLE9BQVosQ0FBb0J4QixlQUFwQixFQUFxQ3NCLEdBQUcsQ0FBQ0csT0FBekM7QUFEVixPQURDLEdBSUQsRUFKTjtBQUtIOzs7Ozs7b0RBRWtCQyxPLEVBQWNDLEksRUFBY0MsSyxFQUFlQyxLOzs7Ozs7QUFDcERyQixnQkFBQUEsTSxHQUFTLEtBQUtBLE07O29CQUNmQSxNOzs7OztpREFDTVAsVzs7Ozt1QkFFb0JPLE1BQU0sQ0FBQ3NCLFNBQVAsQ0FBaUJILElBQWpCLEVBQXVCO0FBQ2xESSxrQkFBQUEsT0FBTyxFQUFFTCxPQUFPLENBQUNIO0FBRGlDLGlCQUF2QixDOzs7QUFBekJTLGdCQUFBQSxJOzt1QkFHQUEsSUFBSSxDQUFDQyxNQUFMLENBQVlsQyxJQUFJLENBQUNtQyxTQUFqQixFQUE0QixRQUE1QixDOzs7O3VCQUNBRixJQUFJLENBQUNaLEdBQUwsQ0FBUztBQUNYUSxrQkFBQUEsS0FBSyxFQUFMQSxLQURXO0FBRVhDLGtCQUFBQSxLQUFLLEVBQUxBO0FBRlcsaUJBQVQsQzs7O2lEQUlDRyxJIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQGZsb3dcblxuaW1wb3J0ICogYXMgZXhwcmVzcyBmcm9tIFwiZXhwcmVzc1wiO1xuaW1wb3J0IHR5cGUgeyBRQ29uZmlnIH0gZnJvbSBcIi4vY29uZmlnXCI7XG5cbmNvbnN0IGluaXRKYWVnZXJUcmFjZXIgPSByZXF1aXJlKCdqYWVnZXItY2xpZW50JykuaW5pdFRyYWNlckZyb21FbnY7XG5jb25zdCB7IFRhZ3MsIEZPUk1BVF9URVhUX01BUCB9ID0gcmVxdWlyZSgnb3BlbnRyYWNpbmcnKTtcblxuXG5leHBvcnQgaW50ZXJmYWNlIFRyYWNlclNwYW4ge1xuICAgIGZpbmlzaCgpOiBQcm9taXNlPHZvaWQ+XG59XG5cbmludGVyZmFjZSBKYWVnZXJTcGFuIGV4dGVuZHMgVHJhY2VyU3BhbiB7XG4gICAgc2V0VGFnKG5hbWU6IHN0cmluZywgdmFsdWU6IGFueSk6IFByb21pc2U8dm9pZD4sXG5cbiAgICBsb2cob3B0aW9uczogeyBldmVudDogc3RyaW5nLCB2YWx1ZTogYW55IH0pOiBQcm9taXNlPHZvaWQ+LFxufVxuXG5pbnRlcmZhY2UgSmFlZ2VyVHJhY2VyIHtcbiAgICBleHRyYWN0KGtleTogc3RyaW5nLCBoZWFkZXJzOiB7IFtzdHJpbmddOiBhbnkgfSk6IGFueSxcblxuICAgIHN0YXJ0U3BhbihuYW1lOiBzdHJpbmcsIG9wdGlvbnM6IHtcbiAgICAgICAgY2hpbGRPZjogYW55LFxuICAgIH0pOiBQcm9taXNlPEphZWdlclNwYW4+XG59XG5cbmNvbnN0IG1pc3NpbmdTcGFuOiBUcmFjZXJTcGFuID0ge1xuICAgIGZpbmlzaCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgIH1cbn07XG5cbmV4cG9ydCBjbGFzcyBUcmFjZXIge1xuICAgIGphZWdlcjogP0phZWdlclRyYWNlcjtcblxuICAgIGNvbnN0cnVjdG9yKGNvbmZpZzogUUNvbmZpZykge1xuICAgICAgICBjb25zdCBlbmRwb2ludCA9IGNvbmZpZy5qYWVnZXIuZW5kcG9pbnQ7XG4gICAgICAgIGlmICghZW5kcG9pbnQpIHtcbiAgICAgICAgICAgIHRoaXMuamFlZ2VyID0gbnVsbDtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmphZWdlciA9IGluaXRKYWVnZXJUcmFjZXIoe1xuICAgICAgICAgICAgc2VydmljZU5hbWU6ICdRIFNlcnZlcicsXG4gICAgICAgICAgICBzYW1wbGVyOiB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ2NvbnN0JyxcbiAgICAgICAgICAgICAgICBwYXJhbTogMSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZXBvcnRlcjoge1xuICAgICAgICAgICAgICAgIGNvbGxlY3RvckVuZHBvaW50OiBlbmRwb2ludCxcbiAgICAgICAgICAgICAgICBsb2dTcGFuczogdHJ1ZSxcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwge1xuICAgICAgICAgICAgbG9nZ2VyOiB7XG4gICAgICAgICAgICAgICAgaW5mbyhtc2cpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0lORk8gJywgbXNnKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGVycm9yKG1zZykge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnRVJST1InLCBtc2cpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBnZXRDb250ZXh0KHJlcTogZXhwcmVzcy5SZXF1ZXN0KTogYW55IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuamFlZ2VyXG4gICAgICAgICAgICA/IHtcbiAgICAgICAgICAgICAgICB0cmFjZXI6IHRoaXMuamFlZ2VyLmV4dHJhY3QoRk9STUFUX1RFWFRfTUFQLCByZXEuaGVhZGVycyksXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICA6IHt9XG4gICAgfVxuXG4gICAgYXN5bmMgc3RhcnRTcGFuTG9nKGNvbnRleHQ6IGFueSwgbmFtZTogc3RyaW5nLCBldmVudDogc3RyaW5nLCB2YWx1ZTogYW55KTogUHJvbWlzZTxUcmFjZXJTcGFuPiB7XG4gICAgICAgIGNvbnN0IGphZWdlciA9IHRoaXMuamFlZ2VyO1xuICAgICAgICBpZiAoIWphZWdlcikge1xuICAgICAgICAgICAgcmV0dXJuIG1pc3NpbmdTcGFuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHNwYW46IEphZWdlclNwYW4gPSBhd2FpdCBqYWVnZXIuc3RhcnRTcGFuKG5hbWUsIHtcbiAgICAgICAgICAgIGNoaWxkT2Y6IGNvbnRleHQudHJhY2VyLFxuICAgICAgICB9KTtcbiAgICAgICAgYXdhaXQgc3Bhbi5zZXRUYWcoVGFncy5TUEFOX0tJTkQsICdzZXJ2ZXInKTtcbiAgICAgICAgYXdhaXQgc3Bhbi5sb2coe1xuICAgICAgICAgICAgZXZlbnQsXG4gICAgICAgICAgICB2YWx1ZSxcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBzcGFuO1xuICAgIH1cbn1cbiJdfQ==