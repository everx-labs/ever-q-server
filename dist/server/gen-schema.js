"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _dbSchema = _interopRequireDefault(require("./db.schema.js"));

var _genQlJs = _interopRequireDefault(require("ton-labs-dev-ops/dist/src/ton-server/gen-ql-js"));

var _gen = (0, _genQlJs["default"])(_dbSchema["default"]),
    ql = _gen.ql,
    js = _gen.js;

var fs = require('fs');

fs.writeFileSync('./server/type-defs.graphql', ql);
fs.writeFileSync('./server/arango-resolvers.js', js);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9nZW4tc2NoZW1hLmpzIl0sIm5hbWVzIjpbInNjaGVtYURlZiIsInFsIiwianMiLCJmcyIsInJlcXVpcmUiLCJ3cml0ZUZpbGVTeW5jIl0sIm1hcHBpbmdzIjoiOzs7O0FBQUE7O0FBQ0E7O1dBRW1CLHlCQUFJQSxvQkFBSixDO0lBQVhDLEUsUUFBQUEsRTtJQUFJQyxFLFFBQUFBLEU7O0FBRVosSUFBTUMsRUFBRSxHQUFHQyxPQUFPLENBQUMsSUFBRCxDQUFsQjs7QUFFQUQsRUFBRSxDQUFDRSxhQUFILENBQWlCLDRCQUFqQixFQUErQ0osRUFBL0M7QUFDQUUsRUFBRSxDQUFDRSxhQUFILENBQWlCLDhCQUFqQixFQUFpREgsRUFBakQiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgc2NoZW1hRGVmIGZyb20gJy4vZGIuc2NoZW1hLmpzJztcbmltcG9ydCBnZW4gZnJvbSAndG9uLWxhYnMtZGV2LW9wcy9kaXN0L3NyYy90b24tc2VydmVyL2dlbi1xbC1qcyc7XG5cbmNvbnN0IHsgcWwsIGpzIH0gPSBnZW4oc2NoZW1hRGVmKTtcblxuY29uc3QgZnMgPSByZXF1aXJlKCdmcycpO1xuXG5mcy53cml0ZUZpbGVTeW5jKCcuL3NlcnZlci90eXBlLWRlZnMuZ3JhcGhxbCcsIHFsKTtcbmZzLndyaXRlRmlsZVN5bmMoJy4vc2VydmVyL2FyYW5nby1yZXNvbHZlcnMuanMnLCBqcyk7XG4iXX0=