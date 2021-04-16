"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.counterpartiesResolvers = counterpartiesResolvers;
exports.Counterparty = void 0;

var _blockchain = _interopRequireDefault(require("../data/blockchain"));

var _collection = require("../data/collection");

var _filters = require("../filter/filters");

var _tracer = require("../tracer");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//------------------------------------------------------------- Counterparties
const Counterparty = (0, _filters.struct)({
  account: _filters.stringLowerFilter,
  counterparty: _filters.stringLowerFilter,
  last_message_at: _filters.scalar,
  last_message_id: _filters.stringLowerFilter,
  last_message_is_reverse: _filters.scalar,
  last_message_value: _filters.bigUInt2
}, true);
exports.Counterparty = Counterparty;

async function counterparties(_parent, args, context) {
  const tracer = context.tracer;
  return _tracer.QTracer.trace(tracer, 'counterparties', async () => {
    await (0, _collection.requireGrantedAccess)(context, args);
    let text = "FOR doc IN counterparties FILTER doc.account == @account";
    const vars = {
      account: args.account,
      first: Math.min(50, Number.parseInt(args.first || 50))
    };

    if (args.after) {
      const after = args.after.split("/");
      text += " AND (" + "doc.last_message_at < @after_0" + " OR doc.last_message_at == @after_0 AND doc.counterparty < @after_1" + ")";
      vars.after_0 = Number.parseInt(after[0]);
      vars.after_1 = after[1];
    }

    text += " SORT doc.last_message_at DESC, doc.counterparty DESC LIMIT @first RETURN doc";
    const result = await context.data.query(context.data.counterparties.provider, text, vars, [{
      path: "last_message_at,counterparty",
      direction: "DESC"
    }]);
    result.forEach(x => x.cursor = `${x.last_message_at}/${x.counterparty}`);
    return result;
  }, _tracer.QTracer.getParentSpan(tracer, context));
}

