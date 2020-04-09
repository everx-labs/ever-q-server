# Release Notes
All notable changes to this project will be documented in this file.

## 0.24.8 – Apr 9, 2020
### Featured
### New
- supported new type of outbound message `dequeueShort` (msg_type: 7): added fields `msg_env_hash`, `next_workchain`, `next_addr_pfx`, `import_block_lt` to `OutMsg` type.

## 0.24.7 – Apr 8, 2020
### Featured
StatsD support

### New
- `--statsd-server` parameter (`Q_STATSD_SERVER` env) config option to specify StatsD server address
- `qserver.doc.count`, `qserver.query.count`, `qserver.query.time`, `qserver.query.active` statsd metrics  

## 0.24.6 – Apr 5, 2020
### Featured
Stability fixes

### Fixed
- slow queries detector use filter and orderBy analysis
- fixed string format for big numbers
- change arangochair dependency to forked version (cause of dropped original repository)
- type of `total_weight` and `weight` fixed to `u64` 

## 0.24.5 – Mar 27, 2020
### Featured
Stability fixes

### New
- `operationId` parameter to query methods
- `finishOperations` mutation

### Fixed
- inactive listeners were reduced with help of operation ids
- subscriptions with arrays crash

## 0.24.4 – Mar 20, 2020
### Featured
Scheme enhancements
Security fixes

### New
- all big number fields can be optionally parametrized with `format` argument `HEX` (default) or `DEC`.
- `Message` contains new joined fields `src_transaction` (from where this message was originated) and `dst_transaction` (where this message was handled).  
- `--mam-access-keys` and `MAM_ACCESS_KEYS` config to protect mam endpoint.
- all queries and mutations inside single GraphQL request must use the same access key.

### Fixed
- change type of `transaction_id` to string
- `auth` parameter of subscription changed to `accessKey`
- invalid `accessKey` treated by subscribe as a valid key
- all internal errors are logged as is but converted to `Service temporary unavailable` before sending to client
- server side stack traces are truncated before sending to client
- waitFor 2 minute limit timeout has been removed  

## 0.24.3 – Mar 2, 2020
### Featured
Stability fixes

### New
- `min_shard_gen_utime` and `max_shard_gen_utime` fields in `block.master`

### Fixed
- joined objects returned as `null` if joined object inserted in DB later than parent object.   

## 0.24.2 – Feb 19, 2020
### Featured
Ability to set restrictions to accounts for particular access keys

### New
- `accessKey` optional header used instead of `authorization`.
- keys passed to `registerAccessKeys` as structures (instead of strings) and include `restrictToAccounts` optional field

### Fixed
- message & transaction ids in `out_msg_descr`

## 0.24.1 – Feb 11, 2020

### New
- `--trace-service` (or `Q_TRACE_SERVICE` env) specify service name that will be used in jaeger. 
- `--trace-tags` (or `Q_TRACE_TAGS` env) specify additional tags associated with a spans. 

## 0.24.0 - Feb 10, 2020
### Featured
- Auth support

### New
- `--auth-endpoint` (or `AUTH_ENDPOINT` env) config option. Specify address of auth service.
- `authorization` optional header added to specify access token.
- `accessKey` optional parameter added to all GraphQL queries to specify access token in GraphQL playground.
- `getManagementAccessKey` query one time management access key.
- `registerAccessKeys` mutation to register account's access keys. 
- `revokeAccessKeys` mutation to revoke account's access keys. 

## 0.23.0 - Feb 5, 2020

### New
- OpenTracing (jaeger) support
- workchain_id field added alongside with account address to `accounts.workchain_id`, `transactions.workchain_id`, `messages.src_workchain_id`, `messages.dst_workchain_id`
- field `prev_key_block_seqno` into `blocks` collection

## 0.22.0 - January 22, 2020

### New
- Support for redirecting slow queries to alternative db connection.
- In scalar operations `undefined` (or missing) value is treated as `null`.

### Fixed
- Skip execution of queries with `false` filter.
