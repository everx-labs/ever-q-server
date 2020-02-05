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