function counterpartiesResolvers(data) {
  return {
    Counterparty: {
      last_message_value(parent, args) {
        return (0, _filters.resolveBigUInt)(2, parent.last_message_value, args);
      }

    },
    Query: {
      counterparties
    },
    Subscription: {
      counterparties: data.counterparties.subscriptionResolver()
    }
  };
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXJ2ZXIvZ3JhcGhxbC9jb3VudGVycGFydGllcy5qcyJdLCJuYW1lcyI6WyJDb3VudGVycGFydHkiLCJhY2NvdW50Iiwic3RyaW5nTG93ZXJGaWx0ZXIiLCJjb3VudGVycGFydHkiLCJsYXN0X21lc3NhZ2VfYXQiLCJzY2FsYXIiLCJsYXN0X21lc3NhZ2VfaWQiLCJsYXN0X21lc3NhZ2VfaXNfcmV2ZXJzZSIsImxhc3RfbWVzc2FnZV92YWx1ZSIsImJpZ1VJbnQyIiwiY291bnRlcnBhcnRpZXMiLCJfcGFyZW50IiwiYXJncyIsImNvbnRleHQiLCJ0cmFjZXIiLCJRVHJhY2VyIiwidHJhY2UiLCJ0ZXh0IiwidmFycyIsImZpcnN0IiwiTWF0aCIsIm1pbiIsIk51bWJlciIsInBhcnNlSW50IiwiYWZ0ZXIiLCJzcGxpdCIsImFmdGVyXzAiLCJhZnRlcl8xIiwicmVzdWx0IiwiZGF0YSIsInF1ZXJ5IiwicHJvdmlkZXIiLCJwYXRoIiwiZGlyZWN0aW9uIiwiZm9yRWFjaCIsIngiLCJjdXJzb3IiLCJnZXRQYXJlbnRTcGFuIiwiY291bnRlcnBhcnRpZXNSZXNvbHZlcnMiLCJwYXJlbnQiLCJRdWVyeSIsIlN1YnNjcmlwdGlvbiIsInN1YnNjcmlwdGlvblJlc29sdmVyIl0sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQUVBOztBQUNBOztBQUNBOztBQUNBOzs7O0FBR0E7QUFFTyxNQUFNQSxZQUFZLEdBQUcscUJBQU87QUFDL0JDLEVBQUFBLE9BQU8sRUFBRUMsMEJBRHNCO0FBRS9CQyxFQUFBQSxZQUFZLEVBQUVELDBCQUZpQjtBQUcvQkUsRUFBQUEsZUFBZSxFQUFFQyxlQUhjO0FBSS9CQyxFQUFBQSxlQUFlLEVBQUVKLDBCQUpjO0FBSy9CSyxFQUFBQSx1QkFBdUIsRUFBRUYsZUFMTTtBQU0vQkcsRUFBQUEsa0JBQWtCLEVBQUVDO0FBTlcsQ0FBUCxFQU96QixJQVB5QixDQUFyQjs7O0FBU1AsZUFBZUMsY0FBZixDQUE4QkMsT0FBOUIsRUFBdUNDLElBQXZDLEVBQTZDQyxPQUE3QyxFQUFrRztBQUM5RixRQUFNQyxNQUFNLEdBQUdELE9BQU8sQ0FBQ0MsTUFBdkI7QUFDQSxTQUFPQyxnQkFBUUMsS0FBUixDQUFjRixNQUFkLEVBQXNCLGdCQUF0QixFQUF3QyxZQUFZO0FBQ3ZELFVBQU0sc0NBQXFCRCxPQUFyQixFQUE4QkQsSUFBOUIsQ0FBTjtBQUNBLFFBQUlLLElBQUksR0FBRywwREFBWDtBQUNBLFVBQU1DLElBQVMsR0FBRztBQUNkakIsTUFBQUEsT0FBTyxFQUFFVyxJQUFJLENBQUNYLE9BREE7QUFFZGtCLE1BQUFBLEtBQUssRUFBRUMsSUFBSSxDQUFDQyxHQUFMLENBQVMsRUFBVCxFQUFhQyxNQUFNLENBQUNDLFFBQVAsQ0FBZ0JYLElBQUksQ0FBQ08sS0FBTCxJQUFjLEVBQTlCLENBQWI7QUFGTyxLQUFsQjs7QUFJQSxRQUFJUCxJQUFJLENBQUNZLEtBQVQsRUFBZ0I7QUFDWixZQUFNQSxLQUFLLEdBQUdaLElBQUksQ0FBQ1ksS0FBTCxDQUFXQyxLQUFYLENBQWlCLEdBQWpCLENBQWQ7QUFDQVIsTUFBQUEsSUFBSSxJQUFJLFdBQ0osZ0NBREksR0FFSixxRUFGSSxHQUdKLEdBSEo7QUFJQUMsTUFBQUEsSUFBSSxDQUFDUSxPQUFMLEdBQWVKLE1BQU0sQ0FBQ0MsUUFBUCxDQUFnQkMsS0FBSyxDQUFDLENBQUQsQ0FBckIsQ0FBZjtBQUNBTixNQUFBQSxJQUFJLENBQUNTLE9BQUwsR0FBZUgsS0FBSyxDQUFDLENBQUQsQ0FBcEI7QUFDSDs7QUFDRFAsSUFBQUEsSUFBSSxJQUFJLCtFQUFSO0FBRUEsVUFBTVcsTUFBVyxHQUFHLE1BQU1mLE9BQU8sQ0FBQ2dCLElBQVIsQ0FBYUMsS0FBYixDQUN0QmpCLE9BQU8sQ0FBQ2dCLElBQVIsQ0FBYW5CLGNBQWIsQ0FBNEJxQixRQUROLEVBRXRCZCxJQUZzQixFQUd0QkMsSUFIc0IsRUFJdEIsQ0FBQztBQUFFYyxNQUFBQSxJQUFJLEVBQUUsOEJBQVI7QUFBd0NDLE1BQUFBLFNBQVMsRUFBRTtBQUFuRCxLQUFELENBSnNCLENBQTFCO0FBTUFMLElBQUFBLE1BQU0sQ0FBQ00sT0FBUCxDQUFlQyxDQUFDLElBQUlBLENBQUMsQ0FBQ0MsTUFBRixHQUFZLEdBQUVELENBQUMsQ0FBQy9CLGVBQWdCLElBQUcrQixDQUFDLENBQUNoQyxZQUFhLEVBQXRFO0FBQ0EsV0FBT3lCLE1BQVA7QUFDSCxHQTFCTSxFQTBCSmIsZ0JBQVFzQixhQUFSLENBQXNCdkIsTUFBdEIsRUFBOEJELE9BQTlCLENBMUJJLENBQVA7QUEyQkg7O0FBRU0sU0FBU3lCLHVCQUFULENBQWlDVCxJQUFqQyxFQUE2RDtBQUNoRSxTQUFPO0FBQ0g3QixJQUFBQSxZQUFZLEVBQUU7QUFDVlEsTUFBQUEsa0JBQWtCLENBQUMrQixNQUFELEVBQVMzQixJQUFULEVBQWU7QUFDN0IsZUFBTyw2QkFBZSxDQUFmLEVBQWtCMkIsTUFBTSxDQUFDL0Isa0JBQXpCLEVBQTZDSSxJQUE3QyxDQUFQO0FBQ0g7O0FBSFMsS0FEWDtBQU1INEIsSUFBQUEsS0FBSyxFQUFFO0FBQ0g5QixNQUFBQTtBQURHLEtBTko7QUFTSCtCLElBQUFBLFlBQVksRUFBRTtBQUNWL0IsTUFBQUEsY0FBYyxFQUFFbUIsSUFBSSxDQUFDbkIsY0FBTCxDQUFvQmdDLG9CQUFwQjtBQUROO0FBVFgsR0FBUDtBQWFIIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQGZsb3dcblxuaW1wb3J0IFFCbG9ja2NoYWluRGF0YSBmcm9tICcuLi9kYXRhL2Jsb2NrY2hhaW4nO1xuaW1wb3J0IHsgcmVxdWlyZUdyYW50ZWRBY2Nlc3MgfSBmcm9tICcuLi9kYXRhL2NvbGxlY3Rpb24nO1xuaW1wb3J0IHsgYmlnVUludDIsIHJlc29sdmVCaWdVSW50LCBzdHJpbmdMb3dlckZpbHRlciwgc3RydWN0LCBzY2FsYXIgfSBmcm9tIFwiLi4vZmlsdGVyL2ZpbHRlcnNcIjtcbmltcG9ydCB7IFFUcmFjZXIgfSBmcm9tICcuLi90cmFjZXInO1xuaW1wb3J0IHR5cGUgeyBHcmFwaFFMUmVxdWVzdENvbnRleHRFeCB9IGZyb20gXCIuL2NvbnRleHRcIjtcblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIENvdW50ZXJwYXJ0aWVzXG5cbmV4cG9ydCBjb25zdCBDb3VudGVycGFydHkgPSBzdHJ1Y3Qoe1xuICAgIGFjY291bnQ6IHN0cmluZ0xvd2VyRmlsdGVyLFxuICAgIGNvdW50ZXJwYXJ0eTogc3RyaW5nTG93ZXJGaWx0ZXIsXG4gICAgbGFzdF9tZXNzYWdlX2F0OiBzY2FsYXIsXG4gICAgbGFzdF9tZXNzYWdlX2lkOiBzdHJpbmdMb3dlckZpbHRlcixcbiAgICBsYXN0X21lc3NhZ2VfaXNfcmV2ZXJzZTogc2NhbGFyLFxuICAgIGxhc3RfbWVzc2FnZV92YWx1ZTogYmlnVUludDIsXG59LCB0cnVlKTtcblxuYXN5bmMgZnVuY3Rpb24gY291bnRlcnBhcnRpZXMoX3BhcmVudCwgYXJncywgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0RXgpOiBQcm9taXNlPE9iamVjdFtdPiB7XG4gICAgY29uc3QgdHJhY2VyID0gY29udGV4dC50cmFjZXI7XG4gICAgcmV0dXJuIFFUcmFjZXIudHJhY2UodHJhY2VyLCAnY291bnRlcnBhcnRpZXMnLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGF3YWl0IHJlcXVpcmVHcmFudGVkQWNjZXNzKGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICBsZXQgdGV4dCA9IFwiRk9SIGRvYyBJTiBjb3VudGVycGFydGllcyBGSUxURVIgZG9jLmFjY291bnQgPT0gQGFjY291bnRcIjtcbiAgICAgICAgY29uc3QgdmFyczogYW55ID0ge1xuICAgICAgICAgICAgYWNjb3VudDogYXJncy5hY2NvdW50LFxuICAgICAgICAgICAgZmlyc3Q6IE1hdGgubWluKDUwLCBOdW1iZXIucGFyc2VJbnQoYXJncy5maXJzdCB8fCA1MCkpLFxuICAgICAgICB9O1xuICAgICAgICBpZiAoYXJncy5hZnRlcikge1xuICAgICAgICAgICAgY29uc3QgYWZ0ZXIgPSBhcmdzLmFmdGVyLnNwbGl0KFwiL1wiKTtcbiAgICAgICAgICAgIHRleHQgKz0gXCIgQU5EIChcIiArXG4gICAgICAgICAgICAgICAgXCJkb2MubGFzdF9tZXNzYWdlX2F0IDwgQGFmdGVyXzBcIiArXG4gICAgICAgICAgICAgICAgXCIgT1IgZG9jLmxhc3RfbWVzc2FnZV9hdCA9PSBAYWZ0ZXJfMCBBTkQgZG9jLmNvdW50ZXJwYXJ0eSA8IEBhZnRlcl8xXCIgK1xuICAgICAgICAgICAgICAgIFwiKVwiO1xuICAgICAgICAgICAgdmFycy5hZnRlcl8wID0gTnVtYmVyLnBhcnNlSW50KGFmdGVyWzBdKTtcbiAgICAgICAgICAgIHZhcnMuYWZ0ZXJfMSA9IGFmdGVyWzFdO1xuICAgICAgICB9XG4gICAgICAgIHRleHQgKz0gXCIgU09SVCBkb2MubGFzdF9tZXNzYWdlX2F0IERFU0MsIGRvYy5jb3VudGVycGFydHkgREVTQyBMSU1JVCBAZmlyc3QgUkVUVVJOIGRvY1wiO1xuXG4gICAgICAgIGNvbnN0IHJlc3VsdDogYW55ID0gYXdhaXQgY29udGV4dC5kYXRhLnF1ZXJ5KFxuICAgICAgICAgICAgY29udGV4dC5kYXRhLmNvdW50ZXJwYXJ0aWVzLnByb3ZpZGVyLFxuICAgICAgICAgICAgdGV4dCxcbiAgICAgICAgICAgIHZhcnMsXG4gICAgICAgICAgICBbeyBwYXRoOiBcImxhc3RfbWVzc2FnZV9hdCxjb3VudGVycGFydHlcIiwgZGlyZWN0aW9uOiBcIkRFU0NcIiB9XSxcbiAgICAgICAgKTtcbiAgICAgICAgcmVzdWx0LmZvckVhY2goeCA9PiB4LmN1cnNvciA9IGAke3gubGFzdF9tZXNzYWdlX2F0fS8ke3guY291bnRlcnBhcnR5fWApXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSwgUVRyYWNlci5nZXRQYXJlbnRTcGFuKHRyYWNlciwgY29udGV4dCkpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb3VudGVycGFydGllc1Jlc29sdmVycyhkYXRhOiBRQmxvY2tjaGFpbkRhdGEpOiBhbnkge1xuICAgIHJldHVybiB7XG4gICAgICAgIENvdW50ZXJwYXJ0eToge1xuICAgICAgICAgICAgbGFzdF9tZXNzYWdlX3ZhbHVlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQubGFzdF9tZXNzYWdlX3ZhbHVlLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFF1ZXJ5OiB7XG4gICAgICAgICAgICBjb3VudGVycGFydGllcyxcbiAgICAgICAgfSxcbiAgICAgICAgU3Vic2NyaXB0aW9uOiB7XG4gICAgICAgICAgICBjb3VudGVycGFydGllczogZGF0YS5jb3VudGVycGFydGllcy5zdWJzY3JpcHRpb25SZXNvbHZlcigpLFxuICAgICAgICB9XG4gICAgfTtcbn1cbiJdfQ==